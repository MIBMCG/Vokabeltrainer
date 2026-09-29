# Übergabe: Prüfung nach Verbindungsabbruch

Stand: 29.09.2026. Der Nutzer hat die Pause mit „jetzt kannst du arbeiten“
aufgehoben und ausdrücklich um Prüfung möglicher Folgen eines
Verbindungsabbruchs gebeten. Er bestätigt anschließend, dass der Abbruch
hier in Codex angezeigt wurde. In den geprüften Bereichen wurden keine
Folgeschäden festgestellt. Die technische Ursache des Codex-Abbruchs wurde
mit dieser Projektprüfung nicht bestimmt.

## Frisch geprüfter Zustand

- Hauptzweig `codex/vokabeltrainer-v1` und verwalteter Arbeitszweig
  `codex/purchase-batch-checks` sind zu Beginn sauber auf
  `0fbeb1919c95d9709f1ac9dcd082b7550f8be3fd`.
- `git ls-remote origin refs/heads/codex/vokabeltrainer-v1` bestätigt denselben
  vollständigen Commit direkt bei GitHub. Keine unterbrochene Merge-, Rebase-,
  Cherry-Pick-, Revert- oder Sequencer-Operation in beiden Checkouts.
- Die unabhängige lokale Prüfung mit `git fsck --full --no-progress` endet mit
  Exit 0: keine fehlenden oder beschädigten Objekte. Ein nicht referenzierter
  Blob ist kein Integritätsfehler und wurde unverändert belassen.
- Alle 199 Dateien im vorbereiteten Bereitstellungspaket stimmen mit dem
  sauberen Produktstand überein; keine zusätzlichen Dateien. Der zunächst
  direkte Vergleich der Konfiguration meldete eine Abweichung: Die bestehende
  Paketvorbereitung schaltet dort absichtlich `authMode` von `browser` auf
  `server`. Nach Berücksichtigung genau dieser vorgesehenen Umwandlung stimmt
  auch die Konfiguration vollständig. Kein Produktfehler und keine Änderung.
- Neun öffentliche Dateien wurden am 29.09.2026 um 15:13:05.529 UTC frisch
  abgerufen: Trainer-HTML, SW v37, CSS, Konfiguration, Hauptmodul, Commands,
  Erwachsenenansicht, Vokabelansicht und Importmodul. Alle antworten mit HTTP
  200 und sind bytegleich zum geprüften Paket. TLS-Prüfung bleibt aktiv.
- Die lesende Anbieterabfrage bestätigt weiterhin Worker-Version
  `84f65e5f-5871-4cb4-847c-08b4aaec97c7`, seit 11:53:58.477 UTC zu 100 Prozent.
  Es wurde nichts erneut bereitgestellt.
- Im vorhandenen Codex-Testbrowser sind vor und nach bewusstem Neuladen
  40 verfügbare Punkte, 2.040 Lernpunkte, Level 11 und ausgewählte Drachenstufe 4
  sichtbar. Der unmittelbar nach Laden angezeigte Google-Hinweis verschwindet
  ohne Anmeldung und ohne Galeriewechsel selbstständig. Kein fortbestehender
  Verbindungsfehler in dieser Ansicht beobachtet.

## Vorherige Prüfungen und Grenzen

Die vollständigen Endprotokolle des bereits abgeschlossenen Produktpakets
liegen unverändert vor: `final-node-awake.log` mit 650/650 PASS und
`final-browser-after-review.log` mit 22/22 PASS, jeweils ohne Fehler,
Abbruch oder übersprungene Fälle. Diese Tests wurden für die vorliegende
Zustandsprüfung nicht erneut ausgeführt. Die frühere Standby-Diagnose und
der erfolgreiche abschließende Lauf stehen im
[Bericht zur Vokabeleingabe](../reports/2026-09-29-vokabeleingabe.md).
Die damaligen Standby-Unterbrechungen belegen nicht die Ursache des jetzt
gemeldeten Verbindungsabbruchs.

Es gab keine Produktänderung, neue Anmeldung, Bestandsübernahme, Wortübernahme
oder Kaufhandlung. Der Familien-Chrome blieb unangetastet. Der erhaltene
sichtbare Teststand ist kein vollständiger Vergleich aller Drive-Daten und
kein Nachweis natürlicher Google-Token-Erneuerung. Echte Zwei-Geräte- und
iPhone-/Safari-Abnahmen bleiben offen.

## Fortsetzung

Produktcommit bleibt `c866bd76e98b9fcf4673a7d7a567674c282d04aa`, Cache v37.
Dieser Nachtrag wird getrennt auf `codex/vokabeltrainer-v1` gesichert; nach
dem Push ist der tatsächliche Remote-Branchkopf mit dem neuen lokalen Commit
zu vergleichen. Die bestehende Testumgebung nicht neu einrichten oder importieren.

Die Unterbrechungsprüfung ist abgeschlossen. Für die nächste praktische
Beurteilung des vereinfachten Tabellenwegs werden eine typische Wortliste und
deren Lektions-/Kinderkontext benötigt. Offene Arbeiten stehen im
[Arbeitsstand](../../ARBEITSSTAND.md); die
[vorherige Übergabe](2026-09-29-vokabeleingabe.md) beschreibt das fertige Paket.
