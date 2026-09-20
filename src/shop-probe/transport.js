// Isolated capability experiment. Never used by the product sync adapter.
const API='https://www.googleapis.com/drive/v3/files';
const API_V2='https://www.googleapis.com/drive/v2/files';
const UPLOAD='https://www.googleapis.com/upload/drive/v3/files';
const FIELDS='id,name,mimeType,parents,appProperties,trashed,version';
const APP='vokabeltrainer-shop-probe';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const etagState=value=>value===null?'absent':typeof value==='string'&&/^"[^"\r\n]+"$/.test(value)?'strong':typeof value==='string'&&/^W\/"[^"\r\n]+"$/.test(value)?'weak':'malformed';
export class ProbeError extends Error {
  constructor(code,status=null,diagnostic=null){super(`Probe: ${code}`);this.code=code;this.status=status;if(diagnostic)this.diagnostic=diagnostic;}
}
export function createProbeTransport({fetch:fetchImpl=globalThis.fetch,token,etagSource='media'}={}) {
  if(typeof fetchImpl!=='function'||typeof token!=='function'||!['media','metadata','v2-json'].includes(etagSource))throw new ProbeError('invalid');
  const runId=globalThis.crypto.randomUUID(),files=new Map();
  const fail=(code,diagnostic)=>{throw new ProbeError(code,null,diagnostic);};
  const owned=id=>files.get(id)??fail('binding');
  async function request(url,init={},allowed=[]) {
    let credential;try{credential=token();}catch{throw new ProbeError('auth');}
    if(typeof credential!=='string'||!credential)throw new ProbeError('auth');
    let response;try{response=await fetchImpl(url,{...init,headers:{...init.headers,Authorization:`Bearer ${credential}`}});}catch{throw new ProbeError('network');}
    if(!response.ok&&!allowed.includes(response.status))throw new ProbeError(response.status===412?'stale':response.status===409?'collision':response.status===401?'auth':response.status===403?'permission':response.status===404?'missing':'http',response.status);
    return response;
  }
  async function json(response){try{return await response.json();}catch{throw new ProbeError('invalid');}}
  async function metadata(id) {
    const expected=owned(id),response=await request(`${API}/${id}?fields=${FIELDS}`),value=await json(response);
    if(value.id!==id||value.trashed!==false||value.appProperties?.app!==APP||value.appProperties?.runId!==runId||value.mimeType!==expected.mimeType
      ||(expected.parentId&&(!Array.isArray(value.parents)||value.parents.length!==1||value.parents[0]!==expected.parentId)))fail('binding');
    if(typeof value.version!=='string'||!/^\d+$/.test(value.version))fail('unsupported',{phase:'metadata',reason:'missing-file-version'});
    return {value,etag:response.headers.get('ETag')};
  }
  async function jsonEtagMetadata(id) {
    const expected=owned(id),response=await request(`${API_V2}/${id}?fields=id,mimeType,etag`),value=await json(response);
    if(value.id!==id||value.mimeType!==expected.mimeType)fail('binding');
    return {etag:value.etag??null};
  }
  async function read(id) {
    const expected=owned(id),before=await metadata(id),jsonBefore=etagSource==='v2-json'?await jsonEtagMetadata(id):null;let value={},mediaEtag=null;
    if(!expected.folder){const response=await request(`${API}/${id}?alt=media`);mediaEtag=response.headers.get('ETag');value=await json(response);}
    const jsonAfter=etagSource==='v2-json'?await jsonEtagMetadata(id):null,after=await metadata(id);
    const selectedSource=etagSource==='v2-json'?'v2-json':expected.folder?'metadata':etagSource;
    const observation={etagSource:selectedSource,metadataEtagState:etagState(after.etag),mediaEtagState:expected.folder?'not-requested':etagState(mediaEtag),
      ...(jsonAfter?{jsonEtagState:etagState(jsonAfter.etag)}:{})};
    const versionChanged=before.value.version!==after.value.version,metadataEtagChanged=before.etag!==after.etag,jsonEtagChanged=jsonBefore?.etag!==jsonAfter?.etag;
    if(versionChanged||metadataEtagChanged||(etagSource==='v2-json'&&jsonEtagChanged))fail('stale',{phase:'read-stability',reason:'changed-during-read',...observation,versionChanged,metadataEtagChanged,...(etagSource==='v2-json'?{jsonEtagChanged}:{})});
    const etag=etagSource==='v2-json'?jsonAfter.etag:expected.folder||etagSource==='metadata'?after.etag:mediaEtag;
    if(etagState(etag)!=='strong')fail('unsupported',{phase:'read-token',reason:'missing-strong-etag',...observation});
    return {id,value,version:after.value.version,etag,properties:after.value.appProperties,
      observation:{metadataEtagReadable:!!after.etag,mediaEtagReadable:!!mediaEtag,...(jsonAfter?{jsonEtagReadable:!!jsonAfter.etag}:{}),etagSource:selectedSource}};
  }
  async function post(id,value) {
    const record=owned(id),meta={id,name:record.name,mimeType:record.mimeType,appProperties:{app:APP,runId},...(record.parentId?{parents:[record.parentId]}:{})};
    if(record.folder)return request(`${API}?fields=id`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(meta)},[409]);
    const boundary=`probe_${runId}`;
    const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(value)}\r\n--${boundary}--\r\n`;
    return request(`${UPLOAD}?uploadType=multipart&fields=id`,{method:'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body},[409]);
  }
  async function create({value={},folder=false,parentId=null,name='synthetic'}={}) {
    if(parentId&&!owned(parentId).folder)fail('binding');
    const generated=await json(await request(`${API}/generateIds?count=1&space=drive&type=files`));
    const id=generated.ids?.[0];if(!/^[A-Za-z0-9_-]+$/.test(id??''))fail('invalid');
    const record={folder,parentId,name:`SHOP-PROBE-${name}-${runId.slice(0,8)}`,mimeType:folder?'application/vnd.google-apps.folder':'application/json'};
    files.set(id,record);await post(id,value);
    // Initial readback does not require an ETag: absence must be reported by its own check.
    await metadata(id);
    if(!folder&&!same(await json(await request(`${API}/${id}?alt=media`)),value))fail('collision');
    return {id};
  }
  async function retryCreate(id,value) {
    owned(id);await post(id,value);const actual=await read(id);
    if(!same(actual.value,value))fail('collision');return actual;
  }
  async function updateIfUnchanged(before,value,{metadata:metadataOnly=false}={}) {
    const record=owned(before.id);
    if(etagState(before.etag)!=='strong')fail('unsupported',{phase:'write-token',reason:'missing-strong-etag'});
    if(metadataOnly!==record.folder)fail('binding');
    const body=metadataOnly?{appProperties:{...value,app:APP,runId}}:value;
    await request(metadataOnly?`${API}/${before.id}?fields=id,version`:`${UPLOAD}/${before.id}?uploadType=media&fields=id,version`,{
      method:'PATCH',headers:{'Content-Type':'application/json; charset=UTF-8','If-Match':before.etag},body:JSON.stringify(body),
    });
    return {id:before.id}; // Callers must independently reread the server outcome.
  }
  return {create,read,retryCreate,updateIfUnchanged};
}
