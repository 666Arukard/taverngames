import {createNativeWindow} from './native-ui.mjs';
import {node,control,selectField} from './tavern-ui.mjs';
import {f} from './farkle-text.mjs';
import {gameTitle,tavernError} from './tavern-text.mjs';
export class OutcomeUI{
 constructor({request}){this.request=request;this.scope=null;this.root=null;this.payload=null;this.busy=false;}
 async open(scope){if(this.inFlight)await this.inFlight.catch(()=>{});this.scope=scope;this.payload=null;if(!this.root){this.root=node('section',undefined,'taverngames-surface');this.app=createNativeWindow(foundry,'outcome-bets',this.root,()=>{this.root=null;this.scope=null;});}else this.app.bringToFront();await this.send('outcomeRead');if(game.user.isGM&&this.payload?.game?.phase==='lobby'&&!this.payload.book)await this.send('outcomeOpen');}
 async send(action,args={}){
  if(!this.scope)return;const scope=this.scope,gameId=this.payload?.game?.gameId;
  if(this.busy){if(action==='outcomeRead')return;await this.inFlight?.catch(()=>{});if(scope!==this.scope||gameId!==this.payload?.game?.gameId){ui.notifications.warn(tavernError('The game state changed. Please try again.'));return;}return this.send(action,args);}
  this.busy=true;
  try{const previous=JSON.stringify(this.payload),result=await(this.inFlight=this.request(scope,action,{...args,gameId,revision:this.payload?.book?.revision}));if(scope!==this.scope)return;this.payload=result;if(action!=='outcomeRead'||JSON.stringify(this.payload)!==previous)this.draw();}
  catch(e){ui.notifications.warn(tavernError(e.message));}finally{this.busy=false;this.inFlight=null;}
 }

