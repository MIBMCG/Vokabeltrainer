# Belohnungsmomente Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task. Steps use checkbox syntax.

**Goal:** Alle fünf bestätigten Belohnungsideen als schnelle, optionale Darstellung in die vorhandenen Ansichten einbauen.
**Architecture:** Reines Präsentationsmodell plus kleine DOM-Hilfen; vorhandene Render- und Kaufabläufe verwenden diese ohne neue persistenten Verträge.
**Tech Stack:** Bestehendes ES-Modul-JavaScript, CSS, Node-Test und synthetisches Playwright/Edge.
**Spec:** ../specs/2026-10-03-belohnungsmomente.md

## Global Constraints

Alle Grenzen aus der Spec gelten. Keine neue Bilderzeugung, Abhängigkeit, Währung,
Speicherstruktur oder Änderung von Kauf-/Lern-/Punktelogik. Vorhandene `animations`
und OS-Reduktion respektieren. Keine zusätzlichen API-Abfragen oder Zeitbarriere
im Bestätigungsweg. Profilbezogener bestätigter Besitz; explizite Auswahl erhalten.
Keine Anbieter-/Deploy-/GitHub-Aktionen durch Implementer. Root übernimmt Abschluss.
Arbeitsbaum: `C:/Users/Marco/.codex/worktrees/purchase-batch-checks/Vokabeltrainer`.
Basis `54e7d668fcc5b3e060c0684a41c8a05205ede21b`.

## Review Focus

1. Verzögerte lokale Kontoantwort nach Profil-/Seitenwechsel: nicht mehr rendern.
2. Offener/abgelehnter oder profilfremder Kauf: keine Erfolgsfeier.
3. Neuzeichnen und importierter Altbesitz: keinen neuen Freischaltmoment erfinden.
4. Fehlerhafte/alte Lernantwort ohne passenden wirksamen Beleg: keine Erfolgsaussage.
5. Ausgeschaltete Bewegung, fehlendes Bild und schmale große Schrift: statisch benutzbar.

### Task 1: Eigener Figurenplatz, Sammlung, Steckbriefe und Bewegungsgrundlage

**Files:** Create `src/trainer/avatar/companion.js`, `src/trainer/ui/companion.js`,
`tests/trainer/companion.test.js`, `tests/browser/companion.browser.mjs`.
Modify `src/trainer/ui/rewards.js`, `src/trainer/ui/purchases.js`,
`src/trainer/ui/shell.js`, `trainer/styles.css`, `scripts/serve.mjs`, `trainer/sw.js`.
Do not bump cache version yet; add new module public routes/precache explicitly.

**Interfaces:**
- `companionInfo(figureId, stage)` returns null for invalid input, otherwise
  frozen `{figureId, stage, name, title, place, trait, story, effect}`. All13
  catalog figures and stages1–4 have concise German character-appropriate text;
  higher stages change title/story. Effects finite and decorative.
- `ownedCompanions(view, profileId)` returns `[]` without active confirmed account;
  otherwise catalog-ordered entries `{figureId, stage, ownedStages, info}` with
  highest owned stage and exact owned stage array. Only known entitled figure
  and entitled evolution IDs; never derive paid ownership from level or selection.
- `claimCompanionMoment(owner, profileId, key)` returns true only for unseen
  profile/key in that owner; retains at most256 keys via bounded transient WeakMap.
- `companionFigure(art, {figureId, stage, animations=false})` wraps supplied
  existing DOM art with `companion-figure`, effect metadata and finite CSS motion.
  No imports from rewards/purchases; avoids cycles. Caller claims a stable
  profile/figure/stage/surface key before enabling animation on rerender.
- UI module may add `companionBiography(info, ownedStages)` for exact owned titles.
- `renderPurchases` gains optional `animations=false`; renderAvatar supplies the
  actual profile preference. Task2 uses it without changing storage.

- [x] RED: pure tests for all figures/stages, invalid input, known-only ownership,
  profile separation, no inferred paid stage, immutable input, exact titles,
  bounded deduplication with distinct profile keys.
- [x] Implement model/prose and UI helper; use existing DOM helpers and responsive
  art. No network in helpers. Scope new CSS to companion classes, transform/opacity
  only, finite low amplitude, global reduced-motion remains effective.
