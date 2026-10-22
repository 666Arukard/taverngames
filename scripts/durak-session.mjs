import {createDurak,actDurak,durakView,durakNpc} from './durak-engine.mjs';
import {f} from './farkle-text.mjs';
import {escapeHTML} from './tavern-text.mjs';
export class DurakSession{
 constructor(_scope,deps){Object.assign(this,deps);this.state=null;this.now=()=>Date.now();this.wait=0;}
 restore(s){if(s&&(s.version!==1||s.game!=='durak'))throw Error('Invalid game save.');this.state=structuredClone(s);this.updateNpcWait();}
 project(user){return durakView(this.state,user);}
 updateNpcWait(){this.wait=this.now()+1200;}
 async repair(force=false){const s=this.state,mirror=s?{...s,discard:[...s.discard,...s.table.flatMap(p=>[p.attack,...(p.defense?[p.defense]:[])])]}:null;try{if(force)await this.stacks.rebuild(mirror);else await this.stacks.sync(mirror);this.nativeError=null;}catch(e){if(this.nativeError!==e.message)globalThis.ui?.notifications?.warn(e.message);this.nativeError=e.message;}}
 async handle(d,user){
  if(!this.enabled()&&!(d.action==='abort'&&user.isGM))throw Error('This game is disabled.');if(d.action==='read')return this.project(user);
  const old=this.state;if(!['join','leave'].includes(d.action)&&!(d.action==='abort'&&user.isGM)&&d.revision!==(old?.revision??-1))throw Error('The game state changed. Please try again.');
  if(d.action==='repairCards'){if(!user.isGM)throw Error('GM only.');await this.repair(true);return this.project(user);}
  let next;
  if(['lobby','restart'].includes(d.action)){
   if(!user.isGM)throw Error('GM only.');if(old&&!['lobby','finished','aborted'].includes(old.phase))throw Error('Finish or end the current game first.');
   if(d.action==='lobby'){const names=d.args?.npcs??[];if(!Array.isArray(names)||names.length>6||names.some(n=>typeof n!=='string'||!n.trim()||n.length>60))throw Error('Invalid NPCs.');next=createDurak({...d.args,cardSet:await this.resolveSet(d.args?.set??null),npcs:Object.fromEntries(names.map(n=>['npc-'+crypto.randomUUID(),n.trim()]))});}
   else{if(!old)throw Error('No game exists.');next=createDurak({...old,cardSet:{...old.cardSet,cards:Object.values(old.cards)}});next.players=[...old.players];next.npcManual=structuredClone(old.npcManual);}
   next.gameId=crypto.randomUUID();next.revision=(old?.revision??0)+1;
  }else{const id=user.isGM&&old?.npcs[d.args?.id]&&old.npcManual[d.args.id]?d.args.id:user.id;next=actDurak(old,id,d.action,d.args,this.random,user.isGM,this.now());}
  await this.commit(next);return this.project(user);
 }
 async commit(next){const old=this.state;await this.save(next);this.state=next;this.updateNpcWait();await this.repair();if(next.phase==='finished'&&old?.phase!=='finished'&&!this.hasAnnouncement(next.gameId)){const names=ids=>ids.map(id=>escapeHTML(next.npcs[id]??this.getName(id))).join(', ');try{await this.announce({content:`<h2>Durak · Beta</h2><p>${f('Platzierung','Ranking')}: ${(next.ranking??[]).map((id,i)=>`${i+1}. ${names([id])}`).join(' · ')}</p><p>${f('Verloren','Loser')}: ${names(next.losers)||'—'}</p>`,flags:{taverngames:{game:'durak',gameId:next.gameId}}});}catch(e){globalThis.ui?.notifications?.warn(e.message);}}}
 async npcStep(){if(!this.enabled()||this.now()<this.wait)return false;const m=durakNpc(this.state,this.now());if(!m)return false;await this.commit(actDurak(this.state,m.id,m.action,m.args,this.random,false,this.now()));return true;}
}
