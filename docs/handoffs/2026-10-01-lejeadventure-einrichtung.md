# Übergabe: LejeAdventure-Einrichtung

**Aktuelle Fortsetzung am 02.10.2026:** Keine Pause; bisherige App v47 erhalten.
Dokumentationsbasis HEAD `32199454326441715f80eef99e71ec420d4dc57a`.
Google-Inhabereinladung ausdrücklich angenommen; frischer IAM-Aufruf im per
Badge bestätigten Leje-Konto zeigt das bestehende Projekt und beide Inhaber.
Wirksamer Google-Betreiberzugang damit belegt; private Inhaberrolle erhalten.
Upload-Zugang PASS; Google-Eingabefenster geschlossen, neue Worker-Secrets zuletzt `[]`.
Verfügbarkeit der gesicherten bestehenden Google-App-Schlüsselquelle erneut
angefragt, Antwort offen. Genaue Secret-Zielfreigabe für Worker `app` gilt weiter.
Kein neues Projekt oder OAuth-Client, kein Deploy; Produkt und Lernbestände erhalten.
Nachweise, Grenzen und nächster Schritt sind unten dokumentiert.

**Historischer Zwischenstand am 02.10.2026 vor der erneuten Rotation:** Der Nutzer hat ausdrücklich fortgesetzt;
die Abendpause vom 01.10. ist aufgehoben. Lokaler Stand und beide Remotezweige
sind frisch auf `448182a7a135d249810161c2c0027eddded5b276` abgeglichen.
Unabhängige synthetische Capture-Diagnose PASS: exakt 40 Zeichen durch DPAPI
bis zur Prozessumgebung erhalten; keine belegte Kürzung. Tatsächliche Eingabequelle
ungeklärt; bisheriger Zugriffsversuch weiterhin 6003/6111. Separater Erstbelegungshelfer
unabhängig in Spec und Quality PASS; 30 synthetische Tests laut
Implementierungsbericht/Review, keine reale Ausführung. Der existierende Token
„LejeAdventure App-Upload“ ist laut heute geprüfter sicherer Cloudflare-Zusammenfassung
aktiv, Last used `-`, mit ausschließlich D1 Read, Workers Scripts Edit und
Account Settings Read für `lejeadventure@gmail.com`, Ende 01.01.2027.
Persönliche äquivalente Erneuerung durchgeführt; eine weitere ist nötig, weil
während der parallelen Bedienung eine versehentliche Aufnahme die neue
Schlüsselanzeige erfasste. Lokale Aufnahme gelöscht; erneute Eingabe offen.
Produkt `6b13780`, Cache v47, bleibt erhalten; keine Bereitstellung,
Secretschreibung oder Datenänderung. Neue Zustimmung zur Google-Secret-Übermittlung
steht vor Ausführung noch aus.
Dieser Zwischenstand ist durch den unten dokumentierten erfolgreichen Kontonachweis überholt.

**Historische Unterbrechung für den Abend am 01.10. (am 02.10. aufgehoben):** Der Nutzer möchte ins Bett und bittet um
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
- **Historische Tokenvorbereitung am 01.10. vor der persönlichen Erstellung:**
  Der API-Token war zunächst zur Erstellung durch den Nutzer vorbereitet.
  Danach am selben Tag tatsächlich erzeugt und zweimal per DPAPI-Eingabe erfasst
  (siehe den späteren Zugriffsversuch unten). Rechte nur im neuen Konto: Workers Scripts Edit,
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
  Unabhängiges Spec- und Quality-Review inzwischen PASS; 30 synthetische Tests
  laut Implementierungsbericht/Review, damals keine reale Ausführung. Konkrete
  Zustimmung stand zu diesem Zeitpunkt noch aus; inzwischen erteilt (siehe unten).
  Hash/Report liegen im planbezogenen
  SDD-Arbeitsverzeichnis. Noch keine Worker-Secrets übertragen.

