# Echter Shop-Probelauf: Diagnose 5

Stand: 20.09.2026. Auswertung der vom Nutzer übergebenen `shop-probe-bericht5.json`; der Bericht wird als Messdaten behandelt. Keine Rohdatei, privaten Datei-IDs oder Zugangsdaten werden übernommen.

## Herkunft und Ergebnis

- Bericht: `kind:synthetic-shop-probe`, `diagnosticVersion:5`, `etagSource:v2-coherent`.
- Lauf am 20.09.2026, 15:46:06–15:46:54 UTC; Edge/Chromium 153 unter Windows, lokaler Ursprung auf Port 4173.
- SHA-256 der übergebenen Datei: `619ec74d50042213be27060fd55ef916374b4e6dc4a07abf750a78b973d13bb1`.
- Angegebene Wege: v3 für Reservierung/Anlage; v2 für Metadaten, Medien und beide bedingten PUT-Wege.
- **4 bestanden, 7 fehlgeschlagen, 0 unsupported. `passed:false`, `productReady:false`.** Das lokale Entscheidungsergebnis lautet `candidatePassed:false`; das erforderliche 11/11-Ergebnis ist nicht erreicht.

| Szenario | Beobachtetes Ergebnis |
| --- | --- |
| Probeordner | Bestanden |
| Versionskennung | Lesevorgang instabil |
| Absichtlich falsche Kennung | Lesevorgang instabil |
| Verbrauchte Kennung | Lesevorgang instabil |
| Zwei Initialisierer | Lesevorgang instabil |
| Zwei Käufe | Lesevorgang instabil |
| Antwortverlust | Lesevorgang instabil; `post-write-read` |
| Doppelter Vorgang | Bestanden |
| Reset-Rennen | Lesevorgang instabil |
| Erneutes Anlegen | Bestanden |
| Konfliktguthaben | Bestanden; lokale Proberegel |

## Was die sieben Fehler tatsächlich zeigen

Alle sieben Fehler enthalten dieselbe Kombination: `actual:stale`, `phase:read-stability`, `reason:changed-during-read`, `versionChanged:true`, `jsonEtagChanged:false`, `jsonEtagState:strong`. Dies sind **lokal erzeugte Abbrüche der Snapshot-Prüfung**, keine protokollierten HTTP-412-Antworten.

Der Codepfad von `b70fe37` erklärt die fehlende `scenarioStage` bei sechs Fehlern: `create()` liest seine neue Datei intern nach, bevor der Szenariowrapper erreicht wird. Bei den einmaligen Fällen werden die eigentlichen Schreibbedingungen beziehungsweise parallelen Versuche deshalb noch nicht geprüft. Beim Reset-Szenario sind zwei Durchläufe vorhanden; der Bericht unterscheidet nicht, in welchem davon die Anlageprüfung scheiterte.

`response-loss` scheitert in einer der drei bisher gleich benannten Nachlesungen. Ein Schreibversuch wurde zuvor begonnen; der Bericht beweist nicht, welche Nachlesung scheiterte oder ob die erste Anfrage mit 2xx beantwortet wurde. Der Szenariocode behandelt auch eine wirkliche Netzwerkexception an dieser Stelle als unklaren Ausgang. Keine erfolgreiche Annahme oder bestimmte Kaufbuchung aus diesem Bericht erfinden.

Es fehlen konkrete Konkurrenzzähler. Anders als beim [Diagnose-4-Lauf](2026-09-20-shop-v4-reallauf.md) ist daher **nicht belegt, dass der neue v2-PUT-Kandidat beide konkurrierenden Schreibversuche annimmt**. Ebenso wenig ist dessen Exklusivität nachgewiesen. Die vier positiven Fälle ersetzen die nicht abgeschlossenen Konkurrenz- und Fehlerschreibprüfungen nicht.

## Quellenprüfung und verbleibende Unsicherheit

Google beschreibt die v2-File-Version als Zähler aller serverseitigen Änderungen, einschließlich für den Nutzer unsichtbarer Änderungen. Für die File-ETag wird keine identische Änderungsmenge zugesagt. Eine steigende Version bei gleichbleibender ETag ist damit vereinbar; die konkrete Ursache dieses Laufs bleibt offen. [Drive-v2-Dateiressource](https://developers.google.com/workspace/drive/api/reference/rest/v2/files).

Die aktuelle [Discovery-Beschreibung](https://www.googleapis.com/discovery/v1/apis/drive/v2/rest), Revision `20260913`, enthält für `files.get.updateViewedDate` den Standard `false`; die [Methodenreferenz](https://developers.google.com/workspace/drive/api/reference/rest/v2/files/get) kennzeichnet den Parameter als veraltet. Die Probe setzt ihn nicht. Ein vermeintliches implizites `true` ist damit keine belegte Ursache, ein ergänztes `false` keine begründete Fehlerbehebung.

Nachgelagerte interne Verarbeitung nach Anlage oder Upload ist eine mögliche Erklärung für das zeitliche Muster, aber aus Bericht und Dokumentation nicht bewiesen. Inhalt, Revision und Zeitfelder wurden bisher nicht vergleichend ausgewiesen. Auch eine unveränderte sichtbare Inhaltskennung würde nicht beweisen, dass jede Änderung harmlos war.

## Entscheidung und nächster Schritt

Keine Schutzprüfung entfernen, keine Kennung ersetzen, keine Wartezeit oder Wiederholung als vermeintliche Lösung ergänzen und keine Produktkäufe aktivieren. Der Schreibansatz ist weiterhin unbewiesen. Einen unveränderten Diagnose-5-Lauf nicht erneut anfordern.

Der [begrenzte Diagnose-6-Plan](../superpowers/plans/2026-09-20-shop-probe-v6-diagnostics.md) ergänzt ausschließlich Vergleichszustände vorhandener Metadatenlesungen und eindeutige Lesekontexte. Rohwerte verbleiben im Arbeitsspeicher. Version und ETag müssen weiterhin beide stabil sein; fehlende Zusatzfelder werden als nicht verfügbar behandelt. Das ist eine Messverbesserung, keine behauptete Behebung des Serververhaltens.

Auswertung durch Root, unabhängige Ursachenrecherche mit GPT‑5.6 Sol / high. Kein erneuter echter Drive-Aufruf und keine Änderung persönlicher Daten durch die Auswertung. Physische Zwei-Geräte-/Apple-Prüfungen, Produktmigration, Backup und Langzeitverhalten bleiben offen.
