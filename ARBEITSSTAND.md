# Arbeitsstand

**Aktuell 20.09.2026:** Auswertung der echten Kaufprobe und Passformkorrektur abgeschlossen; Bildumfang jetzt 98 Lagen / 294 WebPs. [Neue Vorschau](docs/design/2026-09-20-avatar-passform.png), [Nachprüfung](docs/reports/2026-09-20-avatar-passform-review.md). Nächster benötigter Eingang ist der reale Google-Bericht mit `diagnosticVersion: 2`; neue Figurenwahl und Käufe sind noch nicht aktiviert. Git-Belege und Fortsetzung stehen in der [aktuellen Übergabe](docs/handoffs/2026-09-19-avatar-shop.md).

**Vorheriger gesicherter Avatar-Zwischenstand:** `2b4c47f202486a6c63407acae6ba38b677e27409` ist auf `codex/vokabeltrainer-v1` gepusht und per Remote-SHA bestätigt. Bildquellen, Halskorrektur, Prüfnachweise und [Gesamtvorschau](docs/design/avatar-shop-preview.png) sind enthalten. Nächster abhängiger Schritt: echte Google-Kaufprobe, danach Besitz-/Guthaben- und Oberflächenintegration.

**Aktive Umsetzung:** Der Gesamtentwurf ist mit „Ja, starte nun“ am 19.09.2026 ausdrücklich freigegeben. Die Umsetzung nach [Avatar-Shop-Plan](docs/superpowers/plans/2026-09-19-avatar-shop.md) läuft; keine erneute allgemeine Startfreigabe verlangen. Kaufprobe und Katalog sind implementiert und unabhängig geprüft. Die Halskorrektur ist im bisherigen Produkt umgesetzt; alle 13 neuen Figurenbilder und ihre Ausrüstung sind getrennt vorbereitet und geprüft. Die erste echte Drive-Kaufprobe vom 20.09.2026 ist nicht bestanden; die verbesserte Diagnoseversion 2 ist veröffentlicht; ihr echter Ergebnisbericht fehlt noch. Neue Figurenwahl und Käufe sind nicht aktiviert. Die sechs konkret nachgewiesenen Passformfehler sind am 20.09.2026 korrigiert und unabhängig an den tatsächlichen Bildern nachgeprüft: fünf Umhänge mit vorderer Befestigung, passende Hirsch-Hinterlage und vier sitzende Tigerreifen. 372 Node- und fünf gezielte Browsertests bestanden. [Korrekturbericht und Vorschau](docs/reports/2026-09-20-avatar-passform.md). Persönliche Sicht-/Geräteabnahme bleibt offen. Aktuelle [Avatar-Shop-Übergabe](docs/handoffs/2026-09-19-avatar-shop.md).

**Neuer Folgeauftrag:** Mädchen-/Jungenfiguren, mystische Avatare und ein Punkteshop; Entscheidungen AV01–AV12 einschließlich Ausrüstung je Figurenart sind [dokumentiert](docs/design/2026-09-19-avatar-shop-entscheidungen.md). Der Halsfehler ist mit neuen Hemdquellen und fester Registrierung behoben und unabhängig nachgeprüft. Die Produktfragen sind geklärt: neue Käufe nur online nach erfolgreichem Abgleich. Der [Gesamtentwurf](docs/superpowers/specs/2026-09-19-avatar-shop-design.md) ist freigegeben; die sichere Koordination paralleler Käufe bleibt als technischer Prüfauftrag vorgeschaltet. Der folgende Abschluss A1–C2 bleibt unverändert; die neue Erweiterung ist in Arbeit und noch nicht im Produkt integriert.

Stand: **19.09.2026**

Aktuelle [Übergabe zur Überarbeitung](docs/handoffs/2026-09-19-ueberarbeitung.md).

**Aktueller Auftrag:** Nach dem Praxistest hat der Nutzer eine Überarbeitung von Gestaltung, Avatar/Inselreise, Einrichtung, Moduswahl, Wiederholungsregeln, Vokabelverwaltung und Statistik beauftragt. Der [schriftliche Entwurf](docs/design/2026-09-19-ueberarbeitung.md) ist mit „Ja, Freigabe erteilt“ vollständig bestätigt. Der [Implementierungsplan in drei Etappen](docs/superpowers/plans/2026-09-19-ueberarbeitung.md) ist erstellt, selbstgeprüft und mit Nutzerantwort A zur Ausführung mit Aufgabenagenten/Einzelreviews bestätigt. Aktueller Paketfortschritt steht unten. Google Drive mit vorbereiteter App und Regeln je Kind bleiben beschlossen; kein Excel-Wechsel. Der nachfolgende v1-Abschluss bleibt als bisheriger Funktionsnachweis erhalten und ist keine visuelle Abnahme dieser Überarbeitung.

