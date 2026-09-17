# Task 7 – Bericht

Stand: 17.09.2026  
Ausgangspunkt: `387cbce5cc26d4cdddf3e8e59d9a8719ff4f36e1`  
Branch: `codex/vokabeltrainer-v1`  
Commit: `85b3629` (`feat: deliver resumable touch-friendly practice flow`)

## Ergebnis

- Vollständige Übungsoberfläche mit drei Moduskarten (`all`, `latest`, `new`) und den Rundengrößen 10, 20 und 30; 10 ist vorausgewählt.
- Laufende Runden werden profilbezogen als „Fortsetzen“ oder „Neue Runde“ angeboten. Die ausgewählte Profil-/Ansichtssitzung bleibt für Reload erhalten, sodass ein Reload im Feedback genau zur gespeicherten Rückmeldung zurückkehrt.
- Große deutsche Wortkarte, optionaler Hinweis, ehrlicher Fortschritt, englisches Eingabefeld mit den vereinbarten Browserattributen und touchfreundliche Hauptaktionen.
- Leere Eingaben werden nicht gewertet. Während eines Commits sind Eingabe und Hauptaktion gesperrt. Erst nach erfolgreicher Speicherung erscheint die deaktivierte Eingabe mit ✅/❌-Feedback; „Weiter“ erhält Fokus, löst aber nicht selbsttätig aus.
- Falsche Antworten zeigen „Noch nicht ganz“ und alle erlaubten Lösungen. Das getippte Wort bleibt im lokalen Rundenfeedback bis „Weiter“ erhalten.
- `keyAction({key,repeat,isComposing,phase})` ignoriert gehaltenes Enter, IME-Komposition, fremde Tasten und terminale Phasen; absichtliches Enter liefert ausschließlich `submit` oder `next`.
- Doppelaktivierungen werden durch eine synchrone Busy-Schranke auf genau einen Fachbefehl begrenzt.
- Bei Speicherfehler bleibt die Eingabe sichtbar und fokussiert; es erscheint kein Erfolg und kein Antwortereignis. Ein erneuter Versuch kann anschließend normal speichern.
- Eine während der Eingabe geänderte/archivierte/entzogene Wortfassung wird erkannt, verständlich gemeldet und über `commands.next()` ohne Wertung durch die nächste zulässige Aufgabe ersetzt.
- Hintergrundänderungen, die dieselbe angezeigte Aufgabe gültig lassen, ersetzen den DOM-Baum nicht. Ein echter Browsernachweis bestätigt dieselbe Input-Node, denselben ungesendeten Entwurf und denselben Fokus.
- Erschöpfte Runden bieten weitere zulässige Wörter oder einen bewussten Abschluss. Ein leerer Start zeigt keinen Erfolgsscreen und erhält keinen Bonus. Die Zusammenfassung nennt tatsächliche Antwortzahl, richtige Antworten, Fehlerwörter, Antwortpunkte und den getrennten Rundenbonus.
- Der letzte Feedbackbildschirm wird ausschließlich mit `commands.next()` in den vollständigen Abschluss überführt. Punkte und Lernstand stammen stets aus der Projektion; die UI führt keine zweite Wertungslogik.
- Responsive Sand-/Türkis-Oberfläche nach dem Inselkonzept mit sichtbarem Fokus, großen Bedienelementen, fester Hauptnavigation und Regeln für 320 px, 390 px, Desktop, 200 % Schrift sowie reduzierte Bewegung.

## Schnittstellen und Verbraucheränderungen

- Neu: `renderPractice({root,state,commands,profileId,onNavigate})` in `src/trainer/ui/practice.js`.
- Neu: `keyAction({key,repeat,isComposing,phase})` und die kleinen reinen Helfer `roundSummary()` sowie `practiceRenderKey()`.
- `shell.js` nutzt `renderPractice()` für die aktive Runde und den zusätzlichen internen `renderPracticeLanding()`-Einstieg für Moduswahl/Fortsetzen. Die geforderte `renderPractice`-Signatur bleibt unverändert.
- `mountShell()` besitzt zusätzlich `stateChanged()`. `main.js` ruft dieses statt eines bedingungslosen Voll-Renderings auf. Nur bei gleich gebliebener aktiver Aufgabe wird der bestehende DOM-Baum zum Schutz von Entwurf und Fokus erhalten.
- `shell.js` speichert ausschließlich Profil-ID, Ansicht und den lokalen Aktivstatus in `sessionStorage`; keine Antwort, PIN oder Lerndaten.
- `scripts/serve.mjs` liefert `src/trainer/ui/practice.js` als explizit erlaubtes JavaScript-Asset. Keine neue Laufzeitabhängigkeit und kein Buildschritt.
- Die vorhandenen Commands- und Datenverträge wurden nicht geändert.

