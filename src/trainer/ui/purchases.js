import {FIGURES} from '../avatar/catalog.js';
import {EVOLUTION_FORMS, evolutionOffer} from '../avatar/evolution.js';
import {evolutionArt, evolutionPicture as artPicture} from '../avatar/evolution-art.js';
import {figurePicture} from '../avatar/art.js';
import {project} from '../learning/progress.js';
import {readHistory, replayHistory} from '../purchases/history.js';
import {rebuildAccounts} from '../purchases/projection.js';
import {el, button, message} from './dom.js';

export {evolutionArt};

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

export function purchaseProfileModel({view, profileId, figureId = null, online, authenticated = true}) {
  const account = view.accounts?.[profileId] ?? null;
  if (!account) return null;
  const pending = pendingPurchase(view, profileId);
  const selection = view.selection.find((entry) => entry.profileId === profileId) ?? null;
  const selectedFigureId = figureId ?? selection?.figureId
    ?? (account.entitledFigureIds.includes('dragon') ? 'dragon' : account.entitledFigureIds[0]);
  const forms = EVOLUTION_FORMS.filter(({figureId}) => figureId === selectedFigureId).map((form) => {
    const owned = account.entitledEvolutionIds.includes(form.id);
    const previousOwned = form.stage === 1
      || account.entitledEvolutionIds.includes(`evolution:${form.figureId}:${form.stage - 1}`);
    const artAvailable = form.stage === 1 || evolutionArt(form.figureId, form.stage) !== null;
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
    return {...form, owned, previousOwned, artAvailable, artUrl: evolutionArt(form.figureId, form.stage), action};
  });
  const selected = selection
    ? EVOLUTION_FORMS.find(({figureId, stage}) => figureId === selection.figureId && stage === selection.stage) ?? null
    : null;
  const highestOwnedStage = Math.max(0, ...EVOLUTION_FORMS
    .filter((form) => form.figureId === selectedFigureId && account.entitledEvolutionIds.includes(form.id))
    .map(({stage}) => stage));
  const offer = evolutionOffer({figureId: selectedFigureId, highestOwnedStage, availablePoints: account.availablePoints});
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
    viewedFigureId: selectedFigureId,
    offer,
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
    authRequired: false, progress: '', dialogOpen: false, viewedFigureId: null,
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

function formPicture(form, {sizes = '(max-width: 600px) 42vw, 180px', appearance = null} = {}) {
  if (evolutionArt(form.figureId, form.stage) === null && form.stage === 1) {
    return figurePicture({figureId: form.figureId, skin: appearance?.skin,
      clothing: appearance?.clothing, equipment: {}}, {sizes});
  }
  if (evolutionArt(form.figureId, form.stage) === null) return el('div', {attrs: {class: 'evolution-placeholder', role: 'img', 'aria-label': 'Bild folgt'}}, [
    el('span', {text: 'Bild folgt'}),
  ]);
  return artPicture(form.figureId, form.stage, {
    alt: `${FIGURES.find(({id}) => id === form.figureId)?.name ?? 'Figur'} – Stufe ${form.stage}`,
    className: 'evolution-image', sizes,
  });
}

function purchaseActionLabel(entry) {
  if (entry.action === 'resume') return 'Kauf fortsetzen';
  if (entry.action === 'reauth') return 'Google erneut verbinden';
  if (entry.action === 'offline') return 'Offline – Kauf nicht möglich';
  if (entry.action === 'saving') return `Noch ${entry.price - entry.availablePoints} Punkte sammeln`;
  if (entry.action === 'locked') return 'Vorherige Stufe fehlt';
  if (entry.action === 'unavailable') return 'Bild noch nicht verfügbar';
  return entry.stage ? `Für ${entry.price} Punkte entwickeln` : `Für ${entry.price} Punkte freischalten`;
}

function purchaseDialog({preview, entry, onConfirm, onSelect, trigger, onComplete}) {
  const dialog = el('dialog', {attrs: {class: 'purchase-dialog', 'aria-labelledby': 'purchase-dialog-title'}}, [
    el('h2', {text: 'Kauf prüfen', attrs: {id: 'purchase-dialog-title'}}),
    entry.figureId && entry.stage ? formPicture(entry, {sizes: '(max-width: 600px) 70vw, 256px'})
      : entry.unlock ? figurePicture({figureId: entry.id, equipment: {}}, {sizes: '256px'}) : null,
    el('p', {text: entry.name}),
    el('dl', {attrs: {class: 'summary-list'}}, [
      el('dt', {text: 'Preis'}), el('dd', {text: `${preview.price} Punkte`}),
      el('dt', {text: 'Danach verfügbar'}), el('dd', {text: `${preview.availablePoints - preview.price} Punkte`}),
    ]),
    el('p', {text: 'Ausgeben verändert dein Level nicht.'}),
  ]);
  let confirming = false;
  let selecting = false;
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
    if (confirming || selecting) event.preventDefault();
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
      const confirmed = await onConfirm();
      if (!confirmed) { dialog.close(); finish(); return; }
      confirming = false;
      dialog.replaceChildren(
        el('h2', {text: 'Freigeschaltet', attrs: {id: 'purchase-dialog-title'}}),
        el('p', {text: `${entry.name} gehört jetzt dir.`}),
      );
      const select = button('Jetzt auswählen', async () => {
        if (selecting) return;
        selecting = true;
        select.disabled = true;
        try {
          if (await onSelect()) { dialog.close(); finish(); }
          else {
            dialog.append(message('Die Auswahl konnte noch nicht gespeichert werden. Bitte versuche es erneut oder wähle die Form später aus.', 'error'));
            select.disabled = false;
          }
        } finally { selecting = false; }
      }, {class: 'primary'});
      dialog.append(el('div', {attrs: {class: 'dialog-actions'}}, [
        select, button('Später auswählen', () => { dialog.close(); finish(); }, {class: 'secondary'}),
      ]));
      select.focus();
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
  const previewImage = dialog.querySelector('.evolution-art img');
  if (previewImage) {
    confirm.disabled = !(previewImage.complete && previewImage.naturalWidth > 0);
    previewImage.addEventListener('load', () => {
      if (!confirming && previewImage.naturalWidth > 0) {
        confirm.disabled = false;
        if (document.activeElement === cancel) confirm.focus();
      }
    });
    dialog.addEventListener('evolution-art-unavailable', () => {
      confirm.disabled = true;
      dialog.append(message('Bild gerade nicht verfügbar. Dieser Kauf kann noch nicht bestätigt werden.', 'error'));
    });
  }
  dialog.append(el('div', {attrs: {class: 'dialog-actions'}}, [confirm, cancel]));
  document.body.append(dialog); dialog.showModal();
  (confirm.disabled ? cancel : confirm).focus();
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
  if (ui.profileId !== profileId) {
    ui.profileId = profileId;
    ui.viewedFigureId = null;
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
  const model = purchaseProfileModel({view: ui.view, profileId, figureId: ui.viewedFigureId, online, authenticated});
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

  const run = async (action, success = '', {rethrowCodes = [], progress = 'Änderung wird verarbeitet …', refreshShell = false} = {}) => {
    if (ui.busy) return false;
    ui.busy = true;
    ui.progress = progress;
    rerender();
    try {
      await action();
      ui.view = await commerce.getView();
      ui.notice = success; ui.tone = 'info';
      if (refreshShell) onRefresh?.();
      return true;
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
      return false;
    } finally { ui.busy = false; ui.progress = ''; rerender({focus: !ui.dialogOpen}); }
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
      purchaseDialog({preview, entry, trigger, onComplete: () => {
        ui.dialogOpen = false;
        rerender({focus: true});
      }, onSelect: () => run(
        () => commerce.select({profileId, figureId: entry.figureId ?? entry.id, stage: entry.stage ?? 1}),
        `${entry.name} wurde ausgewählt.`, {refreshShell: true},
      ), onConfirm: () => run(
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
      const selectedPicture = evolutionArt(model.selected.figureId, model.selected.stage)
        ? formPicture(model.selected, {sizes: '(max-width: 600px) 70vw, 320px'})
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
      for (const form of EVOLUTION_FORMS.filter((candidate) =>
        candidate.figureId === figureId && ui.view.accounts[profileId].entitledEvolutionIds.includes(candidate.id))) {
        const selected = model.selected?.figureId === figureId && model.selected.stage === form.stage;
        const picture = evolutionArt(figureId, form.stage)
          ? formPicture(form)
          : form.stage === 1 ? figurePicture({figureId, skin: appearance?.skin, clothing: appearance?.clothing, equipment: {}},
            {sizes: '(max-width: 600px) 42vw, 180px'}) : formPicture(form);
        grid.append(el('article', {attrs: {class: 'commerce-card owned-form-card', 'data-owned-stage': String(form.stage)}}, [
          picture,
          el('h3', {text: form.stage === 1 ? figure.name : `${figure.name} – Stufe ${form.stage}`}),
          el('p', {text: selected ? 'Ausgewählt' : 'Gehört dir', attrs: {class: 'status-chip'}}),
          button(selected ? 'Ausgewählt' : form.stage === 1 ? 'Grundform auswählen' : 'Diese Form auswählen', () => run(
            () => commerce.select({profileId, figureId, stage: form.stage}), `${figure.name} wurde ausgewählt.`,
            {refreshShell: true},
          ), {class: 'secondary', disabled: selected || ui.busy}),
          form.stage === 1 ? button('Entwicklung ansehen', () => {
            ui.viewedFigureId = figureId; ui.tab = 'evolution'; rerender({focus: true});
          }, {class: 'secondary'}) : null,
        ]));
      }
    }
  } else if (ui.tab === 'evolution') {
    const offer = model.offer;
    const nextForm = model.forms.find(({stage}) => stage === offer.nextStage);
    const summary = el('section', {attrs: {class: 'evolution-summary', 'aria-label': 'Fortschritt zur nächsten Form'}}, [
      el('h2', {text: `${FIGURES.find(({id}) => id === model.viewedFigureId)?.name ?? 'Figur'} entwickeln`}),
      offer.status === 'complete'
        ? el('p', {text: 'Höchste Stufe erreicht'})
        : offer.status === 'base-locked'
          ? el('p', {text: 'Zuerst die Grundfigur freischalten.'})
          : el('div', {attrs: {class: 'evolution-next'}}, [
            nextForm?.artAvailable ? formPicture(nextForm, {sizes: '(max-width: 600px) 35vw, 160px'}) : null,
            el('div', {}, [
              el('p', {text: `Nächste Form: Stufe ${offer.nextStage} · Preis: ${offer.price} Punkte`}),
              el('p', {text: `Verfügbar: ${model.availablePoints} Punkte · Noch ${offer.missingPoints} Punkte fehlen`}),
              el('div', {attrs: {class: 'evolution-progress', role: 'progressbar',
                'aria-label': 'Fortschritt zur nächsten Form', 'aria-valuemin': '0',
                'aria-valuemax': '100', 'aria-valuenow': String(Math.round(offer.progress * 100))}}, [
                el('span', {attrs: {class: 'evolution-progress-fill', style: `width:${offer.progress * 100}%`}}),
              ]),
            ]),
          ]),
    ]);
    section.append(summary);
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
      const card = el('article', {attrs: {class: 'commerce-card evolution-card', 'data-stage': String(form.stage)}}, [
        formPicture(form, {appearance}), el('h3', {text: entry.name}),
        el('p', {text: form.owned ? 'Gehört dir' : 'Noch gesperrt', attrs: {class: 'status-chip'}}),
        el('p', {text: form.stage === 1 ? 'Grundform' : `${form.price} Punkte`}), action,
      ]);
      card.addEventListener('evolution-art-unavailable', () => {
        if (form.action === 'buy') {
          action.disabled = true;
          action.textContent = 'Bild gerade nicht verfügbar';
        }
      });
      grid.append(card);
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
