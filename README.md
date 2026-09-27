# Vokabeltrainer

Ein Deutsch-Englisch-Vokabeltrainer für Kinder von **10 bis 13 Jahren, Klasse 4 bis 7**. Die Web-App ist für Smartphones, Tablets und Computer gestaltet; **iPhone und iPad haben Vorrang**.

**Stand vom 27. September 2026:** Die App verbindet den Vokabeltrainer mit
profilgetrenntem Guthaben, dauerhaften Käufen und den Bereichen „Meine Figur“,
„Entwicklung“ und „Shop“. Vier bestätigte Drachenformen sind integriert.
Die anschließenden Bedienkorrekturen vereinfachen die Erwachsenen-Einstellungen,
übernehmen die gewählte Figur auch beim Üben und führen bei abgelaufener
Google-Verbindung direkt zum Wiederverbinden. Details und aktuelle Prüfbelege:
[Bedienbericht](docs/reports/2026-09-27-bedienkorrekturen.md).
Automatisierte Prüfungen und unabhängige Abschlussreviews sind bestanden.
Prüfbelege, offene Geräteabnahmen und nächste Schritte stehen in
[ARBEITSSTAND.md](ARBEITSSTAND.md) und der
[Übergabe](docs/handoffs/2026-09-27-bedienkorrekturen.md).

Käufe verändern weder Lernpunkte noch Level. Punkte entstehen weiter mit 10
Punkten pro richtiger Antwort und 20 pro abgeschlossener Runde; ausgebbares
Guthaben und Besitz bleiben je Lernprofil getrennt. Die bestätigte Erweiterung
verwendet vier vollständige Entwicklungsformen je Figur und behält die
bisherige Gestaltung im aufklappbaren Bereich „Klassischen Avatar gestalten“.
Die Register „Meine Figur“, „Entwicklung“ und „Shop“ stehen oben im
Avatarbereich. Vier Drachenquellen sind als erste kaufbare Reihe integriert;
**72 weitere Motive**, responsive Produktionsvarianten und die vollständige
Galeriegestaltung bleiben offen. Dazu zählen ein weiter ausgebauter Wechsel
zwischen Klassisch und Entwicklung sowie zusätzliche Fortschrittsdarstellung.

Reale Google-Drive-Prüfung des integrierten Produkts auf zwei physischen
Geräten, iPhone/iPad, Safari, Home-Bildschirm-App und HTTPS-Bereitstellung sind
noch nicht abgenommen. Automatisierte Prüfungen verwenden synthetische Daten.
Der echte [Google-Bericht 10](docs/reports/2026-09-20-shop-v10-reallauf.md)
mit 6/6 Fällen ist ein historischer Nachweis der isolierten Probe und wird
nicht als aktuelle Produkt- oder Geräteabnahme ausgegeben.

## Lernablauf

1. Ein deutsches Wort erscheint.
2. Das Kind schreibt die englische Übersetzung.
3. Die App zeigt bei einer richtigen Antwort ✅, bei einer falschen Antwort ❌ und die richtige Schreibweise.
4. Mit „Weiter“ folgt das nächste Wort.
5. Nach einem Fehler wird das Wort nach zwei anderen Aufgaben erneut abgefragt. Endet die Runde vorher, bleibt die Wiederholung für später vorgemerkt. Mit den Standardregeln pausiert ein Wort nach drei richtigen Antworten hintereinander für den Rest der laufenden Runde; Eltern können diese Schwelle je Kind anpassen.

Die Auswahlmodi sind „Alle Vokabeln“, „Letzte Vokabeln“ (zuletzt hinzugefügte Lektion) und „Neue Vokabeln“ (vom ausgewählten Kind noch nie geübte Wörter). Die erste Version verbindet Lernreise/Landkarte, Punkte/Level/Abzeichen und einen einfachen gestaltbaren Avatar mit wenigen Farben und Zubehörteilen. Thema ist ein Insel-Abenteuer mit Wäldern, Stränden und Bergen. Drei Inseln, 200 Punkte je Level sowie konkrete Abzeichen und Zubehör sind umgesetzt.

