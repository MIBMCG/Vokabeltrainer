import test from 'node:test';
import assert from 'node:assert/strict';

import {runPurchaseScenarios} from '../../src/shop-probe/purchase-scenarios.js';
import {runProbeScenarios} from '../../src/shop-probe/scenarios.js';
import {createProbeTransport} from '../../src/shop-probe/transport.js';
import {v2CoherentDriveFixture} from './v2-coherent-drive-fixture.js';

const ids=['purchase-init','purchase-race','purchase-idempotency','purchase-response-loss','purchase-reset-first','purchase-buy-first'];
const makeTransport=fixture=>createProbeTransport({fetch:fixture.fetch,token:()=> 'synthetic-only-secret',etagSource:'v2-coherent'});

test('runs all six immutable purchase scenarios with separate sibling anchor and content folders',async()=>{
  const fixture=v2CoherentDriveFixture();
  const result=await runPurchaseScenarios({transport:makeTransport(fixture)});

  assert.deepEqual(result.checks.map(check=>check.id),ids);
  assert.equal(result.checks.length,6);
  assert.equal(result.passed,true);
  assert.equal(result.failed,0);
  assert.equal(result.unsupported,0);
  assert.equal(result.productReady,false);

  const init=result.checks[0].actual;
  assert.deepEqual(init.writes.map(({outcome,httpStatus})=>({outcome,httpStatus})),[
    {outcome:'confirmed',httpStatus:200},
    {outcome:'stale',httpStatus:412},
  ]);
  assert.equal(init.markerPreserved,true);
  assert.equal(init.receiptCount,1);
  assert.equal(init.winnerOperationMatched,true);
  assert.equal(init.winnerEpochMatched,true);
  assert.equal(init.loserOperationExcluded,true);
  assert.equal(init.writes.every(write=>write.phase==='pointer'),true);

  const race=result.checks[1].actual;
  assert.deepEqual(race.writes.map(({outcome,httpStatus})=>({outcome,httpStatus})),[
    {outcome:'confirmed',httpStatus:200},
    {outcome:'stale',httpStatus:412},
  ]);
  assert.equal(race.ownedCount,1);
  assert.equal(race.remainingPoints,200);
  assert.equal(race.originalInitializationPreserved,true);
  assert.equal(race.winnerOperationMatched,true);
  assert.equal(race.winnerEpochMatched,true);
  assert.equal(race.loserOperationExcluded,true);
  assert.equal(race.ownedArticleMatched,true);
  assert.deepEqual(race.setupWrites,[{role:'initialization',outcome:'confirmed',phase:'pointer',httpStatus:200}]);

  assert.deepEqual(result.checks[2].actual,{
    checkpoint:'purchase-idempotency',phase:'complete',repeatCommitted:true,
    noAdditionalUpload:true,noAdditionalPointerWrite:true,conflictRejected:true,
    spentPoints:200,ownedCount:1,markerPreserved:true,
    setupWrites:[{role:'initialization',outcome:'confirmed',phase:'pointer',httpStatus:200}],
    writes:[{role:'purchase',outcome:'confirmed',phase:'pointer',httpStatus:200}],
  });
  assert.equal(result.checks[3].actual.simulatedResponseLoss,true);
  assert.equal(result.checks[3].actual.firstWriteObserved,true);
  assert.equal(result.checks[3].actual.ancestorRecovered,true);
  assert.equal(result.checks[3].actual.spentPoints,600);
  assert.equal(result.checks[3].actual.receiptCount,3);
  assert.equal(result.checks[4].actual.oldPurchaseRejected,true);
  assert.equal(result.checks[4].actual.oldEpochPrepareRejected,true);
  assert.equal(result.checks[4].actual.remainingPoints,1000);
  assert.equal(result.checks[5].actual.staleResetRejected,true);
  assert.equal(result.checks[5].actual.historicalPurchaseFound,true);
  assert.equal(result.checks[5].actual.historicalPurchaseActive,false);

  const folders=[...fixture.files.values()].filter(file=>file.mimeType==='application/vnd.google-apps.folder');
  const root=folders.find(file=>file.parentId==='synthetic-my-drive-root');
  assert.ok(root);
  const children=folders.filter(file=>file.parentId===root.id);
  assert.equal(children.length,12);
  for(const id of ids){
    const anchor=children.find(file=>file.title.includes(`${id}-anchor`));
    const content=children.find(file=>file.title.includes(`${id}-content`));
    assert.ok(anchor,id);
    assert.ok(content,id);
    assert.notEqual(anchor.id,content.id,id);
    const nodes=[...fixture.files.values()].filter(file=>file.mimeType==='application/json'&&file.value?.anchorId===anchor.id);
    assert.ok(nodes.length>=1,id);
    assert.equal(nodes.every(file=>file.parentId===content.id),true,id);
  }
});

