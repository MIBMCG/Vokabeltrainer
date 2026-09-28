# Fortsetzung auf dem Laptop

Stand: **28.09.2026**. Zweig: `codex/vokabeltrainer-v1`.

## Aktueller Nachtrag: Tempopaket und zweiter realer Kauf

Der Nutzer hat die begrenzte Beschleunigung mit „ja, beschleunige so gut es
geht“ beauftragt. Auf Basis `e3933fc` wurde Produktcommit
`ad96f00390243cbda94a825d278650b1efa682d7` per Fast-Forward integriert.
Final bestanden 624/624 Node-Tests, 8/8 ausgewählte Browserfälle und ein
unabhängiges Review mit PASS. Die synthetische Vollprobe zählt 55 statt 63
HTTP-Anfragen für die Vorschau und 139 statt 234 für die Bestätigung.
Cache v31 wurde privat bereitgestellt; die aktive Worker-Version
`a573d6f3-ecf5-42a8-82e9-2b59f66eca20` stand seit
28.09.2026, 17:36:18 UTC zu 100 % bereit. Neun öffentliche Dateien wurden
bytegleich mit dem geprüften Paket verglichen. Produktcommit `ad96f00` ist
exakt mit GitHub abgeglichen; dieser Dokumentationsnachtrag wird separat
gesichert.

Im getrennten Codex-Browser wurde „Jetzt aktualisieren“ angenommen. Ohne neue
Google-Anmeldung während Update und Kauf wurde „Einfacher Drache – Stufe 3“
für 400 Punkte gekauft. Die Vorschau erschien nach 20,838 Sekunden; nach
24,356 Sekunden lief die Bestätigung noch, nach 43,891 Sekunden war sie
sichtbar. Stufe 3 wurde bewusst ausgewählt. Nach Neuladen bestätigte der DOM
Stufe 3 als „Deine ausgewählte Figur“, 1.000 verfügbare Punkte, unverändert
1.600 Lernpunkte und Level 9. Das ist eine einzelne UI-Beobachtung mit anderer
Stufe und Vorgeschichte, kein kontrollierter A/B-Vergleich; der Nutzer hat das
Tempo noch nicht abgenommen. Unmittelbar nach diesem Neuladen erschien „Google erneut
verbinden“. Die anschließende UI-Abfrage endete ohne Ergebnis durch Tool-
Timeout; der aktuelle Google-Status ist offen. Regulärer Tokenablauf,
Zweitgerät und Apple-Abnahme bleiben offen. Familien-Chrome und bestehende
Drive-Bestände blieben unangetastet. Die bereits eingerichteten 1.000 Punkte
reichen für einen Test der Stufe 4 für 800 Punkte; Einrichtung und Import nicht
wiederholen. Nächster Schritt ist die Nutzerrückmeldung zum verbesserten Tempo.
Für eine weitere größere Optimierung zuerst Restlatenz konkret diagnostizieren
und ein Design abstimmen. Alle Nachweisgrenzen im
[Tempobericht](../reports/2026-09-28-kaufablauf-tempo.md).

## Historischer Stand vor dem Tempopaket

**Damals aktuelle Steuerung: erneut fortgesetzt.** Der Nutzer hebt die Pause mit
„jetzt kannst du weiter arbeiten“ ausdrücklich auf. Ausgangspunkt ist der
erneut exakt mit GitHub verglichene Commit `45ec0a8`. Im separaten Codex-Browser
hat der Nutzer die lokale PIN eingerichtet. Die synthetische Sicherung wurde
nach Vorschau in den unverbundenen Testbereich importiert; die Oberfläche
bestätigt die geprüfte Wiederherstellung. Google ist verbunden. Das Anlegen
des eigenen Testbereichs scheiterte zweimal an der Sicherungs-Metadatenprüfung.
Die Korrektur `ed36f4d` ist nach 601 Node-Tests, 7 ausgewählten Browserfällen und
unabhängiger Prüfung als Cache v30 bereitgestellt: aktive Worker-Version
`6d687e33-66b1-4f26-9ab9-99771d809809`. Die geänderten Module wurden öffentlich
bytegenau gegen das geprüfte Paket bestätigt. Nach kontrolliertem Update und
Entsperrung gelang derselbe Einrichtungsauftrag: Der Testbereich ist vollständig
abgeglichen, Google aktiv. Figuren und Käufe wurden aktiviert. Der reale Kauf
„Einfacher Drache – Stufe 2“ für 200 Punkte ist bestätigt; 1.400 verfügbare Punkte,
1.600 Lernpunkte und Level 9 bleiben nach bewusster Auswahl und Neuladen erhalten.
Der Nutzer beanstandet über zwei Minuten für die Kaufbestätigung. Funktionaler
Erfolg ist belegt, das Tempo ist nicht abgenommen. Der normale Chrome-
Lernstand bleibt erhalten. Alle Details und
Nachweisgrenzen im [Kauftestbericht](../reports/2026-09-28-kauftest-wiederherstellung.md).

