import {createPoker} from './poker-engine.mjs';
import {startingOrder} from './start-choice.mjs';
import {aalActive,aalFree,aalPots,betAction} from './aalstechen-engine.mjs';
const check=(ok,message)=>{if(!ok)throw Error(message);};
export const KINGS_DICE=Object.freeze([8,6,4]);
export const kingsTotal=hand=>(hand??[]).reduce((n,v)=>n+v,0);
export function createKings(options={}){return {...createPoker(options),game:'kings',stage:0,stageRolled:[]};}
function finish(s,ids,reason='showdown'){
 const alive=aalActive(s);if(!ids){const high=Math.max(...alive.map(id=>kingsTotal(s.hands[id])));ids=alive.filter(id=>kingsTotal(s.hands[id])===high);}
 s.phase='finished';s.reason=reason;s.winners=[...ids];s.losers=s.players.filter(id=>!ids.includes(id));s.pending=[];Object.assign(s,aalPots(s,id=>kingsTotal(s.hands[id])));
}
function advance(s){if(s.stage===2)finish(s);else{s.stage++;s.phase='rolling';s.stageRolled=[];s.turn=s.order.findIndex(id=>aalActive(s).includes(id));}}
function betting(s){s.bettingStage=s.stage+1;s.street=Object.fromEntries(s.players.map(id=>[id,0]));s.currentBet=0;s.lastRaise=s.minimumRaise;s.actedAt={};s.pending=s.order.filter(id=>aalActive(s).includes(id)&&aalFree(s,id)>0);if(s.economy?.mode!=='tokens'||s.pending.length<2){advance(s);return;}s.phase='betting';s.turn=s.order.indexOf(s.pending[0]);}
export function actKings(original,id,action,args={},random=()=>1,gm=false){
 const s=structuredClone(original);check(s?.game==='kings'&&s.version===1,'No game exists.');check(!['finished','aborted'].includes(s.phase),'This game has ended.');
 if(action==='abort'){check(gm,'GM only.');s.phase='aborted';s.paused=true;s.pending=[];}
 else if(action==='pause'){check(gm,'GM only.');s.paused=!s.paused;}
 else if(action==='npcControl'){check(gm&&Object.hasOwn(s.npcs,args.id)&&typeof args.manual==='boolean','GM only.');s.npcManual[args.id]=args.manual;}
 else{check(!s.paused,'The game is paused.');
  if(['join','leave'].includes(action)){check(s.phase==='lobby'&&typeof id==='string'&&!id.startsWith('npc-')&&id.length<=64,'Join in the lobby.');if(action==='join'){check(!s.players.includes(id)&&s.players.length<10,'Invalid participant.');s.players.push(id);}else{check(s.players.includes(id),'Invalid participant.');s.players=s.players.filter(p=>p!==id);}}
  else if(action==='begin'){check(gm&&s.phase==='lobby'&&s.players.length>=2,'GM only.');s.order=startingOrder(s);for(const p of s.players){s.contributions[p]=0;s.hands[p]=[];s.held[p]=[];if(s.economy?.mode==='tokens'){const n=s.economy.config.stake;check(n>0,'Choose a positive buy-in.');check(aalFree(s,p)>=n,'Not enough game tokens.');s.contributions[p]=n;}}s.phase='rolling';s.turn=0;}
  else if(action==='roll'){check(s.phase==='rolling'&&s.order[s.turn]===id&&aalActive(s).includes(id)&&!s.stageRolled.includes(id),'It is not your turn.');const value=random(KINGS_DICE[s.stage]);check(Number.isInteger(value)&&value>=1&&value<=KINGS_DICE[s.stage],'Invalid dice.');s.hands[id].push(value);s.held[id].push(false);s.lastActor=id;s.lastIndices=[s.stage];s.stageRolled.push(id);const at=s.order.findIndex(p=>aalActive(s).includes(p)&&!s.stageRolled.includes(p));if(at<0)betting(s);else s.turn=at;}
  else{check(aalActive(s).includes(id),'Invalid participant.');betAction(s,id,action,args,advance,finish);}
 }s.revision++;return s;
}
export function kingsView(state,user={}){if(!state)return null;const s=structuredClone(state),show=s.phase==='finished'&&s.reason==='showdown';for(const id of s.players){const own=id===user.id||user.isGM&&s.npcs[id]&&s.npcManual[id];if(!own&&!(show&&!s.folded.includes(id))&&s.hands[id])s.hands[id]=s.hands[id].map(()=>null);}return s;}
export function kingsNpcAction(s){if(!s||s.paused)return null;const id=s.order[s.turn];if(!s.npcs[id]||s.npcManual[id])return null;if(s.phase==='rolling')return {id,action:'roll'};if(s.phase==='betting'){const owing=s.currentBet-(s.street[id]??0),max=KINGS_DICE.slice(0,s.stage+1).reduce((a,b)=>a+b,0);return {id,action:owing?(kingsTotal(s.hands[id])<max*.4&&owing>aalFree(s,id)/2?'fold':'call'):'check'};}return null;}
export function kingsDiceState(s,user){if(!s)return null;const v=kingsView(s,user),active=!v.seriesClosed&&!['lobby','aborted'].includes(v.phase),groups=[];if(active)for(const id of v.order)if(v.hands[id]?.length)groups.push({game:'kings',gameId:v.gameId,revision:v.revision,participant:id,phase:'playing',turnNumber:v.gameId+':'+id,order:[id],turn:0,cup:{dice:v.hands[id],held:v.held[id],types:KINGS_DICE.slice(0,v.hands[id].length).map(n=>'d'+n)}});const current=groups.find(g=>g.participant===v.lastActor);return {game:'kings',gameId:v.gameId,revision:v.revision,phase:active?'playing':v.phase,sourcePhase:v.phase,participant:v.lastActor??user.id,turnNumber:current?.turnNumber,order:current?.order??[],turn:0,groups,cup:current?.cup??null,indices:v.lastIndices??[]};}
