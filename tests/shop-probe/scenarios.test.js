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

test('error diagnostics keep only known classifications and boolean observations',async()=>{
  const transport=fake();
  transport.read=async()=>{throw Object.assign(new Error('private-marker'),{code:'stale',diagnostic:{phase:'read-stability',reason:'changed-during-read',etagSource:'media',versionChanged:true,metadataEtagChanged:'private-marker',metadataEtagState:'strong',mediaEtagState:'private-marker',token:'private-marker',fileId:'private-marker'}});};
  const result=await runProbeScenarios({transport});
  const check=result.checks.find(check=>check.id==='version-token');
  assert.equal(check.scenarioStage,'fixture-read');
  assert.deepEqual(check.diagnostic,{phase:'read-stability',reason:'changed-during-read',etagSource:'media',versionChanged:true,metadataEtagState:'strong'});
  assert.equal(JSON.stringify(result).includes('private-marker'),false);
});

test('v2 JSON diagnostics preserve only token classifications and change booleans',async()=>{
  const transport=fake();
  transport.read=async()=>{throw Object.assign(new Error('private-json-marker'),{code:'stale',diagnostic:{phase:'read-stability',reason:'changed-during-read',etagSource:'v2-json',versionChanged:false,metadataEtagChanged:false,jsonEtagChanged:true,metadataEtagState:'absent',mediaEtagState:'absent',jsonEtagState:'strong',jsonEtag:'private-json-marker',fileId:'private-json-marker'}});};
  const result=await runProbeScenarios({transport});
  const check=result.checks.find(item=>item.id==='version-token');
  assert.deepEqual(check.diagnostic,{phase:'read-stability',reason:'changed-during-read',etagSource:'v2-json',metadataEtagState:'absent',mediaEtagState:'absent',jsonEtagState:'strong',versionChanged:false,metadataEtagChanged:false,jsonEtagChanged:true});
  assert.equal(JSON.stringify(result).includes('private-json-marker'),false);
});

test('concurrent write failure reports bounded counts for data and folder writes',async()=>{
  const result=await runProbeScenarios({transport:fake({ignore:true,metadataIgnore:true})});
  for(const id of ['two-purchases','initialization']){
    assert.deepEqual(result.checks.find(c=>c.id===id).evidence,{checkpoint:'concurrent-writes',accepted:2,stale:0,other:0,rejections:[]});
  }
  assert.deepEqual(result.checks.find(c=>c.id==='response-loss').evidence,{checkpoint:'old-token-retry',outcome:'fulfilled'});
});

test('concurrent request failures remain classified without leaking raw error fields',async()=>{
  const transport=fake();transport.updateIfUnchanged=async()=>{throw {code:'network',message:'private-marker',token:'private-marker',status:503};};
  const result=await runProbeScenarios({transport});
  assert.deepEqual(result.checks.find(c=>c.id==='initialization').evidence,{checkpoint:'concurrent-writes',accepted:0,stale:0,other:2,rejections:['network','network']});
  assert.equal(JSON.stringify(result).includes('private-marker'),false);
});

test('read-back assertion identifies its checkpoint and does not include file identifiers',async()=>{
  const transport=fake();const update=transport.updateIfUnchanged.bind(transport);
  transport.updateIfUnchanged=(before,value,options)=>update(before,options?.metadata?{...value,coordinator:'private-marker'}:value,options);
  const result=await runProbeScenarios({transport});
  assert.deepEqual(result.checks.find(c=>c.id==='initialization').evidence,{checkpoint:'initialization-readback'});
  assert.equal(JSON.stringify(result).includes('private-marker'),false);
});
