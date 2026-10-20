import {TavernUI,node,control,selectField} from './tavern-ui.mjs';
import {withScroll} from './scroll-state.mjs';
import {f} from './farkle-text.mjs';
import {klippChoices,KLIPP_NUMBERS} from './klippklapp-engine.mjs';
export class KlippklappUI extends TavernUI{
 constructor(...args){super(...args);const draw=this.drawTable.bind(this);this.drawTable=()=>withScroll(this.windows.get('table')?.root,draw);}
 drawModeration(){
  const root=this.windows.get('moderation')?.root;if(!root||!game.user.isGM)return;
  const drafts=new Map([...root.querySelectorAll('[data-draft]')].map(e=>[e.dataset.draft,e.value])),expanded=root.querySelector('details')?.open??false,focus=document.activeElement?.dataset.draft;
  root.replaceChildren();const c=node('div',undefined,'schocken-content'),s=this.getState();root.append(c);c.append(node('h2','Klippklapp'));
  control(c,f('Spieltisch öffnen','Open game table'),()=>{this.window('table');this.drawTable();});control(c,f('Anleitung','Instructions'),()=>this.guide());
  const label=node('label'),show=node('input');show.type='checkbox';show.checked=game.settings.get('taverngames','showklippklappLauncher')===true;show.onchange=()=>void game.settings.set('taverngames','showklippklappLauncher',show.checked);label.append(show,document.createTextNode(f('Unteren Spielbutton einblenden','Show bottom game button')));c.append(label);
  const setup=node('details');setup.open=expanded;setup.append(node('summary',f('Neue Partie & Regeln','New game & rules')));
  const variant=selectField(setup,f('Regelvariante','Rule variant'),[['A',f('A – Summe oder Einzelwerte','A – sum or face values')],['B',f('B – zusätzlich beliebige Summenkombinationen','B – additional sum combinations')],['C',f('C – Summe oder beide Einzelwerte; Einzelwert nur bei Pasch','C – sum or both faces; single face only on doubles')]],s?.variant??'B','variant');
  const nl=node('label',f('NPCs – ein Name pro Zeile','NPCs – one name per line')),npcs=node('textarea');npcs.dataset.draft='npcs';npcs.rows=3;npcs.value=Object.values(s?.npcs??{}).join('\n');nl.append(npcs);setup.append(nl);
  control(setup,f('Lobby öffnen','Open lobby'),()=>this.request('lobby',{variant:variant.value,npcs:npcs.value.split('\n').map(n=>n.trim()).filter(Boolean)}),s&&!['lobby','finished','aborted'].includes(s.phase));c.append(setup);
  for(const e of root.querySelectorAll('[data-draft]')){if(drafts.has(e.dataset.draft))e.value=drafts.get(e.dataset.draft);if(focus===e.dataset.draft)e.focus();}
  if(!s)return;const ended=['finished','aborted'].includes(s.phase);
  if(s.phase==='lobby')control(c,f('Spiel starten','Start game'),()=>this.request('begin'),s.players.length<2||s.paused);
  if(!ended){control(c,s.paused?f('Fortsetzen','Resume'):f('Pause','Pause'),()=>this.request('pause'));if(s.completedRounds&&s.phase==='reveal')control(c,f('Partie werten und abschließen','Score and finish game'),()=>this.request('finish'),s.paused||s.animationWaiting);control(c,f('Spiel abbrechen','Abort game'),()=>this.request('abort'));}
  else control(c,f('Nächste Partie vorbereiten','Prepare next game'),()=>this.request('restart'));
  for(const [id,name]of Object.entries(s.npcs)){const row=node('div',`${name} · ${s.npcManual[id]?f('SL steuert','GM controls'):f('Automatisch','Automatic')}`);control(row,s.npcManual[id]?f('Automatik einschalten','Enable automatic play'):f('Selbst steuern','Control manually'),()=>this.request('npcControl',{id,manual:!s.npcManual[id]}),ended);if(s.phase!=='lobby')control(row,f('NPC aussteigen lassen','Withdraw NPC'),()=>this.request('leave',{id}),ended||s.out.includes(id)||s.leaving.includes(id)||s.order[s.turn]===id&&s.phase!=='reveal');c.append(row);}
 }
 drawTable(){
  const root=this.windows.get('table')?.root;if(!root)return;const claim=root.querySelector('[data-klipp-claim]'),claimValue=claim?.value,claimFocused=document.activeElement===claim;
  root.replaceChildren();const c=node('div',undefined,'schocken-content'),s=this.getState();root.append(c);c.append(node('h2','Klippklapp'));if(!s){c.append(node('p',f('Der SL öffnet eine Lobby.','The GM opens a lobby.')));return;}
  const active=s.order[s.turn],blocked=s.paused||s.animationWaiting||!game.users.activeGM,own=active===game.user.id||game.user.isGM&&s.npcs[active]&&s.npcManual[active];
  c.append(node('p',`${f('Runde','Round')} ${s.round} · ${f('Variante','Variant')} ${s.variant}`));const status=node('p',f('Die 3D-Würfel rollen …','The 3D dice are rolling …'));status.style.minHeight='1.5em';status.style.visibility=s.animationPending?'visible':'hidden';c.append(status);
  if(s.paused)c.append(node('p',f('Spiel pausiert','Game paused')));
  for(const id of s.players){const row=node('section',undefined,'schocken-player');row.dataset.klippPlayer=id;row.append(node('h3',`${id===active?'▶ ':''}${this.name(id)} · ${s.scores[id]} ${f('Punkte','points')}${s.out.includes(id)?' · '+f('ausgestiegen','left'):s.leaving.includes(id)?' · '+f('Ausstieg vorgemerkt','leaving after claim'):''}`));if(Object.hasOwn(s.actuals,id))row.append(node('p',`${f('Restwert','Remainder')}: ${s.actuals[id]}`));c.append(row);}
  if(s.phase!=='lobby'){
   const key=`${s.gameId}:${s.round}:${s.rollNumber}:${s.board.join()}`;if(this.selectionKey!==key){this.selectionKey=key;this.tiles=new Set();}
   const board=node('div',undefined,'klippklapp-board');board.style.display='grid';board.style.gridTemplateColumns='repeat(6,minmax(0,1fr))';board.style.gap='0.3rem';board.dataset.klippBoard='';c.append(board);
   for(const n of KLIPP_NUMBERS){const open=s.board.includes(n),button=node('button',String(n),'taverngames-die');button.type='button';button.dataset.klippTile=n;button.disabled=!open||!own||s.phase!=='choose'||blocked;button.style.opacity=open?'1':'.25';button.style.textDecoration=open?'none':'line-through';button.setAttribute('aria-pressed',String(this.tiles.has(n)));button.title=open?f('Offen','Open'):f('Geschlossen','Closed');if(this.tiles.has(n))button.style.outline='2px solid gold';button.onclick=()=>{if(this.tiles.has(n))this.tiles.delete(n);else this.tiles.add(n);this.drawTable();};board.append(button);}
   if(s.cup){const dice=node('div',undefined,'schocken-dice');dice.dataset.klippDice='';for(const v of s.cup.dice)dice.append(node('span',String(v),'taverngames-die'));c.append(dice);}
   if(own&&s.phase==='ready'){control(c,f('Würfeln','Roll'),()=>this.request('roll'),blocked);if(s.challengeOpen)control(c,f('Anzweifeln & aufdecken','Challenge & reveal'),()=>this.request('challenge'),blocked);}
   if(own&&s.phase==='choose'){
    const selected=[...this.tiles].sort((a,b)=>a-b),choices=klippChoices(s.board,s.cup.dice,s.variant),valid=choices.some(a=>a.join()===selected.join());
    c.append(node('p',`${f('Mögliche Auswahl, zum Beispiel','Example choices')}: ${choices.slice(0,4).map(a=>a.join(' + ')).join(' / ')||'–'}`));control(c,f('Ausgewählte Klappen schließen','Close selected tiles'),()=>this.request('close',{numbers:selected}),blocked||!valid);
    if(s.cup.dice[0]===s.cup.dice[1])control(c,f('Pasch: ohne Schließen neu würfeln','Doubles: reroll without closing'),()=>this.request('roll'),blocked);
   }
   if(own&&s.phase==='declare'){
    const label=node('label',f('Angesagter Restwert','Claimed remainder')),input=node('input');input.type='number';input.min=0;input.max=s.bid?Math.max(0,s.bid.value-1):78;input.value=claimValue??Math.min(s.actuals[active]??78,Number(input.max));input.dataset.klippClaim='';label.append(input);c.append(label);if(claimFocused)input.focus();control(c,f('Restwert ansagen','Declare remainder'),()=>this.request('declare',{value:Number(input.value)}),blocked);
   }
   if(own&&s.phase==='respond'){control(c,f('Annehmen & Zug beginnen','Accept & begin turn'),()=>this.request('believe'),blocked||s.bid.value===0);control(c,f('Anzweifeln & aufdecken','Challenge & reveal'),()=>this.request('challenge'),blocked);}
  }
  if(s.directComparison&&s.previous)c.append(node('p',`${f('Zu unterbieten','Beat this remainder')}: ${this.name(s.previous.actor)} · ${s.previous.value}`));
  if(s.bid)c.append(node('p',`${f('Ansage','Claim')}: ${this.name(s.bid.actor)} · ${s.bid.value} · ${f('Die nächste Ansage muss niedriger sein.','The next claim must be lower.')}`));
  if(s.resolution){const r=s.resolution;c.append(node('p',r.kind==='klippklapp'?'Klippklapp!':r.kind==='comparison'?`${f('Nicht unterboten – Restwert','Failed to beat – remainder')}: ${r.actual}`:`${f('Ansage','Claim')}: ${r.claim} · ${f('Tatsächlich','Actual')}: ${r.actual}`));for(const p of r.payments)c.append(node('p',`${this.name(p.from)} → ${this.name(p.to)}: ${p.multiplier*(s.economy?.mode==='tokens'?s.economy.config.stake:1)} ${s.economy?.mode==='tokens'?f('Spieltoken','game tokens'):f('Punkte','points')}`));
   if(s.phase==='reveal'&&(game.user.isGM||game.user.id===r.starter))control(c,f('Nächster Durchgang','Next round'),()=>this.request('next'),blocked);
   if(s.phase==='reveal'&&game.user.isGM)control(c,f('Partie abschließen','Finish session'),()=>this.request('finish'),blocked);
  }
  if(s.phase==='lobby'){const joined=s.players.includes(game.user.id);control(c,joined?f('Lobby verlassen','Leave lobby'):f('Beitreten','Join'),()=>this.request(joined?'leave':'join'),s.paused);}
  else if(!['finished','aborted'].includes(s.phase)&&s.players.includes(game.user.id)&&!s.out.includes(game.user.id)&&!s.leaving.includes(game.user.id)&&(active!==game.user.id||s.phase==='reveal'))control(c,f('Aus dem Spiel aussteigen','Leave the game'),()=>this.request('leave'),blocked);
  if(s.phase==='finished')c.append(node('h3',`${f('Gewonnen','Winners')}: ${s.winners.map(id=>this.name(id)).join(', ')}`));if(s.phase==='aborted')c.append(node('h3',f('Spiel abgebrochen','Game aborted')));
 }
}
