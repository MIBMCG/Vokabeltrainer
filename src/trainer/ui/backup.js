import {exportBackup, parseBackup} from '../backup/format.js';
import {resolveEpochs} from '../model/epochs.js';
import {el, field, button, message} from './dom.js';
import {previewSummaryNodes} from './preview.js';

const stateByRoot = new WeakMap();

function uiState(root) {
  const owner = root.closest?.('#app') ?? root;
  if (!stateByRoot.has(owner)) stateByRoot.set(owner, {
    notice: '', tone: 'info', busy: false, selectedEpochId: '', pendingBackup: null,
  });
  return stateByRoot.get(owner);
}

function downloadBackup(onDownload, backup, filename) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json;charset=utf-8'});
  return onDownload(blob, filename);
}

function keepFocusInside(dialog, event) {
  if (event.key !== 'Tab') return;
  const controls = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]')];
  if (controls.length === 0) return;
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function showRestorePreview({summary, state, events, onConfirm, onCancel, trigger, title = 'Wiederherstellung prüfen', staleNotice = ''}) {
  const dialog = el('dialog', {attrs: {class: 'restore-dialog', 'aria-labelledby': 'restore-dialog-title'}});
  const close = () => {
    dialog.close();
    dialog.remove();
    setTimeout(() => {
      const focusTarget = trigger?.isConnected ? trigger : document.getElementById(trigger?.id);
      focusTarget?.focus();
    }, 0);
  };
  const cancel = button('Abbrechen', () => { close(); onCancel?.(); }, {class: 'secondary'});
  const confirm = button('Wiederherstellung verbindlich bestätigen', async () => {
    confirm.disabled = true;
    cancel.disabled = true;
    try {
      const outcome = await onConfirm();
      close();
      if (typeof outcome?.replace === 'function') queueMicrotask(outcome.replace);
    } catch (error) {
      confirm.disabled = false;
      cancel.disabled = false;
      const old = dialog.querySelector('[data-dialog-error]');
      const next = message(error?.message || 'Die Wiederherstellung konnte nicht bestätigt werden.', 'error');
      next.dataset.dialogError = '';
      if (old) old.replaceWith(next); else dialog.querySelector('.dialog-actions').before(next);
    }
  }, {class: 'primary'});
  const warnings = [];
  if (summary.foreignDataset) warnings.push('Diese Sicherung stammt aus einem anderen Datensatz und wird bewusst neu verankert.');
  if (summary.timeZoneChange) warnings.push(`Lernzeitzone der Sicherung: ${summary.timeZoneChange.from}; Ziel: ${summary.timeZoneChange.to}.`);
  dialog.append(
    el('h2', {text: title, attrs: {id: 'restore-dialog-title'}}),
    staleNotice ? message(staleNotice, 'error') : null,
    el('p', {text: summary.affectsConnectedDevices
      ? 'Nach der Bestätigung wird diese Sicherung zum gemeinsamen Datenstand der verbundenen Geräte.'
      : 'Diese Sicherung ersetzt nur den aktiven Datenstand auf diesem Gerät und wird nicht automatisch zum gemeinsamen Datenstand in Drive.'}),
    ...previewSummaryNodes({summary, state, events}),
    ...warnings.map((text) => message(text, 'error')),
    el('div', {attrs: {class: 'dialog-actions'}}, [confirm, cancel]),
  );
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel.click();
      return;
    }
    keepFocusInside(dialog, event);
  });
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); cancel.click(); });
  document.body.append(dialog);
  dialog.showModal();
  confirm.focus();
}

function assertUnlocked(isUnlocked) {
  if (!isUnlocked()) {
    const error = new Error('Der Erwachsenenbereich wurde gesperrt. Bitte erneut mit PIN öffnen.');
    error.code = 'locked';
    throw error;
  }
}

