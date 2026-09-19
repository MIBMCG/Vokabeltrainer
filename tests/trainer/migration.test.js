import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createCommands} from '../../src/trainer/commands.js';
import {canonical,digest} from '../../src/trainer/model/canonical.js';
import {project} from '../../src/trainer/learning/progress.js';
import {resolveEpochs} from '../../src/trainer/model/epochs.js';
import {createRestoreService} from '../../src/trainer/backup/restore.js';
import {validatePacket} from '../../src/trainer/sync/packets.js';
import {createProductSync} from '../../src/trainer/sync/drive.js';
import {createCommands as oldCommands} from '../compat/v1/src/trainer/commands.js';
import {validatePacket as oldPacket,buildPackets as oldPackets} from '../compat/v1/src/trainer/sync/packets.js';
import {createProductSync as oldSync} from '../compat/v1/src/trainer/sync/drive.js';
import {exportBackup as oldBackup,validateBackup as oldValidateBackup} from '../compat/v1/src/trainer/backup/format.js';
import {planSnapshotUploads as oldUploads,uploadVerified as oldUpload,readSnapshot as oldSnapshot} from '../compat/v1/src/trainer/backup/transport.js';
import {readSnapshot} from '../../src/trainer/backup/transport.js';
import {exportBackup,validateBackup,backupLedger,dependencies,previewBackup} from '../../src/trainer/backup/format.js';
import {buildPackets} from '../../src/trainer/sync/packets.js';
import {productStateHash} from '../../src/trainer/commands.js';
import {createFixture} from './fixtures.js';
import {memoryStore,productState,sequenceIds,SyntheticDrive} from './backup-fixtures.js';

