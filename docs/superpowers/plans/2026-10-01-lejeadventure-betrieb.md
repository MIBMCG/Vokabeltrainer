# LejeAdventure Betrieb Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die bestehende App unter einer Adresse mit LejeAdventure und dem neuen Betreiberkonto nutzbar machen; bestehende Lernkonten und Lernbestände erhalten.

**Architecture:** Das vorhandene Google-Projekt und sein OAuth-Client bleiben bestehen. Die parallele Cloudflare-Bereitstellung verwendet eigene Sitzungen; Tasks 1–3 verwenden denselben geprüften Produktcode. Task 4 ergänzt die separat bestätigten öffentlichen Informationsseiten und UI-Links. Lerninhalte bleiben im bisherigen Google Drive.

**Tech Stack:** Bestehende statische PWA, Cloudflare Workers/D1, Google OAuth, vorhandenes Wrangler und PowerShell; keine neue Produktabhängigkeit.

**Spec:** [Einrichtungsentwurf](../specs/2026-10-01-lejeadventure-betrieb-design.md).

## Global Constraints

- Nur App-Betrieb umziehen, Lernbereich im bisherigen Google-Konto lassen.
- Für die abgeschlossenen Tasks 1–3 Produkt `6b13780`, Cache v47, unverändert bereitstellen. Das am 02.10.2026 separat bestätigte Infopaket in Task 4 erlaubt ausschließlich die drei Infoseiten, gemeinsame CSS, öffentliche Aufnahme, Informationslinks und erforderliches Cacheupdate auf v48; Produkt `c39edd8` nur am neuen Worker bereitstellen.
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
- [x] Vollständiger Abgleich, Reload und Wiederaufnahme beim Umstieg geprüft. Damals beobachtete Level/Punkte/Besitz/Auswahl nach Reload gleich; Profil/Lektionen/aktive Wörter nach persönlichem PIN-Öffnen wieder sichtbar. Google-Verbindung und Vollständig abgeglichen ohne erneute Anmeldung. Später geänderte Profilauswahl inzwischen durch bestätigte Nutzeränderungen erklärt; frühere Nachweise nicht als aktueller Bestand ausgegeben.
- [ ] Vorher-/Nachherwerte gegenüber altem Bestand von Profilen, Wortbestand, Lernpunkten, Guthaben, Besitz und Auswahl persönlich bestätigen lassen; Nutzervergleich angefragt, Antwort offen.
- [x] Alte Adresse erreichbar bestätigt: Trainer-HEAD HTTP 200. Geräte-/Safari- und Firefox-Offlinenachweise separat offen halten.
- [x] Startanleitung und Übergabe mit tatsächlicher Adresse aktualisiert. Frische Dokumentenprüfung check:docs PASS: 1.153 Links, null Fehler.
- [x] Ursache des begrenzten Freundeszugangs eingeordnet: App Test/Extern, Betreiberkonto kein Testnutzer. Nutzer wählt anschließend regulären Zugang ohne Testnutzerliste; keine einzelne Freundesadresse mehr erforderlich, keine Testnutzer hinzugefügt. Weiterarbeit in Task 4; physische iPad-Abnahme offen.
- [x] Task-3-Dokumentation mit git diff --check geprüft und als Checkpoint `2933a45` auf beiden bestehenden GitHub-Zweigen gesichert; lokale/entfernte Commit-IDs exakt verglichen. Die anschließende Task-4-Sicherung bleibt separat offen.

### Task 4: Gewählter regulärer Google-Zugang

**Ziel:** Regulärer Zugang ohne Testnutzerliste ist ausdrücklich gewählt und tatsächlich aktiviert. Informationsseiten und Branding sind umgesetzt; echte Freundes-Erstanmeldung und Geräteabnahme bleiben offen.

