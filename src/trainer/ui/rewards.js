import {rewardState} from '../learning/rewards.js';
import {el} from './dom.js';

const ISLAND_ART = new URL('../../../trainer/assets/islands.svg', import.meta.url).href;
const AVATAR_ART = new URL('../../../trainer/assets/avatar.svg', import.meta.url).href;
const BADGE_ART = new URL('../../../trainer/assets/badges.svg', import.meta.url).href;

const ISLANDS = [
  {id: 'beach', name: 'Strandinsel', symbol: 'island-beach', first: 1, last: 5, level: 1},
  {id: 'forest', name: 'Waldinsel', symbol: 'island-forest', first: 6, last: 10, level: 6},
  {id: 'mountain', name: 'Berginsel', symbol: 'island-mountain', first: 11, last: 15, level: 11},
];

const BADGES = [
  ['first-round', 'Erste Runde', 'Eine Runde abgeschlossen'],
  ['ten-rounds', 'Rundenprofi', 'Zehn Runden abgeschlossen'],
  ['ten-mastered', 'Wortschatz-Star', 'Zehn Vokabeln mit Dreierserie'],
  ['ten-recovered', 'Drangeblieben', 'Zehn Fehler später verbessert'],
  ['forest', 'Waldpfad', 'Die Waldinsel erreicht'],
  ['journey-complete', 'Inselentdecker', 'Alle 15 Etappen geschafft'],
];

const SKINS = ['Hautfarbe 1', 'Hautfarbe 2', 'Hautfarbe 3', 'Hautfarbe 4'];
const CLOTHING = ['Türkis', 'Waldgrün', 'Sonnengelb', 'Himmelblau', 'Violett', 'Koralle'];
const EQUIPMENT = {
  head: [
    {value: '', label: 'Keine Kopfbedeckung', level: 1},
    {value: 'cap', label: 'Kappe', level: 2},
    {value: 'sunhat', label: 'Sonnenhut', level: 6},
    {value: 'mountainhat', label: 'Bergmütze', level: 11},
  ],
  back: [
    {value: '', label: 'Kein Rucksack', level: 1},
    {value: 'backpack', label: 'Rucksack', level: 4},
  ],
  hand: [
    {value: '', label: 'Nichts in der Hand', level: 1},
    {value: 'binoculars', label: 'Fernglas', level: 8},
    {value: 'compass', label: 'Kompass', level: 14},
  ],
};

function stateFor(profile) {
  const words = Object.entries(profile.words ?? {});
  return rewardState({
    points: profile.points,
    completedRounds: profile.completedRounds,
    masteredWordIds: words.filter(([, word]) => word.masteredEver).map(([wordId]) => wordId),
    recoveredWordIds: words.filter(([, word]) => word.recoveredEver).map(([wordId]) => wordId),
  });
}

function illustration(asset, symbol, className) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `${asset}#${symbol}`);
  svg.append(use);
  return svg;
}

function levelCard(profile, state) {
  const complete = state.journey.completedStages === 15;
  const levelProgress = profile.points % 200;
  const progress = el('progress', {attrs: {max: 200, value: levelProgress, 'aria-label': 'Fortschritt zum nächsten Level'}});
  return el('section', {attrs: {class: 'level-card', 'aria-label': 'Punkte und Level'}}, [
    el('div', {}, [
      el('strong', {text: `Level ${state.level}`, attrs: {'data-level': ''}}),
      el('span', {text: `${profile.points} Punkte`}),
    ]),
    progress,
    complete
      ? el('p', {}, [
        el('strong', {text: 'Reise geschafft!'}),
        ' Du kannst weiter Punkte und Level sammeln.',
      ])
      : el('p', {text: `Noch ${200 - levelProgress} Punkte bis Level ${state.level + 1}`}),
  ]);
}

function stageList(island, completedStages) {
  const list = el('ol', {attrs: {class: 'stage-path', 'aria-label': `Etappen auf der ${island.name}`}});
  for (let stage = island.first; stage <= island.last; stage += 1) {
    const completed = stage <= completedStages;
    const current = stage === completedStages + 1;
    const item = el('li', {attrs: {
      'data-stage': String(stage),
      'data-state': completed ? 'complete' : current ? 'current' : 'upcoming',
      'aria-current': current ? 'step' : null,
    }});
    item.append(
      el('span', {text: completed ? '✓' : String(stage), attrs: {class: 'stage-marker', 'aria-hidden': 'true'}}),
      el('span', {text: `Etappe ${stage}`, attrs: {class: 'stage-label'}}),
    );
    list.append(item);
  }
  return list;
}