const now=()=>new Date('2026-09-19T10:00:00.000Z');
const open=(store,old=false)=> (old?oldCommands:createCommands)({store,now,id:sequenceIds('local'),deviceId:'dev1',onChange(){}});
let syncNumber=0;
const syncFor=(commands,drive,old=false)=> (old?oldSync:createProductSync)({commands,drive,store:{},now,id:sequenceIds(`sync-${++syncNumber}`),onStatus(){}});
test('frozen v1 import closure is byte-identical to the historical product',async()=>{
  const base=new URL('../compat/v1/',import.meta.url);
  const manifest=JSON.parse(await readFile(new URL('source-manifest.json',base),'utf8'));
  assert.equal(manifest.revision,'cc079cbea31d6d834b7d8eba1920486daddb4e90');
  for(const entry of manifest.files) {
    const bytes=await readFile(new URL(entry.path,base));
    assert.equal(bytes.length,entry.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);
  }
});
for(const feedback of [false,true])test(`v1 migration preserves open round ${feedback?'feedback':'question'}, payloads, PIN and safety hashes`,async()=>{
  const store=memoryStore(productState(createFixture().base)); const old=await open(store,true);
  await old.start({profileId:'p1',mode:'all',size:10});
  if(feedback)await old.submit({roundId:old.getState().rounds.p1.id,typed:'wrong'});
  const source=store.snapshot();source.pinVerifier={synthetic:'verifier'};
  source.pendingPackets=oldPackets({events:source.ledger.events,datasetId:'d1',epochId:'e0',id:sequenceIds('packet')})
    .map(packet=>({packet,driveFileId:'pending-file',confirmed:false}));
  const backup=await oldBackup(source,now().toISOString());
  source.safetyCopies.push({id:'prior-copy',createdAt:backup.exportedAt,purpose:'safety',backup,hash:await digest(backup),verified:true,driveManifestFileId:null});
  await store.save(source);
  const commands=await open(store);const result=commands.getState();
  assert.equal(result.storageVersion,2);
  for(const key of ['ledger','pendingPackets','pinVerifier','outboxEventIds','packetIntegrity','restoreJobs','binding']) {
    assert.equal(await digest(result[key]),await digest(source[key]),key);
  }
  const round=result.rounds.p1;
  assert.equal(round.schedulingMode,'legacy');assert.equal(round.policyEventId,null);
  assert.deepEqual(round.policy,{slowAfter:3,stopAfter:null,intervals:[1,3,7,14]});
  assert.equal(round.current.schedulingGenerationId,null);assert.equal(round.status,source.rounds.p1.status);
  assert.deepEqual(round.pausedWordIds,source.rounds.p1.pausedWordIds);
  assert.deepEqual(result.safetyCopies[0],source.safetyCopies[0]);
  const copy=result.safetyCopies.at(-1);assert.equal(copy.purpose,'format-migration');assert.equal(copy.verified,true);
  assert.equal(copy.backup.formatVersion,1);assert.equal(copy.hash,await digest(copy.backup));
  await oldValidateBackup(copy.backup);
  const again=await open(store);assert.deepEqual(again.getState(),result);
  if(feedback)await commands.next({roundId:round.id});
  else await commands.submit({roundId:round.id,typed:'wrong'});
  assert.equal(commands.getState().ledger.events.find(e=>e.type==='round.started').formatVersion,1);
  assert.equal(commands.getState().ledger.events.filter(e=>e.type==='answer.recorded').at(-1).formatVersion,feedback?1:2);
});
test('failed migration commit or unknown storage version preserves all persisted bytes',async()=>{
  const source=productState(createFixture().base),store=memoryStore(source);
  store.save=async()=>{throw new Error('synthetic failed save');};
  await assert.rejects(open(store),e=>e.code==='storage');assert.deepEqual(store.snapshot(),source);
  for(const storageVersion of [0,3,99]) {
    const unknown=memoryStore({...source,storageVersion});
    await assert.rejects(open(unknown),e=>e.code==='version');assert.equal(unknown.snapshot().storageVersion,storageVersion);
  }
});
test('v1 packet and cloud snapshot are read without changing their canonical version or hash',async()=>{
  const f=createFixture(),packet=oldPackets({events:f.base.events,datasetId:'d1',epochId:'e0',id:()=> 'packet'})[0];
  assert.equal(canonical(validatePacket(packet)),canonical(packet));
  const backup=await oldBackup(productState(f.base),now().toISOString()),drive=new SyntheticDrive();
  const binding={accountId:drive.account,folderId:'folder',datasetId:'d1'};
  const uploads=await oldUploads(backup,'safety',drive);for(const upload of uploads)await oldUpload(drive,binding,upload);
  const input={drive,binding,fileId:uploads.at(-1).fileId,descriptor:f.base.descriptor};
  const expected=await oldSnapshot(input),actual=await readSnapshot(input);
  assert.equal(canonical(actual),canonical(expected));
});
test('unknown remote packet and orphan snapshot part block new writes and remain inspectable',async()=>{
  for(const kind of ['packet','snapshot-part']) {
    const drive=new SyntheticDrive(),commands=await open(memoryStore(productState(createFixture().base)));
    const sync=syncFor(commands,drive);await sync.createDataset('Synthetic');
    await commands.setAnimations({profileId:'p1',animations:false});
    const value={format:'vokabeltrainer-product',formatVersion:9,ruleVersion:9,kind,datasetId:'d1',snapshotId:'future'};
    drive.addJson({id:'future',parentId:commands.getState().binding.folderId,value,
      appProperties:{app:'vokabeltrainer-product',kind,datasetId:'d1',snapshotId:'future'}});
    const offset=drive.calls.length;const before=commands.getState();
    await assert.rejects(sync.sync(),e=>e.code==='version');
    assert.equal(drive.calls.slice(offset).some(([method])=>['putJson','generateId','createFolder'].includes(method)),false);
    assert.deepEqual(commands.getState().outboxEventIds,before.outboxEventIds);
    assert.deepEqual(commands.getState().pendingPackets,before.pendingPackets);
    assert.deepEqual(commands.getState().quarantinedFiles.find(q=>q.fileId==='future').value,value);
    assert.notEqual(sync.getStatus().phase,'synced');sync.destroy();
  }
});

