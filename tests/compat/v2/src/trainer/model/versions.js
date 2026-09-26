import {ProductError} from './errors.js';

export const CURRENT_VERSION = Object.freeze({format:'vokabeltrainer-product',formatVersion:2,ruleVersion:2});
export const LEGACY_VERSION = Object.freeze({...CURRENT_VERSION,formatVersion:1,ruleVersion:1});

export function assertSupportedVersion(value) {
  // A damaged header is not evidence of a newer client. Only an explicit,
  // well-formed product version can require the early sync write barrier.
  if (value === null || typeof value !== 'object' || Array.isArray(value)
    || value.format !== CURRENT_VERSION.format
    || !Number.isSafeInteger(value.formatVersion) || value.formatVersion < 1
    || !Number.isSafeInteger(value.ruleVersion) || value.ruleVersion < 1) {
    throw new ProductError('invalid','Die Datenversion ist ungültig.');
  }
  if (!((value.formatVersion === 1 && value.ruleVersion === 1)
      || (value.formatVersion === 2 && value.ruleVersion === 2))) {
    throw new ProductError('version','Diese Daten benötigen eine neuere App-Version.');
  }
  return value.formatVersion;
}

export function versionOf(value) {
  assertSupportedVersion(value);
  return {format:value.format,formatVersion:value.formatVersion,ruleVersion:value.ruleVersion};
}

// A version-one envelope cannot disguise version-two contents. A version-two
// envelope can transport unchanged history from either supported generation.
export function assertContainedVersion(envelope, values) {
  const outer=assertSupportedVersion(envelope);
  let malformed;
  for (const value of values) {
    let inner;
    try { inner=assertSupportedVersion(value); }
    catch(error) {
      if(error.code!=='invalid')throw error;
      malformed ??= error;
      continue;
    }
    if (inner>outer) {
      throw new ProductError('version','Die Datenversion passt nicht zu ihrem Umschlag.');
    }
  }
  // Inspect every contained header before reporting damage: an earlier broken
  // event must not conceal a later, explicit unsupported version from sync.
  if(malformed)throw malformed;
}
