# Vokabeltrainer

Ein Deutsch-Englisch-Vokabeltrainer für Kinder von **10 bis 13 Jahren, Klasse 4 bis 7**. Die Web-App ist für Smartphones, Tablets und Computer gestaltet; **iPhone und iPad haben Vorrang**.

**Stand: 18. September 2026 — Version 1 ist implementiert und automatisiert geprüft.** Lernkern, lokale Speicherung, Erwachsenenverwaltung, Übungsbildschirm, Inselreise, Avatar, unveränderlicher Drive-Abgleich, Sicherung/Wiederherstellung und Offline-PWA sind vorhanden. Der [v1-Abschlussbericht](docs/reports/2026-09-18-vokabeltrainer-v1.md) trennt automatisierte Nachweise von den noch offenen echten Prüfungen mit Produktdatenformat, zwei physischen Geräten, Safari/Home-Bildschirm und einer später autorisierten HTTPS-Bereitstellung. Es gibt weiterhin keine veröffentlichte Trainer-URL. Details stehen in [ARBEITSSTAND.md](ARBEITSSTAND.md).

Eine [Gestaltungsvorschau mit Startseite, Übung und Inselreise](docs/design/2026-09-17-insel-konzept.md) zeigt die vorgeschlagene Optik. Das Bild ist kein Screenshot einer fertigen App.

Die inzwischen implementierte Inselreise und den Avatar zeigen die [tatsächlichen Browseransichten vom 18.09.2026](docs/reports/2026-09-18-inselreise-avatar.md).

## Lernablauf

1. Ein deutsches Wort erscheint.
2. Das Kind schreibt die englische Übersetzung.
3. Die App zeigt bei einer richtigen Antwort ✅, bei einer falschen Antwort ❌ und die richtige Schreibweise.
4. Mit „Weiter“ folgt das nächste Wort.
5. Nach einem Fehler wird das Wort nach zwei anderen Aufgaben erneut abgefragt. Endet die Runde vorher, bleibt die Wiederholung für später vorgemerkt. Nach drei richtigen Antworten hintereinander pausiert ein Wort für den Rest der laufenden Runde.

Die Auswahlmodi sind „Alle Vokabeln“, „Letzte Vokabeln“ (zuletzt hinzugefügte Lektion) und „Neue Vokabeln“ (vom ausgewählten Kind noch nie geübte Wörter). Die erste Version verbindet Lernreise/Landkarte, Punkte/Level/Abzeichen und einen einfachen gestaltbaren Avatar mit wenigen Farben und Zubehörteilen. Thema ist ein Insel-Abenteuer mit Wäldern, Stränden und Bergen. Drei Inseln, 200 Punkte je Level sowie konkrete Abzeichen und Zubehör sind umgesetzt.

Jede richtige Antwort bringt 10 Punkte, auch bei einer späteren Wiederholung eines zuvor falsch beantworteten Wortes. Eine abgeschlossene Runde bringt zusätzlich 20 Punkte. Fehler führen zu keinem Punktabzug.

Gesammelte Punkte erhöhen das Level. An Level-Meilensteinen werden Reiseabschnitte und Avatar-Ausstattung automatisch freigeschaltet; bereits freigeschaltete Ausstattung bleibt frei auswählbar. Für erreichte Meilensteine gibt es Abzeichen.

Eine Runde umfasst standardmäßig 10 Antworten, wahlweise 20 oder 30. Wiederholungen zählen mit; ein Fortschrittsbalken zeigt den Stand.

Unterbrochene Runden werden auf dem jeweiligen Gerät gespeichert. Beim nächsten Öffnen kann das Kind fortsetzen oder neu beginnen. Bereits gewertete Antworten und Antwortpunkte bleiben erhalten; für das bloße Unterbrechen oder Aufgeben gibt es keinen Abschlussbonus.

Ist vorher keine passende Aufgabe mehr verfügbar, kann das Kind die Runde beenden oder mit zusätzlichem Wortschatz außerhalb der bisherigen Auswahl fortsetzen. Die geplante Aufgabenzahl und Wiederholungspausen bleiben erhalten.

Die Serie richtiger Antworten wird je Wort und Kind über mehrere Runden gespeichert. Ein Fehler bei diesem Wort setzt dessen Serie auf null; Antworten auf andere Wörter verändern sie nicht.

Nach der Dreierserie ist die erste Wiederholung frühestens am nächsten Tag vorgesehen. Bei weiteren richtigen Antworten folgen Abstände von 3, 7 und 14 Tagen, danach jeweils 14 Tage. Bei einem Fehler wird das Wort wieder häufiger geübt.

