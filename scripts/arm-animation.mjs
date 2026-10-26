import {armView} from './arm-engine.mjs';
export class ArmAnimationGate{
 constructor({now=()=>Date.now(),id=()=>crypto.randomUUID(),onClear=()=>{},view=armView}={}){Object.assign(this,{now,id,onClear,view});this.current=null;}
 open(before,after,users){this.current={id:this.id(),gameId:after.gameId,before:structuredClone(before),until:this.now()+15000,pending:new Set(users)};return this.current.id;}
 active(s){const c=this.current;if(c&&(c.gameId!==s?.gameId||s?.phase==='aborted'||this.now()>=c.until))this.clear();return this.current;}
 project(s,user,preparing=null){const c=this.active(s),before=c?.before??(preparing?.gameId===s?.gameId&&s?.phase!=='aborted'?preparing:null);return before?{...this.view(before,user),revision:s.revision,animationWaiting:true,...(c?{armAnimationId:c.id}:{})}:this.view(s,user);}
 ack(id,user){if(this.current?.id===id){this.current.pending.delete(user);if(!this.current.pending.size)this.clear();}}
 clear(){if(this.current){this.current=null;this.onClear();}}
}
