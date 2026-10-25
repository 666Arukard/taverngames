import {ConnectUI} from './connect-four-ui.mjs';
import {node,control,selectField} from './tavern-ui.mjs';
import {f} from './farkle-text.mjs';
import {renderNpcDifficulty} from './board-npc.mjs';
import {MORRIS_POINTS,MORRIS_EDGES,morrisLegal,morrisMills} from './morris-engine.mjs';
export class MorrisUI extends ConnectUI{
 drawModeration(){
  const root=this.windows.get('moderation')?.root;if(!root||!game.user.isGM)return;
  const drafts=new Map([...root.querySelectorAll('[data-draft]')].map(e=>[e.dataset.draft,e.type==='checkbox'?e.checked:e.value])),s=this.getState();root.replaceChildren();const c=node('div',undefined,'schocken-content');root.append(c);c.append(node('h2',f('Mühle',"Nine Men's Morris")));
  control(c,f('Spieltisch öffnen','Open game table'),()=>{this.window('table');this.drawTable();});control(c,f('Anleitung','Instructions'),()=>this.guide());
  const label=node('label',undefined,'schocken-choice'),show=node('input');show.type='checkbox';show.checked=game.settings.get('taverngames','showmorrisLauncher')===true;show.onchange=()=>game.settings.set('taverngames','showmorrisLauncher',show.checked);label.append(show,document.createTextNode(f('Unteren Spielbutton einblenden','Show bottom game button')));c.append(label);
  const namesLabel=node('label',f('NPCs – höchstens zwei, ein Name pro Zeile','NPCs – up to two, one name per line')),names=node('textarea');names.dataset.draft='npcs';names.value=drafts.get('npcs')??Object.values(s?.npcs??{}).join('\n');namesLabel.append(names);c.append(namesLabel);
  const roundsLabel=node('label',f('Rundenanzahl (1–100)','Rounds (1–100)')),rounds=node('input');rounds.type='number';rounds.min=1;rounds.max=100;rounds.dataset.draft='roundLimit';rounds.value=drafts.get('roundLimit')??s?.roundLimit??1;roundsLabel.append(rounds);c.append(roundsLabel);
  const flying=selectField(c,f('Springen bei drei Steinen','Flying with three pieces'),[['true',f('Ein','On')],['false',f('Aus','Off')]],String(drafts.get('flying')??s?.flying??true),'flying');
  c.append(node('p',f('Remis bei dreifacher Stellung oder 50 Zugpaaren ohne Schlag nach der Setzphase. Eine geschlossene Mühle erlaubt einen Schlag; geschützte Steine nur, wenn kein anderer gegnerischer Stein frei steht.','Draw by threefold repetition or 50 pairs of moves without a capture after placement. A completed mill allows one capture; protected pieces may only be removed if no opponent piece is outside a mill.')));
  control(c,f('Lobby öffnen','Open lobby'),()=>this.request('lobby',{npcs:names.value.split('\n').map(n=>n.trim()).filter(Boolean),roundLimit:Number(rounds.value),flying:flying.value==='true'}),s&&!['lobby','finished','aborted'].includes(s.phase));
  if(s){renderNpcDifficulty(c,s,this.request);control(c,s.paused?f('Fortsetzen','Resume'):f('Pause','Pause'),()=>this.request('pause'));for(const id of Object.keys(s.npcs))control(c,this.name(id)+' · '+(s.npcManual[id]?f('SL steuert','GM controls'):f('Automatisch','Automatic')),()=>this.request('npcControl',{id,manual:!s.npcManual[id]}));}
 }
 drawTable(){
  const root=this.windows.get('table')?.root;if(!root)return;root.replaceChildren();const c=node('div',undefined,'schocken-content'),s=this.getState();root.append(c);c.append(node('h2',f('Mühle',"Nine Men's Morris")));if(!s)return;
  for(const id of s.players)c.append(node('p',this.name(id)+' · '+(s.scores[id]??0)+' '+f('Punkte','points')+' · '+f('Vorrat','Reserve')+': '+(s.reserve[id]??9)+' · '+f('auf dem Brett','on board')+': '+s.board.filter(v=>v===id).length));
  if(s.phase==='lobby'){const joined=s.players.includes(game.user.id);control(c,joined?f('Lobby verlassen','Leave lobby'):f('Beitreten','Join'),()=>this.request(joined?'leave':'join'),s.paused||!joined&&s.players.length>=2);return;}
  const play=node('section',undefined,'taverngames-connect-play taverngames-morris-play');c.append(play);const active=s.order[s.turn],mine=active===game.user.id||game.user.isGM&&s.npcs[active]&&s.npcManual[active];
  let status=s.phase==='playing'?this.name(active)+' · '+(s.capture?f('gegnerischen Stein schlagen','capture an opponent piece'):Object.values(s.reserve).some(n=>n>0)?f('Stein setzen','place a piece'):s.flying&&s.board.filter(v=>v===active).length===3?f('Stein auswählen und springen','select a piece and fly'):f('Stein auswählen und ziehen','select a piece and move')):s.phase==='aborted'?f('Partie beendet','Session ended'):s.phase==='roundEnd'?(s.roundWinner?this.name(s.roundWinner)+f(' gewinnt die Runde',' wins the round'):f('Unentschieden','Draw')):s.draw?f('Unentschieden','Draw'):s.winners.map(id=>this.name(id)).join(', ')+f(' gewinnt',' wins');
  if(s.roundDrawReason)status+=' · '+(s.roundDrawReason==='repetition'?f('Dreifache Stellungswiederholung','Threefold repetition'):f('50 Zugpaare ohne Schlag','50 pairs of moves without a capture'));
  const notice=node('p',status,'taverngames-connect-status');notice.setAttribute('role','status');play.append(notice);
  const board=node('div',undefined,'taverngames-morris-board');board.setAttribute('role','group');board.setAttribute('aria-label',f('Mühlebrett mit 24 Punkten','Morris board with 24 points'));play.append(board);
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');
  for(const [a,b]of MORRIS_EDGES){const line=document.createElementNS(svg.namespaceURI,'line');line.setAttribute('x1',MORRIS_POINTS[a][0]);line.setAttribute('y1',MORRIS_POINTS[a][1]);line.setAttribute('x2',MORRIS_POINTS[b][0]);line.setAttribute('y2',MORRIS_POINTS[b][1]);svg.append(line);}board.append(svg);
  const key=s.gameId+':'+s.revision;if(this.selection?.key!==key)this.selection=null;const moves=morrisLegal(s),mills=new Set(s.millCells??[]),allMills=new Set(s.order.flatMap(id=>morrisMills(s.board,id).flat()));
  for(const [index,id]of s.board.entries()){
   const from=this.selection?.from,choose=moves.some(m=>m.action==='move'&&m.args.from===index),move=moves.find(m=>m.args.index===index&&(m.action!=='move'||m.args.from===from));
   const b=control(board,'',async()=>{
    if(choose){this.selection={key,from:from===index?null:index};this.drawTable();return;}
    const live=this.getState();if(!move||live?.revision!==s.revision||live.phase!=='playing')return;for(const button of board.querySelectorAll('button'))button.disabled=true;try{await this.request(move.action,move.args);}finally{this.selection=null;this.drawTable();}
   },!mine||s.paused||!choose&&!move);
   b.dataset.morrisPoint=index;b.className='taverngames-morris-point '+(id?'player-'+s.order.indexOf(id):'is-empty');b.style.left=MORRIS_POINTS[index][0]+'%';b.style.top=MORRIS_POINTS[index][1]+'%';b.setAttribute('aria-label',f('Punkt ','Point ')+(index+1)+': '+(id?this.name(id):f('frei','empty')));b.classList.toggle('is-source',from===index);b.classList.toggle('is-target',mine&&!!move);b.classList.toggle('is-mill',mills.has(index));if(allMills.has(index))b.title=f('Teil einer geschlossenen Mühle','Part of a closed mill');
  }
  if(s.phase==='roundEnd'&&game.user.isGM)control(c,f('Nächste Runde','Next round'),()=>this.request('nextRound'),s.paused);
 }
}
