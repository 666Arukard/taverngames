import {FarkleAnimationGate} from './farkle-dice.mjs';
// Presentation only. Never send the authoritative state through the dice channel.
export function schockenDiceState(s,user){
 if(!s)return null;const actor=s.order?.[s.turn],c=s.cup;
 const own=actor===user.id||user.isGM&&!!s.npcs?.[actor];
 const groups=(s.results??[]).map(r=>({game:'schocken',gameId:s.gameId,participant:r.id,phase:'playing',turnNumber:`${s.half}:${s.round}:${s.order.indexOf(r.id)}:${r.id}`,order:[r.id],turn:0,cup:{dice:r.dice.map((v,i)=>r.held?.[i]||!r.hidden?v:null),held:r.held??[false,false,false]}}));
 return {game:'schocken',gameId:s.gameId,revision:s.revision,phase:s.phase,half:s.half,round:s.round,order:[...(s.order??[])],turn:s.turn,
  turnNumber:`${s.half}:${s.round}:${s.turn}:${actor??''}`,
  groups:groups.length?[...groups,...(c?[{game:'schocken',gameId:s.gameId,participant:actor,phase:'playing',turnNumber:`${s.half}:${s.round}:${s.turn}:${actor}`,order:[actor],turn:0,cup:{dice:c.dice.map((v,i)=>c.held[i]||c.revealed||own&&!c.concealed?v:null),held:c.held}}]:[])]:undefined,participant:actor,cup:c?{dice:c.dice.map((v,i)=>c.held[i]||c.revealed||own&&!c.concealed?v:null),held:[...c.held],selected:[]}:null};
}
export class SchockenAnimationGate extends FarkleAnimationGate{
 open(s,users){this.current={id:this.id(),gameId:s.gameId,until:this.now()+15000,pending:new Set(users)};return this.project(s);}
}
export function schockenDiceEvent(before,after,user,action,animation=null){
 const previous=schockenDiceState(before,user),next=schockenDiceState(after,user),actor=after?.order?.[after.turn]??user.id;
 const same=previous?.gameId===next?.gameId&&previous?.turnNumber===next?.turnNumber;
 const indices=next?.cup?next.cup.dice.flatMap((value,i)=>action==='roll'&&!next.cup.held[i]||same&&previous.cup?.dice[i]!==value?[i]:[]):[];
 const dice=indices.flatMap(i=>Number.isInteger(next.cup.dice[i])?[{sides:6,value:next.cup.dice[i]}]:[]);
 return {actor,dice,schocken:{state:next,indices,animation,action}};
}
