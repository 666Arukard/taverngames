import {LiarsAnimationGate,LiarsPersistentDice,liarsDiceState,liarsDiceEvent} from './liars-dice.mjs';
import {HoardAnimationGate,hoardPublic,hoardDiceState} from './hoard-dice.mjs';
import {HIDDEN_GAMES,HiddenGameGate,HiddenPersistentDice,hiddenDiceState,hiddenRoll,hiddenView} from './hidden-games-dice.mjs';
import {GAME_CATALOG} from './game-catalog.mjs';
import {SchockenAnimationGate,schockenDiceState,schockenDiceEvent} from './schocken-dice.mjs';
import {SchockenPersistentDice,schockenRollPresentation,dicePresentationDiagnostics} from './schocken-presentation.mjs';
import {withScroll} from './scroll-state.mjs';
import {HELD_GAMES,HeldAnimationGate,heldState} from './held-dice.mjs';
import {FarkleAnimationGate,FarklePersistentDice} from './farkle-dice.mjs';
import {diceMenu} from './dice-diagnostics.mjs';
import {ChoSession} from './chohan.mjs';
import {ChoUI} from './chohan-ui.mjs';
import {DiceEvents,DiceAnimator} from './dice-animation.mjs';
import {OutcomeBets} from './outcome-bets.mjs';
import {OutcomeUI} from './outcome-ui.mjs';
import {BETA_GAMES} from './beta-games-engine.mjs';
import {BetaGameSession} from './beta-games-session.mjs';
import {BetaGameUI} from './beta-games-ui.mjs';
import {t,tr,labelName,translatedNames,logText} from './i18n.mjs';
import {create,act,view,DEFAULT_LABELS,valueName,npcAction,canTurnSix} from "./engine.mjs";
import {createNativeWindow,registerSidebar} from "./native-ui.mjs";
import {guideHTML,NAME_SETS} from "./guide.mjs";
import {checkFoundry} from "./compatibility.mjs";
import {announcement} from "./announcement.mjs";
import {FarkleSession} from './farkle-session.mjs';
import {FarkleUI} from './farkle-ui.mjs';
import {f,farkleError} from './farkle-text.mjs';
import {NEW_GAMES as ENGINE_GAMES,tavernNpcAction} from './tavern-engine.mjs';
import {farkleNpcAction} from './farkle-engine.mjs';
import {TavernSession} from './tavern-session.mjs';
import {KniffelUI} from './kniffel-ui.mjs';
import {TavernUI} from './tavern-ui.mjs';
import {BettingManager,COINS} from './wagers.mjs';
import {BettingUI} from './wagers-ui.mjs';
import {PrizeManager} from './prizes.mjs';
import {gameTitle,tavernError} from './tavern-text.mjs';
const NEW_GAMES=[...ENGINE_GAMES,'chohan'];
const ID="taverngames", QUERY="taverngames.command", GRANT="taverngames.grant";
let state=null, capability=null, panel=null, queue=Promise.resolve(), busy=false;
let initialized=false, wasAuthority=false, savedExists=false, key=null;
let lastGM=null,moderation=null,launcher=null;
const apps=new Map();let guide=null;
const tokens=new Map(), history=[];
let connecting=null;
async function ensureCapability(gm){if(authority()||capability)return;if(!connecting)connecting=gm.query(QUERY,{action:'connect',user:game.user.id},{timeout:8000}).finally(()=>{connecting=null;});await connecting;}
const announced=new Set();
const primary=()=>game.users.activeGM;
const authority=()=>primary()?.id===game.user.id;
const name=id=>state?.npcs?.[id] ?? game.users.get(id)?.name ?? id;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=t(text);if(cls)n.className=cls;return n;};
let capturedDice=null,hoardAnnouncement=null;
const randomSides=sides=>{const a=new Uint32Array(1),limit=Math.floor(4294967296/sides)*sides;do{crypto.getRandomValues(a);}while(a[0]>=limit);const value=a[0]%sides+1;capturedDice?.push({sides,value});return value;};
const randomDie=()=>randomSides(6);
const hasMessage=(flag,value)=>game.messages?.some(m=>(m.getFlag?.(ID,flag)??m.flags?.[ID]?.[flag])===value)??false;
let ledgerUnavailable=false;
const clients={},tavernBusy={};
const gameEnabled=scope=>!GAME_CATALOG.find(entry=>entry.id===scope)?.beta||game.settings.get(ID,'betaTest')===true;
const diceEvents=new DiceEvents();
const schockenGate=new SchockenAnimationGate(),schockenPhases=new Map();let schockenVisual=null,schockenLatest=null;
const schockenPersistent=new SchockenPersistentDice({game:()=>game});

