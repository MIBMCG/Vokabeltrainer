const DEFAULT_ITERATIONS = 150_000;

function invalid(message) {
  throw new Error(message);
}

function validatePin(pin, repeat = pin) {
  if (!/^\d{4}$/u.test(pin)) invalid('Die PIN muss aus genau vier Ziffern bestehen.');
  if (pin !== repeat) invalid('Die beiden PIN-Eingaben stimmen nicht überein.');
}

function toBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value) {
  let binary;
  try {
    binary = atob(value);
  } catch {
    invalid('Der lokale PIN-Prüfwert ist beschädigt.');
  }
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derive(pin, salt, iterations, cryptoImpl) {
  const key = await cryptoImpl.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await cryptoImpl.subtle.deriveBits({
    name: 'PBKDF2', salt, iterations, hash: 'SHA-256',
  }, key, 256);
  return new Uint8Array(bits);
}

function sameBytes(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

function assertVerifier(verifier) {
  if (verifier === null || typeof verifier !== 'object'
    || typeof verifier.salt !== 'string' || typeof verifier.hash !== 'string'
    || !Number.isSafeInteger(verifier.iterations) || verifier.iterations < 100_000) {
    invalid('Der lokale PIN-Prüfwert ist beschädigt.');
  }
}

export function createPinGate({loadVerifier, saveVerifier, cryptoImpl = globalThis.crypto}) {
  if (typeof loadVerifier !== 'function' || typeof saveVerifier !== 'function'
    || !cryptoImpl?.subtle || typeof cryptoImpl.getRandomValues !== 'function') {
    invalid('Die PIN-Funktion ist auf diesem Gerät nicht verfügbar.');
  }
  let unlocked = false;

  async function verify(pin) {
    if (!/^\d{4}$/u.test(pin)) invalid('Die PIN muss aus genau vier Ziffern bestehen.');
    const verifier = await loadVerifier();
    if (verifier === null) invalid('Auf diesem Gerät ist noch keine PIN eingerichtet.');
    assertVerifier(verifier);
    const actual = await derive(pin, fromBase64(verifier.salt), verifier.iterations, cryptoImpl);
    if (!sameBytes(actual, fromBase64(verifier.hash))) invalid('Die PIN ist nicht richtig.');
  }

  async function replace(pin, repeat) {
    validatePin(pin, repeat);
    const salt = cryptoImpl.getRandomValues(new Uint8Array(16));
    const hash = await derive(pin, salt, DEFAULT_ITERATIONS, cryptoImpl);
    await saveVerifier({
      salt: toBase64(salt),
      hash: toBase64(hash),
      iterations: DEFAULT_ITERATIONS,
    });
    unlocked = true;
  }

  return {
    async setup(pin, repeat) {
      if (await loadVerifier() !== null) invalid('Auf diesem Gerät ist bereits eine PIN eingerichtet.');
      await replace(pin, repeat);
    },
    async unlock(pin) {
      await verify(pin);
      unlocked = true;
    },
    async change(current, next, repeat) {
      await verify(current);
      await replace(next, repeat);
    },
    async reset(confirmation, next, repeat) {
      if (confirmation !== 'PIN zurücksetzen') {
        invalid('Bitte geben Sie genau „PIN zurücksetzen“ ein.');
      }
      await replace(next, repeat);
    },
    lock() {
      unlocked = false;
    },
    isUnlocked() {
      return unlocked;
    },
  };
}
