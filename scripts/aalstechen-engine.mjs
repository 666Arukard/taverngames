import {startingOrder,chosenStarter} from './start-choice.mjs';
const check=(v,m)=>{if(!v)throw Error(m);};
const whole=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000000;
export const AAL_DICE=Object.freeze([4,6,8,10,12]);
export function createAalstechen({npcs={},minimumRaise=1}={}){
 check(Number.isInteger(minimumRaise)&&minimumRaise>=1&&minimumRaise<=1000000,'Invalid minimum raise.');
 check(npcs&&typeof npcs==='object'&&!Array.isArray(npcs)&&Object.keys(npcs).length<=10&&Object.entries(npcs).every(([id,n])=>id.startsWith('npc-')&&typeof n==='string'&&n.trim()&&n.length<=60),'Invalid NPCs.');
 const players=Object.keys(npcs);return {version:1,game:'aalstechen',phase:'lobby',revision:0,paused:false,players,npcs:structuredClone(npcs),npcManual:{},minimumRaise,order:[],turn:0,round:1,remaining:{},last:{},rolled:[],folded:[],eliminatedAt:{},contributions:{},street:{},currentBet:0,lastRaise:minimumRaise,actedAt:{},pending:[],cup:{dice:null,held:[],types:[]},winners:[],losers:[],pots:[],payouts:{},log:[]};
}
export const aalActive=s=>s.players.filter(id=>!s.folded.includes(id)&&!Object.hasOwn(s.eliminatedAt,id));
const tokenMode=s=>s.economy?.mode==='tokens';
export function aalFree(s,id){const e=s.economy;if(!tokenMode(s))return 0;const held=['open','closed'].includes(e.bets?.status)?e.bets.bets.filter(b=>b.id===id).reduce((n,b)=>n+b.amount,0):0;return Math.max(0,(e.balances[id]??0)-(['finished','aborted'].includes(s.phase)?0:s.contributions[id]??0)-held);}
export const aalCanRaise=(s,id)=>!Object.hasOwn(s.actedAt,id)||s.currentBet-s.actedAt[id]>=s.lastRaise;
const ordered=(s,ids,after)=>{const start=s.order.indexOf(after);return [...ids].sort((a,b)=>(s.order.indexOf(a)-start-1+s.order.length)%s.order.length-(s.order.indexOf(b)-start-1+s.order.length)%s.order.length);};
// Each contribution band is an independent pot. A shorter all-in cannot win higher bands.
export function aalPots(s,rankOverride=null){
 const levels=[...new Set(Object.values(s.contributions).filter(n=>n>0))].sort((a,b)=>a-b),pots=[],payouts=Object.fromEntries(s.players.map(id=>[id,0]));let previous=0;
 for(const level of levels){const contributors=s.order.filter(id=>(s.contributions[id]??0)>=level),part=level-previous,amount=part*contributors.length;previous=level;
  const eligible=contributors.filter(id=>!s.folded.includes(id));let winners,refund=false;
  if(contributors.length===1||!eligible.length){winners=contributors;refund=true;}
  else{const rank=rankOverride??(id=>Object.hasOwn(s.eliminatedAt,id)?s.eliminatedAt[id]:Number.MAX_SAFE_INTEGER),best=Math.max(...eligible.map(rank));winners=eligible.filter(id=>rank(id)===best);}
  const shares={};winners.forEach((id,i)=>{const n=Math.floor(amount/winners.length)+(i<amount%winners.length?1:0);payouts[id]+=n;shares[id]=n;});pots.push({level,amount,contributors,eligible,winners,shares,refund});
 }
 return {pots,payouts};
}
function finish(s,ids,reason){s.phase='finished';s.reason=reason;s.winners=[...ids];s.losers=s.players.filter(id=>!ids.includes(id));s.pending=[];Object.assign(s,aalPots(s));}
function nextRound(s){s.round++;s.phase='rolling';s.rolled=[];s.last={};s.cup={dice:null,held:[],types:[]};s.pending=[];}
function startBetting(s){
 const can=aalActive(s).filter(id=>aalFree(s,id)>0);if(!tokenMode(s)||can.length<2){nextRound(s);return;}
 s.phase='betting';s.street=Object.fromEntries(s.players.map(id=>[id,0]));s.currentBet=0;s.lastRaise=s.minimumRaise;s.actedAt={};
 // The first actor rotates by completed five-round blocks.
 const start=(Math.floor(s.round/5)-1)%s.order.length;s.pending=ordered(s,can,s.order[(start-1+s.order.length)%s.order.length]);s.turn=s.order.indexOf(s.pending[0]);
}
function contribute(s,id,n){check(whole(n)&&n<=aalFree(s,id),'Not enough game tokens.');s.contributions[id]+=n;s.street[id]=(s.street[id]??0)+n;}
export function betAction(s,id,action,args,advance=nextRound,complete=finish){
 check(s.phase==='betting'&&s.pending[0]===id,'It is not your turn.');const free=aalFree(s,id),own=s.street[id]??0,owing=s.currentBet-own;
 if(action==='fold'){check(owing>0,'Check instead of folding.');s.folded.push(id);}
 else if(action==='check'){check(owing===0,'Call the current bet first.');s.actedAt[id]=s.currentBet;}
 else if(action==='call'||action==='allIn'&&own+free<=s.currentBet){check(owing>0&&free>0,'No bet to call.');contribute(s,id,Math.min(owing,free));s.actedAt[id]=s.currentBet;}
 else if(action==='raise'||action==='allIn'){
  const target=action==='allIn'?own+free:args.to;check(whole(target)&&target>s.currentBet&&target>own,'Invalid raise.');check(aalCanRaise(s,id),'A short all-in does not reopen raising.');check(aalActive(s).some(other=>other!==id&&aalFree(s,other)>0),'No opponent can match another raise.');
  const increase=target-s.currentBet,cost=target-own;check(cost<=free,'Not enough game tokens.');check(increase>=s.lastRaise||cost===free,'Raise below the minimum.');
  contribute(s,id,cost);if(increase>=s.lastRaise)s.lastRaise=increase;s.currentBet=target;s.actedAt[id]=target;
 }else throw Error('Unknown action.');
 s.log.push({round:s.round,id,action,to:s.street[id]??0});s.log=s.log.slice(-100);
 const alive=aalActive(s);if(alive.length===1){complete(s,alive,'folds');return;}
 const pending=s.pending.filter(other=>other!==id&&alive.includes(other)&&aalFree(s,other)>0);
 for(const other of alive)if(other!==id&&aalFree(s,other)>0&&(s.street[other]??0)<s.currentBet&&!pending.includes(other))pending.push(other);
 s.pending=ordered(s,pending,id);if(!s.pending.length){advance(s);return;}s.turn=s.order.indexOf(s.pending[0]);
}
export function actAalstechen(original,id,action,args={},random=()=>1,gm=false){
 const s=structuredClone(original);check(s?.game==='aalstechen'&&s.version===1,'No game exists.');check(!['finished','aborted'].includes(s.phase),'This game has ended.');
 if(action==='abort'){check(gm,'GM only.');s.phase='aborted';s.paused=true;s.pending=[];s.cup={dice:null,held:[],types:[]};}
 else if(action==='pause'){check(gm,'GM only.');s.paused=!s.paused;}
 else if(action==='npcControl'){check(gm&&Object.hasOwn(s.npcs,args.id)&&typeof args.manual==='boolean','GM only.');s.npcManual[args.id]=args.manual;}
 else{check(!s.paused,'The game is paused.');
  if(['join','leave'].includes(action)){check(s.phase==='lobby'&&typeof id==='string'&&!id.startsWith('npc-')&&id.length<=64,'Join in the lobby.');if(action==='join'){check(!s.players.includes(id)&&s.players.length<10,'Invalid participant.');s.players.push(id);}else{check(s.players.includes(id),'Invalid participant.');s.players=s.players.filter(p=>p!==id);}}
  else if(action==='begin'){
   check(gm&&s.phase==='lobby'&&s.players.length>=2,'GM only.');s.order=startingOrder(s);
   for(const p of s.players){s.contributions[p]=0;s.remaining[p]=[...AAL_DICE];if(tokenMode(s)){const n=s.economy.config.stake;check(n>0,'Choose a positive buy-in.');check(aalFree(s,p)>=n,'Not enough game tokens.');s.contributions[p]=n;}}
   s.phase='rolling';
  }else if(action==='roll'){
   check(s.phase==='rolling'&&aalActive(s).includes(id)&&!s.rolled.includes(id),'Roll once per active round.');const dice=s.remaining[id].map(sides=>({sides,value:random(sides)}));check(dice.every(d=>Number.isInteger(d.value)&&d.value>=1&&d.value<=d.sides),'Invalid dice.');
   s.last[id]=dice;s.remaining[id]=dice.filter(d=>d.value!==1).map(d=>d.sides);s.rolled.push(id);s.turn=s.order.indexOf(id);s.cup={dice:dice.map(d=>d.value),types:dice.map(d=>'d'+d.sides),held:dice.map(()=>false),actor:id};
   // Resolve elimination together only when all participants completed this logical round.
   const participants=aalActive(s);if(participants.every(p=>s.rolled.includes(p))){for(const p of participants)if(!s.remaining[p].length)s.eliminatedAt[p]=s.round;const alive=aalActive(s);if(alive.length<=1)finish(s,alive.length?alive:participants,'dice');else s.phase='roundEnd';}
  }else if(action==='next'){
   check(s.phase==='roundEnd'&&(gm||aalActive(s).includes(id)),'Continue after everyone rolled.');if(s.round%5===0)startBetting(s);else nextRound(s);
  }else{check(aalActive(s).includes(id),'Invalid participant.');betAction(s,id,action,args);}
 }
 s.revision++;return s;
}
export function aalstechenNpcAction(s){
 if(!s||s.paused)return null;const alive=aalActive(s),automatic=id=>!!s.npcs[id]&&!s.npcManual[id];
 if(s.phase==='rolling'){const id=alive.find(p=>!s.rolled.includes(p)&&automatic(p));return id?{id,action:'roll'}:null;}
 if(s.phase==='roundEnd'){const id=alive.find(automatic);return alive.every(p=>!!s.npcs[p])&&id?{id,action:'next'}:null;}
 if(s.phase!=='betting')return null;const id=s.pending[0];if(!automatic(id))return null;const owing=s.currentBet-(s.street[id]??0),free=aalFree(s,id);
 if(owing>0)return {id,action:s.remaining[id].length===1&&owing>free/2?'fold':'call'};
 if(s.remaining[id].length>=3&&Math.floor(s.round/5)%2===0&&free>=s.minimumRaise&&alive.some(other=>other!==id&&aalFree(s,other)>0))return {id,action:'raise',args:{to:s.minimumRaise}};
 return {id,action:'check'};
}
