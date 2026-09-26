# Task 3 – unabhängige Nachprüfung der Korrekturrunde 1

Prüfdatum: 26.09.2026. Fixbereich: `5f73008..1ecddd6`, Branch `codex/vokabeltrainer-v1`.

**Spezifikationsurteil: noch nicht vollständig erfüllt. Qualitätsurteil: gezielte Testnacharbeit erforderlich.** R3-1, R3-2 und R3-3 sind behoben. R3-4 ist wesentlich verbessert, aber noch nicht vollständig geschlossen. Keine neue Critical-, Important- oder Minor-Produktregression festgestellt. Ein bestehender Important/P2-Testbefund bleibt offen; daraus folgt kein nachgewiesener zusätzlicher Datenverlust.

## R3-1 – ADDRESSED

**Prüforte:** `src/trainer/purchases/service.js:124–145`, `:160–170`, `:302–332`, `:530–537`; `tests/trainer/purchases-recovery.test.js:742–757`.

Der Dienst verlangt vor Vorschau, Bestätigung und Reservierung einen erfolgreichen Lernabgleich und prüft danach den erneut gelesenen Produktzustand auf Bindung, ausstehende Übertragungen, Quarantäne und fachliche Konflikte. Vor dem ersten unveränderlichen Upload wird der exakte Kandidat mit der bereits geprüften Historie durch `readHistory` vollständig abgespielt. Dadurch werden auch fachlich unzulässige Verkürzungen der bisherigen Basis vor dem Pointer ausgeschlossen. Die Vorprüfung gilt zusätzlich für Initialisierung und Restore.

Die Regression verwendet das ursprüngliche Gegenbeispiel mit einer fehlenden Animationseinstellung auf dem zweiten Gerät. Sie erwartet `history`, unveränderten Kopf und unveränderte Pointeranzahl; die erste Instanz kann die Historie anschließend erneut lesen. Der synthetische Lernport übernimmt absichtlich keine fremden Fakten. Der Dienst erfüllt deshalb hier die zulässige Alternative „geschlossen abbrechen“. Die reale Übernahme fehlender Lernfakten ist der spätere Task-4-Adaptervertrag.

## R3-2 – ADDRESSED

**Prüforte:** `src/trainer/purchases/service.js:84–120`, `:205–246`; `tests/trainer/purchases-recovery.test.js:760–855`.

Der Treffer wird ausschließlich entlang der aktiven `previous`-Zielkette gesucht. Anschließend werden gespeicherte Kandidatenreferenz und Kandidateninhalt sowie der vollständige Kaufintent verglichen. Beim Control werden Operation, Operations-ID und Epoche ebenfalls exakt gebunden. Erst danach kann der Auftrag bestätigt beziehungsweise der Task-4-Abschlussport aufgerufen werden. Eine Abweichung endet mit `collision` vor einem lokalen Abschluss.

Die neuen Assertions erfassen fremdes Profil, geänderten Artikel, gleichnamige Herkunftsoperation sowie einen anderen Control-Kandidaten mit sogar identischem Inhalt. Beim letzten Fall bleibt der Control unbestätigt und der Abschlussport unaufgerufen. Die Herkunftsoperation führt nur zur korrekten Überholung des alten offenen Versuchs.

## R3-3 – ADDRESSED

**Prüforte:** `src/trainer/purchases/service.js:148–156`, `:277`, `:313–318`, `:386–396`; `src/trainer/purchases/projection.js:126–149`; `tests/trainer/purchases-recovery.test.js:858–879`.

Der Dienst baut die Konten über `project` und `rebuildAccounts` aus dem aktuellen vollständigen Ledger sowie den bestätigten Ausgaben und Besitzlisten neu auf. Die Vorschau bleibt an Produktzustand und Kopf gebunden; Bestätigung und Reservierung verwenden dieselbe gemeinsame Berechnung. Eine frei übermittelte Punktesumme wird dadurch nicht zur Autorität.

