import {NPC_LEVELS,npcLevel,chooseNpc,setNpcDifficulty} from './board-npc.mjs';
import {startingOrder,secureIndex} from './start-choice.mjs';
const check=(ok,message)=>{if(!ok)throw Error(message);};
export const TIC_VARIANTS=['classic','vanishing','moving'];
const LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export function ticWinningCells(board){return [...new Set(LINES.filter(line=>board[line[0]]&&line.every(i=>board[i]===board[line[0]])).flat())];}
const limited=s=>s.variant==='vanishing'||s.variant==='moving';
const area=(s,index)=>s.extreme?Math.floor(index/9):0;
const localPieces=(s,id,board)=>(s.pieceOrder?.[id]??[]).filter(index=>area(s,index)===board);
function reset(s){s.board=Array(s.extreme?81:9).fill(null);s.pieceOrder=Object.fromEntries(s.players.map(id=>[id,[]]));s.subWinners=Array(9).fill(null);s.closedBoards=Array(9).fill(false);s.subLines=Array.from({length:9},()=>[]);s.forcedBoard=null;s.winningCells=[];s.winningBoards=[];s.roundWinner=null;s.roundDrawReason=null;s.repetitions={};}
export function createTic(o={}){const roundLimit=o.roundLimit??1,variant=o.variant??'classic',extreme=o.extreme===true;check(Number.isInteger(roundLimit)&&roundLimit>=1&&roundLimit<=100,'Invalid round count.');check(TIC_VARIANTS.includes(variant),'Invalid Tic-Tac-Toe variant.');check(!extreme||variant!=='classic','Extreme requires a three-piece variant.');const s={version:1,game:'tictactoe',variant,extreme,gameId:null,revision:0,phase:'lobby',players:Object.keys(o.npcs??{}),npcs:structuredClone(o.npcs??{}),npcManual:{},npcDifficulty:Object.fromEntries(Object.keys(o.npcs??{}).map(id=>[id,NPC_LEVELS.includes(o.npcDifficulty?.[id])?o.npcDifficulty[id]:'normal'])),order:[],turn:0,round:1,roundLimit,startSelection:o.startSelection??'rules',scores:{},winners:[],losers:[],paused:false};reset(s);return s;}
export const ticPositionKey=s=>JSON.stringify([s.board,s.order[s.turn],s.extreme?s.forcedBoard:null,s.extreme?s.subWinners:null,s.extreme?s.closedBoards:null,s.variant==='vanishing'?s.order.map(id=>s.extreme?Array.from({length:9},(_,b)=>localPieces(s,id,b)):s.pieceOrder[id]):null]);
function endRound(s,winner,reason=null){s.roundWinner=winner;s.roundDrawReason=reason;if(winner)s.scores[winner]++;if(s.round>=s.roundLimit){s.phase='finished';const best=Math.max(...Object.values(s.scores));s.winners=s.players.filter(p=>s.scores[p]===best);s.losers=s.players.filter(p=>!s.winners.includes(p));s.draw=s.winners.length===2;}else s.phase='roundEnd';}
export function ticLegalMoves(s,id=s?.order?.[s.turn]){if(!s||s.phase!=='playing'||s.paused||s.order[s.turn]!==id)return [];const moves=[];for(let index=0;index<s.board.length;index++)if(!s.board[index]){
 const board=area(s,index);if(s.extreme&&(s.closedBoards[board]||s.forcedBoard!==null&&s.forcedBoard!==board))continue;
 const pieces=localPieces(s,id,board);if(s.variant==='moving'&&pieces.length>=3){for(const from of pieces)moves.push({index,from});}else moves.push({index});
 }return moves;}
