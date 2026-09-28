# Fortsetzung auf dem Laptop

Stand: **28.09.2026**. Zweig: `codex/vokabeltrainer-v1`.

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
| Server-Dateipaket | 161 öffentliche Dateien lokal vorbereitet; kein Upload |
| Unabhängige Prüfung | Spec PASS, Qualität PASS; keine offenen Codebefunde |
| Reale Kaufwartezeit der Änderung | Noch nicht gemessen; die laufende HTTPS-App enthält dieses Paket noch nicht |

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

Der Dokumentationslauf prüft 241 Markdown-Dateien und 939 lokale Verweise
ohne Fehler; die Diffprüfung bleibt sauber. Eine unabhängige Schlusskontrolle
hat veraltete Wiedereinstiege identifiziert; diese sind auf den heutigen
Laptop- und Kaufstand aktualisiert.

Die private HTTPS-Adresse bleibt die bereits eingerichtete
[Test-App](https://vokabeltrainer.marco-civico.workers.dev/trainer/).
Die heutige Änderung wurde noch nicht auf Cloudflare bereitgestellt.
Git-Sicherung überträgt keine Google-Sitzung und keine lokalen Browserdaten.

## Nächste Schritte und Nachweisgrenzen

1. Regulären Tokenablauf getrennt prüfen, sobald er tatsächlich eingetreten ist.
   Den bestätigten Chrome-Neustart erhalten; kein manipuliertes Token und kein
   Löschen persönlicher Browserdaten. Die nächste Statusrückmeldung soll
   festhalten, ob ohne neuen Google-Klick verbunden und abgeglichen werden kann.
2. Für den Praxistest der Kaufbeschleunigung den geprüften Produktstand auf
   derselben privaten Test-App bereitstellen. Dieser Upload ist der nächste
   konkrete Bereitstellungsschritt, kein in dieser Runde ausgeführter Vorgang.
   Danach die tatsächlich verwendete App-Version prüfen und die Wartezeit
   gemeinsam an einem vom Nutzer gewählten Kauf beobachten.
3. Den bestätigten Avatar-/Galerieumfang fortsetzen: 72 weitere Motive,
   Produktionsvarianten und vollständige Galerie bleiben Folgeumfang.
4. Reales Google Drive auf zwei physischen Geräten, iPhone/iPad, Safari und
   Home-Bildschirm-App einschließlich Offlineübung und Wiederaufnahme prüfen.

Bestandsübernahme und vollständiger Abgleich sind heute direkt beobachtet;
der Chrome-Neustart ist vom Nutzer bestätigt. Regulärer Zugriffstokenablauf,
Kauf über diese HTTPS-Adresse und reale Kaufbeschleunigung bleiben offen.
Dies ist keine vollständige Zwei-Geräte-Abnahme und kein Apple-/Safari-Nachweis.

## Wiedereinstieg

> Lies AGENTS.md, START-HIER.md, ARBEITSSTAND.md und diese Übergabe. Prüfe den
> aktuellen Entwicklungszweig und GitHub, ohne vorhandene Arbeit zu verwerfen.
> Der Laptop hat den vorhandenen Drive-Bestand übernommen; vollständiger Abgleich
> ist beobachtet und Google bleibt laut Nutzer nach Chrome-Neustart verbunden.
> Die Kaufgruppen-Optimierung in b6b83a9 ist geprüft und integriert, aber noch
> nicht bereitgestellt. Vor einem neuen Lauf den aktuellen Bereitstellungsstand
> prüfen. Keine abgeschlossene Google-Einrichtung oder Kaufimplementierung neu
> beginnen. Reale Token-Erneuerung, Kaufwartezeit und Geräteabnahmen getrennt
> nachweisen; keine persönlichen Daten in Git aufnehmen.
