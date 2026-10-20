# Lernbereiche Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Vorhandene Lernbereiche direkt verbinden, verwalten und schneller laden.

**Architecture:** Bestehende Commands, ProductSync und Anmeldung erweitern.
Veränderliche Ordnernamen bleiben vom unveränderlichen Descriptor getrennt.
Erstbeitritt prüft einen isolierten Remotezustand vor atomarer Installation.

**Tech Stack:** JavaScript ESM, Node.js >=22.8.0, IndexedDB, Google Drive,
vorhandener Cloudflare-Proxy, Playwright nur als Entwicklungswerkzeug.

**Spec:** [Bestätigter Entwurf](../specs/2026-10-20-lernbereiche-design.md).

## Global Constraints

- Google Drive bleibt Datenspeicher; kein neuer Anbieter oder kostenpflichtiges Abo.
- Descriptorhash, Lernereignisse, Besitz, Preise und Datenformate erhalten.
- Nur synthetische Testdaten; keine persönlichen Browserdaten oder Secrets lesen.
- Keine endgültige Löschung; aktuell gebundenen Bereich vor Papierkorb schützen.
- Erstbeitritt aus null atomar; fremde lokale Arbeit und Sicherheitskopien erhalten.
- Kein neues Framework und keine Produktionsabhängigkeit.
- Neue Produktcachekennung v54; Offline- und kontrollierter Updatefall ausführen.
- Keine Bereitstellung, kein Merge nach main und kein Force-Push.

## Gemeinsame Schnittstellen und Dateiverantwortung

- Transport: `drive.updateDatasetFolder({id, datasetId, expectedVersion, name,
  trashed, beforeWrite})` liefert nachgelesene Metadaten. Genau eine Änderung (`name` oder
  `trashed: true`); eigene gekennzeichnete Produkt-Rootordner prüfen.
- Core: `sync.discover()` liefert bestehende Auswahlobjekte plus `displayName`,
  `accountId`, `folderVersion`; `sync.renameDataset(selection, name, {isAllowed})`
  liefert aktualisierte Auswahl; `sync.trashDataset(selection, {isAllowed})`
  bestätigt Papierkorb. Optionale Freigabeprüfung unmittelbar vor dem Schreiben;
  Anzeigenamen höchstens 80 Zeichen.
- `sync.joinDataset(selection, 'preview'|'confirm')` unterstützt zusätzlich
  `commands.getState() === null`; dieselbe UI-Schnittstelle bleibt bestehen.
- `sync.getDatasetName()` liefert den bekannten Anzeigenamen des aktiven
  Bestands, mit Rückfall auf den unveränderlichen Namen; kein Ledger-Umschreiben.
- UI startet nach bestätigtem Join unmittelbar den vorhandenen `sync.retry()`
  und verwendet den vorhandenen Status. Der Null-Join lädt vor Installation.

### Task 1: Begrenzte Metadatenänderung

**Files:** `src/drive/client.js`, `server/auth-service.js`,
`tests/drive/client.test.js`, `tests/server/auth.test.js`.

- [x] Neue Verhaltenstests für Umbenennen, Papierkorb, falsche Ordnerkennung,
  veraltete Auswahl, 412, Konto-/Tokenwechsel und unklare Antwort schreiben.
- [x] Mit `node --experimental-sqlite --test --experimental-test-isolation=none
  tests/drive/client.test.js tests/server/auth.test.js` das erwartete Fehlschlagen
  ansehen und danach den begrenzten Transport implementieren.
- [x] Ausschließlich die erforderliche Metadatenroute im Proxy erlauben;
  Ursprung, Sitzung und Kontobindung erhalten. Tests erneut ausführen.

### Task 2: Direkter atomarer Join und schnellere Suche

**Files:** `src/trainer/sync/drive.js`, `src/trainer/commands.js`,
`tests/trainer/sync.test.js`, `tests/trainer/commands.test.js`.

