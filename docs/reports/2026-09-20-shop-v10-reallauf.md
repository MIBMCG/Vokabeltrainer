# Echter Shop-Probelauf 10: sechs Kaufabläufe bestanden

Stand: 20.09.2026. Auswertung auf `639556c99cdcb9aef9370b812f7822dbb0e8fbfa`. Quelle ist der vom Nutzer übergebene Bericht `shop-probe-bericht10.json`; der Assistent hat keinen weiteren Google-Lauf ausgeführt. Die Rohdatei bleibt außerhalb des Entwicklungsarbeitsbaums und wird nicht veröffentlicht.

- SHA-256: `6893985bb2479c3ab5e9b8e0cf6809af8e5c7cc19d418003cde41762c8564d3b`.
- Diagnoseversion 10, Quelle `v2-coherent`, Umfang `immutable-purchases`.
- Lauf: 20.09.2026, 19:30:11.205–19:33:10.981 UTC; Dauer 179,776 Sekunden; Windows/Edge 153, localhost:4173.
- Ergebnis: **6 bestanden, 0 fehlgeschlagen, 0 unsupported**; `passed:true`, weiterhin `productReady:false`.

## Beobachtete Ergebnisse

| Check | Schreibbefund und Nachlese laut Bericht | Ergebnis |
| --- | --- | --- |
| Gemeinsame Initialisierung | Client A 200, Client B 412; exakt die Gewinneroperation und Epoche bestätigt, Verlierer fehlt; ein Beleg und 1000 Punkte | Bestanden |
| Zwei Käufe zu je 800 | Client A 412, Client B 200; ursprüngliche Initialisierung, vollständiger Gewinnerbeleg und genau dessen Artikel bestätigt; zwei Belege, ein Besitz, 200 Restpunkte | Bestanden |
| Wiederholter Auftrag | Identischer Auftrag wiedergefunden, kein zusätzlicher Upload oder Pointer-PUT; geänderte Parameter zurückgewiesen; ein Besitz, 200 ausgegebene Punkte | Bestanden |
| Verlorene Antwort | Erste erfolgreiche Schreibantwort lokal verworfen, dadurch `uncertain/network` in der Pointerphase; zweiter Kauf 200; erster Kauf als Vorfahr wiedergefunden; drei Belege, zwei Artikel, 600 ausgegebene Punkte | Bestanden |
| Reset vor Kauf | Reset 200, zuvor vorbereiteter alter Kauf 412; auch neue Vorbereitung in alter Epoche zurückgewiesen; kein Besitz, 1000 Punkte | Bestanden |
| Kauf vor Reset | Kauf 200, alter Reset 412, ausdrücklich frisch vorbereiteter Reset 200; Kauf historisch auffindbar und inaktiv; drei Belege, kein Besitz, 1000 Punkte | Bestanden |

Alle sechs Checks erreichen `phase:complete`; der Erhaltungsmarker bleibt jeweils bestätigt. Die beiden Konkurrenzfälle haben unterschiedliche Gewinner. Damit enthält der Lauf sowohl Client A als auch Client B als korrekt zugeordneten Gewinner, einschließlich vollständiger Operationsprüfung und ausgeschlossenem Verlierer. Es werden nicht nur passende Punktesummen verglichen.

Die Klasse `network` im Antwortverlustfall ist hier die vorgesehene lokale Simulation nach beobachtetem erfolgreichem Schreiben. Sie ist kein gemeldeter echter Google-Netzausfall und kein fehlgeschlagener Check.

## Bedeutung und Grenzen

Dieser echte Google-Lauf stützt erstmals den gesamten **hier untersuchten synthetischen Kaufablauf** mit Ordnerverweis und unveränderlicher Belegkette. Der schmale technische Versuch aus dem [Entwurf](../superpowers/specs/2026-09-20-immutable-purchase-probe-design.md) ist damit in diesem Lauf bestanden. Es ist kein weiterer identischer Diagnose-10-Lauf nötig, um dasselbe Ergebnis erneut zu bestätigen.

Der Lauf verwendet zwei logische Clients innerhalb derselben Browsersitzung und deren gemeinsame Transportregistrierung. Nicht geprüft sind Browserneustart, eine neue Transportinstanz, zwei physische Geräte, echte Profil-/Lernpunkte, Altclients, Backups und Produktmigration. Die 64-Beleg-Grenze ist weiterhin eine Schutzgrenze der Probe. Ein einzelner erfolgreicher Versuch ist keine allgemeine Servergarantie. Die Laufzeit von knapp drei Minuten betrifft sechs Testabläufe mit vielen Kontrollabrufen und ist keine gemessene Kaufdauer in der fertigen App.

[Bericht 9](2026-09-20-shop-v9-reallauf.md) bleibt separat gültig: Sein künstlicher ETag-/HTTP500-Fall wird durch diesen anderen Umfang nicht nachträglich grün. Die bestätigte Richtung C sowie EV01–EV05, Preise, Google-Zugang und Bildstil bleiben unverändert.

## Nächster Arbeitsschritt

Die technische Machbarkeitsprobe ist abgeschlossen. Als nächstes den konkreten Integrationsentwurf für dauerhafte Kaufaufträge und Wiederaufnahme nach Neustart ausarbeiten: gemeinsamer Anker je Bestand/Profil, Bindung an echte Punkte und Katalog, gemeinsame Kauf-/Reset-/Wiederherstellungsgrenze, Umgang mit Altclients und dauerhaft aufbewahrte Belege. Dafür die bestehenden Produktverträge prüfen; das Testmodul nicht unverändert in die App importieren oder dessen Speicherregistrierung als dauerhafte Lösung ausgeben.

Anschließend folgen Umsetzung und Prüfung der Integration sowie die bestätigten Bereiche „Meine Figur“, „Entwicklung“ und „Shop“. Weitere Avatarbilder können unabhängig vorbereitet werden. Die allgemeine Entwicklungsfreigabe besteht; weder neue A/B/C-Grundsatzfrage noch pauschale Startfreigabe einholen. Ein konkreter neuer Integrationsentwurf und seine Grenzen sind vor dem größeren Paket gemäß AGENTS.md abzustimmen. Die heutige Berichtsauswertung aktiviert keine Produktkäufe.

## Prüfung dieser Auswertung

Rohdatei gehasht und als JSON gelesen. Version, Quelle, Umfang, sechs eindeutige Check-IDs, Statussummen, einzelne Schreibstatus, Gewinner-/Verliererprüfungen, Punkte, Besitz, Wiederholung, simulierter Antwortverlust und Resetbefunde wurden mit einer einmaligen Assertion-Prüfung kontrolliert: Exit0, konsistent. Die Bedeutung der Felder wurde mit dem aktuellen Szenariocode abgeglichen. `npm run check:docs` prüfte 185 Markdown-Dateien und 874 lokale Verweise ohne Fehler; `git diff --check` blieb ohne Befund. Keine Runtimeänderung, keine Wiederholung unveränderter Node-/Browsersuiten und keine eigenen Google-Aufrufe.
