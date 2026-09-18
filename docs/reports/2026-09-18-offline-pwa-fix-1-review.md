# Task 12 – unabhängige Nachprüfung der Korrekturrunde 1

Prüfbasis: `8798dd2af7857d2bfbd3e3ab44c713abb3a54ea6` → `8aaed7b4977e53c0a5d6a2405c50748c4b3d0592`; Korrekturcode `2b369e3`. Geprüft wurden ausschließlich R1–R3, M1 und neue Fehler im Korrekturdiff unter dem ausdrücklich ergänzten Vertrag aus Entscheidung 25 (`docs/superpowers/tasks/task-12-brief.md:72`).

## Finding Verdicts

- **R1 – Scopekollision und fremde Cachelöschung — ADDRESSED.** `trainer/sw.js:2` kodiert den vollständigen Scope-Pfad mit `encodeURIComponent` und begrenzt ihn anschließend durch einen Doppelpunkt. Dieser Trenner kann nicht unverändert in der kodierten Pfadkomponente vorkommen. Unterschiedliche Segmentierungen bleiben dadurch verschieden; ein verschachtelter Scope besitzt nicht mehr das Eigentümerpräfix des äußeren Scopes. Die Bereinigung verwendet diesen abgegrenzten Eigentümer (`trainer/sw.js:57`). Die beiden ursprünglichen Gegenbeispiele sind unmittelbar in den Tests abgedeckt: verschachtelter Fremdscope bleibt erhalten, `/a/b/trainer/` und `/a-b/trainer/` öffnen verschiedene Caches (`tests/trainer/sw.test.js:104`, `:116`). Das bewusste Behalten alter mehrdeutiger Cachenamen verhindert eine unzuverlässige Eigentumszuordnung; diese begrenzte Speicherrestfolge ist im Fixbericht ausdrücklich dokumentiert.

- **R2 – fehlende Kontrolle des Nachrichtenabsenders — ADDRESSED.** Die Aktivierungsanforderung geht nun an den aktiven Worker. Dieser ermittelt seine tatsächlich kontrollierten Fensterclients mit `includeUncontrolled: false` und verlangt die passende Client-ID, bevor er weiterleitet (`trainer/sw.js:92`–`:99`). Der wartende Worker akzeptiert den Aktivierungsbefehl nur bei Identität des Absenders mit dem aktiven Worker seiner Registrierung (`trainer/sw.js:79`). Direkte Fensterbefehle sowie andere Absender passieren diese Grenze nicht. Der Controller bindet Ablehnungen an den erwarteten aktiven Worker und die aktuelle Request-ID (`src/trainer/updates.js:61`–`:66`). Die Workertests prüfen Relay und direkte Ablehnung (`tests/trainer/sw.test.js:148`, `:171`); der Controllertest verwirft sowohl falsche Absender als auch fremde Request-IDs (`tests/trainer/updates.test.js:155`). Der echte Browserwechsel von v2 zu v3 belegt, dass der Relaypfad auch mit nativen Workerobjekten funktioniert (`tests/browser/trainer.browser.mjs:1568`, `:1639`).

- **R3 – ungeschützte Bedienphase bis zum Reload — ADDRESSED.** Nach den bisherigen sicheren Zustandsprüfungen setzt die Shell ohne dazwischenliegende asynchrone Operation `updateLocked`, `root.inert` und `aria-busy`; sie liefert eine idempotente Freigabefunktion zurück (`src/trainer/ui/shell.js:419`–`:433`). Beide internen Navigationswege beachten die Sperre (`:330`, `:349`). Der Controller behält die Sperre bis zum tatsächlichen Controllerwechsel und Reload; Ablehnung, synchroner Sendefehler, Timeout und Zerstörung räumen den ausstehenden Vorgang auf und geben die Sperre frei (`src/trainer/updates.js:33`, `:53`, `:106`, `:126`). Nach einer solchen Freigabe existiert kein ausstehender Vorgang mehr, sodass ein späteres `controllerchange` keinen automatischen Reload auslöst. Die entsprechenden Fehlerpfade stehen in `tests/trainer/updates.test.js:155`, `:195` und `:238`. Der Browserfall verzögert die echte v3-Aktivierung um 750 ms, prüft währenddessen die inerte App und unterbundene interne Navigation und anschließend das erhaltene Feedback (`tests/browser/trainer.browser.mjs:1568`, `:1631`–`:1641`). Kein Draftschema und kein zusätzliches Rundenereignis wurde eingeführt.

- **M1 – fehlende UI-Nachweise für Einrichtung und Erwachsenenansicht — ADDRESSED.** Der Browserfall prüft nun den erhaltenen Einrichtungsentwurf nach verweigerter Aktivierung sowie die verweigerte Aktivierung in der entsperrten Erwachsenenansicht (`tests/browser/trainer.browser.mjs:1587`–`:1602`). Die bisher nur im Code nachvollzogenen Grenzen sind damit Bestandteil des realen Browserfalls.

## New Breakage in the Fix Diff

**None.** Keine neuen Critical-/Important-/Minor-Befunde im geprüften Korrekturdiff. Die neuen Prüfungen decken die ursprünglichen Gegenbeispiele und den vereinbarten verzögerten Aktivierungsablauf ab; die Änderung des Nachrichtenvertrags und die Rückgabe einer Freigabefunktion entsprechen Entscheidung 25.

## Out-of-Scope Observations

**Keine neuen.** Echte iPhone-/iPad-/Safari- und HTTPS-Installationsabnahme bleibt offen. Die bereits anderweitig zugeordnete Harness-Portabilität ist kein neuer Befund dieser Nachprüfung. Alte mehrdeutige Caches werden ausdrücklich nicht einer vermeintlich sicheren automatischen Migration unterzogen.

## Prüfungen und Grenzen

- Fixbericht und geänderten Aufgabenvertrag gelesen; das bereitgestellte Korrekturpaket in begrenzten Abschnitten geprüft. Zeilenbelege ausschließlich aus dessen Hunks abgeleitet. Keine erneute Prüfung unberührter Produktmodule und keine Gitbefehle.
- Die berichteten aktuellen Nachweise sind vorhanden: 15/15 fokussierte Nodefälle, 1/1 verzögerter Updatebrowserfall, 1/1 Offlinekaltstartfall mit beiden Pfaden und 276/276 Node-Gesamttests (`docs/reports/2026-09-18-offline-pwa.md:98`–`:101`). RED-Schritte und konkrete Ergebnisse sind getrennt dokumentiert. Die neuen Assertions und Produktpfade stützen die jeweiligen Behauptungen. Der Bericht behauptet zutreffend keinen erneuten vollständigen Browserlauf in dieser Fixrunde.
- Keine Suite und keine zusätzliche Reproduktion wiederholt: Der Korrekturdiff hinterließ für die geprüften Befunde keine konkrete, durch die vorhandenen Nachweise unbeantwortete Reproduktionsfrage. Persönlichen Browser/Server auf Port 4173 unberührt gelassen. Nur diesen Bericht geschrieben; keine Produkt-, Index- oder HEAD-Änderung, kein Commit, Push oder Merge.

## Verdict

**Fix round: All findings addressed, no new Critical/Important breakage.** R1, R2, R3 und M1 sind geschlossen; Korrekturrunde 1 bestanden.
