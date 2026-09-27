# Mitarbeit durch KI-Assistenten und Menschen

**Aktuelle Fortsetzung am 27.09.2026:** Vorrang hat die automatische Anmeldung.
Nutzerantwort A bestätigt die lokale Vorbereitung einer optionalen kostenlosen
Cloudflare-Servervariante; Google Drive bleibt Datenspeicher. Echte Kontoanlage,
Google-Konfiguration, Bereitstellung und Geräteabnahme sind nicht erfolgt.
Der Nutzer plant ausschließlich die Nutzung im Freundeskreis, keine öffentliche
Veröffentlichung. Die dafür nötige private HTTPS-Bereitstellung ist von einer
öffentlichen Produktfreigabe zu unterscheiden; Repository-Sichtbarkeit und
Lizenz werden dadurch nicht geändert.
Einstieg und aktuelle Prüfergebnisse stehen in der
[Anmeldeübergabe](docs/handoffs/2026-09-27-anmeldung-und-tempo.md).
Der lokale Browsermodus bleibt erhalten. Keine neue pauschale Startfreigabe
für den bestätigten lokalen Umfang verlangen und keine laufende Bereitstellung
aus einem synthetischen Test ableiten.

**Vorheriger Kaufabschluss:** Version 1 und die Überarbeitung A1–C2
sind abgeschlossen. Das bestätigte Kaufpaket (Tasks 1–6) ist umgesetzt und unabhängig geprüft.
Alle sechs Abschlussbefunde sind geschlossen. Auf Produktstand `1e29ac3`
bestanden frisch 506/506 Node-Tests und 43/43 Browserfälle; die abschließende
Nachprüfung bewertet Spec und Qualität mit PASS. Der Produktcommit ist auf
GitHub exakt bestätigt. Die nachfolgende Dokumentation ergänzt Prüfbelege,
Bedienungsanleitung und portable Übergabe auf demselben Entwicklungszweig.
Maßgeblich sind [Arbeitsstand](ARBEITSSTAND.md) und
[Abschlussbericht](docs/reports/2026-09-27-persistent-purchases-final.md).

Bestätigt bleiben R01–R33, E01–E10, U01–U07, AV01–AV12, O-AV01 sowie
EV01–EV05 einschließlich Onlinekauf, Preisen 200/400/800 und der persönlich
bestätigten Drachenrichtung. Vier freigestellte Drachenquellen sind vorhanden;
72 weitere Motive, deren responsive Produktionsvarianten und die vollständige
Galeriegestaltung bleiben Folgeumfang. Das schließt einen weiter ausgebauten
Klassisch-/Entwicklungswechsel und zusätzliche Fortschrittsdarstellung ein.
Reale Google-Drive-Prüfung auf zwei physischen Geräten, iPhone/iPad, Safari,
Home-Bildschirm-App und HTTPS-Bereitstellung bleiben eigenständige offene
Nachweise. Der echte Google-Bericht 10 mit 6/6 Fällen ist ein historischer
Probe-Nachweis und wird nicht unverändert wiederholt. Frühere datierte
Probe-, Pause- und Zwischenstandsberichte sind Vorgeschichte, keine aktuellen
Startaufträge.

Diese Datei gilt für das gesamte Repository. Sie ist anbieterunabhängig und setzt weder Codex noch lokale Skills, Erinnerungen oder bestimmte Betriebssysteme voraus.

## Einstieg bei jeder Fortsetzung

1. Diese Datei und [START-HIER.md](START-HIER.md) lesen.
2. [ARBEITSSTAND.md](ARBEITSSTAND.md) und die dort verlinkte aktuelle Übergabe lesen.
3. Branch, letzte Commits, Remote und lokale Änderungen prüfen. Vorhandene Änderungen erhalten.
4. Die für die Aufgabe relevanten [Anforderungen](docs/ANFORDERUNGEN.md) und den [Architekturentwurf](docs/ARCHITEKTUR.md) lesen.
5. Kurz benennen, welches konkrete Ergebnis jetzt bearbeitet wird.

