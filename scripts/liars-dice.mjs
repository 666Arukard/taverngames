import {FarklePersistentDice} from './farkle-dice.mjs';
import {SchockenAnimationGate} from './schocken-dice.mjs';
import {betaView} from './beta-games-engine.mjs';
import {schockenAppearance} from './schocken-presentation.mjs';
import {diceDiameter,diceViewport,groupedDiceLayout} from './dice-layout.mjs';
export class LiarsAnimationGate extends SchockenAnimationGate{
 constructor(options={}){super(options);this.onClear=options.onClear??(()=>{});}
 open(s,actor,action,users){this.current={id:this.id(),gameId:s.gameId,round:s.round,actor,action,until:this.now()+15000,pending:new Set(users)};return this.project(s);}
 clear(){const had=this.current;super.clear();if(had)this.onClear();}
}
export const liarsLayout=index=>({x:0.10+(Math.floor(index/5)%3)*0.30+(index%5)*0.055,y:0.22+Math.floor(index/15)*0.10});
export function liarsDiceState(s,user){
 if(!s)return null;const view=betaView(s,user),hands=s.reveal?.hands??view.hands,visible=['rolling','bidding','reveal','finished'].includes(s.phase);
 const dice=Array(s.order.length*5).fill(null);if(visible)for(const [id,hand]of Object.entries(hands))for(const [i,n]of hand.entries()){const slot=s.order.indexOf(id);if(slot>=0)dice[slot*5+i]=n;}
 return {game:'liars',gameId:s.gameId,revision:s.revision,round:s.round,sourcePhase:s.phase,phase:visible?'playing':s.phase,turnNumber:`liars:${s.round}`,order:[user.id],turn:0,cup:visible?{dice,held:dice.map(()=>false),selected:[]}:null};
}
export function liarsDiceEvent(s,user,actor,action,animation=null){
 const state=liarsDiceState(s,user),start=s.order.indexOf(actor)*5;
 const indices=action==='roll'&&start>=0?(s.hands[actor]??[]).flatMap((_n,i)=>Number.isInteger(state.cup?.dice[start+i])?[start+i]:[]):[];
 return {actor,dice:indices.map(i=>({sides:6,value:state.cup.dice[i]})),liars:{state,actor,action,indices,animation}};
}
// Private rolls keep captured landing orientations. Public reveals add inert
// pieces directly; they do not call show(), generate a game result or use DSN sockets.
export class LiarsPersistentDice extends FarklePersistentDice{
 constructor(options){super({...options,scope:'liars'});this.enabled=options.enabled??(()=>true);}
 capture(s,indices,id){super.capture(s,indices,id);}
 async _sync(s){
  if(!this.enabled()){await this._clear();this.poses.clear();return;}
  await this._alignTurn(s);await super._sync(s);
  if(s?.phase!=='playing'||!s.cup)return;
  const obsolete=()=>!this.enabled()||this.latest&&(this.latest.gameId!==s.gameId||this.latest.round!==s.round||this.latest.sourcePhase==='aborted');
  for(const [i,value]of s.cup.dice.entries()){if(obsolete())break;if(Number.isInteger(value)&&!this.meshes.has(i)&&!this.poses.has(i))await this.seed(s,i,value);}
  if(obsolete()){await this._clear();this.poses.clear();}else await this.reflow();
 }
 async reflow(){
  if(!this.meshes.size)return;const box=this.game().dice3d?.box,viewport=diceViewport(box),fallback=(box?.dicefactory?.baseScale??box?.throwEngine?.dicefactory?.baseScale??0.025)*2;
  let diameter=fallback;for(const entry of this.meshes.values()){entry.baseScale??=entry.mesh.parent.scale?.clone?.();if(entry.baseScale)entry.mesh.parent.scale.copy(entry.baseScale);diameter=Math.max(diameter,diceDiameter(entry.mesh,fallback));}
  const plan=groupedDiceLayout([...this.meshes.keys()],{...viewport,diameter}),updates=[];
  for(const [index,entry]of this.meshes){const pose=this.poses.get(index),pct=plan.positions.get(index),world=box.fromPositionPct?.(pct)??{x:(pct.x-0.5)*viewport.width,z:-(pct.y-0.5)*viewport.height};
   entry.baseScale??=entry.mesh.parent.scale?.clone?.();if(entry.baseScale)entry.mesh.parent.scale.copy(entry.baseScale).multiplyScalar(plan.scale);entry.layoutScale=plan.scale;
   const position={x:world.x,y:pose.height*plan.scale,z:world.z};entry.mesh.parent.position.x=position.x;entry.mesh.parent.position.y=position.y;entry.mesh.parent.position.z=position.z;pose.position=pct;
   updates.push({id:entry.mesh.id,position});
  }
  await box.physicsWorker.exec('setBodyPositions',{updates});
  for(const entry of this.meshes.values())if(entry.layoutVisible!==undefined){entry.mesh.visible=entry.layoutVisible;delete entry.layoutVisible;}
 }
 async seed(s,index,value){
  const dsn=this.game().dice3d,box=dsn?.box,api=dsn?.persistent;if(typeof api?.spawn!=='function'||typeof api?.remove!=='function'||typeof box?.physicsWorker?.exec!=='function'||typeof box?.throwEngine?.swapDiceFace!=='function')throw Error('Liars reveal requires Dice So Nice 6.4.4');
  const enabled=box.persistentDiceEnabled;let task;try{box.persistentDiceEnabled=true;task=api.spawn('d6',liarsLayout(index),{ownerUserId:s.order[0],guest:{pendingId:'taverngames-liars',reservedForUserId:'taverngames-locked'},appearance:schockenAppearance(false),diceLibrary:[]},false);}finally{box.persistentDiceEnabled=enabled;}
  const mesh=await task;if(!mesh)return;const layoutVisible=mesh.visible!==false;mesh.visible=false;
  try{
   mesh.userData.lockedBy='taverngames-locked';mesh.userData.taverngames=true;
   const height=this.poses.values().next().value?.height??0.02,pos={x:mesh.parent.position.x??0,y:height,z:mesh.parent.position.z??0};
   // Reset native physics to a stationary identity orientation before reading its top face.
   await box.physicsWorker.exec('removeDice',[mesh.id]);await box.physicsWorker.exec('createDice',{id:mesh.id,shape:'d6',material:'plastic',mass:0,startAtIteration:0,options:{persistent:true},vectordata:{type:'d6',pos,axis:{x:0,y:0,z:0,a:0},angle:{x:0,y:0,z:0},velocity:{x:0,y:0,z:0}}});await box.physicsWorker.exec('addDice',mesh.id);await box.physicsWorker.exec('setCollisionResponse',{ids:[mesh.id],enabled:false});
   const old=Number(await box.physicsWorker.exec('getDiceValue',mesh.id));if(!Number.isInteger(old)||old<1||old>6)throw Error('Cannot read stationary d6 face');
   mesh.parent.quaternion.set?.(0,0,0,1);mesh.quaternion.set?.(0,0,0,1);mesh.notation={type:'d6'};mesh.shape='d6';mesh.forcedResult=value;box.throwEngine.swapDiceFace(mesh,old);mesh.result=value;mesh.parent.position.y=height;
   const source={visible:false};this.poses.set(index,{value,quaternion:mesh.quaternion.clone(),parentQuaternion:mesh.parent.quaternion.clone(),height,position:liarsLayout(index),source});this.meshes.set(index,{mesh,api,box,value,source,layoutVisible});
  }catch(e){await api.remove(mesh.userData.persistentId,false);throw e;}
 }
}
