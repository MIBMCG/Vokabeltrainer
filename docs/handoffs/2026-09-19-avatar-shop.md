# Übergabe: freigegebene Avatarwelt und Punkteshop

Stand 19.09.2026, Umsetzung läuft auf `codex/vokabeltrainer-v1` im vorhandenen isolierten Worktree. Ausgangspunkt und zuletzt exakt auf GitHub bestätigter Planungsstand: `c614fb5f29357929803f6ebd9ea927fb43ef22a7`. Neuere lokale Änderungen sind bis zum jeweils dokumentierten Empfangsbeleg nicht als veröffentlicht anzusehen.

## Auftrag und Freigabe

Der Nutzer hat den [Gesamtentwurf](../superpowers/specs/2026-09-19-avatar-shop-design.md) mit „Ja, starte nun“ ausdrücklich zur Umsetzung freigegeben. [AV01–AV12](../design/2026-09-19-avatar-shop-entscheidungen.md) nicht erneut abfragen. Keine weitere allgemeine Start- oder Methodenfreigabe nötig. Der [Implementierungsplan](../superpowers/plans/2026-09-19-avatar-shop.md) beginnt mit Kaufprobe, Katalog und Rasterbildern; der sichere produktive Kaufvertrag folgt den tatsächlich nachgewiesenen Drive-Garantien.

## Bisherige Arbeit dieses Pakets

- Frischer Ausgangstest: 343/343 Node-Tests bestanden.
- Isolierte technische Shop-Probe und reiner Figuren-/Ausrüstungskatalog implementiert, noch in unabhängiger Prüfung. Keine Kaufaktion im Produkt aktiviert.
- Erste echte Rasterquellen für Entdeckerin und Tiere erzeugt. Noch keine vollständige Bildabdeckung oder Produktintegration; Halskorrektur und passende Ausstattung bleiben in Arbeit.
- Modelle: Kaufkoordination GPT-6 Astra/high; Katalog, Bildpipeline und unabhängige Review GPT-5.6 Sol/high. Rasterkunst durch eingebautes Bildwerkzeug; kein API-Fallback oder zusätzlicher Clouddienst.

## Nächste Schritte und Grenzen

1. Unabhängige Probe-/Katalogprüfung abschließen und Befunde beheben.
2. Reale Probe unter einem bereits zugelassenen Google-Ursprung ausführen. Die neue Route `/shop-probe/` verlangt einen neu gestarteten lokalen Server. Persönlichen Server 4173 und Browserdaten nicht ungefragt für automatisierte Prüfungen ersetzen. Anmeldung bleibt ausdrücklich beim Nutzer.
3. Rasterquellen und deterministische Bildpipeline ausbauen; jede kompatible Ausstattung und Halskonturen tatsächlich ansehen.
4. Erst nach belastbarem Koordinationsnachweis Kaufvertrag/Migration konkretisieren und integrieren; unabhängige Galeriearbeit fortsetzen.
5. Frische Regression, unabhängige Review, Bedienung und GitHub-Abgleich durchführen.

Simulierte HTTP-/Browserprüfungen belegen keine unbekannte Garantie von Google Drive. Fehlende atomare Schreibbedingungen sperren Käufe. Kein ungeschütztes Überschreiben, kein stiller Backendwechsel. Reale iPhone-/iPad- und Zwei-Geräte-Abnahme bleiben getrennt offen. Frühere A1–C2-Prüfungen gehören zur [vorherigen Übergabe](2026-09-19-ueberarbeitung.md) und sind keine Nachweise für dieses Paket. Bestehende Protokolle, persönliche Daten und `main` unverändert lassen.
