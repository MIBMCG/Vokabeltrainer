# Zusammenhängende Kaufprobe mit unveränderlichen Belegen

Stand: 20.09.2026. Konkrete Fortsetzung der bestätigten [Richtung C](../../design/2026-09-20-kaufkoordination-nach-diagnose6.md) nach [Bericht 9](../../reports/2026-09-20-shop-v9-reallauf.md). Die Nutzerfortsetzung „Dann geht es nun weiter“ bezieht sich auf diesen nächsten technischen Schritt. Dieses Paket verändert weder Produktregeln noch Cloudanbieter und aktiviert keine Produktkäufe.

## Ziel und Grenze

Ein ausführbarer, getrennt prüfbarer Kaufablauf verbindet gemeinsame Initialisierung, konkurrierende Ausgaben, unveränderliche Belege, Wiederfinden nach verlorener Antwort und einen gemeinsamen Wechsel der Epoche. Ausschließlich neue synthetische Objekte unter `SHOP-PROBE-…`; keine Produktdateien, keine Löschungen, keine echten Punkte.

Die Probe verwendet zwei logische Clients innerhalb einer Sitzung. Wiederaufnahme bedeutet hier: neues Koordinatorobjekt, dieselbe Transportregistrierung und dieselbe gespeicherte Operationskennung im Speicher. Eine Wiederaufnahme nach Browserneustart, echte zwei Geräte, Produktmigration und alte Programmversionen sind ausdrücklich nicht nachgewiesen.

## Wahl des Vertrags

Die gemeinsame JSON-Datei bedingt zu überschreiben bleibt wegen der bisherigen Befunde ungeeignet. Eine zeitlich befristete Sperrdatei hätte zusätzlich Ablaufzeiten, verwaiste Sperren und konkurrierende Sperrinhaber zu lösen. Gewählt ist deshalb der in Bericht 9 vorbereitete Weg: **Ein Ordnerverweis bestimmt die einzige gültige Kette unveränderlicher Kaufbelege.**

Der neue Pfad ist ein eigener Prüfumfang `immutable-purchases`. Die alten Prüfumfänge einschließlich des fehlgeschlagenen künstlichen ETag-Falls bleiben unverändert. Version 10 bezeichnet diesen neuen zusammenhängenden Versuch, keine Umwertung von Bericht 9. `productReady` bleibt stets `false`.

## Gemeinsamer Anker und Inhalt

Der Versuch legt einen synthetischen Hauptordner und je Szenario einen gemeinsamen Koordinationsordner sowie einen getrennten Inhaltsordner als Geschwister an. Beide logischen Clients erhalten dieselben bereits geprüften Ordner-IDs. Die Kandidatenanlage findet so außerhalb des Ordners statt, dessen Metadaten bedingt geschrieben werden. Das ist eine vorsorgliche Isolation; ob Drive beim Anlegen eines Kindes Elternmetadaten ändern würde, ist damit nicht behauptet. Keine Suche nach Namen, keine getrennt erzeugten Konten mit anschließendem „Gewinner nach Zeitstempel“.

Im gemeinsamen Ordner stehen genau drei zusätzliche private Eigenschaften: `purchaseProtocol=1`, `purchaseHeadId` und `purchaseHeadHash` (64 kleine Hex-Zeichen, SHA-256). Entweder fehlen alle drei oder alle sind gültig. Bestehende Eigenschaften einschließlich `app`, `runId` und eines Erhaltungsmarkers bleiben bei jedem Schreibvorgang erhalten. Vor dem PUT werden Googles Grenzen von 30 privaten Eigenschaften je App und 124 UTF-8-Bytes pro Schlüssel/Wert-Paar geprüft; Überschreitung führt zum Abbruch.

Ein Beleg ist JSON mit genau `format:1`, `anchorId`, `sequence`, `previous` (null oder `{id,sha256}`) und `operation`. Der Hash gilt für eine kanonische JSON-Darstellung, nicht für beliebige Formatierungsunterschiede. Nur endliche JSON-Werte und einfache Objekte sind erlaubt. Höchstens 64 KiB pro Inhalt und 64 Belege pro Kette; Überschreitung stoppt die Probe, sie kürzt keine Historie.

