# Übergabe: einstellbare Satzzeichenprüfung

Stand 06.10.2026. Der Nutzer hat die neue Option und den konkreten lokalen
Umfang ausdrücklich bestätigt. Lokale Produktänderung auf
`codex/vokabeltrainer-v1`, Ausgangscommit
`e6f34221e5843fd840a2d906842aa9f742e3ea8b`. Vor Beginn frisch mit GitHub
abgeglichen, `0 0`, keine vorhandenen Änderungen. Kein Push, keine neue
Bereitstellung und kein persönliches Browserupdate in diesem Auftrag.
Die zuletzt bereitgestellte App bleibt Produkt `4778440`, Cache v52.

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
Kaufpfaden oder Anmeldungen. Lokale Cachekennung v53; keine neuen Laufzeitmodule.
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
Ignorierte Belege werden nicht durch Git übertragen. Änderungen bleiben
uncommitted; lokales HEAD weiterhin der oben genannte Ausgangscommit.

## Nächster Schritt und Grenzen

Nach abgeschlossenem lokalen Prüfpaket kann die geprüfte Änderung bei Auftrag
an der bestehenden LejeAdventure-Adresse bereitgestellt und auf GitHub gesichert
werden. Dafür vorhandene Konten, Lernbereiche und Anmeldungen erhalten.
Keine persönliche Geräte-, Safari-, Google- oder Zweitgeräteabnahme behauptet.
Die frühere begrenzte Inselkarten-Diagnose bei 320px/200 Prozent bleibt offen
und wurde für den neuen ausdrücklichen Auftrag nicht begonnen.
