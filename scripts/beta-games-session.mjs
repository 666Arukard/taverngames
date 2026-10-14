import {createBetaGame,actBetaGame,betaView,betaNpcAction} from './beta-games-engine.mjs';
import {gameTitle,escapeHTML} from './tavern-text.mjs';
import {f} from './farkle-text.mjs';
export class BetaGameSession{
 constructor(game,deps){this.game=game;this.state=null;this.now=()=>Date.now();this.enabled=()=>true;Object.assign(this,deps);this.wait=null;}
 project(user){return betaView(this.state,user);}
 restore(s){if(s!==null&&(s.version!==1||s.game!==this.game))throw Error('Invalid game save.');this.state=structuredClone(s);this.updateNpcWait();}
 updateNpcWait(){this.wait=this.state?{revision:this.state.revision,until:this.now()+5000}:null;}
 async handle(data,user){
  if(!this.enabled()&&!(data.action==='abort'&&user.isGM))throw Error('Beta testing is disabled.');
  if(data.action==='read')return this.project(user);const old=this.state;
  if(!['join','leave'].includes(data.action)&&!(data.action==='abort'&&user.isGM)&&data.revision!==(old?.revision??-1))throw Error('The game state changed. Please try again.');
  let next;
  if(['lobby','restart'].includes(data.action)){
   if(!user.isGM)throw Error('GM only.');if(old&&!['finished','aborted','lobby'].includes(old.phase))throw Error('Finish or end the current game first.');if(data.action==='restart'&&!old)throw Error('No game exists.');
   if(data.action==='restart'){next=createBetaGame(this.game,old);next.players=[...old.players];next.startAmounts=structuredClone(old.startAmounts);next.npcManual=structuredClone(old.npcManual);}
   else{const args=data.args??{},names=args.npcs??[];if(!Array.isArray(names)||names.length>20||names.some(n=>typeof n!=='string'||!n.trim()||n.length>60))throw Error('Invalid NPCs.');next=createBetaGame(this.game,{...args,npcs:Object.fromEntries(names.map(n=>[`npc-${crypto.randomUUID()}`,n.trim()]))});}
   next.gameId=crypto.randomUUID();next.revision=(old?.revision??0)+1;
  }else{const id=user.isGM&&old?.npcs[data.args?.id]?data.args.id:user.id;next=actBetaGame(old,id,data.action,data.args,this.random,user.isGM);}
  await this.commit(next);return this.project(user);
 }
 async commit(next){
  const previous=this.state;await this.save(next);this.state=next;this.updateNpcWait();
  if(next.phase==='finished'&&previous?.phase!=='finished'&&!this.hasAnnouncement(next.gameId)){
   const names=ids=>ids.map(id=>escapeHTML(next.npcs[id]??this.getName(id))).join(', ');
   const content=`<h2>${gameTitle(this.game)} · ${f('Spiel beendet','Game over')}</h2>${next.reason==='early'?`<p>${f('Vorzeitig regulär abgeschlossen; kein Gesamtsieger.','Finished early; no overall winner.')}</p>`:`<p>${f('Gewonnen','Winners')}: ${names(next.winners)}</p><p>${f('Verloren','Losers')}: ${names(next.losers)||'–'}</p>`}${this.game==='hoard'?`<p>${f('Nur virtuelle Münzen; kein Charaktergeld wurde verändert.','Virtual coins only; no character currency was changed.')}</p><ul>${next.players.map(id=>`<li>${names([id])}: ${next.balances[id]} ${f('Münzen','coins')}${next.payouts?` · ${next.payouts[id]} ${next.hoardMode==='tokens'?f('Kupfer Gegenwert (Vorschau)','copper equivalent (preview)'):escapeHTML(next.currency)}`:''}</li>`).join('')}</ul>`:''}`;
   try{await this.announce({content,flags:{taverngames:{game:this.game,gameId:next.gameId}}});}catch(e){globalThis.ui?.notifications?.warn(e.message);}
  }
 }
 async npcStep(){
  if(!this.enabled())return false;
  if(!this.state)return false;
  if(this.wait?.revision!==this.state.revision){this.updateNpcWait();return false;}if(this.now()<this.wait.until)return false;
  const move=betaNpcAction(this.state,this.random);if(!move)return false;
  await this.commit(actBetaGame(this.state,move.id,move.action,move.args,this.random));return true;
 }
}
