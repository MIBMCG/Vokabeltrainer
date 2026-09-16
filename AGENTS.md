# Mitarbeit durch KI-Assistenten und Menschen

Diese Datei gilt für das gesamte Repository. Sie ist anbieterunabhängig und setzt weder Codex noch lokale Skills, Erinnerungen oder bestimmte Betriebssysteme voraus.

## Einstieg bei jeder Fortsetzung

1. Diese Datei und [START-HIER.md](START-HIER.md) lesen.
2. [ARBEITSSTAND.md](ARBEITSSTAND.md) und die dort verlinkte aktuelle Übergabe lesen.
3. Branch, letzte Commits, Remote und lokale Änderungen prüfen. Vorhandene Änderungen erhalten.
4. Die für die Aufgabe relevanten [Anforderungen](docs/ANFORDERUNGEN.md) und den [Architekturentwurf](docs/ARCHITEKTUR.md) lesen.
5. Kurz benennen, welches konkrete Ergebnis jetzt bearbeitet wird.

Bei Widersprüchen hat die aktuelle ausdrückliche Nutzeranweisung Vorrang. Bestätigte Entscheidungen nicht erneut zur Abstimmung stellen, sofern keine neue technische Evidenz einen Konflikt zeigt.

## Aktueller Projektzustand

Zum dokumentierten Start am 16.09.2026 existieren nur Dokumentation und Repository-Grunddateien. Es gibt keine App, keine Google-Anbindung, keine eingerichtete Hostingumgebung und keine Produkttests. Aktuelle Änderungen können diesen Stand später erweitern; maßgeblich sind Dateien und Prüfbelege.

Das erste Dokumentationspaket wurde beauftragt und veröffentlicht. Der anschließende Nutzerauftrag lautet: alle offenen Punkte Frage für Frage mit Optionen und einer Empfehlung klären, jede Antwort direkt in den Anforderungen festhalten und nach vollständiger Klärung mit der Entwicklung beginnen. Diese bedingte Entwicklungsfreigabe erhalten; keine erneute pauschale Startgenehmigung verlangen, sobald der abgestimmte Umfang vollständig feststeht. Noch offene Produktideen, Cloudkontenänderungen oder die Veröffentlichung einer laufenden App sind damit nicht automatisch freigegeben.

Die Einzelfragen Q1–Q14 sind beantwortet. Der [Gesamtentwurf](docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md) liegt zur Prüfung vor; seine Ergänzungen E01–E10 sind noch nicht bestätigt. Keine neue Reihe loser Einzelfragen beginnen und bereits entschiedene Anforderungen nicht erneut abfragen. Nach Abstimmung des konkreten Entwurfs den Implementierungsplan erstellen und mit der beauftragten Entwicklung beginnen. Reale Google-/Geräteprüfungen bleiben gesonderte Nachweise.

## Feste Leitplanken

- Zielgruppe: 10–13 Jahre, Klasse 4–7.
- Plattformübergreifende Web-App mit besonderem Schwerpunkt iOS/iPadOS.
- Lernrichtung zunächst Deutsch nach Englisch mit Texteingabe.
- Sofortige Richtig-/Falsch-Rückmeldung, bei Fehlern die richtige Schreibweise, anschließend „Weiter“.
- Fehler häufiger wiederholen; die Richtigserie je Wort und Kind über Runden hinweg erhalten. Nach drei richtigen Antworten für den Rest der Runde pausieren und später nach den festgelegten Tagesabständen wiederholen (R08/R19 in den Anforderungen).
- Google Drive; gemeinsamer, von Eltern eingerichteter Google-Zugang auf beiden Geräten; getrennte Lernprofile in der App.
- Kein zusätzliches kostenpflichtiges Cloudabo, kein stillschweigender Anbieterwechsel.
- Die allgemeine Lizenzentscheidung ist bewusst zurückgestellt (R31). Vorerst keine allgemeine Open-Source-Lizenz hinzufügen und daraus keine Änderung der Repository-Sichtbarkeit ableiten. Die beauftragte private Entwicklung und portable Weiterarbeit bleiben möglich.
- Altersgerechte Gestaltung und ein gemeinsames Belohnungssystem aus Lernreise/Landkarte, Punkten/Leveln/Abzeichen und einfachem gestaltbarem Avatar gehören zur ersten Version. Gewähltes Thema: Insel-Abenteuer mit unterschiedlichen Landschaften. Beim Avatar zunächst wenige Farben und Zubehörteile vorsehen. Punktevergabe: 10 je richtiger Antwort, 20 zusätzlich je abgeschlossener Runde, keine Punktabzüge bei Fehlern (R23). Level-Meilensteine schalten Reiseabschnitte und Ausstattung automatisch frei; Abzeichen für Meilensteine, kein zusätzlicher Münzladen (R24). Konkrete Grafiken, Umfang der Welt und Schwellenwerte sind noch offen.

