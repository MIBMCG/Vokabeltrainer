const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function randomToken(bytes = 32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return toBase64Url(data);
}

export function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export async function sha256(value) {
  return toBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}

export function createCipher(keyBase64) {
  if (typeof keyBase64 !== 'string') throw new Error('Missing encryption key');
  let raw;
  try { raw = Uint8Array.from(atob(keyBase64), (char) => char.charCodeAt(0)); }
  catch { throw new Error('Invalid encryption key'); }
  if (raw.length !== 32) throw new Error('Encryption key must be 32 bytes');
  const keyPromise = crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
  return {
    async encrypt(value) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = new Uint8Array(await crypto.subtle.encrypt({name: 'AES-GCM', iv}, await keyPromise, encoder.encode(JSON.stringify(value))));
      return `${toBase64Url(iv)}.${toBase64Url(encrypted)}`;
    },
    async decrypt(value) {
      const [iv, body] = String(value).split('.');
      if (!iv || !body) throw new Error('Invalid ciphertext');
      return JSON.parse(decoder.decode(await crypto.subtle.decrypt({name: 'AES-GCM', iv: fromBase64Url(iv)}, await keyPromise, fromBase64Url(body))));
    },
  };
}

function fromBase64Url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid base64url');
  return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4)), (char) => char.charCodeAt(0));
}
