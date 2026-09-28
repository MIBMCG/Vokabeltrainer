import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';

import {createCommands} from '../src/trainer/commands.js';
import {assertBackup, backupLedger, exportBackup, parseBackup} from '../src/trainer/backup/format.js';
import {project} from '../src/trainer/learning/progress.js';
import {levelEntitlements} from '../src/trainer/avatar/catalog.js';
import {CURRENT_VERSION} from '../src/trainer/model/versions.js';

const output = fileURLToPath(new URL('../tests/fixtures/purchase-demo-1600.json', import.meta.url));
const profileId = 'purchase-demo-profile';
const lessonId = 'purchase-demo-lesson';
let state = null;
let serial = 0;
let day = new Date('2026-02-01T10:00:00.000Z');
const commands = await createCommands({
  store: {
    async load() { return state === null ? null : structuredClone(state); },
    async save(next) { state = structuredClone(next); },
  },
  deviceId: 'purchase-demo-device',
  now: () => new Date(day),
  id: () => `purchase-demo-${++serial}`,
  onChange() {},
});

await commands.setup({name: 'Kauftest-Insel', timeZone: 'Europe/Berlin'});
await commands.revise({
  entityType: 'profile', entityId: profileId, expectedHeads: [],
  value: {name: 'Kauftest', archived: false},
});
await commands.revise({
  entityType: 'lesson', entityId: lessonId, expectedHeads: [],
  value: {name: 'Fiktive Inselwörter', archived: false, profileIds: [profileId]},
});
for (let index = 1; index <= 60; index += 1) {
  const number = String(index).padStart(2, '0');
  await commands.revise({
    entityType: 'word', entityId: `purchase-demo-word-${number}`, expectedHeads: [],
    value: {
      lessonId,
      german: `Fantasiewort ${number}`,
      answers: [`fantasyword${number}`],
      hint: '',
      archived: false,
    },
  });
}

let rounds = 0;
while (project(commands.getState().ledger).profiles[profileId].points < 1600) {
  if (++rounds > 30) throw new Error('Der synthetische Teststand erreicht 1600 Punkte nicht.');
  const choice = commands.practiceChoices({profileId}).find(({mode}) => mode === 'all');
  if (!choice || choice.availableCount === 0) {
    day = new Date(day.getTime() + 40 * 86_400_000);
    rounds -= 1;
    continue;
  }
  await commands.start({profileId, mode: 'all', size: 30});
  const roundId = commands.getState().rounds[profileId].id;
  let steps = 0;
  while (!['completed', 'abandoned'].includes(commands.getState().rounds[profileId].status)) {
    if (++steps > 40) throw new Error('Die synthetische Runde wurde nicht beendet.');
    const available = commands.roundAvailability({roundId});
    if (available.kind === 'task') {
      const word = project(commands.getState().ledger).entities.words[available.task.wordId];
      const feedback = await commands.submit({roundId, typed: word.value.answers[0]});
      assert.equal(feedback.feedback.correct, true);
      await commands.next({roundId});
    } else if (available.kind === 'exhausted') {
      await commands.finish({roundId, reason: 'exhausted'});
    } else {
      await commands.next({roundId});
    }
  }
  day = new Date(day.getTime() + 40 * 86_400_000);
}

const generated = commands.getState();
const learning = project(generated.ledger);
assert.equal(learning.profiles[profileId].points, 1600);
assert.equal(learning.profiles[profileId].level, 9);
assert.equal(Object.keys(learning.profiles).length, 1);
assert.equal(learning.entities.profiles[profileId].value.name, 'Kauftest');
assert.equal(levelEntitlements(learning.profiles[profileId].level).figureIds.includes('dragon'), true);
assert.equal(generated.binding, null);
assert.equal(generated.pinVerifier, null);
assert.equal(generated.commerce.mode, 'inactive');
assert.equal(generated.commerce.config, null);

const backup = await exportBackup(generated, '2026-09-01T10:00:00.000Z', {version: CURRENT_VERSION});
assertBackup(backup);
const json = `${JSON.stringify(backup, null, 2)}\n`;
const parsed = await parseBackup(json);
const imported = project(backupLedger(parsed));
assert.equal(parsed.formatVersion, 2);
assert.equal(Object.hasOwn(parsed, 'economy'), false);
assert.equal(Object.keys(imported.profiles).length, 1);
assert.equal(imported.entities.profiles[profileId].value.name, 'Kauftest');
assert.equal(imported.profiles[profileId].points, 1600);
assert.equal(imported.profiles[profileId].level, 9);
assert.equal(levelEntitlements(imported.profiles[profileId].level).figureIds.includes('dragon'), true);

await mkdir(dirname(output), {recursive: true});
await writeFile(output, json, 'utf8');
console.log(`Synthetische v2-Sicherung geprüft: 1 Profil, 1600 Punkte, ${rounds} Runden, ${parsed.events.length} Ereignisse.`);
