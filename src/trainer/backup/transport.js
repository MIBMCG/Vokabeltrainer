import {assertSupportedVersion, assertContainedVersion, versionOf} from '../model/versions.js';
import {digest} from '../model/canonical.js';
import {productStateHash} from '../commands.js';
import {assertSnapshot} from '../model/schema.js';
import {VERSION,bytes,exact,version,fail,sorted,validateBackup,exportBackup} from './format.js';

const APP=VERSION.format;
export async function mutateState(commands,transform) {
  for(let attempt=0;attempt<20;attempt++) {
    const before=commands.getState();
    const hash=await productStateHash(before),next=structuredClone(before);
    if(await transform(next,before)===false) return before;
    try {await commands.commitExternal(next,hash);return commands.getState();}
    catch(error){if(error.code!=='stale')throw error;}
  }
  fail('stale','Der lokale Stand ändert sich fortlaufend. Bitte erneut versuchen.');
}
export async function localSafetyCopy({commands,store,now,id,purpose='safety',selectedEpochId}) {
  const before=commands.getState(),backup=await exportBackup(before,now().toISOString(),{selectedEpochId});
  const record={id:id(),createdAt:backup.exportedAt,purpose,backup,hash:await digest(backup),driveManifestFileId:null,verified:false};
  const next=structuredClone(before);next.safetyCopies.push(record);
  await commands.commitExternal(next,await productStateHash(before));
  const reread=(await store.load()).safetyCopies.find(e=>e.id===record.id);
  if(!reread || await digest(reread.backup)!==record.hash) fail('storage','Die lokale Sicherheitskopie konnte nicht geprüft werden.');
  await mutateState(commands,state=>{state.safetyCopies.find(e=>e.id===record.id).verified=true;});
  return {...record,verified:true};
}
export async function planSnapshotUploads(backup,purpose,drive) {
  await validateBackup(backup);
  const {snapshot}=backup,parts=[];
  const transportVersion=versionOf(backup);
  const fresh=()=>({...transportVersion,kind:'snapshot-part',snapshotId:snapshot.id,datasetId:snapshot.datasetId,index:parts.length,events:[],epochHistory:[]});
  let part=fresh();
  for(const [key,entries] of [['events',sorted(backup.events)],['epochHistory',sorted(backup.epochHistory)]]) {
    for(const entry of entries) {
      part[key].push(entry);
      if(bytes(part)>64*1024) {
        part[key].pop();
        if(!part.events.length && !part.epochHistory.length) fail('invalid','Ein Snapshot-Eintrag überschreitet 64 KiB.');
        parts.push(part);part=fresh();part[key].push(entry);
        if(bytes(part)>64*1024)fail('invalid','Ein Snapshot-Eintrag überschreitet 64 KiB.');
      }
    }
  }
  parts.push(part);
  const uploads=[];
  for(const value of parts) uploads.push({kind:value.kind,logicalId:snapshot.id,fileId:await drive.generateId(),value,verified:false});
  const backupMetadata={exportedAt:backup.exportedAt,safetyCopyIndex:backup.safetyCopyIndex,
    ...(backup.formatVersion===3?{economy:structuredClone(backup.economy)}:{})};
  const manifest={...transportVersion,kind:'snapshot-manifest',snapshotId:snapshot.id,datasetId:snapshot.datasetId,purpose,snapshot,backupMetadata,
    parts:await Promise.all(uploads.map(async(u,index)=>({fileId:u.fileId,hash:await digest(u.value),index}))),
    totalHash:await digest({snapshot,events:sorted(backup.events),epochHistory:sorted(backup.epochHistory),backupMetadata})};
  uploads.push({kind:manifest.kind,logicalId:snapshot.id,fileId:await drive.generateId(),value:manifest,verified:false});
  return uploads;
}
export function assertTransportMetadata(meta,binding,kind) {
  if(!meta || meta.trashed!==false || meta.mimeType!=='application/json'
    || meta.parents?.length!==1 || meta.parents[0]!==binding.folderId
    || meta.appProperties?.app!==APP || meta.appProperties.kind!==kind
    || meta.appProperties.datasetId!==binding.datasetId) fail('binding','Die Sicherungsdatei gehört nicht zum verbundenen Ordner.');
}
function comparableMetadata(before,after) {
  const sameContentRevision=typeof before.headRevisionId==='string' && before.headRevisionId.trim()!==''
    && before.headRevisionId===after.headRevisionId;
  if(!sameContentRevision)return [before,after];
  const {version: _beforeVersion,...stableBefore}=before;
  const {version: _afterVersion,...stableAfter}=after;
  return [stableBefore,stableAfter];
}
async function readVerifiedFileDetailed(drive,fileId,binding,kind,listedMetadata=null) {
  if(typeof fileId!=='string' || !/^[A-Za-z0-9_-]{1,128}$/.test(fileId))fail('invalid','Die Sicherungsdatei-ID ist ungültig.');
  const before=await drive.metadata(fileId);assertTransportMetadata(before,binding,kind);
  if(before.id!==fileId)fail('binding','Die gelesene Sicherungsdatei hat eine andere ID.');
  if(listedMetadata!==null) {
    const [listed,first]=comparableMetadata(listedMetadata,before);
    if(await digest(listed)!==await digest(first))fail('stale','Eine Sicherungsdatei wurde vor dem Lesen geändert.');
  }
  const value=await drive.readJson(fileId),after=await drive.metadata(fileId);
  const [stableBefore,stableAfter]=comparableMetadata(before,after);
  if(await digest(stableBefore)!==await digest(stableAfter))fail('stale','Eine Sicherungsdatei wurde während des Lesens geändert.');
  if(kind==='epoch' ? before.appProperties.epochId!==value?.id : before.appProperties.snapshotId!==value?.snapshotId) {
    fail('binding','Inhalt und Drive-Kennung der Sicherungsdatei widersprechen sich.');
  }
  return {value,hash:await digest(value),metadata:after};
}
export async function readVerifiedFile(drive,fileId,binding,kind) {
  return (await readVerifiedFileDetailed(drive,fileId,binding,kind)).value;
}

