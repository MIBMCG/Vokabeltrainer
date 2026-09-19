# Umsetzung der freigegebenen Überarbeitung

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking in the linked sub-plans.

**Goal:** Die freigegebene Verbesserung von Bildwelt, Einrichtung, Bedienung, Lernregeln und Statistik vollständig und ohne Verlust vorhandener Lerndaten umsetzen.

**Architecture:** Bestehende Web-App schrittweise weiterentwickeln, gemeinsame fachliche Auswahl und effektive Ereignisse wiederverwenden. Alte Datenformate unverändert lesen, neue Rundenregeln versioniert ergänzen. Drei verknüpfte Teilpläne liefern konkrete Aufgaben und Prüfnachweise.

**Tech Stack:** HTML/CSS, ES-Module, Node >=22.8.0, IndexedDB, bestehendes Playwright, eingebaute Bildgenerierung, WebP/PNG; keine neue Produktionsabhängigkeit.

**Spec:** [Bestätigter Überarbeitungsentwurf](../../design/2026-09-19-ueberarbeitung.md).

Stand: 19.09.2026. Der Nutzer hat den [schriftlichen Entwurf](../../design/2026-09-19-ueberarbeitung.md) mit „Ja, Freigabe erteilt“ bestätigt. Diese Pläne konkretisieren die Umsetzung; sie sind noch nicht ausgeführt.

## Global Constraints

Zielgruppe 10–13 Jahre; iOS/iPadOS priorisieren. Vier Hauttöne, sechs Kleidungsfarben, sechs Ausrüstungsteile, drei Inseln und 15 Etappen erhalten. Punkte 10/20 ohne Fehlerabzug. Gemeinsames Google-Konto mit getrennten Profilen und Regeln je Kind; kein zusätzliches Cloudabo. Persönliche Browserdaten, Token und PIN nicht verwenden oder veröffentlichen. Die verbindlichen Bereichsgrenzen stehen zusätzlich in jedem Teilplan.

## Review Focus

1. Ungecachtes großes Bild offline: nutzbare Grundauflösung statt leerer Bildfläche (A1, C2).
2. Gespeicherte Google-ID und vorbereitete App weichen ab: bestehende Bindung erhalten (A3).
3. Hintergrundabgleich bei offener Bearbeitung: Eingaben und ursprüngliche Revisionsbasis erhalten (A4, B3).
4. Neue Regeln/Reset bei alter offener Runde und spätem Upload: alter Rundenvertrag, neue Serie und unveränderte Punkte bleiben konsistent (B1/B2, C2).
5. Doppelte/unterstützende/historische Antworten: fachlich zutreffende, je Kind getrennte Diagramme (C1).

## Drei prüfbare Etappen

| Reihenfolge | Plan | Ergebnis | Aufgaben |
| --- | --- | --- | --- |
| A | [Bilder und Bedienung](2026-09-19-ueberarbeitung-a-oberflaeche.md) | Echte Rasterillustrationen, bessere Bildschirmgestaltung, verständliche Moduswahl, vorbereitete Google-Konfiguration und einfache Verwaltung | A1–A4 |
| B | [Lernregeln und Kompatibilität](2026-09-19-ueberarbeitung-b-lernregeln.md) | Verlustfreier Versionsübergang, Regeln je Kind, geschützte laufende Runden und Wiederaktivierung | B1–B3 |
| C | [Statistik und Abschluss](2026-09-19-ueberarbeitung-c-abschluss.md) | Nachvollziehbare Diagramme, visuelle Prüfung, Regression, Dokumentation und überprüfter GitHub-Stand | C1–C2 |

Die Reihenfolge priorisiert das Hauptanliegen des Nutzers: sichtbare Qualität und leichte Bedienung. Die Grenzen zwischen den Plänen sind keine automatischen Gesprächspausen. Nach Freigabe des Plans und Wahl der Ausführung die autorisierten Aufgaben fortlaufend bearbeiten. Nur neue wesentliche Produktfragen, nicht routinemäßige Implementierungsentscheidungen, erneut klären.

## Gemeinsame Ausführungsregeln

