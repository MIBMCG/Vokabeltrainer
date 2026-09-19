# Bilder und Bedienung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die bestehende App erhält echte Inselillustrationen und verständliche, kompakte Kinder-/Elternabläufe.

**Architecture:** Die vorhandenen Renderer und Commands bleiben die Produktbasis. Ein begrenztes Bildmanifest und reine Auswahl-/Konfigurationshelfer werden ergänzt; Renderer werden nur entlang der betroffenen Verantwortlichkeiten aufgeteilt. Bestehende v1-Lerndaten bleiben in Etappe A unverändert.

**Tech Stack:** HTML, CSS, ES-Module, Node >=22.8.0, IndexedDB, vorhandenes Playwright als Entwicklungswerkzeug, integrierte Bildgenerierung, WebP/PNG; keine neue Laufzeitbibliothek.

**Spec:** [Freigegebener Entwurf](../../design/2026-09-19-ueberarbeitung.md); [Gesamtplan](2026-09-19-ueberarbeitung.md).

## Global Constraints

- Zielgruppe 10–13 Jahre, iPhone/iPad priorisieren.
- Vier Hauttöne, sechs Kleidungsfarben, sechs Ausrüstungsteile, drei Inseln und 15 Etappen erhalten.
- 10 Punkte je richtiger Antwort, 20 je gültigem Rundenabschluss; kein Punktabzug.
- Gemeinsames Google-Konto, getrennte Profile, kein zusätzliches Cloudabo.
- Texte, Steuerelemente und Fortschritt nicht in Illustrationen einbrennen.
- Bilder lokal mitliefern; niedrige Auflösung muss nach Erstladen offline verfügbar sein.
- Die laufende App und persönliche Browserdaten nicht als Testfixture verwenden.
- Die allgemeinen Ausführungsregeln im Gesamtplan gelten vollständig.

## Review Focus

1. Offline erstmalig ein anderes Avatarzubehör wählen: auch nie online angezeigte Grundbilder bleiben sichtbar (A1).
2. Kleine Ansicht, große Schrift und Tastatur: Eingabe/Prüfen/Weiter bleiben bedienbar und werden nicht durch Landschaft/Nav verdeckt (A2).
3. Zentrale Client-ID weicht von bestehender Browser-ID ab: keine stille Umschaltung von Anmeldung oder Bestand (A3).
4. Hintergrundabgleich während Tabelleneingabe: Entwurf und ursprüngliche Revisionsbasis bleiben erhalten (A4).
5. Wortanzahl ist null wegen Fälligkeit/Zuordnung/Konflikt: Moduskarte erklärt dies, verspricht keine startbare Runde (A2).

## Dateien und Zuständigkeit

Neu: `src/trainer/ui/art.js` (Bild-DOM und Fallback), `src/trainer/ui/art-manifest.js` (endliche Variantenliste), `trainer/assets/art/` (ausgelieferte Bilder), `docs/design/art-sources/` (Originale/Metadaten), `scripts/build-art.mjs` (deterministische Auflösungsableitung), `src/trainer/config.js` (öffentliche App-Konfiguration), `src/trainer/auth-config.js` (reine Konfigurationsauswahl), `src/trainer/ui/vocabulary.js` (Wortverwaltung), `src/trainer/ui/settings.js` (Einstellungen). Neue Tests: `tests/trainer/auth-config.test.js`, `tests/browser/overhaul.browser.mjs`.

Bestehende Dateien: `src/trainer/ui/practice.js`, `src/trainer/ui/rewards.js`, `src/trainer/ui/adult.js`, `src/trainer/ui/shell.js`, `src/trainer/ui/sync.js`, `src/trainer/main.js`, `src/trainer/commands.js`, `src/trainer/learning/rounds.js`, `trainer/styles.css`, `trainer/sw.js`, `scripts/serve.mjs`, `tests/serve.test.js`, Browserharness und bestehende passende Tests. Unveränderte Domänenmodule nicht vorsorglich aufteilen. Kürzere Modulnamen in den Aufgaben beziehen sich auf diese Liste.

### A1: Zusammenhängende Rasterwelt einschließlich Offline-Bildern

**Interfaces:** `ART` aus `art-manifest.js` ist eine Map von semantischem Bildschlüssel auf `{width,height,variants:[{width,url}],fallbackUrl}`. `picture(key,{alt='',className='',sizes='100vw',loading='lazy'}={}) -> HTMLElement` und `avatarPicture(parts,{className='',sizes='256px',animations=false}={}) -> HTMLElement` aus `art.js`. `parts` verwendet unverändert `skin`, `clothing`, `head`, `back`, `hand` aus `avatarParts()`. Jeder Bildwrapper trägt `data-art-key` mit dem Bildschlüssel; darin liegt das zugehörige img, auch bei Avatar-Ebenen.