Bei der Bewertung werden Groß-/Kleinschreibung und äußere Leerzeichen ignoriert. Echte Buchstabenfehler bleiben falsch; die korrekte Schreibweise wird angezeigt.

Eltern oder Lehrkräfte können pro Vokabel mehrere gültige Antworten eintragen. Jede hinterlegte Übersetzung oder Schreibvariante wird akzeptiert.

Neue Wörter lassen sich einzeln eingeben oder als Tabellenzeilen mit den Spalten Deutsch und Englisch kopieren und einfügen, beispielsweise aus Excel. Sie werden einer vorhandenen oder neu angelegten Lektion zugeordnet. Ein direkter Excel-/CSV-Dateiimport ist für die erste Version nicht vorgesehen.

Erwachsene ordnen jede Lektion einem oder mehreren Kindern zu. Alle drei Übungsmodi berücksichtigen nur die dem jeweiligen Kind zugeordneten Lektionen. Auch beim Fortsetzen mit zusätzlichem Wortschatz gilt diese Zuordnung. Lernstände, Punkte und Avatar bleiben pro Kind getrennt.

Im Erwachsenenbereich ist eine vollständige Sicherung als JSON-Datei umgesetzt: Wortschatz, Lektionen, Zuordnungen, Profile, Lernstände und Belohnungsfortschritt lassen sich herunterladen und bei Bedarf wiederherstellen. Vor der Wiederherstellung werden eine Vorschau und Bestätigung angezeigt.

Vor einer Wiederherstellung sichert die App den aktuellen Stand automatisch separat. Danach ersetzt der ausgewählte Sicherungsstand den aktiven Bestand, auch über Google Drive auf verbundenen Geräten. Der vorherige Stand bleibt zurückholbar. Verspätete Offlineantworten bleiben getrennt erhalten und können bewusst übernommen werden.

## Vereinbarte Richtung

- Installierbare Web-App (PWA) auf Grundlage von HTML, CSS und JavaScript.
- Google Drive als gemeinsamer Speicher für den automatischen Austausch.
- Ein gemeinsamer Google-Zugang, den die Eltern auf Eltern- und Schülergerät einrichten.
- Eigene Lernprofile innerhalb der App mit getrennten Lernständen.
- Eine Erwachsenenansicht zum Ergänzen und Verwalten von Vokabeln und zum Einsehen des Lernfortschritts. Sie öffnet sich über „Für Erwachsene“ und eine selbst festgelegte vierstellige PIN als Hürde gegen versehentliche Änderungen.
- JSON als besprochene Grundlage für strukturierte Daten; der [Produkt-Datenvertrag](docs/PRODUKT-DATENFORMAT.md) konkretisiert Ereignisse, lokale Zustände und Sicherungen.
- Keine zusätzlichen kostenpflichtigen Cloudabos. Die vorhandene Google-Drive-Kapazität soll ausreichen.
- Offline üben und Änderungen später abgleichen als besprochene technische Arbeitsbasis.

Die vollständige Unterscheidung zwischen Nutzerentscheidungen, Vorschlägen und offenen Fragen steht in den [Anforderungen](docs/ANFORDERUNGEN.md).

## Was „automatisch“ bedeutet

Die App führt bei geöffneter App, vorhandener Internetverbindung und gültigem Google-Zugriff einen selbstständigen Datenabgleich aus. Eine lokale Datei aus der iOS-Dateien-App auszuwählen ersetzt diese Verbindung nicht.

Erneutes Verbinden mit Google bei Bedarf ist grundsätzlich akzeptiert. Währenddessen soll mit bereits gespeicherten Vokabeln offline weitergeübt werden können; die Ergebnisse werden lokal erhalten und nach erneuter Verbindung automatisch abgeglichen.

Bei widersprüchlichen Änderungen derselben Vokabel bleiben beide Fassungen erhalten. Die Erwachsenenansicht zeigt den Unterschied und lässt die richtige Fassung auswählen. Übungsergebnisse beider Geräte werden ohne doppelte Wertung zusammengeführt.

Bei Googles direkter Browseranbindung laufen Zugriffstokens ab. Eine erneute Nutzeraktion, etwa „Mit Google verbinden“, kann nötig sein. Ein einmaliger Login mit unbegrenzt stillem Abgleich und dauerhafter Synchronisation bei geschlossener iOS-App ist **nicht zugesagt**. Der tatsächliche Komfort muss früh auf einem echten iPhone geprüft werden. Siehe [Google-Drive-Einrichtung](docs/GOOGLE-DRIVE-EINRICHTUNG.md).

