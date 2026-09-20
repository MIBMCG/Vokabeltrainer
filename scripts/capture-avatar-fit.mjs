import http from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.cwd(), output=resolve('docs/design/avatar-fit-v3/runtime');
await mkdir(output,{recursive:true});
const server=http.createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta charset="utf-8"><main></main>');return;}
  const file=resolve(root,`.${path}`);
  if((!path.startsWith('/src/trainer/avatar/')&&!path.startsWith('/trainer/assets/avatar-shop/'))||!file.startsWith(root)){res.writeHead(404).end();return;}
  try{res.setHeader('Content-Type',extname(path)==='.js'?'text/javascript':'image/webp');res.end(await readFile(file));}catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
const failures=[];
try{
 const modulePath=process.env.PLAYWRIGHT_MODULE??'playwright';
 const {chromium}=await import(/^[A-Za-z]:[\\/]/.test(modulePath)?pathToFileURL(modulePath).href:modulePath);
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const page=await browser.newPage({viewport:{width:1160,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>failures.push(e.message));
 page.on('response',r=>{if(r.status()>=400)failures.push(String(r.status()));});
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 const figures=await page.evaluate(async()=>{
  const {FIGURES,ITEMS,isCompatible}=await import('/src/trainer/avatar/catalog.js');
  const {figurePicture}=await import('/src/trainer/avatar/art.js');
  const style=document.createElement('style');style.textContent='*{box-sizing:border-box}body{margin:0;background:#f4eee2;color:#163a45;font:15px system-ui}main{padding:24px}h1{font-size:26px;margin:0 0 8px}p{margin:0 0 18px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.card{background:#fffdf5;border:1px solid #c6d9ce;border-radius:18px;padding:10px;min-width:0}.card h2{font-size:16px;margin:0 0 8px}.frame{height:365px;display:flex;align-items:center;justify-content:center}.avatar-shop-art{width:100%;max-height:365px}.pair-grid{display:grid;grid-template-columns:repeat(4,256px);gap:16px}.pair .avatar-shop-art{width:256px}.pair{background:#fffdf5;border:1px solid #c6d9ce;border-radius:14px;padding:0 0 8px}.pair h2{font-size:14px;padding:8px;margin:0}';document.head.append(style);
  const main=document.querySelector('main');main.innerHTML='<h1>Überarbeitete Abenteuerfiguren</h1><p>Tatsächliche Bildlagen aus der App-Bildpipeline · interne Vorschau, noch keine Nutzerabnahme</p><div class="grid"></div>';
  const sets={'explorer-girl':'runes','explorer-boy':'runes',horse:'moon',tiger:'jungle',dragon:'crystal','deer-mist':'forest','wolf-aurora':'aurora','panther-shadow':'obsidian','unicorn-moon':'moon','griffin-storm':'storm','dragon-crystal':'crystal','pegasus-star':'moon',phoenix:'sun'};
  for(const fig of FIGURES){
   const equipment=Object.fromEntries(ITEMS.filter(item=>item.setId===sets[fig.id]&&isCompatible(item.id,fig.id)).map(item=>[item.slot,item.id]));
   const card=document.createElement('section');card.className='card';const h=document.createElement('h2');h.textContent=fig.name;
   const frame=document.createElement('div');frame.className='frame';frame.append(figurePicture({figureId:fig.id,equipment},{sizes:'256px',animations:false}));card.append(h,frame);main.querySelector('.grid').append(card);
  }
  await Promise.all([...document.images].map(im=>im.decode()));return FIGURES.map(fig=>({id:fig.id,name:fig.name}));
 });
 await page.locator('main').screenshot({path:resolve(output,'all-13-sets.png')});
 let pairs=0;
 for(const fig of figures){
  pairs+=await page.evaluate(async fig=>{
   const {ITEMS,isCompatible}=await import('/src/trainer/avatar/catalog.js');const {figurePicture}=await import('/src/trainer/avatar/art.js');
   const main=document.querySelector('main');main.replaceChildren();const h=document.createElement('h1');h.textContent=fig.name+' – Einzelartikel';main.append(h);const grid=document.createElement('div');grid.className='pair-grid';main.append(grid);
   const items=ITEMS.filter(item=>isCompatible(item.id,fig.id));
   for(const item of items){const card=document.createElement('section');card.className='pair';const title=document.createElement('h2');title.textContent=item.name;card.append(title,figurePicture({figureId:fig.id,equipment:{[item.slot]:item.id}},{sizes:'256px',animations:false}));grid.append(card);}
   await Promise.all([...document.images].map(im=>im.decode()));return items.length;
  },fig);
  await page.locator('main').screenshot({path:resolve(output,fig.id+'-pairs.png')});
 }
 if(pairs!==62||failures.length)throw new Error(JSON.stringify({pairs,failures}));
 await writeFile(resolve(output,'capture.json'),JSON.stringify({figures:figures.length,pairs,errors:failures,renderer:'src/trainer/avatar/art.js',source:'generated WebP assets',cardWidth:256,personalAcceptance:false},null,2)+'\n');
 console.log(JSON.stringify({figures:figures.length,pairs,errors:failures.length}));
}finally{await browser?.close();await new Promise(done=>server.close(done));}
