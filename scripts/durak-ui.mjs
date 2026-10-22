import {MauUI} from './maumau-ui.mjs';
import {TavernUI,node,control,selectField} from './tavern-ui.mjs';
import {listCardSets,BACK} from './card-sets.mjs';
import {DURAK_PROFILE,durakNeighbors,durakCanTransfer,durakCanBeat} from './durak-engine.mjs';
import {f} from './farkle-text.mjs';
export class DurakUI extends MauUI{
 constructor(...args){super(...args);const timer=setInterval(()=>this.updateTimers(),100);timer?.unref?.();}
 cardActor(s){const choices=[game.user.id,...(game.user.isGM?Object.keys(s.npcs).filter(id=>s.npcManual[id]):[])];return choices.includes(this.controlled)?this.controlled:choices.includes(s.defender)?s.defender:choices.includes(s.attacker)?s.attacker:game.user.id;}
 updateTimers(){const s=this.getState();if(!s)return;for(const root of [this.windows.get('table')?.root,this.cardTable])if(root){for(const label of root.querySelectorAll('[data-durak-countdown]'))label.textContent=f('Schutzzeit: ','Protection: ')+Math.max(0,Math.ceil((s.deadline-Date.now())/1000))+' s';for(const button of root.querySelectorAll('[data-durak-protected]'))button.disabled=!!s.paused||!game.users.activeGM||Date.now()<s.deadline;}}
 async open(){if(game.user.isGM)this.sets=await listCardSets(game,DURAK_PROFILE);return TavernUI.prototype.open.call(this);}
 drawModeration(){
  const root=this.windows.get('moderation')?.root;if(!root||!game.user.isGM)return;const drafts=new Map([...root.querySelectorAll('[data-draft]')].map(e=>[e.dataset.draft,e.type==='checkbox'?e.checked:e.value])),s=this.getState();root.replaceChildren();const c=node('div',undefined,'schocken-content');root.append(c);c.append(node('h2','Durak · Beta'));control(c,f('Spieltisch öffnen','Open game table'),()=>{this.window('table');this.drawTable();});control(c,f('Anleitung','Instructions'),()=>this.guide());
  const checkbox=(title,key,value)=>{const l=node('label',undefined,'schocken-choice'),i=node('input');i.type='checkbox';i.checked=value;i.dataset.draft=key;l.append(i,document.createTextNode(title));c.append(l);return i;};
  const launch=checkbox(f('Unteren Spielbutton einblenden','Show bottom game button'),'launcher',game.settings.get('taverngames','showdurakLauncher')===true);launch.onchange=()=>game.settings.set('taverngames','showdurakLauncher',launch.checked);
  const set=selectField(c,f('Kartenset','Card set'),this.sets.map(s=>[s.key,s.label]),s?.cardSet.key??this.sets[0]?.key??'','set');if(!this.sets.length)c.append(node('p',f('Kein geeignetes Kartenset. Unter Cards / Card Decks ein Deck mit Sechs bis Ass in vier Farben anlegen oder importieren.','No suitable card set. Create or import a deck with six through ace in four suits under Cards / Card Decks.')));
  const l=node('label',f('Schutzzeit (0–60 Sekunden)','Protection (0–60 seconds)')),seconds=node('input');seconds.type='number';seconds.min='0';seconds.max='60';seconds.step='1';seconds.value=s?.protectionSeconds??5;seconds.dataset.draft='protectionSeconds';l.append(seconds);c.append(l);
  const transfer=checkbox(f('Weitergeben nur durch Ausspielen des Trumpfs','Transfer requires playing the trump'),'transferPlay',s?.transferPlay===true),take=checkbox(f('Nachwerfen beim Aufnehmen erlauben','Allow added attacks when taking'),'extendedTake',s?.extendedTake===true),nl=node('label',f('NPCs – ein Name pro Zeile, insgesamt höchstens sechs Teilnehmer','NPCs – one name per line, maximum six total participants')),names=node('textarea');names.rows=3;names.dataset.draft='npcs';names.value=Object.values(s?.npcs??{}).join('\n');nl.append(names);c.append(nl);
  control(c,f('Lobby öffnen','Open lobby'),()=>this.request('lobby',{set:set.value,protectionSeconds:Number(seconds.value),transferPlay:transfer.checked,extendedTake:take.checked,npcs:names.value.split('\n').map(n=>n.trim()).filter(Boolean)}),!this.sets.length||s&&!['lobby','finished','aborted'].includes(s.phase));
  if(s){control(c,f('Kartenbestände wiederherstellen','Restore card stacks'),()=>this.request('repairCards'));if(!['finished','aborted'].includes(s.phase))control(c,s.paused?f('Fortsetzen','Resume'):f('Pause','Pause'),()=>this.request('pause'));for(const [id,name]of Object.entries(s.npcs))control(c,name+' · '+(s.npcManual[id]?f('SL steuert','GM controls'):f('Automatisch','Automatic')),()=>this.request('npcControl',{id,manual:!s.npcManual[id]}));}
  for(const e of root.querySelectorAll('[data-draft]'))if(drafts.has(e.dataset.draft)){if(e.type==='checkbox')e.checked=drafts.get(e.dataset.draft);else e.value=drafts.get(e.dataset.draft);}
 }
 drawTable(){
  const root=this.windows.get('table')?.root;if(!root)return;root.replaceChildren();const c=node('div',undefined,'schocken-content');root.append(c);c.append(node('h2','Durak · Beta'));const s=this.getState();if(!s)return;const actor=this.cardActor(s),blocked=s.paused||!game.users.activeGM,can=id=>id===game.user.id||game.user.isGM&&s.npcs[id]&&s.npcManual[id];
  if(game.user.isGM){const choices=[...s.players.filter(can)];if(choices.length){const select=selectField(c,f('Hand steuern','Control hand'),choices.map(id=>[id,this.name(id)]),actor,'controlled');select.onchange=()=>{this.controlled=select.value;this.ownSelection=undefined;this.drawTable();};}}
  c.append(node('p',s.phase==='playing'?f('Angreifer: ','Attacker: ')+this.name(s.attacker)+' · '+f('Verteidiger: ','Defender: ')+this.name(s.defender)+' · '+f('Stapel: ','Draw pile: ')+s.remaining:s.phase==='finished'?f('Verloren: ','Loser: ')+s.losers.map(id=>this.name(id)).join(', '):s.phase==='aborted'?f('Partie beendet','Session ended'):f('Lobby · 2–6 Teilnehmer','Lobby · 2–6 participants')));
  const table=node('div',undefined,'taverngames-card-table');
  if(s.trumpCard&&s.cards[s.trumpCard]){const trump=node('div',undefined,'taverngames-durak-trump');trump.append(node('p',f('Trumpf','Trump')));this.card(trump,s.cards[s.trumpCard]);table.append(trump);}
  for(const [index,pair]of s.table.entries()){const stack=node('div',undefined,'taverngames-durak-pair'),legal=can(actor)&&actor===s.defender&&!s.taking&&!pair.defense&&this.ownSelection&&durakCanBeat(s,pair.attack,this.ownSelection);this.card(stack,s.cards[pair.attack],null,legal&&!blocked?()=>this.request('defend',{id:actor,card:this.ownSelection,index}):null);if(pair.defense)this.card(stack,s.cards[pair.defense]);table.append(stack);}
  c.append(table);if(s.phase==='playing'&&s.table.length){const timer=node('p',undefined,'taverngames-durak-status');timer.dataset.durakCountdown='';table.append(timer);if(s.revealed.length)table.append(node('p',f('Vorgezeigt: ','Shown: ')+s.revealed.map(p=>this.name(p.owner)+' · '+s.cards[p.card].name).join(' · ')));}
  for(const id of s.players){const row=node('section',undefined,'schocken-player');row.dataset.mauPlayer=id;row.append(node('h3',this.name(id)+(s.out.includes(id)?' · '+f('Fertig','Finished'):'')));const hand=node('div',undefined,'taverngames-card-hand');for(const card of s.hands[id]??[]){const item=this.card(hand,card?s.cards[card]:null,card?null:BACK,id===actor&&can(id)&&s.phase==='playing'&&!s.out.includes(id)&&!blocked?()=>{this.ownSelection=this.ownSelection===card?undefined:card;this.drawTable();}:null);if(card&&this.ownSelection===card)item.classList.add('is-playable');}row.append(hand);c.append(row);}
  if(s.phase==='playing'&&can(actor)&&!s.out.includes(actor)){
   const actions=node('div',undefined,'taverngames-card-actions');table.append(actions);const args={id:actor,card:this.ownSelection},neighbors=durakNeighbors(s);
   if(!s.table.length&&actor===s.attacker)control(actions,f('Angreifen','Attack'),()=>this.request('attack',args),blocked||!this.ownSelection);
   if(s.table.length&&neighbors.includes(actor)){
    const button=control(actions,f('Nachwerfen','Add attack'),()=>this.request('attack',args),blocked||!this.ownSelection||s.table.length>=s.limit||s.taking&&!s.extendedTake);
    if(this.ownSelection&&s.table.length<s.limit&&(!s.taking||s.extendedTake))button.dataset.durakProtected='';
    if((s.taking||s.table.every(p=>p.defense))&&!s.passes.includes(actor)){const pass=control(actions,f('Nicht weiter nachwerfen','No more attacks'),()=>this.request('pass',{id:actor}),blocked);pass.dataset.durakProtected='';}
   }
   if(s.table.length&&actor===s.defender&&!s.taking){control(actions,f('Weitergeben','Transfer'),()=>this.request('transfer',args),blocked||!this.ownSelection||!durakCanTransfer(s,actor,this.ownSelection));control(actions,f('Aufnehmen','Take cards'),()=>this.request('take',{id:actor}),blocked);}
  }
  if(s.phase==='lobby'){const joined=s.players.includes(game.user.id);control(c,joined?f('Lobby verlassen','Leave lobby'):f('Beitreten','Join'),()=>this.request(joined?'leave':'join'));}
  if(s.phase==='finished')c.append(node('p',f('Platzierung: ','Ranking: ')+(s.ranking??[]).map((id,i)=>`${i+1}. ${this.name(id)}`).join(' · ')));
  this.updateTimers();
 }
}