test('conflicted v1 migration retains both heads, produces old-reader backups, and permits explicit resolution',async()=>{
  const f=createFixture(),source=productState(f.withEvents(f.roundStarted,f.answer({id:'answer'})));
  const before=await oldBackup(productState(f.base),now().toISOString());
  const after=await oldBackup(source,now().toISOString());
  source.ledger.snapshots=[before.snapshot,after.snapshot];
  source.ledger.epochs.push(...[before,after].map((backup,index)=>({
    ...source.ledger.epochs[0],id:`head-${index}`,parents:['e0'],clock:30+index,
    snapshotId:backup.snapshot.id,snapshotManifestFileId:null,
  })));
  source.clock=32;
  const store=memoryStore(source),commands=await open(store),migrated=commands.getState();
  assert.equal(migrated.storageVersion,2);assert.deepEqual(migrated.ledger,source.ledger);
  assert.equal(migrated.safetyCopies.length,2);
  const selections=[];
  for(const copy of migrated.safetyCopies) {
    assert.equal(copy.verified,true);assert.equal(copy.backup.formatVersion,1);assert.equal(copy.backup.ruleVersion,1);
    assert.equal(copy.hash,await digest(copy.backup));await oldValidateBackup(copy.backup);
    assert.deepEqual(copy.backup.safetyCopyIndex,[]);
    selections.push(copy.backup.snapshot.effectiveEventIds.includes('answer'));
  }
  assert.deepEqual(selections.sort(),[false,true]);
  const failed=memoryStore(source);failed.save=async()=>{throw new Error('synthetic transaction abort');};
  await assert.rejects(open(failed),e=>e.code==='storage');assert.deepEqual(failed.snapshot(),source);
  const damaged=structuredClone(source);damaged.ledger.snapshots[0].contentHash='0'.repeat(64);
  const corrupted=memoryStore(damaged);await assert.rejects(open(corrupted),e=>e.code==='invalid');
  assert.deepEqual(corrupted.snapshot(),damaged);
  const reopened=await open(store),heads=resolveEpochs(reopened.getState().ledger).heads;
  assert.deepEqual(heads,['head-0','head-1']);
  const restore=createRestoreService({commands:reopened,store,drive:new SyntheticDrive(),sync:{},now,id:sequenceIds('resolve')});
  const preview=await restore.resolveEpochConflict({selectedEpochId:'head-1',expectedHeads:heads});
  assert.equal(resolveEpochs(reopened.getState().ledger).epochConflict,true);
  await restore.confirm(preview.previewId);
  assert.equal(resolveEpochs(reopened.getState().ledger).epochConflict,false);
  assert.equal(project(reopened.getState().ledger).profiles.p1.points,10);
});

test('migration preserves persisted v1 restore upload bodies and verifies their versions',async()=>{
  const source=productState(createFixture().base),backup=await oldBackup(source,now().toISOString());
  const uploads=await oldUploads(backup,'restore',new SyntheticDrive());
  source.restoreJobs=[{id:'restore-job',phase:'uploading',backup,previewId:'a'.repeat(64),parentHeads:['e0'],
    safetyCopyId:null,snapshot:backup.snapshot,uploads,epoch:null}];
  const store=memoryStore(source),commands=await open(store);
  assert.equal(commands.getState().storageVersion,2);
  assert.equal(await digest(commands.getState().restoreJobs),await digest(source.restoreJobs));
  const damaged=structuredClone(source);damaged.restoreJobs[0].uploads[0].value.ruleVersion=9;
  const corruptStore=memoryStore(damaged);await assert.rejects(open(corruptStore),e=>e.code==='version');
  assert.deepEqual(corruptStore.snapshot(),damaged);
});

test('old backups restore into newly created version-two datasets including connected transport',async()=>{
  const store=memoryStore(null),commands=await open(store),drive=new SyntheticDrive();
  await commands.setup({name:'New',timeZone:'Europe/Berlin'});
  const sync=syncFor(commands,drive);await sync.createDataset('New');
  const restore=createRestoreService({commands,store,drive,sync,now,id:sequenceIds('import')});
  const backup=await oldBackup(productState(createFixture().base),now().toISOString());
  const preview=await restore.prepare(backup);await restore.confirm(preview.previewId);
  assert.equal(Object.keys(project(commands.getState().ledger).entities.words).length,3);
  assert.equal(commands.getState().ledger.descriptor.formatVersion,2);sync.destroy();
});

