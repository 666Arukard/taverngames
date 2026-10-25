import {secureIndex,startingOrder} from './start-choice.mjs';
import {NPC_LEVELS,npcLevel,chooseNpc,setNpcDifficulty} from './board-npc.mjs';
const check=(ok,text)=>{if(!ok)throw Error(text);};
export const MORRIS_MILLS=Object.freeze([0,8,16].flatMap(b=>[[0,1,2],[2,3,4],[4,5,6],[6,7,0]].map(line=>line.map(i=>i+b))).concat([1,3,5,7].map(i=>[i,i+8,i+16])));
export const MORRIS_EDGES=Object.freeze([0,8,16].flatMap(b=>Array.from({length:8},(_,i)=>[b+i,b+(i+1)%8])).concat([1,3,5,7].flatMap(i=>[[i,i+8],[i+8,i+16]])));
export const MORRIS_POINTS=Object.freeze([5,20,35].flatMap(n=>[[n,n],[50,n],[100-n,n],[100-n,50],[100-n,100-n],[50,100-n],[n,100-n],[n,50]]));
const count=(s,id)=>s.board.filter(p=>p===id).length;
const setting=s=>Object.values(s.reserve).some(n=>n>0);
export const morrisMills=(board,id)=>MORRIS_MILLS.filter(line=>line.every(i=>board[i]===id));
export const morrisKey=s=>JSON.stringify([s.board,s.order[s.turn],s.players.map(id=>s.reserve[id])]);
export function morrisCaptures(s){const other=s.order[1-s.turn],own=s.board.flatMap((id,i)=>id===other?[i]:[]),protectedCells=new Set(morrisMills(s.board,other).flat()),free=own.filter(i=>!protectedCells.has(i));return free.length?free:own;}
export function morrisLegal(s,id=s?.order?.[s.turn]){
 if(!s||s.phase!=='playing'||s.paused||id!==s.order[s.turn])return [];
 if(s.capture)return morrisCaptures(s).map(index=>({action:'capture',args:{index}}));
 const empty=s.board.flatMap((v,i)=>v?[]:[i]);
 if(setting(s))return s.reserve[id]>0?empty.map(index=>({action:'place',args:{index}})):[];
 const own=s.board.flatMap((v,i)=>v===id?[i]:[]),fly=s.flying&&own.length===3;
 return own.flatMap(from=>empty.filter(index=>fly||MORRIS_EDGES.some(([a,b])=>a===from&&b===index||b===from&&a===index)).map(index=>({action:'move',args:{from,index}})));
}
function reset(s){s.board=Array(24).fill(null);s.reserve=Object.fromEntries(s.players.map(id=>[id,9]));s.capture=false;s.millCells=[];s.roundWinner=null;s.roundDrawReason=null;s.quiet=0;s.repetitions={};s.turn=0;}
export function createMorris(o={}){
 const roundLimit=o.roundLimit??1,quietLimit=o.quietLimit??100;check(Number.isInteger(roundLimit)&&roundLimit>=1&&roundLimit<=100,'Invalid round count.');check(Number.isInteger(quietLimit)&&quietLimit>=2&&quietLimit<=1000,'Invalid quiet move limit.');
 const s={version:1,game:'morris',gameId:null,revision:0,phase:'lobby',players:Object.keys(o.npcs??{}),npcs:structuredClone(o.npcs??{}),npcManual:{},npcDifficulty:Object.fromEntries(Object.keys(o.npcs??{}).map(id=>[id,NPC_LEVELS.includes(o.npcDifficulty?.[id])?o.npcDifficulty[id]:'normal'])),order:[],startSelection:o.startSelection??'rules',round:1,roundLimit,flying:o.flying!==false,quietLimit,scores:{},winners:[],losers:[],paused:false};reset(s);return s;
}
function end(s,winner,reason){s.roundWinner=winner;s.roundDrawReason=winner?null:reason;if(winner)s.scores[winner]++;if(s.round<s.roundLimit){s.phase='roundEnd';return;}s.phase='finished';const best=Math.max(...Object.values(s.scores));s.winners=s.players.filter(id=>s.scores[id]===best);s.losers=s.players.filter(id=>!s.winners.includes(id));s.draw=s.winners.length===2;}
function next(s){
 const previous=s.order[s.turn];s.turn=1-s.turn;s.capture=false;
 if(!setting(s)){
  const active=s.order[s.turn];if(count(s,active)<3||!morrisLegal(s).length){end(s,previous,'blocked');return;}
  const key=morrisKey(s);s.repetitions[key]=(s.repetitions[key]??0)+1;
  if(s.repetitions[key]>=3){end(s,null,'repetition');return;}
  if(s.quiet>=s.quietLimit)end(s,null,'quiet');
 }
}
export function actMorris(old,id,action,args={},gm=false){
 check(old,'No game exists.');const s=structuredClone(old);s.revision++;const admin=()=>check(gm,'GM only.');
 if(action==='abort'){admin();s.phase='aborted';s.winners=[];s.losers=[];return s;}
 if(action==='pause'){admin();s.paused=!s.paused;return s;}
 if(action==='npcDifficulty')return setNpcDifficulty(s,args,gm);
 if(action==='npcControl'){admin();check(s.npcs[args.id],'Invalid NPC.');s.npcManual[args.id]=args.manual===true;return s;}
 check(!s.paused,'Game is paused.');
 if(action==='join'){check(s.phase==='lobby'&&!s.players.includes(id)&&s.players.length<2,'Two players required.');s.players.push(id);}
 else if(action==='leave'){check(s.phase==='lobby','Leave in the lobby.');s.players=s.players.filter(p=>p!==id);}
 else if(action==='begin'){admin();check(s.phase==='lobby'&&s.players.length===2,'Two players required.');s.order=startingOrder(s);s.scores=Object.fromEntries(s.players.map(p=>[p,0]));reset(s);s.phase='playing';}
 else if(action==='nextRound'){admin();check(s.phase==='roundEnd','Round is not finished.');s.round++;s.order.reverse();reset(s);s.phase='playing';}
 else{
  check(s.phase==='playing'&&s.order[s.turn]===id,'Not your turn.');
  const legal=morrisLegal(s);check(legal.some(m=>m.action===action&&m.args.index===args.index&&(action!=='move'||m.args.from===args.from)),'Choose a legal Morris move.');
  if(action==='capture'){s.board[args.index]=null;s.capture=false;s.quiet=0;next(s);}
  else{
   const before=new Set(morrisMills(s.board,id).map(line=>line.join(','))),wasSetting=setting(s);
   if(action==='place'){s.reserve[id]--;s.quiet=0;}else{s.board[args.from]=null;s.quiet++;}
   s.board[args.index]=id;const formed=morrisMills(s.board,id).filter(line=>!before.has(line.join(',')));s.millCells=formed.flat();
   // One capture per completed action, including a double mill.
   if(formed.length&&morrisCaptures(s).length)s.capture=true;else next(s);
   if(wasSetting&&!setting(s))s.quiet=0;
  }
 }
 return s;
}
function value(s,id){const other=s.order.find(p=>p!==id);if(['finished','roundEnd'].includes(s.phase))return s.roundWinner===id?100000:s.roundWinner===other?-100000:0;let score=30*(count(s,id)-count(s,other))+8*(morrisMills(s.board,id).length-morrisMills(s.board,other).length);for(const line of MORRIS_MILLS){const a=line.filter(i=>s.board[i]===id).length,b=line.filter(i=>s.board[i]===other).length;if(!b)score+=[0,1,9,15][a];if(!a)score-=[0,1,10,15][b];}if(s.capture)score+=s.order[s.turn]===id?25:-25;return score;}
function follow(s,id,depth){if(depth===0||s.phase!=='playing')return value(s,id);const moves=morrisLegal(s);if(!moves.length)return value(s,id);const scores=moves.map(m=>follow(actMorris(s,s.order[s.turn],m.action,m.args),id,depth-1));return s.order[s.turn]===id?Math.max(...scores):Math.min(...scores);}
export function morrisNpc(s,random=secureIndex){if(!s||s.phase!=='playing'||s.paused)return null;const id=s.order[s.turn];if(!s.npcs[id]||s.npcManual[id])return null;const moves=morrisLegal(s);if(!moves.length)return null;const level=npcLevel(s,id);const scored=moves.map(move=>{const next=actMorris(s,id,move.action,move.args);return {move,score:level==='hard'?follow(next,id,1):value(next,id),win:next.roundWinner===id};});const chosen=chooseNpc(scored,level,random).move;return {id,...chosen};}
