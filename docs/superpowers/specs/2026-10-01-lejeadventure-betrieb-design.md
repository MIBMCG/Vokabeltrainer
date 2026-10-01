# LejeAdventure: neue Adresse und Betreiberkonto

## Bestätigter Auftrag

Der Nutzer beauftragt am 01.10.2026 die Einrichtung unter einer neuen Adresse
und dem neuen Konto `lejeadventure@gmail.com`. Seine Umfangsentscheidung lautet:
„Nur App-Betrieb umziehen, Lernbereich im bisherigen Google-Konto lassen“.
Als Arbeitsname wird aus der angegebenen Adresse zunächst **LejeAdventure**
verwendet; eine gesonderte Schreibweise des Produktnamens ist nicht bestätigt.

Die zusätzliche Google-Projektrolle **Inhaber** ist ausdrücklich bestätigt.
Google hat die Einladung für das Projekt `vokabeltrainer-508915` gespeichert;
die Annahme durch das neue Konto steht noch aus.

## Begrenzter Einrichtungsentwurf

- Die vorhandene Google-App und ihr Web-OAuth-Client bleiben erhalten. Der neue
  Betreiber verwaltet dasselbe Projekt. Die Lernkonten bleiben unabhängig davon.
- Die kostenlose Cloudflare-Adresse wird im neuen Betreiberkonto parallel zur
  bisherigen App vorbereitet. Das neue Konto und seine Subdomain
  `lejeadventure.workers.dev` sind im Dashboard geprüft; der Workername `app`
  wird als verfügbar angezeigt. Vorgesehene Startadresse ist
  `https://app.lejeadventure.workers.dev/trainer/`. Der Nutzer bestätigt
  die konkrete Einrichtung einschließlich OAuth-Erweiterung ausdrücklich.
  Worker und OAuth-Adressen sind gespeichert; die Trainerdateien sind noch
  nicht bereitgestellt. Keine kostenpflichtige Domain bestellen.
- Den tatsächlichen neuen Ursprung und `/api/auth/callback` zum vorhandenen
  OAuth-Client ergänzen; vorhandene erlaubte Adressen erhalten.
- Eine eigene D1-Sitzungsdatenbank und einen eigenen Sitzungsschlüssel für die
  neue Bereitstellung verwenden. D1 speichert verschlüsselte Anmeldedaten,
  keine Vokabeln, Lernstände oder Punkte.
- Das bestehende geprüfte Produkt `6b13780`, Cache v47, unverändert bereitstellen.
  Nur die vorhandenen öffentlichen Hostingdateien verwenden.
- Unter der neuen Adresse mit dem bisherigen Lernkonto anmelden und den
  vorhandenen Lernbereich bewusst auswählen. Keine Bestände neu anlegen,
  ersetzen, importieren oder in das Betreiberkonto verschieben.
- Die bisherige Adresse während Einrichtung und Abnahme erreichbar lassen.
  Eine spätere Abschaltung gehört nicht zu diesem Schritt.

## Folgen des neuen Ursprungs

Browserdaten, PIN und Anmeldung sind an die Adresse gebunden. Die neue Adresse
übernimmt diese lokalen Daten nicht automatisch. Eine einmalige lokale
Einrichtung und Google-Anmeldung kann erforderlich sein. Ungesendete Änderungen
werden vor dem Wechsel an der bisherigen Adresse abgeglichen. Bestehende
Home-Bildschirm-Verknüpfungen werden erst nach bestandener Abnahme umgestellt.

## Abnahme

Die neue Startadresse liefert das geprüfte Paket; Sitzung und OAuth-Rückkehr
funktionieren am tatsächlichen Ursprung. Nach Anmeldung mit dem bisherigen
Lernkonto sind der vorhandene Lernbereich und dessen Profile, Wörter, Lernpunkte,
Guthaben, Besitz und Auswahl unverändert erreichbar. Reload erhält die Verbindung.
Die bisherige App bleibt erreichbar. Physische Geräte-/Apple-Abnahme und der
separat bekannte Firefox-Offlinenachweis bleiben gesonderte offene Punkte.

## Grenzen

Dies ist ein Einrichtungsentwurf, keine abgeschlossene Adressumstellung.
Registrierung, Bedingungen und Zugangsdaten erledigt der Nutzer dort selbst,
wo eine persönliche Bestätigung nötig ist. Schlüssel gehören nie in Git,
Chat, Screenshots oder öffentliche Dateien. Eine Umgestaltung der Lernoberfläche,
ein neuer OAuth-Client und ein Transfer von Lernbeständen sind nicht beauftragt.
