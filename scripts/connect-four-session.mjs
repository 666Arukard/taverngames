import {createConnect,actConnect,connectNpc} from './connect-four-engine.mjs';
import {escapeHTML} from './tavern-text.mjs';
import {f} from './farkle-text.mjs';
export class ConnectSession{
 constructor(scope,deps){Object.assign(this,deps);this.state=null;this.wait=0;this.now=()=>Date.now();}
 restore(s){if(s&&(s.version!==1||s.game!=='connectfour'))throw Error('Invalid game save.');this.state=structuredClone(s);this.wait=this.now()+1200;}
 project(){return structuredClone(this.state);}
 async handle(d,user){if(!this.enabled()&&!(d.action==='abort'&&user.isGM))throw Error('Beta testing is disabled.');if(d.action==='read')return this.project();const old=this.state;if(!['join','leave'].includes(d.action)&&!(d.action==='abort'&&user.isGM)&&d.revision!==(old?.revision??-1))throw Error('The game state changed. Please try again.');let next;
 if(['lobby','restart'].includes(d.action)){if(!user.isGM)throw Error('GM only.');if(old&&!['lobby','finished','aborted'].includes(old.phase))throw Error('Finish or end the current game first.');if(d.action==='restart'){if(!old)throw Error('No game exists.');next=createConnect(old);next.players=[...old.players];next.npcManual=structuredClone(old.npcManual);}else{const names=d.args?.npcs??[];if(!Array.isArray(names)||names.length>2||names.some(n=>typeof n!=='string'||!n.trim()||n.length>60))throw Error('Invalid NPCs.');next=createConnect({...d.args,npcs:Object.fromEntries(names.map(n=>['npc-'+crypto.randomUUID(),n.trim()]))});}next.gameId=crypto.randomUUID();next.revision=(old?.revision??0)+1;
 }else{const active=old?.order[old.turn],id=user.isGM&&old?.npcs[active]&&old.npcManual[active]?active:user.id;next=actConnect(old,id,d.action,d.args,user.isGM);}await this.commit(next);return this.project();}
 async commit(next){const old=this.state;await this.save(next);this.state=next;this.wait=this.now()+1200;if(next.phase==='finished'&&old?.phase!=='finished'&&!this.hasAnnouncement(next.gameId))await this.announce({content:'<h2>'+f('Vier gewinnt','Four in a Row')+'</h2><p>'+f('Gewonnen','Winners')+': '+next.winners.map(id=>escapeHTML(next.npcs[id]??this.getName(id))).join(', ')+'</p>',flags:{taverngames:{game:'connectfour',gameId:next.gameId}}});}
 async npcStep(){if(!this.enabled()||this.now()<this.wait)return false;const m=connectNpc(this.state);if(!m)return false;await this.commit(actConnect(this.state,m.id,m.action,m.args));return true;}
}
