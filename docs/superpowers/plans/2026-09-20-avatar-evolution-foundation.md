# Avatar-Entwicklungsformen: Grundlagen und erste Produktionsreihe

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Den bestätigten Stufenkatalog unabhängig prüfbar implementieren und die erste Drachenreihe als echte Einzelbilder vorbereiten.

**Architecture:** Ein neues reines Katalogmodul ergänzt den historischen Figurenkatalog ohne Produktaktivierung. Vollständige Illustrationen besitzen einen eigenen Quellen- und Prüfvertrag. Produktmigration und sicherer Kaufweg werden getrennt umgesetzt, sobald deren technische Voraussetzung belegt ist.

**Tech Stack:** Native JavaScript-Module, Node.js ab 22.8, eingebautes `node:test`, PNG-Quellen, vorhandene lokale Bildwerkzeuge zur technischen Prüfung.

**Spec:** [Technischer Entwurf](../specs/2026-09-20-avatar-evolution-foundation.md), auf Basis der bestätigten [EV01–EV05](../../design/2026-09-20-avatar-entwicklungsstufen.md).

## Global Constraints

- Vier Stufen einschließlich Grundform; Stufen werden der Reihe nach erworben.
- Einzelpreise für 1→2, 2→3 und 3→4: 200, 400 und 800 Punkte.
- Menschliche Hauttöne: ganzzahlige Werte 0, 1, 2 und 3; kostenlos und ohne eigene Kaufkennung.
- Klassisch ist eine zusätzliche Auswahl, keine fünfte Stufe.
- Native JavaScript-Module, Node.js ab 22.8, keine zusätzliche Laufzeitabhängigkeit.
- Keine Google-Tokens, privaten Kennungen oder echten Lernprofile in Artefakten und Prüfberichten.
- Keine Produktaktivierung, keine Veränderung alter Ereignisse und keine Behauptung einer nachgewiesenen Google-Kaufsicherheit.

**Ausführungsstand:** Task 1 und Task 2 sind implementiert beziehungsweise produziert und unabhängig geprüft. [Prüfbericht](../../reports/2026-09-20-avatar-evolution-foundation.md). Die endgültigen Quellen für Stufe 1/2 sind v3, für Stufe 3 v1 und für Stufe 4 v2; notwendige Bildkorrekturen sind im Bericht begründet. Der reproduzierbare Bildprüfer liegt unter `scripts/avatar-evolution/check-dragon-sources.py`. Die folgende Checkliste dokumentiert den ausgeführten Ablauf; Produktintegration und weitere Motive gehören nicht zu diesem Paket.

## Task 1: Reiner Katalog und nächste Entwicklung

**Files:**
- Create: `src/trainer/avatar/evolution.js`
- Test: `tests/trainer/avatar-evolution.test.js`
- Read: `src/trainer/avatar/catalog.js`

**Interfaces:**
- Consumes: `FIGURES`, `figureById(id)` aus `catalog.js`.
- Produces: `EVOLUTION_VERSION`, `EVOLUTION_FORMS`, `evolutionFormId(figureId, stage)`, `evolutionAssetKey(figureId, stage, skin = 0)`, `evolutionOffer({figureId, highestOwnedStage, availablePoints})` mit den exakten Rückgaben des Entwurfs.

- [x] RED: Tests zuerst schreiben. Mindestfälle:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {FIGURES} from '../../src/trainer/avatar/catalog.js';
import {EVOLUTION_FORMS, evolutionFormId, evolutionAssetKey, evolutionOffer}
  from '../../src/trainer/avatar/evolution.js';

