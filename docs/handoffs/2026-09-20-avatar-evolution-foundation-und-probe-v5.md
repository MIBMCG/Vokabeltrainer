# Übergabe: Avatar-Grundlagen und neuer Drive-Prüfkandidat

Stand: 20.09.2026. Branch: `codex/vokabeltrainer-v1`; Remote: `https://github.com/MIBMCG/Vokabeltrainer.git`.

## Bestätigter Auftrag

EV01–EV05 sind entschieden. Vier vollständige Formen je Figur, zusätzliche Einzelpreise 200 / 400 / 800, vier kostenlose Hauttöne für Mädchen und Jungen, bestehende menschliche Ansicht zusätzlich als „Klassisch“. Die Bereiche „Meine Figur“, „Entwicklung“ und „Shop“ mit Kaufvorschau, Restguthaben und bewusster Auswahl sind bestätigt. Der Drachenbogen v2 bleibt die bestätigte Stilrichtung; keine erneute allgemeine Start- oder Bildfreigabe verlangen.

## Gesicherte Grundlagen

Commit `650cee75d6a652aee5f000df8b7cfdc66752179b` enthält:

- Reinen Katalog mit 52 Formkennungen, 76 Bildkennungen, Preisen und Vorschau der unmittelbar nächsten Stufe. Besitz und Abbuchung sind ausdrücklich nicht Teil dieser Vorschaufunktion.
- Vier vollständige, transparente Drachenquellen; Auswahl steht in [Quellenübersicht](../design/avatar-evolution-sources/README.md). Überholte Versuche bleiben gekennzeichnet erhalten.
- Technische Quellenprüfung und kleine Ansichten auf hellem/dunklem Grund, unabhängige Katalog- und Bildreviews.

[Grundlagenbericht](../reports/2026-09-20-avatar-evolution-foundation.md): 7/7 neue Tests, 12/12 historische Katalogtests, 379/379 vollständige Produkttests bestanden. Beide unabhängigen Reviews ohne blockierende Befunde. Die kompaktere Endform bleibt ein gezielter Prüfpunkt der späteren Kartenansicht.

Dies sind 4 von 76 Motiven. Die übrigen 72, auflösungsabhängige WebP-Ausgaben, Produktoberfläche, Besitz-/Kaufdaten, Migration, Backup und Offline-Integration stehen aus. Keine dieser Funktionen als im Trainer aktiviert darstellen.

## Isolierte Shop-Probe v5

Der echte Diagnose-4-Lauf zeigte beim gemischten v2-Kennungs-/v3-Schreibweg keine exklusive Schreibgrenze. Der neue Kandidat `v2-coherent` ist in [Spezifikation](../superpowers/specs/2026-09-20-shop-probe-v5.md) und [Plan](../superpowers/plans/2026-09-20-shop-probe-v5.md) beschrieben. Nur Anlage/ID-Reservierung bleiben v3; koordinierte Metadaten-, Inhalts- und Bedingungsschreibwege verwenden v2. Die elf Szenarien, strenge Bindung, stabile Kennungen und `productReady:false` bleiben erhalten.

Commit `b70fe37b876c4ecdafba6cfaf70f3e4f9e1340df` enthält den lokal implementierten und unabhängig geprüften Kandidaten. [Lokaler Prüfbericht](../reports/2026-09-20-shop-probe-v5.md): 31/31 gezielte Transportfälle, 56/56 Shop-Node-Tests, 9/9 Browserfälle und erneut 379/379 Produkttests bestanden. Gegenproben für ignorierte Bedingungen, mutierende Fehlerantworten, instabile Snapshots und falsche Bindungen wurden geprüft. Der echte automatisch gesetzte My-Drive-Elternordner ist im Testmodell berücksichtigt; besondere Property-Schlüssel und Steuerzeichen in ETags sind abgesichert.

Der [unabhängige Abschlussreview](../reports/2026-09-20-shop-probe-v5-review.md) ist ohne offene relevante Befunde bestanden. Zusätzliche Gegenprüfungen erkannten einen veränderten Wurzelordner und einen Ordner-PUT, der trotz Fehlerantwort den Zustand ändert. Der bestehende lokale App-Server wurde gezielt neu gestartet; Diagnoseversion 5 und das neue JavaScript-Modul wurden danach über `localhost:4173` mit HTTP 200 geprüft. Dabei wurden weder Google-Anmeldung noch Probenlauf ausgelöst.

Ein echter Google-Lauf wurde in diesem Paket noch nicht ausgeführt. Ein bestandener Fake ist keine Aussage über Googles tatsächliche Behandlung von `If-Match`.

## Weiterarbeit

1. Einen ausdrücklich neuen echten Lauf mit „Drive v2 kohärent (Koordination)“ auswerten. Keine unveränderte Diagnose-4-Wiederholung verlangen.
2. Kauf-/Besitzmigration und Integration erst auf Grundlage eines geeigneten technischen Nachweises planen. Unabhängige Bildproduktion kann weitergehen.
3. Bereits bestätigte Produktentscheidungen nicht wieder als Fragen eröffnen. Ein negativer Drive-Lauf ist technische Evidenz; Anbieter- oder Kostenmodell nicht eigenmächtig ändern.

## Start und Übergabegrenzen

Im aktuellen Checkout `npm start` ausführen und `http://localhost:4173/shop-probe/` öffnen. Wenn der Server bereits läuft, genügt Neuladen. Sichtbarer Prüfstand muss „Diagnoseversion 5“ sein. „Drive v2 kohärent (Koordination)“ ausdrücklich auswählen, Google verbinden, synthetische Testdateien erlauben und die Probe starten. Danach „Bereinigten Bericht herunterladen“ verwenden; erwartet wird `shop-probe-bericht5.json`. Der normale Trainer liegt unter `http://localhost:4173/trainer/`. Die Probe erstellt nach bewusster Zustimmung eigene synthetische Dateien; sie verwendet keine Lernprofile. Anmeldung und Browserdaten reisen nicht mit Git mit.

Reale Zwei-Geräte-, iPhone-/iPad- und HTTPS-Abnahmen bleiben offen. Keine Behauptung einer dokumentierten Google-Servergarantie aus einem einzelnen Lauf ableiten. Vor einer Fortsetzung Branch, Arbeitsbaum und Remote frisch prüfen. Verifizierbare Codepakete sind `650cee7` (Katalog/Bilder) und `b70fe37` (Probe v5). Dieser Übergabecommit folgt beiden; seine vollständige Kennung steht in der Git-Historie. Root sichert das gesamte Paket per normalem Push auf `origin/codex/vokabeltrainer-v1` und vergleicht anschließend HEAD mit dem Remote-Branch; ohne diesen tatsächlichen Vergleich darf die Sicherung nicht als bestätigt gelten.

Letzte vollständige Dokumentprüfung vor dem Übergabecommit: 1091 Dateien, 154 Markdown-Dateien, 777 lokale Links, keine Fehler; `git diff --check` ebenfalls ohne Befund. Die lokale Prüfseite läuft nach gezieltem Serverneustart auf Port 4173. Der Serverzustand ist arbeitsplatzbezogen und wird nicht mit Git übertragen.

## Modelle

- Katalogimplementierung: GPT‑5.6 Luna / medium.
- Katalog- und unabhängige Bildprüfung: GPT‑5.6 Sol / medium.
- Recherche, Plan und Implementierung des neuen Drive-Kandidaten: GPT‑5.6 Sol / high.
- Unabhängige Technik-/Codeprüfung des Drive-Kandidaten: GPT‑6 Astra / high.
- Bilder: eingebautes Imagegen; Backend-Modellkennung nicht offengelegt.
