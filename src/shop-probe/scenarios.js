import {runPurchaseScenarios} from './purchase-scenarios.js';

const clone=value=>structuredClone(value);
const initial=()=>({probeVersion:1,epoch:'epoch-0',sequence:0,earned:1000,spent:0,operations:[],owned:[]});
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const sameJsonValue=(a,b)=>{
  if(Object.is(a,b))return true;
  if(Array.isArray(a)||Array.isArray(b))return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((value,index)=>sameJsonValue(value,b[index]));
  if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
  const aKeys=Object.keys(a),bKeys=Object.keys(b);
  return aKeys.length===bKeys.length&&aKeys.every(key=>Object.hasOwn(b,key)&&sameJsonValue(a[key],b[key]));
};
const assert=(condition,evidence)=>{if(!condition)throw Object.assign(new Error('unexpected'),{code:'assertion',evidence});};
const errorClasses=['unsupported','stale','collision','auth','network','binding','permission','missing','http','assertion'];
const classify=error=>errorClasses.includes(error?.code)?error.code:'unexpected';
const metadataResultClasses=[...errorClasses,'invalid','fulfilled','success'];
const metadataClassify=error=>metadataResultClasses.includes(error?.code)?error.code:'unexpected';
async function rejects(operation,code,checkpoint){try{await operation();}catch(error){assert(error?.code===code,{checkpoint,outcome:classify(error)});return;}assert(false,{checkpoint,outcome:'fulfilled'});}

function concurrentEvidence(results){
  const accepted=results.filter(r=>r.status==='fulfilled').length;
  const rejections=results.filter(r=>r.status==='rejected').map(r=>classify(r.reason));
  const stale=rejections.filter(code=>code==='stale').length;
  return {checkpoint:'concurrent-writes',accepted,stale,other:rejections.length-stale,rejections};
}

