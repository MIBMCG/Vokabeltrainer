import {FIGURES, figureById} from './catalog.js';

export const EVOLUTION_VERSION = 1;

const PRICES = Object.freeze([0, 200, 400, 800]);

function knownFigure(id) {
  const figure = figureById(id);
  if (!figure) throw new TypeError('Unknown evolution figure');
  return figure;
}

function integer(value, min, max, label) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new TypeError(`Invalid ${label}`);
  }
}

export function evolutionFormId(figureId, stage) {
  knownFigure(figureId);
  integer(stage, 1, 4, 'stage');
  return `evolution:${figureId}:${stage}`;
}

export function evolutionAssetKey(figureId, stage, skin = 0) {
  const figure = knownFigure(figureId);
  integer(stage, 1, 4, 'stage');
  integer(skin, 0, figure.group === 'human' ? 3 : 0, 'skin');
  const base = `${figureId}-stage-${stage}`;
  return figure.group === 'human' ? `${base}-skin-${skin}` : base;
}

export const EVOLUTION_FORMS = Object.freeze(FIGURES.flatMap((figure) =>
  [1, 2, 3, 4].map((stage) => Object.freeze({
    id: evolutionFormId(figure.id, stage),
    figureId: figure.id,
    stage,
    price: PRICES[stage - 1],
    assetKeys: Object.freeze((figure.group === 'human' ? [0, 1, 2, 3] : [0])
      .map((skin) => evolutionAssetKey(figure.id, stage, skin))),
  })),
));

// Presentation only; ownership and network authorization are handled elsewhere.
export function evolutionOffer({figureId, highestOwnedStage, availablePoints} = {}) {
  knownFigure(figureId);
  integer(highestOwnedStage, 0, 4, 'owned stage');
  integer(availablePoints, 0, Number.MAX_SAFE_INTEGER, 'points');

  if (highestOwnedStage === 0) return {
    status: 'base-locked', nextStage: null, price: null, missingPoints: null, progress: 0,
  };
  if (highestOwnedStage === 4) return {
    status: 'complete', nextStage: null, price: null, missingPoints: 0, progress: 1,
  };

  const price = PRICES[highestOwnedStage];
  const missingPoints = Math.max(0, price - availablePoints);
  return {
    status: missingPoints === 0 ? 'available' : 'saving',
    nextStage: highestOwnedStage + 1,
    price,
    missingPoints,
    progress: Math.min(1, availablePoints / price),
  };
}
