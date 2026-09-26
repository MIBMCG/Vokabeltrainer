# Task 5 – Oberflächenbindung dauerhafter Käufe

Status: implementiert und fokussiert geprüft.

Implementierungscommit:
`4eac7217e7205da3429d909648e5057497b81b83`.

## Gelieferter Vertrag

- Expliziter `commerce`-Port durch Main, Shell, Erwachsenen-, Einstellungs-,
  Backup- und Avataransicht; keine UI-eigene Guthabenautorität.
- Rein lokale Elternvorschau vor `prepareActivation`/`confirmActivation`.
- Gemeinsamer exportierter `purchasePreviewStateHash(state)` für Service und
  Aktivierungsvorschau; vollständiger `productStateHash`-CAS unverändert.
- Profilgetrenntes bestätigtes Guthaben, Besitz, Auswahl, ehrlicher unbekannter
  Ausgang und ausdrückliche Wiederaufnahme.
- Drei oben erreichbare Avatarbereiche; klassischer Avatar vollständig
  erhalten. Ausgewählte Drachenform bleibt nach Offline-Neustart sichtbar.
- Vier freigegebene Drachen-PNGs unverändert ausgeliefert und precached;
  übrige 72 Motive ehrlich nicht verfügbar.
- Backupvorschau enthält wirtschaftliche Änderungen; Worker `v23`.

## Nachweise

- Kaufbrowser `3/3`, 0 Fehler, 57,98 s.
- Fokussierte UI-/Service-/Restore-/Worker-/Serverprüfungen: 126 Tests,
  0 Fehler, 50,4 s.
- Letzter korrigierter Elternvorschau-Harnessfall: `1/1`, 0 Fehler, 2,85 s.
- Bestehende fokussierte Avatar-, Pflicht-Precache- und
  Offline-Workerupdate-Fälle grün.
- Alle geänderten JavaScript-Dateien syntaktisch geprüft; `git diff --check`
  ohne Befund.

Der reale Browserfall nutzt 1.600 durch Lerncommands verdiente synthetische
Punkte und prüft Kauf, Neustart, Offlinebesitz, Offline-Kaufsperre,
Profiltrennung, veraltete Vorschau sowie verlorene Antwort mit ausdrücklicher
Wiederaufnahme. Bildschirmbelege liegen versioniert unter
`docs/reports/assets/2026-09-27-persistent-purchases-task5/`.

Der portable Detailbericht steht in
`docs/reports/2026-09-27-persistent-purchases-task5-implementation.md`.

## Offen außerhalb Task 5

Keine Live-Google-, Zwei-Geräte-, Hosting- oder echte iPhone/iPad-Abnahme.
Die 390-Pixel-Ansicht ist eine Edge-Simulation. Keine responsive Bildpipeline
und keine vollständige Galerie; vier Original-PNGs bleiben mit etwa 1,5–2,1 MB
je Datei vorläufige Auslieferungsassets. Die vollständige frische Paketsuite
ist für das zentrale Task-6-Gate vorgesehen.
