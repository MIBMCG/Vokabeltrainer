# Übergabe: C gewählt, direkte Drive-Diagnose gezielt fortführen

Stand: 20.09.2026. Branch `codex/vokabeltrainer-v1`, Ausgangspunkt `9106c6091bfc42b067262160e722804e50ed264a`, Arbeitsbaum zu Beginn sauber. Der Nutzer antwortete auf die Richtungsfrage mit **c**.

## Gesicherter Stand

Diagnose 7, Nutzerentscheidung, Tests und Review sind in **`f5f76cdfc1c5ead65ba3734b583691c8aaa214e6`** gesichert und auf `origin/codex/vokabeltrainer-v1` veröffentlicht. Nach dem Push stimmten lokales `HEAD` und `git ls-remote` für diesen Branch exakt überein; der Arbeitsbaum war sauber. Diese nachträgliche Ergänzung dokumentiert den Nachweis, ohne den geprüften Programmcode zu ändern.

Die abschließende Dokumentprüfung fand **1103 Dateien, 166 Markdown-Dateien, 806 lokale Links und 0 Fehler**; `git diff --check` war ohne Befund. Die finalen Code- und Browserprüfungen wurden nach dem reinen Dokumentabschluss nicht wiederholt.

## Verbindliche Richtung

O-KO01 ist beantwortet: direkte Drive-Koordination weiter untersuchen. Kein zusätzlicher Backenddienst und keine Umstellung der ausgebbaren Punkte. Nicht nochmals A/B/C fragen. [Entscheidung und frühere Alternativen](../design/2026-09-20-kaufkoordination-nach-diagnose6.md).

Der echte Bericht 6 bleibt negativ: sechs bestandene und fünf fehlgeschlagene Fälle, darunter vier Instabilitäten und eine mehrdeutige Assertion. Ein bestandener anderer Fall belegt tatsächlich eine sequentielle 412-Ablehnung. [Auswertung](../reports/2026-09-20-shop-v6-reallauf.md). Daraus folgt weder eine pauschale Drive-Untauglichkeit noch eine sichere Parallelkoordination.

## Begrenzter nächster Schritt

Der [Plan](../superpowers/plans/2026-09-20-shop-probe-v7-invalid-token.md) schließt die bekannte Mehrdeutigkeit: ein bedingter PUT mit falscher starker ETag, separat erfasste Antwortklasse/HTTP-Status und anschließend eine strikte Nachlese. Diese unterscheidet identischen Inhalt, ausschließlich geänderte Objektschlüsselreihenfolge, anderen Inhalt oder fehlenden Nachweis. Keine Kennung/ID, Rohfehlermeldung oder Inhaltswerte exportieren.

Die neue Auswahl „Falsche Schreibkennung gezielt prüfen“ umfasst nur Probeordner und Negativfall. Ein erfolgreicher Einzeltest ist kein Gesamtnachweis. Elf Fälle bleiben im bestehenden vollständigen Umfang erreichbar; `productReady:false` und Version-/ETag-Stabilität bleiben verbindlich. Kein neuer unveränderter vollständiger REAL-Lauf vorgesehen.

Die Implementierung und lokale Prüfung sind abgeschlossen: **84/84 Shop-Node-Tests und 13/13 Shop-Browserfälle bestanden**. Die Rohprotokolle wurden vom Root eingesehen; [Umsetzung und TDD-Nachweise](../reports/2026-09-20-shop-probe-v7-targeted.md). Die [unabhängige Review](../reports/2026-09-20-shop-probe-v7-review.md) hat keine offenen relevanten Befunde. Keine Änderung der bestehenden Trainer-/Lern- oder Synchronisationsmodule; deren historische Tests wurden für dieses isolierte Paket nicht erneut ausgeführt.

## Ausgeführte Prüfungen und Bedienung

Die finalen Suiten wurden mit `npm run test:shop-probe` und `npm run test:shop-probe:browser` ausgeführt. Der Browserlauf verwendete Playwright 1.62.1 und lokales Edge mit ausschließlich synthetischer Google-Grenze. Rohprotokolle liegen ignoriert unter `.superpowers/sdd/2026-09-20-shop-probe-v7/`; der versionierte Umsetzungsbericht enthält die portablen Ergebnisse und Grenzen.

