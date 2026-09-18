# Unabhängige Gesamtprüfung des v1-Branches

Stand: 18.09.2026. **Ready to merge: With fixes.** Vier wichtige Integrationsbefunde müssen vor der internen Branchfreigabe korrigiert werden. Eine tatsächliche Zusammenführung oder Veröffentlichung ist damit nicht beauftragt.

- Branch: `codex/vokabeltrainer-v1`
- Basis: `707d5046cb797441608a4ca252d53c8c55346e5b`
- Geprüfter HEAD: `807a722e6f962966449ef14f7c44c5944dd95ed1`
- Review: GPT-6 Astra, Denktiefe high; unabhängig, ohne weitere Unteragenten.
- Arbeitsbaum zu Beginn der abschließenden Git-Prüfung sauber; Branch lokal sieben Commits vor dem erfassten Trackingstand. Kein neuer Remote-Abgleich oder Push durch diesen Reviewer.

## Prüfverfahren und Grenzen

Grundlage war das vom Controller bereitgestellte Gesamtbranchpaket mit Commitliste, Statistik und vollständigem U10-Diff. Die Prüfung erfolgte in begrenzten Lesepässen:

1. Fachbefehle, lokaler Speicher und Startintegration: atomare Antworten/Runden, CAS, Schreibsperre, PIN-Anbindung und Lebenszyklus.
2. Vollständige Produktmodule für Synchronisation, Pakete, Zeitplanung, Backupformat, Transport und Wiederherstellung: dauerhafte IDs, Wiederholbarkeit, Bindung, Quarantäne, Vorschaugrenzen und Epochenaktivierung.
3. Vollständige Produktmodule für Schema, Kanonisierung, Fassungen, Epochen, Lernprojektion, Bewertung, Kalender, Runden und Belohnungen: Anforderungen R03–R10/R18–R24/R26/R29/R32.
4. Vollständige Produkt-UI-Module einschließlich PIN-/Importhelfern, Shell und Updatecontroller; Worker, Serverfreigaben und Browserharness: Nutzerwege sowie Zusammenspiel externer Änderungen mit lokalen Eingaben.
5. Gemeinsamer OAuth-/Drive-Adapter sowie Laufzeitmodule und Worker der getrennten Probe: Wiederverwendung und Trennung zum Produkt. Die Probe bleibt ein eigener begrenzter Prüfstand.
6. Anforderungen R01–R33, relevante Stellen des bestätigten Entwurfs und Datenvertrags, Plan/Dateikarte, Architektur, aktuelle Übergabe, Abschlussmatrix, technische Entscheidungen und Reviewledger. Tests wurden über ihre Fallübersicht und gezielt an den betroffenen Integrationsstellen gelesen; nicht jede Test-, historische Dokumentations-, CSS- oder SVG-Zeile wurde erneut vollständig geprüft. Binäre Bilder wurden in dieser Review nicht nochmals visuell abgenommen.

Die [aktuelle Abschlussverifikation](2026-09-18-abschluss-verifikation.md) belegt 277/277 Node- und 11/11 Trainer-Browsertests auf `0ea9502` einschließlich Produktcode `11e3128`; danach änderte sich nur Dokumentation. Der [v1-Bericht](2026-09-18-vokabeltrainer-v1.md) bewahrt zusätzlich den unveränderten Probe-Nachweis 12/12 auf `3b1d16d`. Diese Läufe wurden nicht wiederholt. Frühere unabhängige Taskreviews und die erledigten Restbefunde wurden berücksichtigt, ersetzen aber keine Prüfung der unten benannten Zusammenschaltung.

Eigene zusätzliche Prüfungen beschränkten sich auf zwei gezielte, nicht persistierte Node-Skripte mit Node 22.23.2: echte Sync-/Scheduler-Module mit vorhandenen synthetischen Fixtures sowie die Shell mit einem kleinen DOM-Double. Die Ergebnisse belegen Daten-/Kontrollfluss, keine Browser-, Tastatur- oder Geräteabnahme. Es wurde kein Browser, Server, echtes Google-Konto oder persönlicher Port 4173 verwendet. Nur dieser Bericht wurde geschrieben; Produktcode, Index, HEAD und Branch blieben unverändert.

## Stärken

