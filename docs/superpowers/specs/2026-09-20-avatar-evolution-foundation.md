# Technischer Entwurf: Grundlage der Avatar-Entwicklungsformen

Stand: 20.09.2026. Grundlage sind die bestätigten [Entscheidungen EV01–EV05](../../design/2026-09-20-avatar-entwicklungsstufen.md) und die weiterhin gültigen Figurenpreise/Levelschwellen des [Avatar-Shop-Entwurfs](2026-09-19-avatar-shop-design.md). EV05 bestätigt nun auch den Oberflächenaufbau. Dieses Paket bereitet den Stufenkatalog und die erste Produktionsreihe vor; es aktiviert noch keine Käufe oder neue Datenformate im Trainer.

## Ergebnis und Grenzen

Der bestehende modulare Katalog wird unverändert für historische Daten und die klassische Ansicht erhalten. Ein eigenes Modul beschreibt die neuen vollständigen Stufenbilder. Es importiert die bestehenden 13 Figuren einschließlich ihrer unveränderten Grundpreise und Levelschwellen, aber keine kaufbare modulare Ausstattung. Vier Stufen ergeben 52 stabile Formkennungen. Zwei menschliche Figuren mit je vier Hauttönen ergeben zusammen mit den elf anderen Figuren 76 Bildkennungen.

Die Drachenreihe wird zuerst aus der bestätigten Bildrichtung in vier eigenständige transparente Illustrationen überführt. Ein fertiges Bild enthält Figur, Rüstung und Magie. Die erste Reihe belegt die Produktionsmethode; die restlichen Motive werden später nach demselben Vertrag ergänzt. Sie gelten nicht aufgrund des Katalogeintrags als bereits vorhanden.

Kein Produktzustand wird durch diese Vorbereitung migriert. Keine Belohnungen, Punkte oder Lernstände werden geändert. Das neue reine Katalogmodul wird noch nicht in `trainer/main.js` oder den Service Worker eingebunden. Die fehlende reale Kaufkoordination bleibt eine getrennte technische Voraussetzung der späteren Integration; eine grüne Katalogprüfung ersetzt diese nicht.

## Verbindliche Konstanten

- Vier Stufen einschließlich Grundform; Stufen werden der Reihe nach erworben.
- Einzelpreise für 1→2, 2→3 und 3→4: 200, 400 und 800 Punkte.
- Menschliche Hauttöne: ganzzahlige Werte 0, 1, 2 und 3; kostenlos und ohne eigene Kaufkennung.
- Alle übrigen Figuren haben je Stufe genau eine Bildkennung.
- Klassisch ist eine zusätzliche Auswahl, keine fünfte Stufe. Die bisherigen Farben und Ausrüstungswerte bleiben getrennt gespeichert; neue Stufen erhalten keine Zubehörlagen.
- Native JavaScript-Module, Node.js ab 22.8, keine zusätzliche Laufzeitabhängigkeit.
- Keine Google-Tokens, privaten Kennungen oder echten Lernprofile in Artefakten und Prüfberichten.

## Katalogschnittstelle

Datei: `src/trainer/avatar/evolution.js`.

`EVOLUTION_VERSION = 1` versioniert diesen neuen Katalog unabhängig vom historischen Ausrüstungskatalog.

`evolutionFormId(figureId, stage)` gibt `evolution:<figureId>:<stage>` zurück. Nur bekannte Figuren und ganzzahlige Stufen 1–4 werden akzeptiert. Ungültige Werte lösen `TypeError` aus. Die Stufenkennung bleibt bei einem Hauttonwechsel gleich; ein solcher Wechsel kostet keinen weiteren Kauf.

`evolutionAssetKey(figureId, stage, skin = 0)` gibt `<figureId>-stage-<stage>-skin-<skin>` für Menschen, sonst `<figureId>-stage-<stage>` zurück. Ein unbekannter Hautton wird nicht stillschweigend einem anderen Kind oder einer anderen Variante zugeordnet: nur ganze Werte 0–3 sind zulässig; nichtmenschliche Figuren akzeptieren ausschließlich 0.

`EVOLUTION_FORMS` ist ein tief eingefrorenes Array mit 52 Einträgen `{id, figureId, stage, price, assetKeys}`. `price` ist 0 für die Grundform, danach 200/400/800. Der Grundfigurpreis aus `FIGURES` kommt getrennt hinzu. `assetKeys` listet vier Varianten bei Menschen und eine bei anderen Figuren. Es enthält keine URLs für noch nicht produzierte Bilder.

`evolutionOffer({figureId, highestOwnedStage, availablePoints})` beschreibt ausschließlich die Darstellung. Der Aufrufer liefert später den aus bestätigtem Besitz abgeleiteten Stand, keine frei vertrauten Formulardaten. `highestOwnedStage` ist 0–4, `availablePoints` eine nichtnegative sichere Ganzzahl. Rückgabe: `{status, nextStage, price, missingPoints, progress}`:

