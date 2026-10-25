import {createTic,actTic,ticNpc} from './tic-tac-toe-engine.mjs';
import {secureIndex} from './start-choice.mjs';
import {setNpcDifficulty} from './board-npc.mjs';
const check=(ok,text)=>{if(!ok)throw Error(text);};
const FIELDS=['board','pieceOrder','subWinners','closedBoards','subLines','forcedBoard','winningCells','winningBoards','roundWinner','roundDrawReason','repetitions','turn','order'];
export function createTournament(o={}){
 const s=createTic({...o,roundLimit:1});s.game='tictournament';s.matches=[];s.bracketRound=0;s.matchIndex=0;s.tieDecision=false;return s;
}
function stage(s,entrants){
 s.bracketRound++;s.matchIndex=s.matches.length;
 // Spread first-round byes so every later round has a power-of-two field.
 const size=2**Math.ceil(Math.log2(entrants.length)),byes=size-entrants.length;
 let i=0;for(;i<byes;i++)s.matches.push({stage:s.bracketRound,a:entrants[i],b:null,winner:entrants[i],bye:true,draws:0,attempt:1});
 for(;i<entrants.length;i+=2)s.matches.push({stage:s.bracketRound,a:entrants[i],b:entrants[i+1],winner:null,draws:0,attempt:1});
}
function beginMatch(s,reverse=false){
 const m=s.matches[s.matchIndex],order=reverse?[m.b,m.a]:[m.a,m.b];
 let match=createTic({variant:s.variant,extreme:s.extreme,npcs:s.npcs,npcDifficulty:s.npcDifficulty});match.players=order;match=actTic(match,'gm','begin',{},true);
 for(const key of FIELDS)s[key]=match[key];s.phase='playing';s.draw=false;s.tieDecision=false;s.round=1;
}
function advance(s){
 while(s.matchIndex<s.matches.length&&s.matches[s.matchIndex].winner)s.matchIndex++;
 if(s.matchIndex<s.matches.length){beginMatch(s);return;}
 const winners=s.matches.filter(m=>m.stage===s.bracketRound).map(m=>m.winner);
 if(winners.length===1){s.phase='finished';s.winners=winners;s.losers=s.players.filter(id=>id!==winners[0]);s.draw=false;s.tieDecision=false;return;}
 stage(s,winners);advance(s);
}
export function actTournament(old,id,action,args={},gm=false,random=secureIndex){
 check(old,'No game exists.');let s=structuredClone(old);s.revision++;
 const admin=()=>check(gm,'GM only.');
 if(action==='abort'){admin();s.phase='aborted';s.winners=[];s.losers=[];s.tieDecision=false;return s;}
 if(action==='pause'){admin();s.paused=!s.paused;return s;}
 if(action==='npcDifficulty'){return setNpcDifficulty(s,args,gm);}
 if(action==='npcControl'){admin();check(s.npcs[args.id],'Invalid NPC.');s.npcManual[args.id]=args.manual===true;return s;}
 check(!s.paused,'Game is paused.');
 if(action==='join'){check(s.phase==='lobby'&&!s.players.includes(id)&&s.players.length<16,'Two to sixteen participants required.');s.players.push(id);return s;}
 if(action==='leave'){check(s.phase==='lobby','Leave in the lobby.');s.players=s.players.filter(p=>p!==id);return s;}
 if(action==='begin'){
  admin();check(s.phase==='lobby'&&s.players.length>=2&&s.players.length<=16,'Two to sixteen participants required.');
  const entrants=[...s.players];for(let i=entrants.length-1;i>0;i--){const j=random(i+1);[entrants[i],entrants[j]]=[entrants[j],entrants[i]];}
  s.scores=Object.fromEntries(s.players.map(p=>[p,0]));stage(s,entrants);advance(s);return s;
 }
 if(action==='nextRound'){
  admin();check(s.phase==='roundEnd','Round is not finished.');
  const m=s.matches[s.matchIndex];if(!m.winner){m.attempt++;beginMatch(s,m.attempt%2===0);}else{s.matchIndex++;advance(s);}return s;
 }
 if(action==='tieLot'){
  admin();check(s.phase==='roundEnd'&&s.tieDecision,'No tie decision is pending.');const m=s.matches[s.matchIndex];m.winner=[m.a,m.b][random(2)];m.byLot=true;s.tieDecision=false;s.roundWinner=m.winner;s.scores[m.winner]++;if(s.matches.filter(v=>v.stage===s.bracketRound).length===1)advance(s);return s;
 }
 check(action==='place','Unknown action.');check(s.phase==='playing','Not your turn.');
 const players=s.players,scores=s.scores;
 let result=actTic({...s,game:'tictactoe',players:[...s.order],scores:Object.fromEntries(s.order.map(p=>[p,0]))},id,'place',args,gm);
 s={...result,game:'tictournament',players,scores,winners:[],losers:[],draw:false};
 if(result.phase==='finished'){
  const m=s.matches[s.matchIndex];s.phase='roundEnd';
  if(result.roundWinner){m.winner=result.roundWinner;s.scores[m.winner]++;if(s.matches.filter(v=>v.stage===s.bracketRound).length===1)advance(s);}
  else{m.draws++;s.tieDecision=m.draws>=3;}
 }
 return s;
}
export const tournamentNpc=(s,random)=>ticNpc(s,random);
