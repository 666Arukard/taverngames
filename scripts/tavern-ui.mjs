import {createNativeWindow} from './native-ui.mjs';
import {f} from './farkle-text.mjs';
import {gameTitle,tavernGuide} from './tavern-text.mjs';
import {COINS,coinLabel} from './wagers.mjs';
export const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
export const control=(parent,title,fn,disabled=false)=>{const b=node('button',title);b.type='button';b.disabled=disabled;b.addEventListener('click',fn);parent.append(b);return b;};
export function selectField(parent,title,entries,value,key){const label=node('label',title),select=node('select');select.dataset.draft=key;for(const [v,text] of entries){const o=node('option',text);o.value=v;select.append(o);}select.value=String(value);label.append(select);parent.append(label);return select;}
function inputField(parent,title,value,key,min=0,max=1000000){const label=node('label',title),input=node('input');input.type='number';input.min=min;input.max=max;input.step=1;input.value=value;input.dataset.draft=key;label.append(input);parent.append(label);return input;}
export function currencyOptions(){return Object.keys(COINS).filter(c=>c!=='ep'||game.settings.get('taverngames','allowElectrum')===true).map(c=>[c,coinLabel(c)]);}
export class TavernUI{
  constructor(scope,{request,getState,openBetting}){Object.assign(this,{scope,request,getState,openBetting});this.windows=new Map();}
  get isOpen(){return this.windows.size>0;}
  name(id){return this.getState()?.npcs[id]??game.users.get(id)?.name??id;}
  window(kind){if(this.windows.has(kind)){this.windows.get(kind).app.bringToFront();return this.windows.get(kind).root;}const root=node('section',undefined,'taverngames-surface'),app=createNativeWindow(foundry,`${this.scope}-${kind}`,root,()=>this.windows.delete(kind));this.windows.set(kind,{root,app});return root;}
  open(){this.window('table');if(game.user.isGM)this.window('moderation');this.draw();void this.request('read');}
  async close(){await Promise.all([...this.windows.values()].map(({app})=>app.close()));}
  guide(){if(!game.user.isGM)return;const root=this.window('guide');root.replaceChildren();const content=node('div',undefined,'schocken-content');content.innerHTML=tavernGuide(this.scope);root.append(content);control(content,f('Anleitung in den Chat posten','Post instructions to chat'),async()=>{try{await ChatMessage.create({content:tavernGuide(this.scope)});}catch(e){ui.notifications.warn(e.message);}});}
  draw(){this.drawModeration();this.drawTable();}
  drawModeration(){
    const root=this.windows.get('moderation')?.root;if(!root||!game.user.isGM)return;
    const drafts=new Map([...root.querySelectorAll('[data-draft]')].map(e=>[e.dataset.draft,e.value])),expanded=root.querySelector('details')?.open??false,focus=document.activeElement?.dataset.draft;
    root.replaceChildren();const c=node('div',undefined,'schocken-content');root.append(c);const s=this.getState();
    c.append(node('p',`${gameTitle(this.scope)}`,'schocken-help'));control(c,f('Spieltisch öffnen','Open game table'),()=>{this.window('table');this.drawTable();});control(c,f('Anleitung','Instructions'),()=>this.guide());
    control(c,f('Einsätze & Charaktere','Stakes & characters'),()=>this.openBetting(this.scope),!s);
    const label=node('label',undefined,'schocken-choice'),show=node('input');show.type='checkbox';show.dataset.tavernLauncher=this.scope;show.checked=game.settings.get('taverngames',`show${this.scope}Launcher`)===true;
    show.addEventListener('change',()=>void game.settings.set('taverngames',`show${this.scope}Launcher`,show.checked).catch(e=>ui.notifications.warn(e.message)));label.append(show,document.createTextNode(f('Unteren Spielbutton für alle einblenden','Show the bottom game button for everyone')));c.append(label);
    const setup=node('details');setup.open=expanded;setup.append(node('summary',f('Neue Partie & Regeln','New game & rules')));
    let target,mode,rounds,prize,prizeValue,maxTickets,perPlayer,item,numbersPerTicket;
    if(this.scope==='pig')target=inputField(setup,f('Zielpunktzahl','Target score'),s?.target??100,'target',10);
    if(this.scope==='ship'){mode=selectField(setup,f('Spielmodus','Game mode'),[['single',f('Einzelspiel','Single game')],['rounds',f('Feste Runden','Fixed rounds')],['endless',f('Unbegrenzte Runden','Unlimited rounds')]],s?.mode??'single','mode');rounds=inputField(setup,f('Rundenanzahl','Round count'),s?.roundLimit??3,'roundLimit',1,100);}
    const stake=inputField(setup,this.scope==='lottery'?f('Einsatz je Tippschein','Stake per ticket'):f('Grundeinsatz pro Partie / Serie','Base stake per game / series'),s?.stake??2,'stake');
    const currency=selectField(setup,f('Währung','Currency'),currencyOptions(),s?.currency??'gp','currency');
    const funding=selectField(setup,f('Finanzierung gleicher Prämien','Funding tied prizes'),[['redistribute',f('Gewinn neu aufteilen','Redistribute the pot')],['bank',f('Tavernenbank','Tavern bank')]],s?.funding??'redistribute','funding');funding.disabled=this.scope==='lottery';
    if(this.scope==='lottery'){
      const items=[...(game.items??[])].filter(i=>Number.isSafeInteger(i.system?.quantity)&&i.system.quantity>=1).map(i=>[i.uuid,`${f('Vorlage','Template')}: ${i.name}`]);
      for(const actor of game.actors??[])for(const i of actor.items??[])if(Number.isInteger(i.system?.quantity)&&i.system.quantity>0)items.push([i.uuid,`${actor.name}: ${i.name} (${i.system.quantity})`]);
      item=selectField(setup,f('Hauptgewinn auswählen','Select prize item'),[['',f('Nur beschreiben / manuell übergeben','Description / manual delivery')],...items],s?.prizeUuid??'','prizeUuid');
      const l=node('label',f('Gegenstandsname / Beschreibung','Prize name / description'));prize=node('input');prize.type='text';prize.maxLength=240;prize.dataset.draft='prize';prize.value=s?.prize??'';l.append(prize);setup.append(l);
      item.addEventListener('change',()=>{if(item.value)prize.value=item.selectedOptions[0].textContent.split(': ').slice(1).join(': ').replace(/ \(\d+\)$/,'');});
      prizeValue=inputField(setup,f('Gegenstandswert (in gewählter Währung)','Prize value (selected currency)'),s?.prizeValue??25,'prizeValue',0,100000000);
      maxTickets=inputField(setup,f('Maximale Tipps insgesamt','Maximum tickets in total'),s?.maxTickets??20,'maxTickets',1,20);perPlayer=inputField(setup,f('Tipps je Spieler','Tickets per player'),s?.perPlayer??2,'perPlayer',1,20);
      numbersPerTicket=inputField(setup,f('Zahlen je Tippschein','Numbers per ticket'),s?.numbersPerTicket??5,'numbersPerTicket',1,100);
    }
    const nl=node('label',f('NPCs – ein Name pro Zeile','NPCs – one name per line')),npcs=node('textarea');npcs.rows=3;npcs.dataset.draft='npcs';npcs.value=Object.values(s?.npcs??{}).join('\n');nl.append(npcs);setup.append(nl);
    control(setup,f('Lobby öffnen','Open lobby'),()=>{if(s&&!confirm(f('Gespeicherte Partie ersetzen? Offene Abrechnungen vorher erledigen.','Replace the saved game? Complete any pending settlement first.')))return;void this.request('lobby',{target:Number(target?.value??100),mode:mode?.value??'single',roundLimit:Number(rounds?.value??3),stake:Number(stake.value),currency:currency.value,funding:funding.value,prize:prize?.value??'',prizeUuid:item?.value??'',prizeValue:Number(prizeValue?.value??25),maxTickets:Number(maxTickets?.value??20),perPlayer:Number(perPlayer?.value??2),numbersPerTicket:Number(numbersPerTicket?.value??5),npcs:npcs.value.split('\n').map(n=>n.trim()).filter(Boolean)});},s&&!['finished','aborted'].includes(s.phase)&&!(s.phase==='lobby'&&!s.tickets.length));c.append(setup);
    for(const e of root.querySelectorAll('[data-draft]')){if(drafts.has(e.dataset.draft))e.value=drafts.get(e.dataset.draft);if(focus===e.dataset.draft)e.focus();}
    if(mode){const update=()=>rounds.disabled=mode.value!=='rounds';update();mode.addEventListener('change',update);}
    if(!s)return;
    if(!['finished','aborted'].includes(s.phase)){
      const row=node('div',undefined,'schocken-actions');
      if(s.phase==='lobby')control(row,this.scope==='lottery'?f('Annahme schließen','Close acceptance'):f('Spiel starten','Start game'),()=>this.request('begin'),s.paused||(this.scope==='lottery'?!s.tickets.length:s.players.length<2));
      if(this.scope==='lottery'&&s.phase==='closed')control(row,f('W100 ziehen','Draw d100'),()=>this.request('draw'),s.paused);
      if(s.phase==='playing'&&this.scope==='pig'&&s.cup.bust)control(row,f('Weiter','Continue'),()=>this.request('next'),s.paused);
      if(s.phase==='playing'&&this.scope==='ship'&&s.cup.rolls===3)control(row,f('Zug abschließen','End turn'),()=>this.request('bank'),s.paused);
      control(row,s.paused?f('Fortsetzen','Resume'):f('Pause','Pause'),()=>this.request('pause'));
      if(this.scope!=='lottery')control(row,f('Rückgängig','Undo'),()=>this.request('undo'));
      if(this.scope==='ship'&&s.mode==='endless'&&s.phase==='playing'&&!s.tieBreak)control(row,f('Nach dieser Runde abschließen','Finish after this round'),()=>this.request('finishRound'),s.stopAfterRound);
      control(row,f('Spiel beenden','End game'),()=>{if(confirm(f('Spiel und aktive Runde für alle abbrechen? Es erfolgt keine Abrechnung.','Abort the game and active round for everyone? No settlement will occur.')))void this.request('abort');});c.append(row);
    }
    if(['finished','aborted'].includes(s.phase))control(c,f('Nächste Partie vorbereiten','Prepare next game'),()=>this.request('restart'));
    for(const id of Object.keys(s.npcs)){const row=node('div',undefined,'schocken-npc');row.append(node('span',`${this.name(id)} · ${s.npcManual[id]?f('SL steuert','GM controls'):f('Automatisch','Automatic')}`));control(row,s.npcManual[id]?f('Automatik einschalten','Enable automatic play'):f('Selbst steuern','Control manually'),()=>this.request('npcControl',{id,manual:!s.npcManual[id]}),['finished','aborted'].includes(s.phase));c.append(row);}
    if(this.scope==='lottery'&&s.phase==='finished'&&s.winners.length&&s.prizeUuid){control(c,f('Preis übergeben / erneut versuchen','Deliver prize / retry'),()=>this.request('awardPrize'));control(c,f('Preis selbst übergeben','Deliver prize manually'),()=>{if(confirm(f('Automatische Übergabe verwerfen und Preis selbst übergeben?','Waive automatic delivery and give the prize yourself?')))void this.request('waivePrize');});}
  }
  drawTable(){
    const root=this.windows.get('table')?.root;if(!root)return;root.replaceChildren();const c=node('div',undefined,'schocken-content');root.append(c);c.append(node('h2',`${gameTitle(this.scope)}`));
    const s=this.getState();if(game.user.isGM)control(c,f('Moderation öffnen','Open moderation'),()=>{this.window('moderation');this.drawModeration();});
    if(!s){c.append(node('p',f('Der SL öffnet eine Lobby.','The GM opens a lobby.')));return;}
    c.append(node('p',`${f('Grundeinsatz','Base stake')}: ${s.stake} ${coinLabel(s.currency)} · ${f('Buchung erst auf SL-Befehl','Settlement by GM command only')}`));
    for(const id of s.players){
      const title=`${id===s.order[s.turn]?'▶ ':''}${this.name(id)}${s.npcs[id]?' (NPC)':''}${this.scope!=='lottery'?` · ${s.scores[id]} ${f('Punkte','points')}`:''}`;
      if(this.scope==='pig'){
        const b=control(c,title,()=>{this.historyPlayer=this.historyPlayer===id?null:id;this.drawTable();});b.classList.add('schocken-player');b.dataset.historyPlayer=id;b.setAttribute('aria-expanded',String(this.historyPlayer===id));b.title=f('Letzte Würfe anzeigen','Show recent rolls');
        if(this.historyPlayer===id){
          const history=node('section',undefined,'taverngames-roll-history');history.append(node('h3',`${this.name(id)} · ${f('Letzte Würfe','Recent rolls')}`));
          const entries=(s.rollHistory??[]).filter(r=>r.id===id).slice(-20).reverse();
          if(!entries.length)history.append(node('p',f('Noch keine gespeicherten Würfe in dieser Partie.','No recorded rolls in this game yet.')));
          for(const r of entries)history.append(node('p',`${f('Runde','Round')} ${r.round} · ${f('Wurf','Roll')} ${r.roll}: ${r.value} · ${r.bust?`${r.lost} ${f('Zugpunkte verloren','turn points lost')}`:`${r.points} ${f('Zugpunkte','turn points')}`}`));c.append(history);
        }
      }else c.append(node('div',title,'schocken-player'));
    }
    if(s.paused)c.append(node('p',f('Spiel pausiert','Game paused')));
    if(s.phase==='aborted'){c.append(node('h3',f('Spiel durch den GM beendet','Game ended by the GM')));}
    else if(s.phase==='finished'){
      c.append(node('h3',f('Spiel beendet','Game over')));c.append(node('p',`${f('Gewonnen','Winners')}: ${s.winners.map(id=>this.name(id)).join(', ')||f('Niemand','Nobody')}`));
      if(this.scope==='lottery')c.append(node('p',`W100: ${s.result} · ${f('Hauptgewinn','Prize')}: ${s.prize}`));
    }else if(s.phase==='lobby'){
      c.append(node('h3',`Lobby · ${gameTitle(this.scope)}`));const joined=s.players.includes(game.user.id),committed=s.tickets.some(t=>t.id===game.user.id);
      control(c,joined?f('Lobby verlassen','Leave lobby'):f('Beitreten','Join'),()=>this.request(joined?'leave':'join'),s.paused||committed);
      if(game.user.isGM)control(c,this.scope==='lottery'?f('Annahme schließen','Close acceptance'):f('Spiel starten','Start game'),()=>this.request('begin'),s.paused||(this.scope==='lottery'?!s.tickets.length:s.players.length<2));
    }
    if(this.scope==='lottery'){
      c.append(node('p',`${f('Hauptgewinn','Prize')}: ${s.prize} · ${s.prizeValue} ${coinLabel(s.currency)} · ${s.tickets.length}/${s.maxTickets} ${f('Tipps','tickets')} · ${s.numbersPerTicket??5} ${f('Zahlen je Tippschein','numbers per ticket')}`));
      for(const t of s.tickets)c.append(node('p',`${this.name(t.id)}: ${t.numbers.join(', ')}`));
      if(s.phase==='closed'&&game.user.isGM)control(c,f('W100 ziehen','Draw d100'),()=>this.request('draw'),s.paused);
      if(s.phase==='lobby'&&!s.paused&&s.tickets.length<s.maxTickets){
        const eligible=s.players.filter(id=>id===game.user.id||game.user.isGM&&s.npcs[id]);
        const count=s.numbersPerTicket??5,used=new Set(s.tickets.flatMap(t=>t.numbers));
        if(100-used.size<count)c.append(node('p',f('Nicht mehr genug freie Zahlen für einen vollständigen Tippschein. Der SL kann die Annahme schließen.','Not enough free numbers for another complete ticket. The GM can close acceptance.')));
        else if(eligible.length){const participant=selectField(c,f('Tippschein für','Ticket for'),eligible.map(id=>[id,this.name(id)]),eligible.includes(game.user.id)?game.user.id:eligible[0],'ticketPlayer'),numbers=new Set(),grid=node('div',undefined,'taverngames-number-grid');
          const submit=control(c,f('Tippschein verbindlich abgeben','Commit ticket'),()=>{if(confirm(f('Tippschein verbindlich abgeben? Der Einsatz wird vorgemerkt.','Commit ticket? The stake will be recorded.')))void this.request('ticket',{numbers:[...numbers],id:participant.value});},true);
          const update=()=>submit.disabled=numbers.size!==count||s.tickets.filter(t=>t.id===participant.value).length>=s.perPlayer;
          participant.addEventListener('change',update);
          for(let n=1;n<=100;n++){const b=control(grid,String(n),()=>{if(numbers.has(n))numbers.delete(n);else if(numbers.size<count)numbers.add(n);b.classList.toggle('farkle-selected',numbers.has(n));update();},used.has(n));}c.append(grid);
        }
      }
    }else if(s.phase==='playing'){
      const id=s.order[s.turn],can=id===game.user.id||game.user.isGM,enabled=can&&!s.paused&&!!game.users.activeGM;
      c.append(node('h3',`${this.name(id)} · ${f('am Zug','to play')}`));
      if(s.npcs[id]&&!s.npcManual[id]&&(this.scope==='pig'&&s.cup.bust||this.scope==='ship'&&(s.cup.rolls===3||s.cup.stage===3&&s.cup.dice.filter((_n,i)=>!s.cup.held[i]).reduce((a,b)=>a+b,0)>=8)))c.append(node('p',f('Der NPC schließt seinen Zug nach fünf Sekunden automatisch ab.','The NPC ends its turn automatically after five seconds.'),'schocken-help'));
      if(this.scope==='pig'){
        c.append(node('p',`${f('Zugpunkte','Turn points')}: ${s.cup.points} · ${f('Ziel','Target')}: ${s.target}`));
        if(s.cup.bust)c.append(node('p',f(`Eine 1! ${s.cup.lost} Zugpunkte verloren. Mit „Weiter“ zum nächsten Spieler.`,`A 1! ${s.cup.lost} turn points lost. Press Continue to move to the next player.`),'taverngames-turn-result'));
        if(s.finalRemaining!==null)c.append(node('p',`${f('Schlussrunde: verbleibende Züge','Final round: remaining turns')}: ${s.finalRemaining}`));
      }else{
        c.append(node('p',`${f('Runde','Round')} ${s.round}${s.mode==='rounds'?`/${s.roundLimit}`:s.mode==='endless'?f(' · unbegrenzt',' · unlimited'):''} · ${s.cup.rolls}/3 ${f('Würfe','rolls')}${s.tieBreak?` · ${f('Stechen','Tie-break')} ${s.tieBreak}`:''}`));
        if(s.stopAfterRound)c.append(node('p',f('Diese Runde wird noch abgeschlossen.','The current round will be completed.')));
        c.append(node('p',s.cup.stage<3?f(`Als Nächstes ${['Schiff (6)','Kapitän (5)','Mannschaft (4)'][s.cup.stage]} anklicken und herauslegen.`,`Click and set aside ${['ship (6)','captain (5)','crew (4)'][s.cup.stage]} next.`):f(`Ladung: ${s.cup.dice.filter((_n,i)=>!s.cup.held[i]).reduce((a,b)=>a+b,0)} Punkte. Beide Ladungswürfel werden gemeinsam neu gewürfelt.`,`Cargo: ${s.cup.dice.filter((_n,i)=>!s.cup.held[i]).reduce((a,b)=>a+b,0)} points. Both cargo dice are rerolled together.`)));
        if(s.cup.rolls===3)c.append(node('p',f('Letzter Wurf: Besatzung markieren und den Zug ausdrücklich abschließen. Ohne vollständige Besatzung zählt er null Punkte.','Final roll: mark the crew and explicitly end the turn. Without a complete crew the turn scores zero.'),'taverngames-turn-result'));
      }
      const dice=node('div',undefined,'schocken-dice');(s.cup.dice??[]).forEach((n,i)=>{
        if(this.scope==='pig'){dice.append(node('span',String(n),'taverngames-die'));return;}
        const die=control(dice,String(n),()=>this.request('hold',{index:i}),!enabled||s.cup.held[i]||s.cup.stage===3||n!==6-s.cup.stage);
        die.classList.add('taverngames-die');die.dataset.shipDie=String(i);die.classList.toggle('held',s.cup.held[i]);die.setAttribute('aria-pressed',String(s.cup.held[i]));
        die.title=s.cup.held[i]?f('Herausgelegt','Set aside'):f('Passenden Würfel für Schiff, Kapitän oder Mannschaft herauslegen','Set aside the required ship, captain or crew die');
      });c.append(dice);
      if(enabled){
        const row=node('div',undefined,'schocken-actions');
        if(this.scope==='pig'&&s.cup.bust)control(row,f('Weiter','Continue'),()=>this.request('next'));
        else{
          control(row,f('Würfeln','Roll'),()=>this.request('roll'),this.scope==='ship'&&s.cup.rolls>=3);
          control(row,this.scope==='pig'?f('Punkte sichern','Bank points'):s.cup.rolls===3?f('Zug abschließen','End turn'):f('Ladung behalten','Keep cargo'),()=>this.request('bank'),this.scope==='pig'?s.cup.points<=0:s.cup.stage!==3&&s.cup.rolls<3);
        }
        c.append(row);
      }
    }
    if(['finished','aborted'].includes(s.phase)&&game.user.isGM)control(c,f('Nächste Partie vorbereiten','Prepare next game'),()=>this.request('restart'));
  }
}
