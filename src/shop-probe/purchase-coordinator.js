import {canonicalJson} from './immutable-value.js';

const FOLDER_MIME='application/vnd.google-apps.folder';
const PROTOCOL='1';
const HASH=/^[0-9a-f]{64}$/;
const IDENTIFIER=/^[\x21-\x7E]{1,128}$/;
const HEAD_KEYS=['purchaseProtocol','purchaseHeadId','purchaseHeadHash'];
const tickets=new WeakMap();

class PurchaseError extends Error{
  constructor(code,status=null){super(`Purchase probe: ${code}`);this.code=code;if(status!==null)this.status=status;}
}

const fail=(code,status=null)=>{throw new PurchaseError(code,status);};
const clone=value=>structuredClone(value);
const exactKeys=(value,keys)=>{
  if(!value||typeof value!=='object'||Array.isArray(value)||(Object.getPrototypeOf(value)!==Object.prototype&&Object.getPrototypeOf(value)!==null)
    ||Object.getOwnPropertySymbols(value).length!==0||Object.keys(value).sort().join('\0')!==[...keys].sort().join('\0'))return false;
  return Object.keys(value).every(key=>{
    const descriptor=Object.getOwnPropertyDescriptor(value,key);
    return descriptor?.enumerable&&Object.hasOwn(descriptor,'value');
  });
};
const identifier=value=>typeof value==='string'&&IDENTIFIER.test(value)&&!value.includes('/')&&!value.includes('\\');
const same=(left,right)=>canonicalJson(left)===canonicalJson(right);

function validateRef(ref){
  if(!exactKeys(ref,['id','sha256'])||!identifier(ref.id)||!HASH.test(ref.sha256))fail('invalid');
  return clone(ref);
}

function validateOperation(value){
  try{canonicalJson(value);}catch(error){fail(error?.code==='limit'?'limit':'invalid');}
  if(!value||typeof value!=='object'||Array.isArray(value)||!identifier(value.id)||!identifier(value.epoch))fail('invalid');
  if(value.kind==='init'){
    if(!exactKeys(value,['kind','id','epoch','earned'])||value.earned!==1000)fail('invalid');
  }else if(value.kind==='purchase'){
    if(!exactKeys(value,['kind','id','epoch','article','price'])||!identifier(value.article)
      ||!Number.isSafeInteger(value.price)||value.price<=0||value.price>1000)fail('invalid');
  }else if(value.kind==='reset'){
    if(!exactKeys(value,['kind','id','epoch','nextEpoch','earned'])||!identifier(value.nextEpoch)
      ||value.nextEpoch===value.epoch||value.earned!==1000)fail('invalid');
  }else fail('invalid');
  return clone(value);
}

function validateNode(value,anchorId){
  try{canonicalJson(value);}catch(error){fail(error?.code==='limit'?'limit':'invalid');}
  if(!exactKeys(value,['format','anchorId','sequence','previous','operation'])||value.format!==1||value.anchorId!==anchorId
    ||!Number.isSafeInteger(value.sequence)||value.sequence<0)fail('invalid');
  if(value.previous!==null)validateRef(value.previous);
  validateOperation(value.operation);
  return clone(value);
}

function transition(state,operation,usedEpochs,readMode=false){
  const semantic=code=>fail(readMode?'invalid':code);
  if(operation.kind==='init'){
    if(state!==null)semantic('invalid');
    usedEpochs.add(operation.epoch);
    return {epoch:operation.epoch,earned:1000,spent:0,owned:[],receipts:[clone(operation)]};
  }
  if(state===null)semantic('invalid');
  if(operation.epoch!==state.epoch)semantic('epoch');
  if(operation.kind==='purchase'){
    if(state.owned.includes(operation.article))semantic('owned');
    if(state.earned-state.spent<operation.price)semantic('funds');
    return {...state,spent:state.spent+operation.price,owned:[...state.owned,operation.article],receipts:[...state.receipts,clone(operation)]};
  }
  if(usedEpochs.has(operation.nextEpoch))semantic('epoch');
  usedEpochs.add(operation.nextEpoch);
  return {epoch:operation.nextEpoch,earned:1000,spent:0,owned:[],receipts:[...state.receipts,clone(operation)]};
}

function replay(nodes){
  let state=null;const ids=new Set(),usedEpochs=new Set();
  for(let index=0;index<nodes.length;index++){
    const node=nodes[index],operation=node.operation;
    if(node.sequence!==index||ids.has(operation.id)||(index===0)!==(operation.kind==='init'))fail('invalid');
    ids.add(operation.id);
    state=transition(state,operation,usedEpochs,true);
  }
  return state;
}

function active(operation,state){
  if(!state)return false;
  if(operation.kind==='reset')return operation.nextEpoch===state.epoch;
  return operation.epoch===state.epoch;
}

