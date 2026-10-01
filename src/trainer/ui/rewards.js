import {rewardState} from '../learning/rewards.js';
import {figureById} from '../avatar/catalog.js';
import {avatarParts, resolveAvatarDisplay} from '../avatar/display.js';
import {figurePicture} from '../avatar/art.js';
import {evolutionPicture} from '../avatar/evolution-art.js';
import {avatarPicture, picture} from './art.js';
import {el} from './dom.js';
import {renderPurchases} from './purchases.js';

export {avatarParts};

const BADGE_ART = new URL('../../../trainer/assets/badges.svg', import.meta.url).href;
const avatarUiByRoot = new WeakMap();

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

function evolvedPicture(display, {className = '', sizes = '256px'} = {}) {
  if (display.stage === 1 && figureById(display.figureId)?.group === 'human' && display.clothing !== 0) return null;
  const art = evolutionPicture(display.figureId, display.stage, {skin: display.skin ?? 0, alt: '', sizes});
  if (art === null) return null;
  const host = el('div', {attrs: {
    class: ['avatar-evolution-display', className].filter(Boolean).join(' '),
    role: 'img', 'aria-label': `${figureById(display.figureId)?.name ?? 'Figur'} – Stufe ${display.stage}`,
    'data-figure-id': display.figureId, 'data-stage': String(display.stage), 'data-complete': 'true',
  }});
  host.append(art);
  return host;
}

export function avatarDisplayPicture(display, options = {}) {
  if (display.kind === 'classic') return avatarPicture(display.parts, options);
  const evolved = evolvedPicture(display, options);
  if (evolved !== null) return evolved;
  const figure = figurePicture(display, options);
  if (options.className) figure.classList.add(options.className);
  return figure;
}

export function levelCard(profile, state = stateFor(profile), display = {kind: 'classic', parts: avatarParts(profile)}) {
  const complete = state.journey.completedStages === 15;
  const levelProgress = profile.points % 200;
  const progress = el('div', {attrs: {
    class: 'level-progress-track', role: 'progressbar',
    'aria-label': 'Fortschritt zum nächsten Level',
    'aria-valuemin': '0', 'aria-valuemax': '200', 'aria-valuenow': String(levelProgress),
    'aria-valuetext': `${levelProgress} von 200 Punkten; noch ${200 - levelProgress} Punkte bis Level ${state.level + 1}`,
  }}, [el('span', {attrs: {class: 'level-progress-fill'}})]);
  progress.firstElementChild.style.width = `${levelProgress / 2}%`;
  return el('section', {attrs: {class: 'level-card', 'aria-label': 'Punkte und Level'}}, [
    avatarDisplayPicture(display, {className: 'level-avatar', sizes: '76px', animations: false}),
    el('div', {attrs: {class: 'level-card-copy'}}, [
      el('div', {attrs: {class: 'level-card-title'}}, [
        el('strong', {text: `Level ${state.level}`, attrs: {'data-level': ''}}),
        el('span', {text: `${profile.points.toLocaleString('de-DE')} Lernpunkte insgesamt`}),
      ]),
      el('p', {text: `Zum nächsten Level: ${levelProgress} von 200 Punkten`}),
      progress,
      el('p', {text: `Noch ${200 - levelProgress} Punkte bis Level ${state.level + 1}`}),
      complete
        ? el('p', {}, [
          el('strong', {text: 'Reise geschafft!'}),
          ' Du kannst weiter Punkte und Level sammeln.',
        ])
        : null,
    ]),
  ]);
}

const STAGE_POINTS = [
  [48, 87], [67, 78], [39, 71], [66, 64], [34, 58],
  [63, 52], [35, 46], [61, 40], [43, 34], [65, 29],
  [47, 24], [61, 19], [45, 15], [56, 11], [50, 7],
];

