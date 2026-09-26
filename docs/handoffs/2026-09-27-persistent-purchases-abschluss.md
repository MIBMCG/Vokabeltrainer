# Übergabe: Dauerhafte Käufe und Avatarentwicklung

Stand: **27.09.2026**

## Überprüfbarer Stand

- Branch: `codex/vokabeltrainer-v1`
- Task-4-Kopf und freigegebene Basis für Task 5:
  `9e710149d4e4225ce579ff59d820431cabc06316`
- Task 5: Implementierungscommit
  `4eac7217e7205da3429d909648e5057497b81b83`, Fixrunde 1
  `ae9ef27a940a341ce2b26bc2edb1124f4d2cc3c4`, Bericht und dokumentierter Kopf
  `bdb65ad548e3133637d169efccadf32ee11a6f6d`; scoped PASS mit Minor zur
  Fokusrückgabe nach „Stale → Abbrechen“, alle Important-Befunde geschlossen
- geprüfter Kern-/UI-Kopf: `bdb65ad548e3133637d169efccadf32ee11a6f6d`
- aktueller Testfixkopf: `32e87c5`
- letzter exakt bestätigter Push:
  `bce7f10493c39efa46bf0bbbdb0ea5fc1d427ac9`; der Abschlussstand ist noch
  nicht gepusht
- Remotezweig: `origin/codex/vokabeltrainer-v1`
- Task 6 läuft; Arbeitsbaum und Index sind noch kein Abschlussstand

## Umgesetzt

Version 1 und die Überarbeitung A1–C2 bleiben die Produktbasis. Tasks 1–4 des
Kaufplans sind implementiert und unabhängig freigegeben: vollständige
wirtschaftliche Historie, gebundener Drive-Transport, dauerhafte Aufträge,
Recovery, Format-3-Aktivierung, autoritativer gemeinsamer Kopf, koordinierter
Restore und portable wirtschaftliche Sicherungen.

Task 5 verbindet den Kaufdienst mit der Produktoberfläche. Erwachsene erhalten
vor der Format-3-Aktivierung eine rein lokale Vorschau; nur ihre ausdrückliche
Bestätigung startet die dauerhafte Veröffentlichung. „Meine Figur“,
„Entwicklung“ und „Shop“ stehen oben im Avatarbereich, der klassische Avatar
darunter im aufklappbaren Bereich „Klassischen Avatar gestalten“. Die Ansicht
zeigt bestätigtes Guthaben, Besitz, Auswahl und offene Käufe je Profil. Ein
unklarer Ausgang wird als „Kauf wird geprüft“ angezeigt und mit „Kauf
fortsetzen“ anhand des gespeicherten Auftrags wiederaufgenommen.

`main.js` bindet die Ports `previewActivation()`, `activate(ticket)`,
`getView()`, `refresh()`, `preview(input)`, `confirm(preview)`,
`resume(operationId)` und `select(input)` ein. `previewActivation()` liefert
`{ticket, previewState:{ledger}}`, sodass Ticket und sichtbare Vorschau aus
demselben aktuellen Commands-Stand stammen. `prepareRestorePreview` bereitet
zuerst die frische Restorebasis und danach die wirtschaftliche Ansicht vor.
Die Restoreauswahl wird erst nach bestätigtem Kopf gegen dessen Konten geprüft
und vollständig ersetzt, einschließlich einer leeren Auswahl.

Der Service Worker verwendet Cacheversion `v24`; Server-Allowlist und
Pflicht-Precache enthalten
die neuen Laufzeitmodule und vier Drachenbilder. Google-Antworten und Tokens
werden nicht gecacht. Die vier Quellen wurden unverändert integriert und
belegen zusammen 6.898.398 Bytes. Responsive Varianten wurden nicht erzeugt.
Fixrunde 1 korrigiert R5-1 bis R5-5 berichtsgemäß: selbstständiges Nachladen
und Fokus nach Rootwechsel, dieselbe fachliche Basis für sichtbare Vorschau und
Ticket, tatsächliche Restoreübernahme der angekündigten Auswahl einschließlich
Leerung, korrekter Grundformstatus und die dokumentierte Signatur
`confirm(preview)`. Die scoped Nachprüfung ist PASS mit dem verbleibenden
Minor zur Fokusrückgabe nach „Stale → Abbrechen“.

Neue Lernereignisse und Pakete bleiben v2. `storageVersion:3` ist die lokale
Zustandsversion. Aktivierte Kaufepochen und wirtschaftliche Backups verwenden
v3. ProductSync speichert Configref und Config über `commerce.discover` vor dem
Download; `commerce.reconcile` aktiviert danach ausschließlich den vollständig
geprüften gemeinsamen Kopf. Ein Offline-Provenienzcheckpoint ist nur für
Backupexport und Quellreplay zulässig, nie als Kopf oder Vorgänger der
autoritativen Zielkette.

## Frische Abschlussprüfungen

Die Task-5-Werte sind Implementierungsnachweise. Sie ersetzen den frischen
Task-6-Gesamtlauf nicht.

