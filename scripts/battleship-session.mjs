import {ConnectSession} from './connect-four-session.mjs';
import {createBattleship,actBattleship,battleshipView,battleshipNpc} from './battleship-engine.mjs';
const PLACING=['place','unplace','clear','autoPlace','ready'];
export class BattleshipSession extends ConnectSession{
 constructor(scope,deps){super(scope,deps);this.create=createBattleship;this.act=actBattleship;this.npc=battleshipNpc;}
 project(user){return battleshipView(this.state,user);}
 async handleNow(d,user){if(!PLACING.includes(d.action)){await super.handleNow(d,user);return this.project(user);}if(!this.enabled())throw Error('Beta testing is disabled.');const s=this.state,id=d.args?.player??user.id;if(d.action==='autoPlace'){if(!user.isGM)throw Error('GM only.');}else if(id!==user.id&&!(user.isGM&&s?.npcs[id]&&s.npcManual[id]))throw Error('Battleship: you cannot place for this participant.');await this.commit(this.act(s,id,d.action,d.args,user.isGM));return this.project(user);}
 async npcStepNow(){if(!this.enabled()||this.now()<this.wait)return false;const m=this.npc(this.state);if(!m)return false;await this.commit(this.act(this.state,m.id,m.action,m.args,true));return true;}
}
