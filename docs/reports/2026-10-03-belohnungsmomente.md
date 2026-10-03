# Belohnungsmomente: Umsetzungs- und Prüfbericht

Abgeschlossen am 03.10.2026. Produkt
`4778440d7ea24eff873bbb1fd0948ba2d672f242`, Cache v52, ist unabhängig geprüft,
integriert und unter der LejeAdventure-Adresse bereitgestellt. Ausgangsstand
war `54e7d66` mit Produkt `62635de`, Cache v51.

## Auftrag und Umfang

Der Nutzer hat alle fünf Belohnungsideen bestätigt und nach Abschluss der
Entwicklungsbilder und Optimierungen die nächsten Aufgaben beauftragt.
[Entwurf](../superpowers/specs/2026-10-03-belohnungsmomente.md) und
[Umsetzungsplan](../superpowers/plans/2026-10-03-belohnungsmomente.md) beschreiben
die begrenzte Darstellungserweiterung.

- Kurzer überspringbarer Freischaltmoment nach bestätigtem Kauf, einschließlich
  gezielt wiederaufgenommener Käufe. Erfolg und Auswahl bleiben sofort bedienbar.
- Endliche dezente Figurenbewegung, mit vorhandenem Profilschalter und
  Berücksichtigung der Systemeinstellung für reduzierte Bewegung.
- Ermutigung nach gespeichertem Rundenabschluss und tatsächlich überwundenem
  Fehlerwort; keine zusätzliche Erfolgsaussage für gewöhnliche richtige Antworten.
- Eigener benannter Figurenplatz auf der Inselreise mit bestätigter Sammlung.
- Charakterbezogene Steckbriefe, Geschichten und Titel der besessenen Stufen.

Vorhandene Bilder, explizite Auswahl und bestätigter Besitz werden weiterverwendet.
Es gibt keine neuen Preise, Punkte, Lernregeln, Währungen oder Datenformate.
Die Oberfläche erzeugt keine Lern- oder Kaufereignisse für diese Darstellung.

## Umsetzung und bestätigte Grenzen

Die zwei neuen Module `avatar/companion.js` und `ui/companion.js` ordnen den
13 Figuren vier Textstufen zu und kapseln die Darstellung. Sammlung und Titel
lesen exakte bestätigte Besitzrechte. Gezeigte Momente werden im Arbeitsspeicher
nach Profil und Vorgang getrennt, mit höchstens 256 Schlüsseln je Oberfläche.

Kauferfolg verlangt passende bestätigte Rückgabe, Auftrag, Profil, Artikel und
Besitz. Er verwendet denselben bereits geladenen Bildknoten. Keine zusätzliche
Kaufabfrage, Bildlade- oder Animationswartezeit; der Effekt dauert höchstens
1.200 ms. Gespeicherte Lernreaktionen prüfen aktuelle Epoche und effektive
deduplizierte Antwortbelege. Der rein lesende Export für wirksame Rundenabschlüsse
nutzt denselben Validator wie die bestehende Punkteprojektion. Ein gespeicherter
kurzer Abschluss zählt, eine lediglich erschöpfte oder abgebrochene Runde nicht.

Natürliche Trennstellen erhalten die vollständigen zugänglichen Namen.
Schmale Übungs-/Statistiklayouts sind nur für Ansichten mit neuem Moment angepasst.
Bewegungen sind endlich und respektieren Profil- und Betriebssystemeinstellung.
Kein Ton, neue Kunst, neue Bibliothek oder neues Datenformat.

## Automatische Nachweise

| Prüfung | Ergebnis | Reichweite |
| --- | --- | --- |
| Gesamte Node-Suite | 721/721 PASS, keine Skips | Vor den letzten ausschließlich UI-/Testkorrekturen; inklusive tatsächlichem Service/Transport an synthetischer HTTP-Grenze |
| Finale gezielte Node-Suite | 42/42 PASS | Auf dem finalen Produktstand |
| Finale Kauf-/Belohnungsbrowsergruppe | 42/42 PASS | Beide neuen Browserdateien, bestehende Käufe und Kauf-Fortschritt; Edge, synthetische Daten |
| Finale Übungs-/Reise-/Updategruppe | 4/4 PASS | Fortsetzung, Profilinvalidierung, Avatarwahl und kontrolliertes Update |
| Unabhängige Task- und Abschlussreviews | PASS nach Korrekturen | Finale Nachprüfung auf `4778440`; danach alle angekündigten Root-Prüfungen bestanden |

Der Service-Budgettest bleibt grün: lokale Vorschau ohne HTTP und bestätigter
Kauf innerhalb des vorhandenen Anfragenbudgets; synthetisch unter 20 Sekunden
bei 500 ms Anfragelatenz. Das ist keine neue reale Kaufzeitmessung.
Der kontrollierte Updatefall v52 → v53 erhält Ledger, Commerce, Bindung und
PIN-Prüfwert sowie zehn Punkte, Level 1 und klassischen Avatar. Der bestehende
Service-Kauffall prüft bewusst gewählte Form, Punkte, Neuladen, Offlinebesitz,
veraltete Vorschau und Wiederaufnahme nach verlorener Antwort.

