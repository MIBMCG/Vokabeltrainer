import test from 'node:test';
import assert from 'node:assert/strict';
import {createPurchaseService} from '../../src/trainer/purchases/service.js';
import {createCommands,productStateHash} from '../../src/trainer/commands.js';
import {ProductError} from '../../src/trainer/model/errors.js';
import {packBasis} from '../../src/trainer/purchases/basis.js';
import {emptyCommerce} from '../../src/trainer/purchases/schema.js';
import {digest} from '../../src/trainer/purchases/value.js';
import {earnedLedger,receipt,rebindLedger,BINDING} from './purchases-fixtures.js';
import {memoryStore,productState,sequenceIds} from './backup-fixtures.js';
import {createFixture} from './fixtures.js';

const CONFIG={
  version:1,kind:'purchase-config',binding:BINDING,descriptorHash:'a'.repeat(64),
  coordinatorId:'coordinator-a',contentFolderId:'content-a',
};

class PurchaseRemote {
  constructor(server=null) {
    this.binding=structuredClone(BINDING);this.descriptorHash=CONFIG.descriptorHash;
    this.server=server??{files:new Map(),next:0,putCalls:[],writeCalls:[],coordinator:{
      id:CONFIG.coordinatorId,name:'coordinator',mimeType:'application/vnd.google-apps.folder',
      parents:[BINDING.folderId],version:'1',etag:'"head-1"',
      properties:{
        app:'vokabeltrainer-purchases',kind:'coordinator',datasetId:BINDING.datasetId,
        descriptorFileId:BINDING.descriptorFileId,descriptorHash:CONFIG.descriptorHash,
        coordinatorId:CONFIG.coordinatorId,contentFolderId:CONFIG.contentFolderId,
      },
    }};
  }
  get files(){return this.server.files;}
  get coordinator(){return this.server.coordinator;}
  get putCalls(){return this.server.putCalls;}
  get writeCalls(){return this.server.writeCalls;}
  get next(){return this.server.next;}
  set next(value){this.server.next=value;}
  get pointerFailure(){return this.server.pointerFailure??null;}
  set pointerFailure(value){this.server.pointerFailure=value;}
  get writeFailure(){return this.server.writeFailure??false;}
  set writeFailure(value){this.server.writeFailure=value;}
  get afterPointer(){return this.server.afterPointer;}
  set afterPointer(value){this.server.afterPointer=value;}
  get offline(){return this.server.offline??false;}
  set offline(value){this.server.offline=value;}
  async reserveId(){return `reserved-${++this.server.next}`;}
  async readFolder({id}){
    if(this.offline)throw new ProductError('network','synthetic offline');
    if(id!==CONFIG.coordinatorId)throw new ProductError('binding','wrong folder');
    return structuredClone(this.coordinator);
  }
  async readImmutable(ref){
    if(!this.files.has(ref.id))throw new ProductError('network','missing synthetic content');
    return structuredClone(this.files.get(ref.id));
  }
  async writeImmutable({ref,value}){
    this.writeCalls.push(ref.id);
    if(this.writeFailure){this.writeFailure=false;throw new ProductError('network','synthetic upload loss');}
    if(await digest(value)!==ref.sha256)throw new ProductError('integrity','changed synthetic upload');
    this.files.set(ref.id,structuredClone(value));return structuredClone(value);
  }
  async putPointer({head,authorization}){
    const source=authorization.kind==='attempt'
      ? authorization.commerce.jobs.find(job=>job.intent.operationId===authorization.operationId)
        .attempts.find(attempt=>attempt.attemptId===authorization.attemptId)
      : authorization.commerce.control;
    this.putCalls.push({etag:source.etag,properties:structuredClone(source.pointerProperties),head:structuredClone(head)});
    if(this.pointerFailure==='stale')throw new ProductError('stale','synthetic stale ETag');
    if(this.pointerFailure==='before')throw new ProductError('network','synthetic request loss');
    this.coordinator.properties=structuredClone(source.pointerProperties);
    this.coordinator.version=String(Number(this.coordinator.version)+1);
    this.coordinator.etag=`"head-${this.coordinator.version}"`;
    if(this.afterPointer)this.afterPointer();
    if(this.pointerFailure==='after')throw new ProductError('network','synthetic response loss');
    return {id:this.coordinator.id,status:200};
  }
}

async function seedRemote(remote,ledger=earnedLedger()){
  const bundle=await packBasis(ledger,async()=>`seed-${++remote.next}`);
  const value=receipt({basis:bundle.ref,coordinatorId:CONFIG.coordinatorId});
  const ref={id:'seed-receipt',sha256:await digest(value)};
  for(const entry of [...bundle.parts,{ref:bundle.ref,value:bundle.manifest},{ref,value}])remote.files.set(entry.ref.id,structuredClone(entry.value));
  remote.coordinator.properties.purchaseHeadId=ref.id;
  remote.coordinator.properties.purchaseHeadSha256=ref.sha256;
  return ref;
}

async function openHarness({store,remote,ids=sequenceIds('purchase')}={}){
  store??=memoryStore(productState(earnedLedger()));remote??=new PurchaseRemote();
  const commands=await createCommands({store,now:()=>new Date('2026-09-21T10:00:00Z'),id:sequenceIds('command'),deviceId:'dev1',onChange(){}});
  let head=remote.coordinator.properties.purchaseHeadId?{
    id:remote.coordinator.properties.purchaseHeadId,sha256:remote.coordinator.properties.purchaseHeadSha256,
  }:await seedRemote(remote,commands.getState().ledger);
  if(commands.getState().commerce.mode==='inactive'){
    const next=commands.getState(),commerce=emptyCommerce();
    commerce.mode='active';commerce.binding=BINDING;commerce.config=CONFIG;
    commerce.configRef={id:'config-a',sha256:await digest(CONFIG)};commerce.head=head;
    next.binding=structuredClone(BINDING);next.commerce=commerce;next.outboxEventIds=[];next.pendingPackets=[];
    await commands.commitExternal(next,await productStateHash(commands.getState()));
  }
  const statuses=[];
  const service=createPurchaseService({commands,transport:remote,sync:learningSync(commands),now:()=>new Date('2026-09-21T10:00:00Z'),id:ids,onStatus:s=>statuses.push(s)});
  return {store,remote,commands,service,statuses};
}

