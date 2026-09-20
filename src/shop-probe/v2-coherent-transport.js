// Isolated Drive-v2 coordination candidate. Never imported by the product adapter.
const API_V2='https://www.googleapis.com/drive/v2/files';
const UPLOAD_V2='https://www.googleapis.com/upload/drive/v2/files';
const API_V3='https://www.googleapis.com/drive/v3/files';
const UPLOAD_V3='https://www.googleapis.com/upload/drive/v3/files';
const V2_FIELDS='id,title,mimeType,parents,properties,labels,version,etag,md5Checksum,headRevisionId,modifiedDate,lastViewedByMeDate,fileSize';
const APP='vokabeltrainer-shop-probe';
const FOLDER_MIME='application/vnd.google-apps.folder';
const JSON_MIME='application/json';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const observationState=(before,after)=>typeof before==='string'&&before.length>0&&typeof after==='string'&&after.length>0
  ?before===after?'same':'changed'
  :'unavailable';
const etagState=value=>value===null||value===undefined?'absent':typeof value==='string'&&/^"[\x21\x23-\x7E\x80-\xFF]+"$/.test(value)?'strong':typeof value==='string'&&/^W\/"[\x21\x23-\x7E\x80-\xFF]+"$/.test(value)?'weak':'malformed';
const strongEtag=value=>etagState(value)==='strong';

class V2ProbeError extends Error{
  constructor(code,status=null,diagnostic=null){super(`Probe: ${code}`);this.code=code;this.status=status;if(diagnostic)this.diagnostic=diagnostic;}
}