export function actTic(old,id,action,args={},gm=false){check(old,'No game exists.');const s=structuredClone(old);s.variant??='classic';s.extreme??=false;s.revision++;const admin=()=>check(gm,'GM only.');
 if(action==='abort'){admin();s.phase='aborted';s.winners=[];s.losers=[];return s;}
 if(action==='pause'){admin();s.paused=!s.paused;return s;}
 if(action==='npcDifficulty')return setNpcDifficulty(s,args,gm);
 if(action==='npcControl'){admin();check(s.npcs[args.id],'Invalid NPC.');s.npcManual[args.id]=args.manual===true;return s;}
 check(!s.paused,'Game is paused.');
 if(action==='join'){check(s.phase==='lobby'&&!s.players.includes(id)&&s.players.length<2,'Two players required.');s.players.push(id);}
 else if(action==='leave'){check(s.phase==='lobby','Leave in the lobby.');s.players=s.players.filter(p=>p!==id);}
 else if(action==='begin'){admin();check(s.phase==='lobby'&&s.players.length===2,'Two players required.');s.order=startingOrder(s);s.scores=Object.fromEntries(s.players.map(p=>[p,0]));reset(s);s.turn=0;s.phase='playing';if(limited(s))s.repetitions[ticPositionKey(s)]=1;}
 else if(action==='nextRound'){admin();check(s.phase==='roundEnd','Round is not finished.');s.round++;s.order.reverse();s.turn=0;reset(s);s.phase='playing';if(limited(s))s.repetitions[ticPositionKey(s)]=1;}
 else if(action==='place'){
  check(s.phase==='playing'&&s.order[s.turn]===id,'Not your turn.');check(Number.isInteger(args.index)&&args.index>=0&&args.index<s.board.length&&!s.board[args.index],'Choose an empty field.');
  const board=area(s,args.index);if(s.extreme)check(!s.closedBoards[board]&&(s.forcedBoard===null||s.forcedBoard===board),'Play in the highlighted sub-board.');
  if(limited(s)){const queue=s.pieceOrder[id],pieces=localPieces(s,id,board);if(s.variant==='moving'&&pieces.length>=3){check(Number.isInteger(args.from)&&pieces.includes(args.from)&&s.board[args.from]===id,'Select one of your own pieces in this board.');s.board[args.from]=null;queue.splice(queue.indexOf(args.from),1);}queue.push(args.index);if(s.variant==='vanishing'&&pieces.length>=3){s.board[pieces[0]]=null;queue.splice(queue.indexOf(pieces[0]),1);}}
  s.board[args.index]=id;
  if(s.extreme){
   const local=s.board.slice(board*9,board*9+9),line=ticWinningCells(local);
   if(line.length){s.subWinners[board]=id;s.closedBoards[board]=true;s.subLines[board]=line;}else if(local.every(Boolean))s.closedBoards[board]=true;
   s.winningBoards=ticWinningCells(s.subWinners);s.winningCells=s.winningBoards.flatMap(b=>s.subLines[b].map(i=>b*9+i));
   const target=args.index%9;s.forcedBoard=s.closedBoards[target]?null:target;
   if(s.winningBoards.length)endRound(s,id);else if(s.closedBoards.every(Boolean))endRound(s,null,'boardsClosed');
  }else{s.winningCells=ticWinningCells(s.board);if(s.winningCells.length)endRound(s,id);else if(!limited(s)&&s.board.every(Boolean))endRound(s,null,'full');}
  if(s.phase==='playing'){s.turn=1-s.turn;if(limited(s)){const key=ticPositionKey(s);s.repetitions[key]=(s.repetitions[key]??0)+1;if(s.repetitions[key]>=3)endRound(s,null,'repetition');}}
 }else throw Error('Unknown action.');return s;
}
function classicScore(board,actor,mine,other,depth){const wins=ticWinningCells(board);if(wins.length)return board[wins[0]]===mine?10-depth:depth-10;if(board.every(Boolean))return 0;const values=[];for(let i=0;i<9;i++)if(!board[i]){board[i]=actor;values.push(classicScore(board,actor===mine?other:mine,mine,other,depth+1));board[i]=null;}return actor===mine?Math.max(...values):Math.min(...values);}
function potential(board,mine,other){let n=0;for(const line of LINES){const a=line.filter(i=>board[i]===mine).length,b=line.filter(i=>board[i]===other).length;if(a&&b)continue;if(a)n+=[0,1,8,60][a];if(b)n-=[0,1,9,60][b];}return n;}
function evaluate(s,mine,other){if(['finished','roundEnd'].includes(s.phase))return s.roundWinner===mine?100000:s.roundWinner===other?-100000:0;if(!s.extreme)return potential(s.board,mine,other);let n=potential(s.subWinners,mine,other)*200;for(let b=0;b<9;b++){if(s.subWinners[b])n+=s.subWinners[b]===mine?250:-250;else if(!s.closedBoards[b])n+=potential(s.board.slice(b*9,b*9+9),mine,other);}return n;}
export function ticNpc(s,random=secureIndex){if(!s||s.phase!=='playing'||s.paused)return null;const id=s.order[s.turn],other=s.order[1-s.turn];if(!s.npcs[id]||s.npcManual[id])return null;const moves=ticLegalMoves(s);if(!moves.length)return null;
 const level=npcLevel(s,id);
 const scores=moves.map(args=>{const after=actTic(s,id,'place',args),win=after.roundWinner===id;if(level==='easy')return {args,score:0,win};if(level==='normal'){let score=evaluate(after,id,other);if(after.phase==='playing')for(const reply of ticLegalMoves(after)){const response=actTic(after,other,'place',reply);if(response.roundWinner===other){score=-200000;break;}}return {args,score,win};}if(!s.extreme&&(!s.variant||s.variant==='classic')){const b=[...s.board];b[args.index]=id;return {args,score:classicScore(b,other,id,other,0)};}
  const next=actTic(s,id,'place',args);if(next.phase!=='playing')return {args,score:evaluate(next,id,other)};
  // Bounded two-ply search: handle immediate threats without cyclic recursion.
  next.repetitions={};let worst=Infinity;for(const reply of ticLegalMoves(next)){const value=evaluate(actTic(next,other,'place',reply),id,other);worst=Math.min(worst,value);}return {args,score:worst===Infinity?evaluate(next,id,other):worst};
 });
 return {id,action:'place',args:chooseNpc(scores,level,random).args};
}

