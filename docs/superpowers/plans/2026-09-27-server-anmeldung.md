# Server-Anmeldung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Schritte der Reihe nach umsetzen und prüfen.

**Goal:** Optionale kostenlose Servervariante lokal vorbereiten, die Google-Zugriff nach Neuladen und Tokenablauf automatisch wiederaufnimmt.

**Architecture:** Gemeinsamer HTTPS-Ursprung für statische App und Fetch-API. Verschlüsselte serverseitige Sitzung in D1, Google-Code-Ablauf, begrenzter Drive-Proxy. Bestehender Browsermodus bleibt Standard.

**Tech Stack:** JavaScript-Module, Web APIs/Web Crypto, Node ab 22.8.0, Cloudflare Workers/D1; keine neue Produktionsbibliothek.

**Spec:** [Freigegebene Vorbereitung](../specs/2026-09-27-server-anmeldung-design.md)

## Global Constraints

- Nur Scope `https://www.googleapis.com/auth/drive.file`.
- Keine echten Tokens, Profile oder Kontoänderungen in dieser lokalen Vorbereitung.
- Keine kostenpflichtigen Angebote aktivieren; keine Veröffentlichung durchführen.
- Konto-/Datensatzbindung, Hashprüfung, Kauf-ETags und dauerhafte Aufträge bleiben erhalten.
- Nur synthetische Daten; keine Geheimnisse im Browser, Git oder Logs.
- Node ab 22.8.0, JavaScript-Module, keine neue Produktionsbibliothek erforderlich.

### Task 1: Sitzungsdienst, OAuth, D1 und Drive-Proxy

**Files:** `server/auth-service.js`, `server/session-store.js`, `server/crypto.js`, `server/worker.js`, `server/schema.sql`, `tests/server/*.test.js`.

**Interfaces:** `createAuthService({store, fetchImpl, now, config})` liefert `{fetch(request)}`. `config` enthält `origin`, `clientId`, `clientSecret`, `encryptionKey` (32 Byte base64). `store` bietet bedingte, atomare Operationen für verschlüsselte Zustands- und Sitzungsdatensätze; Speicheradapter und Testadapter teilen den Vertrag. Worker bildet Bindings `SESSIONS`, `APP_ORIGIN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_ENCRYPTION_KEY`, `ASSETS` darauf ab.

- [x] Zuerst fehlschlagende Tests für einen vollständigen Callback und Wiederaufnahme schreiben. Weitere Fälle: fehlende/falsche Zustands-Cookies, Wiederholung, Ablauf, Google-Fehler, nicht gewährter Scope, widerrufener Zugriff und vorübergehendes Netzproblem.
- [x] `node --experimental-sqlite --test --experimental-test-isolation=none tests/server/*.test.js` ausführen und roten Ausgang dokumentieren.
- [x] API implementieren: Start-POST mit Origin und `X-Vokabeltrainer: 1`, Callback mit PKCE und Einmalzustand, GET-Sitzung ohne Tokens, POST-Abmelden, verschlüsselte Speicherung, 30-Tage-Sitzung/10-Minuten-Zustand. Gleichzeitige Erneuerungen und Abmelden bedingt speichern; keine Wiederbelebung gelöschter Sitzungen.
- [x] Proxy `/api/drive/drive/v2/...`, `/api/drive/drive/v3/...`, `/api/drive/upload/drive/v2/...`, `/api/drive/upload/drive/v3/...` auf `https://www.googleapis.com` beschränken. Nur fachlich benötigte Dateipfade/Methoden, keine fremden Redirects. Origin und Anfrageheader prüfen. If-Match/Content-Type weitergeben, ausschließlich serverseitigen Bearer verwenden. Drive-Fehlerstatus und ETag weitergeben, keine Schreibwiederholung.
- [x] Worker bietet API und ausschließlich vorbereitete statische Assets. Unbekannte API-Pfade liefern Fehler; Geheimnisse und Cookieheader nicht an Google oder Browser durchreichen. D1-Schema und atomare Adaptertests ergänzen.
- [x] Fokussierte Tests grün; Spec und Qualität unabhängig prüfen, Befunde beheben.

Testkern (Handler statt echter Google-Aufrufe, alle Cookies synthetisch):

```js
const resumed = await service.fetch(new Request(origin + '/api/auth/session', {
  headers: {Cookie: sessionCookie},
}));
assert.equal((await resumed.json()).connected, true);
assert.equal(JSON.stringify(await store.dump()).includes('synthetic-refresh'), false);
```

