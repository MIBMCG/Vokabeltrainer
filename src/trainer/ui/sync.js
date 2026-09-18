import {project} from '../learning/progress.js';
import {resolveEpochs} from '../model/epochs.js';
import {el, field, button, message} from './dom.js';
import {eventLabel, previewSummaryNodes, revisionChoiceNodes} from './preview.js';
import {syncStatusLabel} from './status.js';

const stateByRoot = new WeakMap();

function uiState(root, auth) {
  const owner = root.closest?.('#app') ?? root;
  if (!stateByRoot.has(owner)) {
    stateByRoot.set(owner, {
      clientId: auth.clientId?.() ?? '',
      folderName: 'Vokabeltrainer',
      connected: false,
      datasets: [],
      joinPreview: null,
      adoptionPreview: null,
      selectedLate: new Set(),
      notice: '',
      tone: 'info',
      busy: false,
    });
  }
  return stateByRoot.get(owner);
}

function ensureUnlocked(isUnlocked, auth) {
  if (typeof isUnlocked === 'function' && !isUnlocked()) {
    auth.invalidate();
    const error = new Error('Der Erwachsenenbereich wurde gesperrt. Bitte erneut mit PIN öffnen.');
    error.code = 'locked';
    throw error;
  }
}

export function renderSync({root, state, sync, restore, auth, commands, isUnlocked = () => true, onRefresh = null}) {
  const ui = uiState(root, auth);
  const projection = project(state.ledger);
  const resolved = resolveEpochs(state.ledger);
  const status = sync.getStatus();
  const rerender = () => renderSync({
    root, state: commands.getState(), sync, restore, auth, commands, isUnlocked, onRefresh,
  });

  async function run(action, {after} = {}) {
    if (ui.busy) return;
    try {
      ensureUnlocked(isUnlocked, auth);
      ui.busy = true;
      ui.notice = '';
      rerender();
      const result = await action();
      ensureUnlocked(isUnlocked, auth);
      if (after) await after(result);
    } catch (error) {
      if (error?.code === 'auth') auth.invalidate();
      ui.notice = error?.message || 'Die Aktion konnte nicht abgeschlossen werden.';
      ui.tone = 'error';
    } finally {
      ui.busy = false;
      if (isUnlocked()) {
        if (root.isConnected) rerender();
        else onRefresh?.();
      }
    }
  }

  const section = el('section', {attrs: {'aria-labelledby': 'sync-title', class: 'stack'}});
  section.append(
    el('h2', {text: 'Abgleich', attrs: {id: 'sync-title'}}),
    el('p', {text: syncStatusLabel(status), attrs: {class: 'sync-status', 'data-sync-status': '', 'data-phase': status.phase}}),
    el('p', {text: status.message || '', attrs: {class: 'hint'}}),
  );
  if (status.pendingCount > 0) section.append(message(`${status.pendingCount} Änderung${status.pendingCount === 1 ? '' : 'en'} wartet noch auf Bestätigung.`));
  if (status.lateCount > 0) section.append(message(`${status.lateCount} alte Änderung${status.lateCount === 1 ? ' bleibt' : 'en bleiben'} getrennt erhalten.`));
  if (ui.notice) section.append(message(ui.notice, ui.tone));

  const connection = el('form', {attrs: {class: 'subpanel stack compact'}});
  const clientId = el('input', {attrs: {id: 'google-client-id', name: 'clientId', value: ui.clientId, autocomplete: 'off'}});
  clientId.addEventListener('input', () => { ui.clientId = clientId.value; });
  connection.append(
    el('h3', {text: 'Google Drive verbinden'}),
    el('p', {text: 'Die öffentliche Web-Client-ID wird nur in diesem Browser gespeichert. Zugriffstokens bleiben im Arbeitsspeicher.'}),
    field('Öffentliche Google-Web-Client-ID', clientId),
    el('button', {text: 'Mit Google verbinden', attrs: {type: 'submit', class: 'primary', disabled: ui.busy}}),
  );
  connection.addEventListener('submit', (event) => {
    event.preventDefault();
    void run(() => auth.connect(ui.clientId), {after: async () => {
      ui.connected = true;
      ui.notice = 'Google ist für diese Sitzung verbunden.';
      ui.tone = 'info';
    }});
  });
  section.append(connection);

  if (ui.connected) {
    const controls = el('div', {attrs: {class: 'subpanel stack compact'}});
    const folderName = el('input', {attrs: {id: 'drive-folder-name', value: ui.folderName, maxlength: 80}});
    folderName.addEventListener('input', () => { ui.folderName = folderName.value; });
    controls.append(
      el('h3', {text: state.binding ? 'Verbundener Datensatz' : 'Datensatz auswählen'}),
      button('Jetzt abgleichen', () => run(() => sync.retry(), {after: () => {
        ui.notice = 'Der Abgleich wurde ausgeführt.';
        ui.tone = 'info';
      }}), {class: 'secondary', disabled: ui.busy || !state.binding}),
      button('Google-Verbindung trennen', () => {
        auth.disconnect();
        ui.connected = false;
        ui.notice = 'Die Google-Verbindung dieser Sitzung wurde getrennt. Lokales Üben bleibt möglich.';
        ui.tone = 'info';
        rerender();
      }, {class: 'secondary', disabled: ui.busy}),
    );
    if (!state.binding) {
      controls.append(
        field('Name des Drive-Ordners', folderName),
        button('Neuen Drive-Datensatz anlegen', () => run(() => sync.createDataset(ui.folderName), {after: () => {
          ui.notice = 'Der Drive-Datensatz wurde angelegt.';
          ui.tone = 'info';
        }}), {class: 'primary', disabled: ui.busy}),
        button('Vorhandene Datensätze suchen', () => run(() => sync.discover(), {after: (datasets) => {
          ui.datasets = datasets;
          ui.notice = datasets.length ? '' : 'In diesem Google-Konto wurde kein passender Datensatz gefunden.';
          ui.tone = 'info';
        }}), {class: 'secondary', disabled: ui.busy}),
      );
    }
    section.append(controls);
  }

  if (ui.datasets.length > 0 && !state.binding) {
    const datasets = el('section', {attrs: {class: 'subpanel', 'aria-labelledby': 'datasets-title'}}, [
      el('h3', {text: 'Gefundene Datensätze', attrs: {id: 'datasets-title'}}),
    ]);
    for (const dataset of ui.datasets) {
      datasets.append(el('article', {attrs: {class: 'management-card'}}, [
        el('h4', {text: dataset.descriptor.name}),
        button('Diesen Datensatz prüfen', () => run(
          () => sync.joinDataset(dataset, 'preview'),
          {after: (preview) => { ui.joinPreview = {dataset, preview}; }},
        ), {class: 'secondary', disabled: ui.busy}),
      ]));
    }
    section.append(datasets);
  }

  if (ui.joinPreview) {
    const {dataset, preview} = ui.joinPreview;
    const join = el('section', {attrs: {class: 'subpanel', 'aria-labelledby': 'join-title'}}, [
      el('h3', {text: 'Datensatzwechsel prüfen', attrs: {id: 'join-title'}}),
      el('p', {text: preview.requiresSafetyCopy
        ? `Der lokale Stand wird als geprüfte Sicherheitskopie erhalten. Danach wird „${preview.name}“ verwendet.`
        : `„${preview.name}“ kann verbunden werden.`}),
      el('p', {text: `${preview.localEventCount} lokale und ${preview.remoteBootstrapEventCount} geladene Ereignisse.`}),
      button('Datensatzwechsel bestätigen', () => run(() => sync.joinDataset({
        ...dataset, previewId: preview.previewId, safetyCopyId: preview.safetyCopyId,
      }, 'confirm'), {after: () => { ui.joinPreview = null; }}), {class: 'primary', disabled: ui.busy}),
      button('Abbrechen', () => { ui.joinPreview = null; rerender(); }, {class: 'secondary'}),
    ]);
    section.append(join);
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

  root.replaceChildren(section);
}
