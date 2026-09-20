# Unabhängige Review: Shop-Probe Diagnose 9

Stand: 20.09.2026. Geprüft wurde der eingefrorene Diagnose-9-Code- und Testdiff auf `codex/vokabeltrainer-v1` gegenüber `85ee32a9edcaa4bdd97653945161fb5556053ff9`. Maßstab waren der [begrenzte Diagnose-9-Plan](../superpowers/plans/2026-09-20-shop-probe-v9-metadata-coordination.md), der [echte Diagnose-8-Befund](2026-09-20-shop-v8-reallauf.md) und die Regeln aus [Qualität und Abnahme](../QUALITAET-UND-ABNAHME.md).

## Urteil

Spezifikations- und Codequalitätsprüfung bestanden. Im neuen Diagnose-9-Paket bestehen keine offenen relevanten Befunde. Die Implementierung untersucht ausschließlich bedingte Änderungen an Metadaten neu angelegter synthetischer Ordner. Sie gibt weder einen Produktshop noch einen verwertbaren Koordinationsstand für die App frei.

Ein Befund aus der Vorabreview wurde vor diesem Freeze korrigiert: Ein syntaktisch gültiger JSON-Body `null` führte nach erfolgreichem POST oder PUT zunächst zu einem nativen `TypeError` ohne den bereits beobachteten HTTP-Status. `boundResponseJson` weist jetzt nicht objektförmige Antworten als bereinigten `invalid`-Fehler mit erhaltenem Status zurück. Die gezielte Regression bestand nach RED **0/2** mit GREEN **2/2**; sowohl POST- als auch PUT-Antwortkörper werden dabei vollständig konsumiert.

## Geprüfter Messvertrag

- `metadata-coordination` ist ausschließlich mit `v2-coherent` zulässig. Eine andere Quelle wird in der Oberfläche vor jedem Drive-Zugriff abgewiesen und nicht automatisch geändert. `full` bleibt die Standardauswahl; die bisherigen drei Umfänge und ihre bisherigen Transportpfade bleiben erhalten.
- Der Umfang liefert genau vier Checks: eine Root-Fixture sowie `metadata-invalid-token`, `metadata-stale-write` und `metadata-concurrent`. Die Root-Fixture wird nach dem v3-POST intern durch einen strikten Snapshot bestätigt. Nur ihr Fehlschlag beendet den Umfang. Jeder Zielcheck legt danach einen eigenen Unterordner an und spätere Zielchecks laufen nach einem einzelnen Fehlschlag unabhängig weiter.
- Ein Metadatensnapshot besteht aus genau zwei gebundenen Drive-v2-Metadatenabrufen mit `cache: no-store`. Beide Antworten müssen zur reservierten ID, zum erwarteten Namen, Ordner-MIME, Elternordner, App, Lauf und nicht gelöschten Zustand passen. Version und starke ETag müssen jeweils als exakt gleiche Strings vorliegen; reine Versions- oder ETag-Abweichungen geben keinen Snapshot frei.
- Die Ordneranlage verwendet nur ID-Reservierung und v3-Metadaten-POST. Die neue Probe enthält keine JSON-Datei, keine Medien- oder Uploadanfrage, keinen Produktbestand, keine Wiederholung, keine Wartezeit und kein DELETE.
- Ein Metadaten-PUT übernimmt alle zuvor gelesenen privaten Properties, erzwingt die App-/Laufbindung und sendet unverändert die ETag des übergebenen Snapshots als `If-Match`. Erfolgsantworten werden vollständig gelesen und an die erwartete ID gebunden. Nicht erfolgreiche Antwortkörper werden vollständig konsumiert und anschließend verworfen.
- Der falsche Token kann nur mit `stale`, HTTP 412 und vollständig gleichem Properties-Readback bestehen. Der verbrauchte Token kann nur nach einem bestätigten ersten 2xx samt vollständigem Gewinner-Readback sowie einer zweiten Ablehnung mit HTTP 412 und erneut vollständig gleichem Gewinner bestehen. Der Parallelfall verlangt genau einen bestätigten 2xx, genau eine `stale`-Ablehnung mit HTTP 412 und einen vollständigen Readback des angenommenen Gewinners einschließlich Sentinel.
- Jede Schreibbeobachtung wird vor der nachfolgenden Nachlese festgehalten. Parse-, Binding-, HTTP- oder Nachlesefehler verdrängen bereits beobachtete Statuswerte nicht. Fehlender Status, unerwartete Ergebnisklasse, veränderte Properties oder unvollständige Nachlese bleiben fehlgeschlagen.
- Berichtsevidenz wird über feste Checkpoints, Phasen, Rollen, Ergebnis- und Vergleichsklassen sowie HTTP-Statuswerte begrenzt. IDs, ETags, Propertywerte, Header, Antwortkörper, Token und rohe Fehler gelangen nicht in den Export. `productReady:false` bleibt unverändert.
- Die Oberfläche zeigt Diagnoseversion 9 und den neuen Umfang **„Ordner-Koordination gezielt prüfen“**. Quelle und Umfang bleiben während des Laufs gesperrt. Downloadname `shop-probe-bericht9.json`, Pfadkatalog, Statusmeldung und Einschränkungen beschreiben die reine Metadatenprobe ohne Kauf- oder Zwei-Geräte-Garantie.

