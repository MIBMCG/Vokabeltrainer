# Final fix wave report

Date: 2026-09-17

Base: `af56946`

Branch: `codex/google-drive-probe`

Planned commit: `fix(probe): recover auth and BFCache lifecycle` (the authoritative SHA is reported after creating the commit because this report is part of that commit).

## Scope and outcome

Both Important findings from `final-review.md` were fixed in one focused wave.

1. A document restored from the browser back/forward cache now performs a controlled reload. The old controller therefore cannot keep writing after its `pagehide` handler released the exclusive tab lock and closed IndexedDB. The reload must reacquire ownership and load current persisted state; if another tab owns the lock, the restored page remains disabled and reports the lock conflict.
2. An authentication error now invalidates only the rejected in-memory access token, clears the UI's connected state and requires the next explicit connect gesture to request a fresh token. This local invalidation does not call GIS revoke and does not revoke the OAuth grant. Queued probe events remain persisted and retry with their existing IDs.

The service-worker cache moved from scope-local `v2` to `v3` so a normal worker update installs the corrected browser modules. The existing no-`skipWaiting` behavior remains unchanged.

## RED evidence

- `node --test --experimental-test-isolation=none tests/drive/auth.test.js`
  - Exit 1, 14 passed / 1 failed.
  - Expected failure: `session.invalidate is not a function` in the new rejected-token regression.
- `node --test --experimental-test-isolation=none tests/probe/sw.test.js`
  - Exit 1, 2 passed / 1 failed.
  - Expected failure: the installed scope-local `v2` cache was not deleted because production still named `v2` as current.
- Edge browser run with the documented local Playwright runtime, system Edge and BFCache enabled by ignoring only Playwright's `--disable-back-forward-cache` default:
  - The existing first seven scenarios passed.
  - Exit 1 in the new HTTP 401 scenario: after the Drive boundary rejected the token, `#oauth-state` never changed to `Anmeldung ist vorbereitet`; the page still claimed an active connection.
  - The new actual-history BFCache scenario was intentionally ordered after that first failing regression and therefore was not reached in this RED run.

## GREEN evidence

Focused checks after implementation:

- Auth tests: 15/15 passed.
- Service-worker tests: 3/3 passed.
- Browser integration reached GREEN after replacing one stale test baseline (`answer-count` had increased because the preceding new retry scenarios add synthetic answers). This was a test-only expectation correction, not a production change.

Fresh final checks on the complete amended code:

- `npm test`
  - Exit 0; 74 tests passed, 0 failed, 0 skipped.
- `node tests/browser/probe.browser.mjs` with `PLAYWRIGHT_MODULE=.superpowers/sdd/2026-09-16-google-drive-probe/browser-runtime/node_modules/playwright` and `BROWSER_EXECUTABLE=C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`
  - Exit 0; 12/12 scenarios passed; `pageErrors: []`.
  - Includes actual navigation from the app to local `styles.css` and browser Back with BFCache enabled. While the first page was parked, a second same-context tab acquired ownership and saved a newer state. Returning the first page triggered the controlled reload, was refused while the second tab owned the lock, stayed disabled, and loaded the newer persisted state only after ownership became available.
  - Includes HTTP 401 followed by a fresh user-gesture token request and one successful upload of the retained queued event.
  - Includes an already expired token changing the UI from connected to reconnect-required while retaining its queued event, followed by successful reconnect and upload.
- `git diff --check`
  - Exit 0, no output.

Environment: Node `v22.23.2`, Playwright `1.62.1`, Microsoft Edge `153.0.4234.32`, local server `http://localhost:4173`.

## Changed files

- `src/drive/auth.js`: adds local RAM-token invalidation without GIS revoke.
- `src/probe/main.js`: handles auth failures as reconnect-required and reloads persisted BFCache restorations.
- `sw.js`: advances the scope-local asset cache to `v3`.
- `tests/drive/auth.test.js`: covers local invalidation, no revoke, expiry and a fresh token request.
- `tests/probe/sw.test.js`: proves an existing scope-local `v2` cache is replaced.
- `tests/browser/google-fixture.mjs`: adds unique synthetic tokens, controlled 401 and short expiry at the external boundary only.
- `tests/browser/probe.browser.mjs`: enables BFCache and covers 401, expiry, actual history restoration and competing ownership.
- `.superpowers/sdd/2026-09-16-google-drive-probe/final-fix-report.md`: this evidence report.

The parent-owned `docs/reports/2026-09-17-google-drive-probe.md` was not edited or staged by this wave.

## Assumptions and limitations

- A controlled full reload on `pageshow.persisted` is accepted by the fix brief. It intentionally discards the parked in-memory controller and forces normal ownership/state initialization.
- The browser fixture simulates only GIS and Drive HTTP. The application DOM, IndexedDB, Web Locks, service worker and browser history/BFCache behavior are real.
- The browser scenario checks the invariant that a parked stale controller cannot write over a newer second-tab state; it does not weaken the fixed account/folder binding.
- Real Google authorization, real Drive interoperability, Safari, iPhone/iPad and two physical devices remain unverified external gates.
- No push, merge, account change, hosting change or unrelated refactor was performed.
