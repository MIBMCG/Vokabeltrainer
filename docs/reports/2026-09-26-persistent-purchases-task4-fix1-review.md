# Task 4 – scoped Fix-1-Nachprüfung

## Finding-Verdikte

- **R4-1 – Download aktiviert Epochen vor Prüfung des gemeinsamen Kopfes: NOT ADDRESSED.** `src/trainer/sync/drive.js:844–846` schützt den ersten Lauf mit vollständig neu gelesener v3-Epoche, aber nicht zuverlässig dessen Wiederholung. Der unten beschriebene tatsächliche Sync-Repro aktiviert beim zweiten Kopf-Netzfehler eine verspätete v2-Epoche und verwirft die laufende Runde ohne bestätigten Kopf.
- **R4-2 – reguläre Restorewiederaufnahme wird als veraltete Vorschau abgewiesen: ADDRESSED.** `src/trainer/backup/restore.js:109–116` verwendet nur für `preview` die Kandidatenvorbereitung und ansonsten `resume(job.id)`. `src/trainer/main.js:297` verbindet diesen Port tatsächlich mit dem PurchaseService. Dessen bestehender Controlpfad liest über `sendControl`/`refreshInternal` zuerst nach und verwendet gespeicherte Kandidaten, Bodies und ETag. Der neue Test in `tests/trainer/purchases-recovery.test.js` erzeugt die echte Service-/Restore-/Integrationskomposition neu nach angenommener Veröffentlichung mit verlorener Antwort und prüft erhaltene Kandidaten- und Uploadidentitäten. Der zweite neue Test prüft eine ausdrückliche Pointerwiederholung nach Neustart mit ursprünglicher ETag und ursprünglichen Properties.
- **R4-3 – abgeschlossene Veröffentlichungen sperren spätere Restores: ADDRESSED.** `src/trainer/purchases/service.js:540` nimmt ausschließlich abgeschlossene `activated`-Einträge von der Fremdauftragssperre aus. Offene andere Phasen bleiben gesperrt. Die neue tatsächliche Initialize → Restore → Restore-Komposition erhält alle drei abgeschlossenen Journale und prüft deren Fortbestand; sie löscht sie nicht wie der frühere isolierte Vorbereitungstest.

## Verbleibende Important-Lücke in R4-1

Die neue Bedingung verwendet `completeEpochs.some(epoch.formatVersion >= 3)`.
`completeEpochs` enthält nur die diesmal tatsächlich gelesenen Kandidaten.
`readIfNeeded` darf bekannte Dateien bei unveränderter Metadatenversion in
derselben Syncinstanz überspringen (`src/trainer/sync/drive.js:286–294`);
der Download übernimmt sie dann nicht in `epochCandidates`
(`src/trainer/sync/drive.js:747–751`).

Nach einem Fehler beim ersten Kaufkopflesen ist deshalb folgende gültige Folge
möglich:

1. Lokaler Kaufzustand hat noch keine Config und keinen Kopf. Vollständige
   veröffentlichte v3-Kandidatenepoche wird gelesen, korrekt inaktiv gespeichert
   und als bekannte Datei vermerkt. Die anschließende Kaufentdeckung scheitert
   am Netz. Aktive Epoche und Runde bleiben zunächst erhalten.
2. Ein bereits laufender alter Client veröffentlicht anschließend seine gültige
   v2-Restoreepoche. Beim erneuten Sync derselben Instanz ist die bekannte
   v3-Datei überspringbar; nur die neue v2-Epoche landet in `completeEpochs`.
3. Beide lokalen Commerce-Bedingungen sind weiterhin falsch. Der neue Guard ist
   damit ebenfalls falsch. Der Download aktiviert v2, Commands beendet die Runde,
   und die erneute Kaufkopfprüfung scheitert wieder. Es gibt keinen Rollback.

Der fokussierte Repro ergibt:

```text
AUTHORITY_RETRY {"firstEpoch":"e0","firstConfig":null,"firstHistorical":["authority-5","e0"],"secondEpoch":"late-v2","roundBefore":"asking","roundAfter":"abandoned","head":null}
```

Dies verletzt weiterhin die ursprüngliche R4-1-Grenze, keine zusätzliche
Anforderung. Der erste bestandene Download darf die Epochenautorität beim
nächsten Lauf nicht vom Metadatencache abhängig machen.

Die initiale Beitrittsstrecke wurde gezielt statisch nachverfolgt:
`joinDataset` liest die Commerceautorität im Scratchpfad nur bei fremdem,
nichtleerem lokalen Bestand (`src/trainer/sync/drive.js:585–588`); ein leerer
Beitritt verlässt sich auf den nachfolgenden normalen Sync. Bei Verwendung des
Scratchpfads werden Ledger und bekannte Dateien übernommen, nicht jedoch dessen
Commercezustand (`src/trainer/sync/drive.js:630–649`). Daher darf die neue
Guardbedingung auch dort keinen schon lokal gespeicherten Configanker voraussetzen.
Das ist Kontext des offenen R4-1, kein separates Finding gegen unveränderten Code.

