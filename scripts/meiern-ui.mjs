import {TavernUI,node,control,selectField} from './tavern-ui.mjs';
import {withScroll} from './scroll-state.mjs';
import {f} from './farkle-text.mjs';
import {MEIERN_VALUES,meiernRank} from './meiern-engine.mjs';
export class MeiernUI extends TavernUI{
 constructor(...args){super(...args);const draw=this.drawTable.bind(this);this.drawTable=()=>withScroll(this.windows.get('table')?.root,draw);}
 drawModeration(){
  const root=this.windows.get('moderation')?.root;if(!root||!game.user.isGM)return;
  const drafts=new Map([...root.querySelectorAll('[data-draft]')].map(e=>[e.dataset.draft,e.value])),expanded=root.querySelector('details')?.open??false,focus=document.activeElement?.dataset.draft;
  root.replaceChildren();const c=node('div',undefined,'schocken-content'),s=this.getState();root.append(c);c.append(node('h2','Meiern · Beta'));
  control(c,f('Spieltisch öffnen','Open game table'),()=>{this.window('table');this.drawTable();});control(c,f('Anleitung','Instructions'),()=>this.guide());
  const label=node('label'),show=node('input');show.type='checkbox';show.checked=game.settings.get('taverngames','showmeiernLauncher')===true;show.onchange=()=>void game.settings.set('taverngames','showmeiernLauncher',show.checked);label.append(show,document.createTextNode(f('Unteren Spielbutton einblenden','Show bottom game button')));c.append(label);
  const setup=node('details');setup.open=expanded;setup.append(node('summary',f('Neue Partie & Regeln','New game & rules')));
  const mode=selectField(setup,f('Spielmodus','Game mode'),[['rounds',f('Feste Durchgänge','Fixed rounds')],['endless',f('Unbegrenzt','Unlimited')]],s?.mode??'rounds','mode'),rl=node('label',f('Aufgedeckte Durchgänge','Revealed rounds')),rounds=node('input');rounds.type='number';rounds.min=1;rounds.max=1000;rounds.value=s?.roundLimit??10;rounds.dataset.draft='roundLimit';rl.append(rounds);setup.append(rl);
  const nl=node('label',f('NPCs – ein Name pro Zeile','NPCs – one name per line')),npcs=node('textarea');npcs.dataset.draft='npcs';npcs.rows=3;npcs.value=Object.values(s?.npcs??{}).join('\n');nl.append(npcs);setup.append(nl);
  control(setup,f('Lobby öffnen','Open lobby'),()=>this.request('lobby',{mode:mode.value,roundLimit:Number(rounds.value),npcs:npcs.value.split('\n').map(n=>n.trim()).filter(Boolean)}),s&&!['lobby','finished','aborted'].includes(s.phase));c.append(setup);
  for(const e of root.querySelectorAll('[data-draft]')){if(drafts.has(e.dataset.draft))e.value=drafts.get(e.dataset.draft);if(focus===e.dataset.draft)e.focus();}mode.onchange=()=>rounds.disabled=mode.value!=='rounds';mode.onchange();
  if(!s)return;const ended=['finished','aborted'].includes(s.phase);
  if(s.phase==='lobby')control(c,f('Spiel starten','Start game'),()=>this.request('begin'),s.players.length<2||s.paused);
  if(!ended){control(c,s.paused?f('Fortsetzen','Resume'):f('Pause','Pause'),()=>this.request('pause'));if(s.completedRounds&&(s.phase==='reveal'||s.phase==='ready'&&!s.cup))control(c,f('Partie werten und abschließen','Score and finish game'),()=>this.request('finish'),s.paused||s.animationWaiting);control(c,f('Spiel abbrechen','Abort game'),()=>this.request('abort'));}
  else control(c,f('Nächste Partie vorbereiten','Prepare next game'),()=>this.request('restart'));
  for(const [id,name]of Object.entries(s.npcs)){const row=node('div',`${name} · ${s.npcManual[id]?f('SL steuert','GM controls'):f('Automatisch','Automatic')}`);control(row,s.npcManual[id]?f('Automatik einschalten','Enable automatic play'):f('Selbst steuern','Control manually'),()=>this.request('npcControl',{id,manual:!s.npcManual[id]}),ended);c.append(row);}
 }
 drawTable(){
  const root=this.windows.get('table')?.root;if(!root)return;root.replaceChildren();const c=node('div',undefined,'schocken-content'),s=this.getState();root.append(c);c.append(node('h2','Meiern · Beta'));
  if(!s){c.append(node('p',f('Der SL öffnet eine Lobby.','The GM opens a lobby.')));return;}
  c.append(node('p',`${f('Durchgang','Round')} ${s.round}${s.mode==='rounds'?` / ${s.roundLimit}`:''} · ${s.completedRounds} ${f('aufgedeckt','revealed')}`));
  const status=node('p',f('Die 3D-Würfel rollen …','The 3D dice are rolling …'));status.style.minHeight='1.5em';status.style.visibility=s.animationPending?'visible':'hidden';c.append(status);
  if(s.paused)c.append(node('p',f('Spiel pausiert','Game paused')));
  const active=s.order[s.turn],blocked=s.paused||s.animationWaiting||!game.users.activeGM;
  for(const id of s.players){const row=node('section',undefined,'schocken-player');row.append(node('h3',`${id===active?'▶ ':''}${this.name(id)} · ${s.scores[id]??0} ${f('Punkte','points')}${s.out.includes(id)?` · ${f('ausgeschieden','eliminated')}`:''}`));c.append(row);
   if(id!==active||!(id===game.user.id||game.user.isGM&&s.npcs[id]&&s.npcManual[id]))continue;
   if(s.phase==='ready')control(row,f('Würfeln','Roll'),()=>this.request('roll'),blocked);
   if(s.phase==='claim'){const value=selectField(row,f('Ansage','Claim'),MEIERN_VALUES.filter(v=>!s.bid||meiernRank(v)>meiernRank(s.bid.value)).map(v=>[v,String(v)]),MEIERN_VALUES.find(v=>!s.bid||meiernRank(v)>meiernRank(s.bid.value)),'claim');control(row,f('Ansagen','Declare'),()=>this.request('declare',{value:Number(value.value)}),blocked);}
   if(s.phase==='respond'){control(row,f('Glauben & selbst würfeln','Believe & take the dice'),()=>this.request('believe'),blocked||s.bid.value===21);control(row,f('Anzweifeln & aufdecken','Challenge & reveal'),()=>this.request('challenge'),blocked);}
  }
  if(s.bid)c.append(node('p',`${f('Ansage','Claim')}: ${this.name(s.bid.actor)} · ${s.bid.value}`));
  if(s.cup){c.append(node('p',`${f('Würfel von','Dice of')} ${this.name(s.cup.actor)}`));const dice=node('div',undefined,'schocken-dice');for(const v of s.cup.dice){const d=node('span',v===null?'?':String(v),'schocken-die taverngames-die');d.title=v===null?f('Verdeckt','Hidden'):String(v);dice.append(d);}c.append(dice);}
  if(s.resolution){const r=s.resolution;c.append(node('p',`${f('Angezweifelt','Challenged')}: ${r.claim} · ${f('Tatsächlich','Actual')}: ${r.actual}`));for(const p of r.payments)c.append(node('p',`${this.name(p.from)} → ${this.name(p.to)}: ${p.multiplier*(s.economy?.mode==='tokens'?s.economy.config.stake:1)} ${s.economy?.mode==='tokens'?f('Spieltoken','game tokens'):f('Punkte','points')}`));if(s.phase==='reveal'&&(game.user.isGM||game.user.id===r.starter))control(c,f('Nächster Durchgang','Next round'),()=>this.request('next'),blocked);}
  if(s.phase==='lobby'){const joined=s.players.includes(game.user.id);control(c,joined?f('Lobby verlassen','Leave lobby'):f('Beitreten','Join'),()=>this.request(joined?'leave':'join'),s.paused);}
  if(s.phase==='finished')c.append(node('h3',`${f('Gewonnen','Winners')}: ${s.winners.map(id=>this.name(id)).join(', ')}`));
  if(s.phase==='aborted')c.append(node('h3',f('Spiel abgebrochen','Game aborted')));
 }
}
