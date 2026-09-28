import test from 'node:test';
import assert from 'node:assert/strict';
import {exportBackup, parseBackup, previewBackup} from '../../src/trainer/backup/format.js';
import {createFixture} from './fixtures.js';
import {planSnapshotUploads,uploadVerified,readSnapshot,readVerifiedFile,createSnapshotReadContext,readSnapshotFile} from '../../src/trainer/backup/transport.js';
import {snapshotHash} from '../../src/trainer/backup/format.js';
import {SyntheticDrive} from './backup-fixtures.js';

const time = '2026-09-18T10:00:00.000Z';

function snapshotReader({revision = 'revision-a', mutateOnRead = () => {}} = {}) {
  const drive = new SyntheticDrive();
  const binding = {accountId: 'account-a', folderId: 'folder', datasetId: 'd1'};
  const value = {id: 'epoch-a'};
  drive.addJson({id: 'file-a', parentId: binding.folderId,
    appProperties: {app: 'vokabeltrainer-product', kind: 'epoch', datasetId: binding.datasetId, epochId: value.id}, value});
  if (revision !== null) drive.files.get('file-a').meta.headRevisionId = revision;
  drive.onRead = async () => mutateOnRead(drive.files.get('file-a'));
  return {drive, binding, value, read: () => readVerifiedFile(drive, 'file-a', binding, 'epoch')};
}

test('snapshot read accepts metadata version drift with a stable content revision', async () => {
  const fixture = snapshotReader({mutateOnRead: (file) => { file.meta.version = '2'; }});
  assert.deepEqual(await fixture.read(), fixture.value);
});

test('snapshot read rejects changed or removed content revisions', async (t) => {
  for (const [name, change] of [
    ['changed', (file) => { file.meta.headRevisionId = 'revision-b'; }],
    ['removed', (file) => { delete file.meta.headRevisionId; }],
  ]) await t.test(name, async () => {
    const fixture = snapshotReader({mutateOnRead: change});
    await assert.rejects(fixture.read(), {code: 'stale'});
  });
});

test('snapshot read keeps strict version comparison without a content revision', async () => {
  const fixture = snapshotReader({revision: null, mutateOnRead: (file) => { file.meta.version = '2'; }});
  await assert.rejects(fixture.read(), {code: 'stale'});
});

test('snapshot read keeps strict version comparison with a malformed content revision', async () => {
  const fixture = snapshotReader({revision: '', mutateOnRead: (file) => { file.meta.version = '2'; }});
  await assert.rejects(fixture.read(), {code: 'stale'});
});

test('snapshot read rejects changed binding metadata despite a stable content revision', async () => {
  const fixture = snapshotReader({mutateOnRead: (file) => { file.meta.appProperties.datasetId = 'other-dataset'; }});
  await assert.rejects(fixture.read(), {code: 'stale'});
});

test('snapshot read rejects unknown metadata drift despite a stable content revision', async () => {
  const fixture = snapshotReader({mutateOnRead: (file) => { file.meta.unexpectedField = 'changed'; }});
  await assert.rejects(fixture.read(), {code: 'stale'});
});

test('snapshot upload rejects changed content despite a stable content revision', async () => {
  const drive = new SyntheticDrive();
  const binding = {accountId: 'account-a', folderId: 'folder', datasetId: 'd1'};
  drive.onMetadata = async (id) => {
    const file = drive.files.get(id);
    file.meta.headRevisionId = 'revision-a';
    return structuredClone(file.meta);
  };
  drive.onRead = async (id) => {
    const file = drive.files.get(id);
    file.value.other = 2;
    file.meta.version = '2';
  };
  await assert.rejects(uploadVerified(drive, binding, {
    fileId: 'file-a', kind: 'epoch', value: {id: 'epoch-a', other: 1},
  }), {code: 'collision'});
});

test('an oversized checked snapshot file is read again instead of retained in the download cache', async () => {
  const drive = new SyntheticDrive();
  const binding = {accountId: 'account-a', folderId: 'folder', datasetId: 'd1'};
  drive.addJson({id: 'large-part', parentId: binding.folderId,
    appProperties: {app: 'vokabeltrainer-product', kind: 'snapshot-part', datasetId: 'd1', snapshotId: 'snapshot-a'},
    value: {format: 'vokabeltrainer-product', formatVersion: 1, ruleVersion: 1,
      kind: 'snapshot-part', snapshotId: 'snapshot-a', datasetId: 'd1', padding: 'x'.repeat(4 * 1024 * 1024)},
  });
  const context = createSnapshotReadContext(drive, binding, [drive.files.get('large-part').meta], []);

  await readSnapshotFile(context, 'large-part');
  await readSnapshotFile(context, 'large-part');

  assert.equal(drive.calls.filter(([method, id]) => method === 'readJson' && id === 'large-part').length, 2);
});

test('snapshot cache bounds the combined size of checked files', async () => {
  const drive = new SyntheticDrive();
  const binding = {accountId: 'account-a', folderId: 'folder', datasetId: 'd1'};
  for (let index = 0; index < 5; index++) drive.addJson({id: `large-part-${index}`, parentId: binding.folderId,
    appProperties: {app: 'vokabeltrainer-product', kind: 'snapshot-part', datasetId: 'd1', snapshotId: 'snapshot-a'},
    value: {format: 'vokabeltrainer-product', formatVersion: 1, ruleVersion: 1,
      kind: 'snapshot-part', snapshotId: 'snapshot-a', datasetId: 'd1', index,
      padding: 'x'.repeat(1024 * 1024)},
  });
  const context = createSnapshotReadContext(drive, binding,
    [...drive.files.values()].map(({meta}) => meta), []);

  for (let index = 0; index < 5; index++) await readSnapshotFile(context, `large-part-${index}`);
  await readSnapshotFile(context, 'large-part-0');
  await readSnapshotFile(context, 'large-part-4');

  assert.equal(drive.calls.filter(([method, id]) => method === 'readJson' && id === 'large-part-0').length, 1);
  assert.equal(drive.calls.filter(([method, id]) => method === 'readJson' && id === 'large-part-4').length, 2);
});

test('snapshot download cache stops retaining new files after its entry limit', async () => {
  const drive = new SyntheticDrive();
  const binding = {accountId: 'account-a', folderId: 'folder', datasetId: 'd1'};
  for (let index = 0; index < 129; index++) drive.addJson({id: `part-${index}`, parentId: binding.folderId,
    appProperties: {app: 'vokabeltrainer-product', kind: 'snapshot-part', datasetId: 'd1', snapshotId: 'snapshot-a'},
    value: {format: 'vokabeltrainer-product', formatVersion: 1, ruleVersion: 1,
      kind: 'snapshot-part', snapshotId: 'snapshot-a', datasetId: 'd1', index},
  });
  const context = createSnapshotReadContext(drive, binding,
    [...drive.files.values()].map(({meta}) => meta), []);

  for (let index = 0; index < 129; index++) await readSnapshotFile(context, `part-${index}`);
  await readSnapshotFile(context, 'part-128');

  assert.equal(drive.calls.filter(([method, id]) => method === 'readJson' && id === 'part-128').length, 2);
  assert.equal(drive.calls.filter(([method, id]) => method === 'readJson' && id === 'part-0').length, 1);
});
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
