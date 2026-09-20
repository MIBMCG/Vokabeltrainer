# Entscheidungsvorlage: Kaufkoordination nach Diagnose 6

Stand: 20.09.2026. **Nutzerwahl C bestätigt (Antwort „c“): den direkten Drive-Ansatz gezielt weiter untersuchen.** Anlass ist die [Auswertung des echten Diagnose-6-Laufs](../reports/2026-09-20-shop-v6-reallauf.md). Kein zusätzlicher Backenddienst und keine Änderung der ausgebbaren Punkte sind gewählt. Die nachfolgenden Optionen und der Vorschlag A bleiben Entscheidungshistorie, keine Freigabe für A.

## Warum jetzt eine Richtungsentscheidung nötig ist

Die direkte Drive-Kaufkoordination erfüllt den vereinbarten Gesamtnachweis nicht. Vier Lesestabilitätsabbrüche bleiben trotz unveränderter sichtbarer Zusatzmerkmale; ein Negativtest ist mehrdeutig. Ein anderer Fall belegt dagegen die Ablehnung eines alten Tokens mit HTTP 412. Daraus folgt weder eine generelle Untauglichkeit von Drive noch eine nachgewiesene atomare Kaufgarantie.

Die wiederholt getestete Kombination bietet derzeit keine belastbare Grundlage, den Shop zu aktivieren. Ein weiteres unverändertes Durchlaufen derselben Probe löst diesen Architekturpunkt nicht. Der [bisherige Shopentwurf](../superpowers/specs/2026-09-19-avatar-shop-design.md) verlangt bei ausbleibendem Nachweis eine Entwurfskorrektur und schließt einen still hinzugefügten Backenddienst ausdrücklich aus.

## Optionen

| Richtung | Vorteil | Aufwand und Grenze |
| --- | --- | --- |
| **A – Google-interne Kaufzentrale mit Apps Script prüfen (Empfehlung)** | Ausgebbares Guthaben und bewusste Stufenkäufe bleiben das Ziel; Google dokumentiert eine Sperre für parallele Ausführungen desselben Skripts. Kein neuer Anbieter und kein zusätzliches kostenpflichtiges Cloudabo vorgesehen. | Zusätzliche serverseitige Komponente, einmalige Betreiber-Einrichtung; Anmeldung, PWA-Anbindung und dauerhaft konsistente Belege müssen erst nachgewiesen werden. |
| B – Statische Drive-App behalten, Belohnungen über erreichte Gesamtpunkte freischalten | Kein serverseitiges Kaufkonto nötig; Freischaltungen können aus zusammengeführten Lernereignissen berechnet werden. | Ändert die bestätigte Produktentscheidung: Punkte würden nicht mehr ausgegeben, Sparen und Kaufentscheidungen entfielen. Schwellen und Bedienung müssten neu abgestimmt werden. |
| C – Direkten Drive-Kandidaten gezielt weiter untersuchen | Aktuelle Anbieter-/Komponentenstruktur bleibt erhalten. | Nur mit konkreter neuer Hypothese und korrigierter Negativfalldiagnose sinnvoll. Weiterer Aufwand bei weiter offenem Ergebnis; nicht empfohlen als nächste unveränderte Proberunde. |

## Vorschlag A: Ziel und feste Grenzen

Eine kleine serverseitige Stelle nimmt Initialisierung, Kauf, Wiederholungsabfrage und Rücksetzung eines Kaufkontos entgegen. Alle diese Änderungen laufen durch dieselbe erworbene Skriptsperre. Innerhalb der Sperre werden Datensatz, Kind, Epoche, Vorgangs-ID, Katalogpreis, bestehender Besitz und tatsächlich bestätigte Punkte geprüft. Erst ein dauerhaft nachlesbarer Beleg bestätigt einen Kauf. Ein wiederholter Vorgang liefert denselben Beleg.

Der vorhandene Lernbetrieb und die Ereignissynchronisation bleiben das Ausgangssystem; dies ist kein Vorschlag, die gesamte PWA bei Apps Script zu hosten. Google Drive bleibt der gewählte Cloudspeicher. Bereits vorhandene Figuren bleiben offline nutzbar; neue Käufe bleiben online. Die bestätigten Stufenpreise 200 / 400 / 800 und Figuren bleiben erhalten, sofern A gewählt wird.

