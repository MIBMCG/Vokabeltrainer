# Task 7 – Korrekturbericht zur unabhängigen Review

Stand: 18.09.2026  
Branch: `codex/vokabeltrainer-v1`  
Ausgangspunkt: `8b961ad`  
Commit: `99d8f13` (`fix: invalidate practice when profile becomes unavailable`). Unabhängige Nachprüfung: beide ursprünglichen Befunde behoben, keine neuen kritischen oder wichtigen Befunde. Kleiner verbleibender Textbefund: Der Erschöpfungshinweis erwähnt zusätzliche Wörter auch bei verborgener Erweiterungsschaltfläche; Korrektur in Task 13 vorgemerkt.

## Behobene Reviewbefunde

### Profil wird während einer offenen Aufgabe ungültig

`practiceRenderKey()` berücksichtigt jetzt die fachliche Profilgültigkeit. Ein vorhandenes, konfliktfreies und nicht archiviertes Profil bildet weiterhin denselben Schlüssel, sodass eine unabhängige Hintergrundänderung Eingabe-Node, Entwurf und Fokus erhält. Archivierung, Profilkonflikt und ein fehlendes Profil wechseln dagegen auf `profile-invalid`. Dadurch erreicht `shell.stateChanged()` den bereits vorhandenen Profil-Redirect, statt vorzeitig zurückzukehren.

Der Redirect zeigt in der Profilauswahl ausdrücklich: Das Lernprofil ist nicht mehr verfügbar und die offene Antwort wurde nicht gewertet. Es wird weder `submit()` aufgerufen noch ein `answer.recorded`-Ereignis erzeugt. Der Browsertest prüft diese Grenze für Archivierung und zwei widersprüchliche aktive Profilfassungen sowie den unveränderten Entwurf bei einer gültigen Hintergrundänderung.

### Wirkungslose Erweiterungsaktion

Die Oberfläche leitet die Sichtbarkeit von „Weitere Vokabeln“ nicht mehr aus `round.expanded` ab. `commands.roundAvailability()` berechnet mit derselben Uhr-/Zeitzonenabhängigkeit wie die Mutationsbefehle die bestehende `nextTask()`-Entscheidung. Die UI zeigt die Aktion nur, wenn deren vorhandenes Feld `canExpand` wahr ist. Der Browsertest prüft, dass eine erschöpfte `all`-Runde ohne zusätzliche Kandidaten die wirkungslose Aktion nicht anbietet.

## TDD-Nachweise

### RED – Profilgültigkeit

```text
node --test --experimental-test-isolation=none tests/trainer/practice.test.js
tests 5, pass 4, fail 1
AssertionError: practiceRenderKey blieb für archiviertes Profil unverändert
```

```text
PLAYWRIGHT_MODULE=... node --test --experimental-test-isolation=none \
  --test-name-pattern="trainer practice reacts to background profile invalidation" \
  tests/browser/trainer.browser.mjs
tests 1, pass 0, fail 1
Archivfall: redirected false, notice false, inputRemoved false, answerCount 0
```

Beim Selbstreview wurde anschließend ein fehlendes Profil als weiterer Fall derselben Gültigkeitsgrenze ergänzt. Vor der expliziten Existenzprüfung war auch dieser fokussierte Node-Lauf rot: 4/5 bestanden, der Schlüssel blieb fälschlich `profile-valid`.

### RED – zusätzliche Kandidaten

```text
PLAYWRIGHT_MODULE=... node --test --experimental-test-isolation=none \
  --test-name-pattern="trainer practice is resumable" \
  tests/browser/trainer.browser.mjs
tests 1, pass 0, fail 1
Erwartete Anzahl „Weitere Vokabeln“: 0; tatsächlich: 1
```

### GREEN – fokussiert

```text
node --test --experimental-test-isolation=none tests/trainer/practice.test.js
tests 5, pass 5, fail 0
```

```text
PLAYWRIGHT_MODULE=... node --test --experimental-test-isolation=none \
  --test-name-pattern="trainer practice" tests/browser/trainer.browser.mjs
tests 2, pass 2, fail 0
```

Der abschließende Browserlauf nutzte Playwright aus dem privaten Runtime-Pfad und System-Edge in einem frischen synthetischen Kontext. Er prüfte den vollständigen bisherigen Übungsablauf sowie den neuen Hintergrund-Archivierungs-/Konfliktfall.

## Gesamtprüfung

```text
npm test
tests 192, pass 192, fail 0
```

```text
git diff --check
keine Ausgabe
```

## Dateien und Schnittstellen

- `src/trainer/ui/practice.js`: Profilgültigkeit im Render-Schlüssel; `canExpand` steuert die Erweiterungsaktion.
- `src/trainer/ui/shell.js`: sichtbarer Hinweis beim Redirect eines ungültig gewordenen aktiven Profils.
- `src/trainer/commands.js`: neue rein lesende Abfrage `roundAvailability({roundId})`, die `nextTask()` mit derselben injizierten Uhr wie die Befehle nutzt.
- `tests/trainer/practice.test.js`: Schlüsselgrenze für gültig, archiviert, konfliktbehaftet und fehlend.
- `tests/browser/trainer.browser.mjs`: echter DOM-/Projektionsfall für Entwurfserhalt und Hintergrundinvalidierung; keine Wertung; keine wirkungslose Erweiterungsaktion.

Die Erweiterung der Commands-Oberfläche ist additiv. Die bestehende LocalRound-Struktur, Ereignisformate und Task-7-Abläufe bleiben unverändert.

## Grenzen und offene Nachweise

Keine neue bekannte Task-7-Funktionslücke. Safari, Bildschirmtastatur, Home-Bildschirm-App und die reale iPhone-/iPad-Abnahme bleiben wie vorgesehen offen. Der Browsernachweis mit System-Edge ersetzt diese Geräteabnahme nicht. Es wurden ausschließlich synthetische Profile und Vokabeln verwendet; kein Push wurde durchgeführt.
