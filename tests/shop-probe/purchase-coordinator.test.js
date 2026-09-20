import test from 'node:test';
import assert from 'node:assert/strict';
import {createV2CoherentProbeTransport} from '../../src/shop-probe/v2-coherent-transport.js';
import {createPurchaseCoordinator} from '../../src/shop-probe/purchase-coordinator.js';
import {v2CoherentDriveFixture} from './v2-coherent-drive-fixture.js';

const init={kind:'init',id:'init-a',epoch:'e0',earned:1000};
const makeTransport=(fixture,fetch=fixture.fetch)=>createV2CoherentProbeTransport({fetch,token:()=> 'secret'});
const putCalls=fixture=>fixture.calls.filter(call=>call.method==='PUT'&&!call.url.includes('/upload/'));

async function setup(){
  const fixture=v2CoherentDriveFixture(),transport=makeTransport(fixture);
  const {id:anchorId}=await transport.createMetadataFolder();
  return {fixture,transport,anchorId,coordinator:createPurchaseCoordinator({transport,anchorId})};
}

async function initialize(context,operation=init){
  const prepared=await context.coordinator.prepare(operation);
  assert.equal((await context.coordinator.commit(prepared.ticket)).outcome,'confirmed');
}

test('two initializers publish exactly one root and preserve unrelated anchor properties',async()=>{
  const {fixture,transport,anchorId}=await setup();
  fixture.files.get(anchorId).properties.sentinel='preserve-me';
  const a=createPurchaseCoordinator({transport,anchorId}),b=createPurchaseCoordinator({transport,anchorId});
  const [pa,pb]=await Promise.all([a.prepare(init),b.prepare({...init,id:'init-b'})]);
  const writes=await Promise.all([a.commit(pa.ticket),b.commit(pb.ticket)]);
  assert.deepEqual(writes.map(value=>value.outcome).sort(),['confirmed','stale']);
  const current=await a.read();
  assert.equal(current.snapshot.properties.sentinel,'preserve-me');
  assert.equal(current.state.earned,1000);
  assert.equal(current.state.receipts.length,1);
  assert.equal(putCalls(fixture).length,2);
});

test('a separate content parent isolates candidate creation from the anchor write token',async()=>{
  const fixture=v2CoherentDriveFixture();
  const fetch=async(url,init)=>{
    const response=await fixture.fetch(url,init);
    if((init?.method??'GET')==='POST'&&url.includes('/upload/drive/v3/files')){
      const child=[...fixture.files.values()].findLast(record=>record.mimeType==='application/json');
      const parent=fixture.files.get(child.parentId);parent.version++;parent.etagVersion++;
    }
    return response;
  };
  const transport=makeTransport(fixture,fetch);
  const {id:anchorId}=await transport.createMetadataFolder({name:'anchor'});
  const {id:contentParentId}=await transport.createMetadataFolder({name:'content'});
  const coordinator=createPurchaseCoordinator({transport,anchorId,contentParentId});
  const prepared=await coordinator.prepare(init);
  assert.equal((await coordinator.commit(prepared.ticket)).outcome,'confirmed');
  const {state}=await coordinator.read();
  assert.equal(state.receipts.length,1);
  const receiptFiles=[...fixture.files.values()].filter(record=>record.mimeType==='application/json');
  assert.equal(receiptFiles.length,1);
  assert.equal(receiptFiles[0].parentId,contentParentId);
});

test('two 800-point purchases from one snapshot yield one owner and 200 points',async()=>{
  const context=await setup();await initialize(context);
  const a=createPurchaseCoordinator({transport:context.transport,anchorId:context.anchorId});
  const b=createPurchaseCoordinator({transport:context.transport,anchorId:context.anchorId});
  const [pa,pb]=await Promise.all([
    a.prepare({kind:'purchase',id:'buy-a',epoch:'e0',article:'hat-a',price:800}),
    b.prepare({kind:'purchase',id:'buy-b',epoch:'e0',article:'hat-b',price:800}),
  ]);
  const writes=await Promise.all([a.commit(pa.ticket),b.commit(pb.ticket)]);
  assert.deepEqual(writes.map(value=>value.outcome).sort(),['confirmed','stale']);
  const {state}=await a.read();
  assert.equal(state.spent,800);
  assert.equal(state.earned-state.spent,200);
  assert.equal(state.owned.length,1);
  assert.equal(state.receipts.length,2);
});

