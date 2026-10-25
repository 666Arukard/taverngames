import {card21Total} from './card21-engine.mjs';
import {secureIndex} from './start-choice.mjs';
export const DIVINE_CARD_SCOPES=['maumau','swim','durak','oldmaid','card21'];
const rankValue=c=>({jack:11,queen:12,king:13,ace:14})[c.rank]??Number(c.rank);
const swimValue=c=>c.rank==='ace'?11:['jack','queen','king'].includes(c.rank)?10:Number(c.rank);
function swimQuality(s,hand){if(hand.length===3&&new Set(hand.map(c=>c.rank)).size===1)return hand[0].rank==='ace'&&s.blitz?32:30.5;return Math.max(0,...[...new Set(hand.map(c=>c.suit))].map(suit=>hand.filter(c=>c.suit===suit).reduce((n,c)=>n+swimValue(c),0)));}
export function cardUsefulness(s,actor,cardId,{context='draw'}={}){
 const card=s.cards[cardId],hand=(s.hands[actor]??[]).map(id=>s.cards[id]);if(!card)return 0;
 if(s.game==='card21'){const ids=actor==='@bank'?s.bank:s.hands[actor]??[];const total=card21Total(s,[...ids,cardId]);return total<=21?total:-100-(total-21);}
 if(s.game==='maumau'){
  const wild=s.nineWild?card.rank==='9':card.rank==='jack',top=s.cards[s.discard.at(-1)];
  const playable=wild||(s.nineWild&&card.rank==='jack'?card.suit===s.activeSuit:card.suit===s.activeSuit||card.rank===top?.rank);
  const synergy=hand.filter(c=>c.suit===card.suit).length+hand.filter(c=>c.rank===card.rank).length*.5;
  return synergy+(wild?3:0)+(['7','8'].includes(card.rank)?1:0)+(context==='draw'&&playable?6:0);
 }
 if(s.game==='swim')return swimQuality(s,[...hand,card]);
 if(s.game==='durak')return rankValue(card)+(card.suit===s.trump?20:0)+(hand.some(c=>c.suit===card.suit)?0:2);
 if(s.game==='oldmaid'){if(cardId===s.oddCard)return -10;return hand.some(c=>c.id!==s.oddCard&&s.pairKeys[c.id]===s.pairKeys[cardId])?10:0;}
 return 0;
}
// The percentage scales the relative preference, not a promised win rate.
// At 100% less useful cards remain possible; equal alternatives remain varied.
export function divineCard({state,actor,candidates,usual,config=[],context='draw',random=secureIndex}){
 const profile=config.find(p=>p.target===actor),strength=profile?.strength??0;
 if(!DIVINE_CARD_SCOPES.includes(state?.game)||!strength||!candidates.length)return usual;
 const scores=candidates.map(id=>cardUsefulness(state,actor,id,{context})),low=Math.min(...scores),high=Math.max(...scores);
 if(!Number.isFinite(low)||!Number.isFinite(high)||low===high)return usual;
 const direction=profile.mode==='disfavor'?-1:1,scale=4*(Math.max(0,Math.min(100,strength))/100)**2;
 const weights=scores.map(score=>Math.exp(scale*(direction===1?(score-low)/(high-low):(high-score)/(high-low)))),sum=weights.reduce((n,v)=>n+v,0);
 let ticket=(random(1000000)+.5)/1000000*sum;for(let i=0;i<candidates.length;i++){ticket-=weights[i];if(ticket<0)return candidates[i];}return candidates.at(-1);
}