Operationen:

- `init`: `{kind:'init',id,epoch,earned:1000}`; ausschließlich an leerem Anker, Sequenz 0.
- `purchase`: `{kind:'purchase',id,epoch,article,price}`; positive ganzzahlige Preise bis 1000, genügend Restpunkte und noch kein Besitz dieses Artikels in der aktiven Epoche. Dies sind synthetische Artikel; kein Ersatz für den bestätigten Produktkatalog.
- `reset`: `{kind:'reset',id,epoch,nextEpoch,earned:1000}`; nur aus aktueller Epoche in eine bisher unbenutzte neue Epoche. Die aktive Punktesumme und Besitzliste beginnen neu, die Belegkette bleibt vollständig erhalten.

Kennungen sind nichtleere, begrenzte ASCII-Kennungen ohne Pfadzeichen. Sequenzen steigen exakt um eins. Alle Knoten gehören zum selben Anker. Der Zustand wird aus der vollständig geprüften Kette neu berechnet: keine ungeprüfte Balance aus einem Endknoten übernehmen. Wiederholte Operationskennungen innerhalb der Kette, Zyklen, ungültige Übergänge, unbekannte Felder oder beschädigte Verweise sperren den gesamten Zustand.

## Unveränderlicher Transportvertrag

Neue Methoden im isolierten v2-Transport:

1. `prepareImmutable({parentId,value})` reserviert eine Datei-ID, bindet ID, Elternordner, kanonischen Inhalt und Hash in der Transportregistrierung und liefert `{id,sha256}`. Noch kein Upload.
2. `writeImmutable(ref)` legt genau diesen registrierten Inhalt unter genau dieser reservierten ID an. Eine wiederholte Anlage darf 409 liefern, gilt aber erst nach vollständiger Bindungs- und Hashprüfung als vorhandener identischer Inhalt. Kein Überschreiben und keine neue ID bei unklarer Antwort.
3. `readImmutable(ref,{parentId})` prüft registrierte ID/Hash, erwarteten Inhaltsordner, Titel, MIME-Typ, App/Laufbindung und Papierkorbstatus vor und nach dem Inhaltsabruf; alle Aufrufe ohne HTTP-Cache. Der optionale `parentId` muss bei Angabe zur Registrierung passen; der Koordinator gibt ihn immer mit. Nur ein inhaltlich passender SHA-256-Wert liefert JSON zurück.

Diese Methoden liefern **keine bedingte Schreibkennung für den JSON-Inhalt**. Eine reine File-Versionsänderung beim Lesen ist hier kein Integritätsnachweis und kein Konflikttoken: Entscheidend sind Bindung und der vorher festgelegte Inhaltshash. Die strengere Versions-UND-ETag-Prüfung der bisherigen veränderlichen Snapshots bleibt unverändert. Registrierte unveränderliche Dateien dürfen auch über die alten Update-/Retry-Methoden nicht mit anderen Inhalten überschrieben werden.

## Ablauf eines Kaufs

`createPurchaseCoordinator({transport,anchorId,contentParentId=anchorId})` bietet `read()`, `prepare(operation)`, `commit(ticket)` und `recover(operation)`. Die ausführbaren Szenarien geben immer den getrennten Inhaltsordner an; der Default dient kleinen lokalen Vertragsprüfungen. Jede gelesene Referenz wird an `contentParentId` gebunden, zusätzlich zur Ankerkennung im Inhalt.

`read()` liest einen doppelt kontrollierten Ordner-Snapshot, folgt dem Kopfverweis bis zur Initialisierung, prüft jeden Inhalt und spielt die Operationen vorwärts ab. Danach liest es den Ordner erneut. Version, ETag und alle Eigenschaften müssen über diese äußere Klammer gleich geblieben sein. Unklare oder veränderte Lesungen werden abgebrochen; kein versteckter Wiederholungsversuch.

