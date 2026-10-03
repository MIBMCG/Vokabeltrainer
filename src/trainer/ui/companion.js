import {companionInfo} from '../avatar/companion.js';
import {el} from './dom.js';

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
