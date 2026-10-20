import {startingOrder} from './start-choice.mjs';
const check=(ok,message)=>{if(!ok)throw Error(message);};
const sum=values=>values.reduce((n,v)=>n+v,0);
export function createThirteen({npcs={}}={}){check(npcs&&typeof npcs==='object'&&!Array.isArray(npcs)&&Object.keys(npcs).length<=10&&Object.entries(npcs).every(([id,name])=>id.startsWith('npc-')&&typeof name==='string'&&name.trim()&&name.length<=60),'Invalid NPCs.');const players=Object.keys(npcs);return {version:1,game:'thirteen',phase:'lobby',revision:0,players,npcs:structuredClone(npcs),npcManual:{},order:[],turn:0,round:1,rollNumber:0,paused:false,out:[],pot:0,contributions:{},paid:{},received:{},practice:{},scores:Object.fromEntries(players.map(id=>[id,0])),cup:null,last:null,log:[],winners:[],losers:[]};}
export const thirteenActive=s=>s.order.filter(id=>!s.out.includes(id));
const tokens=s=>s.economy?.mode==='tokens';
export function thirteenFunds(s,id){if(!tokens(s))return s.practice[id]??100;const e=s.economy,bet=['open','closed'].includes(e.bets?.status)?e.bets.bets.filter(b=>b.id===id).reduce((n,b)=>n+b.amount,0):0;return Math.max(0,(e.balances[id]??0)-(e.reserved[id]??0)-bet);}
const wallet=s=>tokens(s)?s.economy.balances:s.practice;
const stake=s=>tokens(s)?s.economy.config.stake:1;
function syncScores(s){for(const id of s.players)s.scores[id]=(s.received[id]??0)-(s.paid[id]??0);}
function pay(s,id,requested){const amount=Math.min(requested,thirteenFunds(s,id));wallet(s)[id]-=amount;s.paid[id]=(s.paid[id]??0)+amount;s.contributions[id]=(s.contributions[id]??0)+amount;s.pot+=amount;if(amount<requested&&!s.out.includes(id))s.out.push(id);syncScores(s);return amount;}
function receive(s,id,amount){wallet(s)[id]=(wallet(s)[id]??0)+amount;s.received[id]=(s.received[id]??0)+amount;syncScores(s);}
function award(s,id){const amount=s.pot;receive(s,id,amount);s.pot=0;s.contributions={};return amount;}
function refund(s){for(const [id,amount]of Object.entries(s.contributions))receive(s,id,amount);s.pot=0;s.contributions={};}
function finish(s){syncScores(s);const best=Math.max(...Object.values(s.scores));s.winners=s.players.filter(id=>s.scores[id]===best);s.losers=s.players.filter(id=>!s.winners.includes(id));s.phase='finished';s.reason='players';}
function remaining(s){const ids=thirteenActive(s);if(ids.length>1)return false;if(ids.length===1)award(s,ids[0]);else refund(s);finish(s);return true;}
function buyIn(s,initial=false){const ids=thirteenActive(s),amount=5*stake(s);if(initial)check(ids.every(id=>thirteenFunds(s,id)>=amount),'Not enough game tokens for the buy-in.');for(const id of ids)pay(s,id,amount);if(!remaining(s)){s.phase='ready';if(s.out.includes(s.order[s.turn]))s.turn=s.order.indexOf(thirteenActive(s)[0]);}s.cup=null;s.last=null;}
const next=s=>{for(let i=1;i<=s.order.length;i++){const at=(s.turn+i)%s.order.length;if(!s.out.includes(s.order[at]))return at;}return s.turn;};
export function actThirteen(original,id,action,args={},random=()=>1,gm=false){
 const s=structuredClone(original);check(s?.version===1&&s.game==='thirteen','No game exists.');check(!['finished','aborted'].includes(s.phase),'This game has ended.');
 if(action==='abort'){check(gm,'GM only.');refund(s);syncScores(s);s.phase='aborted';s.paused=true;s.cup=null;}
 else if(action==='pause'){check(gm,'GM only.');s.paused=!s.paused;}
 else if(action==='npcControl'){check(gm&&Object.hasOwn(s.npcs,args.id)&&typeof args.manual==='boolean','GM only.');s.npcManual[args.id]=args.manual;}
 else{check(!s.paused,'The game is paused.');
  if(action==='join'){check(s.phase==='lobby'&&!s.players.includes(id)&&!id.startsWith('npc-')&&s.players.length<10,'Join in the lobby.');s.players.push(id);s.scores[id]=0;}
  else if(action==='leave'){check(s.phase==='lobby'&&s.players.includes(id),'Leave in the lobby.');s.players=s.players.filter(p=>p!==id);delete s.scores[id];}
  else if(action==='begin'){check(gm&&s.phase==='lobby'&&s.players.length>=2,'GM only.');s.order=startingOrder(s);for(const p of s.players)s.practice[p]=100;buyIn(s,true);}
  else if(action==='nextRound'){check(s.phase==='roundEnd'&&(gm||id===s.last.actor),'Continue after the winning throw.');s.round++;s.turn=next(s);buyIn(s);}
  else{check((s.order[s.turn]===id||gm&&action==='continue')&&(!s.out.includes(id)||action==='continue'),'It is not your turn.');
   if(action==='roll'){check(s.phase==='ready','Complete the previous throw first.');const dice=[random(6),random(6),random(6)];check(dice.every(n=>Number.isInteger(n)&&n>=1&&n<=6),'Invalid dice.');s.cup={actor:id,dice,held:[false,false,false]};s.rollNumber++;const value=sum(dice),requested=value===13?s.pot:Math.abs(value-12)*stake(s);s.last={actor:id,dice:[...dice],sum:value,requested,paid:0,payout:0};
    if(value===12){s.last.payout=award(s,id);s.phase='roundEnd';}else{s.last.paid=pay(s,id,requested);s.phase='turnResult';remaining(s);}s.log.push({round:s.round,rollNumber:s.rollNumber,...structuredClone(s.last)});s.log=s.log.slice(-100);
   }else if(action==='continue'){check(s.phase==='turnResult','Complete the previous throw first.');s.turn=next(s);s.phase='ready';}
   else throw Error('Unknown action.');
  }
 }syncScores(s);s.revision++;return s;
}
export function thirteenNpcAction(s){if(!s||s.paused)return null;const id=s.order[s.turn];if(!s.npcs[id]||s.npcManual[id])return null;return s.phase==='ready'?{id,action:'roll'}:s.phase==='turnResult'?{id,action:'continue'}:s.phase==='roundEnd'?{id,action:'nextRound'}:null;}