- [x] **1. Visuellen Ausgangszustand festhalten.** Vorhandenes Konzept und echte Screenshots öffnen; Hauptlücken im späteren Bildbericht benennen. Kein neuer Screenshot wird als Konzeptfreigabe oder Apple-Abnahme bezeichnet.
- [x] **2. Bildsatz erzeugen.** Mit eingebautem Bildwerkzeug erst Strand, durchgehende Reise und einen bekleideten Entdecker mit neutralem Basisoutfit erstellen. Referenz ist `docs/design/2026-09-17-insel-konzept.png`. Gemeinsamer Stil: detailreiche freundliche gemalte Inselwelt, Türkiswasser, Sand, üppige Pflanzen, warme Beleuchtung, keine Markenfiguren/Schrift/UI. Reiseroute Strand unten, Wald mittig, Berge oben; Raum für 15 echte Markierungen. Danach vier vollständig bekleidete Basisvarianten mit identischer Haltung sowie sechs Kleidungsüberlagerungen und sechs transparente Ausrüstungsebenen aus derselben Referenz ableiten. Keine neue Figur pro Kombination. Unpassende Hände, Hintergründe oder Überlagerungskanten gezielt korrigieren und das Ergebnis ansehen.
- [x] **3. Auflösungen reproduzierbar ableiten.** `build-art.mjs` liest nur explizite Quelldateien, erzeugt WebP-Varianten (Landschaft 480/960/1440, Avatarbreite 256/512/768, nur ohne Hochskalierung) und ein Manifest. Dafür vorhandenes Playwright mit leerer eigener Seite und Canvas verwenden, keine neue Produktionsabhängigkeit. Transparenz und Verhältnis bleiben erhalten. Kern der Ableitung:

```js
const bytes = await page.evaluate(async ({source, width}) => {
  const img = new Image(); img.src = source; await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(width, img.naturalWidth);
  canvas.height = Math.round(img.naturalHeight * canvas.width / img.naturalWidth);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.86));
  if (!blob || blob.type !== 'image/webp') throw new Error('WebP encoding unavailable');
  return Array.from(new Uint8Array(await blob.arrayBuffer()));
}, {source: `data:image/png;base64,${sourceBytes.toString('base64')}`, width});
```

`sourceBytes` wird zuvor durch `readFile` der erlaubten Quelldatei gelesen, `page` über das vorhandene Playwright gestartet. Ergebnis mit `writeFile(...,Uint8Array.from(bytes))` speichern. Quellen, Prompts, Abmessungen und Datei-SHA256 im Bildbericht `docs/reports/2026-09-19-illustrationen.md` festhalten. Höchste Quellauflösung nicht bei jedem App-Start laden. Keine absolut lokalen Toolpfade in Produktionsdateien.

- [x] **4. Offline-Fehler zuerst belegen.** Neue Browserdatei mit existierendem `createTrainerHarness()` verwenden. Reale Oberfläche einmal laden, Cacheinstallation abwarten, Testserver schließen, anderen Avatarstil wählen. Vor Änderung fehlen die Rasterbilder; nachher muss jedes Bild `complete && naturalWidth > 0` erfüllen. Alle Grundvarianten müssen vorcachebar sein, höhere Varianten nicht. Ein Browserfall blockiert ausdrücklich die große angefragte Bild-URL und prüft den kleinen Fallback. Kein Test nur auf Dateinamen.
- [x] **5. Bilder integrieren.** Bestehende SVG-Insel-/Avataraufrufe in `ui/rewards.js` ersetzen, Porträt und Strand in `practice.js` integrieren. Bildfallback entfernt `srcset` vor Setzen der Grunddatei und verhindert Endlosschleifen:

```js
img.addEventListener('error', () => {
  if (img.dataset.fallback === 'true') return;
  img.dataset.fallback = 'true';
  img.removeAttribute('srcset');
  img.src = asset.fallbackUrl;
});
```