Der bereits laufende lokale Server lieferte anschließend die Shop-Seite und ihr Hauptmodul jeweils mit HTTP 200. Geprüft wurden die sichtbare Diagnoseversion 7, die gezielte Auswahl und `shop-probe-bericht7.json` im ausgelieferten Modul. Kein Serverneustart und keine Google-Anmeldung durch die Agenten waren erforderlich.

Für den nächsten echten Nachweis:

1. Den lokalen Server bei Bedarf im richtigen Checkout mit `npm start` starten und `http://localhost:4173/shop-probe/` öffnen. Die Seite neu laden; oben muss **Diagnoseversion 7** stehen.
2. Bei „Versionskennung für Probe-Dateien“ **Drive v2 kohärent (Koordination)** wählen.
3. Bei „Prüfumfang“ **Falsche Schreibkennung gezielt prüfen** wählen.
4. Mit Google verbinden, neue synthetische Probe-Dateien ausdrücklich auswählen und die Probe einmal starten.
5. Den bereinigten Bericht `shop-probe-bericht7.json` herunterladen und übergeben. Die Prüfung umfasst zwei Checks; eine frühe Instabilität kann den Schreibversuch verhindern.

Danach Schreibausgang und Nachlese getrennt auswerten. Eine reine Schlüsselreihenfolge bleibt diagnostisch; sie wird nicht zum Erfolg umgedeutet. Keine Wiederholung bis zu einem zufällig grünen Ergebnis und keine neue Richtungsfrage A/B/C.

## Hypothesen und Quellen

Der verwendete falsche Token entspricht syntaktisch einem starken Entity-Tag. Allgemeine HTTP-Regeln schreiben bei ausgewerteter nicht erfüllter Bedingung die Ablehnung vor; sie ersetzen keine explizite Drive-Garantie. Eine mögliche andere Fehlerklasse wie HTTP 400 ist zu messen, nicht als schon bekannte Ursache zu behaupten. [RFC 9110: If-Match](https://www.rfc-editor.org/rfc/rfc9110.html#name-if-match), [Google: Fehlerbehandlung](https://developers.google.com/workspace/drive/api/guides/handle-errors).

In diesem Schritt bleibt der ursprüngliche künstliche Token exakt erhalten. Eine spätere Gegenprobe mit nur einem veränderten Zeichen einer echten ETag wäre bei passender neuer Evidenz denkbar, wird aber jetzt nicht gleichzeitig eingeführt. So bleibt der untersuchte ursprüngliche Fehler vergleichbar; nur seine Beobachtbarkeit und der Prüfumfang ändern sich.

JSON-Objektschlüssel sind ungeordnet. Die bisherige `JSON.stringify`-Gleichheit kann eine reine Schlüsselreihenfolge als Abweichung werten. Im vorliegenden Realbericht ist dies unbewiesen; der zusätzliche Strukturvergleich ist ausschließlich Diagnose, keine Änderung der bisherigen Erfolgskriterien. [RFC 8259, Abschnitt 4](https://www.rfc-editor.org/rfc/rfc8259.html#section-4).

`fields` filtert laut Google Antwortdaten. Ein Entfernen des Parameters ist deshalb kein begründeter Ursachenfix. Quellenrecherche fand keine belastbare Zusage, die beobachteten Instabilitäten oder parallele Abbuchungen bereits auflöst. [Google: fields](https://developers.google.com/workspace/drive/api/guides/fields-parameter).

## Rollen und Prüfgrenzen

Unabhängige Quellen-/Codeanalyse und Umsetzung mit getrennten Agenten auf GPT-5.6 Sol, Denktiefe hoch; Root dokumentiert Entscheidung und Übergabe. Lokale Tests verwenden synthetische Daten. Kein Google-Zugriff oder Deployment durch die Agenten. Reale Zwei-Geräte-/Apple-Abnahme, Produktmigration und sichere Kaufkoordination bleiben offen.

Unabhängige Bildproduktion bleibt möglich; EV01–EV05 und Drachenstil sind weiterhin bestätigt. Programmcode und Dokumentation werden über Git übertragen, Browserdaten und Anmeldesitzungen nicht.
