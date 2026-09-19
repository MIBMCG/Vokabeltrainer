# Produkt-Datenvertrag v1/v2

Stand: 19.09.2026. B1 ergänzt kompatible v2-Verträge und die lokale Migration; B2 implementiert die getrennte konfigurierbare Lernplanung und ihre Commands. B3 stellt die Erwachsenenbedienung bereit, C1 die gemeinsame Statistikprojektion. Die folgenden v1-Grundregeln bleiben gültig, soweit die ausdrücklich genannten v2-Ergänzungen sie nicht erweitern. Ursprüngliche Ausführungsgrundlage für den [v1-Plan](superpowers/plans/2026-09-17-vokabeltrainer-v1.md), **Funktionsnachweise stehen in den jeweiligen Umsetzungsberichten**. Der [bestätigte Entwurf](superpowers/specs/2026-09-16-vokabeltrainer-design.md) und die [bestätigte Überarbeitung](design/2026-09-19-ueberarbeitung.md) bestimmen das Produktverhalten. Dieses Dokument konkretisiert seine internen Verträge ohne Änderung des Konten-, Kosten- oder Funktionsumfangs.

Die während der Umsetzung präzisierten Schnittstellen und ihre Gründe sind in [Entwicklungsentscheidungen](ENTWICKLUNGSENTSCHEIDUNGEN.md) dokumentiert.

## Trennung und Versionen

- Neue App unter `trainer/`, Module unter `src/trainer/`, Datenbank `vokabeltrainer-product-v1`, Web-Lock `vokabeltrainer-product-v1-writer`, Cachepräfix `vokabeltrainer-product-`. Keine Probe-Daten lesen oder migrieren. Die bisherige Probe am Web-Root bleibt erreichbar.
- Alle Austauschobjekte haben `format: 'vokabeltrainer-product'` und einen unten definierten `kind`. Unterstützt sind ausschließlich die Paare `(formatVersion, ruleVersion) = (1,1)` und `(2,2)`. Neue Writer erzeugen v2, Leser erhalten die tatsächliche Eingangsversion. Ein v1-Paket, -Backup oder -Snapshotteil darf keine v2-Ereignisse verstecken; v2 darf unveränderte v1-Historie enthalten. Bestehende Descriptoren und Epochen behalten ihre Version auch bei neuen v2-Ereignissen. Unbekannte und gemischte Versionspaare benötigen ein App-Update. Die Probe ist keine Produktvorgängerversion.
- IDs sind nichtleere ASCII-Zeichenfolgen aus `[A-Za-z0-9_-]`, höchstens 128 Zeichen. Produktion verwendet `crypto.randomUUID()`, Tests dürfen lesbare IDs verwenden. Datum ist ein validiertes `YYYY-MM-DD`, Zeit ein gültiger ISO-UTC-Zeitpunkt. Zähler sind nichtnegative sichere Ganzzahlen. Objektschlüssel sind fest vorgegeben; zusätzliche unbekannte Felder und gefährliche Schlüssel wie `__proto__` führen zur Ablehnung des gesamten Austauschobjekts mit `invalid`, nicht zu stillem Entfernen einzelner Felder.
- Mengen werden als eindeutige, lexikografisch sortierte ID-Arrays serialisiert. Kanonisches JSON sortiert Objektschlüssel, erhält normale Array-Reihenfolge und verbietet nichtendliche Zahlen. Hashes sind SHA-256 über UTF-8 dieses kanonischen JSON, als 64 kleine Hexzeichen. Hashes sind Integritätsprüfungen, keine Signaturen oder Zugriffsrechte.
- Grenzen: 64 KiB UTF-8 pro Änderungs-Paket einschließlich Hülle, höchstens 100 Ereignisse pro Paket; höchstens 16 KiB pro einzelnes Ereignis. Eingaben: Anzeigename/Lektion 80 Zeichen, deutsches Wort 200, Hinweis 300, englische Variante 200, höchstens 20 Varianten. Überschreitungen werden vor dem Speichern sichtbar gemeldet. Eine Sicherung darf 25 MiB und 100.000 Ereignisse nicht überschreiten; diese Schutzgrenzen werden in der Importvorschau verständlich genannt, ohne vorhandene Daten abzuschneiden.

## Datensatz, Ereignis und Ledger

```js
// Neue Austauschobjekte verwenden v2; gespeicherte v1-Hüllen bleiben unverändert.
const VERSION = {format: 'vokabeltrainer-product', formatVersion: 2, ruleVersion: 2};
// Descriptor (kind: 'dataset')
{...VERSION, kind: 'dataset', datasetId, name, timeZone, rootEpochId, createdAt}
// Event; type bestimmt die unten aufgeführte Payload.
{...VERSION, kind: 'event', id, datasetId, epochId, deviceId,
 clock, occurredAt, day, type, payload}
// Ledger ist das vollständige, validierte lokale Fachmodell, ohne Sitzungen/PIN/Token.
{descriptor, events: Event[], epochs: Epoch[], snapshots: Snapshot[],
 historicalEpochs: EpochHistory[]}
```

`timeZone` ist eine von `Intl.DateTimeFormat` akzeptierte IANA-Zeitzone; eingerichtet mit der ermittelten Browserzeitzone. `day` wird beim Ereignis aus `occurredAt` in dieser Zeitzone berechnet. Ein späterer Wechsel der Gerätezeitzone ändert gespeicherte Tage nicht. v1 bietet keinen Einstellungsdialog zum Ändern der gemeinsamen Lernzeitzone.

Vor einem lokalen Ereignis: `clock = 1 + max(localClock, ...knownEvents.clock, ...knownEpochs.clock)`. Sortierung von Lernereignissen: `(clock, deviceId, id)` mit einfacher ASCII-Reihenfolge, unabhängig von Geräteuhr, Downloadreihenfolge und Locale. IDs werden auf kanonisch gleichen Inhalt geprüft: gleiche ID/gleicher Inhalt ist dieselbe Tatsache; gleiche ID/anderer Inhalt blockiert dieses Paket als Datenfehler. Ein Batch wird entweder ganz übernommen oder bleibt in Quarantäne; gültige unabhängige Pakete können weiterhin ankommen. Fehlende Abhängigkeiten bleiben als unvollständige Pakete erhalten und werden nach dem nächsten Abruf erneut geprüft.

## Ereignistypen (gemeinsamer v1-Kern)