Jede richtige Antwort bringt 10 Punkte, auch bei einer späteren Wiederholung eines zuvor falsch beantworteten Wortes. Eine abgeschlossene Runde bringt zusätzlich 20 Punkte. Fehler führen zu keinem Punktabzug.

Gesammelte Punkte erhöhen das Level. An Level-Meilensteinen werden Reiseabschnitte und Avatar-Ausstattung automatisch freigeschaltet; bereits freigeschaltete Ausstattung bleibt frei auswählbar. Für erreichte Meilensteine gibt es Abzeichen.

Eine Runde umfasst standardmäßig 10 Antworten, wahlweise 20 oder 30. Wiederholungen zählen mit; ein Fortschrittsbalken zeigt den Stand.

Unterbrochene Runden werden auf dem jeweiligen Gerät gespeichert. Beim nächsten Öffnen kann das Kind fortsetzen oder neu beginnen. Bereits gewertete Antworten und Antwortpunkte bleiben erhalten; für das bloße Unterbrechen oder Aufgeben gibt es keinen Abschlussbonus.

Ist vorher keine passende Aufgabe mehr verfügbar, kann das Kind die Runde beenden oder mit zusätzlichem Wortschatz außerhalb der bisherigen Auswahl fortsetzen. Die geplante Aufgabenzahl und Wiederholungspausen bleiben erhalten.

Die Serie richtiger Antworten wird je Wort und Kind über mehrere Runden gespeichert. Ein Fehler bei diesem Wort setzt dessen Serie auf null; Antworten auf andere Wörter verändern sie nicht.

Standardmäßig ist nach der Dreierserie die erste Wiederholung frühestens am nächsten Tag vorgesehen. Weitere Abstände sind 3, 7 und 14 Tage, danach jeweils 14 Tage. Unter „Für Erwachsene → Lernregeln“ lassen sich je Kind die Schwelle, die vier Abstände und ein optionaler vollständiger Ausschluss einstellen. Änderungen gelten für die nächste neue Runde; eine laufende Runde behält ihre Regeln. „Wieder üben“ nimmt ausgeschlossene Wörter erneut auf, ohne Antworten oder Punkte zu löschen.

Bei der Bewertung werden Groß-/Kleinschreibung und äußere Leerzeichen ignoriert. Echte Buchstabenfehler bleiben falsch; die korrekte Schreibweise wird angezeigt.

Eltern oder Lehrkräfte können pro Vokabel mehrere gültige Antworten eintragen. Jede hinterlegte Übersetzung oder Schreibvariante wird akzeptiert.

Neue Wörter lassen sich einzeln eingeben oder als Tabellenzeilen mit den Spalten Deutsch und Englisch kopieren und einfügen, beispielsweise aus Excel. Sie werden einer vorhandenen oder neu angelegten Lektion zugeordnet. Ein direkter Excel-/CSV-Dateiimport ist für die erste Version nicht vorgesehen.

Erwachsene ordnen jede Lektion einem oder mehreren Kindern zu. Alle drei Übungsmodi berücksichtigen nur die dem jeweiligen Kind zugeordneten Lektionen. Auch beim Fortsetzen mit zusätzlichem Wortschatz gilt diese Zuordnung. Lernstände, Punkte und Avatar bleiben pro Kind getrennt. Die vier Elternbereiche sind „Vokabeln“, „Lernstand“, „Lernregeln“ und „Einstellungen“. Der Lernstand zeigt Kennzahlen und Tagesbalken für 14 oder 30 Tage sowie die aktuelle Wortverteilung; Tabellen und einzelne Wortdetails ergänzen die Diagramme.

Im Erwachsenenbereich ist eine vollständige Sicherung als JSON-Datei umgesetzt: Wortschatz, Lektionen, Zuordnungen, Profile, Lernstände und Belohnungsfortschritt lassen sich herunterladen und bei Bedarf wiederherstellen. Vor der Wiederherstellung werden eine Vorschau und Bestätigung angezeigt.

Bei einem aktivierten Kaufbestand enthält die Sicherung zusätzlich die
vollständige geprüfte wirtschaftliche Herkunft, Besitz und Figurenauswahl. Sie
enthält keine Google-Tokens, ETags, Pointerdaten oder ausführbaren Kaufaufträge.
Auch nach dem letzten bestätigten Kauf offline erworbene Lernpunkte bleiben über
einen ausschließlich für Quellprovenienz zulässigen Checkpoint belegbar.

