import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {readFile,mkdir} from 'node:fs/promises';
import {createProbeServer} from '../../scripts/serve.mjs';
import {driveFixture} from './drive-fixture.js';

const modulePath=process.env.PLAYWRIGHT_MODULE??'playwright';
const {chromium}=await import(/^[A-Za-z]:[\\/]/.test(modulePath)?pathToFileURL(modulePath).href:modulePath);
for(const {basePath,noEtag} of [{basePath:'',noEtag:false},{basePath:'/isolated',noEtag:false},{basePath:'',noEtag:true}])test(`isolated shop probe UI with synthetic Google boundary ${basePath||'root'}${noEtag?' missing headers':''}`,async()=>{
  const server=createProbeServer({basePath});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
    const context=await browser.newContext({viewport:{width:320,height:700},acceptDownloads:true});
    const fixture=driveFixture({noEtag});let loginCalls=0;
    await context.route('https://accounts.google.com/gsi/client',route=>route.fulfill({contentType:'text/javascript',body:`globalThis.google={accounts:{oauth2:{initTokenClient(options){return {requestAccessToken(){options.callback({access_token:'synthetic-only-secret',expires_in:3600,scope:'https://www.googleapis.com/auth/drive.file'})}}}}}};`}));
    await context.route('https://www.googleapis.com/**',async route=>{
      const request=route.request();loginCalls++;
      if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PATCH','Access-Control-Allow-Headers':'authorization,content-type,if-match'}});
      const headers=await request.allHeaders();const response=await fixture.fetch(request.url(),{method:request.method(),body:request.postData(),headers:{'Content-Type':headers['content-type'],Authorization:headers.authorization,'If-Match':headers['if-match']}});
      await route.fulfill({status:response.status,body:await response.text(),headers:{...Object.fromEntries(response.headers),'Access-Control-Allow-Origin':'*','Access-Control-Expose-Headers':'ETag'}});
    });
    const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}${basePath}/shop-probe/`);
    await page.locator('#connect').waitFor();assert.equal(loginCalls,0);assert.equal(await page.locator('#start').isDisabled(),true);
    await page.locator('#connect').click();await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Verbunden.'));
    assert.equal(loginCalls,0);assert.equal(await page.locator('#start').isDisabled(),true);
    await page.locator('#consent').check();await page.locator('#start').click();
    await page.waitForFunction(noEtag=>document.getElementById('status').textContent.startsWith(noEtag?'Kaufkoordination nicht':'Alle isolierten'),noEtag,{timeout:30000});
    assert.equal(await page.locator('#checks li').count(),11);assert.equal(await page.locator('#start').isDisabled(),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.equal(await page.evaluate(()=>localStorage.length),0);assert.deepEqual(await page.evaluate(async()=>await indexedDB.databases()),[]);
    const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const downloaded=await downloadPromise;
    const report=JSON.parse(await readFile(await downloaded.path(),'utf8'));assert.equal(report.passed,!noEtag);assert.equal(report.productReady,false);assert.ok(!JSON.stringify(report).includes('synthetic-only-secret'));
    assert.equal(report.diagnosticVersion,2);
    if(noEtag){
      const first=report.checks.find(check=>check.id==='version-token');
      assert.equal(first.diagnostic.reason,'missing-strong-etag');
      assert.equal(first.diagnostic.metadataEtagState,'absent');
      assert.equal(first.diagnostic.mediaEtagState,'absent');
      assert.equal(first.scenarioStage,'fixture-read');
      assert.match(await page.locator('#checks').innerText(),/Versionskennung fehlt/);
      assert.equal(fixture.calls.some(call=>call.method==='PATCH'),false);
    }
    assert.equal(fixture.calls.filter(c=>c.method==='PATCH').every(c=>!!c.headers['If-Match']),true);
    await mkdir('test-results/shop-probe',{recursive:true});await page.screenshot({path:`test-results/shop-probe/${noEtag?'missing-headers':basePath?'subpath':'root'}.png`,fullPage:true});
    assert.deepEqual(errors,[]);
    await page.locator('#disconnect').click();assert.equal(await page.locator('#start').isDisabled(),true);
    await context.close();
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});
