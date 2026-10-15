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
import {NEW_GAMES,tavernNpcAction} from './tavern-engine.mjs';
import {farkleNpcAction} from './farkle-engine.mjs';
import {TavernSession} from './tavern-session.mjs';
import {KniffelUI} from './kniffel-ui.mjs';
import {TavernUI} from './tavern-ui.mjs';
import {BettingManager,COINS} from './wagers.mjs';
import {BettingUI} from './wagers-ui.mjs';
import {PrizeManager} from './prizes.mjs';
import {gameTitle,tavernError} from './tavern-text.mjs';
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
let capturedDice=null;
const randomSides=sides=>{const a=new Uint32Array(1),limit=Math.floor(4294967296/sides)*sides;do{crypto.getRandomValues(a);}while(a[0]>=limit);const value=a[0]%sides+1;capturedDice?.push({sides,value});return value;};
const randomDie=()=>randomSides(6);
const hasMessage=(flag,value)=>game.messages?.some(m=>(m.getFlag?.(ID,flag)??m.flags?.[ID]?.[flag])===value)??false;
let ledgerUnavailable=false;
const clients={},tavernBusy={};
const gameEnabled=scope=>true;
const diceEvents=new DiceEvents();
const diceAnimator=new DiceAnimator({game,enabled:()=>game.settings.get(ID,'diceSoNiceBeta')===true,warn:()=>ui.notifications.warn(f('Taverngames: Dice-So-Nice-Animation nicht verfügbar. Die normale Würfeldarstellung bleibt aktiv.','Taverngames: Dice So Nice animation unavailable. Standard dice display remains active.'))});
let dicePolling=false;
async function pollDice(){if(dicePolling||!primary()||game.settings.get(ID,'diceSoNiceBeta')!==true)return;dicePolling=true;try{diceAnimator.consume(await requestFinance('schocken','diceRead',{after:diceAnimator.cursor}));}catch{}finally{dicePolling=false;}}
async function diceAction(scope,actor,action,fn){const values=[];capturedDice=values;try{const result=await fn();if(game.settings.get(ID,'diceSoNiceBeta')===true){const current=scopeState(scope);if(['roll','draw','resolveGuess'].includes(action)){let privateTo=null;if(scope==='liars')privateTo=[actor,...(current?.npcs?.[actor]&&current?.npcManual?.[actor]?[game.user.id]:[])];if(scope==='schocken')privateTo=current?.cup?.concealed?[]:[actor];diceEvents.add(scope,actor,values,{privateTo});}if(scope==='liars'&&action==='challenge'&&current?.reveal)for(const [id,hand]of Object.entries(current.reveal.hands))diceEvents.add(scope,id,hand.map(value=>({sides:6,value})));if(scope==='schocken'&&action==='reveal'){const cup=current?.cup;const result=current?.results?.find(r=>r.id===actor);const dice=cup?.revealed?cup.dice:result&&!result.hidden?result.dice:[];diceEvents.add(scope,actor,(dice??[]).filter(Number.isInteger).map(value=>({sides:6,value})));}}return result;}finally{capturedDice=null;}}
const sessions=Object.fromEntries(NEW_GAMES.map(scope=>[scope,new (BETA_GAMES.includes(scope)?BetaGameSession:TavernSession)(scope,{enabled:()=>gameEnabled(scope),save:next=>save(next,`${scope}State`),random:randomSides,getName:id=>game.users.get(id)?.name??id,announce:data=>ChatMessage.create(data),hasAnnouncement:id=>hasMessage('gameId',id)})]));
const betting=new BettingManager({isAuthority:authority,save:next=>save(next,'bettingState'),enabled:()=>game.settings.get(ID,'managedBetting')===true,electrum:()=>game.settings.get(ID,'allowElectrum')===true,system:()=>game.system?.id,actor:id=>game.actors?.get(id),character:id=>game.users.get(id)?.character,announce:data=>ChatMessage.create(data),hasMessage:(tx,id)=>game.messages?.some(m=>(m.getFlag?.(ID,'betTx')??m.flags?.[ID]?.betTx)===tx&&(m.getFlag?.(ID,'betActor')??m.flags?.[ID]?.betActor)===id)??false});
const prizes=new PrizeManager({isAuthority:authority,save:next=>save(next,'prizeState'),system:()=>game.system?.id,actor:id=>game.actors?.get(id),item:uuid=>(globalThis.foundry?.utils?.fromUuid??globalThis.fromUuid)(uuid),announce:data=>ChatMessage.create(data),hasMessage:id=>hasMessage('prizeAward',id)});
const moneyUI=new BettingUI({request:requestFinance});
const outcomes=new OutcomeBets({isAuthority:authority,save:next=>save(next,'outcomeState'),user:id=>game.users.get(id),announce:data=>ChatMessage.create(data),hasAnnouncement:id=>hasMessage('outcomeBet',id)});
const outcomeUI=new OutcomeUI({request:requestFinance});
async function settleOutcome(scope){if(!ledgerUnavailable)await outcomes.observe(scope,scopeState(scope));}
const tavernUIs=Object.fromEntries(NEW_GAMES.map(scope=>[scope,new (BETA_GAMES.includes(scope)?BetaGameUI:scope==='kniffel'?KniffelUI:TavernUI)(scope,{request:(action,args)=>requestTavern(scope,action,args),getState:()=>authority()?(sessions[scope].project?sessions[scope].project(game.user):sessions[scope].state):clients[scope],openOutcome:scope=>outcomeUI.open(scope),openBetting:scope=>moneyUI.open(scope)})]));
const scopeState=scope=>scope==='schocken'?state:scope==='farkle'?farkleSession.state:sessions[scope]?.state;
async function deliverPrize(current,user){const id=current?.winners?.[0],actorId=betting.state.books[current?.gameId]?.mapping[id]??game.users.get(id)?.character?.id;await prizes.deliver(current,user,actorId);}
let farkleClient=null,farkleBusy=false;
const farkleSession=new FarkleSession({save:next=>save(next,'farkleState'),diceSource:randomDie,getName:id=>game.users.get(id)?.name??id,announce:data=>ChatMessage.create(data),hasAnnouncement:id=>game.messages?.some(message=>message.getFlag?.(ID,'gameId')===id)??false,allowBestSelection:()=>game.settings.get(ID,'allowFarkleBestSelection')===true});
const farkleUI=new FarkleUI({request:requestFarkle,getState:()=>authority()?farkleSession.state:farkleClient,openOutcome:scope=>outcomeUI.open(scope),openBetting:scope=>moneyUI.open(scope)});
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
async function command(data,local=false){const scope=data?.game??'schocken',before=scopeState(scope),user=local?game.user:game.users.get(data?.user),actor=scope==='liars'?(user?.isGM&&before?.npcs?.[data?.args?.id]?data.args.id:user?.id):(before?.order?.[before.turn]??data?.user);return diceAction(scope,actor,data?.action,()=>commandCore(data,local));}
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
  if(data.action==='diceRead'){const batch=diceEvents.read(user,Number.isSafeInteger(data.args?.after)?data.args.after:0);return game.settings.get(ID,'diceSoNiceBeta')===true?batch:{cursor:batch.cursor,events:[]};}
  const scope=data.game??'schocken';
  if(!['schocken','farkle',...NEW_GAMES].includes(scope))throw new Error('Unknown game.');
  if(!gameEnabled(scope)&&!(data.action==='abort'&&user.isGM))throw new Error('Beta testing is disabled.');
  if(data.action.startsWith('outcome')){if(ledgerUnavailable)throw new Error('Resume in the original GM browser before modifying wallets or items.');await settleOutcome(scope);return outcomes.handle(scope,scopeState(scope),data,user);}
  await settleOutcome(scope);outcomes.guard(scope,scopeState(scope),data.action);
  if(BETA_GAMES.includes(scope)&&data.action.startsWith('bet'))throw new Error('Automatic currency transactions are not available.');
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
    if(scope==='lottery'&&result?.phase==='finished'&&previous?.phase!=='finished')try{await deliverPrize(result,game.user);}catch(e){ui.notifications.warn(tavernError(e.message));}
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
    const previous=state?.revision;
    const result=authority()?await enqueue(()=>command(data,true)):await gm.query(QUERY,data,{timeout:8000});
    if(!authority())state=result;
    if(action!=="read"||previous!==state?.revision)draw();
  }catch(e){ui.notifications.warn(`Schocken: ${t(e.message)}`);}finally{busy=false;}
}
function button(parent,text,fn,disabled=false) {const b=el("button",text);b.type="button";b.disabled=disabled;b.addEventListener("click",fn);parent.append(b);return b;}
async function requestTavern(scope,action,args={}){
  if(tavernBusy[scope])return;tavernBusy[scope]=true;
  try{
    const gm=primary();if(!gm)throw new Error('A GM must be connected.');
    await ensureCapability(gm);
    const old=authority()?sessions[scope].state:clients[scope],data={game:scope,action,args,user:game.user.id,token:capability,revision:old?.revision??-1};
    const result=authority()?await enqueue(()=>command(data,true)):await gm.query(QUERY,data,{timeout:15000});
    if(!authority())clients[scope]=result;if(action!=='read'||old?.revision!==result?.revision)tavernUIs[scope].draw();
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
    const previous=(authority()?farkleSession.state:farkleClient)?.revision;
    const data={game:'farkle',action,args,user:game.user.id,token:capability,revision:previous??-1};
    const result=authority()?await enqueue(()=>command(data,true)):await gm.query(QUERY,data,{timeout:8000});
    if(!authority())farkleClient=result;if(action!=='read'||previous!==result?.revision)farkleUI.draw();
  }catch(error){ui.notifications.warn(`Farkle: ${farkleError(t(error.message))}`);}finally{farkleBusy=false;}
}
function dice(parent,values,held=[],interactive=false) {
  const row=el("div",undefined,"schocken-dice");
  values.forEach((n,i)=>{const b=button(row,n===null?"?":String(n),()=>request(held[i]?"return":"hold",{index:i}),!interactive||(held[i]&&!state?.rules?.allowReturn));b.title=t(held[i]?(state?.rules?.allowReturn?"Wieder hereinnehmen":"Herausgelegt"):"Zum Herauslegen anklicken");if(held[i])b.classList.add("held");});parent.append(row);
}
function drawModeration() {
  if(!moderation||!game.user.isGM)return;
  const drafts=new Map([...moderation.querySelectorAll('[data-draft]')].map(n=>[n.dataset.draft,{value:n.value,checked:n.checked}]));
  const openDetails=new Set([...moderation.querySelectorAll('details[data-section][open]')].map(n=>n.dataset.section));
  const focused=document.activeElement?.dataset?.draft;
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
    if(state)button(naming,'Wurfnamen übernehmen',()=>request('labels',{labels:readLabels()}));setup.append(naming);
    button(setup,"Lobby öffnen",()=>{if((state||savedExists) && !confirm(t("Gespeichertes Schockenspiel durch ein neues ersetzen?")))return;request("lobby",{npcs:npcInput.value.split('\n').map(n=>n.trim()).filter(Boolean),labels:readLabels(),loading:loadInput.checked,allowReturn:returnInput.checked,hiddenThird:hiddenInput.checked});});
    button(setup,"Verbindungen erneuern",async()=>{await Promise.allSettled(game.users.map(grant));ui.notifications.info(t("Schocken-Verbindungen erneuert."));},!authority());content.append(setup);
  }
  for(const n of moderation.querySelectorAll('[data-draft]')){const old=drafts.get(n.dataset.draft);if(old){n.value=old.value;n.checked=old.checked;}if(n.dataset.draft===focused)n.focus();}
  for(const n of moderation.querySelectorAll('details[data-section]'))n.open=openDetails.has(n.dataset.section);

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
    if(s.cup)dice(content,s.cup.dice,s.cup.held,can&&!s.paused&&s.cup.rolls<s.limit);
    if(can&&!s.paused) {
      const controls=el("div",undefined,"schocken-actions");
      button(controls,"Würfeln",()=>request("roll"),s.cup?.rolls>=s.limit);
      if(s.cup?.concealed)button(controls,'Aufdecken',()=>request('reveal',{current:game.user.isGM&&!mine}));
      button(controls,"Sechsen drehen",()=>request("six"),!canTurnSix(s));
      button(controls,"Offen beenden",()=>request("finish"),!s.cup||s.cup.mustRoll||s.cup.concealed);
      button(controls,"Verdeckt beenden",()=>request("finish",{hidden:true}),!s.cup||s.cup.mustRoll);content.append(controls);
    }
    if(s.pot===0&&s.players.includes(game.user.id)&&!s.order.includes(game.user.id)&&(s.half!==3||s.losers.includes(game.user.id)))button(content,"Einkaufen / wieder mitspielen",()=>request("buy"));
  }
  if(s.phase==='playing'&&s.results.some(r=>r.id===game.user.id&&r.hidden))button(content,'Eigenen Wurf aufdecken',()=>request('reveal'));
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
  game.settings.register(ID,'betaTest',{name:f('Taverngames: Beta-Test','Taverngames: Beta testing'),hint:f('Für künftige Beta-Spiele. Alle acht aktuellen Spiele sind stabil.','For future beta games. All eight current games are stable.'),scope:'world',config:true,restricted:true,type:Boolean,default:false});
  game.settings.register(ID,'diceSoNiceBeta',{name:f('Taverngames: 3D-Würfel mit Dice So Nice (Beta)','Taverngames: 3D dice with Dice So Nice (Beta)'),hint:f('Optionale Wurfanimationen. Dice So Nice muss installiert und aktiv sein. Keine dauerhaft interaktiven Würfel.','Optional roll animations. Dice So Nice must be installed and active. No persistent interactive dice.'),scope:'world',config:true,restricted:true,type:Boolean,default:false,onChange:()=>{diceEvents.clear();diceAnimator.warned=false;}});
  if(!registerSidebar(CONFIG,globalThis.foundry,game,{open:()=>open(),guide:openGuide,farkle:()=>farkleUI.open(),farkleGuide:()=>farkleUI.guide(),tavern:scope=>tavernUIs[scope]?.open(),tavernGuide:scope=>tavernUIs[scope]?.guide()}))ui.notifications.warn(t('Taverngames: native Sidebar-Schnittstelle fehlt. Einstieg über den unteren Button bleibt verfügbar.'));
  CONFIG.queries[GRANT]=({token})=>{if(typeof token!=="string"||token.length>100)throw new Error(t("Ungültige Verbindung."));capability=token;return true;};
  CONFIG.queries[QUERY]=data=>enqueue(async()=>{const result=await command(data);if(data.game!=='farkle'&&(panel||moderation))draw();return result;});
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
      const move=state&&npcAction(state);if(!move)return;
      await diceAction('schocken',move.id,move.action,async()=>{const next=act(state,move.id,move.action,move.args,randomDie);
      await save(next);history.push(structuredClone(state));if(history.length>30)history.shift();const previous=state;state=next;await announceFinished(previous,next);await settleOutcome('schocken');if(panel||moderation)draw();});
    }).catch(e=>ui.notifications.warn(`Schocken-NPC: ${t(e.message)}`));
  },1400);
  setInterval(()=>{
    if(!authority()||!initialized)return;
    void enqueue(async()=>{if(!authority())return;const move=farkleSession.state&&farkleNpcAction(farkleSession.state);await diceAction('farkle',move?.id,move?.action,async()=>{if(await farkleSession.npcStep()){await settleOutcome('farkle');farkleUI.draw();}});}).catch(error=>ui.notifications.warn(`Farkle-NPC: ${farkleError(error.message)}`));
  },1400);
  setInterval(()=>{
    if(!authority()||!initialized)return;
    void enqueue(async()=>{if(!authority())return;for(const scope of NEW_GAMES){const old=sessions[scope].state,move=old&&tavernNpcAction(old);await diceAction(scope,move?.id,move?.action,async()=>{if(await sessions[scope].npcStep()){await settleOutcome(scope);tavernUIs[scope].draw();}});}}).catch(e=>ui.notifications.warn(tavernError(e.message)));
  },1400);
});
Hooks.on("userConnected",(user,connected)=>{if(connected)void grant(user);if(panel||moderation)draw();});

