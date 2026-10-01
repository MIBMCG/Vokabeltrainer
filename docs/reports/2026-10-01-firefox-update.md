# Firefox: kontrollierte Aktualisierung

Stand: 01.10.2026. Die begrenzte Korrektur ist nach ausdrücklicher
Nutzerfreigabe umgesetzt, unabhängig geprüft und privat bereitgestellt.
Produktcommit: `6b1378096ff88284ba021e61f90442a11c495580`, Cache v47.
Basis: `70444c18529e6057044dddf532dd35dedd514028` mit Produktcache v46.

## Anlass und nachgewiesene Ursache

Der Nutzer berichtet in Firefox 156.0.1 mit genau einem geöffneten Tab:
„Die Aktualisierung hat nicht rechtzeitig geantwortet. Bitte offene
Eingaben sichern und die App neu öffnen.“

Die isolierte Playwright-Umgebung mit Firefox 153 reproduziert den Fehler.
Der aktive Service Worker leitet die bewusst angeforderte Aktualisierung
an den wartenden Worker weiter. Firefox stellt den Absender dort als
separates natives ServiceWorker-Objekt bereit. Scriptadresse und Zustand
entsprechen dem aktiven Worker, die JavaScript-Objektidentität jedoch nicht.
Die bisherige Identitätsprüfung verwirft deshalb die gültige Nachricht.
Die App läuft anschließend in ihren Aktivierungs-Timeout.

Die instrumentierte Diagnose bestätigt `sourceType: ServiceWorker`,
`sourceState: activated`, dieselbe Scriptadresse und
`sourceEqualsActive: false`. Der ursprüngliche Browserfall scheitert am
ausbleibenden Neuladen; der ergänzte Unit-Test scheitert vor der Korrektur.
Ein einzelner Tab reicht zur Reproduktion. Die gemeldete Firefox-Version
156.0.1 ist nicht Bestandteil dieser automatisierten Testumgebung.

## Freigegebene Änderung

Der wartende Worker akzeptiert weiterhin die bisherige Objektidentität.
Zusätzlich akzeptiert er ein natives ServiceWorker-Objekt mit derselben
Scriptadresse und demselben aktuellen Zustand wie der registrierte aktive
Worker; der Zustand muss `activating` oder `activated` sein. Nachrichten
von Fenster-Clients, nachgeahmte Eigenschaften, fremde Scriptadressen und
veraltete Workerzustände reichen nicht aus.

Die kontrollierte Weiterleitung durch den aktiven Worker, die Prüfung des
kontrollierten Fenster-Clients, das Speichern vor der Übernahme und die
Sperren für Einrichtung, Erwachsenenansicht, offene Eingabe und noch nicht
gespeicherte Antwort bleiben erhalten. Es gibt keine Datenmigration.
Der bereits installierte v46-Worker verwendet dasselbe Nachrichtenformat;
die Korrektur im wartenden v47-Worker genügt für die Übernahme.

Die Browser-Testumgebung unterstützt nun ausdrücklich `BROWSER_ENGINE=firefox`
und weiterhin standardmäßig Chromium/Edge. Cache-Erwartungen verwenden v47
und einen synthetischen Nachfolger v48. Das öffentliche Paket ändert nur
`trainer/sw.js`; der bestehende Umfang von 387 öffentlichen Dateien bleibt.

## Verifikation

| Prüfung | Ergebnis |
| --- | --- |
| Neue Wrapper-Regression vor der Korrektur | Erwarteter Fehler |
| Ursprünglicher Firefox-Updatefall vor der Korrektur | Reproduzierter Timeout |
| Service-Worker- und Update-Unit-Tests | 24/24 PASS |
| Vollständige Node-Suite, `npm test` | 664/664 PASS |
| Edge: abgelehnte Pflichtdatei-Installation und kontrolliertes Update | 2/2 PASS |
| Edge: betroffene Galerie-, Cache- und Update-Statusfälle | 20/20 PASS |
| Firefox 153: kontrolliertes Update einschließlich Eingabe-/Antwortsperren | 1/1 PASS |
| Firefox 153: ursprünglicher v46-Worker zu korrigiertem v47-Worker | 1/1 PASS |
| Firefox 156.0.1: Nutzer meldet Übernahme ohne Fehlermeldung | Bestätigter Praxisnachweis |
| Unabhängiges Spec- und Codereview, einschließlich 24 Unit-Tests | PASS, keine offenen Befunde |

