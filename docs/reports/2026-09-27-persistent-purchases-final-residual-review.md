# Dauerhafte Käufe – Nachprüfung der zwei Abschlussreste

Datum: 27.09.2026. Reviewer: GPT-6 Astra, Denktiefe high.

**Spec-Gate: PASS. Qualitäts-Gate: PASS für den geprüften Nachtrag.** RF-4 und RF-6 sind ADDRESSED. Keine offenen Befunde in diesem Prüfbereich und keine neuen unmittelbaren Critical-/Important-Brüche im kleinen Diff. RF-1, RF-2, RF-3 und RF-5 bleiben entsprechend der vorherigen Nachprüfung geschlossen; sie wurden nicht erneut aufgerollt.

## Bereich und Vorgehen

- BASE: `f02781a6bc2701da10079a2960f710d5c0247a96`.
- HEAD: `1e29ac35252fe04f049b511f5f443fdcf41fd69e`, geprüft mit `git rev-parse HEAD`.
- Gelesen: enger Brief, [vorherige scoped Nachprüfung](2026-09-27-persistent-purchases-final-fix-review.md), [Nachtragsbericht](2026-09-27-persistent-purchases-final-residual-fix.md) und vollständiges Produkt-/Testdiff dieses Nachtrags. Unveränderte Bootstrap-/Servicepfade nur zur Prüfung der Read-first- und Resumegrenze herangezogen.
- Keine Produkt-/Teständerung, kein Commit, kein Subagent und keine Wiederholung der laufenden Controller-Gesamtsuiten. Unstaged zentrale Dokumentation bleibt Controllerarbeit.

## RF-4 — ADDRESSED

**Code:** `src/trainer/purchases/service.js:526–534` prüft ein vorhandenes unbestätigtes Setup jetzt unmittelbar in `uploadControl`, vor Produktpublikation und Kaufuploads. Damit erreichen auch der direkte gespeicherte Control-Resume und der Confirmpfad dieselbe Grenze; die Prüfung liegt nicht mehr ausschließlich im vorbereitenden Einstieg.

Der verwendete `installSetup`-Pfad ruft `resumeBootstrap` ohne `repeatPointer: true` auf. Bei `pointer-pending` oder `reconciling` wird zuerst die installierte Config nachgelesen; bleibt sie unbestätigt, gibt Bootstrap den unveränderten unklaren Auftrag zurück und der Dienst beendet den Weg mit `pending`. Das vorhandene explizite `resume(setup.operationId)` bleibt der einzige Wiederholungsweg für diesen unklaren Setuppointer. Die entscheidende Unterscheidung ist in `src/trainer/purchases/bootstrap.js:134–160` erhalten.

**Regression:** `tests/trainer/purchases-recovery.test.js:812–862`, „a direct reserved activation resume stays read-only until the same unclear setup is confirmed“, entspricht dem vorherigen Reviewerrepro: tatsächliche Commands, HTTP-Transport, Bootstrap, Integration und Kaufdienst; fehlende Config, anfangs null Produktdateien, gespeicherter `reserved`-Control neben unklarem Setup. Der direkte Control-Resume liefert `pending`, erhöht weder Pointerwrites noch Produktdateien und erhält den vollständigen gespeicherten Control. Nach ausdrücklichem Setup-Resume führt derselbe Control zu `confirmed`/`active`; Kandidat, Uploadclosure, Pointerproperties und ETag werden gegen den vorher gespeicherten Auftrag verglichen.

Damit sind sowohl das vorzeitige Publizieren als auch die Fortsetzbarkeit des vorhandenen Altzwischenstands konkret abgedeckt. Die bekannten Fälle „Pointer nicht angenommen“, „angenommen, Antwort verloren“ und vollständig frische Laufzeitobjekte bleiben Bestandteil des berichteten fokussierten Laufs. Keine neue Kandidatur, öffentliche Schnittstelle oder Protokolloperation wurde eingeführt.

