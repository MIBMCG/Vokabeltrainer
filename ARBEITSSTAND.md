# Arbeitsstand

Stand: **19.09.2026**

Aktuelle [Übergabe zur Überarbeitung](docs/handoffs/2026-09-19-ueberarbeitung.md).

**Aktueller Auftrag:** Nach dem Praxistest hat der Nutzer eine Überarbeitung von Gestaltung, Avatar/Inselreise, Einrichtung, Moduswahl, Wiederholungsregeln, Vokabelverwaltung und Statistik beauftragt. Der [schriftliche Entwurf](docs/design/2026-09-19-ueberarbeitung.md) ist mit „Ja, Freigabe erteilt“ vollständig bestätigt. Der [Implementierungsplan in drei Etappen](docs/superpowers/plans/2026-09-19-ueberarbeitung.md) ist erstellt, selbstgeprüft und mit Nutzerantwort A zur Ausführung mit Aufgabenagenten/Einzelreviews bestätigt. Aktueller Paketfortschritt steht unten. Google Drive mit vorbereiteter App und Regeln je Kind bleiben beschlossen; kein Excel-Wechsel. Der nachfolgende v1-Abschluss bleibt als bisheriger Funktionsnachweis erhalten und ist keine visuelle Abnahme dieser Überarbeitung.

## Fortschritt der Überarbeitung

- A1 ist in `0eb4099` implementiert, Reviewkorrekturen in `004392c`: Rasterwelt, geschichteter Avatar, responsive Bilder und kleiner Offline-Bildsatz. Die unabhängige Nachprüfung bestätigt alle drei Korrekturen; keine wesentlichen offenen Befunde. [Umsetzungsnachweis](docs/reports/2026-09-19-a1-rasterwelt.md), [Review](docs/reports/2026-09-19-a1-review.md), [Bildbericht](docs/reports/2026-09-19-illustrationen.md).
- Auf dem A1-Ausgangscode bestanden 280/280 Node-Tests. Nach den Reviewkorrekturen bestanden 13/13 betroffene Node-Tests, 1/1 Reise-Browsertest und 1/1 Worker-Updatefall. Produktcache `v7`, synthetischer Updateworker `v8`.
- A2 ist in `10987b5` umgesetzt und in `e0c237f` unabhängig nachgeprüft: erklärte Moduskarten, ein Startbutton, klare Leerzustände und kompakte Übungsansicht. 285/285 Node-, 15/15 Trainer- und 3/3 Überarbeitungs-Browsertests bestanden; anschließend bestand der gezielte Retryfall nach Speicherfehler sowie der Worker-Updatefall jeweils 1/1. Produktcache `v9`, synthetischer Updateworker `v10`. [Bericht](docs/reports/2026-09-19-a2-rundenstart.md), [Review](docs/reports/2026-09-19-a2-review.md).
- A3–C2 bleiben offen. Nächster Schritt ist der vorbereitete Google-Zugang. Der A1-Desktop-Bildnachweis ist durch eine nach vollständigem Bildladen erzeugte Aufnahme ersetzt.
- Alle Aufnahmen und Browsertests verwenden synthetische Daten in Chromium/Edge. Physische iOS- und Zwei-Geräte-Abnahmen bleiben offen.

Die vollständige Version 1 gemäß [bestätigtem Gesamtentwurf](docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md) und [Produkt-Datenvertrag](docs/PRODUKT-DATENFORMAT.md) ist auf `codex/vokabeltrainer-v1` implementiert. Task 13 schloss letzte Bedienungsbefunde, portable Browserwerkzeuge, vollständige Regression, visuelle Prüfung und die portable Dokumentation ab. Ausgangscode: `3b1d16d`; Reviewfix-1-Produktcode `11e3128` korrigiert zusätzlich die Profilweiterleitung. Der [Abschlussbericht](docs/reports/2026-09-18-vokabeltrainer-v1.md) enthält die vollständige Evidenz einschließlich der korrigierten Abschlussmatrix; die [Übergabe](docs/handoffs/2026-09-18-vokabeltrainer-v1.md) nennt den nächsten Schritt.

Die unabhängige [Task-13-Nachprüfung](docs/reports/2026-09-18-vokabeltrainer-v1-task-13-fix-1-review.md) ist abgeschlossen; alle Befunde sind behoben. Auch die [Gesamtprüfung mit anschließender Nachprüfung](docs/reports/2026-09-18-vokabeltrainer-v1-final-fix-review.md) ist abgeschlossen: alle vier Integrationsbefunde sind behoben, keine neuen offenen Reviewbefunde. Reale Produktprüfungen mit Google Drive auf zwei physischen Geräten, Safari und Home-Bildschirm-App auf iPhone/iPad sowie eine HTTPS-Bereitstellung bleiben offen.

## Bestätigter Umfang

Die Anforderungen R01–R33, Entscheidungen Q1–Q14 und Entwurfsergänzungen E01–E10 sind bestätigt. Zielgruppe sind 10–13-Jährige in Klasse 4–7. Die statische Web-App bietet getrennte Lernprofile, adaptive Deutsch-Englisch-Übungen, fortsetzbare Runden, Erwachsenenverwaltung, Inselreise, Avatar, Offlinebetrieb, konfliktfesten Drive-Abgleich sowie vollständige Sicherung und Wiederherstellung. Kein zusätzliches kostenpflichtiges Cloudabo ist vorgesehen.

Die Produktoberfläche liegt unter `/trainer/`; die technische Drive-Probe bleibt getrennt unter `/`. Persönliche Lerninhalte und Browserdaten gehören nicht ins Repository.

## Bisheriger v1-Prüfstand

