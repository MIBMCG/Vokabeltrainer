# Desktop-Übergabe und Pause – 18.09.2026

Der Nutzer hat ausdrücklich eine Pause, eine Übergabe an den Desktop und den Push sämtlicher Projektänderungen nach GitHub beauftragt. Die Entwicklung ist angehalten. Erst nach ausdrücklicher Fortsetzung weiterentwickeln. Gesamtentwurf, Insel-Konzept und die Reihenfolge „vollständige Umsetzung vor realer Apple-Geräteabnahme“ bleiben bestätigt; keine erneute pauschale Entwurfsfreigabe nötig.

## Repository und Übernahme

- Repository: [MIBMCG/Vokabeltrainer](https://github.com/MIBMCG/Vokabeltrainer).
- Arbeitsbranch: `codex/vokabeltrainer-v1`; kein Merge nach `main`, keine Bereitstellung.
- Letzter Produktcommit: `a1db93f` — erste Produktsynchronisation, **noch nicht freigegeben**.
- Danach folgen nur Dokumentationsänderungen für diese Übergabe. Der genaue Pausencommit ist der Commit, der diese Datei einführt; mit `git log -1 --format=fuller -- docs/handoffs/2026-09-18-desktop-pause.md` ermitteln.
- Der lokale Checkout am Laptop ist ein frischer, regulärer Checkout auf dem eigenen Featurebranch. Die ältere Angabe `.worktrees/drive-probe/` beschreibt den vorherigen Rechner und ist keine notwendige Verzeichnisstruktur.

Auf einem frischen Desktop:

```sh
git clone --branch codex/vokabeltrainer-v1 https://github.com/MIBMCG/Vokabeltrainer.git
cd Vokabeltrainer
git status --short --branch
git log -10 --oneline
npm test
npm start
```

Produkt: `http://localhost:4173/trainer/`; technische Probe: `http://localhost:4173/`. Node.js mindestens 22.8.0; keine npm-Laufzeitabhängigkeiten und kein Buildschritt. In einem vorhandenen Checkout zuerst lokale Änderungen prüfen und erhalten, dann `git fetch origin`, zum Arbeitsbranch wechseln und nur bei sauberem Stand `git pull --ff-only` verwenden. Kein Reset/Force-Push.

Git überträgt Code, Dokumentation und die abgelegten synthetischen Screenshots. Lokale Browserdaten, PIN, Google-Anmeldung und persönliche Konfiguration werden nicht übertragen. Die ignorierten Ordner `.superpowers`, `test-results`, Laufzeitpakete und Browserprofile sind keine Voraussetzung; alle nötigen Ergebnisse stehen in den unten verlinkten Dateien.

## Abgeschlossene Arbeit

Tasks 1–6 waren bereits unabhängig geprüft: Ereignis-/Inhaltsmodell, Lernlogik, Runden, atomare Speicherung, Einrichtung und Erwachsenenverwaltung.

| Commit | Ergebnis und Nachweis |
| --- | --- |
| `8b961ad` | Zwei negative Web-Lock-Tests injizieren ausdrücklich `null`, da Node 26 bei `undefined` seinen vorhandenen Default verwendet. Nur Testkorrektur; unabhängige Review bestanden. [Bericht](../reports/2026-09-18-node26-testkorrektur.md). |
| `99d8f13` | Task 7 nach Review korrigiert: Hintergrundarchivierung und Profilkonflikte entwerten die aktuelle Aufgabe sichtbar und ohne Wertung; keine wirkungslose Erweiterungsaktion. 192 Node-Tests, fünf fokussierte Practice-Tests und zwei fokussierte Edge-Szenarien bestanden. [Bericht](../reports/2026-09-18-uebungsbildschirm-korrektur.md). |
| `6b83b48`, `ad3701c` | Task 8 implementiert und nachgeprüft: drei Inseln/15 Etappen, Avatar, Zubehör und Abzeichen aus der vorhandenen Belohnungslogik; eigene SVG-Grafiken. 194 Node-Tests, voller Trainer-Browserlauf 4/4 und nach Testergänzung fokussierter Rewards-Lauf 1/1 bestanden. [Bericht und echte Screenshots](../reports/2026-09-18-inselreise-avatar.md). |
| `3410ca4`, `75e5b37` | Dokumentation des Wiedereinstiegs, der Prüfergebnisse und der technischen Entscheidungen. |

Die Browsernachweise verwenden echte DOM-/IndexedDB-Pfade und synthetische Daten. Sie ersetzen keine Apple-Geräte- oder reale Produktsynchronisationsabnahme.

## Task 9: erster Code vorhanden, neun wichtige Fehler offen

`a1db93f` enthält `src/trainer/sync/packets.js`, `drive.js`, `scheduler.js`, zugehörige Tests, Transportvalidierung in `commands.js` und das optionale Drive-Metadatenfeld `version`. [Implementierungsbericht mit korrigierter Grenze](../reports/2026-09-18-synchronisation-zwischenstand.md).

Die unabhängige Review durch GPT-6 Astra mit hoher Denktiefe hat acht Fehler mit gezielten In-Memory-Reproduktionen bestätigt; der neunte folgt aus dem Kontrollfluss. **Alle neun sind offen.** Die erste Korrekturrunde wurde durch die Nutzerpause vor jeder Produkt- oder Teständerung angehalten. Es gibt keine ungesicherten Codefragmente, keinen laufenden Test und keinen halb abgeschlossenen Commit.

Verbindliche Grundlage der Fortsetzung: [vollständige unabhängige Review mit Fundstellen und Reproduktionen](../reports/2026-09-18-synchronisation-review.md).

1. Normale Drive-Ordner haben den My-Drive-Wurzelordner als Parent; die aktuelle Prüfung verlangt fälschlich keine Parents. Fake und Create/Sync/Join-Tests korrigieren.
2. Join entscheidet vor der CAS-Schleife über „leer“. Ein inzwischen gespeichertes Profil kann dadurch gelöscht werden. Bei jedem CAS-Versuch neu prüfen und gegebenenfalls sichtbar abbrechen.
3. Fehlende Version vor dem Lesen darf nicht mit einer erst danach vorhandenen Version als geprüfter Cacheeintrag verbunden werden. Beide umklammernden Versionen müssen vorhanden und identisch sein.
4. Ein vorübergehender Lesefehler kann bei bereits gecachten Dateien dauerhaft in Quarantäne hängen bleiben. Transportfehler und ungültige Inhalte unterscheiden und den erfolgreichen Wiederanlauf testen.
5. Gleiche logische Paket-ID mit unterschiedlichem Inhalt wird über mehrere Läufe hinweg nicht zuverlässig erkannt. Einen über Sitzungen verlässlichen Integritätsindex vorsehen; alte Zustände kompatibel laden.
6. Verlorene Bestätigung bei der erstmaligen Cloudanlage kann beim Wiederholen einen zweiten auffindbaren Ordner mit derselben Datensatz-ID erzeugen. Setup mit stabilen Datei-IDs vor Netzmutationen dauerhaft sichern und fortsetzen.
7. Nach lokalen Änderungen bleibt der gecachte Status fälschlich „abgeglichen“. Status und Zähler aus dem bestätigten Zustand ableiten und Verbraucher sofort informieren.
8. Wiederholte Änderungen verschieben den Zehn-Sekunden-Timer unbegrenzt. Früheste Frist erhalten, auch bei laufendem Sync.
9. Eine fehlerhafte entfernte Datei blockiert derzeit sämtliche unabhängigen lokalen Uploads. Gültige unabhängige Daten weiter abgleichen und den unvollständigen Gesamtstatus sichtbar erhalten; falsche Konto-/Ordnerbindung bleibt global blockierend.

Nicht bestätigte Vermutungen nicht erneut als Befund behandeln: Normale Auth-/Netzfehler verlieren ihre Codes nicht grundsätzlich; ein entferntes eigenes `__proto__` wird vor der Quarantäne-Wertübernahme abgelehnt und vergiftet auf dem untersuchten Pfad den lokalen CAS nicht.

## Nächster Arbeitsschritt nach ausdrücklicher Fortsetzung

1. `AGENTS.md`, diese Übergabe, den [Datenvertrag](../PRODUKT-DATENFORMAT.md), [technische Entscheidungen](../ENTWICKLUNGSENTSCHEIDUNGEN.md), [Task-9-Brief](../superpowers/tasks/task-9-brief.md) und vollständige Review lesen. Branch und Änderungen frisch prüfen.
2. Korrekturrunde 1 von höchstens fünf wieder aufnehmen, Basis `a1db93f`. Jede bestätigte Fehlerklasse mit gezieltem Regressionstest zuerst reproduzieren, dann korrigieren. Ein Produkt-Implementierer zur selben Zeit; unabhängige Nachprüfung der neun Befunde und neuer Brüche. Noch kein Erfolgsgate für Task 9 behaupten.
3. Besonders die Formatänderungen dokumentieren und testen: nullable `datasetSetup`, bei alten Speicherversion-1-Zuständen fehlendes Feld zu `null` normalisieren; echte reservierte IDs und unveränderliche Setup-Werte vor Upload persistieren; CAS erhält fremde lokale Änderungen. Nicht versteckt `restoreJobs` überladen. Ein Paket-ID/Hash-Index darf ebenfalls nur kompatibel eingeführt werden. Beides bleibt Transportzustand, kein portabler Backupinhalt. Entscheidung 15 ist vorgesehen, **noch nicht implementiert**.
4. Nach fokussierten Tests einen vollständigen `npm test`-Lauf und `git diff --check`; Korrekturcommit lokal erstellen, gezielte unabhängige Nachprüfung. Kleinere Befunde ausdrücklich dokumentieren; wichtige Befunde vor Folgeaufgaben beheben.
5. Danach Tasks 10–13 des [bestätigten v1-Plans](../superpowers/plans/2026-09-17-vokabeltrainer-v1.md) mit den einzelnen [Task-Briefs](../superpowers/tasks/task-10-brief.md) fortsetzen: Backup/Restore, Erwachsenen-Sync-/Konfliktoberfläche, Offline-PWA, Gesamtregression und portable Abschlussdokumentation. Keine weitere Produktfunktion erfinden.

## Zu erhaltende Integrationshinweise

- Task 10 erweitert den vorhandenen Root-/Pakettransport um Folgeepochen, Snapshotteile/-manifeste und den bestätigten Beitritt aus einem nichtleeren lokalen Bestand nach Sicherheitskopie. Dieser Join ist derzeit absichtlich `not-ready`. Lokaler Offline-Restore und spätere Cloudanlage müssen unveränderte Epochen mit Null-Manifestverweis über den gesonderten Manifestindex unterstützen.
- Task 11: Main besitzt die RAM-Tokensitzung. Bei `onStatus` mit `phase: 'connect'` nach 401 die aktuelle Tokensitzung invalidieren; Authfehler aus Discovery/Create/Join ebenso behandeln. Erneutes Verbinden darf nicht am alten Token vorbeilaufen. Popup-Hintergrundwechsel sperrt die PIN. Neue Methoden des Task-9-Fixes ausdrücklich in Main integrieren; keine zweite Authimplementierung.
- Task 11 übernimmt den kleinen Task-6-Befund: `#app` ist bereits `main`, daher `main#adult-content` durch eine passende untergeordnete Sektion ersetzen.
- Task 13 übernimmt den kleinen Task-7-Befund: Erschöpfungstext verspricht noch zusätzliche Wörter, wenn `canExpand` falsch ist. Text an vorhandenen Wert binden, keine zweite Auswahllogik.
- Task 13 übernimmt den kleinen Task-8-Befund: Fokus-Test muss den Austausch des alten Radio-DOM-Knotens nach asynchronem Speichern abwarten und erst dann den neuen Fokus prüfen. Produktkorrektur und Tastaturpfad wurden bereits implementiert.
- Task 12/13: Offline-Nachweis mit geschlossenem Testserver, neuem Tab und getrenntem Neustart desselben synthetischen Browserprofils; Unterpfadbetrieb ebenfalls prüfen. Bestehende Probe-Browserregression erhalten und zum Abschluss zusätzlich ausführen.
- Abschließende Berichte tatsächlich auf das Ausführungsdatum datieren, technische Entscheidungszahl nicht blind als zwölf übernehmen und Anforderungen R01–R33/E01–E10 anhand Belegen prüfen. Echte Screenshots erhalten; das Konzeptbild ist kein Ausführungsnachweis.
- Superpowers-Arbeitsweise: bisher Implementierung GPT-5.6 Sol mit hoher Denktiefe, Task-9-Datenreview GPT-6 Astra mit hoher Denktiefe. Neuer lokaler Scratchbereich darf aus diesen Dokumenten rekonstruiert werden; alte Agent-IDs sind nicht portabel. Abschließende unabhängige Gesamtprüfung ist noch offen.
- Ausführungsentscheidungen dieser Sitzung: eigener frischer Featurecheckout statt verschachteltem Worktree; bei späterer Isolation Checkoutstruktur anpassen. Die Bash-Helfer scheiterten hier an einer Windows-Sandbox-Pipe; äquivalente PowerShell-Schritte wurden verwendet. Kein Produktformat hängt davon ab. Optionales Drive-`version` und `roundAvailability` sind in Entscheidungen 13/14 dokumentiert.

## Prüfstand zum Pausieren

Am 18.09.2026 wurde `npm test` nach dem Anhalten der Entwicklung erneut ausgeführt: **215 Tests, 215 bestanden, 0 fehlgeschlagen**, Exit 0, Node **26.8.2**, etwa 4,97 Sekunden laut Testrunner. Unveränderter Produktcode `a1db93f`. Dieser grüne Lauf deckt die neun neuen Reviewbefunde noch nicht ab und ist keine Task-9-Freigabe.

Dokumentationsprüfung der Übergabe: 53 Markdown-Dateien, 210 lokale Links, keine fehlenden Ziele; `git diff --check` ohne Befund. Der erste Versuch des Linkprüfers scheiterte am gesperrten Node-Unterprozessstart von `rg`; die Dateiliste wurde anschließend direkt mit `rg` erzeugt und ohne Unterprozess erfolgreich geprüft.

Die oben genannten Browserläufe sind die früheren Prüfungen dieser Sitzung, kein neuer Browserlauf während der Pause: Playwright **1.62.1**, System-Edge **153.0.4234.32**. Der Harness unterstützt `PLAYWRIGHT_MODULE` für eine vorhandene Installation und `BROWSER_EXECUTABLE`. Auf dem Desktop die tatsächlichen lokalen Pfade verwenden; keine Laptop-Pfade als Voraussetzung übernehmen. Direkte Tests können bei eingeschränkter Prozessanlage `--experimental-test-isolation=none` verwenden. Browserstarts benötigten hier Prozessfreigabe außerhalb der Sandbox; ausschließlich isolierte synthetische Profile verwenden und einen persönlichen Server auf Port 4173 erhalten. Weitere Anleitung: [Browserprüfungen](../../tests/browser/README.md).

Es wurden keine neuen echten Google-, Produkt-Zwei-Geräte-, Safari-, iPhone-/iPad- oder Home-Bildschirm-Nachweise erhoben. Hosting, Mindestversionen und Geräteabnahme bleiben offen. Der beauftragte GitHub-Push sichert den Entwicklungsstand; er veröffentlicht keine laufende App.
