import test from 'node:test';
import assert from 'node:assert/strict';
import {createPurchaseService} from '../../src/trainer/purchases/service.js';
import {createCommands,productStateHash} from '../../src/trainer/commands.js';
import {ProductError} from '../../src/trainer/model/errors.js';
import {packBasis} from '../../src/trainer/purchases/basis.js';
import {emptyCommerce} from '../../src/trainer/purchases/schema.js';
import {digest} from '../../src/trainer/purchases/value.js';
import {earnedLedger,receipt,rebindLedger,BINDING} from './purchases-fixtures.js';
import {memoryStore,productState,sequenceIds,SyntheticDrive} from './backup-fixtures.js';
import {createFixture} from './fixtures.js';
import {exportBackup,snapshotHash} from '../../src/trainer/backup/format.js';
import {CURRENT_VERSION} from '../../src/trainer/model/versions.js';
import {createCommerceIntegration} from '../../src/trainer/purchases/integration.js';
import {createRestoreService} from '../../src/trainer/backup/restore.js';
import {createPurchaseTransport} from '../../src/trainer/purchases/transport.js';
import {purchasesHttpFixture} from './purchases-http-fixture.js';
import {readHistory} from '../../src/trainer/purchases/history.js';
import {resolveEpochs} from '../../src/trainer/model/epochs.js';

const CONFIG={
  version:1,kind:'purchase-config',binding:BINDING,descriptorHash:'a'.repeat(64),
  coordinatorId:'coordinator-a',contentFolderId:'content-a',
};