- [x] Vor Implementierung Fehlerfälle testen: null → vollständiger Bestand;
  Vorschau/Fehler ohne lokale Installation; konkurrierende Einrichtung;
  Anzeigename unabhängig vom Descriptor; aktiver/fremder Root geschützt.
- [x] Begrenzte vierfache Discoveryparallelität mit gezählter Überlappung und
  vollständigem Fehlerabschluss prüfen; neuen Test zuerst fehlschlagen sehen.
- [x] Commands um atomare Erstinstallation eines geprüften Remotezustands
  ergänzen; vorhandene Join-Sicherheitskopien und Vorschauwiederverwendung erhalten.
- [x] `renameDataset`, `trashDataset`, `getDatasetName` mit frischen Bindungs-
  und Identitätsprüfungen implementieren. Keine Kaufoptimierung ergänzen.
- [x] `node --test --experimental-test-isolation=none tests/trainer/sync.test.js
  tests/trainer/commands.test.js` und relevante Kauf-Joinregressionen prüfen.

### Task 3: Einstieg und Erwachsenenverwaltung

**Files:** `src/trainer/ui/shell.js`, `src/trainer/ui/sync.js`,
`src/trainer/main.js`, optional fokussiertes UI-Modul und `trainer/styles.css`,
`tests/browser/learning-areas.browser.mjs`, HTTP-Fixture unter `tests/browser/`.

- [x] Isolierte Browserfälle für direkten leeren Einstieg, wiederaufgenommene
  Sitzung, PIN-only-Abschluss, Abbruch und nachgeladene Liste zuerst schreiben.
- [x] Die fehlende Einstiegsauswahl im echten Browser reproduzieren.
- [x] Bestandsweg vor lokaler Neuanlage anbieten; OAuth-Fortsetzung nur mit
  unkritischer Wegmarke, ohne PIN oder neue Lerndaten speichern.
- [x] Nach Authwechsel automatisch suchen; Aufrufe zusammenfassen, bei Fehler
  explizit wiederholen, lokale Neueinrichtung weiterhin erreichbar lassen.
- [x] Elternliste auch bei aktivem Binding anzeigen; Umbenennformular und
  konkrete Papierkorbbestätigung, aktiven Bereich kennzeichnen/schützen.
- [x] PIN-Sperre und Konto-/Ansichtswechsel beachten; Entwürfe/Fokus bei
  Statusänderungen erhalten. Bestehenden unmittelbaren Joinabgleich erhalten.
- [x] Neue Browserfälle sowie bestehende Serverauth-/Join-/Einstellungsfälle prüfen.

### Task 4: Integration, Review und Übergabe

**Files:** `trainer/sw.js`, explizite Server-/Staging-Assetlisten falls nötig,
`ARBEITSSTAND.md`, `START-HIER.md`, `AGENTS.md`, `docs/ANFORDERUNGEN.md`,
`docs/ARCHITEKTUR.md`, `docs/BENUTZUNG.md`, datierte Übergabe/Prüfbericht.

- [x] Cache auf v54 erhöhen, neue Laufzeitmodule vollständig offline/staging
  einbinden; Versionsmarker der Browserharnesses synchron halten.
- [x] Vollständige Nodeprüfung mit erlaubten lokalen Unterprozessen und
  fokussierte Browserfälle einschließlich echtem Offline-/Updatepfad ausführen.
- [x] Dateidiff unabhängig auf Spec und Qualität prüfen lassen; wesentliche
  Befunde gezielt korrigieren und nachprüfen.
- [x] Dokumentations-/Verweisprüfung und `git diff --check` ausführen;
  vorbestehende Befunde vom aktuellen Paket unterscheiden.
- [x] Ergebnis, genaue Prüfzahlen, Grenzen und nächsten Bereitstellungsschritt
  dokumentieren. Keine laufende Bereitstellung behaupten oder durchführen.
