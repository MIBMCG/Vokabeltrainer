# Kaufprobe mit unveränderlichen Belegen

Stand: 20.09.2026. [Entwurf](../superpowers/specs/2026-09-20-immutable-purchase-probe-design.md), [Plan](../superpowers/plans/2026-09-20-immutable-purchase-probe.md), [Anleitung](../KAUFPROBE.md). Ausgangspunkt `a004344`; Entwurfscommit `e2f4d46`, Kernimplementierung `88714c32999b36adff1f9bc09a5533726e69795a`.

## Kernimplementierung

`immutable-value.js` erzeugt kanonisches JSON und SHA-256-Werte. Der getrennte Transportpfad reserviert neue Datei-IDs, bindet diese an Inhalt und Inhaltsordner und prüft eine Anlage oder Wiederholung anhand des vollständigen Inhalts. Alte Update-Methoden dürfen diese registrierten unveränderlichen Dateien nicht überschreiben. Der bisherige strenge Leseguard für veränderliche Dateien bleibt erhalten.

`purchase-coordinator.js` prüft die vollständige Belegkette samt Vorgängern, Sequenzen, Operationskennungen und Zustandsübergängen. Eine äußere Ordnerprüfung stellt fest, ob sich der Kopf währenddessen verändert hat. Jeder Commit versucht genau einen bedingten Ordner-PUT. Quittung und HTTP-Schreibbefund sind getrennte Ergebnisse; unklare Antworten geben keinen Besitz frei.

Ein getrennter Inhaltsordner vermeidet vorsorglich, dass das Anlegen eines Kandidaten im Koordinationsordner dessen Ausgangsversion beeinflussen könnte. Dies ist kein nachgewiesener Google-Effekt. Die Bindung an den erwarteten Inhaltsordner wird ausdrücklich geprüft.

## Prüfbelege für Task 1

Implementierungsagent: **GPT-5.6 Sol, Denktiefe hoch**. Tests vor Implementierung bzw. gezielter Korrektur wurden rot beobachtet und anschließend grün. Die dokumentierten Regressionen umfassen fehlende Module, Elternordnerbindung, Accessor-/Array-Sonderformen, Referenz-Zusatzfelder, Properties in anderer Reihenfolge und eine fehlerhafte 2xx-Antwort mit falscher Datei-ID.

| Prüfung | Ergebnis |
| --- | --- |
| Neue Transport-/Koordinatorfälle | 28/28 bestanden |
| Gesamte Shop-Node-Suite nach Task 1 | 155/155 bestanden |
| Syntaxprüfung der fünf geänderten/neuen JavaScript-Dateien | Alle Exit 0 |
| `git diff --check` | Ohne Befund |

Ausgeführt mit `node --test --experimental-test-isolation=none tests/shop-probe/immutable-transport.test.js tests/shop-probe/purchase-coordinator.test.js` und `npm run test:shop-probe`. Die Testdaten und HTTP-Grenzen sind synthetisch. Task1 hat keinen Browserlauf und keinen echten Google-Zugriff durchgeführt.

Abgedeckt sind unter anderem verlorene Uploadantwort mit derselben reservierten ID, fehlende Quittung nach 503, Quittung nach fehlerhafter 200-Antwort, Konkurrenz bei Initialisierung und Käufen, beide Reset-Reihenfolgen, defekte Vorgänger/Hashes/Bindings, doppelte Kennungen, Zyklen, Inhalts-/Kettenlimits und Veränderungen des äußeren Ordnersnapshots. Ein Server, der Schreibbedingungen ignoriert, liefert im gezielten Negativtest bewusst zwei Erfolgsantworten; dies ist ein Fehlerbefund für die spätere Szenarioprüfung.

## Unabhängige Kernreview und Korrekturen

Reviewer: **GPT-6 Astra, Denktiefe hoch**. Zwei wichtige Befunde wurden mit gezielten synthetischen Reproduktionen bestätigt und vor der Integration geschlossen:

1. Ein unklarer Upload verbrauchte zunächst sein Ticket und verlor dadurch den Fortsetzungspfad zur reservierten ID. Jetzt bleiben Ticket und Kandidat bis zum Pointerversuch ausdrücklich fortsetzbar. Gleichzeitige Aufrufe teilen nur einen Versuch; nach Beginn des Pointer-PUT gibt es mit diesem Ticket keinen zweiten PUT.
2. Fehlerhafte erfolgreiche Nachleseantworten verloren zunächst ihren HTTP-Status. Ungültiges JSON sowie `null`, Arrays oder primitive Metadatenkörper erhalten nun im neuen Pfad Status200 und bleiben `uncertain`. Tatsächlich auswertbare falsche Bindungen und Hashabweichungen bleiben gesonderte Fehler. Das alte Fehlerverhalten ist unverändert.