| `type` | Exakte `payload` | Bedeutung |
| --- | --- | --- |
| `entity.revised` | `{entityType, entityId, parents, value}` | Unveränderliche Inhaltsfassung; Fassung-ID ist die Ereignis-ID. |
| `round.started` | `{roundId, profileId, mode, size}` | `mode`: `all/latest/new`; `size`: `10/20/30`. Die vollständige Kandidatenmenge bleibt ausschließlich in `LocalRound`. |
| `answer.recorded` | `{roundId, profileId, ordinal, wordId, revisionId, learningId, correct}` | `ordinal` 1–30, im selben Rundendurchlauf eindeutig. Keine getippte Antwort. |
| `round.completed` | `{roundId, profileId, reason, answerIds}` | `reason`: `full/exhausted`; enthält genau die gewerteten Antwort-IDs der Runde. Ein Bonusanspruch je `roundId`. |
| `round.abandoned` | `{roundId, profileId}` | Bewusste neue Runde; bisherige Antwortpunkte bleiben, kein Bonus. |
| `word.milestone` | `{profileId, wordId, milestone, evidenceAnswerIds}` | `milestone`: `mastered/recovered`; einmaliger fachlicher Anspruch je Profil/Wort/Typ. |
| `avatar.changed` | `{profileId, skin, clothing, head, back, hand}` | Haut `0..3`, Kleidung `0..5`; Ausstattung siehe unten. |
| `preference.changed` | `{profileId, animations}` | Boolesche Bewegungspräferenz; deterministisch letzter Eintrag je Profil. |
| `events.adopted` | `{sourceEpochId, eventIds, supportEventIds}` | Explizit ausgewählte späte Ereignisse in der neuen Epoche aktivieren; Original-IDs erhalten. |

### Zusätzlicher v2-Vertrag

`round.started` enthält zusätzlich `{policyEventId, policy}`, `answer.recorded` zusätzlich `{schedulingGenerationId}`. `policyEventId:null` bedeutet exakt `{slowAfter:3,stopAfter:null,intervals:[1,3,7,14]}`. Sonst referenziert es `learning.rules.changed` desselben Kindes mit identischen Regelwerten. Eine v2-Antwort darf einen unveränderten v1-Rundenstart referenzieren; `schedulingGenerationId:null` bezeichnet die bisherige Wortgeneration.

Neue Ereignisse, ausschließlich in v2:

| Typ | Exakte Payload | Verweise |
| --- | --- | --- |
| `learning.rules.changed` | `{profileId,slowAfter,stopAfter,intervals}` | Bestehendes Profil |
| `word.reactivated` | `{profileId,wordId,revisionId,learningId}` | Bestehendes Profil und passende Wort-/Lernfassung |

`slowAfter` ist eine ganze Zahl 2–10. `stopAfter` ist null oder ganzzahlig zwischen `slowAfter` und 20. `intervals` enthält genau vier positive, nicht absteigende ganze Tageswerte bis 365. Zusätzliche Schlüssel sind ungültig. Eine referenzierte Wiederaktivierung gehört zu demselben Profil, Wort und derselben Lernfassung; spätere inhaltlich gleiche Revisionen dürfen die Lernfassung behalten.

Regel- und Wiederaktivierungsreferenzen gehören zum transitiven Sicherungs-/Adoptionsabschluss. Sie können reine Unterstützung sein: dadurch bleiben historische Runden lesbar, ohne eine aktuelle Regel oder Generation zu aktivieren. Fehlende Referenzen bleiben unvollständig. Übernahmevorschauen nennen neue/entfallende Regel- und Wiederaktivierungsereignisse im effektiven Verlauf sowie rein unterstützende Grundlagen. Aktuelle Regeln und Generationen gewinnt jeweils das größte effektive Ereignis nach (clock,deviceId,id). Konkurrierende Regeln werden als ganzes Objekt gewählt; reine Unterstützung wird niemals zum aktuellen Gewinner. Punkte und Dreier-Meilensteine bleiben unverändert.

Die B2-Wiederholungsprojektion `projectSchedule({ledger,profileId,policy,day,generations})` liefert verschachtelte Maps nach Wort-/Lernfassung mit `streak`, `intervalIndex`, `dueDay`, `errorGap`, `retryPending`, `excluded` und `generationId`. Sie nutzt dieselbe nach Antwortslot deduplizierte effektive Antwortmenge wie Punkte und Statistik. Die Scheduling-Serie ist ungedeckelt; eine falsche Antwort setzt sie und die Intervalle zurück, mit zwei anderen Antworten als Fehlerlücke. Bei `slowAfter` beginnt der erste Tagesabstand und die Runde pausiert das Wort; weitere fällige richtige Antworten erhöhen den Intervallindex höchstens einmal je Runde. Der vierte Abstand wiederholt sich. `stopAfter` unterbindet ausschließlich die automatische Auswahl.

Neue Runden verwenden den aktuellen Regelvertrag. Antwort, Weiter, Fortsetzen und Erweitern behalten die gespeicherte Policy sowie Generationen vorhandener Kandidaten. Ausschließlich zusätzlich aufgenommene Wörter erhalten bei Erweiterung ihre dann aktuelle Generation. Eine Wiederaktivierung startet diese Generation bei null und sofort fällig. Antworten alter oder unterlegener Generationen behalten ihre einmalige Punkte-/Statistikwertung, beeinflussen aber nicht die aktuelle Wiederholungsserie. „Neue Vokabeln“ bleibt an jemals geübt gebunden. Eine neue Runde berechnet ihre Fälligkeiten anhand ihres Regelvertrags aus der unveränderten Geschichte neu.

`setLearningRules({profileId,expectedPolicyEventId,policy})` und `reactivateWord({profileId,wordId,learningId,expectedGenerationId})` prüfen im serialisierten Schreibabschnitt das aktive Profil, eine eindeutige Epoche und die erwarteten aktuellen IDs. Ein überholter Entwurf ergibt `conflict`, ohne ein Ereignis zu speichern. `learningRulePreview({profileId,policy})` liefert `{excludedCount,dueCount,policyEventId}` ohne Mutation oder ID-Verbrauch. Die PIN-Bediengrenze gehört zum Adult-Aufrufer. Die B3-Formulare behalten den ursprünglichen Regelkopf während des gesamten Entwurfs; eine erneute Vorschau darf ihn nicht still aktualisieren.

Die reine C1-Projektion `learningStatistics({ledger,profileId,day,days})` akzeptiert 14 oder 30 Tage und liefert `{summary,buckets,daily,dueCount,wordCount,epochConflict}`. `summary` enthält Versuche, richtige/falsche Antworten und die ungerundete Prozentquote, ohne Versuche `null`. Tageswerte bilden das inklusive Intervall von `addDays(day,1-days)` bis `day` anhand von `event.day`; wirksame historische Antworten bleiben auch nach Archivierung oder Zuordnungsentzug enthalten. Die vier Gruppen `new/learning/review/excluded` zählen nur aktive, zugeordnete, konfliktfreie Wörter: ausgeschlossen zuerst, niemals geübt neu, danach aktueller Intervallstatus Auffrischung, sonst in Übung. Reaktivierung setzt nicht „jemals geübt“ zurück. `dueCount` stammt aus der gemeinsamen all-Modus-Vorschau. Der reine Command nutzt dieselbe injizierte Zeitquelle und Datensatzzeitzone wie die Übungsvorschau. Bei Epochenkonflikt werden keine scheinbar gültigen Gesamtwerte angezeigt.

