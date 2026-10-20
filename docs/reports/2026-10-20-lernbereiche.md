# Direkter Einstieg und Lernbereichsverwaltung

Stand: 20.10.2026. Arbeitszweig `codex/vokabeltrainer-v1`, vorhandene
Produktarbeitskopie. Ausgangspunkt frisch von GitHub abgerufen und per
Fast-Forward übernommen:
`4e47c37542ded15dca58cadbac7a2f14a2a000a1`, Cache v53.

## Auftrag und Umsetzung

Der Nutzer hat den [Ablaufentwurf](../superpowers/specs/2026-10-20-lernbereiche-design.md)
ausdrücklich bestätigt. Umsetzung nach dem
[Plan](../superpowers/plans/2026-10-20-lernbereiche.md).

- Vorhandenen Lernbereich vor jeder lokalen Neuanlage verbinden. Anmeldung
  beziehungsweise wiederaufgenommene Sitzung lädt automatisch die Bereichsliste.
- Nullbeitritt lädt und prüft einen isolierten Bestand einschließlich aktiver
  Kaufautorität. Commands installiert ihn erst atomar; anschließend nur die
  gerätelokale PIN einrichten. Keine künstlichen Profile, Lektionen oder Wörter.
- Elternansicht zeigt die vorhandenen Bereiche auch bei bestehender Bindung.
  Umbenennung verändert den Rootordnernamen; Descriptor und Kaufhash bleiben
  unverändert. Papierkorbaktion nach konkreter Bestätigung, aktive Bereiche
  geschützt. Konto-/Versions-/ETag-/PIN-Prüfung vor dem Schreiben und Nachlesen
  vor Erfolg. Bestehender Serverproxy bleibt unverändert.
- Bereichssuche mit höchstens vier unabhängigen Prüfungen zugleich;
  vollständiger Fehlerabschluss und deterministische Reihenfolge. Die bisherigen
  Optimierungen und frischen Lernprüfungen bleiben erhalten.
- Neue Produktcachekennung v54 und angepasste Browser-Testmarker.

## Ausgangsprüfungen und lokale Umgebung

Der erste eingeschränkte Lauf am veralteten lokalen Commit `c499614` ist kein
Produktabschlussbeleg. Anschließend GitHub frisch geprüft, neuere Änderungen
abgerufen und den sauberen Produktcheckout aktualisiert. Der Hauptcheckout
mit Materialdateien und eigenen unversionierten Dateien bleibt unverändert.

Die frische Ausgangsprüfung auf v53 umfasste 731 Fälle: 730 PASS, ein Fehler,
keine übersprungenen Fälle. Einziger Fehler war eine alte ignorierte
Stagingkopie mit einer nicht mehr ausgelieferten Drachen-PNG. Der strenge
Assetcheck hat dies korrekt abgewiesen. Diese alte lokale Buildkopie wurde
ohne Löschen unter `.cloudflare/public-before-20261020` erhalten; die aktuelle
Ausgabe wird aus der bestehenden öffentlichen Allowlist neu erstellt.

Zwei vorbestehende falsche Roadmapanker in Arbeitsstand und der historischen
Levelanzeige-Übergabe wurden korrigiert. Danach Dokumentationsprüfung ohne
Befund. Es wurden keine echten Lernbereiche, Google-Daten oder persönlichen
Browserprofile verändert.

## Prüfverfahren

Neue Verhaltens- und Fehlerfälle zuerst fehlschlagend ausgeführt, anschließend
minimal implementiert und nachgeprüft. Fokussierte Tests prüfen unter anderem
Konto-/Tokenwechsel, veraltete Auswahl, PIN-Sperre während der Netzvorbereitung,
konkurrierende Ersteinrichtung, unveränderten Descriptor, aktive Root-Sperre,
Fehler beim Laden und erhaltene lokale ausstehende Lernereignisse.

Die Browserprüfung verwendet echte Oberfläche, IndexedDB und Service Worker;
nur Google-/Sitzungsantworten sind synthetisch. Schmale Ansichten bei 320px
und 200 Prozent Schrift werden zusätzlich visuell und über nutzbare
Eingabefeldbreiten geprüft.