## RF-6 — ADDRESSED

**Code/Assertion:** `tests/browser/trainer.browser.mjs:420–438` ersetzt die About-Antwort als vermeintlichen Abschluss durch eine nachweisbar laufende vollständige Syncphase. Die nur synthetische Fixture hält genau den nächsten `/drive/v3/files`-GET an (`tests/browser/google-fixture.mjs:24–34,103–108`).

Der Test wartet auf den tatsächlich erreichten Folgeread, prüft während des Halts ausdrücklich „Abgleich ausstehend“, gibt den Read frei und wartet anschließend auf „Abgeglichen“. Erst danach werden erneut beide leeren Queues, genau ein Remotevorkommen jeder zuvor ausstehenden Ereignis-ID und unveränderte Writezahl gegenüber der vor dem Poll gesetzten Baseline geprüft. Die bisherige Möglichkeit, trotz noch angehaltenem Dateilesen erfolgreich abzuschließen, ist damit beseitigt. `finally` gibt einen gegebenenfalls gehaltenen Request vor Harnessende frei.

Die fachlichen Einmaligkeits- und Leerlaufassertions sind erhalten; zulässige Same-ID-Retries werden weiterhin nicht pauschal als doppelte Wertung behandelt. Keine Produktionsschnittstelle wurde für den Test ergänzt. Die Ursache des ursprünglichen roten Gesamtbrowser-Booleans bleibt historisch unbewiesen; der Nachtrag schließt den konkret nachgewiesenen Prüfdefekt und behauptet keinen daraus abgeleiteten Produktfix.

## Belege, Ruling und Grenzen

- Berichteter fokussierter Node-Lauf auf dem Nachtrag: **5/5 bestanden**, 0 Fehler, 2,295 s. Testfilter: `unclear setup stays|accepted setup pointer|direct reserved activation resume|activation resumes its exact reserved` in `tests/trainer/purchases-recovery.test.js`.
- Berichteter fokussierter Edge-Lauf: **1/1 bestanden**, 0 Fehler, 11,865 s; Filter `final I3` in `tests/browser/trainer.browser.mjs`, einschließlich gehaltenem Folgeread und vollständigem Abschluss danach.
- Diese konkreten Assertions und ihre tatsächliche Zusammensetzung wurden unabhängig gelesen. Es blieb keine konkrete ungeklärte Hypothese, die eine zusätzliche Wiederholung derselben grünen Tests gerechtfertigt hätte.
- Frische vollständige Node-/Browserläufe auf unverändertem HEAD werden vom Controller separat ausgeführt. Die scoped Freigabe ersetzt deren aktuellen Nachweis nicht; frühere 506/506 und 43/43 auf dem Vorgänger werden hier nicht als Prüfung dieses Nachtrags ausgegeben.
- Ruling 15 im [Entscheidungsbericht](2026-09-27-persistent-purchases-entscheidungen.md) legt die Abweichung von der ursprünglich vorgesehenen Anzahl finaler Fixwellen transparent offen. Der Nachtrag bleibt bei zwei bereits beauftragten und reproduzierten Abschlussverträgen. Umfang und Begründung sind nachvollziehbar; keine neue Nutzer-, Cloud-, Kosten- oder Kontenentscheidung erforderlich.
- Produktcache `v25` und synthetische Updateversion `v26` bleiben für den noch nicht ausgelieferten Zwischenstand konsistent. Keine Änderung an eingefrorenen Quellen oder Datenformaten.
- Keine Aussage über reale Google-Konten, getrennte physische Geräte, Apple/Safari/Home-Bildschirm, Hosting oder die restliche Bildproduktion. Diese ausdrücklich getrennten Nachweise bleiben offen. Kein Commit/Push durch diesen Reviewer.

**Offene RF-Befunde nach diesem Nachtrag: keine.** Der Controller kann den dokumentierten Abschluss mit den frischen Gesamtprüfungen und aktualisierten zentralen Nachweisen fortsetzen.
