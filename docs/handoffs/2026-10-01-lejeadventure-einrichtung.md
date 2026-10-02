# Übergabe: LejeAdventure-Einrichtung

**Aktuelle Fortsetzung am 02.10.2026:** Die bestätigten Informationsseiten und
Google-Verbindungslinks sind als Produkt `c39edd8`, Cache v48, integriert und
nur unter `https://app.lejeadventure.workers.dev/trainer/` bereitgestellt.
Worker-Version `16721aab-dc02-4959-9900-c204f3727e04` ist zu 100 Prozent aktiv;
391 öffentliche Dateien bytegleich geprüft, drei Infoseiten ohne Anmeldung
erreichbar und fünf interne Pfade gesperrt. Alte App bleibt auf v47.
Tasks 1–3 sind technisch abgeschlossen: Google-Rückkehr, bewusste Übernahme,
vollständiger Abgleich und Wiederaufnahme waren belegt; keine neue Drive-Root.
Der Nutzer bestätigt zwischenzeitliche Änderungen und erklärt damit die spätere
Profilauswahl; kein Fehlerbefund. Nach persönlichem PIN-Öffnen sind neue UI-Links,
aktive Google-Verbindung und vollständiger Abgleich im bestehenden Chrome belegt.
Kein beobachteter Updateklick; persönliche Altvergleichsantwort historisch offen.
Task 4: Regulärer Google-Zugang ohne Testnutzerliste und drei Infoseiten sind
ausdrücklich bestätigt. Branding mit den echten Seitenadressen gespeichert.
Nach „Ja, jetzt veröffentlichen“ ist Google-Zugang tatsächlich aktiviert:
**In Produktion**, Typ **Extern**. Echte Freundes-Erstanmeldung bleibt offen.
Bestände, Anmeldefunktion und Secrets durch das Infopaket unverändert.
Physische iPad-/Safari-Abnahme und natürlicher Tokenablauf offen. Keine neue Pause.
Nachweise, Grenzen und nächster Schritt sind unten dokumentiert.

**Historischer Zwischenstand am 02.10.2026 vor der gezielten Secret-Korrektur:** Keine Pause; bisherige App v47 erhalten.
Wirksamer Google-Inhaberzugang und Upload-Zugang zum neuen Konto sind belegt.
Nach persönlicher Meldung „ClientID kopiert und im Terminal eingefügt“ zeigt
Worker `app` jetzt `GOOGLE_CLIENT_SECRET` und `SESSION_ENCRYPTION_KEY` als `secret_text`.
Werte wurden nicht gelesen oder validiert; eine Client-ID könnte als Secret
angenommen worden sein. Terminal-Abschlussmeldung angefragt, Antwort offen.
Task 2 bleibt offen. Erstbelegung nicht erneut ausführen; vorhandenen Sitzungsschlüssel
behalten. Nach Klärung gegebenenfalls nur den Google-Secret-Wert gezielt korrigieren.
Kein Deploy, keine Löschung/Überschreibung; Produkt und Lernbestände erhalten.
Nachweise, Grenzen und nächster Schritt sind unten dokumentiert.
Damals durchgeführte Prüfung: geprüfte Helfer- und Konfigurationshashes unverändert MATCH.
Keine laufenden `setup-secrets`-/`deploy-token`-Prozesse gefunden; nur gefilterte
Prozessmetadaten gelesen. Die echte lesende Secret-Namenprüfung über
`deploy-token.ps1 -Action Secrets` bestätigt beide Namen am Worker `app` im Konto
`2531040d13ab47effa73e2124bd6e912`, jeweils Typ `secret_text`. Keine Werte gelesen.
Der Erstbelegungshelfer akzeptiert jede nicht leere Eingabe; ein unabhängiger
Reviewer bestätigt, dass auch eine Client-ID als Secret angenommen würde.
Dies belegt einen möglichen falschen Wert, keinen nachgewiesenen Inhalt.

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

- **Gezielte Secret-Korrektur und Bereitstellung am 02.10.2026:** Die persönliche
  Korrekturausführung endete mit Exitcode 0. Ein vorheriger Pfadquotierungsversuch
  endete mit Exitcode 1 und wurde durch die erfolgreiche Ausführung ersetzt.
  Die vorhandene JSON-Quelle wurde auf `web.client_id` passend zum bestehenden
  OAuth-Client und vorhandenes `web.client_secret` validiert. Ausschließlich
  `GOOGLE_CLIENT_SECRET` am neuen Worker wurde geschrieben; vorhandener
  `SESSION_ENCRYPTION_KEY` erhalten. Keine Secretwerte in Dokumentation.
