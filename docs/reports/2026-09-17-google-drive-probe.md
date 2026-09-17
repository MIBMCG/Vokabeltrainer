# Prüfbericht: lokale Google-Drive-Verbindungsprobe

Stand: 17.09.2026. Geprüfte Codebasis: `230defb` auf `codex/google-drive-probe`. Dieser Bericht beschreibt die technische Probe, keinen fertigen Vokabeltrainer und keine bestandene externe Machbarkeitsprüfung.

## Ergebnis

Die lokale Probe ist ausführbar und bildet den vereinbarten synthetischen Prüfablauf ab: öffentliche OAuth-Client-ID lokal erfassen, Verbindung bewusst auslösen, markierten Probeordner erstellen oder auswählen, künstliche Antworten lokal sichern, wiederholt ohne Doppelwertung übertragen sowie einen leeren Rücksetzversuch erst nach verifizierter Sicherung veröffentlichen.

Der lokale Zustand liegt in IndexedDB. Ein eigenes Service-Worker-Paket stellt die Programmdateien nach der Erstladung offline bereit. Google-Tokens werden nicht dauerhaft gespeichert. Ein Browserprofil bleibt nach der ersten Auswahl fest an Konto und Probeordner gebunden; für einen anderen unabhängigen Bestand ist ein separates Browserprofil nötig. Innerhalb eines Profils darf nur ein Tab aktiv schreiben, damit kein lokaler Stand still überschrieben wird.

Das genaue begrenzte Format steht in [PROBE-DATENFORMAT.md](../PROBE-DATENFORMAT.md). Es ist kein freigegebenes Produkt- oder Sicherungsformat.

## Automatisierte Prüfung

Auf `230defb` wurde `npm test` mit Node.js 22.23.2 vollständig ausgeführt:

- 73 Tests bestanden.
- 0 Tests fehlgeschlagen.
- 0 Tests übersprungen.
- Exitcode 0.

Abgedeckt sind Anmeldeschicht, Drive-Dateiadapter, Pagination und Fehlerklassifikation, Ereignismodell, Deduplizierung, beschädigte Daten, stabile Datei-IDs, Konto-/Ordnerbindung, verlorene Uploadantworten, IndexedDB, Tab-Sperre, Rücksetzgraphen, eigener Service-Worker-Cache sowie die Grenzen des lokalen Servers.

Die Implementierung folgte RED/GREEN. Frühere gezielt fehlschlagende Läufe betrafen unter anderem fehlende Module, späte Antworten über mehrere Rücksetzungsgenerationen, unbekannte Persistenzfelder, fremde Origin-Caches, Ordnerwechsel, unvollständige Reset-Beziehungen und einen erst aus Snapshot plus vorbereitetem Reset sichtbaren Zyklus. Die abschließenden Fixes stehen in `e7424b5` und `230defb`.

## Browserprüfung

Der lokale Server lief über `npm start` auf `http://localhost:4173`. Das Browser-Skript nutzte Playwright 1.62.1 mit System-Edge 153.0.4234.32. Es bediente echte DOM-, IndexedDB- und Service-Worker-Pfade. Ausschließlich Google Identity Services und Drive-HTTP-Antworten wurden kontrolliert simuliert; die Live-Anwendung enthält keinen Simulationsmodus.

Neun Szenarien bestanden ohne Seitenfehler:

1. Anfangszustand ohne Client-ID und deaktivierte Folgeaktionen.
2. Probeordner erstellen, auf zweitem Kontext beitreten und Upload wiederholen.
3. Offlineantwort lokal speichern und nach Neuladen erhalten.
4. Verlorene Serverantwort mit derselben Datei-ID wiederholen.
5. Rücksetzen mit Sicherung und verspätete alte Antwort separat erhalten.
6. Falsches Konto abweisen.
7. Zweiten Tab desselben Browserprofils sperren.
8. Token nicht persistieren und keine Google-Antworten in den Programmcache aufnehmen.
9. Fremden App-Cache desselben Ursprungs erhalten.

Die Ansichten bei 1280 × 900 und 390 × 844 Pixeln sowie der Zustand nach Rücksetzung wurden visuell auf Lesbarkeit und horizontalen Überlauf geprüft. Der Tastaturfokus war sichtbar. Gemessene Bedienelemente waren mindestens 44 Pixel hoch, das Eingabefeld verwendete mindestens 16 Pixel Schriftgröße.

Die Browserwerkzeuge sind keine Projekt-Laufzeitabhängigkeit. Eine portable optionale Einrichtung beschreibt [tests/browser/README.md](../../tests/browser/README.md); lokale Installationspfade oder persönliche Browserprofile sind nicht erforderlich.

## Unabhängige Review

Task 2 wurde mit GPT-5.6 Sol bei hoher Denktiefe implementiert und unabhängig geprüft. Die erste Review fand drei wesentliche Gruppen: verlustbehafteten Scope-Wechsel, originweite Cacheeingriffe und unvollständige Reset-/Graphvalidierung. Nach Fixrunde 1 blieb ein kombinierter Snapshot-/Reset-Graphfall offen; Fixrunde 2 schloss ihn. Die letzte Fixreview meldete alle Befunde behoben und keine neue wesentliche Regression.

Diese Dokumentation wurde mit GPT-5.6 Sol bei mittlerer Denktiefe erstellt und gehört zum anschließenden lokalen Dokumentationscommit. Die abschließende unabhängige Gesamtprüfung mit GPT-6 Astra bei hoher Denktiefe, Push und Remote-SHA-Vergleich sind bei Erstellung dieses Berichts noch ausstehend und werden von der übergeordneten Abschlussprüfung übernommen.

## Offene Grenzen

- Es gibt noch keinen nachgewiesenen Google-Cloud-Projekt-/OAuth-Client für dieses Projekt und keine echte Google-Anmeldung.
- Reales Drive-Verhalten, zwei physische Geräte und derselbe Probeordner wurden nicht geprüft.
- Safari auf iPhone/iPad und die Home-Bildschirm-App wurden nicht geprüft. Dafür fehlen noch HTTPS-Bereitstellung, konkrete Geräte-/Versionsangaben und Testverfügbarkeit.
- Die frühe Machbarkeitsprüfung ist deshalb noch nicht bestanden.
- Trainer, Vokabeln, Lernprofile, adaptive Wiederholung, Erwachsenen-PIN, Inselreise, vollständiger Sicherungsimport und Produkt-Konfliktlösung sind nicht implementiert.
- Es wurden kein Hosting, keine Abrechnung, keine Repository-Sichtbarkeit und kein `main` geändert.

## Nächster Nachweis

Die projektverantwortliche erwachsene Person richtet nach [GOOGLE-DRIVE-PROBE.md](../GOOGLE-DRIVE-PROBE.md) ein Google-Projekt, die Drive API und einen Web-OAuth-Client ein. Danach wird die reale Zwei-Geräte-Matrix mit derselben öffentlichen Client-ID, demselben Google-Konto und demselben Probeordner ausgeführt. Zugangsdaten, Client-Secret, Tokens und echte Lernprofile werden weder angefordert noch dokumentiert.
