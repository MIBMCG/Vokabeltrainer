import test from 'node:test';
import assert from 'node:assert/strict';
import {createRestoreService} from '../../src/trainer/backup/restore.js';
import {exportBackup} from '../../src/trainer/backup/format.js';
import {planSnapshotUploads,uploadVerified,readSnapshot} from '../../src/trainer/backup/transport.js';
import {createCommands} from '../../src/trainer/commands.js';
import {createProductSync} from '../../src/trainer/sync/drive.js';
import {project} from '../../src/trainer/learning/progress.js';
import {createFixture} from './fixtures.js';
import {productState,memoryStore,sequenceIds,SyntheticDrive} from './backup-fixtures.js';
const now=()=>new Date('2026-09-18T10:00:00.000Z');
let fixtureNumber=0;
async function setupRestoreFixture({connected=true,drive=new SyntheticDrive(),state}={}) {
  const f=createFixture(),ids=sequenceIds(`restore-${++fixtureNumber}`);
  const store=memoryStore(state??productState(f.withEvents(f.roundStarted,f.answer({id:'recent'}))));
  const commands=await createCommands({store,now,id:ids,deviceId:state?.deviceId??'dev1',onChange:()=>{}});
  const sync=createProductSync({commands,store,drive,now,id:ids,onStatus:()=>{}});
  if(connected && !commands.getState().binding) await sync.createDataset('Family');
  const restore=createRestoreService({commands,store,sync,drive,now,id:ids});
  return {f,commands,store,sync,drive,restore,olderBackup:await exportBackup(productState(f.base),now().toISOString())};
}
test('failed verified safety copy makes restore impossible',async()=>{
  const h=await setupRestoreFixture(),before=h.commands.getState();
  h.drive.onRead=async id=>{if(h.drive.files.get(id).value?.purpose==='safety') throw new Error('synthetic readback');};
  await assert.rejects(h.restore.prepare(h.olderBackup));
  assert.deepEqual(h.commands.getState().ledger,before.ledger);
});
test('local offline restore preserves old facts, ends old rounds without bonus and lists downloadable safety',async()=>{
  const h=await setupRestoreFixture({connected:false});
  await h.commands.start({profileId:'p1',mode:'all',size:10});
  const preview=await h.restore.prepare(h.olderBackup);
  await h.restore.confirm(preview.previewId);
  const state=h.commands.getState();
  assert.equal(project(state.ledger).profiles.p1.points,0);
  assert.ok(state.ledger.events.some(e=>e.id==='recent'));
  assert.equal(state.rounds.p1.status,'abandoned');
  assert.equal(state.ledger.epochs.at(-1).snapshotManifestFileId,null);
  const copies=(await h.restore.listSafetyCopies()).filter(c=>c.purpose==='safety');assert.equal(copies.length,1);
  const copy=await h.restore.downloadSafetyCopy(copies[0].id);assert.ok(copy.events.some(e=>e.id==='recent'));
});
test('change after preview requires fresh explicit confirmation',async()=>{
  const h=await setupRestoreFixture({connected:false}),p=await h.restore.prepare(h.olderBackup);
  await h.commands.setAnimations({profileId:'p1',animations:false});
  await assert.rejects(h.restore.confirm(p.previewId),e=>e.code==='stale');
  assert.equal(h.commands.getState().ledger.epochs.length,1);
});
test('old offline answer remains separate until explicit adoption and never doubles points',async()=>{
  const h=await setupRestoreFixture({connected:false}),p=await h.restore.prepare(h.olderBackup);
  await h.restore.confirm(p.previewId);
  assert.ok(project(h.commands.getState().ledger).lateEvents.some(e=>e.id==='recent'));
  const adoption=await h.restore.previewAdoption(['recent']);
  await h.restore.adopt({eventIds:['recent'],previewId:adoption.previewId});
  assert.equal(project(h.commands.getState().ledger).profiles.p1.points,10);
  const again=await h.restore.previewAdoption(['recent']);
  await h.restore.adopt({eventIds:['recent'],previewId:again.previewId});
  assert.equal(project(h.commands.getState().ledger).profiles.p1.points,10);
});
test('restore service exposes the explicit preparation and confirmation boundary', () => {
  const restore=createRestoreService({commands:{},store:{},sync:{},drive:{},now:()=>new Date(),id:()=> 'id'});
  for(const method of ['prepare','confirm','resolveEpochConflict','previewAdoption','adopt','listSafetyCopies','downloadSafetyCopy']) {
    assert.equal(typeof restore[method],'function');
  }
});
test('connected restore reaches a second device and preserves a late offline answer for explicit adoption',async()=>{
  const a=await setupRestoreFixture();
  const b=await setupRestoreFixture({connected:false,drive:a.drive});
  await b.sync.joinDataset((await b.sync.discover())[0],'confirm');await b.sync.sync();
  await b.commands.start({profileId:'p1',mode:'all',size:10});
  const round=b.commands.getState().rounds.p1;
  const typed=project(b.commands.getState().ledger).entities.words[round.current.wordId].value.answers[0];
  await b.commands.submit({roundId:round.id,typed});
  const preview=await a.restore.prepare(a.olderBackup);await a.restore.confirm(preview.previewId);
  await b.sync.sync();await a.sync.sync();
  assert.equal(project(b.commands.getState().ledger).profiles.p1.points,0);
  assert.equal(b.commands.getState().rounds.p1.status,'abandoned');
  const late=b.commands.getState().ledger.events.find(e=>e.type==='answer.recorded' && e.id!=='recent');
  const adoption=await a.restore.previewAdoption([late.id]);await a.restore.adopt({eventIds:[late.id],previewId:adoption.previewId});
  await a.sync.sync();await b.sync.sync();assert.equal(project(b.commands.getState().ledger).profiles.p1.points,10);
});
test('offline restore is published with its unchanged null manifest epoch before joining on another device',async()=>{
  const a=await setupRestoreFixture({connected:false});
  const preview=await a.restore.prepare(a.olderBackup);await a.restore.confirm(preview.previewId);
  const epoch=a.commands.getState().ledger.epochs.at(-1);
  await a.sync.createDataset('Family');
  assert.deepEqual(a.commands.getState().ledger.epochs.find(e=>e.id===epoch.id),epoch);
  const b=await setupRestoreFixture({connected:false,drive:a.drive});
  await b.sync.joinDataset((await b.sync.discover())[0],'confirm');await b.sync.sync();
  assert.equal(project(b.commands.getState().ledger).activeEpochId,epoch.id);
  assert.equal(project(b.commands.getState().ledger).profiles.p1.points,0);
});
test('nonempty local backup import joins only with matching safety and preview selection; restart requires a fresh preview',async()=>{
  const remote=await setupRestoreFixture();
  const local=await setupRestoreFixture({connected:false,drive:remote.drive});
  const {productStateHash}=await import('../../src/trainer/commands.js');
  const before=local.commands.getState(),changed=structuredClone(before);
  changed.ledger.descriptor.datasetId='local';changed.ledger.descriptor.rootEpochId='local-root';
  changed.ledger.epochs=changed.ledger.epochs.map(e=>({...e,id:'local-root',datasetId:'local'}));
  changed.ledger.events=changed.ledger.events.map(e=>({...e,datasetId:'local',epochId:'local-root'}));
  await local.commands.commitExternal(changed,await productStateHash(before));
  const p=await local.restore.prepare(await exportBackup(changed,now().toISOString()));await local.restore.confirm(p.previewId);
  const selection=(await local.sync.discover())[0],preview=await local.sync.joinDataset(selection,'preview');
  assert.ok(preview.safetyCopyId);assert.ok(preview.previewId);
  await assert.rejects(local.sync.joinDataset(selection,'confirm'));
  const restarted=await setupRestoreFixture({connected:false,drive:remote.drive,state:local.store.snapshot()});
  await assert.rejects(restarted.sync.joinDataset({...selection,...preview},'confirm'),e=>e.code==='stale');
  const fresh=await restarted.sync.joinDataset(selection,'preview');
  await restarted.sync.joinDataset({...selection,previewId:fresh.previewId,safetyCopyId:fresh.safetyCopyId},'confirm');
  assert.equal(restarted.commands.getState().binding.datasetId,'d1');
  assert.equal(restarted.commands.getState().restoreJobs.length,0);
  assert.ok((await restarted.restore.downloadSafetyCopy(fresh.safetyCopyId)).events.some(e=>e.datasetId==='local'));
});
for(const failure of ['snapshot-manifest','epoch']) test(`lost ${failure} response resumes same IDs after real restart`,async()=>{
  const a=await setupRestoreFixture(),p=await a.restore.prepare(a.olderBackup);
  a.drive.loseUploadKind=failure;
  await assert.rejects(a.restore.confirm(p.previewId),e=>e.code==='network');
  const pending=a.commands.getState().restoreJobs.find(j=>j.previewId===p.previewId);
  const reserved=pending.uploads.map(u=>u.fileId);
  assert.equal(project(a.commands.getState().ledger).profiles.p1.points,10);
  const resumed=await setupRestoreFixture({drive:a.drive,state:a.store.snapshot()});
  await resumed.restore.confirm(p.previewId);
  assert.equal(project(resumed.commands.getState().ledger).profiles.p1.points,0);
  assert.ok(reserved.every(id=>resumed.commands.getState().restoreJobs.find(j=>j.id===pending.id).uploads.some(u=>u.fileId===id)));
});
test('two restore successors require all heads and explicit selected snapshot confirmation',async()=>{
  const a=await setupRestoreFixture({connected:false}),b=await setupRestoreFixture({connected:false,drive:a.drive});
  const pa=await a.restore.prepare(a.olderBackup);await a.restore.confirm(pa.previewId);
  const pb=await b.restore.prepare(await exportBackup(b.commands.getState(),now().toISOString()));await b.restore.confirm(pb.previewId);
  const listFiles=a.drive.listFiles.bind(a.drive);
  a.drive.listFiles=async query=>(await listFiles(query)).reverse();
  await a.sync.createDataset('Family');await b.sync.joinDataset((await b.sync.discover())[0],'confirm');
  await b.sync.sync();await a.sync.sync();
  const {resolveEpochs}=await import('../../src/trainer/model/epochs.js');
  const resolved=resolveEpochs(a.commands.getState().ledger);
  assert.equal(resolved.heads.length,2);assert.equal(resolved.epochConflict,true);
  await assert.rejects(exportBackup(a.commands.getState(),now().toISOString()),e=>e.code==='conflict');
  await assert.rejects(a.restore.resolveEpochConflict({selectedEpochId:resolved.heads[0],expectedHeads:[resolved.heads[0]]}),e=>e.code==='stale');
  const p=await a.restore.resolveEpochConflict({selectedEpochId:resolved.heads[0],expectedHeads:resolved.heads});
  assert.equal(resolveEpochs(a.commands.getState().ledger).epochConflict,true);
  await a.restore.confirm(p.previewId);await b.sync.sync();
  const epoch=a.commands.getState().ledger.epochs.find(e=>e.id===project(a.commands.getState().ledger).activeEpochId);
  assert.deepEqual(epoch.parents,[...resolved.heads].sort());
  assert.equal(project(b.commands.getState().ledger).epochConflict,false);
});
test('completion adoption rejects incomplete answer selection; selected content can leave a visible conflict',async()=>{
  const h=await setupRestoreFixture({connected:false});
  const {productStateHash}=await import('../../src/trainer/commands.js');
  let before=h.commands.getState(),next=structuredClone(before);
  const complete=h.f.event('round.completed',{roundId:'r1',profileId:'p1',reason:'exhausted',answerIds:['recent']},{id:'old-complete',clock:100});
  const revision=h.f.event('entity.revised',{entityType:'profile',entityId:'p1',parents:['rev-p1'],value:{name:'Old name',archived:false}},{id:'old-name',clock:101});
  next.ledger.events.push(complete,revision);next.clock=101;
  await h.commands.commitExternal(next,await productStateHash(before));
  const p=await h.restore.prepare(h.olderBackup);await h.restore.confirm(p.previewId);
  await assert.rejects(h.restore.previewAdoption(['old-complete']),e=>e.code==='reference');
  await h.commands.revise({entityType:'profile',entityId:'p1',expectedHeads:['rev-p1'],value:{name:'Current name',archived:false}});
  const content=await h.restore.previewAdoption(['old-name']);assert.ok(content.summary.conflicts.length);
  await h.restore.adopt({eventIds:['old-name'],previewId:content.previewId});
  assert.ok(project(h.commands.getState().ledger).conflicts.length);
  const completion=await h.restore.previewAdoption(['old-complete','recent']);
  await h.restore.adopt({eventIds:['old-complete','recent'],previewId:completion.previewId});
  assert.equal(project(h.commands.getState().ledger).profiles.p1.points,30);
});
test('a local change while safety uploads invalidates preparation instead of leaving the new fact unprotected',async()=>{
  const h=await setupRestoreFixture();let changed=false;
  h.drive.onRead=async fileId=>{
    if(!changed && h.drive.files.get(fileId).value?.purpose==='safety') {
      changed=true;await h.commands.setAnimations({profileId:'p1',animations:false});
    }
  };
  await assert.rejects(h.restore.prepare(h.olderBackup),e=>e.code==='stale');
  assert.equal(h.commands.getState().ledger.epochs.length,1);
  h.drive.onRead=null;
  const p=await h.restore.prepare(h.olderBackup);await h.restore.confirm(p.previewId);
  const copies=await h.restore.listSafetyCopies();
  assert.ok((await h.restore.downloadSafetyCopy(copies.at(-1).id)).events.some(e=>e.type==='preference.changed'));
});
test('a missing snapshot part prevents the receiving device from activating the epoch',async()=>{
  const a=await setupRestoreFixture(),b=await setupRestoreFixture({connected:false,drive:a.drive});
  await b.sync.joinDataset((await b.sync.discover())[0],'confirm');await b.sync.sync();
  const p=await a.restore.prepare(a.olderBackup);await a.restore.confirm(p.previewId);
  const restoreJob=a.commands.getState().restoreJobs.find(j=>j.previewId===p.previewId);
  const manifest=restoreJob.uploads.find(u=>u.kind==='snapshot-manifest' && u.value.purpose==='restore');
  const fileId=manifest.value.parts[0].fileId,saved=a.drive.files.get(fileId);a.drive.files.delete(fileId);
  await assert.rejects(b.sync.sync());assert.equal(project(b.commands.getState().ledger).activeEpochId,'e0');
  a.drive.files.set(fileId,saved);await b.sync.sync();
  assert.equal(project(b.commands.getState().ledger).activeEpochId,restoreJob.epoch.id);
});
test('a new device discovers and downloads the dated Drive safety backup without local restore history',async()=>{
  const a=await setupRestoreFixture(),p=await a.restore.prepare(a.olderBackup);await a.restore.confirm(p.previewId);
  const b=await setupRestoreFixture({connected:false,drive:a.drive});
  await b.sync.joinDataset((await b.sync.discover())[0],'confirm');await b.sync.sync();
  const copies=(await b.restore.listSafetyCopies()).filter(c=>c.driveManifestFileId!==null);assert.equal(copies.length,1);
  assert.equal(copies[0].createdAt,now().toISOString());
  const backup=await b.restore.downloadSafetyCopy(copies[0].id);
  assert.equal(backup.exportedAt,now().toISOString());assert.ok(backup.events.some(e=>e.id==='recent'));
  assert.equal(b.commands.getState().restoreJobs.length,0);
});
test('crash after published epoch before local activation resumes the exact persisted job',async()=>{
  const h=await setupRestoreFixture(),p=await h.restore.prepare(h.olderBackup);
  const originalSave=h.store.save;let failed=false;
  h.store.save=async next=>{
    if(!failed && next.restoreJobs.some(j=>j.previewId===p.previewId && j.phase==='activated')){failed=true;throw new Error('synthetic crash');}
    return originalSave(next);
  };
  await assert.rejects(h.restore.confirm(p.previewId),e=>e.code==='storage');
  const job=h.store.snapshot().restoreJobs.find(j=>j.previewId===p.previewId);assert.equal(job.phase,'published');
  assert.equal(project(h.commands.getState().ledger).profiles.p1.points,10);
  const resumed=await setupRestoreFixture({drive:h.drive,state:h.store.snapshot()});await resumed.restore.confirm(p.previewId);
  assert.equal(project(resumed.commands.getState().ledger).activeEpochId,job.epoch.id);
  assert.equal(project(resumed.commands.getState().ledger).profiles.p1.points,0);
});
test('foreign backup explicitly reanchors onto target identity and retains origin as history only',async()=>{
  const target=await setupRestoreFixture();
  const foreign=createFixture({timeZone:'America/New_York'}).base;
  const ids=new Set(['d1','e0','p1','l1','w1','w2','w3','rev-p1','rev-l1','rev-w1','rev-w2','rev-w3','learn-w1','learn-w2','learn-w3']);
  const converted=JSON.parse(JSON.stringify(foreign),(key,value)=>typeof value==='string' && ids.has(value)?`foreign-${value}`:value);
  const backup=await exportBackup(productState(converted),now().toISOString());
  const p=await target.restore.prepare(backup);assert.equal(p.summary.foreignDataset,true);
  assert.deepEqual(p.summary.timeZoneChange,{from:'America/New_York',to:'Europe/Berlin'});
  await target.restore.confirm(p.previewId);
  const state=target.commands.getState();assert.equal(state.ledger.descriptor.datasetId,'d1');
  assert.equal(state.ledger.epochs.some(e=>e.id==='foreign-e0'),false);
  assert.equal(state.ledger.historicalEpochs.some(e=>e.id==='foreign-e0'),true);
  assert.ok(project(state.ledger).profiles['foreign-p1']);
  const b=await setupRestoreFixture({connected:false,drive:target.drive});
  await b.sync.joinDataset((await b.sync.discover())[0],'confirm');await b.sync.sync();
  assert.ok(project(b.commands.getState().ledger).profiles['foreign-p1']);
  assert.equal(project(b.commands.getState().ledger).profiles.p1,undefined);
});
test('colliding foreign event IDs and invalid backup leave the full state unchanged',async()=>{
  const h=await setupRestoreFixture({connected:false});
  const collision=createFixture().base;collision.events[0].payload.value.name='Other';
  const backup=await exportBackup(productState(collision),now().toISOString()),before=h.commands.getState();
  await assert.rejects(h.restore.prepare(backup),e=>e.code==='collision');assert.deepEqual(h.commands.getState(),before);
  await assert.rejects(h.restore.prepare({...backup,formatVersion:99}),e=>e.code==='version');assert.deepEqual(h.commands.getState(),before);
});
test('malformed persisted restore jobs and snapshot indexes fail closed at load',async()=>{
  for(const field of ['restoreJobs','safetyCopies','snapshotManifests']) {
    const state=productState(createFixture().base);state[field]=[{id:'broken',token:'unexpected'}];
    await assert.rejects(setupRestoreFixture({connected:false,state}),e=>e.code==='invalid');
  }
});
test('special profile IDs survive restore CAS and downloadable backups as ordinary data',async()=>{
  const ledger=JSON.parse(JSON.stringify(createFixture().base),(key,value)=>value==='p1'?'__proto__':value);
  const h=await setupRestoreFixture({connected:false,state:productState(ledger)});
  const backup=await exportBackup(h.commands.getState(),now().toISOString());
  await h.commands.start({profileId:'__proto__',mode:'all',size:10});
  const p=await h.restore.prepare(backup);await h.restore.confirm(p.previewId);
  assert.equal(Object.hasOwn(h.commands.getState().rounds,'__proto__'),true);
  assert.equal(h.commands.getState().rounds.__proto__.status,'abandoned');
  assert.equal(Object.hasOwn(project(h.commands.getState().ledger).profiles,'__proto__'),true);
});
test('failed local safety readback never offers a usable restore preview',async()=>{
  const h=await setupRestoreFixture({connected:false}),load=h.store.load;
  h.store.load=async()=>{const state=await load();state.safetyCopies=[];return state;};
  await assert.rejects(h.restore.prepare(h.olderBackup),e=>e.code==='storage');
  assert.equal(h.commands.getState().ledger.epochs.length,1);
  assert.equal(h.commands.getState().safetyCopies.some(c=>c.purpose!=='format-migration' && c.verified),false);
});
test('resuming a published job preserves a round already begun in its new epoch',async()=>{
  const h=await setupRestoreFixture(),p=await h.restore.prepare(h.olderBackup),save=h.store.save;let failed=false;
  h.store.save=async next=>{if(!failed && next.restoreJobs.some(j=>j.phase==='activated')){failed=true;throw new Error('crash');}return save(next);};
  await assert.rejects(h.restore.confirm(p.previewId));
  await h.sync.sync();await h.commands.start({profileId:'p1',mode:'all',size:10});
  const round=h.commands.getState().rounds.p1;
  await h.restore.confirm(p.previewId);
  assert.deepEqual(h.commands.getState().rounds.p1,round);
});

