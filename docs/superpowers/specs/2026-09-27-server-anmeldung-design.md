# Automatische Anmeldung: freigegebene lokale Vorbereitung

Stand 27.09.2026. Nutzerantwort A bestätigt die Vorbereitung einer kostenlosen
Cloudflare-Serverlösung. Vokabeln bleiben in Google Drive. Zunächst lokal mit
synthetischen Daten prüfen, keine kostenpflichtigen Angebote aktivieren.

## Ergebnis und Grenze

Eine optionale Servervariante stellt Trainer und API unter derselben
HTTPS-Adresse bereit. Nach einmaliger Google-Freigabe hält eine sichere
Serversitzung die Verbindung über Neuladen und Zugriffstokenablauf hinweg.
Refresh-Tokens verbleiben verschlüsselt auf dem Server. Bewusstes Trennen,
Widerruf und Sitzungsablauf erfordern wieder eine Anmeldung. Offlineübungen
bleiben unabhängig vom Server nutzbar.

Die bestehende lokale Browservariante bleibt der Standard. Dieses Paket
bereitet die Servervariante und ihre Prüfungen vor; eine echte Kontoanlage,
Google-Konfiguration, Veröffentlichung und iOS-Abnahme sind weitere Schritte.
Keine automatische Datenmigration zwischen Browserursprüngen. Ein zusätzlicher
bezahlter Tarif oder eine kostenpflichtige Domain wird nicht eingerichtet.

## Komponenten

- `server/`: eigenständige Fetch-Handler für Google-Code-Ablauf, Sitzung und
  begrenzten Drive-Proxy; Web-Crypto-Verschlüsselung und D1-Speicheradapter.
- `/api/auth/start` (POST): gleiche Herkunft prüfen, zufälligen Einmalzustand
  und PKCE erzeugen; Google-Adresse als JSON zurückgeben.
- `/api/auth/callback` (GET): Zustand und Browserbindung prüfen und einmalig
  verbrauchen, Code eintauschen, Drive-Berechtigung und Kontobindung prüfen;
  sichere Sitzung setzen und zu `/trainer/` zurückleiten.
- `/api/auth/session` (GET): vorhandene Sitzung wiederaufnehmen, kurz vor
  Tokenablauf serverseitig erneuern; nur Verbindungsstatus und öffentliche
  Konto-ID zurückgeben, keine Tokens.
- `/api/auth/logout` (POST): nur die angesprochene Serversitzung dauerhaft
  entfernen. Kein projektweiter Google-Widerruf und kein bedingungsloses Löschen
  des gemeinsamen Sitzungscookies: Eine verspätete Abmeldeantwort darf eine
  neuere Anmeldung im selben Browser nicht beeinträchtigen. Der alte Cookie
  ist nach dem Entfernen des Datensatzes ungültig; eine neue Anmeldung ersetzt ihn.
- `/api/drive/...`: nur erlaubte Drive-v2/v3-Pfade und Methoden weiterleiten;
  Zugriffstoken serverseitig setzen, ETag/If-Match und Drive-Status erhalten.
- `src/drive/server-auth.js`: optionaler Browseradapter. Er prüft beim Start
  die Sitzung und leitet Drive-Anfragen auf dieselbe Herkunft um. Die bisherige
  Browseranmeldung bleibt für normale lokale Starts unverändert.
- Ein separates Vorbereitungswerkzeug kopiert ausschließlich freigegebene
  Programmdateien in ein ignoriertes Ausgabeziel. Niemals Repositorywurzel,
  Berichte, persönliche Dateien oder Geheimnisse als Hostingverzeichnis verwenden.

## Verbindliche Grenzen

Node ab 22.8.0, JavaScript-Module, keine neue Produktionsbibliothek erforderlich.
Nur Scope `https://www.googleapis.com/auth/drive.file`. Kein Client-Secret oder
Refresh-/Zugriffstoken in Browserantworten, Programmdateien, Git, Backups oder Logs.
Servergeheimnisse werden später ausdrücklich außerhalb von Git konfiguriert.

Sitzung: zufälliger Cookie-Wert, im Speicher nur dessen Hash; Cookie `Secure`,
`HttpOnly`, `SameSite=Lax`, `Path=/`, höchstens 30 Tage. OAuth-Zustand: höchstens
10 Minuten, an einen gesonderten Browsercookie gebunden, atomar einmalig.
Mutation nur mit exakt passendem Origin und eigenem Anfrageheader. Kein
beliebiger Proxy, keine fremden Weiterleitungsziele und keine automatischen
Wiederholungen von Drive-Schreiboperationen bei unbekanntem Ausgang.
Token-/Sitzungsaktualisierungen erfolgen bedingt: paralleles Abmelden darf nicht
durch eine laufende Erneuerung rückgängig gemacht werden.

Die bestehende Konto-/Datensatzbindung, Hashprüfung, Kauf-ETags und dauerhaften
Aufträge bleiben unverändert. Kein Zugriff auf echte private Daten im lokalen Test.
Bei Netzwerkfehlern bleiben lokale Lernstände erhalten. Google-Widerruf verlangt
erneute Verbindung; ein vorübergehender Netzwerkfehler ist kein Widerruf.

Präzisierung aus der unabhängigen Prüfung: Googles
[Token-Widerruf](https://developers.google.com/identity/protocols/oauth2/web-server#tokenrevoke)
entzieht die projektweite Freigabe einschließlich der Tokens anderer Geräte.
Das passt nicht zur angekündigten Trennung dieser Sitzung. Normales Abmelden
entfernt daher nur deren gespeicherte Zugangsdaten. Ein ausdrücklich außerhalb
der App bei Google vorgenommener Widerruf wird weiterhin erkannt.

## Prüfungen und Einrichtung

Automatisiert prüfen: Anmeldung/Callback, falscher oder wiederholter Zustand,
Cookiebindung, Neuladen, Ablauf/Erneuerung, parallele Erneuerung und Abmeldung,
Widerruf, Netzfehler, Kontobindung, Proxyziele, Drive-Schreibstatus/If-Match,
Geheimnisfreiheit von Antworten sowie bisheriger lokaler Trainerbetrieb.

Vor echtem Betrieb: Cloudflare-Konto, kostenlose Adresse, D1 und Secrets,
passende Google-Redirect-Adresse und geeigneter OAuth-Status. Die sieben Tage
für Refresh-Tokens bestimmter Test-Apps sind keine dauerhafte Lösung. Ob der
kostenlose Ursprung für die konkrete Google-Konfiguration genügt, bleibt echt
zu prüfen. Danach zwei Geräte, Safari und Home-Bildschirm-App testen.
Quellen und Kostenrahmen stehen in der
[Untersuchungsübergabe](../../handoffs/2026-09-27-anmeldung-und-tempo.md).
