import test from 'node:test';
import assert from 'node:assert/strict';
import {exportBackup, parseBackup, previewBackup} from '../../src/trainer/backup/format.js';
import {createFixture} from './fixtures.js';
import {planSnapshotUploads,uploadVerified,readSnapshot} from '../../src/trainer/backup/transport.js';
import {snapshotHash} from '../../src/trainer/backup/format.js';
import {SyntheticDrive} from './backup-fixtures.js';

const time = '2026-09-18T10:00:00.000Z';
test('portable backup includes pending facts but excludes all local transport and credentials', async () => {
  const f = createFixture();
  const ledger = f.withEvents(f.roundStarted, f.answer({id:'pending-answer'}));
  const state = {ledger, binding:{accountId:'private-account'}, pinVerifier:{hash:'private-pin'},
    rounds:{p1:{feedback:{typed:'private-typed'}}}, datasetSetup:{name:'private-setup'},
    packetIntegrity:[{packetId:'private-packet'}], safetyCopies:[]};
  const backup = await exportBackup(state, time);
  assert.ok(backup.events.some(e=>e.id === 'pending-answer'));
  assert.equal(JSON.stringify(backup).includes('private-'), false);
  assert.deepEqual(await parseBackup(JSON.stringify(backup)), backup);
});
test('invalid versions, unknown keys, hash damage and broken references reject the whole backup', async () => {
  const good = await exportBackup({ledger:createFixture().base,safetyCopies:[]}, time);
  for (const damage of [b=>b.formatVersion=99, b=>b.token='secret', b=>b.snapshot.contentHash='0'.repeat(64),
    b=>b.events.pop(), b=>b.events[0].payload.value.name='changed']) {
    const b = structuredClone(good); damage(b);
    await assert.rejects(parseBackup(JSON.stringify(b)));
  }
  await assert.rejects(parseBackup('{"__proto__":{}}'));
  await assert.rejects(parseBackup(' '.repeat(25*1024*1024+1)));
});
test('preview computes points from events, handles special IDs and names foreign timezones', async () => {
  const f = createFixture();
  const current = {ledger:f.withEvents(f.roundStarted,f.answer({id:'a1'})),binding:{datasetId:'d1'}};
  const backup = await exportBackup({ledger:f.base,safetyCopies:[]}, time);
  const summary = previewBackup({current,backup});
  assert.equal(summary.wordCount.after,3);
  assert.equal(summary.progressChanges.find(p=>p.profileId==='p1').points.after,0);
  assert.equal(summary.progressChanges.find(p=>p.profileId==='p1').points.before,10);
  assert.equal(summary.affectsConnectedDevices,true);
});
test('snapshot hash remains unchanged when unrelated later facts arrive',async()=>{
  const f=createFixture(),backup=await exportBackup({ledger:f.base,safetyCopies:[]},time);
  assert.equal(await snapshotHash(backup.snapshot,[...backup.events,f.roundStarted,f.answer({id:'late'})]),backup.snapshot.contentHash);
});
test('snapshot parts obey 64 KiB and missing or damaged parts never validate',async()=>{
  const f=createFixture({words:Array.from({length:220},(_,i)=>[`w${i}`,'Wort '+i,['x'.repeat(190),'y'.repeat(190)]])});
  const backup=await exportBackup({ledger:f.base,safetyCopies:[]},time),drive=new SyntheticDrive();
  const binding={accountId:'account-a',folderId:'folder',datasetId:'d1'};
  const uploads=await planSnapshotUploads(backup,'restore',drive);
  assert.ok(uploads.filter(u=>u.kind==='snapshot-part').length>1);
  for(const u of uploads){if(u.kind==='snapshot-part')assert.ok(Buffer.byteLength(JSON.stringify(u.value))<=65536);await uploadVerified(drive,binding,u);}
  const manifest=uploads.at(-1),part=uploads[0];
  const read=()=>readSnapshot({drive,binding,fileId:manifest.fileId,descriptor:f.base.descriptor});
  assert.deepEqual((await read()).backup.events,backup.events);
  const saved=drive.files.get(part.fileId);drive.files.delete(part.fileId);await assert.rejects(read());
  drive.files.set(part.fileId,saved);saved.value.events[0].clock+=1;await assert.rejects(read(),e=>e.code==='invalid');
});
