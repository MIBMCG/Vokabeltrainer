# Übergabe: Dauerhafte Käufe und Avatarentwicklung

Stand: **27.09.2026**

## Überprüfbarer Abschluss

Das Kaufpaket Tasks 1–6 ist umgesetzt. Alle RF-Befunde der unabhängigen
Gesamtprüfung sind geschlossen. Produkt-/Testcommit:
`1e29ac35252fe04f049b511f5f443fdcf41fd69e` auf `codex/vokabeltrainer-v1`.
Dieser Commit wurde gepusht und mit dem Remote-SHA exakt verglichen.
Der anschließende Dokumentationscommit ergänzt diese Übergabe auf demselben
Zweig; vor jeder Fortsetzung den aktuellen Branch und Remote prüfen.

| Nachweis auf `1e29ac3` | Ergebnis |
| --- | --- |
| vollständige Node-Suite | 506/506, 0 Fehler, 81,104 s |
| vollständige Produkt-/Überarbeitungs-/Kaufbrowserfälle | 43/43, 0 Fehler, 152,227 s |
| unabhängige Nachprüfungen | alle RF-1 bis RF-6 geschlossen, Spec/Qualität PASS |

Exakte Befehle, Versionsgrenzen und die komplette Befundgeschichte stehen im
[Abschlussbericht](../reports/2026-09-27-persistent-purchases-final.md).
Umsetzung: GPT-5.6 Sol/high; Review: GPT-6 Astra/high.
Die [15 Ausführungsentscheidungen](../reports/2026-09-27-persistent-purchases-entscheidungen.md)
legen auch die Kosten und die begründete Überschreitung der ursprünglich
vorgesehenen finalen Fixwellenzahl offen. Keine zweite breite Gesamtprüfung.

## Was jetzt funktioniert

- Erwachsene aktivieren das Kaufprotokoll über eine lokale Vorschau und
  ausdrückliche Bestätigung; gespeicherte unterbrochene Aufträge sind fortsetzbar.
- „Meine Figur“, „Entwicklung“ und „Shop“ verwenden tatsächliche Lernpunkte
  und profilgetrennten Besitz. Ausgaben ändern weder Lernpunkte noch Level.
- Vorhandene Grundfiguren und vier bestätigte Drachenformen sind eingebunden.
  Fehlende Entwicklungsbilder bleiben als ausstehend sichtbar und nicht kaufbar.
- Besitz und Figurenauswahl bleiben offline und nach Neustart verfügbar.
  Hintergrundsync aktualisiert die laufende Serviceinstanz ohne Reload und
  erhält neu erspielte gültige Level-Auswahl.
- Sicherungen exportieren beim Klick den aktuellen Stand. Eine veränderte
  offene Kopfmenge verlangt erneute Auswahl. Bestätigte Wiederherstellung
  übernimmt auch geringere Rechte und entfernte Figurenauswahl.
- Direkte Control-Fortsetzung veröffentlicht keine abhängigen Objekte vor
  bestätigter Einrichtung. Unklare Pointer werden zuerst gelesen und nur über
  den ausdrücklichen gespeicherten Auftrag wiederholt.

## Unveränderte technische Grenzen

Neue Lernfakten und Pakete bleiben v2; lokaler Speicher ist Version 3.
Aktivierte Kaufepochen und wirtschaftliche Sicherungen sind v3. Commands ist
alleiniger atomarer Schreiber. Vollständige Beleg-/Basis-/Proofhistorie bleibt
bestehen. Config wird vor Download verankert; nur der bestätigte gemeinsame
Kopf aktiviert die neue Epoche. Ein neutraler Offlinecheckpoint darf nur im
Backupexport und Quellreplay vorkommen, nie als autoritativer Zielkopf/Vorgänger.

Produktcache ist `v25`, synthetische Updateprobe `v26`. Vier unveränderte
Drachen-PNGs belegen 6.898.398 Bytes; responsive Varianten fehlen noch.
Keine neue Produktionsabhängigkeit und kein Buildschritt wurden eingeführt.

## Starten und auf einem anderen Rechner fortsetzen

```sh
git clone --branch codex/vokabeltrainer-v1 https://github.com/MIBMCG/Vokabeltrainer.git
cd Vokabeltrainer
git status --short --branch
git log -5 --oneline
npm test
npm start
```

Node.js ab 22.8.0 verwenden. Unter Windows bei gesperrtem PowerShell-Skript
`npm.cmd` statt `npm` schreiben. Danach `http://localhost:4173/trainer/` öffnen.
Die Adresse ohne `/trainer/` führt zur historischen technischen Probe.

Läuft ein lokaler Server bereits, ihn nach dem Update im zugehörigen Terminal
mit **Strg+C** beenden und erneut mit `npm start` starten. Die Server-Allowlist
wird beim Start aufgebaut. Der persönliche Server wurde während dieser Arbeit
nicht beendet und private Browserdaten wurden nicht verändert.

Git überträgt keine Browserdaten, Google-Anmeldungen oder persönlichen
Lernstände. Einen bestehenden Familienbestand bewusst über die vorbereitete
Google-Verbindung auswählen. Im Erwachsenenbereich „Einstellungen → Figuren
und Käufe“ die Datenaktualisierung vorbereiten und bestätigen, falls der
Bestand noch nicht umgestellt ist. Vollständige
[Bedienungsanleitung](../BENUTZUNG.md).

## Konkreter nächster Entwicklungsabschnitt

Die verbleibenden **72 Motive**, ihre responsiven Varianten und die vollständige
Galeriegestaltung umsetzen und visuell prüfen. Die bestätigten R-/E-/U-/AV-/EV-
Entscheidungen dafür nicht erneut pauschal abfragen. Frühere Pausen- und
Zwischenberichte sind historische Belege, keine aktuellen Startaufträge.

Separat offen bleiben reale Google-Drive-Prüfungen auf zwei physischen Geräten,
iPhone/iPad, Safari, Home-Bildschirm-App und reale Wiederaufnahme. Der echte
Probebericht 10 mit 6/6 Fällen wird nicht unverändert wiederholt und ersetzt
keine Produktabnahme. Hosting/HTTPS und allgemeine Lizenz bleiben gesondert.
Kein Merge nach `main`, keine Cloudkontenänderung und keine Veröffentlichung
aus dieser Übergabe ableiten.
