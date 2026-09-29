# Übergabe: Diagnose der Restwartezeiten

Nachtrag: Der Nutzer hat den Entwurf anschließend mit „ja, Teste das“
bestätigt. Umsetzung und aktuelle Nachweise stehen in der
[Kauf-Uploadgruppen-Übergabe](2026-09-29-kauf-uploadgruppen.md).
Der folgende Text dokumentiert den damaligen Diagnosestand.

Stand: 29.09.2026. Der Nutzer hat erneut Weiterarbeit beauftragt. Keine Pause.
Produkt bleibt `ee7e174`, privat Cache v39; Ausgang der Diagnose ist der
saubere Zweig `codex/vokabeltrainer-v1` auf `fa078c0`. Es wurden keine
Produktdateien verändert und kein neues Update bereitgestellt.

## Ergebnis

- Synthetische Kaufbestätigung weiterhin 31 HTTP-Anfragen; fünf Kaufdateien
  werden in zwei aufeinander wartenden Gruppen hochgeladen und nachgelesen.
- Übernahme eines vorhandenen aktivierten Lernbereichs in einen nichtleeren
  lokalen Teststand: 79 Anfragen für Vorschau, erneut 79 für Bestätigung,
  38 für den ersten Abgleich. Grund ist zweimaliges vollständiges Einlesen.
- Zwei isolierte Messläufe nach Korrektur einer Statusfeldabfrage im
  Diagnosehelfer Exit 0; Kauf-/Punktestand, Übernahme, Sicherheitskopie und
  anschließender Status überprüft. Keine echten Daten oder Zugangsdaten.
- Messwerte, Grenzen und Codeherleitung im
  [Diagnosebericht](../reports/2026-09-29-restwartezeiten.md).

## Nächster Schritt und offene Antworten

Ein kurzer Entwurf liegt dem Nutzer vor: Kaufdateien in Gruppen bis sechs
statt drei übertragen, sämtliche Prüfungen erhalten. Die Antwort steht bei
Erstellung dieser Übergabe aus. Erst nach bestätigtem Entwurf umsetzen,
Unterbrechungs-/Wiederaufnahmefälle prüfen und denselben Zeitvergleich ausführen.
Nicht die bereits abgeschlossenen Importkorrekturen wiederholen.

Parallel wurde der Nutzer um fünf bis zehn typische Tabellenzeilen sowie
Lektions-/Kinderzuordnung für den praktischen Importtest gebeten. Diese Daten
liegen noch nicht vor. Keine synthetischen Wörter in den Familienbestand
übernehmen; bestehenden Codex-Testbereich nicht erneut einrichten.

Die private App, der Familien-Chrome und der vorhandene reale Testbestand
bleiben unverändert. Natürlicher Google-Tokenablauf, physische Geräteabnahme,
64 Entwicklungsbilder und das reale Kaufziel unter zehn Sekunden bleiben offen.
