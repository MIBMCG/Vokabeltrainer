# Dauerhafte Käufe – Task 5: Oberflächenanbindung

## Ergebnis

Task 5 bindet den in Task 1–4 geprüften Kaufdienst an die reale Oberfläche.
Die Erwachsenenansicht zeigt zuerst eine rein lokale, konkrete Vorschau. Erst
die ausdrückliche Bestätigung ruft die dauerhafte Vorbereitung und Aktivierung
auf. Die Lernendenansicht zeigt bestätigtes Guthaben, Besitz, Auswahl und offene
Kaufversuche getrennt je Profil. Lernpunkte und Level bleiben beim Ausgeben
unverändert.

Implementierungscommit:
`4eac7217e7205da3429d909648e5057497b81b83`.

## Tatsächliche Ports

`main.js` reicht einen expliziten `commerce`-Port durch Shell,
Erwachsenenansicht, Einstellungen, Backup und Avatarbereich:

```text
previewActivation() -> {stateHash,binding,descriptorHash}
activate(ticket) -> Serviceergebnis
getView(), refresh(), preview(input), confirm(operationId),
resume(operationId), select(input)
```

`previewActivation` liest nur den lokalen Zustand. `activate` prüft den
Vorschau-Fingerprint erneut und ruft danach
`prepareActivation`/`confirmActivation` des bestehenden Dienstes auf. Sämtliche
Netzaufrufe laufen durch die vorhandene Authentifizierungsgrenze; ein
abgelaufenes Token wird verworfen. Es gibt keine zweite Kaufwarteschlange und
keine globale UI-Autorität.

Der zuvor private Fachfingerprint ist als
`purchasePreviewStateHash(state)` aus `purchases/service.js` exportiert. Dienst
und Aktivierungsvorschau verwenden damit dieselbe Bindung an Ledger,
Kaufkonfiguration, Kopf, Jobs und Auswahl. Reine laufende
Uploadbuchhaltung entwertet die Vorschau nicht. Der vollständige
`productStateHash` für dauerhafte CAS-Schreibvorgänge blieb unverändert.

## Oberfläche und Verhalten

- „Meine Figur“, „Entwicklung“ und „Shop“ stehen oben im Avatarbereich. Der
  vollständige klassische Avatar bleibt darunter aufklappbar erhalten.
- Eine ausgewählte bezahlte Drachenform erscheint als große Figur und bleibt
  nach Schließen, Neuöffnen und Offline-Neustart sichtbar.
- Ein bestätigter Kauf verringert nur „Verfügbare Punkte“. Die weiterhin
  sichtbaren Lernpunkte und das Level ändern sich nicht.
- Ein unbekannter Netzausgang heißt „Kauf wird geprüft“ und bietet ausdrücklich
  „Kauf fortsetzen“. Ein veralteter Kaufvorschlag bleibt offen und verlangt
  eine neue Prüfung.
- Fehler beim Erstellen einer Kaufvorschau, einschließlich abgelaufener
  Anmeldung oder fehlendem Netz, werden sichtbar erklärt.
- Die Backupvorschau zeigt verfügbare Punkte, bestätigte Käufe und geänderte
  Figurenauswahlen. Alte Backups werden ehrlich als ohne Kaufhistorie benannt.
- Workerkennung `v23`, Server-Allowlist und Pflicht-Precache enthalten die neue
  UI und alle vier ausgelieferten Bilder. Googleantworten und Token werden nicht
  gecacht.

## Bildumfang

Die vier bereits freigegebenen transparenten PNG-Quellen wurden unverändert in
`trainer/assets/avatar-evolution/` kopiert:

| Datei | Bytes | SHA-256 |
| --- | ---: | --- |
| `dragon-stage-1.png` | 1.542.919 | `76ebab873f68d43c4b6cc31834ee24c1e20d351e89b8b8af71f61b5c45ecf907` |
| `dragon-stage-2.png` | 1.582.909 | `5e2aad5ab188c8a31695d30a0fa9c64b84d435257822f63f563a316f8b71d29c` |
| `dragon-stage-3.png` | 1.720.004 | `f94f2b962e8360e9443211628bb32119c17113f73b1d72cc1662af5db6af1a96` |
| `dragon-stage-4.png` | 2.052.566 | `eaafc1fa21b72fa764963b9c021ffadc93bd9055b0b48230f9e8fd5f74049afa` |

