import {TavernUI,node,control} from './tavern-ui.mjs';
import {withScroll} from './scroll-state.mjs';
import {f} from './farkle-text.mjs';
import {aalActive,aalFree,aalCanRaise,aalPots} from './aalstechen-engine.mjs';
export class AalstechenUI extends TavernUI{
 constructor(...args){super(...args);const draw=this.drawTable.bind(this);this.drawTable=()=>withScroll(this.windows.get('table')?.root,draw);}
 drawModeration(){
  const root=this.windows.get('moderation')?.root;if(!root||!game.user.isGM)return;
  const drafts=new Map([...root.querySelectorAll('[data-draft]')].map(e=>[e.dataset.draft,e.value])),expanded=root.querySelector('details')?.open??false,focus=document.activeElement?.dataset.draft;root.replaceChildren();const c=node('div',undefined,'schocken-content'),s=this.getState();root.append(c);c.append(node('h2','Aalstechen'));
  control(c,f('Spieltisch öffnen','Open game table'),()=>{this.window('table');this.drawTable();});control(c,f('Anleitung','Instructions'),()=>this.guide());
  const label=node('label'),show=node('input');show.type='checkbox';show.checked=game.settings.get('taverngames','showaalstechenLauncher')===true;show.onchange=()=>void game.settings.set('taverngames','showaalstechenLauncher',show.checked);label.append(show,document.createTextNode(f('Unteren Spielbutton einblenden','Show bottom game button')));c.append(label);
  const setup=node('details');setup.open=expanded;setup.append(node('summary',f('Neue Partie & Regeln','New game & rules')));setup.append(node('p',f('Sichtbare Restwürfel, fünf Runden pro Block. Einkauf über Einsätze & Spieltoken festlegen.','Public remaining dice, five rounds per block. Configure the buy-in under Stakes & game tokens.')));
  const rl=node('label',f('Anfängliche Mindesterhöhung (Token)','Initial minimum raise (tokens)')),raise=node('input');raise.type='number';raise.min=1;raise.max=1000000;raise.value=s?.minimumRaise??1;raise.dataset.draft='minimumRaise';rl.append(raise);setup.append(rl);
  const nl=node('label',f('NPCs – ein Name pro Zeile','NPCs – one name per line')),npcs=node('textarea');npcs.dataset.draft='npcs';npcs.rows=3;npcs.value=Object.values(s?.npcs??{}).join('\n');nl.append(npcs);setup.append(nl);
  control(setup,f('Lobby öffnen','Open lobby'),()=>this.request('lobby',{minimumRaise:Number(raise.value),npcs:npcs.value.split('\n').map(n=>n.trim()).filter(Boolean)}),s&&!['lobby','finished','aborted'].includes(s.phase));c.append(setup);
  for(const e of root.querySelectorAll('[data-draft]')){if(drafts.has(e.dataset.draft))e.value=drafts.get(e.dataset.draft);if(focus===e.dataset.draft)e.focus();}if(!s)return;
  const ended=['finished','aborted'].includes(s.phase);if(s.phase==='lobby')control(c,f('Spiel starten','Start game'),()=>this.request('begin'),s.players.length<2||s.paused);
  if(!ended){control(c,s.paused?f('Fortsetzen','Resume'):f('Pause','Pause'),()=>this.request('pause'));if(s.phase==='roundEnd')control(c,f('Nächste Würfelrunde','Next dice round'),()=>this.request('next'),s.paused||s.animationWaiting);control(c,f('Spiel beenden / Einsätze erstatten','End game / refund stakes'),()=>this.request('abort'));}
  else control(c,f('Nächste Partie vorbereiten','Prepare next game'),()=>this.request('restart'));
  for(const [id,name]of Object.entries(s.npcs)){const row=node('div',`${name} · ${s.npcManual[id]?f('SL steuert','GM controls'):f('Automatisch','Automatic')}`);control(row,s.npcManual[id]?f('Automatik einschalten','Enable automatic play'):f('Selbst steuern','Control manually'),()=>this.request('npcControl',{id,manual:!s.npcManual[id]}),ended);c.append(row);}
 }
 drawTable(){
  const root=this.windows.get('table')?.root;if(!root)return;const draft=root.querySelector('[data-aal-raise]'),draftId=draft?.dataset.aalRaise,draftValue=draft?.value,focus=document.activeElement===draft;root.replaceChildren();const c=node('div',undefined,'schocken-content'),s=this.getState();root.append(c);c.append(node('h2','Aalstechen'));if(!s){c.append(node('p',f('Der SL öffnet eine Lobby.','The GM opens a lobby.')));return;}
  c.append(node('p',`${f('Würfelrunde','Dice round')} ${s.round} · ${f('Block','Block')} ${Math.ceil(s.round/5)} · ${(s.round-1)%5+1}/5`));const status=node('p',f('Die 3D-Würfel rollen …','The 3D dice are rolling …'));status.style.minHeight='1.5em';status.style.visibility=s.animationPending?'visible':'hidden';c.append(status);
  const tokens=s.economy?.mode==='tokens',alive=aalActive(s),blocked=s.paused||s.animationWaiting||s.animationNextWaiting||!game.users.activeGM;
  if(s.paused)c.append(node('p',f('Spiel pausiert','Game paused')));if(tokens)c.append(node('p',`${f('Topf','Pot')}: ${Object.values(s.contributions).reduce((n,v)=>n+v,0)} ${f('Spieltoken','game tokens')}`));
  if(tokens&&s.phase!=='finished')for(const [i,p]of aalPots(s).pots.entries())c.append(node('p',`${p.refund?f('Nicht mitgegangener Überschuss','Unmatched excess'):i===0?f('Haupttopf','Main pot'):f('Nebentopf','Side pot')}: ${p.amount} · ${f('Berechtigt','Eligible')}: ${p.eligible.map(id=>this.name(id)).join(', ')}`));
  for(const id of s.players){
   const row=node('section',undefined,'schocken-player');row.dataset.aalPlayer=id;row.append(node('h3',`${s.phase==='betting'&&s.pending[0]===id?'▶ ':''}${this.name(id)}${s.folded.includes(id)?` · ${f('ausgestiegen','folded')}`:Object.hasOwn(s.eliminatedAt,id)?` · ${f('ausgeschieden','eliminated')}`:''}`));c.append(row);
   if(s.phase!=='lobby')row.append(node('p',`${f('Übrig','Remaining')}: ${s.remaining[id]?.map(n=>f('W','d')+n).join(', ')||'–'}${tokens?` · ${f('Beitrag','Contribution')}: ${s.contributions[id]??0} · ${f('Frei','Free')}: ${aalFree(s,id)}${alive.includes(id)&&aalFree(s,id)===0?' · All-in':''}`:''}`));
   const dice=node('div',undefined,'schocken-dice');for(const d of s.last[id]??[]){const die=node('span',String(d.value),'taverngames-die');die.dataset.dieType='d'+d.sides;die.title=`${f('W','d')}${d.sides}: ${d.value}${d.value===1?' · '+f('entfernt','removed'):''}`;if(d.value===1)die.classList.add('aal-removed');dice.append(die);}if(dice.childNodes.length)row.append(dice);
   const can=id===game.user.id||game.user.isGM&&s.npcs[id]&&s.npcManual[id],send=(action,args={})=>this.request(action,{...args,id});if(!can)continue;
   if(s.phase==='rolling'&&alive.includes(id))control(row,s.rolled.includes(id)?f('Gewürfelt','Rolled'):f('Würfeln','Roll'),()=>send('roll'),s.paused||s.animationActors?.includes(id)||!game.users.activeGM||s.rolled.includes(id));
   if(s.phase==='betting'&&s.pending[0]===id){const free=aalFree(s,id),own=s.street[id]??0,owing=s.currentBet-own,opponent=alive.some(p=>p!==id&&aalFree(s,p)>0);row.append(node('p',`${f('Mitgehen','To call')}: ${owing} · ${f('Mindesterhöhung','Minimum raise')}: ${s.lastRaise} ${f('Token','tokens')}`));
    control(row,owing?`${f('Mitgehen','Call')} ${Math.min(owing,free)}${free<=owing?' (All-in)':''}`:f('Schieben','Check'),()=>send(owing?'call':'check'),blocked);
    const label=node('label',f('Erhöhen auf','Raise to')),amount=node('input');amount.type='number';amount.min=s.currentBet+s.lastRaise;amount.max=own+free;amount.value=draftId===id?draftValue:s.currentBet+s.lastRaise;amount.dataset.aalRaise=id;label.append(amount);row.append(label);if(focus&&draftId===id)amount.focus();
    control(row,f('Erhöhen','Raise'),()=>send('raise',{to:Number(amount.value)}),blocked||!opponent||!aalCanRaise(s,id)||own+free<s.currentBet+s.lastRaise);
    control(row,'All-in',()=>send('allIn'),blocked||free===0||own+free>s.currentBet&&(!opponent||!aalCanRaise(s,id)));
    control(row,f('Aussteigen','Fold'),()=>send('fold'),blocked||owing===0);
   }
  }
  if(s.phase==='lobby'){const joined=s.players.includes(game.user.id);control(c,joined?f('Lobby verlassen','Leave lobby'):f('Beitreten','Join'),()=>this.request(joined?'leave':'join'),s.paused);}
  if(s.phase==='roundEnd'&&(game.user.isGM||alive.includes(game.user.id)))control(c,f('Nächste Würfelrunde','Next dice round'),()=>this.request('next'),blocked);
  if(s.phase==='finished'){c.append(node('h3',`${f('Gewonnen','Winners')}: ${s.winners.map(id=>this.name(id)).join(', ')}`));for(const [i,p]of s.pots.entries())c.append(node('p',`${p.refund?f('Rückgabe','Refund'):i===0?f('Haupttopf','Main pot'):f('Nebentopf','Side pot')} ${i+1}: ${p.amount} · ${Object.entries(p.shares).map(([id,n])=>`${this.name(id)}: ${n}`).join(', ')}`));}
  if(s.phase==='aborted')c.append(node('h3',f('Spiel beendet – Einsätze erstattet','Game ended – stakes refunded')));
 }
}
