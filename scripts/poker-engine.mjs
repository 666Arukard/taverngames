import {startingOrder} from './start-choice.mjs';
import {aalActive,aalFree,aalPots,betAction} from './aalstechen-engine.mjs';
const check=(v,m)=>{if(!v)throw Error(m);};
// Category followed by five base-nine tie breakers: exact integer comparisons.
export function pokerValue(dice){
 check(Array.isArray(dice)&&dice.length===5&&dice.every(v=>Number.isInteger(v)&&v>=1&&v<=8),'Invalid poker dice.');
 const sorted=[...dice].sort((a,b)=>b-a),groups=[...new Set(sorted)].map(v=>[v,sorted.filter(n=>n===v).length]),same=n=>groups.filter(g=>g[1]===n).map(g=>g[0]);
 const straight=n=>{for(let high=8;high>=n;high--)if(Array.from({length:n},(_,i)=>high-i).every(v=>dice.includes(v)))return high;return 0;};
 let category=0,tie=sorted;
 if(straight(5)){category=8;tie=[straight(5)];}
 else if(same(5).length){category=7;tie=same(5);}
 else if(same(3).length&&same(2).length){category=6;tie=[dice.reduce((a,b)=>a+b,0),same(3)[0]];}
 else if(same(4).length){category=5;tie=[...same(4),...same(1)];}
 else if(straight(4)){category=4;const high=straight(4),rest=[...dice];for(let i=0;i<4;i++)rest.splice(rest.indexOf(high-i),1);tie=[high,...rest];}
 else if(same(2).length===2){category=3;tie=[...same(2),...same(1)];}
 else if(same(3).length){category=2;tie=[...same(3),...same(1)];}
 else if(same(2).length){category=1;tie=[...same(2),...same(1)];}
 // Full house sums need a wider leading digit than ordinary die faces.
 const digits=category===6?[Math.floor(tie[0]/9),tie[0]%9,tie[1]]:tie;
 return {category,tie,score:category*9**5+Array.from({length:5},(_,i)=>digits[i]??0).reduce((n,v)=>n*9+v,0)};
}
export function createPoker({npcs={},minimumRaise=1}={}){
 check(Number.isInteger(minimumRaise)&&minimumRaise>=1&&minimumRaise<=1000000,'Invalid minimum raise.');
 check(npcs&&typeof npcs==='object'&&!Array.isArray(npcs)&&Object.keys(npcs).length<=10&&Object.entries(npcs).every(([id,n])=>id.startsWith('npc-')&&typeof n==='string'&&n.trim()&&n.length<=60),'Invalid NPCs.');
 return {version:1,game:'poker',phase:'lobby',revision:0,paused:false,players:Object.keys(npcs),npcs:structuredClone(npcs),npcManual:{},minimumRaise,order:[],turn:0,round:1,hands:{},held:{},rolled:[],redrawn:[],folded:[],eliminatedAt:{},contributions:{},street:{},currentBet:0,lastRaise:minimumRaise,actedAt:{},pending:[],bettingStage:1,lastActor:null,lastIndices:[],winners:[],losers:[],pots:[],payouts:{},log:[]};
}
function finish(s,ids,reason='showdown'){
 const alive=aalActive(s);if(!ids){const high=Math.max(...alive.map(id=>pokerValue(s.hands[id]).score));ids=alive.filter(id=>pokerValue(s.hands[id]).score===high);}
 s.phase='finished';s.reason=reason;s.winners=ids;s.losers=s.players.filter(id=>!ids.includes(id));s.pending=[];
 Object.assign(s,aalPots(s,id=>pokerValue(s.hands[id]).score));
}
function advance(s){
 if(s.bettingStage===1){s.phase='redraw';s.turn=s.order.findIndex(id=>!s.folded.includes(id));}
 else finish(s);
}
function betting(s,stage){
 s.bettingStage=stage;s.street=Object.fromEntries(s.players.map(id=>[id,0]));s.currentBet=0;s.lastRaise=s.minimumRaise;s.actedAt={};
 s.pending=s.order.filter(id=>aalActive(s).includes(id)&&aalFree(s,id)>0);
 if(s.economy?.mode!=='tokens'||s.pending.length<2){advance(s);return;}
 s.phase='betting';s.turn=s.order.indexOf(s.pending[0]);
}
export function actPoker(original,id,action,args={},random=()=>1,gm=false){
 const s=structuredClone(original);check(s?.game==='poker'&&s.version===1,'No game exists.');check(!['finished','aborted'].includes(s.phase),'This game has ended.');
 if(action==='abort'){check(gm,'GM only.');s.phase='aborted';s.paused=true;s.pending=[];}
 else if(action==='pause'){check(gm,'GM only.');s.paused=!s.paused;}
 else if(action==='npcControl'){check(gm&&Object.hasOwn(s.npcs,args.id)&&typeof args.manual==='boolean','GM only.');s.npcManual[args.id]=args.manual;}
 else{
  check(!s.paused,'The game is paused.');
  if(['join','leave'].includes(action)){
   check(s.phase==='lobby'&&typeof id==='string'&&!id.startsWith('npc-')&&id.length<=64,'Join in the lobby.');
   if(action==='join'){check(!s.players.includes(id)&&s.players.length<10,'Invalid participant.');s.players.push(id);}else{check(s.players.includes(id),'Invalid participant.');s.players=s.players.filter(p=>p!==id);}
  }else if(action==='begin'){
   check(gm&&s.phase==='lobby'&&s.players.length>=2,'GM only.');s.order=startingOrder(s);
   for(const p of s.players){s.contributions[p]=0;s.held[p]=Array(5).fill(false);if(s.economy?.mode==='tokens'){const n=s.economy.config.stake;check(n>0,'Choose a positive buy-in.');check(aalFree(s,p)>=n,'Not enough game tokens.');s.contributions[p]=n;}}
   s.phase='rolling';s.turn=0;
  }else if(action==='hold'){
   check(s.phase==='redraw'&&s.order[s.turn]===id,'It is not your turn.');check(Number.isInteger(args.index)&&args.index>=0&&args.index<5,'Invalid die selection.');s.held[id][args.index]=!s.held[id][args.index];
  }else if(action==='roll'){
   check(['rolling','redraw'].includes(s.phase)&&s.order[s.turn]===id&&aalActive(s).includes(id),'It is not your turn.');
   if(s.phase==='redraw'&&args.keep!==undefined){check(Array.isArray(args.keep)&&args.keep.length===5&&args.keep.every(v=>typeof v==='boolean'),'Invalid die selection.');s.held[id]=[...args.keep];}
   const initial=s.phase==='rolling',done=initial?s.rolled:s.redrawn;check(!done.includes(id),'Roll once per active round.');
   const indices=Array.from({length:5},(_,i)=>i).filter(i=>initial||!s.held[id][i]);s.hands[id]??=Array(5).fill(1);
   for(const i of indices){const v=random(8);check(Number.isInteger(v)&&v>=1&&v<=8,'Invalid poker dice.');s.hands[id][i]=v;}
   s.lastActor=id;s.lastIndices=indices;done.push(id);
   const next=s.order.findIndex(p=>aalActive(s).includes(p)&&!done.includes(p));
   if(next<0)betting(s,initial?1:2);else s.turn=next;
  }else{check(aalActive(s).includes(id),'Invalid participant.');betAction(s,id,action,args,advance,finish);}
 }
 s.revision++;return s;
}
export function pokerView(state,user={}){
 if(!state)return null;const s=structuredClone(state),show=s.phase==='finished'&&s.reason==='showdown';
 for(const id of s.players){const own=id===user.id||user.isGM&&s.npcs[id]&&s.npcManual[id];if(!own&&!(show&&!s.folded.includes(id))){if(s.hands[id])s.hands[id]=s.hands[id].map(()=>null);s.held[id]=Array(5).fill(false);}}
 return s;
}
export function pokerNpcAction(s){
 if(!s||s.paused)return null;const id=s.order[s.turn];if(!s.npcs[id]||s.npcManual[id])return null;
 if(s.phase==='rolling')return {id,action:'roll'};
 if(s.phase==='redraw'){
  const dice=s.hands[id],v=pokerValue(dice),keep=v.category>=4?dice.map(()=>true):dice.map(n=>dice.filter(x=>x===n).length>=2);
  return {id,action:'roll',args:{keep}};
 }
 if(s.phase==='betting'){const owing=s.currentBet-(s.street[id]??0),v=pokerValue(s.hands[id]);return {id,action:owing?(v.category===0&&owing>aalFree(s,id)/2?'fold':'call'):'check'};}
 return null;
}
