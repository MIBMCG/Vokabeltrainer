# Task 3 – Korrekturrunde 2 für Recoverynachweise

Datum: 26.09.2026. Ausgangspunkt: `0b359d8` auf
`codex/vokabeltrainer-v1`. Maßgeblicher Befund:
R3-4 aus der [Nachprüfung der ersten Korrekturrunde](2026-09-26-persistent-purchases-task3-fix1-review.md).

## Ergebnis

Die begrenzte Nacharbeit verändert ausschließlich den Recoverytest und diesen
Bericht. Produktcode, Protokollvertrag, Controllerdokumente und Laufzeitmodule
bleiben unverändert. R3-1 bis R3-3 wurden nicht erneut bearbeitet.

Das Transportdouble bildet die für den Pointer entscheidende Bindung jetzt
selbst ab: Es nimmt den tatsächlich vom Dienst übergebenen Snapshot entgegen,
protokolliert ihn getrennt von der gespeicherten Autorisierung und verwirft
abweichende Snapshot-ETags. Zusätzlich bindet es Phase, Kandidatenreferenz und
Kandidateninhalt. Damit können Assertions nicht mehr irrtümlich nur die Werte
aus dem Mockauftrag statt die wirkliche Dienstübergabe bestätigen.

Für Kauf, Initialisierung und Restore sind nun je zwei mehrteilige
Closureabbrüche vorhanden:

- Der zweite Immutable-Upload scheitert vor dem serverseitigen Speichern,
  nachdem das erste Closureelement bereits gespeichert wurde.
- Der zweite Immutable-Upload wird serverseitig gespeichert; nur seine Antwort
  geht verloren.

Nach jedem Abbruch entsteht ein vollständig neuer Store-, Transport-,
Commands-, Service- und Syncaufbau. Die Wiederaufnahme arbeitet allein mit dem
gespeicherten ursprünglichen Auftrag. Geprüft werden Kandidatenreferenz,
vollständige Uploadclosure, tatsächliche Upload-IDs und Uploadinhalte. Bereits
gespeicherte Dateien werden nur unter derselben ID und demselben Hash erneut
angenommen. Der fehlgeschlagene `reserved`-Save eines Kaufs prüft außerdem
ausdrücklich, dass anschließend kein Immutable-Upload und kein Pointer-PUT
erfolgt.

Der vorhandene Punktefall ist zu einer vollständigen versionierten Regression
erweitert: 300 Ausgangspunkte, erster Kauf über 200 Punkte, zehn weitere
richtige Antworten und ein gültiger Rundenabschluss ergeben 420 verdiente und
220 verfügbare Punkte. Ein zweiter Kauf über 200 Punkte wird bestätigt. Nach
vollständigem Neustart stehen 420 verdiente, 400 ausgegebene und 20 verfügbare
Punkte sowie beide Artikel im Besitz; es gab genau zwei Pointer-PUTs.

## RED- und Mutationsnachweis

Vor der Härtung des Doubles wurde der vom Dienst übergebene Snapshot unmittelbar
vor dem Double auf `"WRONG-ETAG"` verändert:

```text
node --test --experimental-test-isolation=none \
  --test-name-pattern="pointer transport double rejects" \
  tests/trainer/purchases-recovery.test.js
```

Ergebnis: **0/1 bestanden, 1 fehlgeschlagen**, Exit 1. Die erwartete
`binding`-Ablehnung blieb aus (`Missing expected rejection.`). Damit war die
vom Review beschriebene Prüfblindheit reproduziert.

Nach der Härtung desselben Doubles bestand derselbe Fokus mit **1/1**, Exit 0.
Der Test prüft zusätzlich, dass das Double wirklich `"WRONG-ETAG"` empfangen
hat und dass dieser Wert von der gespeicherten Autorisierungs-ETag abweicht.

## Prüfungen

Der erste vollständige Recoverylauf nach Ergänzung der Matrix ergab **56/57**,
Exit 1. Ausschließlich die neue Bonusfixture war ungültig, weil ihre
`answerIds` nicht kanonisch sortiert waren (`invalid: Eine ID-Liste ist
ungültig.`). Nach Sortierung der Fixture bestand der Lauf; dies war kein
Produktfehler und führte zu keiner Produktänderung.

Final frisch ausgeführt:

```text
node --test --experimental-test-isolation=none \
  tests/trainer/purchases-recovery.test.js
```

Ergebnis: **57/57 Tests bestanden**, 0 fehlgeschlagen, Exit 0,
Gesamtdauer 17.526,814 Millisekunden.

Nach Erstellung dieses Berichts wurden außerdem ausgeführt:

```text
npm run check:docs
git diff --check
```

`npm run check:docs` prüfte 1164 Dateien, 207 Markdowndateien und 934 lokale
Links mit **0 Fehlern**, Exit 0. `git diff --check` blieb ohne Ausgabe und endete
mit Exit 0. Ein vollständiger Produkttestlauf wurde für diese reine
Testharnesskorrektur bewusst nicht wiederholt.

## Aussagegrenzen

Die Tests verwenden ausschließlich synthetische Daten und einen simulierten
Server. Sie belegen Wiederaufnahme, gespeicherte Identität und
Pointerautorisierung des Task-3-Dienstes, aber keinen echten Google-Drive-Lauf,
keine Browser- oder Zwei-Geräte-Abnahme und keine Task-4-Portintegration. Die
Task-4-Candidate- und Abschlussports bleiben synthetische Testports. Es wurden
keine echten Profile, Tokens oder Browserdaten verwendet und nichts gepusht.