Die übrigen 72 geplanten Motive werden als noch nicht verfügbar behandelt und
können nicht gekauft werden. Es wurden keine neuen Bilder und keine
auflösungsabhängigen Varianten erzeugt.

## RED- und GREEN-Nachweise

Der erste Browser-RED erreichte die noch fehlende Kaufoberfläche nicht; ein
alter Sync-Wartepunkt des Harness blockierte vorher und wurde getrennt
korrigiert. Der reale Aktivierungsfall zeigte danach reproduzierbar eine
veraltete Vorschau, obwohl nur ausstehende Uploadbuchhaltung fortgeschritten
war. Der gemeinsame Fachfingerprint behob diesen Laufzeitfehler, ohne die
fachliche CAS-Sicherung zu lockern. Weitere REDs fanden das Überschreiben eines
zu früh in IndexedDB gesetzten Lernfixtures sowie eine zu frühe Dialogaktion;
das Fixture wird nun vor der ersten Bindung über echte Lerncommands erzeugt,
und der Test wartet auf den tatsächlichen Dialog.

Ausgeführte fokussierte Prüfungen:

```text
PLAYWRIGHT_MODULE=<vorhandenes Playwright> BROWSER_EXECUTABLE=<Edge> \
node --test --experimental-test-isolation=none tests/browser/purchases.browser.mjs
# 3/3, 0 Fehler, 57,98 s

node --test --experimental-test-isolation=none \
  tests/trainer/purchases-view.test.js \
  tests/trainer/purchases-recovery.test.js \
  tests/trainer/purchases-integration.test.js \
  tests/trainer/reward-view.test.js tests/trainer/backup.test.js \
  tests/trainer/restore.test.js tests/trainer/sw.test.js tests/serve.test.js
# 126 Tests, 0 Fehler, 50,4 s

node --test --experimental-test-isolation=none \
  --test-name-pattern='parent sees a local upgrade preview' \
  tests/browser/purchases.browser.mjs
# 1/1, 0 Fehler, 2,85 s (nach letzter Harnesskorrektur)

node --check <alle geänderten JavaScript-Dateien>
git diff --check
# beide ohne Befund
```

Zusätzlich blieben die bestehenden fokussierten Avatar-, Pflicht-Precache- und
Offline-Workerupdate-Browserfälle grün. Die vollständige frische Paketsuite
läuft vereinbarungsgemäß einmal zentral in Task 6.

Der große Browserfall erzeugt 1.600 Punkte ausschließlich aus gültigen
synthetischen Lerncommands, aktiviert den Kaufdienst, kauft Stufe 2, schließt
und öffnet die App, prüft 1.400 verfügbare Punkte bei unverändert 1.600
Lernpunkten, verwirft eine fachlich veraltete Vorschau, setzt einen Kauf mit
verlorener Antwort ausdrücklich fort und sieht Stufe 3 anschließend offline.
Offline ist Stufe 4 nicht kaufbar. Ein zweites Profil besitzt weder Guthaben
noch die Auswahl des ersten Profils.

## Bildschirmbelege

- [Desktop – bestätigter Besitz](assets/2026-09-27-persistent-purchases-task5/desktop-owned.png)
- [Desktop – ausgewählte Figur](assets/2026-09-27-persistent-purchases-task5/desktop-selected-figure.png)
- [Mobile Simulation – bestätigter Besitz](assets/2026-09-27-persistent-purchases-task5/mobile-owned.png)
- [Mobile Simulation – ausgewählte Figur](assets/2026-09-27-persistent-purchases-task5/mobile-selected-figure.png)

Die mobile Aufnahme ist eine 390-Pixel-Edge-Simulation. Sie ersetzt keine
Abnahme auf einem echten iPhone oder iPad.

## Grenzen

Nicht ausgeführt wurden Live-Google-Drive-, Zwei-Geräte-, Hosting- oder echte
Apple-Geräte-Prüfungen. Die Browserläufe verwenden isolierte synthetische
Profile und einen lokalen Drive-Ersatz; sie enthalten keine realen Konten,
Token oder Lernprofile. Die vier großen Original-PNGs sind eine vorläufige
Auslieferung, keine fertige responsive Galerie.
