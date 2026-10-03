import {FIGURES, figureById} from './catalog.js';

// Presentation only: these texts never grant ownership or award points.
const CHARACTERS = {
  'explorer-girl': ['Entdeckerbucht', 'Neugierig und mutig', 'sway', ['Spurensucherin', 'Pfadfinderin', 'Inselkennerin', 'Horizontentdeckerin'], 'Sie folgt neugierig den Spuren am Strand.'],
  'explorer-boy': ['Entdeckerbucht', 'Aufmerksam und erfinderisch', 'sway', ['Spurensucher', 'Pfadfinder', 'Inselkenner', 'Horizontentdecker'], 'Er hält nach neuen Wegen am Strand Ausschau.'],
  horse: ['Wiesenweide', 'Ausdauernd und verlässlich', 'sway', ['Wiesenfreund', 'Weggefährte', 'Weitenläufer', 'Windläufer'], 'Das Pferd erkundet die Wiesen mit ruhigem Schritt.'],
  tiger: ['Tigerlichtung', 'Wachsam und entschlossen', 'sway', ['Dschungelfreund', 'Spurenleser', 'Lichtungswächter', 'Dschungelhüter'], 'Der Tiger entdeckt leise einen Pfad durch das grüne Dickicht.'],
  dragon: ['Drachenfelsen', 'Tapfer und warmherzig', 'glow', ['Glutfreund', 'Funkenhüter', 'Flammenwächter', 'Drachenhüter'], 'Der Drache wärmt sich an den sonnigen Felsen.'],
  'deer-mist': ['Nebelhain', 'Sanft und aufmerksam', 'mist', ['Nebelfreund', 'Hainwanderer', 'Nebelwächter', 'Waldgeisthüter'], 'Der Nebelhirsch findet sichere Pfade zwischen den Bäumen.'],
  'wolf-aurora': ['Polarlichtufer', 'Treuen Herzens und wachsam', 'glow', ['Nordlichtfreund', 'Schneewanderer', 'Polarlichtwächter', 'Nordlichthüter'], 'Der Polarlichtwolf folgt dem sanften Leuchten am Himmel.'],
  'panther-shadow': ['Schattenhain', 'Leise und geschickt', 'mist', ['Schattenfreund', 'Nachtwanderer', 'Schattenwächter', 'Nachthüter'], 'Der Schattenpanther gleitet aufmerksam durch die Abenddämmerung.'],
  'unicorn-moon': ['Mondwiese', 'Sanft und hoffnungsvoll', 'glow', ['Mondfreund', 'Mondwanderer', 'Mondwächter', 'Mondlichthüter'], 'Das Mond-Einhorn findet eine stille Wiese im Mondschein.'],
  'griffin-storm': ['Sturmhorst', 'Mutig und frei', 'spark', ['Windfreund', 'Wolkenreiter', 'Sturmwächter', 'Sturmhüter'], 'Der Sturmgreif blickt von seinem Horst über die Wolken.'],
  'dragon-crystal': ['Kristallgrotte', 'Bedacht und standhaft', 'glow', ['Kristallfreund', 'Grottenwanderer', 'Kristallwächter', 'Kristallhüter'], 'Der Kristalldrache entdeckt funkelnde Spuren in seiner Grotte.'],
  'pegasus-star': ['Sternenwarte', 'Leichtfüßig und verträumt', 'glow', ['Sternenfreund', 'Wolkenwanderer', 'Sternenwächter', 'Sternenhüter'], 'Der Sternen-Pegasus schaut von der Insel zu den Sternen.'],
  phoenix: ['Glutnest', 'Zuversichtlich und beharrlich', 'glow', ['Glutfeder', 'Funkenflügel', 'Flammenwächter', 'Sonnenhüter'], 'Der Phönix breitet seine warm leuchtenden Federn aus.'],
};
const CHAPTERS = ['Hier beginnt ein kleines Inselabenteuer.', 'Neue Wege führen weiter über die Insel.', 'Die vertrauten Wege verbinden sich zu einer großen Reise.', 'Nun reicht der Blick bis zum Horizont; neue Abenteuer warten.'];
const INFO = new Map(FIGURES.flatMap(({id, name}) => {
  const [place, trait, effect, titles, story] = CHARACTERS[id];
  return titles.map((title, index) => [`${id}:${index + 1}`, Object.freeze({figureId: id, stage: index + 1, name, title, place, trait, story: `${story} ${CHAPTERS[index]}`, effect})]);
}));
export function companionInfo(figureId, stage) {
  if (!figureById(figureId) || !Number.isInteger(stage) || stage < 1 || stage > 4) return null;
  return INFO.get(`${figureId}:${stage}`);
}
export function ownedCompanions(view, profileId) {
  if (view?.mode !== 'active' || typeof profileId !== 'string' || !Object.hasOwn(view.accounts ?? {}, profileId)) return [];
  const account = view.accounts[profileId];
  if (!Array.isArray(account?.entitledFigureIds) || !Array.isArray(account?.entitledEvolutionIds)) return [];
  return FIGURES.flatMap(({id}) => {
    if (!account.entitledFigureIds.includes(id)) return [];
    const ownedStages = [1, 2, 3, 4].filter(stage => account.entitledEvolutionIds.includes(`evolution:${id}:${stage}`));
    if (!ownedStages.length) return [];
    const stage = ownedStages.at(-1);
    return [{figureId: id, stage, ownedStages, info: companionInfo(id, stage)}];
  });
}
const moments = new WeakMap();
export function claimCompanionMoment(owner, profileId, key) {
  if (!owner || !['object', 'function'].includes(typeof owner) || typeof profileId !== 'string' || !profileId || typeof key !== 'string' || !key) return false;
  if (!moments.has(owner)) moments.set(owner, new Set());
  const seen = moments.get(owner); const identity = JSON.stringify([profileId, key]);
  if (seen.has(identity)) return false;
  seen.add(identity);
  if (seen.size > 256) seen.delete(seen.values().next().value);
  return true;
}
