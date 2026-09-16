# Arbeitsstand

Stand: **16.09.2026**

## Ergebnis dieses Arbeitspakets

Das Projekt ist als Dokumentationsgrundlage angelegt. README, AGENTS.md, Anforderungen, technischer Entwurf, Google-Einrichtung, Roadmap, Abnahmeplan und eine portable Übergabe sind vorhanden.

Repository: [MIBMCG/Vokabeltrainer](https://github.com/MIBMCG/Vokabeltrainer)

Arbeitsbranch für den Projektstart: `main`. Den aktuellen Commit mit `git log -1 --oneline` feststellen; den aktuellen Remote-Stand bei Wiederaufnahme prüfen.

Aktuelle Übergabe: [2026-09-16-projektstart.md](docs/handoffs/2026-09-16-projektstart.md)

Prüfbericht: [2026-09-16-dokumentation.md](docs/reports/2026-09-16-dokumentation.md)

## Festgelegt

- Zielgruppe: 10–13 Jahre, Klassen 4–7.
- Deutsch anzeigen, Englisch schreiben, ✅/❌ mit Korrektur und „Weiter“.
- Häufigere Wiederholung falscher Wörter, starke Reduktion nach drei richtigen Antworten in Folge.
- Google Drive als gemeinsamer Speicher, keine zusätzlichen kostenpflichtigen Cloudabos.
- Ein gemeinsamer Google-Zugang, eingerichtet durch die Eltern, mit getrennten Lernprofilen in der App.
- Gewünscht: Vokabelverwaltung, Fortschrittsübersicht, die drei genannten Auswahlmodi und Gamification.
- Plattformübergreifende Web-App mit besonderem Augenmerk auf iOS; PWA, Offlinebetrieb und JSON bilden die besprochene Arbeitsbasis.

## Noch nicht vorhanden

- Ausführbarer Trainer, Benutzeroberfläche oder visuelle Vorschau.
- Endgültiges Produktdesign, freigegebener Implementierungsplan oder festes Datenschema.
- Google-Cloud-Projekt, OAuth-Client oder echte Synchronisationsprobe für dieses Projekt.
- Aktiviertes GitHub Pages oder eine laufende Web-App.
- Produkt-, Browser- oder Geräteprüfungen.

## Nächster sinnvoller Schritt

Die Produktabstimmung am Lernablauf fortsetzen: zuerst [Q1 und Q2 in den Anforderungen](docs/ANFORDERUNGEN.md#offene-entscheidungen) klären, also „Letzte Vokabeln“ und „Neue Vokabeln“. Danach Wiederholungsregeln und ein konkretes altersgerechtes Gestaltungskonzept abstimmen.

Vor umfangreicher Umsetzung muss eine frühe technische Probe den Google-Zugang und erneuten Verbindungsaufbau auf echtem iPhone/Safari sowie als Home-Bildschirm-App prüfen. Dafür sind später die nutzerseitige Google-App-Registrierung und Zugang zum Testgerät nötig. Diese Probe ist noch nicht durchgeführt.

## Grenzen des Auftrags

Das aktuelle Arbeitspaket ist die Erstellung und Veröffentlichung der Projektdokumentation. Der Nutzer hat diesen Push ausdrücklich beauftragt. Die in den Dokumenten vorgeschlagenen Details sind noch keine pauschale Freigabe für App-Implementierung, Kontoeinrichtung, kostenpflichtige Dienste oder Deployment.
