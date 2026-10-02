# Arbeitsstand

**Aktuelle Fortsetzung am 02.10.2026:** Keine Pause; bisherige App v47 erhalten.
Dokumentationsbasis HEAD `32199454326441715f80eef99e71ec420d4dc57a`.
Google-Inhabereinladung ausdrücklich angenommen; frischer IAM-Aufruf im per
Badge bestätigten Leje-Konto zeigt das bestehende Projekt und beide Inhaber.
Wirksamer Google-Betreiberzugang damit belegt; private Inhaberrolle erhalten.
Upload-Zugang PASS; Google-Eingabefenster geschlossen, neue Worker-Secrets zuletzt `[]`.
Verfügbarkeit der gesicherten bestehenden Google-App-Schlüsselquelle erneut
angefragt, Antwort offen. Genaue Secret-Zielfreigabe für Worker `app` gilt weiter.
Kein neues Projekt oder OAuth-Client, kein Deploy; Produkt und Lernbestände erhalten.
Details und nächster Schritt: [Einrichtungsübergabe](docs/handoffs/2026-10-01-lejeadventure-einrichtung.md).

**Historischer abendlicher Zwischenstand (01.10.2026; Pause am 02.10. aufgehoben):** Der Nutzer möchte ins Bett und
bittet um zügigen Abschluss. Nur noch Sicherung; danach Einrichtung bei erneuter
Fortsetzung weiterführen. Der neue Cloudflare-Token ist persönlich erzeugt und
verschlüsselt eingegeben, wird aber zweimal mit ungültigem Headerformat
abgelehnt. Keine Kontozuordnung bestätigt und keine neue Trainer-Bereitstellung.
[Wiederaufnahme](docs/handoffs/2026-10-01-lejeadventure-einrichtung.md).

**Aktuelle Einrichtung (01.10.2026): LejeAdventure.** Der Nutzer beauftragt
die neue Adresse und `lejeadventure@gmail.com` als Betreiberkonto. Nur der
App-Betrieb zieht um; vorhandene Lernbereiche bleiben im bisherigen Google-Konto.
Die zusätzliche Google-Inhaberrolle ist ausdrücklich bestätigt und gespeichert;
Google meldet „Einladung gesendet. Annahme ausstehend“. Neuer Cloudflare-Zugang,
Subdomain `lejeadventure.workers.dev` und verfügbarer Workername `app` sind
geprüft; konkrete Einrichtung/OAuth-Erweiterung ausdrücklich bestätigt.
Worker-Startvorlage, neue Google-Adressen und getrennte D1 samt Schema
angelegt. Upload-Probelauf und acht Stagingtests PASS; Upload-Token persönlich
erzeugt und zweimal geschützt eingegeben, Zugriff damals ungeklärt; aktueller Kontonachweis siehe oben. Worker-Secrets und
eigentliche Trainer-Bereitstellung stehen aus.
Produkt `6b13780`, Cache v47, bleibt
unverändert an der bisherigen Adresse aktiv. Keine Lernbestände verändert,
keine neue Trainer-Bereitstellung. [Aktueller Einstieg](docs/handoffs/2026-10-01-lejeadventure-einrichtung.md).

**Firefox-Aktualisierung korrigiert (01.10.2026).** Die ausdrückliche
Freigabe ist umgesetzt: Produkt `6b13780`, Cache v47, akzeptiert den nativen
Firefox-Absender auch bei separatem JavaScript-Objekt. Speicherung,
kontrollierte Weiterleitung und Eingabesicherheit bleiben erhalten.
664/664 Node-Tests, 22 Edge- und zwei Firefox-Updatefälle einschließlich
ursprünglichem v46 → v47 PASS; unabhängiges Review ohne offenen Befund.
Worker `8fc4b574-141f-4203-bd80-d2c911385ffb` ist zu 100 Prozent aktiv,
sieben ausgelieferte Dateien bytegleich. Der vorhandene Testbereich behält
450 verfügbare Punkte, 2.450 Lernpunkte, Level 13 und Drachenstufe 4.
Der Nutzer bestätigt das Update in Firefox 156.0.1 ohne Fehlermeldung;
die Automatikprüfung verwendet Firefox 153. Der zusätzliche Offlinefehler
tritt bereits auf dem unveränderten v46-Stand auf und bleibt separat offen.
Keine Pause. [Aktuelle Übergabe](docs/handoffs/2026-10-01-firefox-update.md).

**Levelanzeige verständlich (01.10.2026).** Produkt `1049550`, Cache v46,
trennt Gesamt-Lernpunkte vom Fortschritt innerhalb des aktuellen Levels.
Gesammelte und fehlende Punkte stehen am Balken; große Schrift nutzt bei
wenig Platz die volle Kartenbreite. 662/662 Node-Tests, betroffene und finale
Browser-/Updatefälle sowie unabhängige Nachprüfung PASS. Sieben ausgelieferte
Dateien bytegleich; private Worker-Version `5667b42d-6cda-4ed8-9189-71a511a09d15`
zu 100 Prozent aktiv. Kontrolliertes Update erhält den jetzt beobachteten
Teststand mit 450 verfügbaren Punkten, 2.450 Lernpunkten, Level 13 und
Drachenstufe 4. Keine Pause. [Aktuelle Übergabe](docs/handoffs/2026-10-01-levelanzeige.md).

