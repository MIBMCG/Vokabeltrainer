# Übergabe: lokale Verbindungsprobe

Stand: 17.09.2026. Arbeitszweig: `codex/google-drive-probe`. Geprüfte Codebasis: `92f044e`. Die aktuelle Zweigspitze nach dem Klonen mit `git log -5 --oneline` prüfen; spätere Dokumentationscommits können über der geprüften Codebasis liegen.

## Was vorhanden ist

Die synthetische Google-Drive-Verbindungsprobe ist lokal ausführbar. Sie umfasst Anmelde-/Drive-Adapter, validiertes Ereignismodell, IndexedDB, wiederholbare Uploads mit stabilen IDs, leere Rücksetzung mit verifizierter Sicherung, mobile Oberfläche, lokalen Server und eigenen Offline-Service-Worker. Der eigentliche Vokabeltrainer ist noch nicht implementiert.

Ein Browserprofil wird nach der ersten erfolgreichen Auswahl dauerhaft an genau `{Google-Konto, Probeordner}` gebunden. Konto- oder Ordnerwechsel werden abgewiesen, auch wenn keine Uploads ausstehen. Für einen neuen unabhängigen Probeversuch ein separates Browserprofil verwenden. Pro Browserprofil darf nur ein Tab aktiv schreiben; der zweite Tab meldet die Sperre. Dabei werden vorhandene Ereignisse nicht still verworfen.

## Frisch übernehmen und starten

Voraussetzung: Git und Node.js ab 22.8.0. In einem gewünschten Arbeitsordner:

```sh
git clone https://github.com/MIBMCG/Vokabeltrainer.git
cd Vokabeltrainer
git switch codex/google-drive-probe
git status --short --branch
git log -5 --oneline
npm test
npm start
```

Danach `http://localhost:4173` öffnen. Es gibt keine npm-Laufzeitabhängigkeiten und keinen Buildschritt. Den Server mit Strg+C beenden. Die optionale Browserprüfung ist portabel in [tests/browser/README.md](../../tests/browser/README.md) beschrieben.

## Prüfstand

Auf `92f044e` bestanden 74/74 Node-Tests. Zwölf Browser-Szenarien bestanden mit Playwright 1.62.1, System-Edge 153.0.4234.32 und Node 22.23.2 ohne Seitenfehler. Die Browserprüfung nutzte echte Oberfläche, IndexedDB und Service Worker, simulierte aber GIS und Drive-HTTP. Desktop- und Mobilansicht sowie Rücksetzzustand wurden visuell geprüft. [Vollständiger Bericht](../reports/2026-09-17-google-drive-probe.md)

Task 2 wurde mit GPT-5.6 Sol bei hoher Denktiefe umgesetzt und nach zwei Fixrunden unabhängig freigegeben. Die portable Dokumentation entstand mit GPT-5.6 Sol bei mittlerer Denktiefe. Die Gesamtprüfung mit GPT-6 Astra bei hoher Denktiefe fand zwei zusätzliche Fehler bei Browser-Zurücknavigation und Wiederanmeldung nach HTTP 401. Sol korrigierte beide in `92f044e`; Astra bestätigte die Korrektur ohne neuen Befund. GitHub und lokale Spitze wurden anschließend bei `970a0de2b6c8101cec86164fd354291bcc4957c1` identisch bestätigt. Der folgende Dokumentationscommit hält diesen Nachweis fest. `main` blieb bei `49135c743c7bbb7c51f1c03bf21964884ebc67d1`.

## Offen und nächster Schritt

Praxisstand 17.09.2026 (Nutzerrückmeldungen und Screenshots): Echte Google-Anmeldung mit drive.file, Probeordnerauswahl, erste Antwort (1/10/1), Drive-Abgleich (1/10/0), Uploadwiederholung ohne Doppelwertung, Neuladen mit erhaltenem Stand und erneutes Verbinden bestätigt. Eine zweite Antwort wurde bei getrennter Internetverbindung gespeichert (2/20/1) und nach Wiederverbindung übertragen (2/20/0). Rücksetzung auf 0/0/0 und Statusmeldung zur bestätigten Sicherung wurden ebenfalls bestätigt. Reihenfolge der Zahlen: Antworten/Punkte/Ausstehend. Offline-Neuladen, zweiter Browser bzw. physisches Zweitgerät und iOS bleiben offen. Die genaue Browser-/OS-Version und der tatsächlich geladene Codecommit wurden nicht erhoben; kein vom Assistenten selbst ausgeführter Live-Test. Nächster Schritt: Seite ohne Internet neu laden. Keine persönlichen Konto-, Client- oder Ordnerkennungen dokumentieren.

1. [Google-Einrichtung](../GOOGLE-DRIVE-PROBE.md#google-einmalig-vorbereiten) durch die projektverantwortliche erwachsene Person durchführen. Nur die öffentliche Client-ID lokal eintragen; kein Passwort oder Client-Secret weitergeben.
2. Mit derselben OAuth-App, demselben Google-Konto und demselben Probeordner auf zwei Geräten die reale Matrix aus der Anleitung ausführen.
3. Für iPhone/iPad eine abgestimmte HTTPS-Bereitstellung verwenden und Safari sowie Home-Bildschirm-App getrennt prüfen. Gerät, Betriebssystem, Datum und Commit erst nach tatsächlichem Test dokumentieren.
4. Erst nach diesen Nachweisen entscheiden, ob die frühe Machbarkeitsschranke bestanden ist und die umfangreiche Lernoberfläche beginnen kann.

Offen bleiben Trainerfunktionen, Produkt-Synchronisation, vollständiger Sicherungsimport, Erwachsenen-Konfliktlösung, Hosting, Gerätemindestversionen und Veröffentlichung. Keine Integration nach `main`, kein Hosting, keine Zahlung und keine Änderung der Repository-Sichtbarkeit sind Bestandteil dieser Übergabe.
