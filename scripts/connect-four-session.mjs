import {createTournament,actTournament,tournamentNpc} from './tic-tournament-engine.mjs';
import {createTic,actTic,ticNpc} from './tic-tac-toe-engine.mjs';
import {gameTitle} from './tavern-text.mjs';
import {createConnect,actConnect,connectNpc} from './connect-four-engine.mjs';
import {escapeHTML} from './tavern-text.mjs';
import {f} from './farkle-text.mjs';
export class ConnectSession{
 constructor(scope,deps){Object.assign(this,deps);this.scope=scope;this.create=scope==='tictournament'?createTournament:scope==='tictactoe'?createTic:createConnect;this.act=scope==='tictournament'?actTournament:scope==='tictactoe'?actTic:actConnect;this.npc=scope==='tictournament'?tournamentNpc:scope==='tictactoe'?ticNpc:connectNpc;this.state=null;this.wait=0;this.pending=Promise.resolve();this.now=()=>Date.now();}
 restore(s){if(s&&(s.version!==1||s.game!==this.scope))throw Error('Invalid game save.');this.state=structuredClone(s);this.wait=this.now()+1200;}
 project(){return structuredClone(this.state);}
 enqueue(task){const result=this.pending.then(task);this.pending=result.catch(()=>{});return result;}
 handle(d,user){return this.enqueue(()=>this.handleNow(d,user));}
 async handleNow(d,user){if(!this.enabled()&&!(d.action==='abort'&&user.isGM))throw Error('Beta testing is disabled.');if(d.action==='read')return this.project();const old=this.state;if(!['join','leave'].includes(d.action)&&!(d.action==='abort'&&user.isGM)&&d.revision!==(old?.revision??-1))throw Error('The game state changed. Please try again.');let next;
 if(['lobby','restart'].includes(d.action)){if(!user.isGM)throw Error('GM only.');if(old&&!['lobby','finished','aborted'].includes(old.phase))throw Error('Finish or end the current game first.');if(d.action==='restart'){if(!old)throw Error('No game exists.');next=this.create(old);next.players=[...old.players];next.npcManual=structuredClone(old.npcManual);}else{const names=d.args?.npcs??[];if(!Array.isArray(names)||names.length>(this.scope==='tictournament'?16:2)||names.some(n=>typeof n!=='string'||!n.trim()||n.length>60))throw Error('Invalid NPCs.');next=this.create({...d.args,npcs:Object.fromEntries(names.map(n=>['npc-'+crypto.randomUUID(),n.trim()]))});}next.gameId=crypto.randomUUID();next.revision=(old?.revision??0)+1;
 }else{const active=old?.order[old.turn],id=user.isGM&&old?.npcs[active]&&old.npcManual[active]?active:user.id;next=this.act(old,id,d.action,d.args,user.isGM);}await this.commit(next);return this.project();}
 async commit(next){const old=this.state;await this.save(next);this.state=next;this.wait=this.now()+1200;if(next.phase==='finished'&&old?.phase!=='finished'&&!this.hasAnnouncement(next.gameId))await this.announce({content:'<h2>'+escapeHTML(gameTitle(this.scope))+'</h2><p>'+(next.draw?f('Unentschieden','Draw'):f('Gewonnen','Winners')+': '+next.winners.map(id=>escapeHTML(next.npcs[id]??this.getName(id))).join(', '))+'</p>',flags:{taverngames:{game:this.scope,gameId:next.gameId}}});}
 npcStep(){return this.enqueue(()=>this.npcStepNow());}
 async npcStepNow(){if(!this.enabled()||this.now()<this.wait)return false;const m=this.npc(this.state);if(!m)return false;await this.commit(this.act(this.state,m.id,m.action,m.args));return true;}
}
