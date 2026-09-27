# Dauerhafte Käufe und Avatarentwicklung – Abschlussbericht

Stand: **27.09.2026**

## Ergebnis

Das bestätigte Kaufpaket Tasks 1–6 ist umgesetzt. Die unabhängige Gesamtprüfung
und ihre gezielten Nachprüfungen schließen alle sechs Abschlussbefunde.
Auf Produktcommit `1e29ac35252fe04f049b511f5f443fdcf41fd69e` bestehen frisch
**506/506 Node-Tests und 43/43 Browserfälle**. Der Produktcommit wurde auf
`origin/codex/vokabeltrainer-v1` gepusht und mit `git ls-remote` exakt bestätigt.
Dieser Dokumentationsabschluss folgt darauf auf demselben Zweig. Kein Merge
nach `main` und keine Hostingveröffentlichung wurden vorgenommen.

## Umgesetzte Bedienung

- Erwachsene bereiten unter „Einstellungen → Figuren und Käufe“ die
  Datenaktualisierung vor. Die Vorschau ist lokal; erst „Aktualisierung jetzt
  durchführen“ startet die dauerhaft vorbereitete Veröffentlichung.
- Eine unterbrochene Einrichtung oder ein unklarer Kauf lässt sich über die
  jeweilige Fortsetzenaktion mit demselben gespeicherten Auftrag wiederaufnehmen.
- „Meine Figur“, „Entwicklung“ und „Shop“ zeigen profilgetrennt verfügbares
  Guthaben, Besitz und Auswahl. „Klassischen Avatar gestalten“ bleibt darunter
  aufklappbar. Vorhandener Besitz ist offline auswählbar; neue Käufe benötigen
  Internet und einen erfolgreichen Abgleich.
- Lernpunkte und Level bleiben beim Ausgeben erhalten: 10 Punkte je richtiger
  Antwort und 20 je abgeschlossener Runde. Entwicklungsstufen kosten
  nacheinander 200/400/800 Punkte.
- Neben den vorhandenen Grundfiguren sind vier bestätigte Drachenbilder als
  erste vollständige Entwicklungsreihe eingebunden. Fehlende Motive werden
  nicht als fertige kaufbare Illustration angeboten.
- Sicherungen erfassen beim Klick den aktuellen Lern- und Wirtschaftsstand.
  Ändert sich eine offene Konflikt-Kopfmenge, ist eine neue bewusste Auswahl
  erforderlich. Wiederherstellung übernimmt bestätigten Besitz und Auswahl,
  einschließlich entfallener Rechte.

## Daten- und Laufzeitgrenzen

Neue Lernereignisse und Pakete bleiben v2; `storageVersion:3` bezeichnet den
lokalen Zustand. Aktivierte Kaufepochen und portable wirtschaftliche Backups
verwenden v3. Die 22 eingefrorenen v2-Quelldateien bleiben unverändert.

Commands bleibt der einzige atomare Schreiber. Aufträge, vollständige
Uploadclosure, Kandidaten, Datei-IDs und Pointerdaten werden vor abhängigen
Netzoperationen gespeichert. Unbekannte Pointerausgänge werden zuerst gelesen;
eine Wiederholung erfolgt nur ausdrücklich mit den gespeicherten Daten.
Auch direkter Control-Resume wahrt die bestätigte Einrichtungsgrenze.

ProductSync speichert die validierte Config vor dem Download und übernimmt nur
den vollständig geprüften gemeinsamen Kopf. Die langlebige Serviceinstanz
koppelt ihre Historie an Kopf, Binding und Config. Aktuelle Lernfakten bestimmen
freie Levelrechte, bestätigte Belege die Ausgaben und bezahlten Rechte.

Backups enthalten vollständige wirtschaftliche Herkunft, keine Tokens, ETags
oder ausführbaren Jobs. Ein neutraler Offline-Checkpoint ist ausschließlich
im Backupexport und Quellreplay zulässig; die autoritative Zielkette lehnt ihn
als Kopf und Vorgänger ab. Fremde Herkunft bleibt über ein gehashtes
logisch/physisches Proofmanifest auf leeren Geräten wiederherstellbar.

Produktcache ist `v25`; die synthetische Updateprobe verwendet `v26`.
Allowlist und Pflicht-Precache enthalten die neuen Module und vier Drachen-PNGs.
Google-Antworten und Tokens werden nicht gecacht. Die vier unveränderten PNGs
belegen 6.898.398 Bytes; kleinere responsive Varianten folgen separat.

## Frische Prüfbelege

Alle folgenden Produktläufe beziehen sich auf den unveränderten Abschlusscode
`1e29ac3`, nicht auf einen früheren Zwischenstand:

| Prüfung | Ergebnis | Laufzeit |
| --- | --- | --- |
| `npm test` | 506/506 bestanden, 0 Fehler | 81,104 s |
| vollständige Trainer-, Überarbeitungs- und Kaufbrowserfälle | 43/43 bestanden, 0 Fehler | 152,227 s |
| unabhängige Nachprüfung der letzten beiden Reste | Spec PASS, Qualität PASS; alle RF-Befunde geschlossen | Bericht unten |

