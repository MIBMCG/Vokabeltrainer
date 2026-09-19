# B3: Lernregler und Wiederüben in der Elternansicht

Stand: 19.09.2026. Umsetzung GPT-5.6 Sol / high. Basis `552f0222414f48c588ff2bbc627ac10f12fa678e`, Produktcommit `c04ffd917826ffbb677df94ecc95701a89a585e8`, Fix `2f0a12615cf80c09920a08d9b8c794deeaecfd67`. Die [unabhängige Nachprüfung](2026-09-19-b3-review.md) durch einen separaten GPT-5.6 Sol / high bestätigt beide Korrekturen ohne neue Befunde. B3 ist freigegeben. Der offene Hinweis zur breiten Browserprüfung unten bleibt ausdrücklich bestehen.

## Umsetzung und Sichtprüfung

Der Bereich „Lernregeln“ zeigt Einstellungen und Entwürfe je Kind. Schwelle für seltenere Wiederholung, optionaler Ausschluss und vier Tagesabstände verwenden die gemeinsame validierte B2-Logik. „Auswirkung prüfen“ schreibt keine Ereignisse; „Standardwerte einsetzen“ füllt nur das Formular. Erst bewusstes Speichern verändert Regeln. Die Erklärung nennt die Wirkung ab der nächsten neuen Runde.

Der ursprüngliche Policykopf bleibt während der Bearbeitung eingefroren, auch wenn eine Vorschau inzwischen einen neueren Stand sieht. Ein Konflikt erhält Eingaben. „Gespeicherte Regeln neu laden“ übernimmt erst bewusst den aktuellen Zustand und Kopf. Bestehende Entwurfsgrenzen und PIN-Bedienhürde bleiben eingebunden.

Ausgeschlossene aktuelle Lernfassungen erscheinen für das gewählte Kind in der Vokabelansicht. „Wieder üben“ verwendet genau die gelesene Lernfassung/Generation; Antworten und Punkte bleiben erhalten. Die UI berechnet keine eigene Wiederholungslogik. Anleitung, Serverroute und Offlinecache sind erweitert; Erstcommit v16 / synthetisch v17, nachgeprüfter Fix v17 / synthetisch v18.

Die [tatsächliche Mobilansicht bei 390 × 844](assets/2026-09-19-b3-learning-rules-390.png) wurde von Implementierer und Controller geöffnet: vier Tabs, Kindwahl, Regeln, Erklärung und Aktionen sind lesbar. Der optionale Stopwert wird beim Auffrischen verborgen. Screenshot-SHA256: `9a13a5c7f3a8a4414517eaf373906d14b717d05b05140690de4890b8a34b9d54`.

## Tatsächliche Prüfungen

Isolierte synthetische Browserkontexte und freie Ports; lokale Playwright-/Browserpfade wie in der [Browseranleitung](../../tests/browser/README.md). Die tatsächlich ausgeführten Einzelbefehle sind ohne lokale Umgebungsvariablen und kombinierte Ausgabe-/Exitcode-Behandlung dargestellt:

```sh
node --test --experimental-test-isolation=none --test-name-pattern='learning rules stay separate|learning rule previews keep|excluded current word generations' tests/browser/overhaul.browser.mjs
node --test --experimental-test-isolation=none --test-name-pattern='serves only named probe' tests/serve.test.js
node --test --experimental-test-isolation=none --test-name-pattern='B2 browser|final I2|trainer setup, adult decisions|trainer offline update' tests/browser/trainer.browser.mjs
node --test --experimental-test-isolation=none tests/serve.test.js tests/trainer/sw.test.js
node --test --experimental-test-isolation=none tests/browser/overhaul.browser.mjs
npm test
npm run check:docs
git diff --check
git diff --cached --check
```

