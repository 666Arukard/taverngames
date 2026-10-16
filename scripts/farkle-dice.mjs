import {selectionScore} from './farkle-engine.mjs';
// Farkle-only presentation state. Never changes scores or generates results.
export class FarkleAnimationGate {
 constructor({now=()=>Date.now(),id=()=>crypto.randomUUID()}={}){this.now=now;this.id=id;this.current=null;}
 open(before,after,dice,users){
  const old=before.cup,held=old.held.map((v,i)=>v||old.selected.includes(i));if(held.every(Boolean))held.fill(false);
  const indices=held.flatMap((v,i)=>v?[]:[i]),values=[...(old.dice??Array(6).fill(null))];indices.forEach((i,n)=>values[i]=dice[n].value);
  this.current={id:this.id(),gameId:after.gameId,before:structuredClone(before),preview:{...structuredClone(before),cup:{...structuredClone(old),dice:values,points:old.points+(selectionScore(before)??0),held,fresh:indices,selected:[],rolls:old.rolls+1}},indices,bust:after.turnNumber!==before.turnNumber||after.phase==='finished',until:this.now()+15000,pending:new Set(users)};
  return this.project(after);
 }
 active(state){const c=this.current;if(c&&(c.gameId!==state?.gameId||state?.phase==='aborted'||this.now()>=c.until))this.clear();return this.current;}
 project(state){const c=this.active(state);if(!c)return null;const {pending,...data}=c;return structuredClone(data);}
 ack(id,user){if(this.current?.id===id){this.current.pending.delete(user);if(!this.current.pending.size)this.clear();}}
 clear(){this.current=null;}
}

// Local adapter for DSN 6.4.4 persistent dice. No DSN socket or User flag writes.
export class FarklePersistentDice {
 constructor({game,warn=()=>{},scope='farkle'}){this.scope=scope;this.game=game;this.warn=warn;this.poses=new Map();this.meshes=new Map();this.turn=null;this.warned=false;this.serial=Promise.resolve();}
 enqueue(fn){const result=this.serial.then(fn);this.serial=result.catch(()=>{});return result;}
 spawnOptions(_pose){return {};}
 capture(state,indices,eventId){
  const box=this.game().dice3d?.box,engine=box?.throwEngine;
  const meshes=[...(engine?.diceList??[]),...(engine?.deadDiceList??[])].filter(m=>m.notation?.type==='d6'&&!m.userData?.persistent&&(eventId===undefined||m.options?.taverngamesEvent===eventId));
  const available=[...meshes];
  for(const index of indices){const value=state.cup.dice[index],at=available.findIndex(m=>Number(m.forcedResult)===value);if(at<0)continue;const mesh=available.splice(at,1)[0];this.poses.set(index,{value,quaternion:mesh.quaternion.clone(),parentQuaternion:mesh.parent.quaternion.clone(),height:mesh.parent.position.y,position:box.toPositionPct?.(mesh.parent.position.x,mesh.parent.position.z),source:mesh});}
 }
 sync(state){return this.enqueue(()=>this._sync(state));}
 beginRoll(state,indices){return this.enqueue(async()=>{await this._alignTurn(state);for(const index of indices){const entry=this.meshes.get(index);if(entry){await this._remove(entry);this.meshes.delete(index);}this.poses.delete(index);}});}
 async _alignTurn(state){
  const turn=state?.phase==='playing'?`${state.gameId}:${state.turnNumber}`:null;
  if(turn!==this.turn){await this._clear();this.poses.clear();this.turn=turn;}
 }
 async _sync(state){
  await this._alignTurn(state);
  const desired=state?.phase==='playing'&&state.cup?.dice?new Set(state.cup.dice.flatMap((v,i)=>this.poses.get(i)?.value===v?[i]:[])):new Set();
  const dsn=this.game().dice3d,box=dsn?.box;
  for(const [index,entry]of this.meshes)if(!desired.has(index)||entry.value!==state.cup.dice[index]){await this._remove(entry);this.meshes.delete(index);}
  if(!desired.size)return;
  if(typeof dsn?.persistent?.spawn!=='function'||typeof dsn?.persistent?.remove!=='function'||typeof box?.physicsWorker?.exec!=='function'){if(!this.warned){this.warned=true;this.warn();}return;}
  for(const index of desired){const existing=this.meshes.get(index);if(existing&&Array.isArray(box?.persistentDiceList)&&!box.persistentDiceList.includes(existing.mesh))this.meshes.delete(index);if(this.meshes.has(index))continue;const pose=this.poses.get(index);if(!pose||pose.value!==state.cup.dice[index])continue;
   const enabled=box.persistentDiceEnabled;let task;try{box.persistentDiceEnabled=true;task=dsn.persistent.spawn('d6',pose.position??{x:0.18+index*0.11,y:this.scope==='kniffel'?0.70:this.scope==='ship'?0.58:0.82},{ownerUserId:state.order[state.turn],guest:{pendingId:'taverngames-'+this.scope,reservedForUserId:'taverngames-locked'},...this.spawnOptions(pose)},false);}finally{box.persistentDiceEnabled=enabled;}
   const mesh=await task;
   if(!mesh)continue;
   // These are inert display pieces. Native grab checks lockedBy even for the GM.
   mesh.userData.lockedBy='taverngames-locked';mesh.userData.taverngames=true;
   this.meshes.set(index,{mesh,api:dsn.persistent,box,value:pose.value,source:pose.source});
   // Replace only this new body's dynamics with a zero-mass, non-colliding body.
   // Keep a body registered so native DSN clear/remove remains safe.
   const q=pose.parentQuaternion,w=Math.max(-1,Math.min(1,q.w??1)),sin=Math.sqrt(1-w*w),axis=sin<0.00001?{x:0,y:0,z:0,a:0}:{x:q.x/sin,y:q.y/sin,z:q.z/sin,a:Math.acos(w)/Math.PI};
   const position={x:mesh.parent.position.x??0,y:pose.height,z:mesh.parent.position.z??0};
   await box.physicsWorker.exec('removeDice',[mesh.id]);
   await box.physicsWorker.exec('createDice',{id:mesh.id,shape:mesh.shape??'d6',material:'plastic',mass:0,startAtIteration:0,options:{persistent:true},vectordata:{type:'d6',pos:position,axis,angle:{x:0,y:0,z:0},velocity:{x:0,y:0,z:0}}});
   await box.physicsWorker.exec('addDice',mesh.id);
   await box.physicsWorker.exec('setCollisionResponse',{ids:[mesh.id],enabled:false});
   mesh.quaternion.copy(pose.quaternion);mesh.parent.quaternion.copy(pose.parentQuaternion);mesh.parent.position.y=pose.height;mesh.result=pose.value;mesh.forcedResult=pose.value;pose.source.visible=false;
  }
 }
 async _remove(entry){const {box,api,mesh}=entry;if(typeof box?.persistentDiceManager?.removePersistentDie==='function'){await box.persistentDiceManager.removePersistentDie(mesh.userData.persistentId);if(!box.persistentDiceList.length&&!box.rolling)api.canvasVisibility?.hide();}else await api.remove(mesh.userData.persistentId,false);entry.source.visible=false;}
 async _clear(){for(const entry of this.meshes.values()){try{await this._remove(entry);}catch{}entry.source.visible=false;}for(const pose of this.poses.values())pose.source.visible=false;this.meshes.clear();}
 clear(){return this.enqueue(async()=>{await this._clear();this.poses.clear();this.turn=null;});}
}
