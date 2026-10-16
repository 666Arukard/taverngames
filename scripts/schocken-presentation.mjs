import {FarklePersistentDice} from './farkle-dice.mjs';
const SYSTEM='taverngames-hidden';
const registered=new WeakSet();
// Independent of any secret value or player dice library. Never changes user settings.
export function schockenAppearance(hidden){return {system:hidden?SYSTEM:'standard',colorset:'custom',foreground:'#d5b66b',background:'#292522',outline:'none',edge:'#d5b66b',texture:'none',material:'plastic',font:'Arial',systemSettings:{}};}
export function registerSchockenBlank(dsn){
 if(registered.has(dsn))return true;
 if(typeof dsn?.addSystem!=='function'||typeof dsn?.addDicePreset!=='function')return false;
 dsn.addSystem({id:SYSTEM,name:'Taverngames · Hidden dice'},'default');
 dsn.addDicePreset({type:'d6',labels:['','','','','',''],system:SYSTEM},'d6');
 registered.add(dsn);return true;
}
export function schockenRollPresentation(event){
 const {state,indices}=event.schocken;
 return {...event,dice:indices.map(i=>({sides:6,value:state.cup.dice[i]??1,...(state.cup.dice[i]===null?{blank:true}:{})}))};
}
export class SchockenPersistentDice extends FarklePersistentDice{
 constructor(options){super({...options,scope:'schocken'});}
 spawnOptions(pose){return pose.value===null||pose.neutral?{appearance:schockenAppearance(pose.value===null),diceLibrary:[]}:{};}
 capture(state,indices,eventId){
  const shown={...state,cup:{...state.cup,dice:state.cup.dice.map(v=>v??1)}};
  super.capture(shown,indices,eventId);
  for(const i of indices){const p=this.poses.get(i);if(p){p.faceValue=shown.cup.dice[i];p.neutral=state.cup.dice[i]===null;p.value=state.cup.dice[i];}}
 }
 // Revealing swaps only the local display at the same saved resting position.
 // DSN's own face rotation acts on a quaternion clone; no throw or random evaluation.
 retarget(state){return this.enqueue(async()=>{
  await this._alignTurn(state);
  for(const [i,p] of this.poses){const value=state?.cup?.dice[i];if(value===undefined||value===p.value)continue;
   if(Number.isInteger(value)&&value!==p.faceValue){
    const engine=this.game().dice3d?.box?.throwEngine;
    if(typeof engine?.swapDiceFace!=='function')throw Error('Schocken face reveal requires Dice So Nice 6.4.4');
    const target={notation:{type:'d6'},shape:'d6',forcedResult:value,quaternion:p.quaternion.clone(),applyQuaternion(q){this.quaternion.premultiply(q);return this;}};
    engine.swapDiceFace(target,p.faceValue);p.quaternion=target.quaternion;p.faceValue=value;
   }
   p.value=value;p.neutral=true;
  }
  await this._sync(state);
 });}
}
