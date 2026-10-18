import {seventeenView} from './seventeen-engine.mjs';
// Presentation only: authoritative values are never rerolled or modified.
export class SeventeenAnimationGate{
 constructor({now=()=>Date.now(),id=()=>crypto.randomUUID(),onClear=()=>{}}={}){Object.assign(this,{now,id,onClear});this.current=null;}
 clear(){const old=this.current;this.current=null;if(old)this.onClear();}
 active(state){const a=this.current;if(a&&(state?.gameId!==a.gameId||['aborted','finished'].includes(state?.phase)||this.now()>=a.until))this.clear();return this.current;}
 open(state,actor,action,users){this.clear();if(!users.length)return null;this.current={id:this.id(),gameId:state.gameId,until:this.now()+12000,actor,bank:action!=='roll',index:action==='roll'?state.hands[actor].length-1:state.bank.length-1,pending:new Set(users)};return {id:this.current.id,gameId:state.gameId,until:this.current.until};}
 project(state,user){const s=seventeenView(state,user),a=this.active(state);if(!s||!a)return s;s.animationWaiting=true;if(a.pending.has(user.id)){const rows=a.bank?s.bank:s.hands[a.actor];if(rows?.[a.index])rows[a.index]=rows[a.index].map(()=>null);s.animationPending=true;s.seventeenAnimation={id:a.id,gameId:a.gameId,until:a.until};}return s;}
 ack(id,user){const a=this.current;if(a?.id===id&&a.pending.has(user)){a.pending.delete(user);if(!a.pending.size)this.clear();}}
}
