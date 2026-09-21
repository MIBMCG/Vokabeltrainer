import test from 'node:test';
import assert from 'node:assert/strict';
import {createPurchaseService} from '../../src/trainer/purchases/service.js';
import {createCommands,productStateHash} from '../../src/trainer/commands.js';
import {ProductError} from '../../src/trainer/model/errors.js';
import {packBasis} from '../../src/trainer/purchases/basis.js';
import {emptyCommerce} from '../../src/trainer/purchases/schema.js';
import {digest} from '../../src/trainer/purchases/value.js';
import {earnedLedger,receipt,BINDING} from './purchases-fixtures.js';
import {memoryStore,productState,sequenceIds} from './backup-fixtures.js';

const CONFIG={
  version:1,kind:'purchase-config',binding:BINDING,descriptorHash:'a'.repeat(64),
  coordinatorId:'coordinator-a',contentFolderId:'content-a',
};

class PurchaseRemote {
  constructor() {
    this.binding=structuredClone(BINDING);this.descriptorHash=CONFIG.descriptorHash;
    this.files=new Map();this.next=0;this.putCalls=[];this.writeCalls=[];
    this.coordinator={
      id:CONFIG.coordinatorId,name:'coordinator',mimeType:'application/vnd.google-apps.folder',
      parents:[BINDING.folderId],version:'1',etag:'"head-1"',
      properties:{
        app:'vokabeltrainer-purchases',kind:'coordinator',datasetId:BINDING.datasetId,
        descriptorFileId:BINDING.descriptorFileId,descriptorHash:CONFIG.descriptorHash,
        coordinatorId:CONFIG.coordinatorId,contentFolderId:CONFIG.contentFolderId,
      },
    };
    this.pointerFailure=null;
  }
  async reserveId(){return `reserved-${++this.next}`;}
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
    next.binding=structuredClone(BINDING);next.commerce=commerce;
    await commands.commitExternal(next,await productStateHash(commands.getState()));
  }
  const statuses=[];
  const service=createPurchaseService({commands,transport:remote,sync:{},now:()=>new Date('2026-09-21T10:00:00Z'),id:ids,onStatus:s=>statuses.push(s)});
  return {store,remote,commands,service,statuses};
}

function activationPorts(commands,remote) {
  const calls={prepared:0,applied:0,sawPersistedIntent:false};
  return {
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

async function migratingHarness() {
  const remote=new PurchaseRemote(),store=memoryStore(productState(earnedLedger()));
  const commands=await createCommands({store,now:()=>new Date('2026-09-21T10:00:00Z'),id:sequenceIds('command'),deviceId:'dev1',onChange(){}});
  const next=commands.getState(),commerce=emptyCommerce();
  commerce.mode='migrating';commerce.binding=BINDING;commerce.config=CONFIG;
  commerce.configRef={id:'config-a',sha256:await digest(CONFIG)};
  commerce.setup={
    version:1,operationId:'setup-a',phase:'confirmed',binding:BINDING,
    descriptorHash:CONFIG.descriptorHash,coordinatorId:CONFIG.coordinatorId,
    contentFolderId:CONFIG.contentFolderId,configRef:commerce.configRef,config:CONFIG,
    etag:null,pointerProperties:null,
  };
  next.binding=structuredClone(BINDING);next.commerce=commerce;
  await commands.commitExternal(next,await productStateHash(commands.getState()));
  const sync=activationPorts(commands,remote);
  const service=createPurchaseService({commands,transport:remote,sync,now:()=>new Date('2026-09-21T10:00:00Z'),id:sequenceIds('control'),onStatus(){}});
  return {remote,store,commands,sync,service};
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
  delete harness.remote.afterPointer;
  const reopened=await openHarness({store,remote:harness.remote,ids:sequenceIds('post-pointer')});
  await reopened.service.refresh();
  assert.equal(reopened.commands.getState().commerce.jobs[0].status,'confirmed');
  assert.equal(harness.remote.putCalls.length,1);
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
