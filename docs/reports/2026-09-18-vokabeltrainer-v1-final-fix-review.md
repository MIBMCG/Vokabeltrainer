# Finale Nachprüfung der konsolidierten Fixwelle

Datum: 18.09.2026. Vergleich: `807a722e6f962966449ef14f7c44c5944dd95ed1` bis `c2560f051ccb0e3a23098683faa7d3634485d8f7`; Produktfix: `cc079cbea31d6d834b7d8eba1920486daddb4e90`.

## Befundentscheidungen

### I1 — Adressiert

Der gesperrte Erwachsenen-Zugang bietet jetzt denselben Wiederherstellungsdialog wie die entsperrten Einstellungen: [shell.js](../../src/trainer/ui/shell.js), Zeile 279, und [adult.js](../../src/trainer/ui/adult.js), Zeilen 443–471. Der Dialog ruft den bestehenden PIN-Service mit Bestätigungstext und zweimal neuer PIN auf. Eine alte PIN oder Google-Verbindung ist dafür nicht nötig. Der Browserfall in [trainer.browser.mjs](../../tests/browser/trainer.browser.mjs), Zeile 46, prüft den tatsächlichen gesperrten App-Zugang nach Neuladen, unveränderte Lerndaten und anschließendes Entsperren mit der neuen PIN.

### I2 — Adressiert

[shell.js](../../src/trainer/ui/shell.js), Zeilen 405–416, erhält bei Hintergrundänderungen die entsperrte Erwachsenenansicht einschließlich Eingaben, Fokus und der ursprünglichen Revisionsköpfe. [adult.js](../../src/trainer/ui/adult.js), Zeilen 27–36, ergänzt bei geändertem Ledger einen ausdrücklichen Hinweis und die Aktion zum Neuladen mit Verwerfen der Eingaben. Eine PIN-Sperre durchläuft weiterhin den Sperrpfad. Der Fehlerpfad beim Speichern einer inzwischen überholten Wortrevision erhält die Eingabe, statt das Formular zu ersetzen (Zeilen 197–201).

Der Browserfall in [trainer.browser.mjs](../../tests/browser/trainer.browser.mjs), Zeile 74, deckt unveränderten Abgleich und empfangene Fremdrevision ab: mehrere Erwachsenenformulare, Tabellentext, aufgeklappte Details und Fokus bleiben erhalten. Ein Speicherversuch mit den ursprünglichen Revisionsköpfen wird zurückgewiesen; ausdrückliches Neuladen zeigt den Fremdstand und verwirft den Entwurf. Auch die anschließende PIN-Sperre wird geprüft. Das entspricht der genehmigten Entscheidung 26.

### I3 — Adressiert

[ui/sync.js](../../src/trainer/ui/sync.js), Zeilen 53–55 und 90–95, ruft nach erfolgreicher Anmeldung und erneuter PIN-Prüfung den optionalen Verbindungs-Callback auf. [main.js](../../src/trainer/main.js), Zeilen 256–261, weckt darüber den vorhandenen Scheduler ausschließlich bei entsperrtem Erwachsenenbereich, bestehender Datenbindung und nicht beendetem App-Lebenszyklus. Der Callback wird durch Shell und Erwachsenenansicht weitergereicht.

Der Browserfall in [trainer.browser.mjs](../../tests/browser/trainer.browser.mjs), Zeile 145, erzeugt ausstehende Daten und einen tatsächlichen Authentifizierungsfehler in der synthetischen Drive-Gegenstelle. Er prüft nach bewusstem Wiederverbinden den automatischen Upload ohne zusätzliches Lebenszyklusereignis, genau einmal enthaltene Ereignisse sowie wiederkehrendes Polling ohne doppelte Schreibvorgänge.

### I4 — Adressiert