`prepare()` prüft den Zustand und die vollständige Operationsidentität. Ein bereits belegter identischer Auftrag wird ohne Upload oder PUT wiedergefunden; dieselbe Kennung mit anderen Parametern ist ein Konflikt. Ein neuer gültiger Auftrag reserviert einen Beleg mit dem bisherigen Kopf als Vorgänger. Das Ticket bleibt an diesen Koordinator und seine geprüfte Ausgangsversion gebunden; manipulierte/fremde Tickets werden zurückgewiesen.

`commit()` lädt zunächst den unveränderlichen Kandidaten hoch und prüft ihn. Erst danach schreibt es den Ordnerverweis per v2-Metadaten-PUT und exakt der unveränderten starken ETag aus der Ausgangsversion. Genau ein PUT, kein automatisches Wiederholen. Eine bestätigte HTTP-Antwort ist ein Schreibbefund, noch keine freigegebene Figur. 412 bedeutet verworfene Ausgangsversion. Netzwerkfehler, 5xx und ungültige Erfolgsantworten bleiben unklar; Status und Phase bleiben als bereinigter Befund erhalten.

Solange nach einem unklaren Upload noch kein Pointer-PUT versucht wurde, bleibt das Ticket mit derselben reservierten Kandidaten-ID ausdrücklich fortsetzbar. Eine erneute Vorbereitung derselben Operation darf diese ID nicht still ersetzen. Gleichzeitige Commit-Aufrufe desselben Tickets werden gesperrt; sobald ein Pointerversuch begonnen hat, darf dieses Ticket keinen zweiten PUT auslösen. Fehlerhafte 2xx-Antworten in der verpflichtenden Upload-Nachlese bleiben ebenso unklar wie fehlerhafte POST-Antworten.

`recover()` liest die vollständige gültige Kette erneut. Eine passende Operationskennung mit denselben Parametern belegt den Kauf auch dann, wenn inzwischen ein weiterer Kauf oder Reset folgte. Das Ergebnis unterscheidet aktiven von historischem Besitz. Keine gefundene Quittung ist **keine** Erlaubnis, einen unklaren Auftrag unter neuer Kennung nochmals zu berechnen. Ein bereits belegter Auftrag wird durch Wiederholung nicht erneut abgezogen.

Verlierende Kandidatendateien bleiben ohne wirtschaftliche Wirkung liegen. Keine automatische Bereinigung in diesem Paket. Die Ordnerbedingung ist weiterhin ein zu untersuchender Drive-Kandidat, keine von den bisherigen Einzelversuchen bewiesene allgemeine Servergarantie.

## Zusammenhängende Szenarien

Jeder Check nutzt einen frischen eigenen Unterordner; ein Fehler darf spätere unabhängige Checks nicht verdecken:

1. Zwei Initialisierungen bereiten sich am selben leeren Anker vor; genau ein PUT mit 2xx, genau ein 412, genau die vollständige Operation des bestätigten Gewinners als geprüfte Wurzel. Die abgewiesene Operation fehlt. Erhaltungsmarker bleibt erhalten.
2. Zwei Käufe zu je 800 aus 1000 Punkten: beide vorbereiten, parallel schreiben. Genau ein 2xx, ein 412; ursprüngliche Initialisierung und vollständige Gewinneroperation bleiben in der Kette. Genau dessen Artikel gehört zum Besitz, 200 Restpunkte bleiben. Der verlorene Kandidat fehlt; passende Summen allein genügen nicht.
3. Derselbe belegte Auftrag erneut: keine zweite Abbuchung, keine neue Datei, kein weiterer PUT. Gleiche Kennung mit geändertem Artikel/Preis wird abgelehnt.
4. Eine erfolgreiche Kaufantwort wird lokal verworfen; ein zweiter kleiner Kauf wird danach angehängt. Ein neu erzeugter Koordinator findet die erste Quittung als Vorfahren und bestätigt insgesamt exakt die beiden Ausgaben. Dies simuliert Antwortverlust, keinen echten Netzabbruch.
5. Reset gewinnt vor einem vorbereiteten alten Kauf: Reset bestätigt, alter PUT 412; der aktive Zustand bleibt bei 1000 Punkten ohne alten Besitz. Neu vorbereitete Operationen aus der alten Epoche werden abgewiesen.
6. Kauf gewinnt vor vorbereitetem Reset: alter Reset-PUT 412; Reset ausdrücklich frisch vorbereiten und veröffentlichen. Alte Kaufquittung bleibt auffindbar, gilt aber als historisch und erzeugt weder neuen Besitz noch neue Ausgabe.

