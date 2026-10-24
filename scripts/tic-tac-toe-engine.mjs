import {startingOrder,secureIndex} from './start-choice.mjs';
const check=(ok,message)=>{if(!ok)throw Error(message);};
const LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export function ticWinningCells(board){return [...new Set(LINES.filter(line=>board[line[0]]&&line.every(i=>board[i]===board[line[0]])).flat())];}
export function createTic(o={}){const roundLimit=o.roundLimit??1;check(Number.isInteger(roundLimit)&&roundLimit>=1&&roundLimit<=100,'Invalid round count.');return {version:1,game:'tictactoe',gameId:null,revision:0,phase:'lobby',players:Object.keys(o.npcs??{}),npcs:structuredClone(o.npcs??{}),npcManual:{},order:[],turn:0,round:1,roundLimit,startSelection:o.startSelection??'rules',board:Array(9).fill(null),scores:{},winningCells:[],winners:[],losers:[],paused:false};}
export function actTic(old,id,action,args={},gm=false){check(old,'No game exists.');const s=structuredClone(old);s.revision++;const admin=()=>check(gm,'GM only.');
 if(action==='abort'){admin();s.phase='aborted';s.winners=[];s.losers=[];return s;}
 if(action==='pause'){admin();s.paused=!s.paused;return s;}
 if(action==='npcControl'){admin();check(s.npcs[args.id],'Invalid NPC.');s.npcManual[args.id]=args.manual===true;return s;}
 check(!s.paused,'Game is paused.');
 if(action==='join'){check(s.phase==='lobby'&&!s.players.includes(id)&&s.players.length<2,'Two players required.');s.players.push(id);}
 else if(action==='leave'){check(s.phase==='lobby','Leave in the lobby.');s.players=s.players.filter(p=>p!==id);}
 else if(action==='begin'){admin();check(s.phase==='lobby'&&s.players.length===2,'Two players required.');s.order=startingOrder(s);s.scores=Object.fromEntries(s.players.map(p=>[p,0]));s.phase='playing';}
 else if(action==='nextRound'){admin();check(s.phase==='roundEnd','Round is not finished.');s.round++;s.board=Array(9).fill(null);s.order.reverse();s.turn=0;s.winningCells=[];s.roundWinner=null;s.phase='playing';}
 else if(action==='place'){check(s.phase==='playing'&&s.order[s.turn]===id,'Not your turn.');check(Number.isInteger(args.index)&&args.index>=0&&args.index<9&&!s.board[args.index],'Choose an empty field.');s.board[args.index]=id;s.winningCells=ticWinningCells(s.board);
  if(s.winningCells.length||s.board.every(Boolean)){s.roundWinner=s.winningCells.length?id:null;if(s.roundWinner)s.scores[id]++;if(s.round>=s.roundLimit){s.phase='finished';const best=Math.max(...Object.values(s.scores));s.winners=s.players.filter(p=>s.scores[p]===best);s.losers=s.players.filter(p=>!s.winners.includes(p));s.draw=s.winners.length===2;}else s.phase='roundEnd';}else s.turn=1-s.turn;
 }else throw Error('Unknown action.');return s;
}
function score(board,actor,mine,other,depth){const wins=ticWinningCells(board);if(wins.length)return board[wins[0]]===mine?10-depth:depth-10;if(board.every(Boolean))return 0;const values=[];for(let i=0;i<9;i++)if(!board[i]){board[i]=actor;values.push(score(board,actor===mine?other:mine,mine,other,depth+1));board[i]=null;}return actor===mine?Math.max(...values):Math.min(...values);}
export function ticNpc(s,random=secureIndex){if(!s||s.phase!=='playing'||s.paused)return null;const id=s.order[s.turn],other=s.order[1-s.turn];if(!s.npcs[id]||s.npcManual[id])return null;const moves=[];for(let i=0;i<9;i++)if(!s.board[i]){const b=[...s.board];b[i]=id;moves.push({index:i,score:score(b,other,id,other,0)});}if(!moves.length)return null;const best=Math.max(...moves.map(m=>m.score)),choices=moves.filter(m=>m.score===best);return {id,action:'place',args:{index:choices[Math.max(0,Math.min(choices.length-1,random(choices.length)))].index}};}
