import {ConnectUI} from './connect-four-ui.mjs';
import {node,control} from './tavern-ui.mjs';
import {f} from './farkle-text.mjs';
export class TicUI extends ConnectUI{
 drawModeration(){super.drawModeration();const heading=this.windows.get('moderation')?.root?.querySelector('h2');if(heading)heading.textContent='Tic-Tac-Toe · Beta';}
 drawTable(){const root=this.windows.get('table')?.root;if(!root)return;root.replaceChildren();const c=node('div',undefined,'schocken-content'),s=this.getState();root.append(c);c.append(node('h2','Tic-Tac-Toe · Beta'));if(!s)return;
  for(const id of s.players)c.append(node('p',this.name(id)+' · '+(s.scores[id]??0)+' '+f('Punkte','points')));
  if(s.phase==='lobby'){const joined=s.players.includes(game.user.id);control(c,joined?f('Lobby verlassen','Leave lobby'):f('Beitreten','Join'),()=>this.request(joined?'leave':'join'),s.paused||!joined&&s.players.length>=2);return;}
  const active=s.order[s.turn],allowed=active===game.user.id||game.user.isGM&&s.npcs[active]&&s.npcManual[active],play=node('section',undefined,'taverngames-connect-play'),status=node('p',s.phase==='playing'?this.name(active)+f(' ist am Zug',' is taking a turn'):s.phase==='roundEnd'?(s.roundWinner?this.name(s.roundWinner)+f(' gewinnt die Runde',' wins the round'):f('Runde unentschieden','Round drawn')):s.phase==='finished'?(s.draw?f('Unentschieden','Draw'):s.winners.map(id=>this.name(id)).join(', ')+f(' gewinnt',' wins')):f('Partie beendet','Session ended'),'taverngames-connect-status');status.setAttribute('role','status');play.append(status);c.append(play);
  const board=node('div',undefined,'taverngames-tic-board');board.setAttribute('role','group');board.setAttribute('aria-label',f('Tic-Tac-Toe: drei Reihen, drei Spalten','Tic-Tac-Toe: three rows, three columns'));
  for(const [index,id]of s.board.entries()){const mark=id?(s.order.indexOf(id)===0?'×':'○'):'';const button=control(board,mark,async()=>{const live=this.getState();if(live?.phase!=='playing'||live.revision!==s.revision){this.drawTable();return;}for(const b of board.querySelectorAll('button'))b.disabled=true;try{await this.request('place',{index});}finally{this.drawTable();}},s.phase!=='playing'||s.paused||!allowed||!!id);button.dataset.ticCell=index;button.setAttribute('aria-label',`${f('Feld','Field')} ${index+1}: ${id?this.name(id):f('leer','empty')}`);if(s.winningCells.includes(index)){button.classList.add('is-winning');button.dataset.winning='true';}}
  play.append(board);if(s.phase==='roundEnd'&&game.user.isGM)control(c,f('Nächste Runde','Next round'),()=>this.request('nextRound'));
 }
}
