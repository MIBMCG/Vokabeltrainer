# Google-Status in der Galerie

Stand: 29.09.2026. Zweig: `codex/vokabeltrainer-v1`.

**Abgeschlossen:** Produktcommit `67de463e752221894e9e59cb81d1a978397db77a`
ist auf GitHub exakt abgeglichen und privat als Cache v36 bereitgestellt.
Die vorhandene Test-App zeigt nach Übernahme des Updates ohne Anmeldung
oder Galeriewechsel keinen falschen Verbindungshinweis mehr.

## Auftrag und Ausgangspunkt

Der Nutzer setzt die Arbeit nach dem Tiger-Abschluss mit „dann Arbeite nun
weiter“ ausdrücklich fort. Hauptzweig, wiederverwendeter isolierter Arbeitszweig
und GitHub sind zu Beginn sauber auf
`ca0ab43190ef14567fc1201c7ac9249076eed83e` abgeglichen.
Produktstand `05d21b9` läuft privat als Cache v35.
Der [vorherige Bericht](2026-09-29-tiger-fortsetzung.md) nennt den Hinweis
„Google erneut verbinden“ als offenen Diagnosepunkt.

## Beobachtung und Eingrenzung

Im bestehenden getrennten Codex-Testbrowser verschwindet der Hinweis durch
den bloßen Wechsel von „Entwicklung“ zu „Meine Figur“, ohne Anmeldung,
PIN-Eingabe oder Kauf. Die Browserfehlerliste liefert bei dieser Beobachtung
keine Warnungen oder Fehler. 40 verfügbare Punkte, 2.040 Lernpunkte, Level 11
und die ausgewählte Drachenstufe 4 bleiben erhalten.

Die Quellprüfung ergibt eine konkrete Reihenfolge:

1. Beim Start wird die zuletzt geöffnete Avataransicht aufgebaut.
2. Die vorhandene Serversitzung wird anschließend asynchron wiederaufgenommen.
3. Die Änderung meldet sich bei `shell.syncStatusChanged`.
4. Diese Methode endet bisher sofort, wenn kein Element `data-sync-status`
   sichtbar ist. Die Avataransicht besitzt ein solches Element nicht.
5. Der Kaufbereich berechnet den Verbindungszustand beim Zeichnen. Sein
   Hinweis bleibt deshalb bis zur nächsten Darstellung stehen, obwohl sich
   die Verbindung inzwischen geändert hat.

Eine unabhängige Prüfung des Serverpfads findet keinen belegten Serverfehler
als Ursache dieses Hinweises. Ein vorübergehender Erneuerungsfehler erhält
die Serversitzung; bestätigter Widerruf und Ablauf werden gesondert behandelt.
Ein möglicher paralleler Erneuerungsfall ist eine Hypothese, kein Nachweis
für den beobachteten Hinweis und kein Anlass für eine Serveränderung.

## Begrenzte Korrektur

Die geöffnete Galerie soll einen geänderten Verbindungszustand selbstständig
anzeigen, auch wenn die allgemeine Abgleichanzeige nicht sichtbar ist.
Tab, betrachtete Figur, Profil, Guthaben, Auswahl, laufende Vorgänge und offene
Kaufdialoge sollen erhalten bleiben. Unveränderte Abgleichmeldungen sollen
keine erneuten Kaufdatenabfragen auslösen. Die bestehenden Anmelde-,
Kauf- und Datensicherungsregeln bleiben maßgeblich.

Das Verhalten ist mit synthetischen Daten reproduziert und korrigiert.
`refreshPurchaseConnection` in der bestehenden Kaufoberfläche vergleicht die
aktuelle Verbindung mit dem zuletzt dargestellten Zustand. Die Shell ruft
dies vor ihrer bisherigen Prüfung der allgemeinen Abgleichanzeige auf.
Nur bei geänderter Verbindung wird der vorhandene Galerieteil aktualisiert;
seine geladenen Kaufdaten werden weiterverwendet. Entfernte oder zu einer
anderen Ansicht gehörende Elemente werden nicht angesprochen.

Tabs, betrachtete Figur, Guthaben und laufende Vorschau bleiben erhalten.
Der Tastaturfokus wird auf das entsprechende Bedienelement übertragen;
ist dieses entfernt oder deaktiviert, erhält der aktive Galerietab den Fokus.
Ein außerhalb dieses Teilbaums geöffneter Kaufdialog bleibt bestehen.
Serveranmeldung, Kaufkern, Guthaben- und Lernregeln sind unverändert.