Bei Widersprüchen hat die aktuelle ausdrückliche Nutzeranweisung Vorrang. Bestätigte Entscheidungen nicht erneut zur Abstimmung stellen, sofern keine neue technische Evidenz einen Konflikt zeigt.

## Aktueller Projektzustand

Die statische Produkt-PWA liegt unter `trainer/`; die historische technische
Drive-Probe bleibt getrennt unter der Wurzel. Version 1 und A1–C2 sind
abgeschlossen und werden nicht neu umgesetzt. Der Kaufkern unter
`src/trainer/purchases/` besitzt strikte Beleg-, Basis-, Proof-, Transport-,
Bootstrap-, Service- und Integrationsgrenzen. Neue Lernereignisse und Pakete
bleiben im Fachformat v2. `storageVersion:3` ist die lokale Zustandsversion;
nur aktivierte Kaufepochen und die wirtschaftliche Sicherungsclosure verwenden
Format 3.

ProductSync speichert die gebundene Kaufkonfiguration vor dem Download über
`commerce.discover` und übernimmt erst nach `commerce.reconcile` den vollständig
geprüften gemeinsamen Kopf. Aktivierung, Kauf und Restore speichern Auftrag,
Kandidaten und IDs vor abhängigen Netzoperationen. Der neutrale
Provenienzcheckpoint ist ausschließlich für Offline-Backupexport und
Quellreplay zulässig; er darf nie Kopf oder Vorgänger der autoritativen
Zielkette werden. Die Bedienintegration zeigt die drei neuen Register oben im
Avatarbereich, den klassischen Avatar darunter aufklappbar, profilgetrennte
Guthaben, Besitz und Auswahl sowie eine ausdrückliche Wiederaufnahme unklarer
Käufe. Fixrunde 1 korrigiert berichtsgemäß den Rootwechsel, die gemeinsame Basis
von sichtbarer Vorschau und Ticket, die bestätigte Restoreauswahl einschließlich
Leerung, den Grundformstatus und die Portdokumentation. Vier Drachenformen sind
in Laufzeit und Offlinecache eingebunden. Diese funktionale Anbindung ist keine
vollständig ausgelieferte EV05-Galerie. Die Abschlussnachprüfungen schließen auch den Fokusrest und sämtliche
Integrationsbefunde; die Belege stehen im Abschlussbericht.

Alle bisherigen Nutzerentscheidungen sind bereits bestätigt. Keine erneute
Entwurfs- oder pauschale Startfreigabe verlangen. Automatisierte Tests verwenden
synthetische Daten; grüne Node- oder Browserprüfungen ersetzen keine reale
Drive-, Zwei-Geräte- oder Apple-Abnahme.

## Feste Leitplanken

- Zielgruppe: 10–13 Jahre, Klasse 4–7.
- Plattformübergreifende Web-App mit besonderem Schwerpunkt iOS/iPadOS.
- Lernrichtung zunächst Deutsch nach Englisch mit Texteingabe.
- Sofortige Richtig-/Falsch-Rückmeldung, bei Fehlern die richtige Schreibweise, anschließend „Weiter“.
- Fehler häufiger wiederholen; die Richtigserie je Wort und Kind über Runden hinweg erhalten. Standardmäßig nach drei richtigen Antworten für den Rest der Runde pausieren und später nach 1/3/7/14 Tagen wiederholen. Die bestätigte Überarbeitung erlaubt getrennte Regeln je Kind, einen optionalen Ausschluss und Wiederaktivierung. Neue Regeln gelten ab der nächsten neuen Runde; vorhandene Runden behalten Policy und Wortgenerationen. Antworten und erworbene Belohnungen werden nicht zurückgesetzt.
- Google Drive; gemeinsamer, von Eltern eingerichteter Google-Zugang auf beiden Geräten; getrennte Lernprofile in der App.
- Kein zusätzliches kostenpflichtiges Cloudabo, kein stillschweigender Anbieterwechsel.
- Die allgemeine Lizenzentscheidung ist bewusst zurückgestellt (R31). Vorerst keine allgemeine Open-Source-Lizenz hinzufügen und daraus keine Änderung der Repository-Sichtbarkeit ableiten. Die beauftragte private Entwicklung und portable Weiterarbeit bleiben möglich.
- Altersgerechte Gestaltung und ein gemeinsames Belohnungssystem aus Lernreise/Landkarte, Punkten/Leveln/Abzeichen und Avatar gehören zur ersten Version. Gewähltes Thema: Insel-Abenteuer mit unterschiedlichen Landschaften. Punktevergabe: 10 je richtiger Antwort, 20 zusätzlich je abgeschlossener Runde, keine Punktabzüge bei Fehlern (R23). Die spätere, ausdrücklich bestätigte Shop-Erweiterung AV01–AV12/EV01–EV05 ersetzt für Entwicklungsformen den früheren Ausschluss eines Münzladens aus R24. Ausgaben verringern weder Lernpunkte noch Level; Guthaben und Besitz bleiben je Profil getrennt.

