import test from 'node:test';
import assert from 'node:assert/strict';
import {runProbeScenarios} from '../../src/shop-probe/scenarios.js';

function fake({ignore=false, missing=false, metadataIgnore=false}={}) {
  const records=new Map();let serial=0;
  const copy=v=>structuredClone(v);
  const error=code=>Object.assign(new Error(code),{code});
  return {
    async create({value={},folder=false}) {const id=`f${++serial}`;records.set(id,{value:copy(value),folder,version:1,properties:{}});return {id};},
    async read(id) {const r=records.get(id);if(missing)throw error('unsupported');return {id,value:copy(r.value),version:String(r.version),etag:`"${r.version}"`,properties:copy(r.properties)};},
    async updateIfUnchanged(before,value,{metadata=false}={}) {const r=records.get(before.id);if(!(metadata?metadataIgnore:ignore)&&before.etag!==`"${r.version}"`)throw error('stale');if(metadata)r.properties=copy(value);else r.value=copy(value);r.version++;return this.read(before.id);},
    async retryCreate(id,value) {if(JSON.stringify(records.get(id).value)!==JSON.stringify(value))throw error('collision');return this.read(id);},
  };
}
test('capability scenarios include purchases, initialization, retries and reset with honest boundary',async()=>{
  const result=await runProbeScenarios({transport:fake()});assert.equal(result.passed,true);
  for(const id of ['stale-write','invalid-token','initialization','two-purchases','response-loss','duplicate-operation','reset-race','create-conflict','conflict-credit'])assert.ok(result.checks.some(c=>c.id===id&&c.passed),id);
  assert.equal(result.productReady,false);
});
test('ignoring the media condition cannot pass',async()=>{
  const result=await runProbeScenarios({transport:fake({ignore:true})});assert.equal(result.passed,false);assert.ok(result.checks.some(c=>c.id==='stale-write'&&!c.passed));
});
test('ignoring folder metadata condition cannot pass initialization',async()=>{
  const result=await runProbeScenarios({transport:fake({metadataIgnore:true})});assert.equal(result.passed,false);assert.ok(result.checks.some(c=>c.id==='initialization'&&!c.passed));
});
test('missing browser-visible version token is unsupported',async()=>{
  const result=await runProbeScenarios({transport:fake({missing:true})});assert.equal(result.passed,false);assert.ok(result.unsupported>0);
});