**Damals konkreter nächster Schritt:** Den vollständigen Kaufweg vermessen und die
langsame Bestätigung gezielt verbessern. Die bisherige Einsparung betrifft nur
eine Uploadgruppe, nicht den ganzen Ablauf. Der bestehende separate Codex-
Testbrowser enthält bereits Drive-Bindung, 1.400 Testpunkte und Drachenstufe 2;
Import, Google-Anmeldung und Aktivierung nicht wiederholen. Die genaue Ursache
des früheren Metadatenunterschieds ist nicht aufgezeichnet, der erneute reale
Einrichtungsablauf ist unter v30 aber erfolgreich. Natürlicher Tokenablauf
und weitere Geräteabnahmen bleiben offen. Letzter exakt abgeglichener
GitHub-Stand vor diesem Testbericht: `a51d999`.

**Vorherige Pause nach Sicherung.** Der Nutzer wünscht nach dem
erfolgreichen Update schnell verfügbares Testguthaben für einen späteren
Kaufversuch und verlangt anschließend Pause. Ein separater synthetischer
Teststand mit 1.600 Punkten ist geprüft vorbereitet. Keine Übernahme in den echten Lernbereich
und keine weitere Testsitzung heute. Nach GitHub-Sicherung auf die nächste
ausdrückliche Fortsetzung warten.

## Auftrag und Ausgangspunkt

Der Nutzer hat nach dem GitHub-Abgleich ausdrücklich beauftragt:
„Dann arbeite nun weiter“ und den Skill `superpowers:using-superpowers`
aufgerufen. Die Pause vom 27.09.2026 ist beendet. Die
[vorherige Laptop-Übergabe](2026-09-27-laptop-pause.md) bleibt die fachliche
Grundlage; bereits abgeschlossene Kauf- und Serverpakete nicht neu beginnen.

Der lokale saubere Checkout wurde um 31 Commits von `5a434bf` auf
`c4996144afce6287457737bf84289c870cdad222` vorgezogen. `git rev-parse HEAD`
und die direkte GitHub-Abfrage mit `git ls-remote` bestätigten dieselbe SHA.
Keine fremden lokalen Änderungen wurden überschrieben.

## Laptop-Einstieg

- Die bestehende private HTTPS-App wurde in normalem Chrome geöffnet.
- Auf diesem Browserprofil erschien die Ersteinrichtung. Synthetischer
  Datensatz, Testprofil, Testlektion und zwei Testwörter wurden vorbereitet.
- Der Nutzer gab seine lokale PIN selbst ein und bestätigte die Einrichtung.
  Die anschließende Profilauswahl war sichtbar.
- Über Erwachsenenansicht und Einstellungen wurde die Google-Anmeldung
  gestartet. Der Nutzer schloss die Identitätsbestätigung selbst ab und
  meldete die Rückkehr zum Trainer; die Traineroberfläche war anschließend
  wieder sichtbar.
- Die Erwachsenenansicht verlangte nach der Rückkehr erneut die lokale PIN.
  Beim Wechsel in den Hintergrund sperrt sie sich absichtlich erneut; diese
  PIN-Sperre ist von einer Google-Trennung zu unterscheiden.
- Die Google-Verbindung war anschließend sichtbar aktiv. Die Bestandssuche
  fand vorhandene Lernbereiche; der Nutzer wählte den weiterzuverwendenden
  Bestand ausdrücklich aus.
- Die Bestandsvorschau kündigte den Erhalt des lokalen Teststands als geprüfte
  Sicherheitskopie an. Nach Übernahme des gewählten Bestands zeigte die App
  „Vollständig abgeglichen“ und „Google-Verbindung ist aktiv“.
- Der Nutzer beendete Chrome vollständig und öffnete die App erneut. Auf
  die ausdrückliche Statusfrage ohne neuen Google-Anmeldeklick antwortete er:
  „Google-Verbindung ist aktiv“. Dieser Neustartnachweis ist eine
  Nutzerrückmeldung. Nach dem Neustart war die vorherige Browsersteuerung
  nicht mehr verbunden; es wurde kein eigener zweiter UI-Nachweis behauptet.