Fixcommits `1613f54` und `a19fcc6`. Nach den Korrekturen bestanden **35/35 fokussierte Kernprüfungen** mit `node --test tests/shop-probe/immutable-transport.test.js tests/shop-probe/purchase-coordinator.test.js`. Der erste Fix hatte zuvor 29 bestandene und 4 erwartete fehlgeschlagene Tests; der Restfall war durch den unabhängigen `null`-Repro belegt. Die begrenzte abschließende Nachprüfung gab **Entwurfstreue und Codequalität für Task1 frei**, ohne offene Befunde. Keine unveränderte Gesamtsuite wurde während der Fixrunden wiederholt.

## Browserintegration und unabhängige Prüfung

Die sechs Szenarien, Bedienung und der Export sind in `2299df4` implementiert. Der neue Prüfumfang verlangt den kohärenten v2-Transport ausdrücklich; der bisherige Standardumfang bleibt bestehen. Drei zusätzliche Module sind auch unter einem Unterpfad erreichbar. Diagnoseversion und Download tragen die Nummer 10.

Auf diesem ersten Integrationsstand bestanden 6/6 gezielte Szenariotests, 4/4 neue Edge-Browserfälle, 2/2 gezielte Serverfälle und 2/2 betroffene Altfälle. Die Browserfälle prüfen Erfolg am Root- und Unterpfad, ignorierte Schreibbedingungen und eine falsche Quellenwahl vor jedem Drive-Aufruf.

Die unabhängige Gesamtprüfung durch **GPT-6 Astra, Denktiefe hoch** reproduzierte zwei wichtige Lücken: Eine mit HTTP412 abgewiesene, aber dennoch wirksame Pointeränderung konnte anhand gleicher Zähler fälschlich grün werden; außerdem gingen beim Bericht strukturierte Commitphasen und Fehlerstatus verloren.

Beide Befunde sind in `6263470824b3333fbb2d1b7a0abdbb252e75c222` behoben. Der bestätigte Client bestimmt die vollständig erwartete Operation und Epoche; der abgewiesene Beleg muss fehlen. Beim Kauf werden außerdem ursprüngliche Initialisierung und exakter Artikel geprüft. Feste Gruppen `setupWrites`, `writes` und `followupWrites` erhalten jeweils höchstens zwei bereinigte Commitbefunde samt Upload-/Pointerphase, erlaubter Fehlerklasse und HTTP-Status. Rohdaten werden weiterhin ausgeschlossen.

Die tatsächliche Regression zeigte zuvor 5 bestandene und 5 fehlgeschlagene Fälle; nach Korrektur bestanden 10/10. Die unabhängige Nachprüfung gab Task2 und das gesamte isolierte Codepaket ohne offene Befunde frei. Ein zusätzlicher eigener Reviewer-Versuch ließ ausdrücklich Client B gewinnen und bestätigte auch für diese Reihenfolge die korrekte Zuordnung. Unveränderte Gesamtsuiten wurden vom Reviewer nicht wiederholt.

## Vollständige Abschlussprüfung

Der Hauptagent hat die Ausgaben der folgenden Läufe selbst geprüft. Codeabschluss: `6263470`.

| Befehl | Ergebnis |
| --- | --- |
| `npm run test:shop-probe` | 172/172 bestanden, Exit 0 |
| `npm run test:shop-probe:browser` | 24/24 bestanden, Exit 0 |
| `node --test --experimental-test-isolation=none tests/serve.test.js` | 6/6 bestanden, Exit 0 |

Die vollständige Serverprüfung lief unmittelbar vor der letzten Szenariokorrektur; Servercode und Servertests blieben dabei unverändert. Node- und Browserprüfungen liefen danach. Browserumgebung: Playwright mit lokalem Microsoft Edge; Google-Antworten wurden ausschließlich synthetisch abgefangen. Root- und Unterpfad, sechs Positivszenarien und relevante Fehlerwege sind abgedeckt. Der lokale Server wurde nach Erweiterung seiner festen Dateiliste neu gestartet; Probe und neue Module waren per HTTP erreichbar.

Die bestehenden Produktdateien blieben unverändert. Frühere Produkttestzahlen sind deshalb historische Belege und werden hier nicht als neu ausgeführte Tests angegeben. `npm run check:docs` prüfte 183 Markdown-Dateien und 868 lokale Verweise ohne Fehler; `git diff --check` blieb ohne Befund. Die Dateiliste enthält ausschließlich die getrennte Probe, ihre Tests, Serverfreigaben und Projektdokumentation.

## Aussagegrenzen

Kein Produktkauf, kein neuer Backenddienst, kein realer Google- oder Gerätebeleg. Wiederfinden verwendet eine erhaltene Transportregistrierung und Operationskennung innerhalb einer Sitzung. Dauerhafte Aufträge, Browserneustart, echte getrennte Geräte und die Migration von Produktpunkten, Epochen, Backups und alten Clients fehlen weiterhin. `productReady:false` bleibt gesetzt. Bericht9 mit 3/4 Checks und dem ungelösten künstlichen ETag-/HTTP500-Fall bleibt unverändert gültig als eigener historischer Befund.