function badgeShelf(profile) {
  const earned = new Set(profile.badges ?? []);
  const list = el('div', {attrs: {class: 'badge-grid'}});
  for (const [id, name, description] of BADGES) {
    const isEarned = earned.has(id);
    list.append(el('article', {attrs: {
      class: 'badge-card', 'data-badge': id, 'data-earned': String(isEarned),
    }}, [
      illustration(BADGE_ART, `badge-${id}`, 'badge-art'),
      el('strong', {text: name}),
      el('span', {text: isEarned ? description : `Noch gesperrt: ${description}`}),
    ]));
  }
  return el('section', {attrs: {class: 'badge-shelf', 'aria-labelledby': 'badge-heading'}}, [
    el('h2', {text: 'Deine Abzeichen', attrs: {id: 'badge-heading'}}),
    badgeShelfIntro(earned.size),
    list,
  ]);
}

function badgeShelfIntro(count) {
  return el('p', {text: `${count} von 6 Abzeichen gesammelt`, attrs: {class: 'journey-summary'}});
}

export function avatarParts(profile) {
  const state = stateFor(profile);
  const selected = profile.avatar ?? {skin: 0, clothing: 0, head: null, back: null, hand: null};
  return {
    skin: selected.skin,
    clothing: selected.clothing,
    head: selected.head !== null && state.unlocked.head.includes(selected.head) ? selected.head : null,
    back: selected.back !== null && state.unlocked.back.includes(selected.back) ? selected.back : null,
    hand: selected.hand !== null && state.unlocked.hand.includes(selected.hand) ? selected.hand : null,
  };
}

function avatarPicture(parts, animations) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 320 360');
  svg.setAttribute('class', 'avatar-art');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.dataset.animate = String(animations !== false);
  const symbols = [
    'avatar-shadow',
    parts.back ? `back-${parts.back}` : null,
    `skin-${parts.skin}`,
    `clothing-${parts.clothing}`,
    parts.head ? `head-${parts.head}` : 'head-hair',
    parts.hand ? `hand-${parts.hand}` : null,
  ].filter(Boolean);
  for (const symbol of symbols) {
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `${AVATAR_ART}#${symbol}`);
    svg.append(use);
  }
  return svg;
}

function radioChoice({name, value, label, checked, disabled = false, dataOption, icon = null}) {
  const input = el('input', {attrs: {
    type: 'radio', name, value, checked, disabled,
  }});
  const attrs = {class: 'choice-tile', 'data-option': dataOption ?? value};
  if (disabled) attrs['data-locked'] = 'true';
  return el('label', {attrs}, [
    input,
    icon ? illustration(AVATAR_ART, icon, 'choice-icon') : null,
    el('span', {text: label}),
  ]);
}

function colourChoices(parts) {
  const skin = el('fieldset', {attrs: {class: 'choice-group colour-group'}}, [el('legend', {text: 'Hautfarbe'})]);
  SKINS.forEach((label, index) => skin.append(radioChoice({
    name: 'skin', value: index, label, checked: parts.skin === index, dataOption: `skin-${index}`,
  })));
  const clothing = el('fieldset', {attrs: {class: 'choice-group colour-group'}}, [el('legend', {text: 'Kleidungsfarbe'})]);
  CLOTHING.forEach((label, index) => clothing.append(radioChoice({
    name: 'clothing', value: index, label: `Kleidung ${label}`,
    checked: parts.clothing === index, dataOption: `clothing-${index}`,
  })));
  return [skin, clothing];
}

function equipmentChoices(parts, state) {
  const groups = [];
  for (const [slot, legend] of [['head', 'Kopfbedeckung'], ['back', 'Rücken'], ['hand', 'Handzubehör']]) {
    const group = el('fieldset', {attrs: {class: 'choice-group equipment-group'}}, [el('legend', {text: legend})]);
    for (const item of EQUIPMENT[slot]) {
      const unlocked = item.value === '' || state.unlocked[slot].includes(item.value);
      const label = unlocked ? item.label : `${item.label} – ab Level ${item.level}`;
      group.append(radioChoice({
        name: slot, value: item.value, label,
        checked: (parts[slot] ?? '') === item.value,
        disabled: !unlocked,
        dataOption: item.value || `${slot}-none`,
        icon: item.value ? `${slot}-${item.value}` : null,
      }));
    }
    groups.push(group);
  }
  return groups;
}

