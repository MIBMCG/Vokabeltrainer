# Übergabe: LejeAdventure-Einrichtung

**Unterbrechung für den Abend:** Der Nutzer möchte ins Bett und bittet um
Beschleunigung. Nur den Zwischenstand sichern; Einrichtung erst bei erneuter
Fortsetzung weiterführen. Bisherige App und Lernbestände bleiben erhalten.

## Auftrag und Umfang

Am 01.10.2026 beauftragt der Nutzer die neue Adresse und das Betreiberkonto
`lejeadventure@gmail.com`. Die Lernbereiche bleiben ausdrücklich im bisherigen
Google-Konto. Als Arbeitsname wird zunächst LejeAdventure verwendet.

[Einrichtungsentwurf](../superpowers/specs/2026-10-01-lejeadventure-betrieb-design.md)
und [Einrichtungsplan](../superpowers/plans/2026-10-01-lejeadventure-betrieb.md)
trennen bestätigten Umfang, Vorbereitung und noch ausstehende Schritte.

## Tatsächlich durchgeführt

- Lokaler Entwicklungszweig und zweiter Arbeitszweig sind vor diesem Schritt
  sauber auf `f0afe4c7300caaa2a9d81dd1ea39820ddea796bd`; beide GitHub-Zweige
  wurden mit dieser Commit-ID abgeglichen.
- Bestehendes Google-App-Projekt `vokabeltrainer-508915` im Dashboard gefunden.
- Nach ausdrücklicher Zustimmung `lejeadventure@gmail.com` als zusätzlichen
  Inhaber eingetragen. Google meldet „Richtlinie aktualisiert“.
- Der Rollenhinweis meldet **„Einladung gesendet. Annahme ausstehend.“**
  Das neue Konto ist damit noch nicht als wirksam übernommener Betreiber belegt.
- Der Nutzer hat Cloudflare mit dem neuen Konto geöffnet. Das Dashboard zeigt
  **Lejeadventure@gmail.com's Account**, Konto-ID
  `2531040d13ab47effa73e2124bd6e912`, und noch keine Apps.
- Die eingerichtete Kontosubdomain lautet `lejeadventure.workers.dev`.
  Das vorbereitete Workerformular meldet den Namen `app` als verfügbar.
- Im vorhandenen Google-OAuth-Client sind zusätzliche Felder mit
  `https://app.lejeadventure.workers.dev` und exakt
  `https://app.lejeadventure.workers.dev/api/auth/callback` vorbereitet;
  gespeichert. Google meldet „OAuth-Client gespeichert“; nach erneutem Öffnen
  sind beide Werte vorhanden. Die bisherigen vier Ursprünge und der bisherige
  Callback bleiben erhalten.
- Der konkrete Einrichtungsplan sowie das Anlegen des Workers und Speichern
  dieser OAuth-Erweiterung sind ausdrücklich bestätigt: „Ja, diese Adresse
  und Einrichtung umsetzen“.
- Worker `app` im neuen Konto angelegt. Anfangsversion `326abac7` ist nur die
  Cloudflare-Startvorlage, keine bereitgestellte Trainer-App.
- Neue D1 `lejeadventure-sessions`, ID
  `839a521d-58f1-45c1-92a1-5d41383e7255`, angelegt. Das bestehende
  `server/schema.sql` wurde erfolgreich ausgeführt; Strukturabfrage bestätigt
  `oauth_states`, `sessions` samt `version`-Spalte und beide Ablauf-Indizes.
- Ignorierte, getrennte Konfiguration `server/wrangler.local.lejeadventure.jsonc`
  mit neuem Konto, Ursprung und D1 vorbereitet. Alter Upload-Helfer, alter
  Vault und alte Konfiguration bleiben erhalten.
- Wrangler 4.142.0 Dry-run aus `server/` mit dieser Konfiguration PASS:
  Build-Hook erstellt 387 öffentliche Dateien, richtige ASSETS-/SESSIONS-
  Bindungen und neuer Ursprung. Lokaler Dateizähler bestätigt 387 Dateien.
  Acht gezielte Stagingtests PASS, keine Server-/Berichts-/Privatdateien im Paket.
- Neuer API-Token **zur Erstellung durch den Nutzer vorbereitet**, noch nicht
  erzeugt oder erfasst. Rechte nur im neuen Konto: Workers Scripts Edit,
  D1 Read, Account Settings Read. Zusammenfassung: Start 01.10.2026,
  Ende **01.01.2027**. Der Kalender wurde bis einschließlich 31.12. ausgewählt;
  maßgeblich ist die angezeigte Zusammenfassung mit dem Folgetag.
- Chrome hatte zwischenzeitlich wegen einer geöffneten Erweiterungsoberfläche
  die Steuerung angehalten. Der Nutzer meldete „frei“; danach D1 und Tokenformular
  normal weiterbearbeitet. Kein belegter Produkt- oder Bestandsfehler.
- Separater ignorierter Upload-Helfer erstellt und unabhängig geprüft. Ein
  erster Reviewbefund bei der Capture-Reihenfolge ist korrigiert; Zielprüfung
  erfolgt nun vor der Eingabe. 18 synthetische Fehlzielprüfungen, sieben
  ausschließlich lokale Stubprüfungen und AST mit null Parsefehlern PASS;
  unabhängige Nachprüfung ADDRESSED, keine neuen Brüche.