test('next form uses the additional price and cannot jump a stage', () => {
  assert.deepEqual(evolutionOffer({figureId:'dragon', highestOwnedStage:2, availablePoints:399}),
    {status:'saving', nextStage:3, price:400, missingPoints:1, progress:399/400});
  assert.equal(evolutionOffer({figureId:'dragon', highestOwnedStage:1, availablePoints:1400}).nextStage, 2);
});
test('free skin variants share one form entitlement', () => {
  const id = evolutionFormId('explorer-girl', 2);
  const form = EVOLUTION_FORMS.find(form => form.id === id);
  assert.equal(form.price, 200);
  assert.deepEqual(form.assetKeys, [0,1,2,3].map(skin => evolutionAssetKey('explorer-girl', 2, skin)));
  assert.equal(new Set(EVOLUTION_FORMS.map(form => form.id)).size, 52);
  assert.equal(new Set(EVOLUTION_FORMS.flatMap(form => form.assetKeys)).size, 76);
  assert.equal(FIGURES.length, 13);
});
test('locked base and complete form grant no purchase', () => {
  assert.deepEqual(evolutionOffer({figureId:'dragon',highestOwnedStage:0,availablePoints:9000}),
    {status:'base-locked',nextStage:null,price:null,missingPoints:null,progress:0});
  assert.deepEqual(evolutionOffer({figureId:'dragon',highestOwnedStage:4,availablePoints:0}),
    {status:'complete',nextStage:null,price:null,missingPoints:0,progress:1});
});
```

Weitere Fälle: 0/199/200/201 Guthaben bei Stufe 1, 399/400 bei Stufe 2, 799/800 bei Stufe 3; hohe sichere Ganzzahl auf Fortschritt 1 begrenzen; negative, gebrochene, unsichere, `NaN`/unendliche Zahlen und unbekannte Figuren/Stufen ablehnen. Alle 13 Figuren mit Preisen 0/200/400/800, eindeutige Schlüssel und tiefe Unveränderlichkeit prüfen. Eingabeobjekt darf nicht verändert werden; nichtmenschliche Hautwerte außer 0 ablehnen. Grundfreischaltungen und historische klassische Tests bleiben unverändert.

- [x] RED ausführen: `node --test --experimental-test-isolation=none tests/trainer/avatar-evolution.test.js`; fehlendes Modul bzw. noch fehlende Schnittstelle als tatsächlichen Fehler belegen.
- [x] GREEN: kleines reines Modul erstellen. Struktur:

```js
import {FIGURES, figureById} from './catalog.js';
export const EVOLUTION_VERSION = 1;
const PRICES = Object.freeze([0, 200, 400, 800]);

function knownFigure(id) {
  const figure = figureById(id);
  if (!figure) throw new TypeError('Unknown evolution figure');
  return figure;
}
function integer(value, min, max, label) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new TypeError(`Invalid ${label}`);
  }
}
export function evolutionFormId(figureId, stage) {
  knownFigure(figureId);
  integer(stage, 1, 4, 'stage');
  return `evolution:${figureId}:${stage}`;
}
export function evolutionAssetKey(figureId, stage, skin = 0) {
  const figure = knownFigure(figureId);
  integer(stage, 1, 4, 'stage');
  integer(skin, 0, figure.group === 'human' ? 3 : 0, 'skin');
  const base = `${figureId}-stage-${stage}`;
  return figure.group === 'human' ? `${base}-skin-${skin}` : base;
}
export const EVOLUTION_FORMS = Object.freeze(FIGURES.flatMap(figure =>
  [1, 2, 3, 4].map(stage => Object.freeze({
    id: evolutionFormId(figure.id, stage), figureId: figure.id,
    stage, price: PRICES[stage - 1],
    assetKeys: Object.freeze((figure.group === 'human' ? [0, 1, 2, 3] : [0])
      .map(skin => evolutionAssetKey(figure.id, stage, skin))),
  }))));

