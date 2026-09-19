# Task A4: Kompakte Vokabelverwaltung mit sicherem Bearbeiten

## Git-Stand

- BASE: `c695994fbf87ea65660ed03604217241ae830146`
- Produkt-HEAD: `af5c095` (`feat: simplify vocabulary and parent navigation`)
- Branch: `codex/vokabeltrainer-v1`
- Kein Push durch den Task-Implementierer.

## Umsetzung

- Die Erwachsenenansicht hat vier auffindbare Bereiche: `Vokabeln`, `Lernstand`, `Lernregeln` und `Einstellungen`. Auf 390 px Breite stehen sie als 2×2-Raster vollständig zur Verfügung.
- `ui/vocabulary.js` hält Auswahl, Suche, Aktiv-/Archivfilter, geöffneten Editor und Entwurf an einem stabilen Root. Wort- und Lektionsformulare öffnen erst nach einer bewussten Aktion.
- Einzel- und Tabelleneingabe können über den bestehenden Commandpfad eine neue Lektion samt Kinderzuordnung anlegen. Mehrere Lösungen, korrigierbare Tabellenzeilen und bewusste Dublettenentscheidungen verwenden weiterhin `parseTable`, `validateRows`, `applyRows` und `commands.revise`.
- Wort- und Lektionseditor kopieren die beim Öffnen gelesenen Revisionsköpfe. Hintergrundänderungen ersetzen weder DOM-Eingaben noch diese Basis; ein überholtes Speichern bleibt zur Korrektur im Editor. `learningId` wird weiterhin ausschließlich in den Commands bestimmt.
- Bereichs-, Profil-, Lektions- und Ausgangswechsel mit geänderten Eingaben bieten `Speichern`, `Verwerfen` und `Weiterbearbeiten`. Bewusstes Neuladen nach Hintergrundänderung verwirft den Entwurf. Die bestehende PIN-Sperre entfernt die geschützte Ansicht.
- `ui/settings.js` bündelt Kinder, PIN, Google-Abgleich und Sicherung und reicht den optionalen `onDownload`-Callback an `renderBackup` weiter. Sync-, Restore-, Auth- und PIN-Logik wurde nicht dupliziert. Lernregeln bleiben bis B3 ehrlich lesend.
- Start und Reise nutzen dieselbe kleine Avatar-/Levelkarte mit vorhandener Rewardprojektion. Die Fortschrittsspur ist hell mit türkiser Füllung; der Landschafts-Hero bleibt ohne zweite Ganzkörperfigur.
- Auf der mobilen Reise bleiben alle 15 Marker innerhalb der Karte. Kopf und Kopfbedeckung sind im Porträt sichtbar; die Berginsel-Infokarte liegt außerhalb des Korridors der Marker 14/15.
- Produktcache auf `v11`, synthetischer Updateworker auf `v12` erhöht; die neuen UI-Module sind in Server- und Workerlisten enthalten.

## TDD-Nachweise

### Kompakte Verwaltung und Entwurfsgrenzen

RED:

```text
node --test --experimental-test-isolation=none --test-name-pattern='compact vocabulary management' tests/browser/overhaul.browser.mjs
0/1 bestanden: erwartet wurden die vier neuen Bereiche; vorhanden waren Kinder/Lektionen/Lernstand/Abgleich/Sicherung.
```

Weitere gezielte RED-Nachweise reproduzierten den abgeschnittenen vierten Mobilbereich, die fehlende Start-Levelkarte, außerhalb der Kartenbreite liegende Etappenmarker und zuletzt die Überlagerung der Berginsel-Karte mit 14/15.

GREEN auf dem finalen Produktcode:

```text
node --test --experimental-test-isolation=none --test-name-pattern='compact vocabulary management' tests/browser/overhaul.browser.mjs
1/1 bestanden

node --test --experimental-test-isolation=none --test-name-pattern='illustrated journey' tests/browser/overhaul.browser.mjs
1/1 bestanden
```

