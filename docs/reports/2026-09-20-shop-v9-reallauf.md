# Echter Shop-Probelauf 9: positiver Teilnachweis der Ordnerkoordination

Stand: 20.09.2026. Auswertung auf `cc979f495f746f2a27b41c7422c136c9c34ee08c`. Quelle ist der vom Nutzer übergebene Bericht `shop-probe-bericht9.json`; kein erneuter Google-Lauf durch den Assistenten. Die Rohdatei bleibt außerhalb des Repositorys.

- SHA-256: `287e73e7b34f5e32bda0f4e2b150de58d11d58eb27d9ee683c7a06547059baed`.
- Diagnoseversion 9, `etagSource:v2-coherent`, `probeScope:metadata-coordination`.
- Laufzeit: 20.09.2026, 18:07:35.537–18:07:52.492 UTC; Windows/Edge 153, localhost:4173.
- Ergebnis: **3 bestanden, 1 fehlgeschlagen, 0 unsupported**, `passed:false`, `productReady:false`.

## Tatsächliche Ergebnisse

| Check | Schreibantwort | Unabhängige Nachlese | Wertung |
| --- | --- | --- | --- |
| Ordner-Fixture | Anlage erfolgreich | Strenge Metadatenprüfung bestanden | Bestanden |
| Absichtlich veränderte ETag | HTTP **500**, Klasse `http` | Properties vollständig gleich | Fehlgeschlagen: erwartete 412 fehlt |
| Verbrauchte echte ETag | Erster PUT **200**, zweiter PUT **412** | Erster Gewinner samt Erhaltungsmarker vor und nach dem zweiten PUT bestätigt | Bestanden |
| Zwei konkurrierende PUTs | Vorbereitung **200**, Kandidat A **412**, Kandidat B **200** | Vorbereitung und vollständiger Gewinner B samt Erhaltungsmarker bestätigt | Bestanden |

Alle drei Zielchecks erreichen `phase:complete`. Es gibt keinen frühen Lesestabilitätsabbruch wie in den JSON-/Medienpfaden der Berichte 5–8. Der Metadatenumfang verwendet doppelte `no-store`-Abrufe und keine Inhaltsdownloads. Bei den Nachlesevergleichen bedeutet `equal` Gleichheit der vollständigen privaten Properties; daraus nicht unveränderte allgemeine Dateiversionen oder sämtliche sonstigen Drive-Metadaten ableiten.

## Einordnung des fehlgeschlagenen Negativfalls

Der Code bildet für diesen Fall aus der echten starken ETag durch Anhängen eines Zeichens innerhalb der Anführungszeichen einen garantiert verschiedenen Testwert. Er bleibt syntaktisch eine starke HTTP-ETag, ist aber kein unverändert von Google gelieferter Validator. ETags sind laut HTTP-Spezifikation opake Werte; ihr internes Google-Format ist daraus nicht bekannt. [RFC 9110, ETag](https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.3).

Google lieferte auf diesen PUT **500**, nicht 412. Der anschließende Properties-Vergleich war vollständig und gleich. Die Probe meldet folgerichtig `actual:assertion`: Ihre konkrete Bedingung `stale` plus HTTP 412 plus unveränderte Properties wurde nicht erfüllt. Das ist keine Annahme der Änderung und auch kein bestandener Negativtest.

