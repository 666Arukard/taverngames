import {createPeter,actPeter,peterView,peterNpc} from './old-maid-engine.mjs';
import {secureIndex} from './start-choice.mjs';
import {escapeHTML,gameTitle} from './tavern-text.mjs';
import {f} from './farkle-text.mjs';
export class PeterSession{
 constructor(scope,deps){Object.assign(this,deps);this.scope=scope;this.state=null;this.wait=0;this.now=()=>Date.now();this.pending=Promise.resolve();}
 restore(s){if(s&&(s.version!==1||s.game!=='oldmaid'))throw Error('Invalid game save.');this.state=structuredClone(s);this.wait=this.now()+1800;}
 project(user){return peterView(this.state,user);}
 enqueue(fn){const result=this.pending.then(fn);this.pending=result.catch(()=>{});return result;}
 async repair(force=false){try{if(force)await this.stacks.rebuild(this.state);else await this.stacks.sync(this.state);this.nativeError=null;}catch(e){const changed=this.nativeError!==e.message;this.nativeError=e.message;if(changed)globalThis.ui?.notifications?.warn(gameTitle(this.scope)+': '+e.message);}}
 handle(d,user){return this.enqueue(()=>this.handleNow(d,user));}
 async handleNow(d,user){if(!this.enabled()&&!(d.action==='abort'&&user.isGM))throw Error('This game is disabled.');if(d.action==='read')return this.project(user);const old=this.state;if(!['join','leave'].includes(d.action)&&!(d.action==='abort'&&user.isGM)&&d.revision!==(old?.revision??-1))throw Error('The game state changed. Please try again.');
  if(d.action==='repairCards'){if(!user.isGM)throw Error('GM only.');await this.repair(true);return this.project(user);}
  let next;if(['lobby','restart'].includes(d.action)){if(!user.isGM)throw Error('GM only.');if(old&&!['lobby','finished','aborted'].includes(old.phase))throw Error('Finish or end the current game first.');
   if(d.action==='restart'){if(!old)throw Error('No game exists.');next=createPeter({...old,included:Object.keys(old.cards),cardSet:{...old.cardSet,cards:Object.values(old.cards)}});next.players=[...old.players];next.npcManual=structuredClone(old.npcManual);}
   else{const names=d.args?.npcs??[];if(!Array.isArray(names)||names.length>8||names.some(n=>typeof n!=='string'||!n.trim()||n.length>60))throw Error('Invalid NPCs.');next=createPeter({...d.args,cardSet:await this.resolveSet(d.args?.set??null),npcs:Object.fromEntries(names.map(n=>['npc-'+crypto.randomUUID(),n.trim()]))});}next.gameId=crypto.randomUUID();next.revision=(old?.revision??0)+1;
  }else{const active=old?.order[old.turn],id=user.isGM&&old?.npcs[active]&&old.npcManual[active]?active:user.id;next=actPeter(old,id,d.action,d.args,secureIndex,user.isGM,this.pickCard);}
  await this.commit(next);return this.project(user);
 }
 async commit(next){const old=this.state;await this.save(next);this.state=next;this.wait=this.now()+1800;await this.repair();if(next.phase==='finished'&&old?.phase!=='finished'&&!this.hasAnnouncement(next.gameId)){const names=ids=>ids.map(id=>escapeHTML(next.npcs[id]??this.getName(id))).join(', ');try{await this.announce({content:`<h2>${escapeHTML(gameTitle(this.scope))}</h2><p>${f('Gewonnen','Winners')}: ${names(next.winners)}</p><p>${f('Verloren','Loser')}: ${names(next.losers)}</p>`,flags:{taverngames:{game:this.scope,gameId:next.gameId}}});}catch(e){globalThis.ui?.notifications?.warn(e.message);}}}
 npcStep(){return this.enqueue(async()=>{if(!this.enabled()||this.now()<this.wait)return false;const move=peterNpc(this.state);if(!move)return false;await this.commit(actPeter(this.state,move.id,move.action,move.args,secureIndex,false,this.pickCard));return true;});}
}