test('an ignored metadata condition cannot satisfy the one-winner race invariant',async()=>{
  const fixture=v2CoherentDriveFixture({ignoreMetadataCondition:true}),transport=makeTransport(fixture);
  const {id:anchorId}=await transport.createMetadataFolder();
  const a=createPurchaseCoordinator({transport,anchorId}),b=createPurchaseCoordinator({transport,anchorId});
  const [pa,pb]=await Promise.all([a.prepare(init),b.prepare({...init,id:'init-b'})]);
  const outcomes=(await Promise.all([a.commit(pa.ticket),b.commit(pb.ticket)])).map(value=>value.outcome).sort();
  assert.deepEqual(outcomes,['confirmed','confirmed']);
  assert.notDeepEqual(outcomes,['confirmed','stale']);
  assert.equal((await a.read()).state.receipts.length,1);
});

test('committed operation is idempotent and changed parameters conflict without network writes',async()=>{
  const context=await setup();await initialize(context);
  const operation={kind:'purchase',id:'buy-once',epoch:'e0',article:'hat',price:200};
  const prepared=await context.coordinator.prepare(operation);
  await context.coordinator.commit(prepared.ticket);
  const before=context.fixture.calls.length;
  assert.deepEqual(await context.coordinator.prepare({...operation}),{outcome:'committed',active:true});
  await assert.rejects(()=>context.coordinator.prepare({...operation,price:400}),{code:'conflict'});
  assert.equal(context.fixture.calls.length>before,true);
  assert.equal(context.fixture.calls.slice(before).some(call=>call.method==='POST'||call.method==='PUT'),false);
  assert.equal((await context.coordinator.read()).state.spent,200);
});

test('recovery finds an ancestor receipt after a lost pointer response and later purchase',async()=>{
  const fixture=v2CoherentDriveFixture();let losePointer=false;
  const fetch=async(url,init)=>{
    if(losePointer&&(init?.method??'GET')==='PUT'&&!url.includes('/upload/')){
      losePointer=false;await fixture.fetch(url,init);throw new Error('private lost response');
    }
    return fixture.fetch(url,init);
  };
  const transport=makeTransport(fixture,fetch),{id:anchorId}=await transport.createMetadataFolder();
  const first=createPurchaseCoordinator({transport,anchorId});
  let prepared=await first.prepare(init);await first.commit(prepared.ticket);
  const lost={kind:'purchase',id:'lost-buy',epoch:'e0',article:'hat',price:800};
  prepared=await first.prepare(lost);losePointer=true;
  assert.deepEqual(await first.commit(prepared.ticket),{outcome:'uncertain',phase:'pointer',code:'network'});
  const second=createPurchaseCoordinator({transport,anchorId});
  prepared=await second.prepare({kind:'purchase',id:'later-buy',epoch:'e0',article:'boots',price:100});
  assert.equal((await second.commit(prepared.ticket)).outcome,'confirmed');
  const recovered=await createPurchaseCoordinator({transport,anchorId}).recover(lost);
  assert.equal(recovered.outcome,'committed');
  assert.equal(recovered.active,true);
  assert.equal(recovered.state.spent,900);
  assert.equal(recovered.state.receipts.length,3);
});

test('reset winning first makes an old prepared purchase stale and rejects old epochs',async()=>{
  const context=await setup();await initialize(context);
  const resetter=createPurchaseCoordinator({transport:context.transport,anchorId:context.anchorId});
  const buyer=createPurchaseCoordinator({transport:context.transport,anchorId:context.anchorId});
  const [reset,buy]=await Promise.all([
    resetter.prepare({kind:'reset',id:'reset-1',epoch:'e0',nextEpoch:'e1',earned:1000}),
    buyer.prepare({kind:'purchase',id:'old-buy',epoch:'e0',article:'hat',price:200}),
  ]);
  assert.equal((await resetter.commit(reset.ticket)).outcome,'confirmed');
  assert.equal((await buyer.commit(buy.ticket)).outcome,'stale');
  const {state}=await resetter.read();
  assert.deepEqual({epoch:state.epoch,spent:state.spent,owned:state.owned},{epoch:'e1',spent:0,owned:[]});
  await assert.rejects(()=>resetter.prepare({kind:'purchase',id:'late',epoch:'e0',article:'hat',price:200}),{code:'epoch'});
});