test('migration rejects a corrupt old safety hash without writing any replacement',async()=>{
  const source=productState(createFixture().base),backup=await oldBackup(source,now().toISOString());
  source.safetyCopies.push({id:'bad-copy',createdAt:backup.exportedAt,purpose:'safety',backup,hash:'0'.repeat(64),verified:true,driveManifestFileId:null});
  const store=memoryStore(source);
  await assert.rejects(open(store),e=>e.code==='invalid');assert.deepEqual(store.snapshot(),source);
});

test('v2 local task cannot silently change the frozen candidate generation',async()=>{
  const store=memoryStore(productState(createFixture().base)),commands=await open(store);
  await commands.start({profileId:'p1',mode:'all',size:10});
  const state=commands.getState(),round=state.rounds.p1,task=round.current;
  state.ledger.events.push({format:'vokabeltrainer-product',formatVersion:2,ruleVersion:2,kind:'event',
    id:'reset-other',datasetId:'d1',epochId:'e0',deviceId:'dev1',clock:++state.clock,
    occurredAt:now().toISOString(),day:'2026-09-19',type:'word.reactivated',
    payload:{profileId:'p1',wordId:task.wordId,revisionId:task.revisionId,learningId:task.learningId}});
  task.schedulingGenerationId='reset-other';
  const changed=memoryStore(state);await assert.rejects(open(changed),e=>e.code==='invalid');
  assert.deepEqual(changed.snapshot(),state);
  round.candidates.find(c=>c.wordId===task.wordId).schedulingGenerationId='reset-other';
  const matching=await open(memoryStore(state));
  assert.equal(matching.getState().rounds.p1.current.schedulingGenerationId,'reset-other');
});

test('unknown versions replacing known files also stop writes and retain the inspected data',async()=>{
  for(const kind of ['dataset','packet']) {
    const drive=new SyntheticDrive(),commands=await open(memoryStore(productState(createFixture().base))),sync=syncFor(commands,drive);
    await sync.createDataset('Synthetic');
    const entry=[...drive.files.values()].find(f=>f.value?.kind===kind);
    entry.value.formatVersion=3;entry.value.ruleVersion=3;entry.meta.version='2';
    await commands.setAnimations({profileId:'p1',animations:false});const offset=drive.calls.length;
    await assert.rejects(sync.sync(),e=>e.code==='version');
    assert.equal(drive.calls.slice(offset).some(([method])=>method==='putJson'),false);
    assert.deepEqual(commands.getState().quarantinedFiles.find(q=>q.fileId===entry.meta.id).value,entry.value);
    sync.destroy();
  }
});

test('actual frozen v1 sync rejects v2 but uploads old answers that the new client accepts once',async()=>{
  const f=createFixture(),drive=new SyntheticDrive(),oldStore=memoryStore(productState(f.base));
  const old=await open(oldStore,true),legacySync=syncFor(old,drive,true);
  await legacySync.createDataset('Synthetic');
  await old.start({profileId:'p1',mode:'all',size:10});
  await legacySync.sync();
  const newStore=memoryStore(oldStore.snapshot()),current=await open(newStore),currentSync=syncFor(current,drive);
  await current.setAnimations({profileId:'p1',animations:false});await currentSync.sync();
  const newPacket=[...drive.files.values()].map(f=>f.value).find(v=>v?.kind==='packet' && v.formatVersion===2);
  assert.ok(newPacket);assert.throws(()=>oldPacket(newPacket),e=>e.code==='version');
  const oldState=old.getState(),task=oldState.rounds.p1.current;
  const answer=oldState.ledger.events.find(e=>e.id===task.revisionId).payload.value.answers[0];
  await old.submit({roundId:oldState.rounds.p1.id,typed:answer});
  const oldAnswer=old.getState().ledger.events.find(e=>e.type==='answer.recorded');
  await assert.rejects(legacySync.sync(),e=>e.code==='version');
  assert.notEqual(legacySync.getStatus().phase,'synced');
  assert.equal(old.getState().pendingPackets.length,0); // Actual old code writes before quarantine.
  await currentSync.sync();await currentSync.sync();
  assert.deepEqual(current.getState().ledger.events.find(e=>e.id===oldAnswer.id),oldAnswer);
  assert.equal(project(current.getState().ledger).profiles.p1.points,10);
  legacySync.destroy();currentSync.destroy();
});