function commitFailure(error,phase){
  const allowed=new Set(['auth','binding','collision','http','integrity','invalid','limit','missing','network','permission','stale','unsupported']);
  const code=allowed.has(error?.code)?error.code:'unexpected';
  const status=Number.isInteger(error?.status)&&error.status>=100&&error.status<=599?error.status:null;
  const uncertain=code==='network'||(code==='http'&&status!==null&&status>=500)||(status!==null&&status>=200&&status<=299);
  return {outcome:uncertain?'uncertain':code==='stale'?'stale':'rejected',phase,code,...(status===null?{}:{httpStatus:status})};
}

function validateSnapshot(snapshot,anchorId){
  if(!snapshot||snapshot.id!==anchorId||snapshot.folder!==true||snapshot.mimeType!==FOLDER_MIME
    ||typeof snapshot.version!=='string'||typeof snapshot.etag!=='string'||!snapshot.properties
    ||typeof snapshot.properties!=='object'||Array.isArray(snapshot.properties))fail('binding');
}

export function createPurchaseCoordinator({transport,anchorId,contentParentId=anchorId}={}){
  if(!transport||!identifier(anchorId)||!identifier(contentParentId))fail('binding');
  const ownTickets=new WeakMap();

  async function read(){
    const before=await transport.readMetadataSnapshot(anchorId);validateSnapshot(before,anchorId);
    const presence=HEAD_KEYS.map(key=>Object.hasOwn(before.properties,key));
    if(presence.some(Boolean)&&!presence.every(Boolean))fail('invalid');
    let head=null,state=null;
    if(presence.every(Boolean)){
      if(before.properties.purchaseProtocol!==PROTOCOL)fail('invalid');
      head=validateRef({id:before.properties.purchaseHeadId,sha256:before.properties.purchaseHeadHash});
      const reverse=[],seen=new Set();let cursor=head;
      while(cursor){
        if(reverse.length>=64)fail('limit');
        const identity=`${cursor.id}:${cursor.sha256}`;
        if(seen.has(identity))fail('invalid');
        seen.add(identity);
        const node=validateNode(await transport.readImmutable(cursor,{parentId:contentParentId}),anchorId);
        reverse.push(node);cursor=node.previous;
      }
      state=replay(reverse.reverse());
    }
    const after=await transport.readMetadataSnapshot(anchorId);validateSnapshot(after,anchorId);
    if(before.version!==after.version||before.etag!==after.etag||!same(before.properties,after.properties))fail('stale');
    return {snapshot:clone(after),head:head&&clone(head),state:state&&clone(state)};
  }

  async function prepare(input){
    const operation=validateOperation(input),current=await read();
    const existing=current.state?.receipts.find(receipt=>receipt.id===operation.id);
    if(existing){
      if(!same(existing,operation))fail('conflict');
      return {outcome:'committed',active:active(existing,current.state)};
    }
    const usedEpochs=new Set();
    for(const receipt of current.state?.receipts??[]){
      if(receipt.kind==='init')usedEpochs.add(receipt.epoch);
      if(receipt.kind==='reset')usedEpochs.add(receipt.nextEpoch);
    }
    transition(current.state,operation,usedEpochs);
    const sequence=current.state?.receipts.length??0;
    if(sequence>=64)fail('limit');
    const node={format:1,anchorId,sequence,previous:current.head&&clone(current.head),operation};
    const ref=await transport.prepareImmutable({parentId:contentParentId,value:node});
    validateRef(ref);
    const ticket=Object.freeze({});
    const record={snapshot:current.snapshot,ref,node};
    ownTickets.set(ticket,record);tickets.set(ticket,record);
    return {outcome:'prepared',ticket};
  }

  async function commit(ticket){
    const record=ownTickets.get(ticket);
    if(!record||tickets.get(ticket)!==record)fail('binding');
    ownTickets.delete(ticket);tickets.delete(ticket);
    try{await transport.writeImmutable(record.ref);}catch(error){return commitFailure(error,'upload');}
    try{
      const result=await transport.updateMetadataIfUnchanged(record.snapshot,{
        purchaseProtocol:PROTOCOL,purchaseHeadId:record.ref.id,purchaseHeadHash:record.ref.sha256,
      });
      if(!Number.isInteger(result?.status)||result.status<200||result.status>299)return {outcome:'uncertain',phase:'pointer',code:'invalid'};
      return {outcome:'confirmed',phase:'pointer',httpStatus:result.status};
    }catch(error){return commitFailure(error,'pointer');}
  }

  async function recover(input){
    const operation=validateOperation(input),current=await read();
    const receipt=current.state?.receipts.find(item=>item.id===operation.id);
    if(!receipt)return {outcome:'absent',active:false,state:current.state&&clone(current.state)};
    if(!same(receipt,operation))fail('conflict');
    return {outcome:'committed',active:active(receipt,current.state),state:clone(current.state)};
  }

  return {read,prepare,commit,recover};
}
