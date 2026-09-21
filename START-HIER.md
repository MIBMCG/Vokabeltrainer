# Hier mit der Weiterarbeit beginnen

**Fortsetzung ausdrücklich beauftragt (21.09.2026):** Die Pause ist beendet. Auf `codex/vokabeltrainer-v1` sind die vier wichtigen Task-1-Befunde in `5904dec` korrigiert und unabhängig nachgeprüft. Task 2 (Transport/Einrichtung) läuft; danach Aufgaben 3–6 des bestätigten Kaufplans ausführen. Aktueller Verlauf: [Fortsetzungsübergabe](docs/handoffs/2026-09-21-persistent-purchases-fortsetzung.md). Die [Pause vom 20.09.](docs/handoffs/2026-09-20-pause-persistent-purchases.md) bleibt historische Grundlage. Keine erneute Grundsatzfreigabe nötig; keine reale Geräteabnahme behaupten.

**Echte Kaufprobe 10 bestanden (20.09.2026):** Der vom Nutzer übergebene Google-Bericht bestätigt alle sechs synthetischen Kaufabläufe: Initialisierung, Konkurrenz, Wiederholung, simulierten Antwortverlust und beide Reset-Reihenfolgen. [Auswertung](docs/reports/2026-09-20-shop-v10-reallauf.md), [Auswertungsübergabe](docs/handoffs/2026-09-20-shop-v10-auswertung.md). Keinen identischen 10er-Lauf erneut anfordern. Nächster Schritt ist der konkrete Integrationsentwurf für dauerhafte Aufträge, Wiederaufnahme und Produktdaten. Browserneustart, getrennte Geräte und Produktshop sind noch nicht geprüft beziehungsweise integriert; C und EV01–EV05 bleiben bestätigt. Bericht9s künstlicher ETag-/HTTP500-Fall bleibt separat bestehen.

**Aktueller Stand (20.09.2026):** EV01–EV05 sind bestätigt: vollständige Stufenkäufe für 200 / 400 / 800 Punkte, je vier kostenlose menschliche Hauttöne, zusätzliche klassische Gestaltung und die Bereiche „Meine Figur“, „Entwicklung“, „Shop“. Der reine Stufenkatalog und die ersten vier freigestellten Drachenbilder sind in `650cee7` implementiert beziehungsweise erzeugt und unabhängig geprüft. 379/379 Produkttests bestanden; 4 von 76 Bildmotiven sind vorbereitet. Neue Stufenwahl und Käufe sind noch nicht im Produkt eingebunden. [Grundlagenbericht](docs/reports/2026-09-20-avatar-evolution-foundation.md), [Auswertungsübergabe](docs/handoffs/2026-09-20-shop-v10-auswertung.md).

**Historischer Diagnose-6-/7-Stand:** 6 bestanden, 5 fehlgeschlagen. Vier Abbrüche betreffen veränderte File-Versionen bei gleichbleibender ETag und gleichen verfügbaren Zusatzmerkmalen. Die absichtlich falsche Kennung scheitert mehrdeutig; ein anderer Fall belegt dagegen eine 412-Ablehnung eines alten Tokens. Sichere parallele Käufe bleiben unbewiesen. [Auswertung](docs/reports/2026-09-20-shop-v6-reallauf.md). Keine neue unveränderte Probe anfordern. [Richtungsentscheidung C](docs/design/2026-09-20-kaufkoordination-nach-diagnose6.md) ist bestätigt: direkten Drive-Ansatz gezielt weiter untersuchen. Diagnose 7 trennt jetzt Schreibantwort und Nachlese des Negativfalls; lokal sind 84/84 Shop-Node-Tests und 13/13 Browserfälle bestanden. Die unabhängige Review ist ohne offene relevante Befunde abgeschlossen. Kein zusätzlicher Dienst, keine Änderung des Punktesystems und keine Produktkäufe.

