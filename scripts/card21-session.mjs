import {createCard21,actCard21,card21Npc,card21View,card21Profile} from './card21-engine.mjs';
import {seriesMetadata} from './continuous-play.mjs';
import {prepareSeventeenRisk} from './seventeen-engine.mjs';
import {escapeHTML,gameTitle} from './tavern-text.mjs';
import {f} from './farkle-text.mjs';
export class Card21Session{
 constructor(scope,deps){Object.assign(this,deps);this.scope=scope;this.state=null;this.now=()=>Date.now();this.wait=0;this.pending=Promise.resolve();}
 restore(s){if(s&&(s.version!==1||s.game!=='card21'))throw Error('Invalid game save.');this.state=structuredClone(s);this.updateNpcWait();}
 updateNpcWait(){this.wait=this.now()+1200;}
 project(user){return card21View(this.state,user);}
 enqueue(fn){const p=this.pending.then(fn);this.pending=p.catch(()=>{});return p;}
 handle(d,user){return this.enqueue(()=>this.handleNow(d,user));}
 async repair(force=false){if(!this.stacks)return;const s=this.state,mirror=s?{...s,players:[...s.players,'@bank'],npcs:{...s.npcs,'@bank':f('Bank','Bank')},hands:{...s.hands,'@bank':s.bank}}:null;try{await this.stacks[force?'rebuild':'sync'](mirror);this.nativeError=null;}catch(e){if(this.nativeError!==e.message)globalThis.ui?.notifications?.warn(e.message);this.nativeError=e.message;}}
 async handleNow(d,user){
  if(!this.enabled()&&!(d.action==='abort'&&user.isGM))throw Error('Beta testing is disabled.');if(d.action==='read')return this.project(user);const old=this.state;
  if(!['join','leave'].includes(d.action)&&!(d.action==='abort'&&user.isGM)&&d.revision!==(old?.revision??-1))throw Error('The game state changed. Please try again.');
  if(d.action==='repairCards'){if(!user.isGM)throw Error('GM only.');await this.repair(true);return this.project(user);}
  let next;
  if(['lobby','restart','nextRound'].includes(d.action)){
   if(!user.isGM)throw Error('GM only.');if(old&&!['lobby','finished','aborted'].includes(old.phase))throw Error('Finish or end the current game first.');
   if(d.action==='lobby'){const o=d.args??{},names=o.npcs??[];if(!Array.isArray(names)||names.length>10||names.some(n=>typeof n!=='string'||!n.trim()||n.length>60))throw Error('Invalid NPCs.');next=createCard21({...o,cardSet:await this.resolveSet(o.set??null,card21Profile(o.alternative===true,o.sixes===true)),npcs:Object.fromEntries(names.map(n=>['npc-'+crypto.randomUUID(),n.trim()]))});}
   else{if(!old)throw Error('No game exists.');next=createCard21({...old,cardSet:{...old.cardSet,cards:Object.values(old.cards)}});next.players=[...old.players];next.npcManual=structuredClone(old.npcManual);next.npcRisk=structuredClone(old.npcRisk);}
   next.gameId=crypto.randomUUID();next.revision=(old?.revision??0)+1;
  }else{const id=user.isGM&&old?.npcs[d.args?.id]&&(d.action==='stake'||old.npcManual[d.args.id])?d.args.id:user.id;next=actCard21(old,id,d.action,d.args,this.random,user.isGM,this.pickCard);}
  seriesMetadata(next,old,d.action);if(['lobby','restart','nextRound'].includes(d.action))next=prepareSeventeenRisk(next,this.random);await this.commit(next);return this.project(user);
 }
 async commit(next){const old=this.state;seriesMetadata(next,old);await this.save(next);this.state=next;this.updateNpcWait();await this.repair();if(next.phase==='finished'&&old?.phase!=='finished'&&!this.hasAnnouncement(next.gameId)){const names=ids=>ids.map(id=>escapeHTML(next.npcs[id]??this.getName(id))).join(', ');try{await this.announce({content:`<h2>${escapeHTML(gameTitle('card21'))}</h2><p>${f('Gewonnen','Winners')}: ${names(next.winners)||'—'}</p><p>${f('Verloren','Losers')}: ${names(next.losers)||'—'}</p>`,flags:{taverngames:{game:'card21',gameId:next.gameId}}});}catch(e){globalThis.ui?.notifications?.warn(e.message);}}}
 npcStep(){return this.enqueue(async()=>{if(!this.enabled()||this.now()<this.wait)return false;const move=card21Npc(this.state);if(!move)return false;await this.commit(actCard21(this.state,move.id,move.action,move.args,this.random,move.id==='@bank',this.pickCard));return true;});}
}