export function renderBackup({root, state, restore, onDownload, isUnlocked = () => true, onRefresh = null, getState = () => state}) {
  const ui = uiState(root);
  const resolved = resolveEpochs(state.ledger);
  const section = el('section', {attrs: {'aria-labelledby': 'backup-title', class: 'stack'}});
  section.append(
    el('h2', {text: 'Sicherung', attrs: {id: 'backup-title'}}),
    el('p', {text: 'Eine vollständige JSON-Sicherung enthält Inhalte und Lernhistorie, aber keine PIN und kein Google-Zugriffstoken.'}),
  );
  if (ui.notice) section.append(message(ui.notice, ui.tone));

  if (resolved.epochConflict) {
    const select = el('select', {attrs: {id: 'backup-epoch'}});
    select.append(el('option', {text: 'Datenstand auswählen', attrs: {value: ''}}));
    for (const [index, epochId] of resolved.heads.entries()) {
      const epoch = state.ledger.epochs.find(({id}) => id === epochId);
      const date = epoch?.occurredAt ? new Date(epoch.occurredAt).toLocaleString('de-DE') : 'Datum unbekannt';
      select.append(el('option', {text: `Datenstand ${index + 1} vom ${date}`, attrs: {value: epochId}}));
    }
    select.value = ui.selectedEpochId;
    select.addEventListener('change', () => {
      ui.selectedEpochId = select.value;
      exportButton.disabled = ui.busy || !ui.selectedEpochId;
    });
    section.append(message('Mehrere Wiederherstellungsstände sind offen. Für die Sicherung muss ein Kopf ausdrücklich gewählt werden.', 'error'), field('Datenstand für die Sicherung', select));
  }

  const exportButton = button('Sicherung herunterladen', async () => {
    if (ui.busy) return;
    try {
      assertUnlocked(isUnlocked);
      ui.busy = true;
      exportButton.disabled = true;
      const backup = await exportBackup(state, new Date().toISOString(), {
        selectedEpochId: resolved.epochConflict ? ui.selectedEpochId || undefined : undefined,
      });
      assertUnlocked(isUnlocked);
      const day = backup.exportedAt.slice(0, 10);
      ui.notice = downloadBackup(onDownload, backup, `vokabeltrainer-sicherung-${day}.json`);
      ui.tone = 'info';
    } catch (error) {
      ui.notice = error?.message || 'Die Sicherung konnte nicht erstellt werden.';
      ui.tone = 'error';
    } finally {
      ui.busy = false;
      if (isUnlocked()) {
        if (root.isConnected) renderBackup({root, state, restore, onDownload, isUnlocked, onRefresh, getState});
        else onRefresh?.();
      }
    }
  }, {class: 'primary', disabled: ui.busy || (resolved.epochConflict && !ui.selectedEpochId)});
  section.append(exportButton);

  const file = el('input', {attrs: {id: 'backup-file', type: 'file', accept: 'application/json,.json'}});
  const importPanel = el('section', {attrs: {class: 'subpanel stack compact'}}, [
    el('h3', {text: 'Sicherung wiederherstellen'}),
    el('p', {text: 'Die Datei wird vollständig geprüft. Vor jeder Änderung entsteht eine geprüfte Sicherheitskopie und anschließend eine zweite Bestätigung.'}),
    field('JSON-Sicherungsdatei', file),
  ]);
  file.addEventListener('change', async () => {
    const selected = file.files?.[0];
    if (!selected || ui.busy) return;
    try {
      assertUnlocked(isUnlocked);
      ui.busy = true;
      const backup = await parseBackup(await selected.text());
      assertUnlocked(isUnlocked);
      ui.pendingBackup = backup;
      const prepared = await restore.prepare(backup);
      assertUnlocked(isUnlocked);
      const openPreview = (result, staleNotice = '') => showRestorePreview({
        summary: result.summary,
        state: getState(),
        events: ui.pendingBackup?.events ?? [],
        trigger: file,
        staleNotice,
        onConfirm: async () => {
          assertUnlocked(isUnlocked);
          try {
            await restore.confirm(result.previewId);
            assertUnlocked(isUnlocked);
            ui.notice = 'Die Wiederherstellung wurde vollständig geprüft und aktiviert.';
            ui.tone = 'info';
            queueMicrotask(() => onRefresh?.());
          } catch (error) {
            if (error?.code !== 'stale') throw error;
            const refreshed = await restore.prepare(ui.pendingBackup);
            assertUnlocked(isUnlocked);
            return {replace: () => openPreview(
              refreshed,
              'Der Datenstand hat sich geändert. Die aktualisierten Unterschiede werden neu angezeigt und müssen erneut bestätigt werden.',
            )};
          }
        },
        onCancel: () => { ui.pendingBackup = null; },
      });
      openPreview(prepared);
    } catch (error) {
      ui.notice = error?.message || 'Die Sicherungsdatei konnte nicht geprüft werden.';
      ui.tone = 'error';
      if (isUnlocked()) {
        if (root.isConnected) renderBackup({root, state, restore, onDownload, isUnlocked, onRefresh, getState});
        else onRefresh?.();
      }
    } finally {
      ui.busy = false;
      file.value = '';
    }
  });
  section.append(importPanel);

  const activeJob = state.restoreJobs.find(({phase}) => ['uploading', 'published'].includes(phase));
  if (activeJob) {
    section.append(el('section', {attrs: {class: 'subpanel'}}, [
      el('h3', {text: 'Bestätigte Wiederherstellung fortsetzen'}),
      el('p', {text: 'Der bestätigte Auftrag wird mit derselben Vorschau und denselben reservierten Datei-IDs fortgesetzt.'}),
      button('Bestätigte Wiederherstellung fortsetzen', async () => {
        try {
          assertUnlocked(isUnlocked);
          await restore.confirm(activeJob.previewId);
          assertUnlocked(isUnlocked);
          ui.notice = 'Die bestätigte Wiederherstellung wurde fortgesetzt.';
          ui.tone = 'info';
        } catch (error) {
          ui.notice = error?.message || 'Die Wiederherstellung konnte noch nicht fortgesetzt werden.';
          ui.tone = 'error';
        } finally {
          if (isUnlocked()) onRefresh?.();
        }
      }, {class: 'primary'}),
    ]));
  }

  const copies = el('section', {attrs: {class: 'subpanel'}}, [
    el('h3', {text: 'Sicherheitskopien'}),
    el('p', {text: 'Sicherheitskopien werden nicht automatisch gelöscht.'}),
  ]);
  const listedCopies = state.safetyCopies.map(({id, createdAt, purpose, hash, verified, driveManifestFileId}) => ({
    id, createdAt, purpose, hash, verified, driveManifestFileId,
  }));
  if (listedCopies.length === 0) copies.append(el('p', {text: 'Noch keine Sicherheitskopie vorhanden.', attrs: {class: 'hint'}}));
  for (const copy of listedCopies) {
    const purpose = {'format-migration':'vor der Formatumstellung', restore: 'vor einer Wiederherstellung', safety: 'Sicherheitskopie', join: 'vor einem Datensatzwechsel'}[copy.purpose]
      ?? 'Sicherheitskopie';
    copies.append(el('article', {attrs: {class: 'management-card'}}, [
      el('h4', {text: new Date(copy.createdAt).toLocaleString('de-DE')}),
      el('p', {text: `${purpose} · ${copy.verified ? 'geprüft' : 'nicht vollständig geprüft'}${copy.driveManifestFileId ? ' · in Drive' : ' · lokal'}`}),
      button('Sicherheitskopie herunterladen', async () => {
        try {
          assertUnlocked(isUnlocked);
          const backup = await restore.downloadSafetyCopy(copy.id);
          assertUnlocked(isUnlocked);
          ui.notice = downloadBackup(onDownload, backup, `vokabeltrainer-sicherheitskopie-${copy.createdAt.slice(0, 10)}.json`);
          ui.tone = 'info';
          if (root.isConnected) renderBackup({root, state, restore, onDownload, isUnlocked, onRefresh, getState});
          else onRefresh?.();
        } catch (error) {
          ui.notice = error?.message || 'Die Sicherheitskopie konnte nicht gelesen werden.';
          ui.tone = 'error';
        }
      }, {class: 'secondary', disabled: !copy.verified}),
    ]));
  }
  section.append(copies);
  root.replaceChildren(section);
}
