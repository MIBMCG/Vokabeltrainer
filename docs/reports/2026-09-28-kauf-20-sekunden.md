# Kaufwartezeit: Ziel von höchstens 20 Sekunden

## Auftrag und Grenze

Der Nutzer erwartet vom Öffnen der Kaufvorschau bis zur sichtbaren
Bestätigung höchstens 20 Sekunden, möglichst weniger als 10 Sekunden. Er
erlaubt, doppelte Sicherungsprüfungen zu reduzieren. Die Vorschau darf den
bereits vollständig bestätigten lokalen Kaufstand nutzen. Bei der normalen
Bestätigung entfällt der volle Lernabgleich; neue Lernpunkte eines anderen
Geräts stehen daher erst nach dem nächsten regulären Abgleich zum Kauf bereit.
Ein frischer Kaufkopf und Schutz vor fremden Änderungen und Doppelkauf bleiben
erforderlich. Wiederaufnahme und Restore behalten die strenge Prüfung.

## Diagnose und begrenzte Umsetzung

Ausgangsstand ist `ab033c3` mit Produktcommit `ad96f00` und Cache v31.
Dessen synthetische Vollprobe brauchte 55 Vorschau- und 139
Bestätigungsanfragen. Im echten Test erschien die Vorschau nach 20,838
Sekunden und die Bestätigung nach weiteren 43,891 Sekunden. Der Nutzer hat
auch dieses Tempo ausdrücklich zurückgewiesen und das neue Zeitlimit gesetzt.

Historischer Vergleich unter Cache v30:

Der echte Testkauf im getrennten Bereich funktionierte: Guthaben, Besitz und
Auswahl blieben nach Neuladen erhalten. Die Vorschau erschien nach etwa
26,927 Sekunden; die Bestätigung war nach 98,722 Sekunden noch offen und
spätestens nach 118,821 Sekunden sichtbar. Das sind Beobachtungen der
Oberfläche, keine genaue HTTP-Messung. Die frühere vollständige lokale
Kaufprobe zählte 63 Anfragen für die Vorschau und 234 für die Bestätigung.
Diese Werte gehören zum alten Pfad und sind kein Vorher/Nachher-Beweis am
echten Server.

Die Diagnose zeigte vor allem wiederholte vollständige Lernabgleiche und
Konto- und Konfigurationsabfragen. Danach wurden gezielte zunächst rote
Regressionstests für lokale Vorschau, Reservierung, Sitzungsbindung,
Kontextgültigkeit und frischen Kaufkopf angelegt. Der begrenzte Pfad verwendet
nun die bestätigte lokale Kaufhistorie für die Vorschau, liest zur Bestätigung
einen frischen bindungsgeprüften Koordinatorkopf und verzichtet dort auf den
vollen Lernabgleich. Im Servermodus ersetzt die aktuelle, an den erfassten
Sitzungsmarker gebundene Kontokennung einzelne Google-`about`-Abfragen. Ein
flüchtiger Kaufkontext prüft Configref und Config für einen reservierten
Versuch einmal und wird bei Fehlern, Markerwechsel und nach dem Pointer-
Versuch ungültig. Der Kaufkopf benötigt einen frischen Metadatenabruf.

Der Kaufauftrag, seine reservierten IDs und der Uploadkandidat werden vor
abhängigen Netzoperationen dauerhaft gespeichert. Unveränderliche Dateien,
Inhalts- und Bindungsprüfungen, die `If-Match`-Bedingung für den Pointer und
das Nachlesen bei unklarer Antwort bleiben erhalten. Eine Wiederaufnahme
nutzt keinen alten Kaufkontext. Datenformat, Drive-Speicher und
Anbieterarchitektur bleiben gleich.

## Synthetischer Messstand

Der portable Diagnosehelfer verwendet die echten Kaufmodule und eine
synthetische Google-HTTP-Grenze; er verwendet weder echte Lernprofile noch
Browser oder Zugangsdaten. Die vorbereitende Anlage des getrennten
Testbereichs und die Kaufaktivierung gehören nicht zur folgenden Kaufzeit.

| Aktueller Serverpfad | HTTP-Anfragen | Synthetischer Lauf mit 500 ms je Google-Anfrage |
| --- | ---: | ---: |
| Kaufvorschau | 0 | 20 ms |
| Kaufbestätigung | 31 | 10.727 ms |

Die 31 Anfragen liegen auf 19 sequenziellen Abhängigkeitsstufen, weil bis zu
drei Anfragen parallel laufen. Die 500-ms-Messung enthält lokale Ausführung
und künstliche Wartezeiten; sie bildet Google, Cloudflare, D1, Browser und
IndexedDB im Alltag nicht zuverlässig ab. Die Messdaten stehen lokal in
`.superpowers/purchase-latency-measure-server.json` und enthalten nur
synthetische IDs.

## Automatisierte Prüfung und Review