function stageList(completedStages) {
  const list = el('ol', {attrs: {class: 'stage-path', 'aria-label': '15 Etappen auf der Inselreise'}});
  for (let stage = 1; stage <= 15; stage += 1) {
    const completed = stage <= completedStages;
    const current = stage === completedStages + 1;
    const status = completed
      ? 'abgeschlossen'
      : current
        ? 'aktuell'
        : `gesperrt – ab Level ${stage}`;
    const item = el('li', {attrs: {
      'data-stage': String(stage),
      'data-state': completed ? 'complete' : current ? 'current' : 'upcoming',
      'data-unlock-level': !completed && !current ? String(stage) : null,
      'aria-current': current ? 'step' : null,
    }});
    item.style.setProperty('--stage-x', `${STAGE_POINTS[stage - 1][0]}%`);
    item.style.setProperty('--stage-y', `${STAGE_POINTS[stage - 1][1]}%`);
    item.append(
      el('span', {text: completed ? '✓' : String(stage), attrs: {class: 'stage-marker', 'aria-hidden': 'true'}}),
      el('span', {text: `Etappe ${stage}: ${status}`, attrs: {class: 'stage-label'}}),
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

function radioChoice({name, value, label, checked, disabled = false, dataOption, icon = null}) {
  const input = el('input', {attrs: {
    type: 'radio', name, value, checked, disabled,
  }});
  const attrs = {class: 'choice-tile', 'data-option': dataOption ?? value};
  if (disabled) attrs['data-locked'] = 'true';
  return el('label', {attrs}, [
    input,
    icon ? picture(`avatar-${icon}`, {className: 'choice-icon', sizes: '48px'}) : null,
    el('span', {text: label}),
  ]);
}

function colourChoices(parts, {skinOnly = false} = {}) {
  const skin = el('fieldset', {attrs: {class: 'choice-group colour-group'}}, [el('legend', {text: 'Hautfarbe'})]);
  SKINS.forEach((label, index) => skin.append(radioChoice({
    name: 'skin', value: index, label, checked: parts.skin === index, dataOption: `skin-${index}`,
  })));
  if (skinOnly) return [skin];
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

export function renderJourney({root, productState, profile, profileId}) {
  const state = stateFor(profile);
  const display = resolveAvatarDisplay({productState, profileId, profile});
  const zones = el('div', {attrs: {class: 'journey-zones'}});
  for (const island of ISLANDS) {
    const unlocked = state.journey.islands.find(({id}) => id === island.id)?.unlocked === true;
    zones.append(el('section', {attrs: {
      class: 'journey-zone', 'data-island': island.id, 'data-unlocked': String(unlocked),
      'aria-labelledby': `${island.id}-heading`,
    }}, [
      el('h2', {text: island.name, attrs: {id: `${island.id}-heading`}}),
      el('p', {text: unlocked ? 'Erreicht' : `Gesperrt – ab Level ${island.level}`, attrs: {class: 'island-status'}}),
    ]));
  }
  const map = el('div', {attrs: {class: 'journey-map'}}, [
    picture('island-journey', {alt: '', className: 'journey-art', sizes: '(max-width: 700px) 94vw, 760px', loading: 'eager'}),
    zones,
    stageList(state.journey.completedStages),
  ]);
  root.replaceChildren(el('section', {attrs: {class: 'reward-screen journey-screen'}}, [
    el('header', {attrs: {class: 'reward-header'}}, [
      el('p', {text: 'Dein Fortschritt', attrs: {class: 'eyebrow'}}),
      el('h1', {text: 'Deine Inselreise'}),
      el('p', {text: `${state.journey.completedStages} von 15 Etappen`, attrs: {'data-journey-progress': '', class: 'journey-summary'}}),
    ]),
    levelCard(profile, state, display),
    el('p', {text: '🔒 Gesperrt: Zahl = benötigtes Level', attrs: {class: 'journey-lock-key'}}),
    el('div', {attrs: {class: 'journey-map-scroll', tabindex: '0', 'aria-label': 'Illustrierte Inselkarte – horizontal verschiebbar'}}, [map]),
    badgeShelf(profile),
  ]));
}

export function renderAvatar({root, state: productState, profile, profileId, commands, commerce, onRefresh, onReconnect}) {
  if (!avatarUiByRoot.has(root)) avatarUiByRoot.set(root, {classicOpen: undefined});
  const ui = avatarUiByRoot.get(root);
  const rewards = stateFor(profile);
  const parts = avatarParts(profile);
  const display = resolveAvatarDisplay({productState, profileId, profile});
  const allEquipmentUnlocked = rewards.unlocked.head.length === 3
    && rewards.unlocked.back.length === 1
    && rewards.unlocked.hand.length === 2;
  const notice = el('p', {attrs: {class: 'message avatar-message', role: 'status', hidden: true}});

  let saving = false;
  const appearanceForm = ({equipment = false, skinOnly = false, label}) => {
    const form = el('form', {attrs: {class: 'avatar-controls', 'aria-label': label}});
    const formNotice = el('p', {attrs: {class: 'message avatar-message', role: 'status', hidden: true}});
    form.append(...colourChoices(parts, {skinOnly}));
    if (equipment) form.append(...equipmentChoices(parts, rewards));
    form.append(formNotice);
    form.addEventListener('change', async (event) => {
      if (saving || !(event.target instanceof HTMLInputElement)) return;
      const data = new FormData(form);
      const focusName = event.target.name;
      const focusValue = event.target.value;
      const appearanceInputs = [...root.querySelectorAll('form.avatar-controls input')];
      const lockedInputs = new Set(appearanceInputs.filter((input) => input.disabled));
      saving = true;
      for (const input of appearanceInputs) input.disabled = true;
      try {
        await commands.setAvatar({
          profileId,
          skin: data.has('skin') ? Number(data.get('skin')) : parts.skin,
          clothing: data.has('clothing') ? Number(data.get('clothing')) : parts.clothing,
          head: data.has('head') ? data.get('head') || null : parts.head,
          back: data.has('back') ? data.get('back') || null : parts.back,
          hand: data.has('hand') ? data.get('hand') || null : parts.hand,
        });
        const nextForm = [...root.querySelectorAll('form.avatar-controls')]
          .find((candidate) => candidate.getAttribute('aria-label') === label);
        const nextFocus = [...(nextForm?.querySelectorAll('input[type="radio"]') ?? [])]
          .find((input) => input.name === focusName && input.value === focusValue);
        nextFocus?.focus();
      } catch (error) {
        saving = false;
        for (const input of appearanceInputs) input.disabled = lockedInputs.has(input);
        formNotice.hidden = false;
        formNotice.dataset.tone = 'error';
        formNotice.textContent = error?.message || 'Die Avatar-Auswahl konnte nicht gespeichert werden.';
      }
    });
    return form;
  };
  const classicForm = appearanceForm({equipment: true, label: 'Klassischen Avatar gestalten'});
  const selectedFigure = display.kind === 'figure' ? figureById(display.figureId) : null;
  const selectedHuman = selectedFigure?.group === 'human';
  const selectedForm = selectedHuman
    ? appearanceForm({skinOnly: display.stage > 1, label: `${selectedFigure.name} gestalten`})
    : null;

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

  const commerceHost = el('section', {attrs: {class: 'avatar-commerce', 'aria-label': 'Meine Figur, Entwicklung und Shop'}});
  const selectedAppearance = selectedHuman
    ? el('section', {attrs: {class: 'avatar-customizer selected-human-appearance'}}, [
      el('h2', {text: `${selectedFigure.name} gestalten`}),
      el('p', {text: display.stage === 1
        ? 'Haut- und Kleidungsfarbe gelten für deine menschliche Grundfigur.'
        : 'Wähle kostenlos eine Hautfarbe für diese Entwicklungsform.'}),
      selectedForm,
    ])
    : null;
  root.replaceChildren(el('section', {attrs: {class: 'reward-screen avatar-screen'}}, [
    el('header', {attrs: {class: 'reward-header'}}, [
      el('p', {text: `Level ${rewards.level}`, attrs: {class: 'eyebrow'}}),
      el('h1', {text: 'Mein Avatar'}),
      el('p', {text: 'Wähle deine Figur, entdecke Entwicklungsformen oder gestalte deinen klassischen Avatar.'}),
    ]),
    commerceHost,
    selectedAppearance,
    display.kind === 'classic' ? el('details', {attrs: {class: 'classic-avatar', open: ui.classicOpen ?? true}}, [
      el('summary', {attrs: {id: 'classic-avatar-title'}}, [
        el('strong', {text: 'Klassischen Avatar gestalten'}),
        el('span', {text: allEquipmentUnlocked
          ? 'Alle sechs Ausrüstungsteile sind freigeschaltet. Wähle deine Favoriten.'
          : 'Farben und Zubehör bleiben vollständig erhalten.'}),
      ]),
      el('div', {attrs: {class: 'avatar-layout'}}, [
      el('section', {attrs: {class: 'avatar-preview', 'aria-label': 'Vorschau des Avatars'}}, [
        avatarPicture(parts, {sizes: '(max-width: 700px) 86vw, 360px', animations: profile.animations}),
        el('p', {text: `Entdecker auf Level ${rewards.level}`}),
        motion,
      ]),
      el('section', {attrs: {class: 'avatar-customizer'}}, [notice, classicForm]),
      ]),
    ]) : null,
  ]));
  const classicDetails = root.querySelector('.classic-avatar');
  let lastClassicOpen = classicDetails?.open;
  classicDetails?.addEventListener('toggle', () => {
    if (classicDetails.isConnected && classicDetails.open !== lastClassicOpen) {
      lastClassicOpen = classicDetails.open;
      ui.classicOpen = classicDetails.open;
    }
  });
  if (commerce) renderPurchases({
    root: commerceHost, profileId, commerce, appearance: parts, onRefresh, onReconnect, online: navigator.onLine,
  });
}
