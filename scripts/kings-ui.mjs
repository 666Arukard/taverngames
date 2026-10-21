import {TavernUI,node,control} from './tavern-ui.mjs';
import {withScroll} from './scroll-state.mjs';
import {f} from './farkle-text.mjs';
import {aalActive,aalFree,aalCanRaise,aalPots} from './aalstechen-engine.mjs';
import {KINGS_DICE,kingsTotal} from './kings-engine.mjs';
export class KingsUI extends TavernUI{
 constructor(...args){super(...args);const draw=this.drawTable.bind(this);this.drawTable=()=>withScroll(this.windows.get('table')?.root,draw);}
 drawModeration(){
  const root=this.windows.get('moderation')?.root;if(!root||!game.user.isGM)return;
  const drafts=new Map([...root.querySelectorAll('[data-draft]')].map(e=>[e.dataset.draft,e.value])),expanded=root.querySelector('details')?.open??false,focus=document.activeElement?.dataset.draft;root.replaceChildren();const c=node('div',undefined,'schocken-content'),s=this.getState();root.append(c);c.append(node('h2',f('Spiel der Könige','Game of Kings')));
  control(c,f('Spieltisch öffnen','Open game table'),()=>{this.window('table');this.drawTable();});control(c,f('Anleitung','Instructions'),()=>this.guide());
  const label=node('label'),show=node('input');show.type='checkbox';show.checked=game.settings.get('taverngames','showkingsLauncher')===true;show.onchange=()=>void game.settings.set('taverngames','showkingsLauncher',show.checked);label.append(show,document.createTextNode(f('Unteren Spielbutton einblenden','Show bottom game button')));c.append(label);
  const setup=node('details');setup.open=expanded;setup.append(node('summary',f('Neue Partie & Regeln','New game & rules')));setup.append(node('p',f('Verdeckt W8, W6 und W4 würfeln, nach jedem Würfel setzen. Höchste Summe gewinnt.','Hidden d8, d6 and d4, betting after each die. Highest total wins.')));
  const rl=node('label',f('Anfängliche Mindesterhöhung (Token)','Initial minimum raise (tokens)')),raise=node('input');raise.type='number';raise.min=1;raise.max=1000000;raise.value=s?.minimumRaise??1;raise.dataset.draft='minimumRaise';rl.append(raise);setup.append(rl);
  const nl=node('label',f('NPCs – ein Name pro Zeile','NPCs – one name per line')),npcs=node('textarea');npcs.dataset.draft='npcs';npcs.rows=3;npcs.value=Object.values(s?.npcs??{}).join('\n');nl.append(npcs);setup.append(nl);
  control(setup,f('Lobby öffnen','Open lobby'),()=>this.request('lobby',{minimumRaise:Number(raise.value),npcs:npcs.value.split('\n').map(n=>n.trim()).filter(Boolean)}),s&&!['lobby','finished','aborted'].includes(s.phase));c.append(setup);
  for(const e of root.querySelectorAll('[data-draft]')){if(drafts.has(e.dataset.draft))e.value=drafts.get(e.dataset.draft);if(focus===e.dataset.draft)e.focus();}if(!s)return;
  const ended=['finished','aborted'].includes(s.phase);if(s.phase==='lobby')control(c,f('Spiel starten','Start game'),()=>this.request('begin'),s.players.length<2||s.paused);
  if(!ended){control(c,s.paused?f('Fortsetzen','Resume'):f('Pause','Pause'),()=>this.request('pause'));control(c,f('Spiel beenden / Einsätze erstatten','End game / refund stakes'),()=>this.request('abort'));}
  else control(c,f('Nächste Partie vorbereiten','Prepare next game'),()=>this.request('restart'));
  for(const [id,name]of Object.entries(s.npcs)){const row=node('div',`${name} · ${s.npcManual[id]?f('SL steuert','GM controls'):f('Automatisch','Automatic')}`);control(row,s.npcManual[id]?f('Automatik einschalten','Enable automatic play'):f('Selbst steuern','Control manually'),()=>this.request('npcControl',{id,manual:!s.npcManual[id]}),ended);c.append(row);}
 }
 drawTable(){
  const root=this.windows.get('table')?.root;if(!root)return;
  const old=root.querySelector('[data-poker-raise]'),value=old?.value,focus=document.activeElement===old;
  root.replaceChildren();const c=node('div',undefined,'schocken-content'),s=this.getState();root.append(c);c.append(node('h2',f('Spiel der Könige','Game of Kings')));
  if(!s){c.append(node('p',f('Der SL öffnet eine Lobby.','The GM opens a lobby.')));return;}
  const tokens=s.economy?.mode==='tokens',alive=aalActive(s),blocked=s.paused||s.animationWaiting||!game.users.activeGM;
  const status={lobby:f('Lobby','Lobby'),rolling:f('Verdeckter Wurf','Hidden throw')+' · '+f('W','d')+KINGS_DICE[s.stage],betting:f('Setzphase','Betting round')+' '+s.bettingStage,finished:s.seriesClosed?f('Partie beendet','Session ended'):f('Runde beendet','Round over'),aborted:f('Spiel beendet – Einsätze erstattet','Game ended – stakes refunded')};
  c.append(node('p',status[s.phase]??s.phase));
  if(s.animationPending)c.append(node('p',f('Die 3D-Würfel rollen …','The 3D dice are rolling …')));
  if(s.paused&&!['finished','aborted'].includes(s.phase))c.append(node('p',f('Spiel pausiert','Game paused')));
  if(tokens)c.append(node('p',`${f('Topf','Pot')}: ${Object.values(s.contributions).reduce((n,v)=>n+v,0)} ${f('Spieltoken','game tokens')}`));
  if(tokens&&s.phase!=='finished')for(const [i,p]of aalPots(s).pots.entries())c.append(node('p',`${p.refund?f('Nicht mitgegangener Überschuss','Unmatched excess'):i===0?f('Haupttopf','Main pot'):f('Nebentopf','Side pot')}: ${p.amount} · ${f('Berechtigt','Eligible')}: ${p.eligible.map(id=>this.name(id)).join(', ')}`));
  for(const id of s.players){
   const row=node('section',undefined,'schocken-player');row.dataset.pokerPlayer=id;const can=id===game.user.id||game.user.isGM&&s.npcs[id]&&s.npcManual[id],current=s.order[s.turn]===id,send=(action,args={})=>this.request(action,{...args,id});
   row.append(node('h3',`${current&&!['lobby','finished','aborted'].includes(s.phase)?'▶ ':''}${this.name(id)}${s.folded.includes(id)?' · '+f('ausgestiegen','folded'):''}`));c.append(row);
   if(tokens)row.append(node('p',`${f('Beitrag','Contribution')}: ${s.contributions[id]??0} · ${f('Frei','Free')}: ${aalFree(s,id)}`));
   const dice=node('div',undefined,'schocken-dice');for(const [i,n]of (s.hands[id]??[]).entries()){
    const die=node('span',n===null?'?':String(n),'taverngames-die');die.dataset.dieType='d'+KINGS_DICE[i];die.title=f('W','d')+KINGS_DICE[i];dice.append(die);
   }row.append(dice);
   if(s.hands[id]?.length&&s.hands[id].every(Number.isInteger))row.append(node('p',`${f('Summe','Total')}: ${kingsTotal(s.hands[id])}`));
   if(!can||!current)continue;
   if(s.phase==='rolling'&&alive.includes(id))control(row,f('Würfeln','Roll')+' · '+f('W','d')+KINGS_DICE[s.stage],()=>send('roll'),blocked);
   if(s.phase==='betting'){
    const own=s.street[id]??0,free=aalFree(s,id),owing=s.currentBet-own,opponent=alive.some(p=>p!==id&&aalFree(s,p)>0);
    row.append(node('p',`${f('Mitgehen','To call')}: ${owing} · ${f('Mindesterhöhung','Minimum raise')}: ${s.lastRaise}`));
    control(row,owing?`${f('Mitgehen','Call')} ${Math.min(owing,free)}`:f('Schieben','Check'),()=>send(owing?'call':'check'),blocked);
    const l=node('label',f('Erhöhen auf','Raise to')),n=node('input');n.type='number';n.min=s.currentBet+s.lastRaise;n.max=own+free;n.value=value??s.currentBet+s.lastRaise;n.dataset.pokerRaise=id;l.append(n);row.append(l);if(focus)n.focus();
    control(row,f('Erhöhen','Raise'),()=>send('raise',{to:Number(n.value)}),blocked||!opponent||!aalCanRaise(s,id)||own+free<s.currentBet+s.lastRaise);
    control(row,'All-in',()=>send('allIn'),blocked||free===0||own+free>s.currentBet&&(!opponent||!aalCanRaise(s,id)));
    control(row,f('Aussteigen','Fold'),()=>send('fold'),blocked||owing===0);
   }
  }
  if(s.phase==='lobby'){const joined=s.players.includes(game.user.id);control(c,joined?f('Lobby verlassen','Leave lobby'):f('Beitreten','Join'),()=>this.request(joined?'leave':'join'),s.paused);}
  if(s.phase==='finished'){c.append(node('h3',`${f('Gewonnen','Winners')}: ${s.winners.map(id=>this.name(id)).join(', ')}`));for(const [i,p]of s.pots.entries())c.append(node('p',`${p.refund?f('Rückgabe','Refund'):i===0?f('Haupttopf','Main pot'):f('Nebentopf','Side pot')} ${i+1}: ${p.amount} · ${Object.entries(p.shares).map(([id,n])=>`${this.name(id)}: ${n}`).join(', ')}`));}
 }
}
