# Task 8 report — Inselreise, Avatar und Abzeichen

## Ausgangspunkt und Umfang

- Produktbasis: `99d8f13` (`fix: invalidate practice when profile becomes unavailable`).
- Aktueller Branch bei Umsetzung: `codex/vokabeltrainer-v1`; der danach vom Controller erstellte Dokumentationscommit `3410ca4` wurde erhalten.
- Ausschließlich Task-8-Produktdateien werden committet. Die uncommittete Controller-Änderung an `docs/ENTWICKLUNGSENTSCHEIDUNGEN.md` bleibt unangetastet und ungestaged.
- Keine Subagents, kein Push, keine Veröffentlichung, keine echten Profile oder Zugangsdaten.

## Umsetzung

- `src/trainer/ui/rewards.js` stellt die Schnittstellen `renderJourney({root,profile})`, `renderAvatar({root,profile,profileId,commands})` und `avatarParts(profile)` bereit.
- Die Reise leitet Level, 15 Etappen und Inselgrenzen ausschließlich über die bestehende `rewardState`-Logik aus der Profilprojektion ab. Drei responsive Inselkarten zeigen Strand, Wald und Berg; nach Etappe 15 wird kein weiterer Inselumfang angekündigt.
- Sechs dauerhafte Badge-Typen werden als Text und mit unterschiedlichen, selbst gezeichneten SVG-Symbolen dargestellt.
- Vier Hauttöne und sechs Kleidungsfarben sind frei wählbar. Kappe, Rucksack, Sonnenhut, Fernglas, Bergmütze und Kompass werden bei Level 2/4/6/8/11/14 freigeschaltet; gesperrte Radios nennen das benötigte Level.
- Avataränderungen werden ausschließlich über `commands.setAvatar` mit der expliziten, von der Shell gewählten `profileId` gespeichert. Ein Browserfall belegt zwei unabhängig erhaltene Profilwahlen.
- Kurze Avatarbewegung ist über `commands.setAnimations` abschaltbar; die bestehende Reduced-Motion-Regel setzt Animationen und Übergänge auf null. Nach einem Speichern wird der Fokus auf die neu gerenderte Auswahl zurückgesetzt.
- Eigene Assets: `trainer/assets/islands.svg`, `avatar.svg`, `badges.svg`. Sie enthalten nur feste lokale Symbol-IDs und keine importierten Fragmente oder Platzhalter.
- `scripts/serve.mjs` liefert das UI-Modul und die drei SVGs mit festen Pfaden/MIME-Typen aus. Die aus `import.meta.url` abgeleiteten Asset-URLs funktionieren auch unter einem Repository-Unterpfad.

## TDD-Nachweis

RED:

- `node --test --experimental-test-isolation=none tests/trainer/reward-view.test.js` → Exit 1, erwarteter `ERR_MODULE_NOT_FOUND` für das noch nicht vorhandene `src/trainer/ui/rewards.js`.
- Edge: `node --test --experimental-test-isolation=none --test-name-pattern="trainer rewards" tests/browser/trainer.browser.mjs` → Exit 1, erwarteter Timeout auf den noch nicht vorhandenen Button `Inselreise`.
- Beim visuellen Review gefundener Fokusfehler: derselbe Browsertest → Exit 1, `true !== false` für den sichtbaren/fokussierten Skip-Link. Der Test wurde anschließend auf tatsächlichen Fokus und Bildschirmposition präzisiert; die UI stellt den Fokus auf das neue Radio zurück.
- Level-16-Text: Browsertest → Exit 1, erwarteter Timeout auf `Alle sechs Ausrüstungsteile sind freigeschaltet …`; anschließend wurde die irreführende weitere Ausrüstungsankündigung ersetzt.

GREEN:

- `node --test --experimental-test-isolation=none tests/trainer/reward-view.test.js` → 2/2 bestanden.
- Edge 153.0.4234.32 / Playwright 1.62.1 / Node 26.8.2: fokussierter Test `trainer rewards` → 1/1 bestanden, 0/200/1000/2000/3000 Punkte, 15 Etappen, sechs Badges, vier/sechs Farboptionen, gesperrte Leveltexte, zwei Profile und gespeicherte Avatarereignisse.
- `npm test` → 194/194 bestanden, 0 fehlgeschlagen.
- `git diff --check` → Exit 0.
- Alle drei SVG-Dateien wurden mit `System.Xml.XmlDocument.Load` erfolgreich als XML geparst.

## Visuelle Prüfung

