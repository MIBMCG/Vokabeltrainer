# Übergabe: Kinderansichten und Kaufdialog auf schmalen Bildschirmen

Stand: 01.10.2026. Der Nutzer setzt ausdrücklich fort. Die Pause vom
30.09. ist aufgehoben; es wurde keine neue Pause angeordnet. Der Nutzer hat
derzeit keine Excel-Vokabeldatei. Das verhindert die weitere Arbeit nicht:
Eine repräsentative Texttabelle ist in einem separaten synthetischen Profil
geprüft, und die [Anleitung](../BENUTZUNG.md) enthält kopierbare Beispielzeilen.
Keine erfundenen Wörter wurden in Familienbestand oder bestehenden Testbereich
übernommen.

## Geprüfte Änderung

Produktcommit `ef17de83ade47b5d4259fe4d96787a9d847f126f` umfasst den ersten
Layoutcommit `89dd33a` und den gezielten Commerce-Nachschliff. Cache v44.
Übungsstart, Inselreise, Abzeichen, Avatar und klassische Auswahl erhalten
begrenzte Rasterspalten und sichtbaren Textumbruch. Bei großer Schrift stehen
Abzeichen untereinander. Verbundene Entwicklung und Shop passen ebenfalls;
die Kaufvorschau stellt Preis/Guthaben und ihre Aktionen auf schmalen
Bildschirmen untereinander dar. Der Dialog erhält mehr nutzbaren Platz.
Schriftgrößen und Mindesthöhen bleiben erhalten.

Produkt-JavaScript, Punktevergabe, Kaufregeln, Synchronisation, Datenformat,
Anmeldung und alle fertigen Avatarbilder ändern sich nicht.

- Elf gezielte Browserfälle und 662/662 Node-Tests bestanden vor dem letzten
  reinen CSS-Nachschliff am verbundenen Commerce-Bereich.
- Danach fünf betroffene Browser-/Offline-/Updatefälle frisch PASS, Exit 0.
  Acht verbundene Zustände bei 320/390 px und 200 Prozent Schrift passen außen
  und innen; Preise und beide Dialogaktionen sind sichtbar und fokussierbar.
- Unabhängige Vorher-/Nachhermessung und gescrollte Sichtprüfung: Die fünf
  ursprünglichen Überläufe sind korrigiert. 20 Standardzustände auf
  320/390/1280 px normal und 320/390 px mit großer Schrift ohne Seitenüberlauf.
- Aufgabenreview, gezielte Nachprüfung und gesamtes Branchreview: bestanden,
  keine blockierenden Befunde. Die nach Review gefundene Commerce-Lücke ist
  mit tatsächlicher Fehlerkorrektur und Verhaltensprüfung geschlossen.

Alle Browserbelege stammen aus Desktop-Edge mit synthetischen Profilen und
32 px Schrift an der Dokumentwurzel. Das ist keine physische Handyabnahme.
Ausführliche Messungen, Befehle und Grenzen:
[Bericht](../reports/2026-10-01-handyansichten.md).

## Bereitstellung und Sicherung

Der geprüfte Zweig ist per Fast-Forward in `codex/vokabeltrainer-v1`
integriert; der isolierte Arbeitsbaum bleibt auf `codex/purchase-batch-checks`.
387 öffentliche Dateien sind für Cache v44 vorbereitet; zwei geändert.
Worker `c8223625-5a08-4718-9bf5-ae0952c8855c` ist seit 01.10.2026,
10:30:29.253 UTC zu 100 Prozent aktiv. Sieben Änderungs-/Integrationsdateien
sind um 10:32:32.061 UTC bytegleich mit dem geprüften Paket bestätigt.

Im bestehenden Codex-Testbrowser wurde **Jetzt aktualisieren** übernommen.
40 verfügbare Punkte, 2.040 Lernpunkte, Level 11 und die gewählte Drachenstufe 4
sind sichtbar erhalten. Der vorübergehende Google-Hinweis verschwindet ohne
Anmeldung. Keine Einrichtung, Importe oder Käufe im bestehenden Bestand;
Familien-Chrome blieb unangetastet. Das belegt diese Wiederaufnahme und dieses
Update, keine kontrollierte Tokenablauf- oder Zwei-Geräte-Abnahme.
Screenshot lokal: `.superpowers/deployment-2026-10-01-mobile-child/existing-test-updated.png`.

Beide lokalen und entfernten Zweige sind nach Push exakt auf den Produktcommit
`ef17de83ade47b5d4259fe4d96787a9d847f126f` abgeglichen. Dieser
Dokumentationsnachtrag folgt separat auf beiden Zweigen; der jeweils aktuelle
Gesamt-SHA ist frisch mit den folgenden Befehlen zu bestimmen.

Die aktuelle Commit-ID für eine Fortsetzung immer frisch prüfen:

```powershell
git status --short
git branch --show-current
git log -5 --oneline
git fetch origin
git ls-remote --heads origin codex/vokabeltrainer-v1 codex/purchase-batch-checks
```

Keine historischen `main`-Stände als Basis verwenden. Vorhandene Änderungen
erhalten. Quellcode und Übergabe werden auf beiden bereits ausdrücklich
freigegebenen Zweigen gesichert; persönliche Bestände und Schlüssel gehören
nicht zum Upload.

## Offene Grenzen und Weiterarbeit

Die feste untere Navigation bricht bei 320 px/200 Prozent einige längere
Beschriftungen weiterhin zeichenweise um; das Abschlussreview bewertet dies
als vorhandene, nicht blockierende Lesbarkeitsgrenze. Eine vollständige
Großschriftabnahme auf allen Geräten ist damit nicht behauptet.
Das ursprüngliche Übungsstart-RED-Textprotokoll wurde nicht als Datei
gesichert; ursprüngliche Messdaten und Vorherbilder sind vorhanden. Der
zusätzliche Commerce-Diagnoselauf endet nach acht Messungen durch Timeout und
ist ausdrücklich kein bestandenes Testergebnis oder Kaufzeitnachweis; der
abschließende reguläre Lauf besteht.

Safari/iPhone/iPad, Touch, Bildschirmtastatur, echte Zwischenablage/Excel,
Google-Laufzeit, kontrollierter natürlicher Tokenablauf und physische
Zwei-Geräte-Prüfung bleiben gesonderte Praxisnachweise. Eine echte Wortliste
kann später als Text kommen; eine Excel-Datei ist keine Voraussetzung.
Bestehende Familien-/Testbestände weiterverwenden, nicht neu einrichten.
Die Lernbereichsübernahme bleibt zurückgestellt. Nach den übrigen
Optimierungen folgen die fünf bestätigten Belohnungserweiterungen:
Verwandlung, Figurenbewegung, Lernreaktionen, eigener Inselort und
Steckbrief/Geschichte/Titel. Alle Entwicklungsbilder sind fertig.

Arbeitsbaum und lokale Mess-/Reviewbelege bleiben für die Übergabe erhalten.
