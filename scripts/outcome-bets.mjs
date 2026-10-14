import {escapeHTML,gameTitle} from './tavern-text.mjs';
import {f} from './farkle-text.mjs';
const check=(ok,message)=>{if(!ok)throw Error(message);};
const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
export function outcomePlan(game,book){
 const targets=book.market==='loser'?(game.loser?[game.loser]:game.losers??[]):(game.winners??(game.loser?game.players.filter(id=>id!==game.loser):[]));
 const correct=book.bets.filter(b=>targets.includes(b.target)),pot=book.bets.reduce((a,b)=>a+b.amount,0),refund=game.phase==='aborted'||!correct.length;
 const payouts=Object.fromEntries(book.bets.map(b=>[b.id,refund?b.amount:0]));
 if(!refund){const share=Math.floor(pot/correct.length),rest=pot%correct.length;correct.forEach((b,i)=>payouts[b.id]=share+(i<rest?1:0));}
 return {pot,correct:refund?[]:correct.map(b=>b.id),refund,payouts,rounding:!refund&&pot%correct.length>0};
}
export class OutcomeBets{
 constructor(deps){Object.assign(this,deps);this.state={version:1,accounts:{},books:{}};}
 restore(s){check(s===null||s.version===1&&s.accounts&&s.books,'Invalid outcome betting save.');this.state=s?structuredClone(s):{version:1,accounts:{},books:{}};}
 account(id){return this.state.accounts[id]??10000;}
 async persist(next){check(this.isAuthority(),'GM authority changed. Resume with the active GM.');await this.save(next);this.state=next;}
 book(game){return this.state.books[game?.gameId];}
 snapshot(scope,game){const book=this.book(game);return {scope,game:game?{gameId:game.gameId,phase:game.phase,players:[...game.players],npcs:structuredClone(game.npcs??{})}:null,book:structuredClone(book??null),accounts:structuredClone(this.state.accounts),initialGold:100};}
 guard(scope,game,action){
  const book=this.book(game);if(!book)return;if(action==='undo'&&book.plan&&book.bets.length)throw Error('Outcome settlement is final.');
  if(['begin','start','draw','restart'].includes(action)&&book.status==='open')throw Error('Close betting before starting the game.');
  if(['lobby','start','restart'].includes(action)&&['open','closed'].includes(book.status)&&book.bets.length)throw Error('Finish or refund the outcome bets first.');
  if(['join','leave'].includes(action)&&book.bets.length&&['open','closed'].includes(book.status))throw Error('Participants are locked while outcome bets exist.');
 }
 async handle(scope,game,data,user){
  if(data.action==='outcomeRead'){if(this.book(game)?.plan)await this.announceBook(game,this.book(game));return this.snapshot(scope,game);}
  check(this.isAuthority(),'GM authority changed. Resume with the active GM.');check(game?.gameId,'Open a lobby first.');check(data.args?.gameId===game.gameId,'The game state changed. Please try again.');
  let next=structuredClone(this.state),book=next.books[game.gameId];const args=data.args??{};
  if(data.action==='outcomeOpen'){
   check(user.isGM,'GM only.');if(book)return this.snapshot(scope,game);check(game.phase==='lobby'||book,'Open betting before the game starts.');
   if(!book){book={scope,gameId:game.gameId,status:'open',market:scope==='schocken'?'loser':'winner',audience:'all',npcs:{},bets:[],revision:0};next.books[game.gameId]=book;}
  }else{
   check(book,'Open betting first.');check(['outcomePlace','outcomeWithdraw'].includes(data.action)||data.revision===book.revision,'The betting state changed. Please try again.');
   if(data.action==='outcomeConfig'){
    check(user.isGM&&book.status==='open'&&!book.bets.length,'Configure before placing bets.');check(['all','participants','observers'].includes(args.audience)&&['winner','loser'].includes(args.market),'Invalid betting options.');book.audience=args.audience;book.market=args.market;
   }else if(data.action==='outcomeNPC'){
    check(user.isGM&&book.status==='open'&&typeof args.name==='string'&&args.name.trim()&&args.name.length<=60&&Object.keys(book.npcs).length<20,'Invalid NPCs.');book.npcs[`bet-npc-${crypto.randomUUID()}`]=args.name.trim();
   }else if(data.action==='outcomeBalance'){
    const exists=this.user(args.id)||game.npcs?.[args.id]||book.npcs[args.id];check(user.isGM&&exists&&book.status==='open'&&!book.bets.some(b=>b.id===args.id)&&integer(args.amount,0,100000000),'Invalid virtual balance.');next.accounts[args.id]=args.amount;
   }else if(data.action==='outcomePlace'){
    check(book.status==='open'&&game.phase==='lobby','Betting is closed.');check(game.players.length>=((scope==='farkle'&&game.mode==='target'||scope==='lottery')?1:2),'Not enough participants.');const id=user.isGM&&(game.npcs?.[args.id]||book.npcs[args.id])?args.id:user.id;
    const participant=game.players.includes(id);check(book.audience==='all'||book.audience==='participants'&&participant||book.audience==='observers'&&!participant,'You may not bet in this game.');
    check(!book.bets.some(b=>b.id===id),'One outcome bet per bettor.');check(game.players.includes(args.target)&&integer(args.amount,1,100000000),'Invalid outcome bet.');const balance=next.accounts[id]??10000;check(balance>=args.amount,'Not enough virtual gold.');next.accounts[id]=balance-args.amount;book.bets.push({id,target:args.target,amount:args.amount,name:this.user(id)?.name??game.npcs?.[id]??book.npcs[id]??id});
   }else if(data.action==='outcomeWithdraw'){
    check(book.status==='open'&&game.phase==='lobby','Betting is closed.');const id=user.isGM&&(game.npcs?.[args.id]||book.npcs[args.id])?args.id:user.id,index=book.bets.findIndex(b=>b.id===id);check(index>=0,'No outcome bet to withdraw.');next.accounts[id]=(next.accounts[id]??10000)+book.bets[index].amount;book.bets.splice(index,1);
   }else if(data.action==='outcomeClose'){
    check(user.isGM&&book.status==='open'&&game.phase==='lobby','GM only.');book.status='closed';
   }else if(data.action==='outcomeCancel'){
    check(user.isGM&&game.phase==='lobby'&&['open','closed'].includes(book.status),'Cancel bets before starting.');for(const b of book.bets)next.accounts[b.id]=(next.accounts[b.id]??10000)+b.amount;book.status='refunded';book.plan={refund:true,pot:book.bets.reduce((a,b)=>a+b.amount,0),payouts:Object.fromEntries(book.bets.map(b=>[b.id,b.amount])),correct:[]};
   }else throw Error('Unknown action.');
  }
  book.revision++;await this.persist(next);if(book.status==='refunded')await this.announceBook(game,book);return this.snapshot(scope,game);
 }
 async observe(scope,game){
  const book=this.book(game);if(!book||!['finished','aborted'].includes(game.phase))return;
  if(['open','closed'].includes(book.status)){
   const next=structuredClone(this.state),updated=next.books[game.gameId],plan=outcomePlan(game,book);updated.plan=plan;updated.status=plan.refund?'refunded':'settled';updated.revision++;
   for(const [id,amount] of Object.entries(plan.payouts))next.accounts[id]=(next.accounts[id]??10000)+amount;await this.persist(next);
  }
  await this.announceBook(game,this.book(game));
 }
 async announceBook(game,book){
  if(!book?.plan||this.hasAnnouncement(book.gameId))return;
  const plan=book.plan,title=plan.refund?f('Wetten zurückgezahlt','Bets refunded'):f('Wetten ausgewertet','Bets settled');
  const content=`<h2>${title} · ${escapeHTML(gameTitle(book.scope))}</h2><p>${f('Interne Goldstände; keine Charakterbuchung.','Internal gold only; no character transaction.')}</p><p>${f('Topf','Pot')}: ${plan.pot/100} ${f('Gold','gold')}</p><ul>${book.bets.map(b=>`<li>${escapeHTML(b.name)} · ${f('Tipp','Prediction')}: ${escapeHTML(game.npcs?.[b.target]??this.user(b.target)?.name??b.target)}${plan.correct?.includes(b.id)?' ✓':''} · ${f('Einsatz','Stake')} ${b.amount/100}, ${f('Auszahlung','Payout')} ${(plan.payouts[b.id]??0)/100} ${f('Gold','gold')}</li>`).join('')}</ul>${plan.rounding?`<p>${f('Unteilbare Kupferreste nach Reihenfolge der Wettabgabe verteilt.','Indivisible copper remainders allocated in betting order.')}</p>`:''}`;
  try{await this.announce({content,flags:{taverngames:{outcomeBet:book.gameId}}});}catch(e){globalThis.ui?.notifications?.warn(e.message);}
 }
}
