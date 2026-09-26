# Task 5 – gezielte Nachprüfung Fixrunde 1

Datum: 27.09.2026. Reviewer: GPT-6 Astra, Denktiefe high.
Basis: `8ed01f21052724a0ed0df50265d342a0bbf85a22`.
Geprüfter Kopf: `bdb65ad548e3133637d169efccadf32ee11a6f6d`.

## Getrennte Urteile

**Spezifikation:** Die drei funktionalen Important-Befunde sind behoben.
Die Fokusrückgabe aus R5-1 bleibt für einen Abbruch nach veralteter
Kaufvorschau teilweise offen; dieser Rest ist **Minor**.

**Qualität:** **PASS mit Minor-Rest für die Fortsetzung zur Abschlussprüfung.**
Keine offenen Critical-/Important-Befunde im Nachprüfungsumfang und keine
belegte neue schwerwiegende Regression durch den Fix. Der Fokusrest sollte
im Gesamtpaket nachgeführt werden; er rechtfertigt keine eigene blockierende
Fixrunde. Dies ist keine Freigabe für Veröffentlichung oder reale Geräte.

| ID | Ergebnis | Verbleibende Schwere |
| --- | --- | --- |
| R5-1 | STILL OPEN – Hauptfehler behoben, enger Fokusrest | Minor |
| R5-2 | ADDRESSED | – |
| R5-3 | ADDRESSED | – |
| R5-4 | ADDRESSED | – |
| R5-5 | ADDRESSED | – |

## R5-1 – funktionaler Ladefehler behoben; Abbruchfokus noch offen

**Behobene Stellen:** `src/trainer/ui/purchases.js:143–155,214–232,263–277`,
`src/trainer/ui/rewards.js:237,318`, `src/trainer/ui/shell.js:351–353`.

Jeder Render registriert die aktuellen Argumente einschließlich verbundenem
Root. Die Abschlüsse von `load` und `run` verwenden diese Registrierung statt
der alten Closure. Ein durch einen echten Commands-Commit ersetzter Root
bekommt dadurch die abgeschlossene Ansicht, ohne zusätzlichen Klick oder
Hintergrundtimer. Der Shell-Fallback rendert nur, solange die Avataransicht
noch aktuell ist; ein später Ladeabschluss darf deshalb die inzwischen
geöffnete Erwachsenenansicht und deren bearbeitete Eingaben bestehen lassen.

Die gelesenen Browserregressionen decken einen während des ersten Ladens
ersetzten Root, den späten Abschluss nach Navigation und Auswahl/Kauf mit
wirklichem Commands-Commit ab. Insbesondere prüfen
`tests/browser/purchases.browser.mjs:362–369` die verbundene Kaufansicht und
einen Fokus innerhalb der Tabs nach erfolgreichem Abschluss. Die erfolgreiche
Dialogbestätigung verwendet bei entferntem Auslöser den Ersatzfokus
(`src/trainer/ui/purchases.js:202–203`).

**Verbleibender Minor:** `src/trainer/ui/purchases.js:196–198`.
„Abbrechen“ schließt den Dialog und ruft ausschließlich `trigger.focus()` auf.
Nach einer zurückgewiesenen veralteten Vorschau hat `run.finally` die
Kaufansicht jedoch bereits neu aufgebaut und diesen Auslöser entfernt. Der
Abbruch verwendet den neuen Ersatzfokus nicht. Im echten Browser landet der
Fokus dann auf `BODY`, nicht auf einem sinnvollen verbundenen Bedienelement.
Der Dialog schließt und die Kaufansicht bleibt nutzbar; es gibt keinen
Datenverlust, keinen unberechtigten Kauf und keinen erneuten Ladeblocker.

**Unabhängiger enger Nachweis:** Ein einzelner lokaler Edge-Lauf mit dem
vorhandenen Browserharness, tatsächlichem `renderPurchases` und einem
Serviceport, der `stale` zurückgibt. Keine vollständige Suite und keine
Produktdatei wurden dafür verändert. Ablauf: Entwicklung → Stufe 2 kaufen →
Bestätigen → Stale-Meldung → Abbrechen. Ergebnis:

