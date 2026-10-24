// Move one existing card. Selection is a GM-side dependency, never saved in state.
// With no influence the original top card / clicked slot remains authoritative.
export function takeGameCard(state,actor,pile,pick,context='draw',index=0,protectedIds=[]){
 if(!pile.length)return null;
 const usual=pile[index];if(usual===undefined)throw Error('Choose a hidden card.');
 let candidates=pile.filter(id=>!protectedIds.includes(id));if(!candidates.length)candidates=[...pile];
 const card=pick?.(state,actor,candidates,{context,usual})??usual;
 if(card!==usual&&!candidates.includes(card))throw Error('Invalid card selection.');
 return pile.splice(pile.indexOf(card),1)[0];
}
