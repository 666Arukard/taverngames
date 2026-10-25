import {HeldAnimationGate} from './held-dice.mjs';
import {betaView} from './beta-games-engine.mjs';
// Everyone sees the public table; pending private guesses never enter dice packets.
export const hoardPublic=s=>betaView(s,{id:null,isGM:false});
export function hoardDiceState(s){
 if(!s)return null;
 const contest=s.lastContest&&(s.phase==='contest'||s.phase==='finished'),r=contest?s.lastContest:s.lastRoll;
 const dice=r&&!s.hoardResultExpired?(contest?[r.value]:r.dice):[],sides=contest?r.sides:6;
 return {...s,turn:!contest&&r?Math.max(0,s.order.indexOf(r.id)):s.turn,phase:s.hoardResultExpired?'hidden':(['playing','allocate','contest'].includes(s.phase)||s.phase==='finished'&&s.hoardResultUntil>0)?'playing':s.phase,turnNumber:`hoard:${s.hoardResultId??s.round+':'+(s.lastRoll?.id??'')}:${contest?'contest':'table'}`,cup:{dice:[...dice],sides,held:dice.map(()=>false),selected:[]}};
}
export class HoardAnimationGate extends HeldAnimationGate{
 open(before,after,dice,users){this.current={id:this.id(),gameId:after.gameId,before:hoardPublic(before),preview:hoardPublic(after),indices:dice.map((_v,i)=>i),bust:false,until:this.now()+20000,pending:new Set(users)};return this.project(after);}
}

export function projectHoardResult(s,display=null,now=Date.now()){if(!s)return s;const until=display&&display.id===s.hoardResultId?display.until:s.hoardResultUntil??0;return {...s,hoardResultUntil:until,hoardResultExpired:!s.hoardResultId||now>=until};}