class PurchaseRemote {
  constructor(server=null) {
    this.binding=structuredClone(BINDING);this.descriptorHash=CONFIG.descriptorHash;
    this.server=server??{files:new Map(),next:0,putCalls:[],writeCalls:[],writeRequests:[],coordinator:{
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
  get writeRequests(){return this.server.writeRequests??(this.server.writeRequests=[]);}
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
    this.writeRequests.push({ref:structuredClone(ref),value:structuredClone(value)});
    const failure=this.writeFailure;
    const fails=failure===true||failure?.attempt===this.writeCalls.length;
    if(fails)this.writeFailure=null;
    if(fails&&(failure===true||failure.when==='before'))throw new ProductError('network','synthetic upload loss');
    if(await digest(value)!==ref.sha256)throw new ProductError('integrity','changed synthetic upload');
    if(this.files.has(ref.id)&&await digest(this.files.get(ref.id))!==ref.sha256) {
      throw new ProductError('collision','changed synthetic immutable');
    }
    this.files.set(ref.id,structuredClone(value));
    if(fails&&failure.when==='after')throw new ProductError('network','synthetic upload response loss');
    return structuredClone(value);
  }
  async putPointer({snapshot,head,headValue,authorization}){
    const source=authorization.kind==='attempt'
      ? authorization.commerce.jobs.find(job=>job.intent.operationId===authorization.operationId)
        .attempts.find(attempt=>attempt.attemptId===authorization.attemptId)
      : authorization.commerce.control;
    this.putCalls.push({
      etag:source.etag,properties:structuredClone(source.pointerProperties),head:structuredClone(head),
      receivedSnapshot:structuredClone(snapshot),
    });
    if(snapshot?.etag!==source.etag||source.phase!=='pointer-pending'
      ||source.candidate?.id!==head?.id||source.candidate?.sha256!==head?.sha256
      ||await digest(headValue)!==head.sha256) {
      throw new ProductError('binding','synthetic pointer does not match saved authorization');
    }
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

async function openHarness({store,remote,ids=sequenceIds('purchase'),syncForCommands=learningSync}={}){
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
  const service=createPurchaseService({commands,transport:remote,sync:syncForCommands(commands),now:()=>new Date('2026-09-21T10:00:00Z'),id:ids,onStatus:s=>statuses.push(s)});
  return {store,remote,commands,service,statuses};
}

async function actualCommerceAdapter(harness) {
  const state=harness.commands.getState();
  const descriptorHash=await digest(state.ledger.descriptor);
  const config={...CONFIG,descriptorHash};
  const configRef={id:'config-a',sha256:await digest(config)};
  const next=structuredClone(state);
  next.commerce.config=config;next.commerce.configRef=configRef;
  await harness.commands.commitExternal(next,await productStateHash(state));
  harness.remote.descriptorHash=descriptorHash;
  harness.remote.coordinator.properties.descriptorHash=descriptorHash;
  harness.remote.files.set(configRef.id,structuredClone(config));
  const transport={
    binding:structuredClone(BINDING),descriptorHash,
    async readFolder(input) {
      if(input.kind==='dataset')return {
        id:BINDING.folderId,etag:'"dataset-1"',properties:{
          purchaseApp:'vokabeltrainer-purchases',purchaseConfigId:configRef.id,
          purchaseConfigSha256:configRef.sha256,
        },
      };
      return harness.remote.readFolder(input);
    },
    async readImmutable(ref,input) {
      if(ref.id===configRef.id)return structuredClone(config);
      return harness.remote.readImmutable(ref,input);
    },
  };
  const integration=createCommerceIntegration({
    transportFor:async()=>transport,
    now:()=>new Date('2026-09-21T10:00:00Z'),id:sequenceIds('actual-commerce'),
  });
  return {config,configRef,descriptorHash,transport,integration};
}

async function actualActivationHarness({store=null,fixture=null,drive=null,suffix='first'}={}) {
  const ledger=earnedLedger();
  const descriptorHash=await digest(ledger.descriptor);
  fixture??=purchasesHttpFixture({accountId:BINDING.accountId});
  if(!fixture.files.has(BINDING.folderId)) {
    fixture.seed({
      id:BINDING.folderId,name:'Vokabeltrainer',mimeType:fixture.FOLDER,
      properties:{app:'vokabeltrainer-product',kind:'dataset-folder',datasetId:BINDING.datasetId},
    });
    fixture.seed({
      id:BINDING.descriptorFileId,name:'dataset.json',parentId:BINDING.folderId,
      properties:{app:'vokabeltrainer-product',kind:'dataset',datasetId:BINDING.datasetId},
      value:ledger.descriptor,
    });
  }
  if(store===null) {
    const initial=productState(ledger,{outbox:[]});
    initial.binding=structuredClone(BINDING);
    store=byteStore(initial);
  }
  drive??=new SyntheticDrive();drive.account=BINDING.accountId;
  const commands=await createCommands({
    store,now:()=>new Date('2026-09-21T10:00:00Z'),id:sequenceIds(`setup-command-${suffix}`),
    deviceId:'dev1',onChange(){},
  });
  const transport=createPurchaseTransport({
    fetchImpl:fixture.fetch,getToken:async()=>`synthetic-token-${suffix}`,binding:BINDING,descriptorHash,
  });
  const integration=createCommerceIntegration({
    commands,drive,transportFor:async()=>transport,learningSync:async()=>({phase:'synced'}),
    now:()=>new Date('2026-09-21T10:00:00Z'),id:sequenceIds(`setup-integration-${suffix}`),
  });
  const service=createPurchaseService({
    commands,transport,sync:integration,now:()=>new Date('2026-09-21T10:00:00Z'),
    id:sequenceIds(`setup-service-${suffix}`),onStatus(){},
  });
  return {store,fixture,drive,commands,transport,integration,service,descriptorHash};
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
    async prepareRestoreCandidate({state,control,input,history,reserve}) {
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
      const source=state.restoreJobs.find(({id})=>id===input.restoreJobId);
      return {epochId:'e1',candidate,uploads:[...bundle.parts,{ref:bundle.ref,value:bundle.manifest},{ref:candidate,value}],
        publication:{...structuredClone(source),phase:'uploading',epoch:structuredClone(ledger.epochs[0])}};
    },
    async publishControl({control}) {
      const state=commands.getState(),next=structuredClone(state);
      next.restoreJobs.find(({id})=>id===control.operationId).phase='published';
      await commands.commitExternal(next,await productStateHash(state));
    },
    async applyConfirmedControl({state,control,history}) {
      calls.applied+=1;
      const basis=history.bases.find(entry=>entry.ref.id===history.projection.basis.id);
      state.ledger=structuredClone(basis.ledger);
      state.outboxEventIds=[];
      state.clock=Math.max(state.clock,...state.ledger.events.map(entry=>entry.clock),...state.ledger.epochs.map(entry=>entry.clock));
      state.restoreJobs.find(({id})=>id===control.operationId).phase='activated';
      return state;
    },
  };
}

async function installRestorePreview(commands,{id='durable-restore',previewId='d'.repeat(64)}={}) {
  const state=commands.getState();
  const backup=await exportBackup(state,'2026-09-21T10:00:00.000Z',{version:CURRENT_VERSION});
  const snapshot={...structuredClone(backup.snapshot),id:`${id}-snapshot`,datasetId:state.ledger.descriptor.datasetId};
  snapshot.contentHash=await snapshotHash(snapshot,backup.events);
  const next=structuredClone(state);
  next.restoreJobs.push({id,phase:'preview',backup,previewId,parentHeads:['e0'],safetyCopyId:null,
    snapshot,uploads:[],epoch:null});
  await commands.commitExternal(next,await productStateHash(state));
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
  if(!base.commands.getState().restoreJobs.some(({id})=>id==='durable-restore'))await installRestorePreview(base.commands);
  const sync=restorePorts(base.commands);
  const service=createPurchaseService({commands:base.commands,transport:remote,sync,
    now:()=>new Date('2026-09-21T10:00:00Z'),id:ids,onStatus(){}});
  return {...base,sync,service};
}

function actualCommerceRuntime({commands,store,remote,drive,prefix}) {
  const integration=createCommerceIntegration({
    commands,drive,learningSync:()=>learningSync(commands).syncLearning(),
    now:()=>new Date('2026-09-26T10:00:00Z'),id:sequenceIds(`${prefix}-integration`),
  });
  const service=createPurchaseService({
    commands,transport:remote,sync:integration,
    now:()=>new Date('2026-09-26T10:00:00Z'),id:sequenceIds(`${prefix}-service`),onStatus(){},
  });
  const restore=createRestoreService({
    commands,store,drive,sync:{sync:()=>integration.syncLearning()},
    now:()=>new Date('2026-09-26T10:00:00Z'),id:sequenceIds(`${prefix}-restore`),commerce:service,
  });
  return {integration,service,restore};
}

test('purchase service rejects creation without the durable command boundary', () => {
  assert.throws(() => createPurchaseService({}), {code: 'invalid'});
});

test('public restore confirmation resumes the saved candidate after an accepted upload response is lost',async()=>{
  const store=byteStore(productState(earnedLedger())),remote=new PurchaseRemote(),drive=new SyntheticDrive();
  drive.account=BINDING.accountId;
  const opened=await openHarness({store,remote,ids:sequenceIds('public-restore-open')});
  const firstRuntime=actualCommerceRuntime({...opened,drive,prefix:'public-restore-first'});
  await firstRuntime.service.refresh();
  const backup=await exportBackup(opened.commands.getState(),'2026-09-26T10:00:00.000Z');
  const preview=await firstRuntime.restore.prepare(backup);
  drive.loseUploadKind='epoch';
  await assert.rejects(firstRuntime.restore.confirm(preview.previewId),{code:'network'});
  const saved=structuredClone(store.snapshot().commerce.control);
  const savedJob=structuredClone(store.snapshot().restoreJobs.find(({id})=>id===saved.operationId));
  assert.equal(savedJob.phase,'uploading');

  const commands=await createCommands({
    store,now:()=>new Date('2026-09-26T10:01:00Z'),id:sequenceIds('public-restart-command'),deviceId:'dev1',onChange(){},
  });
  const restarted=actualCommerceRuntime({commands,store,remote,drive,prefix:'public-restore-restart'});
  await restarted.restore.confirm(preview.previewId);

  const confirmed=commands.getState();
  assert.equal(confirmed.commerce.control.phase,'confirmed');
  assert.deepEqual(confirmed.commerce.control.candidate,saved.candidate);
  assert.deepEqual(confirmed.commerce.control.uploads,saved.uploads);
  assert.deepEqual(confirmed.restoreJobs.find(({id})=>id===saved.operationId).uploads.map(({fileId})=>fileId),
    savedJob.uploads.map(({fileId})=>fileId));
  assert.equal(confirmed.restoreJobs.find(({id})=>id===saved.operationId).phase,'activated');
});

test('activated initialization and restore journals do not block the next coordinated restore',async()=>{
  const store=byteStore(productState(earnedLedger())),remote=new PurchaseRemote(),drive=new SyntheticDrive();
  drive.account=BINDING.accountId;
  const base=await migratingHarness({store,remote,ids:sequenceIds('journal-base')});
  let runtime=actualCommerceRuntime({...base,drive,prefix:'journal-initialize'});
  const activation=await runtime.service.prepareActivation();
  await runtime.service.confirmActivation(activation.operationId);
  assert.deepEqual(base.commands.getState().restoreJobs.map(({phase})=>phase),['activated']);

  const firstBackup=await exportBackup(base.commands.getState(),'2026-09-26T10:05:00.000Z');
  const first=await runtime.restore.prepare(firstBackup);
  await runtime.restore.confirm(first.previewId);
  assert.deepEqual(base.commands.getState().restoreJobs.map(({phase})=>phase),['activated','activated']);

  const secondBackup=await exportBackup(base.commands.getState(),'2026-09-26T10:10:00.000Z');
  const second=await runtime.restore.prepare(secondBackup);
  remote.pointerFailure='before';
  await assert.rejects(runtime.restore.confirm(second.previewId),{code:'network'});
  const saved=structuredClone(store.snapshot().commerce.control);
  const putsBeforeRetry=remote.putCalls.length;
  remote.pointerFailure=null;

  const commands=await createCommands({
    store,now:()=>new Date('2026-09-26T10:11:00Z'),id:sequenceIds('journal-restart-command'),deviceId:'dev1',onChange(){},
  });
  runtime=actualCommerceRuntime({commands,store,remote,drive,prefix:'journal-restart'});
  await runtime.restore.confirm(second.previewId);
  const final=commands.getState();
  assert.deepEqual(final.restoreJobs.map(({phase})=>phase),['activated','activated','activated']);
  assert.equal(remote.putCalls.length,putsBeforeRetry+1);
  assert.equal(remote.putCalls.at(-1).etag,saved.etag);
  assert.deepEqual(remote.putCalls.at(-1).properties,saved.pointerProperties);
  assert.deepEqual(final.commerce.control.candidate,saved.candidate);
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

test('purchase preview ignores advancing sync bookkeeping but remains bound to economic facts',async()=>{
  let syncRun=0;
  const harness=await openHarness({syncForCommands:commands=>({
    async syncLearning(){
      const state=commands.getState(),next=structuredClone(state);
      syncRun+=1;
      next.outboxEventIds=[];next.pendingPackets=[];
      next.knownFiles=next.knownFiles.filter(({fileId})=>fileId!=='sync-diagnostic');
      next.knownFiles.push({fileId:'sync-diagnostic',contentHash:syncRun.toString(16).padStart(64,'0'),kind:'packet'});
      await commands.commitExternal(next,await productStateHash(state));
      return {phase:'synced',lastConfirmedAt:new Date(1_000*syncRun).toISOString()};
    },
  })});
  const preview=await harness.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  const confirmed=await harness.service.confirm(preview);
  assert.equal(confirmed.status,'confirmed');
  assert.ok(syncRun>=3);
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
    const beforeWrites=remote.writeCalls.length,beforePuts=remote.putCalls.length;
    store.failWhen(next=>next.commerce.jobs.at(-1)?.attempts.at(-1)?.phase===entry.fail);

    await assert.rejects(harness.service.confirm(preview),{code:'storage'});

    const persisted=store.snapshot().commerce.jobs.at(-1)??null;
    assert.equal(persisted?.attempts.at(-1)?.phase??null,entry.persisted);
    assert.equal(remote.putCalls.length,beforePuts);
    if(entry.fail==='intent')return;
    if(entry.fail==='reserved')assert.equal(remote.writeCalls.length,beforeWrites);
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
  for(const failure of [
    {name:'partial immutable closure',when:'before'},
    {name:'accepted immutable upload with lost response',when:'after'},
  ])await t.test(failure.name,async()=>{
    const store=byteStore(productState(earnedLedger())),remote=new PurchaseRemote();
    const harness=await openHarness({store,remote,ids:sequenceIds(`purchase-upload-${failure.when}`)});
    const preview=await harness.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
    remote.writeFailure={attempt:2,when:failure.when};
    await assert.rejects(harness.service.confirm(preview),{code:'network'});
    const saved=store.snapshot().commerce.jobs[0],attempt=saved.attempts[0];
    assert.equal(attempt.phase,'reserved');assert.equal(remote.putCalls.length,0);
    assert.ok(attempt.uploads.length>2);
    assert.deepEqual(remote.writeRequests,attempt.uploads.slice(0,2));
    assert.equal(remote.files.has(attempt.uploads[0].ref.id),true);
    assert.equal(remote.files.has(attempt.uploads[1].ref.id),failure.when==='after');
    const beforeResume=remote.writeRequests.length;

    const fresh=await restartHarness(harness,{ids:sequenceIds(`purchase-upload-${failure.when}-fresh`)});
    const result=await fresh.service.resume(saved.intent.operationId);

    assert.equal(result.status,'confirmed');assert.equal(remote.putCalls.length,1);
    assert.deepEqual(remote.writeRequests.slice(beforeResume),attempt.uploads);
    const confirmed=fresh.commands.getState().commerce.jobs[0].attempts[0];
    assert.deepEqual(confirmed.candidate,attempt.candidate);
    assert.deepEqual(confirmed.uploads,attempt.uploads);
    for(const upload of attempt.uploads)assert.deepEqual(remote.files.get(upload.ref.id),upload.value);
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
    assert.equal(remote.putCalls[1].receivedSnapshot.etag,attempt.etag);
    assert.deepEqual(remote.putCalls[1].receivedSnapshot.properties,attempt.pointerProperties);
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
  assert.equal(first.remote.putCalls[1].receivedSnapshot.etag,attempt.etag);
  assert.deepEqual(first.remote.putCalls[1].receivedSnapshot.properties,attempt.pointerProperties);
});

test('the pointer transport double rejects a snapshot ETag changed after service authorization',async()=>{
  const remote=new PurchaseRemote();
  const originalPutPointer=remote.putPointer.bind(remote);
  remote.putPointer=({snapshot,...input})=>originalPutPointer({
    ...input,snapshot:{...snapshot,etag:'\"WRONG-ETAG\"'},
  });
  const harness=await openHarness({remote,ids:sequenceIds('snapshot-mutation')});
  const preview=await harness.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});

  await assert.rejects(harness.service.confirm(preview),{code:'binding'});
  assert.equal(remote.putCalls[0].receivedSnapshot.etag,'\"WRONG-ETAG\"');
  assert.notEqual(remote.putCalls[0].receivedSnapshot.etag,remote.putCalls[0].etag);
  assert.equal(harness.commands.getState().commerce.jobs[0].status,'open');
  assert.equal(harness.commands.getState().commerce.jobs[0].attempts[0].phase,'reconciling');
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

test('an unclear setup stays read-only until its saved operation is explicitly resumed',async()=>{
  const first=await actualActivationHarness({suffix:'unclear-first'});
  first.fixture.dropPointerResponse();
  await assert.rejects(first.service.prepareActivation({
    binding:BINDING,descriptorHash:first.descriptorHash,
  }),{code:'network'});
  const unclear=first.commands.getState().commerce.setup;
  assert.equal(unclear.phase,'reconciling');
  assert.equal(first.commands.getState().commerce.control,null);
  const pointerWrites=first.fixture.calls.filter(({method})=>method==='PUT').length;
  const productUploads=first.drive.files.size;

  const fresh=await actualActivationHarness({
    store:first.store,fixture:first.fixture,drive:first.drive,suffix:'unclear-fresh',
  });
  await assert.rejects(fresh.service.prepareActivation({
    binding:BINDING,descriptorHash:fresh.descriptorHash,
  }),{code:'pending'});
  assert.equal(fresh.fixture.calls.filter(({method})=>method==='PUT').length,pointerWrites);
  assert.equal(fresh.drive.files.size,productUploads);
  assert.equal(fresh.commands.getState().commerce.control,null);

  const setupResult=await fresh.service.resume(unclear.operationId);
  assert.equal(setupResult.status,'confirmed');
  assert.equal(fresh.fixture.calls.filter(({method})=>method==='PUT').length,pointerWrites+1);
  const prepared=await fresh.service.prepareActivation({
    binding:BINDING,descriptorHash:fresh.descriptorHash,
  });
  const confirmed=await fresh.service.confirmActivation(prepared.operationId);
  assert.equal(confirmed.phase,'confirmed');
  assert.equal(fresh.commands.getState().commerce.mode,'active');
});

test('an accepted setup pointer with a lost response is read back before activation publication',async()=>{
  const harness=await actualActivationHarness({suffix:'accepted-response-loss'});
  harness.fixture.losePointerResponse();

  const prepared=await harness.service.prepareActivation({
    binding:BINDING,descriptorHash:harness.descriptorHash,
  });

  assert.equal(harness.commands.getState().commerce.setup.phase,'confirmed');
  assert.equal(harness.fixture.calls.filter(({method})=>method==='PUT').length,1);
  assert.equal(prepared.phase,'pointer-pending');
  assert.ok(harness.drive.files.size>0);
});

test('an accepted setup pointer survives lost response and fresh commands service and transport objects',async()=>{
  const first=await actualActivationHarness({suffix:'accepted-response-restart-first'});
  first.fixture.losePointerResponse();
  first.store.failWhen(next=>next.commerce.setup?.phase==='confirmed');

  await assert.rejects(first.service.prepareActivation({
    binding:BINDING,descriptorHash:first.descriptorHash,
  }),{code:'storage'});
  const saved=first.store.snapshot().commerce.setup;
  assert.equal(saved.phase,'reconciling');
  const setupWrites=first.fixture.calls.filter(({method,url})=>method==='PUT'&&url.includes(`/files/${BINDING.folderId}`));
  assert.equal(setupWrites.length,1);
  const writtenProperties=Object.fromEntries(JSON.parse(setupWrites[0].body).properties.map(({key,value})=>[key,value]));
  assert.deepEqual(writtenProperties,saved.pointerProperties);
  assert.equal(setupWrites[0].headers['If-Match'],saved.etag);
  const durableIdentity={
    operationId:saved.operationId,coordinatorId:saved.coordinatorId,contentFolderId:saved.contentFolderId,
    configRef:saved.configRef,etag:saved.etag,pointerProperties:saved.pointerProperties,
  };

  const freshStore=byteStore(first.store.snapshot());
  const fresh=await actualActivationHarness({
    store:freshStore,fixture:first.fixture,drive:first.drive,suffix:'accepted-response-restart-fresh',
  });
  assert.notEqual(fresh.store,first.store);
  assert.notEqual(fresh.commands,first.commands);
  assert.notEqual(fresh.service,first.service);
  assert.notEqual(fresh.transport,first.transport);
  const prepared=await fresh.service.prepareActivation({
    binding:BINDING,descriptorHash:fresh.descriptorHash,
  });

  assert.equal(prepared.phase,'pointer-pending');
  assert.equal(first.fixture.calls.filter(({method,url})=>method==='PUT'&&url.includes(`/files/${BINDING.folderId}`)).length,1);
  const confirmed=fresh.commands.getState().commerce.setup;
  assert.equal(confirmed.phase,'confirmed');
  assert.equal(confirmed.operationId,durableIdentity.operationId);
  assert.equal(confirmed.coordinatorId,durableIdentity.coordinatorId);
  assert.equal(confirmed.contentFolderId,durableIdentity.contentFolderId);
  assert.deepEqual(confirmed.configRef,durableIdentity.configRef);
  assert.deepEqual(confirmed.pointerProperties,durableIdentity.pointerProperties);
  assert.notEqual(confirmed.etag,durableIdentity.etag);
});

test('a direct reserved activation resume stays read-only until the same unclear setup is confirmed',async()=>{
  const first=await actualActivationHarness({suffix:'legacy-reserved'});
  first.fixture.dropPointerResponse();
  await assert.rejects(first.service.prepareActivation({
    binding:BINDING,descriptorHash:first.descriptorHash,
  }),{code:'network'});
  const unclear=first.commands.getState().commerce.setup;
  const state=first.commands.getState();
  const control={
    version:1,operationId:'legacy-control',operation:'initialize',phase:'intent',epochId:null,
    head:null,etag:null,candidate:null,pointerProperties:null,uploads:[],
  };
  state.commerce.control=control;
  const candidate=await first.integration.prepareActivationCandidate({
    state,control,reserve:()=>first.transport.reserveId(),
  });
  const coordinator=await first.transport.readFolder({
    id:state.commerce.config.coordinatorId,kind:'coordinator',config:state.commerce.config,
  });
  state.commerce.control={
    ...control,phase:'reserved',epochId:candidate.epochId,etag:coordinator.etag,
    candidate:candidate.candidate,uploads:candidate.uploads,pointerProperties:{
      ...coordinator.properties,purchaseHeadId:candidate.candidate.id,
      purchaseHeadSha256:candidate.candidate.sha256,
    },
  };
  state.restoreJobs.push(candidate.publication);
  await first.commands.commitExternal(state,await productStateHash(first.commands.getState()));
  const savedControl=structuredClone(first.commands.getState().commerce.control);
  assert.equal(first.drive.files.size,0);
  assert.equal(first.fixture.files.get(BINDING.folderId).properties.purchaseConfigId,undefined);

  const fresh=await actualActivationHarness({
    store:first.store,fixture:first.fixture,drive:first.drive,suffix:'legacy-reserved-fresh',
  });
  const pointerWrites=fresh.fixture.calls.filter(({method})=>method==='PUT').length;
  await assert.rejects(fresh.service.resume('legacy-control'),{code:'pending'});
  assert.equal(fresh.fixture.calls.filter(({method})=>method==='PUT').length,pointerWrites);
  assert.equal(fresh.drive.files.size,0);
  assert.deepEqual(fresh.commands.getState().commerce.control,savedControl);
  assert.equal(fresh.fixture.files.get(BINDING.folderId).properties.purchaseConfigId,undefined);

  assert.equal((await fresh.service.resume(unclear.operationId)).status,'confirmed');
  const confirmed=await fresh.service.resume('legacy-control');
  assert.equal(confirmed.phase,'confirmed');
  assert.equal(fresh.commands.getState().commerce.mode,'active');
  assert.ok(fresh.drive.files.size>0);
  assert.deepEqual(confirmed.candidate,savedControl.candidate);
  assert.deepEqual(confirmed.uploads,savedControl.uploads);
  assert.deepEqual(confirmed.pointerProperties,savedControl.pointerProperties);
  assert.equal(confirmed.etag,savedControl.etag);
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
      : service.prepareRestore({restoreJobId:'durable-restore',previewId:'d'.repeat(64)});
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

    for(const failure of [
      {name:'partial immutable closure',when:'before'},
      {name:'accepted immutable upload with lost response',when:'after'},
    ])await t.test(failure.name,async()=>{
      const store=byteStore(productState(earnedLedger())),remote=new PurchaseRemote();
      const harness=await open({store,remote,ids:sequenceIds(`${operation}-upload-${failure.when}`)});
      remote.writeFailure={attempt:2,when:failure.when};
      await assert.rejects(prepare(harness.service),{code:'network'});
      const saved=store.snapshot().commerce.control;
      assert.equal(saved.phase,'reserved');assert.equal(remote.putCalls.length,0);
      assert.ok(saved.uploads.length>2);
      assert.deepEqual(remote.writeRequests,saved.uploads.slice(0,2));
      assert.equal(remote.files.has(saved.uploads[0].ref.id),true);
      assert.equal(remote.files.has(saved.uploads[1].ref.id),failure.when==='after');
      const beforeResume=remote.writeRequests.length;

      const fresh=await reopen(harness,`upload-${failure.when}`);
      const result=await fresh.service.resume(saved.operationId);

      assert.equal(result.phase,'confirmed');assert.equal(finalState(fresh.commands),true);
      assert.equal(remote.putCalls.length,1);
      assert.deepEqual(remote.writeRequests.slice(beforeResume),saved.uploads);
      const confirmed=fresh.commands.getState().commerce.control;
      assert.deepEqual(confirmed.candidate,saved.candidate);
      assert.deepEqual(confirmed.uploads,saved.uploads);
      for(const upload of saved.uploads)assert.deepEqual(remote.files.get(upload.ref.id),upload.value);
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
      assert.equal(remote.putCalls[1].receivedSnapshot.etag,saved.etag);
      assert.deepEqual(remote.putCalls[1].receivedSnapshot.properties,saved.pointerProperties);
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

test('a running service adopts an externally reconciled purchase head without reload or network refresh',async()=>{
  const first=await openHarness({ids:sequenceIds('running-service')});
  const actual=await actualCommerceAdapter(first);
  await first.service.refresh();

  const secondStore=memoryStore(first.store.snapshot());
  const secondRemote=new PurchaseRemote(first.remote.server);
  secondRemote.descriptorHash=actual.descriptorHash;
  const second=await openHarness({store:secondStore,remote:secondRemote,ids:sequenceIds('foreign-purchase')});
  const preview=await second.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  await second.service.confirm(preview);

  const before=first.commands.getState();
  const reconciled=await actual.integration.reconcile({
    state:before,binding:BINDING,descriptorHash:actual.descriptorHash,
  });
  await first.commands.commitExternal(reconciled,await productStateHash(before));

  const view=await first.service.getView();
  assert.equal(view.head.id,reconciled.commerce.head.id);
  assert.equal(view.accounts.p1.spentPoints,200);
  assert.deepEqual(view.accounts.p1.purchasedArticleIds,['evolution:explorer-girl:2']);
  await first.service.select({profileId:'p1',figureId:'explorer-girl',stage:2});
  assert.deepEqual(first.commands.getState().commerce.selection,[
    {profileId:'p1',figureId:'explorer-girl',stage:2},
  ]);
});

test('a running service adopts a later confirmed restore that removes ownership and invalid selection',async()=>{
  const first=await openHarness({ids:sequenceIds('running-restore')});
  const actual=await actualCommerceAdapter(first);
  await first.service.refresh();
  const lowerRightsBackup=await exportBackup(first.commands.getState(),'2026-09-27T09:00:00.000Z');

  const secondStore=memoryStore(first.store.snapshot());
  const secondRemote=new PurchaseRemote(first.remote.server);
  secondRemote.descriptorHash=actual.descriptorHash;
  const second=await openHarness({store:secondStore,remote:secondRemote,ids:sequenceIds('restore-before-purchase')});
  const preview=await second.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  await second.service.confirm(preview);

  const beforePurchase=first.commands.getState();
  const purchased=await actual.integration.reconcile({
    state:beforePurchase,binding:BINDING,descriptorHash:actual.descriptorHash,
  });
  await first.commands.commitExternal(purchased,await productStateHash(beforePurchase));
  assert.equal((await first.service.getView()).accounts.p1.spentPoints,200);
  await first.service.select({profileId:'p1',figureId:'explorer-girl',stage:2});

  const current=first.commands.getState();
  const history=await readHistory({
    head:current.commerce.head,binding:current.commerce.binding,cache:current.commerce.cache,
    read:async()=>assert.fail('the confirmed current history must already be local'),onProgress:()=>{},
  });
  const activeEpochId=resolveEpochs(current.ledger).activeEpochId;
  const restoreState=structuredClone(current);
  const snapshot={...structuredClone(lowerRightsBackup.snapshot),id:'later-lower-rights-snapshot',datasetId:BINDING.datasetId};
  snapshot.contentHash=await snapshotHash(snapshot,lowerRightsBackup.events);
  restoreState.restoreJobs.push({
    id:'later-lower-rights-restore',phase:'preview',backup:lowerRightsBackup,previewId:'9'.repeat(64),
    parentHeads:[activeEpochId],safetyCopyId:'later-lower-rights-safety',snapshot,uploads:[],epoch:null,
  });
  restoreState.commerce.control={
    version:1,operationId:'later-lower-rights-restore',operation:'restore',phase:'intent',
    epochId:null,head:null,etag:null,candidate:null,pointerProperties:null,uploads:[],
  };
  const prepared=await actual.integration.prepareRestoreCandidate({
    state:restoreState,control:restoreState.commerce.control,
    input:{restoreJobId:'later-lower-rights-restore',previewId:'9'.repeat(64)},history,
    reserve:()=>first.remote.reserveId(),
  });
  for(const {ref,value} of prepared.uploads)first.remote.files.set(ref.id,structuredClone(value));
  first.remote.coordinator.properties.purchaseHeadId=prepared.candidate.id;
  first.remote.coordinator.properties.purchaseHeadSha256=prepared.candidate.sha256;
  first.remote.coordinator.version=String(Number(first.remote.coordinator.version)+1);
  first.remote.coordinator.etag=`"head-${first.remote.coordinator.version}"`;

  const restored=await actual.integration.reconcile({
    state:restoreState,binding:BINDING,descriptorHash:actual.descriptorHash,
  });
  assert.equal(restored.commerce.head.id,prepared.candidate.id);
  assert.deepEqual(restored.commerce.selection,[]);
  await first.commands.commitExternal(restored,await productStateHash(current));

  const view=await first.service.getView();
  assert.equal(view.head.id,prepared.candidate.id);
  assert.equal(view.accounts.p1.spentPoints,0);
  assert.deepEqual(view.accounts.p1.purchasedArticleIds,[]);
  await assert.rejects(
    first.service.select({profileId:'p1',figureId:'explorer-girl',stage:2}),
    {code:'entitlement'},
  );
});

test('normal reconcile keeps a selection unlocked by learning earned after the last purchase head',async()=>{
  const harness=await openHarness({ids:sequenceIds('current-learning-selection')});
  const actual=await actualCommerceAdapter(harness);
  await harness.service.refresh();
  const fixture=createFixture();
  const before=harness.commands.getState(),next=structuredClone(before);
  next.ledger.events.push(fixture.event('round.started',{
    roundId:'selection-round',profileId:'p1',mode:'all',size:10,
  },{id:'selection-round-start',deviceId:'selection-device',clock:2000}));
  for(let index=0;index<10;index+=1)next.ledger.events.push(fixture.answer({
    id:`selection-answer-${index+1}`,roundId:'selection-round',profileId:'p1',ordinal:index+1,
    wordId:`w${(index%3)+1}`,deviceId:'selection-device',clock:2001+index,
  }));
  next.clock=2010;
  await harness.commands.commitExternal(next,await productStateHash(before));
  await harness.service.select({profileId:'p1',figureId:'horse',stage:1});
  assert.deepEqual(harness.commands.getState().commerce.selection,[
    {profileId:'p1',figureId:'horse',stage:1},
  ]);

  const current=harness.commands.getState();
  const reconciled=await actual.integration.reconcile({
    state:current,binding:BINDING,descriptorHash:actual.descriptorHash,
  });

  assert.deepEqual(reconciled.commerce.selection,[
    {profileId:'p1',figureId:'horse',stage:1},
  ]);
});

test('restore control uses the same persisted head and activates its epoch only after confirmed history replay',async()=>{
  const harness=await openHarness();
  await installRestorePreview(harness.commands,{id:'synthetic-restore',previewId:'e'.repeat(64)});
  const sync=restorePorts(harness.commands);
  const service=createPurchaseService({commands:harness.commands,transport:harness.remote,sync,
    now:()=>new Date('2026-09-21T10:00:00Z'),id:sequenceIds('restore-control'),onStatus(){}});
  const prepared=await service.prepareRestore({restoreJobId:'synthetic-restore',previewId:'e'.repeat(64)});
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

test('purchase and coordinated restore exclude each other in both orderings',async()=>{
  const restoreFirst=await openHarness();
  await installRestorePreview(restoreFirst.commands,{id:'restore-first',previewId:'f'.repeat(64)});
  const restoreSync=restorePorts(restoreFirst.commands);
  const restoreService=createPurchaseService({commands:restoreFirst.commands,transport:restoreFirst.remote,sync:restoreSync,
    now:()=>new Date('2026-09-21T10:00:00Z'),id:sequenceIds('restore-first'),onStatus(){}});
  await restoreService.prepareRestore({restoreJobId:'restore-first',previewId:'f'.repeat(64)});
  await assert.rejects(
    restoreService.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'}),
    {code:'pending'},
  );

  const purchaseFirst=await openHarness();
  purchaseFirst.remote.pointerFailure='before';
  const preview=await purchaseFirst.service.preview({profileId:'p1',articleId:'evolution:explorer-girl:2'});
  await assert.rejects(purchaseFirst.service.confirm(preview),{code:'network'});
  await installRestorePreview(purchaseFirst.commands,{id:'purchase-first-restore',previewId:'9'.repeat(64)});
  await assert.rejects(
    purchaseFirst.service.prepareRestore({restoreJobId:'purchase-first-restore',previewId:'9'.repeat(64)}),
    {code:'pending'},
  );
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

test('versioned learning points and round bonus fund a second purchase that survives restart',async()=>{
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
  const completed=fixture.event('round.completed',{
    roundId:'later-round',profileId:'p1',reason:'full',answerIds:answers.map(entry=>entry.id).sort(),
  },{id:'later-round-completed',deviceId:'learning-device',clock:1011});
  const before=harness.commands.getState(),next=structuredClone(before);
  next.ledger.events.push(start,...answers,completed);
  next.clock=1011;
  await harness.commands.commitExternal(next,await productStateHash(before));

  const preview=await harness.service.preview({profileId:'p1',articleId:'evolution:explorer-boy:2'});
  assert.equal(preview.earnedPoints,420);
  assert.equal(preview.spentPoints,200);
  assert.equal(preview.availablePoints,220);
  await harness.service.confirm(preview);

  const reopened=await restartHarness(harness,{ids:sequenceIds('round-bonus-restart')});
  await reopened.service.refresh();
  const view=await reopened.service.getView();
  assert.equal(view.accounts.p1.earnedPoints,420);
  assert.equal(view.accounts.p1.spentPoints,400);
  assert.equal(view.accounts.p1.availablePoints,20);
  assert.deepEqual(view.accounts.p1.purchasedArticleIds,[
    'evolution:explorer-boy:2','evolution:explorer-girl:2',
  ]);
  assert.equal(reopened.remote.putCalls.length,2);
});
