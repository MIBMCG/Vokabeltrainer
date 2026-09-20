# Dauerhafte Käufe und gemeinsame Wiederherstellung

Stand: 20.09.2026. **Entwurf zur Abstimmung, noch nicht implementiert.** Ausgangspunkt `102d8c7f77ac7978db2d3649db7b19780eca7aaf`. Der Nutzer hat nach dem erfolgreichen [Bericht10](../../reports/2026-09-20-shop-v10-reallauf.md) die Fortsetzung beauftragt. Allgemeine Entwicklungsfreigabe, Richtung C und EV01–EV05 bestehen. Dieser Entwurf konkretisiert erstmals die Integration in dauerhafte Produktdaten; seine Zustimmung ist noch nicht dokumentiert.

## 1. Ergebnis für Kinder und Eltern

- Ein bestätigter Kauf bleibt nach Schließen und Öffnen der App sowie nach Google-Neuanmeldung wiedererkennbar. Ein neues Gerät kann bestätigten Besitz aus Drive rekonstruieren.
- Bei unklarem Ausgang erscheint „Kauf wird geprüft“. Die App prüft beim nächsten Verbinden zuerst den bestehenden Auftrag. Sie erzeugt keinen Ersatzkauf unter einer neuen Kennung.
- Lernen und vorhandene Figuren funktionieren weiterhin offline. Neue Käufe erfordern wie beschlossen Verbindung und erfolgreichen Abgleich. Ein vor dem Abbruch bereits ausdrücklich bestätigter Auftrag ist keine neue Offline-Kaufvormerkung.
- Lernpunkte, Level und Reise bleiben von Ausgaben getrennt. Guthaben und Besitz bleiben je Kind getrennt; Stufenpreise bleiben 200/400/800.
- Eine vollständige Wiederherstellung zeigt vorher auch die Änderungen an Besitz und Guthaben. Sie übernimmt diese Werte konsistent aus dem ausgewählten Sicherungsstand; die bestehende bewusste Rücksetzentscheidung bleibt erhalten.
- Die Umstellung benötigt keine neue Client-ID und keinen zusätzlichen Clouddienst. Die neue Datenversion verlangt aktuelle Apps auf den beteiligten Geräten.

## 2. Untersuchte Wege und Empfehlung

**Empfohlen: ein gemeinsamer Bestätigungspunkt je Lernbestand, getrennte Konten je Kind im Inhalt.** Alle Käufe und Wiederherstellungen werden über dieselbe Belegfolge bestätigt. Ein vollständiger Restore aller Profile benötigt dadurch keinen verteilten Abschluss über mehrere unabhängig beschreibbare Konten. Gleichzeitig ausgelöste Käufe verschiedener Kinder können sich kurz gegenseitig überholen; für den privaten Umfang ist die einfache, überprüfbare Reihenfolge wichtiger als maximaler Durchsatz.

**Alternative: ein eigener beschreibbarer Kopf je Kind.** Käufe verschiedener Kinder wären unabhängiger. Der bestehende Restore des gesamten Lernbestands müsste jedoch alle Köpfe und die Epoche zusammen umstellen. Ein zusätzliches Sperr-/Mehrphasenverfahren wäre nötig. Für dieses Paket nicht empfohlen.

Das ist eine technische Konkretisierung innerhalb Google Drive. Daten anderer Kinder werden durch einen Kauf weder belastet noch gelöscht. Die Variante mit gemeinsamem Kopf ersetzt die bisher bevorzugte, noch nicht implementierte getrennte technische Koordination je Kind; die fachliche Trennung bleibt bestehen.

## 3. Wiederverwendung und Modulgrenzen

Die Probe bleibt als geprüfter Referenzversuch unverändert. Das Produkt importiert keine Module aus `src/shop-probe/`, deren feste 1000 Punkte, Laufkennung und Speicherregistrierung Teil des Versuchs sind.

Neue Verantwortlichkeiten unter `src/trainer/purchases/`:

| Modul | Verantwortung |
| --- | --- |
| `schema.js` | Exakte, versionierte Auftrags-, Beleg-, Bindungs- und Journalformate |
| `transport.js` | Gebundene Ordner-Metadaten und unveränderliche Inhalte mit reservierten Datei-IDs und SHA-256 |
| `history.js` | Vollständige Belegprüfung, Vorgängerfolge, Wiedererkennung und geprüfter lokaler Cache |
| `projection.js` | Besitz und Ausgaben je Profil; Nutzung der vorhandenen Lernprojektion für verdiente Punkte |
| `service.js` | Vorbereitung, bewusste Bestätigung, Fortschreiben des dauerhaften Auftrags und Wiederaufnahme |

`commands.js` bleibt der einzige serialisierte lokale Schreibweg. Seine Zustandsprüfung und `productStateHash` umfassen die neuen Felder. `storage/store.js` kann den erweiterten Zustand weiter atomar in einer IndexedDB-Transaktion speichern; keine zweite unabhängige Browserdatenbank für Guthaben. `backup/format.js`, `backup/restore.js`, `sync/drive.js` und die Epochenprojektion erhalten die ausdrücklich benötigten Schnittstellen. Keine allgemeine Aufteilung dieser bestehenden Module im selben Paket.

## 4. Gemeinsamen Anker einmalig festlegen

Die bereits bestätigte Drive-Bindung aus Konto, Bestandsordner, Beschreibung und Datensatz-ID ist der Ausgangspunkt. Eine Suche nach gleichnamigen Kaufkonten darf keine neue Guthabenquelle erzeugen.

1. Ein dauerhaft gespeicherter Einrichtungsauftrag reserviert einen Koordinationsordner und einen getrennten Inhaltsordner. Beide sind Kinder des gebundenen Bestandsordners; Belegdateien liegen ausschließlich im Inhaltsordner.
2. Eine unveränderliche Konfiguration bindet Kontoauswahl, Datensatz, unveränderten Beschreibungshash sowie beide Ordner-IDs. Ihre Referenz enthält ID und SHA-256.
3. Der bestehende Bestandsordner erhält per bedingtem Metadaten-PUT genau einen versionierten Verweis auf diese Konfiguration. Sind die Properties bereits vorhanden, wird ausschließlich dieser Verweis vollständig geprüft. Teilweise oder widersprüchliche Einträge sperren; kein Ersetzen durch eine zweite Initialisierung.
4. Bei konkurrierenden Einrichtungen entscheidet die nachgelesene vollständige Gewinnerkonfiguration. Verlierende Dateien bleiben ohne Wirkung erhalten. Nach unklarer Antwort wird der ursprüngliche Auftrag geprüft, nicht ein neuer Ordnerverbund gewählt.
5. Anschließend koordiniert nur noch der dafür bestimmte Ordner die Käufe. Lernen und Inhaltsuploads schreiben nicht in diesen Ordner. Die beiden logischen Kinderkonten sind Einträge derselben Belegprojektion.

Die Konfigurationsreferenz ist innerhalb eines Bestands unveränderlich. Der Inhalt erhält die eigene App-Kennung `vokabeltrainer-purchases`; normale Produktdateien behalten ihre bisherigen Kennungen. Metadaten-PUTs erhalten alle bestehenden privaten Eigenschaften. Die vorhandenen Grenzen für Anzahl und UTF-8-Größe werden vor jedem PUT geprüft. Fehlende Berechtigung oder unklare Bindung bleibt ein Fehler, kein Anlass zur Neueinrichtung.

## 5. Dauerhafter Auftrag und Schreibversuch

Der lokale Zustand wird auf `storageVersion:3` erweitert. Der neue Teil `commerce` enthält `mode`, geprüfte Bindung, zuletzt bestätigten Kopf, geprüfte Inhaltsreferenzen, Einrichtungsauftrag und Kaufaufträge. `mode` ist `inactive/migrating/active/blocked`. Tokens werden nicht gespeichert.