function learningSync(commands) {
  return {
    async syncLearning() {
      const state=commands.getState();
      if(state.outboxEventIds.length>0||state.pendingPackets.length>0) {
        const next=structuredClone(state);next.outboxEventIds=[];next.pendingPackets=[];
        await commands.commitExternal(next,await productStateHash(state));
      }
      return {phase:'synced'};
    },
  };
}

function byteStore(initial) {
  let bytes=initial===null?null:JSON.stringify(initial);
  let reject=null;
  return {
    async load(){return bytes===null?null:JSON.parse(bytes);},
    async save(next){
      const previous=bytes===null?null:JSON.parse(bytes);
      if(reject?.(next,previous)) { reject=null;throw new Error('synthetic durable save failure'); }
      bytes=JSON.stringify(next);
    },
    snapshot(){return bytes===null?null:JSON.parse(bytes);},
    failWhen(predicate){reject=predicate;},
  };
}

async function restartHarness(harness,{ids=sequenceIds('fresh-restart')}={}) {
  const store=byteStore(harness.store.snapshot());
  const remote=new PurchaseRemote(harness.remote.server);
  const reopened=await openHarness({store,remote,ids});
  assert.notEqual(reopened.store,harness.store);
  assert.notEqual(reopened.remote,harness.remote);
  assert.equal(reopened.remote.server,harness.remote.server);
  return reopened;
}

function activationPorts(commands,remote) {
  const calls={prepared:0,applied:0,sawPersistedIntent:false};
  return {
    ...learningSync(commands),
    calls,
    async prepareActivationCandidate({state,control,reserve}) {
      calls.prepared+=1;
      calls.sawPersistedIntent=commands.getState().commerce.control?.phase==='intent';
      const bundle=await packBasis(state.ledger,()=>reserve());
      const value=receipt({
        coordinatorId:CONFIG.coordinatorId,basis:bundle.ref,
        operationId:control.operationId,epochId:'e0',
      });
      const candidate={id:await reserve(),sha256:await digest(value)};
      return {epochId:'e0',candidate,uploads:[...bundle.parts,{ref:bundle.ref,value:bundle.manifest},{ref:candidate,value}]};
    },
    async applyConfirmedControl({state,control,history}) {
      calls.applied+=1;
      assert.equal(control.phase,'confirmed');
      assert.equal(history.projection.receipts.at(-1).operationId,control.operationId);
      return state;
    },
  };
}

function restorePorts(commands) {
  const calls={prepared:0,applied:0,sawPersistedIntent:false};
  return {
    ...learningSync(commands),
    calls,
    async prepareRestoreCandidate({state,control,history,reserve}) {
      calls.prepared+=1;
      calls.sawPersistedIntent=commands.getState().commerce.control?.phase==='intent';
      assert.equal(history.projection.head.id,state.commerce.head.id);
      const ledger=earnedLedger({epochId:'e1'});
      const bundle=await packBasis(ledger,()=>reserve());
      const value=receipt({
        coordinatorId:CONFIG.coordinatorId,sequence:history.projection.sequence+1,
        previous:state.commerce.head,operationId:control.operationId,operation:'restore',
        epochId:'e1',basis:bundle.ref,intent:null,
        economy:{version:1,kind:'economic-snapshot',source:null},
      });
      const candidate={id:await reserve(),sha256:await digest(value)};
      return {epochId:'e1',candidate,uploads:[...bundle.parts,{ref:bundle.ref,value:bundle.manifest},{ref:candidate,value}]};
    },
    async applyConfirmedControl({state,control,history}) {
      calls.applied+=1;
      const basis=history.bases.find(entry=>entry.ref.id===history.projection.basis.id);
      state.ledger=structuredClone(basis.ledger);
      state.outboxEventIds=[];
      state.clock=Math.max(state.clock,...state.ledger.events.map(entry=>entry.clock),...state.ledger.epochs.map(entry=>entry.clock));
      return state;
    },
  };
}

async function migratingHarness({remote=new PurchaseRemote(),store=memoryStore(productState(earnedLedger())),ids=sequenceIds('control')}={}) {
  const commands=await createCommands({store,now:()=>new Date('2026-09-21T10:00:00Z'),id:sequenceIds('command'),deviceId:'dev1',onChange(){}});
  if(commands.getState().commerce.mode==='inactive') {
    const next=commands.getState(),commerce=emptyCommerce();
    commerce.mode='migrating';commerce.binding=BINDING;commerce.config=CONFIG;
    commerce.configRef={id:'config-a',sha256:await digest(CONFIG)};
    commerce.setup={
      version:1,operationId:'setup-a',phase:'confirmed',binding:BINDING,
      descriptorHash:CONFIG.descriptorHash,coordinatorId:CONFIG.coordinatorId,
      contentFolderId:CONFIG.contentFolderId,configRef:commerce.configRef,config:CONFIG,
      etag:null,pointerProperties:null,
    };
    next.binding=structuredClone(BINDING);next.commerce=commerce;next.outboxEventIds=[];next.pendingPackets=[];
    await commands.commitExternal(next,await productStateHash(commands.getState()));
  }
  const sync=activationPorts(commands,remote);
  const service=createPurchaseService({commands,transport:remote,sync,now:()=>new Date('2026-09-21T10:00:00Z'),id:ids,onStatus(){}});
  return {remote,store,commands,sync,service};
}

