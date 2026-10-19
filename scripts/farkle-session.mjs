import {createFarkle,actFarkle,farkleNpcAction,bestSelection} from './farkle-engine.mjs';
import {language} from './i18n.mjs';
const escape=text=>String(text).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function farkleAnnouncement(state,getName){
  if(state?.phase!=='finished')return null;
  const de=language()==='de',names=ids=>ids.map(id=>escape(getName(id))).join(', ');
  const title=state.draw?(de?'Unentschieden':'Draw'):(de?'Spiel beendet':'Game over');
  const result=state.draw?`<p>${names(state.players)}</p>`:`<p><strong>${de?'Gewonnen':'Winners'}:</strong> ${names(state.winners)}</p>${state.losers.length?`<p><strong>${de?'Verloren':'Losers'}:</strong> ${names(state.losers)}</p>`:''}`;
  const rows=state.players.map(id=>`<li>${escape(getName(id))}: ${state.scores[id]}</li>`).join('');
  return {content:`<h2>Farkle – ${title}</h2>${result}<ul>${rows}</ul>`,flags:{taverngames:{gameId:state.gameId,game:'farkle'}}};
}
// Calls must be serialized by the authenticated GM query queue.
export class FarkleSession{
  constructor({save,diceSource,getName,announce,hasAnnouncement=()=>false,allowBestSelection=()=>false}){Object.assign(this,{save,diceSource,getName,announce,hasAnnouncement,allowBestSelection});this.state=null;this.history=[];this.announced=new Set();}
  restore(state){if(state!==null&&(state?.version!==1||state?.game!=='farkle'))throw new Error('Invalid Farkle save.');this.state=structuredClone(state);this.history=[];}
  async handle(data,user){
    if(data.action==='read')return structuredClone(this.state);
    const old=this.state;
    if(!['join','leave'].includes(data.action)&&!(data.action==='abort'&&user.isGM)&&data.revision!==(old?.revision??-1))throw new Error('The game state changed. Please try again.');
    let next;
    if(data.action==='lobby'){
      if(!user.isGM)throw new Error('GM only.');const args=data.args??{},names=args.npcs??[];
      if(!Array.isArray(names)||names.length>20||names.some(name=>typeof name!=='string'||!name.trim()||name.length>60))throw new Error('Invalid NPCs.');
      const npcs=Object.fromEntries(names.map(name=>[`npc-${crypto.randomUUID()}`,name.trim()]));
      next=createFarkle({...args,npcs});next.gameId=crypto.randomUUID();next.revision=(old?.revision??0)+1;
    }else if(data.action==='restart'){
      if(!user.isGM)throw new Error('GM only.');
      if(!old||!['finished','aborted'].includes(old.phase))throw new Error('Finish or end the current game first.');
      next=createFarkle({mode:old.mode,target:old.target,entry:old.entry,roundLimit:old.roundLimit??3,npcs:old.npcs,rules:old.rules});
      next.players=[...old.players];next.scores=Object.fromEntries(next.players.map(id=>[id,0]));next.npcManual=structuredClone(old.npcManual);
      if(data.args?.prepare!==true)next=actFarkle(next,user.id,'begin',{},this.diceSource,true);next.gameId=crypto.randomUUID();next.revision=old.revision+1;
    }else if(data.action==='undo'){
      if(!user.isGM||!this.history.length||old?.phase==='aborted')throw new Error('No action to undo.');
      // A finished game remains final: do not invalidate an already posted result.
      if(old.phase==='finished')throw new Error('This game has ended.');
      next=structuredClone(this.history.at(-1));next.revision=old.revision+1;next.paused=old.paused;next.npcManual=structuredClone(old.npcManual);
    }else if(data.action==='best'){
      if(!user.isGM&&!this.allowBestSelection())throw new Error('Best selection is not enabled for players.');
      if(!old?.cup?.dice)throw new Error('Roll first.');
      next=actFarkle(old,user.id,'select',{indices:bestSelection(old.cup.dice,old.cup.fresh,old.rules).indices},this.diceSource,user.isGM);
    }else next=actFarkle(old,user.id,data.action,data.args,this.diceSource,user.isGM);
    await this.commit(next,data.action);return structuredClone(this.state);
  }
  async commit(next,action){
    const previous=this.state;await this.save(next); // Never advance memory if persistence fails.
    if(['restart','lobby'].includes(action))this.history=[];
    else if(action==='undo')this.history.pop();else if(previous&&!['pause','npcControl','abort'].includes(action)){this.history.push(structuredClone(previous));if(this.history.length>30)this.history.shift();}
    this.state=next;
    if(next.phase==='finished'&&previous?.phase!=='finished'&&!this.announced.has(next.gameId)&&!this.hasAnnouncement(next.gameId)){
      try{await this.announce(farkleAnnouncement(next,id=>next.npcs[id]??this.getName(id)));this.announced.add(next.gameId);}
      catch(error){globalThis.ui?.notifications?.warn(`Farkle: ${error.message}`);}
    }
  }
  async npcStep(){const move=farkleNpcAction(this.state);if(move)await this.commit(actFarkle(this.state,move.id,move.action,move.args,this.diceSource),'npc');return !!move;}
}
