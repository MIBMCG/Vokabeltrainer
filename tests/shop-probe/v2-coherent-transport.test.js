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
        readContext:'snapshot-read',readKind:'metadata-media-metadata',
        versionChanged:field==='version',jsonEtagChanged:field==='etag',jsonEtagState:'strong',
        contentChecksumState:'unavailable',headRevisionState:'unavailable',modifiedDateState:'unavailable',viewedDateState:'unavailable',fileSizeState:'unavailable',
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

test('v2-coherent returns the actual successful conditional write status',async()=>{
  const fixture=v2CoherentDriveFixture(),transport=makeTransport(fixture);
  const file=await transport.create({value:{before:true}}),before=await transport.read(file.id);
  assert.deepEqual(await transport.updateIfUnchanged(before,{after:true}),{id:file.id,status:200});
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

const diagnosticStates={
  contentChecksumState:'changed',
  headRevisionState:'changed',
  modifiedDateState:'same',
  viewedDateState:'changed',
  fileSizeState:'same',
};
const diagnosticMetadata=(metadata,{count})=>({...metadata,
  md5Checksum:count%2?'private-checksum-before':'private-checksum-after',
  headRevisionId:count%2?'private-revision-before':'private-revision-after',
  modifiedDate:'private-modified-marker',
  lastViewedByMeDate:count%2?'private-viewed-before':'private-viewed-after',
  fileSize:'private-size-marker',
});

test('diagnostic 6 compares five optional fields without exporting their raw values',async()=>{
  const fixture=v2CoherentDriveFixture({mutateDuringRead:{field:'version',after:0},metadataOverride:diagnosticMetadata});
  await assert.rejects(()=>makeTransport(fixture).create({value:{}}),error=>{
    assert.equal(error.code,'stale');
    assert.deepEqual(error.diagnostic,{
      phase:'read-stability',reason:'changed-during-read',etagSource:'v2-coherent',readContext:'create-verification',
      readKind:'metadata-media-metadata',versionChanged:true,jsonEtagChanged:false,jsonEtagState:'strong',...diagnosticStates,
    });
    for(const marker of ['private-checksum-before','private-checksum-after','private-revision-before','private-revision-after','private-modified-marker','private-viewed-before','private-viewed-after','private-size-marker']){
      assert.equal(JSON.stringify(error).includes(marker),false);
    }
    return true;
  });
});

test('diagnostic 6 reports missing optional metadata as unavailable',async()=>{
  const fixture=v2CoherentDriveFixture({mutateDuringRead:{field:'version',after:0}});
  await assert.rejects(()=>makeTransport(fixture).create({value:{}}),error=>{
    assert.equal(error.diagnostic.readContext,'create-verification');
    assert.equal(error.diagnostic.readKind,'metadata-media-metadata');
    for(const key of Object.keys(diagnosticStates))assert.equal(error.diagnostic[key],'unavailable',key);
    return true;
  });
});

test('diagnostic 6 reports wrongly typed optional metadata as unavailable',async()=>{
  const fixture=v2CoherentDriveFixture({mutateDuringRead:{field:'version',after:0},metadataOverride:metadata=>({...metadata,
    md5Checksum:1,headRevisionId:false,modifiedDate:{},lastViewedByMeDate:[],fileSize:null,
  })});
  await assert.rejects(()=>makeTransport(fixture).create({value:{}}),error=>{
    for(const key of Object.keys(diagnosticStates))assert.equal(error.diagnostic[key],'unavailable',key);
    return true;
  });
});

for(const [operation,readContext,after] of [
  ['create','create-verification',0],
  ['read','snapshot-read',2],
  ['retry','retry-create-verification',2],
]){
  test(`diagnostic 6 labels ${operation} instability as ${readContext}`,async()=>{
    const fixture=v2CoherentDriveFixture({mutateDuringRead:{field:'version',after}}),transport=makeTransport(fixture);
    let file;
    if(operation!=='create')file=await transport.create({value:{probe:true}});
    const action=operation==='create'?()=>transport.create({value:{probe:true}}):operation==='read'?()=>transport.read(file.id):()=>transport.retryCreate(file.id,{probe:true});
    await assert.rejects(action,error=>error.code==='stale'&&error.diagnostic?.readContext===readContext&&error.diagnostic?.readKind==='metadata-media-metadata');
  });
}

test('diagnostic 6 labels folder reads as metadata-metadata',async()=>{
  const fixture=v2CoherentDriveFixture({mutateDuringRead:{field:'version',after:0}});
  await assert.rejects(()=>makeTransport(fixture).create({folder:true}),error=>error.code==='stale'&&error.diagnostic?.readContext==='create-verification'&&error.diagnostic?.readKind==='metadata-metadata');
});

test('diagnostic 6 adds no HTTP request to a stable snapshot',async()=>{
  const fixture=v2CoherentDriveFixture(),transport=makeTransport(fixture),file=await transport.create({value:{probe:true}});
  const before=fixture.calls.length;
  await transport.read(file.id);
  const calls=fixture.calls.slice(before);
  assert.equal(calls.length,3);
  assert.equal(calls.filter(call=>call.method==='GET'&&call.url.includes('/drive/v2/files/')).length,3);
  assert.equal(new URL(calls[0].url).searchParams.get('fields'),'id,title,mimeType,parents,properties,labels,version,etag,md5Checksum,headRevisionId,modifiedDate,lastViewedByMeDate,fileSize');
  assert.equal(calls.every(call=>call.cache===undefined),true);
});

const unavailableComparison=window=>({window,version:'same',etag:'same',contentChecksum:'unavailable',headRevision:'unavailable',modifiedDate:'unavailable',viewedDate:'unavailable',fileSize:'unavailable'});

test('diagnostic 8 observes exactly M1 M2 media M3 with no-store and no conditional write',async()=>{
  const fixture=v2CoherentDriveFixture(),transport=makeTransport(fixture),folder=await transport.create({folder:true,name:'folder'});
  const before=fixture.calls.length;
  const observation=await transport.observeReadStability({parentId:folder.id,value:{probe:true}});
  assert.deepEqual(observation,{
    cacheMode:'no-store',complete:true,
    comparisons:[unavailableComparison('metadata-control'),unavailableComparison('media-window')],
    media:{outcome:'success',httpStatus:200,redirected:false,contentMatchesFixture:true},
  });
  assert.equal(Object.hasOwn(observation,'id'),false);
  const calls=fixture.calls.slice(before),diagnosticGets=calls.filter(call=>call.method==='GET'&&call.url.includes('/drive/v2/files/'));
  assert.deepEqual(calls.map(call=>call.method),['GET','POST','GET','GET','GET','GET']);
  assert.equal(diagnosticGets.length,4);
  assert.equal(diagnosticGets.every(call=>call.cache==='no-store'),true);
  assert.equal(diagnosticGets.filter(call=>new URL(call.url).searchParams.get('alt')==='media').length,1);
  assert.equal(calls.some(call=>call.method==='PUT'),false);
});

for(const [after,changedWindow] of [[0,'metadata-control'],[1,'media-window']]){
  test(`diagnostic 8 separates a pure version increase in ${changedWindow}`,async()=>{
    const fixture=v2CoherentDriveFixture({mutateDuringRead:{field:'version',after,filesOnly:true}}),transport=makeTransport(fixture),folder=await transport.create({folder:true});
    const observation=await transport.observeReadStability({parentId:folder.id,value:{probe:true}});
    assert.equal(observation.comparisons.find(item=>item.window===changedWindow).version,'increased');
    assert.equal(observation.comparisons.find(item=>item.window!==changedWindow).version,'same');
    assert.equal(observation.media.contentMatchesFixture,true);
    assert.equal(fixture.calls.some(call=>call.method==='PUT'),false);
  });
}

test('diagnostic 8 compares large versions with BigInt in both directions',async()=>{
  const fixture=v2CoherentDriveFixture({metadataOverride:(metadata,{record,count})=>record.mimeType==='application/json'?{...metadata,version:count===1?'900719925474099312345':count===2?'900719925474099312346':'900719925474099312344'}:metadata});
  const transport=makeTransport(fixture),folder=await transport.create({folder:true});
  const observation=await transport.observeReadStability({parentId:folder.id,value:{probe:true}});
  assert.deepEqual(observation.comparisons.map(item=>item.version),['increased','decreased']);
});

test('diagnostic 8 treats numerically equal but differently represented versions as changed',async()=>{
  const fixture=v2CoherentDriveFixture({metadataOverride:(metadata,{record,count})=>record.mimeType==='application/json'?{...metadata,version:count===1?'01':'1'}:metadata});
  const transport=makeTransport(fixture),folder=await transport.create({folder:true});
  const observation=await transport.observeReadStability({parentId:folder.id,value:{probe:true}});
  assert.equal(observation.comparisons[0].version,'representation-changed');
  assert.equal(observation.comparisons[1].version,'same');
});

test('diagnostic 8 rejects a mismatched v3 creation response before observation GETs',async()=>{
  const fixture=v2CoherentDriveFixture();
  const transport=createProbeTransport({token:()=> 'secret',etagSource:'v2-coherent',fetch:async(url,init)=>{
    if((init?.method??'GET')==='POST'&&new URL(url).pathname.includes('/upload/drive/v3/files'))return new Response(JSON.stringify({id:'foreign-id'}),{status:200,headers:{'Content-Type':'application/json'}});
    return fixture.fetch(url,init);
  }});
  const folder=await transport.create({folder:true});
  await assert.rejects(()=>transport.observeReadStability({parentId:folder.id,value:{probe:true}}),error=>{
    assert.equal(error.code,'binding');
    assert.deepEqual(error.observation,{cacheMode:'no-store',complete:false,comparisons:[],media:{outcome:'not-reached'},errorPhase:'creation-response'});
    return true;
  });
  assert.equal(fixture.calls.some(call=>call.method==='PUT'),false);
});

function observationFailureTransport({phase,kind}){
  const fixture=v2CoherentDriveFixture();let metadataReads=0;
  const fetch=async(url,init)=>{
    const parsed=new URL(url),method=init?.method??'GET',isObservationFile=parsed.pathname.endsWith('/test-2');
    if(phase==='creation-response'&&method==='POST'&&parsed.pathname.includes('/upload/drive/v3/files')){
      if(kind==='parse')return new Response('{',{status:200,headers:{'Content-Type':'application/json'}});
      if(kind==='http')return new Response('{}',{status:500,headers:{'Content-Type':'application/json'}});
      throw new Error('private-network-message');
    }
    if(isObservationFile&&method==='GET'&&parsed.pathname.includes('/drive/v2/files/')&&parsed.searchParams.get('alt')!=='media'){
      metadataReads++;
      if((phase==='metadata-1'&&metadataReads===1)||(phase==='metadata-2'&&metadataReads===2)||(phase==='metadata-3'&&metadataReads===3)){
        if(kind==='binding'){
          const response=await fixture.fetch(url,init),value=await response.json();value.id='private-foreign-id';
          return new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json'}});
        }
        if(kind==='parse')return new Response('{',{status:200,headers:{'Content-Type':'application/json'}});
        if(kind==='http')return new Response('{}',{status:500,headers:{'Content-Type':'application/json'}});
        throw new Error('private-network-message');
      }
    }
    if(isObservationFile&&method==='GET'&&parsed.searchParams.get('alt')==='media'&&phase==='media'){
      if(kind==='parse')return new Response('{',{status:200,headers:{'Content-Type':'application/json'}});
      if(kind==='http')return new Response('{}',{status:503,headers:{'Content-Type':'application/json'}});
      throw new Error('private-network-message');
    }
    return fixture.fetch(url,init);
  };
  return {fixture,transport:createProbeTransport({fetch,token:()=> 'secret',etagSource:'v2-coherent'})};
}

for(const [phase,kind,code] of [
  ['creation-response','parse','invalid'],
  ['metadata-1','binding','binding'],
  ['metadata-2','parse','invalid'],
  ['media','http','http'],
  ['metadata-3','network','network'],
])test(`diagnostic 8 preserves bounded partial evidence for ${kind} at ${phase}`,async()=>{
  const {fixture,transport}=observationFailureTransport({phase,kind}),folder=await transport.create({folder:true});
  await assert.rejects(()=>transport.observeReadStability({parentId:folder.id,value:{probe:true}}),error=>{
    assert.equal(error.code,code);assert.equal(error.observation.errorPhase,phase);assert.equal(error.observation.complete,false);
    assert.equal(error.observation.comparisons.length,phase==='media'||phase==='metadata-3'?1:0);
    assert.equal(error.observation.media.outcome,phase==='media'?'http':phase==='metadata-3'?'success':'not-reached');
    if(phase==='media')assert.equal(error.observation.media.httpStatus,503);
    if(phase==='metadata-3')assert.equal(error.observation.media.contentMatchesFixture,true);
    assert.equal(JSON.stringify(error.observation).includes('private-'),false);
    return true;
  });
  assert.equal(fixture.calls.some(call=>call.method==='PUT'),false);
});