Der Verwaltungsfall prüft Suche, bewusste Editoröffnung, unveränderten Entwurf bei Hintergrundänderung, alle drei Navigationsentscheidungen, unveränderbare Lernregeln, neue Lektionen und Zuordnungen in beiden Eingabewegen, mehrere Antworten, korrigierte Dubletten sowie Archivieren/Reaktivieren.

### Commands und bestehende Verwaltungslogik

```text
node --test tests/trainer/adult.test.js tests/trainer/commands.test.js
37/37 bestanden
```

## Weitere Prüfungen

- `npm test`: 291/291 bestanden.
- `node --test --experimental-test-isolation=none tests/browser/trainer.browser.mjs`: 15/15 bestanden. Darin bleiben die vier finalen v1-Integrationsregressionen, Google-/Restorekonflikte, Offlinebetrieb und kontrollierter Workerwechsel erhalten.
- Vollständige `tests/browser/overhaul.browser.mjs`: 6/6 bestanden; nach den letzten gezielten visuellen Korrekturen liefen die jeweils betroffenen Fälle erneut grün.
- Fokussierte Adult-/Commands-/Serve-Prüfung: 43/43 bestanden.
- `npm run check:docs`: vor dem Bericht 283 Dateien, 90 Markdowndateien, 404 lokale Links, 0 Fehler; nach dem Bericht erneut geprüft.
- `git diff --check` und `git diff --cached --check`: ohne Befund vor dem Produktcommit.

Alle Browsertests verwendeten das vorhandene portable Playwright-Modul und lokalen Headless-Edge auf einem vom Harness gewählten Zufallsport. Der persönliche Server auf Port 4173 und persönliche Browserdaten wurden nicht verwendet.

## Tatsächliche Ansichten

- `test-results/overhaul-a4/vocabulary-mobile-390.png`: 390×844, vier Bereiche, sichtbare Wortliste, Filter- und Aktionsabstände.
- `test-results/overhaul-a4/settings-desktop-1280.png`: 1280×900, gebündelte Einstellungen.
- `test-results/overhaul-a1/start-390.png`: 390×844, Avatarporträt-/Levelkarte mit vollständigem Kopf.
- `test-results/overhaul-a1/journey-390.png`: 390×844, türkise Fortschrittsspur, 15 enthaltene Marker und lesbare Inselkarten.

Die vier PNGs wurden nach ihrer jeweiligen finalen Änderung tatsächlich geöffnet und visuell geprüft.

## Geänderte Dateien

- `src/trainer/ui/vocabulary.js`
- `src/trainer/ui/settings.js`
- `src/trainer/ui/adult.js`
- `src/trainer/ui/practice.js`
- `src/trainer/ui/rewards.js`
- `trainer/styles.css`
- `trainer/sw.js`
- `scripts/serve.mjs`
- `tests/serve.test.js`
- `tests/browser/overhaul.browser.mjs`
- `tests/browser/trainer-harness.mjs`
- `tests/browser/trainer.browser.mjs`

## Selbstprüfung und Grenzen

- Keine neue Lernregel, Lernstands- oder Belohnungslogik eingeführt; Punkt-, Level-, Ausstattungs- und 15-Etappen-Verträge bleiben erhalten.
- Keine Sync-, Restore-, Auth-, PIN- oder Backup-Ausnahme ergänzt. Keine Tokens, PINs, persönlichen Profile oder privaten Browserdaten gelesen oder gespeichert.
- Kein stiller Profil-/Lektionswechsel mit Entwurf und keine nachträglich aktualisierte Revisionsbasis im Editor gefunden.
- Die neuen Ansichten wurden in synthetischem Edge bei 390×844 und 1280×900 geprüft. Das ersetzt keine Abnahme auf echtem iPhone/iPad und keine vollständige C2-Gesamtbildprüfung.
- Keine offenen Implementierungsbedenken für den bestätigten A4-Umfang.

## Fixrunde 1: Importentwurf und Suchfokus

