import assert from 'node:assert/strict';
import test from 'node:test';
import {renderSync} from '../../src/trainer/ui/sync.js';
import {createFixture} from './fixtures.js';
import {productState} from './backup-fixtures.js';

// A DOM boundary double lets the actual renderer run without a browser dependency.
class TestNode {
  children = [];
  attributes = new Map();
  listeners = new Map();
  isConnected = true;
  classList = {
    add: (...names) => {
      const classes = new Set((this.attributes.get('class') ?? '').split(/\s+/).filter(Boolean));
      names.forEach((name) => classes.add(name));
      this.attributes.set('class', [...classes].join(' '));
    },
  };
  constructor(tagName) { this.tagName = tagName; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  addEventListener(name, handler) { this.listeners.set(name, handler); }
  append(...children) {
    this.children.push(...children.map((child) => child instanceof TestNode ? child
      : Object.assign(new TestNode('#text'), {textContent: String(child)})));
  }
  replaceChildren(...children) { this.children = []; this.append(...children); }
  contains(node) { return node === this || this.children.some((child) => child.contains(node)); }
}

function descendants(node) {
  return [node, ...node.children.flatMap(descendants)];
}

test('Google connection offers public app and privacy information before and after connecting', () => {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const previousNode = Object.getOwnPropertyDescriptor(globalThis, 'Node');
  Object.defineProperty(globalThis, 'Node', {configurable: true, value: TestNode});
  Object.defineProperty(globalThis, 'document', {configurable: true, value: {
    createElement: (tag) => new TestNode(tag),
    createTextNode: (text) => Object.assign(new TestNode('#text'), {textContent: text}),
  }});
  try {
    for (const connected of [false, true]) {
      const root = new TestNode('div');
      const state = productState(createFixture().base);
      const before = structuredClone(state);
      renderSync({root, state,
        auth: {
          configuration: () => ({source: 'server', clientId: '', requiresDecision: false}),
          getToken() { if (!connected) throw new Error('not connected'); return 'synthetic'; },
        },
        sync: {getStatus: () => ({phase: 'local', pendingCount: 0, lateCount: 0})},
        commands: {getState: () => state}, restore: {},
      });
      const links = descendants(root).filter((node) => node.tagName === 'a');
      for (const href of ['./info/', './info/datenschutz.html']) {
        const link = links.find((node) => node.attributes.get('href') === href);
        assert.ok(link, href + ' connected=' + connected);
        assert.ok(link.textContent.trim(), 'information links must have readable names');
        assert.equal(link.attributes.get('target'), '_blank', 'information must preserve the trainer tab');
        assert.equal(link.attributes.get('rel'), 'noopener noreferrer');
      }
      assert.deepEqual(state, before, 'reading information must not change learning data');
    }
  } finally {
    for (const [name, descriptor] of [['document', previousDocument], ['Node', previousNode]]) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }
});

test('adoption retries sync immediately only after an unlocked successful confirmation without a duplicate connected hook', async () => {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const previousNode = Object.getOwnPropertyDescriptor(globalThis, 'Node');
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const sessionValues = new Map([['vokabeltrainer-existing-area', '1']]);
  Object.defineProperty(globalThis, 'sessionStorage', {configurable: true, value: {
    getItem: (key) => sessionValues.get(key) ?? null,
    setItem: (key, value) => sessionValues.set(key, String(value)),
    removeItem: (key) => sessionValues.delete(key),
  }});
  Object.defineProperty(globalThis, 'Node', {configurable: true, value: TestNode});
  Object.defineProperty(globalThis, 'document', {configurable: true, value: {
    createElement: tag => new TestNode(tag),
    createTextNode: text => Object.assign(new TestNode('#text'), {textContent: text}),
  }});
  try {
    for (const outcome of ['success', 'failure', 'locked before', 'locked during']) {
      const root = new TestNode('div'), state = productState(createFixture().base);
      let unlocked = true, notifications = 0, retries = 0, confirmations = 0;
      const dataset = {folderId: 'folder', descriptorFileId: 'descriptor', descriptor: state.ledger.descriptor};
      renderSync({root, state, commands: {getState: () => state}, restore: {},
        auth: {getToken: () => 'synthetic', configuration: () => ({source: 'server', requiresDecision: false})},
        isUnlocked: () => unlocked, onConnected: () => {notifications += 1;},
        sync: {
          getStatus: () => ({phase: 'local', pendingCount: 0, lateCount: 0}),
          discover: async () => [dataset],
          retry: async () => { retries += 1; },
          joinDataset: async (_, decision) => {
            if (decision === 'preview') return {name: 'Synthetic', requiresSafetyCopy: false,
              previewId: null, safetyCopyId: null, localEventCount: 0, remoteBootstrapEventCount: 0};
            confirmations += 1;
            if (outcome === 'failure') throw new Error('synthetic confirmation failure');
            if (outcome === 'locked during') unlocked = false;
            state.binding = {accountId: 'synthetic', folderId: 'folder', descriptorFileId: 'descriptor', datasetId: 'd1'};
          },
        },
      });
      const click = async text => {
        const button = descendants(root).find(node => node.tagName === 'button' && node.textContent === text);
        assert.ok(button, text);
        await button.listeners.get('click')();
      };
      await click('Vorhandenen Lernbereich verwenden');
      await click('Diesen Lernbereich prüfen');
      assert.equal(notifications, 0, 'discovery and preview never start adoption');
      assert.equal(retries, 0, 'discovery and preview never start a retry');
      await click('Abbrechen');
      assert.equal(notifications, 0, 'cancelling never starts adoption');
      assert.equal(retries, 0, 'cancelling never starts a retry');
      await click('Diesen Lernbereich prüfen');
      if (outcome === 'locked before') unlocked = false;
      await click('Lernbereich verwenden');
      assert.equal(retries, outcome === 'success' ? 1 : 0, outcome);
      assert.equal(notifications, 0, 'the explicit retry must not also schedule a connected hook');
      assert.equal(confirmations, outcome === 'locked before' ? 0 : 1, outcome);
    }
  } finally {
    for (const [name, descriptor] of [['document', previousDocument], ['Node', previousNode], ['sessionStorage', previousStorage]]) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }
});