Auf dem finalen Produktstand bestanden `npm test` mit 641/641 Fällen,
acht ausgewählte Browserfälle für Kauf, Wiederaufnahme, Offlinebetrieb,
Serveranmeldung und kontrolliertes Update sowie nach der letzten kleinen
Abbruchkorrektur erneut der vollständige Kauf-Browserfall. Die gezielten
Recovery-/Integrationstests bestehen mit 97/97 Fällen. Die Performance-
Regression prüft Vorschau plus Bestätigung bei 500 ms künstlicher Verzögerung
pro Google-Anfrage gegen eine Grenze von 20 Sekunden. Dokumentationsprüfung
und `git diff --check` sind fehlerfrei.

Die unabhängigen Prüfungen von Authentifizierung sowie Service/Transport
sind nach Korrekturen PASS. Eine zwischen Vorschau und Bestätigung geänderte
lokale Basis wird sofort als veraltet abgewiesen. Noch nicht abgeglichene
Lernpunkte erzeugen eine verständliche Warteaufforderung. Ändert sich der
lokale Stand unmittelbar nach dem gespeicherten Intent, wird ausschließlich
der noch unreservierte Auftrag geschlossen; eine neue Vorschau ist möglich.
Gesendete oder reservierte Versuche werden auf diesem Pfad nicht verworfen.

## Bereitstellung und begonnener echter Zeitvergleich

Produktcommit `192590258e657175defcf89f1141d561c2f1c95d` wurde im bestehenden
Entwicklungszweig `codex/vokabeltrainer-v1` per Fast-Forward übernommen und
privat als Cache v32 bereitgestellt. Der Upload änderte sechs Laufzeitdateien;
155 Dateien blieben unverändert. Worker-Version
`e14dc090-529a-45ee-829b-53dfaf1162e1` ist seit 28.09.2026, 19:03:51 UTC
zu 100 % aktiv. Elf öffentliche Dateien wurden um 19:04:13 UTC bytegleich mit
dem geprüften Paket verglichen, darunter alle sechs geänderten Laufzeitdateien.

Im bereits eingerichteten separaten Codex-Testprofil war zusätzlich der
Nebelhirsch gekauft worden; vor der Vorbereitung waren 400 Punkte verfügbar.
Zwei automatisch bediente Runden mit ausschließlich fiktiven Inselwörtern
ergaben 440 weitere Testpunkte. Der sichtbare Stand vor dem Kauf war dadurch
840 verfügbare Punkte, 2.040 Lernpunkte und Level 11. Familien-Chrome und
echte Lernbestände wurden nicht verändert.

Das kontrollierte Update über „Jetzt aktualisieren“ wurde übernommen. Der
vorübergehende Hinweis „Google erneut verbinden“ nach dem Laden verschwand
ohne erneute Anmeldung. Die Vorschau für Drachenstufe 4 war nach **113 ms**
sichtbar und zeigte 800 Punkte Preis sowie 40 Punkte Restguthaben.

Die automatische Freigabe lehnte den abschließenden Bestätigungsklick ab,
auch nach Vorlage des Nachweises rein synthetischer Übungspunkte. Der Nutzer
führte ihn deshalb selbst aus und meldete **17 Sekunden** bis zur sichtbaren
Bestätigung. Zusammen mit der gemessenen Vorschau sind das ungefähr
**17,1 Sekunden Prozesswartezeit**. Die bewusste Lese-/Klickpause zwischen
Vorschau und Bestätigung sowie die Freigabeunterbrechung sind nicht darin
enthalten. Für diesen echten Test ist die Grenze von 20 Sekunden erreicht;
das Wunschziel unter 10 Sekunden ist nicht erreicht. Es handelt sich um eine
einzelne UI-Messung mit einer vom Nutzer gestoppten Bestätigungsdauer, keine
allgemeine Garantie unter beliebigen Netzbedingungen.

Der anschließend gelesene DOM bestätigt „Der Kauf ist bestätigt.“,
40 verfügbare Punkte sowie unverändert 2.040 Lernpunkte und Level 11.
Stufe 4 wurde bewusst ausgewählt. Nach Neuladen sind Stufe 4 als ausgewählte
Figur, Guthaben und Lernpunkte erhalten. Auch nach diesem Neuladen verschwand
der anfängliche Verbindungshinweis ohne erneute Anmeldung. Das belegt keinen
bestimmten Tokenablauf; regulärer Tokenablauf,
Zweitgerät und Apple-Abnahme bleiben eigene offene Prüfungen.

Produktcommit `192590258e657175defcf89f1141d561c2f1c95d` wurde nach GitHub
auf `codex/vokabeltrainer-v1` übertragen und per `git ls-remote` exakt
verglichen. Der nachfolgende Dokumentationscommit sichert die reale Messung
und die aktualisierte Übergabe; sein Hash ist über die Zweigspitze überprüfbar.