test('unacknowledged v1 upload is retried with its original body and reserved file after migration',async()=>{
  const drive=new SyntheticDrive(),store=memoryStore(productState(createFixture().base));
  const old=await open(store,true),legacySync=syncFor(old,drive,true);await legacySync.createDataset('Synthetic');
  await old.setAnimations({profileId:'p1',animations:false});drive.loseNextUploadResponse=true;
  await assert.rejects(legacySync.sync(),e=>e.code==='network');
  const pending=store.snapshot().pendingPackets[0],hash=await digest(pending.packet);
  assert.ok(drive.files.has(pending.driveFileId));legacySync.destroy();
  const current=await open(store),sync=syncFor(current,drive);
  assert.deepEqual(current.getState().pendingPackets[0],pending);await sync.sync();
  assert.equal(await digest(drive.files.get(pending.driveFileId).value),hash);
  assert.equal(current.getState().pendingPackets.length,0);assert.equal(sync.getStatus().phase,'synced');sync.destroy();
});

test('mixed backup dependencies preserve support-only policies and resets without activating them',async()=>{
  const f=createFixture(),policy={slowAfter:5,stopAfter:8,intervals:[2,4,8,16]};
  const v2=(type,payload,id)=>f.event(type,payload,{id,formatVersion:2,ruleVersion:2});
  const rules=v2('learning.rules.changed',{profileId:'p1',...policy},'rules');
  const reset=v2('word.reactivated',{profileId:'p1',wordId:'w1',revisionId:'rev-w1',learningId:'learn-w1'},'reset');
  const start=v2('round.started',{...f.roundStarted.payload,policyEventId:'rules',policy},'start');
  const answer=v2('answer.recorded',{...f.answer({id:'tmp'}).payload,schedulingGenerationId:'reset'},'answer');
  const state=productState(f.withEvents(rules,reset,start,answer));state.storageVersion=2;
  const all=await exportBackup(state,now().toISOString());
  assert.deepEqual(await validateBackup(all),all);
  assert.deepEqual(previewBackup({current:productState(f.base),backup:all}).learningChanges.added.map(e=>e.id),['rules','reset']);
  assert.ok(dependencies(all.events,['answer']).includes('rules'));
  assert.ok(dependencies(all.events,['answer']).includes('reset'));
  const store=memoryStore(state),commands=await open(store);
  const restore=createRestoreService({commands,store,drive:new SyntheticDrive(),sync:{},now,id:sequenceIds('adopt')});
  const empty=await exportBackup(productState(f.base),now().toISOString());
  const prepare=await restore.prepare(empty);await restore.confirm(prepare.previewId);
  const preview=await restore.previewAdoption(['answer']);
  assert.deepEqual(preview.summary.learningChanges.added,[]);
  assert.ok(preview.supportEventIds.includes('rules'));assert.ok(preview.supportEventIds.includes('reset'));
  await restore.adopt({eventIds:['answer'],previewId:preview.previewId});
  const result=await exportBackup(commands.getState(),now().toISOString());
  const resolved=resolveEpochs(backupLedger(result));
  assert.ok(resolved.supportEvents.some(e=>e.id==='rules'));assert.ok(resolved.supportEvents.some(e=>e.id==='reset'));
  assert.ok(!resolved.effectiveEvents.some(e=>e.id==='rules' || e.id==='reset'));
  assert.equal(project(backupLedger(result)).profiles.p1.points,10);
  const missing=structuredClone(result);missing.snapshot.supportEventIds=missing.snapshot.supportEventIds.filter(id=>id!=='reset');
  await assert.rejects(validateBackup(missing),e=>e.code==='reference');
  const hidden={...all,formatVersion:1,ruleVersion:1};await assert.rejects(validateBackup(hidden),e=>e.code==='version');
  const packet=buildPackets({events:[rules],datasetId:'d1',epochId:'e0',id:()=> 'hidden'})[0];
  assert.throws(()=>validatePacket({...packet,formatVersion:1,ruleVersion:1}),e=>e.code==='version');
});
