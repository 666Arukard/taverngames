import {FarkleAnimationGate} from './farkle-dice.mjs';
export const HELD_GAMES=['kniffel','ship'];
export function heldState(s){return s?{...s,turnNumber:`${s.game}:${s.round}:${s.tieBreak??0}:${s.order?.[s.turn]??''}`,cup:s.cup?{...s.cup,selected:[]}:null}:null;}
export class HeldAnimationGate extends FarkleAnimationGate{
 open(before,after,_dice,users){this.current={id:this.id(),gameId:after.gameId,before:structuredClone(before),preview:structuredClone(after),indices:before.cup.held.flatMap((v,i)=>v?[]:[i]),bust:false,until:this.now()+15000,pending:new Set(users)};return this.project(after);}
}
