# Ersteinrichtung und PIN: belegte Textüberläufe korrigiert

Stand: 02.10.2026. Produkt `893d7affbf2f5fa63e96f9fc23860c0106243dff`,
Cache v50, ist integriert, unabhängig geprüft, auf beiden bestehenden
GitHub-Zweigen exakt gesichert und an der LejeAdventure-Adresse aktiv.
Keine neue Pause. Die [Logoübergabe](2026-10-02-lejeadventure-logo.md) und
[Einrichtungsübergabe](2026-10-01-lejeadventure-einrichtung.md) bleiben für
die davor abgeschlossenen Schritte und ihre jeweiligen Nachweisgrenzen erhalten.

## Ursache und begrenzter Umfang

Die erste Einrichtung überragte bei 320px und 200 Prozent Schrift die Ansicht:
Dokumentbreite 525px. Der lange feste H1-Text überlief seine 272px breite Box;
die Formularboxen selbst lagen innerhalb des Viewports. Bei erneut nach Reload
gesetzten 200 Prozent waren dieselbe Ursache am PIN-Tor und zwei lange Wörter
im Fortsetzungsabsatz konkret nachgewiesen.

| Ansicht bei 320px/200 Prozent | Vorherige Dokumentbreite | Nachher |
| --- | ---: | ---: |
| Ersteinrichtung | 525px | 320px |
| Gesperrtes PIN-Tor | 457px | 320px |
| Einrichtung fortsetzen | 357px | 320px |

Die Korrektur setzt natürliche weiche Trennstellen in drei feste H1-Texte und
zwei Wörter des Fortsetzungsabsatzes. Bei genügend Platz erscheinen sie weiter
vollständig zusammengeschrieben. Exakte zugängliche H1-Namen bleiben
„Vokabeltrainer einrichten“, „Einrichtung fortsetzen“ und „Für Erwachsene“.

Das Produkt umfasst sechs Dateien: `shell.js`, ServiceWorker-Cachekennung
v49 → v50 und vier vorhandene Browserfixtures mit v50/v51. Kein CSS-Diff,
keine pauschale Umbruchregel, kein Abschneiden oder Verkleinern der Schrift.
PIN-Verarbeitung, Sicherheit, Anmeldung, Drive, Punkte, Käufe, Datenformate,
Logo und Anbieterbranding haben keinen Produktdiff. Der vorbestehende Befund
ist keine Logo-Regression.

## Finale Implementer-Prüfung

Getrennte synthetische Kontexte, Node 26.10.0 und Microsoft Edge 154.0.4258.53
mit vorhandenem Playwright; Harness-Engine `chromium`.

- 43/43 vorhandene gezielte Nodefälle PASS, keine Fehler/Skips: ServiceWorker,
  Updates, Kauf-/Anmelde-UI, Server-Worker, Staging und lokale Auslieferung.
- 20/20 Layoutansichten PASS: Ersteinrichtung, Fortsetzung, gesperrtes PIN-Tor
  und offenes Recovery jeweils bei 320/390px mit normaler und 200-Prozent-Schrift
  sowie Desktop 1280 × 900. Dokumentbreite gleich Viewport, H1-Text innerhalb
  seiner Box, sichtbare Felder/Labels/Fieldsets/Buttons innerhalb der Ansicht,
  exakte zugängliche Überschriften und geladenes dekoratives 48 × 48px-Logo.
- Bei 320px/200 Prozent synthetisches PIN-Zurücksetzen und anschließendes Öffnen
  mit neuer PIN PASS. Ledger, Runden, commerce und Bindung identisch; nur der
  erwartete PIN-Prüfwert wechselt.
- Ein kontrollierter synthetischer Updatefall v50 → v51 PASS: vollständiger
  Ledger, commerce, Bindung und PIN-Prüfwert identisch, richtige gespeicherte
  Antwort sichtbar. Konkret 10 Lernpunkte, Level 1 und klassischer Avatar
  erhalten. Der Stand hat inaktive Käufe; kein realer Besitz-/Drive-Nachweis.

Ausgeführte gezielte Testbefehle, mit dem vorhandenen Node und für den
Browserfall auf Edge gesetzter Harness-Umgebung:

```powershell
node --no-experimental-global-navigator --test --experimental-test-isolation=none tests/trainer/sw.test.js tests/trainer/updates.test.js tests/trainer/purchases-auth-ui.test.js tests/server/worker.test.js tests/server/staging.test.js tests/serve.test.js
node --no-experimental-global-navigator --test --test-name-pattern='trainer offline update UI blocks typing' tests/browser/trainer.browser.mjs
git diff --check
```

Keine neue 666-Fälle-Gesamtsuite. Die originale Layoutmatrix und Bilder wurden
für den begrenzten finalen Diff geprüft; keine bereits abgeschlossenen
Galerie-/Navigationspakete erneut ausgeführt.

## Unabhängiges Review und Grenze eigener Browserausführung

**Spec PASS, Qualität PASS**, keine konkreten offenen Befunde im begrenzten
Umfang. Der Reviewer las den vollständigen Sechs-Dateien-Diff und prüfte
32/32 Nodefälle frisch mit Exit 0:

```powershell
node --no-experimental-global-navigator --test --experimental-test-isolation=none tests/trainer/sw.test.js tests/trainer/updates.test.js tests/serve.test.js tests/server/worker.test.js
git diff --check 622861f1bc350c05b4656d65e09d16baaed967c4..893d7affbf2f5fa63e96f9fc23860c0106243dff
```

