# Dauerhafte Käufe – scoped Abschluss-Nachprüfung

Datum: 27.09.2026. Reviewer: GPT-6 Astra, Denktiefe high.

- FIX_BASE: `18e989c77b98e0f7394ca660ef7b0023dda6678c`.
- HEAD: `f02781a6bc2701da10079a2960f710d5c0247a96`.
- Auftrag: ausschließlich RF-1 bis RF-6 des [Gesamtreviews](2026-09-27-persistent-purchases-final-review.md) und unmittelbare relevante Folgerisiken des Fixdiffs. Keine zweite breite Gesamtprüfung.
- Gelesen: scoped Brief, ursprüngliche Abschlussverträge, [Fixbericht](2026-09-27-persistent-purchases-final-fix.md), vollständiger Produkt-/Test-Fixdiff. Unveränderte Nachbarpfade nur zur Prüfung des direkten Control-Resume und des tatsächlichen Syncabschlusses.

**Spec-Gate: NEEDS FIX.** RF-4 ist teilweise korrigiert, seine öffentliche Control-Wiederaufnahme umgeht aber noch die geforderte Einrichtungsgrenze.

**Qualitäts-Gate: NEEDS FIX.** RF-4 und die Abschlussassertion von RF-6 bleiben nach gezielten Reproduktionen offen. RF-1, RF-2, RF-3 und RF-5 sind ADDRESSED. Keine zusätzlichen unabhängigen Critical-/Important-Befunde im Fixdiff.

## Bewertung je Befund

| Befund | Urteil | Konkreter Beleg |
| --- | --- | --- |
| RF-1, Important | **ADDRESSED** | `src/trainer/ui/backup.js:160–173` erfasst einen aktuellen Snapshot und verwendet ihn für Epochenauflösung und Export. Die ausgewählte Kopfmenge wird zusätzlich gebunden (`:24–26,125–128,148,163–168`); ein neuer Konfliktkopf verlangt erneute Auswahl, auch wenn die alte Kopf-ID weiterhin enthalten ist. `finally` rendert frisch. Die drei echten Shell-/Commands-/Backupfälle in `tests/browser/trainer.browser.mjs:241,271,327` prüfen neue Lernpunkte, v3-Checkpoint mit aktuellem bestätigtem Vorgänger und nach Rendern gespeicherter Auswahl sowie die veränderte Kopfmenge. |
| RF-2, Important | **ADDRESSED** | `src/trainer/purchases/service.js:174–184,282–299,659,694` koppelt die verifizierte Instanzhistorie an Kopf, Binding, Configreferenz und Configinhalt. `getView` und `select` laden bei Abweichung lokal neu. Die fortbestehende Instanz wird nach tatsächlichem `integration.reconcile`/Commands-Commit geprüft: anderer Client kauft, späterer verifizierter Restore entzieht die Rechte (`tests/trainer/purchases-recovery.test.js:1026,1054`). Der Restorefall prüft 0 Ausgaben, leeren Besitz und Ablehnung der nicht mehr berechtigten Auswahl ohne neue Serviceinstanz. |
| RF-3, Important | **ADDRESSED** | `src/trainer/purchases/integration.js:406` baut Konten nach `authoritativeState` mit `rebuildAccounts(project(next.ledger), history.projection.accounts)` auf. Aktuelle Lernrechte und bestätigte Ausgaben/Besitz bleiben getrennt. Der neue Auswahltest bei später verdienten Punkten (`tests/trainer/purchases-recovery.test.js:1120`) erhält die berechtigte Figur; der spätere Restore mit geringerem Besitz (`:1054`) entfernt die unberechtigte Auswahl. |
| RF-4, Important | **NOT ADDRESSED** | Der neue Einstieg in `prepareControl` und die Setup-Priorität der UI sind richtig. Der direkte öffentliche `resume(controlId)`-Pfad eines gespeicherten `reserved`-Controls erreicht weiterhin `uploadControl`, ohne zuvor die offene Einrichtung abzusichern. Gezielter tatsächlicher Repro unten: 0 → 3 Produktuploads bei weiterhin nicht installierter Config. |
| RF-5, Minor | **ADDRESSED** | `src/trainer/ui/purchases.js:196–198` nutzt den ursprünglichen Trigger nur, solange er verbunden ist, sonst den bereits vorhandenen aktuellen Fokus-Rückfall. Der tatsächliche Kaufbrowserfall prüft nach `stale → Abbrechen` ein verbundenes aktives Element innerhalb der aktuellen Figurenregister (`tests/browser/purchases.browser.mjs:442–445`). Keine Änderung an der Route-Wiederherstellungslogik. |
| RF-6, Important als Prüf-Gate | **NOT ADDRESSED** | Outbox/Pendingpakete, Remote-Ereigniseinmaligkeit, Write-Baseline und Fehlerdaten sind verbessert. `tests/browser/trainer.browser.mjs:422–429` zählt aber bereits die About-Antwort als vollständigen Pollabschluss. Der Test besteht nachweislich bei angehaltenem nachfolgenden Dateilesen und sichtbarem „Abgleich ausstehend“. Die behauptete schreibfreie vollständige Leerlaufrunde ist damit noch nicht bewiesen. |

