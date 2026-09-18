# Aktuelle Abschlussverifikation

Stand: 18.09.2026. Diese vom koordinierenden Agenten ausgeführten Läufe ergänzen den [v1-Prüfbericht](2026-09-18-vokabeltrainer-v1.md). Geprüft wurde Commit `0ea9502`, einschließlich Produktkorrektur `11e3128`. Sie ersetzen keine unabhängige Gesamtprüfung oder reale Geräteabnahme.

| Prüfung | Ausführung | Beobachtetes Ergebnis |
| --- | --- | --- |
| Vollständige Node-Suite | `npm test` | 277 Tests, 277 bestanden, 0 Fehler/Abbrüche/übersprungen; Exit 0, 6,80 Sekunden |
| Vollständige Trainer-Browserregression | `node --test tests/browser/trainer.browser.mjs` | 11 Tests, 11 bestanden, 0 Fehler/Abbrüche/übersprungen; Exit 0, 40,91 Sekunden |

Die Browserprüfung verwendete die dokumentierten optionalen `PLAYWRIGHT_MODULE`- und `BROWSER_EXECUTABLE`-Overrides für Playwright 1.62.1 und den vorhandenen System-Edge. Node: 22.23.2. Alle Profile, Google-Antworten und Daten waren synthetisch. Eigene Testserver und Browserkontexte wurden vom Harness verwaltet; der persönliche Server auf Port 4173 blieb unberührt.

Der vollständige Trainerlauf umfasst die korrigierte Weiterleitung nach Profilwahl, Übungs- und Erwachsenenabläufe, Abgleich-/Wiederherstellungsfälle, Offline-Neustart bei geschlossenem Server unter beiden Pfaden sowie den echten wartenden Updateworker mit geschützter Bediengrenze. Die getrennte Probe wurde seit ihrem erfolgreichen 12/12-Lauf auf `3b1d16d` nicht verändert und deshalb hier nicht erneut ausgeführt.

Die aktuellen Screenshots im v1-Bericht entstanden auf `3b1d16d`. Die spätere Korrektur verändert die Weiterleitung zur Profilansicht und Cacheversion, nicht die darin gezeigten bereits ausgewählten Ansichten.

Noch offen: unabhängige Gesamtprüfung des Branches sowie echte Google-/Zwei-Geräte-/iPhone-/iPad-/Safari-/Home-Bildschirm-Nachweise und abgestimmte HTTPS-Bereitstellung. Ein späterer Produktfix benötigt seine eigenen passenden aktuellen Nachweise.
