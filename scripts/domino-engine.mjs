import {RANKS,SUITS,selectCards} from './card-sets.mjs';
import {shufflePeter} from './old-maid-engine.mjs';
import {startingOrder,secureIndex} from './start-choice.mjs';
import {takeGameCard} from './card-draw.mjs';
const check=(v,m)=>{if(!v)throw Error(m);};
export const DOMINO_PROFILE={id:'domino-52',ranks:RANKS,jokers:false,count:52};
export const dominoRanks=s=>s.aceLow?['ace',...RANKS.filter(r=>r!=='ace')]:RANKS;
export function createDomino(o={}){
 const set=o.cardSet;check(set?.cards,'Choose a suitable card deck.');const cards=selectCards(set.cards,DOMINO_PROFILE),roundLimit=o.roundLimit??0;
 check(Number.isInteger(roundLimit)&&roundLimit>=0&&roundLimit<=100,'Domino: rounds must be 0 to 100.');
 return {version:1,game:'domino',gameId:null,revision:0,phase:'lobby',players:Object.keys(o.npcs??{}),npcs:structuredClone(o.npcs??{}),npcManual:{},order:[],turn:0,turnNumber:0,startSelection:o.startSelection??'rules',cardSet:{key:set.key,label:set.label,style:set.style},cards:Object.fromEntries(cards.map(c=>[c.id,c])),hands:{},drawPile:[],discard:[],table:[],aceLow:o.aceLow===true,voluntaryPass:o.voluntaryPass===true,passFee:o.passFee===true,remainingFee:o.remainingFee===true,roundLimit,scores:{},passCounts:{},consecutivePasses:0,bankWins:false,winners:[],losers:[],draw:false,paused:false};
}
export function dominoLegal(s,id){
 if(!s||s.phase!=='playing')return [];const ranks=dominoRanks(s);
 return (s.hands[id]??[]).filter(cardId=>{const c=s.cards[cardId];if(c.rank==='7')return true;const row=s.discard.map(k=>s.cards[k]).filter(p=>p.suit===c.suit);if(!row.length)return false;const values=row.map(p=>ranks.indexOf(p.rank)),i=ranks.indexOf(c.rank);return i===Math.min(...values)-1||i===Math.max(...values)+1;});
}
function finish(s,winner){s.phase='finished';s.winners=winner?[winner]:[];s.losers=winner?s.players.filter(id=>id!==winner):[];s.bankWins=!winner;s.draw=!winner;if(winner)s.scores[winner]=(s.scores[winner]??0)+1;}
export function actDomino(old,id,action,a={},random=secureIndex,gm=false,pick=null){
 check(old?.game==='domino','No game exists.');const s=structuredClone(old);s.revision++;
 if(action==='abort'){check(gm,'GM only.');s.phase='aborted';s.winners=[];s.losers=[];s.bankWins=false;return s;}
 if(action==='pause'){check(gm,'GM only.');s.paused=!s.paused;return s;}
 if(action==='npcControl'){check(gm&&s.npcs[a.id],'GM only.');s.npcManual[a.id]=a.manual===true;return s;}
 check(!s.paused,'Game is paused.');
 if(action==='join'){check(s.phase==='lobby'&&!s.players.includes(id)&&s.players.length<8,'Two to eight players required.');s.players.push(id);return s;}
 if(action==='leave'){check(s.phase==='lobby','Leave in the lobby.');s.players=s.players.filter(p=>p!==id);return s;}
 if(action==='begin'){
  check(gm,'GM only.');check(s.phase==='lobby'&&s.players.length>=2&&s.players.length<=8,'Two to eight players required.');s.order=startingOrder(s);s.hands=Object.fromEntries(s.players.map(p=>[p,[]]));s.passCounts=Object.fromEntries(s.players.map(p=>[p,0]));for(const p of s.players)s.scores[p]??=0;
  const deck=shufflePeter(Object.keys(s.cards),random);for(let i=0;i<52;i++){const recipient=s.order[i%s.order.length];s.hands[recipient].push(takeGameCard(s,recipient,deck,pick,'deal'));}s.phase='playing';return s;
 }
 check(s.phase==='playing'&&s.order[s.turn]===id,'It is not your turn.');
 if(action==='play'){check(dominoLegal(s,id).includes(a.card),'Domino: choose a playable card.');s.hands[id]=s.hands[id].filter(c=>c!==a.card);s.discard.push(a.card);s.table=[...s.discard];s.consecutivePasses=0;s.last={id,action,card:a.card};if(!s.hands[id].length)finish(s,id);}
 else if(action==='pass'){check(s.voluntaryPass||!dominoLegal(s,id).length,'Domino: play a card if possible.');s.passCounts[id]++;s.consecutivePasses++;s.last={id,action};if(s.consecutivePasses>=2*s.players.length)finish(s,null);}
 else throw Error('Unknown action.');
 s.turnNumber++;if(s.phase==='playing')s.turn=(s.turn+1)%s.order.length;return s;
}
export function dominoView(s,user={}){if(!s)return null;const v=structuredClone(s);for(const id of s.players)if(s.phase!=='finished'&&id!==user.id&&!(user.isGM&&s.npcs[id]&&s.npcManual[id]))v.hands[id]=(s.hands[id]??[]).map(()=>null);return v;}
export function dominoNpc(s){if(!s||s.paused||s.phase!=='playing')return null;const id=s.order[s.turn];if(!s.npcs[id]||s.npcManual[id])return null;const legal=dominoLegal(s,id),ranks=dominoRanks(s);
 // Only the NPC's own cards and public layout inform its choice. Unlock its own chains first.
 legal.sort((a,b)=>{const quality=card=>{const c=s.cards[card],i=ranks.indexOf(c.rank);return s.hands[id].filter(k=>s.cards[k].suit===c.suit&&(ranks.indexOf(s.cards[k].rank)-i)*(i<ranks.indexOf('7')?-1:1)>0).length;};return quality(b)-quality(a);});
 return legal.length?{id,action:'play',args:{card:legal[0]}}:{id,action:'pass',args:{}};
}
