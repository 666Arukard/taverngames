import {startingOrder} from './start-choice.mjs';
import {SUITS,MAU_PROFILE,selectCards,standardCards} from './card-sets.mjs';
const check=(v,m)=>{if(!v)throw Error(m);};
export function shuffle(cards,random){const a=[...cards];for(let i=a.length-1;i>0;i--){const n=random(i+1)-1;check(Number.isInteger(n)&&n>=0&&n<=i,'Invalid shuffle.');[a[i],a[n]]=[a[n],a[i]];}return a;}
export function createMau(options={}){
 const cards=selectCards(options.cardSet?.cards??standardCards(),MAU_PROFILE),npcs=options.npcs??{};
 return {version:1,game:'maumau',gameId:null,revision:0,phase:'lobby',paused:false,players:Object.keys(npcs),npcs:structuredClone(npcs),npcManual:{},startSelection:options.startSelection??'rules',order:[],turn:0,turnSerial:0,cards:Object.fromEntries(cards.map(c=>[c.id,c])),cardSet:{key:options.cardSet?.key??'standard',label:options.cardSet?.label??'Standard',style:options.cardSet?.style??'standard'},hands:{},drawPile:[],discard:[],activeSuit:null,drawnCard:null,pendingDraw:0,calls:[],candidate:null,blockedTurns:0,penalties:options.penalties===true,winners:[],losers:[],draw:false};
}
export const mauLegal=(s,id,cardId)=>s?.phase==='playing'&&!s.pendingDraw&&s.hands[id]?.includes(cardId)&&(!s.drawnCard||s.drawnCard===cardId)&&(s.cards[cardId].rank==='jack'||s.cards[cardId].suit===s.activeSuit||s.cards[cardId].rank===s.cards[s.discard.at(-1)]?.rank);
function finish(s,id){s.phase='finished';s.winners=id?[id]:[];s.losers=id?s.players.filter(p=>p!==id):[];s.draw=!id;s.calls=[];s.candidate=null;}
function advance(s,steps=1){s.turnSerial++;if(s.candidate&&s.turnSerial>=s.candidate.expires&&s.hands[s.candidate.id].length===0){finish(s,s.candidate.id);return;}s.calls=s.calls.filter(c=>s.turnSerial<c.expires);s.turn=(s.turn+steps)%s.order.length;for(let i=0;s.candidate&&s.hands[s.order[s.turn]].length===0&&i<s.order.length;i++)s.turn=(s.turn+1)%s.order.length;s.drawnCard=null;if(s.blockedTurns>=s.players.length)finish(s,null);}
function take(s,id,count,random){let taken=[];for(let i=0;i<count;i++){if(!s.drawPile.length&&s.discard.length>1){const top=s.discard.pop();s.drawPile=shuffle(s.discard,random);s.discard=[top];}if(!s.drawPile.length)break;const card=s.drawPile.shift();s.hands[id].push(card);taken.push(card);}return taken;}
export function actMau(original,id,action,args={},random=()=>1,gm=false){
 const s=structuredClone(original);check(s?.game==='maumau','No game exists.');
 if(action==='abort'){check(gm,'GM only.');s.phase='aborted';s.paused=true;s.calls=[];s.candidate=null;}
 else if(action==='pause'){check(gm&&!['finished','aborted'].includes(s.phase),'GM only.');s.paused=!s.paused;}
 else if(action==='npcControl'){check(gm&&Object.hasOwn(s.npcs,args.id)&&typeof args.manual==='boolean','GM only.');s.npcManual[args.id]=args.manual;}
 else{check(!s.paused&&!['finished','aborted'].includes(s.phase),'The game has ended or is paused.');
  if(['join','leave'].includes(action)){check(s.phase==='lobby'&&typeof id==='string'&&!id.startsWith('npc-'),'Join in the lobby.');if(action==='join'){check(!s.players.includes(id)&&s.players.length<5,'Two to five players.');s.players.push(id);}else{check(s.players.includes(id),'Invalid participant.');s.players=s.players.filter(p=>p!==id);}}
  else if(action==='begin'){
   check(gm&&s.phase==='lobby'&&s.players.length>=2&&s.players.length<=5,'Two to five players.');s.order=startingOrder(s);s.hands=Object.fromEntries(s.players.map(p=>[p,[]]));s.drawPile=shuffle(Object.keys(s.cards),random);for(let i=0;i<5;i++)for(const p of s.order)take(s,p,1,random);s.discard=[s.drawPile.shift()];s.activeSuit=s.cards[s.discard[0]].suit;s.phase='playing';
  }else if(action==='call'){
   check(s.calls.some(c=>c.id===id),'No missed call.');s.calls=s.calls.filter(c=>c.id!==id);if(s.candidate?.id===id)finish(s,id);
  }else if(action==='challenge'){
   check(s.players.includes(id)&&id!==args.target&&s.calls.some(c=>c.id===args.target&&s.turnSerial<c.expires),'No missed call.');take(s,args.target,2,random);s.calls=s.calls.filter(c=>c.id!==args.target);if(s.candidate?.id===args.target){if(s.hands[args.target].length===0)finish(s,args.target);else s.candidate=null;}
  }else{
   check(s.phase==='playing'&&s.order[s.turn]===id,'It is not your turn.');
   if(action==='play'){
    check(mauLegal(s,id,args.card),'This card cannot be played.');const c=s.cards[args.card];if(c.rank==='jack')check(SUITS.includes(args.suit),'Choose a suit.');s.hands[id]=s.hands[id].filter(v=>v!==args.card);s.discard.push(args.card);s.activeSuit=c.rank==='jack'?args.suit:c.suit;s.blockedTurns=0;
    const count=s.hands[id].length,missed=s.penalties&&count<=1&&args.announce!==true;
    if(missed)s.calls.push({id,kind:count===0?'maumau':'mau',expires:s.turnSerial+2});
    if(count===0&&!s.candidate){if(!missed)finish(s,id);else s.candidate={id,expires:s.turnSerial+2};}
    if(s.phase==='playing'){s.pendingDraw=c.rank==='7'?2:0;advance(s,c.rank==='8'?2:1);}
   }else if(action==='draw'){
    check(!s.drawnCard&&(s.pendingDraw>0||!s.hands[id].some(c=>mauLegal(s,id,c))),'Play a matching card first.');const penalty=s.pendingDraw;s.pendingDraw=0;const drawn=take(s,id,penalty||1,random);s.blockedTurns=drawn.length?0:s.blockedTurns+1;
    if(!penalty&&drawn.length&&mauLegal(s,id,drawn[0]))s.drawnCard=drawn[0];else advance(s);
   }else if(action==='pass'){check(s.drawnCard,'Draw first.');advance(s);}
   else throw Error('Unknown action.');
  }
 }s.revision++;return s;
}
export function mauView(state,user={}){if(!state)return null;const s=structuredClone(state);s.drawCount=s.drawPile.length;delete s.drawPile;for(const id of s.players){if(id!==user.id&&!(user.isGM&&s.npcs[id]&&s.npcManual[id]))s.hands[id]=(s.hands[id]??[]).map(()=>null);}if(s.drawnCard&&s.order[s.turn]!==user.id&&!(user.isGM&&s.npcs[s.order[s.turn]]&&s.npcManual[s.order[s.turn]]))s.drawnCard=null;return s;}
export function mauNpcAction(s){if(!s||s.paused||s.phase!=='playing')return null;const id=s.order[s.turn];if(!s.npcs[id]||s.npcManual[id])return null;const missed=s.calls.find(c=>c.id!==id);if(missed)return {id,action:'challenge',args:{target:missed.id}};const legal=s.hands[id].filter(c=>mauLegal(s,id,c)),card=legal.find(c=>s.cards[c].rank!=='jack')??legal[0];if(card){const counts=SUITS.map(suit=>s.hands[id].filter(c=>s.cards[c].suit===suit).length);return {id,action:'play',args:{card,suit:SUITS[counts.indexOf(Math.max(...counts))],announce:true}};}return {id,action:s.drawnCard?'pass':'draw',args:{}};}
