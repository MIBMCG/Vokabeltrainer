# Belohnungsmomente für LejeAdventure

Die fünf bereits persönlich bestätigten Ideen werden nach Abschluss der
Übernahmeoptimierung umgesetzt. Ziel: Die Entwicklung einer Figur soll als
erreichter Lernerfolg spürbar und danach als persönliche Sammlung sichtbar sein.
Grundlage: [bestätigter Folgeumfang](../../handoffs/2026-09-29-avatar-restpaket.md).
Der Nutzer beauftragt am 03.10.2026 die nächsten Aufgaben ausdrücklich.

## Erlebnis

1. Nach nachweislich bestätigtem Freischalten erscheint die neue Form im
   bestehenden Erfolgsdialog mit einer maximal 1,2 Sekunden langen Verwandlung.
   Erfolgstext, Auswahl und Schließen sind sofort bedienbar; „Überspringen“
   beendet den Effekt. Auch gezielt fortgesetzte bestätigte Käufe erhalten
   diesen Moment. Unbekannter, offener oder abgelehnter Kaufstatus feiert nicht.
2. Ausgewählte Figuren bewegen sich auf Avatar-/Insel-/Erfolgsansichten kurz
   und dezent. Charaktereffekte passen zur Figur, etwa Glut beim Phönix,
   elektrische Funken beim Sturmgreif oder Nebel beim Hirsch. Keine dauernden
   Partikel, schnellen Blitze oder zusätzliche Bewegung während der Eingabe.
3. Die gewählte Figur reagiert auf gespeicherte abgeschlossene Runden und auf
   tatsächlich überwundene Fehlerwörter. Ein bloß richtiges Wort wird nicht als
   überwundene Schwierigkeit bezeichnet. Keine Strafreaktion bei Fehlern.
4. Die Inselreise erhält einen eigenen Figurenplatz mit einem passenden Namen
   und eine kompakte Sammlung der bestätigten eigenen Figuren/Entwicklungen.
   Auswählen führt weiterhin über den vorhandenen Avatarbereich.
5. Die eigene Figur erhält einen kurzen Steckbrief, eine kleine Geschichte
   und zu ihren besessenen Stufen passende Titel. Die Texte entwickeln sich
   über vier Stufen. Ungekaufte Stufen verleihen keine Titel.

## Verbindliche Grenzen

- Vorhandene responsive Bilder wiederverwenden; keine neue Bilderzeugung.
- Keine Änderung an Lernregeln, Preisen, Punkten, Kaufhistorie, Konten,
  Drive-Bindung oder gespeicherten Datenformaten. Keine neuen Währungen.
- Der vorhandene Profilwert `animations` gilt für alle Figuren. Der Schalter
  bleibt auch bei gewählter Entwicklungsfigur erreichbar. Betriebssystem-
  Einstellung `prefers-reduced-motion` beachten. Kein Ton wird hinzugefügt.
- Nur endliche CSS-Animationen mit Transform/Opacity; keine JS-Intervalle,
  Canvas-Partikel oder aufwendigen neuen Laufzeitbibliotheken.
- Bestätigung, Überspringen und Auswahl warten nicht auf Animation oder neue
  Bild-/Netzabfragen. Keine automatische Auswahl einer gekauften Figur.
- Belohnungsmomente nur für bestätigte passende Vorgänge, getrennt nach Profil;
  gewöhnliches Neuzeichnen oder vorhandener importierter Besitz feiert nicht
  erneut. Transiente Deduplizierung bleibt im Arbeitsspeicher und begrenzt.
- Offlineansicht, fehlende Bilder, Tastaturbedienung, 320/390px und 200 Prozent
  Schrift bleiben benutzbar. Bestehende Eingaben und Fokus nicht durch Effekte
  ersetzen. Keine persönlichen Testbestände verändern.
- Geräte-/Praxistests bleiben verschoben. Automatische synthetische Prüfungen
  und unabhängige Reviews erfolgen; daraus keine reale Geräteabnahme ableiten.

## Technischer Rahmen

Eine reine Präsentationsdatei ordnet den bestehenden 13 Figuren Texte und
Effektfamilien zu und leitet Sammlung/Titel ausschließlich aus der bestätigten
lokalen Kontoansicht ab. Ein kleines UI-Modul kapselt dekorative Figurenrahmen,
Steckbrief und begrenzte Sitzungserinnerung. Bestehende Renderfunktionen werden
ergänzt. Der Inselplatz liest nur `commerce.getView()`; veraltete asynchrone
Antworten dürfen nicht in eine andere Profil-/Seitenansicht schreiben.

Kaufeffekt entsteht nur bei `status === 'confirmed'` des passenden Auftrags
und passendem Besitz in der frisch gelesenen lokalen Kontoansicht. Lernreaktion
nutzt die gespeicherte Antwort-ID und passende effektive Meilensteinbelege;
Rundenreaktion nur einen gespeicherten Abschluss. Diese Präsentation erzeugt
selbst keine Lern-/Kauf-/Belohnungsereignisse.

Die Umsetzung erfolgt in zwei einzeln prüfbaren Paketen: Figurenplatz,
Steckbrief und Bewegungsgrundlage; danach Freischaltmoment und Lernreaktionen.
