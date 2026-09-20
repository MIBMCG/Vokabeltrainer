const clone=value=>structuredClone(value);
const initial=()=>({probeVersion:1,epoch:'epoch-0',sequence:0,earned:1000,spent:0,operations:[],owned:[]});
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const assert=(condition)=>{if(!condition)throw Object.assign(new Error('unexpected'),{code:'assertion'});};
async function rejects(operation,code){try{await operation();}catch(error){assert(error.code===code);return;}assert(false);}

// Export classifications only, never raw headers, file IDs, token values or errors.
function safeDiagnostic(value){
  if(!value||typeof value!=='object')return null;
  const allowed={phase:['metadata','read-stability','read-token','write-token'],reason:['missing-file-version','changed-during-read','missing-strong-etag'],etagSource:['media','metadata','v2-json'],metadataEtagState:['absent','strong','weak','malformed'],mediaEtagState:['absent','strong','weak','malformed','not-requested'],jsonEtagState:['absent','strong','weak','malformed']};
  const result={};
  for(const [key,values] of Object.entries(allowed))if(Object.hasOwn(value,key)&&values.includes(value[key]))result[key]=value[key];
  for(const key of ['versionChanged','metadataEtagChanged','jsonEtagChanged'])if(Object.hasOwn(value,key)&&typeof value[key]==='boolean')result[key]=value[key];
  return Object.keys(result).length?result:null;
}

