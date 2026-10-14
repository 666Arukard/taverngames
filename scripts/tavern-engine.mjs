import {createKniffel,actKniffel,kniffelNpcAction} from './kniffel-engine.mjs';
export const NEW_GAMES=['pig','ship','lottery','kniffel'];
const check=(ok,message)=>{if(!ok)throw new Error(message);};
const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const cup=game=>game==='pig'?{dice:[],points:0,rolls:0,bust:false,lost:0}:{dice:null,held:Array(5).fill(false),stage:0,rolls:0};
export function createTavern(game,{npcs={},target=100,stake=2,currency='gp',funding='redistribute',mode='single',roundLimit=3,prize='',prizeUuid='',prizeValue=25,maxTickets=20,perPlayer=2,numbersPerTicket=5}={}){
  if(game==='kniffel')return createKniffel({npcs});
  check(NEW_GAMES.includes(game),'Unknown game.');check(integer(target,10,1000000),'Invalid target.');
  check(integer(stake,0,1000000),'Invalid stake.');check(integer(maxTickets,1,20)&&integer(perPlayer,1,maxTickets),'Invalid ticket limits.');
  check(integer(numbersPerTicket,1,100),'Numbers per ticket must be between 1 and 100.');
  check(['cp','sp','ep','gp','pp'].includes(currency)&&['bank','redistribute'].includes(funding),'Invalid currency or funding.');
  check(['single','rounds','endless'].includes(mode)&&integer(roundLimit,1,100),'Invalid round mode.');
  check(typeof prizeUuid==='string'&&(!prizeUuid||/^(?:Actor\.[\w-]+\.)?Item\.[\w-]+$/.test(prizeUuid)),'Select a world item or inventory item.');
  check(typeof prize==='string'&&prize.length<=240&&integer(prizeValue,0,100000000),'Invalid prize.');
  check(npcs&&typeof npcs==='object'&&!Array.isArray(npcs)&&Object.keys(npcs).length<=20,'Invalid NPCs.');
  for(const [id,name] of Object.entries(npcs))check(id.startsWith('npc-')&&typeof name==='string'&&name.trim()&&name.length<=60,'Invalid NPCs.');
  const players=Object.keys(npcs);
  return {version:1,game,phase:'lobby',revision:0,paused:false,npcs:structuredClone(npcs),npcManual:{},players,scores:Object.fromEntries(players.map(id=>[id,0])),order:[],turn:0,round:1,cup:null,target,stake,currency,funding,mode,roundLimit,stopAfterRound:false,prize:prize.trim(),prizeUuid,prizeValue,maxTickets,perPlayer,numbersPerTicket,tickets:[],finalRemaining:null,tieBreak:0,tieScores:{},log:[],rollHistory:[]};
}
function finish(s,winners,losers){s.phase='finished';s.cup=null;s.winners=winners;s.losers=losers;s.draw=winners.length>1;}
function pigEnd(s,bust){
  const id=s.order[s.turn],amount=bust?0:s.cup.points;s.scores[id]+=amount;
  s.log.push({id,type:bust?'bust':'bank',amount,total:s.scores[id],...(bust?{lost:s.cup.lost??0}:{})});
  if(s.finalRemaining===null&&s.scores[id]>=s.target)s.finalRemaining=s.order.length-1;
  else if(s.finalRemaining!==null)s.finalRemaining--;
  if(s.finalRemaining===0){const scores=Object.values(s.scores),high=Math.max(...scores),low=Math.min(...scores);finish(s,s.players.filter(id=>s.scores[id]===high),s.players.filter(id=>s.scores[id]===low&&low<high));return;}
  s.turn=(s.turn+1)%s.order.length;if(!s.turn)s.round++;s.cup=cup('pig');
}
function shipEnd(s){
  const c=s.cup,id=s.order[s.turn],score=c.stage===3?c.dice.filter((_n,i)=>!c.held[i]).reduce((a,b)=>a+b,0):0;
  if(s.tieBreak)s.tieScores[id]=score;else s.scores[id]+=score;s.log.push({id,type:'cargo',amount:score,tieBreak:s.tieBreak,round:s.round});
  if(s.turn<s.order.length-1){s.turn++;s.cup=cup('ship');return;}
  if(!s.tieBreak&&s.mode!=='single'&&!s.stopAfterRound&&(s.mode==='endless'||s.round<s.roundLimit)){
    const ids=[...s.order];ids.unshift(ids.pop());s.order=ids;s.round++;s.turn=0;s.cup=cup('ship');return;
  }
  const scores=s.tieBreak?s.tieScores:s.scores,high=Math.max(...s.order.map(id=>scores[id])),leaders=s.order.filter(id=>scores[id]===high);
  if(leaders.length===1){finish(s,leaders,s.players.filter(id=>id!==leaders[0]));return;}
  s.order=leaders;s.turn=0;s.tieBreak++;s.tieScores={};s.cup=cup('ship');
}
export function actTavern(original,actor,action,args={},random=sides=>1,gm=false){
  if(original?.game==='kniffel')return actKniffel(original,actor,action,args,random,gm);
  const s=structuredClone(original);check(s?.version===1&&NEW_GAMES.includes(s.game),'No game exists.');
  check(!['finished','aborted'].includes(s.phase),'This game has ended.');
  const roll=sides=>{const n=random(sides);check(integer(n,1,sides),'Invalid random value.');return n;};
  if(action==='abort'){check(gm,'GM only.');s.phase='aborted';s.paused=true;s.cup=null;}
  else if(action==='pause'){check(gm,'GM only.');s.paused=!s.paused;}
  else if(action==='finishRound'){check(gm&&s.game==='ship'&&s.mode==='endless'&&s.phase==='playing'&&!s.tieBreak,'GM only.');s.stopAfterRound=true;}
  else if(action==='npcControl'){check(gm&&Object.hasOwn(s.npcs,args.id)&&typeof args.manual==='boolean','GM only.');s.npcManual[args.id]=args.manual;}
  else if(action==='join'||action==='leave'){
    check(s.phase==='lobby'&&!s.paused,'Join in the lobby.');check(typeof actor==='string'&&!actor.startsWith('npc-')&&actor.length<=64,'Invalid participant.');
    if(action==='join'){check(!s.players.includes(actor)&&s.players.length<20,'Invalid participant.');s.players.push(actor);s.scores[actor]=0;}
    else{check(s.players.includes(actor)&&!s.tickets.some(t=>t.id===actor),'Committed tickets cannot be withdrawn.');s.players=s.players.filter(id=>id!==actor);delete s.scores[actor];}
  }else if(action==='ticket'){
    check(s.game==='lottery'&&s.phase==='lobby'&&!s.paused&&s.players.includes(actor),'Ticket acceptance is closed.');
    check(s.tickets.length<s.maxTickets&&s.tickets.filter(t=>t.id===actor).length<s.perPlayer,'Ticket limit reached.');
    const numbers=args.numbers,used=new Set(s.tickets.flatMap(t=>t.numbers));
    const count=s.numbersPerTicket??5;
    check(Array.isArray(numbers)&&numbers.length===count&&new Set(numbers).size===count&&numbers.every(n=>integer(n,1,100)&&!used.has(n)),'Choose the required number of different available numbers.');
    s.tickets.push({id:actor,numbers:[...numbers].sort((a,b)=>a-b)});
  }else if(action==='begin'){
    check(gm&&s.phase==='lobby'&&!s.paused,'GM only.');
    if(s.game==='lottery'){check(s.tickets.length>0&&s.prize,'A prize and at least one ticket are required.');s.phase='closed';}
    else{check(s.players.length>=2,'Not enough participants.');s.order=s.startOrder??[...s.players.filter(id=>!s.npcs[id]),...s.players.filter(id=>s.npcs[id])];s.startOrder=[...s.order];s.phase='playing';s.cup=cup(s.game);}
  }else if(s.game==='lottery'){
    check(action==='draw'&&gm&&s.phase==='closed'&&!s.paused,'GM only.');s.result=roll(100);
    const winner=s.tickets.find(t=>t.numbers.includes(s.result))?.id,entrants=[...new Set(s.tickets.map(t=>t.id))];
    finish(s,winner?[winner]:[],entrants.filter(id=>id!==winner));
  }else{
    check(s.phase==='playing'&&!s.paused,'The game is not running.');check(actor===s.order[s.turn]||gm,'It is not your turn.');
    const c=s.cup;
    if(s.game==='pig'){
      if(action==='next'){check(c.bust,'No bust to confirm.');pigEnd(s,true);}
      else if(c.bust)throw new Error('Confirm the bust before continuing.');
      else if(action==='roll'){
        const n=roll(6),id=s.order[s.turn];c.dice=[...c.dice,n].slice(-30);c.rolls++;if(n===1){c.bust=true;c.lost=c.points;c.points=0;}else c.points+=n;
        s.rollHistory??=[];s.rollHistory.push({id,round:s.round,roll:c.rolls,value:n,points:c.points,lost:c.lost,bust:c.bust});
        const own=s.rollHistory.filter(r=>r.id===id).slice(-20);s.rollHistory=s.rollHistory.filter(r=>r.id!==id).concat(own);
      }
      else if(action==='bank'){check(c.points>0,'Roll first.');pigEnd(s,false);}
      else throw new Error('Unknown action.');
    }else if(action==='roll'){
      check(c.rolls<3,'No rolls left.');c.dice??=Array(5).fill(null);
      c.dice=c.dice.map((n,i)=>c.held[i]?n:roll(6));c.rolls++;
    }else if(action==='hold'){
      const index=args.index;check(integer(index,0,4)&&c.dice&&!c.held[index]&&c.stage<3&&c.dice[index]===6-c.stage,'Select the next required die: ship, captain, then crew.');
      c.held[index]=true;c.stage++;
    }else if(action==='bank'){check(c.stage===3||c.rolls===3,'Ship, captain and crew are required.');shipEnd(s);}
    else throw new Error('Unknown action.');
  }
  s.log=s.log.slice(-100);s.revision++;return s;
}
export function tavernNpcAction(s,random=sides=>1){
  if(s?.game==='kniffel')return kniffelNpcAction(s);
  if(!s||s.paused||['finished','aborted','closed'].includes(s.phase))return null;
  if(s.game==='lottery'){
    if(s.tickets.length>=s.maxTickets)return null;
    const id=Object.keys(s.npcs).find(id=>!s.npcManual[id]&&!s.tickets.some(t=>t.id===id));if(!id)return null;
    const used=new Set(s.tickets.flatMap(t=>t.numbers)),free=Array.from({length:100},(_n,i)=>i+1).filter(n=>!used.has(n)),numbers=[];
    const count=s.numbersPerTicket??5;if(free.length<count)return null;
    while(numbers.length<count){const index=random(free.length)-1;check(integer(index,0,free.length-1),'Invalid random value.');numbers.push(free.splice(index,1)[0]);}
    return {id,action:'ticket',args:{numbers}};
  }
  if(s.phase!=='playing')return null;const id=s.order[s.turn];if(!s.npcs[id]||s.npcManual[id])return null;
  const c=s.cup;if(s.game==='pig'&&c.bust)return {id,action:'next'};
  if(s.game==='ship'){
    const index=c.dice?.findIndex((n,i)=>!c.held[i]&&c.stage<3&&n===6-c.stage)??-1;
    if(index>=0)return {id,action:'hold',args:{index}};
    if(c.rolls===3)return {id,action:'bank'};
  }
  const bank=s.game==='pig'?c.points>=20||s.scores[id]+c.points>=s.target:c.stage===3&&c.dice.filter((_n,i)=>!c.held[i]).reduce((a,b)=>a+b,0)>=8;
  return {id,action:bank?'bank':'roll'};
}
