import {ART, AVATAR_LAYER_KEYS} from './art-manifest.js';

function imageFor(key, {alt = '', className = '', sizes = '100vw', loading = 'lazy'} = {}) {
  const asset = ART[key];
  if (!asset) throw new TypeError(`Unknown art key: ${key}`);
  const wrapper = document.createElement('picture');
  wrapper.dataset.artKey = key;
  if (className) wrapper.className = className;
  const img = document.createElement('img');
  img.alt = alt;
  img.loading = loading;
  img.decoding = 'async';
  img.width = asset.width;
  img.height = asset.height;
  img.sizes = sizes;
  img.src = asset.fallbackUrl;
  img.srcset = asset.variants.map((variant) => `${variant.url} ${variant.width}w`).join(', ');
  img.addEventListener('error', () => {
    if (img.dataset.fallback === 'true') return;
    img.dataset.fallback = 'true';
    img.removeAttribute('srcset');
    img.src = asset.fallbackUrl;
  });
  wrapper.append(img);
  return wrapper;
}

export function picture(key, options) {
  return imageFor(key, options);
}

export function avatarPicture(parts, {className = '', sizes = '256px', animations = false} = {}) {
  const avatar = document.createElement('div');
  avatar.className = ['avatar-art', className].filter(Boolean).join(' ');
  avatar.dataset.animate = String(animations !== false);
  avatar.setAttribute('role', 'img');
  avatar.setAttribute('aria-label', 'Dein Entdecker-Avatar');
  const keys = [
    parts.back ? AVATAR_LAYER_KEYS.back[parts.back] : null,
    AVATAR_LAYER_KEYS.skin[parts.skin],
    AVATAR_LAYER_KEYS.clothing[parts.clothing],
    parts.head ? AVATAR_LAYER_KEYS.head[parts.head] : null,
    parts.hand ? AVATAR_LAYER_KEYS.hand[parts.hand] : null,
  ].filter(Boolean);
  for (const key of keys) avatar.append(imageFor(key, {alt: '', className: 'avatar-layer', sizes, loading: 'eager'}));
  return avatar;
}
