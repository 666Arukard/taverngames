import {farkleInteractionKey} from './interaction-queue.mjs';
import {tokenGuide} from './token-guide.mjs';
import {keepModerationScroll} from './scroll-state.mjs';
import {createNativeWindow} from './native-ui.mjs';
import {selectionScore} from './farkle-engine.mjs';
import {f,farkleGuide} from './farkle-text.mjs';
const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
const button=(parent,title,action,disabled=false)=>{const node=el('button',title);node.type='button';node.disabled=disabled;node.addEventListener('click',action);parent.append(node);return node;};
export class FarkleUI{
  constructor({request,getState,openBetting,openOutcome}){this.request=request;this.getState=getState;this.openBetting=openBetting;this.openOutcome=openOutcome;this.windows=new Map();keepModerationScroll(this,'farkle-moderation');}
  get isOpen(){return this.windows.size>0;}
  name(id){return this.getState()?.npcs?.[id]??game.users.get(id)?.name??id;}
  window(kind){
    if(this.windows.has(kind)){this.windows.get(kind).app.bringToFront();return this.windows.get(kind).root;}
    const root=el('section',undefined,'taverngames-surface'),app=createNativeWindow(globalThis.foundry,kind,root,()=>this.windows.delete(kind));this.windows.set(kind,{root,app});return root;
  }
  open(){this.window('farkle');if(game.user.isGM)this.window('farkle-moderation');this.draw();void this.request('read');}
  async close(){await Promise.all([...this.windows.values()].map(({app})=>app.close()));}
  guide(){
    if(!game.user.isGM)return;
    const root=this.window('farkle-guide');root.replaceChildren();const content=el('div',undefined,'schocken-content');content.innerHTML=(farkleGuide(this.getState()?.rules)+tokenGuide('farkle'));root.append(content);
    button(content,f('Anleitung in den Chat posten','Post instructions to chat'),async()=>{if(!game.user.isGM)return;try{await ChatMessage.create({content:(farkleGuide(this.getState()?.rules)+tokenGuide('farkle'))});}catch(error){ui.notifications.warn(error.message);}});
  }
  draw(){this.drawModeration();this.drawTable();}
  drawModeration(){
    const root=this.windows.get('farkle-moderation')?.root;if(!root||!game.user.isGM)return;
    // Keep the setup controls attached: replacing a focused native select closes its popup.
    const existing=root.querySelector('[data-farkle-live]');
    if(existing){
      root.querySelector('[data-farkle-launcher]').checked=game.settings.get('taverngames','showFarkleLauncher')===true;
      root.querySelector('[data-farkle-best-selection]').checked=game.settings.get('taverngames','allowFarkleBestSelection')===true;
      const betting=root.querySelector('[data-farkle-betting]');if(betting)betting.disabled=!this.getState();
      this.drawModerationStatus(existing);return;
    }
    root.replaceChildren();const content=el('div',undefined,'schocken-content');root.append(content);if(this.openOutcome)button(content,f('Wetten','Bets'),()=>this.openOutcome('farkle'));
    content.append(el('p','Farkle · PlayMonster','schocken-help'));
    button(content,f('Spieltisch öffnen','Open game table'),()=>{this.window('farkle');this.drawTable();});button(content,f('Anleitung','Instructions'),()=>this.guide());
    if(this.openBetting)button(content,f('Einsätze & Spieltoken','Stakes & game tokens'),()=>this.openBetting('farkle'),!this.getState()).dataset.farkleBetting='';
    const showLabel=el('label',undefined,'schocken-choice'),show=el('input');show.type='checkbox';show.dataset.farkleLauncher='true';show.checked=game.settings.get('taverngames','showFarkleLauncher')===true;
    show.addEventListener('change',async()=>{if(!game.user.isGM)return;try{await game.settings.set('taverngames','showFarkleLauncher',show.checked);}catch(error){ui.notifications.warn(error.message);this.drawModeration();}});
    showLabel.append(show,document.createTextNode(f('Unteren Farkle-Button für alle einblenden','Show the bottom Farkle button for everyone')));content.append(showLabel);
    const bestLabel=el('label',undefined,'schocken-choice'),best=el('input');best.type='checkbox';best.dataset.farkleBestSelection='true';best.checked=game.settings.get('taverngames','allowFarkleBestSelection')===true;
    best.addEventListener('change',async()=>{if(!game.user.isGM)return;try{await game.settings.set('taverngames','allowFarkleBestSelection',best.checked);}catch(error){ui.notifications.warn(error.message);this.drawModeration();}});
    bestLabel.append(best,document.createTextNode(f('Beste Auswahl für Spieler freigeben','Allow best selection for players')));content.append(bestLabel);
    content.append(el('p',f('Standardmäßig aus. Spieler wählen ihre Würfel selbst; der SL kann die Hilfe weiterhin verwenden.','Off by default. Players select their own dice; the GM can still use the helper.'),'schocken-help'));
    const setup=el('details');setup.append(el('summary',f('Neue Partie & Regeln','New game & rules')));
    const label=el('label',f('Spielmodus','Game mode')),mode=el('select');mode.dataset.draft='mode';
    for(const [value,text] of [['quick',f('Kurzspiel – ein Zug pro Spieler','Quick game – one turn each')],['rounds',f('Feste Runden – Gesamtpunkte','Fixed rounds – total points')],['target',f('Zielpunktzahl – mehrere Runden / Solo','Target score – multiple rounds / solo')]]){const option=el('option',text);option.value=value;mode.append(option);}mode.value=this.getState()?.mode??'quick';label.append(mode);setup.append(label);
    const targetLabel=el('label',f('Zielpunktzahl (nur Zielmodus)','Target score (target mode only)')),target=el('input');target.type='number';target.min='500';target.max='1000000';target.step='50';target.dataset.draft='target';target.value=String(this.getState()?.target??10000);targetLabel.append(target);setup.append(targetLabel);
    const entryLabel=el('label',undefined,'schocken-choice'),entryEnabled=el('input');entryEnabled.type='checkbox';entryEnabled.dataset.draft='entryEnabled';entryEnabled.checked=(this.getState()?.entry??0)>0;entryLabel.append(entryEnabled,document.createTextNode(f('Einstiegshürde verwenden','Use an entry minimum')));setup.append(entryLabel);
    const entryPointsLabel=el('label',f('Punkte zum ersten Eintragen (Standard 500)','Points required to enter (default 500)')),entryPoints=el('input');entryPoints.type='number';entryPoints.min=1;entryPoints.max=target.value;entryPoints.step=1;entryPoints.dataset.draft='entry';entryPoints.value=String(this.getState()?.entry||500);entryPointsLabel.append(entryPoints);setup.append(entryPointsLabel);
    const roundsLabel=el('label',f('Rundenanzahl (nur feste Runden)','Round count (fixed rounds only)')),rounds=el('input');rounds.type='number';rounds.min='1';rounds.max='100';rounds.step='1';rounds.dataset.draft='roundLimit';rounds.value=String(this.getState()?.roundLimit??3);roundsLabel.append(rounds);setup.append(roundsLabel);
    const optional={};
    for(const [key,de,en] of [['smallStraight','Kleine Straße (fünf in Folge): 750 Punkte','Small straight (five in sequence): 750 points'],['onesBonus','Einsen-Bonus: 3/4/5/6 Einsen = 1000/2000/3000/4000','Ones bonus: 3/4/5/6 ones = 1000/2000/3000/4000'],['immediateTarget','Bei gesicherter Zielpunktzahl sofort beenden','End immediately when the target is banked']]){
      const label=el('label',undefined,'schocken-choice'),input=el('input');input.type='checkbox';input.dataset.draft=key;input.checked=this.getState()?.rules?.[key]??false;label.append(input,document.createTextNode(f(de,en)));setup.append(label);optional[key]=input;
    }
    const npcLabel=el('label',f('NPCs – ein Name pro Zeile','NPCs – one name per line')),npcs=el('textarea');npcs.rows=3;npcs.dataset.draft='npcs';npcs.value=Object.values(this.getState()?.npcs??{}).join('\n');npcLabel.append(npcs);setup.append(npcLabel);
    setup.append(el('p',f('PlayMonster-Wertung. Die Einstiegshürde ist in allen Modi optional. Standard: Kurzspiel und feste Runden ohne Hürde, Zielmodus 500 Punkte. Pro fester Runde hat jeder einen Zug; Punkte werden addiert. Solo nur im Zielmodus.','PlayMonster scoring. Entry minimum is optional in every mode. Defaults: no minimum in quick/fixed rounds, 500 in target mode. One turn each per fixed round; scores are added together. Solo play in target mode only.')));
    button(setup,f('Lobby öffnen','Open lobby'),()=>{if(confirm(f('Neue Farkle-Lobby öffnen? Eine gespeicherte Farkle-Partie wird ersetzt.','Open a new Farkle lobby? This replaces any saved Farkle game.')))void this.request('lobby',{mode:mode.value,entry:entryEnabled.checked?Number(entryPoints.value):0,target:mode.value==='target'?Number(target.value):10000,roundLimit:mode.value==='rounds'?Number(rounds.value):3,rules:Object.fromEntries(Object.entries(optional).map(([key,input])=>[key,input.checked])),npcs:npcs.value.split('\n').map(name=>name.trim()).filter(Boolean)});});content.append(setup);
    const updateMode=()=>{target.disabled=mode.value!=='target';rounds.disabled=mode.value!=='rounds';optional.immediateTarget.disabled=mode.value!=='target';entryEnabled.disabled=false;entryPoints.disabled=!entryEnabled.checked;entryPoints.max=mode.value==='target'?target.value:1000000;};updateMode();let entryEdited=this.getState()!=null;mode.addEventListener('change',()=>{if(!entryEdited){entryEnabled.checked=mode.value==='target';entryPoints.value=500;}updateMode();});entryEnabled.addEventListener('change',()=>{entryEdited=true;updateMode();});entryPoints.addEventListener('input',()=>{entryEdited=true;});target.addEventListener('input',updateMode);
    const live=el('div');live.dataset.farkleLive='';content.append(live);this.drawModerationStatus(live);
  }
  drawModerationStatus(content){
    const wasOpen=content.querySelector('details')?.open??false;content.replaceChildren();
    const s=this.getState();if(!s)return;
    if(!['finished','aborted'].includes(s.phase)){
      const actions=el('div',undefined,'schocken-actions');if(s.phase==='lobby')button(actions,f('Spiel starten','Start game'),()=>this.request('begin'),s.paused||s.players.length<(s.mode==='target'?1:2));button(actions,s.paused?f('Fortsetzen','Resume'):f('Pause','Pause'),()=>this.request('pause'));button(actions,f('Rückgängig','Undo'),()=>this.request('undo'));button(actions,f('Spiel beenden','End game'),()=>{if(confirm(f('Farkle für alle beenden?','End Farkle for everyone?')))void this.request('abort');});content.append(actions);
    }
    for(const id of Object.keys(s.npcs)){
      const row=el('div',undefined,'schocken-npc');row.append(el('span',`${this.name(id)} · ${s.npcManual[id]?f('GM steuert','Controlled by GM'):f('Automatisch','Automatic')}`));
      button(row,s.npcManual[id]?f('Automatik einschalten','Enable automatic play'):f('Selbst steuern','Control manually'),()=>this.request('npcControl',{id,manual:!s.npcManual[id]}),['finished','aborted'].includes(s.phase));content.append(row);
    }
    const log=el('details');log.open=wasOpen;log.append(el('summary',f('Moderationsprotokoll','Moderation log')));
    for(const line of s.log)log.append(el('p',line.type==='bust'?`${this.name(line.id)}: Farkle (${line.lost} ${f('verloren','lost')})`:`${this.name(line.id)}: +${line.amount} · ${f('Gesamt','Total')}: ${line.total}`));content.append(log);
  }
  drawTable(){
    const root=this.windows.get('farkle')?.root;if(!root)return;root.replaceChildren();const content=el('div',undefined,'schocken-content');root.append(content);
    content.append(el('h2','Farkle'));if(this.openOutcome)button(content,f('Wetten','Bets'),()=>this.openOutcome('farkle'));
    if(game.user.isGM)button(content,f('Moderation öffnen','Open moderation'),()=>{this.window('farkle-moderation');this.drawModeration();});
    const s=this.getState();if(!s){content.append(el('p',f('Der SL öffnet eine Farkle-Lobby.','The GM opens a Farkle lobby.')));return;}
    const play=(action,args={})=>this.request(action,{...args,interactionKey:farkleInteractionKey(s)});
    const current=s.order[s.turn],mine=current===game.user.id,can=mine||game.user.isGM;
    const active=[s.entry>0?`${f('Einstieg','Entry')}: ${s.entry}`:null,s.rules?.smallStraight?f('Kleine Straße 750','Small straight 750'):null,s.rules?.onesBonus?f('Einsen-Bonus','Ones bonus'):null,s.mode==='target'&&s.rules?.immediateTarget?f('Sofortiges Zielende','Immediate target end'):null].filter(Boolean);
    if(active.length)content.append(el('p',`${f('Hausregeln','House rules')}: ${active.join(' · ')}`));
    content.append(el('p',s.mode==='quick'?f('Kurzspiel · ein Zug pro Spieler','Quick game · one turn each'):s.mode==='rounds'?`${f('Feste Runden','Fixed rounds')} · ${f('Runde','Round')} ${s.round||1} / ${s.roundLimit} · ${f('Gesamtpunkte werden addiert','Scores are added together')}`:`${f('Ziel','Target')}: ${s.target} · ${f('Einstieg','Entry')}: ${s.entry}`));
    if(s.startRolls?.length)content.append(el('p',`${f('Startwurf','Starting roll')}: ${s.startRolls.map(roll=>`${this.name(roll.id)} ${roll.value}`).join(' · ')}`,'schocken-help'));
    for(const id of s.players)content.append(el('div',`${id===current?'▶ ':''}${this.name(id)}${s.npcs[id]?' (NPC)':''} · ${s.scores[id]} ${f('Punkte','points')}`,'schocken-player'));
    if(s.phase==='lobby'){
      content.append(el('h3','Lobby · Farkle'));button(content,s.players.includes(game.user.id)?f('Lobby verlassen','Leave lobby'):f('Beitreten','Join'),()=>this.request(s.players.includes(game.user.id)?'leave':'join'));
      if(game.user.isGM)button(content,f('Spiel starten','Start game'),()=>this.request('begin'),s.players.length<(s.mode==='target'?1:2));return;
    }
    const nextGame=()=>{if(game.user.isGM&&s.players.length>=(s.mode==='target'?1:2)){button(content,f('Nächste Partie vorbereiten','Prepare next game'),()=>this.request('restart',{prepare:true}));content.append(el('p',f('Gleiche Spieler und Regeln; die Punkte beginnen wieder bei null.','Same players and rules; scores start at zero again.'),'schocken-help'));}};
    if(s.phase==='aborted'){content.append(el('h3',f('Spiel durch den GM beendet','Game ended by the GM')));nextGame();return;}
    if(s.phase==='finished'){
      content.append(el('h3',s.draw?f('Unentschieden','Draw'):f('Spiel beendet','Game over')));
      if(!s.draw){content.append(el('p',`${f('Gewonnen','Winners')}: ${s.winners.map(id=>this.name(id)).join(', ')}`));if(s.losers.length)content.append(el('p',`${f('Verloren','Losers')}: ${s.losers.map(id=>this.name(id)).join(', ')}`));}nextGame();return;
    }
    content.append(el('h3',`${this.name(current)} · ${f('am Zug','to play')}`));
    if(!game.users.activeGM||s.paused)content.append(el('p',f('Spiel pausiert','Game paused')));
    if(s.finalRemaining!==null)content.append(el('p',`${f('Schlussrunde – verbleibende Züge','Final round – remaining turns')}: ${s.finalRemaining}`));
    if(s.animationPending){content.append(el('p',f('Die 3D-Würfel rollen …','The 3D dice are rolling …'),'schocken-help'));return;}
    const c=s.cup,score=selectionScore(s),total=c.points+(score??0);
    content.append(el('p',`${f('Zugpunkte','Turn points')}: ${total} · ${f('Auswahl','Selection')}: ${score??0}`,'schocken-meta'));
    if(c.dice){
      const row=el('div',undefined,'schocken-dice');
      c.dice.forEach((value,index)=>{const die=button(row,String(value),()=>play('toggle',{index}),!can||s.paused||s.animationWaiting||!game.users.activeGM||c.held[index]);if(c.held[index])die.classList.add('held');if(c.selected.includes(index))die.classList.add('farkle-selected');die.title=c.held[index]?f('Bereits gewertet – nicht ergänzbar','Already scored – cannot be extended'):f('Für diesen Wurf auswählen','Select for this roll');});content.append(row);
      if(c.selected.length&&score===null)content.append(el('p',f('Die Auswahl ist keine gültige Kombination. Wertlose Würfel abwählen.','The selection is not a valid combination. Deselect non-scoring dice.')));
    }
    if(s.animationBust)content.append(el('h3',f('Fehlwurf – Zug beendet','Farkle – turn ended')));
    if(s.animationWaiting)content.append(el('p',f('Würfelanimation wird abgeschlossen …','Finishing dice animation …')));
    if(s.animationNextWaiting)content.append(el('p',f('Noch auf die Würfelanimation der Mitspieler warten …','Waiting for the other players’ dice animation …'),'schocken-help'));
    if(can&&!s.paused&&!s.animationWaiting&&game.users.activeGM){
      const controls=el('div',undefined,'schocken-actions'),valid=score!==null&&score>0;
      if(c.dice&&(game.user.isGM||game.settings.get('taverngames','allowFarkleBestSelection')===true)){const best=button(controls,f('Beste Auswahl','Best selection'),()=>play('best'));if(game.user.isGM&&!game.settings.get('taverngames','allowFarkleBestSelection'))best.title=f('Für die Spielleitung auch ohne Spielerfreigabe verfügbar.','Available to the GM even when player access is off.');}
      button(controls,f('Würfeln','Roll'),()=>play('roll'),s.animationNextWaiting||c.dice!==null&&!valid);
      button(controls,f('Punkte sichern','Bank points'),()=>play('bank'),s.animationNextWaiting||!valid||(s.scores[current]===0&&total<s.entry));content.append(controls);
    }
    const last=s.log.at(-1);if(last)content.append(el('p',last.type==='bust'?`${this.name(last.id)}: Farkle · ${last.lost} ${f('Zugpunkte verloren','turn points lost')}`:`${this.name(last.id)}: ${last.amount} ${f('Punkte gesichert','points banked')}`));
    content.append(el('p',f('Würfel des aktuellen Wurfs auswählen. Kombinationen können nicht über mehrere Würfe gebaut werden. Sechs gewertete Würfel erlauben sechs frische Würfel.','Select dice from the current roll. Combinations cannot be built across rolls. Score all six dice to roll six fresh dice.'),'schocken-help'));
  }
}
