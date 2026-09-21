# Task 2 – Nachprüfung Korrekturrunde 1

Stand: 21.09.2026. Fixbasis `ebe3914`, geprüfter Fix `c84b8bc`.

**Spezifikations- und Qualitätsurteil: Änderungen erforderlich.** Alle vier ursprünglichen Important-Befunde sind **ADDRESSED**. Ein neuer Important-Befund im geänderten Setup-Pointerpfad verhindert die Freigabe dieser Korrekturrunde. Keine Critical-Befunde.

## Umfang und Nachweisgrenze

Der bereitgestellte `task-2-fix1-review.diff` wurde einmal gelesen; anschließend wurden die geänderten Funktionen und neuen Testassertionen direkt geprüft. Grundlage waren der erneute Task-2-Brief, die Ergänzung des Implementierungsberichts und die ursprünglichen vier Befunde. Die Controllerentscheidung zu `SetupJob.pointerProperties`, ursprünglicher ETag, ausdrücklich gesetztem `repeatPointer:true` und frischer Configautorisierung wurde zugrunde gelegt. Kein allgemeines Folge- oder Integrationsreview.

Die berichteten **32/32** aus

```text
node --test --experimental-test-isolation=none tests/trainer/purchases-transport.test.js tests/trainer/purchases-contract.test.js
```

wurden **nicht erneut ausgeführt**. Berichtete Aufteilung und konkrete Testassertionen passen zusammen: 19 Transport-/Bootstrapfälle sowie 13 Vertragsfälle einschließlich des vorhandenen 1000-Transaktionen-Falls. Die Berichtsausgabe ist ein Implementierernachweis, kein eigener erneuter Testlauf. Ein zusätzlicher eng begrenzter synthetischer Probeaufruf wurde ausschließlich für den unten beschriebenen neuen konkreten Zweifel ausgeführt. Keine echte Google-/Geräteprüfung.

## Originalbefunde

| Befund | Urteil | Geprüfter Korrekturmechanismus |
| --- | --- | --- |
| Important 1: automatische Wiederholung mit neuer ETag | **ADDRESSED** | `bootstrap.js:144` behandelt `pointer-pending`/`reconciling` gesondert. Ohne `repeatPointer:true` erfolgt kein weiterer Netzschreibzugriff. Mit ausdrücklicher Option bleiben gespeicherter Body und ETag erhalten. `schema.js:256` verlangt beides für unklare Versuche. |
| Important 2: ungeprüfte Configref | **ADDRESSED** | `transport.js:445` prüft Configbodyhash, anschließend die exakte frisch gelesene Bestandsankerref und den vollständigen unveränderlichen Configbody. Kaufuploads und Kaufpointer verwenden diese Prüfung. Kein Cache erteilt Schreibautorität. |
| Important 3: fremde Receipt-/Basisbindung | **ADDRESSED** | `transport.js:424–437` bindet Jobintent, Receipt und Basismanifest an den Transportdatensatz sowie Receipt an den konfigurierten Koordinationsordner. Dieselbe Autorisierung schützt Upload und Pointer. |
| Important 4: Tokenwechsel zwischen Prüfung und Request | **ADDRESSED** | `transport.js:233–236` nimmt das Laufzeittoken einmal auf, prüft genau dieses Token und reicht dasselbe Token an den abhängigen Request weiter. |

Die neuen Tests prüfen jeweils die ursprünglich durchlässige Grenze: geänderter Bestandsordner nach unbekanntem PUT; gleicher ursprünglicher Wiederholungsbody und ursprüngliches If-Match; falscher Configrefhash und andere Config-ID; korrekt rehashter ausgetauschter Inhaltsordner; korrekt rehashte fremde Koordinations-/Datensatzfelder; ein einziger Tokenabruf pro gebundenem Schritt. Die bisherigen Hashprüfungen der tatsächlich geschriebenen Bodies bleiben erhalten.

## Neuer Important-Befund – fehlender Snapshot umgeht das Verbot, die Configref zu ersetzen

**Ort:** `src/trainer/purchases/transport.js:524–537`, tatsächlicher PUT ab `:557`.