Zusätzliche lokale Fehlerprüfungen: beschädigte Inhalte/Hash/Bindung, teilweise Kopf-Properties, fehlende Kettenglieder, doppelte Kennungen, Zyklen, zu lange Ketten/Inhalte, ungültige Beträge, ignorierte Schreibbedingungen, fehlende Berechtigung, unklare Antwort mit und ohne erfolgtes Schreiben, verlorene Uploadantwort und Wiederholung derselben Datei-ID. Der alte veränderliche Leseguard muss weiterhin fehlschlagen, wenn seine Version wechselt.

## Bericht und Produktgrenze

Exporte enthalten nur feste Szenarionamen, Ergebnis-/Fehlerklassen, begrenzte Zähler, HTTP-Status und Boolesche Vergleiche. Vorhandene Commitbefunde behalten ihre Upload-/Pointerphase, erlaubte Fehlerklasse und HTTP-Status auch bei anschließendem Abbruch; feste begrenzte Gruppen trennen vorbereitende und spätere Schreibvorgänge. Keine Datei-IDs, ETags, Hashwerte, Inhalte, Google-Tokens, Operationsobjekte oder rohe Fehlermeldungen. Beide logischen Clients laufen in einem Browser. Alle neuen Objekte bleiben synthetisch und erhalten.

Vor Produktintegration benötigt es zusätzlich eine dauerhaft gespeicherte Auftragsabsicht vor dem ersten Netzschritt, Wiederaufnahme mit neuer Transportinstanz, die Bindung an den verifizierten Produktordner, echte Lernpunkte je Profil, den Produktkatalog, Backups und ein Migrationsprotokoll. Insbesondere der bestehende Produkt-Epochen-DAG und offline veröffentlichte Wiederherstellungen laufen noch nicht durch diesen Ordnerverweis. Solange alte Clients daran vorbeischreiben könnten, wäre eine gemeinsame Kauf-/Reset-Grenze im Produkt nicht gewährleistet. Dieses Paket behauptet deren Lösung nicht und ändert den Produktvertrag nicht.

Die Grenze von 64 Belegen ist eine Schutzgrenze dieser Probe. Für den dauerhaften Produktbetrieb ist außerdem eine Aufbewahrungs-/Skalierungsstrategie nötig, die alte Operationsquittungen nicht verliert und damit die Wiedererkennung früherer Käufe erhält.

## Öffentliche Referenzen

- [Drive v2 files.update](https://developers.google.com/workspace/drive/api/reference/rest/v2/files/update): Metadaten-PUT mit Patch-Semantik; keine ausdrückliche If-Match-Garantie in dieser Methodenbeschreibung.
- [Private Dateieigenschaften](https://developers.google.com/workspace/drive/api/guides/properties): Anzahl- und Bytegrenzen.
- [Uploads mit vorab erzeugten IDs](https://developers.google.com/workspace/drive/api/guides/manage-uploads): Wiederholung einer Anlage mit reservierter ID; 409 erfordert hier zusätzlich die eigene Inhaltsprüfung.

Geprüft am 20.09.2026. Der Hashvertrag und das Kaufprotokoll sind unser Entwurf, keine zugesagte Funktion von Google Drive.
