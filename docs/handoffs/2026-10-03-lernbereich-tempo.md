# Schnellere Lernstandsübernahme – Fortsetzung am 03.10.2026

Stand dieser Übergabe: Produktcommit
`62635de092ca36ef1ca529197b08455a77a1fd87`, Cache v51, im isolierten
Arbeitsbaum `C:/Users/Marco/.codex/worktrees/purchase-batch-checks/Vokabeltrainer`
auf `codex/purchase-batch-checks` entwickelt und per Fast-Forward in
`codex/vokabeltrainer-v1` integriert, unabhängig geprüft und bei LejeAdventure
bereitgestellt. Keine neue Pause angeordnet.
Ausgangspunkt ist die [gesicherte Diagnose und frühere Pause](2026-10-02-android-tempo-pause.md).
Der Nutzer hat mit „wir können nun weiter arbeiten“ ausdrücklich fortgesetzt.

## Auftrag und Grenzen

Vorrang hat die anfängliche Übernahme eines vorhandenen Lernstands. Vorhandene
Konten, Lernbereiche, Besitz und Punkte werden weiterverwendet; Nutzerbestände
und Anbieterzugänge wurden für diese Arbeit nicht verändert. Geräte- und
Praxistests bleiben auf Nutzerwunsch verschoben. Der positive Android-Bericht
bleibt erhalten, ohne Angaben zu Gerät, Version, Browser oder Home-Bildschirm-Modus;
er belegt keine iPad-/Safari-Abnahme oder reale Übernahmedauer.

Nach den Optimierungen folgen die fünf bestätigten Belohnungsideen:
Verwandlung, Figurenbewegung, Lernreaktionen, eigener Inselort und
Steckbrief/Geschichte/Titel. Keine Wiederholung abgeschlossener Bildpakete.

## Begrenzte Produktänderung

- `src/trainer/ui/sync.js` ruft nach erfolgreich bestätigter Übernahme und
  erneuter Prüfung der entsperrten Erwachsenenansicht den bestehenden `onConnected`-Hook auf. Damit startet
  der vorhandene zusammenfassende Scheduler unmittelbar. Vorschau, Abbruch,
  Fehler und Sperrung lösen diesen Start nicht aus.
- `src/trainer/sync/drive.js` hält eine tiefe Kopie des erfolgreich geprüften
  Vorschauzustands ausschließlich im Arbeitsspeicher. Die Bestätigung prüft
  Vorschau-ID, Sicherheitskopie-ID, aktuelle Bindung, lokalen Hash und die
  verifizierte Sicherheitskopie, bevor eine weitere tiefe Kopie in eine neue
  temporäre Probe gelangt. Deren `sessionVersions` beginnen leer.
- Konto, Ordner, Descriptor/Root, Dateiliste, Lern-Dateiinhalte samt Hashes,
  Kaufkonfiguration und aktueller Kaufkopf werden frisch geprüft. Der vollständige
  entfernte Ledgervergleich und die abschließende lokale atomare Hashprüfung
  bleiben erhalten. Wiederverwendet wird bereits geprüfte unveränderliche
  Kaufhistorie; Vorschau und Probe teilen keine veränderbaren Referenzen.
- Der Ledgerhash sortiert nur die vier obersten ID-Sammlungen `events`, `epochs`,
  `snapshots` und `historicalEpochs` nach ID. Alle vollständigen Einträge und der
  Descriptor bleiben im Vergleich; verschachtelte semantische Arrays bleiben
  unverändert. Dies verhindert eine falsche Veraltung durch die reine
  Zusammenführungsreihenfolge bei einem inzwischen verifizierten neuen Kauf.
  Neue Lernereignisse und aktive Kauf-Resets werden weiterhin abgewiesen.
- Cache v50 wurde auf v51 angehoben; die vier bestehenden Browser-Versionsfixtures
  wurden entsprechend angepasst. Keine neue Abhängigkeit oder dauerhafte
  Vorschauablage.

