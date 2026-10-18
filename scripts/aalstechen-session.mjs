import {createAalstechen,actAalstechen,aalstechenNpcAction} from './aalstechen-engine.mjs';
import {f} from './farkle-text.mjs';
import {escapeHTML} from './tavern-text.mjs';
export class AalstechenSession{
 constructor(_scope,deps){Object.assign(this,deps);this.now=()=>Date.now();this.state=null;this.wait=null;}
 restore(s){if(s!==null&&(s.version!==1||s.game!=='aalstechen'))throw Error('Invalid game save.');this.state=structuredClone(s);this.updateNpcWait();}
 project(){return structuredClone(this.state);}
 updateNpcWait(){this.wait=this.state?{revision:this.state.revision,until:this.now()+5000}:null;}
 async handle(data,user){
  if(!this.enabled()&&!(data.action==='abort'&&user.isGM))throw Error('Beta testing is disabled.');if(data.action==='read')return this.project();const old=this.state;
  const parallelRoll=data.action==='roll'&&data.args?.gameId===old?.gameId&&data.args?.round===old?.round&&Number.isInteger(data.revision)&&data.revision<=old.revision;
  if(!parallelRoll&&!['join','leave'].includes(data.action)&&!(data.action==='abort'&&user.isGM)&&data.revision!==(old?.revision??-1))throw Error('The game state changed. Please try again.');let next;
  if(['lobby','restart'].includes(data.action)){
   if(!user.isGM)throw Error('GM only.');if(old&&!['lobby','finished','aborted'].includes(old.phase))throw Error('Finish or end the current game first.');
   if(data.action==='restart'){if(!old)throw Error('No game exists.');next=createAalstechen(old);next.players=[...old.players];next.npcManual=structuredClone(old.npcManual);}
   else{const names=data.args?.npcs??[];if(!Array.isArray(names)||names.length>10||names.some(n=>typeof n!=='string'||!n.trim()||n.length>60))throw Error('Invalid NPCs.');next=createAalstechen({...data.args,npcs:Object.fromEntries(names.map(n=>['npc-'+crypto.randomUUID(),n.trim()]))});}
   next.gameId=crypto.randomUUID();next.revision=(old?.revision??0)+1;
  }else{const id=user.isGM&&old?.npcs[data.args?.id]&&old.npcManual[data.args.id]?data.args.id:user.id;next=actAalstechen(old,id,data.action,data.args,this.random,user.isGM);}
  await this.commit(next);return this.project();
 }
 async commit(next){const old=this.state;await this.save(next);this.state=next;this.updateNpcWait();if(next.phase==='finished'&&old?.phase!=='finished'&&!this.hasAnnouncement(next.gameId)){
  const names=ids=>ids.map(id=>escapeHTML(next.npcs[id]??this.getName(id))).join(', ');
  try{await this.announce({content:`<h2>Aalstechen · ${f('Spiel beendet','Game over')}</h2><p>${f('Gewonnen','Winners')}: ${names(next.winners)}</p><p>${f('Verloren','Losers')}: ${names(next.losers)||'–'}</p><p>${f('Würfelrunde','Dice round')}: ${next.round}</p>${next.pots.map((p,i)=>`<p>${p.refund?f('Rückgabe','Refund'):i===0?f('Haupttopf','Main pot'):f('Nebentopf','Side pot')} ${i+1}: ${p.amount} ${f('Spieltoken','game tokens')} · ${Object.entries(p.shares).map(([id,n])=>`${names([id])}: ${n}`).join(', ')}</p>`).join('')}`,flags:{taverngames:{game:'aalstechen',gameId:next.gameId}}});}catch(e){globalThis.ui?.notifications?.warn(e.message);}
 }}
 async npcStep(){if(!this.enabled()||!this.state||this.wait?.revision!==this.state.revision||this.now()<this.wait.until)return false;const move=aalstechenNpcAction(this.state);if(!move)return false;await this.commit(actAalstechen(this.state,move.id,move.action,move.args,this.random));return true;}
}