Ein Kaufauftrag hält unveränderlich fest: Protokollversion, Vorgangs-ID, Datensatz, Profil, Kaufepoche, Artikel/Form, Katalogversion, Preis und die ausdrückliche Kaufbestätigung. Ein zugehöriger Versuch enthält Ausgangskopf, unveränderte Schreibkennung, reservierte Kandidaten-ID, kanonischen Inhalt/Hash und geprüfte Guthabengrundlage. Mehrere Versuche eines Auftrags dürfen nicht als mehrere Käufe zählen. Geänderte fachliche Parameter benötigen eine neue ausdrückliche Vorschau; dieselbe Vorgangs-ID mit abweichenden Parametern ist ungültig.

| Phase | Bereits dauerhaft gesichert | Nächster zulässiger Schritt |
| --- | --- | --- |
| `intent` | Bestätigter Auftrag und feste Parameter | Bindung/Guthaben prüfen, Datei-ID reservieren |
| `reserved` | Kandidaten-ID, exakter Inhalt/Hash und Ausgangskopf | Genau diesen Inhalt anlegen und nachlesen |
| `uploaded` | Vollständig geprüfter Kandidat | Pointerversuch vor dem Senden protokollieren |
| `pointer-pending` | Vollständiger zu sendender bedingter PUT | Senden oder nach Neustart zuerst nachlesen |
| `reconciling` | Schreibbefund oder unbekannter Ausgang | Vollständige gültige Kette auf dieselbe Operation prüfen |
| `confirmed` | Identischer Beleg in gültiger Kette | Besitz/Ausgaben atomar aus der Projektion übernehmen |
| `rejected` / `superseded` | Eindeutige Ablehnung oder überholte Epoche | Kein Besitz, keine Ausgabe; gegebenenfalls neue Vorschau |

Jeder Übergang wird über den serialisierten Produktzustand gespeichert und validiert. Schlägt das Speichern fehl, beginnt der davon abhängige Netzschritt nicht. Eine Reservierung vor dem Speichern kann höchstens eine unbenutzte ID hinterlassen, keine Abbuchung.

Nach Neustart werden Authentifizierung und Bindung erneut geprüft. Die Dateiregistrierung wird aus dauerhaft gespeicherten Kandidaten und der gebundenen Konfiguration aufgebaut; fremde IDs aus beliebigem JSON werden nicht als schreibbar registriert. Bereits bestätigte fremde Belege werden über ihren verifizierten Kopf-/Vorgängerhash ausschließlich lesend erschlossen. Lokale Schreibberechtigung entsteht daraus nicht.

### Antwortverlust und Fortsetzung

Ein erneuter Start liest zunächst. Ist der Auftrag in der Kette enthalten, gilt er einmalig als bestätigt, auch als Vorfahr nach späteren Käufen oder nach einem Restore. Historischer und aktiver Besitz werden getrennt dargestellt.

Ist der Ausgang unklar und der Beleg nicht gefunden, erfolgt **kein automatischer neuer Pointer-PUT**. Eine sichtbare Aktion „Kauf fortsetzen“ darf nach erneuter Prüfung exakt denselben gespeicherten PUT mit derselben Schreibkennung und demselben Kandidaten wiederholen. Dies erweitert den Probevertrag mit genau einem PUT ausdrücklich um eine kontrollierte Wiederholung desselben Versuchs. Es wird keine neue ID zur Umgehung eines unbekannten Ausgangs erzeugt.

Eine 412 oder ein vollständig geprüft fortgeschrittener Kopf ohne die Operation macht den alten Versuch unwirksam, sofern die Kette lückenlos erhalten und die Bindung gleich geblieben ist. Vor einem neuen Versuch werden Kopf, Guthaben, Preis und Epoche erneut geprüft; eine neue Vorschau ist nötig. Ein später eintreffender alter PUT besitzt weiterhin seine verbrauchte alte Bedingung. Wiederholt derselbe Benutzer den Kauf nach bestätigtem Besitz, wird dieser angezeigt, ohne neue Datei oder Ausgabe.

