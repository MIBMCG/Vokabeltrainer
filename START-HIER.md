# Hier mit der Weiterarbeit beginnen

**Zusammenhängende Kaufprobe bereit (20.09.2026):** Diagnoseversion 10 verbindet unveränderliche Kaufbelege mit einem gemeinsamen Ordnerverweis und prüft sechs zusammenhängende Abläufe. 172/172 Shop-Node-, 24/24 Browser- und 6/6 Serverprüfungen bestanden; die unabhängige Codeprüfung ist ohne offene Befunde abgeschlossen. [Kurzanleitung](docs/KAUFPROBE.md), [Prüfbericht](docs/reports/2026-09-20-immutable-purchase-probe.md), [aktuelle Übergabe](docs/handoffs/2026-09-20-immutable-purchase-probe.md). Nächster abhängiger Schritt: neuer echter Google-Lauf und Bericht10. Noch kein Real-Drive-Nachweis für diesen Ablauf und kein Produktshop; C bleibt entschieden. Bericht9 und dessen künstlicher ETag-/HTTP500-Fall werden nicht umgewertet.

**Aktueller Stand (20.09.2026):** EV01–EV05 sind bestätigt: vollständige Stufenkäufe für 200 / 400 / 800 Punkte, je vier kostenlose menschliche Hauttöne, zusätzliche klassische Gestaltung und die Bereiche „Meine Figur“, „Entwicklung“, „Shop“. Der reine Stufenkatalog und die ersten vier freigestellten Drachenbilder sind in `650cee7` implementiert beziehungsweise erzeugt und unabhängig geprüft. 379/379 Produkttests bestanden; 4 von 76 Bildmotiven sind vorbereitet. Neue Stufenwahl und Käufe sind noch nicht im Produkt eingebunden. [Grundlagenbericht](docs/reports/2026-09-20-avatar-evolution-foundation.md), [aktuelle Übergabe](docs/handoffs/2026-09-20-immutable-purchase-probe.md).

**Historischer Diagnose-6-/7-Stand:** 6 bestanden, 5 fehlgeschlagen. Vier Abbrüche betreffen veränderte File-Versionen bei gleichbleibender ETag und gleichen verfügbaren Zusatzmerkmalen. Die absichtlich falsche Kennung scheitert mehrdeutig; ein anderer Fall belegt dagegen eine 412-Ablehnung eines alten Tokens. Sichere parallele Käufe bleiben unbewiesen. [Auswertung](docs/reports/2026-09-20-shop-v6-reallauf.md). Keine neue unveränderte Probe anfordern. [Richtungsentscheidung C](docs/design/2026-09-20-kaufkoordination-nach-diagnose6.md) ist bestätigt: direkten Drive-Ansatz gezielt weiter untersuchen. Diagnose 7 trennt jetzt Schreibantwort und Nachlese des Negativfalls; lokal sind 84/84 Shop-Node-Tests und 13/13 Browserfälle bestanden. Die unabhängige Review ist ohne offene relevante Befunde abgeschlossen. Kein zusätzlicher Dienst, keine Änderung des Punktesystems und keine Produktkäufe.

**Bestätigte Stilrichtung vor dem Grundlagenpaket:** Vier vollständig gerenderte Entwicklungsformen je Avatar ersetzen für die künftige Erweiterung die modulare Ausrüstung. Bogen v1 wurde wegen eines zu kleinen Unterschieds zwischen Stufe 3 und 4 nicht abgenommen. Der Nutzer hat den [überarbeiteten Drachenbogen v2](docs/design/avatar-evolution/dragon-stages-concept-v2.png) mit „ja, viel besser“ bestätigt; seine deutlich epischere, mythische Endverwandlung ist die Stilvorlage und braucht keine erneute Bildfreigabe. Die Produktoberfläche bleibt vorerst unverändert. Freigestellte Produktionsgrafiken, weitere Bedienungsdetails, Datenmodell und die restlichen Figuren sind noch offen. Der echte Diagnose-4-Lauf ergab 3 bestandene und 8 fehlgeschlagene Fälle; der v2-ETag-/v3-Schreibkandidat belegt keinen exklusiven Kauf-Guard. [Entscheidung](docs/design/2026-09-20-avatar-entwicklungsstufen.md), [Auswertung](docs/reports/2026-09-20-shop-v4-reallauf.md), [damalige Übergabe](docs/handoffs/2026-09-20-avatar-evolution-prototype.md).

**Historischer Bild- und Probestand vor dem Richtungswechsel:** Klassische Bildbearbeitung ist ausdrücklich freigegeben. Die körperbezogene Nacharbeit aller 13 Figuren / 62 kompatiblen Artikelpaare ist im [Bildbericht v3](docs/reports/2026-09-20-avatar-fit-v3.md) dokumentiert; frühere pauschale Passformurteile bleiben zurückgenommen. Der damalige echte v2-JSON-Bericht belegte eine lesbare Versionskennung, aber keine sichere Kaufkoordination (5 bestanden, 6 fehlgeschlagen). Diagnoseversion 4 ergänzte konkrete Fehlerstellen und Antwortklassen. [Frühere Google-Auswertung](docs/reports/2026-09-20-shop-v2-reallauf.md). Neue Figurenwahl und Käufe sind weiterhin nicht im Produkt aktiviert. [Historische Übergabe](docs/handoffs/2026-09-20-avatar-fit-v3-und-probe-v4.md).

