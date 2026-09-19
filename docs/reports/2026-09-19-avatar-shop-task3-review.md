# Unabhängige Nachprüfung: Avatarbilder und Halskorrektur

Stand: 19.09.2026. Lokales Teilpaket auf Basis `f61c6ef`, Branch `codex/vokabeltrainer-v1`. Konsolidierte Belege aus getrennten Prüfaufträgen; keine Freigabe des noch nicht integrierten Produktshops.

## Bestehende Produktfigur

Prüfer: GPT-5.6 Sol, hohe Denktiefe, unabhängig von der Implementierung. Ergebnis: keine konkreten Fehler oder Regressionen im geprüften Umfang.

- Die 16 bisherigen Bildschlüssel, Dateinamen und der Manifest-Vertrag bleiben erhalten; alle 48 Avatar-WebPs verwenden die fest registrierten Quellen.
- Die sechs Landschafts-WebPs stimmen bytegenau mit dem Ausgangsstand überein. Die Produktbilder benötigen insgesamt nur 422 Byte mehr.
- Alle 18 Hemdrenditionen haben am Halsanker Alpha 0, alle zwölf Hautrenditionen dort Alpha 253. Vorher- und Nachherkompositionen wurden geöffnet.
- Produktcache v20 und synthetischer Updatecache v21 sind konsistent. Weder Datenmodell noch Auswahlbefehle wurden für diese Korrektur geändert.
- Frisch ausgeführt: 14/14 fokussierte Node-Tests (`art-build`, `art`, `sw`), 1/1 Hals-Browserfall, 2/2 Avatar-/Offlinefälle und 2/2 Worker-Updatefälle. Die Tests verwenden frische Edge-Profile, freie lokale Ports und synthetische Daten.

## Neue Bildpipeline

Erste Prüfung: GPT-6 Astra, hohe Denktiefe. Anschließende unabhängige Pipelineprüfung und Nachprüfung: GPT-5.6 Sol, hohe Denktiefe.

Die Reviewrunde führte zu reproduzierten Korrekturen für leere bzw. außerhalb der Leinwand liegende Quellen, beschädigte Bilder, fehlende oder falsch zugeordnete Herkunftsdateien und den Maßstab bei abweichender Quellleinwand. Weitere Befunde betrafen künstliche Transparenzränder nach Registrierung sowie uniforme Alpha-254-Flächen. Beide Fälle sind geschlossen: der Encoder verlangt mindestens einen vollständig transparenten Pixel in der unveränderten dekodierten Quelle; sichtbare Bildteile prüft er separat nach Registrierung.

Die letzte enge Nachprüfung bestätigt **PASS, keine offenen Befunde in diesem Scope**. Selbst ausgeführte Tests: 14/14 Node-Tests für die Avatarpipeline und 1/1 echter Edge-Encoderfall, der sowohl Alpha-255- als auch Alpha-254-Rechtecke zurückweist. Das Manifest wurde direkt gelesen: 93 Bildlagen, `complete/ready=true`, keine fehlenden, ungültigen oder falsch zugeordneten Lagen, 960.222 Byte klein und 8.786.364 Byte insgesamt.

## Grenzen

Die vollständige Sichtprüfung und die frischen Root-Abschlusstests stehen im [Umsetzungsbericht](2026-09-19-avatar-shop-task3.md). Die Renderer-Prüfansicht ist noch keine produktive Figurenwahl. Guthaben, Besitz, Käufe, Migration, echte Google-Schreibgarantien und die physische iPhone-/iPad-Abnahme sind durch diese Review nicht bestätigt.
