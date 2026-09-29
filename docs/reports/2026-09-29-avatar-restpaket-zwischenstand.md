# Zwischenstand: vollständige Avatarquellen und vorbereiteter Einbau

Stand: 29.09.2026. **Unfertiger Sicherungsstand, keine Produktfreigabe.**

## Pausenauftrag und Zweige

Der Nutzer wählt ausdrücklich eine Pause nach Sicherung des Zwischenstands.
Nach GitHub-Sicherung und Dokumentationsabschluss keine weiteren Tests,
Produktänderungen, Bildgenerierungen oder Bereitstellungen bis zur Fortsetzung.

- Hauptentwicklungszweig: `codex/vokabeltrainer-v1`.
- Arbeitszweig für den noch nicht abgenommenen Einbau: `codex/purchase-batch-checks`.
- Gemeinsame Basis vor dem Einbau: `42d693226f5edd933be17604d7725ae0e4992294`.
- Laufendes Produkt: `31fcf02229eee8e866d607b9d23cdaa601677680`, Cache v40.
- Lokaler Sicherungscommit: `3036ec9e5bf29f183ddb246f54a78ef428aac503`
  (`WIP: sichere restliche Avatar-Entwicklungsbilder und Galerieeinbindung`).
- Arbeitsverzeichnis danach sauber. Noch **nicht auf GitHub bestätigt**:
  Die automatische Freigabe blockiert den Upload und verlangt eine konkrete
  Nutzerbestätigung des Ziels `https://github.com/MIBMCG/Vokabeltrainer.git`
  für den unfertigen Arbeitsstand. Keine Umgehung oder Bereitstellung.

## Fertige Bildquellen

Alle zehn bestätigten Reihen liegen als 64 neue Produktionsquellen vor:
acht Tierfamilien mit je vier Stufen und zwei Menschenfamilien mit je vier
Stufen in vier Hauttönen. Zusammen mit Drache, Nebelhirsch und Tiger sind
damit alle 52 Formen beziehungsweise 76 Motive vorbereitet.

16 vorhandene Grundformquellen sind unverändert übernommen. Die persönlich
bestätigten v3-Endformen von Sturmgreif und Phönix sind ebenfalls unverändert
übernommen. Für die übrigen 46 Motive wurde die eingebaute Bildgenerierung
verwendet. JSON-Begleitdateien halten Prompts, Referenzen, Prüfsummen,
Entwurfsbestätigung und tatsächliche Sichtprüfung getrennt fest.

Die Sichtprüfung umfasst alle zehn Reihen auf hellem und dunklem Hintergrund.
Einhorn und Pegasus erhielten in Stufe 2 weniger Ausrüstung, um die Steigerung
zu Stufe 3 zu erhalten. Bei sechs höheren Menschenformen wurde Hautton 3
an die vorhandene Grundform angeglichen; diese Bilder wurden erneut einzeln
gesichtet. Acht verworfene Bearbeitungseingaben sind mit Herkunftsnachweis
erhalten. Quellhashes, echte Transparenz und 124 portable Referenzhashes sind
am 29.09.2026 um 20:51:05 UTC geprüft.

Quellen und Begleitdateien liegen auf dem Arbeitszweig unter
`docs/design/avatar-evolution-sources/`; Bearbeitungseingaben unter
`docs/design/avatar-evolution/production-inputs/`. Die Originaldateien bleiben
unverändert. Neue Ableitungen erhalten auf jeder Seite vier Prozent
transparenten Innenabstand. Die 36 bereits ausgelieferten WebPs werden erhalten.

## Vorbereiteter Einbau

- Bildpipeline und Manifest berücksichtigen alle Familien, Stufen und Hauttöne.
- Drei Größen 256/512/768; alle 76 kleinen Varianten für Offlineansicht vorgesehen.
- Hauttonabhängige Bilder in Galerie, Kaufvorschau und ausgewählter Figur.
- Hauttonwahl auch für höhere Menschenformen; freie Kleidungsfarben der Grundform erhalten.
- Explizite Dateiauslieferung, vorbereiteter Cache v41 und Updatefixture v41 nach v42.
- Große ursprüngliche Drachen-PNGs aus der öffentlichen Dateiliste entfernt;
  sie bleiben als Quellen im Repository.

Diese Liste beschreibt den gespeicherten Einbau, keine abgeschlossene Abnahme.
Kaufkern, Preise, Guthaben, Lernpunkte, Level, Anmeldung und Abgleich werden
durch dieses Paket nicht geändert.

## Tatsächlich abgeschlossene Prüfungen vor der Pause

Der Bildbau ist vollständig: 76 ausgewählte Quellen, 228 WebPs, davon 192 neue.
Die 76 kleinen Varianten benötigen zusammen 2.016.122 Byte; alle Größen zusammen
18.767.420 Byte. Alle 36 bisherigen WebPs sind anhand ihrer Git-Blob-Hashes
bytegleich bestätigt. `git diff --check` besteht.

Gezielte Node-Prüfung nach Bildbau und letzter Korrektur: **42/42 PASS**.
Zunächst war eine veraltete Erwartung „Menschenbild nicht verfügbar“ fehlgeschlagen;
nach Anpassung an den vollständigen Bildsatz bestanden sämtliche gezielten Fälle.

```text
node --test --experimental-test-isolation=none tests/trainer/evolution-art.test.js tests/trainer/purchases-view.test.js tests/trainer/sw.test.js tests/trainer/avatar-display.test.js tests/trainer/avatar-evolution.test.js tests/trainer/rewards.test.js tests/serve.test.js
```

Die vollständige Node-Suite und Produkt-Browserfälle sind wegen der gewünschten
Pause bewusst nicht gestartet. Die Sichtprüfung der Quellen im getrennten
lokalen Browser ist keine Prüfung der eingebauten Galerie oder des Updatepfads.

## Bei Fortsetzung noch erforderlich

1. Gesicherten Arbeitszweig verwenden; Quellen und Bilder nicht neu erzeugen.
2. Aktuellen Dokumentationsstand vom Hauptentwicklungszweig berücksichtigen.
3. Vollständige Node-Suite und passende Browserfälle einschließlich vollständiger
   Galerie, Hauttöne, Grundform-Kleidungsfarben, Offlinebilder und kontrolliertem Update.
4. Unabhängige Taskprüfung und Abschlussreview; aktuelle Implementierung bisher
   ohne solche Reviews. Die bereits beendeten Kaufreviews gelten nicht für dieses Paket.
5. Erst nach erfolgreichen Prüfungen Produktintegration, private Bereitstellung,
   Vergleich der ausgelieferten Dateien und kontrollierte Prüfung im vorhandenen Testbrowser.
6. Übergabe und GitHub-Stand aktualisieren.

Keine neue Google-Anmeldung oder Neueinrichtung voraussetzen, keine Käufe
auslösen und bestehende Familien- und Testdaten erhalten. Natürliche
Token-Erneuerung, reale Kaufzeit unter zehn Sekunden und physische
iPhone-/iPad-/Zweitgeräteabnahme bleiben eigenständige offene Nachweise.

Die fünf bestätigten Belohnungserweiterungen folgen erst nach Abschluss der
Galerie und der übrigen Optimierungen. Ihre Reihenfolge und genaue Liste stehen
in der [Pausenübergabe](../handoffs/2026-09-29-avatar-restpaket.md).
