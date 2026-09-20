import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {readFile,mkdir} from 'node:fs/promises';
import {createProbeServer} from '../../scripts/serve.mjs';
import {driveFixture} from './drive-fixture.js';
import {v2CoherentDriveFixture} from './v2-coherent-drive-fixture.js';

const modulePath=process.env.PLAYWRIGHT_MODULE??'playwright';
const {chromium}=await import(/^[A-Za-z]:[\\/]/.test(modulePath)?pathToFileURL(modulePath).href:modulePath);
const cases=[
  {basePath:'',noEtag:false},
  {basePath:'/isolated',noEtag:false},
  {basePath:'',noEtag:true},
  {basePath:'',noEtag:true,source:'v2-json'},
  {basePath:'',noEtag:true,source:'v2-json',noJsonEtag:true},
  {basePath:'',source:'v2-json',ignore:true},
  {basePath:'',source:'v2-coherent'},
  {basePath:'',source:'v2-coherent',ignoreMediaCondition:true},
  {basePath:'',source:'v2-coherent',ignoreMetadataCondition:true},
  {basePath:'',source:'v2-coherent',instability:true},
  {basePath:'',source:'v2-coherent',scope:'invalid-token'},
  {basePath:'',source:'v2-coherent',scope:'invalid-token',invalidTokenStatus:400},
  {basePath:'',source:'v2-coherent',scope:'invalid-token',ignoreMediaCondition:true},
  {basePath:'',source:'v2-coherent',scope:'read-stability'},
  {basePath:'',source:'v2-coherent',scope:'read-stability',readInstability:true},
];
for(const {basePath,noEtag=false,source='media',scope='full',noJsonEtag=false,ignore=false,ignoreMediaCondition=false,ignoreMetadataCondition=false,instability=false,invalidTokenStatus=null,readInstability=false} of cases)test(`isolated shop probe UI with synthetic Google boundary ${basePath||'root'} ${source} ${scope}${noEtag?' missing headers':''}${noJsonEtag?' missing JSON ETag':''}${ignore||ignoreMediaCondition||ignoreMetadataCondition?' ignored conditions':''}${instability?' unstable snapshot':''}${invalidTokenStatus?` invalid token ${invalidTokenStatus}`:''}${readInstability?' unstable observation':''}`,async()=>{
  const server=createProbeServer({basePath});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
    const context=await browser.newContext({viewport:{width:320,height:700},acceptDownloads:true});
    const fixture=source==='v2-coherent'
      ?v2CoherentDriveFixture({ignoreMediaCondition,ignoreMetadataCondition,invalidTokenStatus,...(instability||readInstability?{mutateDuringRead:{field:'version',after:0,filesOnly:true}}:{})})
      :driveFixture({noEtag,noJsonEtag,ignore,metadataIgnore:ignore});
    let loginCalls=0;
    await context.route('https://accounts.google.com/gsi/client',route=>route.fulfill({contentType:'text/javascript',body:`globalThis.google={accounts:{oauth2:{initTokenClient(options){return {requestAccessToken(){options.callback({access_token:'synthetic-only-secret',expires_in:3600,scope:'https://www.googleapis.com/auth/drive.file'})}}}}}};`}));
    await context.route('https://www.googleapis.com/**',async route=>{
      const request=route.request();loginCalls++;
      if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PATCH,PUT','Access-Control-Allow-Headers':'authorization,content-type,if-match'}});
      const headers=await request.allHeaders();const response=await fixture.fetch(request.url(),{method:request.method(),body:request.postData(),headers:{'Content-Type':headers['content-type'],Authorization:headers.authorization,'If-Match':headers['if-match']}});
      await route.fulfill({status:response.status,body:await response.text(),headers:{...Object.fromEntries(response.headers),'Access-Control-Allow-Origin':'*','Access-Control-Expose-Headers':'ETag'}});
    });
    const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}${basePath}/shop-probe/`);
    assert.equal(await page.locator('#source option').count(),4);await page.locator('#source').selectOption(source);
    assert.equal(await page.locator('#scope option').count(),3);assert.equal(await page.locator('#scope').inputValue(),'full');await page.locator('#scope').selectOption(scope);
    assert.match(await page.locator('#scope-hint').innerText(),/Drive v2 kohärent.*keine Schreibbedingung/);
    await page.locator('#connect').waitFor();assert.equal(loginCalls,0);assert.equal(await page.locator('#start').isDisabled(),true);
    await page.locator('#connect').click();await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Verbunden.'));
    assert.equal(loginCalls,0);assert.equal(await page.locator('#start').isDisabled(),true);
    await page.locator('#consent').check();await page.locator('#start').click();
    assert.equal(await page.locator('#source').isDisabled(),true);assert.equal(await page.locator('#scope').isDisabled(),true);
    const expectedPass=!ignore&&!ignoreMediaCondition&&!ignoreMetadataCondition&&!instability&&!readInstability&&!invalidTokenStatus&&!noJsonEtag&&(!noEtag||source==='v2-json');
    await page.waitForFunction(({scope,expectedPass})=>{const text=document.getElementById('status').textContent;return scope==='invalid-token'?text.includes('keine vollständige Kaufkoordination geprüft'):scope==='read-stability'?text.includes('keine Schreibbedingung geprüft'):text.startsWith(expectedPass?'Alle isolierten':'Kaufkoordination nicht');},{scope,expectedPass},{timeout:30000});
    assert.equal(await page.locator('#checks li').count(),scope==='full'?11:2);assert.equal(await page.locator('#start').isDisabled(),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.equal(await page.evaluate(()=>localStorage.length),0);assert.deepEqual(await page.evaluate(async()=>await indexedDB.databases()),[]);
    const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const downloaded=await downloadPromise;
    const report=JSON.parse(await readFile(await downloaded.path(),'utf8'));assert.equal(report.passed,expectedPass);assert.equal(report.productReady,false);assert.ok(!JSON.stringify(report).includes('synthetic-only-secret'));assert.ok(!JSON.stringify(report).includes('test-1'));
    assert.equal(downloaded.suggestedFilename(),'shop-probe-bericht8.json');
    assert.equal(report.diagnosticVersion,8);assert.equal(report.etagSource,source);assert.equal(report.probeScope,scope);
    if(source==='v2-json'){
      assert.equal(report.apiPaths.tokenRead,'GET /drive/v2/files/{ownedId}?fields=id,mimeType,etag');
      assert.equal(report.apiPaths.read,'GET /drive/v3/files/{probeFileId}?alt=media');
      assert.equal(report.apiPaths.mediaUpdate,'PATCH /upload/drive/v3/files/{probeFileId}?uploadType=media');
      assert.equal(report.apiPaths.metadataUpdate,'PATCH /drive/v3/files/{probeFolderId}');
      assert.ok(fixture.calls.some(call=>call.url.includes('/drive/v2/files/')));
    }
    if(source==='v2-coherent'){
      assert.equal(report.apiPaths.idReservation,'GET /drive/v3/files/generateIds');
      assert.equal(report.apiPaths.create,'POST /drive/v3/files oder /upload/drive/v3/files');
      assert.equal(report.apiPaths.metadataRead,'GET /drive/v2/files/{ownedId}?fields=...version,etag,md5Checksum,headRevisionId,modifiedDate,lastViewedByMeDate,fileSize');
      assert.equal(report.apiPaths.read,'GET /drive/v2/files/{probeFileId}?alt=media');
      assert.equal(report.apiPaths.mediaUpdate,'PUT /upload/drive/v2/files/{probeFileId}?uploadType=media');
      assert.equal(report.apiPaths.metadataUpdate,'PUT /drive/v2/files/{probeFolderId}');
      assert.equal(report.apiPaths.condition,'If-Match');
      assert.equal(Object.hasOwn(report.apiPaths,'readObservation'),scope==='read-stability');
      assert.equal(Object.hasOwn(report.apiPaths,'observationCache'),scope==='read-stability');
      assert.equal(fixture.calls.some(call=>call.method==='PATCH'),false);
      assert.equal(fixture.calls.some(call=>call.method==='GET'&&call.url.includes('/drive/v3/files/')&&!call.url.includes('generateIds')),false);
      if(expectedPass&&scope==='full'){
        assert.equal(Object.hasOwn(report.checks.find(check=>check.id==='initialization'),'evidence'),false);
        assert.equal(Object.hasOwn(report.checks.find(check=>check.id==='two-purchases'),'evidence'),false);
      }
    }
    if(scope==='invalid-token'){
      const observation=(report.checks.find(check=>check.id==='invalid-token').actual?.checkpoint==='invalid-token-observation'
        ?report.checks.find(check=>check.id==='invalid-token').actual
        :report.checks.find(check=>check.id==='invalid-token').evidence);
      if(invalidTokenStatus===400)assert.deepEqual(observation,{checkpoint:'invalid-token-observation',outcome:'http',httpStatus:400,readback:'unchanged',readbackOutcome:'success'});
      else if(ignoreMediaCondition)assert.deepEqual(observation,{checkpoint:'invalid-token-observation',outcome:'fulfilled',httpStatus:200,readback:'changed',readbackOutcome:'success'});
      else assert.deepEqual(observation,{checkpoint:'invalid-token-observation',outcome:'stale',httpStatus:412,readback:'unchanged',readbackOutcome:'success'});
      assert.match(await page.locator('#status').innerText(),/keine vollständige Kaufkoordination geprüft/);
    }
    if(scope==='read-stability'){
      const check=report.checks.find(item=>item.id==='read-stability'),observation=check.actual?.checkpoint==='read-stability-observation'?check.actual:check.evidence;
      assert.equal(observation.checkpoint,'read-stability-observation');assert.equal(observation.cacheMode,'no-store');assert.equal(observation.complete,true);
      assert.equal(observation.comparisons[0].window,'metadata-control');assert.equal(observation.comparisons[0].version,readInstability?'increased':'same');
      assert.equal(observation.comparisons[1].window,'media-window');assert.equal(observation.comparisons[1].version,'same');
      assert.deepEqual(observation.media,{outcome:'success',httpStatus:200,redirected:false,contentMatchesFixture:true});
      assert.match(await page.locator('#status').innerText(),/keine Schreibbedingung geprüft/);
      assert.equal(fixture.calls.some(call=>call.method==='PUT'),false);
    }
    if(noEtag&&source==='media'){
      const first=report.checks.find(check=>check.id==='version-token');
      assert.equal(first.diagnostic.reason,'missing-strong-etag');
      assert.equal(first.diagnostic.metadataEtagState,'absent');
      assert.equal(first.diagnostic.mediaEtagState,'absent');
      assert.equal(first.scenarioStage,'fixture-read');
      assert.match(await page.locator('#checks').innerText(),/Versionskennung fehlt/);
      assert.equal(fixture.calls.some(call=>call.method==='PATCH'),false);
    }
    if(noJsonEtag){
      const first=report.checks.find(check=>check.id==='version-token');
      assert.equal(first.diagnostic.jsonEtagState,'absent');
      assert.equal(fixture.calls.some(call=>call.method==='PATCH'),false);
    }
    if(scope==='full'&&(ignore||ignoreMediaCondition||ignoreMetadataCondition)){
      const failedIds=ignore?['initialization','two-purchases']:ignoreMediaCondition?['two-purchases']:['initialization'];
      for(const id of failedIds){
        assert.deepEqual(report.checks.find(c=>c.id===id).evidence,{checkpoint:'concurrent-writes',accepted:2,stale:0,other:0,rejections:[]});
      }
      assert.match(await page.locator('#checks').innerText(),/Prüfstelle und Antwortklassen/);
    }
    if(instability){
      const first=report.checks.find(check=>check.id==='version-token');
      assert.equal(first.passed,false);
      assert.deepEqual(first.diagnostic,{phase:'read-stability',reason:'changed-during-read',etagSource:'v2-coherent',jsonEtagState:'strong',readContext:'create-verification',readKind:'metadata-media-metadata',contentChecksumState:'unavailable',headRevisionState:'unavailable',modifiedDateState:'unavailable',viewedDateState:'unavailable',fileSizeState:'unavailable',versionChanged:true,jsonEtagChanged:false});
    }
    const conditionalMethod=source==='v2-coherent'?'PUT':'PATCH';
    assert.equal(fixture.calls.filter(c=>c.method===conditionalMethod).every(c=>!!c.headers['If-Match']),true);
    const screenshotName=readInstability?'v2-read-observation-unstable':scope==='read-stability'?'v2-read-observation':ignore?'v6-write-diagnostics':ignoreMediaCondition?'v2-coherent-media-ignore':ignoreMetadataCondition?'v2-coherent-metadata-ignore':instability?'v2-coherent-instability':noJsonEtag?'v2-json-missing-token':source==='v2-coherent'?'v2-coherent':source==='v2-json'?'v2-json':noEtag?'missing-headers':basePath?'subpath':'root';
    await mkdir('test-results/shop-probe',{recursive:true});await page.screenshot({path:`test-results/shop-probe/${screenshotName}.png`,fullPage:true});
    assert.deepEqual(errors,[]);
    await page.locator('#disconnect').click();assert.equal(await page.locator('#start').isDisabled(),true);
    await context.close();
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});

test('read-stability UI rejects a non-v2 source before any Drive request',async()=>{
  const server=createProbeServer({basePath:''});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
  try{
    browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
    const context=await browser.newContext();let driveCalls=0;
    await context.route('https://accounts.google.com/gsi/client',route=>route.fulfill({contentType:'text/javascript',body:`globalThis.google={accounts:{oauth2:{initTokenClient(options){return {requestAccessToken(){options.callback({access_token:'synthetic-only-secret',expires_in:3600,scope:'https://www.googleapis.com/auth/drive.file'})}}}}}};`}));
    await context.route('https://www.googleapis.com/**',route=>{driveCalls++;return route.fulfill({status:500,body:'{}'});});
    const page=await context.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/shop-probe/`);
    await page.locator('#source').selectOption('media');await page.locator('#scope').selectOption('read-stability');await page.locator('#connect').click();
    await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Verbunden.'));await page.locator('#consent').check();await page.locator('#start').click();
    await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Drive v2 kohärent'));
    assert.equal(driveCalls,0);assert.equal(await page.locator('#checks li').count(),0);assert.equal(await page.locator('#download').isDisabled(),true);
    assert.equal(await page.locator('#source').inputValue(),'media');assert.equal(await page.evaluate(()=>localStorage.length),0);
    await context.close();
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});
