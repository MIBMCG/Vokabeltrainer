import test from 'node:test';
import assert from 'node:assert/strict';
import {createV2CoherentProbeTransport} from '../../src/shop-probe/v2-coherent-transport.js';
import {canonicalJson,immutableHash} from '../../src/shop-probe/immutable-value.js';
import {v2CoherentDriveFixture} from './v2-coherent-drive-fixture.js';

const makeTransport=(fixture,fetch=fixture.fetch)=>createV2CoherentProbeTransport({fetch,token:()=> 'secret'});

test('canonical JSON sorts object keys recursively and hashes equal values identically',async()=>{
  const left={z:[3,{b:true,a:null}],a:'text'};
  const right={a:'text',z:[3,{a:null,b:true}]};
  assert.equal(canonicalJson(left),'{"a":"text","z":[3,{"a":null,"b":true}]}');
  assert.equal(await immutableHash(left),await immutableHash(right));
  assert.match(await immutableHash(left),/^[0-9a-f]{64}$/);
});

test('canonical JSON rejects unsafe values, cycles and content over 64 KiB',()=>{
  const cyclic={};cyclic.self=cyclic;
  const accessor=[];Object.defineProperty(accessor,'0',{enumerable:true,get:()=>1});accessor.length=1;
  const hidden=[1];Object.defineProperty(hidden,'hidden',{value:true});
  class DerivedArray extends Array{}const derived=new DerivedArray();derived.push(1);
  for(const value of [undefined,NaN,Infinity,1n,new Date(),[,1],accessor,hidden,derived,{value:undefined},cyclic]){
    assert.throws(()=>canonicalJson(value),{code:'invalid'});
  }
  assert.throws(()=>canonicalJson('x'.repeat(65_537)),{code:'limit'});
});

test('immutable transport reserves without upload, writes once and reads only with no-store',async()=>{
  const fixture=v2CoherentDriveFixture(),transport=makeTransport(fixture);
  const {id:anchorId}=await transport.createMetadataFolder();
  const before=fixture.calls.length;
  const ref=await transport.prepareImmutable({parentId:anchorId,value:{z:2,a:1}});
  assert.match(ref.id,/^test-\d+$/);
  assert.match(ref.sha256,/^[0-9a-f]{64}$/);
  assert.equal(fixture.calls.slice(before).filter(call=>call.method==='POST').length,0);
  assert.deepEqual(await transport.writeImmutable(ref),{a:1,z:2});
  assert.deepEqual(await transport.readImmutable(ref),{a:1,z:2});
  const reads=fixture.calls.filter(call=>call.method==='GET'&&call.url.includes(`/drive/v2/files/${ref.id}`));
  assert.ok(reads.length>=6);
  assert.equal(reads.every(call=>call.cache==='no-store'),true);
});

test('immutable reads accept version drift but reject changed content under the registered reference',async()=>{
  const fixture=v2CoherentDriveFixture({mutateDuringRead:{field:'version',after:0,filesOnly:true}}),transport=makeTransport(fixture);
  const {id:anchorId}=await transport.createMetadataFolder();
  const ref=await transport.prepareImmutable({parentId:anchorId,value:{probe:1}});
  await transport.writeImmutable(ref);
  fixture.files.get(ref.id).value={probe:2};
  await assert.rejects(()=>transport.readImmutable(ref),{code:'integrity'});
});

test('immutable binding compares the complete private property set independent of response order',async()=>{
  const fixture=v2CoherentDriveFixture({metadataOverride:(metadata,{record,count})=>{
    if(record.mimeType==='application/json'&&count%2===0)metadata.properties.reverse();
    return metadata;
  }}),transport=makeTransport(fixture);
  const {id:anchorId}=await transport.createMetadataFolder();
  const ref=await transport.prepareImmutable({parentId:anchorId,value:{probe:1}});
  assert.deepEqual(await transport.writeImmutable(ref),{probe:1});
  assert.deepEqual(await transport.readImmutable(ref),{probe:1});
});

test('immutable reads enforce reference, parent, title, MIME and private binding',async()=>{
  const fixture=v2CoherentDriveFixture(),transport=makeTransport(fixture);
  const {id:anchorId}=await transport.createMetadataFolder();
  const ref=await transport.prepareImmutable({parentId:anchorId,value:{probe:1}});
  await transport.writeImmutable(ref);
  await assert.rejects(()=>transport.readImmutable({...ref,sha256:'0'.repeat(64)}),{code:'binding'});
  await assert.rejects(()=>transport.readImmutable({...ref,extra:true}),{code:'binding'});
  await assert.rejects(()=>transport.readImmutable(ref,{parentId:'foreign-parent'}),{code:'binding'});
  fixture.files.get(ref.id).title='foreign-title';
  await assert.rejects(()=>transport.readImmutable(ref),{code:'binding'});
});

test('immutable IDs cannot be read or changed through legacy snapshot mutators',async()=>{
  const fixture=v2CoherentDriveFixture(),transport=makeTransport(fixture);
  const {id:anchorId}=await transport.createMetadataFolder();
  const ref=await transport.prepareImmutable({parentId:anchorId,value:{probe:1}});
  await transport.writeImmutable(ref);
  const before=fixture.calls.length;
  await assert.rejects(()=>transport.read(ref.id),{code:'binding'});
  await assert.rejects(()=>transport.retryCreate(ref.id,{probe:1}),{code:'binding'});
  await assert.rejects(()=>transport.updateIfUnchanged({id:ref.id},{probe:2}),{code:'binding'});
  assert.equal(fixture.calls.length,before);
});

