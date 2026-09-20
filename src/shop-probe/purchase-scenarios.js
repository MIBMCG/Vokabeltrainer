import {createPurchaseCoordinator} from './purchase-coordinator.js';

const CHECKS=[
  ['purchase-init','Zwei Initialisierungen ergeben genau einen bestätigten Kopf und eine 412.'],
  ['purchase-race','Zwei Käufe zu je 800 Punkten ergeben genau einen Besitz und 200 Restpunkte.'],
  ['purchase-idempotency','Ein belegter Auftrag wird nicht erneut geschrieben oder abgezogen.'],
  ['purchase-response-loss','Eine lokal verworfene Erfolgsantwort wird später über die Belegkette wiedergefunden.'],
  ['purchase-reset-first','Ein bestätigter Reset verwirft einen zuvor vorbereiteten Kauf der alten Epoche.'],
  ['purchase-buy-first','Ein bestätigter Kauf verwirft den alten Reset; ein frischer Reset erhält den Kauf historisch.'],
];
const REQUIRED=['createMetadataFolder','readMetadataSnapshot','updateMetadataIfUnchanged','prepareImmutable','writeImmutable','readImmutable'];
const ERROR_CLASSES=new Set(['assertion','auth','binding','collision','conflict','epoch','funds','http','integrity','invalid','limit','missing','network','owned','permission','stale','unsupported']);
const PHASES=new Set(['fixture','setup','prepare','commit','readback','recover','complete']);
const OUTCOMES=new Set(['confirmed','stale','uncertain','rejected','unexpected']);
const COMMIT_PHASES=new Set(['upload','pointer']);
const WRITE_GROUPS=['setupWrites','writes','followupWrites'];
const WRITE_ROLES=new Set(['initialization','client-a','client-b','purchase','purchase-first','purchase-second','reset','old-purchase','old-reset','fresh-reset']);
const BOOLEAN_FIELDS=['markerPreserved','winnerOperationMatched','winnerEpochMatched','loserOperationExcluded','originalInitializationPreserved','ownedArticleMatched','repeatCommitted','noAdditionalUpload','noAdditionalPointerWrite','conflictRejected','simulatedResponseLoss','firstWriteObserved','ancestorRecovered','oldPurchaseRejected','oldEpochPrepareRejected','staleResetRejected','freshResetConfirmed','historicalPurchaseFound','historicalPurchaseActive'];
const COUNT_FIELDS=['receiptCount','ownedCount','spentPoints','remainingPoints'];
const clone=value=>structuredClone(value);
const fail=code=>{throw Object.assign(new Error('purchase scenario'),{code});};
const assert=condition=>{if(!condition)fail('assertion');};
const codeOf=error=>ERROR_CLASSES.has(error?.code)?error.code:'unexpected';
const statusOf=value=>Number.isInteger(value)&&value>=100&&value<=599?value:null;

function safeEvidence(value,checkpoint){
  const result={checkpoint};
  if(PHASES.has(value?.phase))result.phase=value.phase;
  for(const group of WRITE_GROUPS)if(Array.isArray(value?.[group])){
    result[group]=value[group].slice(0,2).map((write,index)=>{
      const item={role:WRITE_ROLES.has(write?.role)?write.role:`client-${index?'b':'a'}`,outcome:OUTCOMES.has(write?.outcome)?write.outcome:'unexpected'};
      if(COMMIT_PHASES.has(write?.phase))item.phase=write.phase;
      if(ERROR_CLASSES.has(write?.code))item.code=write.code;
      const status=statusOf(write?.httpStatus);if(status!==null)item.httpStatus=status;
      return item;
    });
  }
  for(const field of BOOLEAN_FIELDS)if(typeof value?.[field]==='boolean')result[field]=value[field];
  for(const field of COUNT_FIELDS){
    const number=value?.[field],upper=field==='receiptCount'||field==='ownedCount'?64:1000;
    if(Number.isInteger(number)&&number>=0&&number<=upper)result[field]=number;
  }
  return result;
}

function trackedTransport(transport){
  const counts={prepareImmutable:0,writeImmutable:0,updateMetadataIfUnchanged:0};
  const tracked={...transport};
  for(const name of Object.keys(counts))tracked[name]=async(...args)=>{counts[name]++;return transport[name](...args);};
  return {transport:tracked,counts};
}