## 6. Punkte, Preise und Besitz

Die vorhandene `project(ledger)`-Logik bleibt die Quelle für Lernpunkte einschließlich einmaliger Antworten/Rundenabschlüsse. Eine dauerhaft gespeicherte Basis enthält den vollständig validierten Fachstand der verwendeten Epoche, referenziert über unveränderliche Teile und ein gehashtes Manifest. Vorhandene unveränderte Teile dürfen anhand ihrer vollständigen Referenzen wiederverwendet werden. Ein einzelner übermittelter Gesamtzähler ist keine Guthabenquelle.

Der Kaufbeleg bindet diese Basis, Profil und eingefrorenen Katalogpreis. Beim Prüfen werden Punkte erneut aus dem Fachstand abgeleitet und alle zuvor bestätigten Ausgaben desselben Profils/der aktiven Kaufepoche berücksichtigt. Neue Basen müssen die bislang wirksame Grundlage erhalten oder über den ausdrücklich bestätigten Restorepfad ersetzen. Unvollständige Fakten, kollidierende Antworten, widersprüchliche Epochen oder eine nachträglich unter die bereits bestätigten Ausgaben fallende Punktesumme sperren weitere Käufe und verlangen Klärung. Kein stiller Kredit und kein Löschen vorhandener Belege.

Vorhandene Lernpunkte sind unmittelbar die anfängliche Grundlage; es gibt keine Migrationsgutschrift. Für Entwicklungsformen wird die direkte Vorgängerstufe geprüft. Kostenlose Level-/Grundformen folgen weiterhin dem Katalog und erzeugen keine bezahlten Belege. `evolutionOffer()` bleibt Anzeigehilfe, keine Kaufberechtigung. Klassische Avatarereignisse behalten ihre ursprüngliche Bedeutung.

## 7. Kauf und Wiederherstellung gemeinsam bestätigen

Die Belegfolge kennt `initialize`, `purchase` und `restore`. Jeder Knoten bindet Datensatz, Koordinationsordner, fortlaufende Sequenz und gehashten Vorgänger. Eine Wiederherstellung hängt einen neuen Beleg an; der Kopf wird niemals auf einen alten Knoten zurückgesetzt. So bleiben alte Operationskennungen dauerhaft auffindbar.

Ein `restore`-Beleg bindet neue Epoche, vollständig geprüften Zielsnapshot und den wirtschaftlichen Zielstand aller Profile. Die vorhandene Restorevorschau zeigt zusätzlich Besitz und Guthaben vorher/nachher. Ungeklärte lokale Kaufaufträge werden vorher nachgelesen; neue Käufe sind während der Bestätigung gesperrt. Sicherheitskopien werden wie bisher vorab erstellt und geprüft.

Alle Snapshotteile und die neue Epoche werden zunächst nur als Kandidaten hochgeladen. **Erst der bestätigte gemeinsame Kopfwechsel aktiviert die Epoche im neuen Produktmodus.** Das bisherige alleinige Veröffentlichen einer Epochen-Datei genügt dort nicht. Aktivierung, Kaufprojektion und Beenden alter lokaler Runden erfolgen gemeinsam in einer lokalen Transaktion, ohne Bonus.

Gewinnt zwischen Vorschau und Bestätigung ein anderer Kauf oder Restore, verliert der vorbereitete Pointer mit 412. Die App liest neu und verlangt eine erneute Vorschau. Alte Belege bleiben historisch, ohne den wiederhergestellten Besitz erneut zu belasten. Reiner Offline-Restore eines noch unverbundenen Bestands bleibt möglich; ein mit dem Kaufprotokoll verbundener Bestand verlangt weiterhin Netz und Abgleich. Ein Verbindungsfehler wird nicht zu „unverbunden“ umgedeutet.

## 8. Umstellung und ältere Programme