Layerreihenfolge: Hintergrund/Schatten, Rückenzubehör, vollständig bekleidete Basis, gewählte Kleidung, Kopfbedeckung, Handzubehör. Koordinaten aus gemeinsamem normalisierten Canvas, keine pro Bildschirmgröße abweichenden Positionslisten. Markierungen im Reise-DOM relativ zur Karte platzieren; mobil vergrößerbar/scrollbar, gesperrte Etappen mit Text. Abzeichen dürfen weiterhin Vektorsymbole sein.
- [x] **6. Server/Worker ergänzen und prüfen.** Nur endliche Manifestpfade ausliefern, richtige WebP/PNG-MIME-Typen, Traversal-/404-Schutz erhalten. Alle kleinen Ebenen vorladen, größere nur auf Anfrage im eigenen Scope cachen. Keine fremden URLs oder Caches. Fehlgeschlagene große Downloads dürfen weder Installation noch Offline-Grundansicht blockieren. Bildgrößen/Initialtransfer berichten und bei über 5 MiB Grundbildpaket die Renditions weiter komprimieren; visuelle Qualität erneut ansehen. Produktionscache und synthetischen Worker erhöhen. `node --test tests/serve.test.js tests/trainer/sw.test.js tests/trainer/reward-view.test.js`, anschließend gezielte neue Browserfälle ausführen.
- [x] **7. Sichtprüfung und Commit.** Tatsächliche Reise/Avatar/Startansicht bei 390 und 1024 Pixeln erfassen, alle Ausrüstungsslots und mindestens sechs gemischte Kombinationen ansehen. Ein vollständig gesperrtes/teilweise freies Profil prüfen. Nach sauberem Diff gezielt committen: `feat: add illustrated island world and responsive avatar art`.

### A2: Verständlicher Rundenstart und bildgestützte Übungsansicht

**Interfaces:** Neu in `src/trainer/learning/rounds.js`: `previewModes({projection,profileId,day,schedule=null}) -> Array<{mode,totalCount,availableCount,latestLessonName,reason}>`, Reihenfolge all/latest/new, `reason` in `ready|no-profile|no-words|no-new|not-due|conflict`. Nutzt die vorhandenen Kandidaten-/Fälligkeitshelfer, keine zweite Lernlogik. Den vorhandenen Helfer `activeWords(projection,profileId) -> Entity[]` zusätzlich exportieren; C1 nutzt dieselbe Auswahl. Neu in Commands: `practiceChoices({profileId})`, benutzt die bestehende injizierte Uhr/Datensatzzeitzone und ruft `previewModes` auf. A verwendet schedule=null und den bisherigen Scheduler; B2 liefert die Schedulingprojektion `{words:Map,epochConflict}` mit den dort definierten Wortzuständen. Rückgabe und UI-Verbraucher ändern sich dadurch nicht. totalCount zählt zugeordnete aktive Wörter des Modus, availableCount nur aktuell auswählbare; latestLessonName ist außerhalb latest null.

- [x] **1. Fachliches RED schreiben.** In `tests/trainer/rounds.test.js` mit `createFixture` die einfache Auswahl belegen und archivierte, nicht zugeordnete, neue, letzte und noch nicht fällige Fälle hinzufügen. Minimalfall:

```js
const f = createFixture();
const choices = previewModes({projection: project(f.base), profileId: 'p1', day: '2026-09-19'});
assert.equal(choices.find(x => x.mode === 'all').availableCount, 3);
assert.equal(choices.find(x => x.mode === 'new').availableCount, 3);
assert.equal(choices.find(x => x.mode === 'latest').latestLessonName, 'Unit 1');
```

- [x] **2. RED laufen lassen:** `node --test tests/trainer/rounds.test.js tests/trainer/practice.test.js`; tatsächliches Fehlen der API, nicht kaputte Fixtures, dokumentieren.
- [x] **3. Auswahl und Oberfläche umsetzen.** `modeCard` wird ein beschriftetes Radioelement statt Startbutton. Alle drei erklärenden Texte aus dem Entwurf verwenden. `ui.selectedMode` und `ui.size` behalten Auswahl bei erneutem Rendern; nur ein Submit startet. Aktuelle Wörterzahl ist keine versprochene Antwortzahl. Nicht verfügbare Auswahl mit Grund und sinnvollem Alternativmodus; bestehende Fortsetzen-Ansicht bleibt. Kern:

```js
const choice = commands.practiceChoices({profileId}).find(x => x.mode === ui.selectedMode);
startButton.disabled = ui.busy || !choice || choice.availableCount === 0;
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!startButton.disabled) void start(ui.selectedMode);
});
```