Die neue Repositoryregression belegt weitere Antworten nach einem Kauf, endet aber bereits bei der Vorschau. Die dadurch noch offene konkrete Hypothese „Rundenbonus und vollständiger weiterer Kauf samt Neustart“ wurde in dieser Review zusätzlich fokussiert geprüft: Ausgang 300 Punkte, erster Kauf für 200, zehn richtige Antworten und ein gültiger `round.completed`-Beleg ergeben 420 verdiente und 220 verfügbare Punkte. Der zweite Kauf für 200 wurde bestätigt. Nach neuen Store-, Transport-, Commands- und Serviceobjekten sowie Refresh ergaben sich **420 verdient, 400 ausgegeben, 20 verfügbar**, beide Artikel im Besitz und insgesamt genau zwei Pointeraufrufe. Diagnose Exit 0. Eine versionierte Erweiterung des vorhandenen Regressionstests um diesen Abschluss wäre sinnvoll, ist aber kein verbleibender Funktionsbefund.

## R3-4 – NOT ADDRESSED (teilweise behoben, Important/P2)

**Prüforte:** `tests/trainer/purchases-recovery.test.js:55–74`, `:119–141`, `:282–336`, `:362–403`, `:485–598`.

Die frühere Wiederverwendung derselben Clientobjekte ist in den neuen Fällen behoben: Produktzustände werden als JSON-Bytes in neue Storeadapter übernommen, der simulierte Server ist von neuen Transportinstanzen getrennt, Commands, Service und Syncports werden neu aufgebaut. Für Kauf und beide Controls sind die wesentlichen Persistenzphasen einschließlich fehlgeschlagener Abschluss-Saves vorhanden. Rein lesendes Refresh nach unklarem Pointerausgang ist ebenfalls abgedeckt.

Die ausdrücklich verlangte Prüfung der einzelnen Netzgrenzen ist jedoch noch unvollständig:

1. Die Uploadfehler bei Kauf (`:362–373`) sowie Initialisierung/Restore (`:547–557`) treffen ausschließlich den **ersten Upload vor seiner Speicherung**: `writeFailure` wird in `:57` einmalig konsumiert, bevor `files.set` erreicht wird. Der fehlgeschlagene `uploaded`-Save prüft dagegen erst den Zustand nach sämtlichen Uploads. Ein Neustart mit nur einem erfolgreich gespeicherten Präfix der Closure oder nach serverseitig gespeichertem Einzelupload mit verlorener Antwort fehlt. Genau dabei müssen neue Clients bereits vorhandene Original-IDs und Inhalte idempotent wiederverwenden; ein frischer leerer Uploadlauf ersetzt diesen Nachweis nicht.
2. Der neue Kauf-Speichergrenzentest (`:282–306`) kontrolliert vor der Wiederaufnahme nur die Pointeranzahl. Für den fehlgeschlagenen `reserved`-Save fehlt die Assertion, dass auch **kein abhängiger Immutable-Upload** ausgeführt wurde. Bei den Controls existiert diese passende Assertion bereits (`:521`).
3. Die Nachweise zur exakten Pointerwiederholung verwenden einen Transportdouble, das `snapshot` gar nicht entgegennimmt (`:61`). Es protokolliert ETag und Body direkt aus der mitgegebenen gespeicherten Autorisierung. Anders als der echte Transport prüft es nicht, ob die übergebene Snapshot-ETag mit dem gespeicherten Versuch übereinstimmt (`src/trainer/purchases/transport.js:613–617`). Ein gezielter Mutationsversuch hat die tatsächliche Snapshot-ETag des Resume-Aufrufs auf `"WRONG-ETAG"` geändert: Der simulierte Kauf wurde dennoch `confirmed`, das Protokoll meldete weiterhin `"head-1"`, und die vorhandenen ETag-/Body-Assertions bestanden. Diagnose Exit 0. Das ist eine belegte Lücke des Prüfdouble, kein Nachweis, dass der echte Transport einen solchen Request akzeptiert. Der echte Transport verwendet bewusst die gespeicherten Pointerproperties; dieses Verhalten soll erhalten bleiben.