## RF-4: verbleibender Control-Resume umgeht die Setupgrenze

**Stellen:** `src/trainer/purchases/service.js:460–471,526–544,626–634`; die neue Prüfung steht lediglich in `:559–563`.

**Auslöser:** Ein gespeicherter Altzwischenstand enthält gleichzeitig `setup.phase = reconciling` und `control.phase = reserved`. Die Config wurde noch nicht installiert. Ein Aufrufer setzt den bereits gespeicherten Control ausdrücklich über den vorhandenen öffentlichen Port `service.resume(control.operationId)` fort.

**Tatsächliche Wirkung:** `resumeInternal` ruft `prepareControl` nur für `phase === intent` auf. Für `reserved` geht es direkt zu `sendControl`; dessen `refreshInternal` liest den Koordinator, bestätigt aber nicht die installierte Config. `uploadControl` veröffentlicht daraufhin die Produktclosure. Erst der nachfolgende Kaufupload scheitert an der weiterhin korrekt geschlossenen Transportgrenze mit `binding`. Der gemeinsame wirtschaftliche Kopf wird nicht unberechtigt aktiviert; die abhängige Publikation beginnt aber weiterhin vor bestätigter Einrichtung.

Die neue UI bietet zuerst die richtige Setup-ID an und der vorbereitende Einstieg bleibt read-only. Das schließt die öffentliche Servicegrenze jedoch nicht. Der neue Altzwischenstandstest (`tests/trainer/purchases-recovery.test.js:812`) ruft zunächst `prepareActivation`, dann ausdrücklich den Setup-Resume und erst danach den Control-Resume auf. Er prüft den umgehenden öffentlichen Eingang vor Setupbestätigung nicht.

**Eigener fokussierter Nachweis auf HEAD:** Inline-Nodeprobe mit den neuen tatsächlichen Helfern `actualActivationHarness`, `createPurchaseTransport`, Commands, Bootstrap und Integration. Nach `dropPointerResponse()` wurde derselbe gültige reservierte Altcontrol wie im neuen Regressionstest hergestellt, seine Produktpublikation jedoch noch nicht ausgeführt. Dann ausschließlich `service.resume('legacy-control')`:

```json
{"error":"binding","setupPhase":"reconciling","productUploadsBefore":0,"productUploadsAfter":3,"configInstalled":null}
```

**Noch erforderlicher enger Abschluss:** Die vorhandene Einrichtungsgrenze muss vor jeder abhängigen Controlpublikation greifen, auch bei direktem Resume/Confirm eines gespeicherten Controls. Bei unbekanntem Setupausgang zuerst lesen; ohne bestätigte Installation `pending` beziehungsweise Verweis auf die ausdrückliche Setup-Wiederaufnahme, ohne abhängigen Upload und ohne stillen Setuppointer-Retry. Nach `resume(setup.operationId)` muss exakt derselbe gespeicherte Control samt IDs/Body/ETag fortsetzbar bleiben. Kein neuer Port und keine neue Protokollarchitektur erforderlich.

## RF-6: About-Antwort ist noch kein abgeschlossener Abgleich

**Stelle:** `tests/browser/trainer.browser.mjs:422–429`.

