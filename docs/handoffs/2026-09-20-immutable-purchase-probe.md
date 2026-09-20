# Übergabe: zusammenhängende Kaufprobe

Branch `codex/vokabeltrainer-v1`, bestehender isolierter Arbeitsbaum `drive-probe`. Ausgangspunkt `a0043444ac5d4598e1673274e130c8b3817267af`; Entwurf und Plan wurden in `e2f4d46` gesichert. C bleibt entschieden: Google Drive direkt, keine zusätzlichen Dienste und keine Änderung des Punktesystems.

## Auftragsumfang

Der Nutzer setzte nach der Auswertung von Bericht 9 fort. Daraus entsteht die [neue getrennte Kaufprobe](../superpowers/specs/2026-09-20-immutable-purchase-probe-design.md), ausgeführt nach dem [Plan](../superpowers/plans/2026-09-20-immutable-purchase-probe.md). Alle Daten sind synthetisch. Produktcode, echte Lernstände, neue Avatar-Auswahl und Punkteshop werden nicht umgestellt.

Ein gemeinsamer Ordner verweist auf eine unveränderliche Belegkette. Eine SHA-256-Prüfung schützt die Bindung an den vorgesehenen Inhalt. Der alte veränderliche Lesepfad bleibt streng. Erst die vollständig geprüfte Kette belegt einen Kauf; ein Upload oder eine einzelne Erfolgsantwort reicht nicht. Beide Reihenfolgen von Kauf und Reset werden getrennt untersucht.

## Weiterarbeit und Grenzen

Der neue Umfang **„Kaufablauf mit Belegkette prüfen“** ist lokal vollständig geprüft und kann über `/shop-probe/` ausgeführt werden. [Kurzanleitung](../KAUFPROBE.md). Quelle `v2-coherent`, Diagnoseversion10 und Download `shop-probe-bericht10.json`. Nächster abhängiger Schritt ist die Auswertung dieses neuen echten Google-Laufs. Den unveränderten 9er-Lauf nicht erneut anfordern und dessen künstlichen ETag-Fall mit HTTP500 nicht umwerten.

Die neue Probe umfasst zwei logische Clients in einer Browsersitzung. Sie prüft weder Browserneustart noch echte getrennte Geräte. Vor Produktintegration fehlen dauerhaft gespeicherte Aufträge, Wiederanbindung mit neuer Sitzung, echte Punkte-/Profil-/Katalogbindung und eine gemeinsame Migration von Kaufkoordination, Backups, Produkt-Epochen und alten Clients. Ein grüner Probelauf ist keine allgemeine Servergarantie.

Auch die dauerhafte Belegaufbewahrung muss vor Produktintegration geklärt werden: 64 Belege sind hier nur die feste Schutzgrenze der Probe, keine zugesagte Kapazität des späteren Shops.

EV01–EV05, Preise 200/400/800, klassische Gestaltung und Bildrichtung bleiben bestätigt. Vier von 76 Bildmotiven sind vorbereitet. Weitere Avatarbilder sowie reale iPhone/iPad-/Safari-/Home-Bildschirm-/HTTPS-Nachweise bleiben offen. Git überträgt Programm und Dokumentation, keine Browserdaten oder Anmeldungen.

## Prüf- und Veröffentlichungsstand

Task1 ist in `88714c3` mit den Reviewkorrekturen `1613f54` und `a19fcc6` implementiert und unabhängig freigegeben. 35/35 neue Kernfälle bestanden nach den Korrekturen; zuvor waren 155/155 Shopfälle auf dem ersten Kernstand grün. Zwei wichtige Reviewbefunde sind geschlossen: Fortsetzung derselben Kandidaten-ID nach unklarem Upload und Statusbewahrung fehlerhafter 2xx-Nachleseantworten. Implementierung GPT-5.6 Sol/hoch, Review GPT-6 Astra/hoch.

Task2 (Browser-Szenarien, Bedienung, Export) ist in `2299df4` implementiert und in `6263470824b3333fbb2d1b7a0abdbb252e75c222` korrigiert. Die Reviewkorrekturen erzwingen die exakte Gewinneridentität und erhalten strukturierte Fehlerbeobachtungen. Beide Befunde sind unabhängig geschlossen. Task2- und Gesamtcodeprüfung sind für die isolierte Probe freigegeben. Implementierung ebenfalls GPT-5.6 Sol/hoch, Review GPT-6 Astra/hoch.

Die vollständigen Abschlussläufe bestanden: **172/172 Shop-Node-, 24/24 Edge-Browser- und 6/6 Serverprüfungen**, jeweils Exit0. [Prüfbericht mit Befehlen und Grenzen](../reports/2026-09-20-immutable-purchase-probe.md). Kein echter Google-Aufruf und keine Produkt-/Geräteabnahme waren Teil dieser Läufe.

Codeabschluss ist `6263470`; die abschließende Dokumentation folgt als eigener Commit in derselben Branchhistorie. Veröffentlichungsziel ist `origin/codex/vokabeltrainer-v1`. Bei Wiederaufnahme `git status --short --branch`, `git log -1` und `git ls-remote origin refs/heads/codex/vokabeltrainer-v1` frisch vergleichen. Persönliche Berichte, Browserdaten und Anmeldungen gehören nicht in Git.
