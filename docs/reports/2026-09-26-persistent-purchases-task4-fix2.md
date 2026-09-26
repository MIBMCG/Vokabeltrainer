# Dauerhafte Käufe – Task 4, Korrekturrunde 2

Stand: 26.09.2026

Die zweite Nachprüfung bestätigte die Restore-Wiederaufnahme und die Behandlung
abgeschlossener Journale. Offen blieb die Autoritätsgrenze des Produktdownloads:
Nach einer fehlgeschlagenen Kopflesung konnte derselbe Sync eine bekannte
v3-Datei überspringen und dadurch eine später eintreffende v2-Epoche aktivieren.

Die Kaufentdeckung ist deshalb in zwei dauerhafte Schritte getrennt:

1. `commerce.discover({state,binding,descriptorHash})` prüft den installierten
   Configref samt Config und gibt den verankerten Produktzustand zurück, ohne den
   Koordinator oder Kaufkopf zu lesen.
2. ProductSync speichert diesen Anker über Commands, bevor es Produktdateien
   herunterlädt. Neu gelesene Epochen bleiben damit inaktive Herkunft.
3. `commerce.reconcile(...)` liest danach Koordinator, Kopf und vollständige
   Historie. Erst dieser geprüfte Stand aktiviert eine Epoche atomar.

Der gespeicherte Configanker bleibt über fehlgeschlagene Kopflesungen,
Metadatencache-Sprünge und Prozessneustarts erhalten. Die Beitrittsvorschau
überträgt den dort geprüften Commercezustand zusammen mit Ledger und bekannten
Dateien. Ein Bestand ohne Configanker und ohne v3-Kandidat verwendet weiterhin
den bisherigen Legacy-Sync.

## Testgetriebene Belege

Vor der Korrektur reproduzierte der erweiterte echte Sync-Test den verbliebenen
Fehler:

```text
node --test --experimental-test-isolation=none \
  --test-name-pattern="commerce epochs remain inactive" \
  tests/trainer/sync.test.js
# 0/1; aktive Epoche late-v2 statt e0

node --test --experimental-test-isolation=none \
  --test-name-pattern="commerce discovery persists" \
  tests/trainer/purchases-integration.test.js
# 0/1; integration.discover is not a function
```

Nach der Korrektur:

```text
node --test --experimental-test-isolation=none \
  --test-name-pattern="commerce epochs remain inactive" \
  tests/trainer/sync.test.js
# 1/1

node --test --experimental-test-isolation=none \
  --test-name-pattern="commerce discovery persists|empty second device discovers" \
  tests/trainer/purchases-integration.test.js
# 2/2

node --test --experimental-test-isolation=none \
  --test-name-pattern="join staging transfers" tests/trainer/sync.test.js
# 1/1

node --test --experimental-test-isolation=none \
  tests/trainer/sync.test.js tests/trainer/purchases-integration.test.js
# 48/48, 0 Fehler, 4.199 s

npm run check:docs
# 1196 Dateien, 214 Markdown, 945 lokale Links, 0 Fehler
```

Der Mehrlauf-Test deckt zwei fehlgeschlagene Kopflesungen, eine dabei
übersprungene bekannte v3-Datei, eine neue späte v2-Epoche, einen vollständigen
Neustart und die spätere atomare Aktivierung des bestätigten Kopfes ab. Der
Beitrittstest verwendet den tatsächlichen Scratch-Produktabgleich, überträgt den
Configanker und hält eine danach eintreffende v2-Epoche inaktiv. Es wurden keine
echten Cloudobjekte geschrieben, keine Produktionsabhängigkeiten installiert und
keine Änderungen an UI, v2-Quellen oder den bereits korrigierten R4-2/R4-3-Pfaden
vorgenommen.