async function restoreHarness({remote=new PurchaseRemote(),store=memoryStore(productState(earnedLedger())),ids=sequenceIds('restore')}={}) {
  const base=await openHarness({remote,store,ids});
  const sync=restorePorts(base.commands);
  const service=createPurchaseService({commands:base.commands,transport:remote,sync,
    now:()=>new Date('2026-09-21T10:00:00Z'),id:ids,onStatus(){}});
  return {...base,sync,service};
}

test('purchase service rejects creation without the durable command boundary', () => {
  assert.throws(() => createPurchaseService({}), {code: 'invalid'});
});

test('a confirmed purchase survives completely new command and service objects',async()=>{
  const first=await openHarness();
  const preview=await first.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  const confirmed=await first.service.confirm(preview);
  assert.equal(confirmed.status,'confirmed');
  assert.equal(first.remote.putCalls.length,1);

  const reopened=await openHarness({store:first.store,remote:first.remote,ids:sequenceIds('reopened')});
  await reopened.service.refresh();
  const job=reopened.commands.getState().commerce.jobs.find(entry=>entry.intent.operationId===confirmed.operationId);
  assert.equal(job.status,'confirmed');
  assert.equal((await reopened.service.getView()).accounts.p1.spentPoints,200);
  assert.equal(first.remote.putCalls.length,1);
});

test('a storage failure before reservation prevents the dependent network write',async()=>{
  const base=memoryStore(productState(earnedLedger()));
  let fail=false;
  const store={
    load:()=>base.load(),
    async save(next){if(fail){fail=false;throw new Error('synthetic full storage');}return base.save(next);},
    snapshot:()=>base.snapshot(),
  };
  const harness=await openHarness({store});
  const preview=await harness.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  fail=true;
  await assert.rejects(harness.service.confirm(preview),{code:'storage'});
  assert.equal(harness.remote.writeCalls.length,0);
  assert.equal(harness.remote.putCalls.length,0);
});

test('pointer success without local completion is confirmed after restart without a second PUT',async()=>{
  const base=memoryStore(productState(earnedLedger()));let fail=false;
  const store={
    load:()=>base.load(),
    async save(next){if(fail){fail=false;throw new Error('synthetic post-pointer storage loss');}return base.save(next);},
    snapshot:()=>base.snapshot(),
  };
  const harness=await openHarness({store});
  harness.remote.afterPointer=()=>{fail=true;};
  const preview=await harness.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  await assert.rejects(harness.service.confirm(preview),{code:'storage'});
  assert.equal(harness.remote.putCalls.length,1);
  harness.remote.afterPointer=null;
  const reopened=await openHarness({store,remote:harness.remote,ids:sequenceIds('post-pointer')});
  await reopened.service.refresh();
  assert.equal(reopened.commands.getState().commerce.jobs[0].status,'confirmed');
  assert.equal(harness.remote.putCalls.length,1);
});

test('fresh store, transport, commands, service and sync recover every purchase persistence cutpoint',async(t)=>{
  const cases=[
    {fail:'intent',persisted:null},
    {fail:'reserved',persisted:'intent'},
    {fail:'uploaded',persisted:'reserved'},
    {fail:'pointer-pending',persisted:'uploaded'},
  ];
  for(const entry of cases)await t.test(entry.fail,async()=>{
    const store=byteStore(productState(earnedLedger())),remote=new PurchaseRemote();
    const harness=await openHarness({store,remote,ids:sequenceIds(`cut-${entry.fail}`)});
    const preview=await harness.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
    const beforePuts=remote.putCalls.length;
    store.failWhen(next=>next.commerce.jobs.at(-1)?.attempts.at(-1)?.phase===entry.fail);

    await assert.rejects(harness.service.confirm(preview),{code:'storage'});

    const persisted=store.snapshot().commerce.jobs.at(-1)??null;
    assert.equal(persisted?.attempts.at(-1)?.phase??null,entry.persisted);
    assert.equal(remote.putCalls.length,beforePuts);
    if(entry.fail==='intent')return;
    const operationId=persisted.intent.operationId;
    const reopened=await restartHarness(harness,{ids:sequenceIds(`resume-${entry.fail}`)});
    const result=await reopened.service.resume(operationId);
    assert.equal(result.status,'confirmed');
    assert.equal(remote.putCalls.length,beforePuts+1);
  });

  await t.test('reconciling and confirmed',async()=>{
    const store=byteStore(productState(earnedLedger())),remote=new PurchaseRemote();
    const harness=await openHarness({store,remote,ids:sequenceIds('cut-reconciling')});
    const preview=await harness.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
    store.failWhen(next=>next.commerce.jobs.at(-1)?.attempts.at(-1)?.phase==='reconciling');
    await assert.rejects(harness.service.confirm(preview),{code:'storage'});
    assert.equal(remote.putCalls.length,1);
    const operationId=store.snapshot().commerce.jobs[0].intent.operationId;
    const reopened=await restartHarness(harness,{ids:sequenceIds('resume-reconciling')});
    await reopened.service.refresh();
    assert.equal(reopened.commands.getState().commerce.jobs[0].status,'confirmed');
    assert.equal(remote.putCalls.length,1);

    const confirmedStore=byteStore(reopened.store.snapshot());
    const confirmedRemote=new PurchaseRemote(remote.server);
    const confirmed=await openHarness({store:confirmedStore,remote:confirmedRemote,ids:sequenceIds('confirmed-save')});
    const state=confirmed.commands.getState(),next=structuredClone(state);
    next.commerce.jobs[0].status='open';next.commerce.jobs[0].attempts[0].phase='reconciling';
    await confirmed.commands.commitExternal(next,await productStateHash(state));
    confirmedStore.failWhen(value=>value.commerce.jobs[0].status==='confirmed');
    await assert.rejects(confirmed.service.refresh(),{code:'storage'});
    assert.equal(remote.putCalls.length,1);
    const final=await restartHarness(confirmed,{ids:sequenceIds('resume-confirmed-save')});
    await final.service.refresh();
    assert.equal(final.commands.getState().commerce.jobs[0].status,'confirmed');
    assert.equal(remote.putCalls.length,1);
    assert.equal(final.commands.getState().commerce.jobs[0].intent.operationId,operationId);
  });
});

