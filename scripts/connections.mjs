// Capabilities are delivered only to their actual Foundry User, never returned
// to an unauthenticated caller. Re-delivery must not invalidate in-flight work.
export function deliverConnection(tokens,pending,id,send,create=()=>crypto.randomUUID()+crypto.randomUUID()){
 if(pending.has(id))return pending.get(id);
 const token=tokens.get(id)??create();tokens.set(id,token);
 const task=Promise.resolve().then(()=>send(token)).then(()=>true,()=>false).finally(()=>{if(pending.get(id)===task)pending.delete(id);});
 pending.set(id,task);return task;
}
export const connectionRejected=error=>/(?:^|Error: )(Verbindung noch nicht bereit\. GM kann Verbindungen erneuern\.|Connection is not ready\. The GM can refresh connections\.)(?:\r?\n|$)/.test(error?.message??'');
export async function connectionQuery({ensure,getToken,invalidate,query},data,options){
 await ensure();const token=getToken();
 try{return await query({...data,token},options);}catch(error){
  // This exact rejection happens before game actions run. Do not retry timeouts,
  // save failures or other errors: those could already have committed an action.
  if(!connectionRejected(error))throw error;
  invalidate(token);await ensure();return query({...data,token:getToken()},options);
 }
}
export function animationAudience(state,users,gmId){
 const participants=new Set(state?.players??state?.order??[]),out=new Set(state?.out??[]);
 return users.filter(u=>u.active&&(u.id===gmId||participants.has(u.id)&&!out.has(u.id))).map(u=>u.id);
}
export function releaseDisconnected(gate,users){
 const active=new Set(users.filter(u=>u.active).map(u=>u.id)),current=gate.current;
 if(!current)return false;let changed=false;
 for(const id of [...current.pending])if(!active.has(id)){gate.ack(current.id,id);changed=true;}
 return changed;
}
