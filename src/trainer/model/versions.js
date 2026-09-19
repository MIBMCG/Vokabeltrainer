import {ProductError} from './errors.js';

export const CURRENT_VERSION = Object.freeze({format:'vokabeltrainer-product',formatVersion:2,ruleVersion:2});
export const LEGACY_VERSION = Object.freeze({...CURRENT_VERSION,formatVersion:1,ruleVersion:1});

export function assertSupportedVersion(value) {
  if (value?.format !== CURRENT_VERSION.format
    || !((value.formatVersion === 1 && value.ruleVersion === 1)
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
  for (const value of values) {
    if (assertSupportedVersion(value)>outer) {
      throw new ProductError('version','Die Datenversion passt nicht zu ihrem Umschlag.');
    }
  }
}
