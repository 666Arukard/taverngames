const check=(ok,message)=>{if(!ok)throw Error(message)};
const sum=h=>h.flat().reduce((a,b)=>a+b,0);
export function createSeventeen({npcs={},diceMode='d12',stake=2,bankManual=false,bankFunds=1000}={}){
 check(Number.isSafeInteger(bankFunds)&&bankFunds>=0&&bankFunds<=1000000,'Invalid bank budget.');
 check(typeof bankManual==='boolean','Invalid rule option.');
 check(['d12','d8d6'].includes(diceMode),'Invalid dice mode.');check(Number.isSafeInteger(stake)&&stake>=1&&stake<=1000000,'Invalid stake.');
 check(npcs&&typeof npcs==='object'&&!Array.isArray(npcs)&&Object.keys(npcs).length<=20,'Invalid NPCs.');for(const [id,name] of Object.entries(npcs))check(id.startsWith('npc-')&&typeof name==='string'&&name.trim()&&name.length<=60,'Invalid NPCs.');
 const players=Object.keys(npcs);return {version:1,game:'seventeen',phase:'lobby',revision:0,paused:false,npcs:structuredClone(npcs),npcManual:{},players,order:[],turn:0,diceMode,bankManual,bankFunds,bankBalance:bankFunds,bankDebt:0,stake,currency:'gp',hands:Object.fromEntries(players.map(id=>[id,[]])),scores:Object.fromEntries(players.map(id=>[id,0])),bank:[],bankStop:null,log:[],finishedPlayers:[],settlements:{}};
}
export function seventeenView(state,user={}){
 if(!state)return null;const s=structuredClone(state),revealed=s.phase==='finished';if(!revealed){delete s.bankStop;delete s.scores;delete s.settlements;delete s.log;if(!user.isGM)s.bank=s.bank.map((r,i)=>i===0?r.map(()=>null):r);s.hands=Object.fromEntries(s.players.map(id=>[id,id===user.id||user.isGM&&s.npcs[id]&&s.npcManual[id]?s.hands[id]:s.hands[id].map(r=>r.map(()=>null))]));}
 return s;
}
function settle(s){const bank=sum(s.bank);s.phase='finished';s.winners=[];s.losers=[];s.settlements={};for(const id of s.players){const total=sum(s.hands[id]),win=total<=21&&(bank>21||total>bank),payout=win?s.stake*(total===21?2.5:2):0;s.scores[id]=payout-s.stake;s.settlements[id]={total,win,stake:s.stake,payout,net:payout-s.stake};(win?s.winners:s.losers).push(id)}s.draw=false;s.bankBalance=(s.bankBalance??s.bankFunds??1000)-Object.values(s.scores).reduce((a,b)=>a+b,0);s.bankDebt=Math.max(0,-s.bankBalance);}
export function actSeventeen(original,actor,action,args={},random=()=>1,gm=false){
 const s=structuredClone(original);check(s?.version===1&&s.game==='seventeen','No game exists.');check(!['finished','aborted'].includes(s.phase),'This game has ended.');
 const roll=n=>{const v=random(n);check(Number.isInteger(v)&&v>=1&&v<=n,'Invalid random value.');return v};const throwDice=()=>s.diceMode==='d12'?[roll(12)]:[roll(8),roll(6)];
 if(action==='abort'){check(gm,'GM only.');s.phase='aborted';s.paused=true;}
 else if(action==='pause'){check(gm,'GM only.');s.paused=!s.paused;}
 else if(action==='bankControl'){check(gm&&typeof args.manual==='boolean','GM only.');s.bankManual=args.manual;}
 else if(action==='npcControl'){check(gm&&Object.hasOwn(s.npcs,args.id)&&typeof args.manual==='boolean','GM only.');s.npcManual[args.id]=args.manual;}
 else if(action==='join'||action==='leave'){check(s.phase==='lobby'&&!s.paused,'Join in the lobby.');check(typeof actor==='string'&&!actor.startsWith('npc-')&&actor.length<=64,'Invalid participant.');if(action==='join'){check(!s.players.includes(actor)&&s.players.length<20,'Invalid participant.');s.players.push(actor);s.hands[actor]=[];s.scores[actor]=0}else{check(s.players.includes(actor),'Invalid participant.');s.players=s.players.filter(id=>id!==actor);delete s.hands[actor];delete s.scores[actor]}}
 else if(action==='begin'){check(gm&&s.phase==='lobby'&&!s.paused,'GM only.');check(s.players.length>0,'Not enough participants.');s.order=[...s.players];s.phase='playing';s.bankStop=15+roll(2);s.bank=[throwDice()];}
 else if(action==='bankRoll'){check(gm&&s.phase==='bank'&&!s.paused,'GM only.');if(sum(s.bank)>=s.bankStop)settle(s);else s.bank.push(throwDice());}
 else {check(s.phase==='playing'&&!s.paused,'The game is not running.');const id=s.order[s.turn];check(actor===id||gm,'It is not your turn.');
  if(action==='roll'){check(sum(s.hands[id])<21,'No more rolls.');s.hands[id].push(throwDice());}
  else if(action==='stand'){check(s.hands[id].length>0,'Roll first.');s.finishedPlayers.push(id);s.turn++;if(s.turn===s.order.length)s.phase='bank';}
  else throw Error('Unknown action.');
 }
 s.revision++;return s;
}
export function seventeenNpcAction(s){if(!s||s.paused)return null;if(s.phase==='bank')return s.bankManual?null:{id:'@bank',action:'bankRoll'};if(s.phase!=='playing')return null;const id=s.order[s.turn];if(!s.npcs[id]||s.npcManual[id])return null;return {id,action:s.hands[id].length&&sum(s.hands[id])>=16?'stand':'roll'};}
export const seventeenTotal=sum;

export function seventeenBankShortfall(s){return Math.max(0,(s.players?.length??0)*s.stake*1.5-(s.bankBalance??s.bankFunds??1000));}
