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
    async updateIfUnchanged(before,value,{metadata=false}={}) {const r=records.get(before.id);if(!(metadata?metadataIgnore:ignore)&&before.etag!==`"${r.version}"`)throw error('stale');if(metadata)r.properties=copy(value);else r.value=copy(value);r.version++;return {id:before.id};},
    async retryCreate(id,value) {if(JSON.stringify(records.get(id).value)!==JSON.stringify(value))throw error('collision');return this.read(id);},
  };
}

function invalidTokenFake({writeOutcome='stale',writeStatus=412,readback='unchanged',fixtureError=null}={}) {
  const beforeValue={probeVersion:1,epoch:'epoch-0',sequence:0,earned:1000,spent:0,operations:[],owned:['a','b'],nested:{left:1,right:{top:2,bottom:3}}};
  let reads=0,writes=0,creates=0;
  const reordered={nested:{right:{bottom:3,top:2},left:1},owned:['a','b'],operations:[],spent:0,earned:1000,sequence:0,epoch:'epoch-0',probeVersion:1};
  const transport={
    async create({folder=false}={}) {
      creates++;
      if(!folder&&fixtureError)throw fixtureError;
      return {id:folder?'folder':'file'};
    },
    async read() {
      reads++;
      if(reads===1)return {id:'file',value:structuredClone(beforeValue),etag:'"1"'};
      if(readback==='error')throw {code:'network',status:503,message:'private-read-message',raw:{private:true}};
      if(readback==='key-order-only')return {id:'file',value:structuredClone(reordered),etag:'"1"'};
      if(readback==='array-order')return {id:'file',value:{...structuredClone(beforeValue),owned:['b','a']},etag:'"1"'};
      if(readback==='changed')return {id:'file',value:{...structuredClone(beforeValue),sequence:99},etag:'"2"'};
      return {id:'file',value:structuredClone(beforeValue),etag:'"1"'};
    },
    async updateIfUnchanged(before) {
      writes++;
      assert.equal(before.etag,'"deliberately-invalid-probe-token"');
      if(writeOutcome==='fulfilled')return {id:'file',status:writeStatus,privateMarker:'private-write-result'};
      throw {code:writeOutcome,status:writeStatus,message:'private-write-message',headers:{private:true}};
    },
  };
  return {transport,counts:()=>({creates,reads,writes})};
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

test('v2 coherent diagnostics preserve only the fixed source and known observations',async()=>{
  const transport=fake();
  transport.read=async()=>{throw Object.assign(new Error('private-v2-marker'),{code:'stale',diagnostic:{phase:'read-stability',reason:'changed-during-read',etagSource:'v2-coherent',versionChanged:true,jsonEtagChanged:false,jsonEtagState:'strong',etag:'private-v2-marker',runId:'private-v2-marker',fileId:'private-v2-marker'}});};
  const result=await runProbeScenarios({transport});
  const check=result.checks.find(item=>item.id==='version-token');
  assert.deepEqual(check.diagnostic,{phase:'read-stability',reason:'changed-during-read',etagSource:'v2-coherent',jsonEtagState:'strong',versionChanged:true,jsonEtagChanged:false});
  assert.equal(JSON.stringify(result).includes('private-v2-marker'),false);
});

test('diagnostic 6 sanitizes read context and optional field states without raw markers',async()=>{
  const transport=fake();
  transport.read=async()=>{throw Object.assign(new Error('private-v6-marker'),{code:'stale',diagnostic:{
    phase:'read-stability',reason:'changed-during-read',etagSource:'v2-coherent',readContext:'snapshot-read',readKind:'metadata-media-metadata',
    versionChanged:true,jsonEtagChanged:false,jsonEtagState:'strong',contentChecksumState:'changed',headRevisionState:'same',modifiedDateState:'unavailable',viewedDateState:'changed',fileSizeState:'same',
    md5Checksum:'private-v6-marker',headRevisionId:'private-v6-marker',modifiedDate:'private-v6-marker',lastViewedByMeDate:'private-v6-marker',fileSize:'private-v6-marker',
  }});};
  const result=await runProbeScenarios({transport}),diagnostic=result.checks.find(item=>item.id==='version-token').diagnostic;
  assert.deepEqual(diagnostic,{phase:'read-stability',reason:'changed-during-read',etagSource:'v2-coherent',jsonEtagState:'strong',readContext:'snapshot-read',readKind:'metadata-media-metadata',contentChecksumState:'changed',headRevisionState:'same',modifiedDateState:'unavailable',viewedDateState:'changed',fileSizeState:'same',versionChanged:true,jsonEtagChanged:false});
  assert.equal(JSON.stringify(result).includes('private-v6-marker'),false);
});

test('diagnostic 6 drops unknown contexts and invalid comparison states',async()=>{
  const transport=fake();
  transport.read=async()=>{throw {code:'stale',diagnostic:{phase:'read-stability',reason:'changed-during-read',etagSource:'v2-coherent',readContext:'private-context',readKind:'private-kind',contentChecksumState:'private-state',headRevisionState:'same'}};};
  const diagnostic=(await runProbeScenarios({transport})).checks.find(item=>item.id==='version-token').diagnostic;
  assert.deepEqual(diagnostic,{phase:'read-stability',reason:'changed-during-read',etagSource:'v2-coherent',headRevisionState:'same'});
});

for(const [failAt,scenarioStage] of [[2,'response-loss-receipt'],[3,'response-loss-after-second-write'],[4,'response-loss-balance']]){
  test(`diagnostic 6 distinguishes response-loss read ${failAt-1} as ${scenarioStage}`,async()=>{
    const transport=fake(),names=new Map(),readCounts=new Map();
    const create=transport.create.bind(transport),read=transport.read.bind(transport);
    transport.create=async options=>{const file=await create(options);names.set(file.id,options.name);return file;};
    transport.read=async id=>{
      if(names.get(id)==='response-loss'){
        const count=(readCounts.get(id)??0)+1;readCounts.set(id,count);
        if(count===failAt)throw {code:'stale',diagnostic:{phase:'read-stability',reason:'changed-during-read',etagSource:'v2-coherent',readContext:'snapshot-read',readKind:'metadata-media-metadata'}};
      }
      return read(id);
    };
    const check=(await runProbeScenarios({transport})).checks.find(item=>item.id==='response-loss');
    assert.equal(check.passed,false);
    assert.equal(check.scenarioStage,scenarioStage);
  });
}

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

test('invalid-token scope runs only the folder and targeted check',async()=>{
  const {transport,counts}=invalidTokenFake();
  const result=await runProbeScenarios({transport,probeScope:'invalid-token'});
  assert.deepEqual(result.checks.map(check=>check.id),['fixture','invalid-token']);
  assert.equal(result.passed,true);
  assert.equal(result.productReady,false);
  assert.deepEqual(result.checks[1].actual,{checkpoint:'invalid-token-observation',outcome:'stale',httpStatus:412,readback:'unchanged',readbackOutcome:'success'});
  assert.deepEqual(counts(),{creates:2,reads:2,writes:1});
});

test('unknown probe scope stops before creating or reading anything',async()=>{
  let calls=0;
  const transport={create:async()=>{calls++;},read:async()=>{calls++;},updateIfUnchanged:async()=>{calls++;}};
  await assert.rejects(()=>runProbeScenarios({transport,probeScope:'private-scope'}));
  assert.equal(calls,0);
});

for(const [label,options,expected] of [
  ['accepted write with unchanged content',{writeOutcome:'fulfilled',writeStatus:200},{outcome:'fulfilled',httpStatus:200,readback:'unchanged'}],
  ['accepted write without a reported status',{writeOutcome:'fulfilled',writeStatus:null},{outcome:'fulfilled',readback:'unchanged'}],
  ['accepted write with changed content',{writeOutcome:'fulfilled',writeStatus:201,readback:'changed'},{outcome:'fulfilled',httpStatus:201,readback:'changed'}],
  ['HTTP 400 rejection',{writeOutcome:'http',writeStatus:400},{outcome:'http',httpStatus:400,readback:'unchanged'}],
  ['network rejection',{writeOutcome:'network',writeStatus:null},{outcome:'network',readback:'unchanged'}],
  ['412 with mutated content',{writeOutcome:'stale',writeStatus:412,readback:'changed'},{outcome:'stale',httpStatus:412,readback:'changed'}],
  ['key order only',{writeOutcome:'stale',writeStatus:412,readback:'key-order-only'},{outcome:'stale',httpStatus:412,readback:'key-order-only'}],
  ['changed array order',{writeOutcome:'stale',writeStatus:412,readback:'array-order'},{outcome:'stale',httpStatus:412,readback:'changed'}],
])test(`invalid-token observation distinguishes ${label} without weakening the strict pass rule`,async()=>{
  const {transport}=invalidTokenFake(options);
  const result=await runProbeScenarios({transport,probeScope:'invalid-token'});
  const check=result.checks[1];
  assert.equal(check.passed,false);
  assert.equal(result.passed,false);
  assert.deepEqual(check.evidence,{checkpoint:'invalid-token-observation',...expected,readbackOutcome:'success'});
  assert.equal(JSON.stringify(result).includes('private-'),false);
});

test('invalid-token readback failure keeps the write outcome and bounded read diagnosis',async()=>{
  const {transport,counts}=invalidTokenFake({writeOutcome:'http',writeStatus:400,readback:'error'});
  const check=(await runProbeScenarios({transport,probeScope:'invalid-token'})).checks[1];
  assert.equal(check.scenarioStage,'invalid-token-readback');
  assert.deepEqual(check.evidence,{checkpoint:'invalid-token-observation',outcome:'http',httpStatus:400,readback:'unavailable',readbackOutcome:'network',readbackHttpStatus:503});
  assert.deepEqual(counts(),{creates:2,reads:2,writes:1});
  assert.equal(JSON.stringify(check).includes('private-'),false);
});

test('invalid-token readback instability keeps its sanitized diagnostic beside the observed PUT status',async()=>{
  const {transport}=invalidTokenFake({writeOutcome:'fulfilled',writeStatus:200});
  const read=transport.read.bind(transport);let calls=0;
  transport.read=async()=>++calls===1?read():Promise.reject({code:'stale',diagnostic:{
    phase:'read-stability',reason:'changed-during-read',etagSource:'v2-coherent',readContext:'snapshot-read',readKind:'metadata-media-metadata',
    versionChanged:true,jsonEtagChanged:false,jsonEtagState:'strong',contentChecksumState:'same',headRevisionState:'same',modifiedDateState:'same',viewedDateState:'unavailable',fileSizeState:'same',raw:'private-marker',
  }});
  const check=(await runProbeScenarios({transport,probeScope:'invalid-token'})).checks[1];
  assert.equal(check.scenarioStage,'invalid-token-readback');
  assert.deepEqual(check.evidence,{checkpoint:'invalid-token-observation',outcome:'fulfilled',httpStatus:200,readback:'unavailable',readbackOutcome:'stale'});
  assert.deepEqual(check.diagnostic,{phase:'read-stability',reason:'changed-during-read',etagSource:'v2-coherent',jsonEtagState:'strong',readContext:'snapshot-read',readKind:'metadata-media-metadata',contentChecksumState:'same',headRevisionState:'same',modifiedDateState:'same',viewedDateState:'unavailable',fileSizeState:'same',versionChanged:true,jsonEtagChanged:false});
  assert.equal(JSON.stringify(check).includes('private-marker'),false);
});

test('invalid-token fixture failure performs no conditional write',async()=>{
  const {transport,counts}=invalidTokenFake({fixtureError:{code:'stale',message:'private-fixture-message'}});
  const check=(await runProbeScenarios({transport,probeScope:'invalid-token'})).checks[1];
  assert.equal(check.passed,false);
  assert.deepEqual(counts(),{creates:2,reads:0,writes:0});
  assert.equal(JSON.stringify(check).includes('private-'),false);
});

test('invalid-token evidence exports only known enums and valid HTTP status numbers',async()=>{
  const {transport}=invalidTokenFake({writeOutcome:'private-class',writeStatus:999,readback:'error'});
  const read=transport.read.bind(transport);let calls=0;
  transport.read=async()=>++calls===1?read():Promise.reject({code:'private-read-class',status:99,message:'private-marker'});
  const check=(await runProbeScenarios({transport,probeScope:'invalid-token'})).checks[1];
  assert.deepEqual(check.evidence,{checkpoint:'invalid-token-observation',outcome:'unexpected',readback:'unavailable',readbackOutcome:'unexpected'});
  assert.equal(JSON.stringify(check).includes('private-'),false);
});