// The exported evidence has no raw result objects, errors, identifiers or ETags.
function safeEvidence(value){
  const checkpoints=['concurrent-writes','initialization-readback','purchase-readback','response-loss-receipt','response-loss-idempotency','old-token-retry','response-loss-balance','invalid-token-observation','read-stability-observation','metadata-invalid-token','metadata-stale-write','metadata-concurrent'];
  if(!value||!checkpoints.includes(value.checkpoint))return null;
  const result={checkpoint:value.checkpoint};
  if(value.checkpoint.startsWith('metadata-')){
    const roles={
      'metadata-invalid-token':{writes:['invalid-token'],readbacks:['after-invalid-token']},
      'metadata-stale-write':{writes:['first','stale'],readbacks:['winner','final']},
      'metadata-concurrent':{writes:['sentinel','candidate-a','candidate-b'],readbacks:['sentinel','winner']},
    }[value.checkpoint];
    const phases=['folder-create','snapshot','write','readback','first-write','winner-readback','stale-write','final-readback','sentinel-write','sentinel-readback','concurrent-writes','complete'];
    if(value.cacheMode==='no-store')result.cacheMode=value.cacheMode;
    if(phases.includes(value.phase))result.phase=value.phase;
    if(Array.isArray(value.writes)&&value.writes.length<=3){
      const seen=new Set();result.writes=[];
      for(const item of value.writes){
        if(!item||!roles.writes.includes(item.role)||seen.has(item.role))continue;
        seen.add(item.role);const observation={role:item.role,outcome:metadataResultClasses.includes(item.outcome)?item.outcome:'unexpected'};
        if(Number.isInteger(item.httpStatus)&&item.httpStatus>=100&&item.httpStatus<=599)observation.httpStatus=item.httpStatus;
        result.writes.push(observation);
      }
    }
    if(Array.isArray(value.readbacks)&&value.readbacks.length<=2){
      const seen=new Set();result.readbacks=[];
      for(const item of value.readbacks){
        if(!item||!roles.readbacks.includes(item.role)||seen.has(item.role))continue;
        seen.add(item.role);const observation={role:item.role,outcome:metadataResultClasses.includes(item.outcome)?item.outcome:'unexpected'};
        if(Number.isInteger(item.httpStatus)&&item.httpStatus>=100&&item.httpStatus<=599)observation.httpStatus=item.httpStatus;
        if(['equal','different','unavailable'].includes(item.comparison))observation.comparison=item.comparison;
        result.readbacks.push(observation);
      }
    }
    return result;
  }
  if(value.checkpoint==='read-stability-observation'){
    if(value.cacheMode==='no-store')result.cacheMode=value.cacheMode;
    if(typeof value.complete==='boolean')result.complete=value.complete;
    if(Array.isArray(value.comparisons)&&value.comparisons.length<=2){
      const states=['same','changed','unavailable'],versions=['same','increased','decreased','representation-changed'],windows=['metadata-control','media-window'],seen=new Set();
      result.comparisons=[];
      for(const item of value.comparisons){
        if(!item||!windows.includes(item.window)||seen.has(item.window))continue;
        seen.add(item.window);const comparison={window:item.window};
        if(versions.includes(item.version))comparison.version=item.version;
        for(const key of ['etag','contentChecksum','headRevision','modifiedDate','viewedDate','fileSize'])if(states.includes(item[key]))comparison[key]=item[key];
        result.comparisons.push(comparison);
      }
    }
    if(value.media&&typeof value.media==='object'){
      const media={outcome:['success','not-reached','unexpected',...errorClasses].includes(value.media.outcome)?value.media.outcome:'unexpected'};
      if(Number.isInteger(value.media.httpStatus)&&value.media.httpStatus>=100&&value.media.httpStatus<=599)media.httpStatus=value.media.httpStatus;
      for(const key of ['redirected','contentMatchesFixture'])if(typeof value.media[key]==='boolean')media[key]=value.media[key];
      result.media=media;
    }
    if(['creation-response','metadata-1','metadata-2','media','metadata-3'].includes(value.errorPhase))result.errorPhase=value.errorPhase;
    return result;
  }
  for(const key of ['accepted','stale','other'])if(Number.isInteger(value[key])&&value[key]>=0&&value[key]<=2)result[key]=value[key];
  if(Array.isArray(value.rejections)&&value.rejections.length<=2)result.rejections=value.rejections.map(code=>errorClasses.includes(code)?code:'unexpected');
  if(['fulfilled','unexpected',...errorClasses].includes(value.outcome))result.outcome=value.outcome;
  if(Number.isInteger(value.httpStatus)&&value.httpStatus>=100&&value.httpStatus<=599)result.httpStatus=value.httpStatus;
  if(['unchanged','key-order-only','changed','unavailable'].includes(value.readback))result.readback=value.readback;
  if(['success','unexpected',...errorClasses].includes(value.readbackOutcome))result.readbackOutcome=value.readbackOutcome;
  if(Number.isInteger(value.readbackHttpStatus)&&value.readbackHttpStatus>=100&&value.readbackHttpStatus<=599)result.readbackHttpStatus=value.readbackHttpStatus;
  return result;
}

// Export classifications only, never raw headers, file IDs, token values or errors.
function safeDiagnostic(value){
  if(!value||typeof value!=='object')return null;
  const allowed={phase:['metadata','read-stability','read-token','write-token'],reason:['missing-file-version','changed-during-read','missing-strong-etag'],etagSource:['media','metadata','v2-json','v2-coherent'],metadataEtagState:['absent','strong','weak','malformed'],mediaEtagState:['absent','strong','weak','malformed','not-requested'],jsonEtagState:['absent','strong','weak','malformed'],readContext:['create-verification','snapshot-read','retry-create-verification','metadata-coordination'],readKind:['metadata-metadata','metadata-media-metadata'],contentChecksumState:['same','changed','unavailable'],headRevisionState:['same','changed','unavailable'],modifiedDateState:['same','changed','unavailable'],viewedDateState:['same','changed','unavailable'],fileSizeState:['same','changed','unavailable']};
  const result={};
  for(const [key,values] of Object.entries(allowed))if(Object.hasOwn(value,key)&&values.includes(value[key]))result[key]=value[key];
  for(const key of ['versionChanged','metadataEtagChanged','jsonEtagChanged'])if(Object.hasOwn(value,key)&&typeof value[key]==='boolean')result[key]=value[key];
  return Object.keys(result).length?result:null;
}