- Ausgangsbranch `codex/vokabeltrainer-v1`, letzter Produktcode `cc079cb`, letzter Dokumentationsstand vor Planung `e035093`. Bei Ausführung HEAD, Remote und lokale Änderungen erneut prüfen.
- Der vorhandene benannte Worktree `.worktrees/drive-probe` ist bereits isoliert. Keine zweite Kopie ohne Bedarf, kein Merge nach `main`, kein Force-Push, kein Hosting oder Google-Kontenumbau.
- Ein Produkt-Schreiber gleichzeitig. Parallel möglich: klar begrenzte Lesereview oder Bildgenerierung ohne dieselben Dateien zu ändern. Keine gleichzeitigen Schreiber in `commands.js`, `schema.js`, `adult.js`, `styles.css`, Serverroute oder Service Worker.
- Modellvorschlag bei Subagentenausführung: GPT-5.6 Sol/high für A1–A4 und C1; GPT-6 Astra/high für B1/B2, Vertragsreview und Abschlussreview; B3 Sol/high nach festem Vertrag. Bildgenerierung über das eingebaute Bildwerkzeug, kein zusätzlicher API-Kauf. Modelle bei tatsächlicher Delegation benennen.
- Jede Aufgabe erhält ihre passenden RED/GREEN-Prüfungen, einen kleinen Commit und bei gewählter Subagentenausführung eine unabhängige Review. Rein visuelle Assetarbeit braucht visuelle Prüfung, keine künstlichen Unit-Tests für Farben oder Pixelkoordinaten.
- Kein Öffnen oder Umstellen persönlicher Browserdaten, kein Beenden des persönlichen Servers auf 4173. Testserver auf freien lokalen Ports und synthetische Kontexte verwenden.
- Neue Produktdateien in der expliziten Serverliste und im Offlinekonzept ergänzen. Cachekennung bei ausgelieferten Änderungen erhöhen, Browserharness auf echten Cachemarker und abweichende synthetische Updateversion abstimmen.
- Keine Produktänderung aus diesen Plänen ohne vorherige Planprüfung. Danach keine pauschalen Zwischenfreigaben pro Aufgabe.

## Nachweise und Befehle

Node ab 22.8.0; `npm test` nutzt nur integrierte Node-Werkzeuge. Zusätzliche Browser-/Bildaufbereitung nutzt das bereits eingeführte Playwright, ohne Produktionsabhängigkeit. Die [Browseranleitung](../../../tests/browser/README.md) nennt die einmalige Installation und optionalen `PLAYWRIGHT_MODULE`-/`BROWSER_EXECUTABLE`-Overrides; keine Arbeitsplatzpfade als Voraussetzung einbauen.

```sh
npm test
node --test tests/browser/trainer.browser.mjs
node --test tests/browser/overhaul.browser.mjs
npm run check:docs
git diff --check
```

`overhaul.browser.mjs` wird in A1 angelegt; der Befehl wird erst danach ausgeführt und niemals rückwirkend als bestanden ausgegeben. Die unveränderte technische Probe braucht nur bei tatsächlicher Änderung ihrer gemeinsamen Abhängigkeiten einen zusätzlichen Lauf. Vollständige Suites nach relevantem letzten Produktfix, nicht nach jedem Dokumentationssatz wiederholen.

## Selbstprüfung des Plans

| Spezifikation | Umsetzung / Nachweis |
| --- | --- |
| U01/U02 Konzeptnähe, Rasterbilder und Auflösungen | A1, A2; echte Ansichten und Offline-Bildwechsel; C2 visueller Vergleich |
| U03 einfacher Google-Zugang | A3; vorkonfiguriert, Alt-ID erhalten, Abbruch/Wiederverbinden, kein automatischer Bestandswechsel |
| U04 erklärte Modi | A2; eine Auswahl/ein Start, Wortanzahlen aus gemeinsamer Auswahlfunktion; B2 erweitert diese Funktion um Regeln |
| U05 Regeln je Kind | B1–B3; alte Daten und laufende Runden, unveränderte Belohnungen, Vorschau, Wiederaktivierung |
| U06 Vokabelverwaltung | A4; Suche, Filter, neuer Lektionsablauf, Importkorrektur, Zuordnung, Entwurfsschutz |
| U07 Statistik | C1; effektive deduplizierte Ereignisse, disjunkte Wortgruppen, Nullwerte, lesbare Tabellen |
| Keine unbeauftragten Kosten/Kontenänderungen/Publikation | Alle Pläne; A3 trennt App-Konfiguration von externer Vorbereitung |
| Physische Geräteabnahme getrennt | C2 berichtet Simulator-/Desktopgrenzen ausdrücklich |

Die geplanten Schnittstellen werden unten in den Teilplänen einmal definiert und von späteren Aufgaben mit identischen Namen konsumiert. B1 und B2 sind bewusst eigene Reviewgrenzen: ein korrekt transportiertes neues Format beweist noch keine korrekte Lernplanung.