Finaler Produktcode `cc079cb`: **277/277 Node- und 15/15 Trainer-Browsertests bestanden**, einschließlich vier neuer Regressionen zu PIN-Wiederherstellung, Verwaltungsentwürfen, erneutem Google-Verbinden und offenem Antworttext bei Wiederherstellungskonflikten. Produktcache `v5`, synthetischer Updateworker `v6`. [Fixbericht](docs/reports/2026-09-18-vokabeltrainer-v1-final-fixes.md) und [unabhängige Nachprüfung](docs/reports/2026-09-18-vokabeltrainer-v1-final-fix-review.md) belegen den Abschluss.

### Historische Vorläufe

Auf dem Task-13-Ausgangscode `3b1d16d` liefen frisch:

- `npm test`: **277/277 Tests bestanden**, Node.js 22.23.2.
- Trainer-Browserregression: **11/11 Tests bestanden**, Playwright 1.62.1, Edge 153.0.4234.46.
- Bestehende Drive-Probe: **12/12 Szenarien bestanden**, keine Seitenfehler.
- Offline-Neustart mit geschlossenem Testserver für `/trainer/` und `/repo/trainer/` sowie ein echter verzögerter Service-Worker-Wechsel sind Bestandteil der Trainerregression.
- Desktop-, Mobil-, Reise-, Avatar-, Konflikt- und Wiederherstellungsansichten wurden mit synthetischen Daten erzeugt und visuell geprüft.

Reviewfix 1 wurde gezielt geprüft: Profilweiterleitung RED 0/1 und GREEN 1/1, Service-Worker 8/8. Danach bestand auf `0ea9502` einschließlich Produktfix `11e3128` die [aktuelle vollständige Abschlussverifikation](docs/reports/2026-09-18-abschluss-verifikation.md): erneut 277/277 Node- und 11/11 Trainer-Browsertests. Die unveränderte Probe wurde nicht wiederholt. Die unabhängige Korrekturreview ist ohne offene Befunde abgeschlossen.

Browserregression und Node-Tests simulieren Google Identity Services und Drive-HTTP. Die frühere manuelle Probe bestätigte echte Google-Anmeldung und Drive-Abgleich zwischen zwei Browsern desselben Rechners; das ist kein Nachweis für das Produktprotokoll auf zwei physischen Geräten.

## Umgesetzte Arbeitspakete

Tasks 1–12 sind implementiert, korrigiert und jeweils unabhängig nachgeprüft. Die frühen finalen Kommandos, Zählungen und Reviewurteile stehen in der [dauerhaften Prüfhistorie Tasks 1–6](docs/reports/history/2026-09-18-tasks-1-6-evidence.md); die späteren Detailberichte stehen unter [docs/reports](docs/reports/). Task 13 ergänzt unter anderem:

- wahrheitsgemäße Texte für ausgeschöpfte Übungsrunden,
- Fokus auf den nach asynchronem Rendern tatsächlich neuen Avatar-Schalter,
- eine gemeinsame Statusformatierung,
- Browserfälle für ungebundene Authentifizierungsfehler,
- klare Profil- und Wiederherstellungstexte,
- verständliche Bezeichnungen für alte Ereignisse,
- portable Playwright-/Chromium-Standardwerte mit optionalen Umgebungsvariablen,
- Produktcache `v4` einschließlich des neuen Statusmoduls und der korrigierten Profilweiterleitung.

Der [Benutzungsleitfaden](docs/BENUTZUNG.md) beschreibt den aktuellen Ablauf. [Architektur](docs/ARCHITEKTUR.md), [Qualitätsmatrix](docs/QUALITAET-UND-ABNAHME.md) und [Google-Einrichtung](docs/GOOGLE-DRIVE-EINRICHTUNG.md) trennen implementierte Funktionen von noch offenen Realnachweisen.

## Offen und bewusst zurückgestellt


- realer Produktabgleich über Google Drive auf zwei physischen Geräten,
- iPhone-/iPad-Abnahme in Safari und als Home-Bildschirm-App einschließlich Tastatur, Fokus, Offline-Neustart und erneutem Verbinden,
- festgelegte und nachgewiesene Browser-/OS-Mindestversionen,
- autorisierte HTTPS-Bereitstellung und veröffentlichte Trainer-URL,
- allgemeine Lizenzentscheidung und Änderung der Repository-Sichtbarkeit.

Keine dieser Grenzen ist eine neue Produktentscheidung. Hosting, Kontenänderungen, Veröffentlichung und Kosten bleiben gesondert zu beauftragen.

## Nächster Schritt

Den [Implementierungsplan](docs/superpowers/plans/2026-09-19-ueberarbeitung.md) in der bestätigten Ausführungsart A beim ersten noch offenen Paket fortsetzen; Fortschritt siehe oben. Die freigegebenen Aufgaben ohne erneute pauschale Zwischenfreigaben bearbeiten. Der Entwurf einschließlich Google Drive, Regeln je Kind, Zahlenbereichen und Rundenwirkung ist bestätigt und wird nicht erneut abgefragt. Die [Geräte-Prüfliste](docs/GERAETE-ABNAHME.md) bleibt für spätere echte Tests gültig; eine dafür nötige HTTPS-Bereitstellung erfordert einen eigenen Auftrag.

Aktueller Branch: `codex/vokabeltrainer-v1`. Der geprüfte A1-Zwischenstand einschließlich Freigabe, Berichten und Übergabe wurde als `b0e826c5b7e78d4aa5fa9727e317bf991c905a2c` nach GitHub übertragen und mit `git ls-remote` exakt bestätigt. A2 ist zusätzlich lokal geprüft; der nächste GitHub-Beleg folgt nach dem Dokumentationscheckpoint. Der frühere v1-Produktcode bleibt über `cc079cb` nachvollziehbar.
