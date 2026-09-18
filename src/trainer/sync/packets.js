import {ProductError} from '../model/errors.js';
import {assertEvent} from '../model/schema.js';

const VERSION = {format: 'vokabeltrainer-product', formatVersion: 1, ruleVersion: 1};
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const MAX_PACKET_BYTES = 64 * 1024;
const MAX_PACKET_EVENTS = 100;

function invalid(message) {
  throw new ProductError('invalid', message);
}

function assertId(value, label) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) invalid(`${label} ist ungültig.`);
}

function packetBytes(packet) {
  return new TextEncoder().encode(JSON.stringify(packet)).byteLength;
}

function makePacket({events, datasetId, epochId, packetId}) {
  return {...VERSION, kind: 'packet', datasetId, epochId, packetId, events};
}

export function validatePacket(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    invalid('Das Änderungspaket ist ungültig.');
  }
  const expectedKeys = [
    'format', 'formatVersion', 'ruleVersion', 'kind', 'datasetId', 'epochId', 'packetId', 'events',
  ].sort();
  const keys = Object.keys(value).sort();
  if (keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index])) {
    invalid('Das Änderungspaket ist ungültig.');
  }
  if (value.format !== VERSION.format || value.formatVersion !== 1 || value.ruleVersion !== 1) {
    throw new ProductError('version', 'Diese Paketversion wird nicht unterstützt.');
  }
  if (value.kind !== 'packet') invalid('Das Änderungspaket ist ungültig.');
  assertId(value.datasetId, 'Die Datensatz-ID');
  assertId(value.epochId, 'Die Epochen-ID');
  assertId(value.packetId, 'Die Paket-ID');
  if (!Array.isArray(value.events) || value.events.length === 0
    || value.events.length > MAX_PACKET_EVENTS) {
    invalid('Ein Änderungspaket muss ein bis 100 Ereignisse enthalten.');
  }
  const events = value.events.map(assertEvent);
  if (events.some(({datasetId}) => datasetId !== value.datasetId)) {
    invalid('Ein Paketereignis gehört zu einem anderen Datensatz.');
  }
  if (events.some(({epochId}) => epochId !== value.epochId)) {
    invalid('Ein Paketereignis gehört zu einer anderen Epoche.');
  }
  const result = makePacket({
    events,
    datasetId: value.datasetId,
    epochId: value.epochId,
    packetId: value.packetId,
  });
  if (packetBytes(result) > MAX_PACKET_BYTES) {
    invalid('Das Änderungspaket überschreitet die zulässige Größe von 64 KiB.');
  }
  return result;
}

export function buildPackets({events, datasetId, epochId, id} = {}) {
  assertId(datasetId, 'Die Datensatz-ID');
  assertId(epochId, 'Die Epochen-ID');
  if (!Array.isArray(events) || typeof id !== 'function') invalid('Die Paketerstellung ist unvollständig.');
  if (events.length === 0) return [];

  const checked = events.map(assertEvent);
  if (checked.some((event) => event.datasetId !== datasetId)) {
    invalid('Ein Ereignis gehört zu einem anderen Datensatz.');
  }
  if (checked.some((event) => event.epochId !== epochId)) {
    invalid('Ein Ereignis gehört zu einer anderen Epoche.');
  }

  const packets = [];
  let packetId = null;
  let packetEvents = [];
  for (const event of checked) {
    if (packetId === null) {
      packetId = id();
      assertId(packetId, 'Die Paket-ID');
    }
    const candidate = makePacket({events: [...packetEvents, event], datasetId, epochId, packetId});
    if (candidate.events.length <= MAX_PACKET_EVENTS && packetBytes(candidate) <= MAX_PACKET_BYTES) {
      packetEvents.push(event);
      continue;
    }
    if (packetEvents.length === 0) {
      invalid('Ein einzelnes Ereignis überschreitet mit der Pakethülle 64 KiB.');
    }
    packets.push(validatePacket(makePacket({events: packetEvents, datasetId, epochId, packetId})));
    packetId = id();
    assertId(packetId, 'Die Paket-ID');
    packetEvents = [event];
    const single = makePacket({events: packetEvents, datasetId, epochId, packetId});
    if (packetBytes(single) > MAX_PACKET_BYTES) {
      invalid('Ein einzelnes Ereignis überschreitet mit der Pakethülle 64 KiB.');
    }
  }
  packets.push(validatePacket(makePacket({events: packetEvents, datasetId, epochId, packetId})));
  return packets;
}
