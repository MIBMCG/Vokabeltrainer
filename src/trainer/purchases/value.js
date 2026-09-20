import {canonical as modelCanonical, digest as modelDigest} from '../model/canonical.js';
import {ProductError} from '../model/errors.js';

const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const HASH_PATTERN = /^[0-9a-f]{64}$/;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function fail(code, message) {
  throw new ProductError(code, message);
}

export function assertPlainObject(value, message = 'Das Kaufprotokoll enthält ein ungültiges Objekt.') {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('invalid', message);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) fail('invalid', message);
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || FORBIDDEN_KEYS.has(key)) fail('invalid', message);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) fail('invalid', message);
  }
  return value;
}

export function assertExactKeys(value, expected, message) {
  assertPlainObject(value, message);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length
    || actual.some((key, index) => key !== wanted[index])) fail('invalid', message);
  return value;
}

export function assertArray(value, message = 'Das Kaufprotokoll enthält eine ungültige Liste.') {
  if (!Array.isArray(value)) fail('invalid', message);
  const keys = Object.keys(value);
  if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) {
    fail('invalid', message);
  }
  return value;
}

export function assertId(value, message = 'Das Kaufprotokoll enthält eine ungültige ID.') {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) fail('invalid', message);
  return value;
}

export function assertHash(value, message = 'Das Kaufprotokoll enthält einen ungültigen Hash.') {
  if (typeof value !== 'string' || !HASH_PATTERN.test(value)) fail('invalid', message);
  return value;
}

export function assertInteger(value, {minimum = 0, maximum = Number.MAX_SAFE_INTEGER} = {}) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    fail('invalid', 'Das Kaufprotokoll enthält einen ungültigen Zähler.');
  }
  return value;
}

export function assertNullableString(value, maximum = 1024) {
  if (value !== null && (typeof value !== 'string' || value.length === 0 || value.length > maximum)) {
    fail('invalid', 'Das Kaufprotokoll enthält einen ungültigen Textwert.');
  }
  return value;
}

export function assertRef(value) {
  assertExactKeys(value, ['id', 'sha256'], 'Ein unveränderlicher Verweis ist ungültig.');
  assertId(value.id);
  assertHash(value.sha256);
  return structuredClone(value);
}

export function assertNullableRef(value) {
  return value === null ? null : assertRef(value);
}

export function assertBinding(value) {
  assertExactKeys(
    value,
    ['accountId', 'folderId', 'descriptorFileId', 'datasetId'],
    'Die Produktbindung ist ungültig.',
  );
  for (const key of ['accountId', 'folderId', 'descriptorFileId', 'datasetId']) assertId(value[key]);
  return structuredClone(value);
}

export function sameRef(left, right) {
  return left?.id === right?.id && left?.sha256 === right?.sha256;
}

export function sameBinding(left, right) {
  return modelCanonical(left) === modelCanonical(right);
}

export function canonical(value) {
  return modelCanonical(value);
}

export async function digest(value) {
  return modelDigest(value);
}

export async function refFor(id, value) {
  assertId(id);
  return {id, sha256: await digest(value)};
}

export function copy(value) {
  return structuredClone(value);
}
