# Mitarbeit durch KI-Assistenten und Menschen

**Aktive Umsetzung:** Der Gesamtentwurf ist mit „Ja, starte nun“ am 19.09.2026 ausdrücklich freigegeben. Die Umsetzung nach [Avatar-Shop-Plan](docs/superpowers/plans/2026-09-19-avatar-shop.md) läuft; keine erneute allgemeine Startfreigabe verlangen. Kaufprobe und Katalog sind implementiert und unabhängig geprüft. Die Halskorrektur ist im bisherigen Produkt umgesetzt; alle 13 neuen Figurenbilder und ihre Ausrüstung sind getrennt vorbereitet und geprüft. Die erste echte Drive-Kaufprobe vom 20.09.2026 ist nicht bestanden; die verbesserte Diagnoseversion 2 ist veröffentlicht; ihr echter Ergebnisbericht fehlt noch. Neue Figurenwahl und Käufe sind nicht aktiviert. Die sechs konkret nachgewiesenen Passformfehler sind am 20.09.2026 korrigiert und unabhängig an den tatsächlichen Bildern nachgeprüft: fünf Umhänge mit vorderer Befestigung, passende Hirsch-Hinterlage und vier sitzende Tigerreifen. 372 Node- und fünf gezielte Browsertests bestanden. [Korrekturbericht und Vorschau](docs/reports/2026-09-20-avatar-passform.md). Persönliche Sicht-/Geräteabnahme bleibt offen. Aktuelle [Avatar-Shop-Übergabe](docs/handoffs/2026-09-19-avatar-shop.md).

**Neuer Folgeauftrag vom 19.09.2026:** [Avatar-/Shop-Entscheidungen AV01–AV12](docs/design/2026-09-19-avatar-shop-entscheidungen.md) sind bestätigt. Die neue ausdrückliche Shop-Anforderung ersetzt für dieses Paket den älteren Ausschluss eines Münzladens. Die Regel zu getrennter, kompatibler Ausstattung je Figurenart ist mit A bestätigt. O-AV01 ist mit A beantwortet: neue Käufe nur online nach erfolgreichem Abgleich. Der [konkrete Gesamtentwurf](docs/superpowers/specs/2026-09-19-avatar-shop-design.md) ist freigegeben. Technische Kaufkoordination und Bildpipeline werden nach dem neuen Plan umgesetzt. Der vorhandene A1–C2-Abschluss ist kein Implementierungsnachweis für diese Erweiterung.

Version 1 ist am 18.09.2026 implementiert und automatisiert geprüft. Die freigegebene Überarbeitung vom 19.09.2026 ist implementiert, vollständig automatisiert geprüft und unabhängig nachgeprüft. Maßgeblich sind [Arbeitsstand](ARBEITSSTAND.md), [bisheriger v1-Abschlussbericht](docs/reports/2026-09-18-vokabeltrainer-v1.md) und [aktuelle Übergabe](docs/handoffs/2026-09-19-ueberarbeitung.md). Die unabhängige Gesamtprüfung der bisherigen Version einschließlich der vier Abschlusskorrekturen ist bestanden. Reale Produkt-Google-, Zwei-Geräte-, iPhone-/iPad- und HTTPS-Nachweise bleiben offen.

Änderung der Prüfungsreihenfolge am 17.09.2026: Der Nutzer beauftragt ausdrücklich, zuerst die vollständige App gemäß bestätigtem Gesamtentwurf umzusetzen und erst danach beim Freund auf iPhone/iPad zu testen. Die bisherige Geräteprüfung vor umfangreicher Lernoberfläche ist damit als Entwicklungssperre aufgehoben. Reale Geräteabnahme bleibt offen und darf nicht als bestanden gelten. Bereits bestätigte manuelle Google-/Drive-Tests in zwei Browsern gelten weiter. Keine neue pauschale Startfreigabe verlangen; Hosting/Veröffentlichung und Kostenmodell werden dadurch nicht automatisch geändert.

Diese Datei gilt für das gesamte Repository. Sie ist anbieterunabhängig und setzt weder Codex noch lokale Skills, Erinnerungen oder bestimmte Betriebssysteme voraus.

## Einstieg bei jeder Fortsetzung

1. Diese Datei und [START-HIER.md](START-HIER.md) lesen.
2. [ARBEITSSTAND.md](ARBEITSSTAND.md) und die dort verlinkte aktuelle Übergabe lesen.
3. Branch, letzte Commits, Remote und lokale Änderungen prüfen. Vorhandene Änderungen erhalten.
4. Die für die Aufgabe relevanten [Anforderungen](docs/ANFORDERUNGEN.md) und den [Architekturentwurf](docs/ARCHITEKTUR.md) lesen.
5. Kurz benennen, welches konkrete Ergebnis jetzt bearbeitet wird.

Bei Widersprüchen hat die aktuelle ausdrückliche Nutzeranweisung Vorrang. Bestätigte Entscheidungen nicht erneut zur Abstimmung stellen, sofern keine neue technische Evidenz einen Konflikt zeigt.

## Aktueller Projektzustand

