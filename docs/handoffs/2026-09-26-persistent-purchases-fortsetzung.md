# Fortsetzung der dauerhaften Käufe – 26.09.2026

Der Nutzer hat die Pause ausdrücklich beendet und die Fortsetzung mit `using-superpowers` und `subagent-driven-development` beauftragt. Maßgeblich sind der [bestätigte Plan](../superpowers/plans/2026-09-20-persistent-purchases.md), der [Entwurf](../superpowers/specs/2026-09-20-persistent-purchases-design.md) und die technischen Grenzen der [Desktop-Übergabe vom 21.09.](2026-09-21-desktop-pause.md). Keine erneute Anforderungsklärung.

## Einstieg und Stand

- Entwicklungszweig `codex/vokabeltrainer-v1`, Ausgangspunkt `5a434bf4e24826be8f101d285fa7306e6d1a0e7d`; direkt von GitHub gelesen und sauber per Fast-Forward übernommen.
- `main` ist älter und kein Entwicklungsstartpunkt. Bestehender isolierter Arbeitsbaum wird wiederverwendet; persönliche Berichte und Browserdaten bleiben erhalten.
- Tasks 1 und 2 sind implementiert und unabhängig geprüft. Nicht erneut implementieren.
- Task 3 liegt mit Korrekturen in `1ecddd6` vor. Der erste Schritt ist die unabhängige Nachprüfung von R3-1 bis R3-4 im Bereich `5f73008..1ecddd6`. Dokumentierte 471/471 Tests wurden am Laptop ausgeführt; am Desktop nicht bloß wegen des Rechnerwechsels wiederholt.
- Tasks 4–6 bleiben offen. Erst nach Task-3-Freigabe den gemeinsamen Produktvertrag umsetzen, dann Oberfläche und Gesamtprüfung.

## Ablauf und Grenzen

Implementierung: GPT-5.6 Sol/hoch; unabhängige Prüfung der Datenverträge: GPT-6 Astra/hoch. Ein Produktimplementierer gleichzeitig. Die Aufgaben erhalten isolierte Anforderungen und gezielte Reviews; Korrekturen werden am selben Aufgabenagenten weitergeführt, solange verfügbar.

Der technische Kaufservice ist noch nicht aus der Produktoberfläche erreichbar. Keine echten Produktkäufe, keine Cloudmigration, keine neue Bildproduktion und keine Veröffentlichung wurden durch diesen Wiedereinstieg ausgeführt. 4 von 76 Avatarbildern sind vorbereitet. Reale Google-/Zwei-Geräte-/iPhone-/iPad-Prüfungen bleiben gesondert offen.

## Nächster Schritt

Ergebnis der Task-3-Nachprüfung lesen und notwendige Korrekturen gezielt umsetzen. Danach Tasks 4–6 gemäß Plan und Desktop-Übergabe. Der aktuelle Auftrag erlaubt Fortsetzung und Sicherung auf dem vorhandenen Entwicklungszweig; kein Merge nach `main`, kein Anbieterwechsel und keine Veröffentlichung.

## Abgeschlossener Task-3-Schritt

Die unabhängige erste Nachprüfung bestätigte R3-1 bis R3-3 und fand konkrete Lücken im Testnachweis R3-4. Commit `b6abb4e` ergänzt ausschließlich Recoverytests: Teiluploads, verlorene Einzeluploadantwort, echte Snapshot-ETag-Bindung und fehlende Netzmutation nach Speicherfehler. Mutation RED 0/1, GREEN 1/1; final 57/57 Recoverytests bestanden. Der vollständige Bonus-/Zweitkauf-Neustart bestätigt 420 verdient, 400 ausgegeben, 20 verfügbar.

[Fixbericht](../reports/2026-09-26-persistent-purchases-task3-fix2.md) und [unabhängige Nachprüfung](../reports/2026-09-26-persistent-purchases-task3-fix2-review.md) schließen den Befund. Keine offene relevante Task-3-Beanstandung; Gesamtpaket- und reale Geräteprüfung bleiben offen. Freigabecheckpoint `8b0a6d0` ist die Basis für Task 4.

Task 4 läuft mit GPT-5.6 Sol/hoch. Task 5 wird ausschließlich lesend vorbereitet, bis Task 4 unabhängig geprüft ist. Lokale Koordinationsdateien sind weiterhin nur Hilfsmittel; die versionierten Berichte sind der portable Nachweis.
