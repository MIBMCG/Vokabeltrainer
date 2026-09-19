# Übergabe: freigegebene Avatarwelt und Punkteshop

Stand 19.09.2026, Umsetzung läuft auf `codex/vokabeltrainer-v1` im vorhandenen isolierten Worktree. Ausgangspunkt: `c614fb5f29357929803f6ebd9ea927fb43ef22a7`. Kaufprobe und Katalog sind mit `f61c6ef9ad550fe3b157466e4bc9d39c7338e1f7` exakt auf GitHub bestätigt. Neuere lokale Änderungen sind bis zum jeweils dokumentierten Empfangsbeleg nicht als veröffentlicht anzusehen.

## Auftrag und Freigabe

Der Nutzer hat den [Gesamtentwurf](../superpowers/specs/2026-09-19-avatar-shop-design.md) mit „Ja, starte nun“ ausdrücklich zur Umsetzung freigegeben. [AV01–AV12](../design/2026-09-19-avatar-shop-entscheidungen.md) nicht erneut abfragen. Keine weitere allgemeine Start- oder Methodenfreigabe nötig. Der [Implementierungsplan](../superpowers/plans/2026-09-19-avatar-shop.md) beginnt mit Kaufprobe, Katalog und Rasterbildern; der sichere produktive Kaufvertrag folgt den tatsächlich nachgewiesenen Drive-Garantien.

## Bisherige Arbeit dieses Pakets

- Frischer Ausgangstest: 343/343 Node-Tests bestanden.
- Isolierte technische Shop-Probe und reiner Figuren-/Ausrüstungskatalog implementiert und unabhängig ohne offene Befunde geprüft. 29/29 gezielte und 355/355 damalige vollständige Node-Tests bestanden; zwei isolierte synthetische Browserfälle. Keine Kaufaktion im Produkt aktiviert. [Review](../reports/2026-09-19-avatar-shop-review-1.md).
- Alle 13 Grundfiguren und die Ausrüstungsquellen sind erzeugt. 93 registrierte Bildlagen ergeben 279 WebP-Dateien; der kleine Bildsatz umfasst 960.222 Byte, alle Größen zusammen 8.786.364 Byte. Fehlende, ungültige oder falsch zugeordnete Bildlagen: jeweils null. [Gesamtvorschau](../design/avatar-shop-preview.png), [Bildquellen und Ableitungsregeln](../design/avatar-shop-sources/README.md).
- Die Halskorrektur ist bereits in der bisherigen Produktoberfläche umgesetzt. Alle sechs Kleidungsfarben wurden mit echten Produktbildern geprüft; alte Bildschlüssel und Landschaftsbilder bleiben erhalten. Produktcache v20. Neue Figurenwahl, Guthaben und Käufe sind noch nicht in die Produktoberfläche integriert. [Umsetzungs- und Prüfbericht](../reports/2026-09-19-avatar-shop-task3.md).
- Abschließend nach den Pipelinekorrekturen: 372/372 Node-Tests und 4/4 gezielte Avatar-Browserfälle bestanden. Die [unabhängige Nachprüfung](../reports/2026-09-19-avatar-shop-task3-review.md) hat keine offenen Befunde im geprüften Umfang. Vorher-/Nachherbilder und Gesamtvorschau sind in der Dokumentation gesichert.
- Ein [bedingter Integrationskandidat](../design/2026-09-19-avatar-shop-integration-kandidat.md) hält Datenmigration, Auswahl je Figur und Kauf-/Wiederherstellungskoordination für die Fortsetzung fest. Er ist noch kein ausführbarer Plan und setzt die reale technische Probe voraus.
- Modelle: Kaufkoordination GPT-6 Astra/high; Katalog, Bildpipeline und unabhängige Review GPT-5.6 Sol/high. Rasterkunst durch eingebautes Bildwerkzeug; kein API-Fallback oder zusätzlicher Clouddienst.

## Nächste Schritte und Grenzen

1. Probe und Katalog nicht erneut implementieren; ihre unabhängige Prüfung ist abgeschlossen.
2. Reale Probe unter einem bereits zugelassenen Google-Ursprung ausführen. Die neue Route `/shop-probe/` verlangt einen neu gestarteten lokalen Server. Der Nutzer wurde um Neustart und Anmeldung gebeten; eine Bestätigung steht noch aus. Persönlichen Server 4173 und Browserdaten nicht ungefragt für automatisierte Prüfungen ersetzen. Anmeldung bleibt ausdrücklich beim Nutzer.
3. Die Bildvorbereitung nicht neu beginnen: 62 kompatible Figur-/Ausrüstungspaare, vollständige Sets und 48 menschliche Haut-/Farbkombinationen sind geprüft. Die Gesamtvorschau zeigt tatsächlich gerenderte Bilder, noch keine integrierte Shopoberfläche.
4. Erst nach belastbarem Koordinationsnachweis Kaufvertrag/Migration konkretisieren und integrieren; unabhängige Galeriearbeit fortsetzen.
5. Frische Regression, unabhängige Review, Bedienung und GitHub-Abgleich durchführen.

Simulierte HTTP-/Browserprüfungen belegen keine unbekannte Garantie von Google Drive. Fehlende atomare Schreibbedingungen sperren Käufe. Kein ungeschütztes Überschreiben, kein stiller Backendwechsel. Reale iPhone-/iPad- und Zwei-Geräte-Abnahme bleiben getrennt offen. Frühere A1–C2-Prüfungen gehören zur [vorherigen Übergabe](2026-09-19-ueberarbeitung.md) und sind keine Nachweise für dieses Paket. Bestehende Protokolle, persönliche Daten und `main` unverändert lassen.

## Start auf einem anderen Rechner

Den Branch `codex/vokabeltrainer-v1` in einem sauberen Checkout verwenden, Node.js ab 22.8 bereitstellen und im Repository `npm start` ausführen. Die App liegt unter `http://localhost:4173/trainer/`, die neue technische Kaufprobe unter `http://localhost:4173/shop-probe/`. Nach einem Programmupdate einen alten laufenden Server beenden und neu starten. Die Produktseite gegebenenfalls aktualisieren, damit der neue App-Cache übernommen wird.

Für die echte Kaufprobe muss sich der Nutzer mit dem bereits eingerichteten Google-Zugang anmelden und die synthetischen Prüfungen bewusst starten. Browserdaten und Anmeldesitzungen werden durch Git nicht übertragen. Keine neue OAuth-ID und kein zusätzlicher Clouddienst sind für diesen Arbeitsschritt vorgesehen.