### Task 2: Optionale Traineranbindung und portable Einrichtung

**Files:** `src/drive/server-auth.js`, `src/trainer/main.js`, `src/trainer/config.js`, `src/trainer/ui/sync.js`, `scripts/prepare-cloudflare.mjs`, `scripts/serve.mjs`, `server/wrangler.example.jsonc`, `.gitignore`, `package.json`, `trainer/sw.js`, betroffene Update-Tests und `tests/drive/server-auth.test.js`, `tests/server/staging.test.js`, `tests/browser/server-auth.browser.mjs`, `docs/CLOUDFLARE-EINRICHTUNG.md`.

**Interfaces:** `createServerAuth({fetchImpl, navigate, onChange})` liefert die Auth-Schnittstelle des Trainers (`connect`, `getToken`, `snapshot`, `invalidateIfCurrent`, `clearLocal`, `disconnect`) plus `resume()` und `fetchDrive(url,init)`. `getToken()` liefert ausschließlich einen lokalen Sitzungsmarker; nur `fetchDrive` darf diesen Modus verwenden und entfernt lokale Authorization-Header vor dem Proxyaufruf. Öffentliche `configuration()` bleibt mit der Oberfläche kompatibel; keine änderbare Client-ID im Servermodus.

- [x] Tests für Reload-Wiederaufnahme, abgelaufene serverseitige Tokens, Offlinefehler und Abmelden zuerst rot sehen. `clearLocal()` trennt keine Serversitzung. Abmelden wartet auf den Server und zeigt einen Fehler, wenn die dauerhafte Trennung nicht bestätigt ist.
- [x] Optionalen Adapter integrieren, wenn `APP_CONFIG.authMode === 'server'`; normaler lokaler Start bleibt Browsermodus. Proxy-Fetch sowohl an Lern- als auch Kauftransport übergeben. Wiederaufnahme darf den lokalen Start bei Netzfehlern nicht blockieren. Keine Popupautomatik und kein Wechsel auf anderes Google-Konto bei bestehender Bindung.
- [x] Browserregression: synthetischen Servermodus laden, Sitzung bereits vorhanden, Google ohne Klick verfügbar, Reload weiterhin verbunden, Abmelden bleibt nach Reload getrennt; Netzfehler lässt lokale Oberfläche nutzbar. Bestehenden Browsermodus weiter prüfen.
- [x] Staging nur aus erlaubter öffentlicher Dateiliste, nie gesamtes Repository. Ignorierte Ausgabe `.cloudflare/public/`, dort konfigurierte Servervariante. Konfigurationsvorlage ohne echte Secrets/D1-ID; dokumentierter kostenloser manueller Einrichtungsweg und Rückkehrmöglichkeit.
- [x] Neue Dateien in Allowlist und Pflichtcache, Cacheversion auf v28 und synthetisches Update auf v29. Programmeffekte unter Wurzel und Unterpfad prüfen.
- [x] Fokussierte und anschließend passende Gesamttests, Verweise, Diff und unabhängige Abschlussprüfung. Anforderungen/Übergabe aktualisieren, tatsächliche Grenzen und nächsten Einrichtungsschritt dokumentieren. Autorisierten Entwicklungszweig sichern und Remote-SHA nachweisen.

Abschlussbeleg: Produktcommit `e270ae7`, 580/580 Node-Tests, 58/58 Browserfälle,
unabhängige Spec-/Qualitätsprüfung PASS, Remote-SHA exakt bestätigt. Siehe
[Anmeldebericht](../../reports/2026-09-27-server-anmeldung.md). Echte private
Einrichtung und Provider-/Geräteprüfungen bleiben getrennte nächste Schritte.

Testkern für Browseradapter:

```js
await auth.resume();
assert.doesNotThrow(() => auth.getToken());
await auth.fetchDrive('https://www.googleapis.com/drive/v3/about?fields=user(permissionId)', {
  headers: {Authorization: `Bearer ${auth.getToken()}`},
});
assert.equal(calls.at(-1).url, '/api/drive/drive/v3/about?fields=user(permissionId)');
assert.equal(calls.at(-1).init.headers.get('Authorization'), null);
```

Kaufgeschwindigkeit und weitere Bilder sind Folgepakete, nicht Bestandteil der Anmeldeumstellung.