Die statische Produkt-App liegt unter `trainer/`; die technische Drive-Probe bleibt getrennt unter der Wurzel. Tasks 1–13 setzen den bestätigten v1-Umfang um. Automatisierte Node- und Browserprüfungen sind bestanden; sie verwenden synthetische Daten und eine simulierte Google-Grenze. Die unabhängige Gesamtprüfung ist abgeschlossen. Reale Produktverbindung mit Google Drive auf zwei physischen Geräten, Apple-Geräteabnahme und HTTPS-Bereitstellung stehen noch aus.

Die Einzelfragen Q1–Q14 sowie der [Gesamtentwurf](docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md) einschließlich E01–E10 sind bestätigt (Nutzerantwort A vom 16.09.2026). Die Entwicklung beginnt nach dem [Plan zur Google-Drive-Probe](docs/superpowers/plans/2026-09-16-google-drive-probe.md). Keine erneute Entwurfs- oder pauschale Startfreigabe einholen. Reale Google-/Geräteprüfungen bleiben gesonderte Nachweise. Die frühe Verbindungsprobe wurde durchgeführt. Die restliche echte Geräteprüfung erfolgt auf Nutzerwunsch erst nach Umsetzung der vollständigen App.

Aktuelle Steuerung vom 19.09.2026: Tasks 1–13 und Abschlussreview der bisherigen Version sind abgeschlossen. Der Nutzer hat nach eigenem Test den [Überarbeitungsentwurf](docs/design/2026-09-19-ueberarbeitung.md) mit „Ja, Freigabe erteilt“ bestätigt. Gestaltung näher am Konzept, Rasterillustrationen, einfachere Einrichtung und Verwaltung, erklärte Modi, Regeln je Kind und Statistiken sind damit konkret abgestimmt. Google Drive mit vorbereiteter App-Konfiguration bleibt; kein Excel-Wechsel. Der [Implementierungsplan in drei Etappen](docs/superpowers/plans/2026-09-19-ueberarbeitung.md) ist erstellt, selbstgeprüft und mit Nutzerantwort A zur Ausführung mit Aufgabenagenten und Einzelreviews freigegeben. A1–C2 sind einschließlich unabhängiger Gesamtprüfung, gezielter Korrekturen und Nachprüfung abgeschlossen. Die Umsetzung nicht neu beginnen. Aktuelle Nachweise stehen im [Überarbeitungsbericht](docs/reports/2026-09-19-ueberarbeitung.md); reale Geräteabnahme und HTTPS-Bereitstellung bleiben eigenständige nächste Schritte. Ältere Pausen- und Zwischenstandsnotizen sind historische Vorgeschichte; keine erneute Entwurfs- oder allgemeine Startfreigabe verlangen.

## Feste Leitplanken

- Zielgruppe: 10–13 Jahre, Klasse 4–7.
- Plattformübergreifende Web-App mit besonderem Schwerpunkt iOS/iPadOS.
- Lernrichtung zunächst Deutsch nach Englisch mit Texteingabe.
- Sofortige Richtig-/Falsch-Rückmeldung, bei Fehlern die richtige Schreibweise, anschließend „Weiter“.
- Fehler häufiger wiederholen; die Richtigserie je Wort und Kind über Runden hinweg erhalten. Standardmäßig nach drei richtigen Antworten für den Rest der Runde pausieren und später nach 1/3/7/14 Tagen wiederholen. Die bestätigte Überarbeitung erlaubt getrennte Regeln je Kind, einen optionalen Ausschluss und Wiederaktivierung. Neue Regeln gelten ab der nächsten neuen Runde; vorhandene Runden behalten Policy und Wortgenerationen. Antworten und erworbene Belohnungen werden nicht zurückgesetzt.
- Google Drive; gemeinsamer, von Eltern eingerichteter Google-Zugang auf beiden Geräten; getrennte Lernprofile in der App.
- Kein zusätzliches kostenpflichtiges Cloudabo, kein stillschweigender Anbieterwechsel.
- Die allgemeine Lizenzentscheidung ist bewusst zurückgestellt (R31). Vorerst keine allgemeine Open-Source-Lizenz hinzufügen und daraus keine Änderung der Repository-Sichtbarkeit ableiten. Die beauftragte private Entwicklung und portable Weiterarbeit bleiben möglich.
- Altersgerechte Gestaltung und ein gemeinsames Belohnungssystem aus Lernreise/Landkarte, Punkten/Leveln/Abzeichen und einfachem gestaltbarem Avatar gehören zur ersten Version. Gewähltes Thema: Insel-Abenteuer mit unterschiedlichen Landschaften. Beim Avatar zunächst wenige Farben und Zubehörteile vorsehen. Punktevergabe: 10 je richtiger Antwort, 20 zusätzlich je abgeschlossener Runde, keine Punktabzüge bei Fehlern (R23). Level-Meilensteine schalten Reiseabschnitte und Ausstattung automatisch frei; Abzeichen für Meilensteine, kein zusätzlicher Münzladen (R24). Umfang und Schwellenwerte sind mit E04 bestätigt; die tatsächlichen Grafiken werden innerhalb dieses Umfangs gestaltet.

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
