import {withScroll} from './scroll-state.mjs';
// Polling reads may be skipped, but deliberate clicks must not disappear.
export class InteractionQueue{
 constructor(){this.tail=Promise.resolve();this.pending=0;this.running=false;}
 run(action,fn){
  if(action==='read'&&(this.running||this.pending))return Promise.resolve();
  this.pending++;
  const task=this.tail.then(async()=>{this.pending--;this.running=true;try{return await fn();}finally{this.running=false;}});
  this.tail=task.catch(()=>{});return task;
 }
}
export const farkleInteractionKey=s=>s?JSON.stringify([s.gameId,s.phase,s.turnNumber,s.order?.[s.turn],s.cup?.rolls]):null;
// Keep a pressed button attached through pointerup and the browser's click event.
// Render the newest state afterwards; never replay a synthetic click.
export function keepTableClicks(panel,kind){
 const draw=panel.drawTable.bind(panel);let attached=null,locked=false,dirty=false,timer,controller;
 const release=()=>{clearTimeout(timer);timer=setTimeout(()=>{locked=false;controller?.abort();if(dirty){dirty=false;panel.drawTable();}},0);};
 panel.drawTable=(...args)=>{
  const root=panel.windows.get(kind)?.root;
  if(root!==attached){controller?.abort();clearTimeout(timer);locked=false;dirty=false;attached=root;
   root?.addEventListener('pointerdown',()=>{locked=true;clearTimeout(timer);controller?.abort();controller=new AbortController();for(const event of ['pointerup','pointercancel'])window.addEventListener(event,release,{once:true,capture:true,signal:controller.signal});window.addEventListener('blur',release,{once:true,signal:controller.signal});},{capture:true});
  }
  if(locked){dirty=true;return;}return draw(...args);
 };
}


export function gameInteractionKey(scope,s,userId){
 if(scope==='farkle')return farkleInteractionKey(s);
 if(!s)return null;
 const turn=s.order?.[s.turn];
 return JSON.stringify([s.gameId,s.phase,s.half,s.round,s.turnNumber??s.turn,turn,s.rollNumber??s.cup?.rolls,
  // Added attacks append stable slots; validate the chosen card/slot on the server.
  // Keep an intended defense usable until the bout or its defender changes.
  scope==='durak'?[s.round,s.attacker,s.defender]:scope==='maumau'?[s.turnSerial,s.drawnCard]:scope==='seventeen'?[s.bank?.length,s.hands?.[turn]?.length]:scope==='kings'?[s.stage,s.hands?.[turn]?.length,s.currentBet,s.street?.[turn]]:null,
  scope==='liars'?s.hands?.[userId]?.length:null]);
}
export function sameInteraction(action,key,current){
 if(key===current)return true;
 if(['pause','abort','npcControl','peek'].includes(action))try{return JSON.parse(key)?.[0]===JSON.parse(current)?.[0];}catch{}
 return false;
}
let eventContext=null;
const contexts=new WeakMap(),surfaces=new WeakMap();
export const inputContext=scope=>eventContext?.scope===scope?eventContext.key:null;
function stampControls(root,context){if(!context)return;
 if(['farkle','kniffel','schocken','poker'].includes(context.scope)){let invert=false;try{invert=globalThis.game?.settings?.get('taverngames','markedDiceAction')==='reroll';}catch{}for(const dice of root.querySelectorAll('.schocken-dice')){for(const button of dice.querySelectorAll('button')){if(button.disabled&&button.classList.contains('held')){button.classList.remove('tg-inverted-marker');continue;}const kept=button.classList.contains('held')||button.classList.contains('farkle-selected');button.dataset.tgMarked=String(invert?!kept:kept);button.classList.toggle('tg-inverted-marker',invert);if(invert)button.setAttribute('aria-pressed',String(!kept));}let hint=dice.querySelector('[data-marker-hint]');if(invert&&!hint){hint=document.createElement('small');hint.dataset.markerHint='';hint.textContent=globalThis.game?.settings?.get('taverngames','language')==='de'?'Markierte Würfel werden erneut gewürfelt.':'Marked dice will be rerolled.';dice.append(hint);}else if(!invert)hint?.remove();}}
for(const element of root.querySelectorAll('button,input,select,textarea'))contexts.set(element,context);}
// Retain the actual DOM until click/keyup has completed. Editing controls stay
// attached until focus leaves, preserving native select popups and input cursors.
export function renderSurface(root,draw,context){
 if(!root)return draw();
 let guard=surfaces.get(root);
 if(!guard){
  guard={pressed:false,latest:null,timer:null,controller:null};surfaces.set(root,guard);
  const editing=()=>{const el=root.ownerDocument.activeElement;return root.contains(el)&&(el?.tagName==='SELECT'||el?.tagName==='TEXTAREA'||el?.tagName==='INPUT'&&!['checkbox','radio','button','submit','range'].includes(el.type));};
  guard.run=task=>{if(guard.pressed||editing()){guard.latest=task;return false;}guard.latest=null;withScroll(root,()=>{task.draw();stampControls(root,task.context?.());});return true;};
  const flush=event=>{if(event?.type==='focusout'){setTimeout(()=>{if(!guard.pressed&&guard.latest)guard.run(guard.latest);},0);return;}clearTimeout(guard.timer);guard.timer=setTimeout(()=>{guard.pressed=false;guard.controller?.abort();if(guard.latest)guard.run(guard.latest);},0);};
  const press=event=>{clearTimeout(guard.timer);guard.pressed=true;guard.pointer=event?.type==='pointerdown';guard.controller?.abort();guard.controller=new AbortController();for(const event of ['pointerup','pointercancel','keyup'])window.addEventListener(event,flush,{capture:true,once:true,signal:guard.controller.signal});window.addEventListener('blur',flush,{once:true,signal:guard.controller.signal});};
  root.addEventListener('pointerdown',press,true);root.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')press();},true);root.addEventListener('focusout',flush,true);for(const event of ['pointermove','pointerenter'])root.addEventListener(event,e=>{if(guard.pressed&&guard.pointer&&e.buttons===0)flush(e);});
  for(const event of ['click','change'])root.addEventListener(event,e=>{const element=e.composedPath().find(el=>contexts.has(el));if(!element)return;const ticket={...contexts.get(element)};eventContext=ticket;queueMicrotask(()=>{if(eventContext===ticket)eventContext=null;});},true);
 }
 return guard.run({draw,context});
}
export function protectPanel(panel){
 for(const method of ['drawTable','drawModeration']){
  const draw=panel[method].bind(panel),kind=panel.scope==='farkle'?(method==='drawTable'?'farkle':'farkle-moderation'):(method==='drawTable'?'table':'moderation');
  panel[method]=(...args)=>renderSurface(panel.windows.get(kind)?.root,()=>draw(...args),()=>({scope:panel.scope,key:gameInteractionKey(panel.scope,panel.getState(),globalThis.game?.user?.id)}));
 }
}
export function protectUtility(panel){const draw=panel.draw.bind(panel);panel.draw=(...args)=>renderSurface(panel.root,()=>draw(...args));}
