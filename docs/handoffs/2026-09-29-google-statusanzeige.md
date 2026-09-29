# Google-Status in der Galerie

Stand: 29.09.2026. Zweig: `codex/vokabeltrainer-v1`.

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
Eine neue Bereitstellung ist noch nicht erfolgt.

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
Nächster Schritt ist der Abschluss der Tests und die private Bereitstellung.
