# Dauerhafte Käufe und Avatarentwicklung – Abschlussbericht

Stand: **27.09.2026**

## Ergebnis

Tasks 1–5 des bestätigten Kaufplans sind implementiert und unabhängig
geprüft. Aus Task 5 bleibt ein kleiner Tastaturfokusbefund für die
Abschlussprüfung offen. Task 6 läuft: 499/499 Node-Tests bestanden; im jüngsten
vollständigen Browserlauf bestanden 38/39 Fälle. Der Wiederanmeldetest I3
meldet einen wiederholten Upload und wird gezielt untersucht. Eine endgültige
Freigabe, der Abschlusscommit und der bestätigte Abschlusspush stehen noch aus.

Das Paket verbindet tatsächliche Lernpunkte mit getrennten wirtschaftlichen
Konten je Profil, vollständiger Beleg-/Basis-/Proofhistorie, gebundenem
Drive-Transport, dauerhaften Aufträgen und gemeinsamem autoritativem Kopf.
Aktivierung und Restore speichern ihre vollständigen Publikationsdaten vor der
ersten abhängigen Netzoperation. ProductSync verankert die Config vor dem
Download und aktiviert erst nach vollständigem Reconcile den gemeinsamen Kopf.

Neue Lernereignisse und Pakete bleiben v2; `storageVersion:3` ist die lokale
Zustandsversion. Nur aktivierte Kaufepochen und die portable wirtschaftliche
Sicherungsclosure verwenden v3. Der Offline-Provenienzcheckpoint ist nur im
Backupexport und Quellreplay erlaubt und wird in der autoritativen Zielkette
abgewiesen.

Task 5 ergänzt die folgenden konkreten Produktwege:

- Erwachsene sehen vor der Aktivierung eine rein lokale Vorschau; erst
  „Aktualisierung jetzt durchführen“ startet die dauerhafte Veröffentlichung.
- „Meine Figur“, „Entwicklung“ und „Shop“ stehen oben im Avatarbereich. Der
  klassische Avatar bleibt darunter über „Klassischen Avatar gestalten“
  aufklappbar. Guthaben, Besitz und Auswahl werden je Profil angezeigt.
- Ein unbekannter Kaufausgang erscheint als „Kauf wird geprüft“ und kann über
  „Kauf fortsetzen“ mit dem gespeicherten Auftrag wiederaufgenommen werden.
  Veraltete Vorschauen bleiben offen und verlangen eine neue Prüfung.
- `main.js` bindet `previewActivation()`, `activate(ticket)`, `getView()`,
  `refresh()`, `preview(input)`, `confirm(preview)`, `resume(operationId)` und
  `select(input)` ein. `previewActivation()` liefert
  `{ticket, previewState:{ledger}}`; sichtbares Modell und Ticket stammen aus
  demselben aktuellen Commands-Stand.
- `prepareRestorePreview` bereitet zuerst die frische Restorebasis und erst
  danach die wirtschaftliche Ansicht vor. Die Auswahl wird nach bestätigtem
  Kopf gegen dessen Konten geprüft und vollständig ersetzt, auch mit `[]`.
- Der Service Worker nutzt Cacheversion `v24`; Allowlist und Pflicht-Precache enthalten die neuen
  Laufzeitmodule und vier Drachenbilder, aber keine Google-Antworten oder Tokens.
- Die vier unveränderten Drachenbilder belegen zusammen 6.898.398 Bytes. Sie
  bilden nur die erste Reihe; responsive Varianten und 72 weitere Motive fehlen.

## Commits und Reviewgrenzen

- Planbasis: `f54bd5d42762959c8c2dd8b2f746d417c0706706`
- Task 1: `5904dec` und dokumentierte Fixes, unabhängig freigegeben
- Task 2: `ebe3914` bis `cd6ba45`, unabhängig freigegeben
- Task 3: `5f73008`, `1ecddd6`, `b6abb4e`, unabhängig freigegeben
- Task 4: `8b0a6d0..9e710149d4e4225ce579ff59d820431cabc06316`,
  unabhängig freigegeben
- Task 5: `4eac7217e7205da3429d909648e5057497b81b83`; Fixrunde 1
  `ae9ef27a940a341ce2b26bc2edb1124f4d2cc3c4`; Bericht und dokumentierter Kopf
  `bdb65ad548e3133637d169efccadf32ee11a6f6d`; scoped PASS mit Minor
