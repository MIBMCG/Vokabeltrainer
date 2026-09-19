import {figureById, isCompatible, itemById} from './catalog.js';

const HUMAN_SLOTS = Object.freeze(['clothing', 'head', 'back', 'hand']);
const ANIMAL_SLOTS = Object.freeze(['head', 'body', 'adornment']);
const DEFAULT_FIGURE_ID = 'explorer-boy';

function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function idSet(value, lookup) {
  if (!Array.isArray(value) && !(value instanceof Set)) return new Set();
  return new Set([...value].filter((id) => typeof id === 'string' && lookup(id) !== null));
}

function option(value, last) {
  return Number.isInteger(value) && value >= 0 && value <= last ? value : 0;
}

export function normalizeSelection(selection, ownership) {
  const requested = record(selection);
  const rights = record(ownership);
  const ownedFigureIds = idSet(
    Object.hasOwn(rights, 'ownedFigureIds') ? rights.ownedFigureIds : null,
    figureById,
  );
  const ownedItemIds = idSet(
    Object.hasOwn(rights, 'ownedItemIds') ? rights.ownedItemIds : null,
    itemById,
  );
  const requestedFigure = figureById(Object.hasOwn(requested, 'figureId') ? requested.figureId : null);
  const figure = requestedFigure !== null
    && (requestedFigure.unlock.kind === 'start' || ownedFigureIds.has(requestedFigure.id))
    ? requestedFigure
    : figureById(DEFAULT_FIGURE_ID);
  const requestedEquipment = record(requested.equipment);
  const slots = figure.group === 'human' ? HUMAN_SLOTS : ANIMAL_SLOTS;
  const equipment = {};
  for (const slot of slots) {
    const itemId = Object.hasOwn(requestedEquipment, slot) ? requestedEquipment[slot] : null;
    const item = itemById(itemId);
    equipment[slot] = item !== null
      && item.slot === slot
      && ownedItemIds.has(item.id)
      && isCompatible(item.id, figure.id)
      ? item.id
      : null;
  }
  return {
    figureId: figure.id,
    skin: option(Object.hasOwn(requested, 'skin') ? requested.skin : null, 3),
    clothing: option(Object.hasOwn(requested, 'clothing') ? requested.clothing : null, 5),
    equipment,
  };
}