Lokale Umstellung und Cloudaktivierung sind getrennte Schritte. Vor der lokalen v1/v2-Umstellung werden validierte Sicherheitskopien erzeugt; der erweiterte Zustand wird atomar gespeichert. Vorbereitete alte Uploads, IDs, Hashes, PIN-Verifier und Lernereignisse werden nicht umgeschrieben. Offene Restoreaufträge müssen zuerst im bisherigen Modus abgeschlossen werden. Die neue Funktion bleibt bis zur vollständig bestätigten Cloudaktivierung inaktiv.

Der neue Produktmodus verwendet Format-/Regelversion 3 und erhält unveränderte v1/v2-Historie als solche. Die gebundene alte Datensatzbeschreibung bleibt unverändert. Ein expliziter v3-Formatmarker im bisherigen Produktordner verlangt bei älteren Apps ein Update; die aktuelle v2-Synchronisation prüft neue Versionsheader vor dem Upload. Eine bereits laufende alte Anfrage lässt sich dadurch nicht rückwirkend stoppen.

Deshalb verlässt sich die Kaufgrenze nicht allein auf den Marker: Die Aktivierung veröffentlicht über die gemeinsame Belegfolge eine neue aktive Epoche auf Basis des bestätigten bisherigen Standes. Späte alte Lernereignisse bleiben erhalten und werden wie bisher ausdrücklich übernommen; alte unkoordinierte Epochen-/Restoredateien dürfen im neuen Modus keinen Kopf aktivieren. Widersprüche werden angezeigt, nicht nach Zeitstempel gelöst. Vor Aktivierung sind die Markerwirkung sowie alte bereits laufende Uploads und Restores mit eingefrorenen v1/v2-Fällen zu prüfen.

Die Oberfläche meldet den Umstieg verständlich als Datenaktualisierung und bietet bei anderen alten Geräten „App aktualisieren“ an. Ein Offlinegerät kann bis zum nächsten Abgleich einen alten lokalen Stand zeigen; eine bereits erfolgte geräteübergreifende Umstellung darf nicht als offline erkennbar behauptet werden.

## 9. Belegaufbewahrung, Sicherungen und Wachstum

Die feste 64-Knoten-Grenze der Probe wird nicht als Lebenszeitgrenze übernommen. Die Produktlesung verarbeitet die vollständige Historie in begrenzten Arbeitsschritten und hält geprüfte Inhalte samt Hashes lokal vor. Beim nächsten Lesen muss ein geprüfter neuer Kopf an diese unveränderte Historie anschließen; alternative Ketten, fehlende Knoten und Hashabweichungen sperren. Beim ersten Geräteladen wird die gesamte benötigte Historie geprüft, mit Fortschrittsanzeige und ohne vorzeitige Kauferlaubnis.

Es gibt im ersten Integrationspaket keine automatische Verdichtung oder Löschung alter Quittungen. Begrenzungen des lokalen Speichers und die bestehende Backupgrenze von 25 MiB werden ausdrücklich geprüft; Überschreitung erzeugt eine verständliche Grenze und erhält den bisherigen Stand. Tests über 64 Belege und mindestens 1000 synthetische Transaktionen prüfen, dass kein stiller Historienverlust entsteht; dies ist keine Geschwindigkeitszusage für Drive.

Portable v3-Sicherungen enthalten sämtliche fachlich notwendigen Belege, Punktgrundlagen, aktive Auswahl und Herkunft. Sie enthalten keine Tokens, Kontoanmeldungen, lokalen HTTP-Schreibkennungen oder ausführbaren Kaufaufträge. Ein unklarer lokaler Auftrag darf durch Backupimport nicht nochmals ausgeführt werden. Vor vollständiger Wiederherstellung wird er mit seinem ursprünglichen Konto geklärt. Fremde Sicherungen übernehmen validierten wirtschaftlichen Zustand als Ziel des bewussten Restorevorgangs, keine fremden Drive-Steuerdateien.

## 10. Prüfung und Auslieferungsgrenze

Das Integrationspaket wird in drei überprüfbaren Schritten umgesetzt:

