# Prüf- und Pausenbericht: dauerhafte Käufe

Stand: 20.09.2026. Nutzerauftrag: „lege eine Pause ein sobald wie möglich und bereite die Übergabe für ein anderes System vor“.

## Ergebnisgrenze

Der freigegebene Integrationsplan wurde erstellt und Aufgabe 1 als reiner Kern implementiert (`7ec80fd`). Der Kern ist **nicht in den Trainer eingebunden und nicht zur Integration freigegeben**. Nach vier wichtigen Reviewbefunden wurde auf Nutzerwunsch vor Korrekturen pausiert. Keine echten Google-Schreibvorgänge, Produktmigration oder Käufe wurden durchgeführt. Aufgaben 2–6 bleiben offen.

Implementierung: GPT-5.6 Sol/hoch. Unabhängige Prüfung: GPT-6 Astra/hoch. Die Quellen, Testdateien und Schnittstellenbeschreibung sind versioniert; für die Weiterarbeit werden weder lokale Skills noch interne Agentensitzungen benötigt.

- [Implementierungsbericht mit RED/GREEN und Schnittstellen](2026-09-20-persistent-purchases-task1-implementation.md)
- [Unabhängige Review mit vollständigen Befunden und Codezeilen](2026-09-20-persistent-purchases-task1-review.md)
- [Systemunabhängige Übergabe und Wiedereinstieg](../handoffs/2026-09-20-pause-persistent-purchases.md)

## Ausgeführte Prüfungen

| Prüfung | Tatsächliches Ergebnis | Grenze |
| --- | --- | --- |
| `npm test` vor Umsetzung | 379 bestanden, 0 fehlgeschlagen | unveränderte Ausgangsversion |
| Fokussierter Kauf-/Lern-/Avatarlauf des Implementierers | 47 bestanden, 0 fehlgeschlagen | vier spätere Reviewbefunde noch nicht abgedeckt |
| `npm test` vor Implementierungscommit | 389 bestanden, 0 fehlgeschlagen | kein Freigabeersatz |
| Frischer `npm test` zur Pause | 389 bestanden, 0 fehlgeschlagen, 17,87 Sekunden | keine neuen Negativtests für die Reviewlücken |
| Gezielte schreibfreie Repros des Reviewers | unerlaubter Kauf-Epochenwechsel und ungültiger Pointerauftrag akzeptiert; zweiter Fremdrestore scheitert | kein kompletter Suitenlauf durch den Reviewer |

Der 1000-Transaktionen-Test ist technisch grün, verwendet aber nur zwei wechselnde Restoreepochen. Er muss bei der Korrektur auf neue Epochen umgestellt werden; sein grünes Ergebnis bestätigt derzeit nicht die geforderte Epochenisolation.

## Offene Arbeit vor Aufgabe 2

1. Kauf muss die bisher aktive Epoche beibehalten; nur Restore darf wechseln.
2. Restore braucht eine noch nicht verwendete Zielepoche, auch bei langen Historien.
3. Erneuter Fremdrestore A → B → C muss alle verschachtelten Herkunftsmanifeste und physischen Zuordnungen ohne A/B-Dateizugriff übernehmen.
4. Schreibfähiger persistierter Kaufversuch braucht gespeicherten Kopf/ETag, passenden Vorgänger und identischen Kauf-Intent. Ein Initialisierungs-/Restorekandidat darf diesen Vertrag nicht umgehen.

Zwei weitere Befunde für die Fortsetzung: echte Eventloop-Abgabe statt bloßer Microtask-Abgabe sowie Erhaltung maschinenlesbarer Netzwerk-/Authentifizierungsfehler in der Historienlesung. Die ursprüngliche Review ordnet diese als Minor ein; sie sind für Service und UI relevant und werden nicht verworfen.

## Übergabe und Veröffentlichungsumfang

Die Pausendokumentation und der unintegrierte Kern werden im bereits beauftragten Zweig `codex/vokabeltrainer-v1` gesichert. Der Hauptzweig, persönliche Berichte und Browserdaten bleiben erhalten. Keine Force-Pushes, kein Merge, kein Hosting und keine neue Cloudkonfiguration. Der abschließende Remotevergleich erfolgt nach dem Sicherungspush; bei Fortsetzung Stand erneut prüfen.

Die vollständige Galerie/Bilderproduktion sowie echte Produktwiederaufnahme auf zwei physischen Geräten und iPhone/iPad sind nicht erledigt. Die erfolgreiche echte Probe10 bleibt ein separater Nachweis des Grundverfahrens und wird nicht als Produktfreigabe umgedeutet.

Abschließende Dokumentationsprüfung zur Pause: 194 Markdown-Dateien, 911 lokale Verweise, keine Fehler. Ein zuvor beanstandeter Zeilenumbruch im übernommenen Reviewbericht wurde normalisiert. git diff --check ist ohne Befund.