export function renderJourney({root, profile}) {
  const state = stateFor(profile);
  const map = el('div', {attrs: {class: 'journey-map'}});
  for (const island of ISLANDS) {
    const unlocked = state.journey.islands.find(({id}) => id === island.id)?.unlocked === true;
    map.append(el('section', {attrs: {
      class: 'island-card', 'data-island': island.id, 'data-unlocked': String(unlocked),
      'aria-labelledby': `${island.id}-heading`,
    }}, [
      el('div', {attrs: {class: 'island-copy'}}, [
        el('p', {text: unlocked ? 'Erreicht' : `Ab Level ${island.level}`, attrs: {class: 'island-status'}}),
        el('h2', {text: island.name, attrs: {id: `${island.id}-heading`}}),
        stageList(island, state.journey.completedStages),
      ]),
      illustration(ISLAND_ART, island.symbol, 'island-art'),
    ]));
  }
  root.replaceChildren(el('section', {attrs: {class: 'reward-screen journey-screen'}}, [
    el('header', {attrs: {class: 'reward-header'}}, [
      el('p', {text: 'Dein Fortschritt', attrs: {class: 'eyebrow'}}),
      el('h1', {text: 'Deine Inselreise'}),
      el('p', {text: `${state.journey.completedStages} von 15 Etappen`, attrs: {'data-journey-progress': '', class: 'journey-summary'}}),
    ]),
    levelCard(profile, state),
    map,
    badgeShelf(profile),
  ]));
}

export function renderAvatar({root, profile, profileId, commands}) {
  const state = stateFor(profile);
  const parts = avatarParts(profile);
  const allEquipmentUnlocked = state.unlocked.head.length === 3
    && state.unlocked.back.length === 1
    && state.unlocked.hand.length === 2;
  const form = el('form', {attrs: {class: 'avatar-controls', 'aria-label': 'Avatar gestalten'}});
  const notice = el('p', {attrs: {class: 'message avatar-message', role: 'status', hidden: true}});
  form.append(...colourChoices(parts), ...equipmentChoices(parts, state));

  let saving = false;
  form.addEventListener('change', async (event) => {
    if (saving || !(event.target instanceof HTMLInputElement)) return;
    const data = new FormData(form);
    const focusName = event.target.name;
    const focusValue = event.target.value;
    const lockedInputs = new Set([...form.querySelectorAll('input:disabled')]);
    saving = true;
    for (const input of form.querySelectorAll('input')) input.disabled = true;
    try {
      await commands.setAvatar({
        profileId,
        skin: Number(data.get('skin')),
        clothing: Number(data.get('clothing')),
        head: data.get('head') || null,
        back: data.get('back') || null,
        hand: data.get('hand') || null,
      });
      const nextFocus = [...root.querySelectorAll('input[type="radio"]')]
        .find((input) => input.name === focusName && input.value === focusValue);
      nextFocus?.focus();
    } catch (error) {
      saving = false;
      for (const input of form.querySelectorAll('input')) input.disabled = lockedInputs.has(input);
      notice.hidden = false;
      notice.dataset.tone = 'error';
      notice.textContent = error?.message || 'Die Avatar-Auswahl konnte nicht gespeichert werden.';
    }
  });

  const motion = el('label', {attrs: {class: 'motion-switch'}}, [
    el('input', {attrs: {type: 'checkbox', role: 'switch', checked: profile.animations !== false}}),
    el('span', {text: 'Kurze Bewegungen anzeigen'}),
  ]);
  motion.querySelector('input').addEventListener('change', async (event) => {
    try {
      await commands.setAnimations({profileId, animations: event.target.checked});
      root.querySelector('[role="switch"]')?.focus();
    } catch (error) {
      event.target.checked = !event.target.checked;
      notice.hidden = false;
      notice.dataset.tone = 'error';
      notice.textContent = error?.message || 'Die Bewegungseinstellung konnte nicht gespeichert werden.';
    }
  });

  root.replaceChildren(el('section', {attrs: {class: 'reward-screen avatar-screen'}}, [
    el('header', {attrs: {class: 'reward-header'}}, [
      el('p', {text: `Level ${state.level}`, attrs: {class: 'eyebrow'}}),
      el('h1', {text: 'Mein Avatar'}),
      el('p', {text: allEquipmentUnlocked
        ? 'Alle sechs Ausrüstungsteile sind freigeschaltet. Wähle deine Favoriten.'
        : 'Farben sind sofort verfügbar. Neue Ausrüstung wartet auf deinen nächsten Reiselevel.'}),
    ]),
    el('div', {attrs: {class: 'avatar-layout'}}, [
      el('section', {attrs: {class: 'avatar-preview', 'aria-label': 'Vorschau des Avatars'}}, [
        avatarPicture(parts, profile.animations),
        el('p', {text: `Entdecker auf Level ${state.level}`}),
        motion,
      ]),
      el('section', {attrs: {class: 'avatar-customizer'}}, [notice, form]),
    ]),
  ]));
}
