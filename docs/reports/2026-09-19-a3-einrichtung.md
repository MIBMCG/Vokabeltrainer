# Task A3: Vorbereiteter Google-Zugang und geführte Einrichtung

## Git-Stand

- BASE: `7b109cfee381e6c4de849e8007b563408d57200a`
- Produkt-HEAD: `2d30c73` (`feat: preconfigure Google access and simplify family setup`)
- Branch: `codex/vokabeltrainer-v1`
- Kein Push durch den Task-Implementierer.

## Umsetzung

- Die verifizierte öffentliche OAuth-Web-Client-ID ist zentral in `src/trainer/config.js` vorbereitet. Es wurde kein Secret ergänzt und keine Google-Konto-, Projekt-, Ursprungs- oder Testnutzerkonfiguration verändert.
- `selectGoogleConfig` wählt nur vollständige syntaktisch brauchbare Web-Client-IDs. Eine gültige gespeicherte Browser-ID hat Vorrang. Bei Abweichung zur App-Konfiguration wird eine bewusste Entscheidung verlangt; ungültige und abgeschnittene Werte werden nicht als Fallback verwendet.
- `auth.clientId()` bleibt erhalten. `auth.connect()` kann ohne Argument die ausgewählte ID verwenden; eine ausdrücklich angegebene gültige ID bleibt für den erweiterten Betreiberweg möglich.
- Der normale Familienablauf zeigt kein Client-ID-Feld. Nach „Mit Google verbinden“ erscheinen die getrennten Aktionen „Neuen Lernbereich anlegen“ und „Vorhandenen Lernbereich verwenden“. Anmeldung allein erzeugt oder bindet keinen Drive-Bestand.
- Technische und manuelle Konfiguration liegt unter „Erweiterte Einstellungen“. Eine abweichende alte ID bleibt ungebunden bis zur bewussten Auswahl erhalten. Bei vorhandener Bindung bleibt sie erhalten; ein schneller Wechsel wird nicht angeboten.
- Die bestehende sichere Beitrittsvorschau, PIN-Sperre, Auth-Invalidierung, `onConnected`-Schedulerwiederanlauf und der automatische Upload nach bewusster 401-Neuanmeldung bleiben erhalten.
- Produktcache auf `v10`, synthetischer Updateworker auf `v11` erhöht; neue Laufzeitmodule sind in Server- und Workerlisten enthalten.
- Familien- und Betreiberanleitung wurden in `docs/BENUTZUNG.md` und `docs/GOOGLE-DRIVE-EINRICHTUNG.md` getrennt.

## TDD-Nachweise

### Reine Konfigurationsauswahl

RED:

```text
node --test --experimental-test-isolation=none tests/trainer/auth-config.test.js
1/6 bestanden, 5/6 mit den erwarteten Auswahlabweichungen fehlgeschlagen
```

GREEN:

```text
node --test --experimental-test-isolation=none tests/trainer/auth-config.test.js
6/6 bestanden
```

Die Selbstprüfung ergänzte einen Randfall für eine nur aus einem Bindestrich bestehende Kennung. Dieser lief zunächst RED mit 5/6 und nach der engeren privaten Validierung GREEN mit 6/6.

### Familienablauf und Alt-ID-Migration

RED:

```text
node --test --experimental-test-isolation=none --test-name-pattern='prepared Google access|differing browser client' tests/browser/overhaul.browser.mjs
0/2 bestanden
```

Der frische Ablauf fand das technische Feld noch sichtbar; der erweiterte bewusste Alt-ID-Weg fehlte vollständig.

GREEN auf dem finalen Produktcode:

```text
node --test --experimental-test-isolation=none --test-name-pattern='prepared Google access|differing browser client' tests/browser/overhaul.browser.mjs
2/2 bestanden
```

Die Fälle prüfen die exakte vorbereitete ID an der synthetischen GIS-Grenze, Google-Abbruch, fehlende automatische Erstellung/Bindung, ungebundenen bewussten Wechsel sowie den verhinderten Schnellwechsel bei bestehender Bindung.

## Weitere Prüfungen

- `npm test`: 291/291 Tests bestanden, nach der letzten Produktänderung.
- `node --test --experimental-test-isolation=none tests/browser/trainer.browser.mjs`: 15/15 bestanden. Darin enthalten sind 401 → bewusste Neuanmeldung → automatischer Upload, Hintergrund/PIN-Sperre während Anmeldung, vorhandenen Lernbereich prüfen/übernehmen, Konflikte, Offlinebetrieb und Workerwechsel. Dieser breite Lauf erfolgte vor der abschließenden engeren privaten Syntaxprüfung; die finalen zwei A3-Browserfälle und der vollständige Node-Lauf liefen danach erneut.
- `node --test --experimental-test-isolation=none tests/browser/overhaul.browser.mjs`: 5/5 bestanden; die finalen zwei A3-Fälle danach erneut 2/2.
- Fokussierter Worker-Updatefall: 1/1 bestanden mit Produktcache `v10` und synthetischem Worker `v11`.
- `npm run check:docs`: 279 Dateien, 88 Markdowndateien, 399 lokale Links, 0 Fehler vor diesem neuen Bericht; nach dem Bericht erneut geprüft.
- `git diff --check` und `git diff --cached --check`: ohne Befund vor dem Produktcommit.

Alle Browsertests verwendeten das vorhandene portable Playwright-Modul und lokalen Headless-Edge auf einem vom Harness gewählten Zufallsport. Der persönliche Server auf Port 4173 und persönliche Browserdaten wurden nicht verwendet.

## Geänderte Dateien

- `src/trainer/config.js`
- `src/trainer/auth-config.js`
- `src/trainer/main.js`
- `src/trainer/ui/sync.js`
- `scripts/serve.mjs`
- `trainer/sw.js`
- `tests/trainer/auth-config.test.js`
- `tests/browser/google-fixture.mjs`
- `tests/browser/overhaul.browser.mjs`
- `tests/browser/trainer-harness.mjs`
- `tests/browser/trainer.browser.mjs`
- `docs/GOOGLE-DRIVE-EINRICHTUNG.md`
- `docs/BENUTZUNG.md`

## Selbstprüfung und Grenzen

- Keine automatische Datensatzerstellung oder Bindung nach Anmeldung gefunden.
- Keine stille Umschaltung einer gültigen gespeicherten Alt-ID gefunden.
- Kein Client-Secret, Zugriffstoken, PIN-Verifier oder persönlicher Lernstand ergänzt oder ausgelesen.
- Keine A4-Funktion, Lernregel, Google-Kontoänderung, Hostingänderung oder Veröffentlichung vorgezogen.
- Synthetische GIS-/Drive-Prüfungen ersetzen keine aktuelle reale Autorisierung der Client-ID für jeden späteren Ursprung und kein echtes iPhone-/iPad- oder Zwei-Geräte-Ergebnis. Der historische erfolgreiche Probe-Screenshot belegt die angegebene öffentliche ID, nicht jede künftige Bereitstellung.
- Keine offenen Implementierungsbedenken für den bestätigten A3-Umfang.