**Beauftragte Adressaufgabe (01.10.2026):** Die Startadresse soll den künftigen
Programmnamen statt des persönlichen Namens enthalten. Das Betreiberkonto ist
`lejeadventure@gmail.com`, Arbeitsname LejeAdventure. Lernbereiche bleiben im
bisherigen Google-Konto. Der Einrichtungsstand steht oben; Details in der
[To-do-Liste](docs/ROADMAP.md#ergänzte-offene-aufgabe-programmname-und-startadresse).
Noch keine Änderung an der laufenden App oder ihrer Adresse. Die damalige
Abendpause ist seit ausdrücklicher Fortsetzung am 02.10. aufgehoben.

**Hauptnavigation lesbar (01.10.2026).** Die kurze Pause ist ausdrücklich
aufgehoben. Produkt `fee42e9`, Cache v45, beseitigt die verbliebenen
Wortfragmente der unteren Navigation. Die vorhandenen Knöpfe wechseln bei
Platzmangel in eine weitere Zeile; unveränderte Schrift und Touchflächen,
kein Seitenüberlauf und erreichbares Inhaltsende sind bei 320/390 px mit
200 Prozent Schrift, normalen Handyansichten, Querformat und Desktop
geprüft. Finale Node-Suite 662/662 und 24/24 Browserfälle PASS, beide
unabhängigen Reviewstufen ohne Befund. Worker
`d86b43bd-6b39-4716-99af-1d3620580078` ist seit 01.10.2026, 16:18:46.988 UTC
zu 100 Prozent aktiv; sieben ausgelieferte Dateien bytegleich bestätigt.
Das kontrollierte Update im bestehenden Testbrowser erhält 40 verfügbare
Punkte, 2.040 Lernpunkte, Level 11 und Drachenstufe 4; neue Navigation sichtbar
aktiv und Google-Hinweis ohne Anmeldung verschwunden. Produktcommit auf
beiden GitHub-Zweigen exakt bestätigt. Dokumentationsnachtrag folgt separat.
Keine Pause aktiv. Physische Geräte-/Safari-Abnahme, Hardware-Randabstände,
echte Google-Zeit und natürlicher Tokenablauf bleiben gesondert offen.
[Aktuelle Übergabe](docs/handoffs/2026-10-01-hauptnavigation.md).

**Kinderansichten und Kaufdialog korrigiert (01.10.2026).** Nach ausdrücklicher
Fortsetzung sind Produkt `ef17de8` und Cache v44 integriert, unabhängig geprüft
und privat aktiv. Begrenzte Raster und Textumbruch beheben fünf ursprüngliche
Überläufe bei großer Schrift; die verbundene Zusatzprüfung korrigiert auch
Entwicklung, Shopüberschriften/-buttons und die Kaufvorschau. Finale fünf
Browser-/Updatefälle und acht verbundene Zustände PASS. Zuvor elf Browserfälle
und 662/662 Node-Tests; danach nur CSS nachgeschliffen und betroffene Browserfälle
erneut geprüft. Aufgabenreview, Nachprüfung und Gesamtbranchreview PASS.
Worker `c8223625-5a08-4718-9bf5-ae0952c8855c` ist seit 10:30:29.253 UTC zu
100 Prozent aktiv. Sieben ausgelieferte Dateien bytegleich. Kontrolliertes
Update erhält 40 verfügbare Punkte, 2.040 Lernpunkte, Level 11 und Drachenstufe 4;
Google-Hinweis verschwindet ohne neue Anmeldung. Produktcommit auf beiden
GitHub-Zweigen exakt bestätigt. Die synthetische Zehn-Zeilen-Texttabelle ist
nach Speicherung/Reload samt Ada-Zuordnung erhalten; eine echte Excel-Datei
ist nicht vorhanden und keine Voraussetzung. Keine neue Pause. Physische
Geräte-/Safari-Abnahme und reale Laufzeitnachweise bleiben offen.
[Aktuelle Übergabe](docs/handoffs/2026-10-01-handyansichten.md).

**Historische Pause am 30.09.2026.** Nach Abschluss und GitHub-Sicherung auf beiden
Zweigen (`0371106`) wünscht der Nutzer heute keine weitere Arbeit. Dieser
Pausenvermerk wird separat gesichert; keine weitere Produktarbeit oder
Testsitzung bis zur ausdrücklichen Fortsetzung. Produkt `b440b5e`, Cache v43,
bleibt aktiv. Danach mit echter Excel-Liste und Lektions-/Kinderzuordnung
fortsetzen; Eingaben und physische Geräteabnahme sind noch offen.
[Übergabe](docs/handoffs/2026-09-30-mobile-vokabeleingabe.md).

**Schmale Vokabeleingabe korrigiert (30.09.2026).** Bei 390 px und 200 Prozent
Schrift war die Erwachsenenansicht 463 px breit. Produktcommit `b440b5e`
behebt die Mindestbreiten und passt die Navigation an die Schriftgröße an.
Importkorrektur, neue Lektion, Kinderzuordnung und Speicherung sind bei
320/390 px mit großer Schrift sowie 320/1280 px normal geprüft. Finale
7/7 betroffene Browserfälle und beide unabhängigen Reviews PASS. Die gesamte
Node-Suite bestand mit 662/662 vor dem letzten CSS-Feinschliff; danach wurden
die relevanten Browser- und Updatefälle erneut ausgeführt. Keine Änderung
an Produkt-JavaScript, Abgleich, Kauf oder Datenformat. Cache v43 privat aktiv;
Worker `8ec1b376-c0e7-4800-8a0e-24ea169d82a5` seit 20:16:19.914 UTC zu
100 Prozent. Sieben ausgelieferte Dateien bytegleich. Das kontrollierte Update
erhält 40 verfügbare Punkte, 2.040 Lernpunkte, Level 11 und Drachenstufe 4.
Produktcommit auf beiden GitHub-Zweigen exakt bestätigt; dieser
Dokumentationsnachtrag folgt separat. Echte Excel-Liste mit Zuordnung ist
angefragt; Handy-/Safari-Abnahme bleibt offen. Keine neue Pause.
[Aktuelle Übergabe](docs/handoffs/2026-09-30-mobile-vokabeleingabe.md).

**Wortlisten-Abgleich beschleunigt (30.09.2026).** Der bestätigte Upload von bis
zu drei gewöhnlichen Lernpaketen zugleich ist als Produktcommit `a530357`
integriert, unabhängig geprüft und privat als Cache v42 bereitgestellt.
Dateiprüfungen und vor Upload gespeicherte IDs bleiben erhalten; bei Teilfehlern
werden alle begonnenen Vorgänge abgewartet und erfolgreiche Dateien einzeln
bestätigt. 662/662 finale Node-Tests, 113 gezielte Tests und sechs Browserfälle
PASS; beide unabhängigen Reviews ohne Befund. In zwei kontrollierten Läufen
mit 500 Wörtern und 500 ms je Anfrage sinkt die mittlere Gesamtzeit von 22,372
auf 13,890 Sekunden (37,9 %). Jeweils dieselben 41 Anfragen/sechs Pakete,
alle Wortereignisse genau einmal in der Simulation und nach Reload erhalten.
Neun ausgelieferte Dateien sind bytegleich. Worker
`2b88c625-3eab-4607-a7ce-969c9c4cdd68` ist seit 30.09.2026, 19:40:28.622 UTC
zu 100 Prozent aktiv. Kontrolliertes Update erhält 40 verfügbare Punkte,
2.040 Lernpunkte, Level 11 und Drachenstufe 4. Produktcommit ist auf beiden
GitHub-Zweigen exakt bestätigt; dieser Dokumentationsnachtrag folgt separat.
Echte Excel-Liste mit Zuordnung, reale Google-Zeit und physische Geräteabnahme
bleiben offen. Keine neue Pause angeordnet.
[Aktuelle Übergabe](docs/handoffs/2026-09-30-grosse-wortlisten.md).

**Galerie privat bereitgestellt (30.09.2026).** Alle 13 Figuren mit je vier
Formen und den vier menschlichen Hauttönen sind integriert: 76 Motive,
228 WebPs. Produktcommit `d0fefdf` übernimmt den unabhängig geprüften Stand
`40d7424`. Der Abschlussbefund zur Tierbildauswahl bei gespeichertem Hautton
ist korrigiert. Frische finale 659/659 Node-Tests und 19/19 Galerie-Browserfälle
PASS; fünf Offline-/Updatefälle zuvor bestanden. Die 36 bisherigen WebPs sind
bytegleich. 387 öffentliche Dateien für Cache v41 sind ausgeliefert und
bytegleich geprüft; Worker `8e9f7658-09aa-40a3-bd67-42ef4f2b92b6` ist seit
30.09.2026, 18:43:53.932 UTC zu 100 Prozent aktiv. Der Upload-Zugang ist
erneuert. Im vorhandenen Testbrowser sind nach kontrolliertem Update die
40 verfügbaren Punkte, 2.040 Lernpunkte, Level 11 und gewählte Drachenstufe 4
erhalten. Alle vier Entdeckerinnenbilder sind tatsächlich geladen.
Die konkrete GitHub-Freigabe liegt inzwischen vor. Beide Zweige wurden
erfolgreich hochgeladen und ihre lokalen/entfernten Commit-IDs exakt verglichen:
Hauptzweig `c8057ee`, Arbeitszweig `40d7424` vor diesem Dokumentationsnachtrag.
Das Galeriepaket ist damit abgeschlossen; nächste Arbeit sind die übrigen
Optimierungen mit den in der Übergabe genannten offenen Eingaben.
[Bericht](docs/reports/2026-09-30-avatar-restpaket.md) und
[aktuelle Übergabe](docs/handoffs/2026-09-30-avatar-abschluss.md).

**Historische Pause nach Zwischenstandssicherung: Avatar-Restpaket (29.09.2026).** Der
Nutzer wählt eine Pause nach Sicherung in etwa 5–10 Minuten. Alle zehn
bestätigten Reihen liegen als 64 fertige, visuell geprüfte Einzelquellen vor;
der Einbau bleibt als unfertiger Arbeitsstand auf `codex/purchase-batch-checks`.
Vor Produktintegration fehlen vollständige Tests, Browserprüfung und unabhängige
Reviews. Keine neue Bereitstellung: `31fcf02` und Cache v40 bleiben produktiv.
Nach Sicherung erst auf ausdrückliche Fortsetzung weiterarbeiten. Dann dieses
Galeriepaket abschließen, bevor weitere Optimierungen beginnen. Die vorgeschlagene
Lernbereichsübernahme bleibt zurückgestellt und nicht freigegeben.
[Pausenübergabe, Prüfungen und nächste Schritte](docs/handoffs/2026-09-29-avatar-restpaket.md).

**Bestätigter Folgeumfang:** Nach Entwicklungsstufen und den übrigen
Optimierungen sollen alle fünf vorgeschlagenen Belohnungserweiterungen folgen:
Verwandlung, Figurenbewegung, Lernreaktionen, eigener Inselort und
Steckbrief/Geschichte/Titel. Im aktuellen Bildpaket noch nicht umsetzen;
die konkrete spätere Gestaltung steht aus. Details in der aktuellen Übergabe.

**Fortsetzung: Übernahmevorschau untersucht (29.09.2026).** Als nächster
begrenzter Eingriff ist die Wiederverwendung des geprüften Vorschauzustands
vorgeschlagen. Der bestehende Abgleich prüft weiterhin aktuelle Änderungen;
bekannte Kaufbelege müssten nicht erneut geladen werden. Code und vorhandene
Messdaten lassen etwa 30 weniger Anfragen bei der unveränderten Bestätigung
erwarten, noch ohne neue Zeitmessung. Der konkrete Entwurf wartet auf Antwort.
Keine Produktänderung oder Bereitstellung; `31fcf02` und Cache v40 bleiben
aktuell. [Untersuchung und Fortsetzung](docs/handoffs/2026-09-29-lernbereich-vorschau.md).

**Abgeschlossen: größere Kauf-Uploadgruppen (29.09.2026).** Der Nutzer
bestätigt den Entwurf; Produkt `31fcf02229eee8e866d607b9d23cdaa601677680`
überträgt bis sechs statt drei Kaufdateien gleichzeitig und erhält sämtliche
Prüfungen. Der normale Fünf-Dateien-Kauf braucht eine statt zwei Gruppen.
Mit 500 ms künstlicher Verzögerung je Google-Anfrage sinkt die gemessene
Gesamtwartezeit von 10,907 auf 8,782 Sekunden (19,5 %); weiterhin 31 Anfragen.
147 gezielte Node-Tests, finale 659/659 Gesamttests, 13/13 Browserfälle und
unabhängige Reviews PASS. Cache v40 privat aktiv, zwölf ausgelieferte Dateien
bytegleich geprüft. Produkt exakt auf GitHub bestätigt. Keine neue
Pause. [Bericht](docs/reports/2026-09-29-kauf-uploadgruppen.md) und
[aktuelle Übergabe](docs/handoffs/2026-09-29-kauf-uploadgruppen.md) enthalten
Bereitstellungsnachweis und nächste Schritte. Reale Kaufzeit unter zehn
Sekunden und typische Import-Wortliste bleiben offen. Die langsamere
Lernbereichsübernahme ist nur diagnostiziert und nicht Teil dieses Pakets.

**Abgeschlossen: Tabellenkorrekturen (29.09.2026).** Der bestätigte Entwurf
ist als Produktcommit `ee7e17454af04526715df58c4f3767259f47414e` integriert
und exakt mit GitHub abgeglichen. Tab, Rückwärtstab und Klick erhalten den
Fokus; korrigierte Pflichtfelder benötigen keinen zusätzlichen Klick.
Unklare Tabellenstrukturen bleiben ausdrücklich zu bestätigen. Eine durch
Lektionswechsel neu entstandene Dopplung öffnet die betreffende Zeile.
655/655 finale Node-Tests, 22 Browserfälle und vier gezielte Nachprüfungen
PASS; unabhängige Task- und Gesamtprüfung ohne offene Befunde. Cache v39 ist
privat aktiv; zehn ausgelieferte Dateien entsprechen exakt dem geprüften Paket.
Das kontrollierte Update im vorhandenen Testbrowser erhält 40 verfügbare
Punkte, 2.040 Lernpunkte, Level 11 und Drachenstufe 4. Keine neue Pause.
[Bericht](docs/reports/2026-09-29-importkorrekturen.md) und
[aktuelle Übergabe](docs/handoffs/2026-09-29-importkorrekturen.md).

**Abgeschlossen: sofortiger Google-Abgleich nach Vokabelspeicherung (29.09.2026).**
Der Nutzer bestätigt den Wegfall der bisherigen Zehn-Sekunden-Wartezeit.
Neue Wort-/Lektionsrevisionen stoßen den vorhandenen Abgleich sofort an;
Stapel, laufende Abgleiche, Offline-Wiederaufnahme und Lernantwort-Bündelung
bleiben korrekt zusammengeführt. Produktcommit `0c3720a` ist integriert und
exakt mit GitHub abgeglichen. Cache v38 ist privat aktiv; zehn ausgelieferte
Dateien sind bytegleich. 655/655 gesamte Node-Tests, 20/20 Browserfälle und
unabhängige Prüfungen PASS. Kontrolliertes Update im Testbrowser übernommen;
40 verfügbare Punkte, 2.040 Lernpunkte, Level 11 und Drachenstufe 4 erhalten.
Die Änderung spart eine vorgeschaltete Wartezeit, garantiert keine reale
Google-Gesamtdauer. Keine neue Pause angeordnet.
[Bericht](docs/reports/2026-09-29-sofortiger-vokabelabgleich.md) und
[aktuelle Übergabe](docs/handoffs/2026-09-29-sofortiger-vokabelabgleich.md).

**Fortsetzung und Unterbrechungsprüfung (29.09.2026).** Der Nutzer hebt die
Pause auf und lässt mögliche Folgen eines Verbindungsabbruchs in Codex prüfen.
Beide lokalen Checkouts sind sauber und auf `0fbeb19`; der tatsächliche
GitHub-Branchkopf stimmt exakt überein. Git-Integrität und abgeschlossene
Testprotokolle sind unauffällig. Alle 199 vorbereiteten Dateien entsprechen
dem Produktstand einschließlich der vorgesehenen Serverkonfiguration;
neun frisch abgerufene App-Dateien sind bytegleich. Cache v37 und die
bisherige Worker-Version bleiben aktiv. Nach Neuladen des vorhandenen
Testbrowsers bleiben 40 verfügbare Punkte, 2.040 Lernpunkte, Level 11 und
ausgewählte Drachenstufe 4 erhalten; der anfängliche Google-Hinweis verschwindet
selbstständig. Kein Reparaturbedarf in den geprüften Bereichen, keine erneute
Bereitstellung oder vollständige Testsuite. Natürlicher Tokenablauf und
physische Geräteabnahmen bleiben offen.
[Aktuelle Übergabe](docs/handoffs/2026-09-29-verbindungsabbruch.md).

**Abgeschlossen, anschließend Pause: Vokabeleingabe (29.09.2026).** Nach
ausdrücklicher Fortsetzung ist der priorisierte Tabellenweg überarbeitet:
einfügen, automatische kompakte Prüfung, gemeinsame Übernahme. Lektions- und
Kinderzuordnung stehen im selben Ablauf; „Speichern und nächstes Wort“ erleichtert
die Einzeleingabe. Die synthetische lokale Übernahme von 250 Wörtern benötigt
73 ms statt 6,3 s und eine statt 250 Speicherungen. Keine Browser-/Google-Zeit
daraus ableiten. Produktcommit `c866bd76e98b9fcf4673a7d7a567674c282d04aa`
ist exakt mit GitHub abgeglichen; Cache v37 ist privat bereitgestellt.
650/650 Node-Tests, 22/22 Browserfälle, unabhängige Prüfungen und der Bytevergleich
von neun ausgelieferten Dateien sind erfolgreich. Das kontrollierte Update im
vorhandenen Testbrowser erhält 40 verfügbare Punkte, 2.040 Lernpunkte, Level 11
und gewählte Drachenstufe 4. Der Nutzer wünscht danach Pause; keine weitere
Produktarbeit oder Testsitzung ohne ausdrückliche Fortsetzung.
[Bericht](docs/reports/2026-09-29-vokabeleingabe.md) und
[aktuelle Pausenübergabe](docs/handoffs/2026-09-29-vokabeleingabe.md).

## Aktuelle offene Arbeitspunkte (30.09.2026)

- Den vereinfachten Tabellenweg mit einer typischen
  echten Wortliste praktisch beurteilen; lokale Speicherung und anschließenden
  Google-Abgleich getrennt messen. Die Korrekturprobleme sind seit `ee7e174`
  behoben; umgesetzt und synthetisch geprüft ist der gesamte vereinfachte Weg.
- Das fertig integrierte Galeriepaket nach Erneuerung des Upload-Zugangs
  privat bereitstellen, im vorhandenen Testbrowser prüfen und auf GitHub sichern.
- Kaufgeschwindigkeit weiter verbessern: rund 17,1 Sekunden sind für einen
  echten Durchgang belegt; das Wunschziel unter zehn Sekunden und die langsame
  Übernahme vorhandener Lernbereiche bleiben Optimierungspunkte.
- Automatische Google-Erneuerung über einen natürlichen Tokenablauf praktisch
  nachweisen; der falsche Galeriehinweis ist bereits behoben.
- Das integrierte Produkt mit Google Drive auf zwei physischen Geräten prüfen.
- Handynutzung praktisch abnehmen, besonders iPhone/Safari und die
  Home-Bildschirm-App; Tastatur, Touchbedienung, Offlinebetrieb, Neustarts,
  Updates und Erwachsenenverwaltung einschließen. Responsive Ansichten und
  automatisierte Browserprüfungen ersetzen diesen Praxistest nicht.

Die vereinbarten Kernfunktionen einschließlich Galeriebedienung sind umgesetzt.
Ältere offene Listen weiter unten sind datierte Vorgeschichte; maßgeblich sind
diese Liste und die jeweils jüngsten Abschlussberichte.

**Abgeschlossen: Google-Statusanzeige.** Nach ausdrücklicher Fortsetzung ist
der falsche Verbindungshinweis nach erfolgreicher Sitzungswiederaufnahme
reproduziert und als Produktcommit `67de463e752221894e9e59cb81d1a978397db77a`
behoben. 646/646 Node-Tests, 14/14 Browserfälle und unabhängige Spec-/Codeprüfung
PASS. Privat läuft Cache v36, Worker `aa32fd3e-c346-4615-b171-10f17b5b5913`;
47 ausgelieferte Dateien sind bytegleich geprüft. Der Produktcommit ist exakt
mit GitHub abgeglichen. Im bestehenden Testbrowser verschwindet der Hinweis
nach dem Update ohne Google-Anmeldung oder Galeriewechsel; 40 verfügbare
Punkte, 2.040 Lernpunkte, Level 11 und gewählte Drachenstufe 4 bleiben erhalten.
Serveranmeldung und Kaufkern sind unverändert. Natürlicher Tokenablauf und
physische Geräteabnahmen sind dadurch nicht neu belegt.
[Aktuelle Übergabe](docs/handoffs/2026-09-29-google-statusanzeige.md).

**Abgeschlossen am 29.09.2026: Tiger.** Der Nutzer bestätigt den
[Konzeptbogen](docs/design/avatar-evolution/tiger-stages-concept-v1.png) und
die Galerieeinbindung mit „Ja, genau so umsetzen“. Produktcommit
`05d21b9f155cebb09e6ba7be8754331c575ed8d5` ist exakt mit GitHub abgeglichen
und privat als Cache v35 bereitgestellt. Vier Formen, zwölf WebPs und
Offline-Einbindung sind integriert; die 24 bisherigen Bildvarianten unverändert.
646/646 gesamte Node-Tests, 25/25 gezielte Node-Tests, 6/6 Browserfälle und
unabhängige Bild-/Codeprüfung PASS. Vier kleine Tigerbilder brauchen zusammen
115.260 Bytes. Aktive Worker-Version: `7647cf4d-ca75-4917-9cf1-13b8fe99afc3`.
44 ausgelieferte Dateien sind bytegleich geprüft. Im vorhandenen Testbrowser
ist das Update übernommen und die vollständige Tiger-Reihe sichtbar;
40 verfügbare Punkte, 2.040 Lernpunkte, Level 11 und Drachenstufe 4 als
Auswahl bleiben erhalten. Zwölf von 76 Motiven sind ausgeliefert; 64 offen.
Bereits vor dem Update erschien „Google erneut verbinden“ für neue Käufe,
nach dem Update ebenso. Die Ursache ist offen; dies ist kein Nachweis
erfolgreicher automatischer Token-Erneuerung. Bestehende Konten und Daten erhalten.
[Aktuelle Übergabe](docs/handoffs/2026-09-29-tiger-fortsetzung.md).

**Aktuelle Fortsetzung am 29.09.2026:** Der Nutzer hebt die Pause auf; seit
dem gesicherten Stand `c475a52` gab es laut Nutzer keine weitere Bearbeitung.
Die lokalen Entwicklungszweige sind beim Einstieg sauber und auf diesem Stand.
Die konkrete Nebelhirsch-Bildrichtung v2 ist einschließlich App-Einbindung
mit „Ja, genau so umsetzen“ bestätigt. Das Paket ist als Produktcommit
`6d3ee83` integriert und auf GitHub exakt abgeglichen: vier Formen,
zwölf responsive WebPs und Offline-Nutzung. Privat läuft Cache v34,
Worker-Version `bd05126f-fe46-4bea-a97e-652d10563277`.
646/646 Node-Tests, 25/25 gezielte Node-Tests, fünf Browserfälle und unabhängige
Bild-/Codeprüfungen sind erfolgreich. 32 öffentliche Dateien sind bytegleich.
Der bestehende Testbrowser zeigt die neue Reihe; 40 verfügbare Punkte,
2.040 Lernpunkte, Level 11 und Drachenstufe 4 als Auswahl sind erhalten.
Die vier kleinen Nebelhirschbilder benötigen zusammen 143.854 Bytes.
68 Motive und die bisherigen realen Token-/Geräteabnahmen bleiben offen.
[Aktuelle Übergabe](docs/handoffs/2026-09-29-nebelhirsch-fortsetzung.md).

**Historische Steuerung: Pause nach diesem Abschluss.** Der Nutzer verlangt
während der abschließenden Browserkontrolle eine sinnvolle Pause nach diesem
Schritt. Nur Abschlussdokumentation und GitHub-Sicherung fertigstellen;
danach keine neue Produktarbeit oder Testsitzung ohne ausdrückliche Fortsetzung.

## Aktuelle Fortsetzung: Entwicklungsgalerie und kleinere Bilder

Nach dem 20-Sekunden-Test beauftragt der Nutzer die Weiterarbeit. Das bereits
bestätigte EV05-Bedienpaket ist mit den vier vorhandenen Drachenformen umgesetzt:
nächste Form mit Preis/Guthaben/fehlenden Punkten, Fortschrittsbalken, klare
Besitzanzeigen, Bilder im Kaufdialog und bewusste Auswahl nach Freischaltung.
Alle besessenen Formen sind wieder auswählbar. Klassische Gestaltung und
persönliche Grundfarben bleiben erhalten; Betrachten ändert die Auswahl nicht.

Produktcommit `64539ff662941fa51294ecd4f235c37e08c6e11a` ist integriert und
privat als Cache v33 bereitgestellt. Zwölf transparente WebPs verwenden
256/512/768 Pixel; kleine Offlinebilder zusammen 139.420 statt 6.898.398 Bytes.
Größere Bilder werden passend nachgeladen. Bei endgültigem Bildausfall erscheint
ein Hinweis und die Kaufbestätigung bleibt gesperrt.

Prüfungen: 646/646 gesamte Node-Tests, nach den letzten Dialogkorrekturen
8/8 gezielte Node-Tests, 14/14 ausgewählte Browserfälle und unabhängige Prüfungen
PASS. 20 öffentliche Dateien sind bytegleich mit dem Uploadpaket verglichen.
Aktive Worker-Version: `a0242f2e-916d-4547-8b15-78b5ffc31da1`.
Im getrennten Codex-Testbrowser wurde das Update angenommen. Die neue Galerie
erschien nach einem zusätzlichen Neuladen; alle vier Drachenstufen gehören
weiterhin dem Testprofil, Stufe 4 bleibt gewählt. „Höchste Stufe erreicht“,
40 verfügbare Punkte und 2.040 Lernpunkte/Level 11 sind direkt beobachtet.
Der anfängliche Google-Verbindungshinweis verschwand ohne neue Anmeldung.
Details und Browserbeobachtung stehen im [Galeriebericht](docs/reports/2026-09-28-entwicklungsgalerie.md).
72 weitere Motive, das Kauf-Wunschziel unter zehn Sekunden und reale
Token-/Geräteabnahmen bleiben offen.

## Vorheriger Auftrag: höchstens 20 Sekunden für den gesamten Kauf

Der Nutzer hat den bereitgestellten Stand erneut getestet und als zu langsam
zurückgewiesen. Maßgeblich sind jetzt höchstens 20 Sekunden für Vorschau und
Bestätigung zusammen; Ziel sind unter 10 Sekunden. Er erlaubt den Abbau
redundanter Prüfungen. Der neue Pfad und seine Nachweise stehen im
[aktuellen Tempobericht](docs/reports/2026-09-28-kauf-20-sekunden.md).

Produktcommit `1925902` ist integriert und mit Cache v32 privat bereitgestellt.
Final: 641/641 Node-Tests, 8/8 ausgewählte Browserfälle, nach letzter
Abbruchkorrektur erneut der Kauf-Browserfall, unabhängige Reviews PASS.
Synthetisch benötigt der Serverpfad 0 Vorschau- und 31 Bestätigungsanfragen;
mit 500 ms Verzögerung pro Anfrage dauert der Kauf etwa 10,7 Sekunden.
Elf ausgelieferte Dateien sind bytegleich geprüft. Aktive Worker-Version:
`e14dc090-529a-45ee-829b-53dfaf1162e1`.

Im getrennten Codex-Testbereich ist das Update übernommen und die
Google-Verbindung ohne neue Anmeldung wieder verfügbar. Die echte Vorschau
für Stufe 4 erscheint nach 113 ms. Nach dem selbst ausgeführten Klick meldet
der Nutzer 17 Sekunden für die Bestätigung. Zusammen rund 17,1 Sekunden:
20-Sekunden-Grenze in diesem Durchgang erreicht, Wunschziel unter 10 Sekunden
noch nicht. Der DOM bestätigt den Kauf für 800 Punkte und danach 40 verfügbare
Punkte, unverändert 2.040 Lernpunkte und Level 11. Stufe 4 ist gewählt und
nach Neuladen erhalten. Produktcommit `192590258e657175defcf89f1141d561c2f1c95d`
ist exakt mit GitHub abgeglichen. Die anschließende Dokumentation sichert den
realen Test; keine allgemeine Zeitgarantie oder Apple-/Zweitgeräteabnahme.

## Historisch: Tempopaket bereitgestellt und Stufe 3 gekauft

Der Nutzer hat die begrenzte Kaufbeschleunigung mit „ja, beschleunige so gut
es geht“ beauftragt. Auf Basis `e3933fc` wurde Produktcommit
`ad96f00390243cbda94a825d278650b1efa682d7` per Fast-Forward integriert.
Final bestanden 624/624 Node-Tests, 8/8 ausgewählte Browserfälle und ein
unabhängiges Review mit PASS. Die vollständige synthetische Kaufprobe ergab
55 statt 63 HTTP-Anfragen für die Vorschau und 139 statt 234 für die
Bestätigung. Diese Zählung ist kein Maß für die reale Wartezeit.

Die private HTTPS-App ist mit Cache v31 bereitgestellt. Aktive Worker-Version:
`a573d6f3-ecf5-42a8-82e9-2b59f66eca20`, seit 28.09.2026, 17:36:18 UTC
zu 100 % aktiv. Neun öffentliche Dateien einschließlich der geänderten
Laufzeitdateien, HTML, Konfiguration, Client und Service Worker wurden
bytegleich mit dem geprüften Paket verglichen. Produktcommit `ad96f00` ist
exakt mit GitHub abgeglichen; dieser Dokumentationsnachtrag wird separat
gesichert.

Im getrennten Codex-Testbrowser wurde „Jetzt aktualisieren“ verwendet. Ohne
neue Google-Anmeldung während Update und Kauf wurde „Einfacher Drache – Stufe
3“ für 400 Punkte gekauft. Die Vorschau war nach 20,838 Sekunden sichtbar;
nach 24,356 Sekunden lief die Bestätigung noch, nach 43,891 Sekunden war sie
sichtbar. Stufe 3 wurde bewusst ausgewählt. Nach Neuladen bestätigte der DOM
Stufe 3 als „Deine ausgewählte Figur“, 1.000 verfügbare Punkte, 1.600
Lernpunkte und Level 9. Diese einzelne Beobachtung mit anderer Stufe und
Vorgeschichte ist kein kontrollierter A/B-Vergleich oder allgemeines
Zeitversprechen; die Nutzerabnahme des Tempos fehlt. Nach diesem Neuladen
erschien „Google erneut verbinden“. Ein anschließender UI-Aufruf endete
ohne Ergebnis durch Tool-Timeout; der aktuelle Google-Status ist deshalb
offen. Während Update und Kauf war keine neue Anmeldung nötig. Familien-Chrome
und vorhandene Bestände blieben unangetastet. Der Testbereich ist bereits
eingerichtet; mit 1.000 Punkten ist Stufe 4 für 800 Punkte bezahlbar. Nächster
Schritt ist die Nutzerrückmeldung zum Tempo. Für eine weitere größere
Optimierung sind konkrete Restlatenzdiagnose und abgestimmtes Design nötig.
Details: [Tempobericht](docs/reports/2026-09-28-kaufablauf-tempo.md).

## Vorheriger Stand: realer Kauf von Stufe 2 im getrennten Teststand bestätigt

Der Nutzer beendet die Pause ausdrücklich mit „jetzt kannst du weiter arbeiten“.
Ausgangsstand `45ec0a8b0be06747b1de574c29102926b3b66b43` ist erneut exakt mit
GitHub verglichen; der Arbeitsbaum war sauber. Die getrennte HTTPS-App im
Codex-Browser zeigte eine leere Ersteinrichtung. Der Nutzer hat die lokale PIN
selbst eingerichtet. Die geprüfte Sicherung wurde nach Vorschau ausschließlich
in diesem unverbundenen Testbereich wiederhergestellt: 60 Wörter, 150 Antworten
und 1.600 Punkte. Die Oberfläche bestätigt die aktivierte Wiederherstellung
und eine geprüfte lokale Sicherheitskopie. Der Nutzer hat Google verbunden.
Die ersten beiden Einrichtungsversuche scheiterten an der
Sicherungs-Metadatenprüfung. Der bestehende Chrome-Lernstand blieb erhalten.

Produktcommit `ed36f4d` ergänzt die Inhaltsrevision und unverfälschte Abrufe.
Bei gültiger stabiler Inhaltsrevision darf ausschließlich die allgemeine
Drive-Version wechseln; übrige Metadaten, Bindung und Inhalt bleiben geprüft.
105/105 gezielte und 601/601 gesamte Node-Tests sowie 7/7 ausgewählte
Browserfälle bestehen; unabhängige Prüfung ohne blockierende Befunde.
Cache v30 ist tatsächlich bereitgestellt, Worker-Version
`6d687e33-66b1-4f26-9ab9-99771d809809`; die ausgelieferten geänderten Module
entsprechen exakt dem geprüften Paket. Im Testbrowser ist das kontrollierte
Update übernommen und das Profil zeigt weiterhin 1.600 Punkte. Nach erneutem
Öffnen der Erwachsenenansicht wurde die gespeicherte Einrichtung erfolgreich
fortgesetzt. Der eigene Test-Lernbereich ist in Drive angelegt und vollständig
abgeglichen; die Google-Verbindung blieb unter v30 aktiv. Die Aktivierung von
Figuren und Käufen gelang mit 1.600 Punkten und Level 9. Ein einziger realer
Kauf „Einfacher Drache – Stufe 2“ für 200 Punkte ist bestätigt: 1.400
verfügbare Punkte, 1.600 Lernpunkte und Level 9. Die Vorschau war nach 26,927
Sekunden sichtbar; nach 98,722 Sekunden lief die Bestätigung noch, spätestens
nach 118,821 Sekunden war „Der Kauf ist bestätigt.“ sichtbar. Das sind
ungefähre UI-Beobachtungen, keine präzise HTTP-Dauer und kein Beleg einer
Zeitersparnis gegenüber dem alten Stand. Der Nutzer berichtet eine
Kaufbestätigung von über zwei Minuten und bewertet das Tempo ausdrücklich als
zu langsam. Der funktionale Kauf ist bestätigt; die Leistungsdiagnose ist
jetzt vorrangig und das Tempo nicht abgenommen. Die gekaufte Form wurde
bewusst ausgewählt; Besitz, Auswahl und Guthaben sind nach Neuladen erhalten. Natürlicher Tokenablauf, Zweitgerät
und Apple-Abnahme bleiben offen. Der Dokumentationszwischenstand
`a51d9991fee20ea5ceb50d25ed1040043d7cd5f0` ist exakt mit GitHub verglichen.
Details: [Kauftest und Sicherungsabgleich](docs/reports/2026-09-28-kauftest-wiederherstellung.md).

Die damalige vollständige lokale Diagnose des Kaufablaufs ergab 63 HTTP-Anfragen für
die Vorschau und 234 für die Bestätigung, darunter 102 in zwei vollständigen
Lernabgleichen. Die Ansicht danach braucht keine Netzabrufe. Der portable
Helfer `scripts/measure-purchase-requests.mjs` sperrt echtes Netzwerk und
bestätigt synthetisch 1.600 → 1.400 verfügbare Punkte. Das damals dokumentierte
Zusammenführen doppelter Prüfungen ist mit dem oben genannten Tempopaket
umgesetzt. Der damalige Diagnosewert bleibt als Ausgangsmessung erhalten.

## Vorheriger Abschluss: Testpunkte vorbereitet, anschließend Pause

Der Nutzer bittet nach dem erfolgreichen Update um einen schnellen Kauftest
ohne weitere eigene Vokabelübungen und danach ausdrücklich um Pause, da er
gleich losmuss. Der bestehende Datenvertrag leitet Guthaben aus Lernereignissen
ab; ein manueller Guthabenbefehl existiert nicht. Ein separater rein synthetischer
Teststand mit einem Profil „Kauftest“, 1.600 Punkten und Level 9 ist vorbereitet.
Der Generator und die geschriebene Sicherung sind geprüft; der Drache ist
verfügbar. [Datei und Anleitung](docs/KAUFTEST-MIT-TESTPUNKTEN.md).
Der Stand wurde weder in einen Browser importiert noch in Drive angelegt.
Nach Dokumentations- und
Git-Sicherung wird pausiert; Nutzerbedienung ist heute nicht mehr erforderlich.

## Fortsetzung auf dem Laptop am 28.09.2026

**Anschließende Bereitstellungsfortsetzung:** Der auf GitHub exakt bestätigte
Abschlussstand `939830c` ist Ausgangspunkt des erneut beauftragten Weiterarbeitens.
Nach Wiederherstellung der lokalen Betreiberkonfiguration und erfolgreichem
Probelauf mit 161 Dateien ist das Paket tatsächlich hochgeladen: Wrangler
4.142.0, drei neue Assets und 158 wiederverwendete Dateien, Exitcode 0.
Aktive Worker-Version: `494388ba-6838-4604-9369-788a6e60962d`, Cache v29.
Öffentlich ausgelieferte HTML-Datei, Serverkonfiguration, Service Worker und
beide Kaufmodule stimmen exakt mit dem lokalen Paket überein. Interne Pfade
bleiben gesperrt. Chrome zeigte „Neue Programmversion verfügbar“; nach
„Jetzt aktualisieren“ erschien die Profilauswahl wieder.
Nach dem Update bestätigt der Nutzer die aktive Google-Verbindung ohne erneute
Anmeldung; „Google-Verbindung ist aktiv“ und „Vollständig abgeglichen“ wurden
auch direkt beobachtet. Ein echter Kauf blieb aus: kein bezahlbares freigegebenes
Angebot im vorhandenen Profil, günstigere Entwicklungsform noch ohne Bild.
Keine persönlichen Punktestände oder Kaufdaten wurden für den Test verändert.

Zwei Laptop-OAuth-Anmeldungen scheiterten beim Codeaustausch an einer
Cloudflare-Bot-Challenge (403). Der anschließend vom Nutzer in Chrome
erstellte, auf das bestehende Konto begrenzte API-Token-Zugang funktioniert;
Eingabe erfolgte verdeckt lokal, Speicherung Windows-verschlüsselt außerhalb
von Git. Keine Secrets des Workers wurden ersetzt. Aktuelle Details:
[Bereitstellungsfortsetzung](docs/handoffs/2026-09-28-laptop-fortsetzung.md#bereitstellungsfortsetzung-am-28092026).

Der Nutzer hat die Weiterarbeit mit Superpowers ausdrücklich beauftragt.
Die Pause vom 27.09. ist beendet. Der saubere lokale Entwicklungszweig
`codex/vokabeltrainer-v1` wurde von `5a434bf` per Fast-Forward auf `c499614`
aktualisiert und exakt mit GitHub verglichen. Die aktuellen Einstiegstexte,
Anforderungen, Architektur und Laptop-Übergabe sind gelesen.

In Chrome wurde die bereitgestellte HTTPS-App geöffnet. Der Laptop zeigte
die Ersteinrichtung. Mit synthetischen Angaben und einer allein vom Nutzer
eingegebenen PIN wurde die lokale Einrichtung abgeschlossen. Anschließend
bestätigte der Nutzer die Google-Anmeldung und Rückkehr zum Trainer. Die App
zeigte eine aktive Google-Verbindung und fand vorhandene Lernbereiche. Der
Nutzer wählte den weiterzuverwendenden Bestand. Nach dessen Vorschau mit
Erhalt des lokalen Teststands als Sicherheitskopie wurde dieser Bestand
übernommen. Anschließend waren „Vollständig abgeglichen“ und die aktive
Google-Verbindung sichtbar. Keine neue Cloudfamilie wurde angelegt.
Der Nutzer bestätigt anschließend: Nach vollständigem Beenden und Neustarten
von Chrome ist die Google-Verbindung ohne neuen Anmeldeklick aktiv. Dieser
Neustartnachweis beruht auf seiner Rückmeldung; der reguläre Ablauf eines
Zugriffstokens ist dadurch nicht nachgewiesen.
Die begrenzte Kaufbeschleunigung ist fertig und als Produktcommit
`b6b83a95346d2b2c71a3d3edba35abff88f43047` unverändert per Fast-Forward in
`codex/vokabeltrainer-v1` integriert. Die kurzlebige gemeinsame Prüfung für
höchstens drei gespeicherte Kaufdateien reduziert in der HTTP-Fixture 54 auf
34 Anfragen. Konto-/Sitzungsbindung, Datei-Nachlesen, Wiederaufnahme und frische
Kopfprüfung bleiben erhalten. Cachekennung: v29.

Abschlussnachweise auf exakt diesem Produktstand: **591/591 Node-Tests**,
**12/12 ausgewählte Browserfälle** einschließlich Kauf/Recovery sowie echtem
Offline-/Updatepfad, **161 öffentliche Dateien** lokal vorbereitet und
unabhängiges **Spec/Qualität PASS ohne offene Befunde**. Die zwölf Browserfälle
sind eine gezielte aktuelle Auswahl; die frühere Gesamtsuite mit 58 Fällen
wurde nicht vollständig neu ausgeführt. Die Produktprüfung war vor dem oben
dokumentierten Upload abgeschlossen; reale Kaufwartezeit ist noch nicht gemessen.
Details und Prüfkommandos: [Kaufgruppenbericht](docs/reports/2026-09-28-kaufgruppen.md).

Der erste Dokumentationsabschluss `939830c` ist bereits exakt auf GitHub
bestätigt. Die anschließenden Bereitstellungs- und Pausennachträge werden nach
Verweis-/Diffprüfung ebenfalls gesichert; ihr Commit und exakter Remotevergleich
werden in der damaligen Abschlussmeldung genannt. Damaliger Einstieg:
[Laptop-Fortsetzung](docs/handoffs/2026-09-28-laptop-fortsetzung.md).

## Historischer Stand vom 27.09.2026

Damals verwendeter Arbeitszweig:
`codex/vokabeltrainer-v1`.

### Pause und Laptop-Übergabe

**Damals beauftragt: nach dem ersten realen Anmeldetest sichern und pausieren.**
Der Nutzer bestätigt am 27.09.2026: HTTPS-App eingerichtet, über Google
angemeldet, zum Trainer zurückgekehrt und nach F5 weiterhin verbunden.
Die [Laptop-Pausenübergabe](docs/handoffs/2026-09-27-laptop-pause.md) war damals
der maßgebliche Einstieg. Sie trennt diesen Nutzerbericht von früheren
automatisierten Nachweisen und enthält Start, Konfiguration, Konzepte und offene
Arbeit. Tokenablauf, Browserneustart, Auswahl des vorhandenen Drive-Bestands
und Zweitgerät bleiben offen. Bis zur ausdrücklichen Fortsetzung keine weiteren
Produktänderungen oder Testsitzungen beginnen.

Ausgangspunkt dieser reinen Dokumentationssicherung ist `6493590` auf
`codex/vokabeltrainer-v1`; der Checkout war sauber. Der Abschlusscommit dieser
Übergabe folgt auf demselben Zweig. Push und exakter Remote-Vergleich erfolgen
nach den Dokumentationsprüfungen; keine persönlichen Daten werden übernommen.

## Nachbesserung aus dem Nutzertest vom 27.09.2026

Der Nutzer bestätigt inzwischen: **Der Kauf funktioniert**, dauert aber noch
zu lange. Vorrang hat jetzt die automatische Google-Anmeldung nach Neuladen
und Ablauf des Zugriffs. Die kostenlose Cloudflare-Vorbereitung ist mit
Nutzerantwort A bestätigt. Aktuelle Untersuchung und Umsetzung:
[Übergabe zu Anmeldung und Tempo](docs/handoffs/2026-09-27-anmeldung-und-tempo.md).
Ausgangspunkt ist Produktcommit `1c9e497`. Die optionale Serveranmeldung ist
lokal implementiert. Im anschließend beauftragten gemeinsamen Anbietertest
sind Worker und D1 einschließlich Tabellen/Indizes und Bindung eingerichtet.
Google-Adressen sind nach Nutzerrückmeldung vorbereitet. Secret-Namen und
D1-Struktur wurden beim Anbieter geprüft. Wrangler 4.142.0 hat Probelauf,
Anmeldung und privaten App-Upload erfolgreich abgeschlossen; dabei wurden
Worker-Logs ausdrücklich ausgeschaltet und Vorschauadressen ausgeschaltet
belassen. Die App ist unter
[der privaten Testadresse](https://vokabeltrainer.marco-civico.workers.dev/trainer/)
erreichbar, der unangemeldete Sitzungsstatus und gesperrte interne Dateipfade
sind geprüft. Version: `45b6cb48-486f-45c1-8afc-4425206af8b6`.
Der anschließende gemeinsame Test ist für Google-Anmeldung und F5 durch den
Nutzer bestätigt. Token-Erneuerung und Geräteprüfungen stehen noch aus.
Der Nutzer plant nur den Einsatz im Freundeskreis. Eine öffentliche
Produktveröffentlichung ist nicht geplant; der private Serverbetrieb benötigt
trotzdem eine erreichbare HTTPS-Adresse. [Entwurf](docs/superpowers/specs/2026-09-27-server-anmeldung-design.md)
und [Plan](docs/superpowers/plans/2026-09-27-server-anmeldung.md).

Aktueller lokaler Gesamtprüfstand der Servervariante: **580/580 Node-Tests und
58/58 Browserfälle**, jeweils ohne Fehler oder übersprungene Fälle. 161
öffentliche Dateien werden getrennt für den privaten Serverbetrieb vorbereitet.
[Prüfbericht](docs/reports/2026-09-27-server-anmeldung.md) und
[Einrichtungsanleitung](docs/CLOUDFLARE-EINRICHTUNG.md) halten Grenzen und
weiteren Ablauf fest. Die unabhängige Gesamtprüfung und gezielte Nachprüfung
sind mit Spec/Qualität PASS abgeschlossen. Der normale lokale Start bleibt im
Browsermodus.

Geprüfter Produktcommit: `e270ae727c2da5e3b1ca7db71b28f014c3fb7de9`.
Dieser Stand wurde auf `origin/codex/vokabeltrainer-v1` gepusht und per
Remote-SHA exakt bestätigt. Der anschließende Dokumentationsabschluss ergänzt
nur diesen Nachweis. Zum damaligen Produktabschluss gab es keinen Merge nach
`main`, keine Kontoanlage und keine Bereitstellung. Die spätere private
Bereitstellung und der aktuelle Nutzertest sind oben separat dokumentiert.

Das vorherige Korrekturpaket behandelt Abgleichschleifen, langsame bzw. wiederholt
bestätigte Käufe, unerwartete Google-Trennungen und eine parallele Neuanlage.
Der damalige Einstieg steht in der
[Übergabe zu Abgleich und Käufen](docs/handoffs/2026-09-27-sync-und-kaeufe.md),
Ursachen und Prüfgrenzen im [Prüfbericht](docs/reports/2026-09-27-sync-und-kaeufe.md).
Finaler Prüfstand dieses Pakets: **543/543 Node-Tests und 54/54 Browserfälle**,
unabhängige Nachprüfungen ohne verbleibenden Befund. Echte Drive-Laufzeit und
iOS-/Zwei-Geräte-Abnahme bleiben offen; im unveränderten lokalen Browsermodus
bleibt nach Reload ein Google-Klick nötig.

Die Bedienkorrekturen vom 27.09. umfassen den Updatehinweis, die einheitliche
Figurendarstellung mit direkt erreichbaren Farben, den Google-Wiederverbindenweg
im Shop und kompakte Erwachsenen-Einstellungen. Prüfstand und Ursachen stehen
im [Bedienbericht](docs/reports/2026-09-27-bedienkorrekturen.md), Einstieg und
Grenzen in der [vorherigen Übergabe](docs/handoffs/2026-09-27-bedienkorrekturen.md).

## Vorheriger Abschlussstand

Version 1 und die Überarbeitung A1–C2 bleiben die Produktbasis. Das bestätigte Kaufpaket (Tasks 1–6) ist umgesetzt und unabhängig geprüft.
Alle sechs Abschlussbefunde sind geschlossen. Auf Produktstand `1e29ac3`
bestanden frisch 506/506 Node-Tests und 43/43 Browserfälle; die abschließende
Nachprüfung bewertet Spec und Qualität mit PASS. Der Produktcommit ist auf
GitHub exakt bestätigt. Die nachfolgende Dokumentation ergänzt Prüfbelege,
Bedienungsanleitung und portable Übergabe auf demselben Entwicklungszweig.
Die ausführlichen Belege stehen im
[Abschlussbericht](docs/reports/2026-09-27-persistent-purchases-final.md).

## Kaufpaket Tasks 1–6

| Task | Stand | Ergebnis / Nachweis |
| --- | --- | --- |
| 1 – Vertrag und Historie | abgeschlossen und unabhängig freigegeben | Strikte Schemata, echte Lernpunkte, vollständige Beleg-/Basis-/Proofhistorie, portable Fremdherkunft. [Bericht](docs/reports/2026-09-21-persistent-purchases-task1-fix.md), [Review](docs/reports/2026-09-21-persistent-purchases-task1-review.md) |
| 2 – Transport und Einrichtung | abgeschlossen und unabhängig freigegeben | Gebundener Drive-Transport, persistierte Reservierungen und eindeutige Configinstallation. [Bericht](docs/reports/2026-09-21-persistent-purchases-task2-implementation.md), [Review](docs/reports/2026-09-21-persistent-purchases-task2-fix2-review.md) |
| 3 – Kaufdienst und Recovery | abgeschlossen und unabhängig freigegeben | `storageVersion:3`, atomare Migration, persistierte Aufträge, Wiederaufnahme und unveränderte Kandidaten/IDs. [Bericht](docs/reports/2026-09-21-persistent-purchases-task3-implementation.md), [letzte Nachprüfung](docs/reports/2026-09-26-persistent-purchases-task3-fix2-review.md) |
| 4 – Produktintegration, Restore und Backup | abgeschlossen und unabhängig freigegeben | Format-3-Aktivierung, dauerhafte Entdeckung vor Download, autoritativer Kopf nach Reconcile, v3-Sicherungsclosure und Offline-Quellcheckpoint. [Bericht](docs/reports/2026-09-26-persistent-purchases-task4-implementation.md), [letzte Nachprüfung](docs/reports/2026-09-26-persistent-purchases-task4-fix2-review.md) |
| 5 – Bedienoberfläche und Laufzeit | abgeschlossen und unabhängig geprüft | Drei Figurenbereiche, echte Kaufaktionen, aktuelle Sicherung und profilgetrennte Auswahl; sämtliche Important- und Minor-Befunde geschlossen |
| 6 – Gesamtprüfung und Übergabe | abgeschlossen | 506/506 Node, 43/43 Browser auf 1e29ac3; alle RF-Befunde geschlossen; Produktstand exakt auf GitHub bestätigt, Dokumentationsabschluss folgt auf demselben Zweig |

Die historischen Testzahlen 379/389/403/471/489/492 gehören zu den jeweils
datierten Zwischenberichten. Sie sind kein Ersatz für den frischen finalen
Task-6-Gesamtlauf.

## Tatsächlicher Daten- und Kaufstand

- Neue Lernereignisse und Pakete bleiben im Fachformat v2. Unveränderte
  v1/v2-Objekte, Upload-IDs und Hashes werden nicht umgeschrieben.
- Der lokale Produktzustand verwendet `storageVersion:3`. Aktivierte
  Kaufepochen, wirtschaftliche Köpfe und portable wirtschaftliche Sicherungen
  verwenden Format 3.
- Lernpunkte bleiben unverändert: 10 pro richtiger Antwort und 20 pro
  abgeschlossener Runde. Ausgaben verringern weder Lernpunkte noch Level.
  Guthaben, Besitz und Auswahl werden je Profil aus der vollständigen
  bestätigten Historie abgeleitet.
- Kauf, Aktivierung und Restore speichern Intent, Kandidat, vollständige
  Uploadclosure, reservierte Datei-IDs und Pointerdaten vor der ersten davon
  abhängigen Netzoperation. Nach unbekanntem Ausgang wird zuerst gelesen;
  eine Pointerwiederholung erfolgt nur ausdrücklich mit identischem Auftrag.
- ProductSync verankert Configref und Config über `commerce.discover` dauerhaft
  vor dem Produktdownload. Erst `commerce.reconcile` darf nach Prüfung von
  Koordinator, Kopf und Historie die gemeinsame Epoche atomar aktivieren.
- Backups enthalten die vollständige wirtschaftliche Herkunft, aber keine
  Tokens, ETags, Pointerbodies oder ausführbaren Jobs. Ein neutraler Checkpoint
  darf ausschließlich im Offline-Backupexport und Quellreplay vorkommen. Die
  autoritative Zielkette lehnt ihn als Kopf oder Vorgänger ab. Auch bei gleicher
  Bindung werden checkpointlokale Objekte über reservierte physische IDs
  portabel abgebildet.
- Die Beleggeschichte wird vollständig erhalten. Es gibt keine feste
  64-Belege-Lebenszeitgrenze und keine automatische Löschung.
- Die Laufzeit bindet den Kaufdienst über schmale Commerce-Ports ein. Erwachsene
  sehen vor der Aktivierung eine rein lokale Vorschau; erst die ausdrückliche
  Bestätigung startet die dauerhaft vorbereitete Veröffentlichung.
- Im Avatarbereich stehen „Meine Figur“, „Entwicklung“ und „Shop“ oben. Der
  klassische Avatar folgt darunter im aufklappbaren Bereich „Klassischen Avatar
  gestalten“. Verfügbares Guthaben, Besitz und Auswahl werden je Profil aus dem
  bestätigten Ledger angezeigt; unklare Kaufantworten lassen sich mit „Kauf
  fortsetzen“ wiederaufnehmen.
- Der Service Worker verwendet Cacheversion `v29`. Server-Allowlist und
  Pflicht-Precache enthalten die neuen Laufzeitmodule, vier Drachenbilder und
  alle 20 kleinen Haut-/Kleidungsbilder der menschlichen Grundfiguren;
  Google-Antworten, Sitzungs- und Proxyantworten werden nicht gecacht.

## Bestätigter Produktumfang

Die Anforderungen R01–R33, E01–E10 und U01–U07 bleiben bestätigt. Für die
Avatar-/Shop-Erweiterung gelten AV01–AV12, O-AV01 und EV01–EV05: Käufe nur
online nach erfolgreichem Abgleich, getrennte Konten je Profil, ein gemeinsamer
Kopf je Datensatz und vollständige Entwicklungsstufenkäufe für 200/400/800
Punkte. Die Bereiche heißen „Meine Figur“, „Entwicklung“ und „Shop“.

Vier vom Nutzer bestätigte freigestellte Drachenquellen werden unverändert als
erste kaufbare Entwicklungsreihe verwendet und im Offlinecache vorgehalten.
Sie belegen zusammen 6.898.398 Bytes; kleinere responsive Varianten wurden
nicht erzeugt. **72 weitere Motive** einschließlich responsiver
Produktionsvarianten bleiben ein getrenntes Bildpaket. Die vollständige
Galeriegestaltung mit weiter ausgebautem Klassisch-/Entwicklungswechsel und
zusätzlicher Fortschrittsdarstellung bleibt Folgeumfang. Daraus darf keine
vollständige EV05-Galerie oder visuelle Abnahme abgeleitet werden.

## Noch offen am 28.09.2026

- Wiederaufnahme über regulären Tokenablauf; Laptop-Anmeldung, Bestandsübernahme
  und vollständiger Abgleich sind historisch belegt, Chrome-Neustart vom Nutzer
  bestätigt; der Google-Status nach dem jüngsten Neuladen ist wegen einer
  ergebnislosen UI-Abfrage offen;
- Nutzerrückmeldung zur Wartezeit des bereitgestellten Tempopakets; eine
  weitere größere Optimierung erst nach konkreter Restlatenzdiagnose und
  abgestimmtem Design; die langsame Bestandsübernahme bleibt separat;
- persönliche Nachprüfung von Figurenfarben, Auswahl und Erwachsenen-Einstellungen;
- realer Produktabgleich mit Google Drive auf zwei physischen Geräten;
- iPhone-/iPad-, Safari- und Home-Bildschirm-Abnahme einschließlich
  Wiederaufnahme nach App-/Browserneustart;
- Produktion und persönliche Sichtprüfung der 72 übrigen Bildmotive;
- praktische HTTPS-Abnahme im Freundeskreis nach bestandenem Anmeldetest;
- allgemeine Lizenzentscheidung weiterhin zurückgestellt, ohne Sperre für die private Entwicklung.

Automatisierte Tests verwenden synthetische Daten und eine simulierte
Google-Grenze. Der historische echte Bericht 10 bestätigt 6/6 Szenarien der
damaligen isolierten Probe; er wird nicht unverändert wiederholt und ersetzt
keine reale Abnahme des integrierten Produkts.

## Historische Nachweise

- [v1-Abschluss](docs/reports/2026-09-18-vokabeltrainer-v1.md)
- [Überarbeitung A1–C2](docs/reports/2026-09-19-ueberarbeitung.md)
- [Avatar-/Shop-Entscheidungen](docs/design/2026-09-19-avatar-shop-entscheidungen.md)
- [Entwicklungsstufen EV01–EV05](docs/design/2026-09-20-avatar-entwicklungsstufen.md)
- [echte isolierte Kaufprobe 10](docs/reports/2026-09-20-shop-v10-reallauf.md)
- [Kaufplan und Taskberichte](docs/superpowers/plans/2026-09-20-persistent-purchases.md)

Ältere Pausenübergaben und Diagnoseberichte bleiben Belege ihres Datums. Ihre
damaligen nächsten Schritte gelten nicht als aktuelle Arbeitsanweisung.

## Nächste Schritte nach ausdrücklicher Fortsetzung

1. Den [Tempobericht](docs/reports/2026-09-28-kaufablauf-tempo.md) und die
   [Laptop-Übergabe](docs/handoffs/2026-09-28-laptop-fortsetzung.md) lesen.
   Den aktuellen Google-Status nach dem jüngsten Neuladen klären und den
   regulären Tokenablauf nachweisen, sobald er tatsächlich eingetreten ist.
   Die erfolgreiche Einrichtung und Bestandsübernahme nicht wiederholen.
2. Die Nutzerrückmeldung zur nun bereitgestellten Kaufbeschleunigung einholen.
   Der [getrennte Teststand](docs/KAUFTEST-MIT-TESTPUNKTEN.md) ist eingerichtet;
   Stufe 3 ist gekauft und nach Neuladen gewählt. 1.000 Punkte bleiben
   verfügbar, Stufe 4 kostet 800 Punkte. Einrichtung und Import nicht
   wiederholen. Vor einem größeren Folgepaket Restlatenz und Design klären.
3. Die korrigierten Bedienwege mit dem Nutzer nachtesten; besonders
   Figurenfarben, Wiederverbinden im Shop und die Erwachsenen-Einstellungen.
4. Am bestätigten Bild- und Galeriekonzept ansetzen: 72 übrige Motive und
   responsive Varianten produzieren, anschließend vollständige EV05-Galerie
   integrieren und visuell prüfen.
5. Das integrierte Produkt auf zwei realen Geräten einschließlich iPhone/iPad
   prüfen; die historische Probe 10 nicht unverändert wiederholen.
6. Die private HTTPS-Bereitstellung von Cache v31 als erledigt behandeln;
   daraus keine öffentliche Produktfreigabe oder Lizenzentscheidung ableiten.

Keine weitere allgemeine Startfreigabe verlangen. Merge nach `main`, Hosting,
Cloudkontenänderungen und reale Geräteabnahme sind durch den Abschluss dieses
Kaufpakets nicht automatisch autorisiert. Einstieg über den
[aktuellen Tempobericht](docs/reports/2026-09-28-kaufablauf-tempo.md) und die
[Laptop-Übergabe](docs/handoffs/2026-09-28-laptop-fortsetzung.md).
