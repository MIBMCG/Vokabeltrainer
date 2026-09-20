# Übergabe: Umsetzung dauerhafter Käufe

**Historischer Arbeitsbeginn:** Inzwischen wurde Aufgabe 1 implementiert, noch nicht freigegeben und die Arbeit auf Nutzerwunsch pausiert. Maßgeblich ist die [Pausenübergabe](2026-09-20-pause-persistent-purchases.md).

## Auftrag und verbindlicher Umfang

Der Nutzer hat den [Integrationsentwurf](../superpowers/specs/2026-09-20-persistent-purchases-design.md) mit „ja“ ausdrücklich bestätigt. Die Umsetzung läuft nach dem [Plan](../superpowers/plans/2026-09-20-persistent-purchases.md). Keine erneute Grundsatz-, Entwurfs- oder Ausführungsfreigabe verlangen. C, Onlinekäufe, EV01–EV05, Google Drive und die getrennten Lernprofile bleiben erhalten.

Die sechs Planaufgaben führen von reinen Kaufbelegen und Punkteprüfung über gebundenen Transport und dauerhafte Aufträge zur v3-Synchronisation/Wiederherstellung und anschließend zur nutzbaren Oberfläche. Eine fertig vorbereitete Grundlage ist noch kein fertiger Produktshop.

## Arbeitsumgebung und Fortschritt

Arbeitsbaum `drive-probe`, Branch `codex/vokabeltrainer-v1`, Ausgangspunkt `9cbd38304fc23305d3ae68c21cd9f4f73a400915`. Der bestätigte Plan ist in `f54bd5d42762959c8c2dd8b2f746d417c0706706` gesichert. Persönliche Testberichte liegen im übergeordneten Checkout und bleiben unverändert/unversioniert.

Implementierung: GPT-5.6 Sol mit hoher Denktiefe. Unabhängige Prüfung der Daten-/Kaufgrenzen: GPT-6 Astra mit hoher Denktiefe. Ein Implementierer zur Zeit; getrennte Prüfung nach jedem abgeschlossenen Teil. Laufende lokale Koordination liegt in `.superpowers/sdd/2026-09-20-persistent-purchases/`; dieser ignorierte Ordner ist kein portabler Implementierungsnachweis. Maßgeblich für andere Rechner sind die Commits, der Plan und veröffentlichte Prüfberichte.

Aktuell ist die Planfreigabe dokumentiert; Aufgabe 1 befindet sich in Arbeit. Aufgaben 2–6 sind noch offen. Die bestehende App wurde dadurch noch nicht auf Käufe umgestellt. Bei Fortsetzung zuerst Git-Status und aktuelle Commits prüfen, um diese Zwischenangabe nicht mit späterer Implementierung zu verwechseln.

## Bisher tatsächlich geprüft

- Sauberer bestehender Arbeitsbaum vor Änderung; Entwicklungsbranch und separater Hauptcheckout geprüft.
- Ausgangslauf `npm test`: 379 bestanden, 0 fehlgeschlagen.
- Dokumentationsprüfung nach Plan: 188 Markdown-Dateien, 897 lokale Verweise, keine Fehler; `git diff --check` ohne Befund.
- Der vorhandene echte [Bericht10](../reports/2026-09-20-shop-v10-reallauf.md) bleibt bei sechs bestandenen synthetischen Szenarien. Er wird nicht unverändert wiederholt und ist kein Nachweis der noch laufenden Produktintegration.

## Besonders wichtige Integrationsgrenzen

- Neue storageVersion3 muss die bisherigen v2-Runden-/Policyprüfungen beibehalten. v1/v2-Ereignisse, Paket-IDs, Hashes und PIN-Verifier bleiben unverändert.
- Wiederherstellung und Kauf müssen denselben Kopf benutzen. Das bisherige Veröffentlichen einer einzelnen Epochendatei darf im neuen Modus keinen Lernstand aktivieren; dies gilt auch für Beitritt und alte schon laufende Anfragen.
- Unbekanntes Kaufergebnis zuerst nachlesen; nur ausdrückliches Fortsetzen darf denselben gespeicherten bedingten Versuch wiederholen.
- Portable Sicherungen enthalten überprüfbare wirtschaftliche Herkunft, keine ausführbaren Aufträge, HTTP-Schreibkennungen oder Google-Tokens. Restore fremder Sicherungen ist bewusst möglich; fremde Drive-Steuerung wird nicht übernommen.
- Bei neuen Runtime-Dateien Server-Allowlist und Service-Worker-Cache gemeinsam aktualisieren und Offline-/Updatefälle prüfen.

Verbleibende Bildproduktion, vollständige neue Galeriegestaltung, echte geräteübergreifende Wiederaufnahme, Apple-Abnahme und HTTPS-Bereitstellung bleiben gesondert offen. Die Entwicklungsarbeit wird im bereits beauftragten Branch gesichert; kein Merge und keine Veröffentlichung einer laufenden Website sind damit beauftragt.
