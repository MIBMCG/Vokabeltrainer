# Dauerhafte Käufe – dokumentierte Ausführungsentscheidungen

Stand: **27.09.2026**. Dieser Bericht überträgt die 15 vorhandenen
`Ruling:`-Einträge aus dem Fortschrittsledger in zeitlicher Reihenfolge. Er
ergänzt keine Produktentscheidung. Anforderungen, Kontenmodell, Kostenmodell,
Bildumfang und reale Abnahmegrenzen bleiben unverändert.

## 1. PowerShell statt der nicht lauffähigen Bash-Helfer

- **Entscheidung:** Für Workspace-, Brief- und Diffaufgaben werden auf diesem
  Windows-Rechner gleichwertige PowerShell-Befehle verwendet.
- **Grund:** Die vorgesehenen Bash-Helfer waren hier nachweislich nicht
  startfähig; die Arbeit sollte trotzdem denselben Planvertrag erfüllen.
- **Kosten/Risiko bei Irrtum:** Nur Werkzeugparität und zusätzlicher manueller
  Abgleich. Der Produktvertrag darf dadurch nicht verändert werden; eine
  übersehene Helferprüfung müsste vor Abschluss nachgeholt werden.

## 2. Durchgehende Umsetzung mit Sol/hoch und Review mit Astra/hoch

- **Entscheidung:** Die bereits autorisierte Umsetzung läuft mit GPT-5.6
  Sol/hoch, die unabhängigen Gates mit GPT-6 Astra/hoch.
- **Grund:** Der Nutzer hatte diesen Ablauf bestätigt; eine erneute allgemeine
  Startfrage hätte nur die freigegebene Ausführung unterbrochen.
- **Kosten/Risiko bei Irrtum:** Normaler zusätzlicher Reviewaufwand. Falsche
  Aufgabenabgrenzung könnte trotz guter Modelle unnötige Arbeit erzeugen;
  deshalb bleiben Brief und Reviewbereich verbindlich.

## 3. Gehashtes portables Proofmanifest

- **Entscheidung:** Wirtschaftliche Quellprovenienz enthält eine gehashte
  Abbildung von logischen Referenzen auf neue physische Objekt-IDs.
- **Grund:** Ein fremdes Backup muss auf einem leeren Gerät ohne Zugriff auf das
  ursprüngliche Google-Konto und seine Drive-IDs vollständig prüfbar bleiben;
  `source.head` allein genügt dafür nicht.
- **Kosten/Risiko bei Irrtum:** Ein zusätzliches Manifest und mindestens ein
  Lookup je importierter Closure sowie strengere Validierung. Erweist sich die
  Darstellung als falsch, muss sie vor Aktivierung ersetzt werden; sonst wären
  portable Wiederherstellungen unvollständig oder nicht beweisbar.

## 4. Bezahlte Formen nur mit vorhandenem Bild

- **Entscheidung:** Die Oberfläche bietet eine bezahlte Form nur an, wenn ihre
  tatsächliche Illustration vorhanden ist. Fehlende Stufen bleiben als
  ausstehend sichtbar.
- **Grund:** Kinder sollen keine erspielten Punkte für ein angeblich fertiges,
  tatsächlich fehlendes Bild ausgeben. Die restliche Bildproduktion ist vom
  Nutzer als eigenes Paket bestätigt.
- **Kosten/Risiko bei Irrtum:** Bis zum Bildpaket gibt es weniger Kaufbuttons;
  Katalog und Preise im Backend bleiben unverändert. Ein falsches
  Verfügbarkeitsflag könnte einen unbelegten Kauf erlauben oder fertige Kunst
  unnötig sperren.

## 5. Koordination aus portablen Septemberberichten rekonstruieren

- **Entscheidung:** Der lokale Arbeitsstand wird aus den versionierten Berichten
  vom 21.09. rekonstruiert; die ältere Ledgerhistorie bleibt erhalten.
- **Grund:** Der lokale Scratchstand stammte noch von vor der Laptoparbeit,
  während die portablen Berichte den späteren geprüften Stand belegten.
- **Kosten/Risiko bei Irrtum:** Zeit für Abgleich und Reorientierung. Eine
  falsche Rekonstruktion könnte bereits erledigte Arbeit wiederholen oder einen
  freigegebenen Fix übergehen.

## 6. Vorhandenen isolierten Worktree weiterverwenden

- **Entscheidung:** Der bestätigte Worktree `drive-probe` und die bereits
  festgelegten PowerShell-Äquivalente werden weiterverwendet.
