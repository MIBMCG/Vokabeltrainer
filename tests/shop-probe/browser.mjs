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
];
for(const {basePath,noEtag=false,source='media',noJsonEtag=false,ignore=false,ignoreMediaCondition=false,ignoreMetadataCondition=false,instability=false} of cases)test(`isolated shop probe UI with synthetic Google boundary ${basePath||'root'} ${source}${noEtag?' missing headers':''}${noJsonEtag?' missing JSON ETag':''}${ignore||ignoreMediaCondition||ignoreMetadataCondition?' ignored conditions':''}${instability?' unstable snapshot':''}`,async()=>{
  const server=createProbeServer({basePath});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
    const context=await browser.newContext({viewport:{width:320,height:700},acceptDownloads:true});
    const fixture=source==='v2-coherent'
      ?v2CoherentDriveFixture({ignoreMediaCondition,ignoreMetadataCondition,...(instability?{mutateDuringRead:{field:'version',after:0,filesOnly:true}}:{})})
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
    await page.locator('#connect').waitFor();assert.equal(loginCalls,0);assert.equal(await page.locator('#start').isDisabled(),true);
    await page.locator('#connect').click();await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Verbunden.'));
    assert.equal(loginCalls,0);assert.equal(await page.locator('#start').isDisabled(),true);
    await page.locator('#consent').check();await page.locator('#start').click();
    const expectedPass=!ignore&&!ignoreMediaCondition&&!ignoreMetadataCondition&&!instability&&!noJsonEtag&&(!noEtag||source==='v2-json');
    await page.waitForFunction(expectedPass=>document.getElementById('status').textContent.startsWith(expectedPass?'Alle isolierten':'Kaufkoordination nicht'),expectedPass,{timeout:30000});
    assert.equal(await page.locator('#checks li').count(),11);assert.equal(await page.locator('#start').isDisabled(),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.equal(await page.evaluate(()=>localStorage.length),0);assert.deepEqual(await page.evaluate(async()=>await indexedDB.databases()),[]);
    const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const downloaded=await downloadPromise;
    const report=JSON.parse(await readFile(await downloaded.path(),'utf8'));assert.equal(report.passed,expectedPass);assert.equal(report.productReady,false);assert.ok(!JSON.stringify(report).includes('synthetic-only-secret'));assert.ok(!JSON.stringify(report).includes('test-1'));
    assert.equal(downloaded.suggestedFilename(),'shop-probe-bericht6.json');
    assert.equal(report.diagnosticVersion,6);assert.equal(report.etagSource,source);
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
      assert.equal(fixture.calls.some(call=>call.method==='PATCH'),false);
      assert.equal(fixture.calls.some(call=>call.method==='GET'&&call.url.includes('/drive/v3/files/')&&!call.url.includes('generateIds')),false);
      if(expectedPass){
        assert.equal(Object.hasOwn(report.checks.find(check=>check.id==='initialization'),'evidence'),false);
        assert.equal(Object.hasOwn(report.checks.find(check=>check.id==='two-purchases'),'evidence'),false);
      }
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
    if(ignore||ignoreMediaCondition||ignoreMetadataCondition){
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
    const screenshotName=ignore?'v6-write-diagnostics':ignoreMediaCondition?'v2-coherent-media-ignore':ignoreMetadataCondition?'v2-coherent-metadata-ignore':instability?'v2-coherent-instability':noJsonEtag?'v2-json-missing-token':source==='v2-coherent'?'v2-coherent':source==='v2-json'?'v2-json':noEtag?'missing-headers':basePath?'subpath':'root';
    await mkdir('test-results/shop-probe',{recursive:true});await page.screenshot({path:`test-results/shop-probe/${screenshotName}.png`,fullPage:true});
    assert.deepEqual(errors,[]);
    await page.locator('#disconnect').click();assert.equal(await page.locator('#start').isDisabled(),true);
    await context.close();
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});