test('purchase winning first requires a fresh reset and makes old ownership historical',async()=>{
  const context=await setup();await initialize(context);
  const resetter=createPurchaseCoordinator({transport:context.transport,anchorId:context.anchorId});
  const buyer=createPurchaseCoordinator({transport:context.transport,anchorId:context.anchorId});
  const purchase={kind:'purchase',id:'old-buy',epoch:'e0',article:'hat',price:200};
  const [reset,buy]=await Promise.all([
    resetter.prepare({kind:'reset',id:'reset-1',epoch:'e0',nextEpoch:'e1',earned:1000}),
    buyer.prepare(purchase),
  ]);
  assert.equal((await buyer.commit(buy.ticket)).outcome,'confirmed');
  assert.equal((await resetter.commit(reset.ticket)).outcome,'stale');
  const fresh=await resetter.prepare({kind:'reset',id:'reset-1',epoch:'e0',nextEpoch:'e1',earned:1000});
  assert.equal((await resetter.commit(fresh.ticket)).outcome,'confirmed');
  const recovered=await resetter.recover(purchase);
  assert.equal(recovered.outcome,'committed');
  assert.equal(recovered.active,false);
  assert.equal(recovered.state.spent,0);
  assert.deepEqual(recovered.state.owned,[]);
});

test('tickets are one-shot and bound to their coordinator identity',async()=>{
  const context=await setup();
  const prepared=await context.coordinator.prepare(init);
  const foreign=createPurchaseCoordinator({transport:context.transport,anchorId:context.anchorId});
  await assert.rejects(()=>foreign.commit(prepared.ticket),{code:'binding'});
  await assert.rejects(()=>context.coordinator.commit({...prepared.ticket}),{code:'binding'});
  assert.equal((await context.coordinator.commit(prepared.ticket)).outcome,'confirmed');
  await assert.rejects(()=>context.coordinator.commit(prepared.ticket),{code:'binding'});
});

test('operation validation rejects wrong shape, unsafe IDs, invalid funds and duplicate ownership',async()=>{
  const context=await setup();
  await assert.rejects(()=>context.coordinator.prepare({kind:'init',id:'bad/id',epoch:'e0',earned:1000}),{code:'invalid'});
  await assert.rejects(()=>context.coordinator.prepare({...init,extra:true}),{code:'invalid'});
  await initialize(context);
  for(const operation of [
    {kind:'purchase',id:'zero',epoch:'e0',article:'hat',price:0},
    {kind:'purchase',id:'large',epoch:'e0',article:'hat',price:1001},
    {kind:'purchase',id:'fraction',epoch:'e0',article:'hat',price:1.5},
    {kind:'reset',id:'same-epoch',epoch:'e0',nextEpoch:'e0',earned:1000},
    {kind:'reset',id:'wrong-earned',epoch:'e0',nextEpoch:'e1',earned:999},
  ])await assert.rejects(()=>context.coordinator.prepare(operation),{code:'invalid'});
  let prepared=await context.coordinator.prepare({kind:'purchase',id:'first',epoch:'e0',article:'hat',price:800});
  await context.coordinator.commit(prepared.ticket);
  await assert.rejects(()=>context.coordinator.prepare({kind:'purchase',id:'poor',epoch:'e0',article:'boots',price:800}),{code:'funds'});
  await assert.rejects(()=>context.coordinator.prepare({kind:'purchase',id:'owned',epoch:'e0',article:'hat',price:100}),{code:'owned'});
});

