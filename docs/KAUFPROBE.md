# Zusammenhängenden Kaufablauf testen

Diese Seite beschreibt die neue technische Probe ab Diagnoseversion 10. Sie arbeitet mit erfundenen Punkten und Artikeln. Der eigentliche Trainer erhält dadurch noch keinen Shop.

**Aktueller Nachweis:** Der am 20.09.2026 übergebene [Bericht10](reports/2026-09-20-shop-v10-reallauf.md) hat alle sechs Checks bestanden. Ein identischer Wiederholungslauf ist derzeit nicht nötig. Die folgende Anleitung bleibt für eine später gezielt begründete Prüfung erhalten.

## Start

1. Im aktuellen Arbeitsordner des Zweigs `codex/vokabeltrainer-v1` bei der Datei `package.json` den Befehl `npm start` ausführen. Bei einem verknüpften Arbeitsbaum ist das dessen Ordner, nicht der übergeordnete Clone. Falls bereits ein älterer lokaler Server läuft, diesen zuerst mit `Strg+C` beenden und neu starten, damit die neuen Module verfügbar sind.
2. Im Browser [Shop-Probe](http://localhost:4173/shop-probe/) öffnen und kontrollieren, dass **Diagnoseversion 10** angezeigt wird.
3. **Mit Google verbinden** wählen.
4. Als Versionskennung **Drive v2 kohärent (Koordination)** und als Prüfumfang **Kaufablauf mit Belegkette prüfen** wählen.
5. Das Anlegen synthetischer Probeobjekte bestätigen und **Probe-Dateien anlegen und prüfen** anklicken.
6. Nach dem Lauf **Bereinigten Bericht herunterladen** wählen. Die Datei heißt `shop-probe-bericht10.json`.

Es ist keine neue Client-ID oder Cloud-Einrichtung nötig, wenn die vorhandene Google-Verbindung an dieser Adresse bereits funktioniert. Für Google muss weiterhin genau der verwendete Browser-Ursprung beim bestehenden Web-Client erlaubt sein.

## Was die sechs Checks untersuchen

| Check | Erwartung |
| --- | --- |
| Gemeinsamer Start | Zwei gleichzeitige Initialisierungen erzeugen genau einen gültigen gemeinsamen Punktestand. |
| Gleichzeitige Käufe | Bei 1000 Punkten und zwei Käufen zu je 800 kann nur einer gültig werden. |
| Wiederholter Auftrag | Derselbe Auftrag wird wiedergefunden und nicht ein zweites Mal berechnet. |
| Verlorene Antwort | Der erste Kauf bleibt auffindbar, auch nachdem ein weiterer Kauf gespeichert wurde. |
| Zurücksetzen zuerst | Ein vorher vorbereiteter alter Kauf darf den neuen Stand nicht mehr ändern. |
| Kauf zuerst | Ein späteres Zurücksetzen erhält den alten Kaufbeleg, aber nicht dessen Besitz im neuen Stand. |

Neue Ordner und Dateien heißen `SHOP-PROBE-…` und bleiben in Google Drive liegen. Die Probe öffnet keine vorhandenen Lernbereiche und löscht keine Dateien. Ein fehlgeschlagener Check wird im Bericht erhalten; nicht durch häufiges Wiederholen einen grünen Lauf suchen.

## Aussagegrenzen

Die zwei Teilnehmer sind logische Clients im selben Browser. Beim Antwortverlust verwirft die Probe gezielt eine erfolgreiche Schreibantwort; sie trennt keine reale Internetleitung. Die Wiederaufnahme verwendet dieselbe Sitzung im Speicher, keinen Browserneustart. Sechs bestandene Checks ersetzen keine Prüfung auf zwei echten Geräten oder auf iPhone/iPad.

Ein alter Diagnose-9-Fehler mit einer künstlich veränderten Schreibkennung bleibt ein eigener Befund. Dieser neue Lauf prüft einen anderen, zusammenhängenden Ablauf und wertet das alte Ergebnis nicht um. Der Trainer-Shop bleibt bis zu den weiteren Integrations- und Realprüfungen deaktiviert.

Technische Grundlage: [Entwurf](superpowers/specs/2026-09-20-immutable-purchase-probe-design.md) und [Umsetzungsplan](superpowers/plans/2026-09-20-immutable-purchase-probe.md).
