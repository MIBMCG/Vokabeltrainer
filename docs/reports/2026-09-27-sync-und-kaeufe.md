# Abgleich, Google-Sitzung und langsame Käufe

Stand: 27.09.2026. Ausgangscommit `87ac338`, Entwicklungszweig
`codex/vokabeltrainer-v1`. Auftrag und Aufteilung stehen im
[Korrekturplan](../superpowers/plans/2026-09-27-sync-und-kauf-rueckmeldung.md).

## Befunde und Änderungen

1. **Abgleich startet sich selbst erneut:** Jeder interne Speicherstand löste
   bisher einen weiteren Lauf nach zehn Sekunden aus, auch bei leerer Outbox.
   Bei einem langsamen Lauf wurde der nächste bereits vorgemerkt. Zwei
   synthetische Reproduktionen zeigten zwei statt eines Durchlaufs. Nur neue
   lokale Ereignisse stoßen jetzt den Änderungsabgleich an. Lokale Rundenenden
   bleiben sofortige Auslöser; der reguläre Abruf nach 60 Sekunden bleibt.
2. **Laufend und ausstehend waren dieselbe Anzeige:** Eine reine Prüfung zeigt
   jetzt „Auf Änderungen prüfen …“, tatsächlicher laufender Abgleich
   „Abgleich läuft …“. „Abgleich ausstehend“ bezeichnet wartende Änderungen.
   Neue Eingaben während eines laufenden Abrufs bleiben sichtbar und erhalten.
3. **Viele serielle Wartezeiten:** Unabhängige Produktdateien werden in
   Gruppen von höchstens vier gelesen, danach in ursprünglicher Reihenfolge
   ausgewertet. Persistente, unveränderliche Kaufuploads laufen in Gruppen von
   höchstens drei. Alle begonnenen Übertragungen werden vor einem Fehlerabbruch
   abgewartet; der Kaufkopf wird erst nach vollständiger Verifikation geändert.
   IDs, Inhalte, Kontobindung, Hashprüfung und bedingtes Schreiben bleiben erhalten.
4. **Mehrfachdialoge beim Kauf:** Die asynchrone Angebotsprüfung hatte keine
   sofortige Sperre. Nun beginnen Sperre und Statusmeldung vor dem ersten
   Warten. Es gibt höchstens einen Dialog; während Bestätigung ist auch Escape
   gesperrt. Vor Bestätigung schließt Escape den Dialog vollständig und gibt
   die Bedienung wieder frei. Der Fortschritt steht direkt im modalen Dialog.
5. **Google-Freigabe wurde beim Seitenende widerrufen:** Aufräumen löscht jetzt
   nur die Sitzung im Arbeitsspeicher. Nur bewusstes Trennen widerruft die
   Freigabe. PIN-Sperren löschen die Google-Sitzung nicht mehr. Fehler einer
   älteren Sitzung dürfen eine inzwischen erneuerte Sitzung nicht entfernen.
   Status, Hinweis und Einstellungsübersicht berücksichtigen die tatsächlich
   aktive Sitzung. Ein verspäteter Fehler fordert zum erneuten Abgleich auf,
   ein aktueller Anmeldefehler zum Wiederverbinden. Netzwerkfehler bleiben
   von fehlender Anmeldung getrennt.
6. **Fehler „unveränderliche Drive-Datei … geändert“:** Reproduziert wurde ein
   falscher Abbruch bei reinen Metadatenänderungen mit unverändertem Inhalt.
   Die Transportprüfung nutzt die Inhaltsrevision zusätzlich zur unveränderten
   Bindung und zum erwarteten SHA-256. Fehlt die Inhaltsrevision, bleibt die
   bisherige strenge Versions-/ETag-Prüfung. Ordner und Kaufkopf behalten ihre
   bisherigen Vergleichsbedingungen. Siehe [Protokollpräzisierung](../KAUFPROTOKOLL.md).
7. **Parallele Neuanlage und Hintergrundabgleich:** Bei einer gehaltenen
   Ordneranlage konnte ein paralleler Abgleich denselben gespeicherten
   Einrichtungsauftrag bereits abschließen. Der zuerst gestartete Ablauf
   meldete anschließend fälschlich eine geänderte Bindung und überschrieb
   „Abgeglichen“ mit einem Fehler. Eine unabhängige synthetische Reproduktion
   belegte diesen Ablauf bei leerer Outbox und gültiger Bindung. Gleichzeitige
   Aufrufer teilen jetzt denselben laufenden Einrichtungsvorgang. Erfolg und
   Fehler geben ihn anschließend frei; die Wiederholung nutzt weiterhin die
   gespeicherten IDs. Der neue Regressionstest war vorher rot und danach grün.

