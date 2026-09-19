import {figureById, isCompatible, itemById} from './catalog.js';
import {AVATAR_ART} from './art-manifest.js';

const HUMAN_SLOTS = Object.freeze(['clothing', 'head', 'back', 'hand']);
const ANIMAL_SLOTS = Object.freeze(['head', 'body', 'adornment']);

function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function validOption(value, last) {
  return Number.isInteger(value) && value >= 0 && value <= last ? String(value) : '0';
}

function layer(manifest, key, plane, details = {}) {
  const asset = manifest.assets[key];
  return asset ? {...asset, key, plane, ...details} : null;
}

function runtimeUrl(value) {
  return new URL(value, import.meta.url).href;
}

export function resolveFigureLayers(selection, manifest) {
  const selected = record(selection);
  const figure = figureById(Object.hasOwn(selected, 'figureId') ? selected.figureId : null);
  if (!figure) return [];
  const figureArt = manifest?.figures?.[figure.id];
  if (!figureArt) return [];
  const equipment = record(selected.equipment);
  const slots = figure.group === 'human' ? HUMAN_SLOTS : ANIMAL_SLOTS;
  const selectedItems = [];
  for (const slot of slots) {
    const itemId = Object.hasOwn(equipment, slot) ? equipment[slot] : null;
    const item = itemById(itemId);
    if (!item || item.slot !== slot || !isCompatible(item.id, figure.id)) continue;
    const itemArt = figureArt.items?.[item.id];
    if (itemArt && Object.keys(itemArt).length > 0) selectedItems.push({slot, item, art: itemArt});
  }

  const output = [];
  for (const selectedItem of selectedItems) {
    const value = selectedItem.art.rear
      ? layer(manifest, selectedItem.art.rear, 'rear', {slot: selectedItem.slot, itemId: selectedItem.item.id})
      : null;
    if (value) output.push(value);
  }
  const baseKey = figure.group === 'human'
    ? figureArt.skins?.[validOption(selected.skin, 3)] ?? figureArt.skins?.['0']
    : figureArt.base;
  const base = baseKey ? layer(manifest, baseKey, 'base') : null;
  if (base) output.push(base);

  const clothingItem = selectedItems.find(({slot, art}) => slot === 'clothing' && art.front);
  if (figure.group === 'human' && !clothingItem) {
    const clothingKey = figureArt.clothing?.[validOption(selected.clothing, 5)] ?? figureArt.clothing?.['0'];
    const clothing = clothingKey ? layer(manifest, clothingKey, 'clothing') : null;
    if (clothing) output.push(clothing);
  }
  for (const selectedItem of selectedItems) {
    const value = selectedItem.art.front
      ? layer(manifest, selectedItem.art.front, 'front', {slot: selectedItem.slot, itemId: selectedItem.item.id})
      : null;
    if (value) output.push(value);
  }
  return output;
}

export function figureLayers(selection) {
  return resolveFigureLayers(selection, AVATAR_ART);
}

function pictureFor(asset, plane, sizes) {
  const picture = document.createElement('picture');
  picture.dataset.artKey = asset.key;
  picture.dataset.plane = plane;
  // Inline stacking is part of the renderer contract: every layer shares one
  // source canvas, so external page CSS must not reposition individual art.
  Object.assign(picture.style, {position: 'absolute', inset: '0', display: 'block'});
  const image = document.createElement('img');
  image.alt = '';
  image.decoding = 'async';
  image.loading = 'eager';
  image.width = asset.width;
  image.height = asset.height;
  image.sizes = sizes;
  image.src = runtimeUrl(asset.fallbackUrl);
  image.srcset = asset.variants.map(({width, url}) => `${runtimeUrl(url)} ${width}w`).join(', ');
  Object.assign(image.style, {display: 'block', width: '100%', height: '100%', objectFit: 'contain'});
  image.addEventListener('error', () => {
    if (image.dataset.fallback === 'true') return;
    image.dataset.fallback = 'true';
    image.removeAttribute('srcset');
    const fallback = runtimeUrl(asset.fallbackUrl);
    if (image.src !== fallback) image.src = fallback;
  });
  picture.append(image);
  return picture;
}

export function figurePicture(selection, {sizes = '256px', animations = false} = {}) {
  const selected = record(selection);
  const figure = figureById(Object.hasOwn(selected, 'figureId') ? selected.figureId : null);
  const host = document.createElement('div');
  host.className = 'avatar-shop-art';
  host.dataset.animate = String(animations === true);
  host.setAttribute('role', 'img');
  host.setAttribute('aria-label', figure?.name ?? 'Avatarbild nicht verfügbar');
  const figureArt = figure ? AVATAR_ART.figures[figure.id] : null;
  const layers = figureLayers(selected);
  host.dataset.figureId = figure?.id ?? '';
  host.dataset.complete = String(layers.some(({plane}) => plane === 'base'));
  Object.assign(host.style, {
    position: 'relative',
    display: 'block',
    aspectRatio: figureArt ? `${figureArt.canvas.width} / ${figureArt.canvas.height}` : '3 / 4',
  });
  const safeSizes = typeof sizes === 'string' && sizes.trim() ? sizes : '256px';
  for (const value of layers) host.append(pictureFor(value, value.plane, safeSizes));
  if (layers.length === 0) {
    const placeholder = document.createElement('span');
    placeholder.className = 'avatar-shop-placeholder';
    placeholder.textContent = 'Bild folgt';
    host.append(placeholder);
  }
  return host;
}
