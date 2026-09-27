import {rewardState} from '../learning/rewards.js';
import {figureById} from './catalog.js';

function option(value, maximum) {
  return Number.isInteger(value) && value >= 0 && value <= maximum ? value : 0;
}

export function avatarParts(profile) {
  const words = Object.entries(profile?.words ?? {});
  const rewards = rewardState({
    points: profile?.points ?? 0,
    completedRounds: profile?.completedRounds ?? 0,
    masteredWordIds: words.filter(([, word]) => word.masteredEver).map(([wordId]) => wordId),
    recoveredWordIds: words.filter(([, word]) => word.recoveredEver).map(([wordId]) => wordId),
  });
  const selected = profile?.avatar ?? {};
  return {
    skin: option(selected.skin, 3),
    clothing: option(selected.clothing, 5),
    head: selected.head !== null && rewards.unlocked.head.includes(selected.head) ? selected.head : null,
    back: selected.back !== null && rewards.unlocked.back.includes(selected.back) ? selected.back : null,
    hand: selected.hand !== null && rewards.unlocked.hand.includes(selected.hand) ? selected.hand : null,
  };
}

export function resolveAvatarDisplay({productState, profileId, profile} = {}) {
  const parts = avatarParts(profile);
  const commerce = productState?.commerce;
  const selected = commerce?.mode === 'active' && Array.isArray(commerce.selection)
    ? commerce.selection.find((entry) => entry?.profileId === profileId)
    : null;
  const figure = figureById(selected?.figureId);
  if (!figure || !Number.isInteger(selected.stage) || selected.stage < 1 || selected.stage > 4) {
    return {kind: 'classic', parts};
  }
  return {
    kind: 'figure',
    figureId: figure.id,
    stage: selected.stage,
    skin: figure.group === 'human' ? parts.skin : 0,
    clothing: figure.group === 'human' && selected.stage === 1 ? parts.clothing : 0,
    equipment: {},
  };
}
