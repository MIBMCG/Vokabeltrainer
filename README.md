# Vokabeltrainer

Ein geplanter Deutsch-Englisch-Vokabeltrainer für Kinder von **10 bis 13 Jahren, Klasse 4 bis 7**. Er soll auf aktuellen Smartphones, Tablets und Computern funktionieren; **iPhone und iPad haben Vorrang**.

**Stand: 16. September 2026 — Anforderungen und technische Vorbereitung. Es gibt noch keine ausführbare Anwendung.** Dieses Repository enthält die Projektgrundlagen für die Weiterarbeit durch Menschen und unterschiedliche KI-Systeme.

## Geplanter Lernablauf

1. Ein deutsches Wort erscheint.
2. Das Kind schreibt die englische Übersetzung.
3. Die App zeigt bei einer richtigen Antwort ✅, bei einer falschen Antwort ❌ und die richtige Schreibweise.
4. Mit „Weiter“ folgt das nächste Wort.
5. Nach einem Fehler wird das Wort nach zwei anderen Aufgaben erneut abgefragt. Endet die Runde vorher, bleibt die Wiederholung für später vorgemerkt. Nach drei richtigen Antworten hintereinander pausiert ein Wort für den Rest der laufenden Runde.

Die Auswahlmodi sind „Alle Vokabeln“, „Letzte Vokabeln“ (zuletzt hinzugefügte Lektion) und „Neue Vokabeln“ (vom ausgewählten Kind noch nie geübte Wörter). Gewünscht sind außerdem eine altersgerechte Gestaltung und motivierende Spielelemente; das konkrete Belohnungssystem ist noch offen.

Eine Runde umfasst standardmäßig 10 Antworten, wahlweise 20 oder 30. Wiederholungen zählen mit; ein Fortschrittsbalken zeigt den Stand.

Ist vorher keine passende Aufgabe mehr verfügbar, kann das Kind die Runde beenden oder mit zusätzlichem Wortschatz außerhalb der bisherigen Auswahl fortsetzen. Die geplante Aufgabenzahl und Wiederholungspausen bleiben erhalten.

Die Serie richtiger Antworten wird je Wort und Kind über mehrere Runden gespeichert. Ein Fehler bei diesem Wort setzt dessen Serie auf null; Antworten auf andere Wörter verändern sie nicht.

Nach der Dreierserie ist die erste Wiederholung frühestens am nächsten Tag vorgesehen. Bei weiteren richtigen Antworten folgen Abstände von 3, 7 und 14 Tagen, danach jeweils 14 Tage. Bei einem Fehler wird das Wort wieder häufiger geübt.

## Vereinbarte Richtung

- Installierbare Web-App (PWA) auf Grundlage von HTML, CSS und JavaScript.
- Google Drive als gemeinsamer Speicher für den automatischen Austausch.
- Ein gemeinsamer Google-Zugang, den die Eltern auf Eltern- und Schülergerät einrichten.
- Eigene Lernprofile innerhalb der App mit getrennten Lernständen.
- Eine Erwachsenenansicht zum Ergänzen und Verwalten von Vokabeln und zum Einsehen des Lernfortschritts.
- JSON als besprochene Grundlage für strukturierte Daten; das genaue Schema ist noch nicht festgelegt.
- Keine zusätzlichen kostenpflichtigen Cloudabos. Die vorhandene Google-Drive-Kapazität soll ausreichen.
- Offline üben und Änderungen später abgleichen als besprochene technische Arbeitsbasis.

Die vollständige Unterscheidung zwischen Nutzerentscheidungen, Vorschlägen und offenen Fragen steht in den [Anforderungen](docs/ANFORDERUNGEN.md).

## Was „automatisch“ bedeutet

Geplant ist ein selbstständiger Datenabgleich bei geöffneter App, vorhandener Internetverbindung und gültigem Google-Zugriff. Eine lokale Datei aus der iOS-Dateien-App auszuwählen ersetzt diese Verbindung nicht.

Bei Googles direkter Browseranbindung laufen Zugriffstokens ab. Eine erneute Nutzeraktion, etwa „Mit Google verbinden“, kann nötig sein. Ein einmaliger Login mit unbegrenzt stillem Abgleich und dauerhafter Synchronisation bei geschlossener iOS-App ist **nicht zugesagt**. Der tatsächliche Komfort muss früh auf einem echten iPhone geprüft werden. Siehe [Google-Drive-Einrichtung](docs/GOOGLE-DRIVE-EINRICHTUNG.md).

## Einstieg für Menschen und KIs

1. [START-HIER.md](START-HIER.md): Einstieg auf einem anderen Gerät oder mit einer anderen KI.
2. [AGENTS.md](AGENTS.md): Regeln für die Mitarbeit im Repository.
3. [ARBEITSSTAND.md](ARBEITSSTAND.md): aktueller Stand und nächster Schritt.
4. [Anforderungen](docs/ANFORDERUNGEN.md): bestätigte Wünsche und offene Produktentscheidungen.
5. [Architektur](docs/ARCHITEKTUR.md): technischer Entwurf und Grenzen.
6. [Roadmap](docs/ROADMAP.md): Reihenfolge der nächsten Arbeitspakete.

Weitere Dokumente:

- [Google-Drive-Einrichtung](docs/GOOGLE-DRIVE-EINRICHTUNG.md)
- [Qualität und Abnahme](docs/QUALITAET-UND-ABNAHME.md)
- [Technische Quellen](docs/QUELLEN.md)
- [Übergabe vom 16.09.2026](docs/handoffs/2026-09-16-projektstart.md)
- [Prüfbericht der Dokumentation](docs/reports/2026-09-16-dokumentation.md)

## Repository auf einem neuen System öffnen

Git muss installiert sein. In einem gewünschten übergeordneten Ordner:

```sh
git clone https://github.com/MIBMCG/Vokabeltrainer.git
cd Vokabeltrainer
git status --short --branch
git log -5 --oneline
```

Danach mit `START-HIER.md` beginnen. Zum Lesen dieser Dokumentation werden weder Node.js noch Python noch ein KI-Anbieter benötigt. Es gibt noch keine Installations-, Build- oder Testbefehle für die App; insbesondere noch kein `package.json` und kein `npm test`.

## Bereitstellung und Kosten

GitHub Pages ist als kostenloser Hostingweg für die Programmdateien vorgeschlagen. Pages ist noch nicht eingerichtet; es gibt noch keine veröffentlichte Trainer-URL. Lernstände und Google-Zugangsdaten gehören nicht in das GitHub-Repository.

Die Google-Drive-Nutzung ist für den erwarteten privaten Umfang innerhalb der derzeitigen kostenlosen API-Limits vorgesehen. Eine Registrierung der App in einem Google-Cloud-Projekt ist erforderlich; ein kostenpflichtiger Server oder eine zusätzliche Datenbank ist dafür nicht vorgesehen. Quellen und Stand: [QUELLEN.md](docs/QUELLEN.md).

## Lizenz

Eine Lizenz wurde noch nicht ausgewählt. Die öffentliche Sichtbarkeit des Repositorys ist keine Entscheidung für eine Open-Source-Lizenz. Vor einer entsprechenden Weitergabe muss die Lizenzfrage geklärt werden.