Google dokumentiert Dateiversionen einschließlich unsichtbarer Änderungen und
eine separate Inhaltsrevision für gespeicherte Dateien
([Dateireferenz](https://developers.google.com/workspace/drive/api/reference/rest/v2/files)).
Die konkreten Metadaten des Nutzerfehlers wurden nicht ausgelesen; dieser
reproduzierte Mechanismus ist deshalb keine bewiesene Diagnose seines Kontos.

## Prüfung und Grenzen

Die Regressionen wurden vor den jeweiligen Korrekturen fehlschlagend geprüft.
Sie decken schnelle/langsame Abgleichläufe, währenddessen entstehende lokale
Änderungen, Parallelitätsgrenzen, Teilfehler, unveränderte Upload-IDs,
Inhalts-/Bindungsänderungen, verspätetes 401, aktuellen Anmeldefehler, PIN-Sperre
und langsame Kaufvorschau/Bestätigung einschließlich wiederholter Klicks ab.

Die unabhängige Review verwendet GPT-6 Astra/high. Implementierung und
Diagnose: GPT-6 Sol/high; Kaufoberfläche: GPT-6 Sol/medium. Zwei Dialogbefunde
und ein widersprüchlicher Anmeldestatus aus der Review wurden korrigiert.
Die gezielte unabhängige Nachprüfung bewertet alle drei Befunde als geschlossen.
Auch der zusätzlich nachgewiesene Einrichtungsfehler wurde unabhängig geprüft:
paralleler Erfolg sowie gemeinsamer Netzwerkfehler mit anschließender
Wiederaufnahme funktionieren mit erhaltenen IDs und leerer Outbox.

Aktuelle Prüfung auf dem finalen Code:

- `npm test`: **543/543 bestanden**, keine übersprungenen Tests.
- `npm run check:docs`: 1.236 Dateien, 233 Markdown-Dateien, 868 lokale
  Verweise, keine Fehler. `git diff --check` ohne Befund.
- Vollständiger Browserlauf aus `tests/browser/README.md`: **54/54 bestanden**,
  keine übersprungenen Tests, isoliertes Edge/Chromium mit synthetischem Google.

Frühere Browserläufe waren nicht vollständig grün. Ihre Zeitüberschreitungen
bei der Neuanlage führten zur deterministischen Reproduktion des oben
beschriebenen Einrichtungsrennens. Die Neuanlage startet ihren Erstabgleich
bereits ausdrücklich; dafür ist kein zusätzlicher periodischer Auslöser nötig.
Eine veraltete Phasenerwartung wurde auf „Auf Änderungen prüfen …“ korrigiert.
Zwei weitere Teststellen benötigen echte Abschlussbedingungen: vollständig
geladenes Inselbild (`complete` und positive Bildbreite) sowie tatsächlicher
DOM-Abbau des Kaufdialogs nach dem nativen `close`-Ereignis. Ein unsichtbarer
Dialog ist für den Rollen-Selektor schon vorher nicht mehr auffindbar. Die
Prüfungen erhalten ihre fachlichen Aussagen und unveränderten Timeouts;
Produktgrafiken wurden dafür nicht geändert.

Keine echten Google-Dateien, Tokens oder persönlichen Browserdaten wurden
für diese Prüfungen gelesen oder verändert. Anfrageparallelität ist geprüft;
eine konkrete Beschleunigung in Sekunden bei echtem Drive ist nicht gemessen.
Physische Zwei-Geräte- und iOS/Safari-Abnahme bleibt offen.

## Anmeldung bleibt begrenzt

Die automatische Abmeldung durch Seitenende wird entfernt. Nach vollständigem
Neuladen oder Tokenablauf bleibt jedoch ein bewusster Klick zum erneuten
Google-Zugriff erforderlich; die App bewahrt keine Tokens dauerhaft auf.
`prompt: ''` vermeidet eine ausdrücklich erzwungene Kontowahl, garantiert aber
keine dialogfreie Anmeldung ([Google-Tokenmodell](https://developers.google.com/identity/oauth2/web/guides/use-token-model),
[GIS-Referenz](https://developers.google.com/identity/oauth2/web/reference/js-reference)).
Der vorhandene Lernbereich muss nicht erneut angelegt oder ausgewählt werden.