`entityType` ist `profile/lesson/word`. Die Werte sind vollständige Fassungen:

```js
profile = {name, archived};
lesson = {name, archived, profileIds};
word = {lessonId, german, hint, answers, archived, learningId};
```

`parents` sind sämtliche beim Bearbeiten bekannten aktiven Köpfe derselben Entität; erste Fassung hat `[]`. Profil-/Lektionsanlage und Wortanlage erhalten stabile Entitäts-IDs unabhängig von Fassungen. Die Anlegereihenfolge einer Lektion ist der Sortierschlüssel ihrer ersten Fassung; beim Zusammenführen identischer Wurzeln die kleinste stabile erste Fassung verwenden. Eine Bearbeitung ändert die Anlegereihenfolge nicht. Entitäten haben keine endgültige Löschoperation.

Normalisierung: NFC, trim, Kleinschreibung mit `toLowerCase()`, typografische Apostrophe `U+2018/U+2019/U+02BC` zu `'`; innere Leerzeichen und übrige Zeichen bleiben erhalten. `semanticWord(value)` ist `{german: normalize(german), hint: normalize(hint), answers: sort(unique(answers.map(normalize)))}`. Archivierung, Lektion und Schreibweise gehören nicht zur Lernbedeutung.

`learningId` wird bei neuer Vokabel aus Wort-ID und erster Fassung-ID gebildet. Für eine neue Fassung mit unveränderter Lernbedeutung und genau einer gemeinsamen bisherigen Lern-ID bleibt diese erhalten. Bei Bedeutungsänderung oder Auflösung verschiedener bisheriger Lern-IDs entsteht `sha256({wordId, parentLearningIds: sort(unique(...)), semantic: semanticWord(value)})`. Dadurch erzeugen identische parallele Änderungen desselben Ausgangsstands dieselbe Lernfassung; Rückänderung auf einen früheren Text reaktiviert keine alte Serie. Den Hash vor der IndexedDB-Transaktion berechnen, nicht innerhalb einer offenen Transaktion auf WebCrypto warten.

Aktive Fassungen sind aktive Knoten, die nicht Vorfahren anderer aktiver Nachfolger sind. Vorgängerketten werden dabei auch durch reine Supportfassungen verfolgt; ein ausschließlich unterstützender Nachfolger verdrängt keinen aktiven Kopf. Die Anlegereihenfolge stammt aus der frühesten erreichbaren Wurzelfassung. Support erzeugt selbst weder aktive Köpfe noch Konflikte. Mehrere normalisiert identische Köpfe gelten als kompatibel; Darstellung verwendet die nach Ereignisschlüssel größte Fassung, nächste Bearbeitung referenziert alle Köpfe. Unterschiedliche aktive Köpfe bleiben Konflikt. Vergleich für Profile/Lektionen umfasst alle Felder und normalisierte Texte; für Wörter umfasst er zusätzlich Archivierung und Lektionszuordnung. Ein Archivierungs-/Zuordnungskonflikt wird damit nicht versehentlich als bloße Schreibkorrektur zusammengeführt. Konfliktlösung erzeugt eine neue Fassung mit allen aktuellen Köpfen als Eltern. Ein inzwischen weiterer Kopf erfordert eine aktualisierte Vorschau.

Referenzen müssen existieren und zum Datensatz passen. Fassungseltern sind azyklisch und gehören zur gleichen Entität. Antwort referenziert eine Wortfassung desselben Wortes mit gleicher Lern-ID, den Rundeneintrag mit gleichem Profil und einen gültigen Ordinal. Mehrere IDs für denselben `(roundId, ordinal)` mit unterschiedlicher Antwort sind Datenfehler. Identische Wiederholung wird fachlich nur einmal berücksichtigt. `full` verlangt genau `size` Antworten, `exhausted` mindestens eine und weniger als `size`; doppelte Abschlussansprüche geben keinen zweiten Bonus. Keine Abschlusswertung nach `round.abandoned`.

Die lokale Befehlsprüfung entscheidet, ob eine Aufgabe zum aktuellen Zeitpunkt zulässig ist; sie prüft die eingefrorene und gegebenenfalls bewusst erweiterte Auswahl in `LocalRound.candidates`. Das kleine synchronisierte Startereignis enthält keine Wortliste. Dadurch überschreitet eine große lokale Auswahl nicht die Ereignisgrenze und eine zulässige spätere Erweiterung widerspricht keinem unveränderlichen Startereignis. Import verlangt keine Kandidatenmitgliedschaft; Wortfassungs-, Profil-, Runden-, Ordinal- und Abschlussreferenzen bleiben verpflichtend. Importvalidierung darf historisch gültige Antworten nicht wegen inzwischen entzogener Zuordnung oder neuer Fassung verwerfen. Antwortereignisse enthalten absichtlich keine gegen manipulierte Clients gerichteten Sicherheitsbeweise.

## Lernprojektion und lokale Runde

```js
// project(ledger) -> Projection
{activeEpochId, epochConflict, entities, conflicts, profiles,
 lateEvents, effectiveEventIds, integrityProblems}
// integrityProblems: [] oder stabile Codes, derzeit ['active-epoch-incomplete']
// profiles[profileId]
{points, level, completedRounds, badges, avatar, animations, words}
// words[wordId]: Summen über alle Fassungen, aktueller Lernzustand zusätzlich
{attempts, correct, wrong, lastPracticedAt, everPracticed,
 learningId, streak, intervalIndex, dueDay, errorGap, retryPending, masteredEver, recoveredEver}
// LocalRound wird nur auf diesem Gerät gespeichert, niemals synchronisiert.
{id, epochId, profileId, mode, size, candidates, expanded,
 pausedWordIds, answeredIds, wordCounts, lastWordId, current, feedback, status}
// current: null | {wordId, revisionId, learningId, ordinal}
// feedback: null | {answerId, typed, correct, solutions}
// status: 'asking' | 'feedback' | 'exhausted' | 'completed' | 'abandoned'
```

`wordCounts` ist die lokale Map Wort-ID → Zahl gewerteter Antworten dieser Runde; fehlender Eintrag bedeutet null. `lastWordId` ist das zuletzt gewertete Wort oder `null`. Eine neue Runde beginnt mit leerer Map und `null`. Nur eine neue Antwort-ID erhöht den Wortzähler und setzt das letzte Wort; Summe der Zähler entspricht `answeredIds.length`. Beide Felder werden mit der Antwort atomar gespeichert, bleiben bei Fortsetzen, Erweiterung, Tages-/Profilwechsel erhalten und ändern sich weder durch fremden Sync noch ungewertete Eingaben/Aufgabenwechsel.

`retryPending` bezeichnet einen noch offenen Fehler der aktuellen Lernfassung: initial `false`, nach falscher Antwort `true`, nach der nächsten richtigen Antwort dieses Wortes `false`. Historische Fehler anderer Lernfassungen setzen diesen Zustand nicht.

