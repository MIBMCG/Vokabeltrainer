# B1: kompatible Datenverträge und verlustfreier Übergang

Stand: 19.09.2026. Umsetzung: GPT-6 Astra / high. Basis `9277a02c938bf0d88a03f43c866138e39fe28953`, Produktcommit `36335b98cd4fd2c71bb904f88dc4907ae3c7bf78`, gezielte Korrektur `f6d61580f84fb08f6c1b74f04322ec9a1881ffb8`. Die [unabhängige Nachprüfung](2026-09-19-b1-review.md) durch GPT-5.6 Sol / high hat die Korrektur freigegeben; keine offenen Befunde. B1 ist abgeschlossen, B2 kann darauf aufbauen.

## Ergebnis

Die neue App liest die Versionspaare (1,1) und (2,2). Neue Objekte verwenden v2; vorhandene v1-Ereignisse, Pakete, ausstehende Übertragungsbodys und ihre Hashwerte bleiben unverändert. Neue Verträge ergänzen Regeln je Kind, Wiederaktivierungsreferenzen sowie Regeln und Wortgenerationen einer Runde. Abhängigkeiten in Sicherungen unterscheiden wirksame Ereignisse von bloßer Unterstützung.

Die lokale Umstellung validiert den ursprünglichen Zustand einschließlich Sicherungshashes, erzeugt eine echte v1-Fachsicherung und speichert den vollständig geprüften v2-Zustand atomar. Bei mehreren widersprüchlichen Ständen entsteht je Stand eine Sicherung aus demselben unveränderten Original. Alle Stände bleiben erhalten; die bestehende ausdrückliche Konfliktauflösung bleibt erreichbar. Ein Fehler erhält den ursprünglichen Speicher. Offene Aufgaben, Rückmeldungen, Pausen, Übertragungen und PIN-Verifier bleiben erhalten. Eine erneute Öffnung migriert nicht nochmals.

Der neue reguläre Drive-Abgleich erkennt unbekannte Versionen vor Schreibvorgängen, auch bei verwaisten Snapshotteilen oder inzwischen veränderten bekannten Dateien. Die Reviewkorrektur unterscheidet gewöhnlich beschädigte Header (`invalid`) von vorhandenen wohlgeformten unbekannten Versionspaaren (`version`). Nur letztere sperren unabhängige lokale Uploads. Ein beschädigtes frühes Ereignis verdeckt kein späteres Zukunftsereignis im selben Paket. Der eingefrorene Altclient lehnt v2 ab, kann zuvor aber noch eigene alte Antworten hochladen. Die neue App übernimmt diese genau einmal; es gibt keine behauptete Fernsperre alter Apps.

B1 arbeitet weiterhin mit der bisherigen Lernplanung. Konfigurierbare Wiederholung folgt in B2. Punkte, Abzeichen, Datenbankname und lebenslange Schreibsperre sind unverändert. Der erste Produktcommit nutzte Cache v13 / synthetisch v14; die nachgeprüfte Korrektur nutzt v14 / synthetisch v15.

## Unveränderte Altquellen

Die 15 benötigten Originaldateien aus `cc079cbea31d6d834b7d8eba1920486daddb4e90` umfassen 173568 Bytes. Sie liegen unter [tests/compat/v1](../../tests/compat/v1/README.md), einschließlich Herkunft und SHA256-Manifest. Der Test prüft alle Originalbytes bei jedem Lauf; zur Laufzeit sind weder Git noch Netz erforderlich. Der Controller hat Dateilängen und Hashwerte zusätzlich gegen sein vor Implementierung erstelltes Manifest geprüft: [unabhängiger Beleg](2026-09-19-v1-fixture-verification.json). Die benötigten Driveadapter werden injiziert; die unveränderte Importmenge benötigt keine weiteren Drive-Module.

## Tatsächliche Prüfungen

Node 22.23.2, Playwright 1.62.1, Edge 153.0.4234.48. Alle Browserdaten sind synthetisch; Server auf freien Ports. Lokale Runtime-Overrides sind gemäß [Browseranleitung](../../tests/browser/README.md) gesetzt. Die folgenden tatsächlich ausgeführten Befehle sind ohne arbeitsplatzspezifische Ausgabeumleitungen wiedergegeben.

```sh
npm test
node --test --experimental-test-isolation=none tests/browser/trainer.browser.mjs
npm run check:docs
git diff --check
git diff --cached --check
```