Google ordnet 500 als unerwarteten Fehler bei der serverseitigen Verarbeitung ein. Ob der künstliche Token eine interne Verarbeitungsecke auslöste oder ein unabhängiger Serverfehler auftrat, ist **nicht nachgewiesen**. Der bereinigte Bericht enthält bewusst keinen rohen Fehlerbody. Eine Formatursache darf deshalb nur als Hypothese gelten. [Google: Serverfehler](https://developers.google.com/workspace/drive/api/guides/handle-errors#500_502_503_504_errors).

500 wird weder nachträglich zu 412 umgedeutet noch in einen Erfolg umgewertet. Allgemein kann ein unbekannter Schreibausgang nicht allein anhand eines 5xx-Status als sicher unverändert behandelt werden; für diesen Versuch liegt zusätzlich die erfolgreiche Properties-Nachlese vor. Keine blinde Neuausgabe mit neuer Vorgangs-ID und kein Wiederholen bis zu einem grünen Zufallsergebnis.

## Bedeutung für den direkten Drive-Ansatz

Erstmals liegt für den **isolierten v2-Ordner-Metadatenpfad** in diesem Probelauf ein positiver Teilnachweis vor: Eine tatsächlich verbrauchte, zuvor echte Kennung wurde mit 412 abgewiesen. Bei den beiden aus demselben Snapshot gestarteten konkurrierenden Änderungen wurde genau eine bestätigt; anschließend wurde genau deren vollständiger Stand gelesen. Der synthetische Negativfall mit manipulierter Kennung bleibt davon getrennt fehlgeschlagen.

Das stützt die weitere Untersuchung dieser Grenze innerhalb der bestätigten Richtung C. Es beweist keine allgemeine Servergarantie, keine dauerhafte Linearität und keinen vollständigen Kaufvertrag. Die v2-Referenz dokumentiert Metadatenupdates, nennt aber keine spezielle `If-Match`-Garantie. [Google: files.update](https://developers.google.com/workspace/drive/api/reference/rest/v2/files/update).

## Konsequenz und nächster Arbeitsauftrag

Keinen unveränderten 9er-Lauf anfordern. Keine Diagnose 10 nur zur Umfärbung des 500-Falls erstellen. Bestehende Schutzbedingungen und die Bewertung `productReady:false` bleiben unverändert; die Produktoberfläche wird durch diese Auswertung nicht verändert.

Als nächstes den **vollständigen Koordinationsvertrag mit Ordnerverweis auf unveränderliche Kaufzustände** konkretisieren. Dies ist eine technische Folgeaufgabe innerhalb C, kein bereits freigegebener Implementierungsplan und keine Produktintegration. Der Entwurf muss insbesondere behandeln:

1. Einen eindeutigen gemeinsamen Koordinator für denselben Bestand, dasselbe Kind und dieselbe Epoche; konkurrierende Initialisierung darf keine zwei getrennten Guthabenquellen erzeugen.
2. Unveränderliche Inhaltskandidaten mit gebundener Identität und Prüfsumme; Inhaltsabruf außerhalb der Ordner-Schreibgrenze. Der 8er-Befund rechtfertigt kein pauschales Weglassen von Versionsprüfungen im bestehenden Adapter.
3. Zwei konkurrierende Käufe mit Guthaben für nur einen; nur der bestätigte Ordnerverweis macht einen Kandidaten verbindlich. Nicht referenzierte Kandidaten sind keine Käufe.
4. Dauerhafte Vorgangs-ID und überprüfbare Belegkette, um angenommene Käufe auch nach verlorener Antwort und weiteren Käufen wiederzuerkennen. Bei 5xx/Netzabbruch bleibt der Ausgang bis zur Belegprüfung unklar; keine doppelte Ausgabe.
5. Gemeinsame Grenze für Kauf und Epochenwechsel/Wiederherstellung; verspätete alte Vorgänge bleiben unwirksam. Aufbewahrung nicht referenzierter Dateien und Verhalten alter App-Versionen gesondert festlegen.

Der nächste sinnvolle reale Nachweis betrifft danach einen solchen zusammenhängenden synthetischen Kaufablauf. Er ist derzeit noch nicht implementiert. Die laufende Diagnose 9 bleibt unverändert verfügbar. Google-Anbieter, vorbereiteter Zugang, Punkteverbrauch, Preise und Bildentscheidungen bleiben bestehen; neue Backenddienste sind nicht gewählt. Physische Zwei-Geräte-, Apple- und HTTPS-Nachweise bleiben offen.

## Prüfung dieser Auswertung

Rohdatei gehasht; Diagnoseversion, Quelle, Umfang, Anzahl und einzelne Schreib-/Nachleseergebnisse maschinell ausgelesen und mit dem bestehenden Szenario-/Transportcode verglichen. `npm run check:docs` prüfte 1115 Dateien, 178 Markdown-Dateien und 847 lokale Links ohne Fehler; `git diff --check` war ohne Befund. Keine Runtimeänderung, keine erneute Ausführung unveränderter Node-/Browsersuiten und kein echter Google-Aufruf.