function commitObservation(result,role){
  const outcome=OUTCOMES.has(result?.outcome)?result.outcome:'unexpected';
  const item={role,outcome};
  if(COMMIT_PHASES.has(result?.phase))item.phase=result.phase;
  if(ERROR_CLASSES.has(result?.code))item.code=result.code;
  const status=statusOf(result?.httpStatus);if(status!==null)item.httpStatus=status;
  return item;
}

function recordCommit(progress,group,result,role){
  progress[group]??=[];
  if(progress[group].length<2)progress[group].push(commitObservation(result,role));
  return result;
}

function requireConfirmed(result){
  if(result?.outcome==='confirmed'&&statusOf(result.httpStatus)>=200&&result.httpStatus<=299)return;
  const error=Object.assign(new Error('purchase commit'),{code:ERROR_CLASSES.has(result?.code)?result.code:result?.outcome==='stale'?'stale':'unexpected'});
  const status=statusOf(result?.httpStatus);if(status!==null)error.status=status;
  throw error;
}

async function observeCommits(progress,entries){
  progress.phase='commit';
  const settled=await Promise.allSettled(entries.map(entry=>entry.commit()));
  const observations=settled.map((result,index)=>result.status==='fulfilled'
    ?commitObservation(result.value,entries[index].role)
    :commitObservation({outcome:codeOf(result.reason)==='stale'?'stale':'unexpected',code:codeOf(result.reason),httpStatus:statusOf(result.reason?.status)},entries[index].role));
  progress.writes=observations;
  return settled.map(result=>result.status==='fulfilled'?result.value:{outcome:codeOf(result.reason),httpStatus:statusOf(result.reason?.status)});
}

function exactRace(results){
  return results.filter(result=>result?.outcome==='confirmed'&&statusOf(result.httpStatus)>=200&&result.httpStatus<=299).length===1
    &&results.filter(result=>result?.outcome==='stale'&&result.httpStatus===412).length===1;
}

function samePreserved(before,after){
  return Object.entries(before).every(([key,value])=>after[key]===value);
}

function sameOperation(left,right){
  if(!left||!right||typeof left!=='object'||typeof right!=='object')return false;
  const leftKeys=Object.keys(left).sort(),rightKeys=Object.keys(right).sort();
  return leftKeys.length===rightKeys.length&&leftKeys.every((key,index)=>key===rightKeys[index]&&left[key]===right[key]);
}