test('response loss is recovered from history after a later purchase without another old pointer write',async()=>{
  const first=await openHarness();
  first.remote.pointerFailure='after';
  const preview=await first.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  await assert.rejects(first.service.confirm(preview),{code:'network'});
  assert.equal(first.service.getStatus().code,'network');
  const original=first.commands.getState().commerce.jobs[0];
  const operationId=original.intent.operationId;
  assert.equal(original.attempts[0].phase,'reconciling');

  first.remote.pointerFailure=null;
  const otherStore=memoryStore(productState(earnedLedger()));
  const other=await openHarness({store:otherStore,remote:first.remote,ids:sequenceIds('other')});
  const later=await other.service.preview({profileId:'p2',articleId:'evolution:explorer-girl:2'});
  await other.service.confirm(later);
  assert.equal(first.remote.putCalls.length,2);

  const reopened=await openHarness({store:first.store,remote:first.remote,ids:sequenceIds('recovery')});
  const result=await reopened.service.resume(operationId);
  assert.equal(result.status,'confirmed');
  assert.equal(first.remote.putCalls.length,2);
});

test('fresh-process purchase recovery keeps every ambiguous network outcome read-only until explicit resume',async(t)=>{
  await t.test('immutable upload',async()=>{
    const store=byteStore(productState(earnedLedger())),remote=new PurchaseRemote();
    const harness=await openHarness({store,remote,ids:sequenceIds('purchase-upload-loss')});
    const preview=await harness.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
    remote.writeFailure=true;
    await assert.rejects(harness.service.confirm(preview),{code:'network'});
    const saved=store.snapshot().commerce.jobs[0];
    assert.equal(saved.attempts[0].phase,'reserved');assert.equal(remote.putCalls.length,0);
    const fresh=await restartHarness(harness,{ids:sequenceIds('purchase-upload-fresh')});
    const result=await fresh.service.resume(saved.intent.operationId);
    assert.equal(result.status,'confirmed');assert.equal(remote.putCalls.length,1);
  });

  await t.test('pointer request loss',async()=>{
    const store=byteStore(productState(earnedLedger())),remote=new PurchaseRemote();
    const harness=await openHarness({store,remote,ids:sequenceIds('purchase-before-loss')});
    const preview=await harness.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
    remote.pointerFailure='before';
    await assert.rejects(harness.service.confirm(preview),{code:'network'});
    const saved=store.snapshot().commerce.jobs[0],attempt=saved.attempts[0];
    const fresh=await restartHarness(harness,{ids:sequenceIds('purchase-before-fresh')});
    await fresh.service.refresh();assert.equal(remote.putCalls.length,1);
    remote.pointerFailure=null;
    const result=await fresh.service.resume(saved.intent.operationId);
    assert.equal(result.status,'confirmed');assert.equal(remote.putCalls.length,2);
    assert.equal(remote.putCalls[1].etag,attempt.etag);
    assert.deepEqual(remote.putCalls[1].properties,attempt.pointerProperties);
  });

  await t.test('pointer response loss',async()=>{
    const store=byteStore(productState(earnedLedger())),remote=new PurchaseRemote();
    const harness=await openHarness({store,remote,ids:sequenceIds('purchase-after-loss')});
    const preview=await harness.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
    remote.pointerFailure='after';
    await assert.rejects(harness.service.confirm(preview),{code:'network'});
    remote.pointerFailure=null;
    const fresh=await restartHarness(harness,{ids:sequenceIds('purchase-after-fresh')});
    await fresh.service.refresh();
    assert.equal(fresh.commands.getState().commerce.jobs[0].status,'confirmed');
    assert.equal(remote.putCalls.length,1);
  });
});

test('restart refresh stays read-only and explicit resume repeats the exact saved pointer body and ETag',async()=>{
  const first=await openHarness();
  first.remote.pointerFailure='before';
  const preview=await first.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  await assert.rejects(first.service.confirm(preview),{code:'network'});
  const saved=first.commands.getState().commerce.jobs[0];
  const attempt=saved.attempts[0];
  assert.equal(attempt.phase,'reconciling');
  assert.equal(first.remote.putCalls.length,1);

  const reopened=await openHarness({store:first.store,remote:first.remote,ids:sequenceIds('resume')});
  await reopened.service.refresh();
  assert.equal(first.remote.putCalls.length,1);
  first.remote.pointerFailure=null;
  const result=await reopened.service.resume(saved.intent.operationId);
  assert.equal(result.status,'confirmed');
  assert.equal(first.remote.putCalls.length,2);
  assert.equal(first.remote.putCalls[1].etag,attempt.etag);
  assert.deepEqual(first.remote.putCalls[1].properties,attempt.pointerProperties);
  assert.deepEqual(first.remote.putCalls[1].head,attempt.candidate);
});

