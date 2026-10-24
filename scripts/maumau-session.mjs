import {createMau,actMau,mauView,mauNpcAction} from './maumau-engine.mjs';
import {seriesMetadata} from './continuous-play.mjs';
import {f} from './farkle-text.mjs';
import {escapeHTML} from './tavern-text.mjs';
export class MauSession{
 constructor(_scope,deps){Object.assign(this,deps);this.state=null;this.wait=null;this.now=()=>Date.now();}
 restore(s){if(s&&(s.version!==1||s.game!=='maumau'))throw Error('Invalid game save.');this.state=structuredClone(s);this.updateNpcWait();}
 project(user){return mauView(this.state,user);}
 updateNpcWait(){const s=this.state,key=s&&`${s.gameId}:${s.revision}`;if(this.wait?.key!==key)this.wait={key,until:this.now()+1200};}
 async repair(force=false){try{if(force)await this.stacks.rebuild(this.state);else await this.stacks.sync(this.state);this.nativeError=null;}catch(e){const changed=this.nativeError!==e.message;this.nativeError=e.message;if(changed)globalThis.ui?.notifications?.warn(f('Mau-Mau: Kartenverwaltung reparieren: ','Mau-Mau: repair card stacks: ')+e.message);}}
 async handle(data,user){
  if(!this.enabled()&&!(data.action==='abort'&&user.isGM))throw Error('This game is disabled.');if(data.action==='read')return this.project(user);
  const old=this.state;if(!['join','leave'].includes(data.action)&&!(data.action==='abort'&&user.isGM)&&data.revision!==(old?.revision??-1))throw Error('The game state changed. Please try again.');
  if(data.action==='repairCards'){if(!user.isGM)throw Error('GM only.');await this.repair(true);return this.project(user);}
  let next;
  if(['lobby','restart','nextRound'].includes(data.action)){
   if(!user.isGM)throw Error('GM only.');if(old&&!['lobby','finished','aborted'].includes(old.phase))throw Error('Finish or end the current game first.');
   if(data.action==='lobby'){
    const names=data.args?.npcs??[];if(!Array.isArray(names)||names.length>5||names.some(n=>typeof n!=='string'||!n.trim()||n.length>60))throw Error('Invalid NPCs.');
    next=createMau({cardSet:await this.resolveSet(data.args?.set??null),stackSeven:data.args?.stackSeven===true,noPlayAfterDraw:data.args?.noPlayAfterDraw===true,playOut:data.args?.playOut===true,nineWild:data.args?.nineWild===true,voluntaryDraw:data.args?.voluntaryDraw===true,penalties:data.args?.penalties===true,npcs:Object.fromEntries(names.map(n=>['npc-'+crypto.randomUUID(),n.trim()]))});
   }else{if(!old)throw Error('No game exists.');next=createMau({...old,cardSet:{...old.cardSet,cards:Object.values(old.cards)}});next.players=[...old.players];next.npcManual=structuredClone(old.npcManual);}
   next.gameId=crypto.randomUUID();next.revision=(old?.revision??0)+1;
  }else{const id=user.isGM&&old?.npcs[data.args?.id]&&old.npcManual[data.args.id]?data.args.id:user.id;next=actMau(old,id,data.action,data.args,this.random,user.isGM,this.pickCard);}
  seriesMetadata(next,old,data.action);await this.commit(next);return this.project(user);
 }
 async commit(next){const old=this.state;seriesMetadata(next,old);await this.save(next);this.state=next;this.updateNpcWait();await this.repair();if(next.phase==='finished'&&old?.phase!=='finished'&&!this.hasAnnouncement(next.gameId)){
  const names=ids=>ids.map(id=>escapeHTML(next.npcs[id]??this.getName(id))).join(', ');
  try{await this.announce({content:`<h2>Mau-Mau</h2><p>${next.draw?f('Unentschieden','Draw'):f('Gewonnen','Winner')+': '+names(next.winners)}</p>${next.draw?'':`<p>${f('Verloren','Losers')}: ${names(next.losers)}</p>`}`,flags:{taverngames:{game:'maumau',gameId:next.gameId}}});}catch(e){globalThis.ui?.notifications?.warn(e.message);}
 }}
 async npcStep(){if(!this.enabled()||!this.state||this.now()<this.wait?.until)return false;const move=mauNpcAction(this.state);if(!move)return false;await this.commit(actMau(this.state,move.id,move.action,move.args,this.random,false,this.pickCard));return true;}
}
