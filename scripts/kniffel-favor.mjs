import {kniffelFields,kniffelValue} from './kniffel-engine.mjs';

// Construct complete legal goals around the dice the player actually kept.
// Convert goals back to fresh RNG draws, preserving original slot order and the W10 zero face.
export function kniffelGoalDraws(s,id){
 const extreme=s.variant==='extreme',count=extreme?6:5,c=s.cup,open=new Set(kniffelFields(s).filter(k=>s.sheets[id][k]===null)),goals=[],seen=new Set(),draws=[];
 const add=g=>goals.push(g),dynamic=(face,last=face)=>Array.from({length:count},(_,i)=>c.held[i]?c.dice[i]:extreme&&i===5?last:face);
 for(let face=1;face<=6;face++)add(dynamic(face));
 add(dynamic(6,extreme?9:6));add(dynamic(1,extreme?0:1));
 const groups=(sizes)=>{
  const walk=(at,used,hand)=>{if(at===sizes.length){add(hand);return;}for(let face=1;face<=6;face++)if(!used.includes(face))walk(at+1,[...used,face],[...hand,...Array(sizes[at]).fill(face)]);};walk(0,[],[]);
 };
 if(open.has('fullHouse'))groups(extreme?[3,2,1]:[3,2]);
 if(open.has('largeFullHouse'))groups([4,2]);
 if(open.has('twoTriples'))groups([3,3]);
 if(open.has('threePairs')||open.has('twoPairs'))groups([2,2,2]);
 const run=(size)=>{for(let start=extreme?0:1;start+size-1<=(extreme?9:6);start++){
  const base=Array.from({length:size},(_,i)=>start+i),rest=count-size;
  if(!rest)add(base);else for(let face=extreme?0:1;face<=(extreme?9:6);face++)add([...base,...Array(rest).fill(face)]);
 }};
 if(open.has('smallStraight'))run(4);if(open.has('largeStraight'))run(5);if(open.has('highway'))run(6);
 for(const goal of goals){
  const remaining=[...goal],hand=Array(count).fill(null);let valid=true;
  for(let i=0;i<count;i++)if(c.held[i]){const at=remaining.indexOf(c.dice[i]);if(at<0){valid=false;break;}hand[i]=remaining.splice(at,1)[0];}
  if(!valid)continue;
  // Values outside 1–6 can only occupy the Extreme W10 slot.
  if(extreme&&!c.held[5]){let at=remaining.findIndex(v=>v<1||v>6);if(at<0)at=remaining.length-1;hand[5]=remaining.splice(at,1)[0];}
  for(let i=0;i<count;i++)if(hand[i]===null)hand[i]=remaining.shift();
  if(!hand.every((v,i)=>Number.isInteger(v)&&v>=(extreme&&i===5?0:1)&&v<=(extreme&&i===5?9:6)))continue;
  const fresh=hand.flatMap((v,i)=>c.held[i]?[]:[extreme&&i===5&&v===0?10:v]),key=fresh.join(',');if(!seen.has(key)){seen.add(key);draws.push(fresh);}
 }
 return draws;
}

export function kniffelFavorScore(before,after,id){
 const fields=kniffelFields(after),sheet=after.sheets[id],dice=after.cup.dice,extreme=after.variant==='extreme',held=before.cup.held.flatMap((keep,i)=>keep?[before.cup.dice[i]]:[]),upper=fields.slice(0,6).reduce((n,k)=>n+(sheet[k]??0),0),threshold=extreme?73:63;
 return Math.max(...fields.filter(k=>sheet[k]===null).map(field=>{
  const v=kniffelValue(dice,field,sheet,after.variant);if(!v.points&&!v.extra)return 0;
  const at=fields.indexOf(field),isUpper=at<6,maximum=isUpper?(at+1)*(extreme?6:5):({fullHouse:25,largeFullHouse:45,smallStraight:30,largeStraight:40,highway:50,kniffel:50,extremeKniffel:75,threePairs:35,twoTriples:45,tenOrLess:40,thirtyThreeOrMore:40,superChance:78}[field]??(extreme?39:30));
  let alignment=0;
  if(held.length){
   if(isUpper)alignment=held.filter(n=>n===at+1).length/held.length;
   else if(['smallStraight','largeStraight','highway'].includes(field))alignment=new Set(held).size===held.length?1:0;
   else if(['threeKind','fourKind','kniffel','extremeKniffel'].includes(field))alignment=Math.max(...held.map(n=>held.filter(v=>v===n).length))/held.length;
   else if(['fullHouse','largeFullHouse','twoTriples','threePairs','twoPairs'].includes(field))alignment=1;
  }
  const bonus=isUpper&&upper<threshold&&upper+v.points>=threshold?(extreme?45:35):0;
  const rare={fullHouse:6,largeFullHouse:8,smallStraight:6,largeStraight:8,highway:10,kniffel:12,extremeKniffel:15,chance:-10,superChance:-12}[field]??0;
  return v.points+v.extra+bonus+12*Math.min(1,v.points/maximum)+20*alignment+rare;
 }));
}