Erfolgreiche Bestätigung verbraucht die Vorschau, eine neue Vorschau ersetzt die
vorherige, und `destroy` leert den Speicher. Eine fehlgeschlagene Bestätigung
lässt die Vorschau für einen geprüften Wiederholungsversuch bestehen. Die Probe
erzeugt keine Aufträge, Lernprämien oder Uploads.

## TDD und technische Nachweise

Die beiden zentralen Regressionen waren vor der jeweiligen Korrektur rot:
Der Browserfall ohne den bislang verdeckenden manuellen Abgleich wartete
vergeblich fünf Sekunden auf „Abgeglichen“. Die Bestätigung las dieselben drei
unveränderlichen Kaufobjekte erneut. Beide Fälle sind nach der Korrektur grün.
Ein anfängliches Edge-`EPERM` war eine Sandboxgrenze; ein zusätzlicher
PIN-Locatorfehler betraf die Testeinrichtung und wurde dort korrigiert.

- 12/12 Übernahmefälle und 2/2 Rendererfälle PASS: neue Ereignisse/Reset,
  neuer Kauf, veränderte oder fehlende Dateien, Netzfehler mit Wiederholung,
  IDs/Sicherheitskopie, lokale Änderungen und gleichzeitiger abschließender
  Commit. Die Übernahmefälle prüfen ausschließlich GET bei der Probe.
- 3/3 synthetische Edge-Fälle PASS, einschließlich wirklich leerem Erststand:
  Inhalt und Bindung innerhalb von fünf Sekunden nach Bestätigung, ohne
  manuellen Abgleich, vorgeschobene Schedulerzeit oder Google-Schreibzugriff.
- Gezielte acht Dateien: 264/264 Nodefälle PASS.
- Gesamtlauf: 679 Fälle, davon zunächst 675 PASS und vier durch Sandbox-`EPERM`
  blockiert (zwei temporäre Staging-Schreibzugriffe, zwei Prozessstarts).
  Der gezielt freigegebene Nachlauf umfasst alle vier Fälle und besteht mit
  23/23 PASS. Keine ungeklärten Testfehler; kein einzelner 679/679-Lauf behauptet.
- Synthetischer Edge-Updatefall v51→v52: 1/1 PASS. Eingabeschutz,
  zehn Punkte, Level 1 und Figur bleiben erhalten. Dies ist ein automatisierter
  Updateversuch, kein beobachtetes Live-Update des Nutzerbrowsers.
- `git diff --check` für den finalen Produktdiff einschließlich Cache-Nachtrag PASS.

## Vergleich bei künstlicher Latenz

Frischer Vorher-/Nachhervergleich desselben synthetischen Bestands mit
100 ms künstlicher Anfragelatenz; Vorherbasis `c9a21ba`:

| Phase | Vorher: Anfragen / Dauer | Nachher: Anfragen / Dauer |
| --- | ---: | ---: |
| Vorschau | 79 / 7,557 s | 79 / 7,557 s |
| Bestätigung | 79 / 7,594 s | 49 / 4,301 s |
| Unmittelbarer erster Abgleich | 38 / 3,305 s | 38 / 3,316 s |
| Gesamt ohne Suche | 196 / 18,456 s | 166 / 15,174 s |

Die Bestätigungszeit sinkt in dieser Probe um 43,4 Prozent, die Gesamtzeit um
17,8 Prozent. Suche und mögliche Scheduler-Leerlaufwartezeit sind nicht
enthalten. Der unmittelbare Start wird separat durch die Browserregression
belegt. Keine Aussage über echte Google-/Android-Zeiten oder das Wunschziel
unter zehn Sekunden. Nach der Messung änderten sich nur Cachemarker und
Versionsfixtures.

## Review, Integration und Bereitstellung

