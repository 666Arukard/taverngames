import {startingOrder,chosenStarter} from './start-choice.mjs';
// PlayMonster scoring. Selection is confined to the dice of the latest roll.
const check=(ok,message)=>{if(!ok)throw new Error(message);};
function groupScore(dice,rules){
  const counts=Array(7).fill(0);for(const die of dice)counts[die]++;
  if(dice.length===1)return dice[0]===1?100:dice[0]===5?50:0;
  const groups=counts.filter(Boolean).sort((a,b)=>a-b);
  if(groups.length===1){const n=dice.length;if(rules.onesBonus&&dice[0]===1&&n>=3)return (n-2)*1000;return n===3?dice[0]*100:n===4?1000:n===5?2000:n===6?3000:0;}
  if(rules.smallStraight&&dice.length===5&&groups.length===5){const ordered=[...dice].sort((a,b)=>a-b);if(ordered[4]-ordered[0]===4)return 750;}
  if(dice.length===6){
    if(groups.length===6)return 1500;
    if(groups.join(',')==='2,2,2'||groups.join(',')==='2,4')return 1500;
    if(groups.join(',')==='3,3')return 2500;
  }
  return 0;
}
export function scoreDice(dice,rules={}){
  check(Array.isArray(dice)&&dice.length<=6&&dice.every(n=>Number.isInteger(n)&&n>=1&&n<=6),'Invalid dice.');
  if(!dice.length)return null;
  const memo=new Map();
  function score(mask){
    if(!mask)return 0;if(memo.has(mask))return memo.get(mask);
    const first=mask&-mask;let best=null;
    for(let sub=mask;sub;sub=(sub-1)&mask){
      if(!(sub&first))continue;
      const group=dice.filter((_n,index)=>sub&(1<<index)),points=groupScore(group,rules);if(!points)continue;
      const rest=score(mask^sub);if(rest!==null)best=Math.max(best??0,points+rest);
    }
    memo.set(mask,best);return best;
  }
  return score((1<<dice.length)-1);
}
export function bestSelection(dice,indices=dice.map((_n,index)=>index),rules={}){
  let best={indices:[],score:0};
  for(let mask=1;mask<(1<<indices.length);mask++){
    const chosen=indices.filter((_index,bit)=>mask&(1<<bit)),score=scoreDice(chosen.map(index=>dice[index]),rules);
    if(score!==null&&(score>best.score||(score===best.score&&chosen.length>best.indices.length)))best={indices:chosen,score};
  }
  return best;
}
const newCup=()=>({dice:null,held:Array(6).fill(false),fresh:[],selected:[],points:0,rolls:0,hot:0});
export function createFarkle({mode='quick',target=10000,roundLimit=3,entry=mode==='target'?500:0,npcs={},rules={}}={}){
  check(['quick','rounds','target'].includes(mode),'Invalid game mode.');
  check(Number.isInteger(target)&&target>=500&&target<=1000000,'Target must be between 500 and 1,000,000.');
  check(Number.isInteger(entry)&&entry>=0&&entry<=(mode==='target'?target:1000000),'Invalid entry minimum.');
  check(Number.isInteger(roundLimit)&&roundLimit>=1&&roundLimit<=100,'Round count must be between 1 and 100.');
  check(rules&&typeof rules==='object'&&!Array.isArray(rules)&&Object.entries(rules).every(([key,value])=>['smallStraight','onesBonus','immediateTarget'].includes(key)&&typeof value==='boolean'),'Invalid optional rules.');
  check(npcs&&typeof npcs==='object'&&!Array.isArray(npcs)&&Object.keys(npcs).length<=20,'Invalid NPCs.');
  for(const [id,name] of Object.entries(npcs))check(id.startsWith('npc-')&&id.length<=64&&typeof name==='string'&&name.trim()&&name.length<=60,'Invalid NPC.');
  const players=Object.keys(npcs);
  return {version:1,game:'farkle',revision:0,phase:'lobby',paused:false,mode,target,roundLimit,round:0,entry,rules:{smallStraight:false,onesBonus:false,immediateTarget:false,...rules},players,npcs:structuredClone(npcs),npcManual:{},scores:Object.fromEntries(players.map(id=>[id,0])),order:[],turn:0,turnNumber:0,cup:null,finalRemaining:null,log:[]};
}
function outcome(s){
  s.phase='finished';s.cup=null;
  const values=s.players.map(id=>s.scores[id]),high=Math.max(...values),low=Math.min(...values);
  s.draw=s.players.length>1&&high===low;
  s.winners=s.draw?[]:s.players.filter(id=>s.scores[id]===high);
  s.losers=s.draw||s.players.length===1?[]:s.players.filter(id=>s.scores[id]===low);
}
function endTurn(s,bust){
  const id=s.order[s.turn],amount=bust?0:s.cup.points;
  s.scores[id]+=amount;s.log=[...s.log,{type:bust?'bust':'bank',id,amount,total:s.scores[id],round:s.round,lost:bust?s.cup.points:0}].slice(-80);
  if(s.mode==='target'&&s.rules?.immediateTarget&&s.scores[id]>=s.target){outcome(s);return;}
  if(s.mode==='quick'){if(s.turn===s.order.length-1){outcome(s);return;}}
  else if(s.mode==='rounds'){if(s.turn===s.order.length-1&&s.round>=s.roundLimit){outcome(s);return;}}
  else if(s.finalRemaining===null&&s.scores[id]>=s.target)s.finalRemaining=s.order.length-1;
  else if(s.finalRemaining!==null)s.finalRemaining--;
  if(s.mode==='target'&&s.finalRemaining===0){outcome(s);return;}
  s.turn=(s.turn+1)%s.order.length;if(s.turn===0)s.round++;s.turnNumber++;s.cup=newCup();
}
export function selectionScore(s){return s?.cup?.dice?scoreDice(s.cup.selected.map(index=>s.cup.dice[index]),s.rules):null;}
function commit(s){
  const c=s.cup,score=selectionScore(s);check(score!==null&&score>0,'Choose a scoring combination from this roll.');
  c.points+=score;for(const index of c.selected)c.held[index]=true;c.selected=[];
  if(c.held.every(Boolean)){c.held.fill(false);c.dice=null;c.fresh=[];c.hot++;}
}
export function actFarkle(original,actor,action,args={},diceSource=()=>1,gm=false){
  const s=structuredClone(original);check(s?.version===1&&s.game==='farkle','No Farkle game exists.');
  if(s.phase==='playing')s.round??=Math.floor((s.turnNumber-1)/s.order.length)+1;
  check(!['finished','aborted'].includes(s.phase),'This game has ended.');
  if(action==='abort'){check(gm,'GM only.');s.phase='aborted';s.paused=true;s.cup=null;}
  else if(action==='pause'){check(gm,'GM only.');s.paused=!s.paused;}
  else if(action==='npcControl'){
    check(gm,'GM only.');check(Object.hasOwn(s.npcs,args.id)&&typeof args.manual==='boolean','Invalid NPC control.');s.npcManual[args.id]=args.manual;
  }else if(action==='join'||action==='leave'){
    check(s.phase==='lobby','You can only join in the lobby.');check(typeof actor==='string'&&actor.length<=64&&!actor.startsWith('npc-'),'Invalid participant.');
    if(action==='join'){check(!s.players.includes(actor),'You have already joined.');check(s.players.length<20,'The table is full.');s.players.push(actor);s.scores[actor]=0;}
    else{check(s.players.includes(actor),'You have not joined.');s.players=s.players.filter(id=>id!==actor);delete s.scores[actor];}
  }else if(action==='begin'){
    check(gm&&s.phase==='lobby','Only the GM can start the lobby.');check(s.players.length>=(s.mode==='target'?1:2),'Not enough participants.');
    s.order=[...s.players.filter(id=>!s.npcs[id]),...s.players.filter(id=>s.npcs[id])];
    const selected=chosenStarter(s);if(selected){const i=s.order.indexOf(selected);s.order=[...s.order.slice(i),...s.order.slice(0,i)];s.startRolls=[];}
    else if(s.mode==='target'){
      s.startRolls=s.order.map(id=>{const value=diceSource();check(Number.isInteger(value)&&value>=1&&value<=6,'Invalid random value.');return {id,value};});
      const highest=Math.max(...s.startRolls.map(roll=>roll.value)),first=s.order.indexOf(s.startRolls.find(roll=>roll.value===highest).id);
      s.order=[...s.order.slice(first),...s.order.slice(0,first)];
    }
    s.turn=0;s.round=1;s.turnNumber=1;s.cup=newCup();s.phase='playing';s.paused=false;
  }else{
    check(s.phase==='playing'&&!s.paused,'The game is not running.');check(actor===s.order[s.turn]||gm,'It is not your turn.');
    const c=s.cup;
    if(action==='toggle'){
      check(Number.isInteger(args.index)&&c.fresh.includes(args.index)&&!c.held[args.index],'Only dice from the latest roll may be selected.');
      c.selected=c.selected.includes(args.index)?c.selected.filter(index=>index!==args.index):[...c.selected,args.index];
    }else if(action==='select'){
      check(Array.isArray(args.indices)&&new Set(args.indices).size===args.indices.length&&args.indices.every(index=>Number.isInteger(index)&&c.fresh.includes(index)&&!c.held[index]),'Only dice from the latest roll may be selected.');c.selected=[...args.indices];
    }else if(action==='roll'){
      if(c.dice!==null)commit(s);
      c.dice??=Array(6).fill(null);c.fresh=[];c.selected=[];
      c.dice=c.dice.map((value,index)=>{if(c.held[index])return value;const die=diceSource();check(Number.isInteger(die)&&die>=1&&die<=6,'Invalid random value.');c.fresh.push(index);return die;});c.rolls++;
      if(!bestSelection(c.dice,c.fresh,s.rules).score)endTurn(s,true);
    }else if(action==='bank'){
      check(c.dice!==null,'Roll first.');commit(s);
      check(s.scores[s.order[s.turn]]>0||c.points>=s.entry,'Entry minimum has not been reached.');endTurn(s,false);
    }else throw new Error('Unknown action.');
  }
  s.revision++;return s;
}
export function farkleNpcAction(s){
  if(!s||s.phase!=='playing'||s.paused)return null;
  const id=s.order[s.turn];if(!s.npcs[id]||s.npcManual[id])return null;
  const c=s.cup;if(c.dice===null)return {id,action:'roll'};
  if(!c.selected.length)return {id,action:'select',args:{indices:bestSelection(c.dice,c.fresh,s.rules).indices}};
  const total=c.points+(selectionScore(s)??0),remaining=6-c.held.filter(Boolean).length-c.selected.length;
  const canBank=s.scores[id]>0||total>=s.entry;
  return {id,action:canBank&&(total>=750||(remaining<=2&&total>=250)||s.mode==='target'&&total>=500)?'bank':'roll'};
}
