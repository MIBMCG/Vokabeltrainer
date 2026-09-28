import {evolutionAssetKey} from './evolution.js';
import {EVOLUTION_ART} from './evolution-art-manifest.js';

function assetFor(figureId, stage, skin) {
  try {
    return EVOLUTION_ART.assets[evolutionAssetKey(figureId, stage, skin)] ?? null;
  } catch {
    return null;
  }
}

function runtimeUrl(relativeUrl) {
  return new URL(relativeUrl, import.meta.url).href;
}

export function evolutionArt(figureId, stage, skin = 0) {
  const asset = assetFor(figureId, stage, skin);
  return asset ? runtimeUrl(asset.fallbackUrl) : null;
}

export function evolutionPicture(figureId, stage, {skin = 0, alt = '', className = '', sizes = '256px'} = {}) {
  const asset = assetFor(figureId, stage, skin);
  if (!asset) return null;

  const picture = document.createElement('picture');
  picture.className = ['evolution-art', className].filter(Boolean).join(' ');
  const image = document.createElement('img');
  image.alt = alt;
  image.decoding = 'async';
  image.loading = 'lazy';
  image.width = asset.width;
  image.height = asset.height;
  image.sizes = sizes;
  image.src = runtimeUrl(asset.fallbackUrl);
  image.srcset = asset.variants.map(({width, url}) => `${runtimeUrl(url)} ${width}w`).join(', ');
  image.addEventListener('error', () => {
    if (picture.dataset.artUnavailable === 'true') return;
    const fallback = runtimeUrl(asset.fallbackUrl);
    if (image.dataset.fallback === 'true' || image.currentSrc === fallback) {
      image.style.display = 'none';
      const unavailable = document.createElement('span');
      unavailable.className = 'evolution-art-unavailable';
      unavailable.textContent = 'Bild gerade nicht verfügbar';
      unavailable.setAttribute('role', 'img');
      unavailable.setAttribute('aria-label', [alt, unavailable.textContent].filter(Boolean).join(': '));
      Object.assign(unavailable.style, {display: 'grid', placeItems: 'center', minHeight: '6rem', textAlign: 'center'});
      picture.className += ' evolution-placeholder';
      picture.dataset.complete = 'false';
      picture.dataset.artUnavailable = 'true';
      picture.append(unavailable);
      picture.dispatchEvent(new CustomEvent('evolution-art-unavailable', {bubbles: true, detail: {figureId, stage}}));
      return;
    }
    image.dataset.fallback = 'true';
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    if (image.src !== fallback) image.src = fallback;
  });
  picture.append(image);
  return picture;
}
