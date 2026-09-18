import {canonical, digest} from '../model/canonical.js';
import {ProductError} from '../model/errors.js';
import {assertDescriptor, assertLedger, assertSnapshot, assertEpochHistory} from '../model/schema.js';
import {resolveEpochs} from '../model/epochs.js';
import {project} from '../learning/progress.js';

export const VERSION = {format:'vokabeltrainer-product',formatVersion:1,ruleVersion:1};
export const MAX_BACKUP_BYTES = 25 * 1024 * 1024;
export const sorted = values => [...values].sort((a,b)=>a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
export const fail = (code,message) => { throw new ProductError(code,message); };
export const bytes = value => new TextEncoder().encode(canonical(value)).byteLength;
export function exact(value, keys) {
  canonical(value);
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).sort().join('|') !== [...keys].sort().join('|')) {
    fail('invalid','Die Sicherungsdaten enthalten ungültige Felder.');
  }
}
export function version(value,kind) {
  if (value.format!==VERSION.format || value.formatVersion!==1 || value.ruleVersion!==1) {
    fail('version','Diese Sicherungsversion wird nicht unterstützt.');
  }
  if(value.kind!==kind) fail('invalid','Der Sicherungsdatentyp ist ungültig.');
}
export function epochHistory(ledger) {
  const entries = [...ledger.historicalEpochs,...ledger.epochs.map(({id,datasetId,parents,deviceId,clock,occurredAt})=>
    ({id,datasetId,parents,deviceId,clock,occurredAt}))];
  return mergeById([],entries);
}
export function mergeById(left,right) {
  const map=new Map();
  for(const entry of [...left,...right]) {
    if(map.has(entry.id) && canonical(map.get(entry.id))!==canonical(entry)) fail('collision','Eine ID enthält unterschiedliche Daten.');
    map.set(entry.id,structuredClone(entry));
  }
  return sorted(map.values());
}
export function snapshotEvents(snapshot,events) {
  const ids=new Set([...snapshot.effectiveEventIds,...snapshot.supportEventIds]);
  const selected=sorted(events.filter(e=>ids.has(e.id)));
  if(selected.length!==ids.size) fail('reference','Ein Sicherungsstand enthält fehlende Ereignisse.');
  return selected;
}
export function snapshotHash(snapshot,events) {
  return digest({datasetId:snapshot.datasetId,effectiveEventIds:snapshot.effectiveEventIds,
    supportEventIds:snapshot.supportEventIds,events:snapshotEvents(snapshot,events)});
}
export function dependencies(events,selectedIds) {
  const byId=new Map(events.map(e=>[e.id,e]));
  const firstEntities=new Map(),starts=new Map();
  for(const event of events) {
    if(event.type==='entity.revised') {
      const key=`${event.payload.entityType}:${event.payload.entityId}`,previous=firstEntities.get(key);
      if(!previous || event.clock<previous.clock || (event.clock===previous.clock && event.id<previous.id))firstEntities.set(key,event);
    }
    if(event.type==='round.started')starts.set(event.payload.roundId,event);
  }
  const result=new Set(selectedIds), queue=[...selectedIds];
  function add(id) { if(!byId.has(id)) fail('reference','Eine historische Abhängigkeit fehlt.'); if(!result.has(id)){result.add(id);queue.push(id);} }
  function entity(type,id) {
    const revision=firstEntities.get(`${type}:${id}`);
    if(!revision) fail('reference','Eine Inhaltsreferenz fehlt.');
    add(revision.id);
  }
  for(let i=0;i<queue.length;i++) {
    const e=byId.get(queue[i]); if(!e) fail('reference','Das ausgewählte Ereignis fehlt.');
    const p=e.payload;
    if(e.type==='entity.revised') {
      p.parents.forEach(add);
      if(p.entityType==='word') entity('lesson',p.value.lessonId);
      if(p.entityType==='lesson') p.value.profileIds.forEach(id=>entity('profile',id));
    } else {
      if(p.profileId) entity('profile',p.profileId);
      if(p.roundId && e.type!=='round.started') {
        const start=starts.get(p.roundId);
        if(!start) fail('reference','Der historische Rundenstart fehlt.'); add(start.id);
      }
      if(p.revisionId) add(p.revisionId);
      for(const id of [...(p.answerIds??[]),...(p.evidenceAnswerIds??[]),...(p.eventIds??[]),...(p.supportEventIds??[])]) add(id);
    }
  }
  return [...result].sort();
}
export function backupLedger(backup) {
  const root=backup.epochHistory.find(e=>e.id===backup.descriptor.rootEpochId);
  if(!root || root.parents.length) fail('reference','Die Herkunftswurzel der Sicherung fehlt.');
  const occupied=new Set(backup.epochHistory.map(e=>e.id));
  let viewNumber=0,viewId='backup-view-0'; while(occupied.has(viewId)) viewId=`backup-view-${++viewNumber}`;
  return assertLedger({descriptor:backup.descriptor,events:backup.events,snapshots:[backup.snapshot],
    historicalEpochs:backup.epochHistory,epochs:[
      {...VERSION,kind:'epoch',...root,snapshotId:null,snapshotManifestFileId:null},
      {...VERSION,kind:'epoch',id:viewId,datasetId:backup.descriptor.datasetId,parents:[root.id],
        deviceId:root.deviceId,clock:root.clock,occurredAt:root.occurredAt,snapshotId:backup.snapshot.id,snapshotManifestFileId:null},
    ]});
}
export function assertBackup(value) {
  exact(value,[...Object.keys(VERSION),'kind','exportedAt','descriptor','snapshot','events','epochHistory','safetyCopyIndex']);
  version(value,'backup');
  if(bytes(value)>MAX_BACKUP_BYTES || !Array.isArray(value.events) || value.events.length>100000) {
    fail('invalid','Eine Sicherung darf höchstens 25 MiB und 100.000 Ereignisse enthalten.');
  }
  assertDescriptor({...value.descriptor,createdAt:value.exportedAt});
  assertSnapshot(value.snapshot);
  if(!Array.isArray(value.epochHistory) || !Array.isArray(value.safetyCopyIndex)) fail('invalid','Die Sicherungslisten sind ungültig.');
  value.epochHistory.forEach(assertEpochHistory);
  const seen=new Set();
  for(const item of value.safetyCopyIndex) {
    exact(item,['id','createdAt','purpose','hash']);
    if(!/^[A-Za-z0-9_-]{1,128}$/.test(item.id) || !/^[0-9a-f]{64}$/.test(item.hash)
      || !['restore','safety','join'].includes(item.purpose) || seen.has(item.id)) fail('invalid','Der Sicherheitskopienindex ist ungültig.');
    seen.add(item.id); assertDescriptor({...value.descriptor,createdAt:item.createdAt});
  }
  const ledger=backupLedger(value);
  if(ledger.events.length!==value.events.length || ledger.historicalEpochs.length!==value.epochHistory.length) {
    fail('invalid','Die Sicherung enthält doppelte Einträge.');
  }
  const referenced=new Set([...value.snapshot.effectiveEventIds,...value.snapshot.supportEventIds]);
  if(dependencies(value.events,value.snapshot.effectiveEventIds).some(id=>!referenced.has(id))) {
    fail('reference','Eine notwendige Sicherungsreferenz fehlt in der Auswahl.');
  }
  const effective=new Set(resolveEpochs(ledger).effectiveEvents.map(e=>e.id));
  for(const e of ledger.events.filter(e=>effective.has(e.id) && e.type==='round.completed')) {
    if(e.payload.answerIds.some(id=>!effective.has(id))) fail('reference','Ein Abschluss benötigt die vollständige wirksame Antwortmenge.');
  }
  return structuredClone(value);
}
export async function validateBackup(value) {
  const checked=assertBackup(value);
  if(await snapshotHash(checked.snapshot,checked.events)!==checked.snapshot.contentHash)fail('invalid','Der Sicherungshash stimmt nicht.');
  return checked;
}
export async function parseBackup(text) {
  if(typeof text!=='string' || new TextEncoder().encode(text).byteLength>MAX_BACKUP_BYTES) fail('invalid','Die Sicherung überschreitet 25 MiB.');
  let value; try {value=JSON.parse(text);} catch {fail('invalid','Die Sicherung ist kein gültiges JSON.');}
  return validateBackup(value);
}
export async function exportBackup(state,exportedAt,{selectedEpochId}={}) {
  const ledger=assertLedger(state.ledger);
  let selection=ledger;
  if(selectedEpochId!==undefined) {
    const ancestors=new Set(); const visit=id=>{if(ancestors.has(id))return; const e=ledger.epochs.find(e=>e.id===id);
      if(!e)fail('reference','Die ausgewählte Epoche fehlt.'); ancestors.add(id);e.parents.forEach(visit);};
    visit(selectedEpochId);
    selection={...ledger,epochs:ledger.epochs.filter(e=>ancestors.has(e.id)),historicalEpochs:epochHistory(ledger)};
  }
  const resolved=resolveEpochs(selection);
  if(resolved.epochConflict || !resolved.activeEpochId) fail('conflict','Vor dem Export bitte einen vollständigen Epochenstand auswählen.');
  const effectiveEventIds=resolved.effectiveEvents.map(e=>e.id).sort();
  const activeIds=new Set(effectiveEventIds);
  const supportEventIds=dependencies(ledger.events,effectiveEventIds).filter(id=>!activeIds.has(id));
  const snapshot={id:'pending',datasetId:ledger.descriptor.datasetId,effectiveEventIds,supportEventIds,contentHash:''};
  snapshot.contentHash=await snapshotHash(snapshot,ledger.events);
  snapshot.id=`backup-${await digest({contentHash:snapshot.contentHash,events:sorted(ledger.events),epochHistory:epochHistory(ledger),exportedAt})}`;
  return validateBackup({...VERSION,kind:'backup',exportedAt,descriptor:ledger.descriptor,snapshot,events:sorted(ledger.events),
    epochHistory:epochHistory(ledger),safetyCopyIndex:(state.safetyCopies??[]).map(({id,createdAt,purpose,hash})=>({id,createdAt,purpose,hash}))});
}
export function previewBackup({current,backup}) {
  const before=project(current.ledger),after=project(backupLedger(backup));
  const ids=[...new Set([...Object.keys(before.profiles),...Object.keys(after.profiles)])].sort();
  const get=(projection,id)=>Object.hasOwn(projection.profiles,id)?projection.profiles[id]:null;
  const contentChanges=[];
  for(const [entityType,bucket] of [['profile','profiles'],['lesson','lessons'],['word','words']]) {
    const entityIds=[...new Set([...Object.keys(before.entities[bucket]),...Object.keys(after.entities[bucket])])].sort();
    for(const entityId of entityIds) {
      const left=Object.hasOwn(before.entities[bucket],entityId)?before.entities[bucket][entityId]:null;
      const right=Object.hasOwn(after.entities[bucket],entityId)?after.entities[bucket][entityId]:null;
      if(canonical(left)!==canonical(right))contentChanges.push({entityType,entityId,before:left,after:right});
    }
  }
  const countAnswers=ledger=>resolveEpochs(ledger).effectiveEvents.filter(e=>e.type==='answer.recorded').length;
  return {profiles:{before:Object.keys(before.profiles).length,after:Object.keys(after.profiles).length},
    wordCount:{before:Object.keys(before.entities.words).length,after:Object.keys(after.entities.words).length},
    answerCount:{before:countAnswers(current.ledger),after:countAnswers(backupLedger(backup))},contentChanges,
    progressChanges:ids.map(profileId=>({profileId,points:{before:get(before,profileId)?.points??0,after:get(after,profileId)?.points??0},
      words:{before:Object.entries(get(before,profileId)?.words??{}),after:Object.entries(get(after,profileId)?.words??{})}})),
    conflicts:after.conflicts,affectsConnectedDevices:current.binding!==null && current.binding!==undefined,
    foreignDataset:current.ledger.descriptor.datasetId!==backup.descriptor.datasetId,
    timeZoneChange:current.ledger.descriptor.timeZone===backup.descriptor.timeZone?null:
      {from:backup.descriptor.timeZone,to:current.ledger.descriptor.timeZone},limits:{bytes:MAX_BACKUP_BYTES,events:100000}};
}