let liarsPreparing=false,liarsAnnouncement=null,liarsLatest=null;
const liarsPhases=new Map(),liarsPersistent=new LiarsPersistentDice({game:()=>game,enabled:()=>game.settings.get(ID,'diceSoNiceBeta')===true});
const liarsGate=new LiarsAnimationGate({onClear:()=>{sessions.liars.updateNpcWait();void enqueue(async()=>{
 const message=liarsAnnouncement;liarsAnnouncement=null;
 if(message&&sessions.liars.state?.phase==='finished'&&sessions.liars.state.gameId===message.flags.taverngames.gameId&&!hasMessage('gameId',sessions.liars.state.gameId))await ChatMessage.create(message);
 await settleOutcome('liars');if(sessions.liars.state)emitLiars(sessions.liars.state,null,'sync');tavernUIs.liars.draw();
});}});
function liarsLock(raw){if(!game.settings.get(ID,'diceSoNiceBeta'))return null;const a=authority()?liarsGate.project(sessions.liars.state):raw?.liarsAnimation;return a&&Date.now()<a.until?a:null;}
function liarsProjected(){const raw=authority()?sessions.liars.project(game.user):clients.liars;if(liarsPreparing?.action==='roll')return {...raw,hands:Object.fromEntries(Object.entries(raw?.hands??{}).filter(([id])=>id!==liarsPreparing.actor)),animationPending:true,animationWaiting:true};const a=liarsLock(raw);if(!a)return raw;const next=structuredClone(raw),pending=liarsPhases.get(a.id)!=='done';if(next&&pending&&a.action==='roll')delete next.hands[a.actor];return {...next,animationPending:pending&&a.action==='roll',animationWaiting:true};}
function emitLiars(state,actor,action){for(const user of game.users.filter(u=>u.active)){const e=liarsDiceEvent(state,user,actor,action,liarsGate.project(state));diceEvents.add('liars',actor??user.id,e.dice,{privateTo:[user.id],liars:e.liars});}}
async function syncLiars(next,indices=null){let timer;try{await Promise.race([indices?liarsPersistent.beginRoll(next,indices):liarsPersistent.sync(next),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Liars dice API timeout')),8000);})]);}catch(error){console.warn('Taverngames: Liars dice',error);}finally{clearTimeout(timer);}}
async function liarsAction(actor,action,fn){
 if(['read','diceRead','diceDiagnostics','liarsAnimationAck','connect'].includes(action))return fn();
 const enabled=game.settings.get(ID,'diceSoNiceBeta')&&game.modules?.get('dice-so-nice')?.active;
 if(!enabled)return diceActionBase('liars',actor,action,fn);
 const before=sessions.liars.state,values=[];capturedDice=values;liarsPreparing={actor,action,before};
 try{const result=await fn(),after=sessions.liars.state;diceEvents.record('liars',action,values.length);
  if(before?.revision!==after?.revision){if(action==='roll'&&values.length||action==='challenge')liarsGate.open(after,actor,action,game.users.filter(u=>u.active).map(u=>u.id));else if(['abort','next','lobby','restart'].includes(action))liarsGate.clear();emitLiars(after,actor,action);}return result;
 }finally{capturedDice=null;liarsPreparing=false;if(before?.revision!==sessions.liars.state?.revision)tavernUIs.liars.draw();}
}
async function presentLiars(event){const {state:next,animation:a,indices,action}=event.liars;
 if(!game.settings.get(ID,'diceSoNiceBeta'))return syncLiars(null);
 if(a&&(Date.now()>=a.until||liarsLatest&&liarsLatest.gameId!==next.gameId||liarsLatest?.round>next.round||liarsLatest?.sourcePhase==='aborted')){await requestFinance('liars','liarsAnimationAck',{id:a.id}).catch(()=>{});return;}
 if(a&&['roll','challenge'].includes(action)){
  liarsPhases.set(a.id,'rolling');tavernUIs.liars.draw();
  if(action==='roll'&&indices.length){await syncLiars(next,indices);const result=await diceAnimator.play(event);const live=liarsLatest??next;if(result==='confirmed'&&game.settings.get(ID,'diceSoNiceBeta')&&live.gameId===next.gameId&&live.round===next.round&&live.sourcePhase!=='aborted')liarsPersistent.capture(next,indices,event.id);}
  const live=liarsLatest??next;await syncLiars(game.settings.get(ID,'diceSoNiceBeta')&&live.gameId===next.gameId&&live.round===next.round&&live.sourcePhase!=='aborted'?next:null);
  liarsPhases.set(a.id,'done');if(liarsPhases.size>80)liarsPhases.delete(liarsPhases.keys().next().value);await requestFinance('liars','liarsAnimationAck',{id:a.id}).catch(()=>{});
 }else if(!liarsLatest||next.revision>=liarsLatest.revision)await syncLiars(next);
 tavernUIs.liars.draw();if(!authority()&&!a)void requestTavern('liars','read');
}

const hiddenPreparing={},hiddenLatest={},hiddenMessages={},hiddenGatePhases=new Map();
const hiddenRenderers=Object.fromEntries(HIDDEN_GAMES.map(scope=>[scope,new HiddenPersistentDice({game:()=>game,scope})]));
const hiddenGates=Object.fromEntries(HIDDEN_GAMES.map(scope=>[scope,new HiddenGameGate({onClear:()=>void enqueue(()=>finishHidden(scope))})]));
async function finishHidden(scope){const s=scopeState(scope),message=hiddenMessages[scope];delete hiddenMessages[scope];
 if(message&&s?.gameId===message.flags.taverngames.gameId&&s.phase==='finished'&&!hasMessage('gameId',s.gameId))await ChatMessage.create(message);
 await settleOutcome(scope);
 if(scope==='lottery'&&s?.phase==='finished'&&s.winners?.length&&s.prizeUuid)try{await deliverPrize(s,game.user);}catch(e){ui.notifications.warn(tavernError(e.message));}
 if(s)emitHidden(scope,s,'sync');tavernUIs[scope].draw();
}
function emitHidden(scope,s,action){for(const user of game.users.filter(u=>u.active)){const next=hiddenDiceState(s,user);diceEvents.add(scope,user.id,[],{privateTo:[user.id],hidden:{scope,state:next,action,animation:hiddenGates[scope].project(s)}});}}
function hiddenLock(scope,raw){if(!game.settings.get(ID,'diceSoNiceBeta'))return null;const a=authority()?hiddenGates[scope].project(scopeState(scope)):raw?.hiddenAnimation;return a&&Date.now()<a.until?a:null;}
function hiddenProjected(scope){const raw=authority()?hiddenView(scopeState(scope),game.user):clients[scope];if(hiddenPreparing[scope])return {...hiddenView(hiddenPreparing[scope],game.user),animationPending:true,animationWaiting:true};const a=hiddenLock(scope,raw);if(!a)return raw;return {...(authority()?hiddenView(hiddenGates[scope].before,game.user):raw.hiddenBefore??raw),animationPending:hiddenGatePhases.get(a.id)!=='done',animationWaiting:true};}
async function syncHidden(scope,s,indices=null,retarget=false){let timer;try{await Promise.race([retarget?hiddenRenderers[scope].retarget(s):indices?hiddenRenderers[scope].beginRoll(s,indices):hiddenRenderers[scope].sync(s),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Hidden dice API timeout')),1000);})]);}catch(e){console.warn('Taverngames: hidden dice',e);}finally{clearTimeout(timer);}}
async function hiddenAction(scope,actor,action,fn){if(['read','diceRead','diceDiagnostics','hiddenAnimationAck','connect'].includes(action))return fn();const before=structuredClone(scopeState(scope)),values=[];capturedDice=values;const enabled=game.settings.get(ID,'diceSoNiceBeta')&&game.modules?.get('dice-so-nice')?.active;
 if(enabled&&['roll','draw'].includes(action))hiddenPreparing[scope]=before;
 try{const result=await fn(),after=scopeState(scope);diceEvents.record(scope,action,values.length);if(enabled&&after?.revision!==before?.revision){if(values.length&&['roll','draw'].includes(action))hiddenGates[scope].open(before,after,game.users.filter(u=>u.active).map(u=>u.id));else if(['abort','lobby','restart'].includes(action))hiddenGates[scope].clear();emitHidden(scope,after,action);}return result;
 }finally{capturedDice=null;delete hiddenPreparing[scope];if(before?.revision!==scopeState(scope)?.revision)tavernUIs[scope].draw();}}
async function presentHidden(event){const {scope,state:next,action,animation:a}=event.hidden;if(!HIDDEN_GAMES.includes(scope))return;if(!game.settings.get(ID,'diceSoNiceBeta'))return syncHidden(scope,null);
 const latest=hiddenLatest[scope];if(latest&&latest.revision>next.revision){if(a&&['roll','draw'].includes(action))await requestFinance(scope,'hiddenAnimationAck',{id:a.id}).catch(()=>{});return;}
 const roll=['roll','draw'].includes(action)&&a&&Date.now()<a.until;
 if(roll){hiddenGatePhases.set(a.id,'rolling');tavernUIs[scope].draw();await syncHidden(scope,next,[0,1]);const result=next.cup?await diceAnimator.play(hiddenRoll(event)):null;
  const current=hiddenLatest[scope]??next,valid=game.settings.get(ID,'diceSoNiceBeta')&&current.gameId===next.gameId&&current.phase==='playing';
  if(valid&&result==='confirmed')hiddenRenderers[scope].capture(next,[0,1],event.id);await syncHidden(scope,valid?next:null);hiddenGatePhases.set(a.id,'done');if(hiddenGatePhases.size>80)hiddenGatePhases.delete(hiddenGatePhases.keys().next().value);
  await requestFinance(scope,'hiddenAnimationAck',{id:a.id}).catch(()=>{});
 }else await syncHidden(scope,next,null,true);
 tavernUIs[scope].draw();if(!authority()&&!a)void requestTavern(scope,'read');
}
function schockenLock(){if(!game.settings.get(ID,'diceSoNiceBeta'))return null;const a=authority()?schockenGate.project(state):Object.hasOwn(state??{},'schockenAnimation')?state.schockenAnimation:schockenVisual?.animation;return a&&Date.now()<a.until&&a.gameId===state?.gameId?a:null;}
async function syncSchocken(next,indices=null,retarget=false){let timer;try{await Promise.race([retarget?schockenPersistent.retarget(next):indices?schockenPersistent.beginRoll(next,indices):schockenPersistent.sync(next),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Schocken dice API timeout')),1000);})]);}catch(error){console.warn('Taverngames: Schocken 3D',error);}finally{clearTimeout(timer);}}
function emitSchocken(before,after,action){for(const user of game.users.filter(u=>u.active)){const e=schockenDiceEvent(before,after,user,action,schockenGate.project(after));diceEvents.add('schocken',e.actor,e.dice,{privateTo:[user.id],schocken:e.schocken});}}
async function schockenAction(actor,action,fn){
 if(['read','diceRead','diceDiagnostics','schockenAnimationAck','connect'].includes(action))return fn();
 const before=structuredClone(state),values=[];capturedDice=values;
 try{const result=await fn();diceEvents.record('schocken',action,values.length);
  if(state?.revision!==before?.revision&&game.settings.get(ID,'diceSoNiceBeta')&&game.modules?.get('dice-so-nice')?.active){
   if(['roll','hold','return','six','reveal'].includes(action)){const lock=schockenGate.open(state,game.users.filter(u=>u.active).map(u=>u.id));if(action!=='roll')schockenPhases.set(lock.id,'display');}
   else if(['finish','abort','undo','start','lobby','begin','nextHalf'].includes(action))schockenGate.clear();
   emitSchocken(before,state,action);
  }return result;
 }finally{capturedDice=null;if(panel||moderation)draw();}
}
async function presentSchocken(event,play){
 const data=event.schocken,next=data.state,a=data.animation;
 if(!game.settings.get(ID,'diceSoNiceBeta'))return syncSchocken(null);
 const knownAtStart=state?.revision>=next?.revision?schockenDiceState(state,game.user):next,newest=(schockenLatest?.revision??-1)>=(knownAtStart?.revision??-1)?schockenLatest:knownAtStart;
 if(a&&(Date.now()>=a.until||newest?.revision>next?.revision&&(newest.gameId!==next.gameId||newest.turnNumber!==next.turnNumber||newest.phase!=='playing'))){await syncSchocken(null);await requestFinance('schocken','schockenAnimationAck',{id:a.id}).catch(()=>{});return;}
 if(next?.revision<(schockenVisual?.state?.revision??-1)){if(a&&['roll','hold','return','six','reveal'].includes(data.action))await requestFinance('schocken','schockenAnimationAck',{id:a.id}).catch(()=>{});return;}
 schockenVisual=data;if(!authority()&&next?.phase==='aborted'&&state?.gameId===next.gameId&&state.revision<=next.revision)state={...state,phase:'aborted',revision:next.revision,cup:null,results:[],lastResults:[],paused:true,schockenAnimation:null};if(!authority()&&state?.gameId===next?.gameId&&state.revision<=next.revision)state={...state,schockenAnimation:a};
 if(data.action==='undo'){await schockenPersistent.clear();draw();return;}
 const animate=a&&['roll','hold','return','six','reveal'].includes(data.action)&&schockenPhases.get(a.id)!=='done';
 if(animate){schockenPhases.set(a.id,data.action==='roll'?'rolling':'display');draw();
  if(data.action==='roll'){
   await syncSchocken(next,data.indices);const result=await diceAnimator.play(schockenRollPresentation(event));
   if(result==='confirmed'&&game.settings.get(ID,'diceSoNiceBeta'))schockenPersistent.capture(next,data.indices,event.id);
  }else await syncSchocken(next,null,true);
  const known=state?.gameId===next?.gameId&&state.revision>=next.revision?schockenDiceState(state,game.user):next,live=(schockenLatest?.revision??-1)>=(known?.revision??-1)?schockenLatest:known;await syncSchocken(game.settings.get(ID,'diceSoNiceBeta')&&live?.gameId===next?.gameId&&live.turnNumber===next?.turnNumber&&live.phase==='playing'?next:null);
  const ack=await requestFinance('schocken','schockenAnimationAck',{id:a.id}).catch(()=>null);if(!authority()&&state?.schockenAnimation?.id===a.id&&ack)state={...state,schockenAnimation:ack.animation};
  schockenPhases.set(a.id,'done');if(schockenPhases.size>80)schockenPhases.delete(schockenPhases.keys().next().value);
 }else await syncSchocken(next);
 draw();
}
const farkleGate=new FarkleAnimationGate();
const heldGates=Object.fromEntries(HELD_GAMES.map(scope=>[scope,new (scope==='hoard'?HoardAnimationGate:HeldAnimationGate)({onClear:()=>{if(scope==='pig')sessions.pig.updateNpcWait();if(scope==='hoard'){sessions.hoard.updateNpcWait();void enqueue(async()=>{const message=hoardAnnouncement;hoardAnnouncement=null;if(message&&sessions.hoard.state?.phase==='finished'&&sessions.hoard.state.gameId===message.flags.taverngames.gameId&&!hasMessage('gameId',message.flags.taverngames.gameId))await ChatMessage.create(message);await settleOutcome('hoard');});}}})])),heldPreparing={},heldPhases=new Map(),heldRenderers=Object.fromEntries(HELD_GAMES.map(scope=>[scope,new FarklePersistentDice({game:()=>game,scope})]));
let farklePreparing=null;const farklePhases=new Map();
const farklePersistent=new FarklePersistentDice({game:()=>game,warn:()=>ui.notifications.warn(f('Taverngames: Liegende 3D-Würfel benötigen die geprüfte Dice-So-Nice-Schnittstelle 6.4.4.','Taverngames: held 3D dice require the checked Dice So Nice 6.4.4 API.'))});
const diceAnimator=new DiceAnimator({game:()=>game,present:presentDice,enabled:()=>game.settings.get(ID,'diceSoNiceBeta')===true,warn:()=>ui.notifications.warn(f('Taverngames: Dice-So-Nice-Animation nicht verfügbar. Die normale Würfeldarstellung bleibt aktiv.','Taverngames: Dice So Nice animation unavailable. Standard dice display remains active.'))});
let dicePolling=false;
async function pollDice(){if(dicePolling||!primary()||game.settings.get(ID,'diceSoNiceBeta')!==true)return;dicePolling=true;try{const batch=await requestFinance('schocken','diceRead',{after:diceAnimator.cursor});for(const event of batch?.events??[]){const next=event.schocken?.state;if(next&&next.revision>=(schockenLatest?.revision??-1))schockenLatest=next;const h=event.held;if(!authority()&&h?.scope==='hoard'&&h.state?.revision>=(clients.hoard?.revision??-1)){clients.hoard={...h.state,animation:h.animation??h.lock??null};if(h.state.phase==='aborted')tavernUIs.hoard.draw();}}for(const event of batch?.events??[]){const h=event.hidden;if(h?.state&&h.state.revision>=(hiddenLatest[h.scope]?.revision??-1)){hiddenLatest[h.scope]=h.state;if(!authority()&&h.state.sourcePhase==='aborted'&&clients[h.scope]?.gameId===h.state.gameId){clients[h.scope]={...clients[h.scope],phase:'aborted',revision:h.state.revision,hiddenAnimation:null};tavernUIs[h.scope].draw();}}}for(const event of batch?.events??[]){const l=event.liars?.state;if(l&&l.revision>=(liarsLatest?.revision??-1)){liarsLatest=l;liarsPersistent.latest=l;if(!authority()&&l.sourcePhase==='aborted'&&clients.liars?.gameId===l.gameId){clients.liars={...clients.liars,phase:'aborted',revision:l.revision,liarsAnimation:null};tavernUIs.liars.draw();}}}diceAnimator.consume(batch);}catch{diceAnimator.stats.status='connection-error';diceAnimator.stats.errors++;}finally{dicePolling=false;}}
function farkleProjected(){const raw=authority()?farkleSession.state:farkleClient;if(farklePreparing)return {...farklePreparing,animationPending:true};const a=authority()?farkleGate.project(raw):raw?.animation;if(!a||Date.now()>=a.until||!game.settings.get(ID,'diceSoNiceBeta')||raw?.phase==='aborted')return raw;const phase=farklePhases.get(a.id);if(phase==='done')return {...raw,animationWaiting:false,animationNextWaiting:true};return {...structuredClone(phase==='bust'?a.preview:a.before),animationPending:phase!=='bust',animationBust:phase==='bust',animationWaiting:true};}
const waitDice=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function safeFarkleSync(state,indices=null){let timer;try{await Promise.race([indices?farklePersistent.beginRoll(state,indices):farklePersistent.sync(state),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Held dice API timeout')),1000);})]);}catch(error){console.warn('Taverngames: held 3D dice failed',error);}finally{clearTimeout(timer);}}
function heldProjected(scope){const raw=authority()?(scope==='hoard'?sessions.hoard.project(game.user):sessions[scope].state):clients[scope],before=heldPreparing[scope];if(before)return {...before,animationPending:true,animationWaiting:true};const a=authority()?heldGates[scope].project(raw):raw?.animation;if(!a||Date.now()>=a.until||!game.settings.get(ID,'diceSoNiceBeta')||raw?.phase==='aborted')return raw;if(heldPhases.get(a.id)==='done')return {...raw,animationWaiting:false,animationNextWaiting:true};return {...a.before,animationPending:true,animationWaiting:true};}
async function syncHeld(scope,state,indices=null){let timer;try{await Promise.race([indices?heldRenderers[scope].beginRoll(scope==='hoard'?hoardDiceState(state):heldState(state),indices):heldRenderers[scope].sync(scope==='hoard'?hoardDiceState(state):heldState(state)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Held dice API timeout')),1000);})]);}catch(error){console.warn('Taverngames: held dice API',error);}finally{clearTimeout(timer);}}
async function presentHeld(event,play){const {scope,animation:a,state:next}=event.held;if(!HELD_GAMES.includes(scope))return;if(!game.settings.get(ID,'diceSoNiceBeta'))return syncHeld(scope,null);if(!authority()&&next&&next.revision>=(clients[scope]?.revision??-1))clients[scope]={...next,animation:a??event.held.lock??null};
 if(!a){const current=authority()?sessions[scope].state:clients[scope];await syncHeld(scope,scope==='hoard'&&current?.revision>=next?.revision?current:next);tavernUIs[scope].draw();return;}
 const live=authority()?sessions[scope].state:clients[scope];if(live?.gameId!==a.gameId||live?.phase==='aborted'||Date.now()>=a.until){await requestFinance(scope,'heldAnimationAck',{id:a.id}).catch(()=>{});return;}
 heldPhases.set(a.id,'rolling');tavernUIs[scope].draw();await syncHeld(scope,a.preview,a.indices);const result=await play();if(result==='confirmed')heldRenderers[scope].capture(scope==='hoard'?hoardDiceState(a.preview):heldState(a.preview),a.indices,event.id);await syncHeld(scope,game.settings.get(ID,'diceSoNiceBeta')?(authority()?sessions[scope].state:clients[scope]):null);const ack=await requestFinance(scope,'heldAnimationAck',{id:a.id}).catch(()=>null);if(!authority()&&clients[scope]?.animation?.id===a.id&&ack)clients[scope]={...clients[scope],animation:ack.animation};heldPhases.set(a.id,'done');if(heldPhases.size>80)heldPhases.delete(heldPhases.keys().next().value);tavernUIs[scope].draw();}
async function heldAction(scope,actor,action,fn){const before=structuredClone(sessions[scope].state),values=[];capturedDice=values;const enabled=game.settings.get(ID,'diceSoNiceBeta')&&game.modules?.get('dice-so-nice')?.active;if(['roll','resolveGuess'].includes(action)&&enabled)heldPreparing[scope]=scope==='hoard'?hoardPublic(before):before;
 try{const result=await fn();diceEvents.record(scope,action,values.length);const after=sessions[scope].state;if(enabled&&after?.revision!==before?.revision){if(['roll','resolveGuess'].includes(action)&&values.length){const animation=heldGates[scope].open(before,after,values,game.users.filter(u=>u.active).map(u=>u.id));diceEvents.add(scope,actor,values,{held:{scope,animation,state:scope==='hoard'?hoardPublic(after):after}});}else{if(['abort','lobby','restart','undo'].includes(action))heldGates[scope].clear();diceEvents.add(scope,actor,[],{held:{scope,state:scope==='hoard'?hoardPublic(after):after,lock:heldGates[scope].project(after)}});}}return result;}finally{capturedDice=null;delete heldPreparing[scope];if(!['read','heldAnimationAck'].includes(action)&&(!['pig','hoard'].includes(scope)||before?.revision!==sessions[scope].state?.revision))tavernUIs[scope].draw();}}
async function presentDice(event,play){
 if(event.liars)return presentLiars(event);
 if(event.hidden)return presentHidden(event);
 if(event.schocken)return presentSchocken(event,play);
 if(event.held)return presentHeld(event,play);
 if(!event.farkle)return play();const data=event.farkle;
 if(!game.settings.get(ID,'diceSoNiceBeta')){await safeFarkleSync(null);return;}
 if(!authority()&&data.state&&data.state.revision>=(farkleClient?.revision??-1))farkleClient={...data.state,animation:data.animation??data.lock??null};
 if(data.animation){
  const a=data.animation,live=authority()?farkleSession.state:farkleClient;if(live?.gameId!==a.gameId||live?.phase==='aborted'||Date.now()>=a.until){await requestFinance('farkle','farkleAnimationAck',{id:a.id}).catch(()=>{});return;}farklePhases.set(a.id,'rolling');farkleUI.draw();
  await safeFarkleSync(a.preview,a.indices);const result=await play();
  if(result==='confirmed')farklePersistent.capture(a.preview,a.indices,event.id);
  
  const current=authority()?farkleSession.state:farkleClient;
  if(current?.gameId===a.gameId&&current.phase!=='aborted'&&game.settings.get(ID,'diceSoNiceBeta')&&a.bust){farklePhases.set(a.id,'bust');farkleUI.draw();await waitDice(2000);}
  // Animation has finished; copying inert display pieces need not delay the ACK.
  const acknowledgement=requestFinance('farkle','farkleAnimationAck',{id:a.id}).catch(()=>null);
  await safeFarkleSync(game.settings.get(ID,'diceSoNiceBeta')?(authority()?farkleSession.state:farkleClient):null);
  const ack=await acknowledgement;if(!authority()&&farkleClient?.animation?.id===a.id&&ack)farkleClient={...farkleClient,animation:ack.animation};farklePhases.set(a.id,'done');if(farklePhases.size>40)farklePhases.delete(farklePhases.keys().next().value);farkleUI.draw();
 }else{await safeFarkleSync(data.state);farkleUI.draw();}
}
async function diceAction(scope,actor,action,fn){
 if(scope==='liars')return liarsAction(actor,action,fn);
 if(HIDDEN_GAMES.includes(scope))return hiddenAction(scope,actor,action,fn);
 if(scope==='schocken')return schockenAction(actor,action,fn);
 if(HELD_GAMES.includes(scope))return heldAction(scope,actor,action,fn);
 if(scope!=='farkle')return diceActionBase(scope,actor,action,fn);
 const before=structuredClone(farkleSession.state),values=[];capturedDice=values;
 const enabled=game.settings.get(ID,'diceSoNiceBeta')===true&&game.modules?.get('dice-so-nice')?.active===true;
 if(action==='roll'&&enabled)farklePreparing=before;
 try{const result=await fn();diceEvents.record(scope,action,values.length);
  const after=farkleSession.state;
  if(enabled&&after?.revision!==before?.revision){
   if(action==='roll'&&values.length){const animation=farkleGate.open(before,after,values,game.users.filter(u=>u.active).map(u=>u.id));diceEvents.add(scope,actor,values,{farkle:{animation,state:after}});}
   else{if(['abort','lobby','restart','undo'].includes(action))farkleGate.clear();diceEvents.add(scope,actor,[],{farkle:{state:after,lock:farkleGate.project(after)}});}
  }
  return result;
 }finally{capturedDice=null;farklePreparing=null;if(action!=='read'&&action!=='diceRead'&&action!=='diceDiagnostics'&&action!=='farkleAnimationAck')farkleUI.draw();}
}
async function diceActionBase(scope,actor,action,fn){const values=[];capturedDice=values;try{const result=await fn();diceEvents.record(scope,action,values.length);if(game.settings.get(ID,'diceSoNiceBeta')===true){const current=scopeState(scope);if(['roll','draw','resolveGuess'].includes(action)){let privateTo=null;if(scope==='liars')privateTo=[actor,...(current?.npcs?.[actor]&&current?.npcManual?.[actor]?[game.user.id]:[])];if(scope==='schocken')privateTo=current?.cup?.concealed?[]:[actor];if(scope==='chohan')privateTo=[];diceEvents.add(scope,actor,values,{privateTo});}if(scope==='liars'&&action==='challenge'&&current?.reveal)for(const [id,hand]of Object.entries(current.reveal.hands))diceEvents.add(scope,id,hand.map(value=>({sides:6,value})));if(scope==='schocken'&&action==='reveal'){const cup=current?.cup;const result=current?.results?.find(r=>r.id===actor);const dice=cup?.revealed?cup.dice:result&&!result.hidden?result.dice:[];diceEvents.add(scope,actor,(dice??[]).filter(Number.isInteger).map(value=>({sides:6,value})));}}return result;}finally{capturedDice=null;}}
const sessions=Object.fromEntries(NEW_GAMES.map(scope=>[scope,new (scope==='chohan'?ChoSession:BETA_GAMES.includes(scope)?BetaGameSession:TavernSession)(scope,{enabled:()=>gameEnabled(scope),save:next=>save(next,`${scope}State`),random:randomSides,getName:id=>game.users.get(id)?.name??id,announce:data=>{if(scope==='liars'&&liarsPreparing){liarsAnnouncement=data;return Promise.resolve();}if(hiddenPreparing[scope]){hiddenMessages[scope]=data;return Promise.resolve();}if(scope==='hoard'&&heldPreparing.hoard){hoardAnnouncement=data;return Promise.resolve();}return ChatMessage.create(data);},hasAnnouncement:id=>hasMessage('gameId',id)})]));
const betting=new BettingManager({isAuthority:authority,save:next=>save(next,'bettingState'),enabled:()=>game.settings.get(ID,'managedBetting')===true,electrum:()=>game.settings.get(ID,'allowElectrum')===true,system:()=>game.system?.id,actor:id=>game.actors?.get(id),character:id=>game.users.get(id)?.character,announce:data=>ChatMessage.create(data),hasMessage:(tx,id)=>game.messages?.some(m=>(m.getFlag?.(ID,'betTx')??m.flags?.[ID]?.betTx)===tx&&(m.getFlag?.(ID,'betActor')??m.flags?.[ID]?.betActor)===id)??false});
const prizes=new PrizeManager({isAuthority:authority,save:next=>save(next,'prizeState'),system:()=>game.system?.id,actor:id=>game.actors?.get(id),item:uuid=>(globalThis.foundry?.utils?.fromUuid??globalThis.fromUuid)(uuid),announce:data=>ChatMessage.create(data),hasMessage:id=>hasMessage('prizeAward',id)});
const moneyUI=new BettingUI({request:requestFinance});
const outcomes=new OutcomeBets({isAuthority:authority,save:next=>save(next,'outcomeState'),user:id=>game.users.get(id),announce:data=>ChatMessage.create(data),hasAnnouncement:id=>hasMessage('outcomeBet',id)});
const outcomeUI=new OutcomeUI({request:requestFinance});
async function settleOutcome(scope){if(scope==='liars'&&(liarsPreparing||liarsGate.active(sessions.liars.state)))return;if(HIDDEN_GAMES.includes(scope)&&(hiddenPreparing[scope]||hiddenGates[scope].active(scopeState(scope))))return;if(scope==='hoard'&&(heldPreparing.hoard||heldGates.hoard.active(sessions.hoard.state)))return;if(!ledgerUnavailable)await outcomes.observe(scope,scopeState(scope));}
const tavernUIs=Object.fromEntries(NEW_GAMES.map(scope=>[scope,new (scope==='chohan'?ChoUI:BETA_GAMES.includes(scope)?BetaGameUI:scope==='kniffel'?KniffelUI:TavernUI)(scope,{request:(action,args)=>requestTavern(scope,action,args),getState:()=>scope==='liars'?liarsProjected():HIDDEN_GAMES.includes(scope)?hiddenProjected(scope):HELD_GAMES.includes(scope)?heldProjected(scope):authority()?(sessions[scope].project?sessions[scope].project(game.user):sessions[scope].state):clients[scope],openOutcome:scope=>outcomeUI.open(scope),openBetting:scope=>moneyUI.open(scope)})]));
const scopeState=scope=>scope==='schocken'?state:scope==='farkle'?farkleSession.state:sessions[scope]?.state;
async function deliverPrize(current,user){const id=current?.winners?.[0],actorId=betting.state.books[current?.gameId]?.mapping[id]??game.users.get(id)?.character?.id;await prizes.deliver(current,user,actorId);}
let farkleClient=null,farkleBusy=false;
const farkleSession=new FarkleSession({save:next=>save(next,'farkleState'),diceSource:randomDie,getName:id=>game.users.get(id)?.name??id,announce:data=>ChatMessage.create(data),hasAnnouncement:id=>game.messages?.some(message=>message.getFlag?.(ID,'gameId')===id)??false,allowBestSelection:()=>game.settings.get(ID,'allowFarkleBestSelection')===true});
const farkleUI=new FarkleUI({request:requestFarkle,getState:farkleProjected,openOutcome:scope=>outcomeUI.open(scope),openBetting:scope=>moneyUI.open(scope)});
function enqueue(fn) {const result=queue.then(fn);queue=result.catch(()=>{});return result;}
const base64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unbase64=text=>Uint8Array.from(atob(text),c=>c.charCodeAt(0));
async function storageKey() {
  if(key)return key;
  const slot=`taverngames.key.${game.world.id}`;
  let raw=localStorage.getItem(slot);
  if(!raw){raw=base64(crypto.getRandomValues(new Uint8Array(32)));localStorage.setItem(slot,raw);}
  key=await crypto.subtle.importKey("raw",unbase64(raw),"AES-GCM",false,["encrypt","decrypt"]);return key;
}
async function save(next,setting='state') {
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv},await storageKey(),new TextEncoder().encode(JSON.stringify(next)));
  await game.settings.set(ID,setting,{format:1,iv:base64(iv),cipher:base64(cipher)});if(setting==='state')savedExists=true;
}
async function announceFinished(previous,next) {
  if(next.phase!=='finished'||previous?.phase==='finished'||announced.has(next.gameId))return;
  if(game.messages?.some(m=>m.getFlag?.(ID,'gameId')===next.gameId)){announced.add(next.gameId);return;}
  try {
    await ChatMessage.create(announcement(next,id=>next.npcs?.[id]??game.users.get(id)?.name??id));announced.add(next.gameId);
  }catch(e){ui.notifications.warn(tr`Schocken: Spiel gespeichert, Chat-Ankündigung fehlgeschlagen: ${t(e.message)}`);}
}
async function initializeAuthority() {
  if(!authority()||initialized)return;
  tokens.clear();history.length=0;state=null;
  const saved=game.settings.get(ID,"state");savedExists=!!saved;
  if(saved)try {
    const bytes=await crypto.subtle.decrypt({name:"AES-GCM",iv:unbase64(saved.iv)},await storageKey(),unbase64(saved.cipher));
    state=JSON.parse(new TextDecoder().decode(bytes));
    if(state.version!==1)throw new Error(t("Unbekanntes Format"));
  }catch {state=null;ui.notifications.warn(t("Schocken: Gespeicherter Tisch gehört zu einem anderen GM-Browser. Dort fortsetzen oder ausdrücklich ein neues Spiel starten."));}
  farkleSession.restore(null);
  const farkleSaved=game.settings.get(ID,'farkleState');
  if(farkleSaved)try{
    const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:unbase64(farkleSaved.iv)},await storageKey(),unbase64(farkleSaved.cipher));
    farkleSession.restore(JSON.parse(new TextDecoder().decode(bytes)));
  }catch{ui.notifications.warn(f('Farkle: Spielstand konnte in diesem GM-Browser nicht wiederhergestellt werden. Im ursprünglichen Browser fortsetzen oder bewusst eine neue Lobby öffnen.','Farkle: this GM browser could not restore the saved game. Continue in the original browser or explicitly open a new lobby.'));}
  ledgerUnavailable=false;
  for(const [setting,session] of [...NEW_GAMES.map(scope=>[`${scope}State`,sessions[scope]]),['bettingState',betting],['prizeState',prizes],['outcomeState',outcomes]]){
    session.restore(null);const encrypted=game.settings.get(ID,setting);if(!encrypted)continue;
    try{const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:unbase64(encrypted.iv)},await storageKey(),unbase64(encrypted.cipher));session.restore(JSON.parse(new TextDecoder().decode(bytes)));}
    catch{if(['bettingState','prizeState','outcomeState'].includes(setting))ledgerUnavailable=true;ui.notifications.warn(f('Taverngames: Gespeicherte Daten nicht lesbar. Im ursprünglichen GM-Browser fortsetzen.','Taverngames: cannot restore saved data. Continue in the original GM browser.'));}
  }
  initialized=true;
  for(const user of game.users)void grant(user);
}
async function grant(user) {
  if(!authority() || !user.active || user.id===game.user.id) return;
  const token=crypto.randomUUID()+crypto.randomUUID();tokens.set(user.id,token);
  try {await user.query(GRANT,{token},{timeout:5000});}catch {tokens.delete(user.id);}
}
async function command(data,local=false){const scope=data?.game??'schocken',before=scopeState(scope),user=local?game.user:game.users.get(data?.user),actor=scope==='liars'?(user?.isGM&&before?.npcs?.[data?.args?.id]?data.args.id:user?.id):(before?.order?.[before.turn]??data?.user);const result=await diceAction(scope,actor,data?.action,()=>commandCore(data,local));if(scope==='liars'&&result?.game==='liars')return {...result,liarsAnimation:liarsLock(result)};if(HIDDEN_GAMES.includes(scope)&&result?.game===scope){const a=hiddenLock(scope,result),before=a?hiddenView(hiddenGates[scope].before,user):null;return {...(scope==='lottery'&&a?{...before,revision:result.revision}:result),hiddenAnimation:a,hiddenBefore:before};}return scope==='schocken'&&result?.version===1&&Array.isArray(result.order)?{...result,schockenAnimation:game.settings.get(ID,'diceSoNiceBeta')?schockenGate.project(state):null}:HELD_GAMES.includes(scope)&&result?.game===scope?{...result,animation:game.settings.get(ID,'diceSoNiceBeta')?heldGates[scope].project(sessions[scope].state):null}:scope==='farkle'&&result?.game==='farkle'?{...result,animation:game.settings.get(ID,'diceSoNiceBeta')?farkleGate.project(farkleSession.state):null}:result;}

async function commandCore(data, local=false) {
  if(game.modules?.get('schocken')?.active)throw new Error(t('Altes Modul Schocken zuerst deaktivieren.'));
  const compatibility=checkFoundry(game.release,game.version);if(!compatibility.supported)throw new Error(compatibility.message);
  if(!authority()) throw new Error(t("Die aktive GM-Verbindung hat gewechselt. Bitte Fenster neu öffnen."));
  await initializeAuthority();
  // Bootstrap only delivers a secret to the actual targeted Foundry User.
  // It never returns a secret or game state to the caller claiming that ID.
  if(data?.action==="connect") {const target=game.users.get(data.user);if(target)await grant(target);return null;}
  const user=local?game.user:game.users.get(data?.user);
  if(!user?.active || (!local && (!tokens.has(user.id) || tokens.get(user.id)!==data?.token))) throw new Error(t("Verbindung noch nicht bereit. GM kann Verbindungen erneuern."));
  if(data.action==='schockenAnimationAck'){
   if((data.game??'schocken')!=='schocken')throw Error('Unknown game.');
   const current=schockenGate.active(state);if(current?.id===data.args?.id&&current.pending.has(user.id)){schockenGate.ack(current.id,user.id);if(!schockenGate.active(state)){emitSchocken(state,state,'sync');draw();}}
   return {animation:schockenGate.project(state)};
  }
  if((data.game??'schocken')==='schocken'&&game.settings.get(ID,'diceSoNiceBeta')&&schockenGate.active(state)&&!['read','diceRead','diceDiagnostics','connect','abort','pause','npcControl'].includes(data.action))throw Error(f('Bitte das Ende der Würfelanimation abwarten.','Please wait for the dice animation to finish.'));
  if(data.action==='liarsAnimationAck'){if(data.game!=='liars')throw Error('Unknown game.');const c=liarsGate.active(sessions.liars.state);if(c?.id===data.args?.id&&c.pending.has(user.id))liarsGate.ack(c.id,user.id);return {animation:liarsGate.project(sessions.liars.state)};}
  if(data.game==='liars'&&liarsLock(sessions.liars.state)&&!['read','abort','pause','npcControl'].includes(data.action))throw Error(f('Bitte das Ende der Würfelanimation abwarten.','Please wait for the dice animation to finish.'));
  if(data.action==='hiddenAnimationAck'){if(!HIDDEN_GAMES.includes(data.game))throw Error('Unknown game.');const g=hiddenGates[data.game],c=g.active(scopeState(data.game));if(c?.id===data.args?.id&&c.pending.has(user.id))g.ack(c.id,user.id);return {animation:g.project(scopeState(data.game))};}
  if(HIDDEN_GAMES.includes(data.game)&&hiddenLock(data.game,scopeState(data.game))&&!['read','abort','pause','npcControl'].includes(data.action))throw Error(f('Bitte das Ende der Würfelanimation abwarten.','Please wait for the dice animation to finish.'));
  if(data.action==='heldAnimationAck'){if(!HELD_GAMES.includes(data.game))throw Error('Unknown game.');const current=heldGates[data.game].active(sessions[data.game].state);if(current?.id!==data.args?.id||!current?.pending.has(user.id))return {animation:heldGates[data.game].project(sessions[data.game].state)};heldGates[data.game].ack(data.args?.id,user.id);const animation=heldGates[data.game].project(sessions[data.game].state);diceEvents.add(data.game,user.id,[],{held:{scope:data.game,state:data.game==='hoard'?hoardPublic(sessions.hoard.state):sessions[data.game].state,lock:animation}});return {animation};}
  if(HELD_GAMES.includes(data.game)&&game.settings.get(ID,'diceSoNiceBeta')&&heldGates[data.game].active(sessions[data.game].state)&&!['read','abort','pause','npcControl'].includes(data.action)&&!(['hold','return'].includes(data.action)&&!heldGates[data.game].current.pending.has(user.id)))throw Error(f('Bitte das Ende der Würfelanimation abwarten.','Please wait for the dice animation to finish.'));
  if(data.action==='farkleAnimationAck'){const current=farkleGate.active(farkleSession.state);if(current?.id!==data.args?.id||!current?.pending.has(user.id))return {animation:farkleGate.project(farkleSession.state)};farkleGate.ack(data.args?.id,user.id);const animation=farkleGate.project(farkleSession.state);diceEvents.add('farkle',user.id,[],{farkle:{state:farkleSession.state,lock:animation}});farkleUI.draw();return {animation};}
  if(data.game==='farkle'&&game.settings.get(ID,'diceSoNiceBeta')&&farkleGate.active(farkleSession.state)&&!['read','abort','pause','npcControl'].includes(data.action)&&!(['toggle','select','best'].includes(data.action)&&!farkleGate.current.pending.has(user.id))){throw Error(f('Bitte das Ende der Würfelanimation abwarten.','Please wait for the dice animation to finish.'));}
  if(data.action==='diceDiagnostics'){if(!user.isGM)throw Error('GM only.');return diceEvents.diagnostics();}
  if(data.action==='diceRead'){const batch=diceEvents.read(user,Number.isSafeInteger(data.args?.after)?data.args.after:0);return game.settings.get(ID,'diceSoNiceBeta')===true?batch:{cursor:batch.cursor,events:[]};}
  const scope=data.game??'schocken';
  if(!['schocken','farkle',...NEW_GAMES].includes(scope))throw new Error('Unknown game.');
  if(!gameEnabled(scope)&&!(data.action==='abort'&&user.isGM))throw new Error('Beta testing is disabled.');
  if(data.action.startsWith('outcome')){if(ledgerUnavailable)throw new Error('Resume in the original GM browser before modifying wallets or items.');await settleOutcome(scope);return outcomes.handle(scope,scopeState(scope),data,user);}
  await settleOutcome(scope);outcomes.guard(scope,scopeState(scope),data.action);
  if((BETA_GAMES.includes(scope)||scope==='chohan')&&data.action.startsWith('bet'))throw new Error('Automatic currency transactions are not available.');
  if(scope==='kniffel'&&data.action.startsWith('bet'))throw new Error('Kniffel betting is not available.');
  if(ledgerUnavailable&&['betConfigure','betSettle','awardPrize','waivePrize'].includes(data.action))throw new Error('Resume in the original GM browser before modifying wallets or items.');
  if(data.action.startsWith('bet')){
    if(data.action!=='betRead'&&data.args?.gameId!==scopeState(scope)?.gameId)throw new Error('The game state changed. Please try again.');
    return betting.handle(scope,scopeState(scope),data,user);
  }
  if(['awardPrize','waivePrize'].includes(data.action)){
    if(!user.isGM||scope!=='lottery')throw new Error('GM only.');
    if(data.revision!==sessions.lottery.state?.revision)throw new Error('The game state changed. Please try again.');
    if(data.action==='waivePrize')await prizes.waive(sessions.lottery.state,user);else await deliverPrize(sessions.lottery.state,user);return structuredClone(sessions.lottery.state);
  }
  if(['start','lobby','restart'].includes(data.action)&&(betting.hasPending(scope)||prizes.pending(scopeState(scope))))throw new Error('Complete the pending settlement or prize delivery first.');
  if(NEW_GAMES.includes(scope)){
    if(data.action==='lobby'&&data.args?.currency==='ep'&&!game.settings.get(ID,'allowElectrum'))throw new Error('Electrum is disabled.');
    if(scope==='lottery'&&data.action==='begin'&&sessions.lottery.state?.prizeUuid){if(!user.isGM)throw new Error('GM only.');const item=await (globalThis.foundry?.utils?.fromUuid??globalThis.fromUuid)(sessions.lottery.state.prizeUuid);if(item?.documentName!=='Item'||!Number.isSafeInteger(item.system?.quantity)||item.system.quantity<1)throw new Error('The prize item is missing or out of stock.');}
    const previous=sessions[scope].state,result=await sessions[scope].handle(data,user);
    await settleOutcome(scope);if(data.action!=='read')tavernUIs[scope].draw();
    if(scope==='lottery'&&result?.phase==='finished'&&previous?.phase!=='finished'&&!hiddenPreparing.lottery)try{await deliverPrize(result,game.user);}catch(e){ui.notifications.warn(tavernError(e.message));}
    return result;
  }
  if(data.game==='farkle'){
    const result=await farkleSession.handle(data,user);await settleOutcome(scope);if(data.action!=='read')farkleUI.draw();return result;
  }
  if(data.game!==undefined&&data.game!=='schocken')throw new Error('Unknown game.');
  if(data.action==="read") return view(state,user.id,user.isGM);
  if(!['join','leave'].includes(data.action)&&!(data.action==='abort'&&user.isGM)&&data.revision!== (state?.revision ?? -1)) throw new Error(t("Spielstand wurde inzwischen geändert. Bitte erneut versuchen."));
  let next;
  if(data.action==="start"||data.action==="lobby") {
    if(!user.isGM) throw new Error(t("Nur GM kann starten."));
    const ids=data.action==='lobby'?[]:data.args?.ids;
    if(!Array.isArray(ids)||ids.some(id=>!game.users.get(id)?.active)) throw new Error(t("Nur verbundene Spieler auswählen."));
    const npcNames=data.args?.npcs??[];
    if(!Array.isArray(npcNames)||npcNames.length>20||npcNames.some(n=>typeof n!=='string'||!n.trim()||n.length>60))throw new Error(t("NPC-Namen müssen 1–60 Zeichen haben (maximal 20 Teilnehmer insgesamt)."));
    const npcs=Object.fromEntries(npcNames.map(n=>[`npc-${crypto.randomUUID()}`,n.trim()]));
    next=create([...ids,...Object.keys(npcs)],{npcs,labels:data.args?.labels,loading:data.args?.loading,allowReturn:data.args?.allowReturn,hiddenThird:data.args?.hiddenThird,lobby:data.action==='lobby'});next.gameId=crypto.randomUUID();next.revision=(state?.revision??0)+1;
  } else if(data.action==="undo") {
    if(!user.isGM || !history.length || state?.phase==='aborted') throw new Error(t("Kein Schritt zum Zurücknehmen."));
    next=structuredClone(history.at(-1));next.revision=state.revision+1;next.paused=state.paused;next.labels=structuredClone(state.labels);next.npcManual=structuredClone(state.npcManual??{});
  } else next=act(state,user.id,data.action,data.args,randomDie,user.isGM);
  // Persist first; a failed save must never advance the in-memory table.
  await save(next);
  if(data.action==="undo")history.pop();else if(state&&!['pause','labels','npcControl','abort'].includes(data.action)) {history.push(structuredClone(state));if(history.length>30)history.shift();}
  const previous=state;state=next;await announceFinished(previous,next);await settleOutcome('schocken');return view(state,user.id,user.isGM);
}
async function request(action,args={}) {
  if(busy){if(action!=='read')ui.notifications.info(t('Bitte die laufende Aktion kurz abwarten.'));return;}
  busy=true;
  try {
    const data={action,args,revision:state?.revision??-1,user:game.user.id,token:capability};
    const gm=primary();if(!gm)throw new Error(t("Für Schocken muss ein GM verbunden sein."));
    await ensureCapability(gm);data.token=capability;
    const previous=state?.revision,previousAnimation=schockenLock()?.id;
    const result=authority()?await enqueue(()=>command(data,true)):await gm.query(QUERY,data,{timeout:8000});
    if(!authority())state=result;
    if(action!=="read"){if(action!=='roll'&&result?.schockenAnimation)schockenPhases.set(result.schockenAnimation.id,'display');void pollDice();}
    if(!result?.schockenAnimation&&(state?.revision??-1)>=(schockenVisual?.state?.revision??-1)){schockenVisual={state:schockenDiceState(state,game.user),animation:null};if(game.settings.get(ID,'diceSoNiceBeta'))void syncSchocken(schockenVisual.state);}
    if(action!=="read"||previous!==state?.revision||previousAnimation||result?.schockenAnimation)draw();
  }catch(e){ui.notifications.warn(`Schocken: ${t(e.message)}`);}finally{busy=false;}
}
function button(parent,text,fn,disabled=false) {const b=el("button",text);b.type="button";b.disabled=disabled;b.addEventListener("click",fn);parent.append(b);return b;}
async function requestTavern(scope,action,args={}){
  if(tavernBusy[scope])return;tavernBusy[scope]=true;
  try{
    const gm=primary();if(!gm)throw new Error('A GM must be connected.');
    await ensureCapability(gm);
    const old=authority()?sessions[scope].state:clients[scope],previousAnimation=clients[scope]?.animation?.id,data={game:scope,action,args,user:game.user.id,token:capability,revision:old?.revision??-1};
    const result=authority()?await enqueue(()=>command(data,true)):await gm.query(QUERY,data,{timeout:15000});
    if(action!=='read')void pollDice();if(!authority())clients[scope]=result;if(scope==='liars'&&!liarsLock(result)&&game.settings.get(ID,'diceSoNiceBeta')){const visual=liarsDiceState(result,game.user);liarsPersistent.latest=visual;void syncLiars(visual);}if(action!=='read'||old?.revision!==result?.revision||scope==='liars'&&(result?.liarsAnimation||old?.liarsAnimation)||HIDDEN_GAMES.includes(scope)&&(result?.hiddenAnimation||old?.hiddenAnimation)||HELD_GAMES.includes(scope)&&(result?.animation||previousAnimation))tavernUIs[scope].draw();
  }catch(e){ui.notifications.warn(`${gameTitle(scope)}: ${tavernError(e.message)}`);}finally{tavernBusy[scope]=false;}
}
async function requestFinance(scope,action,args={}){
  const gm=primary();if(!gm)throw new Error(tavernError('A GM must be connected.'));
  await ensureCapability(gm);
  const data={game:scope,action,args,revision:args.revision,user:game.user.id,token:capability};
  try{return authority()?await enqueue(()=>command(data,true)):await gm.query(QUERY,data,{timeout:30000});}catch(e){throw new Error(tavernError(e.message));}
}
async function requestFarkle(action,args={}){
  if(farkleBusy)return;farkleBusy=true;
  try{
    const gm=primary();if(!gm)throw new Error(f('Für Farkle muss ein GM verbunden sein.','A GM must be connected to play Farkle.'));
    await ensureCapability(gm);
    const previous=(authority()?farkleSession.state:farkleClient)?.revision,previousAnimation=farkleClient?.animation?.id;
    const data={game:'farkle',action,args,user:game.user.id,token:capability,revision:previous??-1};
    const result=authority()?await enqueue(()=>command(data,true)):await gm.query(QUERY,data,{timeout:8000});
    if(action!=='read')void pollDice();if(!authority())farkleClient=result;if(action!=='read'||previous!==result?.revision||result?.animation||previousAnimation)farkleUI.draw();if(!result?.animation&&game.settings.get(ID,'diceSoNiceBeta'))void farklePersistent.sync(result).catch(()=>{});
  }catch(error){ui.notifications.warn(`Farkle: ${farkleError(t(error.message))}`);}finally{farkleBusy=false;}
}
function dice(parent,values,held=[],interactive=false) {
  const row=el("div",undefined,"schocken-dice");
  values.forEach((n,i)=>{const b=button(row,n===null?"?":String(n),()=>request(held[i]?"return":"hold",{index:i}),!interactive||(held[i]&&!state?.rules?.allowReturn));b.title=t(held[i]?(state?.rules?.allowReturn?"Wieder hereinnehmen":"Herausgelegt"):"Zum Herauslegen anklicken");if(held[i])b.classList.add("held");});parent.append(row);
}
const schockenDrawKeys=new WeakMap();
function drawSchockenSurface(root,key,render){
  if(!root||schockenDrawKeys.get(root)===key)return;
  withScroll(root,render);schockenDrawKeys.set(root,key);
}
function schockenPresence(){return game.users.map(u=>[u.id,u.name,u.active,u.isGM]);}
function drawModeration(){return drawSchockenSurface(moderation,JSON.stringify([state,schockenPresence(),primary()?.id,game.settings.get(ID,'showLauncher')]),drawModerationContent);}
function drawModerationContent() {
  if(!moderation||!game.user.isGM)return;
  const drafts=new Map([...moderation.querySelectorAll('[data-draft]')].map(n=>[n.dataset.draft,{value:n.value,checked:n.checked}]));
  const openDetails=new Set([...moderation.querySelectorAll('details[data-section][open]')].map(n=>n.dataset.section));
  const focused=document.activeElement?.dataset?.draft;
  const existingSetup=moderation.querySelector('details[data-section="setup"]');
  const active=document.activeElement,selection=active?.dataset?.draft?{start:active.selectionStart,end:active.selectionEnd,direction:active.selectionDirection}:null;
  moderation.replaceChildren();
  const content=el('div',undefined,'schocken-content');moderation.append(content);
  content.append(el('p',`Schocken ${game.modules.get(ID)?.version??''} · ${checkFoundry(game.release,game.version).message}`,'schocken-help'));
  button(content,'Spieltisch öffnen',()=>open(false));button(content,'Anleitung',openGuide);button(content,f('Einsätze & Charaktere','Stakes & characters'),()=>moneyUI.open('schocken'),!state);button(content,f('Wetten','Bets'),()=>outcomeUI.open('schocken'));
  const showLabel=el('label',undefined,'schocken-choice'),show=el('input');show.type='checkbox';show.checked=game.settings.get(ID,'showLauncher');show.addEventListener('change',async()=>{try{await game.settings.set(ID,'showLauncher',show.checked);}catch(e){ui.notifications.warn(t(e.message));drawModeration();}});showLabel.append(show,document.createTextNode(t('Unteren Schocken-Button für alle einblenden')));content.append(showLabel);
  if(game.user.isGM) {
    const setup=el("details");setup.dataset.section='setup';setup.append(el("summary","Spieler, NPCs & neues Spiel"));
    setup.append(el('p','Menschen treten freiwillig über den Spieltisch bei. Der SL kann ebenfalls beitreten. NPCs hier vor dem Öffnen der Lobby eintragen.'));
    const npcLabel=el('label','NPCs – ein Name pro Zeile'),npcInput=el('textarea');npcInput.rows=3;npcInput.dataset.draft='npcs';npcInput.value=Object.values(state?.npcs??{}).join('\n');npcLabel.append(npcInput);setup.append(npcLabel);
    const loadLabel=el('label',undefined,'schocken-choice'),loadInput=el('input');loadInput.type='checkbox';loadInput.dataset.draft='loading';loadInput.checked=state?.loadAtStart??true;loadLabel.append(loadInput,document.createTextNode(t('Mit Laden beginnen (jede Hälfte / Finale)')));setup.append(loadLabel);
    const returnLabel=el('label',undefined,'schocken-choice'),returnInput=el('input');returnInput.type='checkbox';returnInput.dataset.draft='allowReturn';returnInput.checked=state?.rules?.allowReturn??false;returnLabel.append(returnInput,document.createTextNode(t('Würfel wieder hereinnehmen erlauben')));setup.append(returnLabel);
    const hiddenLabel=el('label',undefined,'schocken-choice'),hiddenInput=el('input');hiddenInput.type='checkbox';hiddenInput.dataset.draft='hiddenThird';hiddenInput.checked=state?.rules?.hiddenThird??true;hiddenLabel.append(hiddenInput,document.createTextNode(t('3. Wurf standardmäßig verdeckt')));setup.append(hiddenLabel);
    const naming=el('details');naming.dataset.section='labels';naming.append(el('summary','Wurfarten umbenennen'));
    const readLabels=()=>Object.fromEntries([...naming.querySelectorAll('input')].map(n=>[n.dataset.kind,n.value]));
    for(const [kind,title] of Object.entries(DEFAULT_LABELS)){const label=el('label',title,'schocken-label'),input=el('input');input.type='text';input.maxLength=60;input.dataset.kind=kind;input.dataset.draft=`label-${kind}`;input.value=labelName(state?.labels?.[kind]??title);label.append(input);naming.append(label);}
    button(naming,'Standardnamen wiederherstellen',()=>{
      for(const input of naming.querySelectorAll('input'))input.value=labelName(DEFAULT_LABELS[input.dataset.kind]);
      if(state)void request('labels',{labels:{...DEFAULT_LABELS}});
    });
    for(const [set,title] of [['standard','Standardset'],['tavern','Tavernenset']])button(naming,title,()=>{for(const input of naming.querySelectorAll('input'))input.value=labelName(NAME_SETS[set][input.dataset.kind]);if(state)void request('labels',{labels:NAME_SETS[set]});});
    button(naming,'Wurfnamen übernehmen',()=>{if(state)void request('labels',{labels:readLabels()});});setup.append(naming);
    button(setup,"Lobby öffnen",()=>{if((state||savedExists) && !confirm(t("Gespeichertes Schockenspiel durch ein neues ersetzen?")))return;request("lobby",{npcs:npcInput.value.split('\n').map(n=>n.trim()).filter(Boolean),labels:readLabels(),loading:loadInput.checked,allowReturn:returnInput.checked,hiddenThird:hiddenInput.checked});});
    button(setup,"Verbindungen erneuern",async()=>{await Promise.allSettled(game.users.map(grant));ui.notifications.info(t("Schocken-Verbindungen erneuert."));},!authority());content.append(existingSetup??setup);
  }
  for(const n of moderation.querySelectorAll('details[data-section]'))n.open=openDetails.has(n.dataset.section);
  for(const n of moderation.querySelectorAll('[data-draft]')){const old=drafts.get(n.dataset.draft);if(old){n.value=old.value;n.checked=old.checked;}if(n.dataset.draft===focused){n.focus({preventScroll:true});if(selection&&typeof selection.start==='number')n.setSelectionRange(selection.start,selection.end,selection.direction);}}

  if(!state)return;
  const s=state;
  const tools=el('div',undefined,'schocken-actions');if(!['aborted','finished'].includes(s.phase)){if(s.phase==='lobby')button(tools,'Spiel starten',()=>request('begin'),s.paused||s.players.length<2);button(tools,s.paused?'Fortsetzen':'Pause',()=>request('pause'));button(tools,'Rückgängig',()=>request('undo'));button(tools,'Spiel beenden',()=>{if(confirm(t('Spiel für alle Teilnehmer einschließlich der aktiven Runde beenden?')))void request('abort');});}content.append(tools);
  if(Object.keys(s.npcs??{}).length) {
    content.append(el('h3','NPC-Steuerung'));
    for(const id of Object.keys(s.npcs)) {
      const row=el('div',undefined,'schocken-npc');row.append(el('span',`${name(id)} · ${t(s.npcManual?.[id]?'GM steuert':'Automatisch')}`));
      button(row,s.npcManual?.[id]?'Automatik einschalten':'Selbst steuern',()=>request('npcControl',{id,manual:!s.npcManual?.[id]}),['aborted','finished'].includes(s.phase));content.append(row);
    }
  }
  const log=el("details");log.append(el("summary","Moderationsprotokoll"));for(const line of s.log) {let text=typeof line==='string'?line:tr`${name(line.id)} erhält ${line.amount} Deckel (${valueName(line.value,translatedNames(s.labels))}).`;for(const id of s.players)text=text.replaceAll(id,name(id));log.append(el("p",logText(text)));}content.append(log);
}
function createWindow(kind) {
  const root=el('section',undefined,'taverngames-surface');
  const app=createNativeWindow(foundry,kind,root,()=>{apps.delete(kind);if(kind==='table')panel=null;else if(kind==='moderation')moderation=null;else guide=null;});apps.set(kind,app);return root;
}
function draw() {
  drawModeration();
  const animation=schockenLock();
  return drawSchockenSurface(panel,JSON.stringify([view(state,game.user.id,game.user.isGM),schockenPresence(),primary()?.id,animation?.id??null,animation?schockenPhases.get(animation.id)??'rolling':null]),drawTableContent);
}
function drawTableContent() {
  if(!panel)return;
  panel.replaceChildren();
  const content=el('div',undefined,'schocken-content');panel.append(content);
  button(content,f('Wetten','Bets'),()=>outcomeUI.open('schocken'));
  if(game.user.isGM)button(content,'Moderation öffnen',openModeration);
  if(!primary())content.append(el('p','Spiel pausiert: kein GM verbunden. Der gespeicherte Stand bleibt erhalten.'));
  if(!state){content.append(el("p","Der SL öffnet eine Lobby. Danach kannst du freiwillig beitreten."));return;}
  const s=view(state,game.user.id,game.user.isGM),current=s.order[s.turn],mine=current===game.user.id,can=mine||game.user.isGM;
  content.append(el("p",tr`${s.half===3?t("Finale"):tr`Hälfte ${s.half}`} · Durchgang ${s.round} · Mitte: ${s.pot} Deckel`,"schocken-meta"));
  if(s.paused)content.append(el("p","⏸ Spiel pausiert"));
  for(const id of s.players) {const r=el("div",`${id===current?"▶ ":""}${name(id)}${s.npcs?.[id]?" (NPC)":game.users.get(id)?.active?"":" (offline)"} · ${s.lids[id]}${t(" Deckel")}${s.losers.includes(id)?t(" · Hälfte verloren"):""}`,"schocken-player");content.append(r);}
  if(s.phase==='lobby') {
    content.append(el('h3','Lobby · Schocken'));
    button(content,s.players.includes(game.user.id)?'Lobby verlassen':'Beitreten',()=>request(s.players.includes(game.user.id)?'leave':'join'));
    if(game.user.isGM)button(content,'Spiel starten',()=>request('begin'),s.players.length<2);
    content.append(el('p',tr`Regeln: Laden ${t(s.loadAtStart?'an':'aus')} · Wiederhereinnehmen ${t(s.rules.allowReturn?'an':'aus')} · Dritter Wurf verdeckt ${t(s.rules.hiddenThird?'an':'aus')}`));
  } else if(s.phase==='aborted')content.append(el('h3','Spiel durch den GM beendet'));
  else if(s.phase==="finished")content.append(el("h3",tr`Spiel beendet: ${name(s.loser)} verliert.`));
  else if(s.phase==="half") {content.append(el("h3","Hälfte beendet."));if(game.user.isGM||s.players.includes(game.user.id))button(content,s.half===1?"Zweite Hälfte starten":"Finale starten",()=>request("nextHalf"));}
  else {
    content.append(el("h3",tr`${name(current)} ist am Zug`));
    content.append(el("p",tr`${s.loading?t("Laden · "):""}${s.cup?.rolls??0} / ${s.limit} Würfe${s.npcManual?.[current]?t(" · NPC wartet auf GM"):""}${game.user.isGM&&!mine?t(" · GM übernimmt bei Bedarf"):""}`));
    const animation=schockenLock(),waiting=!!animation,rolling=waiting&&!['done','display'].includes(schockenPhases.get(animation.id));
    if(waiting)content.append(el('p',f(rolling?'Die 3D-Würfel rollen …':'Noch auf die Würfelanimation der Mitspieler warten …',rolling?'The 3D dice are rolling …':'Waiting for the other players’ dice animation …'),'schocken-help'));
    if(s.cup)dice(content,rolling?s.cup.dice.map((v,i)=>s.cup.held[i]?v:null):s.cup.dice,s.cup.held,can&&!s.paused&&!waiting&&s.cup.rolls<s.limit);
    if(can&&!s.paused) {
      const controls=el("div",undefined,"schocken-actions");
      button(controls,"Würfeln",()=>request("roll"),waiting||s.cup?.rolls>=s.limit);
      if(s.cup?.concealed)button(controls,'Aufdecken',()=>request('reveal',{current:game.user.isGM&&!mine}),waiting);
      button(controls,"Sechsen drehen",()=>request("six"),waiting||!canTurnSix(s));
      button(controls,"Offen beenden",()=>request("finish"),waiting||!s.cup||s.cup.mustRoll||s.cup.concealed);
      button(controls,"Verdeckt beenden",()=>request("finish",{hidden:true}),waiting||!s.cup||s.cup.mustRoll);content.append(controls);
    }
    if(s.pot===0&&s.players.includes(game.user.id)&&!s.order.includes(game.user.id)&&(s.half!==3||s.losers.includes(game.user.id)))button(content,"Einkaufen / wieder mitspielen",()=>request("buy"));
  }
  if(s.phase==='playing'&&s.results.some(r=>r.id===game.user.id&&r.hidden))button(content,'Eigenen Wurf aufdecken',()=>request('reveal'),!!schockenLock());
  for(const [title,results] of [["Dieser Durchgang",s.results],["Letzter abgeschlossener Durchgang",s.lastResults]]) {
    if(!results?.length)continue;const section=el("details");section.open=true;section.append(el("summary",title));
    for(const r of results) {section.append(el("p",tr`${name(r.id)} · ${r.rolls} Wurf/Würfe · ${r.value?valueName(r.value,translatedNames(s.labels)):t("verdeckt")}`));dice(section,r.dice,r.held);}content.append(section);
  }
  content.append(el("p",tr`Herausgelegte Würfel ${t(s.rules?.allowReturn?"dürfen vor weiteren Würfen zurückgenommen werden":"bleiben liegen")}. ${labelName(s.labels.straight)} und ${labelName(s.labels.triple)} zählen nur auf Hand. ${labelName(s.labels.schock2)} liegt unter ${labelName(s.labels.triple)}.`,"schocken-help"));
}
function open(withModeration=true) {
  const compatibility=checkFoundry(game.release,game.version);if(!compatibility.supported){ui.notifications.warn(compatibility.message);return;}
  if(!panel)panel=createWindow('table');
  if(game.user.isGM&&withModeration&&!moderation)moderation=createWindow('moderation');
  draw();void request('read');
  for(const kind of ['table','moderation'])if(apps.get(kind)?.rendered)apps.get(kind).bringToFront();
}
function openModeration() {
  if(!game.user.isGM)return;
  const compatibility=checkFoundry(game.release,game.version);if(!compatibility.supported){ui.notifications.warn(compatibility.message);return;}
  if(!moderation)moderation=createWindow('moderation');drawModeration();void request('read');if(apps.get('moderation')?.rendered)apps.get('moderation').bringToFront();
}
function refreshLauncher() {
  launcher?.remove();launcher=null;
  const showSchocken=game.settings.get(ID,'showLauncher'),showFarkle=game.settings.get(ID,'showFarkleLauncher')===true;
  const extra=NEW_GAMES.filter(scope=>gameEnabled(scope)&&game.settings.get(ID,`show${scope}Launcher`)===true);
  if(!showSchocken&&!showFarkle&&!extra.length)return;
  launcher=el('div',undefined,'taverngames-launchers');
  if(showSchocken){const start=el('button','⚄ Schocken','schocken-launcher');start.addEventListener('click',()=>open());launcher.append(start);}
  if(showFarkle){const start=el('button','⚄ Farkle','farkle-launcher');start.addEventListener('click',()=>farkleUI.open());launcher.append(start);}
  for(const scope of extra){const start=el('button',`⚄ ${gameTitle(scope)}`,'farkle-launcher');start.dataset.tavern=scope;start.addEventListener('click',()=>tavernUIs[scope].open());launcher.append(start);}
  document.body.append(launcher);
}
function openGuide() {
  if(!game.user.isGM)return;
  if(!guide)guide=createWindow('guide');guide.replaceChildren();
  const content=el('div',undefined,'schocken-content');content.innerHTML=guideHTML(state);guide.append(content);
  button(content,'Anleitung in den Chat posten',async()=>{if(!game.user.isGM)return;try{await ChatMessage.create({content:guideHTML(state)});}catch(e){ui.notifications.warn(t(e.message));}});
  apps.get('guide')?.bringToFront();
}
Hooks.once("init",()=>{
  game.settings.register(ID,'favorites',{scope:'client',config:false,restricted:true,type:Array,default:[],onChange:()=>{ui.taverngames?.render?.({force:true});}});
  game.settings.register(ID,"showLauncher",{name:t("Taverngames: unteren Startbutton einblenden"),hint:t("Für alle Teilnehmer. Auch über den eigenen Taverngames-Reiter erreichbar."),scope:"world",config:false,restricted:true,type:Boolean,default:true,onChange:()=>{refreshLauncher();drawModeration();}});
  game.settings.register(ID,"language",{name:t("Taverngames: Sprache / Language"),hint:t("Sprache für Spieltisch, Moderation und Chat. Gilt für die gesamte Welt."),scope:"world",config:true,restricted:true,type:String,choices:{en:"English",de:"Deutsch"},default:"en",requiresReload:true});
  game.settings.register(ID,"state",{scope:"world",config:false,restricted:true,type:Object,default:null});
  game.settings.register(ID,'farkleState',{scope:'world',config:false,restricted:true,type:Object,default:null});
  game.settings.register(ID,'showFarkleLauncher',{scope:'world',config:false,restricted:true,type:Boolean,default:false,onChange:()=>{refreshLauncher();farkleUI.drawModeration();}});
  game.settings.register(ID,'allowFarkleBestSelection',{scope:'world',config:false,restricted:true,type:Boolean,default:false,onChange:()=>farkleUI.draw()});
  for(const scope of NEW_GAMES){game.settings.register(ID,`${scope}State`,{scope:'world',config:false,restricted:true,type:Object,default:null});game.settings.register(ID,`show${scope}Launcher`,{scope:'world',config:false,restricted:true,type:Boolean,default:false,onChange:()=>{refreshLauncher();tavernUIs[scope].drawModeration();}});}
  for(const setting of ['bettingState','prizeState','outcomeState'])game.settings.register(ID,setting,{scope:'world',config:false,restricted:true,type:Object,default:null});
  for(const [setting,de,en] of [['managedBetting','Verwaltetes Setzen','Managed betting'],['allowElectrum','Elektrum verwenden','Use electrum']])game.settings.register(ID,setting,{name:`Taverngames: ${f(de,en)}`,scope:'world',config:true,restricted:true,type:Boolean,default:false,onChange:()=>{moneyUI.draw();for(const panel of Object.values(tavernUIs))panel.drawModeration();}});
  game.settings.register(ID,'betaTest',{name:f('Taverngames: Beta-Test','Taverngames: Beta testing'),hint:f('Künftige Testspiele freischalten. Alle neun vorhandenen Spiele sind stabil.','Enable future test games. All nine existing games are stable.'),scope:'world',config:true,restricted:true,type:Boolean,default:false,onChange:()=>{refreshLauncher();sessions.chohan.updateNpcWait();if(!gameEnabled('chohan')){clients.chohan=null;void tavernUIs.chohan.close();}ui.taverngames?.render?.({force:true});}});
  game.settings.register(ID,'diceSoNiceBeta',{name:f('Taverngames: 3D-Würfel mit Dice So Nice','Taverngames: 3D dice with Dice So Nice'),hint:f('Optionale 3D-Wurfanimationen und liegende Spielwürfel. Dice So Nice muss installiert und aktiv sein. Die Auswahl erfolgt im Spielfenster.','Optional 3D roll animations and resting game dice. Dice So Nice must be installed and active. Select dice in the game window.'),scope:'world',config:true,restricted:true,type:Boolean,default:false,onChange:()=>{diceEvents.clear();liarsGate.clear();liarsLatest=null;liarsPersistent.latest={sourcePhase:'aborted'};void liarsPersistent.clear();tavernUIs.liars.draw();for(const scope of HIDDEN_GAMES){hiddenGates[scope].clear();delete hiddenLatest[scope];void hiddenRenderers[scope].clear();tavernUIs[scope].draw();}schockenGate.clear();schockenVisual=null;schockenLatest=null;void schockenPersistent.clear();draw();diceAnimator.warned=false;farkleGate.clear();void farklePersistent.clear();farkleUI.draw();for(const scope of HELD_GAMES){heldGates[scope].clear();void heldRenderers[scope].clear();tavernUIs[scope].draw();}}});
  if(game.settings.registerMenu)game.settings.registerMenu(ID,'diceDiagnostics',{name:f('Taverngames: 3D-Würfel prüfen','Taverngames: check3D dice'),label:f('Test & Diagnose öffnen','Open test & diagnostics'),hint:f('Lokaler3D-Test und Diagnose ohne geheime Würfelwerte.','Local3D test and diagnostics without secret dice values.'),icon:'fas fa-dice',restricted:true,type:diceMenu(foundry,{test:()=>diceAnimator.play({actor:game.user.id,dice:[{sides:6,value:3},{sides:6,value:5}]},{test:true}),diagnostics:async()=>({codeVersion:'2.0.0',moduleVersion:game.modules.get(ID)?.version??game.modules.get(ID)?.manifest?.version,dsnVersion:game.modules.get('dice-so-nice')?.version,dsnActive:game.modules.get('dice-so-nice')?.active===true,animationEnabled:game.settings.get(ID,'diceSoNiceBeta')===true,local:{...structuredClone(diceAnimator.stats),presentation:dicePresentationDiagnostics(game),restingDice:{liars:liarsPersistent.meshes.size,schocken:schockenPersistent.meshes.size,farkle:farklePersistent.meshes.size,kniffel:heldRenderers.kniffel.meshes.size,ship:heldRenderers.ship.meshes.size,pig:heldRenderers.pig.meshes.size,hoard:heldRenderers.hoard.meshes.size,lottery:hiddenRenderers.lottery.meshes.size,chohan:hiddenRenderers.chohan.meshes.size}},authority:await requestFinance('schocken','diceDiagnostics')})})});
  if(!registerSidebar(CONFIG,globalThis.foundry,game,{open:()=>open(),guide:openGuide,farkle:()=>farkleUI.open(),farkleGuide:()=>farkleUI.guide(),tavern:scope=>tavernUIs[scope]?.open(),tavernGuide:scope=>tavernUIs[scope]?.guide()}))ui.notifications.warn(t('Taverngames: native Sidebar-Schnittstelle fehlt. Einstieg über den unteren Button bleibt verfügbar.'));
  CONFIG.queries[GRANT]=({token})=>{if(typeof token!=="string"||token.length>100)throw new Error(t("Ungültige Verbindung."));capability=token;return true;};
  CONFIG.queries[QUERY]=data=>enqueue(()=>command(data));
});
Hooks.once("ready",async()=>{
  const compatibility=checkFoundry(game.release,game.version);
  if(game.modules.get('schocken')?.active){ui.notifications.warn(t('Bitte zuerst das alte Modul Schocken deaktivieren. Taverngames startet nicht parallel.'));return;}
  if(!globalThis.foundry?.applications?.api?.ApplicationV2){ui.notifications.warn(t('Taverngames: Die native ApplicationV2-Schnittstelle fehlt in dieser Foundry-Version.'));return;}
  if(!compatibility.target)ui.notifications.warn(compatibility.message);
  wasAuthority=authority();lastGM=primary()?.id;await initializeAuthority();
  game.modules.get(ID).api={open,openModeration,openGuide,openFarkle:()=>farkleUI.open(),openGame:scope=>tavernUIs[scope]?.open(),openBets:scope=>outcomeUI.open(scope)};
  refreshLauncher();

  setInterval(()=>void pollDice(),750);
  // Only the open, active Farkle table needs fast animation completion updates.
  setInterval(()=>{if(tavernUIs.liars.isOpen&&['rolling','bidding','reveal'].includes((authority()?sessions.liars.state:clients.liars)?.phase)||(panel||moderation)&&state?.phase==='playing'||farkleUI.isOpen&&(authority()?farkleSession.state:farkleClient)?.phase==='playing'||tavernUIs.pig.isOpen&&(authority()?sessions.pig.state:clients.pig)?.phase==='playing'||tavernUIs.hoard.isOpen&&['playing','allocate','contest'].includes((authority()?sessions.hoard.state:clients.hoard)?.phase))void pollDice();},150);
  setInterval(()=>{
    if(lastGM!==primary()?.id){lastGM=primary()?.id;capability=null;}
    if(wasAuthority!==authority()) {wasAuthority=authority();initialized=false;capability=null;void enqueue(initializeAuthority);}
    if((panel||moderation)&&!busy&&primary())void request("read");
    if(outcomeUI.root&&!outcomeUI.busy&&primary()&&gameEnabled(outcomeUI.scope))void outcomeUI.send('outcomeRead');
    if(farkleUI.isOpen&&!farkleBusy&&primary())void requestFarkle('read');
    if(primary())for(const scope of NEW_GAMES)if(gameEnabled(scope)&&tavernUIs[scope].isOpen&&!tavernBusy[scope])void requestTavern(scope,'read');
  },2500);
  setInterval(()=>{
    if(!authority()||!initialized)return;
    void enqueue(async()=>{
      if(!authority())return;
      if(game.settings.get(ID,'diceSoNiceBeta')&&schockenGate.active(state))return;
      const move=state&&npcAction(state);if(!move)return;
      await diceAction('schocken',move.id,move.action,async()=>{const next=act(state,move.id,move.action,move.args,randomDie);
      await save(next);history.push(structuredClone(state));if(history.length>30)history.shift();const previous=state;state=next;await announceFinished(previous,next);await settleOutcome('schocken');if(panel||moderation)draw();});
    }).catch(e=>ui.notifications.warn(`Schocken-NPC: ${t(e.message)}`));
  },1400);
  setInterval(()=>{
    if(!authority()||!initialized)return;
    void enqueue(async()=>{if(!authority()||(game.settings.get(ID,'diceSoNiceBeta')&&farkleGate.active(farkleSession.state)))return;const move=farkleSession.state&&farkleNpcAction(farkleSession.state);await diceAction('farkle',move?.id,move?.action,async()=>{if(await farkleSession.npcStep()){await settleOutcome('farkle');farkleUI.draw();}});}).catch(error=>ui.notifications.warn(`Farkle-NPC: ${farkleError(error.message)}`));
  },1400);
  setInterval(()=>{
    if(!authority()||!initialized)return;
    void enqueue(async()=>{if(!authority())return;for(const scope of NEW_GAMES){if(scope==='liars'&&game.settings.get(ID,'diceSoNiceBeta')&&liarsGate.active(sessions.liars.state))continue;if(HELD_GAMES.includes(scope)&&game.settings.get(ID,'diceSoNiceBeta')&&heldGates[scope].active(sessions[scope].state))continue;const old=sessions[scope].state,move=old&&scope!=='chohan'?tavernNpcAction(old):null;await diceAction(scope,move?.id,move?.action,async()=>{if(await sessions[scope].npcStep()){await settleOutcome(scope);tavernUIs[scope].draw();}});}}).catch(e=>ui.notifications.warn(tavernError(e.message)));
  },1400);
});
Hooks.on("userConnected",(user,connected)=>{if(connected)void grant(user);if(panel||moderation)draw();});