test('immutable retry reuses the reserved ID and verifies a 409 collision',async()=>{
  const fixture=v2CoherentDriveFixture(),transport=makeTransport(fixture);
  const {id:anchorId}=await transport.createMetadataFolder();
  const ref=await transport.prepareImmutable({parentId:anchorId,value:{probe:1}});
  await transport.writeImmutable(ref);
  assert.deepEqual(await transport.writeImmutable(ref),{probe:1});
  const posts=fixture.calls.filter(call=>call.method==='POST'&&call.url.includes('/upload/drive/v3/files'));
  assert.equal(posts.length,2);
});

test('lost upload response remains recoverable only by retrying the same reserved ID',async()=>{
  const fixture=v2CoherentDriveFixture();let lose=true;
  const fetch=async(url,init)=>{
    if(lose&&(init?.method??'GET')==='POST'&&url.includes('/upload/drive/v3/files')){
      lose=false;await fixture.fetch(url,init);throw new Error('private response loss');
    }
    return fixture.fetch(url,init);
  };
  const transport=makeTransport(fixture,fetch),{id:anchorId}=await transport.createMetadataFolder();
  const ref=await transport.prepareImmutable({parentId:anchorId,value:{probe:1}});
  await assert.rejects(()=>transport.writeImmutable(ref),{code:'network'});
  assert.deepEqual(await transport.writeImmutable(ref),{probe:1});
  assert.equal(fixture.files.has(ref.id),true);
});

test('immutable verification preserves malformed 200 metadata and media response status',async()=>{
  for(const broken of ['metadata','media']){
    const fixture=v2CoherentDriveFixture();let corrupt=false;
    const fetch=async(url,request)=>{
      const method=request?.method??'GET',parsed=new URL(url);
      if(corrupt&&method==='GET'&&parsed.pathname.includes('/drive/v2/files/')){
        const id=parsed.pathname.split('/').at(-1),record=fixture.files.get(id);
        const isMedia=parsed.searchParams.get('alt')==='media';
        if(record?.mimeType==='application/json'&&isMedia===(broken==='media')){
          corrupt=false;
          return new Response('{',{status:200,headers:{'Content-Type':'application/json'}});
        }
      }
      return fixture.fetch(url,request);
    };
    const transport=makeTransport(fixture,fetch),{id:anchorId}=await transport.createMetadataFolder();
    const ref=await transport.prepareImmutable({parentId:anchorId,value:{probe:broken}});
    corrupt=true;
    await assert.rejects(()=>transport.writeImmutable(ref),error=>{
      assert.equal(error.code,'invalid');
      assert.equal(error.status,200);
      return true;
    });
    assert.deepEqual(await transport.writeImmutable(ref),{probe:broken});
    assert.equal(fixture.files.has(ref.id),true);
  }
});

test('legacy JSON parsing keeps its existing status-free invalid error',async()=>{
  const fixture=v2CoherentDriveFixture();let corrupt=false,targetId;
  const fetch=async(url,request)=>{
    const parsed=new URL(url);
    if(corrupt&&(request?.method??'GET')==='GET'&&parsed.pathname.endsWith(`/${targetId}`)&&parsed.searchParams.get('alt')==='media'){
      corrupt=false;
      return new Response('{',{status:200,headers:{'Content-Type':'application/json'}});
    }
    return fixture.fetch(url,request);
  };
  const transport=makeTransport(fixture,fetch),file=await transport.create({value:{probe:true}});
  targetId=file.id;corrupt=true;
  await assert.rejects(()=>transport.read(file.id),error=>{
    assert.equal(error.code,'invalid');
    assert.equal(error.status,null);
    return true;
  });
});

test('private property count and UTF-8 pair limits stop metadata PUTs',async()=>{
  const fixture=v2CoherentDriveFixture(),transport=makeTransport(fixture);
  const {id}=await transport.createMetadataFolder(),record=fixture.files.get(id);
  for(let index=0;index<28;index++)record.properties[`k${index}`]='v';
  const crowded=await transport.readMetadataSnapshot(id),before=fixture.calls.filter(call=>call.method==='PUT').length;
  await assert.rejects(()=>transport.updateMetadataIfUnchanged(crowded,{extra:'v'}),{code:'limit'});
  assert.equal(fixture.calls.filter(call=>call.method==='PUT').length,before);

  record.properties={app:fixture.APP,runId:record.properties.runId};
  const fresh=await transport.readMetadataSnapshot(id);
  await assert.rejects(()=>transport.updateMetadataIfUnchanged(fresh,{large:'ä'.repeat(61)}),{code:'limit'});
  assert.equal(fixture.calls.filter(call=>call.method==='PUT').length,before);
});

test('legacy snapshots still reject version-only drift during media reads',async()=>{
  const fixture=v2CoherentDriveFixture({mutateDuringRead:{field:'version',after:2}}),transport=makeTransport(fixture);
  const file=await transport.create({value:{probe:true}});
  await assert.rejects(()=>transport.read(file.id),{code:'stale'});
});
