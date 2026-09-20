import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {readFile,mkdir} from 'node:fs/promises';
import {createProbeServer} from '../../scripts/serve.mjs';
import {driveFixture} from './drive-fixture.js';

const modulePath=process.env.PLAYWRIGHT_MODULE??'playwright';
const {chromium}=await import(/^[A-Za-z]:[\\/]/.test(modulePath)?pathToFileURL(modulePath).href:modulePath);
for(const {basePath,noEtag=false,source='media',noJsonEtag=false,ignore=false} of [{basePath:'',noEtag:false},{basePath:'/isolated',noEtag:false},{basePath:'',noEtag:true},{basePath:'',noEtag:true,source:'v2-json'},{basePath:'',noEtag:true,source:'v2-json',noJsonEtag:true},{basePath:'',source:'v2-json',ignore:true}])test(`isolated shop probe UI with synthetic Google boundary ${basePath||'root'} ${source}${noEtag?' missing headers':''}${noJsonEtag?' missing JSON ETag':''}${ignore?' ignored conditions':''}`,async()=>{
  const server=createProbeServer({basePath});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
    const context=await browser.newContext({viewport:{width:320,height:700},acceptDownloads:true});
    const fixture=driveFixture({noEtag,noJsonEtag,ignore,metadataIgnore:ignore});let loginCalls=0;
    await context.route('https://accounts.google.com/gsi/client',route=>route.fulfill({contentType:'text/javascript',body:`globalThis.google={accounts:{oauth2:{initTokenClient(options){return {requestAccessToken(){options.callback({access_token:'synthetic-only-secret',expires_in:3600,scope:'https://www.googleapis.com/auth/drive.file'})}}}}}};`}));
    await context.route('https://www.googleapis.com/**',async route=>{
      const request=route.request();loginCalls++;
      if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PATCH','Access-Control-Allow-Headers':'authorization,content-type,if-match'}});
      const headers=await request.allHeaders();const response=await fixture.fetch(request.url(),{method:request.method(),body:request.postData(),headers:{'Content-Type':headers['content-type'],Authorization:headers.authorization,'If-Match':headers['if-match']}});
      await route.fulfill({status:response.status,body:await response.text(),headers:{...Object.fromEntries(response.headers),'Access-Control-Allow-Origin':'*','Access-Control-Expose-Headers':'ETag'}});
    });
    const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}${basePath}/shop-probe/`);
    assert.equal(await page.locator('#source option').count(),3);await page.locator('#source').selectOption(source);
    await page.locator('#connect').waitFor();assert.equal(loginCalls,0);assert.equal(await page.locator('#start').isDisabled(),true);
    await page.locator('#connect').click();await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Verbunden.'));
    assert.equal(loginCalls,0);assert.equal(await page.locator('#start').isDisabled(),true);
    await page.locator('#consent').check();await page.locator('#start').click();
    const expectedPass=!ignore&&!noJsonEtag&&(!noEtag||source==='v2-json');
    await page.waitForFunction(expectedPass=>document.getElementById('status').textContent.startsWith(expectedPass?'Alle isolierten':'Kaufkoordination nicht'),expectedPass,{timeout:30000});
    assert.equal(await page.locator('#checks li').count(),11);assert.equal(await page.locator('#start').isDisabled(),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.equal(await page.evaluate(()=>localStorage.length),0);assert.deepEqual(await page.evaluate(async()=>await indexedDB.databases()),[]);
    const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const downloaded=await downloadPromise;
    const report=JSON.parse(await readFile(await downloaded.path(),'utf8'));assert.equal(report.passed,expectedPass);assert.equal(report.productReady,false);assert.ok(!JSON.stringify(report).includes('synthetic-only-secret'));
    assert.equal(downloaded.suggestedFilename(),'shop-probe-bericht4.json');
    assert.equal(report.diagnosticVersion,4);assert.equal(report.etagSource,source);
    if(source==='v2-json'){
      assert.equal(report.apiPaths.tokenRead,'GET /drive/v2/files/{ownedId}?fields=id,mimeType,etag');
      assert.equal(report.apiPaths.read,'GET /drive/v3/files/{probeFileId}?alt=media');
      assert.equal(report.apiPaths.mediaUpdate,'PATCH /upload/drive/v3/files/{probeFileId}?uploadType=media');
      assert.equal(report.apiPaths.metadataUpdate,'PATCH /drive/v3/files/{probeFolderId}');
      assert.ok(fixture.calls.some(call=>call.url.includes('/drive/v2/files/')));
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
    if(ignore){
      for(const id of ['initialization','two-purchases']){
        assert.deepEqual(report.checks.find(c=>c.id===id).evidence,{checkpoint:'concurrent-writes',accepted:2,stale:0,other:0,rejections:[]});
      }
      assert.match(await page.locator('#checks').innerText(),/Prüfstelle und Antwortklassen/);
    }
    assert.equal(fixture.calls.filter(c=>c.method==='PATCH').every(c=>!!c.headers['If-Match']),true);
    const screenshotName=ignore?'v4-write-diagnostics':noJsonEtag?'v2-json-missing-token':source==='v2-json'?'v2-json':noEtag?'missing-headers':basePath?'subpath':'root';
    await mkdir('test-results/shop-probe',{recursive:true});await page.screenshot({path:`test-results/shop-probe/${screenshotName}.png`,fullPage:true});
    assert.deepEqual(errors,[]);
    await page.locator('#disconnect').click();assert.equal(await page.locator('#start').isDisabled(),true);
    await context.close();
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});