- geprüfter Kern-/UI-Kopf: `bdb65ad548e3133637d169efccadf32ee11a6f6d`
- aktueller Testfixkopf: `32e87c5`
- letzter exakt bestätigter Push:
  `bce7f10493c39efa46bf0bbbdb0ea5fc1d427ac9`; Abschlusscommit und Push stehen
  noch aus

## Frische Prüfbelege

Task 5 wurde fokussiert mit folgenden Implementierungsnachweisen geprüft:

- betroffene Node-Suiten: 127 Tests bestanden, 0 Fehler, 45,064 s;
- Kaufbrowserfälle: 6/6 bestanden, 0 Fehler, 33,089 s;
- Pflicht-Precache-, Offlinestart- und Updatebrowserfälle: 3/3 bestanden,
  0 Fehler, 10,722 s;
- Syntaxprüfung und Diffprüfung ohne Befund; vorhandene Avatar-, Pflichtcache-,
  Offline- und kontrollierte Updatebrowserfälle blieben grün.

Der frische Task-6-Zwischenstand lautet:

```text
npm test
# 499 Tests, 499 bestanden, 0 Fehler, 70,841 s

node --test --experimental-test-isolation=none \
  tests/browser/trainer.browser.mjs \
  tests/browser/overhaul.browser.mjs \
  tests/browser/purchases.browser.mjs
# 39 Tests, 37 bestanden, 2 Fehler, 221,667 s
```

Die beiden Fehler waren Ablaufmängel der Tests und sind in `32e87c5`
gezielt mit 2/2 bestandenen Fällen korrigiert; Produktcode blieb unverändert.
Der anschließende vollständige Lauf bestand mit **38/39 Fällen** in
153,843 s. Einzig I3 (Wiederanmeldung) meldet bei künstlichem Uhrfortschritt
einen wiederholten Upload; dessen Ursache wird separat geprüft. Siehe
[Browserkorrektur](2026-09-27-persistent-purchases-task6-browser-fix.md).
Die endgültige Paketprüfung bleibt offen. Ein grüner Node-Test ersetzt sie nicht.

## Unabhängige Gesamtprüfung

Fixrunde 1 korrigiert R5-1 bis R5-5 berichtsgemäß: Laden und Fokus nach
Rootwechsel, einheitliche Basis von sichtbarer Vorschau und Ticket, Restore der
angekündigten Figurenauswahl einschließlich Leerung, Grundformstatus und die
Dokumentation von `confirm(preview)`. Die scoped Nachprüfung bewertet dies als
PASS mit einem verbleibenden Minor: Nach einer veralteten Kaufvorschau landet
der Fokus beim anschließenden „Abbrechen“ auf `BODY` statt auf einem sinnvollen
Element der verbundenen Kaufansicht. Der Dialog schließt, die Ansicht bleibt
nutzbar und es gibt keinen Datenverlust oder unberechtigten Kauf. Dieser Rest
wird in der unabhängigen Gesamtprüfung nachgeführt. Die Gesamtprüfung des
vollständigen Pakets ist noch offen.

## Aussagegrenzen

Automatisierte Prüfungen verwenden synthetische Profile und eine simulierte
Google-Grenze. Der historische echte Google-Bericht 10 mit 6/6 Szenarien bleibt
ein Nachweis der damaligen isolierten Probe und wurde nicht unverändert
wiederholt. Nicht als bestanden behauptet werden:

- Produktabgleich über Google Drive auf zwei physischen Geräten;
- iPhone/iPad, Safari und installierte Home-Bildschirm-App;
- Wiederaufnahme nach realem Browser-/Appneustart;
- HTTPS-Bereitstellung oder Hosting;
- vollständige Bildproduktion und visuelle Abnahme.

Die vollständige Galeriegestaltung bleibt Folgeumfang. Dazu gehören neben den
72 fehlenden Motiven und responsiven Varianten auch ein weiter ausgebauter
Wechsel zwischen Klassisch und Entwicklung sowie zusätzliche
Fortschrittsdarstellung. Das aktuelle Paket liefert die funktionale
Serviceanbindung, drei nutzbare Bereiche und den bestehenden aufklappbaren
Klassisch-Bereich; es ist keine vollständige EV05-Galerieauslieferung.

Vier bestätigte Drachenquellen stehen zur Verfügung. **72 weitere Motive** und
ihre responsiven Produktionsvarianten bleiben offen. Es wurden keine echten
Tokens, privaten Schlüssel, PINs, Profile oder Backups in Repository oder
Berichte aufgenommen.
