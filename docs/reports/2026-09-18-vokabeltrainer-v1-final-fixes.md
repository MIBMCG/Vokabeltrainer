# Gemeinsame Korrektur der vier Integrationsbefunde

Stand: 18.09.2026. Die vier Important-Befunde I1–I4 aus der [Gesamtprüfung](2026-09-18-vokabeltrainer-v1-gesamt-review.md) sind in einer gemeinsamen Produktänderung umgesetzt und frisch automatisiert geprüft. Die gesonderte unabhängige Nachprüfung dieses Diffs folgt; dieser Implementierungsbericht ersetzt sie nicht.

- Branch: `codex/vokabeltrainer-v1`
- Fachliche Reviewbasis / FIX_BASE: `807a722e6f962966449ef14f7c44c5944dd95ed1`
- Unmittelbarer Elterncommit des Produktfixes: `617d4a6` (Reviewbericht und technische Entscheidung 26 wurden zwischenzeitlich durch den Controller dokumentiert).
- Produkt- und Testcommit: **`cc079cbea31d6d834b7d8eba1920486daddb4e90`**
- Umsetzung: GPT-6 Astra, Denktiefe high, ein Produktwriter, keine weiteren Unteragenten.
- Kein Push, Merge, Hosting oder Zugriff auf persönliche Browser-/Google-Daten. Ausschließlich isolierte synthetische Browserprofile und eigene Testserver auf freien Ports; persönlicher Port 4173 blieb unberührt.

## Konkrete Korrekturen

### I1: PIN vergessen aus dem gesperrten Bereich

`ui/adult.js` stellt den bestehenden bewussten Reset als gemeinsamen `pinResetForm`-Renderer bereit. `ui/shell.js` zeigt ihn über „PIN vergessen“ bereits an der gesperrten Erwachsenenansicht. Ausschließlich der ausgeschriebene Text „PIN zurücksetzen“ und zweimalige neue PIN sind erforderlich. Fehlermeldungen bleiben im Formular sichtbar; ein laufender Reset kann nicht durch wiederholtes Absenden doppelt ausgelöst werden.

Der eigentliche PIN-Dienst, dessen Serialisierung, erwarteter Prüfeintrag und Berechtigungsgeneration bleiben unverändert. Ein zwischenzeitliches Sperren kann daher auch den neuen UI-Zugang nicht verspätet entsperren. Der Browserfall startet nach Neuladen mit gesperrtem Gate, verwendet die alte PIN nicht, setzt lokal zurück, erreicht den vorhandenen Lernbestand und öffnet nach erneutem Neuladen mit der neuen PIN. Ledger und lokale Runden sind unverändert; es gab keinen OAuth-Aufruf.

### I2: Erwachsenenentwürfe über Hintergrundänderungen erhalten

Die Shell ersetzt bei einem Command-Zustandsereignis die bereits entsperrte Erwachsenen-DOM nicht mehr. `adultStateChanged` vergleicht den Ledger mit der zuletzt ausdrücklich gerenderten Fassung. Bei fachlicher Änderung erscheint ein ergänzender Hinweis mit „Ansicht neu laden (Eingaben verwerfen)“. Das bewusste Neuladen sowie die bestehenden expliziten Formular-/Navigationsaktionen lesen den aktuellen Zustand. Reine Transportänderungen lösen keinen Formularwechsel aus.

Die unveränderte DOM erhält Eingaben, Fokus, Auswahl, offene Bearbeitungsbereiche und die ursprünglichen Closures einschließlich `expectedHeads`. Veraltete Wortbearbeitungen werden weiterhin durch Commands zurückgewiesen. Beim Fehler bleiben auch der Wortentwurf und die Fehlermeldung stehen. Es gibt kein heimliches Übernehmen fremder Revisionsköpfe. Eine tatsächliche PIN-Sperre umgeht diesen Erhaltungszweig und entfernt die geschützte Ansicht.

Der Browserfall nutzt echte Commands-, Drive-Client- und ProductSync-Module mit einem getrennten synthetischen Speicher und simulierter Google-HTTP-Grenze. Ein unveränderter Sync erhält neue Namen, Profilbearbeitung, PIN-Änderung, Lektionsname/-zuordnung, Wortbearbeitung und Tabellenpaste. Danach wird eine gültige fremde Wortrevision als Drive-Paket empfangen: Eingaben und offenes Detail bleiben erhalten, die fokussierte Tabellenpaste bleibt fokussiert, und Speichern mit der ursprünglichen Revisionsbasis wird abgelehnt. Es entsteht kein zusätzliches Inhaltsereignis. Erst das ausdrücklich beschriftete Neuladen verwirft die Entwürfe und zeigt den fremden Stand. Abschließendes Sperren zeigt wieder das PIN-Gate.

### I3: Bewusste Wiederanmeldung startet den bestehenden Abgleich