`completedPolls` wird beim Browserereignis `response` für `/drive/v3/about` erhöht. Diese Kontoabfrage liegt vor den weiteren Metadaten-/Dateilesungen und vor der Uploadphase. Der tatsächliche Produktabschluss folgt erst nach Download, Commerceabgleich, lokaler Epochenpublikation und Pendinguploads in `src/trainer/sync/drive.js:1067–1101`. Erst dann wird `synced` veröffentlicht. Auch der Scheduler wartet auf dieses vollständige Syncpromise (`src/trainer/sync/scheduler.js:47–72`).

**Eigener fokussierter Nachweis auf HEAD:** Nur der vorhandene I3-Test wurde als Inline-/Data-URL-Modul ausgeführt; andere Testregistrierungen wurden nicht ausgeführt. Eine reine Harnessumhüllung hielt nach Beginn des 61-Sekunden-Abschnitts die erste nachfolgende Drive-GET-Anfrage auf `/files` an. Die About-Antwort durfte normal eintreffen. Keine Produkt- oder Testdatei wurde geändert. Sämtliche aktuellen I3-Assertions bestanden, obwohl der Sync noch auf diese Dateilesung wartete:

```text
HELD_POLL {"heldRequests":1,"status":["Abgleich ausstehend"],"writes":8}
I3_ASSERTIONS_PASSED_WITH_HELD_SYNC
```

Damit bleibt ein tatsächlicher Teil des ursprünglichen Abschlussvertrags offen. Ein erst nach der About-Antwort erfolgender unzulässiger Write könnte außerhalb der Assertion liegen. Dies ist ein nachgewiesener Prüfdefekt; ein solcher Produktwrite wurde weder erzeugt noch behauptet.

**Noch erforderlicher enger Abschluss:** Nach beobachtetem Beginn der neuen Pollrunde deren vollständige Rückkehr in „Abgeglichen“ beziehungsweise das Ende ihres tatsächlichen Syncpromises abwarten. Erst danach Writezahl mit der Baseline vergleichen. Eine angehaltene nachfolgende Dateilesung darf den Test nicht erfolgreich abschließen lassen. Die inzwischen korrekten Prüfungen beider Queues und jeder Remote-Ereignis-ID sowie die diagnostischen Datei-/Paketinformationen beibehalten. Der historische rote Boolean bleibt ursächlich unaufgeklärt; daraus keinen Produktfix ableiten.

## Prüfbelege und Aussagegrenzen

- Implementierer: betroffene Nodefälle 91/91, Server 6/6, gemeinsamer fokussierter Edge-Lauf 6/6; vervollständigte Abschlussfälle auf `6b7e281` Node 5/5 und Edge 3/3. Die Assertions wurden gelesen und den Verträgen zugeordnet; keine Wiederholung dieser grünen Läufe.
- Controller: vollständiger Zwischenstand auf `7fe16e7` Node 504/504 und Browser 41/41. Während dieser Nachprüfung frisch gemeldet: auf unverändertem finalem Code **Node 506/506, 0 Fehler, 80,343 s, Exit 0** und **Browser 43/43, 0 Fehler, 171,995 s, Exit 0**. Diese grünen Gesamtläufe ersetzen die fehlenden Abschlussbedingungen der beiden gezielt belegten Restpfade nicht.
- Eigenständig nur die beiden begründeten Restrepros: einmal `node --input-type=module` für direkten Control-Resume und einmal dieselbe Inlineausführung mit vorhandener Playwright-Laufzeit/System-Edge für den angehaltenen I3-Sync. Beide erfolgreich beendet, ohne ganze Suite, reale Google-Verbindung oder persistente Produkt-/Teständerung.
- Die Cacheversion wurde konsistent von Produkt `v24` auf `v25` und in der synthetischen Updateprobe auf `v26` verschoben. Die vorhandenen Assertions für fehlgeschlagene Installation und kontrollierten Offlinewechsel bleiben erhalten.
- Unstaged zentrale Dokumentation ist Controllerarbeit und wurde nicht verändert. Dieser Reviewer schreibt ausschließlich diesen Bericht; kein Commit/Push.
- Reale Google-, Zwei-Geräte-, Safari-/Apple-/Home-Bildschirm- und Hostingnachweise sowie restliche Motive und responsive Galerie bleiben die unveränderten eigenständigen Grenzen.

Die verbleibenden Punkte gehören zu RF-4 und RF-6 der ursprünglichen gemeinsamen Abschlussverträge. Es wird kein weiterer breiter Reviewumfang und keine neue Anforderungsrunde eröffnet.