// Synthetic coordinator rules only. This deliberately does not import the product ledger.
export function purchase(state,{id,article,price,epoch=state.epoch,conflicted=false}) {
  const previous=state.operations.find(op=>op.id===id);
  if(previous){assert(previous.article===article&&previous.price===price&&previous.epoch===epoch);return clone(state);}
  assert(!conflicted&&epoch===state.epoch&&Number.isSafeInteger(price)&&price>0);
  if(state.owned.includes(article))return clone(state);
  assert(state.earned-state.spent>=price);
  const next=clone(state);next.sequence++;next.spent+=price;next.owned.push(article);
  next.operations.push({kind:'purchase',id,article,price,epoch});return next;
}
export async function runProbeScenarios({transport,emit=()=>{},probeScope='full'}) {
  if(!['full','invalid-token','read-stability','metadata-coordination','immutable-purchases'].includes(probeScope))throw new TypeError('Unknown probe scope');
  if(probeScope==='immutable-purchases'){
    if(['createMetadataFolder','readMetadataSnapshot','updateMetadataIfUnchanged','prepareImmutable','writeImmutable','readImmutable'].some(name=>typeof transport?.[name]!=='function'))throw new TypeError('Unsupported probe scope');
    return runPurchaseScenarios({transport,emit});
  }
  if(probeScope==='read-stability'&&typeof transport?.observeReadStability!=='function')throw new TypeError('Unsupported probe scope');
  if(probeScope==='metadata-coordination'&&['createMetadataFolder','readMetadataSnapshot','updateMetadataIfUnchanged'].some(name=>typeof transport?.[name]!=='function'))throw new TypeError('Unsupported probe scope');
  const checks=[];
  async function read(id,scenarioStage='post-write-read'){
    try{return await transport.read(id);}
    catch(error){throw {code:error?.code,status:error?.status,diagnostic:error?.diagnostic,scenarioStage};}
  }
  async function check(id,expected,fn) {
    let result;try{const detail=await fn();result={id,expected,passed:true,status:'passed',actual:detail??'Erwartete Wirkung nach erneutem Lesen bestätigt.'};}
    catch(error){const code=classify(error);
      const diagnostic=safeDiagnostic(error?.diagnostic);
      const evidence=safeEvidence(error?.evidence);
      result={id,expected,passed:false,status:code==='unsupported'?'unsupported':'failed',actual:code,...(diagnostic?{diagnostic}:{}),...(evidence?{evidence}:{}),...(['fixture-read','post-write-read','initialization-read','invalid-token-readback','response-loss-receipt','response-loss-after-second-write','response-loss-balance'].includes(error?.scenarioStage)?{scenarioStage:error.scenarioStage}:{}),...(Number.isInteger(error?.status)&&error.status>=100&&error.status<=599?{httpStatus:error.status}:{})};}
    checks.push(result);emit(clone(result));
  }
  let folder;
  if(probeScope==='metadata-coordination'){
    const createFolder=async name=>transport.createMetadataFolder({parentId:folder?.id??null,name});
    const evidence=checkpoint=>({checkpoint,cacheMode:'no-store',phase:'folder-create',writes:[],readbacks:[]});
    const observedError=(error,current)=>({code:error?.code,status:error?.status,diagnostic:error?.diagnostic,evidence:current});
    async function observeWrite(current,role,operation){
      try{
        const response=await operation(),httpStatus=response?.status;
        const item={role,outcome:'fulfilled'};
        if(Number.isInteger(httpStatus)&&httpStatus>=100&&httpStatus<=599)item.httpStatus=httpStatus;
        current.writes.push(item);
        return {confirmed:Number.isInteger(httpStatus)&&httpStatus>=200&&httpStatus<=299};
      }catch(error){
        const item={role,outcome:metadataClassify(error)};
        if(Number.isInteger(error?.status)&&error.status>=100&&error.status<=599)item.httpStatus=error.status;
        current.writes.push(item);return {confirmed:false,error};
      }
    }
    async function observeReadback(current,role,operation,expected){
      try{
        const snapshot=await operation(),comparison=expected===null?'unavailable':sameJsonValue(snapshot.properties,expected)?'equal':'different';
        current.readbacks.push({role,outcome:'success',comparison});return {snapshot,comparison};
      }catch(error){
        const item={role,outcome:metadataClassify(error),comparison:'unavailable'};
        if(Number.isInteger(error?.status)&&error.status>=100&&error.status<=599)item.httpStatus=error.status;
        current.readbacks.push(item);return {error,comparison:'unavailable'};
      }
    }
    await check('fixture','Eigener synthetischer Metadaten-Probeordner streng angelegt und nachgelesen.',async()=>{folder=await createFolder('SYNTHETISCH');});
    if(!folder)return summarize(checks,probeScope);

    await check('metadata-invalid-token','Falsche Metadaten-ETag ergibt 412; Properties bleiben vollständig gleich.',async()=>{
      const current=evidence('metadata-invalid-token');let target,before;
      try{target=await createFolder('metadata-invalid-token');current.phase='snapshot';before=await transport.readMetadataSnapshot(target.id);}
      catch(error){throw observedError(error,current);}
      const invalidEtag=`${before.etag.slice(0,-1)}x"`;
      current.phase='write';const write=await observeWrite(current,'invalid-token',()=>transport.updateMetadataIfUnchanged({...before,etag:invalidEtag},{coordinator:'invalid'}));
      current.phase='readback';const readback=await observeReadback(current,'after-invalid-token',()=>transport.readMetadataSnapshot(target.id),before.properties);
      if(readback.error)throw observedError(readback.error,current);
      current.phase='complete';assert(write.error?.code==='stale'&&write.error?.status===412&&readback.comparison==='equal',current);
      return safeEvidence(current);
    });

    await check('metadata-stale-write','Verbrauchte Metadaten-ETag ergibt 412; Gewinner und Sentinel bleiben vollständig erhalten.',async()=>{
      const current=evidence('metadata-stale-write');let target,before;
      try{target=await createFolder('metadata-stale-write');current.phase='snapshot';before=await transport.readMetadataSnapshot(target.id);}
      catch(error){throw observedError(error,current);}
      const winner={...before.properties,coordinator:'first',sentinel:'preserve-me'};
      current.phase='first-write';const first=await observeWrite(current,'first',()=>transport.updateMetadataIfUnchanged(before,{coordinator:'first',sentinel:'preserve-me'}));
      current.phase='winner-readback';const winnerRead=await observeReadback(current,'winner',()=>transport.readMetadataSnapshot(target.id),winner);
      if(winnerRead.error)throw observedError(winnerRead.error,current);
      if(!first.confirmed||winnerRead.comparison!=='equal'){assert(false,current);}
      current.phase='stale-write';const stale=await observeWrite(current,'stale',()=>transport.updateMetadataIfUnchanged(before,{coordinator:'stale'}));
      current.phase='final-readback';const finalRead=await observeReadback(current,'final',()=>transport.readMetadataSnapshot(target.id),winner);
      if(finalRead.error)throw observedError(finalRead.error,current);
      current.phase='complete';assert(stale.error?.code==='stale'&&stale.error?.status===412&&finalRead.comparison==='equal',current);
      return safeEvidence(current);
    });

    await check('metadata-concurrent','Zwei gleichzeitige Metadaten-PUTs ergeben genau einen bestätigten Gewinner und eine 412.',async()=>{
      const current=evidence('metadata-concurrent');let target,before;
      try{target=await createFolder('metadata-concurrent');current.phase='snapshot';before=await transport.readMetadataSnapshot(target.id);}
      catch(error){throw observedError(error,current);}
      const sentinel={...before.properties,sentinel:'preserve-me'};
      current.phase='sentinel-write';const sentinelWrite=await observeWrite(current,'sentinel',()=>transport.updateMetadataIfUnchanged(before,{sentinel:'preserve-me'}));
      current.phase='sentinel-readback';const sentinelRead=await observeReadback(current,'sentinel',()=>transport.readMetadataSnapshot(target.id),sentinel);
      if(sentinelRead.error)throw observedError(sentinelRead.error,current);
      if(!sentinelWrite.confirmed||sentinelRead.comparison!=='equal'){assert(false,current);}
      const fresh=sentinelRead.snapshot,candidates=[
        {role:'candidate-a',properties:{...fresh.properties,coordinator:'candidate-a'}},
        {role:'candidate-b',properties:{...fresh.properties,coordinator:'candidate-b'}},
      ];
      current.phase='concurrent-writes';
      const results=await Promise.allSettled(candidates.map(candidate=>transport.updateMetadataIfUnchanged(clone(fresh),{coordinator:candidate.properties.coordinator})));
      results.forEach((result,index)=>{
        const item={role:candidates[index].role,outcome:result.status==='fulfilled'?'fulfilled':metadataClassify(result.reason)};
        const status=result.status==='fulfilled'?result.value?.status:result.reason?.status;
        if(Number.isInteger(status)&&status>=100&&status<=599)item.httpStatus=status;
        current.writes.push(item);
      });
      const accepted=results.map((result,index)=>({result,index})).filter(({result})=>result.status==='fulfilled'&&Number.isInteger(result.value?.status)&&result.value.status>=200&&result.value.status<=299);
      const rejected=results.filter(result=>result.status==='rejected'&&result.reason?.code==='stale'&&result.reason?.status===412);
      const expectedWinner=accepted.length===1?candidates[accepted[0].index].properties:null;
      current.phase='final-readback';const finalRead=await observeReadback(current,'winner',()=>transport.readMetadataSnapshot(target.id),expectedWinner);
      if(finalRead.error)throw observedError(finalRead.error,current);
      current.phase='complete';assert(accepted.length===1&&rejected.length===1&&finalRead.comparison==='equal',current);
      return safeEvidence(current);
    });
    return summarize(checks,probeScope);
  }
  await check('fixture','Eigener synthetischer Probeordner angelegt.',async()=>{folder=await transport.create({folder:true,name:'SYNTHETISCH'});});
  if(!folder)return summarize(checks);
  if(probeScope==='read-stability'){
    await check('read-stability','Kontrolllesen und Medienfenster vollständig und stabil beobachtet.',async()=>{
      let observation;
      try{observation=await transport.observeReadStability({parentId:folder.id,value:initial()});}
      catch(error){const evidence=safeEvidence({...error?.observation,checkpoint:'read-stability-observation'});throw {code:error?.code,status:error?.status,evidence};}
      const evidence=safeEvidence({...observation,checkpoint:'read-stability-observation'});
      const comparisons=evidence?.comparisons;
      const comparisonStates=['contentChecksum','headRevision','modifiedDate','viewedDate','fileSize'];
      const stable=evidence?.cacheMode==='no-store'&&evidence.complete===true&&evidence.errorPhase===undefined
        &&Array.isArray(comparisons)&&comparisons.length===2
        &&comparisons[0].window==='metadata-control'&&comparisons[1].window==='media-window'
        &&comparisons.every(item=>item.version==='same'&&item.etag==='same'&&comparisonStates.every(key=>Object.hasOwn(item,key)))
        &&evidence.media?.outcome==='success'&&evidence.media.contentMatchesFixture===true;
      assert(stable,evidence);return evidence;
    });
    return summarize(checks);
  }
  async function fixture(name){const file=await transport.create({parentId:folder.id,name,value:initial()});return read(file.id,'fixture-read');}
  if(probeScope==='full')await check('version-token','Starke Versionskennung im Browser lesbar.',async()=>{const file=await fixture('token');return file.observation??'Versionskennung lesbar.';});
  await check('invalid-token','Falsches If-Match ergibt 412; Inhalt bleibt unverändert.',async()=>{
    const before=await fixture('invalid-token');
    let outcome,httpStatus;
    try{
      const response=await transport.updateIfUnchanged({...before,etag:'"deliberately-invalid-probe-token"'},{...before.value,sequence:99});
      outcome='fulfilled';httpStatus=response?.status;
    }catch(error){outcome=classify(error);httpStatus=error?.status;}
    let readback='unavailable',readbackOutcome='unexpected',readbackHttpStatus,readError;
    try{
      const current=await read(before.id,'invalid-token-readback');
      readback=same(current.value,before.value)?'unchanged':sameJsonValue(current.value,before.value)?'key-order-only':'changed';
      readbackOutcome='success';
    }catch(error){readError=error;readbackOutcome=classify(error);readbackHttpStatus=error?.status;}
    const evidence=safeEvidence({checkpoint:'invalid-token-observation',outcome,httpStatus,readback,readbackOutcome,readbackHttpStatus});
    if(readError)throw {...readError,evidence};
    assert(outcome==='stale'&&readback==='unchanged',evidence);
    return evidence;
  });
  if(probeScope==='invalid-token')return summarize(checks);
  await check('stale-write','Verbrauchtes If-Match ergibt 412; erster Inhalt bleibt.',async()=>{
    const before=await fixture('stale'),winner={...before.value,sequence:1};await transport.updateIfUnchanged(before,winner);
    await rejects(()=>transport.updateIfUnchanged(before,{...before.value,sequence:2}),'stale');assert(same((await read(before.id)).value,winner));
  });
  await check('initialization','Zwei Initialisierer: genau eine verbindliche Ordnerbindung.',async()=>{
    const a=await transport.create({parentId:folder.id,name:'candidate-a',value:initial()}),b=await transport.create({parentId:folder.id,name:'candidate-b',value:initial()});
    const before=await read(folder.id,'initialization-read');
    const results=await Promise.allSettled([a,b].map(file=>transport.updateIfUnchanged(before,{...before.properties,coordinator:file.id},{metadata:true})));
    const evidence=concurrentEvidence(results);assert(evidence.accepted===1&&evidence.stale===1,evidence);
    const winner=results[0].status==='fulfilled'?a:b;assert((await read(folder.id)).properties.coordinator===winner.id,{checkpoint:'initialization-readback'});
  });
  await check('two-purchases','Zwei Käufe zu 800 bei 1000 Guthaben: genau einer, Rest 200.',async()=>{
    const before=await fixture('two-clients'),a=purchase(before.value,{id:'buy-a',article:'a',price:800}),b=purchase(before.value,{id:'buy-b',article:'b',price:800});
    const results=await Promise.allSettled([transport.updateIfUnchanged(clone(before),a),transport.updateIfUnchanged(clone(before),b)]);
    const evidence=concurrentEvidence(results);assert(evidence.accepted===1&&evidence.stale===1,evidence);
    const current=(await read(before.id)).value;assert(current.spent===800&&current.operations.length===1,{checkpoint:'purchase-readback'});
    await rejects(async()=>purchase(current,{id:'third',article:'c',price:800}),'assertion');
  });
  await check('response-loss','Absichtlich verworfene Erfolgsantwort: Beleg mit gleicher ID gefunden, keine zweite Ausgabe.',async()=>{
    const before=await fixture('response-loss'),request={id:'same-operation',article:'a',price:800};
    try{await transport.updateIfUnchanged(before,purchase(before.value,request));throw Object.assign(new Error(),{code:'network'});}catch(error){if(error.code!=='network')throw error;}
    let current=await read(before.id,'response-loss-receipt');assert(current.value.operations.some(op=>op.id===request.id),{checkpoint:'response-loss-receipt'});
    await transport.updateIfUnchanged(current,purchase(current.value,{id:'later-operation',article:'b',price:100}));
    current=await read(before.id,'response-loss-after-second-write');
    assert(same(purchase(current.value,request),current.value),{checkpoint:'response-loss-idempotency'});await rejects(()=>transport.updateIfUnchanged(before,purchase(before.value,request)),'stale','old-token-retry');
    assert((await read(before.id,'response-loss-balance')).value.spent===900,{checkpoint:'response-loss-balance'});
    return 'Erfolgsantwort lokal verworfen; kein tatsächlicher Leitungsabbruch simuliert.';
  });
  await check('duplicate-operation','Vorgang und vorhandener Besitz erzeugen keine zweite Ausgabe.',async()=>{
    const before=await fixture('duplicate'),request={id:'same',article:'a',price:800},after=purchase(before.value,request);await transport.updateIfUnchanged(before,after);
    const current=(await read(before.id)).value;assert(same(purchase(current,request),current));assert(same(purchase(current,{...request,id:'different'}),current));
    await rejects(async()=>purchase(current,{...request,price:700}),'assertion');
  });
  await check('reset-race','Kauf und Epochenwechsel teilen dieselbe Schreibgrenze; beide Gewinnerreihenfolgen.',async()=>{
    for(const resetFirst of [true,false]){
      const before=await fixture(resetFirst?'reset-first':'buy-first');
      const reset={...initial(),epoch:'epoch-1',sequence:1,operations:[{id:'reset',kind:'reset',epoch:'epoch-1'}]};
      const buy=purchase(before.value,{id:'old-buy',article:'a',price:800,epoch:'epoch-0'});
      const winner=resetFirst?reset:buy,loser=resetFirst?buy:reset;
      await transport.updateIfUnchanged(before,winner);await rejects(()=>transport.updateIfUnchanged(before,loser),'stale');assert(same((await read(before.id)).value,winner));
      if(resetFirst)await rejects(async()=>purchase(reset,{id:'late-buy',article:'a',price:800,epoch:'epoch-0'}),'assertion');
    }
  });
  await check('create-conflict','Erneutes Create prüft identischen Inhalt; abweichender Inhalt wird abgewiesen.',async()=>{
    const before=await fixture('create-retry');await transport.retryCreate(before.id,before.value);
    await rejects(()=>transport.retryCreate(before.id,{...before.value,earned:2000}),'collision');assert(same((await read(before.id)).value,before.value));
  });
  await check('conflict-credit','Konfliktbehaftete Grundlage kann keine synthetische Ausgabe auslösen.',async()=>{
    await rejects(async()=>purchase(initial(),{id:'conflicted',article:'a',price:800,conflicted:true}),'assertion');
    return 'Lokale Proberegel geprüft; Produktledger/Quarantäne noch nicht integriert.';
  });
  return summarize(checks);
}
function summarize(checks,probeScope='full'){return {passed:checks.length>0&&checks.every(c=>c.passed),failed:checks.filter(c=>c.status==='failed').length,unsupported:checks.filter(c=>c.status==='unsupported').length,checks,productReady:false,
  limitations:probeScope==='metadata-coordination'
    ?['Nur neue synthetische Ordner-Metadaten in einem Browser; keine Zwei-Geräte-Abnahme.','Keine JSON-Datei, kein Medieninhalt und kein Produktbestand geprüft.','Keine Kauf-, Wiederanlauf-, Epochen- oder Bereinigungslogik geprüft.','Ein Probe-Erfolg ersetzt keine dokumentierte Servergarantie.']
    :['Zwei logische Clients im selben Browser; keine Zwei-Geräte-Abnahme.','Antwortverlust durch lokales Verwerfen einer Erfolgsantwort; kein echter Leitungsabbruch.','Keine Produktdaten-, Altclient-, Backup- oder Epochenmigration geprüft.','Ein Probe-Erfolg ersetzt keine dokumentierte Servergarantie.']};}
