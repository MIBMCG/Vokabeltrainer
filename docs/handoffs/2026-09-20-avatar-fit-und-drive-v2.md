# Übergabe: erneute Passformkritik und zweiter Google-Bericht

Stand: 20.09.2026. Aktiver Branch: `codex/vokabeltrainer-v1`. Ausgangspunkt: `f870e53c8526e62d0a21c5f6710bcf8346414283`. Vorhandener isolierter Checkout, keine Änderung an `main`. Die aktuelle Paket-SHA ergibt sich nach Commit aus der Git-Historie; den Remote-Stand vor einer Fortsetzung frisch prüfen.

## Aktueller Nutzerauftrag

Der Nutzer hat `shop-probe-bericht2.json` geliefert und die Passform erneut beanstandet: vor allem Ausrüstung an Pferde- und Tigerbeinen, aber auch bei weiteren Figuren. Die frühere positive Bewertung darf nicht fortgeschrieben werden. Bereits bestätigte Produktentscheidungen AV01–AV12 und die allgemeine Entwicklungsfreigabe bleiben bestehen.

Erneute ausdrückliche Präzisierung: Umhänge bei Pferden/Einhörnern ragen über; komplette sichtbare Ringe wirken vorgehängt. Nacharbeit ist für **alle Figuren und Ausrüstungsteile** erforderlich. Die während der Diagnose angezeigten Bilder waren der unveränderte alte Stand, keine bereits umgesetzte neue Korrektur. Die Methodenfrage ist damit noch nicht beantwortet.

## Tatsächlich erledigt

- Der zweite echte Google-Bericht ist als [bereinigter Ergebnisbeleg](../reports/shop-probe-evidence/2026-09-20-media-v2.json) gesichert und [ausgewertet](../reports/2026-09-20-shop-zweiter-reallauf.md): zwei bestanden, einer fehlgeschlagen, acht nicht nachgewiesen. Weder der v3-Medien- noch der Metadatenheader liefert dem Browser eine lesbare Versionskennung. Der Versionswechsel im Antwortverlustfall geschah schon vor dem vorgesehenen Schreiben.
- Die isolierte Shop-Probe bietet einen dritten, ausdrücklich wählbaren Kandidaten „Versionskennung aus Dateidaten (Drive v2)“. Bericht und Download sind auf Diagnoseversion 3 umgestellt. Die bestehende v3-Dateibindung und Versionsklammer bleiben erhalten; zusätzliche v2-JSON-ETags werden vor und nach dem Inhalt abgeglichen. Schreibwege bleiben v3 mit `If-Match`. [Implementierungsbericht](../reports/2026-09-20-shop-v2-candidate.md).
- Ein frischer [unabhängiger Sichtaudit aller 13 Hauptfiguren](../reports/2026-09-20-avatar-fit-second-audit.md) bestätigt die Nutzerkritik. Vorherige Passformberichte und Einstiegsdokumente sind entsprechend berichtigt.
- Ein [konkreter Reparaturansatz](../design/2026-09-20-avatar-passform-v2.md) ist vorbereitet: vorhandene Ausrüstung in einzeln anpassbare Teile zerlegen und korrekte Vorder-/Hinterverdeckung herstellen, zuerst Pferd und Tiger. In diesem Paket wurden noch keine Bildquellen oder WebPs geändert.

## Prüfungen dieses Pakets

Nach der Probe-Implementierung frisch durch Root ausgeführt:

- `npm test`: **372/372 bestanden**.
- `node --test --experimental-test-isolation=none tests/shop-probe/*.test.js tests/serve.test.js`: **26/26 bestanden**.
- `node --test --experimental-test-isolation=none tests/shop-probe/browser.mjs`: **5/5 bestanden**, mit synthetischer Google-Grenze in headless Edge. Enthalten sind der neue Kandidat ohne v3-Header und seine Sperre ohne JSON-ETag.
- `npm run check:docs`: keine Fehler. Der persönliche lokale Server liefert außerdem HTTP 200 mit Diagnoseversion 3 und der dritten Auswahl; hierfür wurde nur die öffentliche HTML-Seite gelesen.

RED/GREEN der fünf neuen Node-Prüfungen ist im Implementierungsbericht dokumentiert. Die [unabhängige Codeprüfung](../reports/2026-09-20-shop-v2-review.md) ist ohne offene wesentliche Befunde abgeschlossen; eine zusätzliche Gegenprobe mit starker, aber inkompatibler v2-Kennung blieb gesperrt. Dokument- und Git-Prüfungen erfolgen vor Commit/Push; die Tests sind ausdrücklich kein echter Google-Nachweis.

Modelle: Implementierung der Probe, unabhängiger Avatar-Zweitaudit und unabhängige Codeprüfung jeweils GPT-5.6 Sol mit hoher Denktiefe. Root koordiniert Befunde, Dokumentation, Verifikation und Git. In diesem Paket wurde kein neues Bild generiert.

## Nächste Schritte

1. **Bildmethode:** Die gezielte klassische Bearbeitung vorhandener Rasterbilder ist konkret beim Nutzer angefragt; eine Antwort steht noch aus. Diese Frage folgt der Werkzeugvorgabe, andere Bildbearbeitungswerkzeuge nur auf ausdrücklichen Nutzerwunsch zu verwenden. Nicht als fehlende allgemeine Entwicklungsfreigabe behandeln. Bei Zustimmung zuerst die vier Pferde- und vier Tigerreifen individuell anpassen und Nahansichten sowie kleine Karten zeigen; danach den Fit-Pass auf alle 62 kompatiblen Paare übertragen. Keinen weiteren ungezielten Generierungsdurchlauf starten.
2. **Echte Probe:** `/shop-probe/` neu laden und „Diagnoseversion 3“ kontrollieren. Bewusst bei Google anmelden, die dritte Auswahl „Versionskennung aus Dateidaten (Drive v2)“ wählen und den synthetischen Lauf starten. Ergebnis `shop-probe-bericht3.json` auswerten. Keinen identischen Medienlauf ohne neuen Erkenntnisgewinn verlangen.
3. **Produktintegration:** Weiterhin erst nach belastbarem Kaufvertrag. Ein v2-ETag ist nicht automatisch eine gültige v3-Schreibbedingung. Ein grüner Simulator bestätigt keine Google-Garantie. `productReady` bleibt selbst bei bestandener Probe `false`.

Der persönliche Server auf Port 4173, Browserdaten und Google-Sitzung wurden nicht für automatisierte Prüfungen übernommen. Produktcache v20 und Produktoberfläche sind unverändert. Neue Figurenwahl und Käufe sind weiterhin nicht aktiviert. iPhone-/iPad- und Zwei-Geräte-Abnahmen sowie HTTPS-Bereitstellung bleiben gesondert offen. Git überträgt keine Browserdaten.

## Start an einem anderen Rechner

Den Branch `codex/vokabeltrainer-v1` in einem sauberen Checkout verwenden, Node.js ab 22.8 bereitstellen und `npm start` ausführen. Trainer: `http://localhost:4173/trainer/`; isolierte Kaufprobe: `http://localhost:4173/shop-probe/`. Die vorhandene vorbereitete Google-Konfiguration wird weiterverwendet, kein neuer Cloudanbieter oder zusätzlicher kostenpflichtiger Dienst.