- Die ausdrückliche Zustimmung zum verschlüsselten Speichern und Verwenden
  des neuen Cloudflare-Tokens liegt vor: „Ja, geschützt speichern und dafür
  verwenden“. Der danach gestartete Helfer beendet sich vor der Eingabe:
  Er prüft `d1_bindings`, während die tatsächliche Wrangler-Konfiguration
  `d1_databases` verwendet. Fehler ohne Schlüssel reproduziert; kein neuer
  Vault angelegt. Die gezielte Einzeilenkorrektur verwendet jetzt
  `d1_databases`; die tatsächliche Konfiguration erreicht den abgefangenen
  Eingabeaufruf. 18 Fehlzielprüfungen PASS, unabhängige Nachprüfung ADDRESSED,
  keine anderen Zielprüfungen gelockert. Das geschützte Eingabefenster ist
  danach erneut gestartet. Der Nutzer meldet die Eingabe; ein eigener
  verschlüsselter Vault ist vorhanden. `Whoami` scheitert jedoch vor der
  Kontoprüfung mit Cloudflare 6003/6111 (ungültiges Authorization-Format).
  Ausschließlich Formatmetadaten geprüft: 15 Zeichen, keine Leerzeichen oder
  Steuerzeichen; Inhalt nicht ausgegeben. Vollständiger Token erneut persönlich
  per Kopierschaltfläche angefragt, geschütztes Fenster geöffnet. Der Nutzer
  meldet erneut die Eingabe. Auch der zweite `Whoami` meldet 6003/6111; Vault
  wurde neu geschrieben, Länge weiterhin 15. Cloudflare-Seitenüberschrift
  bestätigt erfolgreiche Tokenerstellung; keine Tokenwerte oder Screenshots
  ausgelesen. Zugriff noch nicht bestätigt; keine Bereitstellung versucht.
- Separater ignorierter Erstbelegungshelfer
  `.superpowers/lejeadventure-umzug/setup-secrets.ps1` vorbereitet; der aktive
  Upload-Helfer bleibt unverändert. Implementer meldet 30 synthetische Prüfungen
  PASS und AST ohne Parsefehler, ohne echtes Vaultlesen oder Netzoperation.
  Unabhängiges Review und konkrete Zustimmung zur Google-Schlüsselübermittlung
  sind vor Ausführung noch erforderlich. Hash/Report liegen im planbezogenen
  SDD-Arbeitsverzeichnis. Noch keine Worker-Secrets übertragen.

## Erhaltener Produktstand

Das bestehende Produkt `6b13780`, Cache v47, bleibt unter
`https://vokabeltrainer.marco-civico.workers.dev/trainer/` aktiv.
Es gab in diesem Einrichtungsschritt keine Produktänderung, Bereitstellung
oder Änderung von Lernbeständen. Der vorhandene Google-OAuth-Client bleibt
maßgeblich; keinen neuen Client erzeugen.

## Nächster konkreter Schritt

Die Annahme der Google-Inhabereinladung prüfen. Der neue Worker, beide
Google-Adressen und D1 sind angelegt. Startadresse für die später bereitgestellte
Trainer-App ist `https://app.lejeadventure.workers.dev/trainer/`.
Zuerst die unvollständige bzw. ungültige Eingabe des neuen Upload-Schlüssels
klären und seine Kontozuordnung prüfen. Den abendlichen Zwischenschritt nicht
als bestätigten Zugang behandeln. Danach beide Worker-Secrets geschützt
hinterlegen; erst anschließend das geprüfte Trainerpaket bereitstellen.

Das Öffnen der Google-Schlüsselübersicht wurde von der automatischen
Freigabeprüfung abgelehnt: Die Ansicht könnte private Client-Secrets anzeigen;
für das Auslesen lag keine ausdrückliche Autorisierung vor. Kein anderer
Ausleseweg wurde versucht. Der Schlüsselteil wird dem Nutzer zur persönlichen
Eingabe übergeben; keine vorhandenen Google-Secrets löschen oder den OAuth-
Client ersetzen. Der neue Betreiberzugang und die tatsächliche Verfügbarkeit
eines passenden Google-Client-Secrets bleiben noch zu prüfen.

Die neue Adresse besitzt eigene lokale Browserdaten. Eine einmalige PIN-
Einrichtung und Anmeldung mit dem bisherigen **Lernkonto** können nötig sein.
Vor dem Gerätewechsel ungesendete Änderungen an der bisherigen Adresse
abgleichen und anschließend den vorhandenen Lernbereich bewusst auswählen.
Keine Lernbestände in das Betreiberkonto verschieben.

## Nachweisgrenzen

Die Einladung ist gespeichert; ihre Annahme ist offen. Cloudflare-Konto,
Subdomain, Worker-Startvorlage, D1-Struktur und neue Google-Adressen sind geprüft.
Upload-Schlüssel, Worker-Secrets, Trainer-Bereitstellung, Anmeldung und
Bestandserhalt unter der neuen Adresse sind noch nicht belegt.
Eine abgeschlossene Umstellung darf aus diesem Dokument nicht abgeleitet
werden. Bestehende physische Geräte-/Safari-Abnahme und der separate
Firefox-Offlinenachweis bleiben offen. Nach Sicherung heute unterbrechen.
