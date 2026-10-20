import {startingOrder} from './start-choice.mjs';
const check=(v,m)=>{if(!v)throw Error(m);};
export const KLIPP_NUMBERS=Object.freeze(Array.from({length:12},(_,i)=>i+1));
export const klippActive=s=>(s.order.length?s.order:s.players).filter(id=>!s.out.includes(id));
const sum=a=>a.reduce((n,v)=>n+v,0);
export function klippChoices(board,dice,variant='B'){
 if(!dice)return [];const total=sum(dice),rows=[];
 const add=a=>{const b=[...a].sort((a,b)=>a-b);if(new Set(b).size===b.length&&b.every(n=>board.includes(n))&&!rows.some(r=>r.join()===b.join()))rows.push(b);};
 add([total]);add(dice);if(variant!=='C'||dice[0]===dice[1]){add([dice[0]]);add([dice[1]]);}
 if(variant==='B'){const walk=(at,left,chosen)=>{if(left===0){if(chosen.length)add(chosen);return;}for(let i=at;i<board.length;i++)if(board[i]<=left)walk(i+1,left-board[i],[...chosen,board[i]]);};walk(0,total,[]);}
 return rows;
}
export function createKlippklapp({npcs={},variant='B'}={}){
 check(['A','B','C'].includes(variant),'Invalid Klippklapp variant.');
 check(npcs&&typeof npcs==='object'&&!Array.isArray(npcs)&&Object.keys(npcs).length<=10&&Object.entries(npcs).every(([id,n])=>id.startsWith('npc-')&&typeof n==='string'&&n.trim()&&n.length<=60),'Invalid NPCs.');
 const players=Object.keys(npcs);return {version:1,game:'klippklapp',phase:'lobby',revision:0,paused:false,players,npcs:structuredClone(npcs),npcManual:{},variant,directComparison:true,previous:null,order:[],turn:0,round:1,completedRounds:0,rollNumber:0,out:[],leaving:[],scores:Object.fromEntries(players.map(id=>[id,0])),board:[...KLIPP_NUMBERS],actuals:{},cup:null,bid:null,challengeOpen:false,resolution:null,log:[],winners:[],losers:[]};
}
const nextId=(s,id)=>{const start=s.order.indexOf(id);for(let n=1;n<=s.order.length;n++){const p=s.order[(start+n)%s.order.length];if(!s.out.includes(p))return p;}return null;};
function finish(s,reason='early'){s.phase='finished';s.reason=reason;const high=Math.max(...s.players.map(id=>s.scores[id]??0));s.winners=s.players.filter(id=>s.scores[id]===high);s.losers=s.players.filter(id=>!s.winners.includes(id));s.draw=s.winners.length>1;}
function funds(s,initial){if(s.economy?.mode!=='tokens')return;const e=s.economy,stake=e.config.stake,held=id=>['open','closed'].includes(e.bets?.status)?e.bets.bets.filter(b=>b.id===id).reduce((n,b)=>n+b.amount,0):0;for(const id of klippActive(s))if((e.balances[id]??0)-held(id)<stake){if(initial)throw Error('Not enough game tokens.');s.out.push(id);}}
function roundStart(s,starter,initial=false){funds(s,initial);if(klippActive(s).length<2){finish(s,'players');return;}s.turn=s.order.indexOf(s.out.includes(starter)?nextId(s,starter):starter);s.phase='ready';s.board=[...KLIPP_NUMBERS];s.cup=null;s.bid=null;s.previous=null;s.challengeOpen=false;s.actuals={};s.resolution=null;}
function settleRound(s,{kind,actor,challenger=null,truth=null,actual=null,payments,starter}){
 for(const p of payments){s.scores[p.from]-=p.multiplier;s.scores[p.to]+=p.multiplier;}
 s.completedRounds++;s.resolution={round:s.round,kind,actor,challenger,claim:s.bid?.value??null,actual,truth,payments,starter};s.log.push(structuredClone(s.resolution));s.log=s.log.slice(-100);s.phase='reveal';s.challengeOpen=false;
 // A pending claimant may leave, but its liability survives until this decision.
 for(const id of s.leaving)if(!s.out.includes(id))s.out.push(id);s.leaving=[];
 if(klippActive(s).length<2)finish(s,'players');
}
function endTurn(s,id){
 const actual=sum(s.board);s.actuals[id]=actual;
 if(!s.directComparison){s.phase='declare';return;}
 const previous=s.previous;
 if(previous&&actual>=previous.value){settleRound(s,{kind:'comparison',actor:id,actual,payments:[{from:id,to:previous.actor,multiplier:1}],starter:id});return;}
 s.previous={actor:id,value:actual};s.turn=s.order.indexOf(nextId(s,id));s.board=[...KLIPP_NUMBERS];s.cup=null;s.phase='ready';
}
export function actKlippklapp(original,id,action,args={},random=()=>1,gm=false){
 const s=structuredClone(original);check(s?.game==='klippklapp'&&s.version===1,'No game exists.');check(!['finished','aborted'].includes(s.phase),'This game has ended.');
 if(action==='abort'){check(gm,'GM only.');s.phase='aborted';s.paused=true;s.cup=null;}
 else if(action==='pause'){check(gm,'GM only.');s.paused=!s.paused;}
 else if(action==='npcControl'){check(gm&&Object.hasOwn(s.npcs,args.id)&&typeof args.manual==='boolean','GM only.');s.npcManual[args.id]=args.manual;}
 else{
  check(!s.paused,'The game is paused.');
  if(action==='join'){check(s.phase==='lobby'&&typeof id==='string'&&!id.startsWith('npc-')&&!s.players.includes(id)&&s.players.length<10,'Join in the lobby.');s.players.push(id);s.scores[id]=0;}
  else if(action==='leave'){
   check(s.players.includes(id)&&!s.out.includes(id)&&!s.leaving.includes(id),'Invalid participant.');
   if(s.phase==='lobby'){s.players=s.players.filter(p=>p!==id);delete s.scores[id];}
   else{check(s.order[s.turn]!==id||s.phase==='reveal','Leave only outside your own turn.');if((s.phase==='respond'||s.phase==='ready'&&s.challengeOpen)&&s.bid?.actor===id)s.leaving.push(id);else s.out.push(id);if(klippActive(s).length<2)finish(s,'players');}
  }else if(action==='begin'){check(gm&&s.phase==='lobby'&&s.players.length>=2,'GM only.');s.order=startingOrder(s);roundStart(s,s.order[0],true);}
  else if(action==='finish'){check(gm&&s.phase==='reveal','Finish between revealed rounds.');finish(s);}
  else if(action==='next'){check(s.phase==='reveal'&&(gm||id===s.resolution.starter),'Continue after revealing.');const starter=s.resolution.starter;s.round++;roundStart(s,starter);}
  else{
   check(s.order[s.turn]===id&&!s.out.includes(id),'It is not your turn.');
   if(action==='roll'){
    check(s.phase==='ready'||s.phase==='choose'&&s.cup.dice[0]===s.cup.dice[1],'Close tiles before rolling again.');
    if(s.challengeOpen){s.challengeOpen=false;for(const p of s.leaving)if(!s.out.includes(p))s.out.push(p);s.leaving=[];if(klippActive(s).length<2){finish(s,'players');s.revision++;return s;}}
    const dice=[random(6),random(6)];check(dice.every(n=>Number.isInteger(n)&&n>=1&&n<=6),'Invalid dice.');s.cup={actor:id,dice};s.rollNumber++;
    if(!klippChoices(s.board,dice,s.variant).length&&dice[0]!==dice[1])endTurn(s,id);else s.phase='choose';
   }else if(action==='close'){
    check(s.phase==='choose'&&Array.isArray(args.numbers),'Choose a valid tile combination.');const chosen=[...args.numbers].sort((a,b)=>a-b);check(klippChoices(s.board,s.cup.dice,s.variant).some(r=>r.join()===chosen.join()),'Choose a valid tile combination.');s.board=s.board.filter(n=>!chosen.includes(n));
    if(!s.board.length){s.actuals[id]=0;settleRound(s,{kind:'klippklapp',actor:id,actual:0,payments:klippActive(s).filter(p=>p!==id).map(from=>({from,to:id,multiplier:1})),starter:nextId(s,id)});}else s.phase='ready';
   }else if(action==='declare'){
    check(!s.directComparison&&s.phase==='declare','Complete your turn before declaring.');check(Number.isInteger(args.value)&&args.value>=0&&args.value<=78&&(!s.bid||args.value<s.bid.value),'The announced remainder must be lower.');s.bid={actor:id,value:args.value};s.turn=s.order.indexOf(nextId(s,id));s.phase='respond';s.challengeOpen=true;
   }else if(action==='believe'){
    check(!s.directComparison&&s.phase==='respond'&&s.bid.value>0,'Challenge a zero remainder.');s.board=[...KLIPP_NUMBERS];s.cup=null;s.phase='ready';
   }else if(action==='challenge'){
    check(!s.directComparison&&(s.phase==='respond'||s.phase==='ready'&&s.challengeOpen)&&s.bid,'No claim to challenge.');const actual=s.actuals[s.bid.actor],truth=actual===s.bid.value,payer=truth?id:s.bid.actor,payee=truth?s.bid.actor:id;
    settleRound(s,{kind:'challenge',actor:s.bid.actor,challenger:id,truth,actual,payments:[{from:payer,to:payee,multiplier:1}],starter:payer});
   }else throw Error('Unknown action.');
  }
 }
 s.revision++;return s;
}
export function klippView(original,user={}){
 if(!original)return null;const s=structuredClone(original);if(s.directComparison)return s;s.actuals=Object.fromEntries(Object.entries(s.actuals).filter(([id])=>id===user.id||user.isGM&&s.npcs[id]&&s.npcManual[id]));return s;
}
export function klippNpcAction(s){
 if(!s||s.paused)return null;const id=s.phase==='reveal'?s.resolution.starter:s.order[s.turn];if(!s.npcs[id]||s.npcManual[id]||s.out.includes(id))return null;
 if(s.phase==='reveal')return {id,action:'next'};if(s.phase==='ready')return {id,action:'roll'};
 if(s.phase==='choose'){const choices=klippChoices(s.board,s.cup.dice,s.variant).sort((a,b)=>sum(b)-sum(a)||b.length-a.length);return choices.length?{id,action:'close',args:{numbers:choices[0]}}:{id,action:'roll'};}
 if(s.phase==='declare'){const actual=s.actuals[id];return {id,action:'declare',args:{value:!s.bid||actual<s.bid.value?actual:Math.max(0,s.bid.value-1)}};}
 if(s.phase==='respond')return {id,action:s.bid.value===0||s.bid.value<=3||(s.round+s.rollNumber)%4===0?'challenge':'believe'};
 return null;
}