- **Aktueller Kontonachweis am 02.10.2026:** Nach der versehentlichen Aufnahme
  hat der Nutzer persönlich erneut Roll durchgeführt und den neuen Zugang
  geschützt eingegeben. Der zuvor in der Aufnahme sichtbare Zugang ist damit
  ersetzt; die Aufnahme ist lokal gelöscht. `Whoami` über den unveränderten,
  geprüften Upload-Helfer PASS und ausdrücklich genau Konto
  `2531040d13ab47effa73e2124bd6e912` / **Lejeadventure@gmail.com's Account** bestätigt.
  User Details Read ist nicht vorhanden und absichtlich nicht erforderlich;
  keine Rechte erweitert. Secret-Namen am neuen Worker `app` ausschließlich
  lesend geprüft: `[]` (leer). Keine neuen Worker-Secrets und kein Deploy.
- Sicherungscommit `893b31791c8f3a6c398b39628d3c4db12c011835` auf beiden lokalen
  und Remotezweigen exakt bestätigt.
- Zunächst konkrete Übermittlungsfreigabe für die persönliche Eingabe von
  `GOOGLE_CLIENT_SECRET` des bestehenden Projekts sowie einen neuen
  `SESSION_ENCRYPTION_KEY` ausschließlich an den neuen Worker `app` angefragt;
  Antwort zu diesem Zeitpunkt noch ausstehend; inzwischen ausdrücklich erteilt.
  Damals noch keine reale Ausführung des Erstbelegungshelfers.
- Google-IAM am 02.10. erneut gelesen: Die neue Inhaberrolle zeigt weiterhin
  „Einladung gesendet. Annahme ausstehend.“ Der Cloudflare-Zugang bestätigt
  nicht die Annahme dieser getrennten Google-Einladung.

- **Aktuelles Eingabehindernis am 02.10.2026:** Der Nutzer antwortet ausdrücklich
  „freigabe“ auf die genaue persönliche Übermittlung von `GOOGLE_CLIENT_SECRET`
  des bestehenden Projekts und eines neuen `SESSION_ENCRYPTION_KEY`
  ausschließlich an den neuen Worker `app`. Diese Zielfreigabe gilt weiter;
  sie muss nicht für denselben Umfang erneut eingeholt werden.
- Geprüfter Setup-Helfer und Konfiguration wurden mit ihren exakten geprüften
  Hashes abgeglichen. Das persönliche Eingabefenster mit PID 15428 wurde
  geöffnet und wartete zu diesem Zeitpunkt noch. Inzwischen ist das Fenster
  geschlossen; eine tatsächliche Secret-Belegung oder ein Deploy ist nicht belegt.
- Der private Inhaber öffnete denselben bestehenden Google-OAuth-Client.
  Gelesen wurden nur Beschriftungen, Überschriften und die Anzahl sichtbarer
  Schaltflächen, keine Schlüsselwerte. Der Nutzer kann den alten Schlüssel
  nicht kopieren. Sichtbar sind zwei aktive „Secret deaktivieren“-Schaltflächen;
  „Add Secret“ ist deaktiviert. Kein Secret wurde deaktiviert, gelöscht oder
  ersetzt und kein neuer OAuth-Client angelegt.