Die neue Setup-API erlaubt und verwendet `putPointer({configRef, authorization})` ohne `snapshot`. Die Prüfung auf eine bereits installierte andere Configref steht jedoch ausschließlich im optionalen `if (snapshot !== undefined)`. Danach prüft der Transport den gespeicherten Kandidaten und dessen hochgeladenen Configbody, aber nicht mehr, ob am Bestandsordner bereits ein anderer Anker installiert ist. Der unten weiterhin vorhandene alte Setup-Guard ab Zeile 586 wird wegen des frühen Returns des neuen Setupzweigs nicht erreicht.

Damit kann ein formal gültiger gespeicherter `pointer-pending`-Auftrag mit einer zweiten gebundenen Config und der aktuellen Bestandsordner-ETag die einmal installierte Referenz ersetzen. Das verletzt die Task-2-Vorgabe **„Configref darf niemals ersetzt werden“**. Vor dem Fix verlangte dieser Pfad den Snapshot und lehnte darin die installierte fremde Referenz ab; die Lücke entsteht durch die in diesem Fix eingeführte optionale Snapshotübergabe.

Der normale `resumeBootstrap`-Pfad liest korrekt zuerst und übernimmt einen vorhandenen Gewinner. Das ist positiv, ersetzt aber nicht die Prüfung an der ausdrücklich als gebunden angebotenen Transport-Schreibgrenze. Gerade dort werden auch andere formal gültige, aber widersprüchliche persistierte Autorisierungen unabhängig vom späteren Service abgewehrt.

### Gezielte Reproduktion

Ein PowerShell-Here-String wurde an `node --input-type=module` übergeben. Er importierte ausschließlich `transport.js`, `bootstrap.js`, `value.js` und die vorhandene synthetische HTTP-Fixture:

1. Setup A normal vorbereiten und bestätigen; Bestandsanker zeigt auf `reserved-3`.
2. Setup B vorbereiten, seine reservierten Ordner und Config über die vorhandenen Transportmethoden hochladen.
3. Den aktuell installierten Bestandsordner lesen. Einen strukturell gültigen gespeicherten B-Auftrag mit `phase:'pointer-pending'`, dieser ETag und `pointerProperties` einschließlich der B-Configref bilden. Das entspricht dem bereits getesteten Ablehnungsfall für eine vorhandene Config, hier jedoch ohne optionalen Snapshot beim Transportaufruf.
4. `putPointer({configRef:b.configRef, authorization:{kind:'setup', setup:pending}})` aufrufen.

Tatsächlich beobachtet, Exitcode 0:

```json
{"before":"reserved-3","after":"reserved-6","result":{"id":"dataset-folder","status":200}}
```

Die vorhandene Negativprüfung `pointer authority requires the exact persisted ETag and cannot replace an installed config ref` übergibt weiterhin ausdrücklich `snapshot: installed` und erreicht deshalb nur den geschützten optionalen Zweig. Sie deckt den jetzt regulären snapshotfreien Aufruf nicht ab.

### Erforderliche Korrektur

Das Ersetzen unabhängig von einer optionalen Caller-Snapshotübergabe verhindern, beispielsweise durch eine frische gebundene Bestandsordnerprüfung vor dem Setup-PUT. Bei schon installiertem anderem Anker ohne PUT ablehnen; bei identischer Referenz den bestehenden Zustand auf dem vorgesehenen Lese-/Abgleichpfad behandeln. Für eine ausdrücklich erlaubte Wiederholung weiterhin ausschließlich **ursprüngliche gespeicherte ETag und ursprünglichen Body** senden; eine frische Prüfung darf keine neue Schreibbedingung liefern. Einen Negativtest für den snapshotfreien Aufruf mit bereits installiertem anderem Anker ergänzen und nachweisen, dass kein PUT gesendet wird.

## Nicht blockierende Abgrenzungen

- Die bewussten fünf gebundenen Configautorisierungsreads plus Kontoprüfungen entsprechen der Controllerentscheidung; ihre Latenz ist ein späteres Integrations-/Statusanliegen.
- Initialisierungs-/Restore-Aufträge sowie die früheren Task-1-Minors bleiben Task 3/4. Ihre noch fehlende Implementierung ist kein Befund dieser Nachprüfung.
- Keine zusätzliche außerhalb des Fixumfangs liegende Beobachtung wird hier als neue Freigabebedingung eingeführt.
- Produktdateien, Index und vorhandene Controllerübergaben/Berichte blieben unverändert. Nur dieser Nachprüfungsbericht wurde angelegt.
