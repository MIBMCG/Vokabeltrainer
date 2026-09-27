# Übergabe: Bedienkorrekturen aus dem Nutzertest

Stand: **27.09.2026**, Branch `codex/vokabeltrainer-v1`, Ausgangscommit
`93a684b`. Die Änderungen werden als nachfolgendes Paket auf demselben Zweig
gesichert; der genaue aktuelle Commit ist mit `git log -1` zu prüfen.

## Bearbeiteter Auftrag

- Updatehinweis nur bei tatsächlich wartender Programmversion.
- Entdeckerin, Entdecker und gekaufte Figuren konsistent in Avataransicht,
  Übungsstart und Inselreise; Haut-/Kleidungsfarben für menschliche Grundformen.
- Sichtbare Rückwahl zu „Klassisch“, Auswahl weiterhin getrennt je Kind.
- Tatsächlicher Google-Verbindungsstatus statt widersprüchlicher Meldungen.
- Ablauf einer Google-Sitzung im Shop verständlich behandeln und über die
  bestehende Erwachsenen-PIN direkt zum Wiederverbinden führen.
- Erwachsenen-Einstellungen als kurze, aufklappbare Aufgabenbereiche; offene
  Eingaben bei automatischem Abgleich erhalten.

Details, Ursachen, Testbefehle und Ergebnisse stehen im
[Bedienbericht](../reports/2026-09-27-bedienkorrekturen.md). Ältere Testzahlen
gelten nur für die jeweiligen datierten Vorgängerstände.

## Start und Übernahme

```sh
git clone --branch codex/vokabeltrainer-v1 https://github.com/MIBMCG/Vokabeltrainer.git
cd Vokabeltrainer
npm test
npm start
```

Node ab 22.8.0; unter Windows gegebenenfalls `npm.cmd` verwenden. Im Browser
`http://localhost:4173/trainer/` öffnen. Ein schon laufender Server muss nach
diesem Update neu gestartet werden, weil seine Liste erlaubter Programm- und
Bilddateien beim Start aufgebaut wird. Die Herkunft der Browserdaten beachten:
`localhost` und `127.0.0.1` haben getrennte lokale Speicher.

Programmcache ist jetzt `v26`, die synthetische Updateprobe `v27`. Keine
Browserdaten löschen, um ein Update zu erzwingen. Eine angebotene Aktualisierung
bewusst aktivieren; offene Übungen/Eingaben bleiben durch den bisherigen
Updateablauf geschützt.

## Unveränderte Grenzen und nächster Schritt

Keine Änderung an Kaufpreisen, Punktevergabe, Datenformaten oder
Kauf-/Restorekoordination. Tokens bleiben flüchtig; keine automatische
Anmeldung und kein Kauf ohne bestätigten Abgleich. Git überträgt keine
persönlichen Browserdaten oder Google-Sitzungen.

Nach Übernahme die gemeldeten Abläufe persönlich nachtesten: Entdeckerin
auswählen und Farben ändern, Üben/Inselreise öffnen, bei ausgelaufener Anmeldung
den Shop-Wiederverbindenweg verwenden und die neue Erwachsenenansicht bedienen.
Realer Google-Abgleich auf zwei Geräten und iPhone/iPad/Safari bleiben offen.
Die automatische Browserprüfung verwendet synthetische Profile und eine
simulierte Google-Grenze.

Die Grundfiguren-Auswahl vor Einrichtung des Figuren-/Drive-Bestands bleibt
eine bekannte AV01-Lücke. Die 72 übrigen Entwicklungsmotive, responsive
Produktionsvarianten, weitergehende Galeriegestaltung, Hosting/HTTPS und
Lizenzentscheidung bleiben Folgeumfang. Kein Merge nach `main`, keine
Hostingfreigabe und keine Cloudkontenänderung aus dieser Übergabe ableiten.
