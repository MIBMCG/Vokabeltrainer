# Unabhängige Review: Shop-Probe Diagnose 8

Stand: 20.09.2026. Geprüft wurde der eingefrorene, uncommittierte Diagnose-8-Diff auf `codex/vokabeltrainer-v1` gegenüber `a802a0e512682891ff65e98a7085812986791f94`. Maßstab war der [begrenzte Diagnose-8-Plan](../superpowers/plans/2026-09-20-shop-probe-v8-read-observation.md).

## Urteil

Spezifikations- und Codequalitätsprüfung bestanden. Es bestehen keine offenen relevanten Befunde. Die Änderung trennt eine reine Metadatenkontrolle vom anschließenden Medienfenster, ohne einen beobachteten oder instabilen Stand für bedingte Schreibzugriffe freizugeben.

Ein Vorabbefund wurde vor dem finalen Freeze korrigiert: Die Szenario-Erfolgsbedingung verlangte zunächst den ausgewiesenen Cachemodus nicht ausdrücklich. Der korrigierte Guard fordert jetzt `cacheMode: no-store`, eine vollständige Beobachtung ohne Fehlerphase, beide Fenster in fester Reihenfolge, alle vorgesehenen Zustandsfelder, stabile Versionen und ETags sowie passenden Medieninhalt. Die gezielten Review-Regressionen bestanden nach RED **0/4** mit GREEN **4/4**.

## Geprüfter Vertrag

- `read-stability` ist nur mit dem v2-kohärenten Transport zulässig. Eine ungeeignete Quelle wird vor jedem Drive-Zugriff abgewiesen und nicht automatisch geändert. `full` bleibt Standard; die drei Umfänge liefern weiterhin elf, zwei beziehungsweise zwei Checks.
- Der Beobachtungspfad reserviert genau eine neue ID, legt eine eigene synthetische JSON-Datei im gebundenen Probeordner an, liest den erfolgreichen v3-Erstellungsresponse vollständig und prüft dessen ID intern. Weder Erfolg noch Fehler exportieren die ID.
- Danach folgen genau M1-Metadaten, M2-Metadaten, Medieninhalt und M3-Metadaten. Alle vier Diagnose-GETs verwenden `cache: no-store`. Es gibt keine Wartezeit, Wiederholung, Aktualisierung, Löschung oder bedingte Schreibanfrage.
- `metadata-control` vergleicht M1 mit M2; `media-window` vergleicht M2 mit M3. Exakt gleiche Versionsstrings ergeben `same`. Große Zahlen werden verlustfrei mit `BigInt` nach Richtung eingeordnet; numerisch gleiche, anders geschriebene Werte ergeben `representation-changed` und bleiben fehlgeschlagen.
- Version, ETag, Prüfsumme, Head-Revision, Änderungszeit, letzte Ansichtszeit und Dateigröße werden nur als feste Zustände ausgegeben. Medienstatus, Redirectbeobachtung und Inhaltsgleichheit sind ebenfalls begrenzt. Rohwerte, Antworten, Fehlertexte, Header, URLs, Token, ETags, Datei-IDs und Inhalte gelangen nicht in den Bericht.
- Bei Auth-, Bindungs-, HTTP-, Parse- oder Netzwerkfehlern stoppt die Sequenz an einer festen Fehlerphase. Bereits gewonnene Vergleiche und Medienbeobachtungen bleiben als erneut bereinigte Teilevidenz erhalten. Eine unvollständige Beobachtung kann nicht bestehen.
- Der Observer gibt weder Snapshot, Inhalt, Version, ETag, Eigenschaften noch Datei-ID zurück. `create`, `read`, `retryCreate` und `updateIfUnchanged` behalten ihre bisherigen Endpunkte, Cachevorgaben, Guards und Schreibabläufe.
- Die Oberfläche kennzeichnet Diagnoseversion 8, den reinen Leseumfang und die fehlende Schreibprüfung. Auswahlfelder bleiben während des Laufs gesperrt; Downloadname, `probeScope`, API-Pfadbeschreibung und Statusmeldung sind konsistent. `productReady:false` bleibt unverändert.

## Prüfbelege und Grenzen

Die bereitgestellten finalen Rohprotokolle wurden vollständig gelesen:

- Shop-Node-Suite: **109/109 bestanden**, 0 fehlgeschlagen, 0 abgebrochen, 0 übersprungen.
- Shop-Browser-Harness: **16/16 bestanden**, 0 fehlgeschlagen, 0 abgebrochen, 0 übersprungen.
- `git diff --check` blieb ohne Befund.

Die neuen Fälle decken die feste Requestfolge, `no-store`, fehlende bedingte Writes, beide Versionsfenster, große und anders dargestellte Versionswerte, falsche Create-ID, frühe und späte Fehlerphasen, bereinigte Teilevidenz, strikten Erfolgs-Guard, stabile und instabile Browserausgänge sowie die Abweisung einer falschen Quelle vor Drive-Zugriff ab. Die bereits grünen Suiten wurden in dieser Review nicht erneut ausgeführt.

Als optionale Testhärtung könnte der Browserbericht zusätzlich ausdrücklich nach der synthetischen zweiten Fixture-ID suchen. Dies ist kein offener Befund: Der eingefrorene Exportpfad enthält statisch keine ID-Quelle, die Transporttests prüfen einen ID-freien Observer, und die Szenario-Whitelist verwirft unbekannte Felder.

Es erfolgten kein echter Google-Zugriff, keine Änderung von Konten oder Browserdaten und keine Bewertung eines Diagnose-8-REAL-Berichts. Ein später stabiler Lauf erklärt den Diagnose-7-Befund nicht rückwirkend und belegt weder eine serverseitige Compare-and-swap-Garantie noch sichere parallele Käufe.
