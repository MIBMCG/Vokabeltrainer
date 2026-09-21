import {ProductError} from '../model/errors.js';
import {productStateHash} from '../commands.js';
import {packBasis} from './basis.js';
import {readHistory} from './history.js';
import {purchaseOffer} from './projection.js';
import {assertCommerce,assertIntent} from './schema.js';
import {canonical,copy,digest,fail,sameRef} from './value.js';
import {prepareBootstrap,resumeBootstrap} from './bootstrap.js';

function invalid(message) {
  throw new ProductError('invalid', message);
}

export function createPurchaseService({commands, transport, sync, now, id, onStatus} = {}) {
  if (!commands || typeof commands.getState !== 'function' || typeof commands.commitExternal !== 'function') {
    invalid('Dem Kaufdienst fehlt der serialisierte Produktspeicherweg.');
  }
  if (!transport || typeof transport.readFolder !== 'function') {
    invalid('Dem Kaufdienst fehlt der gebundene Transport.');
  }
  if (!sync || typeof sync !== 'object' || typeof now !== 'function'
    || typeof id !== 'function' || typeof onStatus !== 'function') {
    invalid('Dem Kaufdienst fehlt eine Abhängigkeit.');
  }
  let tail=Promise.resolve();
  let lastHistory=null;
  let status={phase:'idle',code:null,message:null,operationId:null};

  function publish(next) {
    status=copy(next);
    onStatus(copy(status));
  }

  function enqueue(operation) {
    const running=tail.then(operation).catch((error)=>{
      publish({
        phase:'error',code:typeof error?.code==='string'?error.code:'unexpected',
        message:typeof error?.message==='string'?error.message:'Der Kaufdienst ist fehlgeschlagen.',
        operationId:status.operationId,
      });
      throw error;
    });
    tail=running.catch(()=>{});
    return running;
  }

  function current() {
    const state=commands.getState();
    if(state.storageVersion!==3 || state.commerce===undefined) {
      fail('version','Der lokale Kaufzustand ist noch nicht vorbereitet.');
    }
    assertCommerce(state.commerce);
    return state;
  }

  async function commitState(next,expected) {
    await commands.commitExternal(next,expected);
    return current();
  }

  async function replaceCommerce(commerce,{base=null}={}) {
    const before=base??current();
    const expected=await productStateHash(before);
    const next=copy(before);
    next.commerce=assertCommerce(commerce);
    return commitState(next,expected);
  }

  function pointerHead(snapshot) {
    const id=snapshot.properties.purchaseHeadId;
    const sha256=snapshot.properties.purchaseHeadSha256;
    if(id===undefined && sha256===undefined)return null;
    if(typeof id!=='string'||typeof sha256!=='string'||!/^[0-9a-f]{64}$/.test(sha256)) {
      fail('binding','Der Kaufkopfpointer ist unvollständig.');
    }
    return {id,sha256};
  }

  function exactPointerProperties(snapshot,head) {
    return {...copy(snapshot.properties),purchaseHeadId:head.id,purchaseHeadSha256:head.sha256};
  }

  function receiptFor(commerce,operationId) {
    return lastHistory?.projection.receipts.find(entry=>entry.operationId===operationId)??null;
  }

  async function refreshInternal() {
    let state=current();
    let commerce=state.commerce;
    if(commerce.mode==='inactive' || commerce.config===null)return null;
    if((transport.binding!==undefined&&canonical(transport.binding)!==canonical(commerce.binding))
      ||(transport.descriptorHash!==undefined&&transport.descriptorHash!==commerce.config.descriptorHash)) {
      fail('binding','Der Laufzeittransport gehört zu einem anderen Konto oder Bestandsordner.');
    }
    publish({phase:'refreshing',code:null,message:null,operationId:null});
    const snapshot=await transport.readFolder({
      id:commerce.config.coordinatorId,kind:'coordinator',config:commerce.config,
    });
    const head=pointerHead(snapshot);
    if(head===null) {
      if(commerce.mode==='active'||commerce.mode==='blocked')fail('history','Dem aktiven Kaufzustand fehlt der gemeinsame Kopf.');
      publish({phase:'ready',code:null,message:null,operationId:null});
      return null;
    }
    const history=await readHistory({
      head,
      binding:commerce.binding,
      cache:commerce.cache,
      read:(fileId,expectedRef)=>{
        if(expectedRef===null)throw new ProductError('history',`Der Historienwert ${fileId} hat keinen gebundenen Hash.`);
        return transport.readImmutable(expectedRef,{kind:'content',config:commerce.config});
      },
      onProgress:(progress)=>publish({phase:'refreshing',code:null,message:JSON.stringify(progress),operationId:null}),
    });
    lastHistory=history;
    const nextCommerce=copy(commerce);
    nextCommerce.head=copy(head);
    nextCommerce.cache=copy(history.cache);
    for(const job of nextCommerce.jobs) {
      const found=history.projection.receipts.find(entry=>entry.operationId===job.intent.operationId);
      if(found) {
        job.status='confirmed';
        for(const attempt of job.attempts)if(!['rejected','superseded'].includes(attempt.phase))attempt.phase='confirmed';
        continue;
      }
      for(const attempt of job.attempts) {
        if(['pointer-pending','reconciling'].includes(attempt.phase)) {
          if(!sameRef(head,attempt.head)) {
            attempt.phase='superseded';job.status='superseded';
          } else attempt.phase='reconciling';
        }
      }
    }
    let confirmedControl=false;
    if(nextCommerce.control!==null) {
      const found=history.projection.receipts.find(entry=>entry.operationId===nextCommerce.control.operationId);
      if(found&&nextCommerce.control.phase!=='confirmed') {
        nextCommerce.control.phase='confirmed';
        nextCommerce.mode=nextCommerce.control.operation==='initialize'?'active':nextCommerce.mode;
        confirmedControl=true;
      } else if(!found&&['pointer-pending','reconciling'].includes(nextCommerce.control.phase)
        && nextCommerce.control.head!==null&&!sameRef(head,nextCommerce.control.head)) {
        nextCommerce.control.phase='superseded';
      }
    }
    const changed=canonical(nextCommerce)!==canonical(commerce);
    if(confirmedControl) {
      if(typeof sync.applyConfirmedControl!=='function')fail('not-ready','Der gemeinsame Epochenabschluss ist noch nicht angebunden.');
      const expected=await productStateHash(state);
      const prepared=copy(state);prepared.commerce=assertCommerce(nextCommerce);
      const applied=await sync.applyConfirmedControl({
        state:copy(prepared),control:copy(nextCommerce.control),history:copy(history),
      });
      if(!applied||typeof applied!=='object')fail('invalid','Der gemeinsame Epochenabschluss lieferte keinen Produktzustand.');
      state=await commitState(applied,expected);
    } else if(changed)state=await replaceCommerce(nextCommerce,{base:state});
    publish({phase:'ready',code:null,message:null,operationId:null});
    return history;
  }

  async function ensureHistory() {
    return refreshInternal();
  }

  async function loadCachedHistory() {
    const commerce=current().commerce;
    if(commerce.head===null)return null;
    const history=await readHistory({
      head:commerce.head,binding:commerce.binding,cache:commerce.cache,
      read:async()=>{throw new ProductError('network','Der bestätigte Besitz ist lokal nicht vollständig verfügbar.');},
      onProgress:()=>{},
    });
    lastHistory=history;
    return history;
  }

  async function previewInternal({profileId,articleId}={}) {
    const history=await ensureHistory();
    const state=current(),commerce=state.commerce;
    if(commerce.mode!=='active'||history===null)fail('not-ready','Käufe sind noch nicht aktiviert.');
    if(commerce.control!==null&&!['confirmed','rejected','superseded'].includes(commerce.control.phase)) {
      fail('pending','Ein Steuerauftrag muss zuerst abgeschlossen werden.');
    }
    if(commerce.jobs.some(job=>job.status==='open'))fail('pending','Ein Kauf wird bereits geprüft.');
    const offer=purchaseOffer({ledger:state.ledger,economic:history.projection,profileId,articleId});
    const stateHash=await productStateHash(state);
    const previewId=await digest({version:1,kind:'purchase-preview',stateHash,head:commerce.head,offer});
    return {...copy(offer),previewId,stateHash,head:copy(commerce.head)};
  }

  function attemptByOperation(commerce,operationId) {
    const job=commerce.jobs.find(entry=>entry.intent.operationId===operationId);
    const attempt=job?.attempts.at(-1);
    if(!job||!attempt)fail('reference','Der Kaufauftrag wurde nicht gefunden.');
    return {job,attempt};
  }

  async function persistAttempt(operationId,mutate) {
    const state=current(),commerce=copy(state.commerce);
    const {job,attempt}=attemptByOperation(commerce,operationId);
    mutate({job,attempt,commerce});
    await replaceCommerce(commerce,{base:state});
    return attemptByOperation(current().commerce,operationId);
  }

  function uploadClosure(bundle,receiptRef,receiptValue) {
    return [...bundle.parts,{ref:bundle.ref,value:bundle.manifest},{ref:receiptRef,value:receiptValue}];
  }

  async function reservePurchase(operationId) {
    await refreshInternal();
    let state=current(),commerce=state.commerce;
    let {job,attempt}=attemptByOperation(commerce,operationId);
    if(attempt.phase!=='intent')return {job,attempt};
    if(job.status!=='open'||commerce.mode!=='active')fail('pending','Der Kaufauftrag ist nicht fortsetzbar.');
    const snapshot=await transport.readFolder({id:commerce.config.coordinatorId,kind:'coordinator',config:commerce.config});
    const remoteHead=pointerHead(snapshot);
    if(!sameRef(remoteHead,commerce.head))fail('stale','Der gemeinsame Kaufkopf hat sich geändert.');
    const history=lastHistory??await ensureHistory();
    const offer=purchaseOffer({
      ledger:state.ledger,economic:history.projection,
      profileId:job.intent.profileId,articleId:job.intent.articleId,
    });
    if(offer.epochId!==job.intent.epochId||offer.price!==job.intent.price
      ||offer.catalogVersion!==job.intent.catalogVersion)fail('stale','Der bestätigte Kaufauftrag ist veraltet.');
    const bundle=await packBasis(state.ledger,()=>transport.reserveId());
    const receiptValue={
      version:1,kind:'receipt',datasetId:commerce.binding.datasetId,
      coordinatorId:commerce.config.coordinatorId,sequence:history.projection.sequence+1,
      previous:copy(commerce.head),operationId:job.intent.operationId,operation:'purchase',
      epochId:job.intent.epochId,basis:copy(bundle.ref),intent:copy(job.intent),economy:null,
    };
    const receiptRef={id:await transport.reserveId(),sha256:await digest(receiptValue)};
    const uploads=uploadClosure(bundle,receiptRef,receiptValue);
    const pointerProperties=exactPointerProperties(snapshot,receiptRef);
    ({job,attempt}=await persistAttempt(operationId,({attempt:target})=>{
      target.phase='reserved';target.head=copy(commerce.head);target.etag=snapshot.etag;
      target.candidate=copy(receiptRef);target.pointerProperties=copy(pointerProperties);target.uploads=copy(uploads);
    }));
    return {job,attempt};
  }

  async function uploadPurchase(operationId) {
    let {attempt}=await reservePurchase(operationId);
    if(attempt.phase!=='reserved')return attempt;
    for(const upload of attempt.uploads) {
      const commerce=current().commerce;
      await transport.writeImmutable({
        ref:upload.ref,value:upload.value,kind:'content',config:commerce.config,
        authorization:{kind:'attempt',commerce,operationId,attemptId:attempt.attemptId},
      });
    }
    ({attempt}=await persistAttempt(operationId,({attempt:target})=>{target.phase='uploaded';}));
    return attempt;
  }

  async function sendPurchasePointer(operationId) {
    let attempt=await uploadPurchase(operationId);
    if(attempt.phase==='uploaded')({attempt}=await persistAttempt(operationId,({attempt:target})=>{target.phase='pointer-pending';}));
    if(!['pointer-pending','reconciling'].includes(attempt.phase))return attempt;
    if(attempt.phase==='reconciling')({attempt}=await persistAttempt(operationId,({attempt:target})=>{target.phase='pointer-pending';}));
    const commerce=current().commerce;
    const candidate=attempt.uploads.find(entry=>sameRef(entry.ref,attempt.candidate));
    const currentSnapshot=await transport.readFolder({id:commerce.config.coordinatorId,kind:'coordinator',config:commerce.config});
    const storedSnapshot={...currentSnapshot,etag:attempt.etag,properties:copy(attempt.pointerProperties)};
    try {
      await transport.putPointer({
        snapshot:storedSnapshot,head:attempt.candidate,headValue:candidate.value,
        authorization:{kind:'attempt',commerce,operationId,attemptId:attempt.attemptId},
      });
    } catch(error) {
      await persistAttempt(operationId,({attempt:target,job})=>{
        if(error?.code==='stale') {
          target.phase='superseded';job.status='superseded';
        } else target.phase='reconciling';
      });
      throw error;
    }
    await persistAttempt(operationId,({attempt:target})=>{target.phase='reconciling';});
    await refreshInternal();
    return attemptByOperation(current().commerce,operationId).job;
  }

  async function confirmInternal(preview) {
    if(!preview||typeof preview!=='object')fail('invalid','Die Kaufvorschau fehlt.');
    const state=current();
    if(await productStateHash(state)!==preview.stateHash||!sameRef(state.commerce.head,preview.head)) {
      fail('stale','Die Kaufvorschau ist nicht mehr aktuell.');
    }
    const offer=purchaseOffer({
      ledger:state.ledger,economic:lastHistory?.projection,
      profileId:preview.profileId,articleId:preview.articleId,
    });
    const expectedId=await digest({version:1,kind:'purchase-preview',stateHash:preview.stateHash,head:preview.head,offer});
    if(expectedId!==preview.previewId||canonical(offer)!==canonical({
      version:preview.version,datasetId:preview.datasetId,epochId:preview.epochId,
      profileId:preview.profileId,articleId:preview.articleId,catalogVersion:preview.catalogVersion,
      price:preview.price,earnedPoints:preview.earnedPoints,spentPoints:preview.spentPoints,
      availablePoints:preview.availablePoints,
    }))fail('stale','Die Kaufvorschau wurde verändert.');
    const operationId=id();
    const attemptId=id();
    const intent=assertIntent({
      version:1,operationId,datasetId:offer.datasetId,profileId:offer.profileId,
      epochId:offer.epochId,articleId:offer.articleId,catalogVersion:offer.catalogVersion,
      price:offer.price,confirmed:true,
    });
    const commerce=copy(state.commerce);
    commerce.jobs.push({version:1,intent,status:'open',attempts:[{
      version:1,attemptId,phase:'intent',head:null,etag:null,candidate:null,pointerProperties:null,uploads:[],
    }]});
    await replaceCommerce(commerce,{base:state});
    publish({phase:'purchasing',code:null,message:null,operationId});
    const job=await sendPurchasePointer(operationId);
    publish({phase:'ready',code:null,message:null,operationId});
    return {operationId,status:job.status};
  }

  async function resumeInternal(operationId) {
    const setup=current().commerce.setup;
    if(setup?.operationId===operationId&&setup.phase!=='confirmed') {
      const persist=async(nextSetup)=>{
        const state=current(),commerce=copy(state.commerce);
        commerce.mode='migrating';commerce.binding=copy(nextSetup.binding);commerce.setup=copy(nextSetup);
        if(nextSetup.config!==null){commerce.config=copy(nextSetup.config);commerce.configRef=copy(nextSetup.configRef);}
        await replaceCommerce(commerce,{base:state});
      };
      const resumed=await resumeBootstrap({transport,setup,persist,repeatPointer:true});
      return {operationId,status:resumed.phase};
    }
    const storedControl=current().commerce.control;
    if(storedControl?.operationId===operationId) {
      return sendControl(operationId,storedControl.operation);
    }
    await refreshInternal();
    const {job,attempt}=attemptByOperation(current().commerce,operationId);
    if(job.status!=='open')return {operationId,status:job.status};
    if(attempt.phase==='superseded'||attempt.phase==='rejected')return {operationId,status:job.status};
    const result=await sendPurchasePointer(operationId);
    return {operationId,status:result.status};
  }

  async function persistControl(mutate) {
    const state=current(),commerce=copy(state.commerce);
    if(commerce.control===null)fail('reference','Der Steuerauftrag wurde nicht gefunden.');
    mutate({control:commerce.control,commerce});
    await replaceCommerce(commerce,{base:state});
    return copy(current().commerce.control);
  }

  async function installSetup(binding,descriptorHash) {
    let state=current(),commerce=state.commerce;
    if(commerce.config!==null&&commerce.setup?.phase==='confirmed')return commerce;
    const persist=async(setup)=>{
      const latest=current(),next=copy(latest.commerce);
      next.mode='migrating';next.binding=copy(binding);next.setup=copy(setup);
      if(setup.config!==null) { next.config=copy(setup.config);next.configRef=copy(setup.configRef); }
      await replaceCommerce(next,{base:latest});
    };
    let setup=current().commerce.setup;
    if(setup===null)setup=await prepareBootstrap({transport,binding,descriptorHash,operationId:id(),persist});
    setup=await resumeBootstrap({transport,setup,persist});
    if(setup.phase!=='confirmed')fail('pending','Die Kaufprotokolleinrichtung hat noch keinen bestätigten Ausgang.');
    const latest=current(),next=copy(latest.commerce);
    next.mode='migrating';next.binding=copy(binding);next.setup=copy(setup);
    next.config=copy(setup.config);next.configRef=copy(setup.configRef);
    await replaceCommerce(next,{base:latest});
    return current().commerce;
  }

  async function verifyUploads(uploads) {
    if(!Array.isArray(uploads)||uploads.length===0)fail('invalid','Dem Steuerauftrag fehlt seine gespeicherte Uploadclosure.');
    for(const upload of uploads) {
      if(!upload?.ref||await digest(upload.value)!==upload.ref.sha256)fail('integrity','Ein Steuerupload stimmt nicht mit seinem Hash überein.');
    }
  }

  async function uploadControl(operationId) {
    let state=current(),control=state.commerce.control;
    if(control===null||control.operationId!==operationId)fail('reference','Der Steuerauftrag wurde nicht gefunden.');
    if(control.phase==='reserved') {
      for(const upload of control.uploads) {
        state=current();
        await transport.writeImmutable({
          ref:upload.ref,value:upload.value,kind:'content',config:state.commerce.config,
          authorization:{kind:'control',commerce:state.commerce,operationId},
        });
      }
      control=await persistControl(({control:target})=>{target.phase='uploaded';});
    }
    if(control.phase==='uploaded')control=await persistControl(({control:target})=>{target.phase='pointer-pending';});
    return control;
  }

  async function prepareControl(operation,input=null) {
    let state=current();
    if(operation==='restore') {
      await refreshInternal();
      state=current();
    }
    if(state.restoreJobs.length>0)fail('restore-pending','Eine ältere Wiederherstellung muss zuerst abgeschlossen werden.');
    if(state.commerce.jobs.some(job=>job.status==='open'))fail('pending','Ein offener Kaufauftrag sperrt die Steueroperation.');
    if(operation==='initialize') {
      if(state.commerce.mode==='inactive') {
        const binding=input?.binding??state.binding;
        const descriptorHash=input?.descriptorHash;
        if(binding===null||typeof descriptorHash!=='string')fail('invalid','Der Aktivierung fehlt die gebundene Datensatzbeschreibung.');
        await installSetup(binding,descriptorHash);state=current();
      }
      if(state.commerce.mode!=='migrating'||state.commerce.config===null)fail('not-ready','Die Kaufaktivierung ist nicht vorbereitet.');
    } else if(state.commerce.mode!=='active')fail('not-ready','Eine gemeinsame Wiederherstellung benötigt einen aktiven Kaufzustand.');
    const existing=state.commerce.control;
    if(existing!==null&&!['confirmed','rejected','superseded'].includes(existing.phase)) {
      if(existing.operation!==operation)fail('pending','Ein anderer Steuerauftrag ist noch offen.');
      if(existing.phase!=='intent')return copy(await uploadControl(existing.operationId));
    }
    let control=existing;
    if(control===null||control.phase!=='intent') {
      control={
        version:1,operationId:id(),operation,phase:'intent',epochId:null,head:null,
        etag:null,candidate:null,pointerProperties:null,uploads:[],
      };
      const commerce=copy(state.commerce);commerce.control=control;
      await replaceCommerce(commerce,{base:state});state=current();
    }
    const port=operation==='initialize'?sync.prepareActivationCandidate:sync.prepareRestoreCandidate;
    if(typeof port!=='function')fail('not-ready','Die gemeinsame Epochenkandidatur ist noch nicht angebunden.');
    const prepared=await port({
      state:copy(state),control:copy(control),input:copy(input),history:copy(lastHistory),
      reserve:()=>transport.reserveId(),
    });
    await verifyUploads(prepared?.uploads);
    const snapshot=await transport.readFolder({
      id:state.commerce.config.coordinatorId,kind:'coordinator',config:state.commerce.config,
    });
    const head=pointerHead(snapshot);
    if(operation==='initialize' ? head!==null : !sameRef(head,state.commerce.head)) {
      fail('stale','Der gemeinsame Kopf passt nicht mehr zur Steueroperation.');
    }
    control=await persistControl(({control:target})=>{
      target.phase='reserved';target.epochId=prepared.epochId;
      target.head=operation==='initialize'?null:copy(head);target.etag=snapshot.etag;
      target.candidate=copy(prepared.candidate);target.uploads=copy(prepared.uploads);
      target.pointerProperties=exactPointerProperties(snapshot,prepared.candidate);
    });
    return copy(await uploadControl(control.operationId));
  }

  async function sendControl(operationId,operation) {
    await refreshInternal();
    let state=current(),control=state.commerce.control;
    if(control===null||control.operationId!==operationId||control.operation!==operation) {
      fail('reference','Der Steuerauftrag wurde nicht gefunden.');
    }
    if(control.phase==='confirmed')return copy(control);
    control=await uploadControl(operationId);
    if(control.phase==='reconciling')control=await persistControl(({control:target})=>{target.phase='pointer-pending';});
    if(control.phase!=='pointer-pending')fail('pending','Der Steuerauftrag ist nicht sendebereit.');
    state=current();
    const candidate=control.uploads.find(entry=>sameRef(entry.ref,control.candidate));
    const snapshot=await transport.readFolder({id:state.commerce.config.coordinatorId,kind:'coordinator',config:state.commerce.config});
    const storedSnapshot={...snapshot,etag:control.etag,properties:copy(control.pointerProperties)};
    try {
      await transport.putPointer({
        snapshot:storedSnapshot,head:control.candidate,headValue:candidate.value,
        authorization:{kind:'control',commerce:state.commerce,operationId},
      });
    } catch(error) {
      await persistControl(({control:target})=>{
        target.phase=error?.code==='stale'?'superseded':'reconciling';
      });
      throw error;
    }
    await persistControl(({control:target})=>{target.phase='reconciling';});
    await refreshInternal();
    return copy(current().commerce.control);
  }

  async function selectInternal({profileId,figureId,stage}={}) {
    if(typeof profileId!=='string'||typeof figureId!=='string'
      ||!Number.isSafeInteger(stage)||stage<1||stage>4)fail('invalid','Die Figurenauswahl ist ungültig.');
    const history=lastHistory??await loadCachedHistory();
    const account=history?.projection.accounts?.[profileId];
    if(!account)fail('reference','Das Lernprofil ist nicht vorhanden.');
    if(!account.entitledFigureIds.includes(figureId))fail('entitlement','Die Figur ist nicht freigeschaltet.');
    const evolutionId=`evolution:${figureId}:${stage}`;
    if(!account.entitledEvolutionIds.includes(evolutionId))fail('entitlement','Die Entwicklungsform ist nicht freigeschaltet.');
    const state=current(),commerce=copy(state.commerce);
    commerce.selection=commerce.selection.filter(entry=>entry.profileId!==profileId);
    commerce.selection.push({profileId,figureId,stage});
    commerce.selection.sort((left,right)=>left.profileId.localeCompare(right.profileId));
    await replaceCommerce(commerce,{base:state});
    return copy(commerce.selection.find(entry=>entry.profileId===profileId));
  }

  function view() {
    const commerce=current().commerce;
    return {
      mode:commerce.mode,
      head:copy(commerce.head),
      accounts:copy(lastHistory?.projection.accounts??{}),
      jobs:copy(commerce.jobs),
      selection:copy(commerce.selection),
      control:copy(commerce.control),
    };
  }

  return Object.freeze({
    prepareActivation(input){return enqueue(()=>prepareControl('initialize',input));},
    confirmActivation(operationId){return enqueue(()=>sendControl(operationId,'initialize'));},
    refresh(){return enqueue(refreshInternal);},
    preview(input){return enqueue(()=>previewInternal(input));},
    confirm(input){return enqueue(()=>confirmInternal(input));},
    resume(operationId){return enqueue(()=>resumeInternal(operationId));},
    getStatus(){return copy(status);},
    async getView(){if(lastHistory===null)await enqueue(loadCachedHistory);return view();},
    select(input){return enqueue(()=>selectInternal(input));},
    prepareRestore(input){return enqueue(()=>prepareControl('restore',input));},
    confirmRestore(operationId){return enqueue(()=>sendControl(operationId,'restore'));},
  });
}