Bildwelt, helle Wortkarte und Türkisaktionen dem Konzept angleichen. Responsives CSS über Viewporthöhe, `min-height:0`, Safe-Area und vorhandenes `100dvh`; Desktop nicht nur eine schmale Handyspalte. Persönliche Adresse/Profilnamen immer als Text einsetzen. Eingabe/Feedbackstatus, Fokus nach Antwort/Weiter und Schutz beim Hintergrundabgleich behalten.
- [x] **4. Browser-GREEN belegen.** Neue Fälle: Moduswahl allein erzeugt kein Rundenereignis; ein Start nach Wahl 20 erzeugt genau eine Runde; erneutes Tippen/Enter wertet nicht doppelt; konkrete neueste Lektion sichtbar; leere/neue/konfliktbehaftete Auswahl erklärbar. Ansichten 320×568, 390×844, 844×390 und 1024×768 sowie 200 % Schrift prüfen; geringe Höhe als synthetische Tastatursituation kennzeichnen, nicht als echten iOS-Tastaturnachweis.
- [x] **5. Commit nach passenden Node-/Browserprüfungen:** `feat: clarify practice modes and align learning screens with concept`. Worker/Serverliste wie in den globalen Regeln prüfen.

### A3: Vorbereiteter Google-Zugang und geführte Einrichtung

**Interfaces:** `APP_CONFIG` aus `src/trainer/config.js` mit `googleClientId:string`. Reine `selectGoogleConfig({configuredId,storedId,bound}) -> {clientId,source,requiresDecision}` aus `auth-config.js`. `auth.clientId()` bleibt bestehen; `auth.connect()` darf ohne Argument die ausgewählte ID verwenden. Bestehende `onConnected`-/PIN-Prüfungen und Scheduler-Anbindung erhalten.

- [ ] **1. Konfigurationsentscheidungen als RED testen.** Vollständig neue `tests/trainer/auth-config.test.js` mit `node:test`/`assert/strict` und obigem Import anlegen. Testkern:

```js
assert.deepEqual(selectGoogleConfig({configuredId:'app.apps.googleusercontent.com',storedId:'',bound:false}),
  {clientId:'app.apps.googleusercontent.com',source:'app',requiresDecision:false});
assert.deepEqual(selectGoogleConfig({configuredId:'new.apps.googleusercontent.com',storedId:'old.apps.googleusercontent.com',bound:true}),
  {clientId:'old.apps.googleusercontent.com',source:'browser',requiresDecision:true});
```

Zusätzlich beide leer, identisch, ungültige/abgeschnittene ID, ungebundene alte Browser-ID prüfen. Eine abweichende gespeicherte ID bleibt auch ungebunden erhalten, bis bewusst gewechselt wird; eine vorhandene Bindung verbietet den schnellen ID-Wechsel. Ungültige Werte sind kein nutzbarer Fallback.
- [ ] **2. Öffentliche Konfiguration verifizieren.** Bereits im Gespräch/autorisiertem lokalen Einrichtungsstand angegebene öffentliche Client-ID auf vollständige Schreibweise und vorhandene echte Verbindungsbelege abgleichen. Keine Tokens/PINs auslesen, keine Google-Kontenänderung durchführen. Den belegten öffentlichen Wert in `APP_CONFIG` eintragen. Kann er nicht eindeutig festgestellt werden, exakt diesen fehlenden Wert beim Nutzer erfragen; nicht durch einen Dummy ersetzte Cloudfunktion als fertig melden.
- [ ] **3. Hauptpfad vereinfachen.** Eltern sehen einen Verbindungsbutton und nach bewusster Anmeldung die zwei klaren Bestandsaktionen. Die wiedererkennbare bestehende Datensatzliste und die sichere Beitrittsvorschau nutzen. Konfigurationsdetails nur aufklappbar unter Einstellungen; fehlende Betreiberkonfiguration in normaler Ansicht verständlich melden, lokales Üben weiter anbieten. Keine automatische Erzeugung/Bindung nach Google-Anmeldung. Bestehende lokale Einrichtungsdaten, PIN und Inhalte werden nicht überschrieben. Kern der Konfigurationsauswahl:

```js
const stored = validId(storedId) ? storedId.trim() : '';
const configured = validId(configuredId) ? configuredId.trim() : '';
return {clientId: stored || configured, source: stored ? 'browser' : configured ? 'app' : 'missing',
  requiresDecision: Boolean(stored && configured && stored !== configured)};
```