test('a stale preview and a second purchase of owned content create no durable charge',async()=>{
  const harness=await openHarness();
  const stale=await harness.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  await harness.commands.setAnimations({profileId:'p1',animations:false});
  await assert.rejects(harness.service.confirm(stale),{code:'stale'});
  assert.equal(harness.commands.getState().commerce.jobs.length,0);
  assert.equal(harness.remote.writeCalls.length,0);

  const fresh=await harness.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  await harness.service.confirm(fresh);
  const writes=harness.remote.writeCalls.length;
  await assert.rejects(
    harness.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'}),
    {code:'entitlement'},
  );
  assert.equal(harness.remote.writeCalls.length,writes);
  assert.equal(harness.commands.getState().commerce.jobs.length,1);
});

test('activation persists its control intent before candidate preparation and publishes only on explicit confirmation',async()=>{
  const harness=await migratingHarness();
  const prepared=await harness.service.prepareActivation();
  assert.equal(prepared.phase,'pointer-pending');
  assert.equal(harness.sync.calls.sawPersistedIntent,true);
  assert.equal(harness.remote.putCalls.length,0);

  const freshCommands=await createCommands({store:harness.store,now:()=>new Date('2026-09-21T10:00:00Z'),id:sequenceIds('fresh-command'),deviceId:'dev1',onChange(){}});
  const freshSync=activationPorts(freshCommands,harness.remote);
  const fresh=createPurchaseService({commands:freshCommands,transport:harness.remote,sync:freshSync,
    now:()=>new Date('2026-09-21T10:00:00Z'),id:sequenceIds('fresh-control'),onStatus(){}});
  await fresh.refresh();
  assert.equal(harness.remote.putCalls.length,0);
  const confirmed=await fresh.confirmActivation(prepared.operationId);
  assert.equal(confirmed.phase,'confirmed');
  assert.equal(freshCommands.getState().commerce.mode,'active');
  assert.equal(freshSync.calls.applied,1);
  assert.equal(harness.remote.putCalls.length,1);
});

test('activation resumes its exact reserved closure after an upload failure and restart',async()=>{
  const harness=await migratingHarness();
  harness.remote.writeFailure=true;
  await assert.rejects(harness.service.prepareActivation(),{code:'network'});
  const saved=harness.commands.getState().commerce.control;
  assert.equal(saved.phase,'reserved');
  assert.equal(harness.remote.putCalls.length,0);

  const commands=await createCommands({store:harness.store,now:()=>new Date('2026-09-21T10:00:00Z'),id:sequenceIds('restart-command'),deviceId:'dev1',onChange(){}});
  const sync=activationPorts(commands,harness.remote);
  const service=createPurchaseService({commands,transport:harness.remote,sync,
    now:()=>new Date('2026-09-21T10:00:00Z'),id:sequenceIds('restart-control'),onStatus(){}});
  const confirmed=await service.resume(saved.operationId);
  assert.equal(confirmed.phase,'confirmed');
  assert.equal(commands.getState().commerce.mode,'active');
  assert.equal(harness.remote.putCalls.length,1);
});