Der optionale Callback `onConnected` läuft durch `mountShell` → `renderAdult` → `renderSync`. Er wird ausschließlich im Erfolgszweig nach `auth.connect()` und der erneuten aktuellen PIN-Prüfung ausgelöst. Der Controller prüft zusätzlich `closing`, aktuelle Entsperrung und bestehendes `binding`, bevor er den vorhandenen Scheduler über `online()` anstößt.

Der Browserfall erzeugt im gebundenen Bestand eine ausstehende Änderung und lässt den planmäßigen Lauf mit einem synthetischen 401 enden. Nach dem bewussten erneuten Verbinden wird diese Änderung ohne weiteren Abgleichknopf oder Sichtbarkeitsereignis genau einmal übertragen. Ein anschließendes Vorstellen der Browseruhr belegt weitere Polling-Anfragen, ohne zusätzlichen OAuth-Aufruf oder doppelten Dateiupload. Ungebundene Bestände werden durch den Callback weder angelegt noch ausgewählt. Die vorhandenen ungebundenen Authfehler- und während OAuth gesperrten Browserfälle bleiben grün.

### I4: Epochenkonflikt vor Profilinvalidierung behandeln

Die Shell prüft `epochConflict` vor den regulären Profilansichten. Bei offener Übung hält sie den noch nicht abgesendeten Text mit Runden-/Epochenbezug nur im Arbeitsspeicher. Die Konfliktansicht zeigt ihn schreibgeschützt, erklärt die Sperre für Antworten/neue Runden und bietet den Erwachsenenzugang. Besuche des Erwachsenenbereichs verwerfen diesen Konfliktentwurf nicht. Erst ein eindeutiger neuer aktiver Epochenkopf entfernt ihn. Die bestehende Commands-Logik beendet die alte Runde dabei ohne Wertung und Abschlussbonus.

Auch ein zwischenzeitlich nicht im DOM vorhandener, nichtleerer Konfliktentwurf blockiert `pauseForUpdate()`. Es entsteht kein persistiertes Entwurfsformat. Die bestehende Update-Bediensperre (`inert`), idempotente Freigabe und Behandlung verspäteter Workerwechsel bleiben unverändert. `destroy()` entfernt den flüchtigen Konfliktentwurf.

Im echten Testbrowser trifft während der Texteingabe ein validierter Zustand mit zwei Restoreköpfen und vollständigen, gehashten Snapshots über `commands.commitExternal` ein – dieselbe atomare Empfangsgrenze wie im Sync. Das ist eine synthetische Empfangsinjektion, kein zusätzlicher realer Google-Nachweis. Textschutz, fehlende aktive Prüftaste, abgelehnte Antwort/Start/Update, Erwachsenennavigation und Updateblockade ohne Antwort-DOM werden geprüft. Die bewusste Auflösung verwendet den echten Restore-Dienst samt Vorschau/Bestätigung. Danach ist die alte Runde `abandoned`, es existieren weder Antwort- noch Abschlussereignisse aus der offenen Eingabe, und der Entwurf ist verschwunden. Der vorhandene Browserfall für tatsächlich archivierte beziehungsweise unbrauchbare Profile bleibt unverändert grün.

## Dateigrenzen und Integration

Produktdateien: `src/trainer/main.js`, `src/trainer/ui/adult.js`, `src/trainer/ui/shell.js`, `src/trainer/ui/sync.js` und `trainer/sw.js`. Tests/Fixture: `tests/browser/trainer.browser.mjs`, `tests/browser/trainer-harness.mjs`, `tests/trainer/sw.test.js`.

Keine Änderung an Commands, PIN-Dienst, Lernlogik, Ereignis-/Speicherformat, Sync-Protokoll oder Restore-Dienst. Keine neue Abhängigkeit und kein neues Laufzeitmodul; daher bleibt die vorhandene vollständige Worker-/Servermodulliste ausreichend. Produktcache von **v4 auf v5** erhöht; der reale Updatefall liefert absichtlich **v6** als abweichende neue Workerfassung. Die Änderungen entsprechen [technischer Entscheidung 26](../ENTWICKLUNGSENTSCHEIDUNGEN.md) und erhalten die Updateverträge 24/25.

## RED/GREEN und dauerhaft bewahrte Evidenz

Umgebung: Node.js **22.23.2**, Playwright **1.62.1**, System-Edge über `BROWSER_EXECUTABLE`. Browserläufe wurden nach `spawn EPERM` im Sandboxstart über den erlaubten eskalierten Weg ausgeführt. Das EPERM war kein Produkttestergebnis. `PLAYWRIGHT_MODULE` verwies auf die vorhandene lokale Playwright-Laufzeit; die portablen Befehle bleiben:

```sh
node --test --test-name-pattern="final I[1-4]" tests/browser/trainer.browser.mjs
node --test --test-name-pattern="final I[24]" tests/browser/trainer.browser.mjs
npm test
node --test tests/browser/trainer.browser.mjs
```

Die lokalen vollständigen Ausgaben sind unter `test-results/final-fixes/` erhalten. Dieses ignorierte Verzeichnis ist kein portabler Nachweis; deshalb stehen die maßgeblichen tatsächlich beobachteten Ergebnisse zusätzlich hier im versionierten Bericht:

| Schritt | Tatsächlicher Befehl / Auswahl | Ergebnis und Beleg |
| --- | --- | --- |
| Erstes RED vor Produktänderung | erster Befehl, vier neue Fälle | 0/4; I1: fehlender Reset-Zugang `0 !== 1`; I3: Outbox nach erfolgreichem Reconnect `1 !== 0`. I2/I4 hatten zunächst einen fehlenden Fixture-`onStatus`-Callback; diese beiden Fehler werden nicht als Produkt-RED gewertet. Datei `red-browser.txt`. |
| Korrigiertes RED vor Produktänderung | zweiter Befehl, I2/I4 | 0/2; I2: Namensentwurf ist `''` statt `'Noch nicht gespeichert'`; I4: Antwortfeld nach Konfliktempfang `0 !== 1`. Datei `red-i2-i4.txt`. |
| Zwischenläufe während GREEN | erster beziehungsweise zweiter Befehl | Die Produktpfade I1/I3/I4 bestanden. Beim weiter erreichten Fremdpaket fehlten zunächst zwei Metadatenfelder in der Testfixture; danach war eine Fehlertextabfrage mehrdeutig. Beides wurde in der Fixture/Locatorauswahl korrigiert, ohne Produktschutz zu lockern. Dateien `green-attempt1.txt`, `green-i2-i4.txt`. |
| Abschließendes gezieltes GREEN | erster Befehl, erweiterte vier Fälle | **4/4**, 0 Fehler, 0 übersprungen, ca. 16,6 s. Datei `green-browser.txt`. |
| Frischer vollständiger Node-Lauf | `npm test` | **277/277**, 0 Fehler, 0 übersprungen, ca. 7,0 s; Exit 0. Datei `full-node.txt`. |
| Frischer vollständiger Trainer-Browserlauf | `node --test tests/browser/trainer.browser.mjs` | **15/15**, 0 Fehler, 0 übersprungen, ca. 73,0 s; Exit 0. Datei `full-browser.txt`. |

Die vier neuen Browserfälle heißen exakt:

```text
final I1 forgotten PIN is recoverable from the locked gate without old PIN or data loss
final I2 adult drafts retain focus and original revision heads across unchanged and foreign sync
final I3 deliberate reconnect wakes pending bound sync without another lifecycle event
final I4 restore conflict preserves an open answer until adult resolution without scoring
```

Der vollständige Browserlauf umfasst außerdem alle elf bisherigen Fälle einschließlich Offline-Neustart unter Wurzel- und Unterpfad bei geschlossenem Testserver, Neustart mit persistentem synthetischem Browserprofil, PIN-/BFCache-Lebenszyklus, Altprofilinvalidierung, Auth-/Restoreflüssen und echtem verzögerten Workerwechsel von v5 nach v6. Er lief nach dem letzten Produkt-/Testpatch genau einmal erfolgreich. Die unveränderte getrennte Drive-Probe wurde nicht erneut breit ausgeführt; ihr bisheriger **12/12**-Nachweis auf `3b1d16d` bleibt getrennt bestehen.

## Selbstprüfung und verbleibende Grenzen

Alle vier Änderungen wurden gemeinsam entlang von Zustandscallback, explizitem Rendern, PIN-Sperre, OAuth-Abschluss, Epochenauflösung und Updategrenze geprüft. Erhaltene DOM-Closures behalten absichtlich ihre ursprünglichen Revisionsköpfe. Transportstatus verändert ausschließlich seine vorhandenen Textknoten. PIN-Sperren haben Vorrang vor Formularerhalt; nach asynchronem OAuth wird die aktuelle Berechtigung erneut geprüft. Neue Epochen löschen den RAM-Konfliktentwurf erst nach eindeutiger Auswahl, und die bestehende Command-Grenze verhindert Wertung/Bonus. Programmcache und synthetische Updatefassung sind verschieden. `git diff --check` war vor dem Produktcommit ohne Befund.

Die anschließende Dokumentationsprüfung `npm run check:docs` einschließlich dieses Berichts ergab **174 Dateien, 75 Markdowndateien, 320 lokale Links und 0 Fehler**. `git diff --check` war ebenfalls ohne Befund. Der Produktcommit war bei dieser Prüfung unverändert `cc079cb`; ausschließlich dieser Bericht wurde separat ergänzt.

Es werden keine echte Produkt-Google-Abnahme, Synchronisation über zwei physische Geräte, Safari-/iPhone-/iPad-/Home-Screen-Abnahme oder HTTPS-Veröffentlichung behauptet. Flüchtige ungesendete Entwürfe werden nicht über Browserneustarts persistiert; dies erweitert den Datenvertrag nicht. Bewusste Navigation beziehungsweise das ausdrücklich beschriftete Neuladen der Erwachsenenansicht kann dortige Entwürfe verwerfen. Die verbleibende unabhängige Prüfung ist auf diese gemeinsame Fixwelle begrenzt und wird vom Controller koordiniert.
