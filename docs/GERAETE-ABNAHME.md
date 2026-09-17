# Geräteabnahme nach der Fertigstellung

Status: **noch nicht durchgeführt**. Diese Liste ist die spätere praktische Prüfung mit dem Freund. Sie blockiert die aktuell beauftragte vollständige Implementierung nicht. Vor dem Test muss eine abgestimmte HTTPS-Adresse bereitstehen; `localhost` auf dem iPhone bezeichnet das iPhone selbst, nicht den Entwicklungsrechner.

## Teststand festhalten

- App-Adresse und geprüfter Codecommit:
- Datum:
- iPhone-Modell und iOS-Version:
- iPad-Modell und iPadOS-Version:
- Browser/Version auf einem weiteren Vergleichsgerät:
- Getestet in Safari und/oder als Home-Bildschirm-App:

Keine E-Mail-Adressen, echte PIN, Tokens oder persönlichen Lernstände in diesen Bericht eintragen. Für den Test neutrale Profile und kleine Beispiellektionen verwenden. Bereits bestandene Desktop-Simulationen werden nicht als Apple-Abnahme übernommen.

## Einrichtung und tägliches Üben

- [ ] Safari: App laden, lokale Einrichtung durchführen und ein Testprofil anlegen.
- [ ] Erwachsenen-PIN zweimal eingeben; Bereich verlassen und erneute Abfrage prüfen.
- [ ] Eine Lektion mit mindestens fünf Wörtern anlegen, darunter ein Wort mit zwei erlaubten englischen Lösungen und eines mit Bedeutungshinweis.
- [ ] Lektion dem Testprofil zuordnen; nicht zugeordnete Wörter erscheinen dort nicht.
- [ ] Alle drei Lernmodi öffnen. Neue Wörter und zuletzt angelegte Lektion werden richtig angeboten.
- [ ] Richtige, falsche und leere Eingabe ausprobieren; Rückmeldung stimmt und bleibt bis „Weiter“ sichtbar.
- [ ] Bildschirmtastatur verdeckt Eingabe und Hauptaktion nicht. Keine störenden automatischen Korrekturen oder Großbuchstaben.
- [ ] Enter/Weiter bewusst auslösen und kurz gedrückt halten; kein Überspringen und keine doppelte Wertung.
- [ ] Im Rückmeldebildschirm neu laden; dieselbe Antwort und derselbe Punktestand bleiben erhalten.
- [ ] Profil wechseln und Runde fortsetzen; Fortschritte bleiben getrennt.
- [ ] Inselreise und Avatar bedienen; gesperrte Ausstattung ist erklärt, freigeschaltete Auswahl bleibt erhalten.
- [ ] Hoch-/Querformat, größere Schrift und reduzierte Bewegung prüfen; alles bleibt lesbar und erreichbar.

## Google und zwei echte Geräte

Auf beiden Geräten dieselbe öffentliche App-Konfiguration und denselben eingerichteten Google-Zugang verwenden. Keine Zugangsdaten in das Prüfprotokoll kopieren.

- [ ] Auf Gerät A verbinden und bewusst einen Trainerbestand erstellen.
- [ ] Auf Gerät B verbinden, den vorhandenen Bestand suchen und auswählen. Es entsteht kein zweiter Bestand aus Versehen.
- [ ] Auf A ein neues Wort anlegen; es erscheint nach automatischem Abgleich auf B.
- [ ] Auf A eine Antwort geben; B erhält denselben Fortschritt ohne Doppelwertung.
- [ ] Auf beiden Geräten offline unterschiedliche Antworten geben; anschließend nacheinander verbinden. Beide sehen nach Abgleich dieselben Ergebnisse.
- [ ] Dasselbe Wort auf beiden Geräten offline unterschiedlich ändern. Nach Abgleich bleibt ein sichtbarer Konflikt; Erwachsene können ihn lösen. Andere Wörter bleiben nutzbar.
- [ ] Google-Verbindung beenden und erneut verbinden. Lokale Antworten bleiben erhalten.
- [ ] Abgebrochene oder verweigerte Anmeldung zeigt eine verständliche Meldung; Offlineüben bleibt möglich.
- [ ] Nach Ablauf des Zugriffs wird eine erneute Verbindung angeboten. Tatsächliche Häufigkeit und Bedienkomfort notieren.

## Offline und Home-Bildschirm

Jeden Schritt getrennt in Safari und in der zum Home-Bildschirm hinzugefügten App prüfen. Eine vorherige erfolgreiche Online-Erstladung ist Voraussetzung. Unterschiedliche Browser-/Appspeicher nicht als automatisch gemeinsame lokale Daten voraussetzen.

- [ ] App online vollständig laden und einen lokalen Stand speichern.
- [ ] Internetverbindung ausschalten und App schließen.
- [ ] App ohne Verbindung erneut öffnen; Oberfläche und bereits geladene Wörter sind verfügbar.
- [ ] Eine Antwort offline speichern und nochmals schließen/öffnen; Antwort ist weiterhin vorhanden.
- [ ] Internet einschalten, bei Bedarf Google verbinden; ausstehende Antwort wird genau einmal übertragen.
- [ ] App in den Hintergrund legen; bei Rückkehr ist die Erwachsenenansicht gesperrt.
- [ ] Zweiten Tab derselben App öffnen; der Speicherschutz führt nicht zu konkurrierenden Schreibvorgängen und erklärt den Zustand.
- [ ] Eine Programmaktualisierung überschreibt keine gerade eingegebene Antwort; angebotene Pause/Übernahme funktioniert.

## Sicherung und Wiederherstellung

Nur mit einem eindeutig als Test gekennzeichneten Datenbestand durchführen.

- [ ] JSON-Sicherung herunterladen und tatsächlichen Ablageort in der Dateien-App finden.
- [ ] Nach weiteren Antworten die frühere Sicherung auswählen; Vorschau nennt die Unterschiede.
- [ ] Abbrechen verändert den aktuellen Stand nicht.
- [ ] Bestätigte Wiederherstellung erstellt vorher eine erreichbare Sicherheitskopie und übernimmt den gewählten Stand.
- [ ] Zweites Gerät gleicht den neuen Stand ab; alte laufende Runde wird ohne Bonus beendet.
- [ ] Vorher auf B zurückgehaltene Offlineantwort nach der Wiederherstellung übertragen: Sie erscheint als separate alte Änderung.
- [ ] Erwachsene wählen diese Antwort zur Übernahme; sie zählt genau einmal. Nicht übernommene Änderungen bleiben sichtbar und sicherbar.
- [ ] Eine beschädigte oder nicht unterstützte Sicherung wird verständlich abgelehnt, ohne Daten zu verändern.

## Ergebnis

| Befund | Gerät und Betriebsart | Schritte zur Wiederholung | Erwartet / tatsächlich | Erledigt durch Commit |
| --- | --- | --- | --- | --- |
| Noch keine Geräteprüfung durchgeführt | — | — | — | — |

Einzelne Fehlschläge konkret dokumentieren. Die App erst nach den tatsächlich durchgeführten Schritten für die jeweiligen Geräte als abgenommen bezeichnen. Bei einem Fehler zunächst die betroffene Funktion korrigieren und erneut prüfen; keine zusätzlichen Dienste oder Kosten stillschweigend einführen.
