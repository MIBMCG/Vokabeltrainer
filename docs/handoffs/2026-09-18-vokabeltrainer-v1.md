# Übergabe Vokabeltrainer Version 1

- Stand: 18.09.2026
- Branch: `codex/vokabeltrainer-v1`
- Produktcode: `3b1d16d`
- Remote vor Task 13: `8431786` auf `origin/codex/vokabeltrainer-v1`

## Übergebenes Ergebnis

Version 1 ist gemäß R01–R33 und E01–E10 implementiert. Task 13 korrigierte die letzten bekannten Bedienungs- und Textbefunde, machte das Browserharness portabel, erhöhte den Produktcache auf `v3`, ergänzte die Assetliste und schloss die frische Gesamtregression ab. Der [Abschlussbericht](../reports/2026-09-18-vokabeltrainer-v1.md) enthält Matrix, Taskhistorie, Screenshots und genaue Grenzen.

Die unabhängige Task-13- und Gesamtprüfung des Branches steht noch aus. Diese Übergabe behauptet weder deren Bestehen noch eine reale Geräte- oder Produkt-Google-Abnahme.

## Portabler Start

Voraussetzung ist Node.js ab 22.8.0.

```sh
npm test
npm run check:docs
npm start
```

Danach:

- Produkt: `http://localhost:4173/trainer/`
- technische Drive-Probe: `http://localhost:4173/`

Die Trainer-Browserregression läuft mit:

```sh
node --test tests/browser/trainer.browser.mjs
```

Sie verwendet standardmäßig das Projektpaket `playwright` und dessen Chromium. Falls ein Arbeitsplatz Playwright außerhalb des Projekts bereitstellt oder einen installierten Browser verwenden muss, sind `PLAYWRIGHT_MODULE` und `BROWSER_EXECUTABLE` optionale Overrides. Die genaue Probe-Anleitung steht in [tests/browser/README.md](../../tests/browser/README.md). Die Trainerregression wählt selbst einen freien Port; für die Probe kann `PROBE_BASE_URL` auf einen getrennten lokalen Testserver zeigen. Ein persönlicher Server auf Port 4173 muss dafür nicht beendet werden.

## Aktuelle Nachweise

- Node.js 22.23.2: 277/277 Tests bestanden.
- Playwright 1.62.1 mit Edge 153.0.4234.46: 11/11 Trainer-Browsertests bestanden.
- Getrennte Drive-Probe: 12/12 Szenarien bestanden, keine Seitenfehler.
- Offline-Neustart mit geschlossenem Testserver unter Wurzel- und Unterpfad bestanden.
- Echter verzögerter Service-Worker-Wechsel von Produktcache `v3` zu Testfassung `v4` bestanden.
- Sechs aktuelle synthetische Desktop-/Mobilaufnahmen visuell geprüft.
- Dokumentationsprüfung: 168 Dateien, 69 Markdowndateien und 227 lokale Links, 0 Fehler.
- `git diff --check`: ohne Befund.

## Nächster Schritt

1. Task-13-Diff unabhängig gegen Brief, Preflight und Bericht prüfen.
2. Anschließend den gesamten Branch funktional und auf Codequalität prüfen.
3. Findings gezielt korrigieren; nur betroffene Prüfungen und bei Codeänderungen die nötigen Gesamtläufe wiederholen.
4. Erst danach einen autorisierten Push durchführen und lokalen HEAD mit `git ls-remote origin refs/heads/codex/vokabeltrainer-v1` vergleichen.
5. Später die [Geräte-Prüfliste](../GERAETE-ABNAHME.md) mit synthetischen Daten auf echten Geräten ausführen.

## Offen und nicht behauptet

- Produktabgleich mit echtem Google Drive auf zwei physischen Geräten,
- Safari und Home-Bildschirm-App auf echtem iPhone und iPad,
- Verhalten der iOS-Tastatur, Fokus, Offline-Neustart und erneutes Google-Verbinden auf diesen Geräten,
- belastbare Mindestversionen für Browser und Betriebssystem,
- autorisierte HTTPS-Bereitstellung oder öffentliche URL,
- allgemeine Lizenzentscheidung oder Änderung der Repository-Sichtbarkeit.

Keine echten Profile, PINs, Tokens oder Google-Inhalte wurden in Tests, Screenshots oder Dokumentation übernommen. Für die reale Abnahme nur synthetische Vokabeln und Profile verwenden.
