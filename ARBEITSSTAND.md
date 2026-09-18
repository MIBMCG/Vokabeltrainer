# Arbeitsstand

Stand: **18.09.2026**

Die vollständige Version 1 gemäß [bestätigtem Gesamtentwurf](docs/superpowers/specs/2026-09-16-vokabeltrainer-design.md) und [Produkt-Datenvertrag](docs/PRODUKT-DATENFORMAT.md) ist auf `codex/vokabeltrainer-v1` implementiert. Task 13 schloss letzte Bedienungsbefunde, portable Browserwerkzeuge, vollständige Regression, visuelle Prüfung und die portable Dokumentation ab. Codecommit: `3b1d16d`. Der [Abschlussbericht](docs/reports/2026-09-18-vokabeltrainer-v1.md) enthält die vollständige Evidenz; die [Übergabe](docs/handoffs/2026-09-18-vokabeltrainer-v1.md) nennt den nächsten Schritt.

Die unabhängige Task-13- und Gesamtprüfung des Branches folgt nach diesem Paket. Sie ist noch keine bestandene Freigabe. Reale Produktprüfungen mit Google Drive auf zwei physischen Geräten, Safari und Home-Bildschirm-App auf iPhone/iPad sowie eine HTTPS-Bereitstellung bleiben offen.

## Bestätigter Umfang

Die Anforderungen R01–R33, Entscheidungen Q1–Q14 und Entwurfsergänzungen E01–E10 sind bestätigt. Zielgruppe sind 10–13-Jährige in Klasse 4–7. Die statische Web-App bietet getrennte Lernprofile, adaptive Deutsch-Englisch-Übungen, fortsetzbare Runden, Erwachsenenverwaltung, Inselreise, Avatar, Offlinebetrieb, konfliktfesten Drive-Abgleich sowie vollständige Sicherung und Wiederherstellung. Kein zusätzliches kostenpflichtiges Cloudabo ist vorgesehen.

Die Produktoberfläche liegt unter `/trainer/`; die technische Drive-Probe bleibt getrennt unter `/`. Persönliche Lerninhalte und Browserdaten gehören nicht ins Repository.

## Aktueller Prüfstand

Auf dem finalen Task-13-Code liefen frisch:

- `npm test`: **277/277 Tests bestanden**, Node.js 22.23.2.
- Trainer-Browserregression: **11/11 Tests bestanden**, Playwright 1.62.1, Edge 153.0.4234.46.
- Bestehende Drive-Probe: **12/12 Szenarien bestanden**, keine Seitenfehler.
- Offline-Neustart mit geschlossenem Testserver für `/trainer/` und `/repo/trainer/` sowie ein echter verzögerter Service-Worker-Wechsel sind Bestandteil der Trainerregression.
- Desktop-, Mobil-, Reise-, Avatar-, Konflikt- und Wiederherstellungsansichten wurden mit synthetischen Daten erzeugt und visuell geprüft.

Browserregression und Node-Tests simulieren Google Identity Services und Drive-HTTP. Die frühere manuelle Probe bestätigte echte Google-Anmeldung und Drive-Abgleich zwischen zwei Browsern desselben Rechners; das ist kein Nachweis für das Produktprotokoll auf zwei physischen Geräten.

## Umgesetzte Arbeitspakete

Tasks 1–12 sind implementiert, korrigiert und jeweils unabhängig nachgeprüft. Ihre versionierten Berichte stehen unter [docs/reports](docs/reports/). Task 13 ergänzt unter anderem:

- wahrheitsgemäße Texte für ausgeschöpfte Übungsrunden,
- Fokus auf den nach asynchronem Rendern tatsächlich neuen Avatar-Schalter,
- eine gemeinsame Statusformatierung,
- Browserfälle für ungebundene Authentifizierungsfehler,
- klare Profil- und Wiederherstellungstexte,
- verständliche Bezeichnungen für alte Ereignisse,
- portable Playwright-/Chromium-Standardwerte mit optionalen Umgebungsvariablen,
- Produktcache `v3` einschließlich des neuen Statusmoduls.

Der [Benutzungsleitfaden](docs/BENUTZUNG.md) beschreibt den aktuellen Ablauf. [Architektur](docs/ARCHITEKTUR.md), [Qualitätsmatrix](docs/QUALITAET-UND-ABNAHME.md) und [Google-Einrichtung](docs/GOOGLE-DRIVE-EINRICHTUNG.md) trennen implementierte Funktionen von noch offenen Realnachweisen.

## Offen und bewusst zurückgestellt

- unabhängige Task-13- und Gesamtprüfung des finalen Branches,
- realer Produktabgleich über Google Drive auf zwei physischen Geräten,
- iPhone-/iPad-Abnahme in Safari und als Home-Bildschirm-App einschließlich Tastatur, Fokus, Offline-Neustart und erneutem Verbinden,
- festgelegte und nachgewiesene Browser-/OS-Mindestversionen,
- autorisierte HTTPS-Bereitstellung und veröffentlichte Trainer-URL,
- allgemeine Lizenzentscheidung und Änderung der Repository-Sichtbarkeit.

Keine dieser Grenzen ist eine neue Produktentscheidung. Hosting, Kontenänderungen, Veröffentlichung und Kosten bleiben gesondert zu beauftragen.

## Nächster Schritt

Zuerst Task 13 und den vollständigen Branch unabhängig prüfen. Findings werden gezielt korrigiert und betroffene Prüfungen erneut ausgeführt. Danach können die Schritte aus der [Geräte-Prüfliste](docs/GERAETE-ABNAHME.md) mit synthetischen Daten auf den Geräten des Freundes vorbereitet werden; eine dafür nötige HTTPS-Bereitstellung erfordert einen eigenen Auftrag.

Aktueller Branch: `codex/vokabeltrainer-v1`. Der Remote-Stand lag vor Task 13 bei `8431786`; die Task-13-Commits sind zum Zeitpunkt dieser Übergabe lokal und noch nicht als Remote-Stand behauptet.
