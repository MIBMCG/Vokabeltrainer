# Übergabe: einstellbare Satzzeichenprüfung

Stand 06.10.2026. Der Nutzer hat die neue Option und den konkreten lokalen
Umfang ausdrücklich bestätigt und anschließend „dann bitte veröffentlichen“
beauftragt. Produktänderung auf
`codex/vokabeltrainer-v1`, Ausgangscommit
`e6f34221e5843fd840a2d906842aa9f742e3ea8b`. Vor Beginn frisch mit GitHub
abgeglichen, `0 0`, keine vorhandenen Änderungen. Produktcommit
`b77712adf4aab83c5ec134ff5de9144ff542f087`, Cache v53, ist bei
[LejeAdventure](https://app.lejeadventure.workers.dev/trainer/) aktiv und auf
`origin/codex/vokabeltrainer-v1` exakt bestätigt. Kein persönliches Browserupdate.

## Verhalten

**Für Erwachsene → Einstellungen → Antwortprüfung → Satzzeichen müssen stimmen**.
Standardmäßig an: bisherige genaue Satzzeichenprüfung. Ausgeschaltet werden
Unicode-Satzzeichen, einschließlich typografischer Apostrophe und Bindestriche,
bei Eingabe und Lösung ignoriert. Groß-/Kleinschreibung, äußere Leerzeichen und
die bisherige Apostrophnormalisierung bleiben erhalten. Innere Leerzeichen,
Buchstaben und sonstige Symbole bleiben relevant. Nur Satzzeichen sind keine
bewertbare Eingabe. Originale Lösungen werden vollständig angezeigt.

Die Option gilt ab der nächsten Antwort für alle Kinder auf diesem Gerät.
Ein eigener LocalStorage-Wert speichert sie dauerhaft, außerhalb von Ledger,
Lerndatensicherung und Google-Abgleich. Lesefehler verhindern eine Bewertung mit
einer ungewollten Ersatzregel; Schreibfehler werden gemeldet. Fehlende oder
unbekannte Werte lassen die Satzzeichenpflicht aktiv. Bereits gespeicherte
Antworten und Punkte werden nicht neu berechnet.

Die Befehlsprüfung und die Rundenübernahme verwenden dieselbe einmal gelesene
Option. Keine Änderungen an Lernregeln, Vokabelrevisionen, Datenformaten,
Kaufpfaden oder Anmeldungen. Cachekennung v53; keine neuen Laufzeitmodule.
Die versionierten Browser-Testmarker sind entsprechend angepasst.

## Verifikation

Auf finalem Code 731/731 Nodefälle PASS im vollständigen Nachlauf und 77/77
gezielte Lern-/Befehls-/Speicherfälle PASS. Im ersten Gesamtlauf 729/731:
ausschließlich beide Kaufbudgettests durch `spawn EPERM` blockiert. Der
vollständige Nachlauf mit erlaubten lokalen Unterprozessen besteht einschließlich
beider Kaufbudgets.

Sechs ausgewählte Edge-Browserfälle PASS:

- Neue Option: strikter Standard, Umschalten ohne Ledgeränderung, Neuladen,
  kontrolliertes Update mit vollständigem Zustandserhalt, danach Neuladen und
  Bewertungswechsel bei gestopptem lokalem Server. Originale Lösung sichtbar,
  gespeicherte Bewertungen `[true, false]`. 320px/200-Prozent-Darstellung ohne
  seitlichen Überlauf; Screenshot visuell geprüft.
- Bestehende Einstellungsnavigation einschließlich geöffnet bleibender Aufgaben.
- Übungsfortsetzung, Einmalwertung und vollständiger Rundenabschluss.
- Abgelehnte Precache-Installation erhält aktiven Offlinecache und fremde Caches.
- Kontrollierte Updateoberfläche schützt Eingaben und erhält Punkte, Level,
  Avatar und die gespeicherte Runde.
- Responsive Entwicklungsbilder nutzen offline die kleine Cachevariante.

Frühe Läufe der neuen Browserprüfung wurden korrigiert: installierten Worker
abwarten und neu laden, tatsächlichen Rundenstart verwenden, vor Erwachsenen-
einstellungen zur Profilauswahl wechseln und bereits geöffnete Aufgabe nicht
wieder zuklappen. Nur finale grüne Läufe werden oben gezählt.

Unabhängige Codeprüfung ohne Befund, zusätzlich 40/40 gezielte Nodefälle und
eigene Probe zu Wiederaufnahme, unveränderter früherer Bewertung, idempotenter
Wiederholung und Zustandserhalt bei Lesefehler. Kein eigener Browserlauf des
Reviewers; Browserbelege vom Hauptlauf. `git diff --check` PASS.

`node scripts/check-docs.mjs` meldet drei vorhandene Altdokumentationsbefunde:
zwei veraltete Roadmap-Anker in `ARBEITSSTAND.md` und der Levelanzeige-Übergabe
vom 01.10. sowie gemischte lokale Zeilenenden im Belohnungsplan vom 03.10.
Keine neuen Dokumentationsbefunde durch dieses Paket. Alte Anker sind bereits
im Ausgangscommit vorhanden; die Plan-Datei ist im Git-Diff unverändert.
Keinen vollständig grünen Dokumentationslauf behaupten.

Reproduzierbare Befehle (Browser mit konfiguriertem `PLAYWRIGHT_MODULE` und
`BROWSER_EXECUTABLE` für das vorhandene Edge):

```text
node --no-experimental-global-navigator --experimental-sqlite --test --experimental-test-isolation=none tests/drive/*.test.js tests/probe/*.test.js tests/trainer/*.test.js tests/server/*.test.js tests/serve.test.js
node --no-experimental-global-navigator --test --experimental-test-isolation=none tests/trainer/answers.test.js tests/trainer/answer-settings.test.js tests/trainer/commands.test.js tests/trainer/rounds.test.js tests/trainer/learning.test.js
node --no-experimental-global-navigator --test --experimental-test-isolation=none tests/browser/answer-settings.browser.mjs tests/browser/adult-settings-usability.browser.mjs
node --no-experimental-global-navigator --test --experimental-test-isolation=none --test-name-pattern="trainer offline update UI blocks|C2 rejected required precache|trainer practice is resumable" tests/browser/trainer.browser.mjs
node --no-experimental-global-navigator --test --experimental-test-isolation=none --test-name-pattern="evolution pictures load" tests/browser/evolution-art.browser.mjs
node scripts/check-docs.mjs
git diff --check
```

Lokale Rohbelege unter `.superpowers/`: `answer-settings-node-final.log`,
`answer-settings-targeted.log`, `answer-settings-browser.log`,
`answer-settings-regression-browser.log`, `answer-settings-docs.log`;
Screenshot `test-results/answer-settings/320px-200percent.png`.
Ignorierte Belege werden nicht durch Git übertragen. Das geprüfte Paket ist im
oben genannten Produktcommit gesichert; dieser Veröffentlichungsnachtrag folgt
auf demselben Entwicklungszweig.

## Veröffentlichung am 06.10.2026

Vor Veröffentlichung GitHub erneut abgerufen: Ausgangs-HEAD weiterhin exakt,
keine parallelen Änderungen. Frische 77/77 gezielte Nodefälle und Wrangler-
Probelauf PASS. Der vorhandene geschützte LejeAdventure-Schlüssel und dieselbe
Worker-/D1-/OAuth-Konfiguration verwendet; keine Schlüssel oder Konten ersetzt.

Worker `f29660cd-937b-4de8-84fb-ea61745a2eb9` zu 100 Prozent aktiv.
Deployment am 06.10.2026, 16:55:56 Uhr Berlin (14:55:56.858 UTC).
Sieben geänderte Produktdateien hochgeladen, 398 öffentliche Dateien insgesamt.
Öffentliche Prüfung um 16:56:18 Uhr Berlin bestätigt alle 398 bytegleich mit dem
geprüften Stagingpaket, drei Informationsseiten HTTP 200, sechs interne Pfade
HTTP 404 und anonyme Sitzung false/no-store. Reguläre Zertifikatsprüfung mit
`--use-system-ca`. Alte App-Adresse weiterhin Cache v47.

Zusätzlicher kontrollierter öffentlicher Edge-Updatefall PASS um 17:00:28 Uhr
Berlin. Der v52-Ausgangscode der sieben geänderten Dateien stammt bytegleich
aus `e6f3422` und wurde im echten v52-Browsercache geprüft; übrige unveränderte
Dateien regulär vom öffentlichen Dienst. Danach keine Ausgangscode-Ersetzungen
mehr: v53 tatsächlich von der veröffentlichten Adresse geladen und kontrolliert
aktiviert. Vollständiger synthetischer IndexedDB-Zustand einschließlich Ledger,
Commerce, Bindung, PIN-Prüfwert und früherer Antwort bleibt exakt erhalten.
Standardmäßig strikte Prüfung, Umschalten ohne Ledgeränderung, gespeicherte
Option nach Offline-Neuladen und richtige Antwort ohne Satzzeichen bestätigt.
Zwei richtige Antworten, 20 Punkte am Ende. Keine Google-Anmeldung erforderlich.

Eine erste vor Veröffentlichung vorbereitete flüchtige Sitzung konnte wegen
geschlossenem Steuerungskanal nicht fortgesetzt werden; deren Profilkopie hatte
keinen Offlinezustand. Diese Versuche werden nicht als Update-PASS gezählt.
Auch ein falscher Profilauswahl-Wartepunkt im neuen Kontrollskript wurde
korrigiert. Maßgeblich ist nur der abschließend bestandene kontrollierte Fall.
Das ist keine persönliche Bestands-, Safari- oder Geräteabnahme.

Produktcommit per normalem Push auf `codex/vokabeltrainer-v1` gesichert;
`git ls-remote` und lokales HEAD bestätigen dieselbe vollständige Produkt-ID.
Der vorhandene Vergleichsarbeitsbaum `codex/purchase-batch-checks` bleibt sauber
auf `e6f3422` und wurde nicht verändert. Kein Merge nach main, kein neues Release.
Dieser Nachtrag wird separat auf dem bestehenden Entwicklungszweig gesichert.

Lokale Veröffentlichungsbelege unter `.superpowers/answer-settings-public/`:
`deploy.log`, `deployments-before.log`, `deployments-after.log`,
`public-verification.json`, `live-update-verification.json`, `live-update.log`
und `live-settings.png`. Browserbelege verwenden ausschließlich synthetische
Lerndaten; Deploymentlogs dokumentieren den tatsächlichen Anbieterstatus.

## Nächster Schritt und Grenzen

Veröffentlichung abgeschlossen. Bei nächstem persönlichen App-Aufruf gegebenenfalls
„Jetzt aktualisieren“ wählen; Einstellungen → Antwortprüfung öffnen. Option auf
jedem Gerät separat einstellen. Vorhandene Konten, Lernbereiche und Anmeldungen erhalten.
Keine persönliche Geräte-, Safari-, Google- oder Zweitgeräteabnahme behauptet.
Die frühere begrenzte Inselkarten-Diagnose bei 320px/200 Prozent bleibt offen
und wurde für den neuen ausdrücklichen Auftrag nicht begonnen.
