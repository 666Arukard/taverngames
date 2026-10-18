export const EXTREME_FIELDS=['ones','twos','threes','fours','fives','sixes','threeKind','twoPairs','fourKind','threePairs','twoTriples','fullHouse','largeFullHouse','smallStraight','largeStraight','highway','kniffel','extremeKniffel','tenOrLess','thirtyThreeOrMore','chance','superChance'];
export const isExtreme=s=>s?.variant==='extreme';
export function extremeValue(dice,field){
 if(!EXTREME_FIELDS.includes(field))throw Error('Invalid score field.');
 if(!Array.isArray(dice)||dice.length!==6||!dice.every((v,i)=>Number.isInteger(v)&&v>=(i===5?0:1)&&v<=(i===5?9:6)))throw Error('Roll first.');
 const counts=Array.from({length:10},(_,i)=>dice.filter(v=>v===i).length),sum=dice.reduce((a,b)=>a+b,0),index=EXTREME_FIELDS.indexOf(field);
 if(index<6)return {points:counts[index+1]*(index+1),extra:0};
 const run=n=>Array.from({length:11-n},(_,start)=>Array.from({length:n},(_,i)=>start+i).every(v=>counts[v]>0)).some(Boolean);
 const values={threeKind:Math.max(...counts)>=3?sum:0,twoPairs:counts.filter(n=>n>=2).length>=2?sum:0,fourKind:Math.max(...counts)>=4?sum:0,threePairs:counts.filter(n=>n===2).length===3?35:0,twoTriples:counts.filter(n=>n===3).length===2?45:0,fullHouse:counts.some((n,i)=>n>=3&&counts.some((m,j)=>j!==i&&m>=2))?25:0,largeFullHouse:counts.includes(4)&&counts.includes(2)?45:0,smallStraight:run(4)?30:0,largeStraight:run(5)?40:0,highway:run(6)?50:0,kniffel:Math.max(...counts)>=5?50:0,extremeKniffel:counts.includes(6)?75:0,tenOrLess:sum<=10?40:0,thirtyThreeOrMore:sum>=33?40:0,chance:sum,superChance:sum*2};
 return {points:values[field],extra:0};
}
export function extremeTotal(sheet){const upper=EXTREME_FIELDS.slice(0,6).reduce((n,k)=>n+(sheet[k]??0),0),bonus=upper>=73?45:0;return {upper,bonus,extra:0,total:EXTREME_FIELDS.reduce((n,k)=>n+(sheet[k]??0),0)+bonus};}
export function extremeNpcAction(s){
 const id=s.order[s.turn],c=s.cup,sheet=s.sheets[id];if(!c.dice)return {id,action:'roll'};
 const choices=EXTREME_FIELDS.filter(k=>sheet[k]===null).map(field=>({field,...extremeValue(c.dice,field)}));
 const weight=p=>p.points+({extremeKniffel:15,kniffel:10,highway:10,largeFullHouse:8,twoTriples:8,threePairs:6,superChance:-12,chance:-10}[p.field]??0)*(p.points>0);
 choices.sort((a,b)=>weight(b)-weight(a));const best=choices[0],score=()=>({id,action:'score',args:{field:best.field,confirmZero:best.points===0}});
 if(c.rolls>=3+(c.chipUsed?1:0)){if(c.rolls===3&&!c.chipUsed&&s.chips[id]>0&&best.points<20)return {id,action:'useChip'};return score();}
 if(best.points>=40&&!['superChance','chance','threeKind','fourKind','twoPairs'].includes(best.field))return score();
 const counts=Array.from({length:7},(_,v)=>c.dice.filter(n=>n===v).length),face=counts.reduce((b,n,i)=>n>=counts[b]?i:b,1);
 let desired=c.dice.map(n=>n===face);
 if(Math.max(...counts)<3&&['highway','largeStraight','smallStraight'].some(k=>sheet[k]===null)){
  const size=sheet.highway===null?6:sheet.largeStraight===null?5:4,candidates=Array.from({length:11-size},(_,start)=>Array.from({length:size},(_,i)=>start+i));candidates.sort((a,b)=>b.filter(n=>c.dice.includes(n)).length-a.filter(n=>c.dice.includes(n)).length);
  if(candidates[0].filter(n=>c.dice.includes(n)).length>=3){const seen=new Set();desired=c.dice.map(n=>{if(!candidates[0].includes(n)||seen.has(n))return false;seen.add(n);return true;});}
 }
 const index=c.held.findIndex((v,i)=>v!==desired[i]);if(index>=0)return {id,action:desired[index]?'hold':'return',args:{index}};
 return c.held.every(Boolean)?score():{id,action:'roll'};
}