## TDD-Nachweis

### RED

- `node --test tests/trainer/practice.test.js`: verwaltete Windows-Umgebung stoppte vor dem Laden mit `spawn EPERM`.
- `node --test --experimental-test-isolation=none tests/trainer/practice.test.js`: erwartetes `ERR_MODULE_NOT_FOUND` für das noch fehlende `src/trainer/ui/practice.js`.
- `node --test --test-name-pattern="trainer practice" tests/browser/trainer.browser.mjs`: ebenfalls `spawn EPERM` vor Browserstart.
- `node --test --experimental-test-isolation=none --test-name-pattern="trainer practice" tests/browser/trainer.browser.mjs`: erreichte den vorgesehenen System-Edge-Start und wurde innerhalb der Sandbox erwartungsgemäß durch `browserType.launch: spawn EPERM` gestoppt. Der GREEN-Lauf verwendete deshalb den bereits bei Task 6 dokumentierten freigegebenen Browserpfad außerhalb dieser Prozessgrenze.

### GREEN und Abschlussprüfung

- `node --test --experimental-test-isolation=none tests/trainer/practice.test.js`: **4/4 bestanden**.
- `npm test`: **191/191 Tests bestanden**, 0 fehlgeschlagen.
- `node --test --experimental-test-isolation=none tests/browser/trainer.browser.mjs`: **2/2 Browserszenarien bestanden** in System-Edge mit echtem DOM und echtem IndexedDB; Dauer im finalen Lauf 5,16 s.
- Fokussierter Browserpfad prüft: drei Modi und Größen, leere Eingabe, falsche Antwort und mehrere Lösungen, gehaltenes Enter, IME, Doppelklick, Reload im Feedback, Fokuswechsel, Profilwechsel/Fortsetzen, neuer Rundenstart mit erhaltenen Punkten, frühe Erschöpfung und Bonus, leerer Start ohne Erfolg, Zusammenfassung, fehlgeschlagene Speicherung, veraltete Aufgabe ohne Wertung sowie Entwurfs-/Fokuserhalt bei sachfremder Hintergrundänderung.
- `node --check` für alle geänderten JavaScriptdateien: Exit 0, keine Ausgabe.
- `git diff --check`: Exit 0, keine Beanstandung.

## Screenshots und visuelle Prüfung

Alle Bilder liegen absichtlich unversioniert unter `test-results/` und enthalten ausschließlich synthetische Daten:

- `trainer-practice-mobile.png` – aktive Übung, 390 × 844.
- `trainer-practice-desktop.png` – aktive Übung, 1280 × 900.
- `trainer-practice-320.png` – aktive Übung bei 320 px Breite; kein horizontaler Überlauf.
- `trainer-practice-200-percent.png` – CSS-äquivalente 200-%-Schrift bei 390 px; Navigation bleibt vollständig lesbar, die Hauptaktion ist durch Scrollen erreichbar.
- `trainer-summary-mobile.png` und `trainer-summary-desktop.png` – Abschluss mit tatsächlichen Werten und getrennten Punktarten.

Die Bilder wurden angesehen. Ruhige Lernkarte, dunkle gut lesbare Schrift, warme Sandfläche, türkise Hauptaktion und die responsive Reduktion entsprechen der bestätigten Stilreferenz, ohne deren Illustrationsdichte zum Funktionsvertrag zu machen.

## Grenzen und offene Nachweise

- Safari, iPhone, iPad, Home-Bildschirm-App und die Wirkung einer real geöffneten iOS-Bildschirmtastatur bleiben ausdrücklich offen. Edge-Viewport und 200-%-Schriftsimulation ersetzen diese Geräteabnahme nicht.
- Es wurden keine echte Google-Anmeldung, persönlichen Browserdaten oder echten Lernprofile verwendet.
- Task 7 verändert keinen Drive-Abgleich, keine Reise-/Avatarlogik und keine Erwachsenen-Fachlogik.
- Keine bekannte Schnittstellenabweichung. Der ergänzende Landing-Renderer ist eine interne Shell-Hilfe; die beauftragte öffentliche `renderPractice`-Signatur und alle Commands-Verträge bleiben erhalten.