// Presentation only: confirmed ownership and network authorization live elsewhere.
export function evolutionOffer({figureId, highestOwnedStage, availablePoints} = {}) {
  knownFigure(figureId);
  integer(highestOwnedStage, 0, 4, 'owned stage');
  integer(availablePoints, 0, Number.MAX_SAFE_INTEGER, 'points');
  if (highestOwnedStage === 0) return {
    status: 'base-locked', nextStage: null, price: null, missingPoints: null, progress: 0,
  };
  if (highestOwnedStage === 4) return {
    status: 'complete', nextStage: null, price: null, missingPoints: 0, progress: 1,
  };
  const price = PRICES[highestOwnedStage];
  const missingPoints = Math.max(0, price - availablePoints);
  return {
    status: missingPoints === 0 ? 'available' : 'saving',
    nextStage: highestOwnedStage + 1, price, missingPoints,
    progress: Math.min(1, availablePoints / price),
  };
}
```

- [x] Die neue Datei und die bestehenden `avatar-catalog.test.js`-Fälle prüfen; danach `npm test`. Keine Produktdateien importieren das neue Modul.
- [x] Diff prüfen, Taskbericht mit RED/GREEN-Belegen schreiben; nur Taskdateien committen. Unabhängige Prüfung von Spezifikation und Codequalität vor Abschluss.

## Task 2: Erste vier Produktionsquellen des Drachen

**Files:**
- Create: `docs/design/avatar-evolution-sources/dragon-stage-{1,2,3,4}-v1.png` und zugehörige `.json`-Nachweise.
- Create: `docs/reports/2026-09-20-avatar-evolution-foundation.md` als tatsächlicher Nachweis beider Tasks.
- Read: `docs/design/avatar-evolution/dragon-stages-concept-v2.png`.

**Interfaces:**
- Consumes: bestätigter Drachenbogen und Bildkennungen `dragon-stage-1` bis `dragon-stage-4` aus Task 1.
- Produces: vier geprüfte RGBA-Quellen mit nachvollziehbarer Herkunft. Noch kein Manifest für fehlende andere Figuren und keine Produktintegration.

- [x] Bestätigten Bogen ansehen. Pro Stufe ein eigenständiges fertiges Motiv mit dem Bildwerkzeug erzeugen, transparente Hintergründe ausdrücklich verlangen. Keine neue künstlerische Richtung oder modularen Zubehörlagen hinzufügen.
- [x] PNG und Prompt-Nachweis ins Repository kopieren. Originale erhalten. Nur vom Werkzeug bestätigte Modellkennung nennen; ansonsten „Backendmodell nicht offengelegt“.
- [x] Jede Datei tatsächlich öffnen und Figur, Gliedmaßen, Flügel, Konturen, Unterschied 3→4 sowie Text-/Hintergrundfreiheit prüfen. Bei Mängeln gezielt mit dem Bildwerkzeug korrigieren; keine automatische Erfolgsannahme.
- [x] Mit vorhandenen Bildwerkzeugen Modus, Abmessungen, Alphaextrema und kleine Ansichten prüfen. Die vier Quellen dürfen verschiedene Ausgangsmaße haben; die spätere Ausgabe verwendet einen gemeinsamen transparenten Rahmen ohne Strecken.
- [x] Im Bericht echte Befunde und verbleibende Grenzen festhalten. 4/76 produzierte Motive nicht als Gesamtabschluss ausgeben. `npm run check:docs` und `git diff --check`, dann nur Quellen/Nachweise und aktualisierte Übergabe sichern.

## Anschließende getrennte Arbeitspakete

Die übrigen 72 Bildmotive, deterministische WebP-Ableitungen, Datenmigration, bestätigte Kaufereignisse, neue Oberfläche und Offline-/Updateintegration gehören zur Gesamtanforderung. Sie werden im jeweils konkreten Folgeplan umgesetzt. Dieses Grundlagenpaket aktiviert keine Ersatzkäufe und umgeht die offene reale Drive-Prüfung nicht.

**Selbstprüfung:** Task 1 implementiert alle Katalogschnittstellen des Entwurfs. Task 2 prüft die ausdrücklich begrenzte erste Reihe. Beide teilen nur die fest definierten Bildkennungen und ändern keine gemeinsamen Laufzeitdateien. Die realen Google-/Geräteprüfungen werden nicht durch lokale Tests ersetzt. Vor Produktintegration ist ein separater ausführbarer Daten-/Kaufplan notwendig.
