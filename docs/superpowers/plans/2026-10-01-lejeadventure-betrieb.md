# LejeAdventure Betrieb Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die bestehende App unter einer Adresse mit LejeAdventure und dem neuen Betreiberkonto nutzbar machen; bestehende Lernkonten und Lernbestände erhalten.

**Architecture:** Das vorhandene Google-Projekt und sein OAuth-Client bleiben bestehen. Eine parallele Cloudflare-Bereitstellung verwendet eigene Sitzungen und denselben geprüften Produktcode. Lerninhalte bleiben im bisherigen Google Drive.

**Tech Stack:** Bestehende statische PWA, Cloudflare Workers/D1, Google OAuth, vorhandenes Wrangler und PowerShell; keine neue Produktabhängigkeit.

**Spec:** [Einrichtungsentwurf](../specs/2026-10-01-lejeadventure-betrieb-design.md).

## Global Constraints

- Nur App-Betrieb umziehen, Lernbereich im bisherigen Google-Konto lassen.
- Produkt `6b13780`, Cache v47, unverändert bereitstellen.
- Keine kostenpflichtige Domain bestellen.
- Vorhandene OAuth-Adressen und bisherige Bereitstellung erhalten.
- Keine Bestände neu anlegen, ersetzen, importieren oder in das Betreiberkonto verschieben.
- Schlüssel gehören nie in Git, Chat, Screenshots oder öffentliche Dateien.

## Review Focus

- Eine gespeicherte Einladung allein belegt keinen Betreiberzugang; tatsächliche Annahme und Zugriff im richtigen Konto prüfen.
- Falsches Cloudflare-Konto oder Worker-Ziel: alten Worker und seine Sitzungen nicht überschreiben.
- OAuth-Ursprung oder Rückkehradresse falsch: tatsächliche HTTPS-Adresse und exakten Callback vergleichen.
- Neues Betreiberkonto im Trainer ausgewählt: bestehendes Lernkonto und dessen vorhandenen Bereich verwenden.
- Neue Adresse mit eigenen Browserdaten: PIN, Google-Verbindung und Verknüpfungen erst nach erfolgreichem Abgleich wechseln.

---

### Task 1: Wirksamer Betreiberzugang

**Files:** Ergebnis in `docs/handoffs/2026-10-01-lejeadventure-einrichtung.md` dokumentieren.

**Interfaces:** Produziert den im Dashboard überprüften neuen Betreiberzugang und die tatsächliche Cloudflare-Konto-ID.

- [x] Projekt `vokabeltrainer-508915` und aktuellen Inhaber im Google-Dashboard prüfen.
- [x] Ausdrückliche Zustimmung zur zusätzlichen Inhaberrolle einholen und Einladung speichern.
- [x] Persönliche Anmeldung am neuen Google-Konto im gesteuerten Browser abschließen; am 02.10.2026 zeigt die Console `lejeadventure@gmail.com`. Der direkte Projektaufruf meldete zunächst fehlende Zugriffsrechte; Anmeldung allein ist keine Inhaberabnahme.
- [x] Annahme durch `lejeadventure@gmail.com` und wirksamen Projektzugang prüfen. Am 02.10.2026 nach konkreter Bestätigung am Handlungspunkt angenommen; das neue Konto öffnet das bestehende Projekt, IAM zeigt Inhaber ohne Einladungswarnung. Bisheriger Inhaber und vorhandener OAuth-Client bleiben erhalten.
- [x] Nutzer meldet sich bei Cloudflare mit dem neuen Konto an; gegebenenfalls Registrierung/Bedingungen selbst abschließen.
- [x] Kontoname/-ID aus dem Dashboard dokumentieren; keine vorhandenen Schlüssel oder persönlichen Inhalte auslesen.

### Task 2: Tatsächliche Zieladresse und getrennte Bereitstellung

**Files:** Ignorierte Konfiguration `server/wrangler.local.lejeadventure.jsonc` und getrennter geschützter Upload-Helfer `.superpowers/lejeadventure-umzug/deploy-token.ps1`; bestehende `server/wrangler.example.jsonc`, `server/schema.sql`, `scripts/prepare-cloudflare.mjs` als Vorlagen verwenden. Öffentliche Quellen unverändert lassen.

**Interfaces:** Konsumiert die geprüfte neue Konto-ID. Produziert `APP_ORIGIN`, Worker-Namen, D1-ID und getrennte, geschützte Zugangsdaten.

- [x] Im neuen Konto Verfügbarkeit von `lejeadventure.workers.dev` prüfen; Kandidat `app` führt zu `https://app.lejeadventure.workers.dev/trainer/`.
- [x] Tatsächliche Adresse in den Entwurf aufnehmen und den begrenzten Einrichtungsentwurf vom Nutzer prüfen lassen, bevor Bereitstellung und OAuth-Erweiterung erfolgen.
- [x] Eigene D1-Datenbank anlegen und ausschließlich das bestehende Sitzungsschema anwenden.
- [x] Lokale Konfiguration mit neuer Konto-ID, tatsächlichem Ursprung, D1-Bindung, `preview_urls: false` und `observability.enabled: false` vorbereiten.
- [x] Vorhandenen OAuth-Client behalten; neuen Ursprung und exakten Callback ergänzen. Bei nötiger Zugriffsfreigabe direkt vor dem Speichern die konkrete Bestätigung einholen.
- [x] Neuen Cloudflare-Upload-Schlüssel mit Workers-Schreibrecht und D1-/Kontoleserecht ausschließlich für das neue Konto vorbereiten; Nutzer erstellt ihn selbst und gibt ihn geschützt ein. Der Helfer muss Zielkonto, Worker und Ursprung prüfen und den alten Helfer/Schlüssel erhalten. Persönliche erneute Rotation/Eingabe und Kontonachweis am 02.10.2026 bestätigt.
- [x] Vorhandenes OAuth-Secret und neuen 32-Byte-Sitzungsschlüssel ausschließlich geschützt am neuen Worker hinterlegen; Zielkonto vor Übertragung geprüft. Am 02.10.2026 gezielte Korrektur aus validierter vorhandener JSON-Quelle Exitcode 0; nur GOOGLE_CLIENT_SECRET geschrieben, SESSION_ENCRYPTION_KEY erhalten. Unabhängige Spec/Quality-Nachprüfung PASS, 75+30 synthetische Tests, AST 0. Tatsächliche Google-OAuth-Akzeptanz bleibt Task 3.
- [x] Aus `server/` mit vorhandenem Wrangler Dry-run durchführen.
- [x] Nach erfolgreichem Staging/Dry-run, geprüftem Konto und hinterlegten Secrets bereitgestellt. Deploy Exitcode 0; Worker-Version 6cb68583-879f-4211-93cc-9ec11d144feb zu 100 Prozent aktiv, Autor lejeadventure@gmail.com. Produkt 6b13780 / Cache v47 unverändert.

