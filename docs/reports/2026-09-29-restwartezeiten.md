# Restwartezeiten bei Kauf und Lernbereichsübernahme

Stand: 29.09.2026, Untersuchung auf `fa078c0` (Produkt `ee7e174`, Cache v39).
Der Nutzer hat nach Abschluss der Importkorrekturen erneut die Weiterarbeit
beauftragt. Dieser Bericht beschreibt eine Diagnose und einen Vorschlag,
keine weitere Produktbeschleunigung oder neue Bereitstellung.

## Aufbau und Grenzen

Die Untersuchung erweitert lokal den bestehenden Helfer
`scripts/measure-purchase-requests.mjs`. Sie verwendet die echten Dienste,
Serveranmeldung, Proxy- und Drive-Module gegen den synthetischen Google-HTTP-
Nachbau. Echte Netzwerkzugriffe sind im Helfer gesperrt. Ausgang ist die
synthetische 1.600-Punkte-Sicherung; nach Aktivierung und einem Kauf übernimmt
ein zweiter, bereits lokal befüllter synthetischer Stand diesen Lernbereich.

Die isolierten Helfer und Rohdaten liegen lokal unter
`.superpowers/diagnostics/2026-09-29-remaining-latency/`. `trace-0.json` enthält
den Lauf ohne künstliche Verzögerung; `trace-100.json` den verzögerten Lauf.
Das sind ignorierte Diagnoseartefakte, keine zusätzlich ausgelieferten Dateien.
Der erste Helferlauf hatte eine falsche Statusfeldabfrage (`state` statt
`phase`); nach Korrektur dieser Diagnosebehauptung liefen beide Messungen mit
Exit 0. Der Produktcode wurde dafür nicht verändert.

Gemessen werden im zweiten Lauf 500 ms zusätzliche Wartezeit je Google-Anfrage
beim Kauf und 100 ms je Anfrage bei Suche/Übernahme. Speicher liegt im RAM;
reales Google, Browser, IndexedDB und D1-Latenzen fehlen. Die zwei künstlichen
Verzögerungen sind unterschiedlich und erlauben keinen direkten Zeitvergleich
zwischen Kauf und Übernahme. Die Ergebnisse ersetzen keine reale Abnahme.

## Messung

| Phase | HTTP-Anfragen | Künstliche Verzögerung je Anfrage | Gemessene Dauer |
| --- | ---: | ---: | ---: |
| Kaufvorschau | 0 | 500 ms | 20 ms |
| Kaufbestätigung | 31 | 500 ms | 10.887 ms |
| Vorhandene Lernbereiche suchen | 5 | 100 ms | 547 ms |
| Übernahmevorschau | 79 | 100 ms | 7.590 ms |
| Übernahme bestätigen | 79 | 100 ms | 7.565 ms |
| Erster anschließender Abgleich | 38 | 100 ms | 3.398 ms |

Die Übernahme ohne Suche zählt damit 196 Anfragen und 18,553 Sekunden;
einschließlich Suche 201 Anfragen und 19,100 Sekunden. Bewusste Lese- und
Klickpausen sind nicht enthalten. Auch ohne künstliche Verzögerung bleibt die
Anzahl unverändert; dann dauern die drei Übernahmeschritte 211, 218 und 253 ms.

Beide abgeschlossenen Läufe bestätigen den Kauf, unverändert 1.600 Lernpunkte,
1.400 verbleibende Punkte sowie denselben aktiven Kaufkopf nach der Übernahme.
Die Vorschau bindet den zweiten Stand noch nicht; nach Bestätigung und Abgleich
ist dessen Status `synced`, die lokale Übertragungswarteschlange leer.
Der synthetische Google-Nachbau meldet keine unerwartete Anfrage.

## Ursachen

Beim Kauf entfallen 20 der 31 Anfragen auf fünf unveränderliche Dateien:
je Upload gefolgt von Metadaten-, Inhalts- und erneutem Metadatenabruf.
`uploadPurchase` in `src/trainer/purchases/service.js` arbeitet sie in Gruppen
von drei und zwei ab. Die zweite Gruppe wartet auf den vollständigen Abschluss
der ersten. Im verzögerten Lauf brauchen beide Gruppen jeweils ungefähr
2,07 Sekunden. Insgesamt entstehen 19 synthetische Abhängigkeitsstufen.
Weitere fünf Anfragen prüfen den Konfigurationsanker; vier lesen den Kaufkopf.

Bei der Lernbereichsübernahme ruft `joinDataset` in
`src/trainer/sync/drive.js` bei einem fremden nichtleeren Lokalbestand sowohl
für die Vorschau als auch für die Bestätigung `inspectJoinedDataset` auf.
Beide Durchgänge laden den Stand vollständig. Die Vorschau hält für die
Freigabe den Hash des gelesenen Bestands fest, aber keinen wiederverwendbaren
geprüften Lesestand. Der anschließende reguläre Abgleich prüft erneut.
Eine unveränderte Übernahme nutzt deshalb denselben vollständigen Lesepfad
zweimal; der dritte Durchgang hat zwar den bestätigten lokalen Kaufcache,
verursacht aber noch 38 Anfragen.

## Vorgeschlagener nächster Schritt

Als begrenzte Kaufkorrektur bis zu sechs statt drei bereits dauerhaft
reservierte Dateien gleichzeitig übertragen und nachlesen. Im gemessenen
Fünf-Dateien-Kauf würde die zweite Uploadrunde entfallen. Die Größenordnung
der möglichen Ersparnis ist aus diesem Lauf ungefähr zwei Sekunden bei
500 ms je Anfrage; dies ist eine Vorhersage, noch kein Vorher-/Nachher-Nachweis.
Gesamtzahl der Anfragen und alle Inhalts-, Bindungs-, Konflikt- und
Wiederaufnahmeprüfungen bleiben erhalten. Ob die reale Kaufzeit unter zehn
Sekunden sinkt, muss anschließend eigenständig gemessen werden.

Der kurze Entwurf ist dem Nutzer zur Bestätigung vorgelegt. Bis zu dessen
Antwort wird keine Produktänderung aus diesem Vorschlag abgeleitet.
Eine Beschleunigung der Lernbereichsübernahme benötigt anschließend einen
eigenen begrenzten Entwurf: unveränderte, bereits geprüfte Daten wiederverwenden,
Änderungen zwischen Vorschau und Bestätigung weiterhin erkennen und die
verifizierte lokale Sicherheitskopie erhalten. Einfach das zweite Nachlesen
zu entfernen wäre durch diese Diagnose nicht begründet.