test('commit classifies stale, uncertain and rejected writes without implicit retries',async()=>{
  for(const [status,outcome] of [[503,'uncertain'],[403,'rejected']]){
    const fixture=v2CoherentDriveFixture();let intercept=false,attempts=0;
    const fetch=async(url,init)=>{
      if(intercept&&(init?.method??'GET')==='PUT'){
        attempts++;
        return new Response('{}',{status,headers:{'Content-Type':'application/json'}});
      }
      return fixture.fetch(url,init);
    };
    const transport=makeTransport(fixture,fetch),{id:anchorId}=await transport.createMetadataFolder();
    const coordinator=createPurchaseCoordinator({transport,anchorId}),prepared=await coordinator.prepare(init);
    intercept=true;
    const result=await coordinator.commit(prepared.ticket);
    assert.equal(result.outcome,outcome);
    assert.equal(result.phase,'pointer');
    assert.equal(result.httpStatus,status);
    assert.equal(attempts,1);
  }
});

test('upload network, 5xx and invalid 200 outcomes stay uncertain and never attempt a pointer PUT',async()=>{
  for(const kind of ['network','http','invalid','binding']){
    const fixture=v2CoherentDriveFixture();let intercept=false,uploads=0,pointers=0;
    const fetch=async(url,init)=>{
      const method=init?.method??'GET';
      if(intercept&&method==='POST'&&url.includes('/upload/drive/v3/files')){
        uploads++;
        if(kind==='network'){await fixture.fetch(url,init);throw new Error('private response loss');}
        if(kind==='http')return new Response('{}',{status:503,headers:{'Content-Type':'application/json'}});
        await fixture.fetch(url,init);
        return new Response(kind==='binding'?JSON.stringify({id:'foreign-id'}):'{',{status:200,headers:{'Content-Type':'application/json'}});
      }
      if(intercept&&method==='PUT')pointers++;
      return fixture.fetch(url,init);
    };
    const transport=makeTransport(fixture,fetch),{id:anchorId}=await transport.createMetadataFolder();
    const coordinator=createPurchaseCoordinator({transport,anchorId}),prepared=await coordinator.prepare(init);
    intercept=true;
    const result=await coordinator.commit(prepared.ticket);
    assert.equal(result.outcome,'uncertain');
    assert.equal(result.phase,'upload');
    assert.equal(result.code,kind==='http'?'http':kind);
    assert.equal(uploads,1);
    assert.equal(pointers,0);
    assert.equal((await coordinator.recover(init)).outcome,'absent');
  }
});

test('a lost upload response keeps the reserved candidate for one explicit same-ID continuation',async()=>{
  const fixture=v2CoherentDriveFixture();let lose=true,uploads=0;
  const fetch=async(url,request)=>{
    const method=request?.method??'GET';
    if(method==='POST'&&url.includes('/upload/drive/v3/files')){
      uploads++;
      if(lose){lose=false;await fixture.fetch(url,request);throw new Error('private response loss');}
    }
    return fixture.fetch(url,request);
  };
  const transport=makeTransport(fixture,fetch),{id:anchorId}=await transport.createMetadataFolder();
  const coordinator=createPurchaseCoordinator({transport,anchorId}),prepared=await coordinator.prepare(init);
  assert.deepEqual(await coordinator.commit(prepared.ticket),{outcome:'uncertain',phase:'upload',code:'network'});
  assert.equal(uploads,1);
  assert.equal(putCalls(fixture).length,0);
  assert.equal((await coordinator.recover(init)).outcome,'absent');

  const continued=await coordinator.prepare({...init});
  assert.equal(continued.ticket,prepared.ticket);
  await assert.rejects(()=>coordinator.prepare({...init,earned:999}),{code:'invalid'});
  await assert.rejects(()=>coordinator.prepare({...init,id:'init-a',epoch:'other'}),{code:'conflict'});
  assert.equal((await coordinator.commit(continued.ticket)).outcome,'confirmed');
  assert.equal(uploads,2);
  assert.equal(putCalls(fixture).length,1);
  assert.equal([...fixture.files.values()].filter(record=>record.mimeType==='application/json').length,1);
  assert.equal((await coordinator.recover(init)).outcome,'committed');
  await assert.rejects(()=>coordinator.commit(prepared.ticket),{code:'binding'});
});