- [x] Add biography and unlocked titles beneath selected figure on Meine Figur;
  move existing animation switch to shared avatar surface, preserving save/focus/error.
- [x] Add named figure home and compact owned collection beneath journey map.
  Pass commerce and onNavigate from shell; local getView only, guard async result
  against disconnected/replaced host and profile changes. Loading/error/classic
  fallback remains truthful. Collection may link to existing avatar route.
- [x] GREEN Node + browser: two profiles with different owned forms; selected
  human/animal/classic; motion switch reachable and persisted; no ownership
  mutations; no stale async view; 320/390px200% typography, reduced motion,
  missing image and offline modules. Save screenshots for root visual inspection.
- [x] Self-review and report, then root commits and independent task review.

### Task 2: Bestätigte Verwandlung und echte Lernreaktionen

**Files:** Modify `src/trainer/ui/purchases.js`, `src/trainer/ui/practice.js`,
`src/trainer/ui/companion.js`, `trainer/styles.css`; create
`tests/trainer/companion-feedback.test.js`, `tests/browser/companion-feedback.browser.mjs`.
If a pure reaction module is useful add `src/trainer/learning/companion-feedback.js`
with explicit serve/SW entries. Do not change learning schema/projection or economics.

**Interfaces:** Consume Task1 companionInfo/figure and claimCompanionMoment.
`renderPurchases` has animations preference. Real commerce.confirm/resume return
`{operationId,status}`; fresh local view includes accounts, jobs, selection.

- [x] RED: confirmed matching operation plus actual entitlement celebrates once;
  pending/rejected/stale/auth/network/profile mismatch cannot celebrate; resume
  confirmation follows same path. Prove no extra commerce/network call needed.
- [x] Keep confirmation result through existing run wrapper or specific callback;
  verify fresh account/operation before decorating the existing success view.
  Reuse already loaded preview art for confirmed purchase where possible. Finite
  transformation≤1200ms, explicit skip, immediate success text/buttons/Escape;
  no awaited image/animation/timer. Resume success gets equivalent celebration.
  Selection remains explicit. Dedupe operation/profile; no replay on old ownership.
- [x] RED: difficult-word reaction only with saved correct feedback answer ID and
  matching effective recovered milestone evidence for that profile/word; ordinary
  right answer, wrong answer, failed save, stale epoch/other profile do not qualify.
  Completed-round reaction requires saved matching completion, not abandoned or
  still-exhausted. Valid saved short completion with reason exhausted qualifies.
  Reuse effective-event helpers and validated completion semantics; a pure exported
  wrapper is allowed without changing projection behavior or writing reward claims.
- [x] Add short encouraging figure reaction to feedback/completed surfaces; reuse
  selected figure/classic display and profile animations. Keep answer/next focus,
  input and navigation immediately usable. Dedupe animation by answer/round IDs,
  retain static explanatory content across rerender.
- [x] GREEN focused Node/browser: confirmed/new/recovered purchase, negative
  cases, skip/Escape/immediate select; motion-off/OS-reduced; correct recovery and
  completion vs ordinary/failed cases; profile switch/rerender; phone200% and offline.
  Check real service synthetic purchase request budget unchanged. Save screenshots.
- [x] Self-review and report, then root commits and independent task review.

### Root completion

- [x] Final product cache v51→v52, existing future fixtures v52→v53.
- [x] Full Node suite once and targeted final purchase/practice/companion/update
  browser cases; inspect actual screenshots. No personal/device test request.
- [x] Independent whole-branch review; fix concrete findings and targeted recheck.
- [x] Fast-forward integration, existing authorized Leje-only deploy, public
  byte comparison including newly allowlisted modules. No personal browser update.
- [x] Handoff plus AGENTS/START-HIER/ARBEITSSTAND; both authorized GitHub branches
  exact remote SHA verification. Clearly retain deferred real-device/time evidence.

## Abschluss am 03.10.2026

Alle Schritte abgeschlossen. Produkt 4778440, Cache v52, ist unabhängig geprüft,
bei LejeAdventure aktiv und auf beiden freigegebenen GitHub-Zweigen exakt bestätigt.
Finale Nachweise und verschobene Praxisprüfungen stehen in der
[Übergabe](../../handoffs/2026-10-03-belohnungsmomente.md).
