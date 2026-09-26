# Task 5 – unabhängige Spezifikations- und Qualitätsprüfung

Datum: 27.09.2026. Reviewer: GPT-6 Astra, Denktiefe high.
Basis: `9e710149d4e4225ce579ff59d820431cabc06316`.
Geprüfter Kopf: `8ed01f21052724a0ed0df50265d342a0bbf85a22`.

## Urteil

**Spezifikation: noch nicht vollständig erfüllt. Qualität: Änderungen
erforderlich.** Drei Important-Findings und zwei Minor-Findings sind offen.
Keine Critical-Findings. Die vorherige eng begrenzte Aktivierungsdiagnose war
keine Freigabe und wurde nicht als solche verwendet.

## R5-1 – Important: erfolgreicher Commit kann die Kaufansicht im Ladezustand zurücklassen

**Ort:** `src/trainer/ui/purchases.js:190–209,237–250` und
`src/trainer/ui/rewards.js:318`.

Während `run` eine Auswahl oder Kaufbestätigung ausführt, ist der am `#app`
gespeicherte UI-Zustand `busy=true`. Ein erfolgreicher Servicecommit ruft über
Commands `shell.stateChanged()` auf. Außerhalb der Erwachsenenansicht rendert
die Shell den Avatar einschließlich eines neuen `commerceHost` vollständig neu
(`src/trainer/ui/shell.js:405–422`). Die neue Kaufansicht setzt bei geändertem
Root `ui.view=null`, lädt wegen `busy` aber noch keine Ansicht.

Nach Abschluss des alten Aktionshandlers ist dessen Root nicht mehr verbunden.
Der Handler ruft deshalb `onRefresh` auf; dieser Callback ist in `rewards.js`
jedoch eine leere Funktion. Auch ein bereits laufendes `load` rendert bei
abgetrenntem Root keinen Nachfolger. Die neue sichtbare Ansicht bleibt auf
„Figuren und Käufe werden geladen …“, bis ein zusätzlicher Tabwechsel oder
unabhängiger Hintergrundrender sie erneut anstößt. Zugleich kann die vorgesehene
Fokusrückgabe auf einen bereits entfernten Auslöser zeigen.

**Enger Nachweis:** tatsächliches `renderPurchases` mit kleinem In-Memory-DOM,
Serviceport mit asynchronem `getView` und einem `select`, das beim Commit genau
wie die Shell den Root ersetzt und neu rendert. Nach abgewartetem Handler und
Microtasks:

```text
{"afterCommit":"Meine Figur|Entwicklung|Shop|Figuren und Käufe werden geladen …","persistedSelection":[{"profileId":"p1","figureId":"dragon","stage":1}]}
```

Kein Kaufkernfehler: Die Auswahl ist erfolgreich gespeichert. Der vorhandene
Browserfall klickt nach der Auswahl sofort „Meine Figur“ und wartet beim Kauf
bis zu 30 Sekunden; damit belegt er keinen unmittelbaren selbstständigen
Abschluss dieser Renderfolge.

**Mindestabnahme:** Auswahl und Bestätigung mit realem Commands-Commit und
Rootwechsel abschließen. Ohne weiteren Klick, Timer-Sync oder Navigation muss
die aktuell verbundene Ansicht Besitz/Guthaben/Auswahl anzeigen und einen
sinnvollen verbundenen Fokuspunkt besitzen. Entsprechend auch einen während
des ersten Ladens ersetzten Root abdecken. Keine zweite Kaufwarteschlange.

## R5-2 – Important: sichtbare Vorschau und bestätigter Fachstand können auseinanderfallen

**Aktivierungsort:** `src/trainer/ui/purchases.js:367–368`, zusammen mit
`src/trainer/main.js:304–316`.

`previewActivation()` bindet sein Ticket an den aktuellen Commands-Zustand.
`activationPreviewModel(state)` erhält dagegen die ältere `state`-Closure der
bereits dargestellten Einstellungen. Diese Closure bleibt absichtlich bestehen,
wenn Hintergrundänderungen eintreffen: `adultStateChanged` zeigt lediglich einen
Hinweis und ersetzt das Formular nicht (`src/trainer/ui/adult.js:23–34`).

Konkrete Folge: Einstellungen bei Stand A öffnen; ein Hintergrundsync speichert
Stand B mit geändertem Lernstand/Profilnamen; danach die lokale
Aktivierungsvorschau öffnen. Angezeigt werden Punkte und Namen aus A, während
das Ticket B bestätigt. Solange B danach unverändert bleibt, akzeptiert
`activate(ticket)` die Bestätigung. Der neue semantische Fingerprint löst
Transportbuchhaltung korrekt, kann aber diese zwei verschiedenen Datenquellen
nicht miteinander verbinden.

**Backuport:** `src/trainer/ui/backup.js:177–181`.

