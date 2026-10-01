import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createTrainerHarness} from './trainer-harness.mjs';

test('level card distinguishes lifetime points from the current level at boundaries and on phones', {timeout: 90_000}, async () => {
  const harness = await createTrainerHarness();
  const {page} = await harness.newDevice();
  const evidence = resolve('test-results', 'level-progress');
  await mkdir(evidence, {recursive: true});
  try {
    await page.goto(harness.baseUrl);
    await page.locator('#setup-submit').waitFor();
    for (const points of [0, 2260, 2390, 2400, 3000, 3060]) {
      await page.evaluate(async (value) => {
        const {levelCard} = await import('/src/trainer/ui/rewards.js');
        const app = document.createElement('main');
        app.id = 'app';
        app.className = 'site-shell';
        app.append(levelCard({points: value, completedRounds: 0, words: {}}));
        document.body.replaceChildren(app);
      }, points);
      const card = page.locator('.level-card');
      const level = 1 + Math.floor(points / 200);
      const earned = points % 200;
      assert.match(await card.innerText(), new RegExp(`${points.toLocaleString('de-DE')} Lernpunkte insgesamt`));
      assert.match(await card.innerText(), new RegExp(`Zum nächsten Level: ${earned} von 200 Punkten`));
      assert.match(await card.innerText(), new RegExp(`Noch ${200 - earned} Punkte bis Level ${level + 1}`));
      const progress = card.getByRole('progressbar');
      assert.equal(await progress.getAttribute('aria-valuenow'), String(earned));
      assert.equal(await progress.getAttribute('aria-valuemax'), '200');
      assert.equal(await progress.getAttribute('aria-valuetext'), `${earned} von 200 Punkten; noch ${200 - earned} Punkte bis Level ${level + 1}`);
      assert.equal(await progress.locator('.level-progress-fill').evaluate((fill) => fill.style.width), `${earned / 2}%`);
      if (points >= 3000) assert.match(await card.innerText(), /Reise geschafft!/);
      if (points === 2260) {
        for (const width of [320, 390, 1280]) {
          for (const size of [16, 32]) {
            await page.setViewportSize({width, height: 900});
            await page.evaluate((fontSize) => { document.documentElement.style.fontSize = `${fontSize}px`; }, size);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true,
              `level card overflows at ${width}px with ${size}px font`);
            const splitWords = await card.evaluate((node) => {
              const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
              const splits = [];
              while (walker.nextNode()) {
                const text = walker.currentNode;
                for (const match of text.textContent.matchAll(/\S+/gu)) {
                  const tops = new Set();
                  for (let i = match.index; i < match.index + match[0].length; i++) {
                    const range = document.createRange();
                    range.setStart(text, i);
                    range.setEnd(text, i + 1);
                    tops.add(Math.round(range.getBoundingClientRect().top));
                  }
                  if (tops.size > 1) splits.push(match[0]);
                }
              }
              return splits;
            });
            assert.deepEqual(splitWords, [], `words split at ${width}px with ${size}px font`);
            await page.screenshot({path: resolve(evidence, `points-2260-${width}-${size}.png`), fullPage: true});
          }
        }
      }
    }
  } finally {
    await harness.close();
  }
});