## Prüfbelege und Grenzen

Die bereitgestellten fokussierten Rohprotokolle wurden gelesen; die Suiten wurden in dieser Review nicht erneut ausgeführt:

- Transport und Szenarien zusammen: **17/17 bestanden**, 0 fehlgeschlagen, 0 abgebrochen, 0 übersprungen (`green-node-focused.log`).
- Browserfälle für den neuen Umfang: **4/4 bestanden**, 0 fehlgeschlagen, 0 abgebrochen, 0 übersprungen (`green-browser.log`).
- Gezielte Korrektur für gültige `null`-Antwortkörper: **2/2 bestanden** nach dokumentiertem RED (`red-null-body.log`, `green-null-body.log`).
- Vorabregression der direkt betroffenen Node-Dateien: **112/112 bestanden**, 0 fehlgeschlagen, 0 abgebrochen, 0 übersprungen (`prefinal-focused-node.log`).
- Die statische Whitespaceprüfung des eingefrorenen Diffs blieb ohne Befund.

Die neuen Tests decken unter anderem unabhängige Unterordner, fehlende Root-Fixture, reine Versionsdrift, ignoriertes `If-Match`, falsche oder nicht objektförmige Erfolgsantworten, vollständigen Bodykonsum, 412 mit trotzdem veränderten Properties, fehlenden Erfolgsstatus, einen späteren Nachlesefehler bei erhaltener 412-Evidenz, bereinigte Fehlerdaten und die Abweisung einer falschen Quelle vor Drive-Zugriff ab.

Zum Zeitpunkt dieser Review standen die vollständigen Shop-Node- und Shop-Browsersuiten noch aus. **Abschlussnachtrag durch Root:** Anschließend bestanden auf demselben unveränderten Code 127/127 Shop-Node-Tests und 20/20 Shop-Browserfälle, beide Befehle mit Exit 0. Root hat die finalen Logs gelesen; eine weitere unveränderte Wiederholung ist nicht erforderlich. [Finale Ausführungsbelege](2026-09-20-shop-probe-v9-metadata-coordination.md).

Es erfolgte kein echter Google-Zugriff. Selbst ein später grüner echter Diagnose-9-Lauf belegt nur das beobachtete Verhalten der Ordner-Metadatenkoordination in einem Browser. Unveränderliche Inhaltsverweise, Antwortverlust, verwaiste Inhalte, Epochen, Produktkäufe und zwei physische Geräte bleiben außerhalb dieses Pakets.