test('fresh-process control recovery covers initialize and restore persistence and network cutpoints',async(t)=>{
  for(const operation of ['initialize','restore'])await t.test(operation,async(t)=>{
    const open=operation==='initialize'?migratingHarness:restoreHarness;
    const prepare=(service)=>operation==='initialize'
      ? service.prepareActivation()
      : service.prepareRestore({previewId:'durable-preview'});
    const finalState=(commands)=>operation==='initialize'
      ? commands.getState().commerce.mode==='active'
      : commands.getState().ledger.epochs[0].id==='e1';
    const reopen=async(harness,suffix)=>{
      const store=byteStore(harness.store.snapshot()),remote=new PurchaseRemote(harness.remote.server);
      const fresh=await open({store,remote,ids:sequenceIds(`${operation}-${suffix}`)});
      assert.notEqual(fresh.store,harness.store);assert.notEqual(fresh.remote,harness.remote);
      assert.notEqual(fresh.commands,harness.commands);assert.notEqual(fresh.service,harness.service);
      assert.notEqual(fresh.sync,harness.sync);assert.equal(fresh.remote.server,harness.remote.server);
      return fresh;
    };
    for(const entry of [
      {fail:'intent',persisted:null},
      {fail:'reserved',persisted:'intent'},
      {fail:'uploaded',persisted:'reserved'},
      {fail:'pointer-pending',persisted:'uploaded'},
    ])await t.test(`save ${entry.fail}`,async()=>{
      const store=byteStore(productState(earnedLedger())),remote=new PurchaseRemote();
      const harness=await open({store,remote,ids:sequenceIds(`${operation}-${entry.fail}`)});
      const beforeWrites=remote.writeCalls.length,beforePuts=remote.putCalls.length;
      store.failWhen(next=>next.commerce.control?.phase===entry.fail);
      await assert.rejects(prepare(harness.service),{code:'storage'});
      const persisted=store.snapshot().commerce.control;
      assert.equal(persisted?.phase??null,entry.persisted);
      assert.equal(remote.putCalls.length,beforePuts);
      if(entry.fail==='intent') {
        assert.equal(remote.writeCalls.length,beforeWrites);
        assert.equal(harness.sync.calls.prepared,0);
        return;
      }
      if(entry.fail==='reserved')assert.equal(remote.writeCalls.length,beforeWrites);
      const fresh=await reopen(harness,`resume-${entry.fail}`);
      const result=await fresh.service.resume(persisted.operationId);
      assert.equal(result.phase,'confirmed');assert.equal(finalState(fresh.commands),true);
      assert.equal(remote.putCalls.length,beforePuts+1);
    });

    for(const phase of ['reconciling','confirmed'])await t.test(`save ${phase}`,async()=>{
      const store=byteStore(productState(earnedLedger())),remote=new PurchaseRemote();
      const harness=await open({store,remote,ids:sequenceIds(`${operation}-${phase}`)});
      const prepared=await prepare(harness.service);
      store.failWhen(next=>next.commerce.control?.phase===phase);
      await assert.rejects(
        operation==='initialize'
          ? harness.service.confirmActivation(prepared.operationId)
          : harness.service.confirmRestore(prepared.operationId),
        {code:'storage'},
      );
      assert.equal(remote.putCalls.length,1);
      const fresh=await reopen(harness,`resume-${phase}`);
      await fresh.service.refresh();
      assert.equal(fresh.commands.getState().commerce.control.phase,'confirmed');
      assert.equal(finalState(fresh.commands),true);
      assert.equal(remote.putCalls.length,1);
    });

    await t.test('upload failure',async()=>{
      const store=byteStore(productState(earnedLedger())),remote=new PurchaseRemote();
      const harness=await open({store,remote,ids:sequenceIds(`${operation}-upload-loss`)});
      remote.writeFailure=true;
      await assert.rejects(prepare(harness.service),{code:'network'});
      const saved=store.snapshot().commerce.control;
      assert.equal(saved.phase,'reserved');assert.equal(remote.putCalls.length,0);
      const fresh=await reopen(harness,'upload-loss');
      const result=await fresh.service.resume(saved.operationId);
      assert.equal(result.phase,'confirmed');assert.equal(finalState(fresh.commands),true);
      assert.equal(remote.putCalls.length,1);
    });

    await t.test('unknown pointer before send',async()=>{
      const store=byteStore(productState(earnedLedger())),remote=new PurchaseRemote();
      const harness=await open({store,remote,ids:sequenceIds(`${operation}-before-loss`)});
      const prepared=await prepare(harness.service),saved=store.snapshot().commerce.control;
      remote.pointerFailure='before';
      await assert.rejects(
        operation==='initialize'
          ? harness.service.confirmActivation(prepared.operationId)
          : harness.service.confirmRestore(prepared.operationId),
        {code:'network'},
      );
      const fresh=await reopen(harness,'before-loss');
      await fresh.service.refresh();
      assert.equal(remote.putCalls.length,1);
      remote.pointerFailure=null;
      const result=await fresh.service.resume(saved.operationId);
      assert.equal(result.phase,'confirmed');assert.equal(remote.putCalls.length,2);
      assert.equal(remote.putCalls[1].etag,saved.etag);
      assert.deepEqual(remote.putCalls[1].properties,saved.pointerProperties);
    });

    await t.test('unknown pointer response after commit',async()=>{
      const store=byteStore(productState(earnedLedger())),remote=new PurchaseRemote();
      const harness=await open({store,remote,ids:sequenceIds(`${operation}-after-loss`)});
      const prepared=await prepare(harness.service);
      remote.pointerFailure='after';
      await assert.rejects(
        operation==='initialize'
          ? harness.service.confirmActivation(prepared.operationId)
          : harness.service.confirmRestore(prepared.operationId),
        {code:'network'},
      );
      remote.pointerFailure=null;
      const fresh=await reopen(harness,'after-loss');
      await fresh.service.refresh();
      assert.equal(fresh.commands.getState().commerce.control.phase,'confirmed');
      assert.equal(finalState(fresh.commands),true);assert.equal(remote.putCalls.length,1);
    });
  });
});

test('confirmed ownership stays readable and selectable offline after restart',async()=>{
  const first=await openHarness();
  const preview=await first.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  await first.service.confirm(preview);
  first.remote.offline=true;
  const reopened=await openHarness({store:first.store,remote:first.remote,ids:sequenceIds('offline')});
  const view=await reopened.service.getView();
  assert.equal(view.accounts.p1.purchasedArticleIds.includes('evolution:explorer-girl:2'),true);
  await reopened.service.select({profileId:'p1',figureId:'explorer-girl',stage:2});
  assert.deepEqual(reopened.commands.getState().commerce.selection,[{profileId:'p1',figureId:'explorer-girl',stage:2}]);
  await assert.rejects(
    reopened.service.select({profileId:'p2',figureId:'explorer-girl',stage:2}),
    {code:'entitlement'},
  );
});

test('restore control uses the same persisted head and activates its epoch only after confirmed history replay',async()=>{
  const harness=await openHarness();
  const sync=restorePorts(harness.commands);
  const service=createPurchaseService({commands:harness.commands,transport:harness.remote,sync,
    now:()=>new Date('2026-09-21T10:00:00Z'),id:sequenceIds('restore-control'),onStatus(){}});
  const prepared=await service.prepareRestore({previewId:'synthetic-preview'});
  assert.equal(prepared.operation,'restore');
  assert.equal(prepared.phase,'pointer-pending');
  assert.equal(sync.calls.sawPersistedIntent,true);
  assert.equal(harness.remote.putCalls.length,0);
  assert.equal(harness.commands.getState().ledger.epochs[0].id,'e0');

  const confirmed=await service.confirmRestore(prepared.operationId);
  assert.equal(confirmed.phase,'confirmed');
  assert.equal(sync.calls.applied,1);
  assert.equal(harness.commands.getState().ledger.epochs[0].id,'e1');
  assert.equal(harness.commands.getState().commerce.head.id,confirmed.candidate.id);
});

test('changed intent, unknown profile and account or folder switch fail before a purchase write',async()=>{
  const harness=await openHarness();
  await assert.rejects(
    harness.service.preview({profileId:'missing-profile',articleId:'evolution:explorer-girl:2'}),
    {code:'reference'},
  );
  const preview=await harness.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  await assert.rejects(harness.service.confirm({...preview,profileId:'p2'}),{code:'stale'});
  assert.equal(harness.commands.getState().commerce.jobs.length,0);
  harness.remote.binding={...BINDING,accountId:'other-account',folderId:'other-folder'};
  await assert.rejects(
    harness.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'}),
    {code:'binding'},
  );
  assert.equal(harness.remote.writeCalls.length,0);
  assert.equal(harness.remote.putCalls.length,0);
});

