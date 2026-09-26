import {assertProductState} from '../commands.js';
import {digest} from '../model/canonical.js';
import {DEFAULT_POLICY} from '../model/policies.js';
import {LEGACY_VERSION} from '../model/versions.js';
import {resolveEpochs} from '../model/epochs.js';
import {exportBackup,validateBackup,snapshotHash} from '../backup/format.js';
import {ProductError} from '../model/errors.js';

export function legacyRoundContract(round) {
  const copy=structuredClone(round);
  copy.policy=structuredClone(DEFAULT_POLICY);
  copy.policyEventId=null;
  copy.schedulingMode='legacy';
  for(const candidate of copy.candidates)candidate.schedulingGenerationId=null;
  if(copy.current!==null)copy.current.schedulingGenerationId=null;
  return copy;
}

// Construct and verify everything before the single atomic store.save() in
// createCommands. This function has no storage, network or mutation side effects.
export async function migrateProductStateV1(state,{now=()=>new Date()}={}) {
  const original=assertProductState(state);
  if(original.storageVersion!==1)throw new ProductError('version','Diese Speicherversion benötigt keine v1-Umstellung.');
  for(const snapshot of original.ledger.snapshots) {
    if(await snapshotHash(snapshot,original.ledger.events)!==snapshot.contentHash) {
      throw new ProductError('invalid','Ein vorhandener Sicherungsstand ist beschädigt.');
    }
  }
  // Validate saved proofs before copying their indexes into the migration backup.
  for(const copy of original.safetyCopies) {
    await validateBackup(copy.backup);
    if(await digest(copy.backup)!==copy.hash)throw new ProductError('invalid','Eine vorhandene Sicherheitskopie ist beschädigt.');
  }
  for(const job of original.restoreJobs)await validateBackup(job.backup);
  const next=structuredClone(original),createdAt=now().toISOString();
  const heads=resolveEpochs(original.ledger).heads;
  for(const selectedEpochId of heads) {
    const backup=await exportBackup(original,createdAt,{selectedEpochId,version:LEGACY_VERSION});
    const checked=await validateBackup(backup),hash=await digest(checked);
    if(await digest(backup)!==hash)throw new ProductError('storage','Die Sicherheitskopie konnte nicht geprüft werden.');
    let copyId=`migration-${hash.slice(0,48)}`,suffix=0;
    while(next.safetyCopies.some(copy=>copy.id===copyId))copyId=`migration-${hash.slice(0,48)}-${++suffix}`;
    next.safetyCopies.push({id:copyId,createdAt,purpose:'format-migration',backup:checked,hash,
      driveManifestFileId:null,verified:true});
  }
  for(const profileId of Object.keys(next.rounds))next.rounds[profileId]=legacyRoundContract(next.rounds[profileId]);
  next.storageVersion=2;
  return assertProductState(next);
}
