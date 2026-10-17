import {FarklePersistentDice} from './farkle-dice.mjs';
const SYSTEM='taverngames-hidden';
const PALETTE='taverngames-hidden-style';
// Separate numeric denominations use native d6/d10 geometry without touching
// normal d6/d10/d100 keys or sharing their material-cache identities.
const BLANK_TYPES={d6:'d1000006',d10:'d1000010',d100:'d1000100'};
export const blankDiceType=type=>BLANK_TYPES[type]??type;
export function dicePresentationDiagnostics(game){
 const factory=game.dice3d?.DiceFactory??game.dice3d?.persistent?.factory;
 const standard=factory?.systems?.get('standard')?.dice;
 return {normalPresets:['d6','d10','d100'].map(type=>{const p=standard?.get(type);return {type,present:!!p,system:p?.system??null,hasModel:!!p?.modelFile,hasLabels:Array.isArray(p?.labels)&&p.labels.some(v=>typeof v==='string'?v.length>0:!!v)};}),privateBlankTypes:{...BLANK_TYPES}};
}
const registered=new WeakSet();
// Independent of any secret value or player dice library. Never changes user settings.
export function schockenAppearance(hidden){return {system:hidden?SYSTEM:'standard',colorset:'custom',foreground:'#d5b66b',background:'#292522',outline:'none',edge:'#d5b66b',texture:'none',material:'plastic',font:'Arial',systemSettings:{}};}
export function registerSchockenBlank(dsn){
 if(registered.has(dsn))return true;
 if(typeof dsn?.addSystem!=='function'||typeof dsn?.addDicePreset!=='function'||typeof dsn?.addColorset!=='function')return false;
 dsn.addSystem({id:SYSTEM,name:'Taverngames · Hidden dice'},'default');
 for(const [type,count] of [['d6',6],['d10',10],['d100',10]]){
  dsn.addDicePreset({type:blankDiceType(type),labels:Array(count).fill(''),system:SYSTEM},type);
 }
 // Keep blank appearance choices in our own palette, separate for each base type.
 for(const type of ['d6','d10','d100'])dsn.addColorset({name:`${PALETTE}-${type}`,description:'Taverngames · Hidden style',category:'Taverngames',visibility:'hidden',foreground:'custom',background:'custom',outline:'custom',edge:'custom',texture:'custom',material:'custom',font:''},'default');
 registered.add(dsn);return true;
}
export function hiddenDiceAppearance(game,type,owner=game.user){
 const dsn=game.dice3d,factory=dsn?.DiceFactory??dsn?.persistent?.factory;
 const saved=owner?.getFlag?.('dice-so-nice','appearance');
 const raw=owner?.id===game.user?.id&&dsn?.box?.config?.appearance||saved;
 let appearance;
 if(raw&&factory?.getAppearanceForDice)appearance=factory.getAppearanceForDice(structuredClone(raw),type);
 const color=owner?.color?.toString?.()??'#292522';
 appearance=structuredClone(appearance??{colorset:'custom',foreground:'#ffffff',background:color,edge:color,outline:'',texture:'none',material:'plastic',font:'Arial'});
 // Library faces can contain numbers or images. Keep their base style, but
 // never their face overrides on a blank die (including a remote library).
 const id=appearance.libraryDieId,who=appearance.libraryDieOwner;
 const libraryOwner=who?game.users?.get?.(who):owner;
 let library=libraryOwner?.getFlag?.('dice-so-nice','diceLibrary');
 if(who==='world')try{library=game.settings?.get?.('dice-so-nice','worldDiceLibrary');}catch{}
 const base=Array.isArray(library)?library.find(d=>d.id===id)?.baseAppearance:null;
 if(base){for(const [key,source]of Object.entries({background:'diceColor',foreground:'labelColor',edge:'edgeColor',outline:'outlineColor',texture:'texture',material:'material',font:'font'}))if(base[source])appearance[key]=base[source];}
 delete appearance.libraryDieId;delete appearance.libraryDieOwner;
 return {...appearance,system:SYSTEM,systemSettings:{},colorset:`${PALETTE}-${type}`};
}
export function schockenRollPresentation(event){
 const {state,indices}=event.schocken;
 return {...event,dice:indices.map(i=>({sides:6,value:state.cup.dice[i]??1,...(state.cup.dice[i]===null?{blank:true}:{})}))};
}
export class SchockenPersistentDice extends FarklePersistentDice{
 constructor(options){super({...options,scope:'schocken'});}
 spawnType(state,index,pose){const type=this.dieType(state,index);return pose.value===null?blankDiceType(type):type;}
 spawnOptions(pose){return pose.value===null?{appearance:hiddenDiceAppearance(this.game(),'d6'),diceLibrary:[]}:pose.neutral?{appearance:schockenAppearance(false),diceLibrary:[]}:{};}
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