- Bestätigte Konzeptreferenz `docs/design/2026-09-17-insel-konzept.png` in Originalauflösung geprüft.
- Tatsächliche Edge-Screenshots geprüft: `test-results/trainer-rewards-mobile.png`, `trainer-rewards-desktop.png`, `trainer-avatar-mobile.png`, `trainer-avatar-desktop.png`.
- Ergebnis: drei vollständig sichtbare Landschaften, senkrechte mobile Etappenpfade, Desktop-Landschaften neben den Etappen, sechs klar unterscheidbare Abzeichen, Avatar mit Kleidung und ausgewähltem Handzubehör sowie alle sechs Zubehörsymbole in der Auswahl. Keine horizontale Beschneidung im geprüften 390×844- und 1280×900-Layout.

## Schnittstellen und Grenzen

- Keine Abweichung von den geforderten Exporten oder fachlichen Schwellen.
- `renderAvatar` nutzt die formale Signaturkorrektur mit expliziter `profileId`; keine Ableitung aus Namen oder erstem Profil.
- Die Browserprüfung nutzt synthetische gespeicherte Ereignisse und isolierte Browserkontexte. Sie ersetzt ausdrücklich keine noch offene Abnahme auf echtem iPhone/iPad.

## Commit

- `6b83b48` — `feat: complete island journey avatar and milestone art`
- Enthält exakt die neun Task-8-Dateien; keine Controller-Dokumentation und keinen Bericht aus dem ignorierten SDD-Arbeitsbereich.

## Zusätzliche Integrationsprüfung
Der Controller führte auf `6b83b48` zusätzlich die gesamte Trainer-Browsersuite aus: **4/4 bestanden** (Übungsablauf, Hintergrund-Profiländerung, Einrichtung/Erwachsenenbereich/BFCache, Reise/Avatar). Die unabhängige Aufgabenreview einschließlich Nachprüfung von `ad3701c` ist abgeschlossen; der fachlich wichtige Testbefund ist behoben. Ein kleiner Fokus-Testbefund bleibt für Task 13 vorgemerkt: vor der Prüfung des neuen aktiven Radios ausdrücklich den Austausch des alten DOM-Knotens abwarten.

## Portable Ansichtsnachweise

Tatsächliche synthetische Edge-Ansichten, keine Konzeptbilder:

- [Inselreise mobil](assets/2026-09-18-inselreise-mobil.png)
- [Inselreise Desktop](assets/2026-09-18-inselreise-desktop.png)
- [Avatar mobil](assets/2026-09-18-avatar-mobil.png)

Die unabhängige Review bestätigt den Produktumfang und die Visuals. Die expliziten Browserassertionen für Insel-/Zubehörgrenzen sind nachgeprüft; die oben beschriebene zusätzliche Absicherung des Radiofokus bleibt als Minor vorgemerkt.
## Reviewkorrektur Runde 1

- Der Reviewbefund in `task-8-review.md` wurde gegen die Browseroberfläche bestätigt: Die vorhandene Produktlogik war korrekt, aber der Test belegte Wald/Berg und fünf der sechs Zubehörgrenzen nicht direkt.
- Der gespeicherte Browserfortschritt prüft nun 0/200/600/1000/1400/2000/2600/3000 Punkte. Für jeden Stand werden Strand, Wald und Berg auf Sichtbarkeit und `data-unlocked` geprüft.
- Kappe, Rucksack, Sonnenhut, Fernglas, Bergmütze und Kompass werden bei jedem Stand auf Sichtbarkeit und aktiv/gesperrt geprüft. Damit sind die exakten Grenzen Level 2/4/6/8/11/14 im realen DOM belegt.
- Die Tastaturprüfung bewegt die Hautfarbenauswahl mit `ArrowLeft` und `ArrowRight`, prüft Auswahl und Fokus auf `skin=2` beziehungsweise `skin=3` und bestätigt nach der Kompasswahl konkret `hand=compass` als aktives Radio.
- Fokussierter Edge-Lauf: `node --test --experimental-test-isolation=none --test-name-pattern="trainer rewards" tests/browser/trainer.browser.mjs` → 1/1 bestanden, 0 fehlgeschlagen, 11,18 s.
- Keine Produktdatei wurde geändert; ein erneuter vollständiger Node- oder Browserlauf war gemäß Reviewauftrag nicht erforderlich.
- Reviewkorrektur-Commit: `ad3701c` — `test: verify reward unlock boundaries` (ausschließlich `tests/browser/trainer.browser.mjs`).