- Fix-BASE: `af5c09532c08155b002db530369200434b3fcfd8`
- Fix-HEAD: `28287e7` (`fix: preserve import drafts and vocabulary search focus`)
- Der Tabellenimport führt Ziellektion, neuen Lektionsnamen, Kinderzuordnungen und Rohtext als einen dauerhaften Entwurf. Reine Zieländerungen lösen nun ebenfalls die bestehende Speichern-/Verwerfen-/Weiterbearbeiten-Grenze aus.
- Nach einem Zielwechsel wird die Vorschau gegen die tatsächlich ausgewählte Lektion neu validiert. Ungeprüfte Änderungen am Rohtext sperren das Übernehmen bis zur erneuten Vorschau. Bearbeitete Vorschauzeilen setzen das Ziel nicht mehr zurück.
- Die Suche filtert vorhandene Zeilen direkt, ohne das fokussierte Suchfeld bei jedem Zeichen neu zu erzeugen.
- Produktcache auf `v12`, synthetischer Updateworker auf `v13` erhöht.

RED:

```text
$env:PLAYWRIGHT_MODULE='G:/Vokabeltrainer/.worktrees/drive-probe/.superpowers/sdd/2026-09-16-google-drive-probe/browser-runtime/node_modules/playwright/index.mjs'
$env:BROWSER_EXECUTABLE='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
node --test --experimental-test-isolation=none --test-name-pattern='vocabulary search keeps focus|table import treats target-only|table import revalidates' tests/browser/overhaul.browser.mjs
0/3 bestanden.
- Suche enthielt nach echter Eingabe von „Hun“ nur „H“.
- Reine Importzieländerungen öffneten keinen Entwurfsdialog.
- Zielwechsel auf eine Lektion mit „Boot“ ließ die Dublettenübernahme aktiv.

node --test --experimental-test-isolation=none --test-name-pattern='table import revalidates' tests/browser/overhaul.browser.mjs
0/1 bestanden; nach Änderung des Vorschautexts blieb Übernehmen aktiv.
```

GREEN:

```text
node --test --experimental-test-isolation=none --test-name-pattern='vocabulary search keeps focus|table import treats target-only|table import revalidates' tests/browser/overhaul.browser.mjs
3/3 bestanden.

node --test --experimental-test-isolation=none --test-name-pattern='table import revalidates' tests/browser/overhaul.browser.mjs
1/1 bestanden, einschließlich geändertem Rohtext nach Vorschau.

node --test --experimental-test-isolation=none --test-name-pattern='compact vocabulary management|vocabulary search keeps focus|table import treats target-only|table import revalidates' tests/browser/overhaul.browser.mjs
4/4 bestanden; abgedeckt: bestehender A4-Verwaltungsfall und alle drei neuen Regressionen.

node --test --experimental-test-isolation=none --test-name-pattern='final I2|trainer setup, adult decisions|trainer offline update' tests/browser/trainer.browser.mjs
3/3 bestanden; abgedeckt: Entwurf/Revisionsbasis, vorhandener Import-/Persistenzablauf und Cachewechsel.

node --test --experimental-test-isolation=none --test-name-pattern='trainer setup, adult decisions' tests/browser/trainer.browser.mjs
1/1 bestanden nach der letzten Importkorrektur.

node --test tests/trainer/sw.test.js tests/serve.test.js
15/15 bestanden; abgedeckt: ausgelieferte Routen, Cacheinstallation/-aktivierung und Workergrenzen.
```

Es wurden keine persönlichen Browserdaten und nicht der persönliche Server auf Port 4173 verwendet. Die von Root erzeugten Reviewberichte und Bildkopien blieben unberührt und außerhalb des Fixcommits.

## Portable Bildnachweise

- [Vokabelverwaltung am Telefon](assets/2026-09-19-a4-vocabulary-390.png)
- [Einstellungen am Desktop](assets/2026-09-19-a4-settings-1280.png)
- [Start mit Levelkarte](assets/2026-09-19-a4-start-390.png)
- [Inselreise mit lesbaren Etappen](assets/2026-09-19-a4-journey-390.png)
