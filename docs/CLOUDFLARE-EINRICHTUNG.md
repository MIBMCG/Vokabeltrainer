# Optionale Serveranmeldung: lokale Vorbereitung und spätere Einrichtung

Stand: 27.09.2026. Die bestehende lokale Trainer-App bleibt im Browsermodus.
Dieses Paket bereitet eine zusätzliche Variante mit automatischer
Google-Wiederaufnahme **lokal** vor. Es legt weder ein Cloudflare-Konto noch eine
Datenbank an und veröffentlicht keine App. Eine spätere Nutzung ist zunächst nur
im Freundeskreis geplant; auch dafür braucht die Servervariante eine erreichbare
HTTPS-Adresse. Vokabeln, Lernstände und Käufe bleiben
in Google Drive; Cloudflare hält nur OAuth-Zustände und verschlüsselte
Serversitzungen. Die Freigabe gilt für Workers Free, ohne kostenpflichtigen
Tarif oder Domain. Preise und Freigrenzen müssen vor einer echten Einrichtung
nochmals geprüft werden ([Workers](https://developers.cloudflare.com/workers/platform/pricing/),
[D1](https://developers.cloudflare.com/d1/platform/pricing/)).

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

## Spätere Betreiber-Einrichtung

Diese Schritte sind eine Anleitung für eine gesondert freigegebene echte
Einrichtung. Die Namen und Oberflächen der Anbieter können sich ändern.

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
   Platzhalter dürfen nicht stehen bleiben. `main` und `assets.directory`
   beziehen sich auf den Speicherort der Konfiguration unter `server/`:
   `./worker.js` beziehungsweise `../.cloudflare/public`. Der Build-Hook
   startet vor `wrangler dev` oder `deploy` aus der Repositorywurzel erneut
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
   Beispielkonfiguration auf Platzhalter prüfen und erst danach einen
   gesondert autorisierten Test unter der echten Adresse planen. Die Vorlage
   setzt `assets.run_worker_first: true`: Jede Anfrage durchläuft den Worker,
   der `/api/` von den ausdrücklich erlaubten statischen Pfaden trennt.
   Dadurch können auch statische Abrufe das Worker-Kontingent nutzen.
   Ein SPA-Fallback, der API-Pfade als HTML ausliefert, ist nicht vorgesehen
   ([Cloudflare-Asset-Routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)).

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