`validId` als privater Helper prüft nichtleeren vollständigen OAuth-Web-Client-ID-Text mit `.apps.googleusercontent.com`, ohne zu behaupten, Syntax belege eine aktive Google-Registrierung. `bound` wird für das angebotene Wechselverhalten der UI benötigt; keine stillschweigende Änderung der gespeicherten ID.
- [ ] **4. Browserfälle:** frische Seite ohne ID-Eingabe; Google-Abbruch; 401→bewusstes Verbinden→automatischer Upload; Hintergrund/PIN-Sperre während Anmeldung; Alt-ID ≠ App-ID mit bestehender Bindung; vorhandenen statt neuen Bestand auswählen. Abgleichen erfolgt gegen synthetisches GIS/Drive. Bestehende persönliche Konsole/Anmeldung unangetastet lassen.
- [ ] **5. Dokumentation/Commit:** Betreiber- und Familienanleitung in `docs/GOOGLE-DRIVE-EINRICHTUNG.md`/`docs/BENUTZUNG.md` trennen; `npm test`, betroffene Browserfälle, Workerupdate prüfen. Commit `feat: preconfigure Google access and simplify family setup`.

### A4: Kompakte Vokabelverwaltung mit sicherem Bearbeiten

**Interfaces:** `renderVocabulary({root,state,commands,profileId,onRefresh})` aus `ui/vocabulary.js`; `renderSettings({root,state,commands,pinGate,sync,restore,auth,onRefresh,onConnected})` aus `ui/settings.js`. `renderAdult` behält seine öffentliche Signatur und die vier Bereiche `vocabulary|progress|rules|settings`. Bis B3 zeigt rules nur die bisherigen Standards mit Erklärung, keine scheinbar funktionierenden Regler. Bestehende `parseTable`, `validateRows`, `applyRows` und `commands.revise` wiederverwenden.

- [ ] **1. Reale Bedienungsfehler/Komplexität festhalten.** Neuer Browserfall führt Kinder-/Lektionsauswahl, Suchen, Wort bearbeiten und Archivieren aus. Er erwartet erst eine kompakte Liste und nach bewusstem Öffnen das Formular; keine gleichzeitige Anzeige aller Anlage-/Bearbeitungsformulare. Zusätzlich Entwurf bleibt bei unverändertem und bei geändertem Hintergrundabgleich erhalten.
- [ ] **2. Renderer fokussiert aufteilen.** Bestehende Formularkörper nach `vocabulary.js`/`settings.js` verlagern, keine Revision-/PIN-/Restorelogik duplizieren. Kopf mit Kind und Lektion, Suche, aktive/archivierte Wörter als Filter. „Wort hinzufügen“ öffnet Einzelformular; „Mehrere Wörter einfügen“ öffnet Tabelle mit bearbeitbaren Vorschauzeilen. Neue Lektion und Kinderzuordnung direkt in beiden Abläufen. Fehlerhafte/doppelte Zeilen bleiben korrigierbar. Revisionsbasis bleibt die beim Öffnen gelesene, nicht nachträglich die neueste:

```js
const expectedHeads = [...entity.heads];
async function save(value) {
  await commands.revise({entityType:'word',entityId:entity.id,expectedHeads,value});
  onRefresh();
}
```

`entity.heads` enthält gemäß `src/trainer/model/revisions.js` die Revisions-IDs. Der existierende `editWordForm` verwendet dieselbe Basis. Ein neuer `learningId` wird weiterhin ausschließlich von Commands anhand semantischer Inhaltsänderung entschieden.
- [ ] **3. Draft-/Sperrgrenzen erhalten.** Gemeinsamer Erwachsenen-UI-State hält aktiven Bereich, Filter, geöffnetes Formular und ursprüngliche Revisionsbasis. Hintergrundänderung zeigt bewusstes Neuladen/Verwerfen; Navigation mit ungespeicherten Eingaben bietet Speichern/Verwerfen/Weiterbearbeiten. PIN-Sperre entfernt die geschützte Ansicht; keine neue PIN-Ausnahme. Wechsel des Kindes darf keinen Entwurf unbemerkt einem anderen Profil zuordnen.
- [ ] **4. Prüfungen ausführen:** `node --test tests/trainer/adult.test.js tests/trainer/commands.test.js` und neue Browserfälle für Suche, neue Lektion samt Zuordnung, mehrere Antworten, Tabellenkorrektur/Dubletten, Archivieren/Reaktivieren sowie Hintergrundcommit/überholte Revisionsbasis. Bestehende vier Integrationsregressionen aus dem finalen v1-Fix erhalten.
- [ ] **5. Commit/Etappennachweis:** tatsächliche Erwachsenenansichten auf Handybreite und Desktop aufnehmen, `feat: simplify vocabulary and parent navigation`. A1–A4 gegen U01–U04/U06 prüfen und offene rein visuelle Befunde vor Etappe B gezielt schließen. Keine pauschale neue Nutzerfreigabe pro Arbeitspaket.
