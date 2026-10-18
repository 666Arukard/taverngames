import {startingOrder,chosenStarter} from './start-choice.mjs';
// Independent implementation of the rules described by TZawalich, extended
// with Daniel's elimination and remainder rules. No upstream code copied.
export const BETA_GAMES=['liars','hoard'];
const check=(ok,message)=>{if(!ok)throw new Error(message);};
const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
export const activePlayers=s=>s.players.filter(id=>!s.out.includes(id));
const roll=(random,sides)=>{const n=random(sides);check(integer(n,1,sides),'Invalid random value.');return n;};
export function createBetaGame(game,{npcs={},hoardMode='tokens',initialCoins=30,entryAmount=2,currency='gp'}={}){
 check(BETA_GAMES.includes(game),'Unknown game.');check(npcs&&typeof npcs==='object'&&!Array.isArray(npcs)&&Object.keys(npcs).length<=20,'Invalid NPCs.');
 for(const [id,name] of Object.entries(npcs))check(id.startsWith('npc-')&&typeof name==='string'&&name.trim()&&name.length<=60,'Invalid NPCs.');
 check(['tokens','gambler'].includes(hoardMode)&&integer(initialCoins,1,100000)&&integer(entryAmount,0,100000)&&['token','cp','sp','ep','gp','pp'].includes(currency),'Invalid virtual coin settings.');
 const players=Object.keys(npcs);
 return {version:1,game,phase:'lobby',revision:0,paused:false,npcs:structuredClone(npcs),npcManual:{},players,out:[],order:[],turn:0,round:1,log:[],scores:{},counts:{},hands:{},bid:null,reveal:null,hoardMode,initialCoins,entryAmount,currency,startAmounts:Object.fromEntries(players.map(id=>[id,initialCoins])),balances:{},board:Array(9).fill(0),pending:null,contest:null,payouts:null};
}
function finish(s,reason){s.phase='finished';s.reason=reason;if(s.game==='hoard'&&reason==='early'){s.winners=[];s.losers=[];s.scores=structuredClone(s.balances);return;}const alive=activePlayers(s);s.winners=s.game==='liars'?alive:s.players.filter(id=>s.balances[id]===Math.max(...Object.values(s.balances)));s.losers=s.players.filter(id=>!s.winners.includes(id));s.scores=structuredClone(s.game==='liars'?s.counts:s.balances);}
function nextTurn(s){const ids=activePlayers(s);s.turn=(s.turn+1)%s.order.length;while(!ids.includes(s.order[s.turn]))s.turn=(s.turn+1)%s.order.length;if(s.game==='hoard'&&s.turn===0)s.round++;}
function newLiarsRound(s,starter){s.phase='rolling';s.hands={};s.bid=null;s.reveal=null;s.turn=s.order.indexOf(starter);}
function newContest(s,remaining,kind){const eligible=activePlayers(s);s.contest={kind,remaining,eligible,entrants:[...eligible],guesses:{},awarded:[]};s.phase='contest';}
function calculatePayouts(s){
 if(s.hoardMode==='gambler'){s.payouts=structuredClone(s.balances);finish(s,'early');return;}
 const pool=s.players.length*s.entryAmount*({token:1,cp:1,sp:10,ep:50,gp:100,pp:1000})[s.currency],total=Object.values(s.balances).reduce((a,b)=>a+b,0);
 s.payouts=Object.fromEntries(s.players.map(id=>[id,Math.floor(pool*s.balances[id]/total)]));const rest=pool-Object.values(s.payouts).reduce((a,b)=>a+b,0);
 if(rest)newContest(s,rest,'payout');else finish(s,'early');
}
function checkLast(s){const alive=activePlayers(s);if(alive.length!==1)return false;const id=alive[0];s.balances[id]+=s.board.reduce((a,b)=>a+b,0);s.board.fill(0);
 if(s.hoardMode==='tokens'){s.payouts=Object.fromEntries(s.players.map(pid=>[pid,pid===id?s.players.length*s.entryAmount*({token:1,cp:1,sp:10,ep:50,gp:100,pp:1000})[s.currency]:0]));}else s.payouts=structuredClone(s.balances);
 finish(s,'last');return true;
}
export function actBetaGame(original,actor,action,args={},random=()=>1,gm=false){
 const s=structuredClone(original);check(s?.version===1&&BETA_GAMES.includes(s.game),'No game exists.');check(!['finished','aborted'].includes(s.phase),'This game has ended.');
 if(action==='abort'){check(gm,'GM only.');s.phase='aborted';s.paused=true;s.hands={};s.payouts=null;}
 else if(action==='pause'){check(gm,'GM only.');s.paused=!s.paused;}
 else if(action==='npcControl'){check(gm&&Object.hasOwn(s.npcs,args.id)&&typeof args.manual==='boolean','GM only.');s.npcManual[args.id]=args.manual;}
 else if(action==='join'||action==='leave'){
  check(s.phase==='lobby'&&!s.paused,'Join in the lobby.');check(typeof actor==='string'&&!actor.startsWith('npc-')&&actor.length<=64,'Invalid participant.');
  if(action==='join'){check(!s.players.includes(actor)&&s.players.length<20,'Invalid participant.');s.players.push(actor);s.startAmounts[actor]=s.initialCoins;}
  else{check(s.players.includes(actor),'Invalid participant.');s.players=s.players.filter(id=>id!==actor);delete s.startAmounts[actor];}
 }else if(action==='setBalance'){
  check(gm&&s.game==='hoard'&&s.hoardMode==='gambler'&&s.phase==='lobby'&&s.players.includes(args.id)&&integer(args.amount,1,100000),'Invalid starting balance.');s.startAmounts[args.id]=args.amount;
 }else if(action==='begin'){
  check(gm&&s.phase==='lobby'&&!s.paused,'GM only.');check(s.players.length>=2,'Not enough participants.');s.order=startingOrder(s);s.turn=0;
  if(s.game==='liars'){s.counts=Object.fromEntries(s.players.map(id=>[id,5]));newLiarsRound(s,s.order[0]);}
  else{s.balances=Object.fromEntries(s.players.map(id=>[id,s.hoardMode==='tokens'?s.initialCoins:s.startAmounts[id]]));s.phase='playing';}
 }else{
  check(!s.paused,'The game is not running.');const current=s.order[s.turn],isTurn=()=>check(actor===current||gm,'It is not your turn.');
  if(s.game==='liars'){
   if(action==='roll'){
    check(s.phase==='rolling'&&activePlayers(s).includes(actor)&&!s.hands[actor],'Roll once per round.');s.hands[actor]=Array.from({length:s.counts[actor]},()=>roll(random,6));if(activePlayers(s).every(id=>s.hands[id]))s.phase='bidding';
   }else if(action==='bid'){
    check(s.phase==='bidding','The game is not running.');isTurn();const total=Object.values(s.counts).reduce((a,b)=>a+b,0);
    check(integer(args.amount,1,total)&&integer(args.face,1,6),'Invalid bid.');check(!s.bid||args.amount>s.bid.amount||args.amount===s.bid.amount&&args.face>s.bid.face,'Bid is too low.');s.bid={id:current,amount:args.amount,face:args.face};nextTurn(s);
   }else if(action==='challenge'){
    check(s.phase==='bidding'&&s.bid,'No bid to challenge.');isTurn();const hits=Object.values(s.hands).flat().filter(n=>n===s.bid.face||n===1).length,loser=hits>=s.bid.amount?current:s.bid.id;
    s.reveal={hands:structuredClone(s.hands),bid:structuredClone(s.bid),challenger:current,hits,matching:Object.values(s.hands).flat().filter(n=>n===s.bid.face).length,wild:s.bid.face===1?0:Object.values(s.hands).flat().filter(n=>n===1).length,loser};s.counts[loser]--;if(s.counts[loser]===0)s.out.push(loser);
    if(activePlayers(s).length===1)finish(s,'last');else{const index=s.order.indexOf(loser);let starter=loser;if(s.out.includes(loser)){let i=index;do{i=(i+1)%s.order.length;}while(s.out.includes(s.order[i]));starter=s.order[i];}s.turn=s.order.indexOf(starter);s.phase='reveal';}
   }else if(action==='next'){check(s.phase==='reveal','No round to continue.');isTurn();s.round++;newLiarsRound(s,current);}
   else throw new Error('Unknown action.');
  }else if(action==='finish'){
   check(gm&&s.phase==='playing','Finish after the pending move.');const alive=activePlayers(s),sum=s.board.reduce((a,b)=>a+b,0),share=Math.floor(sum/alive.length);for(const id of alive)s.balances[id]+=share;s.board.fill(0);s.endRequested=true;
   if(sum%alive.length)newContest(s,sum%alive.length,'board');else calculatePayouts(s);
  }else if(action==='roll'){
   check(s.phase==='playing','The game is not running.');isTurn();const dice=[roll(random,6),roll(random,6)],sum=dice[0]+dice[1];s.lastRoll={id:current,dice,sum};
   if(sum===12){s.balances[current]+=s.board.reduce((a,b)=>a+b,0);s.board.fill(0);nextTurn(s);}
   else if(sum!==2&&s.board[sum-3]>=3){s.balances[current]+=s.board[sum-3];s.board[sum-3]=0;nextTurn(s);}
   else{const due=sum===2?9:1;if(s.balances[current]<due){s.pending={id:current,amount:s.balances[current],due};s.phase='allocate';if(s.pending.amount===0){s.out.push(current);s.pending=null;if(!checkLast(s)){s.phase='playing';nextTurn(s);}}}
    else{s.balances[current]-=due;if(sum===2)s.board=s.board.map(n=>n+1);else s.board[sum-3]++;nextTurn(s);}}
  }else if(action==='allocate'){
   check(s.phase==='allocate','No partial payment.');isTurn();check(Array.isArray(args.coins)&&args.coins.length===9&&args.coins.every(n=>integer(n,0,s.pending.amount))&&args.coins.reduce((a,b)=>a+b,0)===s.pending.amount,'Distribute all remaining coins.');
   s.board=s.board.map((n,i)=>n+args.coins[i]);s.balances[current]=0;s.out.push(current);s.pending=null;if(!checkLast(s)){s.phase='playing';nextTurn(s);}
  }else if(action==='guess'){
   const c=s.contest;check(s.phase==='contest'&&c.entrants.includes(actor)&&!Object.hasOwn(c.guesses,actor),'Invalid guess.');const sides=c.eligible.length<=6?6:c.eligible.length<=10?10:20;check(integer(args.value,1,sides),'Invalid guess.');c.guesses[actor]=args.value;
  }else if(action==='resolveGuess'){
   const c=s.contest;check(gm&&s.phase==='contest'&&c.entrants.every(id=>Object.hasOwn(c.guesses,id)),'All guesses are required.');const sides=c.eligible.length<=6?6:c.eligible.length<=10?10:20,value=roll(random,sides),distance=Math.min(...Object.values(c.guesses).map(n=>Math.abs(n-value))),closest=c.entrants.filter(id=>Math.abs(c.guesses[id]-value)===distance);
   s.lastContest={value,sides,guesses:structuredClone(c.guesses),closest};c.guesses={};if(closest.length>1)c.entrants=closest;
   else{const id=closest[0];if(c.kind==='board')s.balances[id]++;else s.payouts[id]++;c.remaining--;c.awarded.push(id);
    if(c.remaining)c.entrants=c.eligible.filter(id=>!c.awarded.includes(id));else{const kind=c.kind;s.contest=null;if(kind==='board')calculatePayouts(s);else finish(s,'early');}}
  }else throw new Error('Unknown action.');
 }
 s.revision++;return s;
}
export function betaView(s,user){
 if(!s)return null;const v=structuredClone(s);
 v.hands=Object.fromEntries(Object.entries(v.hands).filter(([id])=>id===user.id||user.isGM&&v.npcs[id]&&v.npcManual[id]));
 v.rolled=Object.keys(s.hands);if(v.contest){v.contest.submitted=Object.keys(v.contest.guesses);v.contest.guesses=Object.fromEntries(Object.entries(v.contest.guesses).filter(([id])=>id===user.id||user.isGM&&v.npcs[id]&&v.npcManual[id]));}
 return v;
}
export function betaNpcAction(s,random=()=>1){
 if(!s||s.paused||['lobby','finished','aborted'].includes(s.phase))return null;const automatic=id=>!!s.npcs[id]&&!s.npcManual[id];
 if(s.game==='liars'&&s.phase==='rolling'){const id=activePlayers(s).find(id=>automatic(id)&&!s.hands[id]);return id?{id,action:'roll'}:null;}
 if(s.phase==='contest'){const id=s.contest.entrants.find(id=>automatic(id)&&!Object.hasOwn(s.contest.guesses,id));return id?{id,action:'guess',args:{value:roll(random,s.contest.eligible.length<=6?6:s.contest.eligible.length<=10?10:20)}}:null;}
 const id=s.order[s.turn];if(!automatic(id))return null;
 if(s.game==='hoard'){if(s.phase==='playing')return {id,action:'roll'};if(s.phase==='allocate'){const coins=Array(9).fill(0);for(let i=0;i<s.pending.amount;i++)coins[(i+4)%9]++;return {id,action:'allocate',args:{coins}};}return null;}
 if(s.phase==='reveal')return {id,action:'next'};
 // Strategy only sees own cup, public dice counts and public bid.
 const own=s.hands[id]??[],total=Object.values(s.counts).reduce((a,b)=>a+b,0),unknown=total-own.length;
 const expected=face=>own.filter(n=>n===face||n===1).length+unknown*(face===1?1/6:1/3);
 if(s.bid&&s.bid.amount>expected(s.bid.face)+0.5)return {id,action:'challenge'};
 const choices=[];for(let face=1;face<=6;face++){const amount=s.bid?(face>s.bid.face?s.bid.amount:s.bid.amount+1):1;if(amount<=total)choices.push({amount,face,margin:expected(face)-amount});}
 choices.sort((a,b)=>b.margin-a.margin);if(!choices.length)return {id,action:'challenge'};const best=choices[0];if(s.bid&&best.margin<-0.75)return {id,action:'challenge'};return {id,action:'bid',args:{amount:best.amount,face:best.face}};
}
