import {startingOrder,chosenStarter} from './start-choice.mjs';
// Pure rules engine. No Foundry documents, network or randomness accessed here.
const check = (ok, message) => { if (!ok) throw new Error(message); };
export const DEFAULT_LABELS={simple:"Einfacher Wurf",straight:"Straße",triple:"Jennie/General",schock2:"Schock doof",schock3:"Schock 3",schock4:"Schock 4",schock5:"Schock 5",schock6:"Schock 6",out:"Schock Aus"};
export const TAVERN_LABELS={simple:"Bettlerwurf",straight:"Triumphzug",schock2:"Knappenbund",triple:"Ritterorden",schock3:"Prinzenschock",schock4:"Fürstenschock",schock5:"Königsschock",schock6:"Kaiserschock",out:"Gotteshand"};
export function labels(input={}) {
  check(input && typeof input==='object' && !Array.isArray(input),"Ungültige Wurfnamen.");
  return Object.fromEntries(Object.entries(DEFAULT_LABELS).map(([key,fallback])=>{
    const text=input[key]??fallback;check(typeof text==='string'&&text.trim().length>0&&text.length<=60,"Wurfnamen müssen 1–60 Zeichen haben.");return [key,text.trim()];
  }));
}
export function valueName(v,names=DEFAULT_LABELS) {return `${names[v.kind]??v.name}${v.kind==='simple'?` (${v.high})`:''}`;}
export function value(dice, hand = true) {
  check(Array.isArray(dice) && dice.length === 3 && dice.every(n => Number.isInteger(n) && n >= 1 && n <= 6), "Ungültige Würfel.");
  const d = [...dice].sort((a,b) => a-b), number = [...d].reverse().join("") * 1;
  if (d[0] === 1 && d[1] === 1) return {kind:d[2]===1?'out':`schock${d[2]}`,rank: d[2] === 1 ? 100 : d[2] === 2 ? 3 : 4 + d[2], high: d[2], lids: d[2] === 1 ? 13 : d[2], name: d[2] === 1 ? "Schock Aus" : `Schock ${d[2]}`};
  if (hand && d[0] === d[2]) return {kind:'triple',rank: 4, high: d[2], lids: 3, name: "Jennie"};
  if (hand && d[1] === d[0]+1 && d[2] === d[1]+1) return {kind:'straight',rank: 2, high: d[2], lids: 2, name: "Straße"};
  return {kind:'simple',rank: 1, high: number, lids: 1, name: String(number)};
}
export function compare(a,b) {
  return a.value.rank-b.value.rank || a.value.high-b.value.high || b.rolls-a.rolls || b.order-a.order;
}
export function create(ids,options={}) {
  check(Array.isArray(ids) && ids.length >= (options.lobby?0:2) && ids.length <= 20 && new Set(ids).size === ids.length && ids.every(id => typeof id === "string" && id.length <= 64), "2–20 unterschiedliche Spieler wählen.");
  const s = {version:1, revision:0, players:[...ids], lids:Object.fromEntries(ids.map(id=>[id,0])), pot:13, half:1, losers:[], round:0, phase:"playing", paused:false, log:[]};
  check(options.loading===undefined||typeof options.loading==='boolean',"Ungültige Laden-Einstellung.");
  s.loadAtStart=options.loading??true;s.npcManual={};
  check([options.allowReturn,options.hiddenThird].every(v=>v===undefined||typeof v==='boolean'),"Ungültige Regeloption.");
  s.rules={allowReturn:options.allowReturn??false,hiddenThird:options.hiddenThird??true};
  s.labels=labels(options.labels);s.npcs={};
  for(const [id,name] of Object.entries(options.npcs??{})) {
    check(ids.includes(id)&&id.startsWith('npc-')&&typeof name==='string'&&name.trim().length>0&&name.length<=60,"Ungültiger NPC.");s.npcs[id]=name.trim();
  }
  if(options.lobby){s.phase='lobby';s.order=[];s.turn=0;s.results=[];s.cup=null;s.limit=3;s.loading=false;}
  else begin(s, ids[0], s.loadAtStart);return s;
}
function begin(s, first, loading = false) {
  const pool = s.half === 3 ? s.losers : s.players;
  const order = [...pool.slice(pool.indexOf(first)), ...pool.slice(0,pool.indexOf(first))];
  s.order = order.filter(id => s.pot > 0 || s.lids[id] > 0);
  s.turn = 0; s.results = []; s.cup = null; s.limit = loading ? 1 : 3; s.loading = loading; s.round++;
}
function record(s, text) { s.log = [...s.log, text].slice(-80); }
function finishHalf(s, loser) {
  record(s, `${s.half === 3 ? "Finale" : `Hälfte ${s.half}`} verloren: ${loser}`);
  if (s.half === 3 || s.losers[0] === loser) { s.phase="finished"; s.loser=loser; return; }
  s.losers.push(loser); s.phase="half";
}
function settle(s) {
  const sorted = [...s.results].sort(compare), worst=sorted[0], best=sorted.at(-1);
  if (best.value.rank === 100) {
    s.pot=0; for (const id of s.players) s.lids[id]=id===worst.id?13:0;
  } else {
    const amount=Math.min(best.value.lids, s.pot || s.lids[best.id]);
    if(s.pot) s.pot-=amount; else s.lids[best.id]-=amount;
    s.lids[worst.id]+=amount;
    s.log=[...s.log,{type:'transfer',id:worst.id,amount,value:best.value}].slice(-80);
  }
  s.lastResults=structuredClone(s.results);
  if(s.lids[worst.id]===13) finishHalf(s,worst.id);
  else begin(s,worst.id);
}
export function act(original, actor, action, args={}, diceSource=()=>1, gm=false) {
  const s=structuredClone(original);
  check(s?.version===1,"Kein Spiel vorhanden.");
  check(!['aborted','finished'].includes(s.phase)||action==='labels',"Dieses Spiel ist beendet.");
  if(action==='abort') {
    check(gm,"Nur GM.");s.phase='aborted';s.paused=true;s.cup=null;s.results=[];s.lastResults=[];record(s,'Spiel durch den GM beendet');
  } else if(action==='join'||action==='leave') {
    check(s.phase==='lobby',"Beitritt ist nur in der Lobby möglich.");check(typeof actor==='string'&&!actor.startsWith('npc-'),"Ungültiger Teilnehmer.");
    if(action==='join'){check(!s.players.includes(actor),"Du bist bereits dabei.");check(s.players.length<20,"Der Tisch ist voll.");s.players.push(actor);s.lids[actor]=0;}
    else {check(s.players.includes(actor),"Du bist nicht dabei.");s.players=s.players.filter(id=>id!==actor);delete s.lids[actor];}
  } else if(action==='begin') {
    check(gm&&s.phase==='lobby',"Nur GM kann die Lobby starten.");
      const ordered=startingOrder(s,[...s.players.filter(id=>!s.npcs?.[id]),...s.players.filter(id=>s.npcs?.[id])]);
      const playing=create(ordered,{...s.rules,loading:s.loadAtStart,npcs:s.npcs,labels:s.labels});
    Object.assign(s,playing,{revision:s.revision,gameId:s.gameId,npcManual:s.npcManual});
  } else if(action==='reveal') {
    check(s.phase==='playing'&&!s.paused,"Aufdecken gerade nicht möglich.");
    if(s.order[s.turn]===actor || (gm&&args.current===true)) {
      check(s.cup?.concealed,"Kein verdeckter Becher.");s.cup.concealed=false;s.cup.revealed=true;
    }else{const r=s.results.find(r=>r.id===actor);check(r?.hidden,"Kein verdeckter eigener Wurf.");r.hidden=false;}
  } else if(action==="npcControl") {
    check(gm,"Nur GM.");check(Object.hasOwn(s.npcs??{},args.id)&&typeof args.manual==='boolean',"Ungültige NPC-Steuerung.");
    s.npcManual??={};s.npcManual[args.id]=args.manual;
  }
  else if(action==="labels") {check(gm,"Nur GM.");s.labels=labels(args.labels);}
  else if(action==="pause") {check(gm,"Nur GM."); s.paused=!s.paused;}
  else if(action==="nextHalf") {
    check((gm || s.players.includes(actor)) && s.phase==="half","Keine nächste Hälfte verfügbar.");
    s.half++; s.pot=13; for(const id of s.players) s.lids[id]=0;
    s.phase="playing"; begin(s,s.half===3?s.losers[0]:s.losers.at(-1),s.loadAtStart??true);
  } else if(action==="buy") {
    check(s.phase==="playing" && !s.paused && s.pot===0 && s.players.includes(actor) && (s.half!==3 || s.losers.includes(actor)) && !s.order.includes(actor),"Einkaufen gerade nicht möglich.");
    s.order.push(actor); record(s, `${actor} kauft sich ein.`);
  } else {
    check(s.phase==="playing" && !s.paused,"Das Spiel läuft gerade nicht.");
    const current=s.order[s.turn]; check(actor===current || gm,"Du bist nicht am Zug.");
    if(action==="roll") {
      const c=s.cup ?? {dice:[null,null,null],held:[false,false,false],rolls:0,hand:true,mustRoll:false,fresh:[]};
      check(args.hidden!==true || c.rolls===2,"Nur der dritte Wurf kann verdeckt gewürfelt werden.");
      check(c.rolls<s.limit,"Wurflimit erreicht.");
      check(c.held.some(v=>!v),"Alle Würfel sind herausgelegt.");
      c.hand=c.held.every(v=>!v); c.fresh=[];
      c.dice=c.dice.map((v,i)=>{if(c.held[i]) return v; c.fresh.push(i); const n=diceSource(); check(Number.isInteger(n)&&n>=1&&n<=6,"Ungültige Zufallszahl."); return n;});
      c.rolls++; c.mustRoll=false;c.revealed=false;c.concealed=args.hidden===true||(c.rolls===3&&s.rules?.hiddenThird!==false); s.cup=c;
      // Always allow the player to decide whether to conceal the final cup.
    } else if(action==="hold") {
      const c=s.cup; check(c && c.rolls<s.limit && Number.isInteger(args.index) && args.index>=0 && args.index<3,"Herauslegen nicht möglich.");
      check(!c.held[args.index],"Herausgelegte Würfel bleiben liegen."); c.held[args.index]=true;
      check(!c.mustRoll || c.held.some(v=>!v),"Nach dem Drehen muss ein Würfel zum erneuten Würfeln bleiben.");
    } else if(action==='return') {
      const c=s.cup;check(s.rules?.allowReturn&&c&&c.rolls<s.limit&&Number.isInteger(args.index)&&args.index>=0&&args.index<3&&c.held[args.index],"Wiederhereinnehmen nicht erlaubt.");
      c.held[args.index]=false;
    } else if(action==="six") {
      const c=s.cup; check(canTurnSix(s),"Drehen nicht möglich.");
      const six=c.fresh.filter(i=>c.dice[i]===6 && !c.held[i]); check(six.length>=2,"Mindestens zwei frische Sechsen nötig.");
      for(const i of six.slice(0,-1)) {c.dice[i]=1;c.held[i]=true;}
      c.hand=false; c.mustRoll=true; c.fresh=[];
    } else if(action==="finish") {
      const c=s.cup; check(c && !c.mustRoll,"Erst würfeln; nach Sechsen drehen erneut würfeln.");
      if(s.turn===0) s.limit=c.rolls;
      s.results.push({id:current,dice:c.dice,held:c.held,hidden:c.concealed||args.hidden===true,rolls:c.rolls,order:s.turn,value:value(c.dice,c.hand)});
      s.cup=null; s.turn++;
      if(s.turn===s.order.length) settle(s);
    } else {throw new Error("Unbekannte Aktion.");}
  }
  s.revision++; return s;
}
export function canTurnSix(s) {
  const c=s?.cup;
  return !!(s?.phase==='playing'&&!s.paused&&c&&c.rolls<s.limit&&!c.mustRoll&&Array.isArray(c.fresh)&&c.fresh.filter(i=>c.dice[i]===6&&!c.held[i]).length>=2);
}
export function view(s,id,gm=false) {
  if(!s) return null;
  const v=structuredClone(s);
  if(v.cup && ((!gm && s.order[s.turn]!==id&&!v.cup.revealed)||(v.cup.concealed && s.order[s.turn]===id))) v.cup={concealed:v.cup.concealed,revealed:v.cup.revealed,rolls:v.cup.rolls, held:v.cup.held, dice:v.cup.dice.map((n,i)=>v.cup.held[i]?n:null)};
  if(!['half','finished'].includes(s.phase))v.results=v.results.map(r=>r.hidden&&(r.id!==id||r.rolls===3)?{id:r.id,rolls:r.rolls,hidden:true,held:r.held,dice:r.dice.map((n,i)=>r.held[i]?n:null)}:r);
  return v;
}
// Simple, transparent NPC strategy: keep strong hands, otherwise build ones.
export function npcAction(s) {
  const id=s.order[s.turn];if(s.phase!=='playing'||s.paused||!s.npcs?.[id]||s.npcManual?.[id])return null;
  const c=s.cup;
  if(!c)return {id,action:'roll'};
  if(c.mustRoll)return {id,action:'roll'};
  const v=value(c.dice,c.hand);
  if(c.rolls>=s.limit||v.rank>=4)return {id,action:'finish'};
  if(canTurnSix(s))return {id,action:'six'};
  const i=c.dice.findIndex((n,i)=>n===1&&!c.held[i]);
  if(i>=0)return {id,action:'hold',args:{index:i}};
  if(c.held.every(Boolean))return {id,action:'finish'};
  return {id,action:'roll'};
}
