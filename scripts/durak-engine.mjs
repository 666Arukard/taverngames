import {RANKS,selectCards} from './card-sets.mjs';
import {shuffle} from './maumau-engine.mjs';
import {startingOrder} from './start-choice.mjs';
export const DURAK_PROFILE={id:'durak-36',ranks:RANKS.slice(4),count:36,jokers:false};
const check=(v,m)=>{if(!v)throw Error(m);};
const value=c=>RANKS.indexOf(c.rank);
export const durakActive=s=>s.order.filter(id=>!s.out.includes(id));
export const durakNeighbors=s=>{const a=durakActive(s),i=a.indexOf(s.defender);return [...new Set([a[(i+a.length-1)%a.length],a[(i+1)%a.length]])].filter(id=>id&&id!==s.defender);};
const nextTo=(s,id)=>{const a=durakActive(s);return a[(a.indexOf(id)+1)%a.length];};
export function createDurak(o={}){
 const seconds=Number(o.protectionSeconds??5);check(Number.isInteger(seconds)&&seconds>=0&&seconds<=60,'Protection time must be 0–60 seconds.');
 const cards=selectCards(o.cardSet?.cards??[],DURAK_PROFILE);
 return {version:1,game:'durak',gameId:null,revision:0,phase:'lobby',paused:false,startSelection:o.startSelection??'rules',players:Object.keys(o.npcs??{}),npcs:structuredClone(o.npcs??{}),npcManual:{},order:[],turn:0,playersAtStart:[],cards:Object.fromEntries(cards.map(c=>[c.id,c])),cardSet:{key:o.cardSet?.key,label:o.cardSet?.label,style:o.cardSet?.style},hands:{},drawPile:[],discard:[],table:[],out:[],finishOrder:[],winners:[],losers:[],scores:{},round:0,trump:null,trumpCard:null,attacker:null,defender:null,limit:0,deadline:0,protectionSeconds:seconds,transferPlay:o.transferPlay===true,transferRank:o.transferRank===true,extendedTake:o.extendedTake===true,taking:false,thrown:false,passes:[],shown:[],revealed:[],draw:false};
}
function beginBout(s,attacker,now){s.attacker=attacker;s.defender=nextTo(s,attacker);s.turn=s.order.indexOf(s.defender);s.limit=Math.min(6,s.hands[s.defender].length);s.table=[];s.taking=false;s.thrown=false;s.passes=[];s.shown=[];s.revealed=[];s.deadline=0;s.round++;}
function finishBout(s,took,random,now){
 const attacker=s.attacker,defender=s.defender,all=s.table.flatMap(p=>[p.attack,...(p.defense?[p.defense]:[])]);
 if(took)s.hands[defender].push(...all);else s.discard.push(...all);
 const active=durakActive(s),i=active.indexOf(attacker),drawOrder=[...active.slice(i),...active.slice(0,i)].filter(id=>id!==defender).concat(defender);
 for(const id of drawOrder)while(s.hands[id].length<6&&s.drawPile.length)s.hands[id].push(s.drawPile.shift());
 if(!s.drawPile.length)for(const id of drawOrder)if(!s.hands[id].length&&!s.out.includes(id)){s.out.push(id);s.finishOrder.push(id);}
 const remaining=durakActive(s);s.table=[];s.revealed=[];
 if(remaining.length<=1){s.phase='finished';s.losers=[...remaining];s.winners=remaining.length?s.finishOrder.slice(0,1):[];s.draw=!remaining.length;s.ranking=[...s.finishOrder,...remaining];s.scores=Object.fromEntries(s.ranking.map((id,n)=>[id,s.ranking.length-n-1]));return;}
 // Successful defender attacks next; a taker loses their attack turn.
 let next=took?nextTo(s,defender):defender;
 if(!remaining.includes(next)){const old=s.order.indexOf(defender);next=s.order.slice(old+1).concat(s.order.slice(0,old+1)).find(id=>remaining.includes(id));}
 beginBout(s,next,now);
}
export function durakCanBeat(s,attack,card){const a=s.cards[attack],c=s.cards[card];return !!a&&!!c&&(c.suit===a.suit&&value(c)>value(a)||c.suit===s.trump&&a.suit!==s.trump);}
export function durakCanTransfer(s,id,card){const c=s.cards[card],next=nextTo(s,id);return s.phase==='playing'&&id===s.defender&&!s.taking&&!s.thrown&&s.table.length>0&&!s.table.some(p=>p.defense)&&s.hands[id]?.includes(card)&&(c?.suit===s.trump||s.transferRank===true)&&s.table.every(p=>s.cards[p.attack].rank===c.rank)&&!s.shown.some(p=>p.card===card)&&s.hands[next]?.length>=s.table.length+((s.transferPlay||c?.suit!==s.trump)?1:0)&&s.table.length+((s.transferPlay||c?.suit!==s.trump)?1:0)<=6;}
export function actDurak(original,id,action,args={},random=n=>Math.floor(Math.random()*n)+1,gm=false,now=Date.now()){
 check(original,'Open a lobby first.');const s=structuredClone(original),needGM=()=>check(gm,'GM only.');
 if(action==='pause'){needGM();if(s.paused){s.deadline=s.pauseRemaining?now+s.pauseRemaining:0;s.paused=false;}else{s.pauseRemaining=Math.max(0,s.deadline-now);s.paused=true;}}
 else if(action==='abort'){needGM();s.phase='aborted';}
 else if(action==='npcControl'){needGM();check(s.npcs[args.id],'Invalid NPC.');s.npcManual[args.id]=args.manual===true;}
 else {check(!s.paused,'The game is paused.');
  if(action==='join'){check(s.phase==='lobby'&&!s.players.includes(id)&&s.players.length<6,'Join in the lobby; maximum six players.');s.players.push(id);}
  else if(action==='leave'){check(s.phase==='lobby'&&s.players.includes(id)&&!s.npcs[id],'Leave in the lobby.');s.players=s.players.filter(p=>p!==id);}
  else if(action==='begin'){
   needGM();check(s.phase==='lobby'&&s.players.length>=2&&s.players.length<=6,'Two to six players required.');s.order=startingOrder(s);s.playersAtStart=[...s.players];s.hands=Object.fromEntries(s.players.map(p=>[p,[]]));s.drawPile=shuffle(Object.keys(s.cards),random);s.trumpCard=s.drawPile.at(-1);s.trump=s.cards[s.trumpCard].suit;
   for(let n=0;n<(s.players.length===6?5:6);n++)for(const p of s.order)s.hands[p].push(s.drawPile.shift());
   let attacker=s.order[0];if(s.startSelection==='rules'){const trumps=s.order.flatMap(p=>s.hands[p].filter(c=>s.cards[c].suit===s.trump).map(c=>({id:p,v:value(s.cards[c])}))).sort((a,b)=>a.v-b.v);attacker=trumps[0]?.id??attacker;}
   s.phase='playing';beginBout(s,attacker,now);
  }else{
   check(s.phase==='playing'&&durakActive(s).includes(id),'Not an active player.');const owns=c=>check(s.hands[id].includes(c),'Card is not in your hand.'),play=c=>{owns(c);s.hands[id]=s.hands[id].filter(x=>x!==c);};
   if(action==='attack'){
    check(!s.table.length?id===s.attacker:durakNeighbors(s).includes(id),'Only the attacker or defending neighbors may attack.');check(!s.taking||s.extendedTake,'The defender is taking.');
    if(s.table.length){check(now>=s.deadline,'The defender is protected.');check(s.table.length<s.limit,'Attack limit reached.');check(s.table.some(p=>[p.attack,p.defense].filter(Boolean).some(c=>s.cards[c].rank===s.cards[args.card]?.rank)),'Throw a matching rank.');s.thrown=true;}
    play(args.card);s.table.push({attack:args.card,defense:null});s.passes=[];if(s.table.length===1)s.deadline=now+s.protectionSeconds*1000;
   }else if(action==='defend'){
    check(id===s.defender&&!s.taking,'Only the defender may defend.');const pair=s.table[args.index];check(pair&&!pair.defense&&durakCanBeat(s,pair.attack,args.card),'Card cannot beat this attack.');play(args.card);pair.defense=args.card;s.passes=[];
   }else if(action==='transfer'){
    check(durakCanTransfer(s,id,args.card),'Cannot transfer this attack.');const next=nextTo(s,id);s.shown.push({owner:id,card:args.card});s.revealed.push({owner:id,card:args.card});if(s.transferPlay||s.cards[args.card].suit!==s.trump){play(args.card);s.table.push({attack:args.card,defense:null});}
    s.attacker=id;s.defender=next;s.turn=s.order.indexOf(next);s.limit=Math.min(6,s.hands[next].length);s.deadline=now+s.protectionSeconds*1000;s.passes=[];
   }else if(action==='take'){
    check(id===s.defender&&s.table.length&&!s.taking,'Only the defender may take.');if(s.extendedTake){s.taking=true;s.deadline=0;s.passes=[];}else finishBout(s,true,random,now);
   }else if(action==='pass'){
    check(durakNeighbors(s).includes(id)&&s.table.length&&(s.taking||s.table.every(p=>p.defense)),'Wait for the defense.');check(now>=s.deadline,'The defender is protected.');check(!s.passes.includes(id),'Already passed.');s.passes.push(id);if(durakNeighbors(s).every(p=>s.passes.includes(p)))finishBout(s,s.taking,random,now);
   }else throw Error('Unknown action.');
  }
 }
 if(['begin','attack','defend','transfer','take','pass'].includes(action)){s.actionNumber=(original.actionNumber??0)+1;s.lastAction={number:s.actionNumber,kind:action,actor:id};}
 s.revision++;return s;
}
export function durakView(s,user){if(!s)return null;const v=structuredClone(s),publicIds=new Set([s.trumpCard,...s.table.flatMap(p=>[p.attack,p.defense]),...s.revealed.map(p=>p.card)].filter(Boolean));v.cardBack=Object.values(s.cards).find(c=>c.back)?.back;for(const id of s.players){const own=id===user.id||user.isGM&&s.npcs[id]&&s.npcManual[id];v.hands[id]=s.hands[id]?.map(c=>own?c:null)??[];if(own)for(const c of s.hands[id]??[])publicIds.add(c);}v.remaining=s.drawPile.length;delete v.drawPile;v.cards=Object.fromEntries([...publicIds].map(c=>[c,structuredClone(s.cards[c])]));return v;}
export function durakNpc(s,now=Date.now()){
 if(!s||s.phase!=='playing'||s.paused)return null;
 const auto=id=>s.npcs[id]&&!s.npcManual[id],sort=ids=>[...ids].sort((a,b)=>(s.cards[a].suit===s.trump)-(s.cards[b].suit===s.trump)||value(s.cards[a])-value(s.cards[b]));
 if(!s.table.length)return auto(s.attacker)?{id:s.attacker,action:'attack',args:{card:sort(s.hands[s.attacker])[0]}}:null;
 if(auto(s.defender)&&!s.taking){const id=s.defender,transfer=sort(s.hands[id]).find(c=>durakCanTransfer(s,id,c));if(transfer)return {id,action:'transfer',args:{card:transfer}};const index=s.table.findIndex(p=>!p.defense);if(index>=0){const card=sort(s.hands[id]).find(c=>durakCanBeat(s,s.table[index].attack,c));return card?{id,action:'defend',args:{card,index}}:{id,action:'take',args:{}};}}
 if(now<s.deadline)return null;
 for(const id of durakNeighbors(s).filter(auto)){if(s.passes.includes(id))continue;const card=s.table.length<s.limit&&sort(s.hands[id]).find(c=>s.table.some(p=>[p.attack,p.defense].filter(Boolean).some(a=>s.cards[a].rank===s.cards[c].rank)));if(card)return {id,action:'attack',args:{card}};if(s.taking||s.table.every(p=>p.defense))return {id,action:'pass',args:{}};}
 return null;
}