test('learning-sync port is mandatory and contradictory persisted sync state fails closed',async()=>{
  const harness=await openHarness();
  const make=(sync)=>createPurchaseService({
    commands:harness.commands,transport:harness.remote,sync,
    now:()=>new Date('2026-09-21T10:00:00Z'),id:sequenceIds('sync-boundary'),onStatus(){},
  });
  await assert.rejects(
    make({}).preview({profileId:'p1',articleId:'evolution:explorer-girl:2'}),
    {code:'not-ready'},
  );
  await assert.rejects(
    make({async syncLearning(){return {phase:'pending'};}})
      .preview({profileId:'p1',articleId:'evolution:explorer-girl:2'}),
    {code:'pending'},
  );
  const contradictory=make({
    async syncLearning(){
      const state=harness.commands.getState(),next=structuredClone(state);
      next.outboxEventIds=['rev-p1'];
      await harness.commands.commitExternal(next,await productStateHash(state));
      return {phase:'synced'};
    },
  });
  await assert.rejects(
    contradictory.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'}),
    {code:'pending'},
  );
  assert.equal(harness.remote.writeCalls.length,0);assert.equal(harness.remote.putCalls.length,0);
});

test('a failed durable learning-sync commit prevents purchase-network mutation',async()=>{
  const base=await openHarness();
  const store=byteStore(base.store.snapshot()),remote=new PurchaseRemote(base.remote.server);
  const commands=await createCommands({store,now:()=>new Date('2026-09-21T10:00:00Z'),id:sequenceIds('sync-store'),deviceId:'dev1',onChange(){}});
  const state=commands.getState(),pending=structuredClone(state);pending.outboxEventIds=['rev-p1'];
  await commands.commitExternal(pending,await productStateHash(state));
  store.failWhen(next=>next.outboxEventIds.length===0);
  const service=createPurchaseService({
    commands,transport:remote,sync:learningSync(commands),
    now:()=>new Date('2026-09-21T10:00:00Z'),id:sequenceIds('sync-store-service'),onStatus(){},
  });

  await assert.rejects(
    service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'}),
    {code:'storage'},
  );

  assert.equal(remote.writeCalls.length,0);assert.equal(remote.putCalls.length,0);
  assert.deepEqual(store.snapshot().outboxEventIds,['rev-p1']);
});

test('a proven advanced head without the intent supersedes the attempt and requires a new preview',async()=>{
  const first=await openHarness();
  first.remote.pointerFailure='before';
  const preview=await first.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  await assert.rejects(first.service.confirm(preview),{code:'network'});
  const operationId=first.commands.getState().commerce.jobs[0].intent.operationId;
  first.remote.pointerFailure=null;

  const other=await openHarness({store:memoryStore(productState(earnedLedger())),remote:first.remote,ids:sequenceIds('winner')});
  const winning=await other.service.preview({profileId:'p2',articleId:'evolution:explorer-girl:2'});
  await other.service.confirm(winning);
  const writes=first.remote.putCalls.length;

  const reopened=await openHarness({store:first.store,remote:first.remote,ids:sequenceIds('loser')});
  const result=await reopened.service.resume(operationId);
  assert.equal(result.status,'superseded');
  assert.equal(first.remote.putCalls.length,writes);
  const replacement=await reopened.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  assert.notEqual(replacement.head.id,preview.head.id);
});

test('a rejected stale ETag supersedes the purchase attempt before another explicit preview',async()=>{
  const harness=await openHarness();
  harness.remote.pointerFailure='stale';
  const preview=await harness.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});

  await assert.rejects(harness.service.confirm(preview),{code:'stale'});

  const job=harness.commands.getState().commerce.jobs[0];
  assert.equal(job.status,'superseded');
  assert.equal(job.attempts[0].phase,'superseded');
  const calls=harness.remote.putCalls.length;
  const resumed=await harness.service.resume(job.intent.operationId);
  assert.equal(resumed.status,'superseded');
  assert.equal(harness.remote.putCalls.length,calls);
});

test('an older ledger cannot publish a receipt that invalidates the verified shared head',async()=>{
  const remote=new PurchaseRemote();
  const first=await openHarness({remote,ids:sequenceIds('first')});
  const second=await openHarness({remote,ids:sequenceIds('second')});
  await first.commands.setAnimations({profileId:'p1',animations:false});
  const firstPreview=await first.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  await first.service.confirm(firstPreview);
  const acceptedHead=structuredClone(remote.coordinator.properties);
  const putCount=remote.putCalls.length;

  const stalePreview=await second.service.preview({profileId:'p2',articleId:'evolution:explorer-girl:2'});
  await assert.rejects(second.service.confirm(stalePreview),{code:'history'});

  assert.equal(remote.putCalls.length,putCount);
  assert.deepEqual(remote.coordinator.properties,acceptedHead);
  await first.service.refresh();
});

test('a target-chain receipt with a reused operation ID cannot confirm a different local intent',async()=>{
  const remote=new PurchaseRemote();
  const first=await openHarness({remote,ids:sequenceIds('collision')});
  remote.pointerFailure='before';
  const firstPreview=await first.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  await assert.rejects(first.service.confirm(firstPreview),{code:'network'});
  const local=first.commands.getState().commerce.jobs[0];
  remote.pointerFailure=null;

  const second=await openHarness({
    store:memoryStore(productState(earnedLedger())),remote,ids:sequenceIds('collision'),
  });
  const secondPreview=await second.service.preview({profileId:'p2',articleId:'evolution:explorer-girl:2'});
  await second.service.confirm(secondPreview);

  await assert.rejects(first.service.refresh(),{code:'collision'});
  const unchanged=first.commands.getState().commerce.jobs[0];
  assert.equal(unchanged.intent.profileId,'p1');
  assert.equal(unchanged.intent.operationId,local.intent.operationId);
  assert.notEqual(unchanged.status,'confirmed');
});

