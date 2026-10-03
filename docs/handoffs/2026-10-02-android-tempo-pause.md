# Pause nach Android-Rückmeldung und Diagnose der Lernstandsübernahme

**Fortsetzung am 03.10.2026 ausdrücklich beauftragt:** „wir können nun weiter
arbeiten“. Die folgende Pause ist damit aufgehoben. Die Diagnose bleibt
Ausgangspunkt; Geräte-/Praxistests sind weiterhin verschoben. Die Korrektur ist
in der [aktuellen Tempoübergabe](2026-10-03-lernbereich-tempo.md) dokumentiert.

Stand: 02.10.2026. Der Nutzer verlangt ausdrücklich: „lege bitte eine pause ein“.
Nur diese Zwischenstandssicherung abschließen; danach keine Produktarbeit,
Testsitzung, Browser-/Anbieteraktion oder Bereitstellung bis zur ausdrücklichen
Fortsetzung. Es laufen keine beauftragten Implementierungen; der unabhängige
Leseaudit ist abgeschlossen.

## Rückmeldung und Reihenfolge

Der Nutzer hat die App auf Android getestet und berichtet, dass sie gut läuft.
Gerät, Android-Version, Browser und Home-Bildschirm-Modus wurden nicht genannt.
Dies ist ein positiver Nutzerbericht, keine vollständige Geräteabnahme und kein
Nachweis für iPad/Safari. Weitere Geräte-/Praxistests sind auf Wunsch verschoben.
Eine persönliche Erinnerungsnotiz wurde ebenfalls gespeichert.

Der Nutzer wünscht mehr Geschwindigkeit, besonders beim Übernehmen eines
Lernstands zu Beginn der Einrichtung, und hat die Weiterarbeit daran beauftragt.
Dieser Auftrag bleibt für die Zeit nach erneuter Fortsetzung erhalten; die
anschließend verlangte Pause hat Vorrang. Gezielte automatische Regressionen
für eine spätere Codeänderung sind von den verschobenen Praxistests zu trennen.
Die fünf bestätigten Belohnungsideen bleiben nach den Optimierungen vorgesehen:
Verwandlung, Figurenbewegung, Lernreaktionen, eigener Inselort und
Steckbrief/Geschichte/Titel. Kein neues Logo oder neue Avatarbilder erforderlich.

## Unveränderter Produkt- und Gitstand

- Produkt `893d7affbf2f5fa63e96f9fc23860c0106243dff`, Cache v50.
- Dokumentationsbasis vor diesem Pausenvermerk:
  `bc3007d285f66dae26a75ababb4143c061f29695`.
- Hauptarbeitsbaum: `C:/Users/Marco/Vokabeltrainer`, Zweig
  `codex/vokabeltrainer-v1`.
- Vorhandener isolierter Arbeitsbaum:
  `C:/Users/Marco/.codex/worktrees/purchase-batch-checks/Vokabeltrainer`,
  Zweig `codex/purchase-batch-checks`.
- Beide Arbeitsbäume waren vor der Dokumentationsänderung sauber. Frischer
  GitHub-Abgleich bestätigte beide Remote-Zweige exakt auf `bc3007d`.