Vor einer Wiederherstellung sichert die App den aktuellen Stand automatisch separat. Danach ersetzt der ausgewählte Sicherungsstand den aktiven Bestand, auch über Google Drive auf verbundenen Geräten. Der vorherige Stand bleibt zurückholbar. Verspätete Offlineantworten bleiben getrennt erhalten und können bewusst übernommen werden.

## Vereinbarte Richtung

- Installierbare Web-App (PWA) auf Grundlage von HTML, CSS und JavaScript.
- Google Drive als gemeinsamer Speicher für den automatischen Austausch.
- Ein gemeinsamer Google-Zugang, den die Eltern auf Eltern- und Schülergerät einrichten.
- Eigene Lernprofile innerhalb der App mit getrennten Lernständen.
- Eine Erwachsenenansicht zum Ergänzen und Verwalten von Vokabeln und zum Einsehen des Lernfortschritts. Sie öffnet sich über „Für Erwachsene“ und eine selbst festgelegte vierstellige PIN als Hürde gegen versehentliche Änderungen.
- JSON als besprochene Grundlage für strukturierte Daten; der [Produkt-Datenvertrag](docs/PRODUKT-DATENFORMAT.md) konkretisiert Ereignisse, lokale Zustände und Sicherungen.
- Bestätigte Entwicklungsstufen und weitere Grundfiguren werden mit erspieltem, je Profil getrenntem Guthaben gekauft. Neue Käufe sind nur online nach erfolgreichem Abgleich möglich; vorhandener Besitz bleibt offline nutzbar.
- Keine zusätzlichen kostenpflichtigen Cloudabos. Die vorhandene Google-Drive-Kapazität soll ausreichen.
- Offline üben und Änderungen später abgleichen als besprochene technische Arbeitsbasis.

Die vollständige Unterscheidung zwischen Nutzerentscheidungen, Vorschlägen und offenen Fragen steht in den [Anforderungen](docs/ANFORDERUNGEN.md).

## Was „automatisch“ bedeutet

Die App führt bei geöffneter App, vorhandener Internetverbindung und gültigem Google-Zugriff einen selbstständigen Datenabgleich aus. Eine lokale Datei aus der iOS-Dateien-App auszuwählen ersetzt diese Verbindung nicht.

Der öffentliche Google-Zugang ist zentral in der App vorbereitet. Familien melden sich bei Google an und wählen ihren vorhandenen Trainerbestand; einen neuen Bestand legen sie bewusst an. Eine eigene Client-ID oder Cloud-Console-Einrichtung ist im normalen Familienablauf nicht nötig. Eine bereits gespeicherte Konfiguration und Bestandsbindung werden erhalten. Betreiberaufgaben für eine spätere öffentliche App-Adresse stehen getrennt in der [Google-Anleitung](docs/GOOGLE-DRIVE-EINRICHTUNG.md).

Erneutes Verbinden mit Google bei Bedarf ist grundsätzlich akzeptiert. Währenddessen soll mit bereits gespeicherten Vokabeln offline weitergeübt werden können; die Ergebnisse werden lokal erhalten und nach erneuter Verbindung automatisch abgeglichen.

Bei widersprüchlichen Änderungen derselben Vokabel bleiben beide Fassungen erhalten. Die Erwachsenenansicht zeigt den Unterschied und lässt die richtige Fassung auswählen. Übungsergebnisse beider Geräte werden ohne doppelte Wertung zusammengeführt.

Bei Googles direkter Browseranbindung laufen Zugriffstokens ab. Eine erneute Nutzeraktion, etwa „Mit Google verbinden“, kann nötig sein. Ein einmaliger Login mit unbegrenzt stillem Abgleich und dauerhafter Synchronisation bei geschlossener iOS-App ist **nicht zugesagt**. Der tatsächliche Komfort muss früh auf einem echten iPhone geprüft werden. Siehe [Google-Drive-Einrichtung](docs/GOOGLE-DRIVE-EINRICHTUNG.md).

## Einstieg für Menschen und KIs

