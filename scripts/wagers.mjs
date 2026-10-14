import {f} from './farkle-text.mjs';
import {escapeHTML,gameTitle} from './tavern-text.mjs';
export const COINS={pp:1000,gp:100,ep:50,sp:10,cp:1};
const check=(ok,message)=>{if(!ok)throw new Error(message);};
export const coinLabel=coin=>({pp:f('Platin','Platinum'),gp:f('Gold','Gold'),ep:f('Elektrum','Electrum'),sp:f('Silber','Silver'),cp:f('Kupfer','Copper')})[coin];
export const amountText=cp=>`${cp/100} ${f('Goldwert','gold value')}`;
export function walletValue(currency,ep=false){
  check(currency&&typeof currency==='object'&&!Array.isArray(currency),'Invalid character currency.');
  let total=0;for(const [coin,value] of Object.entries(COINS)){
    if(coin==='ep'&&!ep)continue;const n=currency?.[coin]??0;
    check(Number.isSafeInteger(n)&&n>=0,'Invalid character currency.');total+=n*value;
  }check(Number.isSafeInteger(total),'Invalid character currency.');return total;
}
export function changedWallet(currency,delta,ep=false){
  const total=walletValue(currency,ep)+delta;check(Number.isSafeInteger(delta)&&total>=0&&Number.isSafeInteger(total),'Not enough currency for settlement.');
  const next={...currency},coins=Object.entries(COINS).filter(([coin])=>coin!=='ep'||ep);
  for(const [coin] of coins)next[coin]??=0;
  const add=amount=>{for(const [coin,value] of coins){next[coin]+=Math.floor(amount/value);amount%=value;}};
  if(delta>=0)add(delta);
  else{
    let remaining=-delta;
    for(const [coin,value] of coins){const take=Math.min(next[coin],Math.floor(remaining/value));next[coin]-=take;remaining-=take*value;}
    if(remaining){const [coin,value]=[...coins].reverse().find(([coin,value])=>next[coin]>0&&value>remaining);next[coin]--;add(value-remaining);}
  }
  return next;
}
// Competition ranking (1,2,2,4); each tied rank receives its full nominal prize.
export function prizeShares(state,stake,funding='redistribute'){
  const ids=state.players,total=ids.length*stake,paid=Object.fromEntries(ids.map(id=>[id,0]));
  if(state.game!=='pig'){
    const winners=state.winners??ids.filter(id=>id!==state.loser),eligible=winners.length?winners:state.draw?ids:[];
    eligible.forEach((id,index)=>paid[id]=funding==='bank'?total:Math.floor(total/eligible.length)+(index<total%eligible.length?1:0));return paid;
  }
  const ranked=[...ids].sort((a,b)=>state.scores[b]-state.scores[a]),nominal=[total,0,0];
  if(ids.length>=3){nominal[1]=stake;nominal[2]=Math.floor(stake/2);nominal[0]=total-nominal[1]-nominal[2];}
  const leaders=ids.filter(id=>state.scores[id]===state.scores[ranked[0]]);
  for(const id of ids){const rank=ids.filter(other=>state.scores[other]>state.scores[id]).length;paid[id]=nominal[rank]??0;}
  if(funding==='redistribute'){
    const lower=ids.filter(id=>!leaders.includes(id)).reduce((sum,id)=>sum+paid[id],0),remaining=total-lower;
    leaders.forEach((id,index)=>paid[id]=Math.floor(remaining/leaders.length)+(index<remaining%leaders.length?1:0));
  }
  return paid;
}
export function settlementPlan(state,book){
  check(state?.phase==='finished','Finish the game before settlement.');
  const stake=book.stake*COINS[book.currency],stakes=Object.fromEntries(state.players.map(id=>[id,state.game==='lottery'?state.tickets.filter(t=>t.id===id).length*stake:stake]));
  const payouts=state.game==='lottery'?{}:prizeShares(state,stake,book.funding),amounts=new Map();
  const add=(actorId,delta)=>{check(typeof actorId==='string'&&actorId,'Assign a character to every participant.');amounts.set(actorId,{actorId,delta:(amounts.get(actorId)?.delta??0)+delta});};
  for(const id of state.players)if(stakes[id]||payouts[id])add(book.mapping[id],(payouts[id]??0)-stakes[id]);
  const total=Object.values(stakes).reduce((a,b)=>a+b,0),paid=Object.values(payouts).reduce((a,b)=>a+b,0),bankDelta=total-paid;
  if(state.game==='lottery'||bankDelta){check(book.house,'Assign the tavern bank or merchant.');add(book.house,bankDelta);}
  check([...amounts.values()].reduce((a,e)=>a+e.delta,0)===0,'Unbalanced settlement.');
  return {stakes,payouts,total,bankDelta,entries:[...amounts.values()].filter(e=>e.delta).sort((a,b)=>a.delta-b.delta)};
}
// Wallet and transaction marker are updated in the same Actor document.
// Interrupted operations resume from durable markers instead of repeating payments.
export class BettingManager{
  constructor(deps){Object.assign(this,deps);this.state={version:1,books:{}};}
  restore(saved){check(saved===null||saved?.version===1&&saved.books&&typeof saved.books==='object','Invalid betting save.');this.state=saved?structuredClone(saved):{version:1,books:{}};}
  hasPending(scope){return Object.values(this.state.books).some(book=>book.scope===scope&&book.status==='pending');}
  async persist(book){check(this.isAuthority?.()!==false,'GM authority changed. Resume with the active GM.');const next=structuredClone(this.state);next.books[book.gameId]=book;await this.save(next);this.state=next;}
  snapshot(scope,state){
    const book=this.state.books[state?.gameId]??null;let preview=null,error=null;
    if(state?.phase==='finished'&&book)try{preview=book.plan??settlementPlan(state,book);}catch(e){error=e.message;}
    return {scope,game:structuredClone(state),book:structuredClone(book),preview,error,enabled:this.enabled()};
  }
  async handle(scope,state,data,user){
    check(user.isGM,'GM only.');check(state?.gameId,'Open a game first.');
    if(data.action==='betRead')return this.snapshot(scope,state);
    check(this.isAuthority?.()!==false,'GM authority changed. Resume with the active GM.');
    let book=this.state.books[state.gameId];
    if(data.action==='betConfigure'){
      check(!book||book.status==='configured','Settlement is already locked.');
      const args=data.args??{},isNew=['pig','ship','lottery'].includes(scope),stake=isNew?state.stake:args.stake,currency=isNew?state.currency:args.currency,funding=args.funding??state.funding??'redistribute';
      check(Number.isSafeInteger(stake)&&stake>=0&&stake<=1000000&&Object.hasOwn(COINS,currency),'Invalid stake.');
      check(currency!=='ep'||this.electrum(),'Electrum is disabled.');check(['bank','redistribute'].includes(funding),'Invalid funding.');
      const mapping=Object.fromEntries(state.players.map(id=>[id,args.mapping?.[id]??this.character(id)?.id??'']));
      const used=Object.values(mapping).filter(Boolean);check(new Set(used).size===used.length,'Each participant needs a different character.');
      book={gameId:state.gameId,scope,status:'configured',stake,currency,funding,mapping,house:typeof args.house==='string'?args.house:''};await this.persist(book);
    }else if(data.action==='betSettle'){
      check(this.enabled(),'Managed betting is disabled.');check(book,'Configure the stakes first.');
      if(book.status==='settled')return this.snapshot(scope,state);
      check(this.system()==='dnd5e','Managed currency currently supports D&D 5e/5.5e only.');
      const config=globalThis.CONFIG?.DND5E?.currencies;
      if(config)check(Object.entries(COINS).every(([coin,value])=>Math.abs(config[coin]?.conversion-100/value)<0.000001),'Custom currency conversions are not supported.');
      check(book.currency!=='ep'||this.electrum(),'Electrum is disabled.');
      if(book.status!=='pending'){
        const plan=settlementPlan(state,book);
        for(const entry of plan.entries){const actor=this.actor(entry.actorId);check(actor&&typeof actor.update==='function','Settlement character is missing.');changedWallet(actor.system?.currency,entry.delta,this.electrum());}
        book={...book,status:'pending',txId:crypto.randomUUID(),plan,electrum:this.electrum()};await this.persist(book);
      }
      check(!book.electrum||this.electrum(),'Electrum is disabled.');
      for(const entry of book.plan.entries){
        check(this.isAuthority?.()!==false,'GM authority changed. Resume with the active GM.');
        const actor=this.actor(entry.actorId);check(actor,'Settlement character is missing.');
        const flag=`transactions.${book.txId}`;let marker=actor.getFlag('taverngames',flag);
        if(!marker){
          const before=walletValue(actor.system?.currency,book.electrum),next=changedWallet(actor.system?.currency,entry.delta,book.electrum),after=before+entry.delta;
          const record={gameId:state.gameId,delta:entry.delta,before,after},changes=Object.fromEntries(Object.keys(COINS).filter(c=>c!=='ep'||book.electrum).map(c=>[`system.currency.${c}`,next[c]]));
          await actor.update({...changes,[`flags.taverngames.${flag}`]:record});
          marker=actor.getFlag('taverngames',flag);check(marker,'Currency update was not confirmed; resume settlement.');
        }
        check(marker.gameId===state.gameId&&marker.delta===entry.delta,'Conflicting transaction marker.');
        if(!this.hasMessage(book.txId,entry.actorId))await this.announce({content:`<h2>Taverngames · ${f('Währungsbuchung','Currency transaction')}</h2><p>${escapeHTML(gameTitle(scope))}: ${escapeHTML(actor.name)} · ${entry.delta>0?'+':''}${amountText(entry.delta)}</p><p>${amountText(marker.before)} → ${amountText(marker.after)}</p><p>${f('Abrechnung durch','Settled by')} ${escapeHTML(user.name??user.id)}</p>`,flags:{taverngames:{betTx:book.txId,betActor:entry.actorId}}});
      }
      if(!this.hasMessage(book.txId,'summary'))await this.announce({content:`<h2>Taverngames · ${f('Einsätze abgerechnet','Stakes settled')}</h2><p>${escapeHTML(gameTitle(scope))} · ${f('Gesamteinsatz','Total stakes')}: ${amountText(book.plan.total)}</p><p>${f('Bankanteil','Bank change')}: ${amountText(book.plan.bankDelta)}</p>`,flags:{taverngames:{betTx:book.txId,betActor:'summary'}}});
      book={...book,status:'settled'};await this.persist(book);
    }else throw new Error('Unknown action.');
    return this.snapshot(scope,state);
  }
}
