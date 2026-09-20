# Echter Shop-Probelauf: Diagnose 6

Stand: 20.09.2026. Auswertung des vom Nutzer übergebenen Berichts. Referenzcode: `ac8bf43`, Dokumentationsstand `c857196` auf `codex/vokabeltrainer-v1`. Die Rohdatei bleibt außerhalb des Arbeitsbaums.

## Eingang und Ergebnis

- `kind:synthetic-shop-probe`, `diagnosticVersion:6`, `etagSource:v2-coherent`.
- Lauf 20.09.2026, 16:22:05–16:22:59 UTC; Edge/Chromium 153 unter Windows, localhost auf Port 4173.
- SHA-256: `4c479e9ede2f3893b00dbf0518e8b3eb137bacc93c70bd1517b9cdb0211eb2da`.
- **6 bestanden, 5 fehlgeschlagen, 0 unsupported. `passed:false`, `productReady:false`.**
- V3 reserviert/erstellt Dateien; v2 liest Metadaten/Inhalte und führt bedingte PUT-Anfragen aus. Der Bericht enthält die fünf zusätzlichen Metadatenfelder.

| Szenario | Ergebnis / genaue Grenze |
| --- | --- |
| Probeordner | Bestanden |
| Versionskennung | Bestanden; starke v2-ETag lesbar |
| Absichtlich falsche Kennung | `assertion`, ohne nähere Fehlerstelle oder Antwortklasse |
| Verbrauchte Kennung | Instabilität während `create-verification` |
| Zwei Initialisierer | Instabilität während `create-verification` einer JSON-Kandidatendatei |
| Zwei Käufe | Instabilität während `create-verification` |
| Antwortverlust | Bestanden; Beleg, idempotente Proberegel, Ablehnung des alten Tokens und Endausgaben geprüft |
| Doppelter Vorgang | Bestanden |
| Reset-Rennen | Instabilität bei `snapshot-read`, `scenarioStage:fixture-read` |
| Erneutes Anlegen | Bestanden |
| Konfliktguthaben | Bestanden; nur lokale Proberegel |

## Vier Leseabbrüche

Alle vier Fälle melden `versionChanged:true`, `jsonEtagChanged:false`, starke ETag und `readKind:metadata-media-metadata`. Inhaltsprüfsumme, Head-Revision, Änderungsdatum und Dateigröße sind jeweils `same`; die letzte Ansichtszeit ist `unavailable`.

Damit blieb der Vergleich der vier verfügbaren Zusatzmerkmale gleich, während sich die umfassendere Dateiversion änderte. `unavailable` bedeutet weder gleich noch unverändert. Dies beweist keine bestimmte interne Google-Ursache und keine gefahrlose oder verzichtbare Versionsprüfung. Die Dokumentation erklärt, dass die File-Version auch für den anfragenden Nutzer unsichtbare serverseitige Änderungen mitzählt. [Google: File v2](https://developers.google.com/workspace/drive/api/reference/rest/v2/files).

Die drei Anlageabbrüche verhindern den jeweiligen eigentlichen Test mit verbrauchter Kennung beziehungsweise konkurrierenden Schreibversuchen. Der Resetfall erreicht eine weitere Nachlese vor dem Schreiben im betroffenen Schleifendurchlauf; welcher der zwei Durchläufe betroffen war, bleibt offen. Keine Zähler akzeptierter paralleler Käufe oder Initialisierungen sind belegt.

## Fehler mit absichtlich falscher Kennung

`invalid-token` ist diesmal bis zu einer fehlgeschlagenen Erwartung gelangt. Der Code verwendet dort weder einen erlaubten `checkpoint` für `rejects` noch eine gekennzeichnete Inhaltsassertion. Der Export unterscheidet deshalb drei Ursachen nicht:

1. Die Schreibanfrage wurde angenommen, obwohl sie abgewiesen werden sollte.
2. Die Anfrage wurde mit einer anderen Fehlerklasse als `stale` abgewiesen, etwa HTTP-, Berechtigungs- oder Netzwerkfehler.
3. Die Anfrage wurde mit `stale` abgewiesen, aber die anschließende Inhaltsgleichheit scheiterte.

Ein bloßes `assertion` beweist daher weder ignoriertes `If-Match` noch einen erfolgreichen geschützten Schreibversuch. Die fehlende Diagnose ist eine bekannte Grenze des Prüfwerkzeugs. Sie darf weder positiv noch negativ durch Vermutungen ersetzt werden.

## Positiver Antwortverlustfall

Der aktuelle Transport erzeugt im Pfad `updateIfUnchanged` die Fehlerklasse `stale` ausschließlich bei HTTP 412. Aus dem bestandenen Szenario folgt deshalb für diesen konkreten alten Snapshot eine 412-Ablehnung. Außerdem wurden die erste Vorgangs-ID gefunden, die zweite Ausgabe ausgeführt, der gleiche Vorgang lokal als unverändert erkannt und abschließend `spent:900` gelesen.

Das erste Schreiben kann vor dem Nachlesen entweder eine Erfolgsantwort oder eine echte Netzwerkexception geliefert haben; der Szenariocode unterscheidet dies nicht. Der Erfolg ist kein Nachweis eines echten Leitungsabbruchs, aller geschützten Schreibfälle oder einer atomaren Konkurrenzgarantie. Er darf ebenso wenig wie die sechs insgesamt bestandenen Fälle ignoriert werden: Der Kandidat ist nicht pauschal als vollständig wirkungslos belegt.

## Konsequenz

Der erforderliche Gesamtnachweis ist nicht erreicht. Keine Produktkäufe aktivieren, keine Stabilitätsprüfung entfernen und keine Warte-/Retry-Lösung als behobene Ursache ausgeben. Der Vergleich von 4/11 in Diagnose 5 mit 6/11 in Diagnose 6 ist keine belegte Funktionsverbesserung: Der Schreibalgorithmus wurde nicht geändert.

Keinen weiteren unveränderten REAL-Lauf anfordern. Vor zusätzlicher Probe oder Produktintegration die Koordinationsarchitektur bewerten. Ein späterer gezielter Direkt-Drive-Versuch bräuchte eine konkrete neue Hypothese, unterscheidbare Negativfall-Ergebnisse und eine belastbare Vertragsgrundlage; reine weitere Diagnoseversionen liefern keine Servergarantie.

Der bestehende Trainer und seine getrennte Ereignissynchronisation wurden durch diesen Bericht nicht getestet und werden daraus weder für fehlerhaft noch für neu abgenommen erklärt. Bilder und Galeriearbeit bleiben unabhängig möglich.

Die [Architekturvorlage A/B/C](../design/2026-09-20-kaufkoordination-nach-diagnose6.md) trennt eine Empfehlung von einer Nutzerentscheidung. Auswertung und Vorlage wurden unabhängig mit GPT-5.6 Sol, Denktiefe hoch, gegen Code und Bericht geprüft; keine wesentlichen Korrekturen oder offenen Reviewbefunde. Keine echte Drive-Anfrage, keine neue Probe und keine Funktionsänderung wurden während dieser Auswertung ausgeführt.
