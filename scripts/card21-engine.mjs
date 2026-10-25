import {selectCards,RANKS} from './card-sets.mjs';
import {shuffle} from './maumau-engine.mjs';
import {takeGameCard} from './card-draw.mjs';
import {startingOrder} from './start-choice.mjs';
import {prepareSeventeenRisk,SEVENTEEN_RISKS,seventeenStake} from './seventeen-engine.mjs';
const check=(v,m)=>{if(!v)throw Error(m);};
export const card21Profile=()=>({id:'card21-32',ranks:RANKS.slice(5),count:32,jokers:false});
export function card21Total(s,ids){const legacy=s.rulesVersion!==2&&s.alternative===true,low=legacy?2:1;let total=0,aces=0;for(const id of ids){const c=s.cards[id];if(c.rank==='ace'){total+=low;aces++;}else total+=s.rulesVersion===2&&s.faceCardsTen&&['jack','queen','king'].includes(c.rank)?10:({jack:legacy?3:2,queen:legacy?4:3,king:legacy?5:4})[c.rank]??Number(c.rank);}const extra=11-low;while(aces-->0&&total+extra<=21)total+=extra;return total;}
export function card21BaseCards(s){return Object.values(s.baseCards??s.cards).filter(c=>!c.copyIndex);}
export function card21DeckCount(s){return s.deckCopies==='auto'?Math.max(1,Math.ceil((s.players.length+1)/4)):s.deckCopies??1;}
function expandDeck(s){const base=card21BaseCards(s);s.baseCards=Object.fromEntries(base.map(c=>[c.id,c]));s.actualDeckCopies=card21DeckCount(s);s.cards={...s.baseCards};for(let copy=1;copy<s.actualDeckCopies;copy++)for(const c of base){const id='tg-copy-'+copy+'-'+c.id;check(!s.cards[id],'Duplicate card identifier.');s.cards[id]={...c,id,baseCardId:c.id,copyIndex:copy};}}
export function createCard21(o={}){
 const profile=card21Profile(),cards=selectCards(o.cardSet?.cards??[],profile),npcs=structuredClone(o.npcs??{}),bankFunds=o.bankFunds??1000;
 const deckCopies=o.deckCopies??'auto';check(deckCopies==='auto'||Number.isInteger(deckCopies)&&deckCopies>=1&&deckCopies<=8,'Invalid deck count.');
 check(Number.isSafeInteger(bankFunds)&&bankFunds>=0&&bankFunds<=1000000,'Invalid bank budget.');
 return {version:1,game:'card21',gameId:null,revision:0,phase:'lobby',paused:false,deckCopies,actualDeckCopies:1,rulesVersion:2,faceCardsTen:o.faceCardsTen===true,players:Object.keys(npcs),npcs,npcManual:{},npcRisk:{},order:[],turn:0,startSelection:o.startSelection??'rules',bankManual:o.bankManual===true,bankFunds,bankBalance:bankFunds,bankDebt:0,bank:[],bankStop:null,hands:{},finishedPlayers:[],drawPile:[],discard:[],cards:Object.fromEntries(cards.map(c=>[c.id,c])),cardSet:{key:o.cardSet.key,label:o.cardSet.label,style:o.cardSet.style},currency:'token',variableStakes:true,minStake:{amount:1,cp:1,currency:'token'},maxStake:{amount:1,cp:1,currency:'token'},stakes:Object.fromEntries(Object.keys(npcs).map(id=>[id,{amount:1,cp:1,currency:'token'}])),scores:{},settlements:{},winners:[],losers:[],deckExhausted:false};
}
function draw(s,id,pick,context){check(s.drawPile.length,'No cards available.');const card=takeGameCard(s,id,s.drawPile,pick,context);(id==='@bank'?s.bank:s.hands[id]).push(card);}
function settle(s){
 const bank=card21Total(s,s.bank);s.phase='finished';s.winners=[];s.losers=[];s.scores={};s.settlements={};
 for(const id of s.players){const total=card21Total(s,s.hands[id]),win=total<=21&&(bank>21||total>bank),bet=s.stakes[id]??{amount:1,cp:1,currency:'token'},payoutCp=win?Math.ceil(bet.cp*(total===21?2.5:2)):0;s.scores[id]=payoutCp-bet.cp;s.settlements[id]={total,win,stake:bet.amount,currency:'token',payout:payoutCp,net:payoutCp-bet.cp,stakeCp:bet.cp,payoutCp};(win?s.winners:s.losers).push(id);}
 s.draw=false;s.bankBalance-=Object.values(s.scores).reduce((a,b)=>a+b,0);s.bankDebt=Math.max(0,-s.bankBalance);
}
export function actCard21(old,id,action,args={},random=()=>1,gm=false,pick=null){
 check(old?.game==='card21','No game exists.');const s=structuredClone(old);s.revision++;const admin=()=>check(gm,'GM only.');
 if(action==='abort'){admin();s.phase='aborted';s.paused=true;return s;}
 if(action==='pause'){admin();check(!['finished','aborted'].includes(s.phase),'This game has ended.');s.paused=!s.paused;return s;}
 if(action==='bankControl'){admin();s.bankManual=args.manual===true;return s;}
 if(action==='npcControl'){admin();check(s.npcs[args.id],'Invalid NPC.');s.npcManual[args.id]=args.manual===true;return s;}
 check(!s.paused&&!['finished','aborted'].includes(s.phase),'The game has ended or is paused.');
 if(action==='join'){check(s.phase==='lobby'&&!s.players.includes(id)&&s.players.length<10,'One to ten participants.');s.players.push(id);s.stakes[id]={amount:1,cp:1,currency:'token'};}
 else if(action==='leave'){check(s.phase==='lobby','Leave in the lobby.');s.players=s.players.filter(p=>p!==id);delete s.stakes[id];}
 else if(action==='stake'){check(s.phase==='lobby','Set stakes in the lobby.');check(s.players.includes(id),'Invalid participant.');const bet=seventeenStake(args.amount,'token');check(bet.cp>=s.minStake.cp&&bet.cp<=s.maxStake.cp,'Stake is outside the allowed range.');s.stakes[id]=bet;}
 else if(action==='npcRisk'){admin();check(s.phase==='lobby'&&s.npcs[args.id]&&SEVENTEEN_RISKS.includes(args.mode),'Invalid NPC risk.');s.npcRisk[args.id]=args.mode;return prepareSeventeenRisk(s,random);}
 else if(action==='begin'){
  if(s.phase==='lobby'&&s.rulesVersion!==2){s.rulesVersion=2;s.faceCardsTen=false;delete s.alternative;delete s.sixes;s.cards=Object.fromEntries(selectCards(Object.values(s.cards),card21Profile()).map(c=>[c.id,c]));}
  admin();check(s.phase==='lobby'&&s.players.length>=1&&s.players.length<=10,'One to ten participants.');check(s.players.every(p=>s.stakes[p]),'Each participant must choose a stake first.');
  expandDeck(s);s.order=startingOrder(s);s.drawPile=shuffle(Object.keys(s.cards),random);s.discard=[];s.hands=Object.fromEntries(s.players.map(p=>[p,[]]));s.bank=[];s.bankStop=15+random(2);s.phase='playing';
  // Deal both hidden rounds to everyone before the first participant can act.
  for(let n=0;n<2;n++){draw(s,'@bank',pick,'deal');for(const p of s.order)draw(s,p,pick,'deal');}
 }
 else if(action==='bankDraw'||action==='bankStand'){
  admin();check(s.phase==='bank','It is not the bank turn.');
  if(action==='bankStand')settle(s);else{check(card21Total(s,s.bank)<21,'No more cards.');if(s.drawPile.length)draw(s,'@bank',pick,'draw');else{s.deckExhausted=true;settle(s);}}
 }
 else{
  check(s.phase==='playing'&&s.order[s.turn]===id,'It is not your turn.');
  if(action==='draw'){check(card21Total(s,s.hands[id])<21,'No more cards.');if(s.drawPile.length)draw(s,id,pick,'draw');else{s.deckExhausted=true;finishPlayer(s,id);}}
  else if(action==='stand')finishPlayer(s,id);else throw Error('Unknown action.');
 }
 return s;
}
function finishPlayer(s,id){s.finishedPlayers.push(id);s.turn++;if(s.turn===s.order.length){s.turn=s.order.length-1;s.phase='bank';}}
export function card21View(s,user={}){
 if(!s)return null;const v=structuredClone(s);v.drawCount=s.drawPile.length;delete v.drawPile;
 if(!['finished'].includes(s.phase)){
  delete v.scores;delete v.settlements;delete v.bankStop;
  const allowed=id=>id===user.id||user.isGM&&s.npcs[id]&&s.npcManual[id];
  v.hands=Object.fromEntries(s.players.map(id=>[id,s.hands[id]?.map((card,i)=>i>=2||allowed(id)?card:null)??[]]));
  v.bank=s.bank.map((card,i)=>i>=2||user.isGM&&s.bankManual?card:null);
 }
 return v;
}
export function card21Npc(s){
 if(!s||s.paused)return null;
 if(s.phase==='bank'&&!s.bankManual)return {id:'@bank',action:card21Total(s,s.bank)>=s.bankStop||!s.drawPile.length?'bankStand':'bankDraw'};
 const id=s.order[s.turn];if(s.phase!=='playing'||!s.npcs[id]||s.npcManual[id])return null;
 return {id,action:card21Total(s,s.hands[id])>=16||!s.drawPile.length?'stand':'draw'};
}