- **Grund:** Checkout und Werkzeuggrenze waren bereits geprüft; ein neuer
  Worktree hätte keinen Produktnutzen geschaffen.
- **Kosten/Risiko bei Irrtum:** Kein neuer Checkout und keine Produktänderung.
  Ein unerkannter veralteter lokaler Stand hätte die falsche Basis erzeugt;
  deshalb sind portable Berichte und konkrete Basen maßgeblich.

## 7. Neuer Sol/hoch-Implementierer für Task-3-Korrekturrunde 2

- **Entscheidung:** Die zweite Task-3-Korrekturrunde erhält einen frischen
  GPT-5.6-Sol/hoch-Kontext mit engem Befundumfang.
- **Grund:** Die ursprüngliche Implementierungssitzung befand sich auf einem
  anderen System und war nicht fortsetzbar; der portable Bericht enthielt die
  nötige Übergabe.
- **Kosten/Risiko bei Irrtum:** Begrenzte Einarbeitungszeit und Verlust von
  implizitem Kontext. Das Review bleibt deshalb auf den konkreten offenen Befund
  beschränkt.

## 8. Vier bestätigte Drachen-PNGs als Zwischenbestand

- **Entscheidung:** Task 5 darf die vier bereits bestätigten Drachenquellen
  unverändert als vorläufige Laufzeitassets verwenden.
- **Grund:** Diese Bilder sind freigegeben; neue oder unbestätigte Kunst ist für
  die Bedienintegration nicht nötig. Das vollständige responsive Bildpaket
  bleibt getrennt.
- **Kosten/Risiko bei Irrtum:** 6.898.398 Bytes (rund 6,9 MB) zusätzlicher Precache und noch keine
  kleineren Auflösungsvarianten. Dies muss mit dem vollständigen Bildpaket
  überarbeitet werden; daraus folgt keine Behauptung einer kompletten Galerie.

## 9. Eigenes schmales Integrationsmodul

- **Entscheidung:** `src/trainer/purchases/integration.js` bündelt die Ports für
  ProductSync, Restore, Commerce und die unveränderliche Kandidaten-/
  Publikationsplanung.
- **Grund:** Die Kaufgrenze soll nicht mehrfach in den großen Sync- und
  Restoremodulen implementiert werden.
- **Kosten/Risiko bei Irrtum:** Ein zusätzlicher expliziter Laufzeit- und
  Cacheeintrag. Das Modul darf weder einen zweiten Schreiber noch eine rekursive
  Queue bilden; andernfalls könnten Zustände auseinanderlaufen oder Syncs sich
  selbst aufrufen.

## 10. Plan-Scratch nicht pauschal löschen

- **Entscheidung:** Der Plan-Scratch bleibt nach Abschluss erhalten, solange
  einzelne Dateien nicht nachweislich sicher bereinigt werden können.
- **Grund:** `task-1-report.md` ist darin historisch versioniert; das Löschen des
  gesamten Verzeichnisses würde einen committed Nachweis entfernen.
- **Kosten/Risiko bei Irrtum:** Kleiner dauerhaft belegter Arbeitsbereich ohne
  Laufzeiteffekt. Unklare Entwurfsdateien könnten später verwechselt werden;
  deshalb müssen Scratchentwürfe ausdrücklich als nicht angewandt markiert
  bleiben.

## 11. Neutraler Checkpoint nur für Offline-Backups

- **Entscheidung:** Eine neutrale Checkpoint-Receipt darf neuere vollständige
  Lernfakten seit dem letzten Kauf ausschließlich für Backupexport und
  Quellreplay belegen.
- **Grund:** Offline erworbene Antworten und Bonuspunkte müssen eine vollständige
  Sicherung und Wiederherstellung überleben, ohne die strikte Gleichheit von
  Quell- und Zielautorität zu lockern.
- **Kosten/Risiko bei Irrtum:** Neuer eng begrenzter Receipt-Typ sowie zusätzliche
  Validierungs- und Prooftests. Es gibt keinen Cloud-Pointerwrite beim Export
  und keine Konten- oder Produktumfangsänderung. Würde der Checkpoint in die
  normale Zielkette gelangen, könnte er unzulässig Autorität erhalten.

## 12. Vorhandenen Reviewer wiederverwenden, Dokumentation beim Controller

