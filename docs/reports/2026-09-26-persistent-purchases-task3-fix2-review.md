# Task 3 – unabhängige Nachprüfung der Korrekturrunde 2

Prüfdatum: 26.09.2026. Prüfbereich: `0b359d8..b6abb4e` auf `codex/vokabeltrainer-v1`.

**Spezifikationsurteil: bestanden im beauftragten Task-3-Umfang. Qualitätsurteil: freigegeben.** Der verbliebene Befund **R3-4 ist ADDRESSED**. Die Urteile ADDRESSED für R3-1 bis R3-3 aus der [ersten Nachprüfung](2026-09-26-persistent-purchases-task3-fix1-review.md) bleiben bestehen. Keine neuen Critical-, Important- oder Minor-Befunde im geprüften Fix.

## R3-4 – ADDRESSED

Die Korrekturrunde verändert ausschließlich `tests/trainer/purchases-recovery.test.js` und den [Fixbericht](2026-09-26-persistent-purchases-task3-fix2.md). Produktcode und Protokollvertrag sind unverändert.

### Teilweise gespeicherte Closure und verlorene Uploadantwort

**Prüforte:** `tests/trainer/purchases-recovery.test.js:56–69`, `:137–159`, `:381–408`, `:548–555`, `:601–627`.

Kauf, Initialisierung und Restore prüfen jetzt jeweils zwei konkrete Unterbrechungen einer Closure mit mehr als zwei Elementen: Fehler vor dem Speichern des zweiten Uploads und verlorene Antwort nach dessen Speicherung. Die Assertions unterscheiden ausdrücklich den serverseitig vorhandenen ersten beziehungsweise zweiten Wert. Es wird damit tatsächlich aus einer teilweise gespeicherten Closure fortgesetzt; der Fehler wird nicht nur vor dem ersten oder nach allen Uploads ausgelöst.

Nach dem Abbruch werden persistierte JSON-Daten in einen neuen Storeadapter geladen und neue Transport-, Commands-, Service- und Syncobjekte erzeugt. Nur der simulierte Serverzustand bleibt erhalten. Bei der Wiederaufnahme müssen die tatsächlich übergebenen Uploadreferenzen und Inhalte exakt der ursprünglichen gespeicherten Closure entsprechen. Kandidatenreferenz und persistierte Uploadliste werden nach Abschluss erneut verglichen; jeder serverseitige Wert wird inhaltlich geprüft. Der Transportdouble lehnt außerdem einen anderen Inhalt unter bereits verwendeter Immutable-ID ab. Die ursprüngliche Identität ist dadurch sowohl am gespeicherten Auftrag als auch an der erneuten Dienstübergabe und dem Serverergebnis nachgewiesen.

Diese Fälle ergänzen die bereits vorhandene Persistenzphasenmatrix und die Pointerfälle. Die zuvor offene fachliche Zustandsklasse zwischen erstem und letztem Upload ist damit abgedeckt; eine Vervielfachung desselben unverzweigten Uploadpfads für jede beliebige Closurelänge ist für die Schließung dieses Befunds nicht erforderlich.

### Kein abhängiger Upload nach fehlgeschlagenem Reservierungssave

**Prüfort:** `tests/trainer/purchases-recovery.test.js:311–322`.

Der Kauf-Speichergrenzentest hält nun zusätzlich die vorherige Immutable-Aufrufanzahl fest. Nach einem fehlgeschlagenen `reserved`-Save müssen sowohl diese Anzahl als auch die Pointeranzahl unverändert bleiben. Damit ist die in der ersten Nachprüfung konkret fehlende Assertion ergänzt; die entsprechenden Control-Assertions bleiben erhalten.

### Tatsächlich empfangener Snapshot und ETag-Mutation

**Prüforte:** `tests/trainer/purchases-recovery.test.js:71–85`, `:410–425`, `:466–480`, `:630–649`.

Das Double nimmt den tatsächlich gelieferten Snapshot entgegen, protokolliert ihn getrennt von den gespeicherten Autorisierungsdaten und vergleicht dessen ETag mit der gespeicherten ETag. Phase, Kandidatenreferenz und Kandidatenhash werden zusätzlich gebunden. Die positive Wiederaufnahme prüft nun die empfangene ETag und die empfangenen Pointerproperties bei Kauf und Controls direkt.

Die versionierte Mutationsregression verändert die Snapshot-ETag erst nach Übergabe durch den Service. Sie verlangt `binding`, bestätigt den tatsächlich empfangenen falschen Wert und dessen Abweichung von der gespeicherten ETag und prüft, dass der Auftrag offen beziehungsweise in `reconciling` bleibt. Der Bericht dokumentiert für dieselbe Mutation den roten Lauf vor und den grünen Lauf nach der Doublekorrektur. Die vorher belegte Prüfblindheit ist damit geschlossen. Das bewusste Verhalten des echten Transports, den Pointerbody aus der gespeicherten Autorisierung zu senden, wird dabei korrekt beibehalten.

## Ergänzende Regression und neue Fehler

**Prüfort:** `tests/trainer/purchases-recovery.test.js:929–965`.

Der zuvor nur bis zur Vorschau reichende Lernzuwachstest enthält jetzt den Rundenbonus, den vollständigen zweiten Kauf und den anschließenden Neustart. Er prüft 420 verdiente, 400 ausgegebene und 20 verfügbare Punkte, beide erworbenen Artikel und genau zwei Pointeraufrufe. Die ID-Liste des Rundenabschlusses ist kanonisch sortiert. Der im Implementierungsbericht erklärte erste Fixturefehler ist im geprüften Stand korrigiert.

Die neuen Fehlerstellen des Doubles liegen vor beziehungsweise nach dem ausdrücklich geprüften `files.set`. Sie werden einmalig verbraucht, sodass der neue Client beim Resume nicht von einem zufällig bestehen gebliebenen Fehlerflag abhängt. Die bisherige boolesche Fehlerauslösung bleibt kompatibel. Im eng begrenzten Testfix wurde keine neue Regression festgestellt.

## Prüfverfahren und Grenzen

Der Fixbericht und das bereitgestellte Paketdiff wurden einmal gelesen. Die betroffenen Assertions und Zeilen wurden gezielt geprüft. `git diff --name-only 0b359d8 b6abb4e` bestätigt ausschließlich die beiden genannten Dateien; `git diff --check` blieb ohne Befund. Produktcode, Index und HEAD wurden durch diesen Reviewer nicht verändert. Der Reviewbericht wird als UTF-8 mit LF gespeichert.

Die **57/57 bestandenen Recoverytests**, der rote/grüne Mutationslauf und die Dokumentationsprüfung sind die im Fixbericht dokumentierten Ausführungsnachweise des Implementierers. Sie wurden in dieser Nachprüfung nicht erneut ausgeführt. Es bestand nach der Quell- und Assertionprüfung keine konkrete unbeantwortete Hypothese, die einen weiteren Lauf rechtfertigt.

Die Freigabe betrifft Task 3 und erlaubt den nächsten geplanten Integrationsschritt. Die echten Task-4-Ports für vollständigen Lernabgleich, dauerhaft rekonstruierbare Marker-/Restoreziele und atomare Aktivierung der aktuell maßgeblichen Epoche bleiben ausstehend; dies sind keine offenen Befunde der vorliegenden Testkorrektur. Reale Google-, Browser-, Zwei-Geräte- und Apple-Nachweise sowie die abschließende Gesamtpaketprüfung bleiben unverändert offen.