## Planen und umsetzen

- Nutzerentscheidungen, technische Vorschläge, implementierte Funktionen und tatsächlich geprüfte Ergebnisse getrennt ausweisen.
- Die offenen Fragen stehen zentral in [ANFORDERUNGEN.md](docs/ANFORDERUNGEN.md). Abhängige Entscheidungen vor der jeweiligen Umsetzung klären; unabhängige autorisierte Arbeit fortsetzen.
- In der aktuellen Klärungsphase jeweils genau eine Frage stellen, möglichst mit mehreren klar unterscheidbaren Optionen und einer begründeten Empfehlung. Jede Antwort parallel dokumentieren; zuerst vollständig klären, dann entwickeln.
- Vor größeren Implementierungspaketen ein konkretes Design und dessen Grenzen abstimmen. Eine Dokumentationsfreigabe nicht als Zustimmung zu allen enthaltenen Vorschlägen auslegen.
- Falls Superpowers-Skills vorhanden und angefordert sind: Brainstorming, abgestimmtes Design, anschließend Implementierungsplan und passende Verifikation nutzen. Ohne diese Skills denselben Ablauf in normaler Sprache durchführen; fehlende anbieterspezifische Werkzeuge blockieren die Fortsetzung nicht.
- Die [Roadmap](docs/ROADMAP.md) ist eine Arbeitsreihenfolge, kein freigegebener, direkt ausführbarer Implementierungsplan.
- Abhängigkeiten und Frameworks nur mit begründetem Nutzen einführen. Dateien nach klaren Verantwortlichkeiten gliedern; keine unnötige Ein-Datei-Vorgabe.
- Keine substanziellen Änderungen an Kostenmodell, Kontenmodell oder Produktumfang aus einer bloßen Annahme ableiten.

## Daten und Synchronisation

- Vokabelinhalt, Lernprofil und Übungsergebnis fachlich trennen.
- Eine falsche Antwort oder ein Profilwechsel darf andere Lernstände nicht überschreiben.
- Offlineänderungen und wiederholte Übertragungsversuche müssen ohne Verlust und ohne doppelte Wertung zusammengeführt werden.
- Eine gemeinsame JSON-Datei nicht ungeschützt nach dem Prinzip „letzter Upload gewinnt“ überschreiben.
- Lokales Speichern, ausstehender Upload und bestätigter Cloudabgleich sind unterschiedliche Zustände. Die Oberfläche muss sie wahrheitsgemäß darstellen.
- Google-Tokens, Passwörter, private Schlüssel, persönliche Backups und echte Lernprofile weder committen noch in Berichte kopieren. Nur synthetische Testdaten verwenden.
- Öffentliche OAuth-Client-ID und private Zugangsdaten unterscheiden. Ein Client-Secret gehört nicht in Browsercode. Details: [Google-Einrichtung](docs/GOOGLE-DRIVE-EINRICHTUNG.md).
- Ein gemeinsamer Google-Zugang ersetzt keine serverseitige Rollentrennung. Die beschlossene vierstellige PIN für die Erwachsenenansicht (R27) ist eine Bedienhürde, keine zugesagte Sicherheitsgrenze. Keine echte PIN in Dokumentation oder Repository aufnehmen; ihre Einrichtung und Wiederherstellung im Detaildesign berücksichtigen.

## Prüfung

- Funktionsänderungen mit passenden Tests prüfen. Bei Lernlogik und Synchronisation relevante Fehlerszenarien zuerst reproduzieren und anschließend den Erfolg belegen.
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
