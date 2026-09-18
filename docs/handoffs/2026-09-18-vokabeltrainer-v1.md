# Übergabe Vokabeltrainer Version 1

- Stand: 18.09.2026
- Branch: `codex/vokabeltrainer-v1`
- Finaler Produktcode: `cc079cbea31d6d834b7d8eba1920486daddb4e90`
- Fixbericht: `c2560f0`; abschließende Dokumentation folgt in der Git-Historie.
- Letzter vor diesem Abschluss nachgewiesener Remote: `8431786`; Abschluss-Push siehe nachgetragenen Empfangsbeleg.

## Übergebenes Ergebnis

Version 1 ist gemäß R01–R33 und E01–E10 implementiert. Task 13 korrigierte die letzten bekannten Bedienungs- und Textbefunde, machte das Browserharness portabel und ergänzte die Assetliste. Reviewfix-1-Produktcode `11e3128` führt nach einer profilfreien Navigation die gewählte Übungs-/Reise-/Avataransicht fort; damals wechselte der Produktcache zu `v4`; der finale Integrationsfix verwendet `v5`. Der [Abschlussbericht](../reports/2026-09-18-vokabeltrainer-v1.md) enthält Matrix, Taskhistorie, Screenshots und genaue Grenzen.

Die unabhängige Task-13- und Gesamtprüfung einschließlich einmaliger finaler Nachprüfung ist abgeschlossen. Alle vier Integrationsbefunde sind behoben; keine neuen offenen Reviewbefunde. Siehe [Fixbericht](../reports/2026-09-18-vokabeltrainer-v1-final-fixes.md) und [finale Nachprüfung](../reports/2026-09-18-vokabeltrainer-v1-final-fix-review.md). Eine reale Geräte- oder Produkt-Google-Abnahme bleibt offen.

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

- Finaler Produktcode cc079cb: Node.js 22.23.2, **277/277 Tests bestanden**.
- Playwright 1.62.1 mit Edge 153.0.4234.46: **15/15 Trainer-Browsertests bestanden**.
- Vier neue gezielte Browserregressionen: **4/4 bestanden**; vollständiger Trainerlauf danach erneut grün.
- Produktcache v5, synthetischer Updateworker v6. Offline-Neustart bei geschlossenem Server unter Wurzel- und Unterpfad sowie kontrollierter Workerwechsel sind Teil des Gesamtlaufs.
- Unveränderte Drive-Probe: 12/12 Szenarien auf 3b1d16d, keine Seitenfehler; keine unnötige Wiederholung.
- Sechs synthetische Desktop-/Mobilaufnahmen auf 3b1d16d visuell geprüft; sie sind im Abschlussbericht verlinkt.
- Alle vier Befunde der unabhängigen Gesamtprüfung behoben und einmalig unabhängig nachgeprüft. Keine offenen Critical-/Important-/Minor-Befunde im Abschlussreview.
- Abschließende Dokumentprüfung: 175 Dateien, 76 Markdown-Dateien, 347 lokale Links, keine Fehler. `git diff --check` ohne Befund. Der Push wird mit dem Remote verglichen.

Die letzte Korrektur macht PIN-Wiederherstellung auch am gesperrten Zugang verfügbar, erhält ungespeicherte Verwaltungsformulare bei Hintergrundabgleich, startet den Abgleich nach bewusstem Google-Wiederverbinden erneut und schützt offenen Antworttext bei konkurrierenden Wiederherstellungen. Letzterer bleibt nur im Arbeitsspeicher bis zur bewussten Auflösung, nicht über einen Browserneustart.

## Nächster Schritt

Die Umsetzung von Tasks 1–13 und die interne Prüfung sind abgeschlossen. Als Nächstes die [Geräte-Prüfliste](../GERAETE-ABNAHME.md) mit synthetischen Daten auf den Geräten des Freundes durchführen. Eine dafür nötige HTTPS-Bereitstellung erst nach gesondertem Auftrag einrichten. Keine erneute pauschale Entwicklungsfreigabe nötig.

## Nachvollziehbare Entscheidungen

Alle [26 technischen Entscheidungen](../ENTWICKLUNGSENTSCHEIDUNGEN.md) einschließlich Anlass und Folgekosten sind dauerhaft dokumentiert. Die [frühe Prüfhistorie](../reports/history/2026-09-18-tasks-1-6-evidence.md) und die späteren Einzelberichte bleiben erhalten. Ausführende Agenten: GPT-5.6 Sol/high für gewöhnliche Pakete; GPT-6 Astra/high für komplexe Integrationskorrekturen und unabhängige Reviews.

## Offen und nicht behauptet

- Produktabgleich mit echtem Google Drive auf zwei physischen Geräten,
- Safari und Home-Bildschirm-App auf echtem iPhone und iPad,
- Verhalten der iOS-Tastatur, Fokus, Offline-Neustart und erneutes Google-Verbinden auf diesen Geräten,
- belastbare Mindestversionen für Browser und Betriebssystem,
- autorisierte HTTPS-Bereitstellung oder öffentliche URL,
- allgemeine Lizenzentscheidung oder Änderung der Repository-Sichtbarkeit.

Keine echten Profile, PINs, Tokens oder Google-Inhalte wurden in Tests, Screenshots oder Dokumentation übernommen. Für die reale Abnahme nur synthetische Vokabeln und Profile verwenden.
