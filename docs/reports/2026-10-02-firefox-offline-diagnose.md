# Firefox: Offline-Navigation in der Testumgebung eingegrenzt

Stand: 02.10.2026, Diagnose auf Produkt
`cd8d5168279cbc11c760b250283caa4e0112baa2`, Cache v49. Die Diagnose hat keine
Produkt- oder Testdatei geändert und keine zusätzliche Bereitstellung ausgelöst.

Firefox 153.0 mit Playwright 1.62.1 scheitert beim Reload nach
`context.setOffline(true)` mit `NS_ERROR_OFFLINE`. Bei abgeschaltetem lokalem
Server und weiterhin online geschaltetem Browser funktionieren Reload, neues
App-Tab und kalter persistenter Start aus demselben unveränderten Appcache.
Diese Abgrenzung liefert keinen Anlass für einen ServiceWorker-Produktfix;
der bestehende automatisierte C2-Test bleibt trotzdem FAIL.

## Umgebung und Reproduktion des bestehenden Fehlers

Verwendet wurden Node 26.10.0, Playwright 1.62.1 und der bereits vorhandene
Firefox 153.0, Build 20260722113508. Jede Probe nutzte eine eigene lokale
Herkunft `http://127.0.0.1:<freier Port>/trainer/`, ein synthetisches Profil
und zwei synthetische Wörter. Persönliche Browserprofile, PINs, Lernbereiche,
Google-/Cloudflare-Konten und Anbieter wurden nicht verwendet. Kein Download
und keine neue Abhängigkeit.

Im Hauptcheckout wurde genau der folgende bestehende Test ausgeführt.
`PLAYWRIGHT_MODULE` war auf das vorhandene Playwright-1.62.1-Modul und
`BROWSER_EXECUTABLE` auf die vorhandene Firefox-153.0-Executable gesetzt;
`node` bezeichnet hier Node 26.10.0.

```powershell
$env:BROWSER_ENGINE = 'firefox'
node --test --experimental-test-isolation=none --test-name-pattern='^C2 rejected required precache install keeps the active offline app and foreign caches$' tests/browser/trainer.browser.mjs
```

Ergebnis: **Exit 1, genau 1 Test, 0 PASS, 1 FAIL**. `page.reload` scheitert
mit `NS_ERROR_OFFLINE` an `tests/browser/trainer.browser.mjs:72`; Falldauer
3963.8734 ms. Der Test bleibt unverändert und wird nicht als bestanden gezählt.
Keine breite Browser- oder Node-Suite wurde für diese Diagnose wiederholt.
Der gleiche Fehler war bereits auf dem früheren unveränderten v46-Stand
beobachtet worden; die aktuellen Vergleichsproben verwenden v49.

## Vergleichsprotokoll und Ergebnisse

Vor dem Vergleich wurde die synthetische Einrichtung abgeschlossen, die
Profilauswahl abgewartet und ein ServiceWorker-Controller sichergestellt.
Registrierung und Controller waren jeweils im konkreten lokalen Scope
`/trainer/`, Script `/trainer/sw.js`, Zustand `activated`. Der v49-Cache
enthielt 209 Einträge; `/trainer/` und `/trainer/index.html` waren mit Status
200 enthalten.

Die entscheidenden unterschiedlichen Schritte waren:

```javascript
// Offlineemulation; lokaler Server bleibt verfügbar:
await context.setOffline(true);
await page.reload({waitUntil: 'domcontentloaded'});

// Separate frische Probe; Browser bleibt online:
await harness.stopServer();
const response = await page.reload({waitUntil: 'domcontentloaded'});
await page.locator('#profile-list').waitFor();
// Erfasst: response.status(), response.fromServiceWorker(), Produktzustand.
```

Zwei enge Kontrollen änderten jeweils nur die zusätzliche Bedingung:

```javascript
// Globale synthetische Route vor der Offlineemulation entfernen:
await context.unroute('**/*');

// Abgelehnten Workerwechsel vor dem jeweiligen Navigationsvergleich auslösen:
await page.evaluate(async () => { await caches.open('synthetic-foreign-cache'); });
harness.setServiceWorkerVersion('v50');
harness.failNextPrecacheAsset('styles.css');
await page.evaluate(async () => {
  await (await navigator.serviceWorker.getRegistration('./')).update();
});
await page.waitForFunction(async () => {
  const registration = await navigator.serviceWorker.getRegistration('./');
  return registration?.installing === null && registration?.waiting === null;
});
```