## Einstieg für Menschen und KIs

1. [START-HIER.md](START-HIER.md): Einstieg auf einem anderen Gerät oder mit einer anderen KI.
2. [AGENTS.md](AGENTS.md): Regeln für die Mitarbeit im Repository.
3. [ARBEITSSTAND.md](ARBEITSSTAND.md): aktueller Stand und nächster Schritt.
4. [Anforderungen](docs/ANFORDERUNGEN.md): bestätigte Wünsche und offene Produktentscheidungen.
5. [Architektur](docs/ARCHITEKTUR.md): technischer Entwurf und Grenzen.
6. [Roadmap](docs/ROADMAP.md): Reihenfolge der nächsten Arbeitspakete.
7. [Bestätigter Gesamtentwurf](docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md): verbindlicher Umfang und Abläufe.
8. [Plan der technischen Probe](docs/superpowers/plans/2026-09-16-google-drive-probe.md) und [Einrichtung/Prüfablauf](docs/GOOGLE-DRIVE-PROBE.md).

Weitere Dokumente:

- [Benutzungsanleitung](docs/BENUTZUNG.md)
- [Spätere Geräteabnahme](docs/GERAETE-ABNAHME.md), noch nicht durchgeführt
- [Vollständiger Umsetzungsplan](docs/superpowers/plans/2026-09-17-vokabeltrainer-v1.md)

- [Google-Drive-Einrichtung](docs/GOOGLE-DRIVE-EINRICHTUNG.md)
- [Qualität und Abnahme](docs/QUALITAET-UND-ABNAHME.md)
- [Technische Quellen](docs/QUELLEN.md)
- [Datenformat der technischen Probe](docs/PROBE-DATENFORMAT.md)
- [Aktuelle v1-Übergabe](docs/handoffs/2026-09-18-vokabeltrainer-v1.md)
- [Prüfbericht der Verbindungsprobe](docs/reports/2026-09-17-google-drive-probe.md)
- [Prüfbericht der Dokumentation](docs/reports/2026-09-16-dokumentation.md)
- [Prüfbericht zum Gesamtentwurf](docs/reports/2026-09-16-gesamtentwurf.md)

## Repository auf einem neuen System öffnen

Git muss installiert sein. In einem gewünschten übergeordneten Ordner:

```sh
git clone https://github.com/MIBMCG/Vokabeltrainer.git
cd Vokabeltrainer
git status --short --branch
git log -5 --oneline
```

Danach den Entwicklungszweig wählen und mit Node.js ab Version 22.8.0 die Tests starten:

```sh
git switch codex/vokabeltrainer-v1
npm test
```

Die Node-Tests benötigen weder npm-Zusatzpakete noch ein Google-Konto oder Internetzugriff. Danach startet `npm start` den lokalen Server auf `http://localhost:4173`: die technische Probe liegt unter `/`, der Trainer unter `/trainer/`. Ein Buildschritt oder Laufzeitpakete sind nicht nötig. Anschließend [START-HIER.md](START-HIER.md) und die [aktuelle Übergabe](docs/handoffs/2026-09-18-vokabeltrainer-v1.md) lesen. Die zusätzliche Browserprüfung und ihre einmalige Playwright-Einrichtung sind in [tests/browser/README.md](tests/browser/README.md) beschrieben.

## Bereitstellung und Kosten

GitHub Pages ist als kostenloser Hostingweg für die Programmdateien vorgeschlagen. Pages ist noch nicht eingerichtet; es gibt noch keine veröffentlichte Trainer-URL. Lernstände und Google-Zugangsdaten gehören nicht in das GitHub-Repository.

Die Google-Drive-Nutzung ist für den erwarteten privaten Umfang innerhalb der derzeitigen kostenlosen API-Limits vorgesehen. Eine Registrierung der App in einem Google-Cloud-Projekt ist erforderlich; ein kostenpflichtiger Server oder eine zusätzliche Datenbank ist dafür nicht vorgesehen. Quellen und Stand: [QUELLEN.md](docs/QUELLEN.md).

## Lizenz

Die allgemeine Lizenzentscheidung wurde bewusst zurückgestellt. Das Projekt wird zunächst für den privaten Einsatz weiterentwickelt; vorerst wird keine allgemeine Open-Source-Freigabe hinzugefügt. Eine spätere allgemeine Lizenzfreigabe ist gesondert abzustimmen.
