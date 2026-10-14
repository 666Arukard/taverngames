export const KNIFFEL_FIELDS=['ones','twos','threes','fours','fives','sixes','threeKind','fourKind','fullHouse','smallStraight','largeStraight','kniffel','chance'];
const check=(ok,message)=>{if(!ok)throw new Error(message);};
const freshCup=()=>({dice:null,held:Array(5).fill(false),rolls:0});
const blank=()=>Object.fromEntries(KNIFFEL_FIELDS.map(k=>[k,null]));
export function kniffelTotal(sheet,extra=0){const upper=KNIFFEL_FIELDS.slice(0,6).reduce((n,k)=>n+(sheet[k]??0),0);return {upper,bonus:upper>=63?35:0,extra,total:KNIFFEL_FIELDS.reduce((n,k)=>n+(sheet[k]??0),0)+(upper>=63?35:0)+extra};}
export function kniffelValue(dice,field,sheet=blank()){
  check(KNIFFEL_FIELDS.includes(field),'Invalid score field.');
  check(Array.isArray(dice)&&dice.length===5&&dice.every(n=>Number.isInteger(n)&&n>=1&&n<=6),'Roll first.');
  const counts=Array.from({length:6},(_,i)=>dice.filter(n=>n===i+1).length),sum=dice.reduce((a,b)=>a+b,0),five=counts.includes(5);
  const repeat=five&&sheet.kniffel===50;
  const index=KNIFFEL_FIELDS.indexOf(field);
  if(repeat)return {points:index<6?5*(index+1):({threeKind:30,fourKind:30,fullHouse:25,smallStraight:30,largeStraight:40,kniffel:50,chance:30})[field],extra:50};
  if(index<6)return {points:counts[index]*(index+1),extra:0};
  const run=n=>Array.from({length:7-n},(_,start)=>Array.from({length:n},(_,j)=>start+j+1).every(v=>counts[v-1]>0)).some(Boolean);
  const points={threeKind:Math.max(...counts)>=3?sum:0,fourKind:Math.max(...counts)>=4?sum:0,fullHouse:counts.includes(3)&&counts.includes(2)?25:0,smallStraight:run(4)?30:0,largeStraight:run(5)?40:0,kniffel:five?50:0,chance:sum}[field];
  return {points,extra:0};
}
export function createKniffel({npcs={}}={}){
  check(npcs&&typeof npcs==='object'&&!Array.isArray(npcs)&&Object.keys(npcs).length<=8,'Invalid NPCs.');
  for(const [id,name] of Object.entries(npcs))check(id.startsWith('npc-')&&typeof name==='string'&&name.trim()&&name.length<=60,'Invalid NPCs.');
  const players=Object.keys(npcs);
  return {version:1,game:'kniffel',phase:'lobby',revision:0,paused:false,npcs:structuredClone(npcs),npcManual:{},players,scores:Object.fromEntries(players.map(id=>[id,0])),sheets:Object.fromEntries(players.map(id=>[id,blank()])),extras:Object.fromEntries(players.map(id=>[id,0])),order:[],turn:0,round:1,cup:null,tickets:[],log:[],stake:0,currency:'gp',funding:'redistribute'};
}
export function actKniffel(original,actor,action,args={},random=()=>1,gm=false){
  const s=structuredClone(original);check(s?.version===1&&s.game==='kniffel','No game exists.');check(!['finished','aborted'].includes(s.phase),'This game has ended.');
  const roll=()=>{const n=random(6);check(Number.isInteger(n)&&n>=1&&n<=6,'Invalid random value.');return n;};
  if(action==='abort'){check(gm,'GM only.');s.phase='aborted';s.paused=true;s.cup=null;}
  else if(action==='pause'){check(gm,'GM only.');s.paused=!s.paused;}
  else if(action==='npcControl'){check(gm&&Object.hasOwn(s.npcs,args.id)&&typeof args.manual==='boolean','GM only.');s.npcManual[args.id]=args.manual;}
  else if(action==='join'||action==='leave'){
    check(s.phase==='lobby'&&!s.paused,'Join in the lobby.');check(typeof actor==='string'&&!actor.startsWith('npc-')&&actor.length<=64,'Invalid participant.');
    if(action==='join'){check(!s.players.includes(actor)&&s.players.length<8,'Invalid participant.');s.players.push(actor);s.sheets[actor]=blank();s.extras[actor]=0;s.scores[actor]=0;}
    else{check(s.players.includes(actor),'Invalid participant.');s.players=s.players.filter(id=>id!==actor);delete s.sheets[actor];delete s.extras[actor];delete s.scores[actor];}
  }else if(action==='begin'){
    check(gm&&s.phase==='lobby'&&!s.paused,'GM only.');check(s.players.length>=2,'Not enough participants.');
    // Highest preparation roll begins. Only tied leaders reroll; a deterministic
    // tie fallback after 100 attempts prevents a broken RNG blocking the GM.
    let candidates=[...s.players];s.startRolls=[];
    for(let attempt=0;candidates.length>1&&attempt<100;attempt++){
      const results=candidates.map(id=>({id,value:roll()}));s.startRolls.push(results);const high=Math.max(...results.map(r=>r.value));candidates=results.filter(r=>r.value===high).map(r=>r.id);
    }
    const first=candidates[0],index=s.players.indexOf(first);s.order=[...s.players.slice(index),...s.players.slice(0,index)];s.phase='playing';s.cup=freshCup();
  }else{
    check(s.phase==='playing'&&!s.paused,'The game is not running.');check(actor===s.order[s.turn]||gm,'It is not your turn.');const c=s.cup,id=s.order[s.turn];
    if(action==='roll'){check(c.rolls<3,'No rolls left.');check(!c.held.every(Boolean),'Return at least one die.');c.dice=(c.dice??Array(5).fill(null)).map((n,i)=>c.held[i]?n:roll());c.rolls++;}
    else if(action==='hold'||action==='return'){check(c.dice&&Number.isInteger(args.index)&&args.index>=0&&args.index<5,'Invalid die.');c.held[args.index]=action==='hold';}
    else if(action==='score'){
      const field=args.field;check(KNIFFEL_FIELDS.includes(field)&&s.sheets[id][field]===null,'Invalid score field.');const value=kniffelValue(c.dice,field,s.sheets[id]);
      check(value.points!==0||args.confirmZero===true,'Confirm zero score.');s.sheets[id][field]=value.points;s.extras[id]+=value.extra;s.scores[id]=kniffelTotal(s.sheets[id],s.extras[id]).total;
      s.log.push({id,field,...value,dice:[...c.dice],rolls:c.rolls,round:s.round});
      if(s.players.every(pid=>KNIFFEL_FIELDS.every(k=>s.sheets[pid][k]!==null))){
        const high=Math.max(...Object.values(s.scores)),low=Math.min(...Object.values(s.scores));s.phase='finished';s.cup=null;s.winners=s.players.filter(pid=>s.scores[pid]===high);s.losers=s.players.filter(pid=>s.scores[pid]===low&&low<high);s.draw=s.winners.length>1;
      }else{s.turn=(s.turn+1)%s.order.length;if(!s.turn)s.round++;s.cup=freshCup();}
    }else throw new Error('Unknown action.');
  }
  s.log=s.log.slice(-110);s.revision++;return s;
}
export function kniffelNpcAction(s){
  if(!s||s.paused||s.phase!=='playing')return null;const id=s.order[s.turn];if(!s.npcs[id]||s.npcManual[id])return null;
  const c=s.cup,sheet=s.sheets[id];if(!c.dice)return {id,action:'roll'};
  // Preserve scarce combinations rather than spending them on Chance or
  // discarding a straight while chasing repeated faces.
  const priority=choice=>choice.points+choice.extra+(choice.points>0?({fullHouse:8,smallStraight:8,largeStraight:8,kniffel:12,chance:-8}[choice.field]??0):0);
  const choices=KNIFFEL_FIELDS.filter(k=>sheet[k]===null).map(field=>({field,...kniffelValue(c.dice,field,sheet)})).sort((a,b)=>priority(b)-priority(a));
  const best=choices[0],score=()=>({id,action:'score',args:{field:best.field,confirmZero:true}});
  if(c.rolls===3||best.extra||best.field==='kniffel'&&best.points===50||best.field==='largeStraight'&&best.points===40||best.field==='fullHouse'&&best.points===25)return score();
  const counts=Array.from({length:6},(_,i)=>c.dice.filter(n=>n===i+1).length),face=counts.reduce((best,n,i)=>n>=counts[best]?i:best,0)+1;
  let desired=c.dice.map(n=>n===face);
  if(sheet.largeStraight===null||sheet.smallStraight===null){
    const size=sheet.largeStraight===null?5:4,candidates=Array.from({length:7-size},(_,start)=>Array.from({length:size},(_,j)=>start+j+1));
    candidates.sort((a,b)=>b.filter(n=>counts[n-1]>0).length-a.filter(n=>counts[n-1]>0).length);
    const target=candidates[0],progress=target.filter(n=>counts[n-1]>0).length;
    if(progress>=3&&Math.max(...counts)<3){
      const seen=new Set();desired=c.dice.map(n=>{if(!target.includes(n)||seen.has(n))return false;seen.add(n);return true;});
    }
  }
  if(best.field==='smallStraight'&&best.points===30&&sheet.largeStraight!==null)return score();
  const index=c.held.findIndex((held,i)=>held!==desired[i]);
  if(index>=0)return {id,action:desired[index]?'hold':'return',args:{index}};
  if(c.held.every(Boolean))return score();
  return {id,action:'roll'};
}
