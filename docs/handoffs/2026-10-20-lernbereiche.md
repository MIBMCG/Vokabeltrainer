# Übergabe: direkter Geräteeinstieg und Lernbereiche

Stand: 20.10.2026. Nutzerauftrag: drei Verbesserungen umsetzen; konkreter Ablauf
im Chat bestätigt. [Entwurf](../superpowers/specs/2026-10-20-lernbereiche-design.md),
[Plan](../superpowers/plans/2026-10-20-lernbereiche.md),
[Prüfbericht](../reports/2026-10-20-lernbereiche.md).

## Ausgangsstand und Arbeitskopie

Produktzweig `codex/vokabeltrainer-v1`, vorhandene separate Produktarbeitskopie.
Ausgangscommit nach frischem GitHub-Abruf und Fast-Forward:
`4e47c37542ded15dca58cadbac7a2f14a2a000a1`. Der Hauptcheckout enthält andere
Materialarbeit und wurde nicht verändert. Vor jeder Fortsetzung Arbeitsstand,
lokale Änderungen, tatsächlichen HEAD und Remote neu prüfen.

HEAD und der echte Remote wurden zum Abschluss erneut auf exakt diesem Commit
verglichen. Die neuen Änderungen liegen lokal als uncommitteter Arbeitsdiff
vor; für dieses Paket gab es keinen Commit, Push oder Upload zur laufenden App.
Die aktuelle Produktarbeitskopie verwenden und den Hauptcheckout mit seinen
anderen Materialdateien erhalten.

## Bedienung der neuen lokalen Version

- Erster Start → **Bestehenden Lernbereich verbinden** → falls nötig Google
  anmelden → automatisch gefundener Bereich → **Diesen Lernbereich prüfen** →
  **Lernbereich verwenden** → ausschließlich lokale PIN einrichten.
- Elternansicht → Einstellungen → Google-Verbindung zeigt die Bereiche nach
  Anmeldung automatisch. **Neuer Name** und **Umbenennen** ändern die gemeinsame
  Bezeichnung. Kein Descriptor-/Kaufhashwechsel.
- **In Papierkorb verschieben** öffnet eine konkrete Bestätigung für den ganzen
  gemeinsamen Bereich. Der auf diesem Gerät aktive Bereich ist gesperrt.
  Keine endgültige Löschung und keine echte Bereichslöschung während der Tests.
- Vorhandene Sitzung bleibt nutzbar; Bereichssuche prüft bis zu vier Bereiche
  parallel. Bestehende Kopien-/Kauf-/Lernprüfungen bleiben erhalten.

## Grenzen und nächster Schritt

Die lokale Umsetzung ist abgeschlossen: 797/797 Nodefälle, 20/20 integrierte
Browserfälle und 4/4 Offline-/Update-/Übungsfälle auf dem endgültigen Quellstand
PASS, keine übersprungenen Fälle. Task-, Gesamt- und Schlussnachprüfungen ohne
offene Befunde. 398 öffentliche Dateien vorbereitet; Dokumentation und Diff
geprüft. Der [Prüfbericht](../reports/2026-10-20-lernbereiche.md) enthält die
genauen Befehle und trennt frühere fehlgeschlagene Zwischenläufe vom Abschluss.

Die neue lokale Version verwendet Cache v54. Sie ist noch nicht an der
laufenden LejeAdventure-Adresse bereitgestellt. Kein persönliches
Browserupdate und kein Eingriff in echte Lernstände. Echte Google-Dauer,
physische Mehrgeräte-/iPhone-/iPad-/Safariabnahme bleiben offen.

Nach abgeschlossener lokaler Prüfung kann der Nutzer die Bereitstellung des
konkreten Pakets beauftragen. Dafür die vorhandene LejeAdventure-Konfiguration
und Secrets erhalten, normalen Probelauf ausführen und das ausgelieferte Paket
sowie den kontrollierten Updatepfad prüfen. Keine Cloudanlage wiederholen,
keinen Lernbereich verschieben oder zur vermeintlichen Reparatur neu anlegen.

Vor dem Schreiben der lokalen PIN wartet die Oberfläche das Ende des
initialen Übernahmeabgleichs ab und erklärt die kurzzeitige Sperre. Ein bereits
gebundenes Gerät bietet bei anderen Bereichen keinen wirkungslosen Beitritt an;
deren Umbenennen und Papierkorb bleiben in der Elternansicht erreichbar.

Der Prüfbericht trennt den alten Ausgangslauf, fokussierte Regressionen,
unabhängige Reviewbefunde und die abschließenden Integrationsnachweise.