Die lokale Testeinrichtung erzeugt für sich keinen Drive-Lernbereich.
Es wurde kein neuer Cloudbestand angelegt; der ausdrücklich gewählte
vorhandene Bestand wurde übernommen. Keine PIN, Kontokennung, Bestandsnamen,
Anmelde-URL, Sitzung oder persönlichen Lerninhalte werden hier festgehalten.

Die Vorschau und Bestätigung dauerten jeweils deutlich länger als eine
gewöhnliche Navigation. Die lesende Codeprüfung erklärt den Ablauf:
Bestätigung liest den Fernbestand einschließlich Kaufhistorie erneut und
vergleicht ihn mit der Vorschau, bevor der lokale Stand übernommen wird.
Die Oberfläche sperrt währenddessen die Aktionen, zeigt aber keine einzelnen
Prüfphasen. Es wurde keine genaue Dauer gemessen und kein Hänger nachgewiesen.

## Abgeschlossene Kaufbeschleunigung

Die unabhängige Codeprüfung bestätigt den begrenzten Vorschlag aus der
[Anmelde-/Tempoübergabe](2026-09-27-anmeldung-und-tempo.md#kaufgeschwindigkeit-befund-und-begrenzter-vorschlag):
`uploadPurchase` startet höchstens drei bereits gespeicherte unveränderliche
Uploads gemeinsam. Zuvor las jeder Upload denselben installierten
Konfigurationsanker erneut: zwei Ordnermetadatenzugriffe und drei Zugriffe
auf die Konfigurationsdatei. Jeder dieser Zugriffe hat eine eigene Kontoabfrage.

Die neue Methode `writeImmutableBatch` prüft ausschließlich innerhalb dieser
einen Uploadgruppe gemeinsam. Sie spart bei drei Uploads zehn Ankerzugriffe
und zehn zugehörige Kontoabfragen. Zwei identisch vorbereitete synthetische
HTTP-Fixtures messen **54 Anfragen im Einzelpfad und 34 im Gruppenpfad**.
Alle übrigen Kontoabfragen je HTTP-Aufruf bleiben erhalten. Die Gruppe ist
an dieselbe Konfiguration, denselben Datensatz, denselben gespeicherten
Kaufversuch und den beim Start erfassten Browser-Token beziehungsweise
Client-Sitzungsmarker gebunden. Ein Marker-/Tokenwechsel beendet die Gruppe.
Es gibt keinen Cache über
Gruppen, Kaufversuche, Wiederverbindungen oder gespeicherte Aufträge hinweg.

Jeder Upload behält Auftragsautorisierung, ID-/Inhaltshashprüfung, Behandlung
bereits vorhandener Dateien und vollständige Nachlese. Vor dem bedingten
Schreiben des gemeinsamen Kopfes werden Anker und Koordinator erneut geprüft;
die gespeicherte ETag bleibt maßgeblich. Aktivierung, Restore und erstmalige
Einrichtung bleiben beim bisherigen Weg. Im Servermodus bezeichnet der
Client-Marker die Sitzung, nicht den serverseitigen Google-Zugriffstoken;
reguläre serverseitige Token-Erneuerung bleibt möglich.

Die Eingaben werden vor der ersten asynchronen Operation kopiert. Nach einem
Teilfehler werden alle bereits gestarteten Arbeiten abgewartet; Folgegruppe
und Kopfänderung bleiben aus. Der gespeicherte Auftrag bleibt fortsetzbar.

**Produktcommit:** `b6b83a95346d2b2c71a3d3edba35abff88f43047`, zunächst auf
`codex/purchase-batch-checks` erstellt und nach Prüfung unverändert per
Fast-Forward in `codex/vokabeltrainer-v1` übernommen. Der verwaltete Worktree
bleibt erhalten. Die sieben geänderten Dateien entsprechen exakt dem
unabhängig geprüften und im Browser getesteten Diff. Cachekennung: v29;
der kontrollierte Updatefall prüft v29 auf eine synthetische v30.

| Aktueller Nachweis | Ergebnis und Grenze |
| --- | --- |
| Vollständiger Node-Abschlusslauf | 591/591 bestanden; keine Fehler, Abbrüche oder übersprungenen Tests |
| Ausgewählte Browserfälle | 12/12 bestanden; Kauf, Fehlerwiederaufnahme, Sitzung nach Reload, Offline-Neustart und kontrolliertes Update |
| Server-Dateipaket vor der Bereitstellungsfortsetzung | 161 öffentliche Dateien lokal vorbereitet; zu diesem Zeitpunkt noch kein Upload |
| Unabhängige Prüfung | Spec PASS, Qualität PASS; keine offenen Codebefunde |
| Reale Kaufwartezeit der Änderung | Noch nicht gemessen; zum Zeitpunkt dieses Prüfstands enthielt die HTTPS-App das Paket noch nicht |

Prüfkommandos, Testentwicklung, Anfragezählung und Nachweisgrenzen stehen im
[Kaufgruppenbericht](../reports/2026-09-28-kaufgruppen.md). Die frühere
Gesamtsuite mit 58 Browserfällen wurde nicht vollständig neu ausgeführt.

## Git-Sicherung und Bereitstellung

Ausgangscommit `c499614` und GitHub waren zu Beginn exakt abgeglichen. Der
Produktcommit `b6b83a9` ist lokal im bestehenden Entwicklungszweig enthalten;
der anschließende Dokumentationscommit enthält diese Übergabe und den Bericht.
Nach `npm run check:docs` und `git diff --check` wird derselbe Entwicklungszweig
ohne Force-Push auf GitHub gesichert. Die Abschlussmeldung nennt den tatsächlich
gesicherten Commit nach Vergleich von `git rev-parse HEAD` mit
`git ls-remote origin refs/heads/codex/vokabeltrainer-v1`.

Der erste Dokumentationslauf vor der Bereitstellung prüfte 241 Markdown-Dateien
und 939 lokale Verweise ohne Fehler; die Diffprüfung blieb sauber. Eine unabhängige Schlusskontrolle
hat veraltete Wiedereinstiege identifiziert; diese sind auf den heutigen
Laptop- und Kaufstand aktualisiert.

Die private HTTPS-Adresse bleibt die bereits eingerichtete
[Test-App](https://vokabeltrainer.marco-civico.workers.dev/trainer/).
Die Bereitstellung der heutigen Änderung ist unten gesondert nachgewiesen.
Git-Sicherung überträgt keine Google-Sitzung und keine lokalen Browserdaten.

## Bereitstellungsfortsetzung am 28.09.2026

Nach dem GitHub-Abschluss `939830c94895ae791b2b5ad0d01ff375a07a4599` fordert
der Nutzer erneut „dann machen wir weiter“. Der nächste Schritt ist die
Bereitstellung des geprüften Kaufpakets auf derselben privaten HTTPS-App.
GitHub und lokaler Checkout wurden erneut exakt verglichen; der Checkout war
sauber und der Worker sowie das Staging-Skript sind unverändert.

Auf dem Laptop fehlte erwartungsgemäß die ignorierte Datei
`server/wrangler.local.jsonc`. Sie wurde aus Vorlage und den öffentlichen
Betreiberwerten der vorherigen Laptop-Übergabe wiederhergestellt. Bestehende
D1-Bindung und Client-ID, ausgeschaltete Logs und Vorschauadressen bleiben
erhalten. Es wurden keine Secrets ausgelesen oder neu erzeugt.

Wrangler 4.142.0 führte aus `server/` den dokumentierten Probelauf
`deploy --config wrangler.local.jsonc --dry-run --keep-vars` mit Exitcode 0 aus.
Der aktive Build-Hook erzeugte 161 öffentliche Dateien. Der anschließende
Dateivergleich fand keine unerwartete Abweichung zum Quellstand; nur die
vorgesehene Kopie von `config.js` verwendet den Servermodus. Der Produktcache
im Paket steht auf v29.

Die öffentliche HTTPS-Prüfung **vor** dem Upload bestätigte noch **v28**.
HTML und Serverkonfiguration stimmen mit dem vorbereiteten Paket überein;
Service Worker und beide Kaufmodule entsprechen noch dem früheren Stand.
Der Sitzungsabruf ohne Cookie liefert `connected:false` mit `no-store`.
Wurzel, interne Worker-Datei, Anforderungsdokument und Git-Konfiguration liefern
404. Diese Prüfung liest keine persönliche Google-Sitzung.

Die erste Wrangler-Anmeldung des Laptops war noch nicht erfolgreich.
Zwei OAuth-Versuche scheiterten nach der Browserfreigabe beim
Codeaustausch mit `/oauth2/token`: HTTP 403, HTML-Bot-Challenge statt JSON.
Der Nutzer bestätigte denselben Fehler. In diesen Versuchen erfolgte kein
Upload und keine Änderung an Cloudressourcen, Google-Zugang oder Browserdaten. Der Befund ist
mit einem [bekannten Cloudflare-Problem](https://github.com/cloudflare/workers-sdk/issues/15723)
vereinbar; dessen Ursache im konkreten Netzwerk ist nicht weiter bewiesen.
Als von [Wrangler unterstützte Alternative](https://developers.cloudflare.com/workers/wrangler/commands/general/)
wurde ein begrenzter API-Token-Zugang vorbereitet. Die Cloudflare-Sicherheitsprüfung
in Chrome und die verdeckte lokale Geheimniseingabe übernahm der Nutzer selbst.
Keine globale Proxy- oder TLS-Regel wurde geändert.

Der Nutzer erzeugte einen zeitlich begrenzten API-Token für das bestehende
Cloudflare-Konto. Die angezeigte Gültigkeit reicht vom 28. bis zum 30.09.2026;
die Rechte sind auf **Workers Scripts Edit**, **D1 Read** und **Account Settings Read**
begrenzt. Der Token wurde außerhalb von Git mit Windows-DPAPI verschlüsselt
gespeichert und nur als Umgebungsvariable des jeweiligen Wrangler-Prozesses
verwendet. Der Schlüsselwert wurde weder im Chat angezeigt noch in Git oder
Dokumentation übernommen; persönliche Konto- und Sitzungsdaten stehen nicht
in diesem Bericht. Vor dem Deploy wurden der Zugang, die vorherige aktive Version
`45b6cb48-486f-45c1-8afc-4425206af8b6` und ausschließlich die Namen der
vorhandenen Secrets lesend bestätigt.

Der echte Deploy aus `server/` mit Wrangler 4.142.0, `--keep-vars` und aktivem
Build-Hook endete mit Exitcode 0. Von 161 öffentlichen Dateien wurden genau
die drei geänderten Assets `trainer/sw.js`, `src/trainer/purchases/service.js`
und `src/trainer/purchases/transport.js` neu hochgeladen; 158 blieben
inhaltsgleich. Die neue aktive Worker-Version
`494388ba-6838-4604-9369-788a6e60962d` stand laut Deploymentliste zu 100 %
bereit (Erstellzeit 28.09.2026, 14:57:42 UTC).

Die echte HTTPS-Nachprüfung um 14:58:14 UTC lieferte für `/trainer/` Status 200,
für den Service Worker Cache `v29`, für die öffentliche Konfiguration den
Servermodus und für beide Kaufmodule Status 200. Alle fünf geprüften Dateien
waren byteidentisch mit dem vorbereiteten Paket. `/api/auth/session` lieferte
ohne Cookie Status 200, `connected:false` und `Cache-Control: no-store`.
`/`, `/server/worker.js`, `/docs/ANFORDERUNGEN.md` und `/.git/config` blieben
mit 404 gesperrt. Diese Prüfung verwendete keine persönliche Sitzung.

Im vorhandenen Chrome-Profil erschien nach Neuladen „Neue Programmversion
verfügbar“. Nach „Jetzt aktualisieren“ kehrte die Profilauswahl zurück.
Der Nutzer bestätigte anschließend „Google-Verbindung ist aktiv“, ohne erneut
zu verbinden. Die Erwachsenenansicht zeigte danach auch direkt beobachtet
„Google-Verbindung ist aktiv“ und „Vollständig abgeglichen“.

Ein echter Kauf wurde nicht ausgelöst: Im vorhandenen Profil war kein
bezahlbares freigegebenes Kaufangebot verfügbar. Für weitere Shopfiguren fehlte
Guthaben; die günstigere Entwicklungsform war wegen des noch fehlenden Bildes
gesperrt. Persönliche Punktestände wurden nicht in den Bericht übernommen und
nicht für einen Test verändert. Das bekannte offene Bildpaket bleibt Folgeumfang.
Eine reale Kaufdauer und Zeitersparnis sind weiterhin nicht gemessen.

## Historisch: vorbereitete Testpunkte und anschließende Pause

Der Nutzer möchte den Kauf ohne weitere eigene Vokabelrunden testen. Der
vorhandene Produktvertrag kennt keine manuelle Punktgutschrift: Guthaben
entsteht aus validierten Antworten und Rundenabschlüssen. Tabellenimport
übernimmt nur Vokabeln; der Sicherungsimport ersetzt einen ganzen aktiven
Datensatzstand. Die automatisierte Testfixture darf daher nicht über einen
echten Familienstand geschrieben werden.

Die [synthetische Sicherung](../../tests/fixtures/purchase-demo-1600.json)
enthält genau ein Profil „Kauftest“, 1.600 Punkte und Level 9; „Einfacher Drache“
ist verfügbar. Der [Generator](../../scripts/create-purchase-demo.mjs) erzeugt
die Punkte über die vorhandenen Produktbefehle: fünf Runden mit insgesamt
150 richtigen Antworten ergeben 1.500 Antwort- und 100 Rundenpunkte. Seine
Ausführung und das erneute Einlesen der geschriebenen Datei mit `parseBackup`
waren erfolgreich. Format v2, 252 Ereignisse, keine Kaufhistorie, PIN oder
Google-Zugangsdaten; alle Lernereignisse liegen zwischen Februar und Juli 2026.

Die [Anleitung für den getrennten Kauftest](../KAUFTEST-MIT-TESTPUNKTEN.md)
beschreibt den nächsten Schritt. Der Stand wurde weder in einen Browser
importiert noch in Drive angelegt. Bestehende Profile und Drive-Bestände wurden
nicht verändert. Nach Git-Sicherung ist die ausdrücklich verlangte Pause
einzuhalten. Die heutige Kaufmessung bleibt offen.

## Nächste Schritte nach dem Tempopaket

1. Den aktuellen Google-Status nach dem jüngsten Neuladen klären. Regulären
   Tokenablauf getrennt prüfen, sobald er tatsächlich eingetreten ist. Keine
   persönlichen Browserdaten löschen und die abgeschlossene Einrichtung nicht
   wiederholen.
2. Die Nutzerrückmeldung zur Kaufwartezeit unter Cache v31 einholen. Der
   [getrennte Teststand](../KAUFTEST-MIT-TESTPUNKTEN.md) ist bereits eingerichtet;
   Drachenstufe 3 ist gekauft und gewählt. 1.000 Punkte bleiben verfügbar,
   Stufe 4 kostet 800 Punkte. Vor einer größeren weiteren Beschleunigung die
   Restlatenz konkret diagnostizieren und ein Design abstimmen.
3. Den bestätigten Avatar-/Galerieumfang fortsetzen: 72 weitere Motive,
   Produktionsvarianten und vollständige Galerie bleiben Folgeumfang.
4. Reales Google Drive auf zwei physischen Geräten, iPhone/iPad, Safari und
   Home-Bildschirm-App einschließlich Offlineübung und Wiederaufnahme prüfen.

Bestandsübernahme und vollständiger Abgleich sind historisch direkt beobachtet;
der Chrome-Neustart ist vom Nutzer bestätigt. Beide Käufe im getrennten
Teststand sind belegt. Der Google-Status nach dem jüngsten Neuladen, regulärer
Zugriffstokenablauf und die Nutzerabnahme der neuen Kaufgeschwindigkeit bleiben
offen.
Dies ist keine vollständige Zwei-Geräte-Abnahme und kein Apple-/Safari-Nachweis.

## Wiedereinstieg

> Lies AGENTS.md, START-HIER.md, ARBEITSSTAND.md und diese Übergabe. Prüfe den
> aktuellen Entwicklungszweig und GitHub, ohne vorhandene Arbeit zu verwerfen.
> Der Laptop hat den vorhandenen Drive-Bestand übernommen; der vollständige
> Abgleich ist historisch beobachtet. Produktcommit ad96f00 ist exakt mit
> GitHub abgeglichen und als Cache v31 privat bereitgestellt. Der Nutzer hat
> die frühere Pause beendet. Im getrennten Codex-Testbereich ist Drachenstufe 3
> für 400 Punkte gekauft und nach Neuladen gewählt; 1.000 Punkte sind noch
> verfügbar. Einrichtung und Import nicht wiederholen; Familien-Chrome und
> vorhandene Drive-Bestände erhalten. Unmittelbar nach dem jüngsten Neuladen
> erschien „Google erneut verbinden“; die weitere UI-Abfrage endete ohne
> Ergebnis. Den aktuellen Google-Status klären und die Nutzermeinung zum
> verbesserten Kaufgefühl einholen. Vor einer größeren Optimierung die
> Restlatenz diagnostizieren und ein Design abstimmen. Reale Token-Erneuerung
> und Geräteabnahmen getrennt nachweisen; keine persönlichen Daten in Git.