Die unabhängigen Taskreviews fanden und reproduzierten folgende Randfälle;
sie sind in den jeweiligen Implementierungs- und Nachprüfrunden gezielt
bearbeitet:

- Ein während der Veröffentlichung bereits auffindbarer Setup-Root muss bis
  zum Abschluss sowohl vor Papierkorb als auch vor Umbenennung geschützt sein,
  damit derselbe vorgemerkte Auftrag weiterlaufen kann.
- Der erste Beitritt prüft das Konto nach dem letzten Rootabruf und nochmals
  innerhalb der Commands-Installationsgrenze.
- Eine Null-Vorschau behält nur die konto-/ordner-/descriptor-/versionsgebundene
  geprüfte Kaufhistorie. Die Bestätigung verwendet eine neue Scratch-Syncinstanz
  mit frischen Lernprüfungen; der bereits vorhandene Cache wird weitergenutzt.
- Eine wiederaufgenommene Nullsitzung zeigt ausschließlich den Bestandsweg.
  Nur bewusst gewählte oder bereits begonnene lokale Neuanlage bleibt mit
  ihren Entwürfen und ihrem Fokus geöffnet.

Der erste integrierte Gesamtlauf bestand 794 von 796 Fällen. Beide Fehler
betrafen ein älteres DOM-Testmodell der Google-Informationen/Joinbedienung,
das die inzwischen verwendeten DOM-Operationen nicht abbildete. Das Modell
wurde an die tatsächlichen DOM-Grenzen angepasst; die Joinprüfung erfasst nun
den unmittelbaren Retry und das Ausbleiben eines zweiten Schedulerstarts.
Einzelprüfungen wurden zuerst rot, danach grün beobachtet. Dieser Zwischenlauf
wird nicht als vollständig bestandener Abschlusslauf ausgewiesen.

Reproduzierbare Hauptbefehle:

```text
node --no-experimental-global-navigator --experimental-sqlite --test --experimental-test-isolation=none tests/drive/*.test.js tests/probe/*.test.js tests/trainer/*.test.js tests/server/*.test.js tests/serve.test.js
node --no-experimental-global-navigator --test --experimental-test-isolation=none tests/browser/learning-areas.browser.mjs tests/browser/auth-ui.browser.mjs tests/browser/server-auth.browser.mjs tests/browser/sync-settings.browser.mjs tests/browser/adult-settings-usability.browser.mjs tests/browser/answer-settings.browser.mjs
node --no-experimental-global-navigator --test --experimental-test-isolation=none --test-name-pattern="trainer offline update UI blocks|C2 rejected required precache|trainer practice is resumable|trainer offline starts" tests/browser/trainer.browser.mjs
node scripts/check-docs.mjs
git diff --check
```

Browserumgebung über `PLAYWRIGHT_MODULE` und `BROWSER_EXECUTABLE` wie in der
[Browseranleitung](../../tests/browser/README.md) konfigurieren. Lokale
Unterprozesse für Testserver, Browser und die bestehenden Kaufbudgetfälle
zulassen. Zugangsdaten oder kostenpflichtige Dienste sind nicht nötig.

## Nachweisgrenzen

Die Umsetzung ist ein lokales Produktpaket. Bereitstellung, öffentliches
Update, echte Google-Laufzeit und physische Geräte-/Safariabnahme sind davon
getrennt. Es wurde keine neue Version der laufenden LejeAdventure-App
veröffentlicht. Keine neue Cloudkonfiguration, Lizenz- oder Sichtbarkeitsänderung.

Die lokalen Rohbelege liegen ignoriert unter `.superpowers/lernbereiche-tests/`
und `.superpowers/sdd/2026-10-20-lernbereiche/`; sie werden nicht durch Git
übertragen.

## Vollständige Integrationsprüfung

Auf dem endgültigen Quellstand nach allen Task-, Gesamt- und PIN-Korrekturen:

| Nachweis | Ergebnis | Lokales Protokoll |
| --- | --- | --- |
| Vollständige Node-Gesamtsuite | 797/797 PASS, 0 FAIL, 0 SKIP | `node-verified-final.log` |
| Integrierte Einstiegs-/Auth-/Verwaltungs-/Einstellungsbrowserfälle | 20/20 PASS, 0 SKIP | `browser-verified-final.log` |
| Offline-Neustart bei geschlossenem Server, abgelehnter Precache, fortsetzbare Übung, kontrolliertes Update | 4/4 PASS, 0 SKIP | `offline-update-verified-final.log` |
| Lokale Bereitstellungskopie | 398 öffentliche Dateien vorbereitet, keine Anbieteränderung | `npm run prepare:cloudflare` |