| Prüfung | Ergebnis |
| --- | --- |
| Drei neue B3-Browserfälle | 3/3 bestanden |
| Neue Serverroute | 1/1 bestanden |
| Betroffene Trainer-/Entwurfs-/Updatefälle | 4/4 bestanden |
| Server und Worker | 15/15 bestanden |
| Node-Gesamtsuite | 339/339 bestanden |
| Breite Überarbeitungs-Browsersuite | **11/12 bestanden**, alle B3-Fälle grün; Einzelbefund unten |
| Dokumentprüfung vor Produktcommit | 321 Dateien, 98 Markdown-Dateien, 434 lokale Links, keine Fehler |
| Beide Git-Prüfungen | keine Ausgabe/Fehler |

Die ersten Prüfversuche enthielten einen Sandbox-Startfehler und einen zu breiten Locator; diese gelten nicht als fachliches RED. Das fehlende neue UI-Modul wurde vor Implementierung erkannt. Zusätzliche echte RED/GREEN-Fälle belegten einen fälschlich sichtbaren Stopwert und ein Reload vom alten Renderzustand statt aus aktuellen Commands. Beide sind korrigiert. Der Vorschau-/Speicherfall verwendet eine im HTML erlaubte, fachlich aber fallende Intervallfolge, sodass tatsächlich die Fachvalidierung geprüft wird.

## Gezielte Reviewkorrektur

Der Ausschluss-Toggle schlägt jetzt `Math.max(6, aktuelle Schwelle)` vor. Ein individuelles Stopfeld wird beim bloßen Ändern der Schwelle nicht umgeformt; erst der bewusste Togglewechsel setzt einen neuen Vorschlag. Die Anleitung benennt drei Richtige und 1/3/7/14 Tage ausdrücklich als Standardwerte.

Ein echter neuer Browserfall scheiterte zunächst mit `6 !== 10` (0/1) und bestand nach dem Fix (1/1). Er prüft auch gültiges Speichern bei 10/10, den Vorschlag 6 bei niedriger Schwelle und den Erhalt individueller Stopwerte. Anschließend bestanden:

```sh
node --test --experimental-test-isolation=none --test-name-pattern='learning rules stay separate|learning rule stop suggestion follows|learning rule previews keep|excluded current word generations' tests/browser/overhaul.browser.mjs
node --test --experimental-test-isolation=none --test-name-pattern='trainer offline update UI' tests/browser/trainer.browser.mjs
node --test --experimental-test-isolation=none tests/serve.test.js tests/trainer/sw.test.js
```

Ergebnis 4/4 B3-Browser, 1/1 Update und 15/15 Server/Worker. Nach letzter Korrektur der synthetischen Harness-Untergrenze bestanden der Stopvorschlagsfall und der Updatefall nochmals jeweils 1/1. Produktcache v17, synthetischer Updateworker v18. Dokumentprüfung: 324 Dateien, 100 Markdown-Dateien, 437 lokale Links, keine Fehler; beide Git-Diffprüfungen ohne Ausgabe. Keine erneute ganze Browser-Suite behauptet.

## Offener Prüfhinweis für C2

Der unveränderte Offline-Avatar-Fallback-Fall meldete in der breiten Suite `0 !== 5` an `tests/browser/overhaul.browser.mjs:836`. Eine unveränderte isolierte Wiederholung bestand 1/1:

```sh
node --test --experimental-test-isolation=none --test-name-pattern='precache keeps unseen avatar fallbacks' tests/browser/overhaul.browser.mjs
```

Das allein beweist keine stabile Gesamtprüfung. Der Controller las den betroffenen Test: Er hängt eine künstliche Diagnosefigur nach asynchronen Avataränderungen in die von der App verwaltete Vorschau und wartet feste 700 ms. Ein späteres Rendern kann diese Figur entfernen. Diese konkrete Testaufbau-/Wartebedingung wird in C2 untersucht und stabilisiert; eine Produktursache ist damit noch nicht bewiesen oder ausgeschlossen. Die abschließende Gesamtsuite muss danach frisch bestehen. Der fehlgeschlagene Lauf wird nicht als 12/12 ausgegeben.

Keine C1-Statistik vorgezogen, keine Änderung an Punkten, Datenformat oder Sicherheitsversprechen. Keine persönlichen Browserdaten, reale Google-Anmeldung, physische Apple- oder Zwei-Geräte-Abnahme.
