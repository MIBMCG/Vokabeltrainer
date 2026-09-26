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
- Backupvorschau enthält wirtschaftliche Änderungen; Worker `v24`.

## Nachweise

- Kaufbrowser nach Fixrunde `6/6`, 0 Fehler, 33,09 s.
- Fokussierte UI-/Service-/Restore-/Worker-/Serverprüfungen: 127 Tests,
  0 Fehler, 45,06 s.
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

## Fixrunde 1 nach unabhängiger Prüfung

Fixcommit: `ae9ef27a940a341ce2b26bc2edb1124f4d2cc3c4`.

- R5-1: `renderPurchases` verfolgt den aktuell verbundenen Root über den
  stabilen App-Eigentümer. Initiales Laden, Auswahl und Kaufbestätigung enden
  ohne Zusatzklick; Fokus liegt verbunden in der Tabnavigation. Ein später
  Callback rendert nur bei weiterhin aktiver Avataransicht und bewahrt offene
  Erwachseneneingaben.
- R5-2: `previewActivation()` liefert Ticket und minimales `previewState` aus
  demselben Commands-Stand. Die Restore-Economy wird erst nach
  `restore.prepare` aus dem frisch abgeglichenen Zustand berechnet.
- R5-3: Bestätigte Restores übernehmen die validierte Auswahl atomar und
  vollständig, auch `[]`. Alte Backups ohne Economy leeren die Auswahl. Ein
  älterer wiederaufgenommener Restore überschreibt keinen später bestätigten
  Restorekopf.
- R5-4: Eine Grundform gilt nur bei Stufe 1 als ausgewählt.
- R5-5: Die Dokumentation nennt korrekt `confirm(preview)` und getrennt
  `resume(operationId)`.

RED: dauerhafter Ladezustand, Ada 0 statt aktueller 1.600 Punkte, beibehaltene
Zielauswahl `explorer-boy` statt Backupauswahl `explorer-girl` sowie 0 statt 1
gezählte Auswahlentfernung. GREEN: Kaufbrowser 6/6; fokussierte Nodegruppe
127 Tests; Worker-/Offline-/Updatefälle 3/3; jeweils 0 Fehler. Vollständige
Details: `docs/reports/2026-09-27-persistent-purchases-task5-fix1.md`.