- Fachereignis, lokale Rückmeldung und ausstehender Upload werden gemeinsam gespeichert. Der In-Memory-Stand folgt erst nach erfolgreichem Speichern; externe Änderungen nutzen denselben serialisierten CAS-Pfad. Die exklusive Schreibsperre verhindert ungeschützte parallele Tabs.
- Unveränderliche Drive-Pakete, persistierte Datei-IDs und Inhaltsprüfungen behandeln verlorene Antworten, wiederholte Uploads und ID-Kollisionen ausdrücklich. Versionscache, Paketintegritätsindex und Quarantäne sind voneinander getrennt.
- Wiederherstellung arbeitet mit geprüfter Sicherheitskopie, aktueller Vorschau, vollständigem Snapshot und einer neuen Epoche. Historische Herkunft wird nicht zu aktivem Steuerzustand; späte Ereignisse und Support bleiben nachvollziehbar erhalten.
- Lernlogik und Belohnungen sind reine, getrennte Funktionen. Tagesabstände, dauerhafte Serien, Fehlerabstand, leere Runden und einmalige Punktevergabe haben konkrete synthetische Prüffälle.
- Die UI behandelt Inhalte als Text. Programmcache und Nutzdaten sind getrennt; der Updatepfad prüft die sichere Bediengrenze, sperrt während der Aktivierung und verhindert einen ungesicherten Reload nach verspätetem Workerwechsel.
- Dokumentation unterscheidet Implementierung, synthetische Evidenz und offene reale Nachweise. Kosten-, Konto-, Lizenz- und Hostinggrenzen sind erhalten. Die 25 dokumentierten technischen Entscheidungen enthalten Gründe und Änderungskosten.

## Befunde

### Critical

Keine belegten kritischen Befunde in den geprüften Pfaden.

### Important

#### I1 — Vergessene PIN kann aus dem gesperrten Zustand nicht zurückgesetzt werden

**Fundstellen:** [shell.js](../../src/trainer/ui/shell.js), Zeilen 256–278 und 289–291; [adult.js](../../src/trainer/ui/adult.js), Zeilen 451–474. Anforderung: R27/E06, bestätigter Entwurf Abschnitt 6.

Die gesperrte Erwachsenenansicht bietet nur PIN, „Öffnen“ und „Zurück“. „PIN vergessen“ und der Aufruf von `pinGate.reset()` liegen ausschließlich in `renderPinSettings()`, das erst im bereits entsperrten Erwachsenenbereich erreichbar ist. Wer die PIN tatsächlich nicht mehr kennt, erreicht den versprochenen lokalen Rücksetzweg nicht. Damit fehlen auch der reguläre Zugang zu Inhaltsverwaltung, Google-Verbindung und Sicherungen, solange die PIN vergessen ist.

**Evidenz:** Die Shell mit gesperrtem Gate enthält keinen „PIN vergessen“-Zugang. Der vorhandene Browserfall testet Reset erst nach erfolgreichem Entsperren mit der bisherigen PIN (`trainer.browser.mjs`, Zeilen 863–878); er deckt den eigentlichen Vergessenfall nicht ab.

**Korrektur:** Den bestehenden bewussten Rücksetzablauf am gesperrten Gate zugänglich machen: ausgeschriebener Bestätigungstext und zweimalige neue PIN, ohne alte PIN, Google-Anmeldung oder Datenlöschung. Bestehende Serialisierung und Entwertung verspäteter Entsperrvorgänge beibehalten. Ein Browserfall muss von einem frisch gesperrten Zustand ohne bekannte alte PIN bis zum erneuten Zugang und unverändertem Lernbestand führen.

#### I2 — Automatischer Abgleich verwirft ungespeicherte Erwachsenenformulare

**Fundstellen:** [shell.js](../../src/trainer/ui/shell.js), Zeilen 379–386; [adult.js](../../src/trainer/ui/adult.js), Zeilen 139–198 und 477–504; [main.js](../../src/trainer/main.js), Zeile 220; [sync/drive.js](../../src/trainer/sync/drive.js), Zeilen 830–920.

Jeder Command-Commit ruft `shell.stateChanged()` auf. Nur die aktive Übungsansicht besitzt einen Rendervergleich; die Erwachsenenansicht wird vollständig ersetzt. Die Namen-, Vokabel- und noch ungeprüften Tabellenfelder halten ihren Entwurf ausschließlich im DOM. Auch ein erfolgreicher Download ohne fachliche Änderung führt derzeit durch `mutate()` zu einem Commit. Ein laufender Hintergrundabgleich setzt daher gerade eingegebene Wörter, Namen, Zuordnungsänderungen oder eingefügte Tabellenzeilen auf den gespeicherten beziehungsweise leeren Ausgangswert zurück und entfernt den Fokus. Dafür ist keine konkurrierende Inhaltsänderung auf einem zweiten Gerät nötig.