- Keine Produktdatei geändert, kein neuer Cache, keine neue Bereitstellung.
- App bleibt [LejeAdventure](https://app.lejeadventure.workers.dev/trainer/).
  Letzter Bereitstellungsnachweis bleibt die
  [vorherige Übergabe](2026-10-02-ersteinrichtung-umbruch.md);
  kein neuer Live-Nachweis während dieser Diagnose oder Pause.
- Vorhandene Konten, Lernbereiche, PIN, Besitz und Punkte erhalten.

Dieser Pausenvermerk wird als reine Dokumentation auf beiden bereits freigegebenen
GitHub-Zweigen gesichert; seine endgültige Commit-ID ergibt sich aus `git log`.

## Befunde, noch ohne Korrektur

### 1. Fehlender unmittelbarer Abgleich nach Bestätigung

`src/trainer/sync/drive.js`, `joinDataset`, setzt nach erfolgreicher Bindung den
Status `pending` und kehrt zurück. Der Bestätigungs-Callback in
`src/trainer/ui/sync.js` entfernt nur `ui.joinPreview`. Er ruft den bereits
vorhandenen `onConnected`-Hook nicht auf. Die reine Bindungsänderung erzeugt
keine neue Outbox-ID; `createLocalChangeNotifier` startet daher keinen Abgleich.
Der normale Leerlaufzyklus in `src/trainer/sync/scheduler.js` beträgt 60 Sekunden.
Je nach vorherigem Schedulerzustand kann so eine zusätzliche Wartezeit entstehen.
Das ist eine Codeherleitung, keine gemessene Wartezeit auf dem Android-Gerät.

Der bestehende Mehrgeräte-Browserfall in `tests/browser/trainer.browser.mjs`
klickt unmittelbar nach „Lernbereich verwenden“ ausdrücklich auf
„Jetzt abgleichen“ und verdeckt diese Lücke. Der bestehende Hook in `main.js`
prüft Entsperrung und Bindung und ruft `scheduler.online()` auf.

Begrenzter Ansatz nach Fortsetzung: diesen Hook erst nach erfolgreicher
Übernahme auslösen. Automatische Regression ohne manuellen Abgleich und ohne
Vorspulen des 60-Sekunden-Zyklus ergänzen. Vorschau, Abbruch und gescheiterte
Bestätigung dürfen den Übernahmestart nicht auslösen.

### 2. Doppelte entfernte Prüfung bei nicht leerem lokalen Stand

Bei einem nicht leeren fremden lokalen Stand ruft `joinDataset` sowohl für
Vorschau als auch Bestätigung `inspectJoinedDataset` auf. Dieser erzeugt jedes
Mal einen leeren temporären Stand. Die gespeicherte Vorschau enthält Hashes
und Sicherheitskopie-ID, aber keinen wiederverwendbaren geprüften Zustand.

Begrenzter Ansatz: eine tiefe Kopie des erfolgreich geprüften Vorschauzustands
privat im Arbeitsspeicher halten und zur frischen Bestätigungsprüfung verwenden.
Vorher Vorschau-ID, Bindung, lokalen Hash und Sicherheitskopie überprüfen.
Neuen Probe-Abgleich und leere `sessionVersions` erhalten; Konto, Ordner,
Descriptor, Dateiliste, Konfiguration und Kaufkopf frisch prüfen. Remote-
Ledgervergleich und abschließende atomare lokale Prüfung bleiben bestehen.
Fehler dürfen die gespeicherte Vorschau nicht verändern. Dadurch kann bereits
geprüfte unveränderliche Kaufhistorie wiederverwendet werden, während Änderungen
am Lernstand weiter erkannt werden. Dies ist noch nicht implementiert oder
als Verbesserung gemessen. Ein wirklich leerer Erststand überspringt diese
Vorschauprüfung; für ihn ist insbesondere Befund 1 relevant.

## Frische synthetische Ausgangsmessung

Vor dem Pausenauftrag lief die vorhandene isolierte Diagnose mit synthetischen
Google-Anfragen und 100 ms künstlicher Latenz je Übernahmeanfrage erfolgreich
durch. Reales Netzwerk ist im Helper ausdrücklich gesperrt. Synthetischer
Teststand mit aktiven Käufen; keine Familien-/Nutzerdaten und keine Zugangsdaten.

| Phase | Anfragen | Dauer |
| --- | ---: | ---: |
| Suche | 5 | 0,552 s |
| Vorschau | 79 | 7,564 s |
| Bestätigung | 79 | 7,610 s |
| Anschließender Abgleich | 38 | 3,296 s |
| Übernahme ohne Suche | 196 | 18,470 s |
| Einschließlich Suche | 201 | 19,022 s |

Der Helper startet den anschließenden Abgleich ausdrücklich sofort. Die mögliche
zusätzliche Scheduler-Wartezeit ist deshalb nicht in diesen Werten enthalten.
Kein Android-Zeitnachweis und keine Aussage über echte Google-Dauer oder eine
bereits erreichte Beschleunigung. Keine neue breite Testsuite ausgeführt.

Lokale ignorierte Belege, relativ zum Hauptarbeitsbaum:

- `.superpowers/diagnostics/2026-10-02-join-latency/measure.mjs`
- `.superpowers/diagnostics/2026-10-02-join-latency/trace-100.json`

Die Rohdatei nicht durch eine Nachher-Messung überschreiben; vorher als Baseline
kopieren. Befehl für eine spätere reproduzierbare Vergleichsmessung:

```powershell
$env:PURCHASE_DIAGNOSTIC_MODE = 'server'
$env:PURCHASE_HTTP_DELAY_MS = '0'
$env:REMAINING_DELAY_MS = '100'
& 'C:/Program Files/nodejs/node.exe' --no-experimental-global-navigator .superpowers/diagnostics/2026-10-02-join-latency/measure.mjs
```

## Wiederaufnahme erst nach ausdrücklicher Fortsetzung

1. Branches, lokale Änderungen und Remote-SHAs prüfen; diese Übergabe lesen.
2. Zuerst den fehlenden unmittelbaren Abgleichstart mit gezielter Regression
   korrigieren und unabhängig prüfen.
3. Danach die begrenzte Vorschauwiederverwendung bearbeiten. Regressionen für
   neue Lernereignisse/Reset, neue Käufe, geänderte/beschädigte Dateien,
   Auth-/Netzfehler, lokale gleichzeitige Änderungen, Sicherheitskopie und
   wiederholte Bestätigung erhalten. Keine Vorschau-Schreibzugriffe auf Drive.
4. Dieselbe synthetische Messung vergleichen; keine reale Zeitverbesserung
   aus künstlicher Latenz ableiten. Anbieterbereitstellung erst nach der
   erforderlichen Codeprüfung. Die Nutzer-Praxistests bleiben verschoben.

Keine Umsetzung, Tests oder Bereitstellung aufgrund dieses Dokuments automatisch
beginnen. Die ältere zurückgestellte
[Vorschaudiagnose](2026-09-29-lernbereich-vorschau.md) ist Hintergrund; der jetzige
Nutzerauftrag benennt die Übernahmebeschleunigung erneut, die aktuelle Pause
bleibt bis zur ausdrücklichen Fortsetzung maßgeblich.