test('delegates immutable purchases and rejects unsupported transports before any Drive call',async()=>{
  const fixture=v2CoherentDriveFixture();
  const result=await runProbeScenarios({transport:makeTransport(fixture),probeScope:'immutable-purchases'});
  assert.deepEqual(result.checks.map(check=>check.id),ids);
  assert.equal(result.passed,true);

  let calls=0;
  const wrongSource={
    async create(){calls++;},async read(){calls++;},async updateIfUnchanged(){calls++;},
  };
  await assert.rejects(()=>runProbeScenarios({transport:wrongSource,probeScope:'immutable-purchases'}),/Unsupported probe scope/);
  assert.equal(calls,0);
});

test('ignored folder If-Match fails both races and keeps exact write outcomes',async()=>{
  const fixture=v2CoherentDriveFixture({ignoreMetadataCondition:true});
  const result=await runPurchaseScenarios({transport:makeTransport(fixture)});

  for(const id of ['purchase-init','purchase-race']){
    const check=result.checks.find(item=>item.id===id);
    assert.equal(check.passed,false,id);
    assert.equal(check.actual,'assertion',id);
    assert.deepEqual(check.evidence.writes.map(({outcome,httpStatus})=>({outcome,httpStatus})),[
      {outcome:'confirmed',httpStatus:200},
      {outcome:'confirmed',httpStatus:200},
    ],id);
  }
  assert.equal(result.passed,false);
});

test('effective pointer mutation behind a 412 cannot pass either race',async()=>{
  const fixture=v2CoherentDriveFixture();
  const fetch=async(url,init)=>{
    const response=await fixture.fetch(url,init),method=init?.method??'GET',id=new URL(url).pathname.split('/').at(-1),record=fixture.files.get(id);
    if(method==='PUT'&&response.status===412&&record?.mimeType==='application/vnd.google-apps.folder'
      &&(record.title.includes('purchase-init-anchor')||record.title.includes('purchase-race-anchor'))){
      record.properties=Object.fromEntries(JSON.parse(init.body).properties.map(property=>[property.key,property.value]));
      record.version++;record.etagVersion++;
    }
    return response;
  };
  const transport=createProbeTransport({fetch,token:()=> 'synthetic-only-secret',etagSource:'v2-coherent'});
  const result=await runPurchaseScenarios({transport});
  for(const id of ['purchase-init','purchase-race']){
    const check=result.checks.find(item=>item.id===id);
    assert.equal(check.passed,false,id);
    assert.equal(check.evidence.winnerOperationMatched,false,id);
    assert.equal(check.evidence.loserOperationExcluded,false,id);
    assert.equal(check.evidence.writes.filter(write=>write.outcome==='confirmed'&&write.httpStatus===200).length,1,id);
    assert.equal(check.evidence.writes.filter(write=>write.outcome==='stale'&&write.httpStatus===412).length,1,id);
  }
});

test('setup pointer 503 retains structured sanitized commit evidence',async()=>{
  const fixture=v2CoherentDriveFixture(),base=makeTransport(fixture);let failed=false;
  const transport={...base,async updateMetadataIfUnchanged(before,properties){
    const record=fixture.files.get(before.id);
    if(!failed&&properties?.purchaseProtocol==='1'&&record?.title.includes('purchase-race-anchor')){
      failed=true;throw {code:'http',status:503,message:'raw-private-pointer'};
    }
    return base.updateMetadataIfUnchanged(before,properties);
  }};
  const check=(await runPurchaseScenarios({transport})).checks.find(item=>item.id==='purchase-race');
  assert.equal(check.passed,false);
  assert.equal(check.actual,'http');
  assert.equal(check.httpStatus,503);
  assert.deepEqual(check.evidence.setupWrites,[{
    role:'initialization',outcome:'uncertain',phase:'pointer',code:'http',httpStatus:503,
  }]);
  assert.equal(JSON.stringify(check).includes('raw-private-pointer'),false);
});

test('unclear upload in a race retains upload phase and error class',async()=>{
  const fixture=v2CoherentDriveFixture(),base=makeTransport(fixture);let failUpload=true;
  const transport={...base,async writeImmutable(...args){
    if(failUpload){failUpload=false;throw {code:'network',message:'raw-private-upload'};}
    return base.writeImmutable(...args);
  }};
  const check=(await runPurchaseScenarios({transport})).checks.find(item=>item.id==='purchase-init');
  assert.equal(check.passed,false);
  assert.equal(check.actual,'assertion');
  assert.deepEqual(check.evidence.writes.find(write=>write.outcome==='uncertain'),{
    role:'client-a',outcome:'uncertain',phase:'upload',code:'network',
  });
  assert.equal(JSON.stringify(check).includes('raw-private-upload'),false);
});

