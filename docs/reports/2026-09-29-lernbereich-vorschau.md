# Lernbereichsübernahme: Wiederverwendung der Vorschau

Stand: 29.09.2026, Untersuchung auf `268055d`, Produkt `31fcf02`, Cache v40.
Nach Abschluss der Kauf-Uploadgruppen hat der Nutzer erneut Weiterarbeit
beauftragt. Dieses Dokument enthält die geprüfte Codeherleitung und den
vorgelegten begrenzten Vorschlag, noch keine implementierte Beschleunigung.

## Konkreter Ansatz

`joinDataset` in `src/trainer/sync/drive.js` ruft bei einem fremden,
nichtleeren lokalen Stand für Vorschau und Bestätigung jeweils
`inspectJoinedDataset` auf. Diese Prüfung beginnt mit einem leeren
Zwischenbestand, führt den bestehenden Abgleich aus und verwirft anschließend
den Prüfkontext. Die Freigabe speichert lokale und entfernte Hashes sowie
Sicherungs- und Auswahlkennung, aber keinen wiederverwendbaren Zwischenbestand.

Der vorgeschlagene Eingriff behält eine Kopie des erfolgreich geprüften
entfernten Vorschauzustands im Speicher der aktuellen Auswahl. Bei der
Bestätigung läuft die vorhandene Prüfung erneut auf einer getrennten Kopie
dieses Zustands. Die bereits vorhandene Kaufhistorienprüfung kann dadurch
bekannte Belege nach erneuter lokaler Hashprüfung wiederverwenden. Konto,
Bindung, Beschreibung, Konfigurationsanker, aktueller Kaufkopf und Dateiliste
werden weiterhin frisch geprüft. Neue Dateien und neue Kaufbelege werden
geladen; veränderte oder fehlende bekannte Lerndateien bleiben Fehlerfälle.

Es entsteht kein zusätzlicher dauerhafter Speicher und keine neue Abgleichlogik.
Die Vorschau verbindet den lokalen Bestand weiterhin nicht. Geprüfte lokale
Sicherheitskopie, Vorschaukennung, lokale Zustandskontrolle und atomare
Übernahme bleiben erhalten. Eine neue Auswahl ersetzt den temporären Stand;
nach Neustart ist weiterhin eine neue Vorschau nötig. Fehlgeschlagene
Prüfungen dürfen die bestätigte Vorschau nicht stillschweigend verändern.

## Messgrundlage und Erwartung

Die vorhandenen Rohdaten aus der [Restlatenzdiagnose](2026-09-29-restwartezeiten.md)
wurden neu nach Dienstschritt ausgezählt, ohne den Test erneut auszuführen:

| Phase | Produkt-Drive-Zugriffe | Kaufentdeckung | Kaufabgleich | Gesamt |
|---|---:|---:|---:|---:|
| Vorschau | 37 | 5 | 37 | 79 |
| Bestätigung | 37 | 5 | 37 | 79 |
| Erster regulärer Abgleich mit vorhandenem Kaufcache | 26 | 5 | 7 | 38 |

Allein die Wiederverwendung der unveränderten Kaufhistorie vermeidet in
diesem Bestand voraussichtlich 30 Anfragen beim Bestätigen, also ungefähr
49 statt 79. Das ist eine aus Code und vorhandener Messung hergeleitete
Erwartung, kein neuer Vorher-/Nachher-Nachweis und keine garantierte Dauer.
Der anschließende normale Abgleich bleibt zunächst erhalten.

## Vorgesehene Prüfung nach Freigabe

- Unveränderter Bestand: weniger Belegdownloads, gleicher Lern- und Kaufstand.
- Neues Wort oder geänderter Lernstand zwischen Vorschau und Bestätigung:
  keine stille Übernahme einer veralteten Vorschau.
- Neuer Kauf, Rücksetzung oder widersprüchlicher Kopf: aktuelle Kaufhistorie
  vollständig prüfen; keine veralteten Guthaben oder Besitzstände aktivieren.
- Fehlende/geänderte Datei, anderes Konto, abgelaufene Sitzung und Netzabbruch:
  keine lokale Bindung, Original und Sicherheitskopie erhalten.
- Lokale Änderung, beschädigte Sicherung, fremde/alte Vorschaukennung und
  Neustart: bestehende Freigabegrenzen erhalten.
- Doppelklick und fehlgeschlagener Versuch: kein gemeinsam mutierter
  Vorschauzustand und keine entfernten Schreibzugriffe vor Bestätigung.

Der kurze Entwurf ist zur Bestätigung vorgelegt. Bis zur Antwort keine
Produktänderung, Bereitstellung oder neue Testsitzung daraus ableiten.
