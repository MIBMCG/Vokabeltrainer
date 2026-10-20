import {project} from '../learning/progress.js';
import {resolveEpochs} from '../model/epochs.js';
import {el, field, button, message} from './dom.js';
import {eventLabel, previewSummaryNodes, revisionChoiceNodes} from './preview.js';
import {hasActiveGoogleSession, syncStatusLabel, syncStatusMessage} from './status.js';

const stateByRoot = new WeakMap();
const connectionViewByRoot = new WeakMap();

function stateOwner(root) {
  return root.closest?.('#app') ?? root.closest?.('.site-shell') ?? root;
}

function uiState(root, auth) {
  const owner = stateOwner(root);
  if (!stateByRoot.has(owner)) {
    stateByRoot.set(owner, {
      manualClientId: auth.clientId?.() ?? '',
      folderName: 'Vokabeltrainer',
      connected: false,
      datasets: [],
      joinPreview: null,
      adoptionPreview: null,
      selectedLate: new Set(),
      notice: '',
      tone: 'info',
      busy: false,
      searched: false,
      sessionToken: null,
      nameDrafts: new Map(),
      trashSelection: null,
    });
  }
  return stateByRoot.get(owner);
}

export function refreshSyncConnection(root, status) {
  const owner = stateOwner(root);
  const view = connectionViewByRoot.get(owner);
  if (!view || !view.root.isConnected) return;
  const summary = owner.querySelector?.('[data-settings-sync-summary]');
  const connected = hasActiveGoogleSession(view.auth, view.ui.connected);
  if (summary) summary.textContent = `Status: ${syncStatusLabel(status, connected)}`;
  let token = null;
  try { token = view.auth.getToken(); } catch { /* Disconnected. */ }
  if (connected === view.ui.connected && token === view.ui.sessionToken) return;
  view.ui.connected = connected;
  view.rerender();
}

function ensureUnlocked(isUnlocked) {
  if (typeof isUnlocked === 'function' && !isUnlocked()) {
    const error = new Error('Der Erwachsenenbereich wurde gesperrt. Bitte erneut mit PIN öffnen.');
    error.code = 'locked';
    throw error;
  }
}