**Bestätigte Stilrichtung vor dem Grundlagenpaket:** Vier vollständig gerenderte Entwicklungsformen je Avatar ersetzen für die künftige Erweiterung die modulare Ausrüstung. Bogen v1 wurde wegen eines zu kleinen Unterschieds zwischen Stufe 3 und 4 nicht abgenommen. Der Nutzer hat den [überarbeiteten Drachenbogen v2](docs/design/avatar-evolution/dragon-stages-concept-v2.png) mit „ja, viel besser“ bestätigt; seine deutlich epischere, mythische Endverwandlung ist die Stilvorlage und braucht keine erneute Bildfreigabe. Die Produktoberfläche bleibt vorerst unverändert. Freigestellte Produktionsgrafiken, weitere Bedienungsdetails, Datenmodell und die restlichen Figuren sind noch offen. Der echte Diagnose-4-Lauf ergab 3 bestandene und 8 fehlgeschlagene Fälle; der v2-ETag-/v3-Schreibkandidat belegt keinen exklusiven Kauf-Guard. [Entscheidung](docs/design/2026-09-20-avatar-entwicklungsstufen.md), [Auswertung](docs/reports/2026-09-20-shop-v4-reallauf.md), [damalige Übergabe](docs/handoffs/2026-09-20-avatar-evolution-prototype.md).

**Historischer Bild- und Probestand vor dem Richtungswechsel:** Klassische Bildbearbeitung ist ausdrücklich freigegeben. Die körperbezogene Nacharbeit aller 13 Figuren / 62 kompatiblen Artikelpaare ist im [Bildbericht v3](docs/reports/2026-09-20-avatar-fit-v3.md) dokumentiert; frühere pauschale Passformurteile bleiben zurückgenommen. Der damalige echte v2-JSON-Bericht belegte eine lesbare Versionskennung, aber keine sichere Kaufkoordination (5 bestanden, 6 fehlgeschlagen). Diagnoseversion 4 ergänzte konkrete Fehlerstellen und Antwortklassen. [Frühere Google-Auswertung](docs/reports/2026-09-20-shop-v2-reallauf.md). Neue Figurenwahl und Käufe sind weiterhin nicht im Produkt aktiviert. [Historische Übergabe](docs/handoffs/2026-09-20-avatar-fit-v3-und-probe-v4.md).

**Historische Grundlage der Shop-Erweiterung:** [Avatar-Erweiterung und Punkteshop](docs/design/2026-09-19-avatar-shop-entscheidungen.md), AV01–AV12 bestätigt, Offlinekauf ausgeschlossen. Der [damalige Gesamtentwurf](docs/superpowers/specs/2026-09-19-avatar-shop-design.md) bleibt als Vorgeschichte erhalten; AV02/AV11 sind durch die aktuelle Entwicklungsstufen-Richtung ersetzt. Produktshop ist noch nicht integriert. Der v2-JSON-Lauf und Diagnoseversion 4 sind inzwischen ausgewertet; daraus keinen alten nächsten Prüfschritt ableiten.

**Neuer Auftrag vom 19.09.2026:** Die bisherige App wurde praktisch getestet. Der [Überarbeitungsentwurf](docs/design/2026-09-19-ueberarbeitung.md) für Gestaltung, Bedienung, Lernregeln und Diagramme ist ausdrücklich bestätigt. Der [Implementierungsplan](docs/superpowers/plans/2026-09-19-ueberarbeitung.md) ist mit Nutzerantwort A zur Umsetzung mit Aufgabenagenten und Einzelreviews bestätigt. A1–C1 sind unabhängig geprüft; C2 ist implementiert und vollständig automatisiert geprüft. Die unabhängige Gesamtprüfung samt Korrekturen ist abgeschlossen. Aktueller Fortschritt und Prüfbelege stehen im [zusammengeführten Bericht](docs/reports/2026-09-19-ueberarbeitung.md) und im Arbeitsstand. Vor Weiterarbeit den aktuellen Arbeitsstand lesen. Der unten dokumentierte v1-Abschluss ist der Ausgangsstand, keine Abnahme des neuen Pakets.