Die erste Economyvorschau wird vor `restore.prepare(backup)` berechnet.
`prepare` führt zuerst `syncFresh` aus und bindet erst danach seine Vorschau-ID
an den aktuellen Stand (`src/trainer/backup/restore.js:51–55,86–91`). Ein während
dieses Abgleichs bestätigter Kauf oder neue Lernpunkte verändern die korrekten
Vorherwerte. Der Dialog erhält dann den neuen Fachzustand/previewId, aber die
alten wirtschaftlichen Vorherwerte. Die Bestätigung kann regulär gelingen, weil
die Preview-ID bereits den neuen Stand schützt. Der Stale-Neuaufbau berechnet
die Economy nach `prepare`; der Erstpfad tut das nicht.

**Nachweis:** direkte Datenflussprüfung der beiden neuen Aufrufstellen und der
genannten unveränderten Hintergrund-/Preparepfade. Kein Rennen innerhalb eines
Hashalgorithmus erforderlich; ein normaler Hintergrundcommit zwischen Öffnen
der Einstellungen und Vorschauklick beziehungsweise innerhalb `syncFresh`
genügt.

**Mindestabnahme:** sichtbares Modell und Bestätigungsticket aus demselben
verifizierten Fachstand ableiten. Regression mit Hintergrundänderung vor
Aktivierungsvorschauklick sowie mit einem durch Restorevorbereitung eingelesenen
Kauf/neuen Lernpunkten. Reine Uploadbuchhaltung darf weiterhin keine neue
Zustimmung erzwingen; eine echte fachliche Änderung darf nicht unsichtbar unter
einer alten Darstellung bestätigt werden.

## R5-3 – Important: Backupvorschau verspricht eine Figurenauswahl, die Restore nicht übernimmt

**Neue Zusage:** `src/trainer/ui/backup.js:83` und
`src/trainer/ui/purchases.js:118–121`.

Die neue Ansicht meldet „1 Figurenauswahl(en) werden übernommen“, sobald die
Backupauswahl von der lokalen Auswahl abweicht. Die tatsächlich angeschlossene
Restoreintegration übernimmt diese Auswahl jedoch nicht. Ihr Applypfad setzt
den autoritativen Ledger und den Publikationsstatus, behält aber die bisherige
lokale `commerce.selection` bei
(`src/trainer/purchases/integration.js:312–322`).

**Enger Nachweis:** bestehenden Helferaufbau aus
`tests/trainer/purchases-integration.test.js`, Test
`restore preparation binds the existing durable preview job to a fresh shared-head successor`,
ohne Start der Suite ausgeführt. Ein gültiges v3-Backup aus demselben aktiven
Stand erhält die erlaubte Auswahl `explorer-girl`, Stufe 1; Zielauswahl ist leer.
Tatsächliche Kandidatenvorbereitung, vollständiges `readHistory` und
`applyConfirmedControl` wurden verwendet:

```text
RESTORE_SELECTION {"announced":1,"backup":[{"profileId":"p1","figureId":"explorer-girl","stage":1}],"actual":[]}
```

Die zugrunde liegende Applystelle bestand schon vor Task 5. Im aktuellen Gate
ist dies dennoch eine konkrete Integrationslücke der neu angebotenen
wirtschaftlichen Wiederherstellungsvorschau, keine allgemeine erneute Kernreview.
Auch die Auswahldifferenz zählt nur eingehende Auswahlen, keine im Ziel
entfallenden Einträge; die endgültige Vorschau muss den wirklichen Zielzustand
beschreiben.

**Mindestabnahme:** gültige importierte Auswahl am vorgesehenen Restoreabschluss
atomar übernehmen und gegen das tatsächliche Zielkonto prüfen, einschließlich
entfallender Zielauswahlen. Vorschau und Ergebnis müssen übereinstimmen.
Eine nicht bestätigte oder gescheiterte Wiederherstellung darf keine Auswahl
vorzeitig ändern. Mindestens aktuelles Ziel → andere Backupauswahl und aktuelles
Ziel → Backup ohne Auswahl als tatsächliche Zusammensetzung prüfen.

## R5-4 – Minor: Grundform wird bei ausgewählter höherer Stufe fälschlich als ausgewählt gesperrt

**Ort:** `src/trainer/ui/purchases.js:294–299`.

Die Grundformkarte in „Meine Figur“ prüft nur `figureId`. Bei ausgewähltem
`dragon`, Stufe 2 oder 3, erscheint deshalb auch die Grundformkarte als
„Ausgewählt“ und ihr Button ist gesperrt. Diese Karte würde beim Anklicken
ausdrücklich Stufe 1 wählen, entspricht also nicht dem dargestellten
Auswahlstatus. Der Umweg über „Entwicklung“ funktioniert, behebt aber die falsche
Kartenaktion nicht.

**Mindestabnahme:** Grundformstatus zusätzlich an Stufe 1 binden. Nach Auswahl
von Stufe 2 muss „Grundform auswählen“ in „Meine Figur“ verwendbar sein; danach
ist ausschließlich die tatsächliche Grundform als ausgewählt markiert.

## R5-5 – Minor: dokumentierte Bestätigungssignatur ist falsch

**Ort:** `docs/reports/2026-09-27-persistent-purchases-task5-implementation.md:23`.

