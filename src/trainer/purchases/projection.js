import {EVOLUTION_FORMS} from '../avatar/evolution.js';
import {CATALOG_VERSION, figureById, levelEntitlements} from '../avatar/catalog.js';
import {project} from '../learning/progress.js';
import {assertLedger} from '../model/schema.js';
import {assertExactKeys, assertId, assertInteger, copy, fail} from './value.js';

const EVOLUTION_BY_ID = new Map(EVOLUTION_FORMS.map((form) => [form.id, form]));

function assertAccount(value, profileId) {
  assertExactKeys(value, [
    'profileId', 'earnedPoints', 'spentPoints', 'availablePoints',
    'purchasedArticleIds', 'entitledFigureIds', 'entitledEvolutionIds',
  ], 'Das wirtschaftliche Profil ist ungültig.');
  if (value.profileId !== profileId) fail('reference', 'Das wirtschaftliche Profil hat eine falsche ID.');
  for (const key of ['earnedPoints', 'spentPoints', 'availablePoints']) assertInteger(value[key]);
  if (value.availablePoints !== value.earnedPoints - value.spentPoints) {
    fail('integrity', 'Das gespeicherte Guthaben ist nicht aus Herkunft und Ausgaben ableitbar.');
  }
  for (const key of ['purchasedArticleIds', 'entitledFigureIds', 'entitledEvolutionIds']) {
    if (!Array.isArray(value[key]) || new Set(value[key]).size !== value[key].length) {
      fail('invalid', 'Die Besitzliste ist ungültig.');
    }
  }
  return value;
}

function paidArticle(articleId) {
  const figure = figureById(articleId);
  if (figure !== null) {
    if (figure.unlock.kind !== 'shop') fail('entitlement', 'Dieser Figurenartikel ist kostenlos freigeschaltet.');
    return {kind: 'figure', price: figure.unlock.price, figure};
  }
  const form = EVOLUTION_BY_ID.get(articleId);
  if (!form) fail('reference', 'Der Artikel ist im Katalog nicht vorhanden.');
  if (form.stage === 1 || form.price === 0) fail('entitlement', 'Die erste Entwicklungsform ist kostenlos.');
  return {kind: 'evolution', price: form.price, form};
}

function assertPredecessor(article, account, level) {
  if (article.kind !== 'evolution') return;
  const {figureId, stage} = article.form;
  if (stage === 2) {
    const free = levelEntitlements(level).figureIds.includes(figureId);
    if (!free && !account.purchasedArticleIds.includes(figureId)) {
      fail('entitlement', 'Die Grundfigur für diese Entwicklungsform fehlt.');
    }
    return;
  }
  const previous = `evolution:${figureId}:${stage - 1}`;
  if (!account.purchasedArticleIds.includes(previous)) {
    fail('entitlement', 'Die direkte Vorgängerstufe fehlt.');
  }
}

function profileEntitlements(profile, purchasedArticleIds) {
  const levelFigures = levelEntitlements(profile.level).figureIds;
  const paidFigures = purchasedArticleIds.filter((id) => {
    const figure = figureById(id);
    return figure?.unlock.kind === 'shop';
  });
  const figureIds = [...new Set([...levelFigures, ...paidFigures])].sort();
  const purchasedForms = purchasedArticleIds.filter((id) => EVOLUTION_BY_ID.has(id));
  const stageOnes = figureIds.map((id) => `evolution:${id}:1`);
  return {
    entitledFigureIds: figureIds,
    entitledEvolutionIds: [...new Set([...stageOnes, ...purchasedForms])].sort(),
  };
}

export function accountFrom({profileId, profile, spentPoints = 0, purchasedArticleIds = []}) {
  const purchased = [...purchasedArticleIds].sort();
  const earnedPoints = profile.points;
  if (spentPoints > earnedPoints) fail('funds', 'Bestätigte Ausgaben überschreiten die echten Lernpunkte.');
  return {
    profileId,
    earnedPoints,
    spentPoints,
    availablePoints: earnedPoints - spentPoints,
    purchasedArticleIds: purchased,
    ...profileEntitlements(profile, purchased),
  };
}

export function purchaseOffer({ledger, economic, profileId, articleId}) {
  const checkedLedger = assertLedger(ledger);
  assertId(profileId);
  if (typeof articleId !== 'string') fail('invalid', 'Die Artikel-ID ist ungültig.');
  const learning = project(checkedLedger);
  if (learning.epochConflict || learning.activeEpochId === null || learning.integrityProblems.length > 0) {
    fail('incomplete', 'Der Lernstand ist nicht vollständig eindeutig.');
  }
  const profile = learning.profiles[profileId];
  if (!profile) fail('reference', 'Das Lernprofil ist nicht vorhanden.');
  if (!economic || economic.version !== 1 || economic.binding?.datasetId !== checkedLedger.descriptor.datasetId
    || economic.activeEpochId !== learning.activeEpochId) {
    fail('binding', 'Lernstand und wirtschaftlicher Stand passen nicht zusammen.');
  }
  const account = assertAccount(economic.accounts?.[profileId], profileId);
  if (account.earnedPoints !== profile.points) {
    fail('integrity', 'Die Lernpunkte wurden nicht aus dem aktuellen Fachstand abgeleitet.');
  }
  if (account.purchasedArticleIds.includes(articleId)) fail('entitlement', 'Dieser Artikel ist bereits erworben.');
  const article = paidArticle(articleId);
  assertPredecessor(article, account, profile.level);
  if (account.availablePoints < article.price) fail('funds', 'Für diesen Artikel reichen die Lernpunkte nicht.');
  return copy({
    version: 1,
    datasetId: checkedLedger.descriptor.datasetId,
    epochId: learning.activeEpochId,
    profileId,
    articleId,
    catalogVersion: CATALOG_VERSION,
    price: article.price,
    earnedPoints: profile.points,
    spentPoints: account.spentPoints,
    availablePoints: account.availablePoints,
  });
}

export function catalogArticle(articleId) {
  const article = paidArticle(articleId);
  return article.kind === 'figure'
    ? {articleId, price: article.price, kind: 'figure'}
    : {articleId, price: article.price, kind: 'evolution'};
}

export function rebuildAccounts(learning, transferred = null) {
  const accounts = Object.create(null);
  for (const profileId of Object.keys(learning.profiles).sort()) {
    const source = transferred?.[profileId];
    Object.defineProperty(accounts, profileId, {
      enumerable: true,
      configurable: true,
      writable: true,
      value: accountFrom({
        profileId,
        profile: learning.profiles[profileId],
        spentPoints: source?.spentPoints ?? 0,
        purchasedArticleIds: source?.purchasedArticleIds ?? [],
      }),
    });
  }
  if (transferred) {
    for (const profileId of Object.keys(transferred)) {
      if (!Object.hasOwn(accounts, profileId)) fail('reference', 'Die Herkunft enthält ein unbekanntes Lernprofil.');
    }
  }
  return accounts;
}