- [x] Begrenzter Designvorschlag am 02.10.2026 mit „Ja, so umsetzen“ bestätigt: drei öffentliche Seiten unter /trainer/info/ für Startseite, Datenschutz und Nutzungsbedingungen; Links bei Google-Verbindung, tatsächliche Datenverwendung, kostenlose Nutzung/fiktive Punkte und Leje-Kontakt.
- [x] Drei statische HTML-Seiten und gemeinsame CSS erstellt; öffentliche Routen, Staging und expliziten Offlinecache ergänzt. Informationslinks öffnen vor und nach Verbindung einen separaten Tab; keine Anmelde-, Bestands- oder Secretänderung.
- [x] Vor reinem CSS/H1-Nachschliff 666/666 Node-Tests und drei Update-/Sitzungsbrowserfälle PASS. Danach 28/28 gezielte Tests, sechs große und drei normale Layoutansichten sowie zwei Linkfälle frisch PASS. Beide unabhängigen Reviews und enge finale Nachprüfung PASS; keine juristische Vollständigkeit behauptet.
- [x] Produkt `c39edd8ac0d49caea0761f885ff9bc7511d846a5` integriert und ausschließlich an neuem Worker `app` im Leje-Konto bereitgestellt. Cache v48; Version `16721aab-dc02-4959-9900-c204f3727e04` seit `2026-10-02T16:09:00.886Z` zu 100 Prozent aktiv. 391 öffentliche Dateien am `2026-10-02T16:09:40.106Z` bytegleich; drei Infoseiten HTTP 200 ohne Anmeldung, fünf interne Pfade HTTP 404, anonyme Sitzung HTTP 200/false/no-store. Alte App weiterhin v47.
- [x] Branding frisch gespeichert: Appname LejeAdventure, Supportadresse Leje-Betreiberkonto, Startseite `https://app.lejeadventure.workers.dev/trainer/info/`, Datenschutz `https://app.lejeadventure.workers.dev/trainer/info/datenschutz.html`, Nutzung `https://app.lejeadventure.workers.dev/trainer/info/nutzung.html`. Leje-Entwicklerkontakt ergänzt; bisheriger Kontakt und Domains erhalten. Google bestätigt Branding-Änderungen gespeichert.
- [x] Konkreten Google-Veröffentlichungsschritt nach ausdrücklicher Handlungspunktantwort „Ja, jetzt veröffentlichen“ ausgeführt: „App veröffentlichen“ und Dialog „Bestätigen“. Frische Google-Seite zeigt Veröffentlichungsstatus **In Produktion**, Nutzertyp **Extern** und „Zurück zum Test“. Regulärer Zugang ohne Testnutzerliste ist aktiviert; keine pauschale Zugangsgarantie oder unbegrenzte Nutzerzahl daraus ableiten.
- [ ] Echte Erstanmeldung des Freundes und physische iPad-/Safari-Abnahme prüfen; bislang kein erfolgreicher Freundeszugang belegt.
- [x] Geänderte Profilauswahl vor Updateklick eingeordnet: Nutzer bestätigt „Ja, ich habe Änderungen vorgenommen“. Zwei Profile mit Level 1/null Punkten statt früher einem Profil mit höherem Stand sind dadurch erklärt; kein Fehler-/Datenverlustbefund. Keine Bestandsänderung veranlasst.
- [x] Tatsächlichen Zustand nach Übernahme im bestehenden Chrome geprüft: Nutzer bestätigt persönliches PIN-Öffnen; Einstellungen → Google-Verbindung zeigt Vollständig abgeglichen, Google-Verbindung aktiv und beide neuen Informationslinks zu den genauen Infoadressen. Ohne neue Google-Anmeldung; zwei Profile mit Level 1/null Punkten vor und nach dem verschwundenen Updateangebot gleich. Der Hauptagent konnte den ursprünglichen Klick nicht ausführen, weil das Angebot bereits verschwunden war; kein beobachteter „Jetzt aktualisieren“-Klick behauptet.
- [ ] Autorisierte Sicherung von Produkt `c39edd8` und aktuellem Dokumentationsnachtrag auf beiden bestehenden GitHub-Zweigen abschließen und Commit-IDs exakt vergleichen.

Persönlicher Altbestandsvergleich, physische iPad-/Safari-Abnahme und natürlicher Tokenablauf bleiben eigenständige offene Nachweise. Keine neue Pause.
