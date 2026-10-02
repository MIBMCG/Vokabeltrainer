import assert from 'node:assert/strict';
import test from 'node:test';
import {renderSync} from '../../src/trainer/ui/sync.js';
import {createFixture} from './fixtures.js';
import {productState} from './backup-fixtures.js';

// A DOM boundary double lets the actual renderer run without a browser dependency.
class TestNode {
  children = [];
  attributes = new Map();
  constructor(tagName) { this.tagName = tagName; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  addEventListener() {}
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
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