- Die am 02.10. geprüfte offizielle [Google-Supportquelle](https://support.google.com/cloud/answer/15549257?hl=en-GB)
  bestätigt die Sichtbarkeit eines neuen Secrets nur bei Erstellung und die
  Grenze von höchstens zwei Secrets. Das fehlende vorhandene Secret als
  persönliche Eingabequelle ist damit das aktuelle Hindernis.
- Der Nutzer wurde nach einer gesicherten `client_secret…json`-Datei oder einem
  Eintrag in der Passwortverwaltung gefragt. Seine Antwort: „ja, aber hier leider
  nicht vorhanden“. Die Quelle existiert, ist auf diesem Laptop aber nicht
  verfügbar. Lokal wurden
  ausschließlich passende Dateinamen in Downloads und Repository gesucht:
  keine Treffer, keine Dateiinhalte gelesen.
- Annahme der neuen Google-Inhabereinladung erneut live geprüft: weiterhin
  „Einladung gesendet. Annahme ausstehend.“ Sicherungscommit
  `7acaba5b73af0ad72ae4a1440e26b669a6f9b867` vor dieser Dokumentation auf beiden
  lokalen und Remotezweigen exakt bestätigt.
- Das eigene Google-Eingabefenster ist inzwischen geschlossen. Erneute reine
  Namensprüfung am neuen Worker ergibt `[]`; keine Teilbelegung vorhanden.
  Für den unabhängigen Betreiberzugang ist die IAM-Seite gezielt im neuen
  Google-Konto geöffnet. Google verlangte damals „Verify it’s you“ für
  `lejeadventure@gmail.com`; die damals angefragte persönliche Anmeldung ist inzwischen abgeschlossen.
- Der Codepfad für die neue lokale Startmaske ist unabhängig untersucht:
  Ohne Drive-Bindung bleiben Grunddaten lokal. Die bestätigte Übernahme eines
  anderen vorhandenen Lernbereichs ersetzt den lokalen Ledger und leert seine
  Uploadwarteschlange; Startdaten verbleiben lediglich in einer lokalen
  Sicherheitskopie. Der Einrichtungsplan ist deshalb genauer formuliert.
  Startanleitung nur als Entwurf vorbereitet; echter Wechsel und Werteerhalt
  unter der neuen Adresse bleiben zu prüfen.

- **Historischer Google-Zugriffsbeleg am 02.10.2026 vor der Einladungsannahme:** Der Nutzer hat die Anmeldung
  abgeschlossen. Der gesteuerte Chrome zeigt `lejeadventure@gmail.com` mit
  `authuser=1`. Die Projektliste enthält das bestehende Projekt nicht. Der direkte
  IAM-Aufruf für `vokabeltrainer-508915` im Leje-Konto meldet fehlende Berechtigungen
  `resourcemanager.projects.get` und `resourcemanager.projects.getIamPolicy`
  sowie erforderliche zusätzliche Zugriffsrechte. Die Anmeldung allein belegt
  somit keine wirksame Inhaberrolle; eine angenommene Einladung ist weiterhin
  nicht nachgewiesen. Der Nutzer ist gebeten, die bestehende Google-Inhaber-
  Einladung in seinem eigenen Leje-Postfach persönlich anzunehmen.
- Der Nutzer hat eine gesicherte alte Google-Schlüsselquelle, die derzeit auf
  diesem Laptop nicht verfügbar ist. Das Google-Eingabefenster ist geschlossen;
  neue Worker-Secrets zuletzt `[]`. Die konkrete Secret-Zielfreigabe gilt weiter.
  Kein neues Projekt oder OAuth-Client, keine neuen Worker-Secrets, kein Deploy
  und keine Produktänderung. Dokumentationsbasis HEAD
  `5a3f87005b2aac7e862f6b1b49546dd5dc891fd7`.

- **Wirksamer Google-Betreiberzugang am 02.10.2026 belegt (Task 1):** Die erste
  persönliche Rückmeldung „angenommen“ war zunächst ohne Bestätigung; beide
  beobachteten Ansichten zeigten die Einladung weiterhin als ausstehend.
  Am konkreten Handlungspunkt erlaubt der Nutzer anschließend ausdrücklich:
  „Ja, Einladung jetzt annehmen“. Nach Klick auf „Einladung annehmen“ auf der
  beobachteten Google-Seite öffnet Google das Projektdashboard.
- Ein anschließender frischer IAM-Aufruf mit `authuser=1` und tatsächlich per
  Kontobadge bestätigtem `lejeadventure@gmail.com` erreicht das bestehende Projekt
  **Vokabeltrainer / `vokabeltrainer-508915`**. Der bisherige private Inhaber und
  das neue Betreiberkonto sind beide als **Inhaber** aufgeführt; keine Warnung
  und kein Hinweis auf eine ausstehende Annahme. Kein neues Projekt oder
  OAuth-Client erzeugt; die private Inhaberrolle bleibt erhalten.
- Ein Beleg ausschließlich mit sicheren IAM-Metadaten liegt im ignorierten
  SDD-Arbeitsbereich. Er wird weder in Git verlinkt noch übertragen.
- Verbleibendes Eingabehindernis ist die Verfügbarkeit der gesicherten bestehenden
  Google-App-Schlüsselquelle für die persönliche Eingabe. Sie wurde erneut
  angefragt; Antwort steht aus. Die genaue Secret-Zielfreigabe gilt weiter.
  Upload-Zugang PASS; neue Worker-Secrets zuletzt `[]`, keine Trainerbereitstellung,
  Produkt- oder Lernänderung. Dokumentationsbasis HEAD
  `32199454326441715f80eef99e71ec420d4dc57a`.

## Erhaltener Produktstand

Das bestehende Produkt `6b13780`, Cache v47, bleibt unter
`https://vokabeltrainer.marco-civico.workers.dev/trainer/` aktiv.
Es gab in diesem Einrichtungsschritt keine Produktänderung, Bereitstellung
oder Änderung von Lernbeständen. Der vorhandene Google-OAuth-Client bleibt
maßgeblich; keinen neuen Client erzeugen.

## Nächster konkreter Schritt

Die erneut angefragte Verfügbarkeit der gesicherten bestehenden Quelle des
`GOOGLE_CLIENT_SECRET` klären; Antwort steht aus. Der wirksame Google-Inhaberzugang
zum bestehenden Projekt ist inzwischen belegt. Für die persönliche Eingabe die
vorhandene passende Schlüsselquelle auf diesem Laptop verfügbar machen;
keine Schlüsseldatei in den Chat senden. Kein neues Projekt oder OAuth-Client.
Die genaue Übermittlung an ausschließlich den neuen Worker `app` ist bereits
freigegeben. Das frühere geschützte Eingabefenster ist geschlossen. Sobald die
passende Quelle verfügbar ist, die persönliche geschützte Eingabe erneut
vorbereiten; der Nutzer gibt den Schlüssel selbst ein. Bis eine passende
Quelle vorliegt, keine bestehende Google-Secret-Belegung blind deaktivieren,
löschen oder ersetzen und keinen neuen OAuth-Client erzeugen. Eine Änderung
bestehender Secrets ist durch die erteilte Übermittlungsfreigabe nicht beauftragt.
Die fehlende persönliche Quelle erfordert keine erneute Freigabe desselben Ziels.

Der frühere Versuch, die Google-Schlüsselübersicht auszulesen, war von der
automatischen Freigabeprüfung abgelehnt worden. Inzwischen öffnete der private
Inhaber den bestehenden Client; ausschließlich nicht geheime Beschriftungen
und Schaltflächenanzahlen wurden gelesen. Schlüsselwerte wurden nicht ausgelesen.
Erst nach persönlicher Eingabe der passenden Quelle und bestätigter Belegung
der beiden neuen Worker-Secrets das geprüfte Trainerpaket bereitstellen.
Startadresse für die später bereitgestellte Trainer-App ist
`https://app.lejeadventure.workers.dev/trainer/`.

Die neue Adresse besitzt eigene lokale Browserdaten. Eine einmalige PIN-
Einrichtung und Anmeldung mit dem bisherigen **Lernkonto** können nötig sein.
Vor dem Gerätewechsel ungesendete Änderungen an der bisherigen Adresse
abgleichen und anschließend den vorhandenen Lernbereich bewusst auswählen.
Keine Lernbestände in das Betreiberkonto verschieben.

## Nachweisgrenzen

Die Einladung ist angenommen; wirksamer Google-Inhaberzugang ist belegt. Cloudflare-Konto,
Subdomain, Worker-Startvorlage, D1-Struktur und neue Google-Adressen sind geprüft.
Upload-Zugang zum exakt bestätigten neuen Konto ist belegt; die letzte lesende
Secret-Namenprüfung war leer. Übermittlung inzwischen ausdrücklich freigegeben;
passende persönliche Quelle des bestehenden Google-App-Schlüssels auf diesem
Laptop fehlt, ist aber laut Nutzer gesichert vorhanden. Google-Anmeldung im
Leje-Konto, Projektzugriff und Einladungsannahme sind inzwischen belegt.
Worker-Secrets, Trainer-Bereitstellung, Trainer-Anmeldung und Bestandserhalt
unter der neuen Adresse sind noch nicht belegt.
Eine abgeschlossene Umstellung darf aus diesem Dokument nicht abgeleitet
werden. Bestehende physische Geräte-/Safari-Abnahme und der separate
Firefox-Offlinenachweis bleiben offen. Die Abendpause vom 01.10. ist seit der
ausdrücklichen Fortsetzung am 02.10. aufgehoben.