## Fortschritt der Überarbeitung

- A1 ist in `0eb4099` implementiert, Reviewkorrekturen in `004392c`: Rasterwelt, geschichteter Avatar, responsive Bilder und kleiner Offline-Bildsatz. Die unabhängige Nachprüfung bestätigt alle drei Korrekturen; keine wesentlichen offenen Befunde. [Umsetzungsnachweis](docs/reports/2026-09-19-a1-rasterwelt.md), [Review](docs/reports/2026-09-19-a1-review.md), [Bildbericht](docs/reports/2026-09-19-illustrationen.md).
- Auf dem A1-Ausgangscode bestanden 280/280 Node-Tests. Nach den Reviewkorrekturen bestanden 13/13 betroffene Node-Tests, 1/1 Reise-Browsertest und 1/1 Worker-Updatefall. Produktcache `v7`, synthetischer Updateworker `v8`.
- A2 ist in `10987b5` umgesetzt und in `e0c237f` unabhängig nachgeprüft: erklärte Moduskarten, ein Startbutton, klare Leerzustände und kompakte Übungsansicht. 285/285 Node-, 15/15 Trainer- und 3/3 Überarbeitungs-Browsertests bestanden; anschließend bestand der gezielte Retryfall nach Speicherfehler sowie der Worker-Updatefall jeweils 1/1. Produktcache `v9`, synthetischer Updateworker `v10`. [Bericht](docs/reports/2026-09-19-a2-rundenstart.md), [Review](docs/reports/2026-09-19-a2-review.md).
- A3 ist mit `2d30c73` umgesetzt und unabhängig ohne Befunde geprüft: vorbereitete Google-ID, bewusste Anmeldung und Bestandswahl, geschützte Altverbindungen. 291/291 Node-, 15/15 Trainer-, 5/5 Überarbeitungsfälle und 1/1 Updatefall bestanden; Cache v10 / synthetisch v11. [Bericht](docs/reports/2026-09-19-a3-einrichtung.md), [Review](docs/reports/2026-09-19-a3-review.md).
- A4 ist mit `af5c095` umgesetzt, in `28287e7` gezielt korrigiert und unabhängig freigegeben: vier Elternbereiche, kompakte Wortverwaltung, vollständiger Importentwurf und Suchfokus. Dazu Start-Levelkarte und mobile Reisekorrekturen. 291/291 Node, 15/15 Trainer und 6/6 Überarbeitungsfälle bestanden vor der gezielten Fixrunde; danach bestanden die betroffenen Verwaltungs-, Import- und Updatefälle (Details im Bericht). Cache v12 / synthetisch v13. [Bericht](docs/reports/2026-09-19-a4-verwaltung.md), [Review](docs/reports/2026-09-19-a4-review.md).
- B1 ist mit `36335b9` und Fix `f6d6158` abgeschlossen und unabhängig freigegeben: kompatible v1/v2-Verträge, atomare Migration mit echten Altformat-Sicherungen und korrekte frühe Versionsbarriere. Nach dem Fix: 324/324 Node-Tests, 4/4 betroffene Browserfälle; davor 16/16 vollständige Trainerregression. Cache v14 / synthetisch v15. [Bericht](docs/reports/2026-09-19-b1-datenuebergang.md), [Review](docs/reports/2026-09-19-b1-review.md).
- B2 ist in `68909b5` implementiert und unabhängig ohne Befunde freigegeben: getrennte Wiederholungsplanung, eingefrorene Regeln/Generationen und unveränderte Belohnungen. 339/339 Node- und 4/4 betroffene Browserprüfungen bestanden; Cache v15 / synthetisch v16. [Bericht](docs/reports/2026-09-19-b2-lernplanung.md), [Review](docs/reports/2026-09-19-b2-review.md).
- B3 ist mit `c04ffd9` und Fix `2f0a126` unabhängig freigegeben: Elternregler, Vorschau, Entwürfe und Wiederüben. Nach Fix 4/4 B3-Browser, 1/1 Update und 15/15 Server/Worker; vorher 339/339 Node. Cache v17 / synthetisch v18. [Bericht](docs/reports/2026-09-19-b3-elternregler.md), [Review](docs/reports/2026-09-19-b3-review.md). Ein bestehender Offline-Diagnosetest war im breiten Lauf 11/12 einmal fehlerhaft, einzeln 1/1 grün; C2 schließt diesen konkreten Prüfhinweis durch stabile Diagnose und frischen vollständigen 15/15-Lauf.
- C1 ist in `9457ced` unabhängig ohne Befunde freigegeben: Statistik samt erhaltener Wortdetailübersicht; 343/343 Node, 19/19 fokussierte und 6/6 betroffene Browserprüfungen bestanden. Cache v18 / synthetisch v19. [Bericht](docs/reports/2026-09-19-c1-statistik.md), [Review](docs/reports/2026-09-19-c1-review.md). C2 ist in `6ffcdfa` implementiert: 343/343 Node, 18/18 Trainer und 15/15 Überarbeitungs-Browser frisch bestanden, 13 echte Bildnachweise geöffnet, Cache v19 / synthetisch v20. Der Offline-Diagnosehinweis und 320px/200%-Überlauf sind geschlossen. Unabhängige Gesamtprüfung und Nachprüfung sind ohne offene Befunde abgeschlossen; Prüfwerkzeugfix `7ef2bb4` erhält alle 13 veröffentlichten Bild-Hashes unverändert. [Abschlussreview](docs/reports/2026-09-19-abschlussreview.md). [Zusammengeführter Prüfbericht](docs/reports/2026-09-19-ueberarbeitung.md). Der A1-Desktop-Bildnachweis ist durch eine nach vollständigem Bildladen erzeugte Aufnahme ersetzt. [Ausführungsentscheidungen](docs/reports/2026-09-19-ausfuehrungsentscheidungen.md) halten begründete Werkzeug-/Agentenabweichungen fest.
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