test('later readback failure preserves setup and race commit groups',async()=>{
  const fixture=v2CoherentDriveFixture(),base=makeTransport(fixture);let pointerAttempts=0,failReadback=false,failed=false;
  const transport={...base,
    async updateMetadataIfUnchanged(before,properties){
      const target=properties?.purchaseProtocol==='1'&&fixture.files.get(before.id)?.title.includes('purchase-race-anchor');
      if(target)pointerAttempts++;
      try{return await base.updateMetadataIfUnchanged(before,properties);}
      finally{if(target&&pointerAttempts===3)failReadback=true;}
    },
    async readMetadataSnapshot(id){
      if(failReadback&&!failed&&fixture.files.get(id)?.title.includes('purchase-race-anchor')){
        failed=true;throw {code:'network',status:503,message:'raw-private-readback'};
      }
      return base.readMetadataSnapshot(id);
    },
  };
  const check=(await runPurchaseScenarios({transport})).checks.find(item=>item.id==='purchase-race');
  assert.equal(check.passed,false);
  assert.equal(check.actual,'network');
  assert.deepEqual(check.evidence.setupWrites,[{role:'initialization',outcome:'confirmed',phase:'pointer',httpStatus:200}]);
  assert.deepEqual(check.evidence.writes.map(({outcome,phase,code,httpStatus})=>({outcome,phase,code,httpStatus})),[
    {outcome:'confirmed',phase:'pointer',code:undefined,httpStatus:200},
    {outcome:'stale',phase:'pointer',code:'stale',httpStatus:412},
  ]);
  assert.equal(JSON.stringify(check).includes('raw-private-readback'),false);
});

test('a readback failure after competing writes retains bounded write evidence',async()=>{
  const fixture=v2CoherentDriveFixture();
  const base=makeTransport(fixture);
  let successfulPointer=false,failed=false;
  const transport={...base,
    async updateMetadataIfUnchanged(...args){
      const value=await base.updateMetadataIfUnchanged(...args);
      if(args[1]?.purchaseProtocol==='1')successfulPointer=true;
      return value;
    },
    async readMetadataSnapshot(...args){
      if(successfulPointer&&!failed){failed=true;throw {code:'network',status:503,message:'raw-private-error'};}
      return base.readMetadataSnapshot(...args);
    },
  };
  const result=await runPurchaseScenarios({transport});
  const check=result.checks[0];
  assert.equal(check.passed,false);
  assert.equal(check.actual,'network');
  assert.equal(check.httpStatus,503);
  assert.equal(check.evidence.phase,'readback');
  assert.deepEqual(check.evidence.writes.map(({outcome,httpStatus})=>({outcome,httpStatus})),[
    {outcome:'confirmed',httpStatus:200},
    {outcome:'stale',httpStatus:412},
  ]);
  assert.equal(result.checks.length,6);
  assert.equal(JSON.stringify(result).includes('raw-private-error'),false);
});

test('a receipt-state failure after competing writes retains bounded write evidence',async()=>{
  const fixture=v2CoherentDriveFixture();
  const base=makeTransport(fixture);
  let successfulPointer=false,failed=false;
  const transport={...base,
    async updateMetadataIfUnchanged(...args){
      const value=await base.updateMetadataIfUnchanged(...args);
      if(args[1]?.purchaseProtocol==='1')successfulPointer=true;
      return value;
    },
    async readImmutable(...args){
      if(successfulPointer&&!failed){failed=true;throw {code:'integrity',message:'raw-private-state'};}
      return base.readImmutable(...args);
    },
  };
  const result=await runPurchaseScenarios({transport});
  const check=result.checks[0];
  assert.equal(check.passed,false);
  assert.equal(check.actual,'integrity');
  assert.equal(check.evidence.phase,'readback');
  assert.deepEqual(check.evidence.writes.map(({outcome,httpStatus})=>({outcome,httpStatus})),[
    {outcome:'confirmed',httpStatus:200},
    {outcome:'stale',httpStatus:412},
  ]);
  assert.equal(result.checks.length,6);
  assert.equal(JSON.stringify(result).includes('raw-private-state'),false);
});

test('exports only bounded evidence without IDs, hashes, contents, tokens, ETags, or raw errors',async()=>{
  const fixture=v2CoherentDriveFixture({ignoreMetadataCondition:true});
  const result=await runPurchaseScenarios({transport:makeTransport(fixture)});
  const exported=JSON.stringify(result);
  assert.equal(exported.includes('synthetic-only-secret'),false);
  assert.equal(exported.includes('test-'),false);
  assert.equal(exported.includes('v2-version-'),false);
  assert.equal(exported.includes('purchaseHeadId'),false);
  assert.equal(exported.includes('purchaseHeadHash'),false);
  assert.equal(/[0-9a-f]{64}/u.test(exported),false);
  assert.equal(exported.includes('init-a'),false);
  assert.equal(exported.includes('epoch-'),false);
  assert.equal(exported.includes('dragon-'),false);
});