**Evidenz:** Ein zusätzlicher `sync.sync()` nach `setupSyntheticSync()` löste genau einen Zustands-Callback aus, obwohl der komplette Zustand davor und danach bytegleich serialisiert war: `notifications: 1, identicalState: true`. Die Shell mit DOM-Double ersetzte anschließend bei identischem Zustand ein beschriebenes Namensfeld: `sameNode: false, value: ""`. Der bestehende Browserfall zum Entwurferhalt prüft ausschließlich die aktive Antwortansicht, nicht die Erwachsenenformulare.

**Korrektur:** Hintergrundänderungen dürfen ungespeicherte Verwaltungsentwürfe nicht ersetzen. Transportbenachrichtigungen von fachlich nötiger Darstellung trennen und/oder Entwürfe mit ihren ursprünglichen `expectedHeads` erhalten. Bei echter fremder Änderung den Entwurf bewahren und den vorhandenen Stale-/Konfliktschutz verwenden; keine heimliche Aktualisierung seiner Bearbeitungsbasis. Fokus und geöffnete Bearbeitungsbereiche ebenfalls erhalten. Gezielte Regression für einen unveränderten Sync und eine fremde Inhaltsänderung während Wortbearbeitung beziehungsweise Tabellenpaste ergänzen. Nur das Auslassen identischer Commits reicht für fremde Änderungen noch nicht aus.

#### I3 — Erfolgreiches erneutes Google-Verbinden weckt den angehaltenen Abgleich nicht

**Fundstellen:** [ui/sync.js](../../src/trainer/ui/sync.js), Zeilen 88–94; [main.js](../../src/trainer/main.js), Zeilen 87–96 und 249–279; [scheduler.js](../../src/trainer/sync/scheduler.js), Zeilen 53–70. Anforderung: R12/R28.

Nach `auth` beendet der Scheduler den Lauf ohne weiteren Timer, was zur Vermeidung automatischer Anmeldeschleifen richtig ist. Die erfolgreiche bewusste Wiederanmeldung setzt anschließend jedoch nur `ui.connected` und den Meldungstext. Weder `auth.connect()` noch sein UI-Erfolgsweg starten den Scheduler oder einen Abgleich erneut. Bei sichtbarer App ohne weiteres Sichtbarkeits-/Online-/Command-Ereignis bleiben bereits ausstehende Änderungen deshalb liegen; erst „Jetzt abgleichen“ oder eine spätere andere Aktion setzt sie fort. R28 verlangt den automatischen Abgleich nach erneuter Verbindung bei geöffneter App und Internet.

**Evidenz:** Im fokussierten Scheduler-Repro endete der erste Authfehler mit `calls: 1, pendingTimers: 0`. Das anschließende Erneuern der synthetischen Berechtigung ohne zusätzlichen Lebenszyklustrigger ließ beide Werte unverändert. Der fehlende Trigger ist im vollständigen Erfolgsweg der UI und Auth-Anbindung sichtbar. Ein zufälliger Fokus-/Sichtbarkeitswechsel beim OAuth-Fenster ist kein verlässlicher Ersatz für diese Kopplung.

**Korrektur:** Nach erfolgreich abgeschlossener, weiterhin zulässiger bewusster Verbindung den bestehenden Scheduler ausdrücklich wieder anstoßen. Bei schon gebundenem Bestand ausstehende Daten automatisch verarbeiten und normales Polling fortsetzen. Ungebundene Bestände dürfen dadurch nicht automatisch angelegt oder ausgewählt werden; Authfehler dürfen weiterhin keine selbsttätigen OAuth-Dialoge öffnen. Integrationstest: gebundener Bestand mit ausstehenden Änderungen, Authfehler, erneutes Verbinden, ohne weiteren Klick oder Sichtbarkeitswechsel genau einmal übertragen und normalen Zeitplan wieder aufnehmen.

#### I4 — Epochenkonflikt wird als verschwundenes Profil behandelt und löscht die offene Eingabe

