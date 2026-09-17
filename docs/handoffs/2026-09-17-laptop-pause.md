# Laptop-Übergabe und Pause – 17.09.2026

## Aktueller Auftrag

Der Nutzer bestätigt das [Insel-Konzept](../design/2026-09-17-insel-konzept.md): „das gefällt mir. So können wir weiter arbeiten, aber nicht heute.“ Heute nur sichern, danach Pause. Morgen nach ausdrücklicher Fortsetzung weiterarbeiten. Keine erneute pauschale Design- oder Entwicklungsfreigabe verlangen. Die fertige App wird erst anschließend beim Freund auf echten Apple-Geräten geprüft.

## Stand und nächster Schritt

Branch **codex/vokabeltrainer-v1**, nicht main. Implementierungsstand **85b36298bb1e9f1aaa0c38d43680d9d66706703d**. Der anschließende Dokumentationscommit enthält diese Übergabe. Den endgültigen Branch-HEAD bei Übernahme mit Git prüfen; keine Selbstreferenz auf eine noch nicht existierende Commit-ID.

Tasks 1–6 sind implementiert und unabhängig geprüft. Task 7 (Übungsbildschirm) ist implementiert und automatisiert geprüft, seine unabhängige Codeprüfung steht noch aus. Zuerst diese Review gegen Ausgangspunkt **387cbce5cc26d4cdddf3e8e59d9a8719ff4f36e1** durchführen, dabei zwischenzeitliche reine Dokumentationscommits berücksichtigen. Bericht: [Übungsbildschirm](../reports/2026-09-17-uebungsbildschirm.md). Nicht als vollständig fertige App bezeichnen.

Danach den [v1-Plan](../superpowers/plans/2026-09-17-vokabeltrainer-v1.md) Tasks 8–13 ausführen: Inselreise/Avatar, Drive-Synchronisation, Sicherung/Wiederherstellung, Erwachsenen-Integration, Offline-PWA, Gesamtprüfung und Dokumentation. Die [Aufgabenbeschreibungen](../superpowers/tasks/task-7-brief.md) sind jetzt versioniert; task-8-brief.md bis task-13-brief.md liegen im selben Ordner. Deren historische Anweisung „keine künstliche Meilensteinpause“ hebt die aktuelle ausdrückliche Tagespause nicht auf.

Maßgeblich bleiben [Anforderungen](../ANFORDERUNGEN.md), [Gesamtentwurf](../superpowers/specs/2026-09-16-vokabeltrainer-design.md), [Datenvertrag](../PRODUKT-DATENFORMAT.md) und die zwölf [technischen Präzisierungen](../ENTWICKLUNGSENTSCHEIDUNGEN.md). Insbesondere Task 8 erhält profileId explizit beim Avatar-Renderer; Task 11 behebt den vorgemerkten kleinen Befund zu verschachtelten main-Elementen.

## Frisch geprüfter Sicherungsstand

Vor der Sicherung am 17.09.2026 erneut ausgeführt:

- `npm test`: **191/191 bestanden**, 0 Fehler.
- `node --test --experimental-test-isolation=none tests/browser/trainer.browser.mjs`: **2/2 bestanden**, System-Edge, echtes DOM und IndexedDB mit synthetischen Daten.
- Echte Screenshots: [mobile Übung](../reports/assets/2026-09-17-uebung-mobil.png), [Desktop-Übung](../reports/assets/2026-09-17-uebung-desktop.png). Das separat bestätigte Konzept zeigt das gestalterische Ziel, keine bereits fertige Inseloberfläche.

Nicht nachgewiesen: fertige Produkt-Synchronisation, vollständige Produkt-PWA, echte Produkt-Google-Anmeldung, physischer Zwei-Geräte-Test, Safari/iPhone/iPad, Bildschirmtastatur und Home-Bildschirm-App. Die frühere reale Drive-Probe zwischen zwei Browsern desselben Rechners bleibt als eigener Nachweis erhalten. Kein Hosting eingerichtet, kein Merge nach main, keine Sichtbarkeits- oder Lizenzänderung.

## Am Laptop starten

Frischen Ordner verwenden, falls kein passender Checkout vorhanden ist:

```sh
git clone --branch codex/vokabeltrainer-v1 https://github.com/MIBMCG/Vokabeltrainer.git
cd Vokabeltrainer
git status --short --branch
git log -5 --oneline
node --version
npm test
npm start
```

Node.js mindestens 22.8.0. Für App/Node-Tests sind keine npm-Laufzeitpakete erforderlich. Browser öffnen: `http://localhost:4173/trainer/`; die ältere technische Probe bleibt unter `/`. Bei bereits vorhandenem Checkout zuerst lokale Änderungen prüfen, danach nur passend zum Arbeitsstand aktualisieren.

Die Browserprüfung benötigt separat Playwright (hier 1.62.1) und einen verfügbaren Chromium-/Edge-Browser. Die lokale Hilfsinstallation wird nicht mit Git übertragen. Der Harness unterstützt `PLAYWRIGHT_MODULE` (absoluter Pfad zu playwright/index.mjs) und `BROWSER_EXECUTABLE` (Browserpfad); beide am Laptop passend setzen. Ohne diese Voraussetzungen nicht behaupten, Browserprüfungen seien dort gelaufen. Normale App-Nutzung und Node-Tests benötigen Playwright nicht.

Git überträgt Code, Dokumentation und Konzeptbilder, aber keine Browserdaten, Google-Sitzung oder PIN. Am Laptop mit synthetischem Profil beginnen; keine persönlichen Daten in Git aufnehmen. Keine Cloud-/Hostingänderung ist durch diese Übergabe beauftragt.

## Agenten und Wiedereinstieg

Bisher: GPT-5.6 Sol mit hoher Denktiefe für abgegrenzte Implementierungen und Aufgabenprüfungen, GPT-6 Astra mit hoher Denktiefe für den Plan. Weiterhin Modelle/Denktiefe benennen, passende preiswerte Modelle wählen, getrennte Implementierung und Review; keine parallelen Schreiber auf denselben Dateien. Für die abschließende Gesamtprüfung ist Astra mit hoher Denktiefe vorgesehen.

Kopierbarer Auftrag:

> Arbeite im Repository MIBMCG/Vokabeltrainer auf dem Branch codex/vokabeltrainer-v1 weiter. Lies AGENTS.md, START-HIER.md, ARBEITSSTAND.md und docs/handoffs/2026-09-17-laptop-pause.md. Die Tagespause ist jetzt beendet. Das Insel-Konzept ist bestätigt. Beginne mit der noch offenen unabhängigen Review von Task 7 und setze danach den v1-Plan Tasks 8–13 fort. Erhalte vorhandene Änderungen und die zwölf technischen Präzisierungen. Verwende passende Modelle/Denktiefen und nenne sie. Geräteprüfung beim Freund erst nach vollständiger Implementierung; keine unbestätigten Tests oder fertigen Funktionen behaupten.
