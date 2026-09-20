import test from 'node:test';
import assert from 'node:assert/strict';
import {createProbeTransport} from '../../src/shop-probe/transport.js';
import {runProbeScenarios} from '../../src/shop-probe/scenarios.js';
import {v2CoherentDriveFixture} from './v2-coherent-drive-fixture.js';

const makeTransport=fixture=>createProbeTransport({fetch:fixture.fetch,token:()=> 'secret',etagSource:'v2-coherent'});

test('v2-coherent uses v2 for every coordinated read and conditional write',async()=>{
  const fixture=v2CoherentDriveFixture();
  const result=await runProbeScenarios({transport:makeTransport(fixture)});
  assert.equal(result.passed,true);
  const writes=fixture.calls.filter(call=>call.method==='PUT');
  assert.ok(writes.some(call=>call.url.includes('/upload/drive/v2/files/')&&call.url.includes('uploadType=media')));
  assert.ok(writes.some(call=>call.url.includes('/drive/v2/files/')&&!call.url.includes('/upload/')));
  assert.equal(writes.filter(call=>call.headers['If-Match']==='"deliberately-invalid-probe-token"').length,1);
  assert.ok(writes.filter(call=>call.headers['If-Match']!=='"deliberately-invalid-probe-token"').every(call=>call.headers['If-Match']?.startsWith('"v2-version-')));
  assert.ok(fixture.calls.some(call=>call.method==='GET'&&call.url.includes('/drive/v3/files/generateIds')));
  assert.ok(fixture.calls.some(call=>call.method==='POST'&&call.url.includes('/drive/v3/files')));
  assert.equal(fixture.calls.some(call=>call.method==='GET'&&call.url.includes('/drive/v3/files/')&&!call.url.includes('generateIds')),false);
  assert.equal(fixture.calls.some(call=>call.method==='PATCH'),false);
  assert.equal(result.productReady,false);
});

for(const [option,checkId] of [['ignoreMediaCondition','two-purchases'],['ignoreMetadataCondition','initialization']]){
  test(`v2-coherent rejects ${option}`,async()=>{
    const fixture=v2CoherentDriveFixture({[option]:true});
    const result=await runProbeScenarios({transport:makeTransport(fixture)});
    assert.equal(result.passed,false);
    assert.deepEqual(result.checks.find(check=>check.id===checkId).evidence,{
      checkpoint:'concurrent-writes',accepted:2,stale:0,other:0,rejections:[],
    });
  });
}

test('v2-coherent detects a 412 response that still mutates content',async()=>{
  const fixture=v2CoherentDriveFixture({mutateBefore412:true});
  const result=await runProbeScenarios({transport:makeTransport(fixture)});
  assert.equal(result.passed,false);
  assert.equal(result.checks.find(check=>check.id==='stale-write').passed,false);
});

for(const field of ['version','etag']){
  test(`v2-coherent rejects a ${field} change during one snapshot before writing`,async()=>{
    const fixture=v2CoherentDriveFixture({mutateDuringRead:{field,after:2}});
    const transport=makeTransport(fixture);
    const file=await transport.create({value:{probe:true}});
    await assert.rejects(()=>transport.read(file.id),error=>{
      assert.equal(error.code,'stale');
      assert.deepEqual(error.diagnostic,{
        phase:'read-stability',reason:'changed-during-read',etagSource:'v2-coherent',
        versionChanged:field==='version',jsonEtagChanged:field==='etag',jsonEtagState:'strong',
      });
      return true;
    });
    assert.equal(fixture.calls.some(call=>call.method==='PUT'),false);
  });
}

const bindingCases=[
  ['title',{title:'foreign-title'}],
  ['id',{id:'foreign-id'}],
  ['mimeType',{mimeType:'text/plain'}],
  ['v3-style parents',{parents:['foreign-parent']}],
  ['trashed',{labels:{trashed:true}}],
  ['missing labels',metadata=>{delete metadata.labels;return metadata;}],
  ['missing app',metadata=>({...metadata,properties:metadata.properties.filter(item=>item.key!=='app')})],
  ['wrong app',metadata=>({...metadata,properties:metadata.properties.map(item=>item.key==='app'?{...item,value:'foreign-app'}:item)})],
  ['public app',metadata=>({...metadata,properties:metadata.properties.map(item=>item.key==='app'?{...item,visibility:'PUBLIC'}:item)})],
  ['missing runId',metadata=>({...metadata,properties:metadata.properties.filter(item=>item.key!=='runId')})],
  ['wrong runId',metadata=>({...metadata,properties:metadata.properties.map(item=>item.key==='runId'?{...item,value:'foreign-run'}:item)})],
  ['public runId',metadata=>({...metadata,properties:metadata.properties.map(item=>item.key==='runId'?{...item,visibility:'PUBLIC'}:item)})],
  ['duplicate properties',metadata=>({...metadata,properties:[...metadata.properties,{...metadata.properties[0]}]})],
  ['duplicate special properties',metadata=>({...metadata,properties:[...metadata.properties,{key:'__proto__',value:'one',visibility:'PRIVATE'},{key:'__proto__',value:'two',visibility:'PRIVATE'}]})],
];
for(const [label,metadataOverride] of bindingCases){
  test(`v2-coherent rejects ${label} binding before any PUT`,async()=>{
    const fixture=v2CoherentDriveFixture({metadataOverride});
    await assert.rejects(()=>makeTransport(fixture).create({value:{}}),{code:'binding'});
    assert.equal(fixture.calls.some(call=>call.method==='PUT'),false);
  });
}

