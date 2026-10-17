import {TavernUI,node,control,selectField} from './tavern-ui.mjs';
import {f} from './farkle-text.mjs';
import {gameTitle} from './tavern-text.mjs';
const enabled=()=>true;
function number(parent,label,value,min=0,max=100000){const l=node('label',label),input=node('input');input.type='number';input.min=min;input.max=max;input.step=1;input.value=value;l.append(input);parent.append(l);return input;}
export class BetaGameUI extends TavernUI{
 open(){if(enabled())super.open();}
 guide(){if(enabled())super.guide();}
 drawModeration(){
  const root=this.windows.get('moderation')?.root;if(!root||!game.user.isGM)return;
  const s=this.getState(),key=JSON.stringify([s,game.settings.get('taverngames',`show${this.scope}Launcher`),game.settings.get('taverngames','allowElectrum')]);
  if(this.moderationRoot===root&&this.moderationKey===key)return;
  const active=root.contains(document.activeElement)?document.activeElement:null,focus=active?.dataset.draft,selection=focus?{start:active.selectionStart,end:active.selectionEnd}:null;
  this.moderationRoot=root;this.moderationKey=key;root.replaceChildren();if(!enabled())return;
  const c=node('div',undefined,'schocken-content');root.append(c);if(this.openOutcome)control(c,f('Wetten','Bets'),()=>this.openOutcome(this.scope));c.append(node('h2',`${gameTitle(this.scope)}`));control(c,f('Spieltisch öffnen','Open game table'),()=>{this.window('table');this.drawTable();});control(c,f('Anleitung','Instructions'),()=>this.guide());
  const label=node('label',undefined,'schocken-choice'),show=node('input');show.type='checkbox';show.dataset.tavernLauncher=this.scope;show.checked=game.settings.get('taverngames',`show${this.scope}Launcher`)===true;show.addEventListener('change',()=>void game.settings.set('taverngames',`show${this.scope}Launcher`,show.checked).catch(e=>ui.notifications.warn(e.message)));label.append(show,document.createTextNode(f('Unteren Spielbutton für alle einblenden','Show the bottom game button for everyone')));c.append(label);
  const setup=node('details');setup.open=this.setupOpen??!s;setup.addEventListener('toggle',()=>this.setupOpen=setup.open);setup.append(node('summary',f('Neue Partie & Regeln','New game & rules')));let mode,coins,entry,currency;
  if(this.scope==='hoard'){
   mode=selectField(setup,f('Spielvariante','Game variant'),[['tokens',f('Eintritt & Spielmünzen (virtuell)','Entry & tokens (virtual)')],['gambler',f('Zocker (virtuelle Bestände)','Gambler (virtual balances)')]],this.draftMode??s?.hoardMode??'tokens','hoardMode');mode.addEventListener('change',()=>this.draftMode=mode.value);
   coins=number(setup,f('Spielmünzen / Standard-Anfangsbestand','Tokens / default starting balance'),this.draftCoins??s?.initialCoins??30,1);coins.dataset.draft='initialCoins';coins.addEventListener('input',()=>this.draftCoins=coins.value);
   entry=number(setup,f('Eintrittsbetrag (nur Vorschau)','Entry amount (preview only)'),this.draftEntry??s?.entryAmount??2);entry.dataset.draft='entryAmount';entry.addEventListener('input',()=>this.draftEntry=entry.value);
   currency=selectField(setup,f('Münzeinheit','Coin unit'),[['cp',f('Kupfer','Copper')],['sp',f('Silber','Silver')],...(game.settings.get('taverngames','allowElectrum')?[['ep',f('Elektrum','Electrum')]]:[]),['gp',f('Gold','Gold')],['pp',f('Platin','Platinum')]],this.draftCurrency??s?.currency??'gp','currency');currency.addEventListener('change',()=>this.draftCurrency=currency.value);
   setup.append(node('p',f('Nur interne Spielstände. Kein Charaktergeld wird gelesen oder verändert.','Internal balances only. Character currency is neither read nor changed.'),'schocken-help'));
  }
  const labelNPC=node('label',f('NPCs – ein Name pro Zeile','NPCs – one name per line')),names=node('textarea');names.rows=3;names.dataset.draft='npcs';names.value=this.draftNPC??Object.values(s?.npcs??{}).join('\n');names.addEventListener('input',()=>this.draftNPC=names.value);labelNPC.append(names);setup.append(labelNPC);
  control(setup,f('Lobby öffnen','Open lobby'),()=>{if(s&&!confirm(f('Gespeicherte Partie ersetzen?','Replace the saved game?')))return;void this.request('lobby',{npcs:names.value.split('\n').map(n=>n.trim()).filter(Boolean),hoardMode:mode?.value??'tokens',initialCoins:Number(coins?.value??30),entryAmount:Number(entry?.value??2),currency:currency?.value??'gp'});},s&&!['lobby','finished','aborted'].includes(s.phase));c.append(setup);
  if(focus){const field=[...root.querySelectorAll('[data-draft]')].find(n=>n.dataset.draft===focus);field?.focus({preventScroll:true});if(field&&typeof selection.start==='number')field.setSelectionRange(selection.start,selection.end);}
  if(!s)return;
  if(s.phase==='lobby'&&this.scope==='hoard'&&s.hoardMode==='gambler')for(const id of s.players){const amount=number(c,`${this.name(id)} · ${f('Anfangsbestand','Starting balance')}`,s.startAmounts[id],1);control(c,f('Bestand übernehmen','Apply balance'),()=>this.request('setBalance',{id,amount:Number(amount.value)}));}
  const row=node('div',undefined,'schocken-actions');c.append(row);
  if(!['finished','aborted'].includes(s.phase)){
   if(s.phase==='lobby')control(row,f('Spiel starten','Start game'),()=>this.request('begin'),s.paused||s.players.length<2);
   control(row,s.paused?f('Fortsetzen','Resume'):f('Pause','Pause'),()=>this.request('pause'));
   if(this.scope==='hoard'&&s.phase!=='lobby')control(row,f('Regulär abschließen & Vorschau','Finish & preview'),()=>{if(confirm(f('Hort verteilen und Partie regulär abschließen? Keine Geldbuchung.','Distribute the hoard and finish? No currency transactions.')))void this.request('finish');},s.paused||s.phase!=='playing'||s.animationWaiting||s.animationNextWaiting);
   control(row,f('Spiel beenden','End game'),()=>{if(confirm(f('Spiel für alle ohne Auszahlung abbrechen?','Abort for everyone without payout?')))void this.request('abort');});
   for(const id of Object.keys(s.npcs)){const rowNPC=node('div',undefined,'schocken-npc');rowNPC.append(node('span',`${this.name(id)} · ${s.npcManual[id]?f('SL steuert','GM controls'):f('Automatisch','Automatic')}`));control(rowNPC,s.npcManual[id]?f('Automatik einschalten','Enable automatic play'):f('Selbst steuern','Control manually'),()=>this.request('npcControl',{id,manual:!s.npcManual[id]}));c.append(rowNPC);}
  }else control(row,f('Nächste Partie vorbereiten','Prepare next game'),()=>this.request('restart'));
 }
 drawTable(){
  const root=this.windows.get('table')?.root;if(!root)return;const top=root.querySelector('.schocken-content')?.scrollTop??0;root.replaceChildren();if(!enabled())return;
  const c=node('div',undefined,'schocken-content'),s=this.getState();root.append(c);if(this.openOutcome)control(c,f('Wetten','Bets'),()=>this.openOutcome(this.scope));c.append(node('h2',`${gameTitle(this.scope)}`));if(game.user.isGM)control(c,f('Moderation öffnen','Open moderation'),()=>{this.window('moderation');this.drawModeration();});
  if(!s){c.append(node('p',f('Der SL öffnet eine Lobby.','The GM opens a lobby.')));return;}
  if(s.paused)c.append(node('p',f('Spiel pausiert','Game paused')));
  const active=s.order[s.turn],can=!s.paused&&!s.animationWaiting&&!s.animationNextWaiting&&(active===game.user.id||game.user.isGM),request=(action,args={})=>this.request(action,{...args,...(s.npcs[active]?{id:active}:{})});
  if(s.animationPending)c.append(node('p',f('Die 3D-Würfel rollen …','The 3D dice are rolling …'),'schocken-help'));
  else if(s.animationNextWaiting)c.append(node('p',f('Noch auf die Würfelanimation der Mitspieler warten …','Waiting for the other players’ dice animation …'),'schocken-help'));
  for(const id of s.players)c.append(node('div',`${id===active?'▶ ':''}${this.name(id)}${s.npcs[id]?' (NPC)':''}${s.out.includes(id)?` · ${f('Ausgeschieden','Eliminated')}`:''} · ${this.scope==='liars'?`${s.counts[id]??5} ${f('Würfel','dice')}`:`${s.balances[id]??s.startAmounts[id]} ${f('Münzen','coins')}`}`,'schocken-player'));
  if(s.phase==='lobby'){const joined=s.players.includes(game.user.id);control(c,joined?f('Lobby verlassen','Leave lobby'):f('Beitreten','Join'),()=>this.request(joined?'leave':'join'),s.paused||!joined&&s.players.length>=20);if(game.user.isGM)control(c,f('Spiel starten','Start game'),()=>this.request('begin'),s.paused||s.players.length<2);}
  if(this.scope==='liars'){
   c.append(node('p',`${f('Runde','Round')} ${s.round}`));if(game.settings.get('taverngames','diceSoNiceBeta'))c.append(node('p',f('3D-Becher folgen der Spielerliste. Die Anordnung passt sich der Würfelgröße und Fläche an.','3D cups follow the player list. Their layout adapts to the dice size and available area.')));for(const [id,dice] of Object.entries(s.hands))c.append(node('p',`${this.name(id)} · ${f('Eigener / übernommener Becher','Your / controlled cup')}: ${dice.join(' · ')}`,'beta-private-cup'));
   if(s.phase==='rolling'){
    c.append(node('p',f('Alle würfeln ihren Becher geheim.','Everyone rolls their cup secretly.')));
    for(const id of s.players.filter(id=>!s.out.includes(id)))if(!s.rolled.includes(id)&&(id===game.user.id||game.user.isGM&&s.npcs[id]))control(c,`${f('Verdeckt würfeln','Roll secretly')} · ${this.name(id)}`,()=>this.request('roll',{id}),s.paused||s.animationWaiting);
   }else if(s.phase==='bidding'){
    c.append(node('h3',`${this.name(active)} · ${f('am Zug','to play')}`));c.append(node('p',s.bid?`${this.name(s.bid.id)}: ${s.bid.amount} × ${s.bid.face}`:f('Noch kein Gebot.','No bid yet.')));
    if(can){const amount=number(c,f('Anzahl Würfel','Dice count'),this.bidAmount??Math.max(1,s.bid?.amount??1),1,Object.values(s.counts).reduce((a,b)=>a+b,0)),face=number(c,f('Augenzahl','Face'),this.bidFace??Math.min(6,(s.bid?.face??1)+1),1,6);amount.addEventListener('input',()=>this.bidAmount=amount.value);face.addEventListener('input',()=>this.bidFace=face.value);control(c,f('Gebot abgeben','Place bid'),()=>{this.bidAmount=null;this.bidFace=null;void request('bid',{amount:Number(amount.value),face:Number(face.value)});});control(c,f('Anzweifeln','Challenge'),()=>request('challenge'),!s.bid);}
   }
   if(s.reveal){c.append(node('h3',f('Aufgedeckt','Revealed')));const bid=s.reveal.bid,all=Object.values(s.reveal.hands).flat(),matching=s.reveal.matching??all.filter(n=>n===bid.face).length,wild=s.reveal.wild??(bid.face===1?0:all.filter(n=>n===1).length);c.append(node('p',`${f('Angezweifeltes Gebot','Challenged bid')}: ${this.name(bid.id)} · ${bid.amount} × ${bid.face}`,'beta-challenged-bid'));c.append(node('p',`${matching} × ${bid.face}${bid.face===1?'':` + ${wild} ${f('Einser-Joker','wild ones')}`} = ${s.reveal.hits} ${f('Treffer','matches')}`,'beta-hit-breakdown'));for(const [id,dice] of Object.entries(s.reveal.hands))c.append(node('p',`${this.name(id)}: ${dice.join(' · ')}`));c.append(node('p',`${s.reveal.hits} ${f('Treffer','matches')} · ${this.name(s.reveal.loser)} ${f('verliert einen Würfel','loses one die')}`));if(s.phase==='reveal'&&can)control(c,f('Weiter','Continue'),()=>request('next'));}
  }else{
   c.append(node('p',f('Nur virtuelle Münzen – keine Charakterbuchungen.','Virtual coins only – no character transactions.'),'schocken-help'));
   const board=node('div',undefined,'hoard-board');s.board.forEach((n,i)=>board.append(node('div',`${i+3}: ${n}`)));c.append(board);
   if(s.lastRoll){c.append(node('p',`${this.name(s.lastRoll.id)}: ${s.lastRoll.dice.join(' + ')} = ${s.lastRoll.sum}`));const dice=node('div',undefined,'schocken-dice hoard-dice');for(const value of s.lastRoll.dice)dice.append(node('span',String(value),'taverngames-die'));c.append(dice);}
   if(s.phase==='playing'){c.append(node('h3',`${this.name(active)} · ${f('am Zug','to play')}`));if(can)control(c,f('Würfeln','Roll'),()=>request('roll'));}
   if(s.phase==='allocate'){
    c.append(node('p',`${f('Restmünzen frei verteilen, danach ausscheiden','Distribute remaining coins, then leave')}: ${s.pending.amount}`));
    if(can){const inputs=Array.from({length:9},(_,i)=>number(c,String(i+3),0,0,s.pending.amount));control(c,f('Restzahlung bestätigen','Confirm partial payment'),()=>request('allocate',{coins:inputs.map(input=>Number(input.value))}));}
   }
   if(s.phase==='contest'){
    const contest=s.contest,sides=contest.eligible.length<=6?6:contest.eligible.length<=10?10:20;c.append(node('h3',`${f('Restverteilung','Remainder allocation')} · ${f('Würfel','Die')}: 1W${sides}`));c.append(node('p',f(`Tippe eine Zahl von 1 bis ${sides}. Erst nach allen Tipps löst der SL den W${sides} aus.`,`Guess a number from 1 to ${sides}. Only after all guesses does the GM roll the d${sides}.`)));c.append(node('p',`${contest.remaining} ${f('Restmünzen; nächste Zahl gewinnt','remainder coins; closest guess wins')}`));
    for(const id of contest.entrants){const submitted=contest.submitted.includes(id);c.append(node('p',`${this.name(id)}: ${submitted?'✓':'…'}`));if(!submitted&&!s.paused&&!s.animationWaiting&&!s.animationNextWaiting&&(id===game.user.id||game.user.isGM&&s.npcs[id])){const guess=number(c,f('Geheimer Zahlentipp','Secret number guess'),1,1,sides);control(c,f('Tipp abgeben','Submit guess'),()=>this.request('guess',{id,value:Number(guess.value)}));}}
    if(game.user.isGM)control(c,f('Restwurf auslösen','Roll for remainder'),()=>this.request('resolveGuess'),s.paused||s.animationWaiting||s.animationNextWaiting||contest.entrants.some(id=>!contest.submitted.includes(id)));
   }
   if(s.lastContest){c.append(node('p',`${f('Letzter Restwurf','Last remainder roll')}: 1W${s.lastContest.sides} = ${s.lastContest.value} · ${s.lastContest.closest.map(id=>this.name(id)).join(', ')}`));for(const [id,guess] of Object.entries(s.lastContest.guesses))c.append(node('p',`${this.name(id)}: ${guess} · ${f('Abstand','Distance')}: ${Math.abs(guess-s.lastContest.value)}`));}
   if(s.payouts&&s.phase==='finished'){c.append(node('h3',f('Virtuelle Auszahlungsvorschau','Virtual payout preview')));for(const id of s.players)c.append(node('p',`${this.name(id)}: ${s.payouts[id]} ${s.hoardMode==='tokens'?f('Kupfer Gegenwert','copper equivalent'):s.currency}`));}
  }
  if(s.phase==='finished')c.append(node('h3',s.reason==='early'?f('Vorzeitig regulär abgeschlossen','Finished early'):`${f('Gewonnen','Winners')}: ${s.winners.map(id=>this.name(id)).join(', ')}`));if(s.phase==='aborted')c.append(node('h3',f('Spiel durch den GM beendet','Game ended by the GM')));
  if(['finished','aborted'].includes(s.phase)&&game.user.isGM)control(c,f('Nächste Partie vorbereiten','Prepare next game'),()=>this.request('restart'));c.scrollTop=top;
 }
}
