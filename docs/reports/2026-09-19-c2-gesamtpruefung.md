# C2: Gesamtprüfung und Bildnachweise

Umsetzung: GPT-5.6 Sol / high. Die unten aufgeführten Befehle wurden mit den lokalen Playwright-/Edge-Overrides gemäß [Browseranleitung](../../tests/browser/README.md) ausgeführt. Arbeitsplatzpfade sind hier für portable Weiterarbeit ausgelassen. Die [unabhängige Gesamtprüfung samt Nachprüfung](2026-09-19-abschlussreview.md) ist abgeschlossen. Der [gezielte Prüfwerkzeugfix](2026-09-19-c2-fix1.md) trennt normale Laufzeitbilder von veröffentlichten Nachweisen.

## Stand

- **BASE:** `6f998b41cd3e1a254677fff1c912d84e9bdeaa59`
- **HEAD / Commit:** `6ffcdfa8d97adcb0ad021b60c2bfce0f0499e59d` (`test: complete overhaul browser verification`)
- **Branch:** `codex/vokabeltrainer-v1`
- **Push:** nicht ausgeführt

## Änderungen

- Das Browserharness unterstützt pro isoliertem Kontext einen echten `deviceScaleFactor` und kann genau einen benannten Pflicht-Precache-Download fehlschlagen lassen. Es verwendet keine Produktions-Testschalter und keine persönlichen Browserprofile.
- Der bekannte Offline-Avatar-Fall besitzt jetzt einen testeigenen, versteckten DOM-Host. Er wartet auf genau fünf vollständig geladene Bilder mit positiver `naturalWidth` statt 700 ms in einem App-Knoten zu schlafen, den ein späteres Rendern ersetzen konnte.
- Der echte v1-IndexedDB-Browserfall enthält zusätzlich zur offenen Feedbackrunde ein ausstehendes v1-Paket. Migration, Sicherheitskopie, Neustart, Fortsetzung und die unveränderte Anzeige einer unbekannten Speicherversion werden gemeinsam geprüft.
- Ein neuer Browserfall lässt die Installation eines Pflichtassets des synthetischen v20-Workers einmalig fehlschlagen. Der aktive Produktcache v19 und ein fremder Cache bleiben erhalten; die App startet anschließend offline weiter.
- Die visuelle C2-Matrix erzeugt endgültige synthetische Ansichten für 1280×900, 390×844, 320×568, 844×390, 200 Prozent Schrift und einen getrennten DPR-2-Kontext.
- Ein dabei reproduzierter Randbefund wurde behoben: Bei gleichzeitig 320 px Breite und 200 Prozent Schrift zwangen der einzeilige Übungskopf und die inhaltsbreiten Fortschrittsspalten die Seite auf 370 px. Der Übungskopf darf jetzt umbrechen, die beiden Fortschrittswerte teilen sich begrenzte Spalten. Die Hauptaktion bleibt nach normalem Scrollen vollständig oberhalb der festen Navigation sichtbar. Die Navigation bricht in dieser kombinierten Extremansicht deutlich um, bleibt aber erreichbar.
- Wegen der CSS-Produktkorrektur wurde der Produktcache von v18 auf **v19** und der synthetische Updateworker auf **v20** erhöht.
- `tests/browser/README.md` beschreibt Abschlussläufe, isolierte Zustände, DPR-/Precache-Steuerung, Bildnachweise und Grenzen.

## RED-Nachweise und Diagnose

### Neuer Harness-/Ansichtenvertrag

Zuerst ausgeführt:

```sh
node --test --experimental-test-isolation=none --test-name-pattern='C2 rejected|required precache|C2 final views' tests/browser/trainer.browser.mjs tests/browser/overhaul.browser.mjs
```

Der erste Sandboxversuch endete ausschließlich beim Browserstart mit `spawn EPERM`. Derselbe Lauf über den freigegebenen Edge-Zugriff ergab **0/2** als fachliches RED:

- Der angeforderte DPR-2-Kontext meldete noch `devicePixelRatio === 1`.
- Die getrennt geplante Schrift-/Breitenprüfung war zunächst versehentlich als kombinierte 320-px-/200-Prozent-Prüfung formuliert und zeigte einen echten Seitenüberlauf: `scrollWidth 370` bei `innerWidth 320`. Übungskopf und Fortschrittsblock waren etwa 346 px breit.

Nach Harness-Erweiterung war der fehlgeschlagene Precache-Fall grün. Die Pflichtmatrix wurde entsprechend Brief zunächst getrennt geprüft; auf Bitte des Controllers wurde anschließend auch die kombinierte Randkonfiguration mit der kleinen CSS-Umbruchkorrektur dauerhaft aufgenommen.

### Bekannter Offline-Avatar-Carry

Der verbindliche Ausgangsbefund aus dem B3-Gesamtlauf war **11/12**: Der unveränderte Offline-Avatar-Fall fand nach festem 700-ms-Warten 0 statt 5 Bilder, während sein isolierter Wiederholungslauf 1/1 bestand. Ursache war die Diagnose unter der App-eigenen `.avatar-preview`, die ein asynchrones Rendern ersetzen konnte. C2 verschob das Diagnose-DOM in einen testeigenen Host und ersetzte das Warten durch die konkrete Bedingung „fünf vollständige Bilder mit positiver Breite“.

Gezielt nach der Änderung ausgeführt:

```sh
node --test --experimental-test-isolation=none --test-name-pattern='C2 final views|C2 rejected|required precache|precache keeps unseen avatar' tests/browser/trainer.browser.mjs tests/browser/overhaul.browser.mjs
```

