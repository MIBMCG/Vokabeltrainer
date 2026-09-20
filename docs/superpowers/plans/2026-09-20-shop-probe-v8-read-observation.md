# Diagnose 8: Kontrollabruf vor Medienabruf

> Ausführung mit Superpowers Subagent-driven development, TDD und unabhängiger Review. Nutzerwahl C bleibt verbindlich; dieses Paket setzt die gezielte Ursachenmessung fort und verändert keine Produktarchitektur.

**Ziel:** Den in [Bericht 7](../../reports/2026-09-20-shop-v7-reallauf.md) belegten frühen Versionsunterschied untersuchen, ohne einen instabilen Stand zum Schreiben freizugeben.

**Architektur:** Ein expliziter, rein beobachtender Prüfumfang ergänzt den isolierten v2-Probe-Transport. Bestehende `create`, `read`, `retryCreate` und `updateIfUnchanged` behalten ihre Prüfungen, Endpunkte und Requestfolge. Keine neuen Module, Abhängigkeiten oder Änderungen am Trainer, Server und Service Worker.

## Messvertrag

- Neuer Umfang `read-stability`, nur mit Quelle `v2-coherent`. Ungültige Kombinationen vor jedem Transportzugriff zurückweisen; andere Quellen und beide alten Umfänge unverändert. `full` bleibt Standard. Zwei Checks: bestehende Ordner-Fixture, danach Leseprüfung der neuen Datei.
- `observeReadStability({parentId,value})` existiert nur am v2-Transport. Es reserviert eine neue ID, erzeugt genau eine eigene synthetische JSON-Datei im gebundenen Probeordner und liest den v3-Erstellungsresponse vollständig. Dessen ID muss intern zur reservierten ID passen. Keine vorhandenen oder fremden Dateien öffnen.
- Danach feste Sequenz: Metadaten M1, Metadaten M2, Medien-GET, Metadaten M3. Alle vier Diagnose-GETs explizit `cache:'no-store'`. Dieselbe bestehende Binding-/Versionformat-/Strong-ETag-Prüfung gilt an jedem Metadatenschritt. Keine zusätzliche Anfrage, Wartezeit, Wiederholung, Aktualisierung oder Löschung. Der Diagnosepfad gibt niemals einen verwendbaren Snapshot oder eine Datei-ID zurück.
- Versionsunterschiede werden in dieser Beobachtung gesammelt, nicht als freigegebener Snapshot behandelt. Die feste Sequenz darf die Beobachtung trotz Versionsunterschied fertig erfassen; bei Auth-, Binding-, HTTP-, Parse- oder Netzwerkfehler sofort stoppen und nur bereits vorhandene bereinigte Beobachtungen erhalten. Der normale Snapshot-Guard bleibt unverändert.
- Zwei Vergleiche: `metadata-control` (M1→M2), `media-window` (M2→M3). Version nur bei exakt gleichen Originalstrings als `same` werten. Bei ungleichen Strings mit `BigInt` die Richtung `increased|decreased` bestimmen; bei numerischer Gleichheit unterschiedlicher Schreibweisen (etwa `01` und `1`) ausschließlich `representation-changed` ausgeben und instabil bleiben. Jeweils ETag, Prüfsumme, Head-Revision, Änderungszeit, letzter Ansichtszeit und Größe als `same|changed|unavailable`; keine Rohwerte. Bekannte starke ETags sind für Gleichheit vorhanden, alle optionalen Felder benutzen die bisherigen Regeln.
- Medienbeobachtung: fester Ergebniswert `success|not-reached|unexpected` oder bekannte Fehlerklasse, optional ganzer HTTP-Status 100–599, optional `redirected` nur als tatsächlich vorhandener Boolean, optional `contentMatchesFixture` Boolean. Keine URLs, Fehlertexte, Header, IDs, Token, Inhaltswerte oder rohe Metadaten exportieren. Alle Transportergebnisse werden am Szenarioeingang erneut nach fester Whitelist bereinigt, einschließlich maximal zwei Vergleichseinträgen.
- Fehlerphase als festes Enum: `creation-response`, `metadata-1`, `metadata-2`, `media`, `metadata-3`. Bereits gemessene Vergleiche und Medienantwort dürfen beim späteren Fehler nicht verloren gehen. Incomplete-Messung nie als stabil bewerten.
- Evidence-Checkpoint `read-stability-observation`, `cacheMode:no-store`, Vergleiche und Medienbeobachtung; Erfolg nur, wenn die Messung vollständig ist, beide Versionsvergleiche und beide ETag-Vergleiche `same` sind sowie Inhalt exakt zum synthetischen Startwert passt. Unverfügbare Zusatzfelder machen keine Gleichheitsaussage. Bei jeder Versionsabweichung bleibt der Check fehlgeschlagen und liefert die Diagnose.
- Kein bedingter PUT in diesem Umfang, `productReady:false` immer. Selbst eine vollständig stabile Messung beweist keine Schreibbedingung oder sichere Parallelkoordination. `passed` bewertet ausschließlich den beschriebenen Lesefall.