1. [START-HIER.md](START-HIER.md): Einstieg auf einem anderen Gerät oder mit einer anderen KI.
2. [AGENTS.md](AGENTS.md): Regeln für die Mitarbeit im Repository.
3. [ARBEITSSTAND.md](ARBEITSSTAND.md): aktueller Stand und nächster Schritt.
4. [Abschlussübergabe](docs/handoffs/2026-09-27-bedienkorrekturen.md): Branch, Commit, Prüfungen und offene Grenzen.
5. [Anforderungen](docs/ANFORDERUNGEN.md): bestätigte Wünsche und offene Produktentscheidungen.
6. [Architektur](docs/ARCHITEKTUR.md), [Produkt-Datenvertrag](docs/PRODUKT-DATENFORMAT.md) und [Kaufprotokoll](docs/KAUFPROTOKOLL.md): tatsächliche technische Verträge.
7. [Plan für dauerhafte Käufe](docs/superpowers/plans/2026-09-20-persistent-purchases.md): Arbeitspakete und Prüfgrenzen.

Weitere Dokumente:

- [Benutzungsanleitung](docs/BENUTZUNG.md)
- [Spätere Geräteabnahme](docs/GERAETE-ABNAHME.md), noch nicht durchgeführt
- [Vollständiger Umsetzungsplan](docs/superpowers/plans/2026-09-17-vokabeltrainer-v1.md)

- [Google-Drive-Einrichtung](docs/GOOGLE-DRIVE-EINRICHTUNG.md)
- [Qualität und Abnahme](docs/QUALITAET-UND-ABNAHME.md)
- [Technische Quellen](docs/QUELLEN.md)
- [Datenformat der technischen Probe](docs/PROBE-DATENFORMAT.md)
- [Historische Übergabe der Überarbeitung](docs/handoffs/2026-09-19-ueberarbeitung.md)
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

Die Node-Tests benötigen weder npm-Zusatzpakete noch ein Google-Konto oder Internetzugriff. Danach startet `npm start` den lokalen Server auf `http://localhost:4173`: die technische Probe liegt unter `/`, der Trainer unter `/trainer/`. Ein Buildschritt oder Laufzeitpakete sind nicht nötig. Anschließend [START-HIER.md](START-HIER.md) und die [aktuelle Abschlussübergabe](docs/handoffs/2026-09-27-bedienkorrekturen.md) lesen. Die zusätzliche Browserprüfung und ihre einmalige Playwright-Einrichtung sind in [tests/browser/README.md](tests/browser/README.md) beschrieben.

Vorhandene v1-Lernstände werden geprüft, separat im bisherigen Format gesichert
und zunächst nach dem kompatiblen v2-Fachvertrag übernommen. Die Kaufmigration
führt den vollständig validierten lokalen Zustand nach einer weiteren
Sicherheitskopie atomar auf `storageVersion:3`. Historische Ereignisse,
Descriptoren und bereits vorbereitete Uploads behalten Inhalt, IDs und
Prüfsummen. Danach auf allen Geräten die aktuelle App verwenden: alte Programme
verstehen neue Lern- und Kaufverträge nicht. Git überträgt Programmdateien und
Dokumentation, keine Browserdaten oder Google-Anmeldungen.

## Bereitstellung und Kosten

GitHub Pages ist als kostenloser Hostingweg für die Programmdateien vorgeschlagen. Pages ist noch nicht eingerichtet; es gibt noch keine veröffentlichte Trainer-URL. Lernstände und Google-Zugangsdaten gehören nicht in das GitHub-Repository.

Die Google-Drive-Nutzung ist für den erwarteten privaten Umfang innerhalb der derzeitigen kostenlosen API-Limits vorgesehen. Eine Registrierung der App in einem Google-Cloud-Projekt ist erforderlich; ein kostenpflichtiger Server oder eine zusätzliche Datenbank ist dafür nicht vorgesehen. Quellen und Stand: [QUELLEN.md](docs/QUELLEN.md).

## Lizenz

Die allgemeine Lizenzentscheidung wurde bewusst zurückgestellt. Das Projekt wird zunächst für den privaten Einsatz weiterentwickelt; vorerst wird keine allgemeine Open-Source-Freigabe hinzugefügt. Eine spätere allgemeine Lizenzfreigabe ist gesondert abzustimmen.