Fehlerabstand wird pro Profil und Lernfassung verarbeitet: bei falscher Antwort `errorGap=2`; jede weitere gewertete Antwort auf ein anderes Wort desselben Profils dekrementiert bis null. Antworten anderer Profile und ungewertete Eingaben verändern ihn nicht. Bei einem Fehler `streak=0`, `intervalIndex=-1`, `dueDay=null`. Drei richtige Aufbauantworten führen zu `streak=3`, `intervalIndex=0`, `dueDay=day+1`. Eine richtige fällige Wiederholung (`answer.day >= dueDay`, höchstens einmal je Wort/Runde) führt zu `intervalIndex=min(3, intervalIndex+1)` und `dueDay=day+[1,3,7,14][intervalIndex]`. Eine parallel entstandene weitere richtige Antwort vor Fälligkeit behält ihre Punkte, steigert aber das Intervall nicht. Der Tag ist der gespeicherte Antworttag. Fehler startet den Aufbau erneut. Kalenderaddition verwendet Datumsbestandteile, niemals `24h` auf lokale Zeitpunkte; Sommerzeit ist kein 23-/25-Stunden-Fehler.

Eine Wortfassung mit neuem `learningId` beginnt mit leerem Lernzustand; Versuchssummen, Punkte und Erfolge vorheriger Fassungen bleiben erhalten. `everPracticed` gilt über sämtliche Fassungen. Wiederholte oder verspätete Ereignisse werden in deterministischer Reihenfolge neu projiziert; die neue Projektion darf Serie/Fälligkeit korrigieren, Ereignisse bleiben unverändert.

`word.milestone` speichert bereits beobachtete Erfolge dauerhaft, damit ein späterer Fehler oder eine durch Offlinezusammenführung geänderte Serie erworbene Abzeichen nicht zurücknimmt. `mastered` referenziert drei verschiedene richtige Antworten derselben Lernfassung, die beim lokalen Erreichen die Dreierserie bildeten. `recovered` referenziert eine falsche und eine später kausal erzeugte richtige Antwort auf dasselbe Wort. Der Validator prüft ID-Eindeutigkeit, Profil/Wort, Ergebnis, Lernfassung für `mastered` und Reihenfolge der Belege; nicht die nachträgliche Nachbarschaft in einer erweiterten Offlinehistorie. Ein Anspruch je Wort/Profil/Typ zählt höchstens einmal.

`pendingMilestones(ledger)` faltet die gesamte wirksame, sortierte und nach Rundenslot deduplizierte Antwortgeschichte mit derselben Lernlogik wie `project`. Der reine Helfer liefert je Profil/Wort/Typ höchstens einen noch nicht wirksam gespeicherten Milestone-Payload; ohne vollständige eindeutige aktive Epoche liefert er `[]`. Erfolge eines Zwischenstands bleiben Kandidaten, auch wenn im selben Batch später ein Fehler folgt. Support und Altbestände erzeugen und unterdrücken keine Ansprüche. Task 5 ergänzt die Claims nach lokalen und externen Änderungen mit neuen IDs/Uhren atomar vor Veröffentlichung des Zustands. Ein Endzustandsvergleich oder ausschließliches Auswerten neu eingetroffener Ereignisse genügt nicht.

Sechs Badge-IDs: `first-round`, `ten-rounds`, `ten-mastered`, `ten-recovered`, `forest`, `journey-complete`. Voraussetzungen: 1/10 Abschlussansprüche, 10 verschiedene `mastered`-/`recovered`-Wörter, 1.000/3.000 Punkte. Punkte nur 10 pro korrekter eindeutiger Antwort und 20 pro gültigem eindeutigem Abschlussanspruch. Level `1+floor(points/200)`; 15 Etappen à 200, Strand/Wald/Berg bei 0/1.000/2.000. Avatar: `head=null/cap/sunhat/mountainhat` (Level 2/6/11), `back=null/backpack` (4), `hand=null/binoculars/compass` (8/14). Alle Auswahlereignisse werden erhalten; gesperrte Ausstattung wird bei Anzeige/Bestätigung nicht freigegeben. Späterer Restore kann Belohnungen und Auswahl auf den Sicherungsstand zurücksetzen.

## Pakete, lokale Speicherung und Drive

Für `commitExternal` wird der erwartete lokale Zustands-Hash ausschließlich mit `productStateHash(state):Promise<string>` aus `commands.js` erzeugt. Der Helfer kopiert den vollständigen gültigen `ProductState`, wandelt `rounds` und die enthaltenen `wordCounts` in ASCII-sortierte `[id, value]`-Arrays und verwendet dann den kanonischen SHA-256-Digest. Damit bleiben zulässige Spezial-IDs in lokalen Maps erhalten, ohne die Schlüsselprüfung des Austauschformats zu lockern. Unterschiedliche Einfügereihenfolgen ergeben denselben Hash; geänderte Inhalte ändern ihn. Vor `setup` ist der Befehlszustand `null`, erst danach kann ein PIN-Prüfwert gespeichert werden.

```js
// Packet
{...VERSION, kind: 'packet', datasetId, epochId, packetId, events: Event[]}
// Persistierter Zustand; niemals als Ganzes exportieren!
{storageVersion: 2, deviceId, clock, ledger, rounds, binding,
 outboxEventIds, pendingPackets, datasetSetup, packetIntegrity,
 knownFiles, quarantinedFiles,
 safetyCopies, restoreJobs, snapshotManifests, pinVerifier}
// binding: null | {accountId, folderId, descriptorFileId, datasetId}
// pendingPackets entry: {packet, driveFileId: null | string, confirmed: false}
// datasetSetup: null | {accountId,name,folderId,descriptorFileId,epochFileId,
//   datasetId,descriptor,rootEpoch}
// packetIntegrity: {packetId,contentHash}[]
// knownFiles: {fileId, contentHash, kind}[]
// outboxEventIds: noch nicht in unveränderliche Pakete aufgenommene Ereignis-IDs
// pinVerifier: null | {salt,hash,iterations}; Base64werte, PBKDF2-SHA-256
// snapshotManifests: {snapshotId, fileId}[]; geprüfter lokaler Transportindex, kein Fachinhalt
// restoreJobs: persistierte Versuche mit Phasen und stabilen Datei-IDs, siehe unten
```

`rounds` ist ein Objekt nach Profil-ID. `datasetSetup` ist ein eigener lokaler Transportauftrag für die erste Veröffentlichung und wird nicht in `restoreJobs` abgelegt: Konto-ID, unveränderlicher Ordnername, Datensatz-ID, die drei vorab reservierten Drive-IDs sowie die exakten Descriptor-/Wurzelepochenwerte werden nach der ID-Reservierung und vor `createFolder` oder `putJson` atomar gespeichert. Ein Wiederholungsversuch verwendet genau diese IDs und Werte; erst die bestätigte Bindung setzt den Auftrag auf `null`. `packetIntegrity` ordnet jede logische Paket-ID ihrem SHA-256-Hash über den kanonischen vollständigen Paketinhalt zu. Gleiche Paket-ID mit anderem Hash ist eine Kollision, unabhängig von Drive-Datei-ID oder Sitzung. Beide Felder sind lokaler Transportzustand und gehören nicht in portable Backups.