export function createV2CoherentProbeTransport({fetch:fetchImpl=globalThis.fetch,token}={}){
  if(typeof fetchImpl!=='function'||typeof token!=='function')throw new V2ProbeError('invalid');
  const runId=globalThis.crypto.randomUUID(),files=new Map();
  const fail=(code,diagnostic)=>{throw new V2ProbeError(code,null,diagnostic);};
  const owned=id=>files.get(id)??fail('binding');

  async function request(url,init={},allowed=[]){
    let credential;
    try{credential=token();}catch{throw new V2ProbeError('auth');}
    if(typeof credential!=='string'||!credential)throw new V2ProbeError('auth');
    let response;
    try{response=await fetchImpl(url,{...init,headers:{...init.headers,Authorization:`Bearer ${credential}`}});}
    catch{throw new V2ProbeError('network');}
    if(!response.ok&&!allowed.includes(response.status)){
      const code=response.status===412?'stale':response.status===409?'collision':response.status===401?'auth':response.status===403?'permission':response.status===404?'missing':'http';
      throw new V2ProbeError(code,response.status);
    }
    return response;
  }

  async function json(response){
    try{return await response.json();}catch{throw new V2ProbeError('invalid');}
  }

  function normalizeParents(value){
    if(!Array.isArray(value)||!value.every(parent=>parent&&typeof parent==='object'&&typeof parent.id==='string'))fail('binding');
    return value.map(parent=>parent.id);
  }

  function normalizePrivateProperties(value){
    if(!Array.isArray(value))fail('binding');
    const entries=new Map();
    for(const property of value){
      if(!property||typeof property.key!=='string'||typeof property.value!=='string'||property.visibility!=='PRIVATE'||entries.has(property.key))fail('binding');
      entries.set(property.key,property.value);
    }
    return Object.fromEntries(entries);
  }

  function privatePropertiesBody(properties){
    const entries=Object.entries(properties);
    if(!entries.every(([key,value])=>typeof key==='string'&&typeof value==='string'))fail('binding');
    return entries.sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>({key,value,visibility:'PRIVATE'}));
  }

  async function readV2Metadata(id){
    const expected=owned(id);
    const value=await json(await request(`${API_V2}/${id}?fields=${V2_FIELDS}`));
    const parents=normalizeParents(value.parents),properties=normalizePrivateProperties(value.properties);
    if(expected.parentId){if(!same(parents,[expected.parentId]))fail('binding');}
    else if(expected.boundRootParents){if(!same(parents,expected.boundRootParents))fail('binding');}
    else{
      if(parents.length!==1)fail('binding');
      expected.boundRootParents=parents;
    }
    if(value.id!==id||value.title!==expected.name||value.mimeType!==expected.mimeType||value.labels?.trashed!==false
      ||properties.app!==APP||properties.runId!==runId)fail('binding');
    if(typeof value.version!=='string'||!/^\d+$/.test(value.version))fail('unsupported',{phase:'metadata',reason:'missing-file-version'});
    if(!strongEtag(value.etag))fail('unsupported',{phase:'read-token',reason:'missing-strong-etag',etagSource:'v2-coherent',jsonEtagState:etagState(value.etag)});
    return {version:value.version,etag:value.etag,properties,
      md5Checksum:value.md5Checksum,headRevisionId:value.headRevisionId,modifiedDate:value.modifiedDate,
      lastViewedByMeDate:value.lastViewedByMeDate,fileSize:value.fileSize};
  }

  async function readSnapshot(id,readContext){
    const expected=owned(id),before=await readV2Metadata(id);
    let value={};
    if(!expected.folder)value=await json(await request(`${API_V2}/${id}?alt=media`));
    const after=await readV2Metadata(id);
    const versionChanged=before.version!==after.version,jsonEtagChanged=before.etag!==after.etag;
    if(versionChanged||jsonEtagChanged)fail('stale',{
      phase:'read-stability',reason:'changed-during-read',etagSource:'v2-coherent',readContext,
      readKind:expected.folder?'metadata-metadata':'metadata-media-metadata',versionChanged,jsonEtagChanged,jsonEtagState:etagState(after.etag),
      contentChecksumState:observationState(before.md5Checksum,after.md5Checksum),
      headRevisionState:observationState(before.headRevisionId,after.headRevisionId),
      modifiedDateState:observationState(before.modifiedDate,after.modifiedDate),
      viewedDateState:observationState(before.lastViewedByMeDate,after.lastViewedByMeDate),
      fileSizeState:observationState(before.fileSize,after.fileSize),
    });
    return {id,value,version:after.version,etag:after.etag,properties:after.properties,folder:expected.folder,mimeType:expected.mimeType,
      observation:{etagSource:'v2-coherent',jsonEtagReadable:true}};
  }

  async function read(id){return readSnapshot(id,'snapshot-read');}

  async function post(id,value){
    const record=owned(id),metadata={id,name:record.name,mimeType:record.mimeType,appProperties:{app:APP,runId},...(record.parentId?{parents:[record.parentId]}:{})};
    if(record.folder)return request(`${API_V3}?fields=id`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(metadata)},[409]);
    const boundary=`probe_${runId}`;
    const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(value)}\r\n--${boundary}--\r\n`;
    return request(`${UPLOAD_V3}?uploadType=multipart&fields=id`,{method:'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body},[409]);
  }

  async function create({value={},folder=false,parentId=null,name='synthetic'}={}){
    if(parentId&&!owned(parentId).folder)fail('binding');
    const generated=await json(await request(`${API_V3}/generateIds?count=1&space=drive&type=files`));
    const id=generated.ids?.[0];
    if(!/^[A-Za-z0-9_-]+$/.test(id??''))fail('invalid');
    const record={folder,parentId,name:`SHOP-PROBE-${name}-${runId.slice(0,8)}`,mimeType:folder?FOLDER_MIME:JSON_MIME};
    files.set(id,record);
    const response=await post(id,value);
    if(response.status===409)fail('collision');
    const actual=await readSnapshot(id,'create-verification');
    if(!folder&&!same(actual.value,value))fail('collision');
    return {id};
  }

  async function retryCreate(id,value){
    owned(id);
    await post(id,value);
    const actual=await readSnapshot(id,'retry-create-verification');
    if(!same(actual.value,value))fail('collision');
    return actual;
  }

  async function updateIfUnchanged(before,value,{metadata=false}={}){
    if(!before||typeof before!=='object')fail('binding');
    const record=owned(before.id);
    if(before.folder!==record.folder||before.mimeType!==record.mimeType||metadata!==record.folder||before.properties?.app!==APP||before.properties?.runId!==runId)fail('binding');
    if(!strongEtag(before.etag))fail('unsupported',{phase:'write-token',reason:'missing-strong-etag',etagSource:'v2-coherent',jsonEtagState:etagState(before.etag)});
    const url=metadata?`${API_V2}/${before.id}?fields=id,etag,version,properties`:`${UPLOAD_V2}/${before.id}?uploadType=media&fields=id,etag,version`;
    const body=metadata?{properties:privatePropertiesBody({...before.properties,...value,app:APP,runId})}:value;
    await request(url,{method:'PUT',headers:{'Content-Type':'application/json; charset=UTF-8','If-Match':before.etag},body:JSON.stringify(body)});
    return {id:before.id};
  }

  return {create,read,retryCreate,updateIfUnchanged};
}
