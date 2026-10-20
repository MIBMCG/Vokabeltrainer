# Direkter Einstieg und Verwaltung der Lernbereiche

Stand: 20.10.2026. Der Nutzer hat den folgenden Ablauf im Chat ausdrücklich
bestätigt. Ausgangspunkt nach aktuellem GitHub-Abgleich:
`4e47c37542ded15dca58cadbac7a2f14a2a000a1`, Cache v53.

## Ziel und bestätigter Ablauf

1. Beim ersten Start stehen „Bestehenden Lernbereich verbinden“ und „Neu
   einrichten“ zur Verfügung. Für den Bestandsweg werden keine künstlichen
   Profile, Lektionen oder Wörter angelegt.
2. Nach Google-Anmeldung oder wiederaufgenommener Serversitzung erscheint die
   Liste vorhandener Bereiche automatisch. Die bewusste Auswahl lädt den
   geprüften Bestand sofort. Anschließend wird ausschließlich die lokale
   vierstellige Erwachsenen-PIN eingerichtet.
3. Die angemeldete Erwachsenenansicht bietet eine direkt erreichbare Liste
   aller vorhandenen Lernbereiche, auch wenn dieses Gerät schon verbunden ist.
   Bereiche können umbenannt und nach ausdrücklicher Bestätigung in den
   Google-Drive-Papierkorb verschoben werden. Der aktuell gebundene Bereich
   bleibt vor dem Löschen geschützt. Der Hinweis beschreibt, dass die Aktion
   den gemeinsamen Bereich mit Profilen, Lernständen und Käufen betrifft.
4. Suche und Übernahme werden beschleunigt. Bereits vorhandene Optimierungen
   des aktuellen Produkts bleiben erhalten; keine erneute Kaufimplementierung.

„Lernbereich“ bezeichnet den gemeinsamen Drive-Datensatz, „Lektion“ die darin
enthaltene Vokabelsammlung. Die bestehende Terminologie bleibt erhalten.

## Technische Grenzen

Google Drive bleibt Datenspeicher; der vorhandene kostenlose Cloudflare-Dienst
verwaltet weiter die Anmeldung. Kein neues Konto, Abo oder Anbieterwechsel.
Die vorhandene Serversitzung wird wiederverwendet; OAuth-Rückkehr kann den
Bestandsweg ohne lokal gespeicherte PIN oder Zugangsdaten fortsetzen.

Der Descriptor einschließlich seines Namens bleibt unveränderlich, weil sein
Hash die Kaufkonfiguration bindet. Der veränderliche Anzeigename ist der Name
des gekennzeichneten Drive-Rootordners; ältere Bestände verwenden dessen
vorhandenen Namen. Ein Namenswechsel verändert weder Descriptorhash noch IDs,
Guthaben, Profile, Lernereignisse oder Besitz. Für die aktuelle Oberfläche wird
der bestätigte Ordnername aus der Sitzungsansicht des Syncdienstes angeboten.

Anzeigenamen sind nichtleer und auf 80 Zeichen begrenzt. Umbenennung/Papierkorb
prüfen Konto, App-/Datensatzkennung, Ordnerart und
Auswahlaktualität. Bedingtes Schreiben und Nachlesen sichern das Ergebnis;
ein unklarer Ausgang wird nicht als Erfolg dargestellt. Es gibt keine
endgültige Löschung und keine pauschale Drive-Schreibschnittstelle.
Eine synchrone Freigabeprüfung unmittelbar vor dem Schreibaufruf verhindert
neue Änderungen nach PIN-Sperre, Konto- oder Ansichtswechsel während der
vorherigen Netzprüfung.

Der direkte Beitritt aus einem leeren Browser lädt in einem getrennten
Arbeitszustand und installiert erst einen vollständig geprüften Bestand
atomar. Abbruch oder Ladefehler vor der Installation lassen den Browser leer.
Die bisherige Sicherheitskopie und die erneute Bestätigungsprüfung bei einem
nichtleeren lokalen Stand bleiben erhalten. Gleichzeitige lokale Einrichtung
oder anderer Beitritt dürfen nicht überschrieben werden.

Die Bereichssuche verwendet höchstens vier parallele Prüfungen und liefert
eine deterministische vollständige Liste. Alle gestarteten Arbeiten werden
vor einem Fehlerabschluss beendet. Bereits geprüfte unveränderliche Daten
dürfen nur innerhalb ihrer bisherigen Bindungs-/Versionsgrenzen wiederverwendet
werden; geänderte oder neue Dateien werden geprüft. Keine neue Changes-API,
keine Änderung des Kaufprotokolls und keine gelockerten Hash-/ETag-Prüfungen.

## Abnahme

- Leerer Browser: vorhandene Sitzung oder Anmeldung → automatische Liste →
  bewusste Auswahl → geprüfte Profile/Lektionen ohne Probeeinträge → lokale PIN.
- Offline-/Anmelde-/Datenfehler sind korrigierbar und erhalten den Ausgangsstand.
- Umbenennung erscheint nach erneuter Suche auf einem zweiten simulierten
  Gerät; Descriptor, Lernstand und Kaufautorität bleiben gleich.
- Papierkorb erst nach Bestätigung; aktive und fremde Bereiche sind geschützt.
  Ein anderes Gerät mit entferntem Root behält lokale Änderungen.
- Suche startet unabhängige Prüfungen parallel, mit höchstens vier Arbeitern.
- Bestehende Join-, Sicherheitskopie-, Kauf-, Offline- und Updatefälle bleiben
  erfolgreich. Neuer Produktcache v54 mit vollständiger Assetliste.
- Browsernachweise verwenden synthetische Daten. Echte Google-Laufzeit,
  iPhone/iPad, Safari und physische Mehrgeräteabnahme bleiben separat.

Eine Veröffentlichung der laufenden App ist noch nicht Bestandteil dieses
Umsetzungspakets; das lokal geprüfte Ergebnis wird zuerst konkret übergeben.