**Historische Grundlage der Shop-Erweiterung:** [Avatar-Erweiterung und Punkteshop](docs/design/2026-09-19-avatar-shop-entscheidungen.md), AV01–AV12 bestätigt, Offlinekauf ausgeschlossen. Der [damalige Gesamtentwurf](docs/superpowers/specs/2026-09-19-avatar-shop-design.md) bleibt als Vorgeschichte erhalten; AV02/AV11 sind durch die aktuelle Entwicklungsstufen-Richtung ersetzt. Produktshop ist noch nicht integriert. Der v2-JSON-Lauf und Diagnoseversion 4 sind inzwischen ausgewertet; daraus keinen alten nächsten Prüfschritt ableiten.

**Neuer Auftrag vom 19.09.2026:** Die bisherige App wurde praktisch getestet. Der [Überarbeitungsentwurf](docs/design/2026-09-19-ueberarbeitung.md) für Gestaltung, Bedienung, Lernregeln und Diagramme ist ausdrücklich bestätigt. Der [Implementierungsplan](docs/superpowers/plans/2026-09-19-ueberarbeitung.md) ist mit Nutzerantwort A zur Umsetzung mit Aufgabenagenten und Einzelreviews bestätigt. A1–C1 sind unabhängig geprüft; C2 ist implementiert und vollständig automatisiert geprüft. Die unabhängige Gesamtprüfung samt Korrekturen ist abgeschlossen. Aktueller Fortschritt und Prüfbelege stehen im [zusammengeführten Bericht](docs/reports/2026-09-19-ueberarbeitung.md) und im Arbeitsstand. Vor Weiterarbeit den aktuellen Arbeitsstand lesen. Der unten dokumentierte v1-Abschluss ist der Ausgangsstand, keine Abnahme des neuen Pakets.

Maßgeblich sind die [aktuelle Entwicklungsstufen-Entscheidung](docs/design/2026-09-20-avatar-entwicklungsstufen.md), der [Diagnose-4-Bericht](docs/reports/2026-09-20-shop-v4-reallauf.md), der [Arbeitsstand](ARBEITSSTAND.md) und die [aktuelle Übergabe](docs/handoffs/2026-09-20-immutable-purchase-probe.md). Der [Bildbericht v3](docs/reports/2026-09-20-avatar-fit-v3.md), der [v1-Abschluss vom 18.09.2026](docs/reports/2026-09-18-vokabeltrainer-v1.md) und die [Überarbeitung A1–C2](docs/reports/2026-09-19-ueberarbeitung.md) bleiben historische Grundlagen; ihre Tests und Screenshots nicht als Nachweis für spätere Änderungen ausgeben.

Reale Produktprüfungen mit Google Drive auf zwei physischen Geräten, Safari und Home-Bildschirm-App auf iPhone/iPad sowie eine HTTPS-Bereitstellung bleiben offen. Die automatisierten Tests verwenden ausschließlich synthetische Daten und eine simulierte Google-Grenze.

## Lesereihenfolge

1. [AGENTS.md](AGENTS.md)
2. [ARBEITSSTAND.md](ARBEITSSTAND.md)
3. [Aktuelle Übergabe zur gewählten direkten Drive-Diagnose](docs/handoffs/2026-09-20-immutable-purchase-probe.md); [Bild-/Probe-v4-Übergabe](docs/handoffs/2026-09-20-avatar-fit-v3-und-probe-v4.md) und [A1–C2-Übergabe](docs/handoffs/2026-09-19-ueberarbeitung.md) als Vorgeschichte
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

> Arbeite am Repository MIBMCG/Vokabeltrainer auf `codex/vokabeltrainer-v1` weiter. Lies AGENTS.md, ARBEITSSTAND.md und docs/handoffs/2026-09-20-immutable-purchase-probe.md. Prüfe Branch, Remote und lokale Änderungen. Entwurf und Plan für die zusammenhängende unveränderliche Kaufprobe sind vorhanden; am dokumentierten Taskstand fortsetzen, nichts neu beginnen. C, EV01–EV05 und Bildrichtung bleiben bestätigt; vier von 76 Bildquellen sind vorbereitet. Bericht9 mit dem künstlichen ETag-/HTTP500-Fall nicht umwerten. Kein identischer 9er-Lauf, keine neue A/B/C-Frage, kein stiller Backendwechsel und keine Produktkäufe. Reale Google-/Geräteprüfungen und spätere Produktmigration getrennt behandeln.

Der konkrete aktuelle Auftrag bestimmt, welche Änderungen, Pushes und Veröffentlichungen autorisiert sind. Bestätigte Entscheidungen nicht erneut pauschal abfragen.
