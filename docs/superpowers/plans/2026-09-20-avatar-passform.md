# Korrekturplan: sichtbare und passend befestigte Ausrüstung

Stand: 20.09.2026. Konkreter Korrekturauftrag nach der Nutzerkritik an verdeckter und versetzter Avatar-Ausrüstung. Der [unabhängige Sichtaudit](../../reports/2026-09-20-avatar-fit-audit.md) benennt sechs betroffene Kombinationen. Der bestätigte Figuren-/Ausrüstungsumfang bleibt bestehen; keine neue Produktentscheidung ist nötig.

## Grenzen und Verantwortlichkeiten

- Die 13 Basisfiguren, Preise, Level, Artikel-IDs und Lern-/Kaufregeln bleiben unverändert.
- Keine pauschale Ebenenumkehr. Vorhandene Unterstützung für hintere und vordere Lagen desselben Artikels nutzen.
- Pferd, Einhorn und Pegasus: sichtbares Joch/Schließe und Flankenstoff als körperbezogene vordere Mond-Umhanglage ergänzen. Hintere Drapierung passend anschließen. Beim Pegasus bleiben die Flügel frei.
- Polarlichtwolf und Nebelhirsch: vordere Befestigung mit sichtbarer Drapierung ergänzen; hintere Säume passen zur neuen Lage.
- Tiger: nur den Layer der vier Pfotenreifen körperbezogen korrigieren; alle vier Anker müssen passen. Eine einzige Gesamtverschiebung genügt bei unterschiedlichen Fehlern nicht.
- Echte Rasterquellen mit dem eingebauten Bildwerkzeug bearbeiten. Vollständige transparente Leinwände, feste Registrierung, Herkunft und Prompts erhalten. Kein zusätzlicher API-/Clouddienst.
- Umsetzung in zwei unabhängigen Gruppen mit GPT-5.6 Sol/high; unabhängige Sichtprüfung ebenfalls GPT-5.6 Sol/high. Root verantwortet gemeinsamen Bildbau, Regression, Nachweise und Git.

## Ausführung

- [x] Alte vollständige Sets und Einzelquellen ansehen; technische Dateivollständigkeit von visueller Passform trennen.
- [x] Automatische Regression auf tatsächlichen Renderer-Bildlagen reproduziert: Bei allen fünf Umhängen wird kein deckender Körperpixel sichtbar durch Stoff/Befestigung verändert. Sichtbelege des alten Stands sichern.
- [x] Pferd-Pilot, danach eigene Einhorn-/Pegasus-Lagen erzeugen und auf Groß-/320px-Kompositionen prüfen.
- [x] Wolf-/Hirsch-Lagen und Tiger-Pfotenquelle korrigieren; jeden Pfotenanker einzeln ansehen.
- [x] Herkunftsdateien abschließen; gemeinsame Pipeline einmal ausführen. Transparenz, Registrierung, Katalogabdeckung und kleines Bildbudget prüfen.
- [x] Ganze Sets, Einzelteile, Pferdegruppen-Kombinationen, Handygröße und Fallback erneut prüfen; unabhängige Nachreview durchführen.
- [x] Aktuelle Vorschau, Bedien-/Arbeitsstand und Übergabe aktualisieren, geprüften Stand nach GitHub übertragen und SHA abgleichen: `026186c4dcf769a8175dec5eceb91e09ce53c39e` wurde mit identischer Remote-SHA bestätigt. Der nachfolgende Dokumentationscommit hält den Empfangsbeleg fest.

## Prüfaussage

Der neue Pixeltest prüft sichtbaren Stoff bzw. Befestigungen auf dem Körper und erkennt den bisherigen Verdeckungsfehler. Er bewertet keine Ästhetik und ersetzt nicht die tatsächliche Bildsichtung. Die Nutzerabnahme wird aus automatischem Grün nicht abgeleitet. Die parallel offene echte Google-Kaufprobe bleibt eine eigene technische Abhängigkeit.
