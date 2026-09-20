# Übergabe: Bericht 8 ausgewertet, Ordner-Metadaten isoliert prüfen

Stand: 20.09.2026. Branch `codex/vokabeltrainer-v1`, Ausgangspunkt `85ee32a9edcaa4bdd97653945161fb5556053ff9`, Arbeitsbaum zu Beginn sauber. Nutzer hat `shop-probe-bericht8.json` übergeben; C und die Entwicklungsfreigabe gelten fort. Raw-JSON außerhalb des Repositorys erhalten.

**Gesicherter Code- und Dokumentationsstand:** `9eeb36bc89ef3cfa02ab9c1d8591ddaf520fdb4f` ist auf `origin/codex/vokabeltrainer-v1` veröffentlicht. Lokales HEAD und der anschließend mit `git ls-remote` gelesene Remote-Branch stimmten exakt überein; Arbeitsbaum sauber. Diese nachträgliche Dokumentation des Nachweises ändert keinen geprüften Code. Die abschließende Dokumentprüfung meldete 1113 Dateien, 176 Markdown-Dateien und 841 lokale Links ohne Fehler; `git diff --check` war ohne Befund.

## Tatsächlicher Befund

**1 bestanden, 1 fehlgeschlagen**, aber Lesemessung vollständig: Die beiden Kontrollabrufe vor dem Inhalt sind stabil. Erst im Medienfenster steigt die Version; ETag, Prüfsumme, Head-Revision, Änderungszeit und Größe bleiben gleich. Letzte Ansichtszeit nicht verfügbar. Medienabruf HTTP 200, keine Weiterleitung, Inhalt korrekt; alle vier Diagnose-GETs mit `no-store`.

Das belegt das Zeitfenster, nicht dessen Ursache. `assertion` bezeichnet den fehlgeschlagenen Stabilitätscheck, keine HTTP-412-Ablehnung. Kein bedingter PUT in diesem Prüfumfang. [Auswertung mit Hash und Quellen](../reports/2026-09-20-shop-v8-reallauf.md). Bericht 8 nicht unverändert wiederholen.

## Begrenztes Folgepaket

Der [Plan für Diagnose 9](../superpowers/plans/2026-09-20-shop-probe-v9-metadata-coordination.md) isoliert Eigenschaften neuer synthetischer Ordner. Keine Inhaltsdateien/Medienabrufe. V2-Metadaten-Snapshots mit zwei `no-store`-Abrufen bleiben strikt auf Version UND ETag geprüft. Nach jedem maßgeblichen Schreibversuch folgt eine unabhängige Nachlese; spätere Fehler erhalten bereits beobachtete HTTP-Ergebnisse.

Vier Checks: Ordner-Fixture; garantiert falsche starke Schreibkennung; zuerst gültige, dann verbrauchte Kennung; zwei konkurrierende Eigenschaftsänderungen. Ein Erhaltungsmarker und vollständiger Properties-Vergleich prüfen zusätzlich unerwartete Datenverluste. Die normalen drei Umfänge und Standardauswahlen bleiben bestehen. Kein Trainer-/Service-Worker-/Serverumbau.

Umsetzung, unabhängige Review und lokale Verifikation sind abgeschlossen: **127/127 Shop-Node-Tests und 20/20 Shop-Browserfälle bestanden**. [Implementierung und TDD-Nachweise](../reports/2026-09-20-shop-probe-v9-metadata-coordination.md), [unabhängige Review](../reports/2026-09-20-shop-probe-v9-review.md). Das ist kein echter Google-Nachweis; diesen neuen Umfang haben die Agenten ausschließlich mit synthetischem Google geprüft.

Ein Fehler aus der frühen Review ist behoben: Gültiges JSON `null` in einer Erfolgsantwort führte zunächst zu einem unklassifizierten Fehler ohne HTTP-Status. Zwei gezielte Tests belegen RED → GREEN; der Fix ist in den finalen Suiten enthalten. Es bleiben keine offenen relevanten Reviewbefunde.

Die finalen Befehle `npm run test:shop-probe` und `npm run test:shop-probe:browser` liefen je einmal auf dem unveränderten Stand nach Review. Root hat beide vollständigen Ergebniszusammenfassungen gelesen: 0 Fehler, 0 Abbrüche, 0 übersprungene Tests. Logs `final-node.log` und `final-browser.log` liegen ignoriert unter `.superpowers/sdd/2026-09-20-shop-probe-v9-metadata-coordination/`. Die unveränderten Trainer-Gesamtsuiten wurden nicht wiederholt.

Der laufende lokale Server lieferte Shop-Seite und Modul mit HTTP 200; Diagnoseversion 9, neue Auswahl und Downloadname 9 wurden im ausgelieferten Inhalt geprüft. Keine neuen Runtime-Module oder Serverneustarts nötig. Implementierung und unabhängige Review jeweils **GPT-5.6 Sol / high**; Root hat Auswertung, öffentliche Quellen, Dokumentation und Abschlussbelege geprüft.

## Nächster echter Lauf nach technischem Abschluss

1. Im richtigen Checkout bei Bedarf `npm start`; `http://localhost:4173/shop-probe/` neu laden. Oben muss **Diagnoseversion 9** stehen.
2. Quelle **Drive v2 kohärent (Koordination)**, Umfang **Ordner-Koordination gezielt prüfen**.
3. Mit Google verbinden, neuer synthetischer Dateianlage zustimmen und genau einmal starten. Es werden ausschließlich neue Testordner und kleine Eigenschaften verwendet.
4. **shop-probe-bericht9.json** herunterladen und auswerten. Vier grüne Checks wären nur ein Nachweis dieses Ordner-Metadatenversuchs, keine Shopfreigabe.

Bei einem Fehler zuerst die erhaltenen Phasen-/Schreib-/Nachlesebelege auswerten. Keine Wiederholung bis zu einem grünen Zufallsergebnis, keine stillen Warte-/Retry-Schleifen oder gelockerten Snapshot-Guards.

## Offene Grenzen

- C bleibt bestätigt: direkter Drive-Ansatz; weder neues Backend noch Änderung des Punktesystems.
- Ein erfolgreicher echter Metadatenlauf erlaubt erst die weitere Bewertung einer Architektur mit Verweis auf unveränderlichen Inhalt. Antwortverlust, verwaiste Dateien, Epochen, Gleichzeitigkeit auf zwei Geräten und vollständige Käufe sind dadurch nicht geprüft.
- `productReady:false`; EV01–EV05 und Bildrichtung unverändert. Vier von 76 neuen Bildmotiven vorbereitet, neue Produktshopintegration weiterhin offen.
- Physische Zwei-Geräte-, Apple/Safari/Home-Bildschirm- und HTTPS-Nachweise bleiben offen. Git enthält Code und Dokumentation, keine Google-Sitzungen oder privaten Lernstände.
