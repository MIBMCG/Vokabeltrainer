import {digest} from '../model/canonical.js';
import {assertLedger,mergeEvents} from '../model/schema.js';
import {resolveEpochs} from '../model/epochs.js';
import {dayInZone} from '../learning/calendar.js';
import {productStateHash} from '../commands.js';
import {VERSION,fail,validateBackup,exportBackup,previewBackup,dependencies,snapshotHash,mergeById} from './format.js';
import {mutateState,localSafetyCopy,planSnapshotUploads,uploadVerified} from './transport.js';

function heads(state){return resolveEpochs(state.ledger).heads.sort();}
async function basis(state) {
  // Transport bookkeeping must not invalidate its own preview. Local learning and binding do.
  return productStateHash({...state,outboxEventIds:[],pendingPackets:[],knownFiles:[],quarantinedFiles:[],
    safetyCopies:[],restoreJobs:[],snapshotManifests:[],packetIntegrity:[],datasetSetup:null});
}
async function previewHash(state,backup){return digest({basis:await basis(state),backup});}
function combinedLedger(current,backup,snapshot,epoch=null) {
  const datasetId=current.descriptor.datasetId;
  return assertLedger({...current,events:mergeEvents(current.events,backup.events.map(e=>({...e,datasetId}))),
    historicalEpochs:mergeById(current.historicalEpochs,backup.epochHistory.map(e=>({...e,datasetId}))),
    snapshots:mergeById(current.snapshots,[snapshot]),epochs:epoch?mergeById(current.epochs,[epoch]):current.epochs});
}
export function createRestoreService({commands,store,sync,drive,now,id}) {
  let tail=Promise.resolve(); const adoptions=new Map();
  const enqueue=fn=>{const p=tail.then(fn);tail=p.catch(()=>{});return p;};
  const jobFor=jobId=>commands.getState().restoreJobs.find(j=>j.id===jobId);
  async function changeJob(jobId,fn){await mutateState(commands,next=>{const job=next.restoreJobs.find(j=>j.id===jobId);if(!job)fail('reference','Der Wiederherstellungsauftrag fehlt.');return fn(job,next);});}
  async function syncFresh({allowConflict=false}={}) {
    if(commands.getState().binding) {
      await sync.sync();
      const s=commands.getState();
      if(s.pendingPackets.length || s.outboxEventIds.length || s.quarantinedFiles.length)fail('not-ready','Vor der Wiederherstellung ist ein vollständiger Abgleich nötig.');
    }
    if(!allowConflict && resolveEpochs(commands.getState().ledger).epochConflict)fail('conflict','Bitte zuerst die gemeinsame Datensatzversion auswählen.');
  }
  async function persistUploads(jobId,backup,purpose) {
    const existing=jobFor(jobId).uploads.find(u=>u.kind==='snapshot-manifest' && u.value.purpose===purpose && u.logicalId===backup.snapshot.id);
    if(existing)return;
    const uploads=await planSnapshotUploads(backup,purpose,drive);
    await changeJob(jobId,job=>{job.uploads.push(...uploads);});
  }
  async function sendUploads(jobId,purpose) {
    const job=jobFor(jobId),binding=commands.getState().binding;
    const manifest=job.uploads.find(u=>u.kind==='snapshot-manifest' && u.value.purpose===purpose);
    const allowed=new Set([...manifest.value.parts.map(p=>p.fileId),manifest.fileId]);
    for(const upload of job.uploads.filter(u=>allowed.has(u.fileId))) {
      await uploadVerified(drive,binding,upload);
      await changeJob(jobId,j=>{j.uploads.find(u=>u.fileId===upload.fileId).verified=true;});
    }
    return manifest.fileId;
  }
  async function prepareInternal(raw,{selectedEpochId,expectedHeads}={}) {
    const backup=await validateBackup(raw);
    await syncFresh({allowConflict:selectedEpochId!==undefined});
    let current=commands.getState();
    if(current.restoreJobs.some(j=>['uploading','published'].includes(j.phase)))fail('not-ready','Eine bestätigte Wiederherstellung muss zuerst fortgesetzt werden.');
    const protectedBasis=await basis(current);
    if(expectedHeads && JSON.stringify(heads(current))!==JSON.stringify([...expectedHeads].sort()))fail('stale','Die Epochenköpfe wurden inzwischen geändert.');
    const target={...backup.snapshot,id:id(),datasetId:current.ledger.descriptor.datasetId};
    target.contentHash=await snapshotHash(target,backup.events.map(e=>({...e,datasetId:target.datasetId})));
    combinedLedger(current.ledger,backup,target); // All collisions and references checked before a write.
    let job=current.restoreJobs.find(j=>j.phase==='preparing' && JSON.stringify(j.backup)===JSON.stringify(backup));
    if(job?.safetyCopyId) {
      const previous=current.safetyCopies.find(c=>c.id===job.safetyCopyId);
      const fresh=previous && await exportBackup(current,previous.createdAt,{selectedEpochId});
      if(!previous || await digest({...previous.backup,safetyCopyIndex:[]})!==await digest({...fresh,safetyCopyIndex:[]}))job=null;
    }
    if(!job) {
      job={id:id(),phase:'preparing',backup,previewId:null,parentHeads:heads(current),safetyCopyId:null,snapshot:target,uploads:[],epoch:null};
      await mutateState(commands,next=>{next.restoreJobs.push(job);});
    }
    let safety=commands.getState().safetyCopies.find(c=>c.id===job.safetyCopyId);
    if(!safety || !safety.verified) {
      safety=await localSafetyCopy({commands,store,now,id,selectedEpochId});
      await changeJob(job.id,j=>{j.safetyCopyId=safety.id;});
    }
    if(commands.getState().binding) {
      await persistUploads(job.id,safety.backup,'safety');
      const fileId=await sendUploads(job.id,'safety');
      await changeJob(job.id,(j,next)=>{next.safetyCopies.find(c=>c.id===j.safetyCopyId).driveManifestFileId=fileId;});
    }
    current=commands.getState();
    if(await basis(current)!==protectedBasis) {
      await changeJob(job.id,j=>{j.phase='preview';j.previewId=null;});
      fail('stale','Der Stand wurde während der Sicherung geändert. Bitte eine neue Vorschau öffnen.');
    }
    const previewId=await previewHash(current,backup);
    await changeJob(job.id,async(j,next)=>{
      if(await basis(next)!==protectedBasis)fail('stale','Der Stand wurde während der Sicherung geändert.');
      j.phase='preview';j.previewId=previewId;j.parentHeads=heads(current);
    });
    return {previewId,summary:previewBackup({current,backup})};
  }
  async function confirmInternal(previewId) {
    let job=commands.getState().restoreJobs.find(j=>j.previewId===previewId);
    if(!job)fail('stale','Die Wiederherstellungsvorschau ist nicht mehr verfügbar.');
    await validateBackup(job.backup);
    if(job.phase==='activated')return;
    if(job.phase==='preview') {
      await syncFresh({allowConflict:job.parentHeads.length>1});
      const current=commands.getState();
      if(await previewHash(current,job.backup)!==previewId)fail('stale','Der Stand hat sich geändert. Bitte eine neue Vorschau öffnen.');
      const clock=Math.max(current.clock,...current.ledger.epochs.map(e=>e.clock))+1;
      const epoch={...VERSION,kind:'epoch',id:id(),datasetId:current.ledger.descriptor.datasetId,parents:job.parentHeads,
        deviceId:current.deviceId,clock,occurredAt:now().toISOString(),snapshotId:job.snapshot.id,snapshotManifestFileId:null};
      await changeJob(job.id,async(j,next)=>{
        if(await previewHash(next,j.backup)!==previewId)fail('stale','Der Stand wurde inzwischen geändert. Bitte eine neue Vorschau öffnen.');
        j.epoch=epoch;j.phase='uploading';
      });
      job=jobFor(job.id);
    }
    if(commands.getState().binding) {
      const datasetId=job.snapshot.datasetId;
      const targetBackup={...job.backup,...VERSION,descriptor:commands.getState().ledger.descriptor,snapshot:job.snapshot,
        events:job.backup.events.map(e=>({...e,datasetId})),epochHistory:job.backup.epochHistory.map(e=>({...e,datasetId}))};
      // Foreign histories can have another root; include target ancestry for standalone validation.
      targetBackup.epochHistory=mergeById(targetBackup.epochHistory,commands.getState().ledger.epochs.map(({id,datasetId,parents,deviceId,clock,occurredAt})=>({id,datasetId,parents,deviceId,clock,occurredAt})));
      await persistUploads(job.id,targetBackup,'restore');
      const manifestId=await sendUploads(job.id,'restore');
      job=jobFor(job.id);
      let upload=job.uploads.find(u=>u.kind==='epoch');
      if(!upload) {
        const fileId=await drive.generateId();
        await changeJob(job.id,j=>{j.epoch.snapshotManifestFileId=manifestId;j.uploads.push({kind:'epoch',logicalId:j.epoch.id,fileId,value:j.epoch,verified:false});});
        upload=jobFor(job.id).uploads.find(u=>u.kind==='epoch');
      }
      await uploadVerified(drive,commands.getState().binding,upload);
      await changeJob(job.id,j=>{j.phase='published';j.uploads.find(u=>u.kind==='epoch').verified=true;});
    }
    job=jobFor(job.id);
    await mutateState(commands,next=>{
      next.ledger=combinedLedger(next.ledger,job.backup,job.snapshot,job.epoch);
      next.clock=Math.max(next.clock,job.epoch.clock,...next.ledger.events.map(e=>e.clock),...next.ledger.historicalEpochs.map(e=>e.clock));
      next.restoreJobs.find(j=>j.id===job.id).phase='activated';
      for(const round of Object.values(next.rounds)) if(round.epochId!==job.epoch.id && !['completed','abandoned'].includes(round.status)) {
        round.status='abandoned';round.current=null;round.feedback=null;
      }
      if(job.epoch.snapshotManifestFileId && !next.snapshotManifests.some(m=>m.snapshotId===job.snapshot.id)) {
        next.snapshotManifests.push({snapshotId:job.snapshot.id,fileId:job.epoch.snapshotManifestFileId});
      }
    });
  }
  async function adoptionPreview(eventIds) {
    await syncFresh();
    const state=commands.getState(),resolved=resolveEpochs(state.ledger);
    if(!Array.isArray(eventIds) || eventIds.length===0 || new Set(eventIds).size!==eventIds.length)fail('invalid','Bitte eindeutige Ereignisse auswählen.');
    const selected=[...eventIds].sort(),byId=new Map(state.ledger.events.map(e=>[e.id,e]));
    const effective=new Set(resolved.effectiveEvents.map(e=>e.id));
    for(const eventId of selected) {
      const e=byId.get(eventId);if(!e || e.type==='events.adopted')fail('invalid','Dieses Ereignis kann nicht einzeln übernommen werden.');
      if(e.type==='round.completed' && e.payload.answerIds.some(id=>!selected.includes(id)&&!effective.has(id)))fail('reference','Zum Abschluss müssen alle Antworten ausgewählt sein.');
    }
    const supportEventIds=dependencies(state.ledger.events,selected).filter(id=>!selected.includes(id)&&!effective.has(id));
    const previewId=await digest({basis:await basis(state),eventIds:selected});
    const events=buildAdoptionEvents(state,selected,supportEventIds);
    const next={...state,ledger:assertLedger({...state.ledger,events:mergeEvents(state.ledger.events,events)})};
    const backup=await exportBackup(next,now().toISOString());
    const result={previewId,summary:previewBackup({current:state,backup}),eventIds:selected,supportEventIds};
    adoptions.set(previewId,{...result,events});return result;
  }
  function buildAdoptionEvents(state,eventIds,supportEventIds) {
    const groups=new Map(),active=resolveEpochs(state.ledger).activeEpochId;
    for(const eventId of eventIds){const source=state.ledger.events.find(e=>e.id===eventId).epochId;if(!groups.has(source))groups.set(source,[]);groups.get(source).push(eventId);}
    let clock=state.clock;
    return [...groups].map(([sourceEpochId,ids])=>({...VERSION,kind:'event',id:id(),datasetId:state.ledger.descriptor.datasetId,
      epochId:active,deviceId:state.deviceId,clock:++clock,occurredAt:now().toISOString(),day:dayInZone(now(),state.ledger.descriptor.timeZone),
      type:'events.adopted',payload:{sourceEpochId,eventIds:ids,supportEventIds}}));
  }
  return {
    prepare:backup=>enqueue(()=>prepareInternal(backup)),
    confirm:previewId=>enqueue(()=>confirmInternal(previewId)),
    resolveEpochConflict:({selectedEpochId,expectedHeads})=>enqueue(async()=>{
      await syncFresh({allowConflict:true});const current=commands.getState();
      if(!heads(current).includes(selectedEpochId) || !Array.isArray(expectedHeads)
        || JSON.stringify(heads(current))!==JSON.stringify([...expectedHeads].sort()))fail('stale','Bitte alle aktuellen Epochenköpfe erneut prüfen.');
      const backup=await exportBackup(current,now().toISOString(),{selectedEpochId});
      return prepareInternal(backup,{selectedEpochId,expectedHeads});
    }),
    previewAdoption:eventIds=>enqueue(()=>adoptionPreview(eventIds)),
    adopt:({eventIds,previewId})=>enqueue(async()=>{
      const preview=adoptions.get(previewId);if(!preview)fail('stale','Bitte die Übernahme erneut prüfen.');
      await syncFresh();const state=commands.getState();
      if(await digest({basis:await basis(state),eventIds:[...eventIds].sort()})!==previewId)fail('stale','Der Stand wurde geändert. Bitte eine neue Übernahmevorschau öffnen.');
      const next=structuredClone(state);next.ledger=assertLedger({...next.ledger,events:mergeEvents(next.ledger.events,preview.events)});
      next.clock=Math.max(next.clock,...preview.events.map(e=>e.clock));next.outboxEventIds=[...new Set([...next.outboxEventIds,...preview.events.map(e=>e.id)])].sort();
      await commands.commitExternal(next,await productStateHash(state));adoptions.delete(previewId);
    }),
    async listSafetyCopies(){return commands.getState().safetyCopies.map(({id,createdAt,purpose,hash,verified,driveManifestFileId})=>({id,createdAt,purpose,hash,verified,driveManifestFileId}));},
    async downloadSafetyCopy(copyId){const copy=commands.getState().safetyCopies.find(c=>c.id===copyId);
      if(!copy || !copy.verified || await digest(copy.backup)!==copy.hash)fail('invalid','Die Sicherheitskopie fehlt oder ist beschädigt.');return validateBackup(copy.backup);},
  };
}
