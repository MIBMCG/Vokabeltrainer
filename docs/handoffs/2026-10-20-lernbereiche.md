# Übergabe: direkter Geräteeinstieg und Lernbereiche

Stand: 20.10.2026. Nutzerauftrag: drei Verbesserungen umsetzen; konkreter Ablauf
im Chat bestätigt. [Entwurf](../superpowers/specs/2026-10-20-lernbereiche-design.md),
[Plan](../superpowers/plans/2026-10-20-lernbereiche.md),
[Prüfbericht](../reports/2026-10-20-lernbereiche.md).

## Veröffentlichung abgeschlossen

Der Nutzer hat anschließend ausdrücklich „dann veröffentliche die neue Version“
beauftragt. Das geprüfte Produkt ist als
`9663aedbc481d06c5924dad1f954a3ff1c305c42` auf dem bestehenden Zweig
`codex/vokabeltrainer-v1` gesichert; normaler Push und exakter `ls-remote`-Vergleich
bestätigt. Kein Merge nach main oder neues GitHub-Release.

Frische 16/16 Paket-/Auslieferungstests und Wrangler-4.142.0-Probelauf PASS.
Das rekonstruierte ignorierte LejeAdventure-Ziel nutzt ausschließlich die
bereits dokumentierten öffentlichen Konto-/D1-/OAuth-Werte. Auf diesem Rechner
war zunächst nur das alte Cloudflare-Konto angemeldet. Der vorhandene Upload-
Token war nicht mehr verfügbar; das vorbereitete Eingabefenster wurde beendet.
Der Nutzer wählte daraufhin ausdrücklich Cloudflare-Anmeldung und bestätigte
die Wrangler-Freigabe persönlich im Browser. Separates verschlüsseltes Profil
`lejeadventure`, bisheriges `default` erhalten; keine Credentialwerte gelesen
oder in Berichte kopiert. Für Cloudbefehle ausdrücklich dieses Profil wählen.
`whoami --profile` ist in Wrangler 4.142.0 nicht unterstützt; der tatsächliche
Zugriff auf den fest konfigurierten Worker und dessen vorhandene Versions-
und Bindungsmetadaten bestätigt stattdessen das Veröffentlichungsziel.

Öffentliche Ausgangsprüfung am 20.10.2026 um 12:00:27 UTC PASS: alle 398 Dateien
bytegleich zum festen bisherigen Commit `4e47c37`, Cache v53; drei Infoseiten
HTTP 200, sechs interne Pfade HTTP 404, anonyme Sitzung false/no-store, alte
App weiter v47.

Wrangler 4.142.0 mit regulärer Zertifikatsprüfung (`--use-system-ca`),
`--keep-vars`, unverändertem Worker/D1/OAuth-Ziel: acht geänderte Assets
hochgeladen, 390 wiederverwendet. Worker
`5dcd7149-0a4c-4c9b-8c4e-d157ea5e64be` seit **20.10.2026, 12:10:18.470 UTC**
zu **100 Prozent** aktiv. Anbieterstatus erneut lesend bestätigt;
Bindungsbeschreibungen einschließlich Secret-Namen/-Typen und Runtime vor/nach
Upload exakt gleich. Keine Secretwerte ersetzt oder ausgelesen, keine
Datenbankmigration. Log-/Vorschaueinstellungen bleiben in der Konfiguration
ausgeschaltet; diese separaten Provider-Einstellungen sind nicht aus dem
Versionsmetadatensatz ablesbar.

Öffentliche Nachprüfung um 12:10:46 UTC PASS: alle **398 Dateien bytegleich**
zum geprüften v54-Staging, drei Infoseiten HTTP 200, sechs interne Pfade HTTP
404, anonyme Sitzung false/no-store und Altadresse unverändert v47.

