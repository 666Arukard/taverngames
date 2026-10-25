// Public tournament results only; independent of Foundry and game mechanics.
export function bracketModel(state){
 const matches=state?.matches??[],first=matches.filter(m=>m.stage===1);if(!first.length)return {rounds:[],champion:null};
 const depth=Math.ceil(Math.log2(first.length*2)),rounds=[];
 for(let stage=1;stage<=depth;stage++){const recorded=matches.filter(m=>m.stage===stage),count=first.length/2**(stage-1),previous=rounds[stage-2];rounds.push(Array.from({length:count},(_,i)=>{const m=recorded[i],a=m?.a??previous?.[i*2]?.winner??null,b=m?.b??previous?.[i*2+1]?.winner??null;return {stage,index:i,a,b,winner:m?.winner??null,bye:!!m?.bye,byLot:!!m?.byLot,losers:m?.winner?[a,b].filter(id=>id&&id!==m.winner):[]};}));}
 return {rounds,champion:rounds.at(-1)?.[0]?.winner??null};
}