1. **Dauerhafte Grundlage:** Schema, gebundener Transport, Journal und Wiederaufnahme mit neuem Speicher-/Serviceobjekt. Noch kein aktivierter Shop und keine automatische Cloudmigration.
2. **Produktvertrag:** echte Punkte/Katalog, gemeinsame Epochen-/Restoregrenze, Backupformat und gesicherte Migration; alte Clients und gleichzeitige Geräte simulieren.
3. **Anbindung:** Einrichtung/Status und Kaufaktionen an die vorbereitete Galerie anschließen. Erst nach den bestandenen Integrationsprüfungen reale Käufe im neuen Modus anbieten. Die vollständige Bilderproduktion und Gestaltung von „Meine Figur“, „Entwicklung“ und „Shop“ bleibt ein eigener Oberflächenumfang innerhalb der bestätigten Entscheidungen.

Pflichtfälle: Neustart vor/nach jedem Speicher-/Netzschritt; angenommener Upload ohne Antwort; 409 mit falschem Inhalt; Pointererfolg ohne lokalen Abschluss; spätere Käufe vor Wiederaufnahme; identische ID mit geänderten Parametern; zweites Gerät mit leerem Cache; falsches Konto/Profil/Ordner; konkurrierende Einrichtung und Käufe; beide Restore-Reihenfolgen; veraltete Apps und verspätete Offlineereignisse; beschädigte/fehlende Quittungen; Wachstum über 64 Einträge; v1/v2-Hashes und -Punkte; fehlgeschlagene Migration und voller lokaler Speicher.

Automatisierte Integration nutzt ausschließlich synthetische Daten. Der erfolgreiche Bericht10 bleibt der vorhandene Realbeleg für das Grundverfahren. Spätere reale Wiederaufnahme, zwei physische Geräte sowie iPhone/iPad werden separat nachgewiesen; kein identischer 10er-Wiederholungslauf. Bei ausgelieferten Produktänderungen Cachekennung und explizite Assetliste aktualisieren und Offline-/Updatefälle prüfen.

Geplante Ausführung nach Zustimmung: abgegrenzte Implementierung mit GPT-5.6 Sol/hoch, unabhängige Prüfung der Daten-/Kaufgrenzen mit GPT-6 Astra/hoch. Dieser Entwurf wurde lokal anhand der bestehenden Module ausgearbeitet; dafür wurden keine zusätzlichen Agenten gestartet. Der detaillierte Implementierungsplan folgt nach der konkreten Entwurfsabstimmung.

## 11. Quellen und Einordnung

- Lokale Grundlagen: [Produktdatenformat](../../PRODUKT-DATENFORMAT.md), bestätigter [Shopentwurf](2026-09-19-avatar-shop-design.md), [Probevertrag](2026-09-20-immutable-purchase-probe-design.md), [Bericht10](../../reports/2026-09-20-shop-v10-reallauf.md).
- [Google: v2-Metadatenupdate](https://developers.google.com/workspace/drive/api/reference/rest/v2/files/update) dokumentiert PUT und Patch-Semantik; die verwendete bedingte Koordination bleibt durch unsere Probe gestützt, keine daraus abgeleitete allgemeine Servergarantie.
- [Google: Uploads mit reservierten IDs](https://developers.google.com/workspace/drive/api/guides/manage-uploads#use_a_pre-generated_id_to_upload_files) beschreibt Wiederholung und 409. Die zusätzliche Bindungs-/Hashprüfung und das Kaufjournal sind unser Vertrag.
- [Google: private Dateieigenschaften](https://developers.google.com/workspace/drive/api/guides/properties#limits_of_custom_file_properties) begrenzt Anzahl und UTF-8-Größe; das Kontomodell wird deshalb in Inhalten gehalten, nicht als große Properties-Liste.

Öffentliche Referenzen am 20.09.2026 geprüft. Entwurf gegen unveränderte Produktmodule, bestätigte Punkte-/Restoreentscheidungen und die Grenzen des Berichts10 abgeglichen. Kein Produktcode geändert, keine Cloudobjekte angelegt und keine neue Abnahme behauptet.