Tatsächlicher öffentlicher Edge-Updatefall um 12:11:06 UTC PASS: alle acht
geänderten Ausgangsdateien bytegetreu aus `4e47c37` im echten v53-Browsercache
geprüft. Danach Ausgangsrouten vollständig entfernt und native Updatefunktion
wiederhergestellt; alle neuen Dateien direkt vom öffentlichen Dienst geladen.
„Jetzt aktualisieren“ aktiviert echten v54-Cache. Vollständiger synthetischer
Produktzustand und LocalStorage bleiben exakt erhalten, einschließlich zweier
Profile, einer richtigen Antwort, Runde, aktivem Commerce, Bindung, PIN-Prüfwert
und Satzzeichenoption. Offline-Neuladen und neuer Einstieg auf leerem Gerät
geprüft; keine unerlaubten Google-/Drive-Aufrufe oder Seitenfehler.

Die lokale Generalprobe hatte zunächst einen Kontrollskriptfehler: Chromiums
automatischer Worker-Updateabruf umgeht Playwright-Routen und begann vorzeitig
den neuen Cache. Ausschließlich während der synthetischen Baselinephase wird
dieser automatische Aufruf zurückgehalten; vor dem öffentlichen Update ist die
native Methode wiederhergestellt und danach geprüft. Keine Änderung am Produkt
oder an neuen Cachebytes zur Erzeugung eines Erfolgs. Finale lokale und öffentliche
Fälle bestehen getrennt. Der gespeicherte Rundenzustand ist exakt verglichen;
keine zusätzliche interaktive Rundenfortsetzung behauptet.

Unabhängige Veröffentlichungsprüfung mit GPT-6.1-sol / medium bestätigt die
Belege ohne materiellen Blocker. Lokale Rohbelege unter
`.superpowers/lernbereiche-public/`: `deploy.log`, `deployments-before.json`,
`deployments-after.json`, `version-before.json`, `version-after.json`,
`staged-summary.json`, `live-update-verification.json`, `live-update.log`,
`live-update.png` und `UPDATE-CHECK.md`. Keine persönlichen Browser- oder
Lerndaten gelesen. Die Belege sind ignoriert und werden nicht durch Git übertragen.

## Ausgangsstand und Arbeitskopie

Produktzweig `codex/vokabeltrainer-v1`, vorhandene separate Produktarbeitskopie.
Ausgangscommit nach frischem GitHub-Abruf und Fast-Forward:
`4e47c37542ded15dca58cadbac7a2f14a2a000a1`. Der Hauptcheckout enthält andere
Materialarbeit und wurde nicht verändert. Vor jeder Fortsetzung Arbeitsstand,
lokale Änderungen, tatsächlichen HEAD und Remote neu prüfen.

HEAD und der echte Remote wurden vor der Umsetzung auf exakt diesem Commit
verglichen. Beim lokalen Abschluss lagen die neuen Änderungen zunächst als
uncommitteter Arbeitsdiff vor. Veröffentlichung und Sicherungscommit sind
inzwischen oben belegt; dieser Dokumentationsnachtrag folgt separat.
Die aktuelle Produktarbeitskopie verwenden und den Hauptcheckout mit seinen
anderen Materialdateien erhalten.

## Bedienung der neuen Version

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

Die veröffentlichte Version verwendet Cache v54. Kein persönliches
Browserupdate und kein Eingriff in echte Lernstände. Echte Google-Dauer,
physische Mehrgeräte-/iPhone-/iPad-/Safariabnahme bleiben offen.

Beim nächsten persönlichen App-Aufruf gegebenenfalls „Jetzt aktualisieren“
wählen. Der neue Einstieg und die Bereichsverwaltung können dann im Alltag
verwendet werden. Keine Cloudanlage wiederholen,
keinen Lernbereich verschieben oder zur vermeintlichen Reparatur neu anlegen.

Vor dem Schreiben der lokalen PIN wartet die Oberfläche das Ende des
initialen Übernahmeabgleichs ab und erklärt die kurzzeitige Sperre. Ein bereits
gebundenes Gerät bietet bei anderen Bereichen keinen wirkungslosen Beitritt an;
deren Umbenennen und Papierkorb bleiben in der Elternansicht erreichbar.

Der Prüfbericht trennt den alten Ausgangslauf, fokussierte Regressionen,
unabhängige Reviewbefunde und die abschließenden Integrationsnachweise.