Alte gültige Zustände mit `storageVersion: 1`, denen nur `datasetSetup` und/oder `packetIntegrity` fehlen, werden beim Laden kompatibel zu `null` beziehungsweise `[]` normalisiert. Ein leerer alter Paketindex wird beim nächsten Abgleich dadurch sicher aufgebaut, dass bekannte Dateien ohne sitzungsintern bestätigte Version/Hash-Zuordnung erneut gelesen werden; erst vollständig validierte oder lokal dauerhaft erzeugte Pakete erhalten einen Indexeintrag. Andere fehlende, zusätzliche oder ungültige Felder bleiben ein Formatfehler.

`restoreJobs` ist ein Array aus `{id,phase,backup,previewId,parentHeads,safetyCopyId,snapshot,uploads,epoch}`; optionale noch nicht erreichte Werte sind `null`. Phasen: `preparing/preview/uploading/published/activated`; `uploads` enthält `{kind,logicalId,fileId,value,verified}` und wird vor jedem Netzaufruf gesichert. `safetyCopies` enthält `{id,createdAt,purpose,backup,hash,driveManifestFileId,verified}`; Backup muss lokal rücklesbar sein, Drivebezug ist lokal und wird nicht als gebundene Verbindung exportiert. `quarantinedFiles` enthält ausschließlich Inhalts-/Versions-/Referenzprobleme als `{fileId,code,message,value}` ohne Token/HTTP-Header. Konto-/Ordnerbindung, Authentifizierung, Berechtigung und vorübergehende Transportfehler stoppen den Lauf sichtbar und werden nicht als dauerhafte Inhaltsquarantäne gespeichert. PIN-Iterationszahl wird im Prüfeintrag gespeichert; die technische Hürde bleibt ausdrücklich kein Kontenschutz.

Fachereignis, aktuelle lokale Runde einschließlich Rückmeldung und ausstehende Übertragung werden in **einer** IndexedDB-Transaktion bestätigt. Kein „Weiter“, solange sie fehlschlägt. In-Memory-Zustand erst nach `transaction.oncomplete` ersetzen. Ein pro Datenbank exklusiver Web-Lock schützt schreibende Tabs; fehlende Unterstützung meldet eine konkrete Voraussetzung und öffnet keinen ungeschützten Writer. Gescheiterte Migration verändert den alten Bestand nicht. B1 migriert einen vollständig validierten v1-Zustand vor Freigabe der Commands mit genau einem atomaren `store.save()` zu `storageVersion:2`. Datenbank und Writer-Lock bleiben unverändert. Unbekannte Speicherversionen zeigen einen Fehler und werden niemals geleert.

Vor dem Speichern wird aus dem Originalzustand eine echte v1-Fachsicherung erzeugt, deren Snapshot und SHA-256 geprüft werden. Bei mehreren Epochenköpfen entsteht pro Kopf eine Kopie über den bestehenden expliziten `selectedEpochId`-Export, jeweils aus demselben Originalzustand. Alle Köpfe bleiben erhalten; die Migration wählt keine aktive Epoche. Die neue lokale Kopie erhält `purpose:'format-migration'`, `driveManifestFileId:null`, `verified:true`. Ihr inneres v1-Backup enthält ausschließlich den ursprünglichen Sicherheitskopienindex und bleibt mit dem eingefrorenen Altreader lesbar. Vorhandene Sicherungen werden samt Hash erneut geprüft. Kopien und migrierter Zustand werden zusammen in der vorhandenen atomaren IndexedDB-Transaktion gespeichert; Fehler vor oder während dieser Transaktion erhalten den alten Zustand.

Bestehende Ereignisse, Descriptoren, Epochen, Snapshotbezüge, Paketbodys/-Hashes, ausstehende Uploads, Restorejobs, Geräte-/Kontobindung und PIN-Verifier bleiben unverändert. Lokale Runden erhalten Defaultpolicy, `policyEventId:null`, `schedulingMode:'legacy'` und `schedulingGenerationId:null` an Kandidaten und aktueller Aufgabe. Feedback, Pausen und Zähler bleiben erhalten. Vor B2 erzeugte v2-Runden bleiben ebenfalls im Legacy-Modus. Seit B2 speichern ausschließlich neue Runden schedulingMode: configurable; sie frieren aktuelle Policy-ID, Regelwerte und Kandidatengenerationen ein. Wiederholter Start migriert v2 nicht nochmals.

Die unveränderten Altquellen aus `cc079cbea31d6d834b7d8eba1920486daddb4e90` liegen unter `tests/compat/v1/`; Herkunft, Bytezahlen und SHA-256 stehen im dortigen Manifest. Tests importieren den tatsächlichen Altclient ohne Git-/Netzzugriff zur Laufzeit.

Die öffentliche OAuth-Client-ID darf lokal konfiguriert werden; Token bleibt in der `createTokenSession`-Instanz. PIN-Prüfwert bleibt ausschließlich lokal. Die Bindung wird beim Einrichten nach bestätigter Erwachsenenwahl dauerhaft gespeichert. Bereits gebundene Browser wechseln nicht still Konto/Ordner. Eine ungebundene lokale Sammlung kann einen neuen Cloudbestand anlegen; Auswahl eines bestehenden Cloudbestands erzeugt eine gesicherte, ausdrückliche Auswahlvorschau. Lokale und entfernte IDs werden nicht zusammenkopiert: entweder lokalen Stand in eigenem neuen Bestand behalten oder vorhandenen Cloudbestand nach lokaler Sicherheitskopie öffnen. Wiederherstellen des lokalen Backups in den gewählten Cloudbestand ist anschließend ein eigener bestätigter Restore.

Drive-App-Eigenschaften enthalten ausschließlich Zeichenfolgen: `{app:'vokabeltrainer-product', kind:'dataset-folder'|'dataset'|'packet'|'snapshot-part'|'snapshot-manifest'|'epoch'|'safety-copy', datasetId, ...}`; Paket zusätzlich `epochId, packetId`, Snapshotteile zusätzlich `snapshotId, partIndex`. Probe-Kennungen sind unzulässig. Suche beschränkt sich auf App-Kennungen und den verifizierten Elternordner. Der vorhandene Drive-Adapter paginiert und prüft `incompleteSearch`; Trainer dupliziert keine HTTP-/OAuth-Implementierung.

