# Übergabe: Diagnose 6 ausgewertet, Koordinationsrichtung offen

Historischer Stand: Der Nutzer hat inzwischen **C** gewählt. Die [neue Übergabe zur gezielten Direkt-Drive-Untersuchung](2026-09-20-direkt-drive-c-und-gezielte-probe.md) ist maßgeblich; A/B/C nicht erneut abfragen.

Stand: 20.09.2026. Branch `codex/vokabeltrainer-v1`, Ausgangscommit `c8571964f60affab87c1c9ce21b470a7c31d216e`. Vor diesem Paket waren Arbeitsbaum und Branch sauber; Ausgangsstand und Remote wurden geprüft. Dieses Paket enthält ausschließlich Auswertung, Entscheidungsvorlage und Statusdokumentation.

## Ergebnis

Der Nutzerbericht `shop-probe-bericht6.json` ergibt **6 bestanden, 5 fehlgeschlagen, 0 unsupported**, `productReady:false`. [Bereinigte Auswertung](../reports/2026-09-20-shop-v6-reallauf.md).

Vier Fälle ändern die File-Version bei stabiler ETag und gleichen verfügbaren Zusatzmerkmalen. Drei brechen in der Anlageprüfung ab; der Resetfall in einer weiteren Fixture-Nachlese. Die letzte Ansichtszeit ist jeweils nicht verfügbar. Die konkrete Google-Ursache bleibt unbekannt.

Der Negativfall mit absichtlich falscher ETag meldet eine mehrdeutige Assertion: angenommener PUT, andere Ablehnungsklasse oder Abweichung beim Nachlesen nach 412 sind nicht unterschieden. Nicht behaupten, dass der falsche Token nachweislich akzeptiert wurde. Der erfolgreiche Antwortverlustfall belegt dagegen einen sequentiell abgewiesenen alten Token mit HTTP 412 und `spent:900`; keine pauschale Behauptung, dass der ganze v2-Kandidat wirkungslos sei.

Keine weitere unveränderte Probe anfordern und keine Schutzprüfung lockern. Keine Diagnose 7 ist implementiert oder beauftragt. Der Shop bleibt technisch unbewiesen und nicht in das Produkt integriert. Die vorhandene Produktsynchronisation ist von dieser isolierten Kaufprobe getrennt.

## Richtungsentscheidung

Die [Entscheidungsvorlage](../design/2026-09-20-kaufkoordination-nach-diagnose6.md) vergleicht drei Wege:

- **A, empfohlen:** Google-interne Kaufzentrale mit Apps Script konkret ausarbeiten und deren Eignung prüfen. Gewünschte Punktekäufe bleiben das Ziel; eine dokumentierte Skriptsperre ist vorhanden. Zusätzliche Betreiber-Einrichtung, Authentifizierung/PWA-Zugriff, eindeutige Bindung und dauerhaft konsistente Buchungen sind erst zu konkretisieren. Keine garantierte fertige Lösung.
- **B:** Statische Drive-App und Freischaltungen nach insgesamt erreichten Punkten; ersetzt die bestätigte ausgebbare Währung, daher nur nach ausdrücklicher Produktänderung.
- **C:** Direkten Drive-Kandidaten nur mit neuer technischer Hypothese und präziserer Negativfalldiagnose weiter untersuchen; kein neuer unveränderter REAL-Lauf.

**Noch keine Auswahl des Nutzers.** Ein neuer Serverdienst ist durch die bisherige Entwicklungsfreigabe nicht still mitfreigegeben. Der bestehende Shopentwurf verlangt bei fehlendem Nachweis eine Entwurfskorrektur; die Entscheidungsvorlage ist kein Implementierungsplan. Es wurden keine Cloudkomponenten eingerichtet, Berechtigungen geändert oder Käufe aktiviert.

## Nächster Schritt

Die eine offene Richtungsfrage O-KO01 beantworten lassen und die Antwort in Anforderungen/Vorlage festhalten. Danach den gewählten technischen Weg konkret entwerfen. Nicht erneut das gesamte Produkt oder EV01–EV05 abfragen. Bilder und Galerie können unabhängig weiter vorbereitet werden; vier Drachenmotive von 76 sind vorhanden. Bestehende Lernstände, kostenlose klassische Ausstattung und Lernpunkte erhalten.

## Prüfung und Grenzen

- Rohbericht strukturell gelesen und SHA-256 ermittelt; elf Szenarien mit aktuellem Transport und Szenariocode verglichen.
- Unabhängige Auswertung sowie Abschlussprüfung von Bericht und Entscheidungsvorlage mit GPT-5.6 Sol, Denktiefe hoch; keine wesentlichen Korrekturen oder offenen Befunde. Root hat zusätzlich aktuelle offizielle Google-Referenzen geprüft.
- Keine Funktionsänderung; daher keine erneute unveränderte Node-/Browser-Produktsuite. Frühere 69/69 Shop- und 10/10 Browserfälle sind historische Diagnose-6-Nachweise, kein neuer Google-Erfolg.
- Echte Apple-/Zwei-Geräte-Abnahme und HTTPS-Bereitstellung bleiben offen. Kein Zugriff auf bestehende Browserprofile oder Google-Dateien durch dieses Paket.
- Dokumentprüfung: 1099 Dateien, 162 Markdown-Dateien, 795 lokale Links, keine Fehler. `git diff --check` ohne Befund. Den abschließenden Commit aus der Branch-Historie und den Remote-SHA vor einer Fortsetzung frisch vergleichen.

Arbeitskopie mit `npm start` starten, Trainer unter `/trainer/`. Git überträgt Code und Dokumentation, keine Browserdaten oder Google-Sitzung. Die eingegangene Rohdatei bleibt außerhalb des Arbeitsbaums; nur die bereinigte Auswertung wird gesichert.