- Unabhängiges Taskreview: Spec PASS, Qualität Approved, keine Befunde.
  Vollständiger Inhalt trotz sortierter oberster ID-Sammlungen, Referenztrennung,
  frische Dateiüberprüfung und bestehender Schedulerpfad wurden geprüft.
  Kein eigener Testlauf des Reviewers; die vorhandenen RED/GREEN- und finalen
  Logs wurden eingesehen. Separates abschließendes Review des vollständigen
  Neun-Dateien-Produktstands ebenfalls PASS, keine Befunde. Keine zusätzlichen
  Reviewer-Testläufe; gezielte Prüfung der umgebenden Schema-, Kauf- und
  Schedulerpfade sowie vorhandener Ausführungsbelege.
- Integration in `codex/vokabeltrainer-v1`: Fast-Forward auf
  `62635de092ca36ef1ca529197b08455a77a1fd87` erfolgt; nur Abschlussdokumentation
  wird anschließend ergänzt. Kein abweichender Produktstand durch Integration.
- Git-Sicherung: Produkt in beiden bestehenden Zweigen integriert; diese
  Abschlussdokumentation wird ebenfalls auf beiden freigegebenen Zweigen
  gesichert. Ihre endgültige Commit-ID ergibt sich aus `git log`; nach dem
  Push beide Remote-SHAs mit `git ls-remote` exakt vergleichen.
- Bereitstellung ausschließlich im bestehenden LejeAdventure-Worker `app`:
  Version `8cc1917f-194e-4e92-a51b-916ce2915e31`, zu 100 Prozent aktiv.
  Version erstellt 03.10.2026 09:43:03.348 UTC; Deployment 09:43:04.324 UTC.
  Probelauf und Upload Exit 0. Drei neue Assets (`drive.js`, UI-`sync.js`,
  `sw.js`), 393 bereits vorhanden, insgesamt 396 öffentliche Dateien.
- Öffentliche Nachprüfung um 09:43:40.683 UTC: 396/396 Dateien bytegleich mit
  dem geprüften Paket, drei Infoseiten HTTP 200, sechs interne Pfade HTTP 404,
  anonyme Sitzung false/no-store. Alte Adresse weiterhin Cache v47.
  Reguläre Windows-Zertifikatsprüfung mit `--use-system-ca`; keine TLS-Abkürzung.
- Kontrolliertes Update und Zustandserhalt im bestehenden Browser: kein neuer
  Live-Nachweis. Geräte-/Praxistests bleiben verschoben.

## Lokale Belege für die Weiterarbeit

Im Hauptarbeitsbaum, ignorierte Arbeitsbelege:

- `.superpowers/sdd/adoption-2026-10-03/task-1-report.md`: genaue Befunde,
  Befehle, RED/GREEN und Root-Nachtrag.
- `.superpowers/adoption-2026-10-03/full-node.log`: ursprünglicher Gesamtlauf.
- `.superpowers/adoption-2026-10-03/final-focused-node.log`: gezielter Nachlauf.
- `.superpowers/adoption-2026-10-03/final-update-browser.log`: synthetischer Updatefall.
- `.superpowers/sdd/adoption-2026-10-03/task-1-review.md` und `final-review.md`:
  beide unabhängigen Reviews.
- `.superpowers/adoption-2026-10-03/baseline-100.json` und
  `.superpowers/diagnostics/2026-10-03-after/trace-100.json`: Messvergleich.
- `.superpowers/adoption-2026-10-03/deploy.log`, `deployments.log` und
  `public-verification.json`: Bereitstellung und Dateinachweis.

## Nächste Schritte

Die beiden konkret diagnostizierten Übernahmebremsen sind damit korrigiert.
Weitere Tempokorrekturen nur bei neuem Befund; Geräte-/Praxistests bleiben bis
zur passenden Nutzerfortsetzung verschoben. Als nächster Entwicklungsschritt
die fünf bestätigten Belohnungsideen konkretisieren und in begrenzten Paketen
umsetzen. Keine offenen Geräte- oder Realzeitnachweise aus den synthetischen
Ergebnissen ableiten und keine fertigen Bilder erneut erzeugen.
