import {PeterSession} from './old-maid-session.mjs';
import {createDomino,actDomino,dominoView,dominoNpc,DOMINO_PROFILE} from './domino-engine.mjs';
import {seriesMetadata} from './continuous-play.mjs';
import {secureIndex} from './start-choice.mjs';
import {escapeHTML,gameTitle} from './tavern-text.mjs';
import {f} from './farkle-text.mjs';
export class DominoSession extends PeterSession{
 restore(s){if(s&&(s.version!==1||s.game!=='domino'))throw Error('Invalid game save.');this.state=structuredClone(s);this.wait=this.now()+1400;}
 project(user){return dominoView(this.state,user);}
 async handleNow(d,user){
  if(!this.enabled()&&!(d.action==='abort'&&user.isGM))throw Error('Beta testing is disabled.');if(d.action==='read')return this.project(user);const old=this.state;
  if(!['join','leave'].includes(d.action)&&!(d.action==='abort'&&user.isGM)&&d.revision!==(old?.revision??-1))throw Error('The game state changed. Please try again.');
  if(d.action==='repairCards'){if(!user.isGM)throw Error('GM only.');await this.repair(true);return this.project(user);}
  let next;
  if(['lobby','restart','nextRound'].includes(d.action)){
   if(!user.isGM)throw Error('GM only.');if(old&&!['lobby','finished','aborted'].includes(old.phase))throw Error('Finish or end the current game first.');
   if(d.action==='lobby'){const o=d.args??{},names=o.npcs??[];if(!Array.isArray(names)||names.length>8||names.some(n=>typeof n!=='string'||!n.trim()||n.length>60))throw Error('Invalid NPCs.');next=createDomino({...o,cardSet:await this.resolveSet(o.set??null,DOMINO_PROFILE),npcs:Object.fromEntries(names.map(n=>['npc-'+crypto.randomUUID(),n.trim()]))});}
   else{if(!old)throw Error('No game exists.');if(d.action==='nextRound'&&(old.phase!=='finished'||old.seriesClosed||old.roundLimit&&(old.seriesRound??1)>=old.roundLimit))throw Error('Finish the round first.');next=createDomino({...old,cardSet:{...old.cardSet,cards:Object.values(old.cards)}});next.players=[...old.players];next.npcManual=structuredClone(old.npcManual);if(d.action==='nextRound'){next.scores={...old.scores};next.players=[...old.order.slice(1),old.order[0]];}}
   next.gameId=crypto.randomUUID();next.revision=(old?.revision??0)+1;
  }else{const active=old?.order[old.turn],id=user.isGM&&old?.npcs[active]&&old.npcManual[active]?active:user.id;next=actDomino(old,id,d.action,d.args,secureIndex,user.isGM,this.pickCard);}
  seriesMetadata(next,old,d.action);if(next.phase==='finished'&&next.roundLimit&&(next.seriesRound??1)>=next.roundLimit)next.seriesClosed=true;await this.commit(next);return this.project(user);
 }
 async commit(next){const old=this.state;if(next.seriesClosed&&next.phase==='finished'){const top=Math.max(...next.players.map(id=>next.scores[id]??0));next.seriesWinners=next.players.filter(id=>(next.scores[id]??0)===top);}await this.save(next);this.state=next;this.wait=this.now()+1400;await this.repair();if(next.phase==='finished'&&old?.phase!=='finished'&&!this.hasAnnouncement(next.gameId)){
   const label=id=>escapeHTML(next.npcs[id]??this.getName(id)),result=next.bankWins?f('Zwei vollständige Passumläufe: kein Sieger. Der Topf geht an die Tavernenbank.','Two complete passing cycles: no winner. The pot goes to the tavern bank.'):f('Gewonnen: ','Winner: ')+next.winners.map(label).join(', ');
   try{await this.announce({content:`<h2>${escapeHTML(gameTitle(this.scope))}</h2><p>${result}</p><p>${f('Punkte','Points')}: ${next.players.map(id=>label(id)+' '+(next.scores[id]??0)).join(' · ')}</p>`,flags:{taverngames:{game:this.scope,gameId:next.gameId}}});}catch(e){globalThis.ui?.notifications?.warn(e.message);}
  }
  if(next.seriesClosed&&next.phase==='finished'&&!old?.seriesClosed){const key=(next.seriesId??next.gameId)+':series';if(!this.hasAnnouncement(key)){const names=next.seriesWinners.map(id=>escapeHTML(next.npcs[id]??this.getName(id))).join(', ');try{await this.announce({content:'<h2>'+escapeHTML(gameTitle(this.scope))+'</h2><p>'+f('Partie beendet. Höchste Siegpunktzahl: ','Session ended. Highest win score: ')+names+'</p>',flags:{taverngames:{game:this.scope,gameId:key}}});}catch(e){globalThis.ui?.notifications?.warn(e.message);}}}
 }
 npcStep(){return this.enqueue(async()=>{if(!this.enabled()||this.now()<this.wait)return false;const move=dominoNpc(this.state);if(!move)return false;const next=actDomino(this.state,move.id,move.action,move.args,secureIndex,false,this.pickCard);if(next.phase==='finished'&&next.roundLimit&&(next.seriesRound??1)>=next.roundLimit)next.seriesClosed=true;await this.commit(next);return true;});}
}
