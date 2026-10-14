import {TavernUI,node,control} from './tavern-ui.mjs';
import {f} from './farkle-text.mjs';
import {KNIFFEL_FIELDS,kniffelValue,kniffelTotal} from './kniffel-engine.mjs';
import {kniffelField} from './kniffel-text.mjs';
const enabled=()=>true;
export class KniffelUI extends TavernUI{
  drawModeration(){
    const root=this.windows.get('moderation')?.root;if(!root||!game.user.isGM)return;root.replaceChildren();if(!enabled())return;
    const s=this.getState(),c=node('div',undefined,'schocken-content');root.append(c);c.append(node('h2','Kniffel'));
    control(c,f('Spieltisch öffnen','Open game table'),()=>{this.window('table');this.drawTable();});control(c,f('Anleitung','Instructions'),()=>this.guide());
    const label=node('label',undefined,'schocken-choice'),show=node('input');show.type='checkbox';show.dataset.tavernLauncher='kniffel';show.checked=game.settings.get('taverngames','showkniffelLauncher')===true;
    show.addEventListener('change',()=>void game.settings.set('taverngames','showkniffelLauncher',show.checked).catch(e=>ui.notifications.warn(e.message)));label.append(show,document.createTextNode(f('Unteren Kniffel-Button für alle einblenden','Show the bottom Kniffel button for everyone')));c.append(label);
    const setup=node('details');setup.open=this.setupOpen??!s;setup.addEventListener('toggle',()=>this.setupOpen=setup.open);setup.append(node('summary',f('Neue Partie & Regeln','New game & rules')));
    const nl=node('label',f('NPCs – ein Name pro Zeile','NPCs – one name per line')),names=node('textarea');names.rows=3;names.dataset.draft='npcs';names.value=this.npcDraft??Object.values(s?.npcs??{}).join('\n');names.addEventListener('input',()=>this.npcDraft=names.value);nl.append(names);setup.append(nl);
    setup.append(node('p',f('Schmidt-Regeln · 2–8 Teilnehmer · 13 Züge · Keine Einsätze','Schmidt rules · 2–8 participants · 13 turns · No betting'),'schocken-help'));
    control(setup,f('Lobby öffnen','Open lobby'),()=>{if(s&&!confirm(f('Gespeicherte Partie ersetzen?','Replace the saved game?')))return;void this.request('lobby',{npcs:names.value.split('\n').map(n=>n.trim()).filter(Boolean)});},s&&!['finished','aborted'].includes(s.phase)&&s.phase!=='lobby');c.append(setup);
    if(!s)return;
    const row=node('div',undefined,'schocken-actions');c.append(row);
    if(!['finished','aborted'].includes(s.phase)){
      if(s.phase==='lobby')control(row,f('Spiel starten','Start game'),()=>this.request('begin'),s.paused||s.players.length<2);
      control(row,s.paused?f('Fortsetzen','Resume'):f('Pause','Pause'),()=>this.request('pause'));control(row,f('Rückgängig','Undo'),()=>this.request('undo'));
      control(row,f('Spiel beenden','End game'),()=>{if(confirm(f('Spiel für alle abbrechen?','Abort the game for everyone?')))void this.request('abort');});
      for(const id of Object.keys(s.npcs)){const npc=node('div',undefined,'schocken-npc');npc.append(node('span',`${this.name(id)} · ${s.npcManual[id]?f('SL steuert','GM controls'):f('Automatisch','Automatic')}`));control(npc,s.npcManual[id]?f('Automatik einschalten','Enable automatic play'):f('Selbst steuern','Control manually'),()=>this.request('npcControl',{id,manual:!s.npcManual[id]}));c.append(npc);}
    }else control(row,f('Nächste Partie vorbereiten','Prepare next game'),()=>this.request('restart'));
  }
  drawTable(){
    const root=this.windows.get('table')?.root;if(!root)return;root.replaceChildren();if(!enabled())return;
    const c=node('div',undefined,'schocken-content'),s=this.getState();root.append(c);c.append(node('h2','Kniffel'));
    if(game.user.isGM)control(c,f('Moderation öffnen','Open moderation'),()=>{this.window('moderation');this.drawModeration();});
    if(!s){c.append(node('p',f('Der SL öffnet eine Lobby.','The GM opens a lobby.')));return;}
    if(s.paused)c.append(node('p',f('Spiel pausiert','Game paused')));
    if(s.phase==='lobby'){
      c.append(node('h3','Lobby'));for(const id of s.players)c.append(node('div',`${this.name(id)}${s.npcs[id]?' (NPC)':''}`,'schocken-player'));
      const joined=s.players.includes(game.user.id);control(c,joined?f('Lobby verlassen','Leave lobby'):f('Beitreten','Join'),()=>this.request(joined?'leave':'join'),s.paused||!joined&&s.players.length>=8);
      if(game.user.isGM)control(c,f('Spiel starten','Start game'),()=>this.request('begin'),s.paused||s.players.length<2);
    }
    const active=s.phase==='playing'?s.order[s.turn]:null,can=!!active&&!s.paused&&!!game.users.activeGM&&(active===game.user.id||game.user.isGM);
    if(active){
      c.append(node('h3',`${this.name(active)} · ${f('am Zug','to play')}`));c.append(node('p',`${f('Runde','Round')} ${s.round}/13 · ${s.cup.rolls}/3 ${f('Würfe','rolls')}`));
      if(s.startRolls?.length){const winner=s.order[0],result=s.startRolls.at(-1).find(r=>r.id===winner);c.append(node('p',`${f('Start ausgewürfelt','Starting player rolled')}: ${this.name(winner)} · ${result?.value??'–'}`,'schocken-help'));}
      const dice=node('div',undefined,'schocken-dice');for(let i=0;i<5;i++){
        const held=s.cup.held[i],b=control(dice,String(s.cup.dice?.[i]??'?'),()=>this.request(held?'return':'hold',{index:i}),!can||!s.cup.dice);b.dataset.kniffelDie=i;b.classList.add('taverngames-die');b.classList.toggle('held',held);b.setAttribute('aria-pressed',String(held));b.title=held?f('Wieder hereinnehmen','Return die'):f('Behalten','Hold die');
      }c.append(dice);control(c,f('Würfeln','Roll'),()=>this.request('roll'),!can||s.cup.rolls>=3||s.cup.held.every(Boolean));
      c.append(node('p',f('Ein freies Feld wählen, um den Zug abzuschließen. Auch nach dem ersten Wurf möglich.','Choose a free field to end your turn. Allowed after the first roll.'),'schocken-help'));
      if(s.npcs[active]&&!s.npcManual[active])c.append(node('p',f('Der NPC wählt selbst. Ein fertiger Wurf bleibt vor dem Eintrag mindestens fünf Sekunden sichtbar.','The NPC chooses automatically. A completed roll stays visible for at least five seconds before scoring.'),'schocken-help'));
    }else if(s.phase==='finished'){c.append(node('h3',f('Spiel beendet','Game over')));c.append(node('p',`${f('Gewonnen','Winners')}: ${s.winners.map(id=>this.name(id)).join(', ')}`));}
    else if(s.phase==='aborted')c.append(node('h3',f('Spiel durch den GM beendet','Game ended by the GM')));
    if(s.players.length){
      const scroll=node('div',undefined,'kniffel-sheet-scroll'),table=node('table',undefined,'kniffel-sheet');table.setAttribute('aria-label',f('Kniffel-Wertungsbogen','Kniffel score sheet'));scroll.append(table);c.append(scroll);
      const head=node('tr');head.append(node('th',f('Wertungsfeld','Score field')));for(const id of s.players)head.append(node('th',`${id===active?'▶ ':''}${this.name(id)}${s.npcs[id]?' (NPC)':''}`));const thead=node('thead');thead.append(head);table.append(thead);const body=node('tbody');table.append(body);
      for(const field of KNIFFEL_FIELDS){const row=node('tr');row.append(node('th',kniffelField(field)));for(const id of s.players){const cell=node('td'),value=s.sheets[id][field];if(value!==null)cell.append(node('span',String(value)));else if(id===active&&s.cup.dice){const preview=kniffelValue(s.cup.dice,field,s.sheets[id]),b=control(cell,`${preview.points}${preview.extra?' (+50)':''}`,()=>{if(preview.points===0&&!confirm(f('Dieses Feld mit null Punkten streichen?','Cross out this field with zero points?')))return;void this.request('score',{field,confirmZero:preview.points===0});},!can);b.dataset.kniffelField=field;b.title=`${kniffelField(field)} · ${f('Eintragen','Score')}`;}else cell.textContent='–';row.append(cell);}body.append(row);}
      for(const [key,title] of [['upper',f('Summe Zahlenfelder (oben)','Number fields total (upper)')],['bonus',f('Bonus: 35 ab 63 oben','Bonus: 35 at 63 upper')],['extra',f('Zusatzkniffel','Extra Kniffels')],['total',f('Gesamt','Total')]]){const row=node('tr');row.dataset.kniffelTotal=key;row.append(node('th',title));for(const id of s.players){const totals=kniffelTotal(s.sheets[id],s.extras[id]);row.append(node('td',key==='upper'?`${totals.upper} / 63`:String(totals[key])));}body.append(row);}
      c.append(node('p',f('Der 35-Punkte-Bonus zählt ausschließlich Einsen bis Sechsen. Straßen, Pasche, Full House, Kniffel und Chance zählen nicht zur 63-Punkte-Grenze.','The 35-point bonus uses only Ones through Sixes. Straights, matching combinations, Full House, Kniffel and Chance do not count toward the 63-point threshold.'),'schocken-help'));
    }
    if(['finished','aborted'].includes(s.phase)&&game.user.isGM)control(c,f('Nächste Partie vorbereiten','Prepare next game'),()=>this.request('restart'));
  }
}