| Abschlussprüfung | Ergebnis |
| --- | --- |
| Node-Gesamtlauf | 309 Tests, 309 bestanden, 0 Fehler, 0 übersprungen; 11185.8775 ms; Exit 0 |
| Trainer-Browserregression | 16 Tests, 16 bestanden, 0 Fehler, 0 übersprungen; 82912.127 ms; Exit 0 |
| Dokumentprüfung vor Produktcommit | 312 Dateien, 93 Markdown-Dateien, 413 lokale Links, keine Fehler |
| Beide Git-Diffprüfungen | keine Ausgabe, keine Fehler |

Die Browserregression enthält einen mit unveränderten v1-Commands erzeugten echten IndexedDB-Zustand, eine offene Feedbackrunde, persistierte Umstellung und Wiederöffnung, einen sichtbaren unbekannten Store ohne Rücksetzung, Import/Wiederherstellung, Offline-Neustart und kontrolliertes Update. Der erste Browserlauf war 15/16: eine veraltete Erwartung für den geänderten Versionstext wurde korrigiert. Der finale Lauf oben enthält die Korrektur. Ein anfänglicher Sandbox-Startfehler wurde über den genehmigten Prüfweg behoben; er war kein Produktfehler.

Die erste bereinigte RED-Runde mit `policies.test.js`, `packets.test.js`, `backup.test.js` und `migration.test.js` hatte 17 Tests, davon sechs erwartete Produktfehler; danach bestanden 17/17. Weitere gezielte RED/GREEN-Fälle decken Vorschautexte, v1-Sicherung im neuen v2-Bestand, beschädigte Sicherungen und Snapshots, geänderte bekannte Cloud-Dateien und inkonsistente lokale Aufgaben-/Kandidatengenerationen ab. Der abschließende lokale Vertragstest bestand 36/36. Die Komplettsuite wurde nach den letzten Produktkorrekturen erneut ausgeführt.

## Gezielte Reviewkorrektur

Der Originalbefund wurde mit 13 erwarteten Fehlschlägen reproduziert. Ein zusätzlicher echter RED-Fall zeigte ein verdecktes zukünftiges Ereignis nach einem beschädigten Ereignis. Der gemeinsame Versionshelfer prüft nun Struktur zuerst und gibt in einem Container echten unbekannten Versionen Vorrang. Ein defekter gebundener Datensatzdescriptor bleibt weiterhin ein Fehler vor dem eigentlichen Abgleich; die unabhängigen Uploadfälle betreffen gewöhnliche appmarkierte Fremddateien.

Nach dem letzten Produktfix liefen:

```sh
node --test --experimental-test-isolation=none tests/trainer/packets.test.js tests/trainer/sync.test.js tests/trainer/migration.test.js
npm test
node --test --experimental-test-isolation=none --test-name-pattern='B1 browser|trainer sync and restore exposes deliberate|trainer offline' tests/browser/trainer.browser.mjs
git diff --check
git diff --cached --check
```

- Gezielte Paket-/Sync-/Migrationsfälle: 55/55 bestanden, 0 Fehler/Abbrüche/übersprungene Tests, 1956.4874 ms, Exit 0.
- Vollständige Node-Suite: 324/324 bestanden, 0 Fehler/Abbrüche/übersprungene Tests, 13495.0938 ms, Exit 0.
- Vier betroffene Browserfälle: 4/4 bestanden, 0 Fehler/Abbrüche/übersprungene Tests, 26018.4723 ms, Exit 0. Migration/Storeversion, Sync/Import/Restore, Offline-Neustart und Update sind enthalten.
- Beide Git-Prüfungen ohne Ausgabe/Fehler. Aktueller Produktcache v14, synthetischer Updateworker v15.

Die unveränderte gesamte Browserdatei wurde nicht redundant wiederholt; der frühere 16/16-Lauf ist oben ausdrücklich vom Fixlauf getrennt.

## Grenzen

Keine reale Produktanmeldung bei Google, keine physische iOS-/Safari-/Home-Bildschirm- oder Zwei-Geräte-Abnahme. Keine persönlichen Browserdaten, Konten, Ursprünge oder Hostingkonfiguration geändert. Der [Datenvertrag](../PRODUKT-DATENFORMAT.md) beschreibt den aktuellen B1-Stand; Scheduler und Elternaktionen aus B2/B3 sind separate Aufgaben.