## Planen und umsetzen

- Nutzerentscheidungen, technische Vorschläge, implementierte Funktionen und tatsächlich geprüfte Ergebnisse getrennt ausweisen.
- Die offenen Fragen stehen zentral in [ANFORDERUNGEN.md](docs/ANFORDERUNGEN.md). Abhängige Entscheidungen vor der jeweiligen Umsetzung klären; unabhängige autorisierte Arbeit fortsetzen.
- Neue notwendige Produkt-/Einrichtungsfragen weiterhin einzeln stellen und Antworten dokumentieren. Die abgeschlossene Anforderungsklärung nicht neu beginnen; unabhängige autorisierte Entwicklungsarbeit fortsetzen.
- Vor größeren Implementierungspaketen ein konkretes Design und dessen Grenzen abstimmen. Eine Dokumentationsfreigabe nicht als Zustimmung zu allen enthaltenen Vorschlägen auslegen.
- Falls Superpowers-Skills vorhanden und angefordert sind: Brainstorming, abgestimmtes Design, anschließend Implementierungsplan und passende Verifikation nutzen. Ohne diese Skills denselben Ablauf in normaler Sprache durchführen; fehlende anbieterspezifische Werkzeuge blockieren die Fortsetzung nicht.
- Die [Roadmap](docs/ROADMAP.md) ist eine Arbeitsreihenfolge, kein freigegebener, direkt ausführbarer Implementierungsplan.
- Abhängigkeiten und Frameworks nur mit begründetem Nutzen einführen. Dateien nach klaren Verantwortlichkeiten gliedern; keine unnötige Ein-Datei-Vorgabe.
- Keine substanziellen Änderungen an Kostenmodell, Kontenmodell oder Produktumfang aus einer bloßen Annahme ableiten.

## Daten und Synchronisation

- Vokabelinhalt, Lernprofil und Übungsergebnis fachlich trennen.
- Eine falsche Antwort oder ein Profilwechsel darf andere Lernstände nicht überschreiben.
- Offlineänderungen und wiederholte Übertragungsversuche müssen ohne Verlust und ohne doppelte Wertung zusammengeführt werden.
- Unveränderte v1-Objekte und vorbereitete Uploads nicht umschreiben; IDs und Hashes erhalten. Lokale Migration vollständig prüfen, vorherige v1-Sicherung und neuen Zustand atomar speichern. Für neue Regeln/Scheduling und Statistik die gemeinsamen effektiven Fakten verwenden; keine zweite Zähl- oder Auswahlregel in der Oberfläche einführen.
- Eine gemeinsame JSON-Datei nicht ungeschützt nach dem Prinzip „letzter Upload gewinnt“ überschreiben.
- Lokales Speichern, ausstehender Upload und bestätigter Cloudabgleich sind unterschiedliche Zustände. Die Oberfläche muss sie wahrheitsgemäß darstellen.
- Google-Tokens, Passwörter, private Schlüssel, persönliche Backups und echte Lernprofile weder committen noch in Berichte kopieren. Nur synthetische Testdaten verwenden.
- Öffentliche OAuth-Client-ID und private Zugangsdaten unterscheiden. Ein Client-Secret gehört nicht in Browsercode. Details: [Google-Einrichtung](docs/GOOGLE-DRIVE-EINRICHTUNG.md).
- Ein gemeinsamer Google-Zugang ersetzt keine serverseitige Rollentrennung. Die beschlossene vierstellige PIN für die Erwachsenenansicht (R27) ist eine Bedienhürde, keine zugesagte Sicherheitsgrenze. Keine echte PIN in Dokumentation oder Repository aufnehmen; ihre Einrichtung und Wiederherstellung im Detaildesign berücksichtigen.

