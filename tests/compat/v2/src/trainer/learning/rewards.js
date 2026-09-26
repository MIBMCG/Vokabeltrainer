const BADGES = [
  ['first-round', ({completedRounds}) => completedRounds >= 1],
  ['ten-rounds', ({completedRounds}) => completedRounds >= 10],
  ['ten-mastered', ({masteredCount}) => masteredCount >= 10],
  ['ten-recovered', ({recoveredCount}) => recoveredCount >= 10],
  ['forest', ({points}) => points >= 1000],
  ['journey-complete', ({points}) => points >= 3000],
];

/**
 * Returns durable reward entitlements. Skin tones (0..3) and clothing colours
 * (0..5) are always available and therefore are not repeated in `unlocked`.
 */
export function rewardState({points, completedRounds, masteredWordIds, recoveredWordIds}) {
  const level = 1 + Math.floor(points / 200);
  const facts = {
    points,
    completedRounds,
    masteredCount: new Set(masteredWordIds).size,
    recoveredCount: new Set(recoveredWordIds).size,
  };
  const badges = BADGES.filter(([, earned]) => earned(facts)).map(([id]) => id);
  const unlocked = {
    head: [],
    back: [],
    hand: [],
  };
  if (level >= 2) unlocked.head.push('cap');
  if (level >= 4) unlocked.back.push('backpack');
  if (level >= 6) unlocked.head.push('sunhat');
  if (level >= 8) unlocked.hand.push('binoculars');
  if (level >= 11) unlocked.head.push('mountainhat');
  if (level >= 14) unlocked.hand.push('compass');

  return {
    level,
    badges,
    unlocked,
    journey: {
      completedStages: Math.min(15, Math.floor(points / 200)),
      islands: [
        {id: 'beach', unlocked: true},
        {id: 'forest', unlocked: points >= 1000},
        {id: 'mountain', unlocked: points >= 2000},
      ],
    },
  };
}