Der [Implementierungsplan](docs/superpowers/plans/2026-09-19-ueberarbeitung.md) ist einschließlich Gesamtprüfung und Nachprüfung abgeschlossen. Bei einer Fortsetzung den konkreten neuen Nutzerauftrag bearbeiten; die Umsetzung nicht erneut beginnen. Als nächste Nachweise bleiben die [Geräte-Prüfliste](docs/GERAETE-ABNAHME.md) und realer Google-Abgleich auf zwei Geräten offen. Eine dafür geeignete HTTPS-Bereitstellung erfordert einen eigenen Auftrag. Google Drive, Regeln je Kind, Zahlenbereiche und Rundenwirkung sind bestätigt und werden nicht erneut abgefragt.

Aktueller Branch: `codex/vokabeltrainer-v1`. Der geprüfte A1-Zwischenstand einschließlich Freigabe, Berichten und Übergabe wurde als `b0e826c5b7e78d4aa5fa9727e317bf991c905a2c` nach GitHub übertragen und mit `git ls-remote` exakt bestätigt. Auch A2 einschließlich Korrektur, Review und sechs tatsächlichen Ansichten ist als `7b109cfee381e6c4de849e8007b563408d57200a` nach GitHub übertragen und per `git ls-remote` exakt bestätigt. Auch A3 ist als `c695994fbf87ea65660ed03604217241ae830146` nach GitHub übertragen und exakt bestätigt. Auch der abgeschlossene Oberflächenabschnitt A1–A4 einschließlich Reviewkorrekturen und Bildnachweisen wurde als `9277a02c938bf0d88a03f43c866138e39fe28953` gepusht und exakt per `git ls-remote` bestätigt. Auch B1 einschließlich Reviewkorrektur und Nachweisen wurde als `d1cf3027834057ed5ce0e23740f3bd1cc6987928` gepusht und exakt per `git ls-remote` bestätigt. Auch B2 einschließlich Review und Nachweisen wurde als `552f0222414f48c588ff2bbc627ac10f12fa678e` gepusht und exakt per `git ls-remote` bestätigt. Auch B3 einschließlich Reviewkorrektur und Mobilansicht wurde als `d30f11c16bc22630efe72329d0d04e91ccd0b80a` gepusht und exakt per `git ls-remote` bestätigt. Auch C1 wurde einschließlich Review und Ansichten als `6f998b41cd3e1a254677fff1c912d84e9bdeaa59` gepusht und exakt per `git ls-remote` bestätigt. Der unabhängig freigegebene Gesamtstand einschließlich Prüfwerkzeugfix und Belegen wurde als `f354dc3512ef4e61eb090ec968e817bd6925b7c9` gepusht und exakt per `git ls-remote` bestätigt. Dieser abschließende Dokumentationsschritt ergänzt das freigegebene Urteil; seine eigene SHA ergibt sich aus der Git-Historie. Der frühere v1-Produktcode bleibt über `cc079cb` nachvollziehbar.