async function cachedRestore({nullManifest=false}={}) {
  const h=await setupRestoreFixture({connected:!nullManifest});
  const conflictingBackup=await exportBackup(h.commands.getState(),now().toISOString());
  const preview=await h.restore.prepare(h.olderBackup);await h.restore.confirm(preview.previewId);
  if(nullManifest)await h.sync.createDataset('Family');
  await h.sync.sync();
  const state=h.commands.getState(),job=state.restoreJobs.find(j=>j.previewId===preview.previewId);
  const manifest=job.uploads.find(u=>u.kind==='snapshot-manifest' && u.value.purpose==='restore');
  const original=await readSnapshot({drive:h.drive,binding:state.binding,fileId:manifest.fileId,descriptor:state.ledger.descriptor});
  return {...h,conflictingBackup,original:original.backup,epoch:job.epoch,manifest};
}
async function publishSnapshot(h,backup) {
  const uploads=await planSnapshotUploads(backup,'restore',h.drive);
  for(const upload of uploads)await uploadVerified(h.drive,h.commands.getState().binding,upload);
  return uploads.at(-1);
}

for(const nullManifest of [false,true]) {
  test(`cached ${nullManifest?'null-manifest':'referenced-manifest'} epoch rejects a later conflicting snapshot identity`,async()=>{
    const h=await cachedRestore({nullManifest});
    const backup=structuredClone(h.conflictingBackup);backup.snapshot.id=h.epoch.snapshotId;
    const conflicting=await publishSnapshot(h,backup),before=h.commands.getState().ledger;
    await assert.rejects(h.sync.sync(),e=>e.code==='collision');
    assert.notEqual(h.sync.getStatus().phase,'synced');
    assert.ok(h.commands.getState().quarantinedFiles.some(f=>f.fileId===conflicting.fileId && f.code==='collision'));
    assert.deepEqual(h.commands.getState().ledger,before);
    const restarted=await setupRestoreFixture({connected:false,drive:h.drive,state:h.store.snapshot()});
    await assert.rejects(restarted.sync.sync(),e=>e.code==='collision');
    assert.equal(project(restarted.commands.getState().ledger).activeEpochId,h.epoch.id);
    const list=h.drive.listFiles.bind(h.drive);h.drive.listFiles=async query=>(await list(query)).reverse();
    const fresh=await setupRestoreFixture({connected:false,drive:h.drive});
    await fresh.sync.joinDataset((await fresh.sync.discover())[0],'confirm');
    await assert.rejects(fresh.sync.sync(),e=>e.code==='collision');
    assert.equal(project(fresh.commands.getState().ledger).activeEpochId,'e0');
  });
  test(`identical physical snapshot duplicates remain valid for ${nullManifest?'null-manifest':'referenced-manifest'} epochs, cached and fresh`,async()=>{
    const h=await cachedRestore({nullManifest});
    await publishSnapshot(h,h.original);
    assert.equal((await h.sync.sync()).phase,'synced');
    assert.equal(h.commands.getState().quarantinedFiles.length,0);
    const fresh=await setupRestoreFixture({connected:false,drive:h.drive});
    await fresh.sync.joinDataset((await fresh.sync.discover())[0],'confirm');
    assert.equal((await fresh.sync.sync()).phase,'synced');
    assert.equal(project(fresh.commands.getState().ledger).activeEpochId,h.epoch.id);
    assert.equal(project(fresh.commands.getState().ledger).profiles.p1.points,0);
  });
}
test('invalid independent snapshot manifest is quarantined without suppressing a good local upload',async()=>{
  const h=await cachedRestore(),backup=structuredClone(h.original);backup.snapshot.id='independent-snapshot';
  const uploads=await planSnapshotUploads(backup,'restore',h.drive);
  uploads.at(-1).value.totalHash='0'.repeat(64);
  for(const upload of uploads)await uploadVerified(h.drive,h.commands.getState().binding,upload);
  await h.commands.setAnimations({profileId:'p1',animations:false});
  const localId=h.commands.getState().outboxEventIds.at(-1);
  await assert.rejects(h.sync.sync(),e=>e.code==='invalid');
  assert.equal(h.commands.getState().pendingPackets.length,0);
  assert.equal(h.commands.getState().outboxEventIds.length,0);
  assert.ok([...h.drive.files.values()].some(f=>f.value?.kind==='packet' && f.value.events.some(e=>e.id===localId)));
  assert.ok(h.commands.getState().quarantinedFiles.some(f=>f.fileId===uploads.at(-1).fileId));
});
