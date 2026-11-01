import {createConnect,actConnect} from './connect-four-engine.mjs';
import {npcLevel,chooseNpc} from './board-npc.mjs';
import {secureIndex} from './start-choice.mjs';
const check=(v,m)=>{if(!v)throw Error(m);};
export function createMatches(o={}){
 const initial=o.initial??21,maxTake=o.maxTake??3;check(Number.isInteger(initial)&&initial>=1&&initial<=200,'Matches: choose 1–200 starting sticks.');check(Number.isInteger(maxTake)&&maxTake>=1&&maxTake<=20,'Matches: choose a maximum take of 1–20.');
 return {...createConnect(o),game:'matches',initial,maxTake,lastLoses:o.lastLoses!==false,showRemaining:o.showRemaining!==false,remaining:initial,lastTake:null,roundWinner:null,board:[]};
}
export function actMatches(old,id,action,args={},gm=false){
 check(old?.game==='matches','No game exists.');
 if(['abort','pause','npcControl','npcDifficulty','join','leave','begin'].includes(action))return actConnect(old,id,action,args,gm);
 const s=structuredClone(old);s.revision++;if(action==='remainingDisplay'){check(gm,'GM only.');s.showRemaining=args.enabled===true;return s;}check(!s.paused,'Game is paused.');
 if(action==='nextRound'){check(gm,'GM only.');check(s.phase==='roundEnd','Round is not finished.');s.round++;s.remaining=s.initial;s.lastTake=null;s.roundWinner=null;s.order.reverse();s.turn=0;s.phase='playing';return s;}
 check(action==='take','Unknown action.');check(s.phase==='playing'&&s.order[s.turn]===id,'Not your turn.');check(Number.isInteger(args.count)&&args.count>=1&&args.count<=Math.min(s.maxTake,s.remaining),'Matches: invalid number of sticks.');
 s.remaining-=args.count;s.lastTake={id,count:args.count};
 if(s.remaining===0){const winner=s.lastLoses?s.order[1-s.turn]:id;s.roundWinner=winner;s.scores[winner]++;if(s.round<s.roundLimit)s.phase='roundEnd';else{s.phase='finished';const best=Math.max(...Object.values(s.scores));s.winners=s.players.filter(id=>s.scores[id]===best);s.losers=s.players.filter(id=>!s.winners.includes(id));s.draw=s.winners.length===2;}}else s.turn=1-s.turn;
 return s;
}
export function matchesWinning(remaining,maxTake,lastLoses){
 const wins=[lastLoses];for(let n=1;n<=remaining;n++){wins[n]=false;for(let take=1;take<=Math.min(n,maxTake);take++)if(take===n?!lastLoses:!wins[n-take]){wins[n]=true;break;}}return wins;
}
export function matchesNpc(s,random=secureIndex){
 if(s?.phase!=='playing'||s.paused)return null;const id=s.order[s.turn];if(!s.npcs[id]||s.npcManual[id])return null;
 const wins=matchesWinning(s.remaining,s.maxTake,s.lastLoses),moves=Array.from({length:Math.min(s.maxTake,s.remaining)},(_,i)=>{const count=i+1,win=count===s.remaining&&!s.lastLoses;return {count,win,score:win?100:count===s.remaining?-100:!wins[s.remaining-count]?1:0};});
 return {id,action:'take',args:{count:chooseNpc(moves,npcLevel(s,id),random).count}};
}
