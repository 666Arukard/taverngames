import {ConnectSession} from './connect-four-session.mjs';
import {createEndurance,actEndurance,enduranceNpc,enduranceView} from './endurance-engine.mjs';
import {createArm,actArm,armNpc,armView,armActorStats} from './arm-engine.mjs';
export class ArmSession extends ConnectSession{
 constructor(scope,deps){super(scope,deps);this.endurance=['drink','eat'].includes(scope);this.create=this.endurance?(o=>createEndurance(scope,o)):createArm;this.npc=this.endurance?enduranceNpc:armNpc;this.act=this.endurance?actEndurance:actArm;}
 project(user){return (this.endurance?enduranceView:armView)(this.state,user);}
 statsFor(id){return armActorStats(globalThis.game?.users?.get?.(id)?.character,globalThis.game?.system?.id);}
 async handleNow(d,user){if(!this.enabled()&&!(d.action==='abort'&&user.isGM))throw Error('Beta testing is disabled.');if(d.action==='read')return this.project(user);const old=this.state;if(!['join','leave'].includes(d.action)&&!(d.action==='abort'&&user.isGM)&&d.revision!==(old?.revision??-1)&&!(!this.endurance&&d.action==='roll'&&Number.isInteger(d.args?.exchange)&&d.args.exchange===old?.exchange))throw Error('The game state changed. Please try again.');
  if(['lobby','restart'].includes(d.action)){ const result=await super.handleNow(d,user);return (this.endurance?enduranceView:armView)(this.state,user);}
  let next;if(d.action==='refreshAttributes'){if(!user.isGM)throw Error('GM only.');const id=d.args?.id;if(!old?.players.includes(id)||old.npcs[id])throw Error('Invalid participant.');const row=this.statsFor(id);if(!row)throw Error('No readable D&D character attributes.');next=structuredClone(old);next.attributes[id]=row.attributes;next.modifiers[id]=row.modifiers;next.statSource[id]='character';next.revision++;}
  else{const id=user.isGM&&old?.npcs[d.args?.id]?d.args.id:user.id;if(user.isGM&&d.action==='roll'&&old?.npcs[id]&&!old.npcManual[id])throw Error('Control the NPC manually first.');next=this.act(old,id,d.action,d.args,user.isGM,this.random,this.influence?.(old)??[]);if(d.action==='join'){const row=this.statsFor(id);if(row){next.attributes[id]=row.attributes;next.modifiers[id]=row.modifiers;next.statSource[id]='character';}}}
  await this.commit(next);return this.project(user);
 }
 async npcStepNow(){if(!this.enabled()||this.now()<this.wait)return false;const move=this.npc(this.state);if(!move)return false;await this.commit(this.act(this.state,move.id,move.action,move.args,false,this.random,this.influence?.(this.state)??[]));return true;}
}