Im Review korrigiert und gezielt nachgewiesen:

1. Nach bestätigtem Erfolg dürfen alte Vorschau-Bildfehlerhandler keinen
   gegenteiligen Kaufstatus mehr einfügen. Die vorherige Bildsperre bleibt erhalten.
2. Echte Kaufdienste ersetzen beim Speichern den Commerce-Host. Der Erfolg prüft
   nun den aktuellen verbundenen Host desselben Besitzers, Profils und Dienstes;
   tatsächlicher Profil-/Seiten-/Dienstwechsel wird weiter abgewiesen.
3. Bestehende Statistiktests normalisieren nur U+00AD; alle Zahlenprüfungen bleiben.
   Der Wiederaufnahme-Test bestätigt den neuen Dialog und schließt ihn bewusst.

Die zunächst roten finalen Gruppen (36/37 und 3/4) sind damit geklärt. Sie wurden
nicht als Gesamt-PASS verwendet. Root und Reviewer haben tatsächliche Screenshot-
Belege geprüft; schmale Ansichten sind bei 320/390px und 200 Prozent Schrift geprüft.

Reproduzierbare Prüfungen (Browser mit eingerichtetem `PLAYWRIGHT_MODULE`,
`BROWSER_ENGINE=chromium` und lokalem Edge):

```powershell
node --no-experimental-global-navigator --experimental-sqlite --test --experimental-test-isolation=none tests/drive/*.test.js tests/probe/*.test.js tests/trainer/*.test.js tests/server/*.test.js tests/serve.test.js
node --no-experimental-global-navigator --test --experimental-test-isolation=none tests/browser/companion.browser.mjs tests/browser/companion-feedback.browser.mjs tests/browser/purchases.browser.mjs tests/browser/purchase-progress.browser.mjs
node --no-experimental-global-navigator --test --experimental-test-isolation=none --test-name-pattern='trainer practice is resumable|trainer practice reacts|trainer rewards render|trainer offline update UI blocks' tests/browser/trainer.browser.mjs
```

Lokale Belege: `.superpowers/rewards-2026-10-03/` mit `full-node.log`,
`final-focused-node-after-fix.log`, `final-browser-after-fix.log`,
`final-update-browser-after-fix.log` und `final-evidence/`. Taskberichte, RED/GREEN
und unabhängige Reviews stehen unter `.superpowers/sdd/2026-10-03-belohnungsmomente/`.
Diese ignorierten lokalen Belege enthalten keine persönliche Testsitzung.

## Integration und ausgeliefertes Paket

Fast-Forward in `codex/vokabeltrainer-v1`; Produkt auf beiden freigegebenen
GitHub-Zweigen exakt als `4778440d7ea24eff873bbb1fd0948ba2d672f242` bestätigt.
Der Dokumentationsnachtrag ergänzt diesen gesicherten Produktstand.

- Leje-Worker `c76e6d12-57fd-460c-88df-e2fcbb750202`, zu 100 Prozent aktiv;
  Deployment am 03.10.2026 um 10:43:26.830 UTC.
- Probelauf PASS; 398 öffentliche Dateien, neun neu/geändert hochgeladen.
- Öffentliche Prüfung um 10:44:09.839 UTC: alle 398 Dateien bytegleich, drei
  Infoseiten HTTP 200, sechs interne Pfade HTTP 404, anonyme Sitzung false/no-store.
- Reguläre Zertifikatsprüfung mit `--use-system-ca`; alte Adresse bleibt Cache v47.
- Kein neues persönliches Nutzerbrowser-Update und kein Eingriff in Lernbestände.

## Prüfgrenzen und nächster Schritt

Der Nutzer hat Geräte- und Praxistests verschoben. Seine Android-Rückmeldung
„läuft gut“ nennt weder Gerät noch Browser oder Version. Synthetische Prüfungen
sind deshalb kein Nachweis für ein bestimmtes Android-Gerät, iPad/Safari oder
Home-Bildschirm-Installation. Es wird kein persönlicher Lernbestand für Tests
verändert und keine neue persönliche Anmeldung angefordert.

Als nächster begrenzter Diagnosefall bleibt die enge/überlappende Beschriftung
der unveränderten Inselkarte bei 320px/200 Prozent Schrift sichtbar, unter anderem
in `task1-journey-320-200.png`. Vor einem eigenen Fix den Ausgangsvergleich sichern.
Dieses Paket korrigiert sie nicht. Weitere Tempoarbeit benötigt einen konkreten
neuen Befund; abgeschlossene Galerie-, Logo- und Übernahmepakete nicht wiederholen.
