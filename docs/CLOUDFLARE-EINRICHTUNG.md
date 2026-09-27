# Optionale Serveranmeldung: Vorbereitung und private Einrichtung

Stand: 27.09.2026. Die bestehende lokale Trainer-App bleibt im Browsermodus.
Dieses Paket bereitet eine zusätzliche Variante mit automatischer
Google-Wiederaufnahme vor. Die geführte kostenlose Einrichtung für einen
privaten Test im Freundeskreis ist beauftragt und die App inzwischen unter
[Vokabeltrainer](https://vokabeltrainer.marco-civico.workers.dev/trainer/)
bereitgestellt. **Der Nutzer hat Google-Anmeldung und weiterhin aktive
Verbindung nach F5 bestätigt.** Tokenablauf und weitere Geräte bleiben offen.
Nach diesem Test ist Pause mit [Laptop-Übergabe](handoffs/2026-09-27-laptop-pause.md)
beauftragt. Auch der
private Betrieb benötigt eine erreichbare HTTPS-Adresse. Eine öffentliche
Produktvermarktung, eine Änderung der Repository-Sichtbarkeit oder der Lizenz
sind damit nicht beauftragt. Vokabeln, Lernstände und Käufe bleiben
in Google Drive; Cloudflare hält nur OAuth-Zustände und verschlüsselte
Serversitzungen. Die Freigabe gilt für Workers Free, ohne kostenpflichtigen
Tarif oder Domain. Maßgeblich sind die jeweils aktuellen Freigrenzen
([Workers](https://developers.cloudflare.com/workers/platform/pricing/),
[D1](https://developers.cloudflare.com/d1/platform/pricing/)).

## Nachweisstand der geführten Einrichtung am 27.09.2026

- Anhand der Einrichtungsansichten zunächst geprüft: Hello-World-Worker,
  D1-Tabellen und Indizes gemäß `server/schema.sql` sowie die Bindung `SESSIONS`.
- Vom Nutzer zunächst bestätigt: Worker-Logs ausgeschaltet, `APP_ORIGIN` und
  `GOOGLE_CLIENT_ID` eingetragen, beide Secrets gespeichert sowie beim
  vorhandenen Google-Client der HTTPS-JavaScript-Ursprung und die genaue
  Rücksprungadresse mit `/api/auth/callback` ergänzt. Die Geheimniswerte wurden
  nicht ausgelesen. Beim späteren Deploy zeigte die Remote-Konfiguration die
  Logs noch als aktiviert; die bestätigte Übernahme der lokalen Konfiguration
  setzte `observability.enabled` und die Logs auf `false`, vor dem ersten
  Google-Anmeldeversuch.
- Lokal geprüft: ignorierte `server/wrangler.local.jsonc` mit den tatsächlichen
  öffentlichen Konfigurationswerten und ohne Secret-Werte; Wrangler 4.142.0
  beendet den Dry-run aus `server/` erfolgreich. Das vorbereitete Paket enthält
  161 Dateien ausschließlich unter `src/` und `trainer/`; die frischen
  Servertests bestehen mit 24/24 Fällen.
- Ebenfalls geprüft: Die lokale Wrangler-Anmeldung ist erfolgreich; `whoami`
  bestätigt das vorgesehene Cloudflare-Konto. Die CLI-Zugangsdaten bleiben
  außerhalb des Repositorys.
- Echt bereitgestellt: Wrangler-Deploy mit Exitcode 0, aktive Version
  `45b6cb48-486f-45c1-8afc-4425206af8b6`, 161 öffentliche Dateien
  (155 hochgeladen, sechs inhaltsgleiche Dateien wiederverwendet).
  `preview_urls: false` in der lokalen Konfiguration erhält die bereits
  ausgeschalteten Vorschauadressen.
- Über Cloudflare geprüft: aktive Version mit `ASSETS`, `SESSIONS`, zwei
  Variablen und zwei Secrets vom Typ `secret_text`; nur Secret-Namen und Typen
  wurden abgefragt. Eine lesende D1-Schemaabfrage bestätigt zwei Tabellen und
  zwei Indizes, ohne Datenbankänderung.
- Über die echte HTTPS-Adresse geprüft: `/trainer/` liefert HTML mit Status
  200, `/src/trainer/config.js` den Servermodus und `/api/auth/session` Status
  200 mit `{"connected":false}` sowie `Cache-Control: no-store`.
  `/server/worker.js`, `/docs/ANFORDERUNGEN.md`, `/.git/config` und `/` liefern
  jeweils 404.
- Späterer realer Nutzertest: App unter der HTTPS-Adresse eingerichtet, Google-
  Anmeldung durchgeführt, zum Trainer ohne Fehlermeldung zurückgekehrt und nach
  F5 weiterhin aktive Verbindung bestätigt. Keine Namen, PINs oder Sitzungswerte
  wurden zur Dokumentation ausgelesen. Dieser Nutzerbericht ist unabhängig von
  den vorherigen unangemeldeten HTTP-Prüfungen.
- Noch offen: automatische Token-Erneuerung nach Ablauf, Browserneustart,
  vorhandenen Drive-Lernbereich bewusst auswählen, Zweitgerät und Apple-Abnahme.
  Diese Tests werden nach der verlangten Pause gemeinsam fortgesetzt.

Weitere Einzelheiten und Fehlerbefunde stehen in der
[Einrichtungsfortsetzung der Übergabe](handoffs/2026-09-27-anmeldung-und-tempo.md#fortsetzung-der-geführten-privaten-einrichtung-am-27092026).

## Lokal vorbereiten und prüfen

Voraussetzung ist Node.js ab 22.8.0. Aus der Repositorywurzel:

```sh
npm run prepare:cloudflare
```

Das Werkzeug nimmt ausschließlich die explizite öffentliche Dateiliste des
lokalen Servers: `trainer/`, `src/trainer/` und `src/drive/`. Es erstellt
`.cloudflare/public/` und setzt **nur in dessen Kopie** von
`src/trainer/config.js` `authMode` von `browser` auf `server`. Wenn diese
Umschaltung nicht eindeutig ist, eine Quelldatei fehlt, ein Pfad über einen
Symlink beziehungsweise eine Junction ausbricht oder im Ausgabeordner eine
unbekannte Datei liegt, bricht es ab. Ein erneuter Lauf aktualisiert nur
freigegebene Dateien. Unbekannte Dateien werden nicht gelöscht oder
mitveröffentlicht. Als Kontrolle dürfen im Ausgabeordner oben nur `trainer/`
und `src/` liegen. Repositorywurzel, `server/`, Berichte, Backups und private
Dateien sind kein Hostingverzeichnis.

Die Ausgabe sowie lokale Wrangler-Dateien und `.dev.vars*` sind in Git
ignoriert. Das öffentliche Paket enthält weiterhin Programmcode und die
ohnehin öffentliche OAuth-Client-ID; es darf keine privaten Zugangsdaten
enthalten. Der lokale Start mit `npm start` verwendet weiter den Browsermodus.
Ein neues Browserprofil oder eine neue HTTPS-Adresse hat eigene lokale
Browserdaten. Die Vorbereitung verschiebt oder löscht keinen Lernstand.

## Betreiber-Einrichtung

Die folgende Anleitung gilt für die bestätigte private Einrichtung. Bereits
belegte Schritte müssen nicht erneut angelegt werden. Die Namen und
Oberflächen der Anbieter können sich ändern.

1. Im kostenlosen Cloudflare-Konto eine Workers-Adresse und eine D1-Datenbank
   für Sitzungen vorsehen. Vor dem Anlegen die aktuellen
   [Workers](https://developers.cloudflare.com/workers/platform/pricing/)- und
   [D1-Freigrenzen](https://developers.cloudflare.com/d1/platform/pricing/)
   prüfen. Die D1-Tabellen entsprechen [server/schema.sql](../server/schema.sql).
   Cloudflare dokumentiert das Anlegen und Binden einer D1-Datenbank in der
   [D1-Anleitung](https://developers.cloudflare.com/d1/get-started/).
2. [server/wrangler.example.jsonc](../server/wrangler.example.jsonc) lokal als
   `server/wrangler.local.jsonc` kopieren. Den Worker-Namen, die **tatsächliche**
   HTTPS-Adresse in `APP_ORIGIN`, die vorhandene öffentliche
   `GOOGLE_CLIENT_ID` aus `src/trainer/config.js` und die D1-ID eintragen.
   Für den vorhandenen Worker zusätzlich `preview_urls: false` in die lokale
   Konfiguration aufnehmen, damit die bereits deaktivierten Vorschauadressen
   beim Deploy deaktiviert bleiben. Diese Ergänzung ist lokal vorgenommen;
   sie steht nicht in der ursprünglichen Beispielkonfiguration.
   Platzhalter dürfen nicht stehen bleiben. `main` und `assets.directory`
   beziehen sich auf den Speicherort der Konfiguration unter `server/`:
   `./worker.js` beziehungsweise `../.cloudflare/public`. Dagegen bezieht sich
   `build.cwd: ".."` in Wrangler 4.142.0 auf dessen **Startverzeichnis**.
   Wrangler deshalb aus `server/` aufrufen, wie unten gezeigt. Der Build-Hook
   startet dann vor `wrangler dev` oder `deploy` aus der Repositorywurzel erneut
   `npm run prepare:cloudflare`. Wenn das Staging wegen unbekannter Dateien
   abbricht, darf Wrangler den vorhandenen Ausgabeordner nicht hochladen
   ([Cloudflare-Builds](https://developers.cloudflare.com/workers/wrangler/custom-builds/)).
3. Für denselben vorhandenen Google-Web-OAuth-Client den neuen HTTPS-Ursprung
   und exakt dessen Adresse mit `/api/auth/callback` als
   Redirect-URI prüfen und gegebenenfalls eintragen. Dabei denselben Client
   und dasselbe gemeinsame Google-Konto beibehalten. Ein neuer Client kann bei
   `drive.file` die Erreichbarkeit vorhandener App-Dateien ändern; eine
   automatische Migration wird nicht behauptet. Die bestehenden lokalen
   Bindungen und Drive-IDs zuerst sichern und den bisherigen Zugang erhalten.
   Siehe [Google-Einrichtung](GOOGLE-DRIVE-EINRICHTUNG.md) und Googles
   [Webserver-OAuth-Ablauf](https://developers.google.com/identity/protocols/oauth2/web-server).
4. `GOOGLE_CLIENT_SECRET` und `SESSION_ENCRYPTION_KEY` ausschließlich als
   Cloudflare-Secrets eintragen, niemals in `vars`, Git, Chat, Screenshots oder
   Browsercode. Der Schlüssel muss aus 32 zufälligen Bytes in normaler
   Base64-Darstellung bestehen; er schützt gespeicherte Token per AES-GCM.
   Für lokale Wrangler-Proben dürfen Secrets nur in einer ignorierten
   `server/.dev.vars*`-Datei neben der Wrangler-Konfiguration stehen. Die
   Vorlage benennt beide Pflicht-Secrets ohne Werte. Cloudflare beschreibt die
   [Secret-Verwaltung](https://developers.cloudflare.com/workers/configuration/secrets/).
5. Die Datenbanktabellen aus `server/schema.sql` einrichten, die
   Beispielkonfiguration auf Platzhalter prüfen und erst danach den bestätigten
   privaten Test unter der echten Adresse durchführen. Die Vorlage
   setzt `assets.run_worker_first: true`: Jede Anfrage durchläuft den Worker,
   der `/api/` von den ausdrücklich erlaubten statischen Pfaden trennt.
   Dadurch können auch statische Abrufe das Worker-Kontingent nutzen.
   Ein SPA-Fallback, der API-Pfade als HTML ausliefert, ist nicht vorgesehen
   ([Cloudflare-Asset-Routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)).

## Wrangler prüfen und bereitstellen

Aus der Repositorywurzel zuerst nach `server/` wechseln. Die Versionsangabe
verwendet das tatsächlich geprüfte Wrangler; es ist keine dauerhafte
Projektabhängigkeit nötig. Die folgenden Befehle dokumentieren den
Einrichtungsablauf; Dry-run, Anmeldung und Deploy sind inzwischen bestätigt.
Eine bereits gültige Anmeldung muss nicht wiederholt werden:

```sh
cd server
npx wrangler@4.142.0 deploy --config wrangler.local.jsonc --dry-run --keep-vars
npx wrangler@4.142.0 login --use-keyring --scopes account:read user:read workers_scripts:write d1:write
npx wrangler@4.142.0 deploy --config wrangler.local.jsonc --keep-vars
```

Den echten Deploy erst nach erfolgreichem Dry-run und erfolgreicher Anmeldung
ausführen. `--keep-vars` erhält zusätzliche im Dashboard gesetzte Variablen;
die ausdrücklich in der lokalen Konfiguration enthaltenen Werte müssen trotzdem
stimmen. Bereits beim Worker gespeicherte Secrets bleiben bei Wrangler-Deploys
erhalten und gehören nicht als Werte in diese Datei. Der Build-Hook bleibt
aktiv; ein fehlgeschlagenes Staging darf nicht umgangen werden.
`observability.enabled: false` bleibt ebenfalls gesetzt.

Die Anmeldung verwendet nur die genannten Berechtigungen sowie das von Wrangler
ergänzte `offline_access`. `--use-keyring` schützt die lokale CLI-Ablage mit dem
Anmeldeinformationsspeicher des Betriebssystems. Unter Windows wurde die dafür
benötigte Unterstützung `@napi-rs/keyring` 1.3.0 beim ersten interaktiven Aufruf
eingerichtet; sie ist keine Abhängigkeit der App.

Ein Aufruf aus der Repositorywurzel mit lediglich
`--config server/wrangler.local.jsonc` ist mit dieser Vorlage falsch: Der
Build-Hook startet dann eine Ebene oberhalb des Repositorys. Genau dieser Fehler
wurde mit Wrangler 4.142.0 reproduziert; der Dry-run aus `server/` war erfolgreich.

Die App liegt unter dem Pfad `/trainer/`; die bloße Ursprungsadresse `/` liefert
absichtlich 404. Die oben protokollierten echten HTTP-Prüfungen bestätigen die
Auslieferung im Servermodus, den unangemeldeten Sitzungsstatus und die gesperrten
internen Pfade. Der Sitzungsabruf ohne Cookie prüft noch keinen Datenbankzugriff
oder Google-Login; der separate D1-Nachweis prüft nur das Schema.

Die Vorlage setzt `observability.enabled` ausdrücklich auf `false`, damit
automatische Worker-Logs insbesondere OAuth-Callback-Adressen nicht speichern.
Für neue Worker ist diese Protokollierung nach
[Cloudflare-Konfiguration](https://developers.cloudflare.com/workers/wrangler/configuration/)
sonst standardmäßig aktiv. Zusätzliche Betreiber-Logs dürfen keine
OAuth-Codes, Cookies oder Tokens erfassen.

Google kann Refresh-Tokens einer externen OAuth-App im Teststatus nach sieben
Tagen ablaufen lassen. Für dauerhafte Nutzung ist der tatsächliche
OAuth-Status mit Zielgruppe und Scope zu prüfen; eine pauschale Ausnahme von
Google-Verifizierung oder die Eignung jeder kostenlosen `workers.dev`-Adresse
ist hier nicht nachgewiesen
([Google-OAuth-Regeln](https://developers.google.com/identity/protocols/oauth2),
[Google-Richtlinien](https://developers.google.com/identity/protocols/oauth2/policies)).
Bei einer späteren Google-Trennung über die App wird nur diese Serversitzung
entfernt. Ein direkt bei Google vorgenommener Widerruf kann die Freigabe auf
anderen Geräten mitbetreffen.

## Nachweis vor Familienbetrieb

Zunächst mit synthetischen Daten prüfen: Anmeldung, Neuladen, normalen
Zugriffstokenablauf, ausdrückliches Abmelden, Netzfehler und Wiederkehr,
Kontobindung, vorhandenen Drive-Bestand und unveränderte Offlineübungen.
Danach denselben Bestand auf zwei physischen Geräten prüfen, darunter Safari
auf iPhone/iPad und die Home-Bildschirm-App. Ein neuer Ursprung übernimmt
keine IndexedDB-Daten des alten Ursprungs. Vor einem Wechsel eine
App-Datensicherung anlegen, den vorhandenen Google-Lernbereich bewusst
wieder auswählen und keine Browserdaten zur vermeintlichen Reparatur löschen.
Automatisierte Browser- und Servertests ersetzen diese Geräte- und
Google-Prüfungen nicht.
