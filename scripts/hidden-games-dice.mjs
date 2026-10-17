import {SchockenAnimationGate} from './schocken-dice.mjs';
import {SchockenPersistentDice,hiddenDiceAppearance} from './schocken-presentation.mjs';
import {choView} from './chohan.mjs';
import {tavernView} from './tavern-engine.mjs';
export const HIDDEN_GAMES=['lottery','chohan'];
export const hiddenView=(s,user)=>s?.game==='chohan'?choView(s,user):tavernView(s,user);
export class HiddenGameGate extends SchockenAnimationGate{
 constructor(options={}){super(options);this.onClear=options.onClear??(()=>{});this.before=null;}
 open(before,after,users){this.before=structuredClone(before);return super.open(after,users);}
 clear(){const had=this.current;super.clear();this.before=null;if(had)this.onClear();}
}
export function hiddenDiceState(s,user){
 if(!s)return null;const lottery=s.game==='lottery',eligible=!lottery||user.isGM||s.tickets.some(t=>t.id===user.id||user.isGM&&!!s.npcs[t.id]);
 const visible=s.phase==='finished'||s.phase==='hidden'&&s.gmPeek===true&&user.isGM===true;
 const active=!s.presentationClosed&&['hidden','finished'].includes(s.phase);
 return {game:s.game,gameId:s.gameId,revision:s.revision,sourcePhase:s.phase,phase:active?'playing':s.phase,order:[user.id],turn:0,turnNumber:`${s.game}:${s.gameId}`,
 cup:active&&eligible?{dice:lottery?visible?[Math.floor(s.result/10)%10,s.result%10]:[null,null]:visible?[...s.dice]:[null,null],types:lottery?['d100','d10']:['d6','d6'],held:[false,false],selected:[]}:null};
}
// These are local display placeholders, never another game result.
export function hiddenRoll(event){const s=event.hidden.state;return {...event,dice:s.cup?s.game==='lottery'?[s.cup.dice[0]===null?{sides:100,value:1,blank:true}:{sides:100,value:(s.cup.dice[0]*10+s.cup.dice[1])||100}]:s.cup.dice.map(v=>({sides:6,value:v??1,...(v===null?{blank:true}:{})})):[]};}
export class HiddenPersistentDice extends SchockenPersistentDice{
 constructor(options){super(options);this.scope=options.scope;}
 dieType(state,index=0){return state?.cup?.types?.[index]??'d6';}
 // Visible dice use the normal local DSN appearance, just like their roll.
 // Only unknown results require the separate blank preset and suppressed library faces.
 spawnOptions(pose){return pose.value===null?{appearance:hiddenDiceAppearance(this.game(),pose.type??'d6'),diceLibrary:[]}:{};}
 async _sync(state){
  await super._sync(state);
  // Removing the previous pair can schedule DSN's canvas fade while its
  // replacement is being created. Cancel that fade once replacement is ready.
  if([...this.meshes.values()].some(e=>e.mesh.visible!==false&&e.mesh.parent?.visible!==false))this.game().dice3d?.persistent?.canvasVisibility?.show?.();
 }
 retarget(state){if(this.scope!=='lottery')return super.retarget(state);return this.enqueue(async()=>{
  await this._alignTurn(state);
  for(const [i,p]of this.poses){const value=state?.cup?.dice[i];if(value===undefined||value===p.value)continue;
   if(Number.isInteger(value)&&value!==p.faceValue){const engine=this.game().dice3d?.box?.throwEngine;if(typeof engine?.swapDiceFace!=='function')throw Error('Percentile reveal requires Dice So Nice 6.4.4');
    // Both percentile components use d10 geometry. Rotation tables call the zero face 10.
    const target={notation:{type:'d10'},shape:'d10',forcedResult:value||10,quaternion:p.quaternion.clone(),applyQuaternion(q){this.quaternion.premultiply(q);return this;}};
    engine.swapDiceFace(target,p.faceValue||10);p.quaternion=target.quaternion;p.faceValue=value;
   }p.value=value;p.neutral=true;
  }await this._sync(state);
 });}
 capture(state,indices,eventId){
  const box=this.game().dice3d?.box,engine=box?.throwEngine;
  const available=[...(engine?.diceList??[]),...(engine?.deadDiceList??[])].filter(m=>!m.userData?.persistent&&m.options?.taverngamesEvent===eventId);
  for(const i of indices){const value=state.cup.dice[i],type=this.dieType(state,i),face=value??(type==='d100'?0:1),at=available.findIndex(m=>(m.options?.taverngamesDieType??m.notation?.type)===type&&Number(m.forcedResult)===face);if(at<0)continue;const mesh=available.splice(at,1)[0];this.poses.set(i,{type,value,faceValue:face,neutral:true,quaternion:mesh.quaternion.clone(),parentQuaternion:mesh.parent.quaternion.clone(),height:mesh.parent.position.y,position:box.toPositionPct?.(mesh.parent.position.x,mesh.parent.position.z),source:mesh});}
 }
}
