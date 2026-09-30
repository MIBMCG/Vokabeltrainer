# Übergabe: große Wortlisten schneller abgleichen

Stand: 30.09.2026. Der Nutzer hat nach Abschluss der Galerie den begrenzten
Entwurf mit „Ja, so umsetzen“ bestätigt. Das Paket ist fertig, unabhängig
geprüft und privat bereitgestellt. Keine neue Pause angeordnet.

## Stand und Änderung

- Produktcommit `a5303575ca2703e1aeac115226210f76f772f535`, Cache v42.
- Hauptzweig `codex/vokabeltrainer-v1` und wiederverwendeter Arbeitszweig
  `codex/purchase-batch-checks` sind nach Push bei genau diesem Produktcommit
  auf GitHub bestätigt. Dieser Dokumentationsnachtrag folgt als eigener Commit.
- Bis zu drei gewöhnliche Lernpakete zugleich, einschließlich ID-Reservierung,
  geprüftem Upload und Bestätigung. Teilfehler warten alle gestarteten Vorgänge
  ab; Erfolge bleiben gespeichert, übrige Pakete mit derselben ID wiederholbar.
- Kein neues Datenformat, keine Änderung an Paketgrößen, Kauf, Anmeldung,
  Lernbereichsübernahme oder vorhandenen Beständen.

## Tatsächlich geprüft

- Zwei Parallelitäts-/Fehlertests vor Umsetzung rot, danach grün;
  zusätzlicher Test für eine vor der Folgegruppe aktualisierte Quarantäne.
- Finale Gesamtsuite **662/662 PASS**, gezielt **113/113**, Browser **6/6**.
- Unabhängige Task- und Abschlussreviews ohne Befund. Der anfangs zu kurze
  Test-Wartewächter und der korrigierte volle Lauf sind dokumentiert.
- Kontrollierte Simulation mit 500 Wörtern, 500 ms Zusatzlatenz pro Anfrage:
  im Mittel **22,372 → 13,890 Sekunden**, 37,9 Prozent weniger Gesamtwartezeit.
  Gleiche 41 Anfragen/sechs Pakete. Jedes der 502 Wortereignisse einschließlich
  Ausgangswörtern exakt einmal in der Cloud-Fixture; alle 500 neuen nach Reload.
- Vorschau rund 90 ms, lokales Speichern unter 300 ms. Kein horizontaler
  Überlauf bei 320/390/768 Pixel. Synthetisches Einfügeereignis, keine echte
  Excel-Zwischenablage oder physische Smartphoneprüfung.
- 387 öffentliche Dateien vorbereitet; zwei geändert. Neun ausgelieferte
  Dateien (Änderungen und direkte Integrationsdateien) bytegleich bestätigt.
  Worker `2b88c625-3eab-4607-a7ce-969c9c4cdd68`, seit 19:40:28.622 UTC 100 % aktiv.
- Kontrolliertes Update im bisherigen Codex-Testbrowser erhält 40 verfügbare
  Punkte, 2.040 Lernpunkte, Level 11 und Drachenstufe 4. Kein neuer Import oder
  Login. Familien-Chrome unverändert.

Ein früherer schneller Nachlauf enthielt nur 28 Anfragen, weil der initiale
Anlege-/Abgleichvorgang noch auslief; er ist ausdrücklich ausgeschlossen.
Der belastbare Vergleich wartet vor Messbeginn auf vollständige Netzruhe.
Details, genaue Befehle, Fehlerchronologie und Nachweisgrenzen:
[Bericht](../reports/2026-09-30-grosse-wortlisten.md).

## Nächster konkreter Schritt

Den vorhandenen Tabellenweg mit einer typischen echten Excel-Wortliste und
der gewünschten Lektions-/Kinderzuordnung gemeinsam abnehmen. Diese Eingaben
fehlen weiterhin. Keine synthetischen Wörter in vorhandene Familien- oder
Testbereiche schreiben und keinen Lernbereich neu einrichten.

Reale Google-Laufzeit, zwei physische Geräte, iPhone/iPad/Safari/Home-Bildschirm
und natürlicher Tokenablauf bleiben offen. Die gesonderte Optimierung der
Lernbereichsübernahme ist zurückgestellt und nicht freigegeben. Die fünf
bestätigten Belohnungsideen folgen nach den übrigen Optimierungen; die Bilder
sind vollständig abgeschlossen und werden nicht erneut erzeugt.

Der separate Arbeitsbaum und die lokalen Review-/Messbelege bleiben für die
Weiterarbeit erhalten. Einstieg immer über AGENTS.md, START-HIER.md und
ARBEITSSTAND.md sowie frischen Branch-/Remote-Abgleich.