export function renderSync({root, state, sync, restore, auth, commands, isUnlocked = () => true, onRefresh = null, onConnected, onBusyChange}) {
  root.classList.add('sync-management-host');
  const ui = uiState(root, auth);
  onBusyChange?.(ui.busy);
  const focused = root.contains(document.activeElement) ? document.activeElement : null;
  const focus = focused?.id ? {id: focused.id, start: focused.selectionStart, end: focused.selectionEnd} : null;
  const replace = (section) => {
    root.replaceChildren(section);
    const target = focus && document.getElementById(focus.id);
    if (target && root.contains(target) && !target.disabled) {
      target.focus();
      if (typeof focus.start === 'number') target.setSelectionRange(focus.start, focus.end);
    }
  };
  const projection = state ? project(state.ledger) : null;
  const resolved = state ? resolveEpochs(state.ledger) : null;
  const status = sync.getStatus();
  ui.connected = hasActiveGoogleSession(auth, ui.connected);
  let sessionToken = null;
  try { sessionToken = auth.getToken(); } catch { /* Disconnected. */ }
  if (sessionToken !== ui.sessionToken) {
    ui.sessionToken = sessionToken;
    ui.datasets = [];
    ui.joinPreview = null;
    ui.trashSelection = null;
    ui.nameDrafts.clear();
    ui.searched = false;
  }
  const configuration = auth.configuration?.(Boolean(state?.binding)) ?? {
    clientId: auth.clientId?.() ?? '', source: 'browser', requiresDecision: false,
  };
  const rerender = () => { if (!root.isConnected || !isUnlocked()) return; renderSync({
    root, state: commands.getState(), sync, restore, auth, commands, isUnlocked, onRefresh, onConnected, onBusyChange,
  }); };
  connectionViewByRoot.set(stateOwner(root), {root, auth, ui, rerender});

  async function run(action, {after} = {}) {
    if (ui.busy) return;
    try {
      ensureUnlocked(isUnlocked);
      ui.busy = true;
      ui.notice = '';
      const pending = action();
      rerender();
      const result = await pending;
      ensureUnlocked(isUnlocked);
      if (after) await after(result);
    } catch (error) {
      ui.notice = error?.message || 'Die Aktion konnte nicht abgeschlossen werden.';
      ui.tone = 'error';
    } finally {
      ui.busy = false;
      onBusyChange?.(false);
      if (isUnlocked()) {
        if (root.isConnected) rerender();
        else onRefresh?.();
      }
    }
  }

  const discover = () => run(() => sync.discover(), {after: (datasets) => {
    ui.datasets = datasets;
    ui.notice = datasets.length ? '' : 'In diesem Google-Konto wurde kein passender Lernbereich gefunden.';
    ui.tone = 'info';
  }});
  const mutationAllowed = () => {
    try { return root.isConnected && isUnlocked() && auth.getToken() === sessionToken; }
    catch { return false; }
  };

  const section = el('section', {attrs: {'aria-labelledby': 'sync-title', class: 'stack', 'aria-busy': String(ui.busy)}});
  section.append(
    el('h2', {text: 'Abgleich', attrs: {id: 'sync-title'}}),
    el('p', {text: syncStatusLabel(status, ui.connected), attrs: {class: 'sync-status', 'data-sync-status': '', 'data-phase': status.phase}}),
    el('p', {text: syncStatusMessage(status, ui.connected), attrs: {class: 'hint'}}),
  );
  if (status.pendingCount > 0) section.append(message(`${status.pendingCount} Änderung${status.pendingCount === 1 ? '' : 'en'} wartet noch auf Bestätigung.`));
  if (status.lateCount > 0) section.append(message(`${status.lateCount} alte Änderung${status.lateCount === 1 ? ' bleibt' : 'en bleiben'} getrennt erhalten.`));
  if (ui.notice) section.append(message(ui.notice, ui.tone));

  const information = el('p', {attrs: {class: 'hint'}}, [
    el('a', {text: 'Über LejeAdventure (neuer Tab)', attrs: {
      href: './info/', target: '_blank', rel: 'noopener noreferrer',
    }}),
    ' · ',
    el('a', {text: 'Datenschutz (neuer Tab)', attrs: {
      href: './info/datenschutz.html', target: '_blank', rel: 'noopener noreferrer',
    }}),
  ]);
  const markConnected = () => {
    ui.connected = true;
    ui.manualClientId = auth.clientId?.() ?? ui.manualClientId;
    onConnected?.();
  };
  if (!ui.connected) {
    const connection = el('form', {attrs: {class: 'subpanel stack compact'}});
    connection.append(
      el('h3', {text: 'Google Drive verbinden'}),
      el('p', {text: configuration.source === 'missing'
        ? 'Der Google-Zugang ist noch nicht vorbereitet. Lokal üben und speichern ist weiterhin möglich.'
        : configuration.source === 'server'
          ? 'Die Google-Verbindung ist noch nicht aktiv. Lokal üben und speichern ist weiterhin möglich.'
        : state?.binding
          ? 'Google-Verbindung erneuern. Ihr Lernbereich bleibt verbunden; ausstehende Änderungen werden danach automatisch abgeglichen.'
        : 'Verbinden Sie das gemeinsame Google-Konto der Familie. Danach wählen Sie bewusst einen neuen oder vorhandenen Lernbereich.'}),
      information,
      el('button', {text: 'Mit Google verbinden', attrs: {
        type: 'submit', class: 'primary', disabled: ui.busy || configuration.source === 'missing',
      }}),
    );
    connection.addEventListener('submit', (event) => {
      event.preventDefault();
      if (state === null) sessionStorage.setItem('vokabeltrainer-existing-area', '1');
      void run(() => auth.connect(), {after: markConnected});
    });
    section.append(connection);
  }

  if (configuration.source !== 'server') {
    const advanced = el('details', {attrs: {class: 'subpanel stack compact'}}, [
      el('summary', {text: 'Erweiterte Einstellungen'}),
      el('p', {text: 'Diese Angaben sind nur für Projektverantwortliche. Familien benötigen normalerweise keine eigene Client-ID.'}),
    ]);
    if (configuration.requiresDecision) {
      advanced.append(message(state?.binding
        ? 'In diesem Browser ist eine andere Client-ID gespeichert. Der bestehende Lernbereich behält seine bisherige Verbindung; ein schneller Wechsel wird deshalb nicht angeboten.'
        : 'In diesem Browser ist eine andere Client-ID gespeichert. Sie bleibt aktiv, bis Sie bewusst den vorbereiteten Zugang wählen.'));
      if (!state?.binding) {
        advanced.append(button('Vorbereiteten Zugang verwenden und verbinden', () => run(
          () => auth.connect(auth.preparedClientId()), {after: markConnected},
        ), {class: 'secondary', disabled: ui.busy}));
      }
    }
    if (state?.binding) {
      advanced.append(el('p', {text: 'Für einen bereits verbundenen Lernbereich kann die Client-ID hier nicht gewechselt werden.'}));
    } else {
      const manual = el('form', {attrs: {class: 'stack compact'}});
      const manualClientId = el('input', {attrs: {
        id: 'google-client-id', name: 'clientId', value: ui.manualClientId, autocomplete: 'off',
      }});
      manualClientId.addEventListener('input', () => { ui.manualClientId = manualClientId.value; });
      manual.append(
        field('Öffentliche Google-Web-Client-ID', manualClientId),
        el('button', {text: 'Eigene Client-ID verwenden und verbinden', attrs: {
          type: 'submit', class: 'secondary', disabled: ui.busy,
        }}),
      );
      manual.addEventListener('submit', (event) => {
        event.preventDefault();
        void run(() => auth.connect(ui.manualClientId), {after: markConnected});
      });
      advanced.append(manual);
    }
    section.append(advanced);
  }

  if (ui.connected) {
    const controls = el('div', {attrs: {class: 'subpanel stack compact'}});
    const folderName = el('input', {attrs: {id: 'drive-folder-name', value: ui.folderName, maxlength: 80}});
    folderName.addEventListener('input', () => { ui.folderName = folderName.value; });
    controls.append(
      el('h3', {text: state?.binding ? 'Verbundener Lernbereich' : 'Lernbereich auswählen'}),
      ...(state?.binding ? [el('p', {text: sync.getDatasetName?.() ?? state.ledger.descriptor.name})] : []),
      el('p', {text: 'Google-Verbindung ist aktiv.'}),
      information,
      button('Jetzt abgleichen', () => run(() => sync.retry()), {
        class: 'secondary', disabled: ui.busy || !state?.binding,
      }),
      button('Google-Verbindung trennen', () => run(() => auth.disconnect(), {after: () => {
        ui.connected = false;
        ui.notice = 'Die Google-Verbindung dieser Sitzung wurde getrennt. Lokales Üben bleibt möglich.';
        ui.tone = 'info';
      }}), {class: 'secondary', disabled: ui.busy}),
    );
    if (state && !state.binding) {
      controls.append(
        field('Name des Lernbereichs', folderName),
        button('Neuen Lernbereich anlegen', () => run(() => sync.createDataset(ui.folderName), {after: () => {
          ui.notice = 'Der Lernbereich wurde angelegt.';
          ui.tone = 'info';
        }}), {class: 'primary', disabled: ui.busy}),
        button('Vorhandenen Lernbereich verwenden', discover, {class: 'secondary', disabled: ui.busy}),
      );
    }
    controls.append(button('Lernbereiche erneut suchen', discover, {class: 'secondary', disabled: ui.busy}));
    section.append(controls);
  }

  if (ui.datasets.length > 0 && ui.connected) {
    const datasets = el('section', {attrs: {class: 'subpanel learning-area-list', 'aria-labelledby': 'datasets-title'}}, [
      el('h3', {text: 'Gefundene Lernbereiche', attrs: {id: 'datasets-title'}}),
    ]);
    for (const dataset of ui.datasets) {
      const active = state?.binding?.folderId === dataset.folderId;
      const name = dataset.displayName ?? dataset.descriptor.name;
      const card = el('article', {attrs: {class: 'management-card', 'data-learning-area': dataset.folderId}}, [
        el('h4', {text: name}),
        active ? el('p', {text: 'Auf diesem Gerät aktiv', attrs: {class: 'status-chip'}}) : null,
        ...(!state?.binding ? [button('Diesen Lernbereich prüfen', () => run(
          () => sync.joinDataset(dataset, 'preview'),
          {after: (preview) => { ui.joinPreview = {dataset, preview}; }},
        ), {class: 'secondary', disabled: ui.busy})] : []),
      ]);
      if (state) {
        const rename = el('form', {attrs: {class: 'stack compact'}});
        const input = el('input', {attrs: {id: `area-name-${dataset.folderId}`, maxlength: 80, required: true,
          value: ui.nameDrafts.get(dataset.folderId) ?? name, disabled: ui.busy}});
        input.addEventListener('input', () => ui.nameDrafts.set(dataset.folderId, input.value));
        rename.append(field('Neuer Name', input), el('button', {text: 'Um\u00adbe\u00adnen\u00adnen', attrs: {
          type: 'submit', class: 'secondary', disabled: ui.busy, 'aria-label': 'Umbenennen',
        }}));
        rename.addEventListener('submit', (event) => {
          event.preventDefault();
          void run(() => sync.renameDataset(dataset, input.value.trim(), {isAllowed: mutationAllowed}), {after: (updated) => {
            ui.datasets = ui.datasets.map((item) => item.folderId === updated.folderId ? updated : item);
            ui.nameDrafts.delete(dataset.folderId);
            ui.notice = 'Der Name des gemeinsamen Lernbereichs wurde gespeichert.';
            ui.tone = 'info';
          }});
        });
        card.append(rename, button('In Papierkorb verschieben', () => {
          ensureUnlocked(isUnlocked);
          ui.trashSelection = dataset;
          rerender();
        }, {class: 'secondary', disabled: ui.busy || active}));
      }
      datasets.append(card);
    }
    section.append(datasets);
  }

  if (ui.trashSelection && ui.connected) {
    const selected = ui.trashSelection;
    section.append(el('section', {attrs: {class: 'subpanel', 'aria-labelledby': 'area-trash-title'}}, [
      el('h3', {text: 'Gemeinsamen Lernbereich entfernen?', attrs: {id: 'area-trash-title'}}),
      el('p', {text: `„${selected.displayName ?? selected.descriptor.name}“ wird für alle verbundenen Geräte in den Google-Drive-Papierkorb verschoben. Das betrifft den gesamten gemeinsamen Bereich mit Profilen, Lernständen und Käufen. Er wird nicht endgültig gelöscht.`}),
      button('Diesen gemeinsamen Bereich in Papierkorb verschieben', () => run(
        () => sync.trashDataset(selected, {isAllowed: mutationAllowed}), {after: () => {
          ui.datasets = ui.datasets.filter((item) => item.folderId !== selected.folderId);
          ui.trashSelection = null;
          ui.notice = 'Der gemeinsame Lernbereich liegt im Google-Drive-Papierkorb.';
          ui.tone = 'info';
        }},
      ), {class: 'primary', disabled: ui.busy}),
      button('Abbrechen', () => { ui.trashSelection = null; rerender(); }, {class: 'secondary', disabled: ui.busy}),
    ]));
  }

  if (ui.joinPreview) {
    const {dataset, preview} = ui.joinPreview;
    const join = el('section', {attrs: {class: 'subpanel', 'aria-labelledby': 'join-title'}}, [
      el('h3', {text: 'Lernbereich prüfen', attrs: {id: 'join-title'}}),
      el('p', {text: preview.requiresSafetyCopy
        ? `Der lokale Stand wird als geprüfte Sicherheitskopie erhalten. Danach wird „${preview.name}“ verwendet.`
        : `„${preview.name}“ kann verbunden werden.`}),
      el('p', {text: `${preview.localEventCount} lokale und ${preview.remoteBootstrapEventCount} geladene Ereignisse.`}),
      button('Lernbereich verwenden', () => run(() => sync.joinDataset({
        ...dataset, previewId: preview.previewId, safetyCopyId: preview.safetyCopyId,
      }, 'confirm'), {after: async () => {
        ui.joinPreview = null;
        sessionStorage.removeItem('vokabeltrainer-existing-area');
        await sync.retry();
        onRefresh?.();
      }}), {class: 'primary', disabled: ui.busy}),
      button('Abbrechen', () => { ui.joinPreview = null; rerender(); }, {class: 'secondary', disabled: ui.busy}),
    ]);
    section.append(join);
  }

  if (ui.busy) section.append(message(ui.joinPreview ? 'Der Lernbereich wird geprüft und geladen …' : 'Die Google-Drive-Anfrage läuft …'));
  if (ui.connected && !ui.searched && !ui.busy && typeof sync.discover === 'function') {
    ui.searched = true;
    queueMicrotask(() => { if (root.isConnected && isUnlocked()) void discover(); });
  }
  if (state === null) {
    replace(section);
    return;
  }

  if (state.quarantinedFiles.length > 0) {
    const quarantine = el('section', {attrs: {class: 'subpanel'}}, [
      el('h3', {text: 'Drive-Dateien benötigen Aufmerksamkeit'}),
      el('p', {text: 'Diese Dateien wurden nicht übernommen. Die lokalen Lerndaten bleiben erhalten.'}),
    ]);
    for (const item of state.quarantinedFiles) quarantine.append(el('p', {text: item.reason || 'Eine Drive-Datei ist unvollständig oder beschädigt.'}));
    section.append(quarantine);
  }

  if (projection.conflicts.length > 0) {
    const conflicts = el('section', {attrs: {class: 'subpanel'}}, [el('h3', {text: 'Inhaltskonflikte'})]);
    for (const conflict of projection.conflicts) {
      const conflictRevisions = conflict.heads.map((headId) => state.ledger.events.find(({id}) => id === headId));
      const card = el('article', {attrs: {class: 'management-card'}}, [
        el('h4', {text: conflict.entityType === 'word' ? 'Vokabelkonflikt' : 'Bearbeitungskonflikt'}),
        el('p', {text: 'Beide Fassungen bleiben erhalten, bis Sie eine gemeinsame Nachfolgerfassung wählen.'}),
      ]);
      for (const headId of conflict.heads) {
        const revision = state.ledger.events.find(({id}) => id === headId);
        card.append(el('div', {attrs: {class: 'revision-choice'}}, [
          ...revisionChoiceNodes(revision, state, [], conflictRevisions),
          button('Diese Fassung übernehmen', () => run(() => commands.revise({
            entityType: conflict.entityType,
            entityId: conflict.entityId,
            expectedHeads: conflict.heads,
            value: structuredClone(revision.payload.value),
          }), {after: () => { ui.notice = 'Eine gemeinsame Fassung wurde angelegt.'; ui.tone = 'info'; }}), {class: 'primary'}),
        ]));
      }
      conflicts.append(card);
    }
    section.append(conflicts);
  }

  if (resolved.epochConflict) {
    const epochs = el('section', {attrs: {class: 'subpanel'}}, [
      el('h3', {text: 'Konflikt zwischen Wiederherstellungen'}),
      el('p', {text: 'Wählen Sie bewusst den Datenstand, der als Grundlage der gemeinsamen neuen Version dienen soll.'}),
    ]);
    for (const [index, epochId] of resolved.heads.entries()) {
      const epoch = state.ledger.epochs.find(({id}) => id === epochId);
      const date = epoch?.occurredAt ? new Date(epoch.occurredAt).toLocaleString('de-DE') : 'Datum unbekannt';
      epochs.append(button(`Datenstand ${index + 1} vom ${date} prüfen`, () => run(
        () => restore.resolveEpochConflict({selectedEpochId: epochId, expectedHeads: resolved.heads}),
        {after: (preview) => { ui.adoptionPreview = {kind: 'epoch', preview}; }},
      ), {class: 'secondary'}));
    }
    section.append(epochs);
  }

  if (projection.lateEvents.length > 0) {
    const late = el('section', {attrs: {class: 'subpanel'}}, [
      el('h3', {text: 'Alte Änderungen getrennt erhalten'}),
      el('p', {text: 'Nicht gewählte Änderungen bleiben sichtbar und werden weiter in Sicherungen aufgenommen.'}),
    ]);
    const inspectSelection = button('Auswahl prüfen', () => run(
      () => restore.previewAdoption([...ui.selectedLate]),
      {after: (preview) => { ui.adoptionPreview = {kind: 'adoption', preview}; }},
    ), {class: 'secondary', disabled: ui.selectedLate.size === 0});
    for (const event of projection.lateEvents) {
      const checkbox = el('input', {attrs: {type: 'checkbox', value: event.id, checked: ui.selectedLate.has(event.id)}});
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) ui.selectedLate.add(event.id);
        else ui.selectedLate.delete(event.id);
        inspectSelection.disabled = ui.selectedLate.size === 0;
      });
      late.append(el('label', {text: eventLabel(event, state)}, [checkbox]));
    }
    late.append(inspectSelection);
    section.append(late);
  }

  if (ui.adoptionPreview) {
    const {kind, preview} = ui.adoptionPreview;
    section.append(el('section', {attrs: {class: 'restore-preview', 'aria-labelledby': 'sync-preview-title'}}, [
      el('h3', {text: kind === 'epoch' ? 'Datenstand bestätigen' : 'Übernahme bestätigen', attrs: {id: 'sync-preview-title'}}),
      ...previewSummaryNodes({
        summary: preview.summary,
        state,
        selectedEventIds: preview.eventIds ?? [],
        supportEventIds: preview.supportEventIds ?? [],
      }),
      button(kind === 'epoch' ? 'Datenstand gemeinsam übernehmen' : 'Ausgewählte Änderungen übernehmen', () => run(
        () => kind === 'epoch'
          ? restore.confirm(preview.previewId)
          : restore.adopt({eventIds: preview.eventIds, previewId: preview.previewId}),
        {after: () => { ui.adoptionPreview = null; ui.selectedLate.clear(); }},
      ), {class: 'primary'}),
      button('Abbrechen', () => { ui.adoptionPreview = null; rerender(); }, {class: 'secondary'}),
    ]));
  }

  replace(section);
}