// Synthetic coordinator rules only. This deliberately does not import the product ledger.
export function purchase(state,{id,article,price,epoch=state.epoch,conflicted=false}) {
  const previous=state.operations.find(op=>op.id===id);
  if(previous){assert(previous.article===article&&previous.price===price&&previous.epoch===epoch);return clone(state);}
  assert(!conflicted&&epoch===state.epoch&&Number.isSafeInteger(price)&&price>0);
  if(state.owned.includes(article))return clone(state);
  assert(state.earned-state.spent>=price);
  const next=clone(state);next.sequence++;next.spent+=price;next.owned.push(article);
  next.operations.push({kind:'purchase',id,article,price,epoch});return next;
}
export async function runProbeScenarios({transport,emit=()=>{}}) {
  const checks=[];
  async function read(id,scenarioStage='post-write-read'){
    try{return await transport.read(id);}
    catch(error){throw {code:error?.code,status:error?.status,diagnostic:error?.diagnostic,scenarioStage};}
  }
  async function check(id,expected,fn) {
    let result;try{const detail=await fn();result={id,expected,passed:true,status:'passed',actual:detail??'Erwartete Wirkung nach erneutem Lesen bestätigt.'};}
    catch(error){const code=['unsupported','stale','collision','auth','network','binding','permission','missing','http','assertion'].includes(error?.code)?error.code:'unexpected';
      const diagnostic=safeDiagnostic(error?.diagnostic);
      result={id,expected,passed:false,status:code==='unsupported'?'unsupported':'failed',actual:code,...(diagnostic?{diagnostic}:{}),...(['fixture-read','post-write-read','initialization-read'].includes(error?.scenarioStage)?{scenarioStage:error.scenarioStage}:{}),...(Number.isInteger(error?.status)?{httpStatus:error.status}:{})};}
    checks.push(result);emit(clone(result));
  }
  let folder;
  await check('fixture','Eigener synthetischer Probeordner angelegt.',async()=>{folder=await transport.create({folder:true,name:'SYNTHETISCH'});});
  if(!folder)return summarize(checks);
  async function fixture(name){const file=await transport.create({parentId:folder.id,name,value:initial()});return read(file.id,'fixture-read');}
  await check('version-token','Starke Versionskennung im Browser lesbar.',async()=>{const file=await fixture('token');return file.observation??'Versionskennung lesbar.';});
  await check('invalid-token','Falsches If-Match ergibt 412; Inhalt bleibt unverändert.',async()=>{
    const before=await fixture('invalid-token');await rejects(()=>transport.updateIfUnchanged({...before,etag:'"deliberately-invalid-probe-token"'},{...before.value,sequence:99}),'stale');assert(same((await read(before.id)).value,before.value));
  });
  await check('stale-write','Verbrauchtes If-Match ergibt 412; erster Inhalt bleibt.',async()=>{
    const before=await fixture('stale'),winner={...before.value,sequence:1};await transport.updateIfUnchanged(before,winner);
    await rejects(()=>transport.updateIfUnchanged(before,{...before.value,sequence:2}),'stale');assert(same((await read(before.id)).value,winner));
  });
  await check('initialization','Zwei Initialisierer: genau eine verbindliche Ordnerbindung.',async()=>{
    const a=await transport.create({parentId:folder.id,name:'candidate-a',value:initial()}),b=await transport.create({parentId:folder.id,name:'candidate-b',value:initial()});
    const before=await read(folder.id,'initialization-read');
    const results=await Promise.allSettled([a,b].map(file=>transport.updateIfUnchanged(before,{...before.properties,coordinator:file.id},{metadata:true})));
    assert(results.filter(r=>r.status==='fulfilled').length===1);assert(results.filter(r=>r.status==='rejected'&&r.reason.code==='stale').length===1);
    const winner=results[0].status==='fulfilled'?a:b;assert((await read(folder.id)).properties.coordinator===winner.id);
  });
  await check('two-purchases','Zwei Käufe zu 800 bei 1000 Guthaben: genau einer, Rest 200.',async()=>{
    const before=await fixture('two-clients'),a=purchase(before.value,{id:'buy-a',article:'a',price:800}),b=purchase(before.value,{id:'buy-b',article:'b',price:800});
    const results=await Promise.allSettled([transport.updateIfUnchanged(clone(before),a),transport.updateIfUnchanged(clone(before),b)]);
    assert(results.filter(r=>r.status==='fulfilled').length===1);assert(results.filter(r=>r.status==='rejected'&&r.reason.code==='stale').length===1);
    const current=(await read(before.id)).value;assert(current.spent===800&&current.operations.length===1);
    await rejects(async()=>purchase(current,{id:'third',article:'c',price:800}),'assertion');
  });
  await check('response-loss','Absichtlich verworfene Erfolgsantwort: Beleg mit gleicher ID gefunden, keine zweite Ausgabe.',async()=>{
    const before=await fixture('response-loss'),request={id:'same-operation',article:'a',price:800};
    try{await transport.updateIfUnchanged(before,purchase(before.value,request));throw Object.assign(new Error(),{code:'network'});}catch(error){if(error.code!=='network')throw error;}
    let current=await read(before.id);assert(current.value.operations.some(op=>op.id===request.id));
    await transport.updateIfUnchanged(current,purchase(current.value,{id:'later-operation',article:'b',price:100}));
    current=await read(before.id);
    assert(same(purchase(current.value,request),current.value));await rejects(()=>transport.updateIfUnchanged(before,purchase(before.value,request)),'stale');
    assert((await read(before.id)).value.spent===900);
    return 'Erfolgsantwort lokal verworfen; kein tatsächlicher Leitungsabbruch simuliert.';
  });
  await check('duplicate-operation','Vorgang und vorhandener Besitz erzeugen keine zweite Ausgabe.',async()=>{
    const before=await fixture('duplicate'),request={id:'same',article:'a',price:800},after=purchase(before.value,request);await transport.updateIfUnchanged(before,after);
    const current=(await read(before.id)).value;assert(same(purchase(current,request),current));assert(same(purchase(current,{...request,id:'different'}),current));
    await rejects(async()=>purchase(current,{...request,price:700}),'assertion');
  });
  await check('reset-race','Kauf und Epochenwechsel teilen dieselbe Schreibgrenze; beide Gewinnerreihenfolgen.',async()=>{
    for(const resetFirst of [true,false]){
      const before=await fixture(resetFirst?'reset-first':'buy-first');
      const reset={...initial(),epoch:'epoch-1',sequence:1,operations:[{id:'reset',kind:'reset',epoch:'epoch-1'}]};
      const buy=purchase(before.value,{id:'old-buy',article:'a',price:800,epoch:'epoch-0'});
      const winner=resetFirst?reset:buy,loser=resetFirst?buy:reset;
      await transport.updateIfUnchanged(before,winner);await rejects(()=>transport.updateIfUnchanged(before,loser),'stale');assert(same((await read(before.id)).value,winner));
      if(resetFirst)await rejects(async()=>purchase(reset,{id:'late-buy',article:'a',price:800,epoch:'epoch-0'}),'assertion');
    }
  });
  await check('create-conflict','Erneutes Create prüft identischen Inhalt; abweichender Inhalt wird abgewiesen.',async()=>{
    const before=await fixture('create-retry');await transport.retryCreate(before.id,before.value);
    await rejects(()=>transport.retryCreate(before.id,{...before.value,earned:2000}),'collision');assert(same((await read(before.id)).value,before.value));
  });
  await check('conflict-credit','Konfliktbehaftete Grundlage kann keine synthetische Ausgabe auslösen.',async()=>{
    await rejects(async()=>purchase(initial(),{id:'conflicted',article:'a',price:800,conflicted:true}),'assertion');
    return 'Lokale Proberegel geprüft; Produktledger/Quarantäne noch nicht integriert.';
  });
  return summarize(checks);
}
function summarize(checks){return {passed:checks.length>0&&checks.every(c=>c.passed),failed:checks.filter(c=>c.status==='failed').length,unsupported:checks.filter(c=>c.status==='unsupported').length,checks,productReady:false,
  limitations:['Zwei logische Clients im selben Browser; keine Zwei-Geräte-Abnahme.','Antwortverlust durch lokales Verwerfen einer Erfolgsantwort; kein echter Leitungsabbruch.','Keine Produktdaten-, Altclient-, Backup- oder Epochenmigration geprüft.','Ein Probe-Erfolg ersetzt keine dokumentierte Servergarantie.']};}