test('concurrent commits share one in-flight attempt and cannot duplicate the pointer PUT',async()=>{
  const fixture=v2CoherentDriveFixture();let block=false,releaseUpload,announceUpload;
  const enteredUpload=new Promise(resolve=>{announceUpload=resolve;});
  const fetch=async(url,request)=>{
    if(block&&(request?.method??'GET')==='POST'&&url.includes('/upload/drive/v3/files')){
      announceUpload();
      await new Promise(resolve=>{releaseUpload=resolve;});
    }
    return fixture.fetch(url,request);
  };
  const transport=makeTransport(fixture,fetch),{id:anchorId}=await transport.createMetadataFolder();
  const coordinator=createPurchaseCoordinator({transport,anchorId}),prepared=await coordinator.prepare(init);
  block=true;
  const first=coordinator.commit(prepared.ticket);
  await enteredUpload;
  const second=coordinator.commit(prepared.ticket);
  releaseUpload();
  const results=await Promise.all([first,second]);
  assert.deepEqual(results,[
    {outcome:'confirmed',phase:'pointer',httpStatus:200},
    {outcome:'confirmed',phase:'pointer',httpStatus:200},
  ]);
  assert.equal(fixture.calls.filter(call=>call.method==='POST'&&call.url.includes('/upload/drive/v3/files')).length,1);
  assert.equal(putCalls(fixture).length,1);
  await assert.rejects(()=>coordinator.commit(prepared.ticket),{code:'binding'});
});