test('v2-coherent requires a child file to retain its exact bound parent',async()=>{
  const fixture=v2CoherentDriveFixture({metadataOverride:(metadata,{record})=>record.parentId==='synthetic-my-drive-root'?metadata:{...metadata,parents:[{id:'foreign-parent'}]}});
  const transport=makeTransport(fixture),folder=await transport.create({folder:true,name:'folder'});
  await assert.rejects(()=>transport.create({parentId:folder.id,value:{}}),{code:'binding'});
  assert.equal(fixture.calls.some(call=>call.method==='PUT'),false);
});

for(const [label,etag,state] of [['missing',undefined,'absent'],['weak','W/"private-marker"','weak'],['malformed','private-marker','malformed'],['space','"private marker"','malformed'],['control','"private\nmarker"','malformed']]){
  test(`v2-coherent rejects ${label} v2 ETag before any PUT`,async()=>{
    const fixture=v2CoherentDriveFixture({metadataOverride:metadata=>{
      if(etag===undefined)delete metadata.etag;else metadata.etag=etag;
      return metadata;
    }});
    await assert.rejects(()=>makeTransport(fixture).create({value:{}}),error=>{
      assert.equal(error.code,'unsupported');
      assert.deepEqual(error.diagnostic,{phase:'read-token',reason:'missing-strong-etag',etagSource:'v2-coherent',jsonEtagState:state});
      assert.equal(JSON.stringify(error).includes('private-marker'),false);
      return true;
    });
    assert.equal(fixture.calls.some(call=>call.method==='PUT'),false);
  });
}

test('v2-coherent forwards the supplied strong ETag without refreshing it',async()=>{
  const fixture=v2CoherentDriveFixture(),transport=makeTransport(fixture);
  const file=await transport.create({value:{before:true}}),before=await transport.read(file.id);
  await assert.rejects(()=>transport.updateIfUnchanged({...before,etag:'"deliberately-invalid-probe-token"'},{after:true}),{code:'stale',status:412});
  const write=fixture.calls.findLast(call=>call.method==='PUT');
  assert.equal(write.headers['If-Match'],'"deliberately-invalid-probe-token"');
});

test('v2-coherent preserves bound private properties during metadata PUT',async()=>{
  const fixture=v2CoherentDriveFixture(),transport=makeTransport(fixture);
  const folder=await transport.create({folder:true,name:'folder'});
  fixture.files.get(folder.id).properties.extra='kept';
  const before=await transport.read(folder.id);
  await transport.updateIfUnchanged(before,{coordinator:'candidate'},{metadata:true});
  assert.deepEqual(fixture.files.get(folder.id).properties,{app:fixture.APP,runId:before.properties.runId,extra:'kept',coordinator:'candidate'});
});

test('v2-coherent preserves safe special property keys during metadata PUT',async()=>{
  const fixture=v2CoherentDriveFixture({metadataOverride:metadata=>({...metadata,properties:[...metadata.properties,{key:'__proto__',value:'kept',visibility:'PRIVATE'}]})});
  const transport=makeTransport(fixture),folder=await transport.create({folder:true,name:'folder'}),before=await transport.read(folder.id);
  await transport.updateIfUnchanged(before,{coordinator:'candidate'},{metadata:true});
  const body=JSON.parse(fixture.calls.findLast(call=>call.method==='PUT').body);
  assert.ok(body.properties.some(property=>property.key==='__proto__'&&property.value==='kept'&&property.visibility==='PRIVATE'));
});

test('v2-coherent rejects non-string metadata properties before PUT',async()=>{
  const fixture=v2CoherentDriveFixture(),transport=makeTransport(fixture);
  const folder=await transport.create({folder:true,name:'folder'}),before=await transport.read(folder.id);
  await assert.rejects(()=>transport.updateIfUnchanged(before,{coordinator:42},{metadata:true}),{code:'binding'});
  assert.equal(fixture.calls.some(call=>call.method==='PUT'),false);
});

test('v2-coherent rejects foreign IDs without HTTP calls and hides token failures',async()=>{
  const fixture=v2CoherentDriveFixture(),transport=makeTransport(fixture);
  await assert.rejects(()=>transport.read('foreign-id'),{code:'binding'});
  await assert.rejects(()=>transport.updateIfUnchanged({id:'foreign-id',etag:'"x"'},{x:1}),{code:'binding'});
  assert.equal(fixture.calls.length,0);
  const broken=createProbeTransport({fetch:async()=>{throw new Error('secret');},token:()=> 'secret',etagSource:'v2-coherent'});
  await assert.rejects(()=>broken.create({value:{}}),error=>error.code==='network'&&!error.message.includes('secret'));
});
