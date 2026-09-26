# Task 4 – scoped Fix-2-Nachprüfung

## Finding-Verdikt

**R4-1 – Download aktiviert Epochen vor Prüfung des gemeinsamen Kopfes:
ADDRESSED.**

- `src/trainer/purchases/integration.js:325–354` trennt die gebundene
  Configentdeckung vom Lesen des Koordinators. Datensatzbindung,
  Descriptorhash, installierter Configref und unveränderliche Config werden
  geprüft; widersprechende oder verschwundene bereits bekannte Anker scheitern.
  Die Rückgabe installiert ausschließlich den Configanker, keine aktive Epoche.
- `src/trainer/sync/drive.js:257–270` übernimmt diesen Zustand über den
  vorhandenen CAS-Schreibweg. `performSync` wartet bei Zeile 1079 auf dessen
  Abschluss, bevor `download` beginnt. Schlägt Entdeckung oder Speichern fehl,
  wird der Download nicht erreicht. Der unveränderte `mutate`-Pfad bei
  Zeile 225–240 wiederholt bei lokalem CAS-Konflikt die Prüfung auf dem neuen
  Zustand und propagiert andere Speicherfehler.
- Die lokale Config ist damit bereits für die Downloadentscheidung bei
  `src/trainer/sync/drive.js:865–867` vorhanden. Die Grenze hängt bei einem
  installierten Commercebestand nicht mehr davon ab, ob dessen v3-Datei diesmal
  gelesen oder aus dem Metadatencache übersprungen wurde. Eine fehlgeschlagene
  spätere Kopfprüfung entfernt den gespeicherten Anker nicht; auch neu erzeugte
  Commands-/Syncinstanzen lesen ihn aus dem dauerhaften Zustand.
- `src/trainer/purchases/integration.js:360–384` prüft erst anschließend den
  tatsächlichen gemeinsamen Kopf und die vollständige Historie. Ein noch
  fehlender Initializekopf aktiviert keine Kandidatenepoche. Die Übernahme des
  verifizierten Fachstands bleibt im nachgeschalteten gemeinsamen
  Commands-Commit von `reconcileCommerce`.
- `src/trainer/sync/drive.js:661` übernimmt beim bestätigten Beitritt zusätzlich
  den im Scratchpfad geprüften Commercezustand zusammen mit Ledger und bekannten
  Dateien. Für einen leeren Beitritt gilt beim anschließenden ersten Sync
  ebenfalls die verpflichtende Entdeckung vor dem Download. Der reale
  Runtimeadapter in `src/trainer/main.js:260–268` reicht die vollständige
  CommerceIntegration weiter und erfüllt den erweiterten Portvertrag.

**R4-2 und R4-3: frühere ADDRESSED-Verdikte bleiben bestehen.** Ihre korrigierten
Restore-/Journalpfade wurden in dieser Runde nicht verändert oder neu aufgerollt.

## Neue Breakage im Fixdiff

**Keine neue Critical-/Important-Breakage gefunden.**

Der zusätzliche Port ist bei injizierter CommerceIntegration verpflichtend;
ein fehlender `discover`-Port wird bereits beim Erzeugen von ProductSync
abgewiesen. Ohne Commerceport bleibt der vorhandene Pfad unverändert. Eine
unverbundene lokale Sammlung erreicht die Entdeckung nicht. Ein gebundener
Legacybestand ohne installierten Configanker erhält durch `discover` keinen
synthetischen Kaufkopf oder neue aktive Epoche.

## Geprüfte Assertions und Nachweise

- Der erweiterte tatsächliche Sync-Kompositionstest in
  `tests/trainer/sync.test.js` führt den zuvor unabhängig reproduzierten zweiten
  Lauf aus: zwei fehlgeschlagene Koordinatorlesungen derselben Instanz,
  anschließend neuer Commands-/Integrations-/Syncprozess und weitere späte
  v2-Epoche. Er prüft unveränderte aktive Epoche und Runde, dauerhafte Config und
  erhaltene historische Alt-Epochen. Erst der später verfügbare bestätigte Kopf
  aktiviert seine Epoche; der Rundenabbruch erfolgt dann ohne Punktverlust.
- Der neue tatsächliche Join-Test führt Vorschau und Bestätigung mit
  Sicherheitskopie durch, prüft übernommenen Configref bei noch leerem
  Koordinatorkopf und anschließend den Sync einer späten v2-Epoche. Die
  Rootepoche bleibt aktiv und beide unbestätigten Epochen bleiben Herkunft.
- Der neue Entdeckungstest in `tests/trainer/purchases-integration.test.js`
  prüft Configübernahme ohne Koordinatorread oder Epochenwechsel. Die
  dauerhafte Speicherung wird durch ProductSync ergänzt, nicht vom reinen
  Adaptertest behauptet.
- Der Fixbericht benennt passende RED-Belege (`late-v2` statt `e0`, fehlender
  Entdeckungsport) und GREEN-Belege der genannten Fälle sowie 48/48 betroffene
  Sync-/Integrationstests und eine fehlerfreie Dokumentationsprüfung. Die
  Assertions stimmen mit diesen Aussagen überein. Diese Läufe sind
  Implementiererbelege; sie wurden in der Nachprüfung nicht erneut ausgeführt.

## Out-of-Scope Observations

Keine zusätzlichen Befunde.

## Umfang und Urteil

Reviewer: GPT-6 Astra, high. Datum: 26.09.2026.
Fixbasis: `d5f24aa8ba9ad6b90046ff5895fb59e83f52d1b7`.
Geprüfter Kopf: `9e710149d4e4225ce579ff59d820431cabc06316`.

Bewertet wurden ausschließlich R4-1 und die Änderungen des bereitgestellten
Fix-2-Pakets. Grundlage waren die bereits gelesene Re-Reviewvorlage, der
Task-4-Brief samt verbindlichen Grenzen, der angehängte Implementierungsbericht
und der portable Fixbericht. Produkt-, Test- und Vertragsdiff wurden
inkrementell gelesen. Unveränderte CAS- und Runtimeverdrahtung wurden nur wegen
der konkreten neuen Entdeckungs-/Speichergrenze nachverfolgt. Keine breite
Branchreview, keine Subagents, keine wiederholten Suiten oder zusätzlichen
Repros; die neue Abdeckung beantwortet die zuvor offene konkrete Hypothese.
Keine Produkt-, Index-, HEAD- oder Commitänderung.

**Fix round: All findings addressed, no new Critical/Important breakage.**
**Spezifikationsurteil für das Task-4-Reviewgate: erfüllt. Qualitätsurteil:
freigegeben für Task 5.**

Die Freigabe betrifft dieses Implementierungs-/Reviewgate. Reale Drive-,
Apple-/Zwei-Geräte-Abnahme sowie spätere Task-5-/Gesamtpaketprüfung bleiben
unverändert eigenständige Nachweise; daraus folgt keine Veröffentlichungsfreigabe.
