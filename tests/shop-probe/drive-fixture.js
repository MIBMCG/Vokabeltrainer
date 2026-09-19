export function driveFixture({ignore=false,metadataIgnore=false,noEtag=false,mutateBefore412=false}={}) {
  let serial=0;const files=new Map(),calls=[];
  const response=(value,status=200,etag=null)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json',...(!noEtag&&etag?{ETag:etag}:{})}});
  async function fetch(url,init={}) {
    const u=new URL(url),method=init.method??'GET';calls.push({url:u.href,method,headers:init.headers,body:init.body});
    if(u.pathname.endsWith('/generateIds'))return response({ids:[`test-${++serial}`]});
    if(method==='POST'){
      let meta,value={};
      if(init.headers['Content-Type'].startsWith('multipart')){
        const chunks=init.body.split('\r\n\r\n');meta=JSON.parse(chunks[1].split('\r\n')[0]);value=JSON.parse(chunks[2].split('\r\n')[0]);
      }else meta=JSON.parse(init.body);
      if(files.has(meta.id))return response({},409);
      files.set(meta.id,{meta:{...meta,trashed:false,version:'1',parents:meta.parents??[]},value});return response({id:meta.id});
    }
    const id=u.pathname.split('/').at(-1),record=files.get(id);if(!record)return response({},404);
    const etag=`"version-${record.meta.version}"`;
    if(method==='PATCH'){
      const media=u.pathname.includes('/upload/');
      if(!(media?ignore:metadataIgnore)&&init.headers['If-Match']!==etag){if(mutateBefore412&&media)record.value=JSON.parse(init.body);return response({},412);}
      if(media)record.value=JSON.parse(init.body);else record.meta.appProperties={...record.meta.appProperties,...JSON.parse(init.body).appProperties};
      record.meta.version=String(Number(record.meta.version)+1);return response({id,version:record.meta.version});
    }
    return response(u.searchParams.get('alt')==='media'?record.value:record.meta,200,etag);
  }
  return {fetch,calls,files};
}
