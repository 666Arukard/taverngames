import {SchockenPersistentDice,registerSchockenBlank,blankDiceType,hiddenDiceAppearance} from './schocken-presentation.mjs';
import {participantOptions,diceOwner} from './participant-appearance.mjs';
import {diceDiameter,diceViewport,groupedDiceLayout} from './dice-layout.mjs';
// A local renderer per participant. No new rolls, sockets, flags or game-state writes.
class ParticipantRenderer extends SchockenPersistentDice{
 constructor(options){super(options);this.scope=options.scope;this.owner=options.owner;}
 dieType(s,i){return s?.cup?.types?.[i]??(s?.cup?.sides?'d'+s.cup.sides:'d6');}
 capture(s,indices,eventId){const engine=this.game().dice3d?.box?.throwEngine,available=[...(engine?.diceList??[]),...(engine?.deadDiceList??[])].filter(m=>!m.userData?.persistent&&m.options?.taverngamesEvent===eventId);for(const i of indices){const value=s.cup.dice[i],type=this.dieType(s,i),face=value??(type==='d100'?0:1),at=available.findIndex(m=>(m.options?.taverngamesDieType??m.notation?.type)===type&&Number(m.forcedResult)===face);if(at<0)continue;const mesh=available.splice(at,1)[0];this.poses.set(i,{value,faceValue:face,quaternion:mesh.quaternion.clone(),parentQuaternion:mesh.parent.quaternion.clone(),height:mesh.parent.position.y,position:this.game().dice3d.box.toPositionPct?.(mesh.parent.position.x,mesh.parent.position.z),source:mesh});}}
 retarget(s){return this.enqueue(async()=>{await this._alignTurn(s);if(s?.cup?.dice?.includes(null))registerSchockenBlank(this.game().dice3d);for(const [i,p]of this.poses){const value=s.cup?.dice[i];if(value===undefined||value===p.value)continue;if(Number.isInteger(value)&&value!==p.faceValue){const type=this.dieType(s,i),ten=['d10','d100'].includes(type),target={notation:{type:type==='d100'?'d10':type},shape:type==='d100'?'d10':type,forcedResult:ten?(value||10):value,quaternion:p.quaternion.clone(),applyQuaternion(q){this.quaternion.premultiply(q);return this;}};this.game().dice3d.box.throwEngine.swapDiceFace(target,ten?(p.faceValue||10):p.faceValue);p.quaternion=target.quaternion;p.faceValue=value;}p.value=value;}await this._sync(s);});}
 spawnOptions(pose,s,i){const type=this.dieType(s,i);return pose.value===null?{appearance:hiddenDiceAppearance(this.game(),type,diceOwner(this.game(),this.owner)),diceLibrary:[]}:participantOptions(this.game(),this.owner,type);}
 async seed(s,index){
  const game=this.game(),dsn=game.dice3d,box=dsn?.box,api=dsn?.persistent,type=this.dieType(s,index),value=s.cup.dice[index];if(typeof api?.spawn!=='function'||typeof box?.throwEngine?.swapDiceFace!=='function')return;
  if(value===null&&!registerSchockenBlank(dsn))return;const native=value===null?blankDiceType(type):type,enabled=box.persistentDiceEnabled;let task;
  try{box.persistentDiceEnabled=true;task=api.spawn(native,{x:.15+index*.08,y:.8},{ownerUserId:game.users?.get?.(this.owner)?.id??game.user.id,guest:{pendingId:'taverngames-'+this.scope,reservedForUserId:'taverngames-locked'},...this.spawnOptions({value},s,index)},false);}finally{box.persistentDiceEnabled=enabled;}
  const mesh=await task;if(!mesh)return;mesh.visible=false;
  try{
   const height=.02,pos={x:mesh.parent.position.x??0,y:height,z:mesh.parent.position.z??0};await box.physicsWorker.exec('removeDice',[mesh.id]);await box.physicsWorker.exec('createDice',{id:mesh.id,shape:type,material:'plastic',mass:0,startAtIteration:0,options:{persistent:true},vectordata:{type,pos,axis:{x:0,y:0,z:0,a:0},angle:{x:0,y:0,z:0},velocity:{x:0,y:0,z:0}}});await box.physicsWorker.exec('addDice',mesh.id);await box.physicsWorker.exec('setCollisionResponse',{ids:[mesh.id],enabled:false});
   const old=Number(await box.physicsWorker.exec('getDiceValue',mesh.id)),face=value??(Number.isFinite(old)?old:1),ten=['d10','d100'].includes(type);if(value!==null&&Number.isFinite(old)){mesh.parent.quaternion.set?.(0,0,0,1);mesh.quaternion.set?.(0,0,0,1);mesh.notation={type:type==='d100'?'d10':type};mesh.shape=type==='d100'?'d10':type;mesh.forcedResult=ten?(face||10):face;box.throwEngine.swapDiceFace(mesh,ten?(old||10):old);}mesh.userData.lockedBy='taverngames-locked';mesh.userData.taverngames=true;mesh.userData.taverngamesParticipant=this.owner;mesh.parent.position.y=height;mesh.result=value;mesh.forcedResult=value;
   const source={visible:false};this.poses.set(index,{value,faceValue:face,quaternion:mesh.quaternion.clone(),parentQuaternion:mesh.parent.quaternion.clone(),height,source});this.meshes.set(index,{mesh,api,box,value,source});mesh.visible=true;
  }catch(e){await api.remove(mesh.userData.persistentId,false);throw e;}
 }
}
export class ParticipantDice{
 constructor({game,scope}){this.game=game;this.scope=scope;this.renderers=new Map();this.gameId=null;this.serial=Promise.resolve();}
 get meshes(){return new Map([...this.renderers].flatMap(([id,r])=>[...r.meshes].map(([i,m])=>[id+':'+i,m])));}
 get poses(){return new Map([...this.renderers].flatMap(([id,r])=>[...r.poses].map(([i,m])=>[id+':'+i,m])));}
 get owner(){return this.latest?.participant??this.latest?.cup?.actor??this.latest?.order?.[this.latest?.turn];}
 renderer(s){const id=s.participant??s.cup?.actor??s.order?.[s.turn];if(!id)return null;if(!this.renderers.has(id))this.renderers.set(id,new ParticipantRenderer({game:this.game,scope:this.scope,owner:id}));return this.renderers.get(id);}
 enqueue(fn){const p=this.serial.then(fn);this.serial=p.catch(()=>{});return p;}
 async align(s){const boundary=s?`${s.gameId}:${['liars','schocken','aalstechen'].includes(this.scope)?`${s.half??''}:${s.round??''}`:''}`:null;if(!s||s.phase!=='playing'||this.boundary&&this.boundary!==boundary||this.scope==='meiern'&&this.latest&&this.owner!==(s?.participant??s?.cup?.actor??s?.order?.[s?.turn])){await this._clear();}if(s){this.gameId=s.gameId;this.boundary=boundary;}}
 discardUnheld(s){return this.enqueue(async()=>{const r=this.renderer(s);if(!r)return;for(const [i,p]of r.poses)if(!s.cup?.held?.[i]){const e=r.meshes.get(i);if(e)await r._remove(e);p.source.visible=false;r.meshes.delete(i);r.poses.delete(i);}await this.reflow();});}
 capture(s,indices,eventId){this.latest=s;if(s.game==='liars'&&s.groups){for(const group of s.groups){const slot=s.ownerOrder.indexOf(group.participant),local=indices.filter(i=>Math.floor(i/5)===slot).map(i=>i%5);if(local.length)this.renderer(group)?.capture(group,local,eventId);}return;}const r=this.renderer(s);r?.capture(s,indices,eventId);for(const e of r?.meshes.values()??[])e.mesh.userData.taverngamesParticipant=r.owner;}
 beginRoll(s,indices){return this.enqueue(async()=>{await this.align(s);this.latest=s;if(s.game==='liars'&&s.groups){for(const group of s.groups){const slot=s.ownerOrder.indexOf(group.participant),local=indices.filter(i=>Math.floor(i/5)===slot).map(i=>i%5);if(local.length)await this.renderer(group)?.beginRoll(group,local);}return;}const r=this.renderer(s);await r?.beginRoll(s,indices);});}
 sync(s){return this.enqueue(()=>this._sync(s));}
 retarget(s){return this.sync(s);}
 async _sync(s){await this.align(s);this.latest=s;if(!s||s.phase!=='playing')return;const groups=s.groups??(s.cup?.dice?[s]:[]);for(const group of groups){if(!group.cup?.dice)continue;const r=this.renderer(group);await r.retarget(group);for(let i=0;i<group.cup.dice.length;i++)if(!r.poses.has(i))await r.seed(group,i);for(const e of r.meshes.values())e.mesh.userData.taverngamesParticipant=r.owner;}await this.reflow();if(this.meshes.size)this.game().dice3d?.persistent?.canvasVisibility?.show?.();}
 async reflow(){
  const entries=[...this.renderers.entries()],box=this.game().dice3d?.box,viewport=diceViewport(box),items=[];let diameter=.04;
  // Each group uses a separate band of slots; 64 also accommodates accumulated 17+4 hands.
  for(const [slot,[,r]]of entries.entries())for(const [i,e]of r.meshes){e.baseScale??=e.mesh.parent.scale?.clone?.();if(e.baseScale)e.mesh.parent.scale.copy(e.baseScale);diameter=Math.max(diameter,diceDiameter(e.mesh,.04));items.push({slot,index:i,entry:e,pose:r.poses.get(i)});}
  const indices=items.map((x,i)=>x.slot*64+x.index),plan=groupedDiceLayout(indices,{...viewport,diameter,groupSize:64}),updates=[];
  for(const [n,x]of items.entries()){const e=x.entry,pct=plan.positions.get(indices[n]),world=box.fromPositionPct?.(pct)??{x:(pct.x-.5)*viewport.width,z:-(pct.y-.5)*viewport.height};if(e.baseScale)e.mesh.parent.scale.copy(e.baseScale).multiplyScalar(plan.scale);const position={x:world.x,y:(x.pose?.height??.02)*plan.scale,z:world.z};Object.assign(e.mesh.parent.position,position);if(x.pose)x.pose.position=pct;updates.push({id:e.mesh.id,position});}
  if(updates.length)await box.physicsWorker.exec('setBodyPositions',{updates});
 }
 async _clear(){for(const r of this.renderers.values())await r.clear();this.renderers.clear();this.gameId=null;this.boundary=null;}
 clear(){return this.enqueue(()=>this._clear());}
}

// Hide only completed animation meshes for this module event. Persistent displays
// and unrelated chat/module throws are deliberately excluded.
export function hideThrownEvent(game,id){if(!id)return;const e=game.dice3d?.box?.throwEngine;for(const mesh of [...(e?.diceList??[]),...(e?.deadDiceList??[])])if(!mesh.userData?.persistent&&mesh.options?.taverngamesEvent===id)mesh.visible=false;}
