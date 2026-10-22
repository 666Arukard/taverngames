// Game-independent card identities. Artwork never determines a card's rules.
export const SUITS=['hearts','clubs','spades','diamonds'];
export const RANKS=['2','3','4','5','6','7','8','9','10','jack','queen','king','ace'];
export const MAU_PROFILE={id:'maumau-32',ranks:RANKS.slice(5),jokers:false,count:32};
export const BACK='icons/svg/card-joker.svg';
const clone=v=>structuredClone(v);
export function selectCards(cards,profile){
 const chosen=cards.filter(c=>profile.ranks.includes(c.rank)&&SUITS.includes(c.suit));
 if(chosen.length!==profile.count||new Set(chosen.map(c=>c.id)).size!==profile.count||SUITS.some(suit=>profile.ranks.some(rank=>chosen.filter(c=>c.suit===suit&&c.rank===rank).length!==1)))throw Error('The selected deck does not contain the required cards.');
 return clone(chosen);
}
const safeImage=value=>typeof value==='string'&&value.length<2048&&!/[<>"\x00-\x1f]/.test(value)&&!/^\s*(?:javascript|data):/i.test(value)?value:null;
function worldSet(doc,profile){
 const raw=doc.toObject(),flag=raw.flags?.['dragon-cards-card-deck'];
 if(raw.type!=='deck'||raw.flags?.taverngames?.cards)return null;
 const nativeRank=value=>({1:'ace',11:'jack',12:'queen',13:'king',14:'ace'})[value]??(Number.isInteger(value)&&value>=2&&value<=10?String(value):null);
 const cards=raw.cards.map(c=>{const f=c.flags?.['dragon-cards-card-deck'],suit=f?.standardSuit??String(c.suit??'').toLowerCase(),rank=f?.standardRank??nativeRank(c.value);return {id:f?.cardId??c._id,suit,rank,name:c.name,front:safeImage(c.faces?.[0]?.img),back:safeImage(c.back?.img)??BACK};});
 selectCards(cards,profile);return {key:'world:'+doc.id,label:raw.name,style:flag?.styleId??'world:'+doc.id,cards};
}
export async function listCardSets(game,profile=MAU_PROFILE){
 const sets=[];
 for(const doc of game.cards?.contents??[]){try{const set=worldSet(doc,profile);if(set)sets.push(set);}catch{/* Invalid templates cannot become game decks. */}}
 const api=game.modules?.get('dragon-cards-card-deck');
 if(api?.active&&api.api?.apiVersion===1){try{const catalog=await api.api.getCatalog();for(const variant of catalog.variants){if(sets.some(s=>s.style===variant.id))continue;const cards=catalog.cards.map(c=>({id:c.id,suit:c.standardSuit,rank:c.standardRank,name:c.displayName,front:safeImage('modules/dragon-cards-card-deck/'+variant.fronts[c.id]),back:safeImage('modules/dragon-cards-card-deck/'+variant.back)??BACK}));selectCards(cards,profile);sets.push({key:'dragon:'+variant.id,label:variant.name??variant.label??variant.id,style:variant.id,cards});}}catch{/* Imported world decks remain usable offline. */}}
 return sets;
}
export async function resolveCardSet(game,key,profile=MAU_PROFILE){const sets=await listCardSets(game,profile),set=key?sets.find(s=>s.key===key):sets[0];if(!set)throw Error('The selected card set is unavailable. Create or import a suitable deck under Cards / Card Decks.');return {...set,cards:selectCards(set.cards,profile)};}
