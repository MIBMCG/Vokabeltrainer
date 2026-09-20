# Übergabe: dauerhafte Käufe konkret entworfen

Branch `codex/vokabeltrainer-v1`, Arbeitsbaum `drive-probe`. Ausgangspunkt `102d8c7f77ac7978db2d3649db7b19780eca7aaf`; lokaler und entfernter Stand zu Beginn frisch verglichen, identisch und lokal sauber. Nutzerauftrag: „Dan mache nun weiter“ nach Auswertung von Bericht10.

## Ergebnis und Freigabestatus

Der [Integrationsentwurf](../superpowers/specs/2026-09-20-persistent-purchases-design.md) liegt zur konkreten Abstimmung vor. Die allgemeine Entwicklungsfreigabe bleibt erhalten. **Die Zustimmung zu diesem neuen technischen Entwurf ist noch ausstehend.** Es wurde ausschließlich Dokumentation erstellt, kein Produktcode geändert und kein Implementierungsplan als bereits ausführbar ausgegeben.

Die Empfehlung verwendet einen gemeinsamen Bestätigungspunkt je Lernbestand, fachlich getrenntes Guthaben/Besitz je Kind, dauerhafte Aufträge mit unveränderlicher Vorgangskennung und zunächst lesende Wiederaufnahme nach Neustart. Kauf und vollständige Wiederherstellung erhalten dieselbe Reihenfolge. Die Umstellung wird gesichert; ältere Programme müssen aktualisiert werden. Keine neue Cloud-/Client-ID-Einrichtung, keine neuen Preise und kein Echtgeld.

Wichtigste neue technische Konkretisierungen gegenüber der Probe:

- Dauerhafter Produktzustand statt nur einer Registrierung im Arbeitsspeicher; lokale Schreibübergänge vor abhängigen Netzschritten.
- Eindeutige gemeinsame Einrichtung über den bestehenden Bestandsordner; getrennter Koordinations-/Inhaltsordner.
- Nur auf ausdrückliches Fortsetzen wiederholter identischer bedingter PUT nach unklarem Ausgang. Die Probe mit genau einem PUT bleibt unverändert.
- Echte Lernpunkte und Katalogbelege; keine synthetische 1000-Punkte-Gutschrift.
- Neue Epoche und wirtschaftlicher Zielstand werden bei Restore erst durch denselben bestätigten Kopf wirksam.
- v3-Formatmarker und Prüfung verspäteter alter Schreibvorgänge; der Marker allein kann bereits laufende Anfragen nicht stoppen.
- Vollständige Belegaufbewahrung über 64 Einträge hinaus, mit begrenzten Leseabschnitten und geprüftem Cache. Keine automatische Löschung/Verdichtung.

## Tatsächliche Untersuchung

Gelesen wurden Projektanweisungen, Einstieg, Arbeitsstand, Bericht10-Übergabe, relevante Anforderungen/Architektur, bestätigter Shopentwurf und Produktdatenformat. Die Quellprüfung erfasste insbesondere `storage/store.js`, `commands.js`, `storage/migrate.js`, `model/versions.js`, `sync/drive.js`, `backup/restore.js`, `backup/format.js`, Lernprojektion/-fakten und Entwicklungskatalog sowie den isolierten Kaufkoordinator.

Die aktuelle App hat bereits atomare lokale Speicherung, einen serialisierten Schreibweg und dauerhafte Wiederherstellungsaufträge. Die Produkt-Synchronisation prüft neue Versionsheader vor eigenen Uploads, aktiviert aber bislang Epochen aus separat veröffentlichten Dateien. Darum genügt das bloße Hinzufügen einer Kaufauftragsliste noch nicht für die integrierte Kauf-/Restoregrenze.

Offizielle Google-Referenzen zu Metadaten-PUT, reservierten IDs/409 und Propertygrenzen wurden frisch gelesen und sind im Entwurf verlinkt. Die bedingte Koordination wird weiterhin durch Bericht10 gestützt, nicht als allgemeine Google-Garantie ausgegeben. Kein echter Google-Aufruf wurde gestartet; Bericht10 bleibt bei 6/6 bestanden.

Der Entwurf wurde auf Umfang, Widersprüche, Reihenfolge von Speicherung/Netzwerk, Neustart, Identität, Profiltrennung und historische Belege selbst geprüft. Keine offenen Platzhaltermarker. `npm run check:docs` prüfte 187 Markdown-Dateien und 891 lokale Verweise ohne Fehler; `git diff --check` blieb ohne Befund. Keine Runtimeänderung und deshalb keine Wiederholung unveränderter Produkttests. Keine zusätzlichen Agenten für diese Planung. Für die spätere Umsetzung vorgesehen: GPT-5.6 Sol/hoch, unabhängige Prüfung GPT-6 Astra/hoch.

## Konkreter nächster Schritt

Die eine ausstehende Frage betrifft die Zustimmung zu diesem schriftlichen Integrationsentwurf, insbesondere gemeinsamer Bestätigungspunkt und gesicherte Datenaktualisierung. Nach Zustimmung mit `writing-plans` den detaillierten Plan der drei abgegrenzten Schritte ausarbeiten und anschließend im bereits autorisierten Entwicklungsumfang umsetzen. Keine erneute allgemeine Startfreigabe, keine neue A/B/C-Cloudfrage und kein identischer Bericht10-Lauf.

Der Produktshop bleibt noch nicht integriert. Die 72 weiteren Bildmotive, physische Zwei-Geräte-/Apple-Abnahme und HTTPS-Bereitstellung bleiben offen. Die Dokumentation wird auf demselben Entwicklungszweig gesichert; bei Wiederaufnahme HEAD, Remote und lokale Änderungen frisch vergleichen. Persönliche Berichte im übergeordneten Clone bleiben unverändert und unversioniert.
