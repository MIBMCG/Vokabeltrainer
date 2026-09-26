import {ProductError} from './errors.js';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function invalid(message = 'Der Wert ist kein gültiges JSON.') {
  throw new ProductError('invalid', message);
}

function assertArrayShape(value) {
  const keys = Object.keys(value);
  if (keys.length !== value.length
    || keys.some((key, index) => key !== String(index))) {
    invalid('Die JSON-Liste enthält ungültige Einträge.');
  }
}

function encode(value, ancestors) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) invalid('JSON-Zahlen müssen endlich sein.');
    return JSON.stringify(value);
  }
  if (typeof value !== 'object') invalid();
  if (ancestors.has(value)) invalid('Zyklische JSON-Werte sind nicht erlaubt.');

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      assertArrayShape(value);
      return `[${value.map((entry) => encode(entry, ancestors)).join(',')}]`;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) invalid();
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key !== 'string' || FORBIDDEN_KEYS.has(key))) {
      invalid('Das JSON-Objekt enthält einen unzulässigen Schlüssel.');
    }
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) invalid();
    }
    keys.sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${encode(value[key], ancestors)}`).join(',')}}`;
  } finally {
    ancestors.delete(value);
  }
}

export function canonical(value) {
  return encode(value, new Set());
}

export async function digest(value) {
  const bytes = new TextEncoder().encode(canonical(value));
  const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