Maßgeblich sind die [aktuelle Entwicklungsstufen-Entscheidung](docs/design/2026-09-20-avatar-entwicklungsstufen.md), der [Diagnose-4-Bericht](docs/reports/2026-09-20-shop-v4-reallauf.md), der [Arbeitsstand](ARBEITSSTAND.md) und die [Auswertungsübergabe](docs/handoffs/2026-09-20-shop-v10-auswertung.md). Der [Bildbericht v3](docs/reports/2026-09-20-avatar-fit-v3.md), der [v1-Abschluss vom 18.09.2026](docs/reports/2026-09-18-vokabeltrainer-v1.md) und die [Überarbeitung A1–C2](docs/reports/2026-09-19-ueberarbeitung.md) bleiben historische Grundlagen; ihre Tests und Screenshots nicht als Nachweis für spätere Änderungen ausgeben.

Reale Produktprüfungen mit Google Drive auf zwei physischen Geräten, Safari und Home-Bildschirm-App auf iPhone/iPad sowie eine HTTPS-Bereitstellung bleiben offen. Die automatisierten Tests verwenden ausschließlich synthetische Daten und eine simulierte Google-Grenze.

## Lesereihenfolge

1. [AGENTS.md](AGENTS.md)
2. [ARBEITSSTAND.md](ARBEITSSTAND.md)
3. [Aktuelle Übergabe zum Integrationsentwurf](docs/handoffs/2026-09-20-persistent-purchases-design.md); [Bild-/Probe-v4-Übergabe](docs/handoffs/2026-09-20-avatar-fit-v3-und-probe-v4.md) und [A1–C2-Übergabe](docs/handoffs/2026-09-19-ueberarbeitung.md) als Vorgeschichte
4. [Anforderungen und Entscheidungen](docs/ANFORDERUNGEN.md)
5. [Architektur](docs/ARCHITEKTUR.md) und [Produkt-Datenvertrag](docs/PRODUKT-DATENFORMAT.md)
6. [Bestätigter Überarbeitungsentwurf](docs/design/2026-09-19-ueberarbeitung.md) und [Umsetzungsplan A1–C2](docs/superpowers/plans/2026-09-19-ueberarbeitung.md); als Grundlage [Gesamtentwurf](docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md) einschließlich E01–E10

## Vor dem Arbeiten

```sh
git status --short --branch
git remote -v
git log -5 --oneline
npm test
npm run check:docs
```

Die Browserprüfungen und ihre optionalen Umgebungsvariablen stehen in [tests/browser/README.md](tests/browser/README.md). `npm start` stellt Probe und Trainer lokal bereit; der Trainer liegt unter `http://localhost:4173/trainer/`.

Code und Dokumente liegen auf `codex/vokabeltrainer-v1`. Auf einem anderen Rechner einen frischen Clone dieses Zweigs verwenden. Git überträgt keine Browserdaten oder Google-Anmeldungen; bestehende Lernbereiche bewusst über die vorbereitete Google-Verbindung auswählen. Eigene Daten nicht in Testprofile kopieren und keine Browserdaten zum Reparieren löschen.

## Kopierbarer Wiedereinstieg

> Arbeite am Repository MIBMCG/Vokabeltrainer auf `codex/vokabeltrainer-v1` weiter. Lies AGENTS.md, ARBEITSSTAND.md und docs/handoffs/2026-09-20-persistent-purchases-design.md. Prüfe Branch, Remote und lokale Änderungen. Die technische Kaufprobe ist implementiert und im echten Bericht10 mit 6/6 bestanden. Keinen identischen 10er-Lauf anfordern. Der konkrete Integrationsentwurf liegt unter docs/superpowers/specs/2026-09-20-persistent-purchases-design.md zur Abstimmung vor. Eine seitdem erfolgte Nutzerzustimmung zuerst prüfen. Danach den detaillierten Implementierungsplan schreiben und umsetzen; keine allgemeine Startfreigabe erneut einholen. C, EV01–EV05 und Bildrichtung bleiben bestätigt; vier von 76 Bildquellen sind vorbereitet. Bericht9 mit dem künstlichen ETag-/HTTP500-Fall nicht umwerten. Kein identischer 9er-Lauf, keine neue A/B/C-Frage, kein stiller Backendwechsel und keine Produktkäufe. Reale Google-/Geräteprüfungen und spätere Produktmigration getrennt behandeln.

Der konkrete aktuelle Auftrag bestimmt, welche Änderungen, Pushes und Veröffentlichungen autorisiert sind. Bestätigte Entscheidungen nicht erneut pauschal abfragen.