export async function runPurchaseScenarios({transport,emit=()=>{}}={}){
  if(!transport||REQUIRED.some(name=>typeof transport[name]!=='function'))throw new TypeError('Unsupported probe scope');
  const tracked=trackedTransport(transport),checks=[];
  let root=null,rootError=null;
  try{root=await tracked.transport.createMetadataFolder({name:'immutable-purchases'});}
  catch(error){rootError=error;}

  async function runCheck([id,expected],scenario){
    const progress={phase:'fixture'};
    let result;
    try{
      if(rootError)throw rootError;
      const anchor=await tracked.transport.createMetadataFolder({parentId:root.id,name:`${id}-anchor`});
      const content=await tracked.transport.createMetadataFolder({parentId:root.id,name:`${id}-content`});
      progress.phase='setup';
      const before=await tracked.transport.readMetadataSnapshot(anchor.id);
      const markerWrite=await tracked.transport.updateMetadataIfUnchanged(before,{preservationMarker:'preserve-me'});
      assert(statusOf(markerWrite?.status)!==null&&markerWrite.status>=200&&markerWrite.status<=299);
      const marked=await tracked.transport.readMetadataSnapshot(anchor.id);
      assert(marked.properties.preservationMarker==='preserve-me'&&samePreserved(before.properties,marked.properties));
      await scenario({anchorId:anchor.id,contentParentId:content.id,progress,marked});
      progress.phase='complete';
      result={id,expected,passed:true,status:'passed',actual:safeEvidence(progress,id)};
    }catch(error){
      const code=codeOf(error),httpStatus=statusOf(error?.status);
      result={id,expected,passed:false,status:code==='unsupported'?'unsupported':'failed',actual:code,evidence:safeEvidence(progress,id),...(httpStatus===null?{}:{httpStatus})};
    }
    checks.push(result);emit(clone(result));
  }

  const coordinator=({anchorId,contentParentId},override=tracked.transport)=>createPurchaseCoordinator({transport:override,anchorId,contentParentId});
  const init=async(context,suffix)=>{
    const operation={kind:'init',id:`init-${suffix}`,epoch:`epoch-${suffix}`,earned:1000};
    const instance=coordinator(context),prepared=await instance.prepare(operation);
    assert(prepared.outcome==='prepared');
    const committed=recordCommit(context.progress,'setupWrites',await instance.commit(prepared.ticket),'initialization');
    requireConfirmed(committed);
    return {instance,operation};
  };
  const finishRead=async(context,progress,marked)=>{
    progress.phase='readback';
    const current=await coordinator(context).read();
    progress.markerPreserved=samePreserved(marked.properties,current.snapshot.properties);
    assert(progress.markerPreserved);
    return current;
  };

  await runCheck(CHECKS[0],async context=>{
    const operationA={kind:'init',id:'init-a',epoch:'epoch-a',earned:1000};
    const operationB={kind:'init',id:'init-b',epoch:'epoch-b',earned:1000};
    const a=coordinator(context),b=coordinator(context);
    context.progress.phase='prepare';
    const [preparedA,preparedB]=await Promise.all([a.prepare(operationA),b.prepare(operationB)]);
    const results=await observeCommits(context.progress,[
      {role:'client-a',commit:()=>a.commit(preparedA.ticket)},
      {role:'client-b',commit:()=>b.commit(preparedB.ticket)},
    ]);
    assert(exactRace(results));
    const operations=[operationA,operationB],winnerIndex=results.findIndex(result=>result?.outcome==='confirmed'),loserIndex=winnerIndex===0?1:0;
    const current=await finishRead(context,context.progress,context.marked);
    context.progress.receiptCount=current.state.receipts.length;
    context.progress.remainingPoints=current.state.earned-current.state.spent;
    context.progress.winnerOperationMatched=current.state.receipts.length===1&&sameOperation(current.state.receipts[0],operations[winnerIndex]);
    context.progress.winnerEpochMatched=current.state.epoch===operations[winnerIndex].epoch;
    context.progress.loserOperationExcluded=!current.state.receipts.some(receipt=>sameOperation(receipt,operations[loserIndex]));
    assert(context.progress.winnerOperationMatched&&context.progress.winnerEpochMatched&&context.progress.loserOperationExcluded
      &&current.state.spent===0&&current.state.owned.length===0);
  });

  await runCheck(CHECKS[1],async context=>{
    const {operation}=await init(context,'race');
    const a=coordinator(context),b=coordinator(context);
    const purchaseA={kind:'purchase',id:'buy-race-a',epoch:operation.epoch,article:'dragon-race-a',price:800};
    const purchaseB={kind:'purchase',id:'buy-race-b',epoch:operation.epoch,article:'dragon-race-b',price:800};
    context.progress.phase='prepare';
    const [preparedA,preparedB]=await Promise.all([a.prepare(purchaseA),b.prepare(purchaseB)]);
    const results=await observeCommits(context.progress,[
      {role:'client-a',commit:()=>a.commit(preparedA.ticket)},
      {role:'client-b',commit:()=>b.commit(preparedB.ticket)},
    ]);
    assert(exactRace(results));
    const operations=[purchaseA,purchaseB],winnerIndex=results.findIndex(result=>result?.outcome==='confirmed'),loserIndex=winnerIndex===0?1:0;
    const current=await finishRead(context,context.progress,context.marked);
    context.progress.receiptCount=current.state.receipts.length;
    context.progress.ownedCount=current.state.owned.length;
    context.progress.remainingPoints=current.state.earned-current.state.spent;
    context.progress.originalInitializationPreserved=sameOperation(current.state.receipts[0],operation);
    context.progress.winnerOperationMatched=current.state.receipts.length===2&&sameOperation(current.state.receipts[1],operations[winnerIndex]);
    context.progress.winnerEpochMatched=current.state.epoch===operations[winnerIndex].epoch;
    context.progress.loserOperationExcluded=!current.state.receipts.some(receipt=>sameOperation(receipt,operations[loserIndex]));
    context.progress.ownedArticleMatched=current.state.owned.length===1&&current.state.owned[0]===operations[winnerIndex].article;
    assert(context.progress.originalInitializationPreserved&&context.progress.winnerOperationMatched&&context.progress.winnerEpochMatched
      &&context.progress.loserOperationExcluded&&context.progress.ownedArticleMatched&&current.state.spent===800);
  });

  await runCheck(CHECKS[2],async context=>{
    const {operation:initOperation}=await init(context,'idempotency');
    const operation={kind:'purchase',id:'buy-idempotent',epoch:initOperation.epoch,article:'dragon-idempotent',price:200};
    const instance=coordinator(context),prepared=await instance.prepare(operation);
    context.progress.phase='commit';
    const committed=recordCommit(context.progress,'writes',await instance.commit(prepared.ticket),'purchase');
    requireConfirmed(committed);
    const before={...tracked.counts};
    const repeat=await instance.prepare(operation);
    context.progress.repeatCommitted=repeat.outcome==='committed'&&repeat.active===true;
    try{await instance.prepare({...operation,article:'dragon-conflict',price:400});}
    catch(error){context.progress.conflictRejected=error?.code==='conflict';}
    context.progress.noAdditionalUpload=tracked.counts.writeImmutable===before.writeImmutable;
    context.progress.noAdditionalPointerWrite=tracked.counts.updateMetadataIfUnchanged===before.updateMetadataIfUnchanged;
    assert(context.progress.repeatCommitted&&context.progress.conflictRejected&&context.progress.noAdditionalUpload&&context.progress.noAdditionalPointerWrite);
    const current=await finishRead(context,context.progress,context.marked);
    context.progress.spentPoints=current.state.spent;context.progress.ownedCount=current.state.owned.length;
    assert(current.state.spent===200&&current.state.owned.length===1);
  });

  await runCheck(CHECKS[3],async context=>{
    const {operation:initOperation}=await init(context,'loss');
    let discard=true,observed=false;
    const lossy={...tracked.transport,async updateMetadataIfUnchanged(before,properties){
      const response=await tracked.transport.updateMetadataIfUnchanged(before,properties);
      if(discard&&properties?.purchaseProtocol==='1'){discard=false;observed=true;throw Object.assign(new Error('discarded locally'),{code:'network'});}
      return response;
    }};
    const firstOperation={kind:'purchase',id:'buy-loss-first',epoch:initOperation.epoch,article:'dragon-loss-first',price:400};
    const first=coordinator(context,lossy),firstPrepared=await first.prepare(firstOperation);
    context.progress.phase='commit';
    const firstResult=recordCommit(context.progress,'writes',await first.commit(firstPrepared.ticket),'purchase-first');
    context.progress.simulatedResponseLoss=true;context.progress.firstWriteObserved=observed&&firstResult.outcome==='uncertain'&&firstResult.phase==='pointer';
    assert(context.progress.firstWriteObserved);
    const secondOperation={kind:'purchase',id:'buy-loss-second',epoch:initOperation.epoch,article:'dragon-loss-second',price:200};
    const second=coordinator(context),secondPrepared=await second.prepare(secondOperation);
    const secondResult=recordCommit(context.progress,'writes',await second.commit(secondPrepared.ticket),'purchase-second');
    requireConfirmed(secondResult);
    context.progress.phase='recover';
    const fresh=coordinator(context),recovered=await fresh.recover(firstOperation);
    context.progress.ancestorRecovered=recovered.outcome==='committed'&&recovered.active===true;
    context.progress.spentPoints=recovered.state.spent;context.progress.ownedCount=recovered.state.owned.length;context.progress.receiptCount=recovered.state.receipts.length;
    const current=await finishRead(context,context.progress,context.marked);
    assert(context.progress.ancestorRecovered&&current.state.spent===600&&current.state.owned.length===2&&current.state.receipts.length===3);
  });

  await runCheck(CHECKS[4],async context=>{
    const {operation:initOperation}=await init(context,'reset-first');
    const oldPurchase={kind:'purchase',id:'buy-old-prepared',epoch:initOperation.epoch,article:'dragon-old-prepared',price:800};
    const reset={kind:'reset',id:'reset-first',epoch:initOperation.epoch,nextEpoch:'epoch-after-reset-first',earned:1000};
    const buyer=coordinator(context),resetter=coordinator(context);
    context.progress.phase='prepare';
    const [buyPrepared,resetPrepared]=await Promise.all([buyer.prepare(oldPurchase),resetter.prepare(reset)]);
    context.progress.phase='commit';
    const resetResult=recordCommit(context.progress,'writes',await resetter.commit(resetPrepared.ticket),'reset');
    const buyResult=recordCommit(context.progress,'writes',await buyer.commit(buyPrepared.ticket),'old-purchase');
    context.progress.oldPurchaseRejected=buyResult.outcome==='stale'&&buyResult.httpStatus===412;
    assert(resetResult.outcome==='confirmed'&&context.progress.oldPurchaseRejected);
    const fresh=coordinator(context);
    try{await fresh.prepare({kind:'purchase',id:'buy-old-late',epoch:initOperation.epoch,article:'dragon-old-late',price:200});}
    catch(error){context.progress.oldEpochPrepareRejected=error?.code==='epoch';}
    assert(context.progress.oldEpochPrepareRejected);
    const current=await finishRead(context,context.progress,context.marked);
    context.progress.remainingPoints=current.state.earned-current.state.spent;context.progress.ownedCount=current.state.owned.length;
    assert(current.state.epoch===reset.nextEpoch&&current.state.spent===0&&current.state.owned.length===0);
  });

  await runCheck(CHECKS[5],async context=>{
    const {operation:initOperation}=await init(context,'buy-first');
    const purchase={kind:'purchase',id:'buy-before-reset',epoch:initOperation.epoch,article:'dragon-before-reset',price:200};
    const reset={kind:'reset',id:'reset-after-buy',epoch:initOperation.epoch,nextEpoch:'epoch-after-buy',earned:1000};
    const buyer=coordinator(context),resetter=coordinator(context);
    context.progress.phase='prepare';
    const [buyPrepared,resetPrepared]=await Promise.all([buyer.prepare(purchase),resetter.prepare(reset)]);
    context.progress.phase='commit';
    const buyResult=recordCommit(context.progress,'writes',await buyer.commit(buyPrepared.ticket),'purchase');
    const oldResetResult=recordCommit(context.progress,'writes',await resetter.commit(resetPrepared.ticket),'old-reset');
    context.progress.staleResetRejected=oldResetResult.outcome==='stale'&&oldResetResult.httpStatus===412;
    assert(buyResult.outcome==='confirmed'&&context.progress.staleResetRejected);
    const freshResetter=coordinator(context),freshPrepared=await freshResetter.prepare(reset);
    const freshResult=recordCommit(context.progress,'followupWrites',await freshResetter.commit(freshPrepared.ticket),'fresh-reset');
    context.progress.freshResetConfirmed=freshResult.outcome==='confirmed';assert(context.progress.freshResetConfirmed);
    context.progress.phase='recover';
    const recovered=await coordinator(context).recover(purchase);
    context.progress.historicalPurchaseFound=recovered.outcome==='committed';
    context.progress.historicalPurchaseActive=recovered.active;
    context.progress.remainingPoints=recovered.state.earned-recovered.state.spent;context.progress.ownedCount=recovered.state.owned.length;context.progress.receiptCount=recovered.state.receipts.length;
    const current=await finishRead(context,context.progress,context.marked);
    assert(context.progress.historicalPurchaseFound&&!context.progress.historicalPurchaseActive&&current.state.epoch===reset.nextEpoch&&current.state.spent===0&&current.state.owned.length===0);
  });

  return {passed:checks.every(check=>check.passed),failed:checks.filter(check=>check.status==='failed').length,
    unsupported:checks.filter(check=>check.status==='unsupported').length,checks,productReady:false,
    limitations:['Zwei logische Clients im selben Browser; keine Zwei-Geräte-Abnahme.','Antwortverlust wird nur durch lokales Verwerfen einer bestätigten Antwort simuliert.','Keine Produktdaten, Altclients, dauerhafte Auftragsabsicht, Backups oder Migration geprüft.','Ein Probe-Erfolg ersetzt keine dokumentierte Servergarantie.']};
}
