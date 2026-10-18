import {createMeiern,actMeiern,meiernView,meiernNpcAction} from './meiern-engine.mjs';
import {f} from './farkle-text.mjs';
import {escapeHTML} from './tavern-text.mjs';
export class MeiernSession{
 constructor(_scope,deps){Object.assign(this,deps);this.now=()=>Date.now();this.state=null;this.wait=null;}
 restore(s){if(s!==null&&(s.version!==1||s.game!=='meiern'))throw Error('Invalid game save.');this.state=structuredClone(s);this.updateNpcWait();}
 project(user){return meiernView(this.state,user);}
 updateNpcWait(){this.wait=this.state?{revision:this.state.revision,until:this.now()+5000}:null;}
 async handle(data,user){
  if(!this.enabled()&&!(data.action==='abort'&&user.isGM))throw Error('Beta testing is disabled.');
  if(data.action==='read')return this.project(user);const old=this.state;
  if(!['join','leave'].includes(data.action)&&!(data.action==='abort'&&user.isGM)&&data.revision!==(old?.revision??-1))throw Error('The game state changed. Please try again.');let next;
  if(['lobby','restart'].includes(data.action)){
   if(!user.isGM)throw Error('GM only.');if(old&&!['lobby','finished','aborted'].includes(old.phase))throw Error('Finish or end the current game first.');
   if(data.action==='restart'){if(!old)throw Error('No game exists.');next=createMeiern(old);next.players=[...old.players];next.scores=Object.fromEntries(next.players.map(id=>[id,0]));next.npcManual=structuredClone(old.npcManual);}
   else{const names=data.args?.npcs??[];if(!Array.isArray(names)||names.length>10||names.some(n=>typeof n!=='string'||!n.trim()||n.length>60))throw Error('Invalid NPCs.');next=createMeiern({...data.args,npcs:Object.fromEntries(names.map(n=>['npc-'+crypto.randomUUID(),n.trim()]))});}
   next.gameId=crypto.randomUUID();next.revision=(old?.revision??0)+1;
  }else{const active=old?.order?.[old.turn],id=user.isGM&&old?.npcs[active]&&old.npcManual[active]?active:user.id;next=actMeiern(old,id,data.action,data.args,this.random,user.isGM);}
  await this.commit(next);return this.project(user);
 }
 async commit(next){
  const old=this.state;await this.save(next);this.state=next;this.updateNpcWait();
  if(next.phase==='finished'&&old?.phase!=='finished'&&!this.hasAnnouncement(next.gameId)){
   const names=ids=>ids.map(id=>escapeHTML(next.npcs[id]??this.getName(id))).join(', ');
   try{await this.announce({content:`<h2>Meiern · ${f('Spiel beendet','Game over')}</h2><p>${f('Gewonnen','Winners')}: ${names(next.winners)||'–'}</p><p>${f('Verloren','Losers')}: ${names(next.losers)||'–'}</p><p>${next.completedRounds} ${f('aufgedeckte Durchgänge','revealed rounds')}</p><ul>${next.players.map(id=>`<li>${names([id])}: ${next.scores[id]} ${f('Punkte','points')}</li>`).join('')}</ul>`,flags:{taverngames:{game:'meiern',gameId:next.gameId}}});}catch(e){globalThis.ui?.notifications?.warn(e.message);}
  }
 }
 async npcStep(){if(!this.enabled()||!this.state||this.wait?.revision!==this.state.revision||this.now()<this.wait.until)return false;const move=meiernNpcAction(this.state);if(!move)return false;await this.commit(actMeiern(this.state,move.id,move.action,move.args,this.random));return true;}
}