**Erforderlicher Abschluss:** Die erkannte Commerce-/v3-Autoritätsgrenze muss
über fehlgeschlagene Kopflesungen und übersprungene bekannte Dateien hinweg
zuverlässig gelten, einschließlich initialem Beitritt und noch fehlendem
Initializekopf. Unbestätigte/alte Epochen weiterhin erhalten, aber nicht durch
deren gewöhnlichen Download aktivieren. Keine globale Sperre für echte
unverbundene oder reine Legacybestände einführen.

## Enger Repro und Regressionsempfehlung

Ausgeführt wurde ausschließlich ein temporäres
`node --input-type=module`-Skript aus dem Repository-Root, per PowerShell-Here-String.
Es verwendete die Helfer vor dem ersten Test in `tests/trainer/sync.test.js`
und den Aufbau des neuen Tests
`commerce epochs remain inactive until the shared head is durably verified`
bis unmittelbar vor dessen erstem `await guarded.sync()`.
Die übrigen Testfälle wurden nicht gestartet. Anstelle des Testabschlusses
wurde folgender Ablauf ausgeführt:

```js
offline = true;
await assert.rejects(guarded.sync(), {code: 'network'});
const first = commands.getState();
const late = {
  ...structuredClone(activation.publication.epoch),
  formatVersion: 2, ruleVersion: 2, id: 'late-v2',
  deviceId: 'old-client', clock: 2000,
};
drive.addJson({
  id: 'late-v2-file', parentId: binding.folderId,
  appProperties: {
    app: 'vokabeltrainer-product', kind: 'epoch',
    datasetId: binding.datasetId, epochId: late.id,
  },
  value: late,
});
await assert.rejects(guarded.sync(), {code: 'network'});
const second = commands.getState();
console.log('AUTHORITY_RETRY', JSON.stringify({
  firstEpoch: resolveEpochs(first.ledger).activeEpochId,
  firstConfig: first.commerce.config,
  firstHistorical: first.ledger.historicalEpochs.map(e => e.id),
  secondEpoch: resolveEpochs(second.ledger).activeEpochId,
  roundBefore: before.rounds.p1.status,
  roundAfter: second.rounds.p1.status,
  head: second.commerce.head,
}));
guarded.destroy();
sync.destroy();
```

Der späte v2-Beleg verwendet den bereits vollständig hochgeladenen gültigen
v2-Snapshot des Initializekandidaten; geändert sind ausschließlich die neue
Epochidentität, Erzeugerkennung, Uhr und Versionskennung. Der Fehler erfordert
keine beschädigte Datei. Der vorhandene neue Legacy-End-to-End-Test ergänzt
wertvoll den eingefrorenen Altclient, startet dessen späten Upload aber erst,
nachdem der neue Client Config und Kopf erfolgreich gespeichert hat. Er deckt
deshalb diese Fehlerfolge nicht ab.

## Neue Breakage im Fixdiff

Keine zusätzliche eigenständige Critical-/Important-Breakage belegt. Der
unvollständige neue Guard ist Bestandteil des weiterhin offenen R4-1.

## Out-of-Scope Observations

Keine zusätzlichen Befunde. Unveränderte Join-, Cache- und Servicepfade wurden
nur zur Bewertung der drei vorgegebenen Findings nachverfolgt, nicht umfassend
neu geprüft.

## Prüfumfang und Urteil

Geprüft: Re-Reviewvorlage, bestehender Task-4-Brief samt Grenzen, bisherige
Findings, angehängter Implementierungsbericht und portabler Fixbericht;
Commit-/Stat-/U10-Fixpaket inkrementell mit Fokus auf Produkt- und Teständerungen.
Controllerdokumentation und übernommener ursprünglicher Reviewbericht wurden
nicht als neue Produktimplementation bewertet.

Fixbasis: `eb0f532c1930112240b38b16c22ab0ef1c7f1f62`.
Geprüfter Kopf: `d5f24aa8ba9ad6b90046ff5895fb59e83f52d1b7`.
Reviewer: GPT-6 Astra, high; Datum: 26.09.2026.

Die benannten RED/GREEN-Belege, 135/135 betroffenen Tests und 492/492 Gesamttests
sind Implementiererbelege. Ihre Assertions wurden am Diff geprüft; die Suiten
wurden nicht wiederholt. Unabhängig ausgeführt wurde nur der oben dokumentierte
zusätzliche Fehlerfall. Kein Produktcode, Index, HEAD oder Commit geändert.
Keine echten Drive-/Apple-/Zwei-Geräte-Prüfungen durchgeführt.

**Fix round: Findings remain open — R4-1 (Important).**
**Spezifikation: weiterhin nicht erfüllt. Qualität: weitere gezielte Korrektur
erforderlich.** R4-2 und R4-3 benötigen keine erneute Implementierung.