- Korrekturhelfer final SHA-256
  `2BCB15ED8C4A1372B759B2F3E3669360E2E48AC0C7F1666BBE9F80AAB5B20A15`;
  unabhängige Spec- und Quality-Nachprüfung PASS, 75 Korrekturtests plus 30
  bisherige synthetische Tests und AST mit null Parsefehlern. Diese Prüfungen
  belegen noch keine tatsächliche Google-OAuth-Akzeptanz.
- Tatsächlicher Deploy an Worker `app`, Konto
  `2531040d13ab47effa73e2124bd6e912`, Exitcode 0; Version
  `6cb68583-879f-4211-93cc-9ec11d144feb`. Frische Deploymentliste bestätigt die
  neueste Version zu 100 Prozent aktiv, Autor `lejeadventure@gmail.com`.
- Öffentliche Prüfung am `2026-10-02T14:53:21.821Z`: alle 387 ausgelieferten
  Dateien bytegleich zum unveränderten Staging von Produkt `6b13780`, Cache v47.
  Anonymer `/api/auth/session` liefert HTTP 200, unangemeldeten Status und
  `no-store`; fünf Kern-Dateien zusätzlich bytegleich. Wurzel-, Server-, Docs-
  und Git-Pfade HTTP 404; zusätzliche HEAD-Prüfungen für `.superpowers`,
  `.cloudflare` und `backups` HTTP 404. Alte Trainer-Adresse per HEAD HTTP 200.
  Der erste Node-Aufruf scheiterte an der Standard-CA; erneute Prüfung mit
  `node --use-system-ca` PASS. Zertifikatsprüfung wurde nicht deaktiviert.
- **Historischer Zwischenstand vor der Google-Rückkehr und Übernahme:** Chrome zeigt die tatsächliche neue `/trainer/`-Adresse mit frischer Startmaske.
  Ein neutrales temporäres, ungebundenes Startprofil mit zwei Wortpaaren ist
  vorausgefüllt. Persönliche PIN-Eingabe und Google-Anmeldung mit dem bisherigen
  privaten Lernkonto sind angefragt und laufen beim Nutzer. Vor Drive-Bindung
  bleiben Startdaten lokal; kein neuer Drive-Lernbereich. Echte Google-Rückkehr,
  bewusste Übernahme des bestehenden Lernbereichs sowie Punkte/Bestand nach
  vollständigem Abgleich und Reload sind weiterhin offen (Task 3).

## Erhaltener Produktstand

Produkt `6b13780`, Cache v47, ist unverändert an der bisherigen Adresse erhalten.
Die abgeschlossenen Umzugsschritte 1–3 stellten dasselbe Produkt zusätzlich
unter `https://app.lejeadventure.workers.dev/trainer/` bereit. Das separat
bestätigte Infopaket in Task 4 ist jetzt dort als Produkt `c39edd8`, Cache v48,
aktiv. Es ergänzt nur drei Informationsseiten, ihre gemeinsame CSS, öffentliche
Aufnahme und UI-Links samt Cacheupdate. Anmeldefunktion, Secrets und vorhandene
Lernbestände sind dadurch unverändert. Bisheriger Google-OAuth-Client und privater
Inhaber bleiben erhalten. Persönlicher Altbestandsvergleich weiterhin offen.

## Nächster konkreter Schritt

Der Nutzer bestätigt die alte Adresse als vollständig abgeglichen. Nach lesender
Vorschau führte der Hauptagent die bewusste Bestätigung „Lernbereich verwenden“
im Rahmen der ausdrücklich genehmigten vorherigen Bereichsauswahl aus.
Die tatsächliche Übernahme ist beendet: neue Adresse zeigt verbundenen Lernbereich,
aktive Google-Verbindung und „Abgeglichen“ / „Vollständig abgeglichen“.
Lokale Startdaten sind ersetzt; keine neue Drive-Root angelegt.

Beim Umstieg waren Reload und Wiederaufnahme abgeschlossen. Level, Punkte, Besitz und
Auswahl stimmen mit dem zuvor beobachteten Zustand an der neuen Adresse überein.
Der Nutzer hat die PIN persönlich erneut geöffnet; Profil, Lektionen und aktive
Wörter sind wieder sichtbar. Einstellungen zeigen weiterhin aktive Google-
Verbindung und vollständigen Abgleich ohne erneute Google-Anmeldung.

Die damalige persönliche Altvergleichsfrage ist weiterhin historisch unbeantwortet.
Die damalige Stabilität nach Reload bleibt belegt; spätere Werte nicht mit dem
früheren Zustand gleichsetzen. Tasks 1–3 sind technisch abgeschlossen.
Die gezielte Secret-Korrektur und Bereitstellung ohne neuen Befund nicht wiederholen.