| Probe | Navigationsbedingung | Beobachtung | Zustand |
| --- | --- | --- | --- |
| A: frischer v49 | `setOffline(true)` | Reload nach 9 ms `NS_ERROR_OFFLINE` | nach Rücknahme des Flags identisch |
| B: frischer v49 | Server gestoppt, Browser online | Reload 139 ms, HTTP 200 aus ServiceWorker | identisch |
| C: frischer v49, globale Route entfernt | `setOffline(true)` | Reload nach 9 ms `NS_ERROR_OFFLINE` | nach Rücknahme des Flags identisch |
| D: abgelehnter v50-Precache | `setOffline(true)` | Reload nach 9 ms `NS_ERROR_OFFLINE` | nach Rücknahme des Flags identisch |
| G: abgelehnter v50-Precache | Server gestoppt, Browser online | Reload 137 ms, HTTP 200 aus ServiceWorker | identisch |

In D/G blieb der aktive Controller v49, der v49-Cache mit 209 Einträgen
vollständig und der synthetische Fremdcache erhalten. An der tatsächlichen
Navigationsgrenze waren `installing=null` und `waiting=null`. Ein leerer
v50-Cache war ein Artefakt des abgelehnten Installs, kein aktiver Produktcache.
Eine frühere Momentaufnahme zeigte noch `installing`; daraus wird keine
zusätzliche Lifecycle-Ursache abgeleitet.

„Identisch“ bedeutet hier: SHA-256 des vollständigen, mit `JSON.stringify`
serialisierten IndexedDB-Werts `product-state/current` vor und nach dem Schritt
gleich. Verglichen wurde immer innerhalb derselben Probe; zufällig erzeugte
IDs unterschiedlicher frischer Proben wurden nicht miteinander verglichen.
Keine abgeschlossene Vergleichsprobe verzeichnete unerwartete externe Anfragen.

## Neues Tab und kalter persistenter Start

Eine erste persistente Probe schloss die einzige Browserseite und versuchte
danach `context.newPage()`. Sie brach bereits vor jeder Offline-Navigation ab:

```text
Browser.newPage: can't access property "delayedStartupPromise", window is null
```

Das ist eine zusätzliche Grenze des beobachteten Browser-/Testprotokolls und
kein Beleg eines App- oder Speicherfehlers. Eine anschließende enge Probe
änderte nur die Reihenfolge: zuerst ein leeres Tab anlegen, danach die bisherige
Produktseite schließen. Der lokale Server blieb während aller folgenden
Schritte gestoppt.

1. Neues App-Tab: 165 ms, HTTP 200, `fromServiceWorker=true`, Zustand identisch.
2. Persistenten Kontext schließen und denselben synthetischen Profilpfad mit
   `newPersistentDevice` wieder öffnen: tatsächlicher Browserneustart,
   Appstart 172 ms, HTTP 200 aus ServiceWorker, Zustand identisch.
3. Erneuter Start desselben Profils mit zusätzlichem `setOffline(true)`:
   `page.goto` scheitert mit `NS_ERROR_OFFLINE`.
4. Nur das Offlineflag zurücknehmen; Server weiterhin gestoppt: Appstart
   162 ms, HTTP 200 aus ServiceWorker, Zustand identisch.

Es wurde keine Lernantwort abgegeben. Diese Probe belegt Start und Erhalt des
eingerichteten synthetischen Zustands, keinen vollständigen Übungs- oder
Synchronisationsablauf. Beide temporären persistenten Profile wurden entfernt.
Letzte Fortschreibung der Diagnosebelege: 02.10.2026 um 17:49:58.177 UTC.

## Einordnung und Nachweisgrenzen

Der Navigationsfehler ist auf den untersuchten Firefox-Testmodus mit
`context.setOffline(true)` eingegrenzt. Globale Route und abgelehnter Precache
sind nicht erforderlich, um ihn auszulösen. Die erfolgreiche G-Kontrolle
belegt zusätzlich den erhaltenen Appcache nach dem abgelehnten Update.
Die lokal gelesene Playwright-Implementierung verwendet im Firefox-Pfad
`Browser.setOnlineOverride` mit `override: "offline"`. Die interne Ursache
des Firefox-Verhaltens wurde nicht im Browserquellcode verfolgt; keine
allgemeine Aussage für alle Firefox-Versionen oder abschließende Hersteller-
Ursachenerklärung.

Beim gestoppten Server bleibt `navigator.onLine=true`. Erfolgreiche Abrufe
bei unerreichbarer lokaler Herkunft belegen deshalb keine physisch getrennte
Netzverbindung und keine Gleichwertigkeit zum Browser-Offlineflag. Persönlicher
Firefox 156.0.1, reale Netztrennung, Google-Tokenablauf, echte Zweitgeräte-
Synchronisation sowie Apple/Safari bleiben getrennte Praxisnachweise.

Ein mögliches späteres Testpaket sollte Firefox-Navigation mit abgeschaltetem
lokalem Server prüfen, den abgelehnten Workerwechsel und Fremdcache erhalten
und beim Tabwechsel das Fenster bis zum neuen Tab offen halten. Dieser
Diagnoseauftrag implementiert keine Teständerung. Der unveränderte C2-FAIL
und die erfolgreiche lokale Kontrollprobe bleiben getrennt ausgewiesen.