### Task 3: Neue Adresse abnehmen und Startanleitung umstellen

**Files:** `docs/CLOUDFLARE-EINRICHTUNG.md`, `docs/GOOGLE-DRIVE-EINRICHTUNG.md`, vorhandene Startanleitung, `START-HIER.md`, `ARBEITSSTAND.md`, `AGENTS.md`, `docs/ROADMAP.md`, Übergabe.

**Interfaces:** Konsumiert den tatsächlich aktiven neuen Ursprung. Produziert verifizierte Startadresse, dokumentierte Grenzen und einen erhaltenen alten Zugang.

- [x] Öffentliche Dateien mit dem geprüften Paket bytegleich verglichen: 387/387 am 2026-10-02T14:53:21.821Z; interne Repository-/Server-/Sicherungspfade HTTP 404. Wiederholung mit node --use-system-ca PASS, keine Zertifikatsprüfung deaktiviert.
- [x] Sitzungsstatus ohne Anmeldung geprüft: HTTP 200, unangemeldet, no-store.
- [x] Echte Google-Rückkehr mit dem bisherigen privaten Lernkonto geprüft: Rückkehr nach /trainer/ unter neuem Ursprung, aktive Verbindung und Drive-Zugriff belegt. Altadresse vollständig abgeglichen vom Nutzer bestätigt; anschließende bewusste Übernahme und vollständiger Abgleich belegt.
- [x] Temporäre lokale Grundmaske mit PIN und Übernahme des vorhandenen Drive-Lernbereichs abgeschlossen. Hauptagent führte die bewusste Bestätigung nach Vorschau unter ausdrücklich genehmigter vorheriger Bereichsauswahl aus. Lokale Startdaten ersetzt; keine neue Drive-Root. Verbundener Lernbereich und Vollständig abgeglichen belegt.
- [x] Vollständiger Abgleich, Reload und Wiederaufnahme geprüft. Beobachtete Level/Punkte/Besitz/Auswahl nach Reload gleich; Profil/Lektionen/aktive Wörter nach persönlichem PIN-Öffnen wieder sichtbar. Google-Verbindung und Vollständig abgeglichen ohne erneute Anmeldung.
- [ ] Vorher-/Nachherwerte gegenüber altem Bestand von Profilen, Wortbestand, Lernpunkten, Guthaben, Besitz und Auswahl persönlich bestätigen lassen; Nutzervergleich angefragt, Antwort offen.
- [x] Alte Adresse erreichbar bestätigt: Trainer-HEAD HTTP 200. Geräte-/Safari- und Firefox-Offlinenachweise separat offen halten.
- [x] Startanleitung und Übergabe mit tatsächlicher Adresse aktualisiert. Frische Dokumentenprüfung check:docs PASS: 1.153 Links, null Fehler.
- [x] Ursache des begrenzten Freundeszugangs eingeordnet: App Test/Extern, Betreiberkonto kein Testnutzer. Nutzer wählt anschließend regulären Zugang ohne Testnutzerliste; keine einzelne Freundesadresse mehr erforderlich, keine Testnutzer hinzugefügt. Weiterarbeit in Task 4; physische iPad-Abnahme offen.
- [ ] git diff --check und autorisierte Git-Sicherung der Dokumentation auf beiden bestehenden GitHub-Zweigen durchführen; lokale/entfernte Commit-IDs exakt vergleichen. Git-Sicherung noch ausstehend.

### Task 4: Gewählter regulärer Google-Zugang

**Ziel:** Regulärer Zugang ohne Testnutzerliste ist ausdrücklich gewählt. Noch keine Veröffentlichung.

- [x] Branding gespeichert: Appname LejeAdventure, Supportadresse Leje-Betreiberkonto, Leje-Entwicklerkontakt ergänzt und bisherigen Kontakt erhalten. Google bestätigt Branding-Änderungen gespeichert.
- [x] Begrenzter Designvorschlag am 02.10.2026 mit „Ja, so umsetzen“ bestätigt: drei öffentliche Seiten unter /trainer/info/ für Startseite, Datenschutz und Nutzungsbedingungen; Link bei Google-Verbindung, tatsächliche Datenverwendung, kostenlose Nutzung/fiktive Punkte und Leje-Kontakt. Seiten noch nicht erstellt.
- [ ] Nach Bestätigung die fehlenden öffentlichen Seiten und Branding-Voraussetzungen konkret umsetzen und prüfen. Zielgruppenstatus aktuell Test; App veröffentlichen weiterhin deaktiviert. Keine vollständige Umsetzung oder reguläre Google-Freigabe behaupten.