 draw(){
  if(!this.root||!this.payload)return;const {game:s,book,accounts,initialGold}=this.payload;this.root.replaceChildren();const c=node('div',undefined,'schocken-content');this.root.append(c);c.append(node('h2',`${gameTitle(this.scope)} · ${f('Wetten','Bets')}`));c.append(node('p',f('Interne Goldstände zum Testen. Keine Charakterbuchungen. Standard-Anfangsguthaben: 100 Gold je Wetter.','Internal gold for testing. No character transactions. Default starting balance: 100 gold per bettor.'),'schocken-help'));
  control(c,f('Aktualisieren','Refresh'),()=>this.send('outcomeRead'));
  if(!s){c.append(node('p',f('Zuerst eine Spiel-Lobby öffnen.','Open a game lobby first.')));return;}
  const name=id=>s.npcs[id]??book?.npcs[id]??game.users.get(id)?.name??id;
  if(!book){c.append(node('p',f('Der SL öffnet die Wettannahme vor Spielbeginn.','The GM opens betting before the game starts.')));if(game.user.isGM)control(c,f('Wettannahme öffnen','Open betting'),()=>this.send('outcomeOpen'),s.phase!=='lobby');return;}
  const status=node('p',`${({open:f('Wettannahme offen','Betting open'),closed:f('Wettannahme geschlossen','Betting closed'),settled:f('Wetten ausgewertet','Bets settled'),refunded:f('Wetten zurückgezahlt','Bets refunded')})[book.status]} · ${f('Topf','Pot')}: ${book.bets.reduce((a,b)=>a+b.amount,0)/100} ${f('Gold','gold')}`);status.dataset.outcomeStatus=book.status;c.append(status);
  c.append(node('h3',book.market==='loser'?f('Wer verliert?','Who loses?'):f('Wer gewinnt?','Who wins?')));
  if(game.user.isGM&&book.status==='open'){
   const row=node('div',undefined,'schocken-actions');for(const [value,de,en] of [['participants','Teilnehmende','Participants'],['observers','Zuschauer','Observers'],['all','Alle','Everyone']]){const b=control(row,f(de,en),()=>this.send('outcomeConfig',{audience:value,market:book.market}),!!book.bets.length);b.setAttribute('aria-pressed',String(book.audience===value));}c.append(row);
   const market=selectField(c,f('Wettausgang','Outcome'),[['winner',f('Gewinner','Winner')],['loser',f('Verlierer','Loser')]],book.market,'market');market.disabled=!!book.bets.length;market.addEventListener('change',()=>void this.send('outcomeConfig',{audience:book.audience,market:market.value}));
   const nl=node('label',f('Zusätzlicher NPC-Wetter','Additional NPC bettor')),input=node('input');input.type='text';input.maxLength=60;nl.append(input);c.append(nl);control(c,f('NPC hinzufügen','Add NPC'),()=>this.send('outcomeNPC',{name:input.value}),Object.keys(book.npcs).length>=20);
   control(c,f('Wettannahme schließen','Close betting'),()=>this.send('outcomeClose'));control(c,f('Wetten stornieren & zurückzahlen','Cancel & refund bets'),()=>{if(confirm(f('Alle internen Einsätze zurückzahlen?','Refund all internal stakes?')))void this.send('outcomeCancel');});
   c.append(node('p',f('Solange die Wettannahme offen ist, ist der Spielstart gesperrt. Nach dem Schließen startet der SL das Spiel im Moderationsfenster. Die erste Wette sperrt die Teilnehmerliste.','The game cannot start while betting is open. After closing, the GM starts the game in moderation. The first bet locks the participant list.'),'schocken-help'));
   const funds=node('details');funds.append(node('summary',f('Internes Testguthaben verwalten','Manage internal test balances')));const identities=[...[...game.users].filter(u=>u.active).map(u=>[u.id,u.name]),...Object.entries(s.npcs),...Object.entries(book.npcs)],creditUser=selectField(funds,f('Wetter auswählen','Select bettor'),identities,game.user.id,'credit-user'),label=node('label',f('Internes Guthaben (Gold)','Internal balance (gold)')),value=node('input');value.type='number';value.min=0;value.max=1000000;value.step=0.01;value.value=(accounts[creditUser.value]??10000)/100;label.append(value);funds.append(label);const apply=control(funds,f('Guthaben übernehmen','Apply balance'),()=>this.send('outcomeBalance',{id:creditUser.value,amount:Math.round(Number(value.value)*100)}));const updateCredit=()=>{value.value=(accounts[creditUser.value]??10000)/100;apply.disabled=book.bets.some(b=>b.id===creditUser.value);};creditUser.addEventListener('change',updateCredit);updateCredit();c.append(funds);

  }
  const eligible=id=>book.audience==='all'||book.audience==='participants'&&s.players.includes(id)||book.audience==='observers'&&!s.players.includes(id);
  const bettors=game.user.isGM?[game.user.id,...Object.keys(s.npcs),...Object.keys(book.npcs)]:[game.user.id];
  if(book.status==='open'&&s.phase==='lobby')for(const id of bettors.filter(eligible)){
   const section=node('section'),balance=accounts[id]===undefined?initialGold:accounts[id]/100;section.append(node('h3',`${name(id)} · ${balance} ${f('Gold verfügbar','gold available')}`));const placed=book.bets.find(b=>b.id===id);
   if(placed){control(section,f('Wette zurücknehmen','Withdraw bet'),()=>this.send('outcomeWithdraw',{id}));}
   else{
    const target=selectField(section,f('Tipp','Prediction'),s.players.map(pid=>[pid,name(pid)]),s.players[0]??'','target'),label=node('label',f('Gold einsetzen','Gold stake')),amount=node('input');amount.type='number';amount.min=0.01;amount.max=1000000;amount.step=0.01;amount.value=1;label.append(amount);section.append(label);
    control(section,f('Wette platzieren','Place bet'),()=>{const cp=Number(amount.value)*100;if(!Number.isSafeInteger(Math.round(cp))||Math.abs(cp-Math.round(cp))>0.00001){ui.notifications.warn(f('Höchstens zwei Nachkommastellen.','At most two decimal places.'));return;}void this.send('outcomePlace',{id,target:target.value,amount:Math.round(cp)});},!s.players.length);

   }c.append(section);
  }
  const table=node('table'),head=node('tr');for(const text of [f('Wetter','Bettor'),f('Tipp','Prediction'),f('Einsatz','Stake'),f('Auszahlung','Payout')])head.append(node('th',text));table.append(head);
  for(const bet of book.bets){const row=node('tr');for(const value of [bet.name,name(bet.target),`${bet.amount/100} G`,book.plan?`${(book.plan.payouts[bet.id]??0)/100} G`:'–'])row.append(node('td',value));table.append(row);}c.append(table);
  c.append(node('p',f('Der gesamte Topf wird gleichmäßig unter den richtigen Wettern aufgeteilt. Bei Abbruch oder keinem richtigen Tipp werden die Einsätze zurückgezahlt.','The entire pot is split equally among correct bettors. Abort or no correct predictions refunds stakes.'),'schocken-help'));
 }
}
