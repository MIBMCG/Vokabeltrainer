const copy=value=>structuredClone(value);
const APP='vokabeltrainer-shop-probe';

function parseMultipart(body){
  const chunks=body.split('\r\n\r\n');
  return {metadata:JSON.parse(chunks[1].split('\r\n')[0]),value:JSON.parse(chunks[2].split('\r\n')[0])};
}

function privateProperties(properties){
  return Object.entries(properties).sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>({key,value,visibility:'PRIVATE'}));
}

export function v2CoherentDriveFixture({
  ignoreMediaCondition=false,
  ignoreMetadataCondition=false,
  mutateBefore412=false,
  mutateDuringRead=false,
  metadataOverride=null,
}={}){
  let serial=0;
  const files=new Map(),calls=[],metadataReads=new Map();
  const response=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
  const currentEtag=record=>record.etagOverride??`"v2-version-${record.etagVersion}"`;
  const mutation=typeof mutateDuringRead==='string'?{field:mutateDuringRead,after:0}:mutateDuringRead;

  async function fetch(url,init={}){
    const parsed=new URL(url),method=init.method??'GET';
    const headers={...init.headers};
    calls.push({url:parsed.href,method,headers,body:init.body});
    if(parsed.pathname.endsWith('/drive/v3/files/generateIds'))return response({ids:[`test-${++serial}`]});

    if(method==='POST'&&parsed.pathname.includes('/drive/v3/files')){
      let metadata,value={};
      if(parsed.pathname.includes('/upload/'))({metadata,value}=parseMultipart(init.body));
      else metadata=JSON.parse(init.body);
      if(files.has(metadata.id))return response({},409);
      files.set(metadata.id,{
        id:metadata.id,
        title:metadata.name,
        mimeType:metadata.mimeType,
        parentId:metadata.parents?.[0]??'synthetic-my-drive-root',
        properties:{...metadata.appProperties},
        value:copy(value),
        version:1,
        etagVersion:1,
      });
      return response({id:metadata.id});
    }

    const id=parsed.pathname.split('/').at(-1),record=files.get(id);
    if(!record)return response({},404);

    if(method==='GET'&&parsed.pathname.includes('/drive/v2/files/')){
      if(parsed.searchParams.get('alt')==='media')return response(record.value);
      const count=(metadataReads.get(id)??0)+1;
      metadataReads.set(id,count);
      let metadata={
        id,
        title:record.title,
        mimeType:record.mimeType,
        parents:record.parentId?[{id:record.parentId}]:[],
        properties:privateProperties(record.properties),
        labels:{trashed:false},
        version:String(record.version),
        etag:currentEtag(record),
      };
      if(typeof metadataOverride==='function')metadata=metadataOverride(copy(metadata),{id,count,record})??metadata;
      else if(metadataOverride)metadata={...metadata,...copy(metadataOverride)};
      if(mutation&&(!mutation.filesOnly||record.mimeType==='application/json')&&count===Number(mutation.after??0)+1){
        if(mutation.field==='version')record.version++;
        if(mutation.field==='etag')record.etagVersion++;
      }
      return response(metadata);
    }

    if(method==='PUT'&&parsed.pathname.includes('/drive/v2/files/')){
      const media=parsed.pathname.includes('/upload/'),ignored=media?ignoreMediaCondition:ignoreMetadataCondition;
      if(!ignored&&headers['If-Match']!==currentEtag(record)){
        if(mutateBefore412&&media)record.value=copy(JSON.parse(init.body));
        return response({},412);
      }
      if(media)record.value=copy(JSON.parse(init.body));
      else{
        const body=JSON.parse(init.body);
        record.properties=Object.fromEntries((body.properties??[]).map(property=>[property.key,property.value]));
      }
      record.version++;
      record.etagVersion++;
      return response({id,version:String(record.version),etag:currentEtag(record)});
    }

    return response({},405);
  }

  return {fetch,calls,files,APP};
}