`getScriptLock()` schützt nur gemeinsam gesperrte Ausführungen **desselben Skriptprojekts**, nicht beliebige Drive-Schreibzugriffe und nicht mehrere unabhängige Installationen. Eine Skriptsperre ist keine Datenbanktransaktion. Ein eigener, eindeutig gebundener maßgeblicher Belegbestand, reproduzierbare Guthabenberechnung und Behandlung unklarer Schreibausgänge sind notwendig. Eine Bestandskopie oder neue Skriptinstallation darf keine zweite Geldquelle erzeugen. [Google: LockService](https://developers.google.com/apps-script/reference/lock/lock-service).

Google beschreibt Apps Script als kostenlos nutzbare Skriptumgebung; die aktuelle Quotenübersicht enthält normale Gmail-Konten. Das rechtfertigt die Planung ohne kostenpflichtiges Zusatzabo, nicht unbegrenzte Nutzung oder eine dauerhafte Preisgarantie. Bei ausgeschöpften Grenzen muss die Kaufaktion verständlich warten oder fehlschlagen, ohne Punkte zu verlieren. Es wird keine Abrechnung aktiviert. [Google: kostenlose Skriptumgebung](https://workspace.google.com/blog/developers-practitioners/data-processing-just-got-easier-apps-scripts-new-v8-runtime), [aktuelle Quoten](https://developers.google.com/apps-script/guides/services/quotas).

## Vor einer Produktintegration zu klären und zu beweisen

1. **Erreichbarkeit und Anmeldung:** Ein authentifizierter Weg von der bestehenden PWA auf Desktop und später Safari/Home-Bildschirm zur Kaufzentrale. Apps-Script-Webapps unterscheiden Ausführung als Betreiber oder zugreifender Nutzer; Content-Service-Antworten verwenden Weiterleitungen. Direkter Cross-Origin-Zugriff, Sitzung und Fehlerlesbarkeit dürfen nicht vorausgesetzt werden. Keine undurchsichtige `no-cors`-Antwort als Kaufbeleg verwenden. [Webapps](https://developers.google.com/apps-script/guides/web), [Content Service](https://developers.google.com/apps-script/guides/content).
2. **Einrichtung und Berechtigungen:** Festlegen, wer das Skript betreibt, wie Konto/Datensatz gebunden werden und wie es vorhandene Dateien autorisiert liest. Die vorhandene Browserfreigabe `drive.file` ist kein automatischer Nachweis für die neue Komponente. Keine privaten Betreiber-Tokens oder Schlüssel in Browsercode oder Git. Kein offener anonymer Schreibdienst als Abkürzung.
3. **Dauerhafte Buchung:** Einen konkreten Speicher-/Belegvertrag entwerfen und prüfen, einschließlich Prozessabbruch vor/nach dauerhaftem Schreiben, verloren gegangener Antwort, Duplikaten und Sperrzeitüberschreitung. Guthaben und Besitz müssen aus derselben maßgeblichen Buchung stammen. Die Sperre allein erfüllt diesen Vertrag nicht.
4. **Punktegrundlage und Wiederherstellung:** Die bestehende Lernprojektion wiederverwenden oder nachweislich gleichwertig auswerten; vom Browser gemeldete Summen sind keine neue zweite Wahrheit. Kauf, Kontoinitialisierung, Epochenwechsel und Wiederherstellung teilen die gleiche Koordination. Alte Clients dürfen keine neue Kaufbuchung umgehen oder ein Konto neu finanzieren.
5. **Abnahme:** Zwei konkurrierende Käufe bei Guthaben für einen, dieselbe Vorgangs-ID, parallele Initialisierung, tatsächliche Antwortverluste, Prozessabbrüche, Rücksetzung und zweifache Installation prüfen. Ein isolierter technischer Nachweis mit synthetischen Daten kommt vor Produktmigration; echte Apple-/Zwei-Geräte-Abnahmen bleiben separat.

Die Auswahl von A erlaubt zunächst die konkrete Ausarbeitung dieses Weges. Sie behauptet keine schon fertige oder geprüfte Anbindung und aktiviert weder Deployment noch neue Kontoberechtigungen. B und C benötigen ebenfalls eine ausdrückliche Richtungsentscheidung; nichts wird automatisch umgestellt.

## Entscheidungsstand

**C gewählt.** Die frühere Empfehlung A wurde vom Nutzer nicht übernommen. Keine weitere A/B/C-Abfrage und kein stiller Wechsel zu Apps Script. Der [begrenzte nächste Diagnoseschritt](../superpowers/plans/2026-09-20-shop-probe-v7-invalid-token.md) unterscheidet den Schreibausgang der absichtlich falschen ETag und die anschließende Inhaltsnachlese; dafür wird ein gezielter Umfang mit nur diesem Fall ergänzt. Die bestehenden Stabilitätsprüfungen bleiben, und ein positiver Einzeltest aktiviert keinen Shop. Weiterhin keine unveränderte Vollprobe anfordern. Unabhängige Bildproduktion kann währenddessen fortgesetzt werden.