## Prüfung

- Funktionsänderungen mit passenden Tests prüfen. Bei Lernlogik und Synchronisation relevante Fehlerszenarien zuerst reproduzieren und anschließend den Erfolg belegen.
- Wenn sich eine ausgelieferte Produktdatei ändert oder ein neues Laufzeitmodul hinzukommt, die versionierte Cachekennung in `trainer/sw.js` erhöhen und die explizite Assetliste vollständig halten. Offline- und kontrollierten Updatepfad anschließend mit dem echten Browserfall prüfen.
- Bei reinen Dokumentationsänderungen genügen die betroffenen Verweis-, Inhalts- und Git-Prüfungen; keine Scheintests schreiben.
- Keine nicht existierenden Befehle als ausgeführt oder erfolgreich dokumentieren. Testbefehle erst nach Einrichtung der tatsächlichen Werkzeuge ergänzen.
- Eine Desktopsimulation oder ein WebKit-Test ersetzt keine Abnahme auf echtem iPhone/iPad. Offene Geräteprüfungen offen lassen.
- Vor „fertig“, Commit und Push die für die Änderung erforderlichen aktuellen Prüfungen durchführen und die Ausgabe ansehen.
- Nach einem autorisierten Push lokalen Commit und Remote-Branch vergleichen; ohne Nachweis nicht „auf GitHub“ behaupten.
- Siehe [Qualität und Abnahme](docs/QUALITAET-UND-ABNAHME.md).

## Git und Zusammenarbeit

- Vor Änderungen `git status --short --branch` prüfen. Keine fremden Änderungen zurücksetzen.
- Keine Force-Pushes oder destruktiven Bereinigungen ohne ausdrücklichen Auftrag.
- Veröffentlichungen und Pushes nur im Umfang des aktuellen Auftrags. Für die Projektdokumentation einschließlich Anforderungsklärung und Übergaben ist der Push nach GitHub ausdrücklich beauftragt.
- Git überträgt Programmcode und Dokumentation. Es überträgt keine Browserdaten oder Google-Anmeldesitzungen.
- Relative Links im Repository, UTF-8 und portable Befehle verwenden. Pfade eines einzelnen Arbeitsplatzes sind keine Voraussetzung für andere Systeme.
- Bei Netz- oder Sandboxfehlern den zulässigen Zugriffsweg verwenden; nicht globale Sicherheits- oder Proxyregeln verändern.

## Abschluss und Übergabe

Nach relevanten Arbeitspaketen [ARBEITSSTAND.md](ARBEITSSTAND.md) aktualisieren und eine kurze Übergabe unter `docs/handoffs/` anlegen oder ergänzen. Festhalten:

- Was geändert wurde und warum.
- Aktueller Branch und überprüfbarer Commit-/Remote-Stand.
- Tatsächlich ausgeführte Prüfungen und deren Grenzen.
- Noch offene Entscheidungen und Geräteabnahmen.
- Konkreter nächster Schritt und nötige Eingaben.

Mit dem Nutzer auf Deutsch, klar und knapp kommunizieren. Keine Implementierung behaupten, wenn nur ein Konzept oder eine Dokumentation erstellt wurde.
