# Task 2: Reiner Figuren-/Ausrüstungskatalog

Stand: 19.09.2026

## Ergebnis

- `src/trainer/avatar/catalog.js` enthält den unveränderlichen Katalog mit 13 Figuren, acht Shopfiguren, 30 Shopgegenständen in den zehn bestätigten Sets, sechs alten Levelgegenständen und der Ritterrüstung.
- `src/trainer/avatar/selection.js` normalisiert eine Auswahl ohne DOM-, Drive-, Guthaben- oder Persistenzzugriff. Unbekannte oder nicht besessene Figuren fallen auf `explorer-boy` zurück. Unbekannte, nicht besessene, inkompatible oder im falschen Slot abgelegte Gegenstände werden nur in der normalisierten Ansicht entfernt.
- `levelEntitlements(level)` liefert ausschließlich Start- und erreichte Levelrechte. Shopbesitz oder Guthaben werden nicht daraus abgeleitet.
- Die alten Werte `cap`, `sunhat`, `mountainhat`, `backpack`, `binoculars` und `compass` sind über `LEGACY_ITEM_IDS` eindeutig auf die stabilen Katalog-IDs abgebildet.

## TDD-Nachweis

Erster RED-Lauf: Das Testmodul brach erwartungsgemäß mit `ERR_MODULE_NOT_FOUND` für den noch nicht vorhandenen Katalog ab. Nach der Minimalimplementierung bestanden 11/11 Tests.

Zweiter RED-Lauf: Eine geerbte `figureId` sowie geerbte Haut-/Kleidungswerte wurden zunächst übernommen; der neue Test schlug mit der abweichenden Auswahl fehl. Nach der gezielten Korrektur bestanden 12/12 Tests.

Prüfbefehl:

```sh
node --test --experimental-test-isolation=none tests/trainer/avatar-catalog.test.js
```

## Grenzen

Die neuen Module werden noch von keinem produktiven Laufzeitmodul importiert. Es wurden keine Oberfläche, Kaufkoordination, Datenmigration, Bilder, Serverlisten oder Service-Worker-Dateien geändert. Es wurde in diesem Task nicht committet.
