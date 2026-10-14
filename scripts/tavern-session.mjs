import {KNIFFEL_FIELDS} from './kniffel-engine.mjs';
import {createTavern,actTavern,tavernNpcAction} from './tavern-engine.mjs';
import {f} from './farkle-text.mjs';
import {gameTitle,escapeHTML} from './tavern-text.mjs';
export class TavernSession{
  constructor(game,deps){this.game=game;this.enabled=()=>true;this.now=()=>Date.now();Object.assign(this,deps);this.state=null;this.history=[];this.npcWait=null;}
  restore(state){if(state!==null&&(state.version!==1||state.game!==this.game))throw new Error('Invalid game save.');this.state=structuredClone(state);this.history=[];this.updateNpcWait();}
  updateNpcWait(){
    const s=this.state,move=s&&s.game!=='lottery'?tavernNpcAction(s):null;
    if(move&&(s.game==='ship'&&move.action==='bank'||s.game==='pig'&&move.action==='next'||s.game==='kniffel'&&move.action==='score'))this.npcWait={revision:s.revision,until:this.now()+5000};
    else this.npcWait=null;
  }
  async handle(data,user){
    if(!this.enabled()&&!(data.action==='abort'&&user.isGM))throw new Error('Beta testing is disabled.');
    if(data.action==='read')return structuredClone(this.state);
    const old=this.state;
    if(!['join','leave'].includes(data.action)&&!(data.action==='abort'&&user.isGM)&&data.revision!==(old?.revision??-1))throw new Error('The game state changed. Please try again.');
    let next;
    if(data.action==='lobby'||data.action==='restart'){
      if(!user.isGM)throw new Error('GM only.');
      if(old&&!['finished','aborted'].includes(old.phase)&&!(data.action==='lobby'&&old.phase==='lobby'&&!old.tickets.length))throw new Error('Finish or end the current game first.');
      if(data.action==='restart'&&!old)throw new Error('No game exists.');
      if(data.action==='restart'){
        next=createTavern(this.game,old);next.players=[...old.players];next.scores=Object.fromEntries(next.players.map(id=>[id,0]));next.npcManual=structuredClone(old.npcManual);
        if(this.game==='kniffel'){next.sheets=Object.fromEntries(next.players.map(id=>[id,Object.fromEntries(KNIFFEL_FIELDS.map(k=>[k,null]))]));next.extras=Object.fromEntries(next.players.map(id=>[id,0]));}
        if(this.game==='ship'){const ids=[...(old.startOrder??old.players)];ids.unshift(ids.pop());next.startOrder=ids;}
      }else{
        const args=data.args??{},names=args.npcs??[];
        if(!Array.isArray(names)||names.length>20||names.some(n=>typeof n!=='string'||!n.trim()||n.length>60))throw new Error('Invalid NPCs.');
        next=createTavern(this.game,{...args,npcs:Object.fromEntries(names.map(name=>[`npc-${crypto.randomUUID()}`,name.trim()]))});
      }
      next.gameId=crypto.randomUUID();next.revision=(old?.revision??0)+1;
    }else if(data.action==='undo'){
      if(!user.isGM||!old||['finished','aborted'].includes(old.phase)||!this.history.length||this.game==='lottery')throw new Error('No action to undo.');
      next=structuredClone(this.history.at(-1));next.revision=old.revision+1;next.paused=old.paused;next.npcManual=structuredClone(old.npcManual);
    }else{
      const id=user.isGM&&data.action==='ticket'&&old?.npcs[data.args?.id]?data.args.id:user.id;
      next=actTavern(old,id,data.action,data.args,this.random,user.isGM);
    }
    await this.commit(next,data.action);return structuredClone(this.state);
  }
  async commit(next,action){
    const old=this.state;await this.save(next);
    if(['lobby','restart'].includes(action))this.history=[];
    else if(action==='undo')this.history.pop();else if(old&&!['abort','pause','npcControl'].includes(action)){this.history.push(structuredClone(old));this.history=this.history.slice(-30);}
    this.state=next;this.updateNpcWait();
    if(next.phase==='finished'&&old?.phase!=='finished'&&!this.hasAnnouncement(next.gameId)){
      const names=ids=>ids.map(id=>escapeHTML(next.npcs[id]??this.getName(id))).join(', ');
      const content=`<h2>${gameTitle(this.game)} – ${f('Spiel beendet','Game over')}</h2>${next.result?`<p>W100: ${next.result}</p>`:''}<p>${f('Gewonnen','Winners')}: ${next.winners.length?names(next.winners):f('Niemand','Nobody')}</p><p>${f('Verloren','Losers')}: ${names(next.losers)||'–'}</p>${this.game==='lottery'?`<p>${f('Hauptgewinn','Prize')}: ${escapeHTML(next.prize)}</p>`:`<ul>${next.players.map(id=>`<li>${names([id])}: ${next.scores[id]}</li>`).join('')}</ul>`}`;
      try{await this.announce({content,flags:{taverngames:{game:this.game,gameId:next.gameId}}});}catch(error){globalThis.ui?.notifications?.warn(error.message);}
    }
  }
  async npcStep(){
    if(!this.enabled())return false;
    const move=tavernNpcAction(this.state,this.random);if(!move)return false;
    if(this.game==='ship'&&move.action==='bank'||this.game==='pig'&&move.action==='next'||this.game==='kniffel'&&move.action==='score'){
      if(this.npcWait?.revision!==this.state.revision){this.updateNpcWait();return false;}
      if(this.now()<this.npcWait.until)return false;
    }
    await this.commit(actTavern(this.state,move.id,move.action,move.args,this.random),'npc');return true;
  }
}