Ein Zwischenlauf war **2/3**: Die neue Testannahme verlangte, dass ein fehlgeschlagener Worker zwingend einen Teilcache hinterlässt. Der Browser hatte korrekt nur den alten v19- und den fremden Cache behalten. Die Prüfung verlangt deshalb nur die beiden sicherheitsrelevanten Garantien und macht keine Aussage über einen zulässigen, unbenutzten Teilcache. Die betroffenen Fälle liefen danach grün.

### Gezielte Integration

Ausgeführt:

```sh
node --test --experimental-test-isolation=none --test-name-pattern='B1 browser|B2 browser|final I[1-4]|trainer sync and restore keeps concurrent|trainer offline starts|trainer offline update|C2 rejected' tests/browser/trainer.browser.mjs
```

Der erste Lauf war **9/10** ausschließlich wegen der oben beschriebenen Teilcache-Annahme. Die übrigen neun Fälle waren grün: echte v1-Migration mit offener Runde und ausstehendem Paket, eingefrorene Policy/Generation, PIN-/Entwurfs-/Reconnect-/Restore-Grenzen, Zwei-Geräte-Konflikt/Restore/Support/Late-Change, Offline-Neustart unter Root und `/repo` sowie kontrollierte Aktualisierung.

## Abschließende Prüfungen

Nach dem letzten Produktfix frisch ausgeführt:

```sh
npm test
```

Ergebnis: **343/343 bestanden**. Darin enthalten sind Save-Abbruch mit erhaltenem Originalstand, Versionsgrenzen, beide Ankunftsreihenfolgen für Policy/Generation, Reset mit verspäteten alten Antworten, Antwortslot-Deduplizierung, Supportreferenzen, Serverrouten und Workergrenzen.

```sh
node --test --experimental-test-isolation=none tests/browser/trainer.browser.mjs
```

Ergebnis: **18/18 bestanden**.

```sh
node --test --experimental-test-isolation=none tests/browser/overhaul.browser.mjs
```

Ergebnis nach dem finalen Avatar-Kombinationsnachweis: **15/15 bestanden**.

```sh
npm run check:docs
git diff --check
```

- Dokumentation: **345 Dateien**, **103 Markdown-Dateien**, **510 lokale Links**, `errors: []`.
- Diffprüfung ohne Ausgabe.
- Die ältere reale Drive-Probe wurde nicht erneut ausgeführt: Seit ihrer bestätigten Basis änderte sich kein gemeinsam verwendetes Drive-/Probe-Laufzeitmodul; `scripts/serve.mjs` erhielt nur bereits durch `tests/serve.test.js` abgedeckte Produktrouten. Es gab keine echte Anmeldung.

## Finale Bildnachweise

Alle folgenden Dateien wurden nach dem letzten Overhaul-Lauf tatsächlich geöffnet:

- `docs/design/2026-09-19-ueberarbeitung-app/start-mobile-390.png`
- `docs/design/2026-09-19-ueberarbeitung-app/journey-mobile-390.png`
- `docs/design/2026-09-19-ueberarbeitung-app/practice-narrow-320.png`
- `docs/design/2026-09-19-ueberarbeitung-app/practice-font-200-mobile-390.png`
- `docs/design/2026-09-19-ueberarbeitung-app/practice-narrow-320-font-200.png`
- `docs/design/2026-09-19-ueberarbeitung-app/feedback-landscape-844x390.png`
- `docs/design/2026-09-19-ueberarbeitung-app/feedback-correct-mobile-390.png`
- `docs/design/2026-09-19-ueberarbeitung-app/avatar-mobile-390-dpr2.png`
- `docs/design/2026-09-19-ueberarbeitung-app/avatar-combinations-desktop-1280.png`
- `docs/design/2026-09-19-ueberarbeitung-app/vocabulary-mobile-390.png`
- `docs/design/2026-09-19-ueberarbeitung-app/learning-rules-mobile-390.png`
- `docs/design/2026-09-19-ueberarbeitung-app/statistics-mobile-390.png`
- `docs/design/2026-09-19-ueberarbeitung-app/statistics-desktop-1280.png`

Der Kombinationsnachweis zeigt sechs beschriftete Rasteravatare. Zusammen enthalten sie alle vier Hauttöne, alle sechs Kleidungsfarben sowie Kappe, Sonnenhut, Bergmütze, Rucksack, Fernglas und Kompass; der Browserfall prüft zusätzlich die 16 verschiedenen finalen `data-art-key`-Layer und 30 geladene Ebenen. Die DPR-2-Ansicht zeigt zugleich die echten Auswahlkacheln und verständlichen Level-Sperren.

## Offlinegröße und Grenzen

- Basisdownload: **74 Dateien / 812.457 Bytes**, davon **18 kleine Rasterbilder / 326.702 Bytes**.
- Bedarfsweise große Rasterdateien: **36 Dateien / 2.231.480 Bytes**.
- Große Dateien bleiben bedarfsweise; fällt ihre Übertragung aus, werden die vorab gespeicherten kleinen Bilder verwendet.
- Die Ansichten sind synthetische Chromium-/Edge-Simulationen. Sie ersetzen weder Safari noch ein physisches iPhone/iPad, Home-Bildschirm-Betrieb oder den echten Abgleich zweier Geräte mit Google Drive.
- Die kombinierte 320-px-/200-Prozent-Ansicht ist bedienbar und ohne seitlichen Seitenüberlauf; die feste Navigation benötigt sichtbar mehrere Textzeilen. Daraus wird keine pauschal perfekte Optik abgeleitet.
- Keine persönlichen Browserdaten, Google-Tokens, echten Lernprofile, externen Konten oder ein Server auf Port 4173 wurden verwendet.
