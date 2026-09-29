# Übergabe: vereinfachte Vokabeleingabe

Stand: 29.09.2026, abgeschlossen und privat bereitgestellt. Maßgeblich ist der
[Bericht zur Vokabeleingabe](../reports/2026-09-29-vokabeleingabe.md).
**Neue ausdrückliche Pause nach diesem Schritt:** Nur die Abschlussdokumentation
und Git-Sicherung beenden; anschließend keine weitere Produktarbeit,
Bereitstellung, Bilderzeugung oder Testsitzung ohne ausdrückliche Fortsetzung.

## Auftrag und Ergebnis

Vorrang haben viele Wörter aus Excel oder einer anderen Tabelle; Einzeleingabe
und Zuordnung sollen ebenfalls einfacher werden. Der bestehende Kopierweg ist
überarbeitet: automatische kompakte Prüfung, gemeinsame Übernahme, sichtbare
Lektion/Kinder und bewusste Behandlung gleicher Wörter. Einzelwörter können
mit **Speichern und nächstes Wort** nacheinander eingegeben werden.

Die lokale Übernahme speichert den ganzen Stapel gemeinsam. Eine synthetische
Messung mit 250 Wörtern ergibt 73 ms statt 6,3 s und eine statt 250 Speicherungen.
Das enthält weder Browser-/IndexedDB- noch Google-Zeit. Datenformate,
Lernpunkte und Cloudprotokoll werden nicht geändert. Anleitung:
[Wörter aus einer Tabelle übernehmen](../BENUTZUNG.md#wörter-aus-einer-tabelle-übernehmen).

## Git, Prüfung und Bereitstellung

- Entwicklungszweig: `codex/vokabeltrainer-v1`, Ausgang `5ff5aef`.
- Isolierte Implementierung: vorhandener Zweig `codex/purchase-batch-checks`.
- Produktcommit `c866bd76e98b9fcf4673a7d7a567674c282d04aa` per Fast-Forward
  integriert und exakt mit GitHub verglichen. Abschlussdokumentation folgt
  als eigener Commit auf demselben Entwicklungszweig.
- Final **650/650 Node**, **22/22 Browserfälle**, unabhängige Task-/Gegen-/
  Abschlussprüfung PASS, keine offenen Reviewbefunde.
- Cache v37 privat aktiv; Worker `84f65e5f-5871-4cb4-847c-08b4aaec97c7`
  seit 29.09.2026, 11:53:58.477 UTC zu 100 Prozent. Neun öffentliche Dateien
  sind bytegleich mit dem geprüften Paket verglichen.
- Kontrolliertes Update im vorhandenen Testbrowser über **Jetzt aktualisieren**
  übernommen. Punkte, Level und gewählte Figur sind erhalten; die
  Erwachsenen-PIN wurde nicht erneut geöffnet und keine echte Wortliste importiert.

Zwei Node-Läufe wurden durch nachgewiesene Standbyunterbrechungen zeitlich
verfälscht und sind mit jeweils einem Fehler dokumentiert. Für den finalen
Lauf wird nur ein vorübergehender, an den Testprozess gebundener Wachzustand
verwendet und danach beendet; keine dauerhafte Energieeinstellung wurde geändert.
Der Deckel muss für Zeitmessungen offen bleiben. Der letzte vollständige Lauf
bestand nach allen Produktkorrekturen in rund 262 Sekunden. Details und genaue
Grenzen stehen im Bericht.

## Erhaltene Bestände und offene Nachweise

Bestehenden Codex-Testbereich und Familien-Chrome nicht neu einrichten,
importieren oder ersetzen. Der vorhandene Testbereich hat 2.040 Lernpunkte,
Level 11, 40 verfügbare Punkte und ausgewählte Drachenstufe 4.
PINs und Kontoverbindungen bleiben auf dem jeweiligen Gerät.

Die natürliche Google-Erneuerung ist weiterhin nicht abgenommen. Die interne
Sitzungsstatusseite war im Browserclient blockiert; der vorbereitete
Metadatenhelfer wurde nicht ausgeführt. Kein neues Anmeldeproblem und kein
Tokenablauf-PASS daraus ableiten. Reale Übernahmezeiten größerer Tabellen,
Google-Abgleich auf zwei physischen Geräten sowie iPhone/Safari und
Home-Bildschirm-App bleiben praktische Nachweise. 64 Entwicklungsbilder und
weitere Kaufbeschleunigung bleiben Folgeumfang.

## Nächster Schritt erst nach ausdrücklicher Fortsetzung

Eine typische Excel-Wortliste im normalen Erwachsenenbereich praktisch
beurteilen. Dafür werden die gewöhnlichen Tabellenspalten und der gewünschte
Lektions-/Kinderkontext benötigt. Die tatsächliche Zeit bis zum lokalen Speichern
und der spätere Google-Abgleich sind getrennt zu beurteilen. Keine Testwörter
in einen Familienbestand ohne Nutzerauftrag schreiben. Danach nach Nutzerpriorität
mit den offenen Geräte-, Token- oder Bildaufgaben fortsetzen.