## Oberfläche und Export

Option **Dateilesen gezielt untersuchen** unter Prüfumfang; Hinweis auf benötigte Quelle und den reinen Leseumfang nach Anlage synthetischer Dateien. Bei falscher Quelle verständlicher Hinweis vor Dateianlage; keine automatische Quellenumschaltung. Quellen- und Umfangsauswahl bleiben während des Laufs gesperrt.

Sichtbar **Diagnoseversion 8**, Download `shop-probe-bericht8.json`, `diagnosticVersion:8`, `probeScope`. Leseergebnistext benennt ausdrücklich, dass keine Schreibbedingung geprüft wurde. Vorherige 11er- und 2er-Umfänge behalten ihre Erfolgsgrenzen. Berichtspfad beschreibt die zusätzliche Kontrolllesung und `no-store` nur für den neuen Umfang.

## Eine begrenzte Implementierungsaufgabe

Dateien: `src/shop-probe/v2-coherent-transport.js`, `src/shop-probe/scenarios.js`, gegebenenfalls minimale Weitergabe in `transport.js`, `src/shop-probe/main.js`, `shop-probe/index.html`, vorhandene Tests unter `tests/shop-probe/`. Umsetzungsbericht `docs/reports/2026-09-20-shop-probe-v8-read-observation.md`; Root besitzt Einstieg/Übergabe/Realbericht/Plan.

- [x] **RED:** Tests für exakt M1/M2/Media/M3, `no-store`, keinen PUT, unveränderten Normalpfad; reine Versionsänderung im Kontrollfenster und Medienfenster getrennt; Richtung mit großen Zahlen und numerisch gleichen unterschiedlichen Schreibweisen; gefälschte Create-ID; Binding-/Parse-/HTTP-/Netzwerkfehler je früher/später Phase und Erhalt der partiellen Beobachtungen.
- [x] **RED:** Szenarien zu Erfolg/Instabilität/Inhaltabweichung/Abbruch, unbekanntem Umfang und nicht unterstütztem Transport vor HTTP; Whitelist unterdrückt private Marker, fremde Enums, doppelte/unbekannte Kontrollfenster, unzulässige HTTP-Statuswerte und zu lange Arrays.
- [x] **GREEN:** Kleinste Implementierung des obigen Vertrags. Bestehende `same`- und Snapshot-Guards nicht lockern; keine stillen Retry-Schleifen oder neue Produktkaufpfade.
- [x] **Browser:** neue Auswahl und Quellenhinweis, kein Request bei falscher Kombination, korrekter 8er-Download, vollständige und instabile Beobachtung mit ehrlichem Text; alte Umfänge bleiben 11 bzw. 2 Checks. Google synthetisch, keine persönlichen Browserprofile.
- [x] **Abschluss:** `npm run test:shop-probe` und `npm run test:shop-probe:browser` je einmal auf finalem Code; Rohlogs ignoriert. Dokumentprüfung und Diffprüfung. Keine unveränderte Trainer-Gesamtregression.
- [x] **Review:** unabhängige Spezifikations-/Codeprüfung; ein enger Erfolgs-Guard-Befund ist mit RED 0/4 → GREEN 4/4 korrigiert. Abschlussreview ohne offene relevante Befunde.
- [ ] **Git:** Root-Commit/Push mit Remotevergleich.

## Interpretation des nächsten echten Laufs

Ein Unterschied bereits M1→M2 zeigt: Ein Medienabruf ist für diese beobachtete Instabilität nicht nötig. Unterschied nur M2→M3 ist eine Zuordnung zum Medienfenster; das längere Zeitfenster kann ebenso eine unabhängige Hintergrundänderung enthalten und belegt keine Kausalität. Eine fallende Version legt veraltete/uneinheitliche Antworten nahe, beweist deren Ursprung aber nicht. Auch `no-store` ist keine Zusage linearer Serverlesungen. Ein später stabiler Lauf kann kein rückwirkender Ursachenbeweis für Bericht 7 sein.