Der ergänzende echte Browserwechsel v46 → v47 erfolgt über den App-Knopf.
Der vollständige synthetische IndexedDB-Zustand ist davor und danach
identisch; anschließend existiert ausschließlich der Produktcache v47.
252 ms vom Klick bis zur wiederhergestellten Kinderansicht sind eine lokale
synthetische Beobachtung, keine Zusage für das Nutzersystem.

Ein zusätzlich versuchter Firefox-Offlinetest scheitert nach
`context.setOffline(true)` beim Neuladen mit `NS_ERROR_OFFLINE`.
Die gleiche Fehlerstelle tritt beim unveränderten Ausgangsstand v46 auf.
Dieser Fall ist nicht als PASS gezählt und belegt keine neue Regression
durch die Korrektur. Die Ursache dieser separaten Firefox-Offlinegrenze
ist weiterhin offen. Ein erster Vergleichslauf wurde bereits durch einen
Navigations-Timeout unterbrochen; erst der gezielte Wiederholungslauf
reproduziert denselben Offlinefehler. Der Edge-Fall besteht.

Die unabhängige Prüfung weist darauf hin, dass native Worker mit derselben
Scriptadresse und demselben Zustand nicht zusätzlich anhand ihrer
Registrierung unterschieden werden können. Im geprüften Produktpfad leitet
dieses Script nur an den wartenden Worker seiner eigenen Registrierung
weiter; Fenster-Absender werden nicht als native Worker anerkannt. Daraus
ergibt sich kein offener Befund für das freigegebene Paket.

## Private Bereitstellung und vorhandener Testbestand

Die bestehende private App wird mit unveränderten Konten, Rechten,
Servervariablen und Secrets aktualisiert. Worker-Version
`8fc4b574-141f-4203-bd80-d2c911385ffb` ist seit
01.10.2026, 19:23:45.735 UTC zu 100 Prozent aktiv.
Sieben ausgelieferte Dateien wurden am 19:24:29.134 UTC bytegleich mit
dem geprüften Bereitstellungspaket verglichen, einschließlich Cache v47.

Im erhaltenen Codex-Testbrowser ist „Jetzt aktualisieren“ erfolgreich
übernommen. Die Updateanzeige verschwindet; vor und nach der Übernahme
sind 450 verfügbare Punkte, 2.450 Lernpunkte, Level 13 und die ausgewählte
Drachenstufe 4 sichtbar. Auch die angebotenen Wortzahlen 209 / 157 / 131
bleiben erhalten. Keine neue Einrichtung, Importe oder Käufe wurden in
diesem Bestand durchgeführt. Ein vorübergehender automatischer
Freigabe-Timeout wurde durch den erlaubten einmaligen erneuten Zugriff
aufgelöst; die anschließende Übernahme besteht.

## Nachweise und Grenzen

Lokale Diagnose- und Bereitstellungsdateien liegen ignoriert unter
`.superpowers/`; Zugangsschlüssel und lokale Lernbestände gehören nicht
zur GitHub-Sicherung. Wesentliche Belege:

- `firefox-update-diagnosis.json`: ursprüngliche Wrapper-Diagnose und Meldung.
- `firefox-update-baseline.log`: ursprünglicher Firefox-Updatefehler.
- `firefox-update-unit-red.log` / `firefox-update-unit-green.log` im isolierten Arbeitsbaum.
- `firefox-update-node.log`, `firefox-update-browser-green.log`,
  `firefox-update-edge.log`, `firefox-update-cache-fixtures.log` dort.
- `firefox-update-upgrade.json`: v46 → v47 und unveränderter synthetischer Zustand.
- `firefox-offline-baseline-repeat.log`: gleiche separate Offlinefehlerstelle auf v46.
- `deployment-2026-10-01-firefox-update/`: Upload, aktive Version,
  Bytevergleich und Screenshot des erhaltenen Testbestands.

Der Nutzer bestätigt anschließend für seinen Firefox 156.0.1:
„Update klappt ohne Fehlermeldung“. Damit ist der konkrete gemeldete
Updatefehler zusätzlich am Nutzersystem geprüft. Daraus keine gesamte
Firefox-Offlineabnahme ableiten. Physische Handy-/Safari-Nutzung,
natürlicher Google-Tokenablauf und reale Geräteabgleiche bleiben offen.
Cache oder Website-Daten für weitere Prüfungen nicht löschen.
Keine Pause angeordnet; nächste Arbeit gemäß
[Übergabe](../handoffs/2026-10-01-firefox-update.md).
