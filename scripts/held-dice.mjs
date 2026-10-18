import {FarkleAnimationGate} from './farkle-dice.mjs';
export const HELD_GAMES=['kniffel','ship','pig','hoard','aalstechen'];
export function heldState(s){if(s?.game==='aalstechen')return {...s,phase:s.cup?.dice&&!['lobby','aborted'].includes(s.phase)?'playing':s.phase,turnNumber:`${s.gameId}:${s.round}:${s.cup?.actor??''}`};return s?{...s,turnNumber:`${s.game}:${s.round}:${s.tieBreak??0}:${s.order?.[s.turn]??''}`,cup:s.cup?{...s.cup,...(s.game==='kniffel'&&s.variant==='extreme'?{types:['d6','d6','d6','d6','d6','d10']}:{}),...(s.game==='pig'?{dice:s.cup.dice.slice(-1),held:[false]}:{}),selected:[]}:null}:null;}
export class HeldAnimationGate extends FarkleAnimationGate{
 constructor(options={}){super(options);this.onClear=options.onClear??(()=>{});}
 clear(){const current=this.current;super.clear();if(current)this.onClear();}
 open(before,after,_dice,users){this.current={id:this.id(),gameId:after.gameId,before:structuredClone(before),preview:structuredClone(after),indices:after.game==='aalstechen'?after.cup.dice.map((_,i)=>i):after.game==='pig'?[0]:before.cup.held.flatMap((v,i)=>v?[]:[i]),bust:false,until:this.now()+15000,pending:new Set(users)};return this.project(after);}
}