Spätere aktuelle Profilauswahl: zwei Profile mit Level 1/null Punkten statt
des zuvor beobachteten einen Profils mit höherem Stand, bereits vor einem
Updateklick. Der Nutzer bestätigt **„Ja, ich habe Änderungen vorgenommen“**;
damit ist die Änderung erklärt, kein Fehler- oder Datenverlustbefund.
Das v48-Updateangebot erschien nach Navigation und verschwand während anderer
Arbeit. Der anschließende Klick fand keinen Button und wurde nicht ausgeführt.
Nach persönlichem PIN-Öffnen sind unter Einstellungen → Google-Verbindung
**Vollständig abgeglichen**, **Google-Verbindung aktiv** und beide neuen
Informationslinks zu den genauen Infoadressen sichtbar. Der tatsächliche
Zustand nach Übernahme ist damit im bestehenden Chrome ohne neue Google-
Anmeldung geprüft; beide aktuellen Profile bleiben erhalten. Kein beobachteter
**Jetzt aktualisieren**-Klick und keine Bestandsänderung durch den Hauptagenten.

Das bestätigte Infopaket ist umgesetzt, geprüft und am neuen Worker aktiv; seine
Seitenadressen sind im Google-Branding gespeichert. Nach der ausdrücklich
bestätigten Google-Veröffentlichung ist regulärer Zugang ohne Testnutzerliste
aktiviert. Nächster Praxisnachweis ist die echte Erstanmeldung des Freundes
an der neuen Adresse mit seinem eigenen Google-Konto; iPad-/Safari-Abnahme
bleibt davon getrennt. Noch keinen erfolgreichen Freundeszugang behaupten.
Produkt-/Dokumentationssicherung auf beiden bestehenden GitHub-Zweigen abschließen.
Keine neue Pause; physische iPad-/Safari-Abnahme und natürlicher Tokenablauf separat offen.

### Historischer Befund: Google-Testzugang des Freundes

Der Freund erhält am Apple-iPad Google `403 access_denied` mit dem Hinweis,
dass nur genehmigte Tester zugelassen sind. Frisch im bestehenden Projekt unter
Google Auth Platform / Zielgruppe geprüft: Status **Test**, Typ **Extern**,
bislang genau ein Testnutzer (bestehendes privates Lernkonto). Das Leje-
Betreiberkonto ist kein Testnutzer. Das vom Freund gemeldete Anmeldebild zeigt
dieses Betreiberkonto; der Nutzer ist gefragt, welches persönliche Google-Konto
der Freund verwenden möchte. Diese Kontoabfrage ist durch die inzwischen gewählte reguläre Freigabe ohne Testnutzerliste überholt. Keine privaten Testnutzeradressen
oder Bestandsdaten in dieser Dokumentation.

Keine Testnutzerfreigabe geändert, keine App veröffentlicht und kein neuer
OAuth-Client angelegt. Der Befund belegt eine Google-Testzugangsbegrenzung;
eine technische iPad-Ursache ist nicht nachgewiesen. Physische iPad-Abnahme
bleibt offen. Aktuelle Startanleitung/Dokumentenprüfung PASS: `check:docs`,
1.153 geprüfte Links, null Fehler. Dieser Task-3-Zwischenstand ist inzwischen als
Checkpoint `2933a45` auf beiden bestehenden GitHub-Zweigen exakt gesichert.

### Gewählter regulärer Google-Zugang (Task 4)

Der Nutzer wählt ausdrücklich regulären Zugang ohne Testnutzerliste. Eine einzelne
Freundesadresse ist dafür nicht mehr erforderlich; keine Testnutzer hinzugefügt.
Der begrenzte Designvorschlag wurde am 02.10.2026 mit „Ja, so umsetzen“ bestätigt.
Drei statische Seiten unter `/trainer/info/` und eine gemeinsame CSS sind erstellt:

- [Über LejeAdventure](https://app.lejeadventure.workers.dev/trainer/info/): Appbeschreibung und Trainerlink.
- [Datenschutz](https://app.lejeadventure.workers.dev/trainer/info/datenschutz.html): tatsächliche lokale Speicherung, Google Drive mit `drive.file`, Worker-Vermittlung, Sitzungsdaten und verschlüsselte Zugriffs-/Erneuerungstokens in D1 sowie getrennte Schritte für Trennen, Widerruf und Datenentfernung.
- [Nutzungsbedingungen](https://app.lejeadventure.workers.dev/trainer/info/nutzung.html): kostenlose Nutzung, fiktive Punkte, eigene Google-Konten, lokale PIN, Sicherungen und Leje-Kontakt.

Die Seiten enthalten keine Skripte, Tracker, externen Fonts oder Formulare.
Unter Google-Verbindung öffnen **Über LejeAdventure** und **Datenschutz** vor
und nach Verbindung einen separaten Tab. Öffnen erhält ungespeicherte Eingaben
und den lokalen Produktzustand. Keine Änderung von Anmeldung, Lernen, Käufen,
Abgleich, Bestandsformaten oder Secrets. Die sachlichen Informationen sind kein
Nachweis juristischer Vollständigkeit.

Prüfstand: 666/666 vollständige Node-Tests und drei Update-/Sitzungsbrowserfälle
PASS vor dem letzten reinen CSS/H1-Nachschliff. Danach frisch 28/28 gezielte
Tests, sechs große Layoutansichten bei 320/390 Pixeln und 200 Prozent Schrift,
drei normale Ansichten sowie zwei Linkfälle PASS. Beide unabhängigen Reviews
und die enge finale Nachprüfung PASS. Automatisierte Edge-Prüfungen mit
synthetischen Sitzungen ersetzen weder Google-Freigabe noch Safari/iPad-Abnahme.

Produktcommit `c39edd8ac0d49caea0761f885ff9bc7511d846a5` ist im Entwicklungszweig
integriert und nur an Worker `app` im Leje-Konto bereitgestellt. Cache v48;
Worker-Version `16721aab-dc02-4959-9900-c204f3727e04` seit
`2026-10-02T16:09:00.886Z` zu 100 Prozent aktiv. Öffentliche Prüfung am
`2026-10-02T16:09:40.106Z`: 391/391 Dateien bytegleich zum geprüften Paket,
drei Infoseiten ohne Anmeldung HTTP 200, fünf interne Pfade HTTP 404,
anonymer `/api/auth/session` HTTP 200 mit `false` und `no-store`.
Alte App bleibt auf Cache v47. Keine echten Bestände oder Secrets geändert.

Google-Branding ist frisch gespeichert; Google bestätigt „Branding-Änderungen
gespeichert“: Appname **LejeAdventure**, Supportadresse des Leje-Betreiberkontos,
Startseite `https://app.lejeadventure.workers.dev/trainer/info/`, Datenschutz
`https://app.lejeadventure.workers.dev/trainer/info/datenschutz.html` und Nutzung
`https://app.lejeadventure.workers.dev/trainer/info/nutzung.html`. Leje-Adresse
als Entwicklerkontakt ergänzt; bisheriger Kontakt und Domains erhalten.

Der Nutzer hat die konkrete Handlungspunktfrage mit **„Ja, jetzt veröffentlichen“**
beantwortet. Der Hauptagent hat **App veröffentlichen** und im anschließenden
Dialog **Bestätigen** ausgeführt. Der Dialog nennt die allgemeine Öffnung und
Prüfungspflicht bei Logo, mehr als zehn Domains oder sensitiven Scopes; keine
neuen Vertragsbedingungen. Die frisch gelesene Google-Seite zeigt jetzt
Veröffentlichungsstatus **In Produktion**, Nutzertyp **Extern** und den Knopf
**Zurück zum Test**. Damit ist der reguläre Google-Zugang ohne Testnutzerliste
tatsächlich aktiviert. Das belegt keine pauschale Zugangsgarantie, Entfernung
jeder Nutzerobergrenze oder erfolgreiche Freundes-Erstanmeldung.

Gitstand: Checkpoint `2933a45` bereits auf beiden bestehenden Zweigen exakt
gesichert. Neues Produkt `c39edd8` integriert, aber noch nicht auf GitHub
gesichert; aktueller Dokumentationsnachtrag ebenfalls noch ungesichert.
Private Prüfaufnahmen und Logs bleiben außerhalb der getrackten Dokumentation.

## Nachweisgrenzen

Tasks 1–3 sind technisch abgeschlossen: wirksamer Betreiberzugang, gezielte
Google-Secret-Korrektur, aktive getrennte Bereitstellung, öffentliche Bytegleichheit
und gesperrte interne Pfade sind belegt. Echte Google-Rückkehr, aktive
Verbindung, bewusste Übernahme des bestehenden Lernbereichs und vollständiger
Abgleich sowie Reload/Wiederaufnahme sind belegt. Task 4: bestätigte Infoseiten,
UI-Links, Bereitstellung v48 und gespeichertes Branding sind belegt.
Die damalige persönliche Altvergleichsantwort fehlt historisch; spätere
Profiländerungen sind vom Nutzer bestätigt und erklärt. Der tatsächliche
v48-UI-Zustand mit neuen Links und aktiver Google-Verbindung samt vollständigem
Abgleich ist im bestehenden Chrome geprüft. Echte Freundes-Erstanmeldung bleibt offen.
Die Google-Veröffentlichung ist ausgeführt und regulärer Zugang aktiviert.
Physische Geräte-/Safari-Abnahme, natürlicher Tokenablauf und separater Firefox-Offlinenachweis
bleiben offen. Keine neue Pause.