[shell.js](../../src/trainer/ui/shell.js), Zeilen 282–313, übernimmt die offene Antwort bei konkurrierenden Wiederherstellungsköpfen in einen flüchtigen Entwurf und zeigt sie im Konfliktzustand schreibgeschützt. Der Entwurf bleibt über den Wechsel in die Erwachsenenansicht erhalten. Nach Wechsel zur aufgelösten Epoche wird er verworfen; dies gilt auch bei einer Auflösung während geöffneter Erwachsenenansicht (Zeilen 412–415). Der Update-Guard berücksichtigt den RAM-Entwurf unabhängig vom sichtbaren Eingabefeld (Zeilen 447–448).

Der Browserfall in [trainer.browser.mjs](../../tests/browser/trainer.browser.mjs), Zeile 185, empfängt zwei gültige synthetische Epochenköpfe samt Snapshots über die realen Commands und löst sie über den realen Wiederherstellungsablauf auf. Er prüft den erhaltenen Antworttext, blockierte Antwort-/Runden-/Update-Aktionen, den Wechsel zur Erwachsenenansicht und zurück sowie das Verwerfen ohne Antwort- oder Abschlusswertung nach Auflösung. Dies ist Browser-Integration mit synthetischem Empfang, kein Nachweis einer echten Google-Übertragung.

## Neue Regressionen im Fixumfang

Keine neuen Critical-, Important- oder Minor-Befunde festgestellt. Der Cachewechsel auf v5 und die zugehörigen Testanpassungen für das kontrollierte Update auf v6 sind konsistent. Die genehmigten Grenzen bleiben erhalten: kein neues Persistenzschema, kein neues Produktmodul, keine automatische Google-Anmeldung und keine dauerhafte Speicherung des Konfliktentwurfs.

## Beobachtungen außerhalb des Umfangs

Keine neu aufgenommen. Die bereits ausdrücklich zurückgestellten realen Google-/Zweigeräte-, Apple-/Home-Screen-, Mindestversions- und HTTPS-Abnahmen bleiben unverändert offen. Die nachgelagerte Aktualisierung der Status- und Übergabedokumente gehört zum Abschluss durch den Hauptagenten.

## Prüfgrundlage und Aussagegrenze

Dies ist die einmalige, begrenzte Nachprüfung von I1–I4 aus dem [Gesamtreview](2026-09-18-vokabeltrainer-v1-gesamt-review.md), einschließlich möglicher durch die Fixes verursachter Regressionen. Der vollständige bereitgestellte Fix-Diff wurde in begrenzten Abschnitten gelesen; Produktänderungen, neue Browserfälle, Cache-/Harness-Anpassungen und Entscheidung 26 wurden gegen den [Fixbericht](2026-09-18-vokabeltrainer-v1-final-fixes.md) geprüft. Keine neue Gesamtprüfung des unveränderten Branches.

Die vorhandenen Abschlusslogs wurden eingesehen: `green-browser.txt` bestätigt 4/4 gezielte Browserfälle; `full-node.txt` bestätigt 277/277 Tests; `full-browser.txt` bestätigt 15/15 Trainer-Browserfälle, jeweils ohne Fehler. Diese Läufe stammen aus der Fixverifikation, nicht aus einem erneuten Testlauf des Reviewers. Die dokumentierten anfänglichen Fixturefehler werden nicht als Produkt-RED ausgegeben. Es bestand kein verbleibender konkreter Zweifel, der eine zusätzliche Reproduktion erforderte; keine Suite wurde erneut ausgeführt.

## Entscheidung

**Alle vier ursprünglichen Important-Befunde sind adressiert. Keine neue Critical- oder Important-Regression im geprüften Fixumfang.** Die technische Freigabe des Branches aus dem Gesamtreview ist damit erteilt (**Ready for merge: Yes**, vorbehaltlich der dokumentierten späteren Geräte-/Einrichtungsabnahmen). Dies ist eine Reviewbewertung und keine Merge-, Hosting- oder Veröffentlichungsfreigabe.
