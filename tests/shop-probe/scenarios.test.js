import test from 'node:test';
import assert from 'node:assert/strict';
import {runProbeScenarios} from '../../src/shop-probe/scenarios.js';
import {createProbeTransport} from '../../src/shop-probe/transport.js';
import {v2CoherentDriveFixture} from './v2-coherent-drive-fixture.js';

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

const stableReadObservation=()=>({
  cacheMode:'no-store',complete:true,
  comparisons:[
    {window:'metadata-control',version:'same',etag:'same',contentChecksum:'same',headRevision:'same',modifiedDate:'same',viewedDate:'unavailable',fileSize:'same'},
    {window:'media-window',version:'same',etag:'same',contentChecksum:'same',headRevision:'same',modifiedDate:'same',viewedDate:'unavailable',fileSize:'same'},
  ],
  media:{outcome:'success',httpStatus:200,redirected:false,contentMatchesFixture:true},
});

function readObservationFake({observation=stableReadObservation(),error=null}={}){
  let creates=0,observations=0,updates=0;
  return {transport:{
    async create(){creates++;return {id:'folder'};},
    async observeReadStability(){observations++;if(error)throw error;return structuredClone(observation);},
    async updateIfUnchanged(){updates++;},
  },counts:()=>({creates,observations,updates})};
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

test('read-stability scope runs only the folder and pure observation checks',async()=>{
  const {transport,counts}=readObservationFake();
  const result=await runProbeScenarios({transport,probeScope:'read-stability'});
  assert.deepEqual(result.checks.map(check=>check.id),['fixture','read-stability']);
  assert.equal(result.passed,true);assert.equal(result.productReady,false);
  assert.deepEqual(result.checks[1].actual,{checkpoint:'read-stability-observation',...stableReadObservation()});
  assert.deepEqual(counts(),{creates:1,observations:1,updates:0});
});

for(const [label,mutate] of [
  ['version change',observation=>{observation.comparisons[0].version='increased';}],
  ['version representation change',observation=>{observation.comparisons[0].version='representation-changed';}],
  ['ETag change',observation=>{observation.comparisons[1].etag='changed';}],
  ['content mismatch',observation=>{observation.media.contentMatchesFixture=false;}],
  ['missing no-store cache mode',observation=>{delete observation.cacheMode;}],
  ['wrong cache mode',observation=>{observation.cacheMode='default';}],
  ['error phase despite completeness',observation=>{observation.errorPhase='metadata-3';}],
  ['missing comparison state',observation=>{delete observation.comparisons[1].viewedDate;}],
])test(`read-stability scope fails on ${label} without enabling writes`,async()=>{
  const observation=stableReadObservation();mutate(observation);
  const {transport,counts}=readObservationFake({observation});
  const result=await runProbeScenarios({transport,probeScope:'read-stability'}),check=result.checks[1];
  assert.equal(check.passed,false);assert.equal(result.passed,false);
  assert.equal(check.evidence.checkpoint,'read-stability-observation');
  assert.deepEqual(counts(),{creates:1,observations:1,updates:0});
});

test('read-stability scope preserves sanitized partial evidence after a later transport failure',async()=>{
  const partial=stableReadObservation();partial.complete=false;partial.comparisons=partial.comparisons.slice(0,1);partial.errorPhase='metadata-3';partial.privateMarker='private-marker';partial.media.privateMarker='private-marker';
  const {transport}=readObservationFake({error:{code:'network',status:503,message:'private-marker',observation:partial}});
  const check=(await runProbeScenarios({transport,probeScope:'read-stability'})).checks[1];
  assert.equal(check.actual,'network');assert.equal(check.httpStatus,503);
  assert.equal(check.evidence.errorPhase,'metadata-3');assert.equal(check.evidence.complete,false);
  assert.equal(check.evidence.comparisons.length,1);assert.equal(check.evidence.media.outcome,'success');
  assert.equal(JSON.stringify(check).includes('private-marker'),false);
});

test('read-stability scope rejects an unsupported transport before creating the folder',async()=>{
  let calls=0;const transport={create:async()=>{calls++;}};
  await assert.rejects(()=>runProbeScenarios({transport,probeScope:'read-stability'}));
  assert.equal(calls,0);
});

test('read-stability evidence drops private fields, invalid enums, duplicate windows and invalid numbers',async()=>{
  const observation={cacheMode:'no-store',complete:true,privateMarker:'private-marker',comparisons:[
    {window:'metadata-control',version:'same',etag:'same',contentChecksum:'same',headRevision:'same',modifiedDate:'same',viewedDate:'same',fileSize:'same',privateMarker:'private-marker'},
    {window:'metadata-control',version:'private-version',etag:'changed'},
    {window:'private-window',version:'same',etag:'same'},
  ],media:{outcome:'private-outcome',httpStatus:999,redirected:'private-marker',contentMatchesFixture:'private-marker',headers:'private-marker'},errorPhase:'private-phase'};
  const {transport}=readObservationFake({observation});
  const check=(await runProbeScenarios({transport,probeScope:'read-stability'})).checks[1];
  assert.deepEqual(check.evidence,{checkpoint:'read-stability-observation',cacheMode:'no-store',complete:true,media:{outcome:'unexpected'}});
  assert.equal(JSON.stringify(check).includes('private-marker'),false);
});

test('read-stability evidence keeps each known comparison window at most once',async()=>{
  const observation={cacheMode:'no-store',complete:false,comparisons:[
    {window:'metadata-control',version:'same',etag:'same'},
    {window:'metadata-control',version:'increased',etag:'changed'},
  ],media:{outcome:'not-reached'}};
  const {transport}=readObservationFake({observation});
  const evidence=(await runProbeScenarios({transport,probeScope:'read-stability'})).checks[1].evidence;
  assert.deepEqual(evidence.comparisons,[{window:'metadata-control',version:'same',etag:'same'}]);
});

test('read-stability evidence drops unknown windows and fields with foreign enum values',async()=>{
  const observation={cacheMode:'no-store',complete:false,comparisons:[
    {window:'private-window',version:'same',etag:'same'},
    {window:'media-window',version:'private-version',etag:'changed',contentChecksum:'private-state',headRevision:'same',privateMarker:'private-marker'},
  ],media:{outcome:'not-reached'}};
  const {transport}=readObservationFake({observation});
  const evidence=(await runProbeScenarios({transport,probeScope:'read-stability'})).checks[1].evidence;
  assert.deepEqual(evidence.comparisons,[{window:'media-window',etag:'changed',headRevision:'same'}]);
  assert.equal(JSON.stringify(evidence).includes('private'),false);
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

const makeMetadataTransport=fixture=>createProbeTransport({fetch:fixture.fetch,token:()=> 'secret',etagSource:'v2-coherent'});

test('diagnostic 9 metadata coordination reports four green checks from folder metadata only',async()=>{
  const fixture=v2CoherentDriveFixture();
  const result=await runProbeScenarios({transport:makeMetadataTransport(fixture),probeScope:'metadata-coordination'});
  assert.deepEqual(result.checks.map(check=>check.id),['fixture','metadata-invalid-token','metadata-stale-write','metadata-concurrent']);
  assert.equal(result.checks.length,4);assert.equal(result.passed,true);assert.equal(result.productReady,false);
  assert.equal(fixture.calls.some(({url})=>url.includes('alt=media')||url.includes('/upload/')),false);
  const folders=[...fixture.files.values()];assert.equal(folders.length,4);
  const root=folders.find(record=>record.parentId==='synthetic-my-drive-root');
  assert.equal(folders.filter(record=>record.parentId===root.id).length,3);
  assert.deepEqual(result.checks[1].actual,{
    checkpoint:'metadata-invalid-token',cacheMode:'no-store',phase:'complete',
    writes:[{role:'invalid-token',outcome:'stale',httpStatus:412}],
    readbacks:[{role:'after-invalid-token',outcome:'success',comparison:'equal'}],
  });
  assert.deepEqual(result.checks[2].actual,{
    checkpoint:'metadata-stale-write',cacheMode:'no-store',phase:'complete',
    writes:[{role:'first',outcome:'fulfilled',httpStatus:200},{role:'stale',outcome:'stale',httpStatus:412}],
    readbacks:[{role:'winner',outcome:'success',comparison:'equal'},{role:'final',outcome:'success',comparison:'equal'}],
  });
  assert.deepEqual(result.checks[3].actual,{
    checkpoint:'metadata-concurrent',cacheMode:'no-store',phase:'complete',
    writes:[{role:'sentinel',outcome:'fulfilled',httpStatus:200},{role:'candidate-a',outcome:'fulfilled',httpStatus:200},{role:'candidate-b',outcome:'stale',httpStatus:412}],
    readbacks:[{role:'sentinel',outcome:'success',comparison:'equal'},{role:'winner',outcome:'success',comparison:'equal'}],
  });
  assert.match(result.limitations.join(' '),/Metadaten/);
  assert.doesNotMatch(result.limitations.join(' '),/Antwortverlust/);
});

test('diagnostic 9 marks all target checks red when Drive ignores metadata If-Match',async()=>{
  const fixture=v2CoherentDriveFixture({ignoreMetadataCondition:true});
  const result=await runProbeScenarios({transport:makeMetadataTransport(fixture),probeScope:'metadata-coordination'});
  assert.equal(result.checks[0].passed,true);
  for(const id of ['metadata-invalid-token','metadata-stale-write','metadata-concurrent'])assert.equal(result.checks.find(check=>check.id===id).passed,false,id);
  assert.equal(result.passed,false);
});

test('diagnostic 9 fails closed on target version-only drift and still runs later independent checks',async()=>{
  const fixture=v2CoherentDriveFixture({mutateDuringRead:{field:'version',after:0,nameIncludes:'metadata-invalid-token'}});
  const result=await runProbeScenarios({transport:makeMetadataTransport(fixture),probeScope:'metadata-coordination'});
  assert.equal(result.checks[0].passed,true);
  assert.equal(result.checks.find(check=>check.id==='metadata-invalid-token').passed,false);
  assert.equal(result.checks.find(check=>check.id==='metadata-stale-write').passed,true);
  assert.equal(result.checks.find(check=>check.id==='metadata-concurrent').passed,true);
  assert.equal(result.checks.length,4);
});

test('diagnostic 9 keeps a measured 412 when its independent readback later fails',async()=>{
  const fixture=v2CoherentDriveFixture();let afterRejectedWrite=false,failedRead=false;
  const fetch=async(url,init)=>{
    const response=await fixture.fetch(url,init),parsed=new URL(url),method=init?.method??'GET';
    if(method==='PUT'&&response.status===412)afterRejectedWrite=true;
    else if(afterRejectedWrite&&!failedRead&&method==='GET'&&parsed.pathname.includes('/drive/v2/files/')&&parsed.searchParams.get('alt')!=='media'){
      failedRead=true;
      return new Response(JSON.stringify({privateMarker:'private-read-secret'}),{status:503,headers:{'Content-Type':'application/json'}});
    }
    return response;
  };
  const transport=createProbeTransport({fetch,token:()=> 'secret',etagSource:'v2-coherent'});
  const result=await runProbeScenarios({transport,probeScope:'metadata-coordination'}),check=result.checks[1];
  assert.equal(check.passed,false);assert.equal(check.actual,'http');assert.equal(check.httpStatus,503);
  assert.deepEqual(check.evidence.writes,[{role:'invalid-token',outcome:'stale',httpStatus:412}]);
  assert.deepEqual(check.evidence.readbacks,[{role:'after-invalid-token',outcome:'http',httpStatus:503,comparison:'unavailable'}]);
  assert.equal(JSON.stringify(result).includes('private-read-secret'),false);
  assert.equal(result.checks.length,4);
});

test('diagnostic 9 rejects a 412 that changed metadata and never exports rejected response data',async()=>{
  const fixture=v2CoherentDriveFixture();let mutated=false;
  const fetch=async(url,init)=>{
    const response=await fixture.fetch(url,init),method=init?.method??'GET';
    if(!mutated&&method==='PUT'&&response.status===412){
      mutated=true;
      const record=fixture.files.get(new URL(url).pathname.split('/').at(-1));
      record.properties=Object.fromEntries(JSON.parse(init.body).properties.map(item=>[item.key,item.value]));
      return new Response(JSON.stringify({privateMarker:'private-rejected-secret'}),{status:412,headers:{'Content-Type':'application/json'}});
    }
    return response;
  };
  const result=await runProbeScenarios({transport:createProbeTransport({fetch,token:()=> 'secret',etagSource:'v2-coherent'}),probeScope:'metadata-coordination'});
  const check=result.checks.find(item=>item.id==='metadata-invalid-token');
  assert.equal(check.passed,false);
  assert.deepEqual(check.evidence.readbacks,[{role:'after-invalid-token',outcome:'success',comparison:'different'}]);
  assert.equal(JSON.stringify(result).includes('private-rejected-secret'),false);
});

test('diagnostic 9 rejects successful writes without a confirmed HTTP status',async()=>{
  const fixture=v2CoherentDriveFixture(),transport=makeMetadataTransport(fixture);
  const update=transport.updateMetadataIfUnchanged.bind(transport);
  transport.updateMetadataIfUnchanged=async(...args)=>{const result=await update(...args);return {id:result.id};};
  const result=await runProbeScenarios({transport,probeScope:'metadata-coordination'});
  assert.equal(result.passed,false);
  const stale=result.checks.find(check=>check.id==='metadata-stale-write'),concurrent=result.checks.find(check=>check.id==='metadata-concurrent');
  assert.equal(stale.passed,false);assert.deepEqual(stale.evidence.writes,[{role:'first',outcome:'fulfilled'}]);
  assert.equal(concurrent.passed,false);assert.deepEqual(concurrent.evidence.writes,[{role:'sentinel',outcome:'fulfilled'}]);
});

test('diagnostic 9 rejects an unsupported transport before creating a folder',async()=>{
  let calls=0;const transport={createMetadataFolder:async()=>{calls++;}};
  await assert.rejects(()=>runProbeScenarios({transport,probeScope:'metadata-coordination'}));
  assert.equal(calls,0);
});

test('diagnostic 9 stops only when the root fixture cannot be established',async()=>{
  let creates=0,reads=0,writes=0;
  const transport={
    async createMetadataFolder(){creates++;throw {code:'network',status:503,message:'private-root-secret'};},
    async readMetadataSnapshot(){reads++;},
    async updateMetadataIfUnchanged(){writes++;},
  };
  const result=await runProbeScenarios({transport,probeScope:'metadata-coordination'});
  assert.deepEqual(result.checks.map(check=>check.id),['fixture']);
  assert.equal(result.passed,false);assert.equal(result.checks[0].actual,'network');assert.equal(result.checks[0].httpStatus,503);
  assert.deepEqual({creates,reads,writes},{creates:1,reads:0,writes:0});
  assert.equal(JSON.stringify(result).includes('private-root-secret'),false);
});
