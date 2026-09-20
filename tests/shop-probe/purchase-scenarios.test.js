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

  const race=result.checks[1].actual;
  assert.deepEqual(race.writes.map(({outcome,httpStatus})=>({outcome,httpStatus})),[
    {outcome:'confirmed',httpStatus:200},
    {outcome:'stale',httpStatus:412},
  ]);
  assert.equal(race.ownedCount,1);
  assert.equal(race.remainingPoints,200);

  assert.deepEqual(result.checks[2].actual,{
    checkpoint:'purchase-idempotency',phase:'complete',repeatCommitted:true,
    noAdditionalUpload:true,noAdditionalPointerWrite:true,conflictRejected:true,
    spentPoints:200,ownedCount:1,markerPreserved:true,
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
