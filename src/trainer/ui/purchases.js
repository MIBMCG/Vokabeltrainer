import {FIGURES} from '../avatar/catalog.js';
import {EVOLUTION_FORMS} from '../avatar/evolution.js';
import {figurePicture} from '../avatar/art.js';
import {project} from '../learning/progress.js';
import {readHistory, replayHistory} from '../purchases/history.js';
import {rebuildAccounts} from '../purchases/projection.js';
import {el, button, message} from './dom.js';

const DRAGON_ART = Object.freeze(new Map([
  [1, '../../../trainer/assets/avatar-evolution/dragon-stage-1.png'],
  [2, '../../../trainer/assets/avatar-evolution/dragon-stage-2.png'],
  [3, '../../../trainer/assets/avatar-evolution/dragon-stage-3.png'],
  [4, '../../../trainer/assets/avatar-evolution/dragon-stage-4.png'],
]));

export function activationPreviewModel(state) {
  const learning = project(state.ledger);
  const profiles = Object.entries(learning.profiles)
    .map(([id, profile]) => ({
      id,
      name: learning.entities.profiles[id]?.value?.name ?? 'Kind',
      points: profile.points,
      level: profile.level,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'de'));
  return Object.freeze({
    datasetName: state.ledger.descriptor.name,
    profiles,
    explanation: 'Lernpunkte und Level bleiben erhalten. Punkte für Figuren werden davon getrennt ausgegeben.',
    deviceNotice: 'Andere Geräte benötigen anschließend das Appupdate, bevor sie wieder gemeinsam abgleichen.',
  });
}

function pendingPurchase(view, profileId) {
  const job = view.jobs.find(({status, intent}) => status === 'open' && intent.profileId === profileId);
  if (!job) return null;
  return {
    operationId: job.intent.operationId,
    articleId: job.intent.articleId,
    phase: job.attempts.at(-1)?.phase ?? 'intent',
  };
}

export function evolutionArt(figureId, stage) {
  if (figureId !== 'dragon') return null;
  const path = DRAGON_ART.get(stage);
  return path ? new URL(path, import.meta.url).href : null;
}

export function purchaseProfileModel({view, profileId, online, authenticated = true}) {
  const account = view.accounts?.[profileId] ?? null;
  if (!account) return null;
  const pending = pendingPurchase(view, profileId);
  const selection = view.selection.find((entry) => entry.profileId === profileId) ?? null;
  const selectedFigureId = selection?.figureId
    ?? (account.entitledFigureIds.includes('dragon') ? 'dragon' : account.entitledFigureIds[0]);
  const forms = EVOLUTION_FORMS.filter(({figureId}) => figureId === selectedFigureId).map((form) => {
    const owned = account.entitledEvolutionIds.includes(form.id);
    const previousOwned = form.stage === 1
      || account.entitledEvolutionIds.includes(`evolution:dragon:${form.stage - 1}`);
    const artAvailable = evolutionArt(form.figureId, form.stage) !== null;
    let action = 'locked';
    if (!artAvailable) action = 'unavailable';
    else if (owned) action = 'select';
    else if (pending?.articleId === form.id) {
      action = !online ? 'offline' : !authenticated ? 'reauth' : 'resume';
    }
    else if (!previousOwned) action = 'locked';
    else if (!online) action = 'offline';
    else if (account.availablePoints < form.price) action = 'saving';
    else if (!authenticated) action = 'reauth';
    else action = 'buy';
    return {...form, owned, artAvailable, artUrl: evolutionArt(form.figureId, form.stage), action};
  });
  const selected = selection
    ? forms.find(({figureId, stage}) => figureId === selection.figureId && stage === selection.stage) ?? null
    : null;
  const shop = FIGURES.filter(({unlock}) => unlock.kind === 'shop').map((figure) => {
    const owned = account.entitledFigureIds.includes(figure.id);
    let action = owned ? 'select' : !online ? 'offline'
      : account.availablePoints < figure.unlock.price ? 'saving' : !authenticated ? 'reauth' : 'buy';
    if (!owned && pending?.articleId === figure.id) {
      action = !online ? 'offline' : !authenticated ? 'reauth' : 'resume';
    }
    return {...figure, owned, action, baseArtAvailable: true};
  });
  return Object.freeze({
    availablePoints: account.availablePoints,
    levelPoints: account.earnedPoints,
    pending,
    selected,
    forms,
    shop,
  });
}

function accountChanges(before, after) {
  const ids = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  return ids.map((profileId) => ({
    profileId,
    before: before[profileId] ?? null,
    after: after[profileId] ?? null,
  })).filter(({before: left, after: right}) => JSON.stringify(left) !== JSON.stringify(right));
}

export async function economicBackupPreview({state, backup}) {
  if (backup.formatVersion !== 3) return {included: false, changes: [], selectionChanges: 0};
  const incoming = await replayHistory({
    entries: backup.economy.entries, bases: backup.economy.bases,
    binding: backup.economy.binding, sourceProvenance: true,
  });
  let before = {};
  if (state.commerce?.mode === 'active') {
    const current = await readHistory({
      head: state.commerce.head, binding: state.commerce.binding, cache: state.commerce.cache,
      read: async () => { throw new Error('Die lokale Kaufhistorie ist unvollständig.'); }, onProgress: () => {},
    });
    before = rebuildAccounts(project(state.ledger), current.projection.accounts);
  }
  return {
    included: true,
    changes: accountChanges(before, incoming.accounts),
    selectionChanges: selectionChangeCount(state.commerce?.selection ?? [], backup.economy.selection),
  };
}

function selectionChangeCount(before, after) {
  const left = new Map(before.map((selection) => [selection.profileId, selection]));
  const right = new Map(after.map((selection) => [selection.profileId, selection]));
  const profileIds = new Set([...left.keys(), ...right.keys()]);
  return [...profileIds].filter((profileId) => {
    const current = left.get(profileId);
    const incoming = right.get(profileId);
    return current?.figureId !== incoming?.figureId || current?.stage !== incoming?.stage;
  }).length;
}

const stateByOwner = new WeakMap();

function uiState(root) {
  const owner = root.closest?.('#app') ?? root;
  if (!stateByOwner.has(owner)) stateByOwner.set(owner, {
    tab: 'mine', view: null, busy: false, notice: '', tone: 'info', activationPreview: null,
    authRequired: false, progress: '', dialogOpen: false,
  });
  return stateByOwner.get(owner);
}

function rerenderCurrentPurchase(ui, {focus = false} = {}) {
  let target = ui.purchaseRender;
  if (!target?.root.isConnected) {
    target?.onRefresh?.();
    target = ui.purchaseRender;
  }
  if (target?.root.isConnected) {
    renderPurchases({...target, online: navigator.onLine});
  }
  if (focus) queueMicrotask(() => {
    const current = ui.purchaseRoot;
    if (current?.isConnected) current.querySelector('.commerce-tabs [aria-current="page"]')?.focus();
  });
}

function figureCard(figure, controls = []) {
  return el('article', {attrs: {class: 'commerce-card'}}, [
    figurePicture({figureId: figure.id, equipment: {}}, {sizes: '(max-width: 600px) 42vw, 180px'}),
    el('h3', {text: figure.name}),
    ...controls,
  ]);
}

function evolutionPicture(form) {
  if (!form.artAvailable) return el('div', {attrs: {class: 'evolution-placeholder', role: 'img', 'aria-label': 'Bild folgt'}}, [
    el('span', {text: 'Bild folgt'}),
  ]);
  const image = el('img', {attrs: {
    src: form.artUrl, alt: `Drache Entwicklungsstufe ${form.stage}`, loading: 'eager',
    width: '1536', height: '1536', class: 'evolution-image',
  }});
  return el('picture', {attrs: {class: 'evolution-art'}}, [image]);
}

function purchaseActionLabel(entry) {
  if (entry.action === 'resume') return 'Kauf fortsetzen';
  if (entry.action === 'reauth') return 'Google erneut verbinden';
  if (entry.action === 'offline') return 'Offline – Kauf nicht möglich';
  if (entry.action === 'saving') return `Noch ${entry.price - entry.availablePoints} Punkte sammeln`;
  if (entry.action === 'locked') return 'Vorherige Stufe fehlt';
  if (entry.action === 'unavailable') return 'Bild noch nicht verfügbar';
  return `Für ${entry.price} Punkte freischalten`;
}

function purchaseDialog({preview, name, onConfirm, trigger, onComplete}) {
  const dialog = el('dialog', {attrs: {class: 'purchase-dialog', 'aria-labelledby': 'purchase-dialog-title'}}, [
    el('h2', {text: 'Kauf prüfen', attrs: {id: 'purchase-dialog-title'}}),
    el('p', {text: name}),
    el('dl', {attrs: {class: 'summary-list'}}, [
      el('dt', {text: 'Preis'}), el('dd', {text: `${preview.price} Punkte`}),
      el('dt', {text: 'Danach verfügbar'}), el('dd', {text: `${preview.availablePoints - preview.price} Punkte`}),
    ]),
    el('p', {text: 'Ausgeben verändert dein Level nicht.'}),
  ]);
  let confirming = false;
  let finished = false;
  let feedback = null;
  const finish = () => {
    if (finished) return;
    finished = true;
    dialog.remove();
    onComplete?.();
    if (trigger?.isConnected) trigger.focus();
  };
  dialog.addEventListener('cancel', (event) => {
    if (confirming) event.preventDefault();
  });
  dialog.addEventListener('close', finish);
  const cancel = button('Abbrechen', () => {
    if (confirming) return;
    dialog.close(); finish();
  }, {class: 'secondary'});
  const confirm = button('Kauf verbindlich bestätigen', async () => {
    if (confirming) return;
    confirming = true;
    confirm.disabled = true; cancel.disabled = true;
    confirm.setAttribute('aria-busy', 'true');
    feedback?.remove();
    feedback = message('Kauf wird abgeschlossen …');
    dialog.append(feedback);
    try {
      await onConfirm(); dialog.close(); finish();
    }
    catch (error) {
      confirming = false;
      confirm.removeAttribute('aria-busy');
      confirm.disabled = false; cancel.disabled = false;
      feedback.remove();
      feedback = message(error?.message || 'Der Kauf konnte noch nicht bestätigt werden.', 'error');
      dialog.append(feedback);
    }
  }, {class: 'primary'});
  dialog.append(el('div', {attrs: {class: 'dialog-actions'}}, [confirm, cancel]));
  document.body.append(dialog); dialog.showModal(); confirm.focus();
}

export function renderPurchases({
  root, profileId, commerce, appearance, onRefresh, onReconnect, online = navigator.onLine,
}) {
  const ui = uiState(root);
  ui.purchaseRender = {root, profileId, commerce, appearance, onRefresh, onReconnect};
  if (ui.purchaseRoot !== root) {
    ui.purchaseRoot = root;
    ui.view = null;
  }
  const rerender = (options) => rerenderCurrentPurchase(ui, options);
  const authenticated = commerce.isConnected?.() ?? true;
  if (authenticated && ui.authRequired) {
    ui.authRequired = false;
    ui.notice = '';
    ui.tone = 'info';
  }
  const requireAuth = () => {
    ui.authRequired = true;
    ui.notice = '';
    ui.tone = 'info';
  };
  const load = async (refresh = false) => {
    if (ui.busy) return;
    ui.busy = true;
    try {
      if (refresh) await commerce.refresh();
      ui.view = await commerce.getView();
    } catch (error) {
      if (error?.code === 'auth') requireAuth();
      else {
        ui.notice = error?.message || 'Figuren und Käufe konnten nicht gelesen werden.';
        ui.tone = 'error';
      }
      ui.view = {mode: 'inactive', head: null, accounts: {}, jobs: [], selection: [], control: null};
    } finally { ui.busy = false; rerender(); }
  };
  if (ui.view === null && !ui.busy) void load();

  const tabs = el('nav', {attrs: {class: 'commerce-tabs', 'aria-label': 'Figurenbereiche'}});
  for (const [key, label] of [['mine', 'Meine Figur'], ['evolution', 'Entwicklung'], ['shop', 'Shop']]) {
    tabs.append(button(label, () => { ui.tab = key; rerender(); }, {
      class: ui.tab === key ? 'active' : '', 'aria-current': ui.tab === key ? 'page' : null,
    }));
  }
  const section = el('section', {attrs: {class: 'commerce-panel'}}, [tabs]);
  if (ui.notice) section.append(message(ui.notice, ui.tone));
  if (ui.progress) section.append(message(ui.progress));
  if (ui.view === null) {
    section.append(el('p', {text: ui.busy ? 'Figuren und Käufe werden geladen …' : 'Figuren und Käufe sind noch nicht eingerichtet.'}));
    root.replaceChildren(section); return;
  }
  if (ui.view.mode !== 'active') {
    section.append(message('Die Daten für Figuren und Käufe werden im Erwachsenenbereich eingerichtet. Dein klassischer Avatar bleibt verfügbar.'));
    root.replaceChildren(section); return;
  }
  const model = purchaseProfileModel({view: ui.view, profileId, online, authenticated});
  if (!model) {
    section.append(message('Für dieses Lernprofil ist noch kein bestätigtes Punktekonto vorhanden.', 'error'));
    root.replaceChildren(section); return;
  }
  section.append(el('div', {attrs: {class: 'commerce-balance'}}, [
    el('strong', {text: `${model.availablePoints} Verfügbare Punkte`}),
    el('span', {text: `${model.levelPoints} Lernpunkte · Ausgeben verändert dein Level nicht.`}),
  ]));
  if (!authenticated) {
    section.append(el('div', {attrs: {class: 'commerce-auth-notice'}}, [
      message('Für neue Käufe muss Google erneut verbunden werden. Freigeschaltete Figuren bleiben verfügbar.'),
      button('Google erneut verbinden', () => onReconnect?.(), {
        class: 'secondary', disabled: typeof onReconnect !== 'function',
      }),
    ]));
  }
  if (model.pending) section.append(message('Kauf wird geprüft. Sobald der Kauf bestätigt ist, gehört die Figur dir.'));

  const run = async (action, success = '', {rethrowCodes = [], progress = 'Änderung wird verarbeitet …'} = {}) => {
    if (ui.busy) return;
    ui.busy = true;
    ui.progress = progress;
    rerender();
    try {
      await action();
      ui.view = await commerce.getView();
      ui.notice = success; ui.tone = 'info';
    } catch (error) {
      try { ui.view = await commerce.getView(); } catch {}
      if (rethrowCodes.includes(error?.code)) throw error;
      if (error?.code === 'auth') requireAuth();
      else {
        ui.notice = error?.code === 'network' || error?.code === 'pending'
          ? 'Kauf wird geprüft. Der Ausgang ist noch unbekannt. Du kannst ihn gezielt fortsetzen.'
          : error?.message || 'Die Aktion konnte noch nicht abgeschlossen werden.';
        ui.tone = error?.code === 'network' || error?.code === 'pending' ? 'info' : 'error';
      }
    } finally { ui.busy = false; ui.progress = ''; rerender({focus: true}); }
  };
  const buy = async (entry, trigger) => {
    if (ui.busy || ui.dialogOpen) return;
    if (entry.action === 'resume') {
      await run(() => commerce.resume(model.pending.operationId), 'Der Kauf wurde erneut geprüft.',
        {progress: 'Kauf wird erneut geprüft …'});
      return;
    }
    ui.busy = true;
    ui.progress = 'Kaufangebot wird geprüft …';
    rerender();
    try {
      const preview = await commerce.preview({profileId, articleId: entry.id});
      ui.dialogOpen = true;
      purchaseDialog({preview, name: entry.name, trigger, onComplete: () => {
        ui.dialogOpen = false;
        rerender({focus: true});
      }, onConfirm: () => run(
        () => commerce.confirm(preview), 'Der Kauf ist bestätigt.',
        {rethrowCodes: ['stale'], progress: 'Kauf wird bestätigt …'},
      )});
    } catch (error) {
      if (error?.code === 'auth') requireAuth();
      else {
        ui.notice = error?.code === 'network'
          ? 'Für die Kaufprüfung wird wieder eine Internetverbindung benötigt.'
          : error?.message || 'Der Kauf konnte noch nicht geprüft werden.';
        ui.tone = 'error';
      }
      trigger?.focus();
    } finally { ui.busy = false; ui.progress = ''; rerender(); }
  };

  const grid = el('div', {attrs: {class: 'commerce-grid'}});
  if (ui.tab === 'mine') {
    if (model.selected) {
      const selectedFigure = FIGURES.find(({id}) => id === model.selected.figureId);
      const selectedPicture = model.selected.figureId === 'dragon'
        ? evolutionPicture(model.selected)
        : figurePicture({
          figureId: model.selected.figureId,
          skin: appearance?.skin,
          clothing: appearance?.clothing,
          equipment: {},
        }, {sizes: '(max-width: 600px) 70vw, 320px'});
      grid.append(el('article', {attrs: {class: 'commerce-card selected-purchase-figure', 'data-selected-purchase-figure': ''}}, [
        selectedPicture,
        el('h3', {text: model.selected.stage === 1
          ? selectedFigure?.name ?? 'Ausgewählte Figur'
          : `${selectedFigure?.name ?? 'Figur'} – Stufe ${model.selected.stage}`}),
        el('p', {text: 'Deine ausgewählte Figur'}),
      ]));
    }
    const classicSelected = model.selected === null;
    grid.append(el('article', {attrs: {class: 'commerce-card classic-card'}}, [
      el('h3', {text: 'Klassisch'}),
      el('p', {text: 'Deine bisherigen Farben und Zubehörteile bleiben erhalten.'}),
      el('p', {text: classicSelected ? 'Ausgewählt' : 'Verfügbar', attrs: {class: 'status-chip'}}),
      button(classicSelected ? 'Ausgewählt' : 'Klassisch auswählen', () => run(
        () => commerce.clearSelection({profileId}), 'Der klassische Avatar wurde ausgewählt.',
      ), {class: 'secondary', disabled: classicSelected || ui.busy}),
    ]));
    for (const figureId of ui.view.accounts[profileId].entitledFigureIds) {
      const figure = FIGURES.find(({id}) => id === figureId);
      if (!figure) continue;
      const selected = model.selected?.figureId === figureId && model.selected.stage === 1;
      grid.append(figureCard(figure, [
        el('p', {text: selected ? 'Ausgewählt' : 'Freigeschaltet', attrs: {class: 'status-chip'}}),
        button(selected ? 'Ausgewählt' : 'Grundform auswählen', () => run(
          () => commerce.select({profileId, figureId, stage: 1}), `${figure.name} wurde ausgewählt.`,
        ), {class: 'secondary', disabled: selected || ui.busy}),
      ]));
    }
  } else if (ui.tab === 'evolution') {
    for (const form of model.forms) {
      const figureName = FIGURES.find(({id}) => id === form.figureId)?.name ?? 'Figur';
      const entry = {...form, name: `${figureName} – Stufe ${form.stage}`, availablePoints: model.availablePoints};
      const action = form.action === 'select'
        ? button(model.selected?.id === form.id ? 'Ausgewählt' : 'Diese Form auswählen', () => run(
          () => commerce.select({profileId, figureId: form.figureId, stage: form.stage}), 'Die Entwicklungsform wurde ausgewählt.',
        ), {class: 'secondary', disabled: model.selected?.id === form.id || ui.busy})
        : button(purchaseActionLabel(entry), (event) => {
          if (form.action === 'reauth') onReconnect?.();
          else void buy(entry, event.currentTarget);
        }, {
          class: ['buy', 'resume', 'reauth'].includes(form.action) ? 'primary' : 'secondary',
          disabled: !['buy', 'resume', 'reauth'].includes(form.action) || ui.busy || ui.dialogOpen
            || (form.action === 'reauth' && typeof onReconnect !== 'function'),
        });
      grid.append(el('article', {attrs: {class: 'commerce-card evolution-card', 'data-stage': String(form.stage)}}, [
        evolutionPicture(form), el('h3', {text: entry.name}),
        el('p', {text: form.stage === 1 ? 'Grundform' : `${form.price} Punkte`}), action,
      ]));
    }
  } else {
    for (const figure of model.shop) {
      const entry = {...figure, id: figure.id, price: figure.unlock.price, availablePoints: model.availablePoints};
      grid.append(figureCard(figure, [
        el('p', {text: figure.owned ? 'Freigeschaltet' : `${figure.unlock.price} Punkte`}),
        figure.owned
          ? button('Grundform auswählen', () => run(
            () => commerce.select({profileId, figureId: figure.id, stage: 1}), `${figure.name} wurde ausgewählt.`,
          ), {class: 'secondary', disabled: ui.busy})
          : button(purchaseActionLabel(entry), (event) => {
            if (figure.action === 'reauth') onReconnect?.();
            else void buy(entry, event.currentTarget);
          }, {
            class: ['buy', 'resume', 'reauth'].includes(figure.action) ? 'primary' : 'secondary',
            disabled: !['buy', 'resume', 'reauth'].includes(figure.action) || ui.busy || ui.dialogOpen
              || (figure.action === 'reauth' && typeof onReconnect !== 'function'),
          }),
      ]));
    }
  }
  section.append(grid);
  root.replaceChildren(section);
}

export function renderCommerceSettings({root, state, commerce, isUnlocked, onRefresh}) {
  const ui = uiState(root);
  const section = el('section', {attrs: {class: 'stack', 'aria-labelledby': 'commerce-settings-title'}}, [
    el('h2', {text: 'Figuren und Käufe', attrs: {id: 'commerce-settings-title'}}),
  ]);
  if (ui.notice) section.append(message(ui.notice, ui.tone));
  const mode = state.commerce?.mode ?? 'inactive';
  if (mode === 'active') {
    section.append(message('Figuren und Käufe sind bereit. Käufe verwenden nur bestätigte Lernpunkte.'));
  } else if (state.commerce?.setup && state.commerce.setup.phase !== 'confirmed') {
    section.append(
      message('Die Einrichtung wird geprüft. Ihr Ausgang ist noch nicht bestätigt.'),
      button('Datenaktualisierung fortsetzen', async () => {
        try {
          if (!isUnlocked()) throw Object.assign(new Error('Bitte den Erwachsenenbereich erneut öffnen.'), {code: 'locked'});
          await commerce.resume(state.commerce.setup.operationId); ui.notice = 'Die Einrichtung wurde fortgesetzt.'; ui.tone = 'info';
        } catch (error) { ui.notice = error?.message || 'Die Einrichtung konnte noch nicht fortgesetzt werden.'; ui.tone = 'error'; }
        onRefresh?.();
      }, {class: 'primary'}),
    );
  } else if (state.commerce?.control && !['confirmed', 'rejected', 'superseded'].includes(state.commerce.control.phase)) {
    section.append(
      message('Die Datenaktualisierung wird geprüft. Ihr Ausgang ist noch nicht bestätigt.'),
      button('Datenaktualisierung fortsetzen', async () => {
        try {
          if (!isUnlocked()) throw Object.assign(new Error('Bitte den Erwachsenenbereich erneut öffnen.'), {code: 'locked'});
          await commerce.resume(state.commerce.control.operationId); ui.notice = 'Die Datenaktualisierung wurde fortgesetzt.'; ui.tone = 'info';
        } catch (error) { ui.notice = error?.message || 'Die Aktualisierung konnte noch nicht fortgesetzt werden.'; ui.tone = 'error'; }
        onRefresh?.();
      }, {class: 'primary'}),
    );
  } else if (state.binding === null) {
    section.append(el('p', {text: 'Verbinden Sie zuerst den gemeinsamen Lernbereich mit Google Drive.'}));
  } else if (ui.activationPreview === null) {
    section.append(
      el('p', {text: 'Die Aktualisierung ergänzt den sicheren gemeinsamen Stand für Figuren und Käufe. Es wird erst nach Ihrer Bestätigung etwas eingerichtet.'}),
      button('Daten für Figuren und Käufe aktualisieren', async () => {
        try {
          if (!isUnlocked()) throw Object.assign(new Error('Bitte den Erwachsenenbereich erneut öffnen.'), {code: 'locked'});
          const {ticket, previewState} = await commerce.previewActivation();
          ui.activationPreview = {...activationPreviewModel(previewState), ticket};
          ui.notice = ''; onRefresh?.();
        } catch (error) { ui.notice = error?.message || 'Die Vorschau konnte nicht erstellt werden.'; ui.tone = 'error'; onRefresh?.(); }
      }, {class: 'primary'}),
    );
  } else {
    const preview = ui.activationPreview;
    section.append(el('section', {attrs: {class: 'restore-preview', 'data-commerce-preview': ''}}, [
      el('h3', {text: 'Datenaktualisierung prüfen'}),
      el('p', {text: `Lernbereich: ${preview.datasetName}`}),
      el('ul', {}, preview.profiles.map(({name, points, level}) => el('li', {text: `${name}: ${points} Lernpunkte, Level ${level}`}))),
      el('p', {text: preview.explanation}),
      el('p', {text: preview.deviceNotice}),
      button('Aktualisierung jetzt durchführen', async () => {
        try {
          if (!isUnlocked()) throw Object.assign(new Error('Bitte den Erwachsenenbereich erneut öffnen.'), {code: 'locked'});
          await commerce.activate(preview.ticket); ui.activationPreview = null;
          ui.notice = 'Figuren und Käufe sind bereit.'; ui.tone = 'info';
        } catch (error) {
          ui.notice = error?.code === 'stale'
            ? 'Der Datenstand hat sich geändert. Bitte prüfen Sie die aktualisierte Vorschau erneut.'
            : error?.message || 'Die Datenaktualisierung konnte noch nicht abgeschlossen werden.';
          ui.tone = error?.code === 'pending' || error?.code === 'network' ? 'info' : 'error';
          if (error?.code === 'stale') ui.activationPreview = null;
        }
        onRefresh?.();
      }, {class: 'primary'}),
      button('Abbrechen', () => { ui.activationPreview = null; onRefresh?.(); }, {class: 'secondary'}),
    ]));
  }
  root.replaceChildren(section);
}