Der neue reguläre Sync liest zuerst die entfernten Produktdateien und prüft Versionspaare vor Veröffentlichung lokaler Epochen, Paketbildung oder Uploads. Dies umfasst isolierte Snapshotteile und geänderte bekannte Dateien. Unbekannte Versionen bleiben mit ihrem gelesenen Inhalt lokal nachvollziehbar und blockieren diesen Schreibdurchlauf. Gewöhnliche ungültige Fremddateien behalten die bisherige Quarantäne mit Upload unabhängiger gültiger Änderungen. Ein eingefrorener Altclient kennt diese frühere Sperre nicht: er kann eigene v1-Antworten vor der v2-Quarantäne noch hochladen, endet aber nicht als erfolgreich synchronisiert. Die neue App nimmt solche Antworten weiterhin genau einmal an; eine Fernsperre alter Apps wird nicht zugesagt.

Vor Upload Paketinhalt dauerhaft festlegen. Online erzeugte Datei-ID mit `generateId()` beziehen und speichern, **bevor** `putJson()` beginnt. Wiederholung benutzt exakt diese ID und denselben Inhalt. Datei-/Metadaten- und Inhaltsprüfung des bestehenden Adapters bestätigt den Upload. Bei verlorener Antwort verbleibt das Paket pending; nächster Versuch verifiziert dieselbe Datei. Paket-ID und Ereignis-ID deduplizieren unabhängig voneinander. Fremde oder fehlende Dateien, geänderte bekannte Inhalte oder ungültige Pakete erzeugen einen sichtbaren Fehler; sie löschen keine lokale Historie.

Aktiver Abgleich: sofort beim Öffnen, Vordergrund, online und Rundenabschluss; Änderungen höchstens 10 Sekunden bündeln, ohne Änderungen alle 60 Sekunden suchen. Kein Polling bei versteckter App. Ein einzelner laufender Abgleich plus vorgemerkter erneuter Lauf verhindert parallele Uploads. Retry nur bei Netz/429/408/5xx: 1, 2, 4, 8, 16 Sekunden, danach explizite Wiederholung. Auth/403/fehlende Datei/Datenfehler nicht endlos wiederholen. HTTP 401 invalidiert Tokensitzung; „Mit Google verbinden“ startet bewusst neue Anmeldung. Offline weiterüben bleibt möglich.

Statusverbraucher erhalten lokale Änderungen unmittelbar über `createCommands().subscribe(listener)`. `createProductSync` verwendet dieses Abonnement, berechnet `pendingCount` bei jedem Commit aus dem bestätigten Zustand neu und meldet den Wechsel von `synced` zu `pending` über `onStatus`. Wer den Synccontroller ersetzt oder die Anwendung abbaut, ruft dessen `destroy()` auf; damit wird ausschließlich dieses Abonnement gelöst. Task 11 verbindet den bereits vorhandenen UI-/Scheduler-Lebenszyklus mit diesem Vertrag, ohne eine zweite Status- oder Authentifizierungslogik einzuführen.

## Sicherung, Epochen und Rückkehr alter Geräte

```js
// Portable Backupdatei
{...VERSION, kind: 'backup', exportedAt, descriptor, snapshot, events,
 epochHistory, safetyCopyIndex}
// Snapshot ist eine vollständige Auswahl, keine additiven Zähler.
{id, datasetId, effectiveEventIds, supportEventIds, contentHash}
// Epoch; root epoch ohne Eltern/Snapshot, alle späteren vollständig belegt
{...VERSION, kind: 'epoch', id, datasetId, parents, deviceId, clock,
 occurredAt, snapshotId: null | string, snapshotManifestFileId: null | string}
// EpochHistory: nur Herkunft historischer Ereignisse, kein aktivierbarer Steuerknoten
{id, datasetId, parents, deviceId, clock, occurredAt}
// Snapshot manifest, nachdem alle Teile hochgeladen und rückgelesen sind
{...VERSION, kind: 'snapshot-manifest', snapshotId, datasetId, purpose,
 snapshot, parts: [{fileId, hash, index}],
 backupMetadata: {exportedAt, safetyCopyIndex}, totalHash}
// Snapshot part, UTF-8 JSON <=64KiB; keine einzelnen Ereignisse aufspalten
{...VERSION, kind: 'snapshot-part', snapshotId, datasetId, index, events, epochHistory}
```

Snapshotteile transportieren neben Ereignissen auch die deduplizierten `EpochHistory`-Herkunftseinträge. Jeder Teil bleibt einschließlich Hülle <=64 KiB; eine Reihenfolge über `index` und Teilhashes prüft die Vollständigkeit. `totalHash` umfasst kanonisch `{snapshot,events,epochHistory,backupMetadata}` nach Zusammenfügen aller Teile, Ereignisse/Herkunft dabei nach ID sortiert. `backupMetadata` hat exakt `exportedAt` und `safetyCopyIndex`, für beide Zwecke verpflichtend und ohne lokale Konten-/PIN-/Transportdaten. Ein neues Gerät benötigt dadurch keine fremden Drive-Steuerdateien und kann Datum sowie Fachinhalt einer Sicherheitskopie rekonstruieren. `purpose` des Manifests ist `restore/safety`; der Index einer exportierten Sicherheitskopie enthält nur `{id,createdAt,purpose,hash}`, keine eingebetteten alten Backupdateien. Lokale Kopienzwecke umfassen zusätzlich `join` und in v2 `format-migration`. Vor Task 10 gab es keine veröffentlichten Produktmanifeste; es gibt keinen stillen Altformatfallback ohne Metadaten.

`effectiveEventIds` bestimmt die wirksame Historie des gewählten Sicherungsstands. `supportEventIds` enthält notwendige Fassungen/Runden/Profil- und Lektionsreferenzen, die nur historische Abhängigkeiten sind. Sie aktivieren keine aktuelle Fassung und geben keine Punkte. Alle referenzierten Ereignisse liegen in der Backupdatei bzw. in vollständig geprüften Snapshotteilen. Snapshot-Hash umfasst kanonisch `{datasetId,effectiveEventIds,supportEventIds,events}`; `events` enthält **genau die eindeutige Vereinigung der von beiden ID-Listen referenzierten Ereignisse**, nach ID sortiert. Spätere unabhängige Ereignisse verändern diesen unveränderlichen Hash nicht. Die komplette Backupdatei und die Snapshotteile enthalten zusätzlich späte Ereignisse; `totalHash` schützt diese vollständige Transportmenge. Ableitbare Anzeigezähler dürfen als lesbarer `summary` außerhalb des gehashten Modells angezeigt werden, werden niemals als Wahrheit importiert. Der portable Export enthält alle lokalen fachlichen Ereignisse einschließlich ausstehender und separater alter Epochen, deren Epoche/Bezüge sowie Index vorhandener Sicherheitskopien; keine PIN, Tokens, Bindung, Drive-Kontokennung, `datasetSetup`, `packetIntegrity` oder lokale Runden/Antworttexte. Sicherheitskopien werden nicht rekursiv in andere Sicherungen eingebettet.

