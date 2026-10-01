# Übergabe: lesbare Hauptnavigation bei großer Schrift

Stand: 01.10.2026. Der Nutzer sagt zunächst „dann machen wir hier eine Pause“
und hebt sie vor weiteren Produktarbeiten mit „wir können jetzt weiter machen“
ausdrücklich auf. Es gilt keine Pause; kein automatischer Folgeauftrag daraus
ableiten. Bestehende Familien-/Testbestände, Punkte, Besitz und Anmeldungen
werden weiterverwendet.

## Stand und Nachweise

Produktcommit `fee42e9d3fe1688af2ca7bcfb6f519950d05c312` im isolierten
Zweig `codex/purchase-batch-checks` basiert auf
`496f0c2e11759a486c353b1461cc895f52a41344`. Er behebt die Wortzerlegung der
unteren Navigation bei großer Schrift. Die drei Knöpfe wechseln bei
Platzmangel in eine weitere Zeile; genügend Bodenabstand hält das Inhaltsende
oberhalb der festen Leiste erreichbar. Schriftgröße, Labels, Touchflächen
und Auswahl bleiben erhalten. Nur Produkt-CSS/Cache und zugehörige Browser-
prüfungen ändern sich; keine fachlichen Daten- oder Kaufänderungen.

Finale Node-Suite 662/662, neuer Navigationsfall und 23 bestehende Browserfälle
PASS, jeweils Exit 0. Der richtige RED-Fehlernachweis misst tatsächlich
mehrere Zeilen innerhalb derselben Wörter vor der Änderung. Repräsentative
Viewportbilder sind visuell geprüft. Details, Befehle, Logs und Grenzen:
[Bericht](../reports/2026-10-01-hauptnavigation.md).

Das unabhängige Aufgabenreview und gesamte Branchreview sind ohne offene
Befunde bestanden. Der Stand ist per Fast-Forward in
`codex/vokabeltrainer-v1` integriert und privat als Cache v45 aktiv.
Worker `d86b43bd-6b39-4716-99af-1d3620580078` ist seit 01.10.2026,
16:18:46.988 UTC zu 100 Prozent aktiv. Sieben ausgelieferte Dateien sind
um 16:20:13.331 UTC bytegleich mit dem vorbereiteten Paket bestätigt.

Das kontrollierte Update im bestehenden Codex-Testbrowser erhält
40 verfügbare Punkte, 2.040 Lernpunkte, Level 11 und Drachenstufe 4.
Die neue Navigation und der Seitenabstand sind aktiv. Der Google-Hinweis
verschwindet ohne Anmeldung; dies belegt diese Wiederaufnahme, keinen
kontrollierten natürlichen Tokenablauf. Keine Einrichtung, Importe oder
Käufe im bestehenden Testbereich; Familien-Chrome blieb unangetastet.
Screenshot: `.superpowers/deployment-2026-10-01-mobile-navigation/existing-test-updated.png`.

Beide lokalen und entfernten Zweige sind beim Produktpush exakt auf
`fee42e9d3fe1688af2ca7bcfb6f519950d05c312` bestätigt. Dieser
Dokumentationsnachtrag wird separat auf beiden Zweigen gesichert; den
jeweils aktuellen Gesamt-SHA bei Fortsetzung immer frisch prüfen.

## Wiederaufnahme und offene Arbeit

Aktuelle Commits und lokale Änderungen vor jeder weiteren Arbeit prüfen:

```powershell
git status --short --branch
git log -5 --oneline
git worktree list --porcelain
git fetch origin
git ls-remote --heads origin codex/vokabeltrainer-v1 codex/purchase-batch-checks
```

Nicht aus historischen `main`-Ständen entwickeln. Vorhandenen Arbeitsbaum
und lokale Mess-/Reviewbelege erhalten. Keine Schlüssel oder persönlichen
Bestände übertragen. Keine bestehenden Profile neu einrichten oder durch
synthetische Testwörter ersetzen.

Nach diesem Paket ist der nächste Praxisnachweis der Eingabe- und Lernablauf
auf echten Handys, insbesondere Safari auf iPhone/iPad, sobald Geräte
verfügbar sind. Fehlende Geräte verhindern unabhängige autorisierte Arbeit
nicht. Reale Google-Zeit, natürlicher Tokenablauf und Zwei-Geräte-Abnahme
bleiben offen. Alle Avatarbilder sind abgeschlossen. Die Lernbereichsübernahme
bleibt zurückgestellt; nach den übrigen Optimierungen folgen die fünf
bestätigten Belohnungsideen: Verwandlung, Figurenbewegung, Lernreaktionen,
eigener Inselort und Steckbrief/Geschichte/Titel. Neue größere Pakete benötigen
einen konkreten abgegrenzten Entwurf; keine erneute pauschale Startfreigabe.
