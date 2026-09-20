import test from 'node:test';
import assert from 'node:assert/strict';
import {createProbeTransport} from '../../src/shop-probe/transport.js';
import {runProbeScenarios} from '../../src/shop-probe/scenarios.js';
import {driveFixture} from './drive-fixture.js';

test('unknown file IDs never trigger reads or updates',async()=>{
  let calls=0;const transport=createProbeTransport({token:()=> 'secret',fetch:async()=>{calls++;}});
  await assert.rejects(()=>transport.read('personal-file'),{code:'binding'});
  await assert.rejects(()=>transport.updateIfUnchanged({id:'personal-file',etag:'"x"'},{x:1}),{code:'binding'});assert.equal(calls,0);
});
test('tokens never escape errors',async()=>{
  const transport=createProbeTransport({token:()=> 'secret',fetch:async()=>{throw new Error('secret');}});
  await assert.rejects(()=>transport.create({value:{}}),error=>error.code==='network'&&!error.message.includes('secret'));
});
test('full HTTP probe uses exact conditional media PATCH and never exports token or file IDs',async()=>{
  const fixture=driveFixture(),transport=createProbeTransport({fetch:fixture.fetch,token:()=> 'secret'});
  const result=await runProbeScenarios({transport});assert.equal(result.passed,true);
  const updates=fixture.calls.filter(c=>c.method==='PATCH');assert.ok(updates.length>5);
  for(const call of updates){assert.ok(call.headers['If-Match']);assert.equal(call.headers.Authorization,'Bearer secret');}
  assert.ok(updates.some(c=>c.url.startsWith('https://www.googleapis.com/upload/drive/v3/files/')&&c.url.includes('uploadType=media')));
  assert.ok(updates.some(c=>!c.url.includes('/upload/')&&JSON.parse(c.body).appProperties));
  assert.ok(!JSON.stringify(result).includes('secret'));assert.ok(!JSON.stringify(result).includes('test-1'));
});
test('HTTP server ignoring media condition fails the capability gate',async()=>{
  const fixture=driveFixture({ignore:true});const result=await runProbeScenarios({transport:createProbeTransport({fetch:fixture.fetch,token:()=> 'secret'})});assert.equal(result.passed,false);
});
test('HTTP server ignoring metadata condition fails independent initialization gate',async()=>{
  const fixture=driveFixture({metadataIgnore:true});const result=await runProbeScenarios({transport:createProbeTransport({fetch:fixture.fetch,token:()=> 'secret'})});assert.equal(result.passed,false);assert.ok(result.checks.some(c=>c.id==='initialization'&&!c.passed));
});
test('unexposed ETag never silently becomes file version or an unconditional PATCH',async()=>{
  const fixture=driveFixture({noEtag:true});const result=await runProbeScenarios({transport:createProbeTransport({fetch:fixture.fetch,token:()=> 'secret'})});
  assert.equal(result.passed,false);assert.ok(result.unsupported>0);assert.equal(fixture.calls.filter(c=>c.method==='PATCH').length,0);
});
test('a 412 that still overwrites data cannot pass the readback gate',async()=>{
  const fixture=driveFixture({mutateBefore412:true});const result=await runProbeScenarios({transport:createProbeTransport({fetch:fixture.fetch,token:()=> 'secret'})});
  assert.equal(result.passed,false);assert.ok(result.checks.some(c=>c.id==='stale-write'&&!c.passed));
});

test('changed read and unavailable ETag are distinguishable without exporting raw values',async()=>{
  for(const change of ['version','etag']){
    const fixture=driveFixture();const reads=new Map();
    const transport=createProbeTransport({token:()=> 'secret',fetch:async(url,init)=>{
      const response=await fixture.fetch(url,init),u=new URL(url);
      if((init?.method??'GET')!=='GET'||!u.searchParams.has('fields'))return response;
      const value=await response.json();
      const count=(reads.get(value.id)??0)+1;reads.set(value.id,count);
      const headers=new Headers(response.headers);
      if(count===3){if(change==='version')value.version='987654321';else headers.set('ETag','"private-etag-marker"');}
      return new Response(JSON.stringify(value),{status:response.status,headers});
    }});
    const file=await transport.create({value:{}});
    await assert.rejects(()=>transport.read(file.id),error=>{
      assert.equal(error.code,'stale');assert.equal(error.status,null);
      assert.equal(error.diagnostic?.reason,'changed-during-read');
      assert.equal(error.diagnostic.versionChanged,change==='version');
      assert.equal(error.diagnostic.metadataEtagChanged,change==='etag');
      assert.ok(!JSON.stringify(error).includes('private-etag-marker'));
      assert.ok(!JSON.stringify(error).includes('987654321'));
      return true;
    });
    assert.equal(fixture.calls.some(call=>call.method==='PATCH'),false);
  }
});

test('report diagnoses missing, weak and malformed selected headers before any conditional write',async()=>{
  for(const [header,state] of [[null,'absent'],['W/"private-etag-marker"','weak'],['private-etag-marker','malformed']]){
    const fixture=driveFixture();
    const transport=createProbeTransport({token:()=> 'secret',fetch:async(url,init)=>{
      const response=await fixture.fetch(url,init);
      if(new URL(url).searchParams.get('alt')!=='media')return response;
      const headers=new Headers(response.headers);headers.delete('ETag');if(header)headers.set('ETag',header);
      return new Response(await response.text(),{status:response.status,headers});
    }});
    const result=await runProbeScenarios({transport});
    const check=result.checks.find(check=>check.id==='version-token');
    assert.equal(check.status,'unsupported');
    assert.deepEqual(check.diagnostic,{phase:'read-token',reason:'missing-strong-etag',etagSource:'media',metadataEtagState:'strong',mediaEtagState:state});
    assert.equal(result.passed,false);
    assert.equal(fixture.calls.some(call=>call.method==='PATCH'&&call.url.includes('/upload/')),false);
    assert.ok(!JSON.stringify(result).includes('private-etag-marker'));
  }
});

test('missing file version is reported separately from an unreadable ETag',async()=>{
  const fixture=driveFixture();
  const transport=createProbeTransport({token:()=> 'secret',fetch:async(url,init)=>{
    const response=await fixture.fetch(url,init);
    if((init?.method??'GET')!=='GET'||!new URL(url).searchParams.has('fields'))return response;
    const value=await response.json();delete value.version;
    return new Response(JSON.stringify(value),{headers:response.headers});
  }});
  const result=await runProbeScenarios({transport});
  assert.equal(result.checks[0].status,'unsupported');
  assert.deepEqual(result.checks[0].diagnostic,{phase:'metadata',reason:'missing-file-version'});
});