```json
{"dialogCount":0,"activeTag":"BODY","activeInTabs":false,"activeConnected":true}
```

`BODY.isConnected` allein ist somit kein hinreichender Fokusnachweis. Als
gezielte Regression kann der bereits bestehende Stale-Browserpfad nach
„Abbrechen“ einen Fokus auf dem aktuellen Tab oder einem anderen geeigneten
Bedienelement prüfen. Der erfolgreiche Bestätigungszweig besitzt den nötigen
Fallback bereits; auch der Abbruch braucht eine Rückgabe an einen aktuellen
Fokuspunkt.

## R5-2 – ADDRESSED: Vorschau und Ticket verwenden denselben Fachstand

**Stellen:** `src/trainer/main.js:304–319`,
`src/trainer/ui/purchases.js:391–395`,
`src/trainer/ui/backup.js:9–14,185,203–207`.

`previewActivation()` erfasst einmal den aktuellen Commands-Zustand und
liefert daraus sowohl Ticket/Fingerprint als auch `previewState.ledger`.
Das sichtbare Aktivierungsmodell erhält diesen Ledger und nicht mehr den
älteren Zustand des erhaltenen Einstellungsformulars. Der Bestätigungspfad
prüft weiterhin den semantischen Fingerprint. Die Fixänderung erweitert nicht
die bisher erlaubten Ausnahmen für reine Uploadbuchhaltung.

Der gemeinsame Restorehelfer wartet zuerst auf `restore.prepare`, liest
danach den aktuellen Zustand für die wirtschaftliche Vorschau und wird
sowohl beim ersten Öffnen als auch nach `stale` benutzt. Die vorher belegte
Umkehrung der Reihenfolge ist entfernt. Eine weitere fachliche Änderung nach
der Vorbereitung bleibt durch die bestehende Bestätigungsprüfung geschützt.

Die gelesene Browserregression ab
`tests/browser/purchases.browser.mjs:274` stellt ein altes Formular einem
aktuellen Vorschauzustand gegenüber; der neue Helfertest ab
`tests/trainer/purchases-view.test.js:105` prüft ausdrücklich die Reihenfolge
Vorbereitung → aktueller Zustand → Economy. Den tatsächlichen Main-Datenfluss
habe ich zusätzlich statisch geprüft; der Browserport allein wäre dafür kein
vollständiger Beleg.

## R5-3 – ADDRESSED: bestätigter Restore übernimmt die Zielauswahl atomar

**Stellen:** `src/trainer/purchases/integration.js:313–335`,
`src/trainer/ui/purchases.js:118–130`.

Die Integration übernimmt die Auswahl aus dem gespeicherten v3-Backup erst
nach bestätigtem Control und validierter Historie. Alle übernommenen Figuren
und Entwicklungsstufen müssen zum verifizierten Zielkonto berechtigt sein.
Ein Backup mit leerer Auswahl sowie ein Legacy-Backup ohne Economy ergeben
eine leere Auswahl. Entfallende Einträge werden im Vorschauvergleich über die
Vereinigung der bisherigen und eingehenden Profil-IDs mitgezählt.

Die Änderung erfolgt im zurückgegebenen kopierten Zustand gemeinsam mit
Ledger und Publikationsabschluss. Der bestehende Servicepfad
`src/trainer/purchases/service.js:235–258` übernimmt diesen Zustand über
denselben geschützten Commit; Vorbereitung oder fehlgeschlagene Veröffentlichung
führen diese Auswahlübernahme nicht aus. Wiederholtes normales Refresh
wendet eine bereits bestätigte lokale Restoreauswahl nicht erneut an.

Die Prüfung `history.projection.activeEpochId === control.epochId` verhindert,
dass ein älterer lokaler Restore nach einer neueren bestätigten Restoreepoche
seine Auswahl darüberlegt. Sein Publikationsauftrag kann trotzdem als
abgeschlossen markiert werden; die neue Autorität wird dadurch nicht blockiert.

