import {seriesMetadata} from './continuous-play.mjs';
import {createPoker,actPoker,pokerNpcAction,pokerView} from './poker-engine.mjs';
import {f} from './farkle-text.mjs';
import {escapeHTML} from './tavern-text.mjs';
export class PokerSession{
 constructor(_scope,deps){Object.assign(this,deps);this.now=()=>Date.now();this.state=null;this.wait=null;}
 restore(s){if(s!==null&&(s.version!==1||s.game!=='poker'))throw Error('Invalid game save.');this.state=structuredClone(s);this.updateNpcWait();}
 project(user={}){return pokerView(this.state,user);}
 updateNpcWait(){
  const s=this.state;if(!s){this.wait=null;return;}
  // All automatic rollers share the round deadline; commits and animation ACKs must not postpone it.
  const key=`${s.gameId}:${s.round}:${s.phase}:${s.paused}`,rolling=s.phase==='rolling';
  this.wait={revision:s.revision,key,until:rolling&&this.wait?.key===key?this.wait.until:this.now()+(rolling?1000:5000)};
 }
 async handle(data,user){
  if(!this.enabled()&&!(data.action==='abort'&&user.isGM))throw Error('Beta testing is disabled.');if(data.action==='read')return this.project(user);const old=this.state;
  if(!['join','leave'].includes(data.action)&&!(data.action==='abort'&&user.isGM)&&data.revision!==(old?.revision??-1))throw Error('The game state changed. Please try again.');let next;
  if(['lobby','restart','nextRound'].includes(data.action)){
   if(!user.isGM)throw Error('GM only.');if(old&&!['lobby','finished','aborted'].includes(old.phase))throw Error('Finish or end the current game first.');
   if(['restart','nextRound'].includes(data.action)){if(!old)throw Error('No game exists.');next=createPoker(old);next.players=[...old.players];next.npcManual=structuredClone(old.npcManual);}
   else{const names=data.args?.npcs??[];if(!Array.isArray(names)||names.length>10||names.some(n=>typeof n!=='string'||!n.trim()||n.length>60))throw Error('Invalid NPCs.');next=createPoker({...data.args,npcs:Object.fromEntries(names.map(n=>['npc-'+crypto.randomUUID(),n.trim()]))});}
   next.gameId=crypto.randomUUID();next.revision=(old?.revision??0)+1;
  }else{const id=user.isGM&&old?.npcs[data.args?.id]&&old.npcManual[data.args.id]?data.args.id:user.id;next=actPoker(old,id,data.action,data.args,this.random,user.isGM);}
  seriesMetadata(next,old,data.action);await this.commit(next);return this.project(user);
 }
 async commit(next){const old=this.state;seriesMetadata(next,old);await this.save(next);this.state=next;this.updateNpcWait();if(next.phase==='finished'&&old?.phase!=='finished'&&!this.hasAnnouncement(next.gameId)){
  const names=ids=>ids.map(id=>escapeHTML(next.npcs[id]??this.getName(id))).join(', ');
  try{await this.announce({content:`<h2>${f('Würfelpoker','Dice Poker')} · ${f('Runde beendet','Round over')}</h2><p>${f('Gewonnen','Winners')}: ${names(next.winners)}</p><p>${f('Verloren','Losers')}: ${names(next.losers)||'–'}</p><p>${f('Würfelrunde','Dice round')}: ${next.round}</p>${next.pots.map((p,i)=>`<p>${p.refund?f('Rückgabe','Refund'):i===0?f('Haupttopf','Main pot'):f('Nebentopf','Side pot')} ${i+1}: ${p.amount} ${f('Spieltoken','game tokens')} · ${Object.entries(p.shares).map(([id,n])=>`${names([id])}: ${n}`).join(', ')}</p>`).join('')}`,flags:{taverngames:{game:'poker',gameId:next.gameId}}});}catch(e){globalThis.ui?.notifications?.warn(e.message);}
 }}
 async npcStep(){if(!this.enabled()||!this.state||this.wait?.revision!==this.state.revision||this.now()<this.wait.until)return false;const move=pokerNpcAction(this.state);if(!move)return false;await this.commit(actPoker(this.state,move.id,move.action,move.args,this.random));return true;}
}