- **Entscheidung:** Der vorhandene Reviewagent übernimmt Task-4- und spätere
  Gates jeweils mit neuem Brief und exaktem Diffumfang; Task 6 bleibt beim
  Controller.
- **Grund:** Das Agentenlimit verhinderte den geplanten separaten
  Luna/medium-Dokumentationsagenten. Es sollte weder eine zweite
  Produktimplementierung noch ein nutzereigener Ersatzthread entstehen.
- **Kosten/Risiko bei Irrtum:** Weniger frischer Kontext bei der Reviewperson.
  Neue Briefs und Paketgrenzen müssen die Unabhängigkeit erhalten; ein Lunaagent
  wurde tatsächlich nicht eingesetzt.

## 13. Abschluss durch verifizierten Push des Entwicklungszweigs

- **Entscheidung:** Nach frischen Gesamtprüfungen wird ausschließlich der
  bestehende Zweig `codex/vokabeltrainer-v1` gepusht und sein Remote-SHA gegen
  den lokalen Kopf geprüft. Der Checkout bleibt erhalten.
- **Grund:** Der Nutzer hat die portable GitHub-Fortsetzung dieses Zweigs bereits
  beauftragt und möchte keine wiederholte Erlaubnisfrage.
- **Kosten/Risiko bei Irrtum:** Der Stand bleibt ungemergt; Hosting und
  Bereitstellung bleiben offen. Es gibt keinen neuen generischen
  Integrationsdialog, keinen ungefragten Pull Request und keinen Merge nach
  `main`. Ohne frische Node-, Browser-, Dokumentations-, Diff- und
  Gesamtreviewbelege darf der Push nicht als Abschluss gelten.

## 14. Restore-Auswahl im Task-5-Integrationsfix korrigieren

- **Entscheidung:** Die minimale Korrektur der Figurenauswahl beim Restore
  gehört in die Task-5-Integrationsfixes, obwohl die betroffene
  `applyConfirmedControl`-Stelle schon vor Task 5 bestand.
- **Grund:** Die neue konkrete Backupvorschau verspricht ausdrücklich, eine
  geänderte oder entfallende Figurenauswahl zu übernehmen. Der tatsächliche
  Restore darf diese zugesagte Auswahl nicht behalten, verlieren oder vor der
  bestätigten Wiederherstellung anwenden.
- **Kosten/Risiko bei Irrtum:** Der Kern-Diff wird eng um die atomare
  Auswahlübernahme erweitert und benötigt eine zusammengesetzte
  Restore-Regression sowie unabhängige Nachprüfung. Eine zu breite Korrektur
  könnte die strikte Autorität des bestätigten Kopfes oder die
  Einzelschreibergrenze verletzen; beide Grenzen bleiben deshalb unverändert.

## 15. Zwei belegte Restverträge gezielt vervollständigen

- **Entscheidung:** Die nach der scoped Nachprüfung belegten Restfälle RF-4
  (direkter Control-Resume vor bestätigter Einrichtung) und RF-6 (zu frühe
  Pollabschlussassertion) werden in einem eng begrenzten Nachtrag korrigiert.
- **Grund:** Beide gehören ausdrücklich zum ursprünglichen bestätigten Auftrag.
  Konkrete Reproduktionen und Abschlusskriterien liegen vor; eine neue
  Produktentscheidung oder Nutzerfreigabe ist nicht erforderlich. Die lokale
  SDD-Vorgabe einer einzigen finalen Fixwelle wird dafür bewusst überschritten,
  um die höherrangige Vorgabe zur vollständigen Erledigung autorisierter Arbeit
  zu erfüllen und keinen wissentlich unvollständigen Abschluss zu behaupten.
- **Kosten/Risiko bei Irrtum:** Ein zusätzlicher enger Umsetzungs- und Prüfpass.
  Keine zweite Gesamtprüfung des ganzen Zweigs; die Grenze bleibt bei diesen
  beiden Befunden und ihren konkreten Änderungen. Eine Ausweitung darüber
  hinaus würde unnötige Zeit und Modellkosten verursachen.

## Unveränderte Grenzen

Diese Entscheidungen führen keinen neuen Cloudanbieter, kein zusätzliches
Kostenmodell und keine neue Kontenarchitektur ein. Vier Drachenbilder sind ein
Zwischenbestand; 72 weitere Motive bleiben offen. Automatisierte Prüfungen
ersetzen keine reale Google-Drive-, Zwei-Geräte-, iPhone-/iPad-, Safari- oder
Home-Bildschirm-Abnahme.