- Stand 0: `{status:'base-locked', nextStage:null, price:null, missingPoints:null, progress:0}`. Eine Vorschau verschenkt keine Grundfigur.
- Stand 1–3: nächste Stufe und deren Einzelpreis; fehlende Punkte `max(0, price-availablePoints)`, Fortschritt `min(1, availablePoints/price)`, Status `available` bei ausreichendem Guthaben, sonst `saving`.
- Stand 4: `{status:'complete', nextStage:null, price:null, missingPoints:0, progress:1}`.

Die Funktion bucht nichts ab, verändert keine Eingabe und prüft keine Netzwerkfreigabe. Sie darf nicht als Kaufautorisierung verwendet werden. Die spätere Transaktion prüft Besitz, Reihenfolge, Preis/Katalogversion, Guthaben, Vorgangskennung und Epoche erneut.

## Bildvertrag

Quellen und Erzeugungsnachweise liegen unter `docs/design/avatar-evolution-sources/`. Zunächst werden `dragon-stage-1-v1.png` bis `dragon-stage-4-v1.png` erzeugt, jeweils mit JSON-Nachweis zu Prompt, Referenz und Werkzeug. Die Backend-Modellkennung wird nur angegeben, wenn das Werkzeug sie liefert.

Die Bilder sind echte RGBA-PNGs mit Alpha 0 außerhalb der Figur. Keine Beschriftung, Rahmen, Bodenrechtecke oder aufgemalten Schachbrettmuster. Alle Gliedmaßen, Flügel, Hörner und Schweife müssen vollständig sein. Die Endform muss sich deutlich in Silhouette und mythischen Merkmalen von Stufe 3 unterscheiden. Bloß mehr Rüstung erfüllt die bestätigte Richtung nicht.

Technische Ableitungen verwenden einen gemeinsamen transparenten Darstellungsrahmen ohne Strecken. Ausgaben werden nur verkleinert, nicht hochskaliert. Zielbreiten sind 256, 512 und 768 Pixel, soweit die Quelle diese Auflösung trägt. Jede Variante zeigt das vollständige fertig gemalte Motiv; es werden keine separaten Ausrüstungsbilder erzeugt. Ein Manifest darf nur tatsächlich erzeugte und geprüfte Dateien enthalten.

Quellenprüfung: Bild lesbar, Alpha vorhanden, Figur vollständig, klare Differenzierung aller vier Stufen. Kleine Ansichten werden auf hellen und dunklen Flächen betrachtet. Die technische Freigabe eines Bildes ist keine erfundene Nutzerabnahme. Die übrigen 72 Motive bleiben als ausstehende Produktion sichtbar.

## Spätere Integration – eigenes Arbeitspaket

„Meine Figur“ zeigt klassische Gestaltung und Entwicklungsfiguren. „Entwicklung“ zeigt vier Formen, nächste Form, Preis und fehlende Punkte. „Shop“ zeigt Grundfiguren. Kaufbestätigung nennt Restguthaben; Auswahl erfolgt erst bewusst nach bestätigtem Besitz. Offline bleiben eigene Figuren nutzbar. Nicht geladene Bilder bekommen einen verständlichen Hinweis.

Vor Aktivierung werden ein versionierter Produktvertrag, atomare Migration mit Altsicherung, Besitz-/Guthabenprojektion, Auswahlereignisse, Backup/Wiederherstellung und Service-Worker-Update gemeinsam geplant und geprüft. Der Stand bisheriger klassischer Auswahl bleibt erhalten. Kostenlose Ritterausstattung wird der klassischen Gestaltung zugeordnet; sie macht neue Entwicklungsformen nicht modular.

Der Diagnose-4-Schreibkandidat hat zwei konkurrierende Schreibversuche akzeptiert. Keine unveränderte Wiederholungsprobe und keine Lockerung der Prüfbedingungen. Ein neuer Kandidat braucht eine eigene Begründung und reale Nachweise, bevor der Produktkaufweg aktiviert wird. Anbieter, Kontenmodell und Kosten bleiben unverändert.

## Prüfung dieses Pakets

Katalog: vollständige und eindeutige 52 Form-/76 Bildkennungen, unveränderte Grundfreischaltungen, richtige Stufenpreise und Grenzen, keine Sprünge, keine Käufe durch Vorschau, kostenlose Hauttonvarianten, ungültige Eingaben und unveränderte Eingaben. Historische Katalog-/Auswahltests müssen weiter bestehen.

Bilder: tatsächliche Sichtprüfung und technische Alpha-/Auflösungsprüfung. Dokumentationslinks und Diff vor Commit prüfen. Keine reale iOS-, Google- oder Zwei-Geräte-Abnahme aus diesen Prüfungen ableiten.