Der Reviewer prüfte selbst die finalen originalen Bilder, alle 20 Layoutzeilen,
Diagnose und Update-Log. Er bestätigt daraus lesbare Überschriften/Absätze,
die vertikal erreichbare Form, identische Dokument-/Viewportbreiten und
erhaltene zugängliche Namen. Der Browser-PASS stammt aus der Implementer-
Ausführung, auch der synthetische Updatefall.

Die zusätzlich versuchte eigene Layoutprüfung endete vor Ausführung durch
einen Timeout der automatischen Freigabeprüfung. Ein enger Versuch ohne neue
Bild-/Helperdateien und der ausgewählte Updatefall endeten vor Browser-/
Testausführung mit `spawn EPERM`. **Kein eigener erfolgreicher Review-
Browserlauf.** Die positive Bewertung stützt sich auf vollständigen Code-/
Specreview, eigene 32 Nodefälle und Sicht-/Plausibilitätsprüfung der finalen
Implementer-Belege; daraus keine physische Geräteabnahme ableiten.

## Bereitstellung und öffentliche Nachprüfung

Ziel: [LejeAdventure](https://app.lejeadventure.workers.dev/trainer/), Worker
`app`. Die bisherige andere App bleibt auf Cache v47.

- Worker-Version `3baa31f3-f374-46b8-aba0-37830c883d21`, zu 100 Prozent aktiv.
- Erstellt am 02.10.2026 um 19:18:05.874 UTC, Deployment um 19:18:06.823 UTC.
- Dry-run und Bereitstellung Exit 0. Zwei neue Assets (`shell.js`, `sw.js`),
  394 bereits vorhanden; insgesamt 396 öffentliche Dateien.
- Öffentliche Nachprüfung um 19:18:54.687 UTC: 396/396 Dateien bytegleich,
  drei Informationsseiten HTTP 200, sechs interne Pfade HTTP 404,
  anonyme Sitzungsantwort false mit no-store.

Die erste Node-Fetch-Probe scheiterte an der Zertifikatsprüfung. Die Folgeprobe
mit `--use-system-ca` nutzt die regulären Windows-Vertrauensstellen und besteht.
Zertifikatsvalidierung bleibt aktiv; keine Produkt- oder Anbieteränderung dafür.

## Tatsächliche Übernahme im bestehenden Chrome

Unmittelbar vor dem Update sind zwei sichtbare Profile mit **Level 2/290 Punkten**
und **Level 4/720 Punkten** vorhanden. Nach Neuladen der Profilauswahl erscheint
das echte Updateangebot; **„Jetzt aktualisieren“** wird angeklickt. Danach ist
der Hinweis zurückgezogen, dieselben beiden Stände bleiben sichtbar. Titel
LejeAdventure und das 64px-PNG des Headers sind geladen.

Keine PIN-Öffnung und keine neue Google-Anmeldung in diesem Schritt. Google-
Aktivstatus und vollständiger Abgleich wurden nach dem Update nicht direkt
erneut geprüft. Der Vergleich betrifft die unmittelbar vor/nach Übernahme
sichtbaren Stände; die früheren Level-1/null-Punkte-Beobachtungen bleiben der
historische v49-Nachweis. Der Nutzer hatte zwischenzeitliche Änderungen bereits
berichtet; aus verschiedenen Tagesständen entsteht kein Datenfehlerbefund.
Private Screenshots und Rohbelege bleiben ignoriert und werden nicht gesichert.

## Firefoxdiagnose, Gitstand und nächste Schritte

Die separate [Firefox-Offlinediagnose](../reports/2026-10-02-firefox-offline-diagnose.md)
ist auf dem vorherigen v49-Produkt abgeschlossen. `setOffline(true)` erzeugt
in Firefox 153/Playwright 1.62.1 weiter `NS_ERROR_OFFLINE`; der unveränderte
C2-Test ist 1 FAIL. Bei gestopptem lokalem Server sind Reload, neuer App-Tab
und kalter persistenter Start mit identischem synthetischem Zustand belegt.
`navigator.onLine` bleibt true; keine physische Netztrennung behauptet.
Kein ServiceWorker-Produktfix und keine Teständerung aus dem Diagnoseauftrag.

Logo-Produkt `cd8d516` und Logo-Abschlussdokumentation
`622861f1bc350c05b4656d65e09d16baaed967c4` sind auf beiden bestehenden Zweigen
`codex/vokabeltrainer-v1` und `codex/purchase-batch-checks` gesichert. Aktuelles
Produkt `893d7affbf2f5fa63e96f9fc23860c0106243dff` ist nach Integration,
Push und frischem `ls-remote` auf beiden Zweigen exakt bestätigt. Die neue
Abschlussdokumentation ergänzt diesen gesicherten Produktstand; eine eigene
Commit-ID wird hier nicht vorweggenommen.

1. Offene Praxisnachweise gezielt ergänzen: echte Freundes-Erstanmeldung,
   physisches iPad/Safari/Home-Bildschirm, natürlicher Google-Tokenablauf und
   Zweitgeräteabgleich. Die optionale Frage nach einem Freundes-iPad bleibt offen.
2. Weitere Optimierungen nur bei konkretem Befund. Das reale Kaufwunschziel
   unter zehn Sekunden ist weiterhin unbelegt; keine blinde Kaufabkürzung.
3. Danach die fünf bestätigten Belohnungsideen: Verwandlung, Figurenbewegung,
   Lernreaktionen, eigener Inselort und Steckbrief/Geschichte/Titel.

Bestehende Lernbereiche, Test-/Familienbestände und Besitz weiterverwenden.
Keine abgeschlossenen Galerien neu erzeugen oder fertige Pakete wiederholen.