Der Bericht nennt `confirm(operationId)`. Tatsächlich übergibt die UI das
vollständige geprüfte Previewobjekt
(`src/trainer/ui/purchases.js:262–264`), und
`src/trainer/purchases/service.js:389–406` verlangt dieses Objekt samt
Fingerprint/Head/Angebot. Die Operations-ID gehört zum Wiederaufnahmeport.

**Mindestabnahme:** Bericht auf `confirm(preview)` beziehungsweise die genaue
Previewstruktur korrigieren; `resume(operationId)` getrennt beibehalten.

## Plananforderungen und positive Befunde

- R5-1 betrifft die vorgeschriebene nutzbare Auswahl/Bestätigung und Fokusführung;
  R5-2 die konkrete bewusste Eltern-/Restorevorschau; R5-3 die ausdrücklich
  zugesagte wirtschaftliche Wiederherstellung einschließlich Auswahl. Diese
  drei Punkte sind Gate-relevant. R5-4 und R5-5 sind begrenzte Qualitätskorrekturen.
- Main reicht den wirklichen Kaufdienst explizit weiter. Die neuen allgemeinen
  Kaufaufrufe invalidieren abgelaufene Authentifizierung über `purchaseCall`.
  Keine neue UI-Autorität, keine künstlichen Erträge oder Produkt-Probeimports
  im geprüften Diff. Die exportierte Fingerprintfunktion entspricht dem zuvor
  privaten Servicevertrag; der vollständige CAS-Hash wurde nicht gelockert.
- Guthaben und Lernpunkte werden getrennt dargestellt. Nicht bestätigte Jobs
  ergeben keinen Besitz. Das Modell berücksichtigt Profile getrennt und sperrt
  neue Offlinekäufe. Fehlende Entwicklungsbilder werden nicht als kaufbare
  fertige Formen angeboten. Der klassische Avatar bleibt zugänglich.
- Der HTTP-Testersatz prüft originale Beareraufrufe und `If-Match`, aktualisiert
  den Pointer vor simuliertem Antwortverlust und liefert den echten
  V2-Metadatenvertrag. Er umgeht die Produktservice-/Transportlogik nicht.
- Serverfreigabe und Worker v23 enthalten die neue Runtimeabhängigkeit, die
  benötigten Basisbilder und die vier Drachenquellen. Workerupdate-/Offlinebelege
  bleiben synthetische Browserbelege. Es wurde keine Token-/Googleantwortcache-
  Erweiterung eingeführt.
- Unabhängig per Bytevergleich und SHA-256 geprüft: alle vier ausgelieferten
  Drachen-PNGs stimmen exakt mit den ausgewählten Quellen 1-v3, 2-v3, 3-v1 und
  4-v2 überein. Größen und Hashes stimmen mit dem Implementierungsbericht überein.

## Prüfumfang und Grenzen

Gelesen: Reviewbrief, Taskbrief, Implementierungsberichte, Integrationaudit und
bereitgestelltes vollständiges Task-5-Diffpaket mit allen drei enthaltenen
Commits. Produkt-, Vertrags-, Test-, Fixture-, Serving- und Cacheänderungen wurden
inkrementell geprüft. Bei abgeschnittenen Toolausgaben wurden die betroffenen
Funktionsbereiche gezielt aus den Dateien vervollständigt. Historische
Controllerberichte waren Kontext, keine erneute Kernreview.

Unveränderte Pfade wurden ausschließlich für konkrete neue Integrationsrisiken
nachverfolgt: Commands-Commit/Shellrender für R5-1, Adult-DOM und Restoreprepare
für R5-2, tatsächliche Restoreübernahme für R5-3, Basisbildrenderer für die neue
Auslieferung. Root-eigene uncommittete `.gitattributes`-Änderungen wurden nicht
bewertet oder verändert.

Ausgeführt wurden zwei kurze `node --input-type=module`-Repros über temporäre
PowerShell-Here-Strings sowie ein reiner Bildbyte-/Hashvergleich. Der erste
Repro verwendet die tatsächliche UI-Komponente mit minimalem DOM und simuliert
den nachvollzogenen Rootwechsel; er ist kein neuer vollständiger Browserlauf.
Der zweite verwendet die tatsächliche Restoreintegration und geprüfte Historie.
Keine Produktänderungen, keine Subagents, kein Git-/Index-/HEAD-Eingriff und
keine Live-Google-Aufrufe.

Die angegebenen Browserläufe 3/3, fokussierten 126/126 und der letzte
Harnessfall 1/1 sind Implementiererbelege; deren Assertions wurden geprüft, die
Suiten nicht wiederholt. Die Desktop-/Mobilebilder wurden bereits durch den
Controller visuell geprüft. Die vorliegende Review behauptet keine zusätzliche
persönliche Bild- oder Apple-Abnahme. Task-6-Gesamtsuite, reale Zwei-Geräte- und
Appleprüfungen sowie Veröffentlichung bleiben eigene spätere Grenzen.

**Offen:** R5-1, R5-2, R5-3 (Important); R5-4, R5-5 (Minor).