Cache v36 ist für die geänderten Produktdateien vorbereitet; die synthetischen
Updatefälle verwenden v37. Es kommt kein neues Laufzeitmodul hinzu.
Die tatsächliche Bereitstellung und Browserbeobachtung sind unten dokumentiert.

## Prüfergebnisse

- Vor der Korrektur scheiterte der gezielte Browserfall am noch sichtbaren
  Anmeldehinweis nach erfolgreich abgeschlossener synthetischer Sitzung.
  Der Fehler war eine fehlende Anzeigeaktualisierung, kein gescheiterter
  Testaufbau. Ein ergänzter Fokusfall fand den Verlust des Shop-Tab-Fokus
  und wurde ebenfalls vor seiner Korrektur als fehlgeschlagen beobachtet.
- Der neue Fall bestand auf dem endgültigen Stand in 3,358 Sekunden. Er
  prüft Wiederaufnahme ohne Navigation, Verlust/Wiederkehr der Verbindung,
  Kaufaktionen, unveränderte Statusmeldungen ohne zusätzliche Leseaufrufe,
  Tab-/Figur-/Guthabenerhalt, Fokus, laufende Vorschau und offenen Dialog.
- Sechs Offline-/Update-/Galeriefälle bestanden auf dem endgültigen Stand,
  Exit 0, 24,023 Sekunden. Das umfasst auch fehlgeschlagene Installation,
  laufende Eingabe und mehrere offene Appfenster.
- Acht fokussierte Anmelde-/Kaufbrowserfälle bestanden nach der letzten
  Fokusergänzung, Exit 0, 36,767 Sekunden. Das schließt den neuen Galerie-
  Fehlerfall, explizite Wiederverbindung über die PIN-Ansicht, Kauf-Fortschritt,
  Sitzungswiederaufnahme, fehlgeschlagene Trennung und verzögerte Sitzung ein.
  Zusammen sind 14 Browserfälle auf dem endgültigen Produktstand bestanden.
- Die unabhängige Gesamtprüfung bewertet Spec und Qualität mit **PASS**;
  keine kritischen, wichtigen oder kleinen offenen Befunde.
- Die vollständige Node-Suite (`npm test`) besteht mit 646/646 Fällen,
  Exit 0, 243,312 Sekunden; keine übersprungenen oder abgebrochenen Fälle.

Ein früher begonnener Node-Lauf wurde für die
letzte Fokusergänzung kontrolliert abgebrochen und zählt nicht als Testnachweis.

Ausgeführte Browserbefehle mit vorhandener Playwright-Installation und lokalem
Edge über `PLAYWRIGHT_MODULE` und `BROWSER_EXECUTABLE`:

```sh
node --test --experimental-test-isolation=none tests/browser/server-auth.browser.mjs tests/browser/purchase-reconnect.browser.mjs tests/browser/purchase-progress.browser.mjs tests/browser/gallery-auth.browser.mjs
node --test --experimental-test-isolation=none --test-name-pattern='evolution pictures|owned|C2 rejected required precache|trainer offline update UI|update notice follows' tests/browser/evolution-art.browser.mjs tests/browser/trainer.browser.mjs tests/browser/status-feedback.browser.mjs
```

## Nachweisgrenzen und Fortsetzung

Ein veralteter Hinweis ist von einem tatsächlichen Verlust der Google-Sitzung
zu unterscheiden. Diese UI-Diagnose beweist weder einen externen Widerruf
noch die Erneuerung eines natürlich abgelaufenen Tokens. Reale
Tokenablauf-, Zwei-Geräte- und Apple-Prüfungen bleiben eigenständig offen.
Der vorhandene Testbereich und Familienbestände werden nicht neu eingerichtet,
importiert oder ersetzt. Ein kurzer Hinweis während einer noch laufenden
Sitzungsprüfung ist bestehendes Verhalten; dieses Paket korrigiert den
anhaltenden falschen Hinweis nach bereits erfolgreicher Wiederaufnahme.
Der Anzeigefehler ist abgeschlossen. Der nächste gesonderte Anmeldenachweis
ist eine kontrollierte Beobachtung über den natürlichen Tokenablauf hinweg
in einer vorhandenen Sitzung, ohne neue Anmeldung oder Einrichtungsreset.
Die 64 weiteren Bildmotive bleiben Folgeumfang nach persönlicher Konzeptfreigabe.

