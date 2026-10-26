import {ConnectSession} from './connect-four-session.mjs';
import {createRps,actRps,rpsView,rpsNpc} from './rps-engine.mjs';
import {escapeHTML} from './tavern-text.mjs';
export class RpsSession extends ConnectSession{
 constructor(scope,deps){super(scope,deps);this.create=createRps;this.act=actRps;this.npc=rpsNpc;const announce=this.announce;this.announce=data=>{const s=this.state,details=s?.reveal?'<p>'+escapeHTML(s.rules.title)+'</p>'+s.order.map(id=>{const fig=s.rules.figures.find(f=>f.id===s.reveal.choices[id]);return '<p>'+escapeHTML(s.npcs[id]??this.getName(id))+': '+escapeHTML((fig?.symbol?fig.symbol+' ':'')+(fig?.name??''))+'</p>';}).join(''):'';return announce({...data,content:data.content+details});};}
 project(user){return rpsView(this.state,user);}
 async handleNow(d,user){
  if(d.action!=='choose'){await super.handleNow(d,user);return this.project(user);}
  if(!this.enabled())throw Error('Beta testing is disabled.');const old=this.state;
  // Simultaneous choices may share a revision. The immutable game/round and
  // one-choice lock replace that check only for this single action.
  const id=d.args?.player??user.id;if(id!==user.id&&!(user.isGM&&old?.npcs[id]&&old.npcManual[id]))throw Error('RPS: you cannot choose for this participant.');
  const next=this.act(old,id,'choose',d.args);await this.commit(next);return this.project(user);
 }
}