| Prüfung | Befehl / Umgebung | Ergebnis |
| --- | --- | --- |
| Task-5-Fixrunde: betroffene Node-Suiten | fokussierte Produkt-, Kauf- und Laufzeitsuiten | 127 Tests, 0 Fehler, 45,064 s |
| Task-5-Fixrunde: Kaufbrowserfälle | Playwright mit lokalem Testserver und Edge | 6/6 bestanden, 0 Fehler, 33,089 s |
| Task-5-Fixrunde: Offline-/Updatebrowserfälle | Pflicht-Precache, Offlinestart und Updateoberfläche | 3/3 bestanden, 0 Fehler, 10,722 s |
| Task 6: gesamte Node-Suite | `npm test` auf `bdb65ad` | 499/499 bestanden, 0 Fehler, 70,841 s |
| Task 6: vollständiger Browserlauf | Trainer, Überarbeitung und Käufe | 38/39 bestanden, 1 Fehler, 153,843 s; I3-Wiederanmeldung wird diagnostiziert |
| Dokumentation und Portabilität | Docscheck und Diffprüfung | noch offen |
| unabhängige Gesamtprüfung | vollständiger Paketdiff einschließlich Minor-Fokusrest | noch offen |

Die Tests verwenden synthetische Daten und eine simulierte Google-Grenze. Es
wurde keine reale Google-, Zwei-Geräte-, Apple- oder Hostingprüfung ausgeführt.
Task 5 und Fixrunde 1 wurden mit GPT-5.6 Sol/hoch umgesetzt; die scoped
Nachprüfung ist PASS mit einem Minor. Die vollständige Task-6-Abschlussprüfung
ist wegen des offenen I3-Wiederanmeldetests noch nicht grün.

## Festlegungen und Kosten

- Direkte Google-Drive-Koordination bleibt bestätigt; kein zusätzlicher Dienst,
  kein neues kostenpflichtiges Abo und keine Änderung des gemeinsamen
  Kontenmodells.
- Vollständige Beleg-/Proofhistorie wird nicht automatisch gekürzt. Das kostet
  wachsenden Speicher- und Prüfaufwand, erhält aber die wirtschaftliche
  Nachweisbarkeit.
- Der Offline-Provenienzcheckpoint vermeidet einen Cloudwrite beim Export,
  verlangt dafür eine vollständige lokale Closure und portable Proofkopien.
- Die vier Drachenquellen liegen als Zwischenbestand im Laufzeitcache. Sie
  belegen zusammen 6.898.398 Bytes; responsive Varianten fehlen.
- Keine Produktionsabhängigkeit und kein eigener Buildschritt wurden für den
  Kaufkern oder die Task-5-Oberfläche eingeführt.

## Bewusst offen

- 72 weitere Avatar-/Entwicklungsmotive und ihre responsiven
  Produktionsvarianten;
- vollständige Galeriegestaltung einschließlich eines weiter ausgebauten
  Wechsels zwischen Klassisch und Entwicklung sowie zusätzlicher
  Fortschrittsdarstellung;
- persönliche visuelle Abnahme dieser vollständigen Galerie;
- realer Produktabgleich mit Google Drive auf zwei physischen Geräten;
- iPhone-/iPad-, Safari- und Home-Bildschirm-Abnahme einschließlich
  App-/Browserneustart und Wiederaufnahme;
- HTTPS-Bereitstellung und Hostingfreigabe;
- allgemeine Lizenzentscheidung.

Vier bestätigte Drachenquellen werden in der Laufzeit als erste
Entwicklungsreihe verwendet; daraus folgt keine vollständige Galerieabnahme.
Der historische echte Google-Bericht 10 mit
6/6 Szenarien bleibt gültig, ersetzt aber keine Produkt- oder Geräteabnahme und
wird nicht unverändert wiederholt.

## Portable Fortsetzung

```sh
git clone https://github.com/MIBMCG/Vokabeltrainer.git
cd Vokabeltrainer
git switch codex/vokabeltrainer-v1
git status --short --branch
git log -5 --oneline
npm test
npm start
```

Läuft der persönliche `npm start`-Server während einer Programmaktualisierung
bereits, ihn anschließend im Terminal mit **Strg+C** beenden und mit
`npm start` neu starten. Die Server-Allowlist wird beim Start aufgebaut; ein
alter Prozess kennt neu hinzugekommene Laufzeitdateien nicht zuverlässig.

Der Trainer ist anschließend unter `http://localhost:4173/trainer/` erreichbar.
Auf einem bestehenden Checkout zuerst lokale Änderungen sichern und den
Remote-SHA vergleichen. Git überträgt Code und Dokumentation, keine Browserdaten,
Google-Sitzungen oder persönlichen Lernstände. Einen vorhandenen Familienbestand
bewusst über die vorbereitete Google-Verbindung auswählen.

## Nächste konkrete Schritte

1. I3-Diagnose und unabhängige Gesamtprüfung abschließen.
2. Relevante Befunde gemeinsam korrigieren, nachprüfen und den Abschlusspush
   mit SHA-Vergleich belegen.
3. Danach die 72 übrigen Motive und responsive Varianten produzieren sowie die
   vollständige Galerie gestalten und prüfen.
4. Das Produkt auf zwei realen Geräten einschließlich iPhone/iPad testen.
5. HTTPS/Hosting erst nach gesonderter Freigabe einrichten.

Bestätigte R-/E-/U-/AV-/EV-Entscheidungen nicht erneut pauschal abfragen. Kein
Merge nach `main`, keine Cloudkontenänderung und keine Veröffentlichung aus
dieser Übergabe ableiten.