Die ergänzten Assertions in
`tests/trainer/purchases-integration.test.js:336–450` verwenden die tatsächliche
Vorbereitung, History-Auswertung und Applyintegration für geänderte und leere
Auswahl. Sie prüfen zusätzlich Legacy-Leerung und den Abschluss eines älteren
Restores bei neuerer Epoche. Grenzen: Die Legacy-Assertion ersetzt im bereits
vorbereiteten Zustand gezielt das Backup und ist eine Applypfadprüfung, kein
neuer vollständiger Legacy-Browserdurchlauf. Der Schutz gegen die spätere
Epoche wird ebenfalls direkt an der echten Applyintegration geprüft. Diese
Grenzen stehen einer Bewertung des kleinen Applyfixes anhand seines
Datenflusses nicht entgegen.

## R5-4 und R5-5 – ADDRESSED

**R5-4:** `src/trainer/ui/purchases.js:321` verlangt für die gesperrte,
ausgewählte Grundform nun dieselbe Figur **und Stufe 1**. Die Browserergänzung
prüft, dass die Grundform bei ausgewählter höherer Stufe wieder auswählbar ist.

**R5-5:** `docs/KAUFPROTOKOLL.md:846–850` und
`docs/reports/2026-09-27-persistent-purchases-task5-implementation.md:21–27`
beschreiben jetzt die tatsächliche Form von `previewActivation()`,
`confirm(preview)` und getrennt `resume(operationId)`. Dies stimmt mit den
produktiven Aufrufen in `src/trainer/ui/purchases.js:281,285–287` überein.

## Prüfbelege und Grenzen

Gelesen wurden das Fixbriefing, der bereitgestellte vollständige Fixdiff,
der ursprüngliche Reviewbericht, der ergänzte Taskbericht und der portable
Fixbericht. Die Runtimeänderungen, zugehörigen Assertions sowie die konsistente
Worker-/Harnessfortschreibung von v23 auf v24 beziehungsweise synthetisch v25
wurden unabhängig im Code geprüft. Außerhalb des Fixdiffs wurde der bestehende
Serviceabschluss gezielt für die atomare Auswahlübernahme und deren einmalige
Anwendung gelesen; keine erneute breite Kernreview.

Der Implementierungsbericht dokumentiert 127/127 fokussierte Node-Tests,
6/6 Kaufbrowserfälle und 3/3 betroffene Worker-/Offlinefälle. Diese Ergebnisse
wurden als vorhandene Belege eingeordnet, nicht als eigene erneute Ausführung
ausgegeben. Die Assertions wurden gelesen. Kein Wiederholen grüner Suiten.

Eigenständig ausgeführt: Status/HEAD-Leseprüfung und der oben beschriebene
Fokusrepro über eine PowerShell-Here-String-Pipeline an
`node --input-type=module`. Der Payload importiert
`createTrainerHarness` aus `tests/browser/trainer-harness.mjs`, lädt die lokale
App, importiert dort `renderPurchases`, rendert ein synthetisches aktives Konto
mit Drache Stufe 1 und lässt `confirm` einen Fehler mit `code: 'stale'` werfen.
Danach führt Playwright die fünf genannten UI-Schritte aus und liest
`document.activeElement`. Der erste Browserstart scheiterte an der lokalen
Prozess-Sandbox (`spawn EPERM`); derselbe Repro lief anschließend mit erlaubtem
Prozessstart erfolgreich. Es wurden weder Live-Google noch echte Daten benutzt.

Keine neue Prüfung auf realem iPhone/iPad, keine erneute visuelle Gesamtabnahme
und keine Veröffentlichungsfreigabe. Die Controller-Änderung an
`.gitattributes` wurde nicht bewertet oder verändert. Keine Produktänderungen,
keine Subagenten, kein Commit. Neu unabhängige Themen wurden nicht eröffnet.

**Offen für die Abschlussprüfung:** ausschließlich der oben belegte Minor-Rest
von R5-1, Fokusrückgabe nach Stale → Abbrechen.