**Fundstellen:** [shell.js](../../src/trainer/ui/shell.js), Zeilen 292–303; [practice.js](../../src/trainer/ui/practice.js), Zeilen 40–61; [epochs.js](../../src/trainer/model/epochs.js), Zeilen 23–35. Vertrag: [Produkt-Datenformat](../PRODUKT-DATENFORMAT.md), Abschnitte „Sicherung, Epochen und Rückkehr alter Geräte“ und „Implementierte Task-10-Schnittstellen“ (Zeilen 172 und 196).

Bei zwei Restoreköpfen liefert die Projektion absichtlich keine aktiven Profile. Die Shell unterscheidet diesen vorläufigen Zustand nicht von einem archivierten oder entfernten Profil: Sie setzt das aktive Profil und die laufende Ansicht zurück und ersetzt das Eingabefeld durch eine leere Profilauswahl. Der noch nicht abgesendete Text geht dabei sofort verloren. Der Datenvertrag verlangt ausdrücklich, bei Epochenkonflikt den lokalen Eingabezustand bis zur Klärung zu erhalten und ihn erst nach der Klärung ohne Wertung zu verwerfen. Der Commands-Pfad bewahrt zwar die lokale Runde während des Konflikts, die Darstellung hebt diesen Schutz auf.

**Evidenz:** Der gezielte Shell-Kontrollfluss mit DOM-Double wechselte nach Hinzufügen zweier konkurrierender Köpfe von einer offenen Antwort zur Profilauswahl: `answerInputPresent: false, profilePickerPresent: true`. Dies ist ein isolierter Kontrollflusstest, keine vollständige Drive-/Browserreproduktion. Der Quellpfad ist unabhängig vom Transport: `epochConflict` → leere Entitäten → Profil-invalid-Zweig. Gespeicherte Antwortereignisse bleiben erhalten; betroffen ist die offene lokale Eingabe.

**Korrektur:** Den Epochenkonflikt vor der normalen Profilinvalidierung behandeln, Wertung und neue Runden sperren, Konflikt verständlich anzeigen und die lokale Eingabe bis zur bewussten Auflösung erhalten. Nach eindeutiger neuer Epoche alte Runde ohne Bonus beenden und den Entwurf gemäß Vertrag verwerfen. Die bereits geprüfte Reaktion auf tatsächlich archivierte/entzogene Profile erhalten. Gezielt während einer offenen Antwort zwei gültige Restoreköpfe empfangen, Textschutz/Sperre und anschließende Auflösung prüfen.

### Minor

Keine zusätzlichen Minor-Befunde als eigene Korrekturaufträge. Die im Ledger früher verschobenen Punkte zu Erschöpfungstext, Avatarfokus, Statusformatierung, ungebundenen Authfällen, Vorschautexten und Profilweiterleitung sind im aktuellen Code beziehungsweise den gezielten Nachweisen behandelt. Bekannte noch zu aktualisierende Abschluss-/Übergabemetadaten gehören zur angekündigten Finalisierung nach dieser Review und sind kein neuer Produktbefund.

## Empfehlungen und Branchbewertung

Die vier Befunde in einer gemeinsamen Fixwelle korrigieren und anschließend genau diese Änderungen unabhängig nachprüfen. Die bestehenden Gesamtprüfungen nicht durch die gezielten Repros ersetzen; nach Produktänderungen die passenden aktuellen Regressionen einschließlich Cacheversion und realem synthetischen Offline-/Updatepfad nach Projektregel ausführen.

Die Modulaufteilung ist grundsätzlich sinnvoll. Die größeren Commands-, Sync- und Browserdateien sind durch ihre zusammenhängenden Zustandsübergänge begründet; allein ihre Zeilenzahl rechtfertigt keinen Umbau. Für die jetzigen Korrekturen ist eine klare Trennung von fachlicher Zustandsänderung, Transportstatus und flüchtigem UI-Entwurf wichtiger als eine breite Dateiaufteilung. Keine neue Persistenz-/Frameworkschicht allein zur Behebung der Renderverluste einführen.

**Ready to merge: With fixes.** Die persistente Lern- und Synchronisationsarchitektur ist gründlich abgesichert, aber vier Lücken in den tatsächlichen Nutzerwegen verhindern die interne Freigabe des vorliegenden HEAD. Nach deren gezielter Korrektur und Nachprüfung kann der Branch technisch freigegeben werden; echte Produkt-Google-/Zwei-Geräte-/Apple-/HTTPS-Nachweise sowie Hosting-, Lizenz- und Veröffentlichungsentscheidungen bleiben davon getrennt offen.