`snapshotManifestFileId` ist ein optionaler Transportverweis. Jede Folgeepoche benötigt `snapshotId` und einen vollständigen validierten lokalen Snapshot; ein lokaler Offline-Restore darf `snapshotManifestFileId: null` behalten. Die Epoche wird später nicht verändert. Bei erster Cloudanlage zunächst alle benötigten Snapshotteile/Manifeste hochladen und prüfen, ihre Datei-IDs im lokalen `snapshotManifests`-Index sichern und erst dann die unveränderten Epochen veröffentlichen. Beim Empfang eines Null-Verweises sucht Sync im gebundenen Ordner nach Datensatz-/Snapshot-ID. Erst nach vollständiger Prüfung von Manifest, Teilen und Hashes aktivieren. Ein gesetzter Verweis muss zum Snapshot passen. Fehlende Dateien bleiben wartend; verschiedene Inhalte unter derselben Snapshot-ID sind Datenfehler. Keine erfundenen Drive-IDs und kein späteres Umschreiben der Epoche.
Es gibt zwei getrennte Graphen. `ledger.epochs` ist ausschließlich der aktive Steuergraph des Zieldatensatzes: genau eine Wurzel `descriptor.rootEpochId`, alle übrigen Eltern innerhalb dieses Graphen. `ledger.historicalEpochs` enthält nur Herkunftseinträge importierter Ereignisse, ohne Snapshot-/Drive-Steuerbezüge. Deren historische Eltern müssen innerhalb der Herkunftseinträge oder als identische Herkunftsprojektion vorhandener Steuerepochen vorliegen; mehrere historische Wurzeln sind erlaubt. Ein Ereignis darf seine `epochId` in einem dieser beiden Graphen finden. Gleiche ID mit anderer Herkunftsmetadatenprojektion bleibt eine Kollision. Historische Herkunftseinträge werden niemals zu Köpfen des Steuergraphen und lösen keinen Restore aus. Ein Backup exportiert unter `epochHistory` die Herkunftsprojektionen beider Graphen, nicht fremde ausführbare Epochensteuerung. So kann die ursprüngliche Ereignis-ID/Epoche erhalten bleiben, ohne fremde Wurzeln zu aktivieren.

Die aktive Epoche ist der einzige Kopf ausschließlich von `ledger.epochs`; Wurzeln und Eltern müssen vollständig vorliegen. Mehrere Köpfe ergeben `epochConflict` mit sämtlichen Köpfen. Es wird kein Gewinner anhand Zeitstempel gewählt. Bestehende bereits gespeicherte Antworten bleiben erhalten; neue Runden sind bis zur Erwachsenenklärung gesperrt, ein vorhandener Eingabetext bleibt lokal erhalten und wird nach Klärung ohne Wertung verworfen. Die UI zeigt ausdrücklich keinen vollständigen Abgleich. Auflösung erzeugt einen neuen Epochennachfolger mit allen bekannten Köpfen als Eltern und dem ausdrücklich ausgewählten, vollständig gesicherten Snapshot.

Bei genau einem aktiven Kopf: dessen `snapshot.effectiveEventIds` plus native Ereignisse dieser Epoche plus gültige `events.adopted`-Auswahlen bilden die aktive Ereignismenge. IDs werden vereinigt, nie Summen addiert. Der Wurzelkopf besitzt leeren Basissnapshot. Snapshot-/Epochenimport erfolgt vollständig oder gar nicht; Teilpakete bleiben wartend, alter lokaler Stand bleibt verfügbar.

Restore-Protokoll:

1. Datei vollständig parsen, erlaubte Version prüfen, Referenzen/DAG/Hashes/Ansprüche validieren, alte und neue Profil-/Wort-/Punktzahlen vergleichen. Bei bewusstem Import eines fremden Backups bleibt die Ziel-Datensatz-ID erhalten: Ereignis-/Herkunftshüllen werden auf die Ziel-ID neu verankert, Ereignis-IDs und ursprüngliche `epochId` bleiben, `epochHistory` wird nur `historicalEpochs` zugeordnet. Der gewählte Snapshot erhält eine neue ID und neu berechneten Hash. Die Zielbeschreibung samt Lernzeitzone bleibt erhalten; gespeicherte Antworttage behalten die Bedeutung der exportierten Datensatzzeitzone, die Vorschau nennt abweichende Zeitzonen ausdrücklich und neue Antworten verwenden die Zielzeitzone. Es wird keine fremde Wurzel nach `ledger.epochs` eingefügt. Nur der neue Restore-Nachfolger wird an die aktuellen Zielköpfe angehängt. Bei ID-Kollision mit unterschiedlichem Inhalt Restore ablehnen; keine heuristische Umbenennung.
2. Verbunden: Netz und Zugriff verlangen, aktuellen Stand einschließlich Pending-Paketen vollständig abgleichen. Unaufgelöste Epochenkonflikte zunächst über den Konfliktpfad klären. Lokalen und Cloud-Sicherheitsstand aus dem jetzt bestätigten Modell erzeugen; beide rücklesen und Hash vergleichen. Lokal unverbunden genügt erfolgreiche lokale Sicherheitskopie. Sicherheitskopie trägt Datum/Zweck und ist im Erwachsenenbereich herunterladbar.
3. Vorschau-ID ist Hash aus Ziel-Epochenköpfen, vollständiger aktueller Ereignismenge und gewähltem Import. Erneut abgleichen vor Bestätigung/Veröffentlichung. Hat sich der Stand geändert, Sicherheitskopie und Vorschau erneuern, Bestätigung verwerfen. Unbekannte spätere Offlineänderungen werden durch das Epochenprotokoll getrennt erhalten, nicht als ausgeschlossen behauptet.
4. Bestätigten Ziel-Snapshot in unveränderlichen Teilen hochladen, jeden Inhalt rücklesen, danach Manifest hochladen und prüfen. Erst dann neue Epoche mit Eltern, Snapshot-/Manifestbezug veröffentlichen. Datei-IDs und Fortsetzungszustand vor jedem Upload lokal sichern; Neustart setzt denselben Versuch fort.
5. Neue Epoche lokal erst aktivieren, wenn alle Referenzen/Hashes geprüft sind. Aktivierung und Abbruch alter lokaler Runden in einer Transaktion; kein Bonus. Alter Ledger und Sicherheitskopie bleiben erhalten. Bei fehlgeschlagenem Upload/Prüfen kein Leerstand, keine vorgezogene Aktivierung.
6. Späte Ereignisse fremder/alter Epochen samt nötiger Abhängigkeiten separat speichern, zählen aber nicht aktiv. Erwachsene wählen einzelne Ereignisse oder eine zusammengehörige Gruppe; Vorschau zeigt neue Antworten/Punkte, Inhalte und Konflikte. `events.adopted` referenziert Original-IDs. Für Antworten werden historische Referenzen nur als Support übernommen. Für bewusst ausgewählte Inhaltsfassungen werden genau diese Fassungen wirksam; daraus resultierende Konflikte bleiben sichtbar. Abschlussbonus nur mit kompletter Runde und ausgewählten zugehörigen Antworten übernehmen. Bereits aktive IDs zählen nicht erneut. Nicht gewählte Daten bleiben einsehbar/exportierbar.