// Only this module can populate the context, and only after a bracketed Drive read.
const snapshotReadContexts=new WeakMap();
const MAX_SNAPSHOT_CACHE_BYTES=4*1024*1024;
const MAX_SNAPSHOT_CACHE_ENTRIES=128;
export function createSnapshotReadContext(drive,binding,listedFiles,knownFiles) {
  const context=Object.freeze({});
  snapshotReadContexts.set(context,{drive,binding:structuredClone(binding),files:new Map(),cachedBytes:0,
    listed:new Map(listedFiles.filter(meta=>['snapshot-part','snapshot-manifest'].includes(meta?.appProperties?.kind))
      .map(meta=>[meta.id,structuredClone(meta)])),
    knownHashes:new Map(knownFiles.map(({fileId,contentHash})=>[fileId,contentHash]))});
  return context;
}
function snapshotContext(context,drive,binding) {
  const state=snapshotReadContexts.get(context);
  if(!state || state.drive!==drive || state.binding.accountId!==binding.accountId
    || state.binding.folderId!==binding.folderId || state.binding.datasetId!==binding.datasetId) {
    fail('binding','Der Snapshot-Lesekontext gehört zu einer anderen Verbindung.');
  }
  return state;
}
async function readContextFile(state,fileId,kind) {
  const listed=state.listed.get(fileId);
  if(!listed)fail('missing','Ein Snapshot-Teil fehlt in der Drive-Dateiliste.');
  if(listed.appProperties.kind!==kind)fail('binding','Die Snapshot-Dateikennung stimmt nicht.');
  const cached=state.files.get(fileId);
  if(cached) {
    if(cached.kind!==kind)fail('binding','Die Snapshot-Dateikennung stimmt nicht.');
    // A revision after the first read must still fail, even within one download.
    const current=await state.drive.metadata(fileId);
    assertTransportMetadata(current,state.binding,kind);
    if(current.id!==fileId)fail('binding','Die gelesene Sicherungsdatei hat eine andere ID.');
    const [previous,latest]=comparableMetadata(cached.metadata,current);
    if(await digest(previous)!==await digest(latest))fail('stale','Eine Sicherungsdatei wurde nach dem Lesen geändert.');
    return {value:structuredClone(cached.value),hash:cached.hash,metadata:current};
  }
  const {value,hash,metadata}=await readVerifiedFileDetailed(state.drive,fileId,state.binding,kind,listed);
  try { assertSupportedVersion(value); }
  catch(error) { error.inspectedValue=value; throw error; }
  const knownHash=state.knownHashes.get(fileId);
  if(knownHash!==undefined && knownHash!==hash) {
    try { fail('collision','Eine bereits bekannte Datei wurde nachträglich verändert.'); }
    catch(error) { error.inspectedValue=value; throw error; }
  }
  // The cache is optional; an overflow takes the same checked Drive read path again.
  if(state.files.size<MAX_SNAPSHOT_CACHE_ENTRIES && state.cachedBytes<MAX_SNAPSHOT_CACHE_BYTES) {
    const size=bytes(value);
    if(size<=MAX_SNAPSHOT_CACHE_BYTES-state.cachedBytes) {
      state.files.set(fileId,{kind,value:structuredClone(value),hash,metadata:structuredClone(metadata)});
      state.cachedBytes+=size;
    }
  }
  return {value,hash,metadata};
}
export async function readSnapshotFile(context,fileId) {
  const state=snapshotReadContexts.get(context),kind=state?.listed.get(fileId)?.appProperties?.kind;
  if(!state || !['snapshot-part','snapshot-manifest'].includes(kind))fail('invalid','Die Snapshot-Dateikennung ist ungültig.');
  return {skipped:false,...await readContextFile(state,fileId,kind)};
}
async function readSnapshotContextFile(context,drive,binding,fileId,kind) {
  if(context===undefined)return readVerifiedFile(drive,fileId,binding,kind);
  const state=snapshotContext(context,drive,binding);
  return (await readContextFile(state,fileId,kind)).value;
}
export async function uploadVerified(drive,binding,upload) {
  if(await drive.accountId()!==binding.accountId)fail('binding','Die Sicherheitskopie gehört zu einem anderen Google-Konto.');
  const appProperties={app:APP,kind:upload.kind,datasetId:binding.datasetId};
  if(upload.kind==='epoch') appProperties.epochId=upload.value.id;
  else appProperties.snapshotId=upload.value.snapshotId;
  await drive.putJson({id:upload.fileId,name:`${upload.kind}-${upload.fileId}.json`,parentId:binding.folderId,appProperties,value:upload.value});
  const value=await readVerifiedFile(drive,upload.fileId,binding,upload.kind);
  if(await digest(value)!==await digest(upload.value))fail('collision','Die hochgeladene Sicherungsdatei stimmt beim Rücklesen nicht überein.');
}
export async function readSnapshot({drive,binding,fileId,descriptor,context}) {
  const manifest=await readSnapshotContextFile(context,drive,binding,fileId,'snapshot-manifest');
  assertSupportedVersion(manifest);
  exact(manifest,[...Object.keys(VERSION),'kind','snapshotId','datasetId','purpose','snapshot','parts','totalHash','backupMetadata']);
  exact(manifest.backupMetadata,['exportedAt','safetyCopyIndex',...(manifest.formatVersion===3?['economy']:[])]);
  version(manifest,'snapshot-manifest');
  assertSnapshot(manifest.snapshot);
  if(manifest.datasetId!==binding.datasetId || manifest.snapshotId!==manifest.snapshot?.id
    || !['restore','safety'].includes(manifest.purpose) || !Array.isArray(manifest.parts) || !manifest.parts.length
    || manifest.parts.length>10000)fail('invalid','Das Snapshot-Manifest ist ungültig.');
  const events=[],epochHistory=[],seen=new Set();
  for(let index=0;index<manifest.parts.length;index++) {
    const ref=manifest.parts[index];exact(ref,['fileId','hash','index']);
    if(ref.index!==index || seen.has(ref.fileId) || !/^[0-9a-f]{64}$/.test(ref.hash))fail('invalid','Die Snapshot-Teile sind unvollständig oder doppelt.');
    seen.add(ref.fileId);
    const part=await readSnapshotContextFile(context,drive,binding,ref.fileId,'snapshot-part');
    assertContainedVersion(manifest,[part]);
    assertContainedVersion(part,part.events ?? []);
    exact(part,[...Object.keys(VERSION),'kind','snapshotId','datasetId','index','events','epochHistory']);version(part,'snapshot-part');
    if(bytes(part)>64*1024 || part.index!==index || part.snapshotId!==manifest.snapshotId || part.datasetId!==binding.datasetId
      || !Array.isArray(part.events) || !Array.isArray(part.epochHistory) || await digest(part)!==ref.hash) fail('invalid','Ein Snapshot-Teil ist beschädigt.');
    events.push(...part.events);epochHistory.push(...part.epochHistory);
    if(events.length>100000 || bytes({events,epochHistory})>25*1024*1024)fail('invalid','Der Snapshot überschreitet die Sicherungsgrenzen.');
  }
  if(await digest({snapshot:manifest.snapshot,events:sorted(events),epochHistory:sorted(epochHistory),backupMetadata:manifest.backupMetadata})!==manifest.totalHash) {
    fail('invalid','Der vollständige Snapshot-Hash stimmt nicht.');
  }
  const backup=await validateBackup({...versionOf(manifest),kind:'backup',descriptor,...manifest.backupMetadata,
    snapshot:manifest.snapshot,events,epochHistory});
  return {manifest,backup};
}
