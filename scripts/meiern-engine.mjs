import {startingOrder,chosenStarter} from './start-choice.mjs';
const check=(v,m)=>{if(!v)throw Error(m);};
export const MEIERN_VALUES=Object.freeze([31,32,41,42,43,51,52,53,54,61,62,63,64,65,11,22,33,44,55,66,21]);
export const meiernRank=value=>MEIERN_VALUES.indexOf(value);
export function meiernValue(dice){check(Array.isArray(dice)&&dice.length===2&&dice.every(n=>Number.isInteger(n)&&n>=1&&n<=6),'Invalid dice.');return Math.max(...dice)*10+Math.min(...dice);}
export const activeMeiern=s=>(s?.order??s?.players??[]).filter(id=>!s.out.includes(id));
export function createMeiern({npcs={},mode='rounds',roundLimit=10}={}){
 check(['rounds','endless'].includes(mode)&&Number.isInteger(roundLimit)&&roundLimit>=1&&roundLimit<=1000,'Invalid round mode.');
 check(npcs&&typeof npcs==='object'&&!Array.isArray(npcs)&&Object.keys(npcs).length<=10&&Object.entries(npcs).every(([id,n])=>id.startsWith('npc-')&&typeof n==='string'&&n.trim()&&n.length<=60),'Invalid NPCs.');
 const players=Object.keys(npcs);return {version:1,game:'meiern',phase:'lobby',revision:0,paused:false,players,npcs:structuredClone(npcs),npcManual:{},mode,roundLimit,round:1,completedRounds:0,rollNumber:0,order:[],turn:0,out:[],scores:Object.fromEntries(players.map(id=>[id,0])),cup:null,bid:null,resolution:null,log:[],winners:[],losers:[]};
}
function nextId(s,id){const i=s.order.indexOf(id);for(let n=1;n<=s.order.length;n++){const next=s.order[(i+n)%s.order.length];if(!s.out.includes(next))return next;}return null;}
function finish(s,reason='rounds'){
 s.phase='finished';s.reason=reason;const alive=activeMeiern(s),best=Math.max(...s.players.map(id=>s.scores[id]??0));s.winners=alive.length===1?alive:s.players.filter(id=>(s.scores[id]??0)===best);s.losers=s.players.filter(id=>!s.winners.includes(id));s.draw=s.winners.length>1;
}
function roundStart(s,starter,initial=false){
 const e=s.economy;
 if(e?.mode==='tokens'&&e.config.stake>0){
  const required=2*e.config.stake,held=id=>['open','closed'].includes(e.bets?.status)?e.bets.bets.filter(b=>b.id===id).reduce((n,b)=>n+b.amount,0):0;
  for(const id of activeMeiern(s))if((e.balances[id]??0)-held(id)<required){if(initial)throw Error('Not enough game tokens.');s.out.push(id);}
 }
 if(activeMeiern(s).length<2){finish(s,'funds');return;}
 const first=!s.out.includes(starter)?starter:nextId(s,starter);s.turn=s.order.indexOf(first);s.phase='ready';s.cup=null;s.bid=null;s.resolution=null;
}
export function actMeiern(original,actor,action,args={},random=()=>1,gm=false){
 const s=structuredClone(original);check(s?.game==='meiern'&&s.version===1,'No game exists.');check(!['finished','aborted'].includes(s.phase),'This game has ended.');
 if(action==='abort'){check(gm,'GM only.');s.phase='aborted';s.paused=true;s.cup=null;s.bid=null;}
 else if(action==='pause'){check(gm,'GM only.');s.paused=!s.paused;}
 else if(action==='npcControl'){check(gm&&Object.hasOwn(s.npcs,args.id)&&typeof args.manual==='boolean','GM only.');s.npcManual[args.id]=args.manual;}
 else{
  check(!s.paused,'The game is paused.');
  if(['join','leave'].includes(action)){
   check(s.phase==='lobby'&&typeof actor==='string'&&!actor.startsWith('npc-')&&actor.length<=64,'Join in the lobby.');
   if(action==='join'){check(!s.players.includes(actor)&&s.players.length<10,'Invalid participant.');s.players.push(actor);s.scores[actor]=0;}
   else{check(s.players.includes(actor),'Invalid participant.');s.players=s.players.filter(id=>id!==actor);delete s.scores[actor];}
  }else if(action==='begin'){
   check(gm&&s.phase==='lobby'&&s.players.length>=2,'GM only.');s.order=startingOrder(s);roundStart(s,s.firstPlayer??(s.players.includes(args.first)?args.first:s.players[0]),true);
  }else if(action==='finish'){
   check(gm&&(s.phase==='reveal'||s.phase==='ready'&&!s.cup)&&s.completedRounds>0,'Finish between revealed rounds.');finish(s,'early');
  }else if(action==='next'){
   check(s.phase==='reveal'&&(gm||actor===s.resolution.starter),'Continue after revealing.');s.round++;roundStart(s,s.resolution.starter);
  }else{
   const active=s.order[s.turn];check(actor===active&&!s.out.includes(actor),'It is not your turn.');
   if(action==='roll'){
    check(s.phase==='ready','Roll after accepting.');const dice=[random(6),random(6)];meiernValue(dice);s.cup={actor,dice};s.rollNumber++;s.phase='claim';
   }else if(action==='declare'){
    check(s.phase==='claim'&&s.cup.actor===actor,'Roll before declaring.');check(meiernRank(args.value)>=0&&(!s.bid||meiernRank(args.value)>meiernRank(s.bid.value)),'The claim must increase.');s.bid={actor,value:args.value};s.phase='respond';s.turn=s.order.indexOf(nextId(s,actor));
   }else if(action==='believe'){
    check(s.phase==='respond'&&s.bid.value!==21,'Challenge a declared Meier.');s.phase='ready';
   }else if(action==='challenge'){
    check(s.phase==='respond'&&s.bid&&s.cup?.actor===s.bid.actor,'No claim to challenge.');const actual=meiernValue(s.cup.dice),roller=s.cup.actor,truth=meiernRank(actual)>=meiernRank(s.bid.value),meier=actual===21,payer=truth?actor:roller,payee=truth?roller:actor,active=activeMeiern(s);
    const payments=meier?active.filter(id=>id!==roller).map(from=>({from,to:roller,multiplier:2})):[{from:payer,to:payee,multiplier:1}];
    for(const p of payments){s.scores[p.from]-=p.multiplier;s.scores[p.to]+=p.multiplier;}
    s.completedRounds++;s.resolution={round:s.round,roller,challenger:actor,claim:s.bid.value,actual,dice:[...s.cup.dice],truth,meier,payments,starter:meier?roller:payer};s.log.push(structuredClone(s.resolution));s.log=s.log.slice(-100);s.phase='reveal';
    if(s.mode==='rounds'&&s.completedRounds>=s.roundLimit)finish(s);
   }else throw Error('Unknown action.');
  }
 }
 s.revision++;return s;
}
export function meiernView(original,user={}){
 if(!original)return null;const s=structuredClone(original),owner=s.cup?.actor,known=['reveal','finished'].includes(s.phase)||owner===user.id||user.isGM&&!!s.npcs[owner]&&s.npcManual[owner];if(s.cup&&!known)s.cup.dice=s.cup.dice.map(()=>null);return s;
}
// Responding uses only the public claim and turn counters, never the other cup.
export function meiernNpcAction(s){
 if(!s||s.paused)return null;if(s.phase==='reveal'){const id=s.resolution.starter;return s.npcs[id]&&!s.npcManual[id]?{id,action:'next'}:null;}
 const id=s.order[s.turn];if(!s.npcs[id]||s.npcManual[id])return null;
 if(s.phase==='ready')return {id,action:'roll'};
 if(s.phase==='claim'){const floor=s.bid?meiernRank(s.bid.value)+1:0,actual=meiernRank(meiernValue(s.cup.dice));return {id,action:'declare',args:{value:MEIERN_VALUES[Math.max(floor,actual)]}};}
 if(s.phase==='respond')return {id,action:s.bid.value===21||(s.rollNumber+s.round+meiernRank(s.bid.value))%3===0?'challenge':'believe'};
 return null;
}
