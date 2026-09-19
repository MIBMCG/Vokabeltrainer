# Unabhängige Gesamtprüfung A1–C2

Reviewer: GPT-5.6 Sol / high, unabhängig von den Implementierern. Gesamtbasis `9f809493e6e082183126654f1b1ab2d7c5945ebd`, geprüfter Stand `4d3df54635e291b41032567c6ba4465a4bb56492`, Produktabschluss `6ffcdfa8d97adcb0ad021b60c2bfce0f0499e59d`.

## Ersturteil

**Spezifikation: PASS. Qualität: CHANGES REQUESTED.** U01–U07 sind fachlich umgesetzt. Es gibt keinen kritischen oder fachlichen Produktbefund. Ein wichtiger Befund betrifft die Prüfwerkzeuge, zwei kleinere die Dokumentation.

| ID | Befund | Korrekturauftrag |
| --- | --- | --- |
| I1 | `tests/browser/overhaul.browser.mjs:13` schreibt die C2-Bilder bei jedem normalen Testlauf direkt in den versionierten Dokumentordner. Ein anderer Browser kann geprüfte Bildbelege überschreiben und den Checkout verändern. | Laufzeitbilder unter ignoriertem `test-results/` erzeugen. Eine Veröffentlichung nach `docs/design/` nur bewusst und getrennt auslösen; unveränderte versionierte Bilder nachweisen. |
| M1 | A1-Bericht Zeile 22 und A4-Bericht Zeilen 109–110 enthalten lokale Arbeitsplatzpfade. | Tatsächliche Testkommandos und Ergebnisse erhalten; Umgebungsbelegung durch Verweis auf die portable Browseranleitung erklären. |
| M2 | `tests/browser/README.md:55` nennt den alten v1-Bericht als aktuellen Ergebnisstand. | Aktuellen Überarbeitungsbericht verlinken und v1 ausdrücklich historisch nennen. |

## Bestätigte Gesamtverträge

- Atomare v1/v2-Migration mit unveränderten Altobjekten/Hashes, mehreren Epochenköpfen und Schutz bei unbekannten Versionen; echter eingefrorener v1-Code dient als unabhängige Fixture.
- Laufende Runden behalten Regeln und Wortgenerationen. Späte alte Antworten zählen einmal für Fakten und Belohnungen, nicht für eine neue Wiederholungsserie.
- Auswahl und Statistik verwenden dieselben effektiven deduplizierten Fakten; historische Supportreferenzen verändern keine aktuellen Gewinner.
- Kleine Rastervarianten im Pflichtcache, große Varianten bedarfsweise, einmaliger Fallback. Fehlgeschlagener neuer Pflichtcache erhält bisherigen Worker und fremde Caches.
- Tatsächliche Bilder zeigen passend zusammengesetzte Avatarteile und lesbare Gesichter auch mit Kopfbedeckung. Der kombinierte 320-Pixel-/200-Prozent-Fall läuft nicht mehr seitlich über; die Hauptaktion bleibt erreichbar.
- Physische Geräte, Safari und echter Google-Abgleich sind korrekt von automatisierten Belegen getrennt.

## Grenzen der Review

Die Review las den kontextreichen Gesamtdiff und die Berichte. Die 15 eingefrorenen v1-Quellkörper wurden nicht erneut gelesen; Manifest, Längen und [unabhängiger Hashbeleg](2026-09-19-v1-fixture-verification.json) stimmen überein. Die frisch belegten 343/343 Node-, 18/18 Trainer- und 15/15 Überarbeitungs-Browserprüfungen wurden nicht redundant wiederholt. [Gesamtbericht](2026-09-19-ueberarbeitung.md).

## Korrektur und Nachprüfung

I1 und M2 sind in `7ef2bb4a6b6bcdaa3acc80edb3cfad9a9883ba8d` korrigiert. Laufzeitbilder entstehen im ignorierten Ergebnisordner; die Browseranleitung trennt bewusste Veröffentlichung und aktuelle/historische Berichte. Der [Fixbericht](2026-09-19-c2-fix1.md) belegt 1/1 gezielte und erneut 15/15 vollständige Überarbeitungsfälle sowie unveränderte Prüfsummen aller 13 versionierten Bilder. M1 ist in den beiden öffentlichen Berichten korrigiert. Die unabhängige Nachprüfung steht noch aus. Produktcode und Produktcache blieben unverändert.
