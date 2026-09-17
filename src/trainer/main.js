import {createCommands, productStateHash} from './commands.js';
import {createPinGate} from './adult/pin.js';
import {openProductStore} from './storage/store.js';
import {mountShell} from './ui/shell.js';

const root = document.querySelector('#app');
let store = null;
let shell = null;
let closing = false;

function deviceId() {
  const key = 'vokabeltrainer-product-device-id';
  let value = localStorage.getItem(key);
  if (!/^[A-Za-z0-9_-]{1,128}$/u.test(value ?? '')) {
    value = crypto.randomUUID();
    localStorage.setItem(key, value);
  }
  return value;
}

function showFatal(error) {
  const section = document.createElement('section');
  section.className = 'panel narrow';
  const title = document.createElement('h1');
  title.textContent = 'Vokabeltrainer nicht verfügbar';
  const copy = document.createElement('p');
  copy.id = 'app-error';
  copy.setAttribute('role', 'alert');
  copy.textContent = error?.message || 'Der Trainer konnte nicht gestartet werden.';
  section.append(title, copy);
  root.replaceChildren(section);
}

async function start() {
  store = await openProductStore();
  let commands;
  commands = await createCommands({
    store,
    now: () => new Date(),
    id: () => crypto.randomUUID(),
    deviceId: deviceId(),
    onChange: () => shell?.render(),
  });
  const pinGate = createPinGate({
    loadVerifier: async () => commands.getState()?.pinVerifier ?? null,
    saveVerifier: async (pinVerifier) => {
      const current = commands.getState();
      if (current === null) throw new Error('Der Datensatz muss zuerst eingerichtet werden.');
      const expectedStateHash = await productStateHash(current);
      const next = structuredClone(current);
      next.pinVerifier = structuredClone(pinVerifier);
      await commands.commitExternal(next, expectedStateHash);
    },
  });
  shell = mountShell({root, commands, pinGate});
  shell.render();
}

function close() {
  if (closing) return;
  closing = true;
  shell?.destroy();
  store?.close();
}

addEventListener('pagehide', close);
addEventListener('pageshow', (event) => {
  if (event.persisted) location.reload();
});

start().catch(showFatal);