**Erforderliche begrenzte Nacharbeit:** Für Kauf, Initialisierung und Restore gezielte Abbrüche an den einzelnen Uploadgrenzen einer mehrteiligen Closure einführen, einschließlich gespeichertem Upload mit verlorener Antwort; danach mit neuen Clientobjekten nur aus dem gespeicherten Originalauftrag fortsetzen. Assertions auf unveränderte Kandidaten, Upload-IDs und Inhalte sowie fehlende weitere Netzmutation nach gescheitertem Save ergänzen. Das Pointerdouble muss die echte ETag-Bindungsprüfung abbilden und den tatsächlich erhaltenen Snapshot separat prüfbar machen; alternativ denselben gezielten Recoveryfall mit dem realen Transport vor einem simulierten Server prüfen. Nur die betroffenen Fälle nachtesten, keine pauschale Wiederholung der Gesamtsuite erforderlich.

## Task-4-Grenzen – keine zusätzlichen Blocker dieser Review

Die echten Ports sind weiterhin absichtlich noch nicht implementiert. Für ihre Integration bleiben die bereits dokumentierten Anforderungen konkret:

- `syncLearning` führt vollständigen Produktabgleich ohne rekursiven Aufruf von `PurchaseService.refresh` aus und liefert erst nach dauerhaft gespeichertem Abgleich `phase:'synced'`.
- Candidate-Ports erzeugen eine vollständige gehashte Closure; Marker- und Restorezielabsichten müssen dauerhaft rekonstruierbar sein. Besonders beim Neustart eines Controls in `intent` erhält der Port keinen ursprünglichen flüchtigen Vorschauinhalt zurück.
- `applyConfirmedControl` aktiviert den aus der aktuellen vollständig geprüften Zielkette maßgeblichen Fachstand atomar. Ein nachträglich gefundener älterer Control darf eine inzwischen neuere autorisierte Epoche nicht zurücksetzen.

Die synthetischen Ports sind kein Nachweis für diese spätere Integration. Daraus wird hier kein neuer Task-3-Produktbefund abgeleitet.

## Verfahren und Aussagegrenzen

Gelesen wurden Task-3-Brief, Integrationsaudit, die vier ursprünglichen Befunde, der Fixbericht und das bereitgestellte Paketdiff einmal. Der umfangreiche Diffoutput wurde vom Werkzeug gekürzt; betroffene aktuelle Quelldateien und Testassertions wurden danach gezielt mit Zeilennummern gelesen. Kein wiederholter Gesamtvergleich oder breiter Paketreview.

Die historischen **53/53 Recovery-, 90/90 Fokus- und 471/471 Gesamttests** sind Nachweise des Implementierers. In dieser Review wurden sie nicht wiederholt und nicht als neu ausgeführte Prüfungen ausgegeben. Ausgeführt wurden ausschließlich lesende Git-/Quellprüfungen, `git diff --check` und die zwei oben beschriebenen kurzen synthetischen Node-Diagnosen. Dafür wurde nur der Hilfsabschnitt vor dem ersten `test(...)` aus der Recoverydatei geladen, mit absoluten Import-URLs; keine Testsuite wurde importiert oder gestartet. Keine realen Daten, Google-Anfragen oder Browser-/Geräteprüfungen.

Einstieg war HEAD `5a434bf`. Während der Review ergänzte der Controller den Fortsetzungs-Dokumentationscommit `d311a41`; die hier geprüften Produkt- und Testdateien sind gegenüber `1ecddd6` unverändert. Dieser Reviewer verändert ausschließlich diesen Bericht, keinen Produktcode, Index oder HEAD. Reale Google-, Zwei-Geräte- und Apple-Abnahmen sowie die spätere Gesamtpaketprüfung bleiben offen.
