# Entwicklungsgalerie und responsive Drachenbilder

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Schritte als Checkliste abarbeiten.

**Goal:** Die bestätigte EV05-Bedienung mit der vorhandenen Drachenreihe vervollständigen und deren Bilder deutlich verkleinern.

**Architecture:** Die vorhandenen Kauf- und Besitzdaten bleiben maßgeblich. Ein gemeinsames Bildmodul verwendet ein aus echten Quelldateien erzeugtes Manifest. Die Oberfläche nutzt `evolutionOffer` für Fortschritt und bleibt von Kaufprotokoll und Google-Anmeldung getrennt.

**Tech Stack:** Bestehendes JavaScript, Node-Tests, Playwright, vorhandenes Sharp; keine neue Laufzeitabhängigkeit.

**Spec:** [Bestätigte EV01–EV05](../../design/2026-09-20-avatar-entwicklungsstufen.md), [aktuelle Präzisierung menschlicher Grundformen](../../ANFORDERUNGEN.md), [Grundlagen](../specs/2026-09-20-avatar-evolution-foundation.md).

## Global Constraints

- Preise 200/400/800 und profilgetrennte Guthaben/Besitz bleiben bestehen.
- Keine automatische Auswahl nach Kauf; ausdrücklich „Jetzt auswählen“ anbieten.
- Menschliche Grundformen behalten Haut- und Kleidungsfarben, höhere Formen feste Outfits.
- Fehlende Bilder ehrlich anzeigen und zugehörige Käufe nicht anbieten.
- Klassische Auswahl und Gestaltung erhalten; nur im passenden Modus anzeigen.
- Nur synthetische Tests. Vier genehmigte Drachenquellen verwenden; 72 weitere Motive bleiben ein separates Paket.
- Private Bereitstellung und Git-Sicherung bleiben im bestehenden Auftrag. Keine neue allgemeine Freigabe für bestätigte Entscheidungen einholen.

## Review Focus

- Guthaben unter/über Preis und höchste Stufe: korrekte fehlende Punkte und begrenzter Balken (Task 2).
- Wechsel zwischen Profilen, Figuren und Klassisch: Besitz und persönliche Gestaltung bleiben erhalten (Task 2).
- Offlineauswahl und fehlende Bilder: kein unberechtigter Kauf und keine defekte Darstellung (Tasks 1–3).
- Kaufabschluss ohne automatische Auswahl, inklusive Tastatur/Fokus (Task 2).
- Schmaler Bildschirm, transparente Ränder und kontrolliertes Offlineupdate (Task 3).

## Task 1: Responsive Bildausgabe

**Files:** Neu `scripts/build-evolution-art.mjs`, `src/trainer/avatar/evolution-art.js`, `src/trainer/avatar/evolution-art-manifest.js`, `tests/trainer/evolution-art.test.js`; Ausgaben unter `trainer/assets/avatar-evolution/`.

**Interfaces:** `evolutionArt(figureId, stage, skin = 0)` liefert Fallback-URL oder `null`. `evolutionPicture(figureId, stage, {skin = 0, alt = '', className = '', sizes = '256px'} = {})` liefert ein `picture` mit responsive `img` oder `null`. Gemeinsame Klasse `evolution-art`; keine Abhängigkeit auf Kauf-UI.

- [x] Tests zuerst: nur reale Manifestdateien, 256/512/768-Pixel-Varianten, Transparenz, keine Vergrößerung, unbekannte Form `null`, Auswahl der richtigen Form.
- [x] Fehlenden Vertrag mit `node --test tests/trainer/evolution-art.test.js` nachweisen.
- [x] Reproduzierbar aus den vier bestätigten Quellen erzeugen; Originale unverändert lassen, Hashes und Größen dokumentieren. `srcset` und kleine Fallbacks aus Manifest verwenden.
- [x] Tests ausführen, tatsächliche Einsparung messen und Änderungen unabhängig prüfen lassen.

## Task 2: Galeriebedienung

**Files:** `src/trainer/ui/purchases.js`, `src/trainer/ui/rewards.js`, `trainer/styles.css`; passende Tests unter `tests/trainer/` und `tests/browser/purchases.browser.mjs`.

**Interfaces:** Task 1 liefert den obigen Bildvertrag. `evolutionOffer` bleibt die einzige Fortschrittsberechnung. Bestehende Commerce-Methoden bleiben unverändert.

- [x] Tests zuerst für Fortschritt bei 50/200 Punkten (150 fehlen, 25 %), Deckelung bei 100 %, höchste Stufe sowie figurenbezogene Vorgängerstufe.
- [x] Tests zuerst für Kaufbild und bewusste Auswahl nach Bestätigung, owned/locked-Anzeigen sowie Klassisch-Rückkehr ohne Verlust der Gestaltung.
- [x] Failures mit den betroffenen Node-/Browserfällen nachweisen.
- [x] Fortschrittsbereich mit nächstem Bild, Preis, Guthaben und fehlenden Punkten einbauen; alle vier Formen mit Besitzstatus zeigen. Höchste Stufe ausdrücklich anzeigen.
- [x] Kaufdialog mit Bild ergänzen; Bestätigung beibehalten und „Freigeschaltet“ / „Jetzt auswählen“ ergänzen. Auswahl erfolgt nur durch separate Aktion.
- [x] Eigene Formen übersichtlich anbieten, Figur für Entwicklung ohne unbeabsichtigte Auswahl betrachten können. Klassische Gestaltung nur bei klassischer Auswahl, menschliche Basisfarben gemäß Präzisierung anbieten.
- [x] Gemeinsame responsive Bilder auch in der großen Auswahl und Lernanzeige verwenden; schmale Darstellung und Tastaturzugang erhalten.
- [x] Betroffene Tests ausführen und Änderungen unabhängig prüfen lassen.

## Task 3: Integration und Abschluss

**Files:** `trainer/sw.js`, `scripts/serve.mjs`, `tests/serve.test.js`, `tests/browser/evolution-art.browser.mjs`, betroffene Browser-Updatefixtures, Quellen-README, `ARBEITSSTAND.md`, aktuelle Übergabe und Ergebnisbericht.

- [x] Cachekennung auf v33 erhöhen; neue Laufzeitmodule und tatsächlich benötigte Bildvarianten explizit aufnehmen. Große ursprüngliche PNGs nicht mehr vorladen, sofern Laufzeit und Tests keine Abhängigkeit mehr besitzen.
- [x] Vollständige Node-Prüfung, betroffene Browserfälle einschließlich Offline/Update, Galerie auf breitem und schmalem Bildschirm ausführen; Bilder visuell prüfen.
- [x] Unabhängige Gesamtprüfung auf Spec und Qualität; Befunde vor Abschluss beheben.
- [x] Prüfgrenzen und Bildgrößen dokumentieren, Entwicklungszweig integrieren, private App aktualisieren und ausgelieferte Dateien vergleichen.
- [x] GitHub-Push und exakten Remote-Commit belegen. Keine vollständige Produktion aller Figuren behaupten.

## Ablaufentscheidung

Task 1 und Task 2 haben getrennte Schreibbereiche und einen festen Bildvertrag; sie laufen parallel. Task 3 folgt nach beiden Ergebnissen. Die bestehende Arbeitskopie wird weiterverwendet. Die Ausführung konkretisiert die bereits bestätigten EV05-Anforderungen, ohne neue Produktentscheidung.