Browserbefehl mit vorhandener Playwright-Laufzeit und System-Edge:

```sh
node --test --experimental-test-isolation=none tests/browser/trainer.browser.mjs tests/browser/overhaul.browser.mjs tests/browser/purchases.browser.mjs
```

Die Browserprüfung umfasst tatsächliche synthetische Lernpunkte, Kauf und
Auswahl, Profiltrennung, Neustart/Offlinebesitz, verlorene Antworten,
Wiederherstellung, bewahrte Erwachsenenansicht, mobile Darstellung und
kontrollierte Workerupdates. I3 hält einen Dateiread nach der Kontoabfrage an,
belegt den noch ausstehenden Abgleich und prüft erst nach dessen vollständigem
Abschluss leere Queues, Ereigniseinmaligkeit und unveränderte Writezahl.

`npm run check:docs` prüfte abschließend 1221 Dateien, davon 228 Markdown-
Dateien und 850 lokale Links, ohne Fehler. `git diff --check` ist sauber.
Die 33 bestätigten R-Anforderungszeilen sind unverändert. Automatisierte Tests
verwenden ausschließlich synthetische Daten und eine simulierte Google-Grenze.

## Unabhängige Prüfung und Korrekturen

1. [Gesamtprüfung](2026-09-27-persistent-purchases-final-review.md) des Pakets
   `f54bd5d..18e989c`: RF-1 bis RF-6 dokumentiert.
2. [Gemeinsame Fixwelle](2026-09-27-persistent-purchases-final-fix.md),
   Produktcommits `7fe16e7` und `6b7e281`, Berichtstand `f02781a`.
3. [Scoped Nachprüfung](2026-09-27-persistent-purchases-final-fix-review.md):
   RF-1/2/3/5 geschlossen, enge Reste RF-4/RF-6 reproduziert.
4. [Enger Nachtrag](2026-09-27-persistent-purchases-final-residual-fix.md) auf
   `1e29ac3`: Schutz des direkten Control-Resume und vollständiger Pollabschluss.
5. [Abschließende Nachprüfung](2026-09-27-persistent-purchases-final-residual-review.md):
   RF-4/RF-6 geschlossen, Spec und Qualität PASS. Keine offenen RF-Befunde.

Umsetzung: GPT-5.6 Sol, Denktiefe high. Unabhängige Prüfung: GPT-6 Astra,
Denktiefe high. Die 15 transparenten
[Ausführungsentscheidungen](2026-09-27-persistent-purchases-entscheidungen.md)
enthalten auch Kosten und Grund des engen Nachtrags nach dem ursprünglichen
Finalwellenlimit. Es gab keine zweite breite Gesamtprüfung.

Die früheren roten Browserläufe und ihre Korrekturen bleiben historische
Belege. Die konkrete Ursache des ursprünglichen Duplicate-Booleans ist nicht
nachträglich bewiesen; erlaubte identische Retries sind keine doppelte
Punktewertung. Die neue I3-Prüfung misst den tatsächlichen Abschlussvertrag.

## Git und portable Fortsetzung

- Branch: `codex/vokabeltrainer-v1`.
- Planbasis: `f54bd5d42762959c8c2dd8b2f746d417c0706706`.
- Finaler Produkt-/Testcommit und exakt bestätigter Remoteproduktstand:
  `1e29ac35252fe04f049b511f5f443fdcf41fd69e`.
- Der nachfolgende Dokumentationscommit ergänzt diese Belege, die
  Bedienungsanleitung und Übergabe. Sein Hash steht im Gitprotokoll des gleichen
  Zweigs; der abschließende Push wird erneut gegen den lokalen HEAD geprüft.

Einstieg: [START-HIER](../../START-HIER.md),
[Bedienungsanleitung](../BENUTZUNG.md) und
[Übergabe](../handoffs/2026-09-27-persistent-purchases-abschluss.md).
Git überträgt keine Browserdaten oder Google-Anmeldesitzungen.

## Bewusst offener Folgeumfang

- 72 weitere Avatar-/Entwicklungsmotive und ihre responsiven Bildvarianten;
- vollständige EV05-Galerie mit weiter ausgebautem Klassisch-/Entwicklungswechsel
  und zusätzlicher Fortschrittsdarstellung sowie persönlicher Sichtprüfung;
- realer Produktabgleich mit Google Drive auf zwei physischen Geräten;
- iPhone/iPad, Safari und Home-Bildschirm-App einschließlich realem Neustart;
- HTTPS-Bereitstellung, Hostingfreigabe und allgemeine Lizenzentscheidung.

Der historische echte Google-Bericht 10 mit 6/6 Szenarien bleibt ein Nachweis
der damaligen isolierten Probe. Er ersetzt keine reale Abnahme des integrierten
Produkts und wurde nicht unverändert wiederholt. Die volle App-/Galerie- und
Geräteabnahme wird mit diesem Kaufpaket nicht behauptet.