### Ergänzter Folgeauftrag vom 29.09.2026

Nach der Übersicht über verbleibende Arbeiten ergänzt der Nutzer ausdrücklich
das Ziel **„Hinzufügen neuer Vokabeln vereinfachen“**. Es steht jetzt in den
[Anforderungen](../ANFORDERUNGEN.md#neuer-folgepunkt-vokabeln-einfacher-hinzufügen-29092026)
und der aktuellen offenen Liste im [Arbeitsstand](../../ARBEITSSTAND.md).
Der Nutzer präzisiert anschließend: Alle genannten Bereiche (Einzeleingabe,
Sammelübernahme, Lektions-/Kinderzuordnung) sollen einfacher werden. Vorrang
hat die Übernahme vieler Wörter; deren Quelle ist Excel oder eine andere
Tabelle. Der bisherige Ablauf ist ihm zu lang. Der konkrete neue Bedienablauf
ist noch abzustimmen. Diese Dokumentation legt keinen direkten Dateiimport
fest und ändert das Produkt nicht.
Die gleichzeitig erfragte Handynutzung ist in der Oberfläche vorbereitet;
ihre praktische Abnahme auf echten Zielgeräten bleibt offen.

## Bereitstellung und tatsächliche Browserkontrolle

Nach erfolgreichem Abschluss aller Prüfungen wurde Produktcommit
`67de463e752221894e9e59cb81d1a978397db77a` per Fast-Forward in den
Entwicklungszweig übernommen. Der Vergleich zum geprüften Arbeitszweig war leer.
Die unveränderte öffentliche Auslieferungsliste enthält 199 Dateien.
Hochgeladen wurden drei geänderte Dateien: `trainer/sw.js`,
`src/trainer/ui/shell.js` und `src/trainer/ui/purchases.js`; 196 bestanden bereits.

- Cache v36, Worker-Version `aa32fd3e-c346-4615-b171-10f17b5b5913`.
- Version erstellt am 29.09.2026 um 09:57:34.508 UTC.
- Seit 09:57:36.044 UTC zu 100 Prozent aktiv; schreibgeschützt beim Anbieter geprüft.
- 47 öffentliche Dateien am 29.09.2026 um 09:58:01.105 UTC bytegleich mit dem
  geprüften Uploadpaket verglichen. Enthalten sind elf App-/Anmelde-/Galeriedateien
  und sämtliche 36 Bildvarianten der vorhandenen drei Reihen.

Der vorhandene Codex-Testbrowser zeigte nach vorbereitendem Neuladen noch
unter v35 den alten Hinweis und das Updateangebot. Über „Jetzt aktualisieren“
wurde v36 übernommen. Danach zeigte dieselbe wiederhergestellte Ansicht
„Meine Figur“ keinen Hinweis „Google erneut verbinden“ mehr. Zwischen
Update und Beobachtung erfolgten kein Galeriewechsel, keine neue Google-Anmeldung
und keine weitere Eingabe in der App. Damit ist der behobene Anzeigepfad auch
an der privat bereitgestellten App beobachtet.

40 verfügbare Punkte, 2.040 Lernpunkte, Level 11 und „Einfacher Drache – Stufe 4“
als ausgewählte Figur bleiben im DOM bestätigt. Die Ansicht wurde zusätzlich
per Bildschirmbild kontrolliert. Kein Kauf, Auswahlwechsel, Import oder
Einrichtungsreset; der Familien-Chrome blieb unangetastet. Der genaue
Google-Tokenablauf wurde dabei nicht instrumentiert oder verändert.

## Git-Sicherung

Der Produktcommit wurde auf `origin/codex/vokabeltrainer-v1` gepusht.
Lokaler Hash aus `git rev-parse HEAD` und Remote-Hash aus
`git ls-remote --heads origin refs/heads/codex/vokabeltrainer-v1` stimmen
exakt auf `67de463e752221894e9e59cb81d1a978397db77a` überein.
Diese Abschlussdokumentation wird separat auf demselben Zweig gesichert;
ihr Commit bleibt über die Git-Historie nachvollziehbar. Sie ändert das
bereitgestellte Produkt nicht.
