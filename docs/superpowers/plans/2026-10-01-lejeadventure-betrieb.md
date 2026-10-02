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

- Einladung gespeichert, aber noch nicht angenommen: neues Konto noch nicht als wirksamen Betreiber melden.
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
- [x] Persönliche Anmeldung am neuen Google-Konto im gesteuerten Browser abschließen; am 02.10.2026 zeigt die Console `lejeadventure@gmail.com`. Der direkte Projektaufruf meldet noch fehlende Zugriffsrechte; Anmeldung allein ist keine Inhaberabnahme.
- [ ] Annahme durch `lejeadventure@gmail.com` und wirksamen Projektzugang prüfen.
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
- [ ] Vorhandenes OAuth-Secret und neuen 32-Byte-Sitzungsschlüssel ausschließlich geschützt am neuen Worker hinterlegen; Zielkonto vor der Übertragung prüfen.
- [x] Aus `server/` mit vorhandenem Wrangler Dry-run durchführen.
- [ ] Nur nach erfolgreichem Staging/Dry-run, geprüftem Konto und hinterlegten Secrets bereitstellen.

### Task 3: Neue Adresse abnehmen und Startanleitung umstellen

**Files:** `docs/CLOUDFLARE-EINRICHTUNG.md`, `docs/GOOGLE-DRIVE-EINRICHTUNG.md`, vorhandene Startanleitung, `START-HIER.md`, `ARBEITSSTAND.md`, `AGENTS.md`, `docs/ROADMAP.md`, Übergabe.

**Interfaces:** Konsumiert den tatsächlich aktiven neuen Ursprung. Produziert verifizierte Startadresse, dokumentierte Grenzen und einen erhaltenen alten Zugang.

- [ ] Öffentliche Dateien mit dem geprüften Paket bytegleich vergleichen; interne Repository-/Server-/Sicherungspfade müssen gesperrt bleiben.
- [ ] Sitzungsstatus ohne Anmeldung prüfen, anschließend echte Google-Rückkehr mit dem bisherigen Lernkonto prüfen.
- [ ] Nutzer richtet bei frischer Adresse die notwendige temporäre lokale Grundmaske mit PIN ein. Vor jeder Drive-Bindung bleibt dieser Stand lokal; danach den vorhandenen Drive-Lernbereich über Vorschau und ausdrückliche Bestätigung übernehmen. Der vorhandene Übernahmeweg ersetzt die lokalen Startdaten und leert ihre Uploadwarteschlange; keinen neuen Drive-Lernbereich anlegen. Codepfad am 02.10.2026 geprüft, reale Abnahme weiterhin offen.
- [ ] Vorher-/Nachherwerte von Profilen, Wortbestand, Lernpunkten, Guthaben, Besitz und Auswahl vergleichen; vollständigen Abgleich und Reload prüfen.
- [ ] Alte Adresse erreichbar bestätigen; Geräte-/Safari- und Firefox-Offlinenachweise separat offen halten.
- [ ] Startanleitung und Übergabe mit tatsächlicher Adresse aktualisieren. `npm run check:docs` und `git diff --check` ausführen.
- [ ] Autorisierte Dokumentation auf beiden bestehenden GitHub-Zweigen sichern und lokale/entfernte Commit-IDs exakt vergleichen.
