const MAX_BYTES=64*1024;

class ImmutableValueError extends Error{
  constructor(code){super(`Immutable value: ${code}`);this.code=code;}
}

const fail=code=>{throw new ImmutableValueError(code);};

function encode(value,seen){
  if(value===null)return 'null';
  if(typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
  if(typeof value==='number'){
    if(!Number.isFinite(value))fail('invalid');
    return JSON.stringify(value);
  }
  if(typeof value!=='object')fail('invalid');
  if(seen.has(value))fail('invalid');
  seen.add(value);
  try{
    if(Array.isArray(value)){
      if(Object.getPrototypeOf(value)!==Array.prototype||Object.getOwnPropertySymbols(value).length
        ||Object.keys(value).length!==value.length||Object.getOwnPropertyNames(value).length!==value.length+1)fail('invalid');
      for(let index=0;index<value.length;index++){
        const descriptor=Object.getOwnPropertyDescriptor(value,String(index));
        if(!descriptor?.enumerable||!Object.hasOwn(descriptor,'value'))fail('invalid');
      }
      return `[${value.map(item=>encode(item,seen)).join(',')}]`;
    }
    const prototype=Object.getPrototypeOf(value);
    if(prototype!==Object.prototype&&prototype!==null)fail('invalid');
    if(Object.getOwnPropertySymbols(value).length)fail('invalid');
    const names=Object.getOwnPropertyNames(value),keys=Object.keys(value);
    if(names.length!==keys.length)fail('invalid');
    for(const key of keys){
      const descriptor=Object.getOwnPropertyDescriptor(value,key);
      if(!descriptor?.enumerable||!Object.hasOwn(descriptor,'value'))fail('invalid');
    }
    return `{${keys.sort().map(key=>`${JSON.stringify(key)}:${encode(value[key],seen)}`).join(',')}}`;
  }finally{seen.delete(value);}
}

export function canonicalJson(value){
  const result=encode(value,new Set());
  if(new TextEncoder().encode(result).byteLength>MAX_BYTES)fail('limit');
  return result;
}

export async function immutableHash(value){
  const bytes=new TextEncoder().encode(canonicalJson(value));
  const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}