## Fehlertypen und UI-Vertrag

### Implementierte Task-10-Schnittstellen

`previewBackup` ergänzt `learningChanges: {added, removed}` mit den wirksamen Regel- und Wiederaktivierungsereignissen, die beim gewählten Restore hinzukommen oder entfallen. Rein unterstützende Referenzen erscheinen darin nicht als aktivierte Regeln. Die Vorschau benennt diese Ereignisse lesbar. Aktuelle Regel-/Generationsgewinner werden seit B2 ausschließlich aus wirksamen Ereignissen gewählt.

- `exportBackup(state, exportedAt, {selectedEpochId, version} = {}): Promise<Backup>` wählt bei einem eindeutigen Kopf dessen Stand. Bei mehreren Köpfen ist die explizite Kopf-ID erforderlich; sonst `conflict`. Die Ausgabeversion ist standardmäßig v2; ausschließlich die v1-Formatmigration fordert ausdrücklich v1 an. Export und Parser prüfen vollständige Referenzen, Versionen, Größen, Auswahl und Hash. `parseBackup(text)` verändert keinen Zustand.
- `previewBackup({current,backup})` liefert `profiles` und `wordCount` als `{before,after}`, `answerCount`, `contentChanges: [{entityType,entityId,before,after}]`, `progressChanges: [{profileId,points:{before,after},words:{before,after}}]`, `conflicts`, `affectsConnectedDevices`, `foreignDataset`, `timeZoneChange: null | {from,to}` und `limits`. Wort-Lernstände stehen als `[id,value]`-Eintragslisten in der Vorschau, damit Spezial-IDs gewöhnliche Daten bleiben. Die UI zeigt Inhalte als Text und bestätigt Fremdimport/Zeitzonenabweichung ausdrücklich.
- `createRestoreService({commands,store,sync,drive,now,id})` bietet die im Taskbrief benannten asynchronen Methoden. `prepare(backup)` und `resolveEpochConflict({selectedEpochId,expectedHeads})` liefern ausschließlich `{previewId,summary}`. `confirm(previewId)` aktiviert erst nach erneuter Aktualitätsprüfung und bestätigten Uploads. Bei `stale` eine neue Vorschau öffnen und erneut ausdrücklich bestätigen. Ein bestätigter Auftrag in Phase `uploading/published` wird nach Neustart über dieselbe persistierte `previewId` fortgesetzt; seine Datei-IDs und Inhalte bleiben gleich. Die UI muss diesen offenen Auftrag anbieten. Eine neue Wiederherstellung bleibt bis dahin gesperrt.
- Der Vorschauhash verwendet den vollständigen Fachstand, Zielbindung, lokale Runden und gewählten Import; nur eigene Transportbuchführung und Sicherheitskopien-/Auftragslisten sind aus der Vorschauidentität ausgenommen. Alle Speicher-CAS verwenden weiterhin `productStateHash`. Sicherheitskopie und Vorschau dürfen nicht durch einen zwischenzeitlichen lokalen Lernschritt auseinanderlaufen.
- `previewAdoption(eventIds)` liefert zusätzlich `eventIds` und `supportEventIds`. `adopt({eventIds,previewId})` verlangt exakt dieselbe Auswahl und aktuellen Stand. Die Vorschau bleibt sitzungsgebunden; nach Neustart erneut öffnen. Historische Abhängigkeiten bleiben Support, bewusst ausgewählte Fassungen dürfen sichtbare Konflikte erzeugen. Ein Abschluss verlangt sämtliche zugehörigen bereits wirksamen oder mitausgewählten Antworten. IDs werden vereinigt, Punkte nie addiert.
- `listSafetyCopies()` liefert `{id,createdAt,purpose,hash,verified,driveManifestFileId}[]`; `downloadSafetyCopy(id)` liefert ein erneut validiertes `Backup`, keinen automatisch gestarteten Browserdownload. Task 11 übernimmt Dateidialog/Download. Neue Geräte übernehmen vollständige geprüfte `safety`-Manifeste in ihren lokalen Kopienindex: Kopie-ID ist dort `snapshotId`, Datum `backupMetadata.exportedAt`. Auf dem erzeugenden Gerät bleibt die lokale Kopie-ID erhalten. Die gebundene unveränderliche Datensatzbeschreibung vervollständigt das rekonstruierte Fachbackup; eine identische ursprüngliche Dateibytefolge wird nicht behauptet.
- `joinDataset(selection,'preview')` erstellt bei erforderlichem Ersatz eines ungebundenen lokalen Bestands eine lokal gespeicherte und rückgelesene Kopie; der entfernte Bestand wird zunächst ohne lokale Befehls-/Uploadnebenwirkungen geprüft. Rückgabe ergänzt `previewId` und `safetyCopyId`. `joinDataset({...selection,previewId,safetyCopyId},'confirm')` verlangt beide IDs und unveränderten lokalen sowie entfernten Stand. Keine stillschweigende Bestätigung; nach Neustart ist eine neue Vorschau nötig. Der portable lokale Bestand bleibt als Kopie erhalten, während alte kontogebundene Pakete/Aufträge/Manifestindizes nicht in den neu gewählten Datensatz übernommen werden.
- Lokale Folgeepochen bleiben auch bei späterer Drive-Anlage unverändert mit Null-Manifestverweis. Die aktivierten Restoreaufträge reservieren dafür ihre Upload-IDs vor dem Upload, alle Teile/Manifeste werden vor Epochen geprüft. `snapshotManifests` speichert die Zuordnung getrennt. Sync importiert vollständige Epochen mit Snapshot, Ereignissen und Herkunft atomar vor abhängigen Paketen, unabhängig von der Dateireihenfolge. `commands.commitExternal` beendet nur lokale Runden einer anderen Epoche ohne Bonus, sobald der neue aktive Kopf eindeutig ist. Bei Epochenkonflikt bleibt der lokale Eingabezustand bis zur Auflösung erhalten.

Produktmodule verwenden `ProductError` mit `code` aus `invalid/version/reference/collision/storage/locked/conflict/stale/empty/not-ready/binding`. Nutzbare deutsche Nachricht enthält keine geheimen Werte. Drive behält seine vorhandenen Codes. Erwartete Zustände werden als Rückgabe modelliert (z. B. `next.kind='task'|'exhausted'|'complete'`), nicht als Exceptions. Nur tatsächlich bestätigte Uploads und vollständige Downloads erlauben „Abgeglichen“. Offene Quarantäne/Epochenkonflikte und Pending-Änderungen bleiben kenntlich.

Automatisierte Tests des Plans verwenden ausschließlich synthetische Daten. Reale Google-/Zwei-Geräte-/Safari-/Home-Bildschirm-Abnahme folgt nach vollständiger Implementierung und wird getrennt dokumentiert; dieses Datenmodell erklärt sie nicht für bestanden.
