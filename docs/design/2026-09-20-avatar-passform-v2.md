# Körperbezogene Ausrüstung: Reparaturansatz nach dem Zweitaudit

Stand: 20.09.2026. Die Korrektur der vorhandenen Figurenwelt ist beauftragt. Dieser Ansatz beantwortet die erneute Nutzerkritik; er erweitert weder Katalog noch Preise, Freischaltungen oder Figurenumfang. Die klassische Bearbeitung ist inzwischen ausdrücklich freigegeben: „Ja, du darfst die Bildbearbeitung dafür verwenden“. [Ausführungsplan](../superpowers/plans/2026-09-20-avatar-fit-v3.md).

Ergänzende Nutzersteuerung: Die zuletzt gezeigten alten Bilder passen weiterhin nicht; insbesondere ragen die Umhänge bei Pferden/Einhörnern über, und vollständig sichtbare Ringe wirken vor den Avatar gehängt. **Alle Figuren und Ausrüstungsteile müssen nachgearbeitet werden.** Pferd/Tiger waren nur die erste Methodenprobe. Die Methodenfreigabe liegt inzwischen ausdrücklich vor; eine persönliche visuelle Abnahme wurde dadurch nicht erteilt.

## Konkretes sichtbares Ziel

Bei einem Beinreifen soll das Bein durch die Öffnung laufen: Fell oder Fessel verdecken den hinteren Bogen, nur der vordere Bogen liegt über dem Bein. Jeder Reifen erhält einen eigenen Durchmesser und Winkel entsprechend seinem Lauf. Ein opakes dunkles Becherinneres darf nicht über das Fell gemalt bleiben. Vier grob überlappende Ringmittelpunkte genügen nicht.

Zuerst werden die Hufreifen des Pferds und die Pfotenreifen des Tigers als begrenzte, sichtbare Probe bearbeitet. Sie repräsentieren die wiederkehrenden Fehler der Pferde- und Pfotengruppen. Grundkörper und übrige Ausrüstung bleiben dabei zunächst unverändert. Große Nahansichten und die tatsächliche kleine Karte zeigen jeweils vorher/nachher. Diese Probe ist keine Freigabe aller weiteren Gegenstände.

## Methodenvergleich und Empfehlung

| Weg | Nutzen | Grenze |
| --- | --- | --- |
| Weitere vollständige Ausrüstungslagen neu generieren | Bestehende Arbeitsweise | Die wiederholten Ergebnisse verfehlen weiterhin Winkel, Abstände und Verdeckung. Kein weiterer ungezielter Durchlauf empfohlen. |
| Vorhandene Rasterteile einzeln an den Körper anpassen | Genaue Position, Winkel und Verdeckung; Stil bleibt erhalten | Benötigt gezielte Bildbearbeitung sowie manuelle Kontrolle jeder Befestigung. Empfohlen. |
| Jede komplette Outfitkombination als fertiges Bild erzeugen | Keine Laufzeitüberlagerung innerhalb eines Bildes | Sehr viele Kombinationen, schwer korrigierbar; würde die frei kombinierbare Ausrüstung unnötig einschränken. Nicht empfohlen. |

## Begrenzte technische Umsetzung des empfohlenen Wegs

1. Originalquellen und ihre Prüfsummen erhalten; Arbeitskopien sowie reproduzierbare Bearbeitungsrezepte verwenden.
2. Aus den vierteiligen Bildern jeden Reifen einzeln isolieren. Pro Lauf Position, Breite, Achse und Perspektive am exakten Grundkörper festlegen.
3. Hinterbogen und Vorderband trennen. Dunkle Ringinnenflächen entfernen, soweit sie vom Bein ausgefüllt beziehungsweise verdeckt sein müssen. Rückwärtige Flächen unter die Basis, sichtbare Bänder darüber legen.
4. Die angepassten Teile wieder zu transparenten Vollcanvas-Bildern zusammenführen. Der vorhandene Renderer `rear → base → front` bleibt für diesen Pilot ausreichend; die Individualisierung geschieht bei der Bildproduktion. Keine neue App-Abhängigkeit und kein allgemeines 3D-/Skelettsystem.
5. Wo Mähnen, Finger oder nahe Flügel eine Vorderlage örtlich verdecken müssen, die entsprechende Stelle im jeweiligen Ausrüstungsbild maskieren. Wenn eine Kombination damit nicht eindeutig darstellbar ist, den konkreten Fall erneut entwerfen; nicht die Basis übermalen oder fehlende Tiefe durch Leuchten verdecken.
6. Provenienz, Teiltransformationen und Masken dokumentieren. Quellen und abgeleitete WebPs müssen eindeutig zusammengehören. Bestehende Quellen nicht stillschweigend als neu generiert ausgeben.

## Prüfmaßstab und anschließende Übertragung

Die [visuellen Kriterien im Zweitaudit](../reports/2026-09-20-avatar-fit-second-audit.md) sind maßgeblich. Insbesondere sind Position und echte Verdeckung getrennt zu beurteilen. Geprüft wird auf hellem Hintergrund in großer Ansicht und bei 256 Pixeln Kartenbreite. Pixelüberdeckung bleibt höchstens ein technischer Schutz gegen vollständig verschwundene Teile.

Nach einem überzeugenden Pilot wird derselbe Ansatz auf Pferd/Einhorn/Pegasus, Tiger/Wolf/Panther/Hirsch und danach Kragen, Umhänge, Handobjekte, Gurte und Flügelzier übertragen. Alle 62 kompatiblen Figur-/Artikelpaare und vollständige Sets werden getrennt angesehen. Bekannte Probleme dürfen nicht aus einer kleinen Gesamtübersicht heraus als erledigt gelten.

Die Shopintegration bleibt unabhängig von diesem Bildansatz an einen belastbaren Kaufvertrag gebunden. Reale Geräteabnahmen bleiben offen. Ein internes Sichturteil wird ausdrücklich von einer persönlichen Nutzerabnahme unterschieden.
