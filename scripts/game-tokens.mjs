import {continuesRound} from './continuous-play.mjs';
import {prizeShares} from './wagers.mjs';
import {allocate,choBankShortfall} from './chohan.mjs';
import {seventeenBankShortfall} from './seventeen-engine.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
const whole=(n,max=1000000)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
export const ended=s=>['finished','aborted'].includes(s?.phase);
const total=rows=>Object.values(rows??{}).reduce((a,b)=>a+b,0);
export function tokenBook(){return {version:1,mode:'none',config:{stake:1,min:1,max:100,initial:100,bank:1000,funding:'redistribute'},balances:{},reserved:{},bank:1000,house:0,started:false,status:'lobby',carry:false,mapping:{},bets:null,summary:null};}
const betsHeld=(e,id)=>['open','closed'].includes(e.bets?.status)?e.bets.bets.filter(b=>b.id===id).reduce((n,b)=>n+b.amount,0):0;
export const availableTokens=(e,id)=>(e.balances[id]??0)-(e.reserved[id]??0)-betsHeld(e,id);
const setReserve=(e,id,n)=>{check(whole(n,1000000000),'Invalid token amount.');e.reserved[id]=n;check(availableTokens(e,id)>=0,'Not enough game tokens.');};
export function bankShortfall(scope,s){const e=s?.economy;if(e?.mode!=='tokens'||ended(s))return 0;if(scope==='lucky')return Math.max(0,s.players.reduce((n,id)=>n+(s.stakes[id]??0),0)-e.bank);if(scope==='seventeen')return seventeenBankShortfall(s);if(scope==='chohan')return choBankShortfall(s);if(scope==='pig'&&e.config.funding==='bank'){const state={...s,scores:Object.fromEntries(s.players.map(id=>[id,0]))};return Math.max(0,total(prizeShares(state,e.config.stake,'bank'))-s.players.length*e.config.stake-e.bank);}return 0;}
export function tokenSnapshot(scope,s){if(!s)return {scope,game:null,economy:null};return {scope,game:{gameId:s.gameId,revision:s.revision,phase:s.phase,players:[...s.players],npcs:structuredClone(s.npcs??{}),variant:s.variant,seriesId:s.seriesId,seriesRound:s.seriesRound,seriesClosed:s.seriesClosed},economy:structuredClone(s.economy??tokenBook()),bankShortfall:bankShortfall(scope,s)};}
function nativeSetup(s,scope,e){
 if(scope==='seventeen'){
  s.currency='token';s.variableStakes=true;s.minStake={amount:e.mode==='tokens'?e.config.min:1,currency:'token',cp:e.mode==='tokens'?e.config.min:1};s.maxStake={amount:e.mode==='tokens'?e.config.max:1,currency:'token',cp:e.mode==='tokens'?e.config.max:1};
  s.bankFunds=e.config.bank;s.bankBalance=e.bank;s.bankDebt=Math.max(0,-e.bank);s.stakes??={};
  for(const id of s.players){if(e.mode==='none')s.stakes[id]={amount:1,currency:'token',cp:1};else if(s.stakes[id]?.currency!=='token')s.stakes[id]=s.npcs[id]?{...s.minStake}:null;}
 }
 if(scope==='chohan'){
  s.currency='token';s.unit=1;s.bank=e.bank;s.bankFunds=e.config.bank;s.bankDebt=Math.max(0,-e.bank);s.minStake=e.mode==='tokens'?e.config.min:1;s.maxStake=e.mode==='tokens'?e.config.max:1;
  for(const id of s.players)s.balances[id]=e.mode==='tokens'?availableTokens(e,id):1000000;
 }
 if(scope==='hoard'){s.currency='token';s.entryAmount=e.mode==='tokens'?e.config.stake:0;}
 if(['pig','ship','lottery'].includes(scope)){s.currency='token';s.stake=e.mode==='tokens'?e.config.stake:0;s.funding=e.config.funding;}
}
export function tokenAction(scope,original,action,args,user,{users=[]}={}){
 check(original?.gameId,'Open a lobby first.');check(args.gameId===original.gameId&&args.revision===original.revision,'The game state changed. Please try again.');
 const s=structuredClone(original),e=s.economy??=tokenBook();
 const gm=()=>check(user.isGM,'GM only.');const lobby=()=>check(s.phase==='lobby'&&!e.started&&!s.paused&&!total(e.reserved)&&!e.bets?.bets.length&&!s.tickets?.length,'Configure before committing stakes.');
 if(action==='tokenConfig'){
  gm();lobby();check(['none','tokens'].includes(args.mode),'Invalid token mode.');
  for(const k of ['stake','min','max','initial','bank'])check(whole(args[k]),'Invalid token amount.');check(args.min>=1&&args.max>=args.min&&['bank','redistribute'].includes(args.funding),'Invalid token limits.');
  if(['aalstechen','poker','thirteen','kings'].includes(scope)&&args.mode==='tokens')check(args.stake>0,'Choose a positive buy-in.');
  if(scope==='chohan')check(args.max<=10000,'Maximum token stake is 10000 for Cho-Han.');if(scope==='hoard')check(args.stake<=100000,'Maximum entry is 100000 tokens.');
  const oldMode=e.mode,limitsChanged=e.config.min!==args.min||e.config.max!==args.max;
  e.mode=args.mode;e.config=Object.fromEntries(['stake','min','max','initial','bank','funding'].map(k=>[k,args[k]]));e.bank=args.bank;
  for(const id of s.players)e.balances[id]??=args.initial;
  if(scope==='seventeen'&&e.mode==='tokens')for(const id of s.players){if(!s.npcs[id]&&(oldMode!=='tokens'||limitsChanged))s.stakes[id]=null;else if(s.npcs[id]&&(!s.stakes[id]||s.stakes[id].cp<args.min||s.stakes[id].cp>args.max))s.stakes[id]={amount:args.min,cp:args.min,currency:'token'};}
  nativeSetup(s,scope,e);
 }else if(action==='tokenGrant'){
  gm();check(!ended(s)&&e.mode==='tokens','Configure before the game ends.');check(users.includes(args.id)||s.npcs?.[args.id]||e.bets?.npcs?.[args.id],'Invalid participant.');check(whole(args.amount,1000000000),'Invalid token amount.');const before=e.balances[args.id]??0;e.balances[args.id]=args.amount;check(availableTokens(e,args.id)>=0,'Committed tokens cannot be removed.');e.adjustments??=[];e.adjustments.push({id:args.id,before,after:args.amount,by:user.id,revision:s.revision+1});e.adjustments=e.adjustments.slice(-100);nativeSetup(s,scope,e);
 }else if(action==='tokenAllocateAll'){gm();check(s.phase==='lobby'&&e.mode==='tokens','Configure in the lobby.');check(whole(args.amount),'Invalid token amount.');e.config.initial=args.amount;for(const id of s.players){e.balances[id]=args.amount;check(availableTokens(e,id)>=0,'Committed tokens cannot be removed.');}nativeSetup(s,scope,e);
 }else if(action==='tokenMapping'){gm();check(typeof args.actorId==='string'&&s.players.includes(args.id),'Invalid participant.');e.mapping[args.id]=args.actorId;
 }else if(action==='tokenCarry'){gm();check(ended(s)&&!e.discarded,'Finish the game first.');e.carry=args.enabled===true;
 }else if(action==='tokenDiscard'){
  gm();check(ended(s)&&!s.carry,'Refund the carried pot first.');check(!s.seriesId||s.seriesClosed,'End the session before discarding tokens.');e.balances={};e.reserved={};e.bank=0;e.carry=false;e.discarded=true;
 }else{
  check(e.mode==='tokens','Enable game tokens first.');let b=e.bets;
  if(action==='tokenBetOpen'){gm();check(s.phase==='lobby'&&!e.started&&!b,'Open betting before the game starts.');b=e.bets={status:'open',audience:'all',market:scope==='schocken'?'loser':'winner',npcs:{},bets:[]};}
  else {check(b,'Open betting first.');
   if(action==='tokenBetConfig'){gm();check(b.status==='open'&&!b.bets.length&&['all','participants','observers'].includes(args.audience)&&['winner','loser'].includes(args.market),'Invalid betting options.');b.audience=args.audience;b.market=args.market;}
   else if(action==='tokenBetNPC'){gm();check(b.status==='open'&&typeof args.name==='string'&&args.name.trim()&&args.name.length<=60&&Object.keys(b.npcs).length<20,'Invalid NPCs.');const id='bet-npc-'+crypto.randomUUID();b.npcs[id]=args.name.trim();e.balances[id]=e.config.initial;}
   else if(action==='tokenBetPlace'||action==='tokenBetWithdraw'){
    check(s.phase==='lobby'&&b.status==='open'&&!s.paused,'Betting is closed.');const id=user.isGM&&(s.npcs?.[args.id]||b.npcs[args.id])?args.id:user.id;
    if(action==='tokenBetWithdraw'){check(b.bets.some(row=>row.id===id),'No bet to withdraw.');b.bets=b.bets.filter(row=>row.id!==id);}
    else{const participant=s.players.includes(id);check(b.audience==='all'||b.audience==='participants'&&participant||b.audience==='observers'&&!participant,'You may not bet in this game.');check(!b.bets.some(row=>row.id===id)&&s.players.includes(args.target)&&whole(args.amount)&&args.amount>0,'Invalid outcome bet.');check(availableTokens(e,id)>=args.amount,'Not enough game tokens.');b.bets.push({id,target:args.target,amount:args.amount});}
   }else if(action==='tokenBetClose'){gm();check(b.status==='open'&&s.phase==='lobby','GM only.');b.status='closed';}
   else if(action==='tokenBetCancel'){gm();check(s.phase==='lobby'&&['open','closed'].includes(b.status),'Betting is closed.');b.status='refunded';b.payouts=Object.fromEntries(b.bets.map(row=>[row.id,row.amount]));}
   else throw Error('Unknown action.');
  }
  nativeSetup(s,scope,e);
 }
 if(scope==='thirteen')check(total(e.balances)+(s.pot??0)<=1000000000,'Token pool is too large.');
 s.revision++;return s;
}
export function tokenGuard(scope,s,action){const e=s?.economy;if(!e)return;
 if(action==='undo'&&(e.summary||e.bets?.plan))throw Error('Token settlement is final.');
 if(['join','leave'].includes(action)&&e.bets?.bets.length&&['open','closed'].includes(e.bets.status))throw Error('Participants are locked while outcome bets exist.');
 if(['begin','start'].includes(action)&&e.bets?.status==='open')throw Error('Close betting before starting the game.');
 if(['lobby','start','restart'].includes(action)&&!ended(s)&&(e.started||total(e.reserved)||e.bets?.bets.length))throw Error('Finish or end the current game first.');
 if(['restart','lobby','start'].includes(action)&&s.carry&&!e.carry)throw Error('Carry tokens to the next game or refund the carried pot first.');
}
// Called before the existing encrypted game save: game and money commit together.
export function prepareTokenState(s,old,scope){
 const same=old?.gameId===s.gameId&&!!s.gameId,prior=old?.economy;
 if(!same){
  if(prior&&!ended(old)&&(prior.started||total(prior.reserved)||prior.bets?.bets.length))throw Error('Finish or end the current game first.');
  const carry=ended(old)&&(prior?.carry||continuesRound(s,old))&&!prior?.discarded;check(!old?.carry||carry||!prior,'Carry tokens or refund the carried pot first.');{
   s.economy=tokenBook();if(carry){Object.assign(s.economy,{mode:prior.mode,config:structuredClone(prior.config),balances:structuredClone(prior.balances),bank:prior.bank,house:prior.house,mapping:structuredClone(prior.mapping),carryContrib:structuredClone(prior.carryContrib??{})});}
  }
 }else s.economy=structuredClone(s.economy??prior??tokenBook());
 const e=s.economy;
 // Old running saves continue without retroactive entry charges.
 if(!prior&&same&&!['lobby'].includes(old.phase)){e.started=true;e.legacy=true;}
 if(e.mode==='tokens')for(const id of s.players)e.balances[id]??=e.config.initial;
 if(s.phase==='lobby'&&scope==='seventeen'&&e.mode==='tokens')for(const id of s.players){const bet=s.stakes?.[id];if(s.npcs?.[id]&&s.npcRisk?.[id]&&s.npcRisk[id]!=='manual'&&bet&&bet.cp>availableTokens(e,id)){const amount=availableTokens(e,id);s.stakes[id]=amount>=e.config.min?{amount,cp:amount,currency:'token'}:null;}}
 if(!same||s.phase==='lobby'&&old?.phase==='lobby')nativeSetup(s,scope,e);
 if(e.mode==='none'){
  if(scope==='chohan'&&!same){s.carry=0;s.carryContrib={};}
  return s;
 }
 if(!e.started&&old?.phase==='lobby'&&s.phase!=='lobby'&&(!ended(s)||scope==='swim'&&s.phase==='finished')||!same&&s.phase!=='lobby'&&!ended(s)){
  check(e.bets?.status!=='open','Close betting before starting the game.');e.playersAtStart=[...s.players];e.started=true;e.status='playing';
  for(const id of s.players){let amount=e.config.stake;
   if(scope==='schocken')amount=s.players.length*e.config.stake;
   else if(scope==='thirteen'||scope==='lottery'||scope==='chohan'||['meiern','klippklapp'].includes(scope)||['aalstechen','poker','kings'].includes(scope))continue;
   else if(scope==='lucky')amount=s.stakes[id];
   else if(scope==='seventeen'){const bet=s.stakes[id];check(bet?.currency==='token','Choose a token stake first.');amount=bet.cp;}
   else if(scope==='hoard'&&s.hoardMode==='gambler')amount=s.startAmounts[id];
   setReserve(e,id,amount);
  }
 }
 if(scope==='lucky'&&e.started&&!ended(s))for(const id of s.players)setReserve(e,id,s.stakes[id]);
 if(scope==='lottery'&&!ended(s))for(const id of s.players)setReserve(e,id,s.tickets.filter(t=>t.id===id).length*e.config.stake);
 if(scope==='chohan'&&!ended(s))for(const id of s.players)setReserve(e,id,s.bets.filter(b=>b.id===id).reduce((n,b)=>n+(b.accepted??b.amount),0));
 if(['aalstechen','poker','kings'].includes(scope)&&e.started&&!ended(s))for(const id of s.players)setReserve(e,id,s.contributions[id]??0);
 if(['meiern','klippklapp'].includes(scope)&&e.started){
  const r=s.resolution;if(r&&r.round>(e.meiernPaidRound??0)){
   e.meiernPaid??={};e.meiernReceived??={};
   for(const p of r.payments){const n=p.multiplier*e.config.stake;check((e.reserved[p.from]??0)>=n,'Not enough game tokens.');e.balances[p.from]-=n;e.balances[p.to]+=n;check(whole(e.balances[p.from],1000000000)&&whole(e.balances[p.to],1000000000),'Invalid token settlement.');e.meiernPaid[p.from]=(e.meiernPaid[p.from]??0)+n;e.meiernReceived[p.to]=(e.meiernReceived[p.to]??0)+n;}e.meiernPaidRound=r.round;e.reserved={};
  }
  if(!ended(s)&&s.phase!=='reveal')for(const id of s.players)setReserve(e,id,s.out.includes(id)?0:(scope==='klippklapp'?1:2)*e.config.stake);
 }
 if(ended(s)&&(!e.summary||s.phase==='aborted'&&old?.phase==='finished'&&old.carry))settle(s,scope,e);
 if(scope==='chohan'&&!ended(s))for(const id of s.players)s.balances[id]=availableTokens(e,id);
 return s;
}
function settle(s,scope,e){
 const ids=e.playersAtStart??s.players,stakes=structuredClone(scope==='lucky'?s.stakes:scope==='thirteen'?s.paid:['meiern','klippklapp'].includes(scope)?e.meiernPaid??{}:['aalstechen','poker','kings'].includes(scope)?s.contributions:e.reserved),payouts=Object.fromEntries(ids.map(id=>[id,0]));let bankDelta=0;const carryRefund={};
 if(scope==='thirteen'){Object.assign(payouts,s.received??{});}
 else if(['meiern','klippklapp'].includes(scope)){Object.assign(payouts,e.meiernReceived??{});}
 else if(s.phase==='aborted'){for(const id of ids)payouts[id]=stakes[id]??0;
  if(scope==='chohan'&&s.carry===0)for(const [id,n]of Object.entries(e.carryContrib??{})){e.balances[id]=(e.balances[id]??0)+n;carryRefund[id]=n;}e.carryContrib={};
 }else if(scope==='durak'){
  if(s.draw){for(const id of ids)payouts[id]=stakes[id]??0;}
  else {const ranking=s.ranking,weights=ranking.map((_id,i)=>Math.max(0,ranking.length-1-i)),denom=weights.reduce((n,w)=>n+w,0),pot=total(stakes);let remainder=pot;ranking.forEach((id,i)=>{payouts[id]=Number(BigInt(pot)*BigInt(weights[i])/BigInt(denom));remainder-=payouts[id];});for(let i=0;remainder>0;i++,remainder--)payouts[ranking[i%Math.max(1,ranking.length-1)]]++;}
 }else if(scope==='schocken'){
  for(const id of ids)payouts[id]=(stakes[id]??0)+(id===s.loser?-(ids.length-1)*e.config.stake:e.config.stake);
 }else if(scope==='lucky'){for(const id of ids)payouts[id]=s.settlements[id]?.payout??0;bankDelta=total(stakes)-total(payouts);
 }else if(scope==='seventeen'){
  for(const id of ids)payouts[id]=s.settlements[id].payoutCp;
  bankDelta=total(stakes)-total(payouts);
 }else if(scope==='chohan'){
  for(const id of ids)payouts[id]=s.bets.find(b=>b.id===id)?.payout??0;
  if(['A','C'].includes(s.variant))bankDelta=total(stakes)-total(payouts);
  else e.house+=s.fee??0;
  e.carryContrib=structuredClone(s.carryContrib??{});
 }else if(scope==='hoard'){
  if(s.hoardMode==='gambler'){for(const id of ids)payouts[id]=s.balances[id]??0;}
  else if(s.payouts){for(const id of ids)payouts[id]=s.payouts[id]??0;}
  else {const values=allocate(total(stakes),ids.map(id=>s.balances[id]??0));ids.forEach((id,i)=>payouts[id]=values[i]);}
 }else if(['aalstechen','poker','kings'].includes(scope)){Object.assign(payouts,s.payouts);}
 else if(scope==='lottery'){bankDelta=total(stakes);}
 else{Object.assign(payouts,prizeShares(s,e.config.stake,scope==='pig'?e.config.funding:'redistribute'));bankDelta=total(stakes)-total(payouts);}
 for(const id of ids){const delta=(payouts[id]??0)-(stakes[id]??0);if(!['meiern','klippklapp','thirteen'].includes(scope))e.balances[id]=(e.balances[id]??0)+delta;check(whole(e.balances[id],1000000000),'Invalid token settlement.');}
 e.bank+=bankDelta;check(Number.isSafeInteger(e.bank),'Invalid token settlement.');e.reserved={};e.status=s.phase==='aborted'?'refunded':'settled';
 e.summary={status:e.status,stakes,payouts,net:Object.fromEntries(ids.map(id=>[id,(payouts[id]??0)-(stakes[id]??0)])),bankDelta,carryRefund};
 const b=e.bets;if(b&&['open','closed'].includes(b.status)){
  const targets=b.market==='loser'?(s.loser?[s.loser]:s.losers??[]):s.winners??(s.loser?ids.filter(id=>id!==s.loser):[]),correct=b.bets.filter(row=>targets.includes(row.target)),refund=s.phase==='aborted'||!correct.length,pot=b.bets.reduce((n,row)=>n+row.amount,0);
  b.payouts={};for(const [i,row]of b.bets.entries()){const index=correct.indexOf(row),paid=refund?row.amount:index<0?0:Math.floor(pot/correct.length)+(index<pot%correct.length?1:0);b.payouts[row.id]=paid;e.balances[row.id]=(e.balances[row.id]??0)-row.amount+paid;check(whole(e.balances[row.id],1000000000),'Invalid token settlement.');}
  b.status=refund?'refunded':'settled';b.plan={pot,correct:correct.map(row=>row.id),refund};
 }
 if(scope==='seventeen'){s.bankBalance=e.bank;s.bankDebt=Math.max(0,-e.bank);}
 if(scope==='chohan'){s.bank=e.bank;s.bankDebt=Math.max(0,-e.bank);for(const id of s.players)s.balances[id]=e.balances[id]??0;}
}