Die drei Logdateien liegen unter `.superpowers/lernbereiche-tests/`.
Das kontrollierte Update erhält im synthetischen Bestand Profile, Punkte,
Level, Avatar und gespeicherte Runde. Die zusätzlich geprüfte Satzzeichenoption
bleibt nach Neuladen, Update und Offlinebewertung erhalten.

Die Task- und Nachprüfungen sind jeweils mit Spec/Qualität PASS abgeschlossen.
Die unabhängige Gesamtprüfung mit GPT-6 Astra / high bestätigt den fachlichen
Umfang und fand noch einen P3-Bedienpunkt: Ein gebundenes Gerät bot bei anderen
Bereichen einen Beitrittsknopf an, obwohl der Core keinen solchen Wechsel
zulässt. Dieser Knopf ist im abschließenden kleinen UI-Schritt auf ungebundene
Geräte begrenzt und mit den betroffenen Browser-/UI-Fällen nachgeprüft. Nach
dieser Korrektur und der folgenden PIN-Ablaufkorrektur wurde die vollständige
797er-Gesamtsuite erneut erfolgreich ausgeführt; die Tabelle nennt ausschließlich
diesen endgültigen Nachlauf.

Dieser Nachlauf deckte außerdem eine tatsächliche frühe PIN-Freigabe auf:
Der atomare Erstbeitritt zeigte bereits das PIN-Formular, während sein
unmittelbarer Retry noch lief. Spätere UI-Aktualisierung konnte die begonnene
PIN-Bedienung wieder ersetzen. Die Regression hält gezielt den ersten
Dateilistenabruf nach der atomaren Installation an und zeigte vor dem Fix
aktivierte PIN-Felder. Nun bleibt die PIN-Einrichtung mit verständlichem
Ladehinweis bis zum Abschluss gesperrt; der `finally`-Pfad gibt sie auch bei
bereits abgelöstem ursprünglichem Sync-Knoten wieder frei. Ein zusätzlicher
Zustandshashfehler wurde nicht behauptet. PIN-, Commands- und Kaufprotokoll
bleiben unverändert.

Fokussierte Schlussnachweise: 10/10 Lernbereichs-Browserfälle, 2/2 Sync-UI-
Nodefälle und 2/2 bestehende Joinfälle PASS. Der kontrollierte PIN-Ablauf und
der ursprüngliche direkte Abschluss sind gemeinsam mit 2/2 PASS belegt.
Rohbelege: `task-3-final-fix-browser-green.log`, `task-3-final-fix-unit.log`,
`task-3-final-fix-join.log` und `task-3-pin-boundary-green.log` im SDD-Ordner.

Die unabhängige begrenzte Schlussnachprüfung mit GPT-6.1-sol / high bewertet
beide Abschlusspunkte mit ADDRESSED und Spec/Qualität PASS, ohne neue Befunde.
Die Veröffentlichungskopie wurde danach erneut mit 398 Dateien erstellt.
Dokumentationsprüfung: 296 Markdown-Dateien und 1.215 lokale Verweise ohne
Fehler; `git diff --check` ohne Befund. Produktänderungen liegen uncommittet
in der bestehenden Produktarbeitskopie, kein Push oder Deployment.

## Arbeitsteilung

Zwei lesende Analysen mit GPT-6.1-sol / medium. Drei getrennte Umsetzungsrollen
und die Task-/Nachprüfungen mit GPT-6.1-sol / high; Dateiverantwortlichkeiten
und Schnittstellen vorab festgelegt. Der Hauptagent integriert Dokumentation,
Cacheversion und finale Nachweise. Kein Arbeitsagent bearbeitet persönliche
Browserdaten, echte Lernstände oder Zugangsdaten. Die unabhängige Gesamtprüfung
verwendet GPT-6 Astra / high; die kleine Schlusskorrektur wird gesondert geprüft.
