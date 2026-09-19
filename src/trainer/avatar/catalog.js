function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

export const CATALOG_VERSION = 1;

export const FIGURES = freeze([
  {id: 'explorer-girl', name: 'Entdeckerin', group: 'human', unlock: {kind: 'start'}},
  {id: 'explorer-boy', name: 'Entdecker', group: 'human', unlock: {kind: 'start'}},
  {id: 'horse', name: 'Pferd', group: 'equine', unlock: {kind: 'level', level: 3}},
  {id: 'tiger', name: 'Tiger', group: 'tiger', unlock: {kind: 'level', level: 5}},
  {id: 'dragon', name: 'Einfacher Drache', group: 'dragon', unlock: {kind: 'level', level: 9}},
  {id: 'deer-mist', name: 'Nebelhirsch', group: 'deer', unlock: {kind: 'shop', price: 600}},
  {id: 'wolf-aurora', name: 'Polarlichtwolf', group: 'wolf', unlock: {kind: 'shop', price: 800}},
  {id: 'panther-shadow', name: 'Schattenpanther', group: 'panther', unlock: {kind: 'shop', price: 800}},
  {id: 'unicorn-moon', name: 'Mond-Einhorn', group: 'equine', unlock: {kind: 'shop', price: 900}},
  {id: 'griffin-storm', name: 'Sturmgreif', group: 'griffin', unlock: {kind: 'shop', price: 1000}},
  {id: 'dragon-crystal', name: 'Kristalldrache', group: 'dragon', unlock: {kind: 'shop', price: 1200}},
  {id: 'pegasus-star', name: 'Sternen-Pegasus', group: 'equine', unlock: {kind: 'shop', price: 1200}},
  {id: 'phoenix', name: 'Phönix', group: 'phoenix', unlock: {kind: 'shop', price: 1200}},
]);

const levelItem = (id, name, slot, level) => ({
  id, name, group: 'human', slot, unlock: {kind: 'level', level},
});

const shopItem = (setId, slot, name, group, price) => ({
  id: `${setId}-${slot}`, name, group, slot, setId, unlock: {kind: 'shop', price},
});

export const ITEMS = freeze([
  levelItem('cap', 'Kappe', 'head', 2),
  levelItem('backpack', 'Rucksack', 'back', 4),
  levelItem('sunhat', 'Sonnenhut', 'head', 6),
  levelItem('knight-clothing', 'Ritterrüstung', 'clothing', 7),
  levelItem('binoculars', 'Fernglas', 'hand', 8),
  levelItem('mountainhat', 'Bergmütze', 'head', 11),
  levelItem('compass', 'Kompass', 'hand', 14),

  shopItem('crystal', 'head', 'Runen-Amulett', 'dragon', 120),
  shopItem('crystal', 'body', 'Kristallrüstung', 'dragon', 240),
  shopItem('crystal', 'adornment', 'Leuchtende Flügelspitzen', 'dragon', 360),
  shopItem('moon', 'head', 'Mondsichel-Kopfschmuck', 'equine', 120),
  shopItem('moon', 'body', 'Sternenumhang', 'equine', 240),
  shopItem('moon', 'adornment', 'Silberne Hufreifen', 'equine', 360),
  shopItem('stars', 'head', 'Sternbild-Kopfschmuck', 'equine', 120),
  shopItem('stars', 'body', 'Wolkensattel', 'equine', 240),
  shopItem('stars', 'adornment', 'Kometenschweif', 'equine', 360),
  shopItem('storm', 'head', 'Runen-Amulett', 'griffin', 120),
  shopItem('storm', 'body', 'Blitzrüstung', 'griffin', 240),
  shopItem('storm', 'adornment', 'Goldene Federzier', 'griffin', 360),
  shopItem('sun', 'head', 'Sonnenkrone', 'phoenix', 120),
  shopItem('sun', 'body', 'Magischer Brustschmuck', 'phoenix', 240),
  shopItem('sun', 'adornment', 'Glühende Flügelreifen', 'phoenix', 360),
  shopItem('aurora', 'head', 'Eiskristall-Amulett', 'wolf', 120),
  shopItem('aurora', 'body', 'Nordlicht-Umhang', 'wolf', 240),
  shopItem('aurora', 'adornment', 'Leuchtende Pfotenreifen', 'wolf', 360),
  shopItem('forest', 'head', 'Kristallgeweih-Schmuck', 'deer', 120),
  shopItem('forest', 'body', 'Runenumhang', 'deer', 240),
  shopItem('forest', 'adornment', 'Waldgeist-Beinzier', 'deer', 360),
  shopItem('obsidian', 'head', 'Obsidian-Amulett', 'panther', 120),
  shopItem('obsidian', 'body', 'Violette Runenrüstung', 'panther', 240),
  shopItem('obsidian', 'adornment', 'Sternenpfoten', 'panther', 360),
  shopItem('jungle', 'head', 'Blatt-Amulett', 'tiger', 120),
  shopItem('jungle', 'body', 'Entdecker-Geschirr', 'tiger', 240),
  shopItem('jungle', 'adornment', 'Goldene Pfotenreifen', 'tiger', 360),
  shopItem('runes', 'head', 'Runenmedaillon', 'human', 120),
  shopItem('runes', 'back', 'Sternenumhang', 'human', 240),
  shopItem('runes', 'hand', 'Kristall-Kompass', 'human', 360),
]);

export const LEGACY_ITEM_IDS = freeze({
  head: {cap: 'cap', sunhat: 'sunhat', mountainhat: 'mountainhat'},
  back: {backpack: 'backpack'},
  hand: {binoculars: 'binoculars', compass: 'compass'},
});

const FIGURES_BY_ID = new Map(FIGURES.map((figure) => [figure.id, figure]));
const ITEMS_BY_ID = new Map(ITEMS.map((item) => [item.id, item]));

export function figureById(id) {
  return typeof id === 'string' ? FIGURES_BY_ID.get(id) ?? null : null;
}

export function itemById(id) {
  return typeof id === 'string' ? ITEMS_BY_ID.get(id) ?? null : null;
}

export function isCompatible(itemId, figureId) {
  const item = itemById(itemId);
  const figure = figureById(figureId);
  return item !== null && figure !== null && item.group === figure.group;
}

export function levelEntitlements(level) {
  if (!Number.isInteger(level) || level < 1) throw new TypeError('level must be a positive integer');
  return freeze({
    figureIds: FIGURES
      .filter(({unlock}) => unlock.kind === 'start' || (unlock.kind === 'level' && unlock.level <= level))
      .map(({id}) => id),
    itemIds: ITEMS
      .filter(({unlock}) => unlock.kind === 'level' && unlock.level <= level)
      .map(({id}) => id),
  });
}
