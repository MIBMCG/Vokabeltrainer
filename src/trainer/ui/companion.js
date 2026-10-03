import {companionInfo} from '../avatar/companion.js';
import {el, button} from './dom.js';

export function companionFigure(art, {figureId, stage, animations = false} = {}) {
  const info = companionInfo(figureId, stage);
  return el('div', {attrs: {class: 'companion-figure', 'data-effect': info?.effect ?? 'sway', 'data-animate': String(animations === true)}}, [
    art, el('span', {attrs: {class: 'companion-aura', 'aria-hidden': 'true'}}),
  ]);
}
export function companionBiography(info, ownedStages = []) {
  if (!info || !ownedStages.includes(info.stage)) return null;
  const titles = [...new Set(ownedStages)].sort((a, b) => a - b).map(stage => companionInfo(info.figureId, stage)).filter(Boolean);
  return el('section', {attrs: {class: 'companion-biography', 'aria-label': `Steckbrief: ${info.name}`}}, [
    el('h4', {text: info.title}),
    el('p', {text: info.trait}), el('p', {text: info.story}),
    el('strong', {text: 'Deine Titel'}),
    el('ul', {attrs: {class: 'companion-titles'}}, titles.map(title => el('li', {text: `Stufe ${title.stage}: ${title.title}`}))),
  ]);
}

// Decoration never awaits art, motion or a timer. Skipping only changes presentation.
export function companionMoment(art, {figureId, stage, animations = false, kind, text} = {}) {
  const figure = companionFigure(art, {figureId, stage, animations});
  const moment = el('section', {attrs: {class: 'companion-moment', 'data-kind': kind}}, [
    figure, text ? el('p', {text}) : null,
  ]);
  if (animations) moment.append(button('Über\u00adsprin\u00adgen', () => {
    figure.dataset.animate = 'false';
  }, {class: 'secondary companion-skip', 'aria-label': 'Überspringen'}));
  return moment;
}