test('malformed 200 immutable verification stays uncertain and explicitly continues the same candidate',async()=>{
  for(const broken of ['metadata','media']){
    const fixture=v2CoherentDriveFixture();let corrupt=false,uploads=0;
    const fetch=async(url,request)=>{
      const method=request?.method??'GET',parsed=new URL(url);
      if(method==='POST'&&url.includes('/upload/drive/v3/files'))uploads++;
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
    const coordinator=createPurchaseCoordinator({transport,anchorId}),prepared=await coordinator.prepare(init);
    corrupt=true;
    assert.deepEqual(await coordinator.commit(prepared.ticket),{
      outcome:'uncertain',phase:'upload',code:'invalid',httpStatus:200,
    });
    assert.equal(putCalls(fixture).length,0);
    assert.equal((await coordinator.commit(prepared.ticket)).outcome,'confirmed');
    assert.equal(uploads,2);
    assert.equal(putCalls(fixture).length,1);
    assert.equal([...fixture.files.values()].filter(record=>record.mimeType==='application/json').length,1);
  }
});

test('invalid 200 pointer response is uncertain and recover verifies the written receipt',async()=>{
  const fixture=v2CoherentDriveFixture();let corrupt=false,pointers=0;
  const fetch=async(url,init)=>{
    if(corrupt&&(init?.method??'GET')==='PUT'){
      pointers++;
      await fixture.fetch(url,init);
      return new Response('{',{status:200,headers:{'Content-Type':'application/json'}});
    }
    return fixture.fetch(url,init);
  };
  const transport=makeTransport(fixture,fetch),{id:anchorId}=await transport.createMetadataFolder();
  const coordinator=createPurchaseCoordinator({transport,anchorId}),prepared=await coordinator.prepare(init);
  corrupt=true;
  assert.deepEqual(await coordinator.commit(prepared.ticket),{outcome:'uncertain',phase:'pointer',code:'invalid',httpStatus:200});
  await assert.rejects(()=>coordinator.commit(prepared.ticket),{code:'binding'});
  assert.equal(pointers,1);
  assert.equal((await coordinator.recover(init)).outcome,'committed');
});

test('wrong-ID 200 pointer response is uncertain and recover verifies the written receipt',async()=>{
  const fixture=v2CoherentDriveFixture();let corrupt=false;
  const fetch=async(url,init)=>{
    if(corrupt&&(init?.method??'GET')==='PUT'){
      await fixture.fetch(url,init);
      return new Response(JSON.stringify({id:'foreign-id'}),{status:200,headers:{'Content-Type':'application/json'}});
    }
    return fixture.fetch(url,init);
  };
  const transport=makeTransport(fixture,fetch),{id:anchorId}=await transport.createMetadataFolder();
  const coordinator=createPurchaseCoordinator({transport,anchorId}),prepared=await coordinator.prepare(init);
  corrupt=true;
  assert.deepEqual(await coordinator.commit(prepared.ticket),{outcome:'uncertain',phase:'pointer',code:'binding',httpStatus:200});
  assert.equal((await coordinator.recover(init)).outcome,'committed');
});

test('partial head properties, damaged ancestry and a missing ancestor fail closed',async()=>{
  const context=await setup();
  context.fixture.files.get(context.anchorId).properties.purchaseProtocol='1';
  await assert.rejects(()=>context.coordinator.read(),{code:'invalid'});
  delete context.fixture.files.get(context.anchorId).properties.purchaseProtocol;
  await initialize(context);
  let prepared=await context.coordinator.prepare({kind:'purchase',id:'buy',epoch:'e0',article:'hat',price:200});
  await context.coordinator.commit(prepared.ticket);
  const head=context.fixture.files.get(context.anchorId).properties.purchaseHeadId;
  const previous=context.fixture.files.get(head).value.previous.id;
  context.fixture.files.get(previous).value.operation.earned=999;
  await assert.rejects(()=>context.coordinator.read(),{code:'integrity'});
  context.fixture.files.delete(previous);
  await assert.rejects(()=>context.coordinator.read(),{code:'missing'});
});

function readOnlyChainTransport(nodes,head){
  const properties={app:'test',runId:'run',purchaseProtocol:'1',purchaseHeadId:head.id,purchaseHeadHash:head.sha256};
  return {
    async readMetadataSnapshot(){return {id:'anchor',version:'1',etag:'"one"',properties,folder:true,mimeType:'application/vnd.google-apps.folder'};},
    async readImmutable(ref){const value=nodes.get(ref.id);if(!value)throw Object.assign(new Error('missing'),{code:'missing'});return structuredClone(value);},
  };
}

test('semantic replay rejects cycles, duplicate operation IDs and chains longer than 64',async()=>{
  const hash=value=>value.repeat(64).slice(0,64);
  const duplicate=new Map([
    ['a',{format:1,anchorId:'anchor',sequence:0,previous:null,operation:init}],
    ['b',{format:1,anchorId:'anchor',sequence:1,previous:{id:'a',sha256:hash('a')},operation:{kind:'purchase',id:'init-a',epoch:'e0',article:'hat',price:200}}],
  ]);
  await assert.rejects(()=>createPurchaseCoordinator({transport:readOnlyChainTransport(duplicate,{id:'b',sha256:hash('b')}),anchorId:'anchor'}).read(),{code:'invalid'});

  const cycle=new Map([
    ['a',{format:1,anchorId:'anchor',sequence:1,previous:{id:'b',sha256:hash('b')},operation:{kind:'purchase',id:'a',epoch:'e0',article:'hat',price:200}}],
    ['b',{format:1,anchorId:'anchor',sequence:2,previous:{id:'a',sha256:hash('a')},operation:{kind:'purchase',id:'b',epoch:'e0',article:'boots',price:200}}],
  ]);
  await assert.rejects(()=>createPurchaseCoordinator({transport:readOnlyChainTransport(cycle,{id:'b',sha256:hash('b')}),anchorId:'anchor'}).read(),{code:'invalid'});

  const long=new Map();let previous=null;
  for(let index=0;index<65;index++){
    const id=`n${index}`,sha256=hash(String(index%10));
    long.set(id,{format:1,anchorId:'anchor',sequence:index,previous,operation:index===0?init:{kind:'reset',id:`reset-${index}`,epoch:`e${index-1}`,nextEpoch:`e${index}`,earned:1000}});
    previous={id,sha256};
  }
  await assert.rejects(()=>createPurchaseCoordinator({transport:readOnlyChainTransport(long,previous),anchorId:'anchor'}).read(),{code:'limit'});
});

test('outer anchor version, ETag or properties drift invalidates an otherwise valid read',async()=>{
  let reads=0;
  const transport={
    async readMetadataSnapshot(){reads++;return {id:'anchor',version:String(reads),etag:`"${reads}"`,properties:{app:'x'},folder:true,mimeType:'application/vnd.google-apps.folder'};},
  };
  await assert.rejects(()=>createPurchaseCoordinator({transport,anchorId:'anchor'}).read(),{code:'stale'});
});