test('a reused operation ID with a changed article cannot confirm the local purchase',async()=>{
  const remote=new PurchaseRemote();
  const first=await openHarness({remote,ids:sequenceIds('article-collision')});
  remote.pointerFailure='before';
  const localPreview=await first.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  await assert.rejects(first.service.confirm(localPreview),{code:'network'});
  remote.pointerFailure=null;
  const second=await openHarness({
    store:memoryStore(productState(earnedLedger())),remote,ids:sequenceIds('article-collision'),
  });
  const foreignPreview=await second.service.preview({profileId:'p1',articleId:'evolution:explorer-boy:2'});
  await second.service.confirm(foreignPreview);

  await assert.rejects(first.service.refresh(),{code:'collision'});
  assert.equal(first.commands.getState().commerce.jobs[0].status,'open');
});

test('a same-named foreign provenance operation never confirms the target-chain job',async()=>{
  const remote=new PurchaseRemote();
  const harness=await openHarness({remote,ids:sequenceIds('source-collision')});
  remote.pointerFailure='before';
  const preview=await harness.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  await assert.rejects(harness.service.confirm(preview),{code:'network'});
  remote.pointerFailure=null;
  const job=harness.commands.getState().commerce.jobs[0];
  const previous={
    id:remote.coordinator.properties.purchaseHeadId,
    sha256:remote.coordinator.properties.purchaseHeadSha256,
  };
  const sourceLedger=rebindLedger(earnedLedger(),{datasetId:BINDING.datasetId,epochId:'source-epoch'});
  const restoredLedger=rebindLedger(earnedLedger(),{datasetId:BINDING.datasetId,epochId:'restored-epoch'});
  const sourceBundle=await packBasis(sourceLedger,()=>remote.reserveId());
  const restoreBundle=await packBasis(restoredLedger,()=>remote.reserveId());
  const sourceValue=receipt({
    coordinatorId:CONFIG.coordinatorId,basis:sourceBundle.ref,operationId:job.intent.operationId,
    epochId:'source-epoch',
  });
  const sourceRef={id:await remote.reserveId(),sha256:await digest(sourceValue)};
  const restoreValue=receipt({
    coordinatorId:CONFIG.coordinatorId,basis:restoreBundle.ref,sequence:1,previous,
    operationId:'different-target-operation',operation:'restore',epochId:'restored-epoch',intent:null,
    economy:{version:1,kind:'economic-snapshot',source:{binding:BINDING,head:sourceRef,proof:null}},
  });
  const restoreRef={id:await remote.reserveId(),sha256:await digest(restoreValue)};
  for(const entry of [...sourceBundle.parts,{ref:sourceBundle.ref,value:sourceBundle.manifest},
    ...restoreBundle.parts,{ref:restoreBundle.ref,value:restoreBundle.manifest},
    {ref:sourceRef,value:sourceValue},{ref:restoreRef,value:restoreValue}]) {
    remote.files.set(entry.ref.id,structuredClone(entry.value));
  }
  remote.coordinator.properties.purchaseHeadId=restoreRef.id;
  remote.coordinator.properties.purchaseHeadSha256=restoreRef.sha256;
  remote.coordinator.version=String(Number(remote.coordinator.version)+1);
  remote.coordinator.etag=`"head-${remote.coordinator.version}"`;

  await harness.service.refresh();

  assert.equal(harness.commands.getState().commerce.jobs[0].status,'superseded');
});

test('a mismatched target control candidate cannot activate the local control',async()=>{
  const harness=await migratingHarness();
  const prepared=await harness.service.prepareActivation();
  const candidateValue=harness.remote.files.get(prepared.candidate.id);
  const foreignRef={id:'foreign-control-head',sha256:await digest(candidateValue)};
  harness.remote.files.set(foreignRef.id,structuredClone(candidateValue));
  harness.remote.coordinator.properties={
    ...prepared.pointerProperties,purchaseHeadId:foreignRef.id,purchaseHeadSha256:foreignRef.sha256,
  };
  harness.remote.coordinator.version='2';harness.remote.coordinator.etag='"head-2"';

  await assert.rejects(harness.service.refresh(),{code:'collision'});

  assert.notEqual(harness.commands.getState().commerce.control.phase,'confirmed');
  assert.equal(harness.sync.calls.applied,0);
});

test('verified new learning points rebuild available funds for the next purchase',async()=>{
  const harness=await openHarness();
  const firstPreview=await harness.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  await harness.service.confirm(firstPreview);
  const fixture=createFixture();
  const start=fixture.event('round.started',{
    roundId:'later-round',profileId:'p1',mode:'all',size:10,
  },{id:'later-round-start',deviceId:'learning-device',clock:1000});
  const answers=Array.from({length:10},(_,index)=>fixture.answer({
    id:`later-answer-${index+1}`,roundId:'later-round',profileId:'p1',ordinal:index+1,
    wordId:`w${(index%3)+1}`,deviceId:'learning-device',clock:1001+index,
  }));
  const before=harness.commands.getState(),next=structuredClone(before);
  next.ledger.events.push(start,...answers);
  next.clock=1010;
  await harness.commands.commitExternal(next,await productStateHash(before));

  const preview=await harness.service.preview({profileId:'p1',articleId:'evolution:explorer-boy:2'});

  assert.equal(preview.earnedPoints,400);
  assert.equal(preview.spentPoints,200);
  assert.equal(preview.availablePoints,200);
});
