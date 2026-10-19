import {act,value} from './engine.mjs';
import {actFarkle,bestSelection} from './farkle-engine.mjs';
import {actTavern} from './tavern-engine.mjs';
import {actCho} from './chohan.mjs';
import {actMeiern,meiernRank,meiernValue} from './meiern-engine.mjs';
import {actAalstechen} from './aalstechen-engine.mjs';
import {kniffelFavorScore,kniffelGoalDraws} from './kniffel-favor.mjs';

export const DIVINE_SCOPES=['schocken','farkle','pig','ship','lottery','kniffel','liars','hoard','chohan','seventeen','meiern','aalstechen'];
const check=(v,m)=>{if(!v)throw Error(m);};
const percent=n=>Number.isInteger(n)&&n>=0&&n<=100;
export const divineBook=()=>({version:1,revision:0,defaultStrength:0,games:{}});
export function divineConfig(book,scope,s){const c=book.games[scope];return c?.gameId===s?.gameId&&[...(s?.players??[]),...(['seventeen','chohan'].includes(scope)?['@bank']:[])].includes(c.target)?c:null;}
export function divineEdit(book,scope,s,user,action,args){
 check(user?.isGM,'GM only.');check(args.revision===book.revision,'Divine Hand settings changed. Refresh and try again.');
 const next=structuredClone(book);
 if(action==='divineDefault'){check(percent(args.strength),'Choose a percentage from 0 to 100.');next.defaultStrength=args.strength;}
 else{
  check(action==='divineSet'&&DIVINE_SCOPES.includes(scope),'Unknown Divine Hand action.');
  check(s&&s.gameId===args.gameId&&!['finished','aborted'].includes(s.phase),'Open an active game or lobby first.');
  check(percent(args.strength),'Choose a percentage from 0 to 100.');
  check(args.target===''||s.players.includes(args.target)||args.target==='@bank'&&['seventeen','chohan'].includes(scope),'Select a participating player.');
  next.games[scope]={gameId:s.gameId,target:args.target,strength:args.strength};
 }
 next.revision++;return next;
}
export function divinePayload(book,scope,s,user,getName=id=>id){
 check(user?.isGM,'GM only.');check(DIVINE_SCOPES.includes(scope),'Unknown game.');
 const c=divineConfig(book,scope,s);
 return {scope,revision:book.revision,defaultStrength:book.defaultStrength,gameId:s?.gameId??null,phase:s?.phase??null,target:c?.target??'',strength:c?.strength??(book.games[scope]?.gameId===s?.gameId?0:book.defaultStrength),players:(s?.players??[]).map(id=>({id,name:s.npcs[id]??getName(id)})),bank:['seventeen','chohan'].includes(scope)};
}
function simulate(scope,s,id,action,args,random){
 if(scope==='schocken')return act(s,id,action,args,()=>random(6),true);
 if(scope==='farkle')return actFarkle(s,id,action,args,()=>random(6),true);
 if(scope==='chohan')return actCho(s,id,action,args,random,true);
 if(scope==='meiern')return actMeiern(s,id,action,args,random,true);
 if(scope==='aalstechen')return actAalstechen(s,id,action,args,random,true);
 return actTavern(s,id,action,args,random,true);
}
const total=h=>(h??[]).flat().reduce((n,v)=>n+v,0);
function quality(scope,b,a,id,target,action){
 if(scope==='schocken'){const v=value(a.cup.dice,a.cup.hand);return v.rank*1000+v.high;}
 if(scope==='farkle')return a.cup?.dice&&a.order[a.turn]===target?bestSelection(a.cup.dice,a.cup.fresh,a.rules).score:-100000;
 if(scope==='pig')return a.cup.bust?-100000:a.cup.points;
 if(scope==='ship'){
  const c=a.cup,free=c.dice.filter((_,i)=>!c.held[i]);let progress=c.stage;
  while(progress<3){const at=free.indexOf(6-progress);if(at<0)break;free.splice(at,1);progress++;}
  return progress*1000+(progress===3?free.reduce((n,v)=>n+v,0):0);
 }
 if(scope==='kniffel')return kniffelFavorScore(b,a,target);
 if(scope==='liars'){const d=a.hands[target];return d.filter(v=>v===1).length*100+Math.max(...[1,2,3,4,5,6].map(v=>d.filter(n=>n===v).length));}
 if(scope==='meiern')return meiernRank(meiernValue(a.cup.dice));
 if(scope==='aalstechen')return a.remaining[target].length*100+total((a.last[target]??[]).map(d=>d.value));
 if(scope==='hoard')return action==='resolveGuess'&&a.lastContest?.closest?Number(a.lastContest.closest.includes(target))*1000:a.out.includes(target)?-100000:(a.balances[target]-b.balances[target])*1000;
 if(scope==='lottery')return Number(a.tickets.some(t=>t.id===target&&t.numbers.includes(a.result)));
 if(scope==='chohan'){const side=total(a.dice)%2?'odd':'even';if(target==='@bank')return -a.bets.filter(x=>x.side===side).reduce((n,x)=>n+(x.accepted??0),0);return Number(a.bets.some(x=>x.id===target&&x.side===side&&(x.accepted??0)>0));}
 if(scope==='seventeen'){
  const bank=total(a.bank);
  if(id==='@bank'){
   if(target==='@bank')return bank>21?-100000:bank;
   const own=total(a.hands[target]);return own>21?0:bank>21?100000:bank<own?1000+own-bank:-bank;
  }
  const n=total(a.hands[target]);return n>21?-100000:n===21?100000:n;
 }
 return 0;
}
function recipes(scope,s){
 const rows=Array.from({length:6},(_,i)=>Array(10).fill(i+1));
 if(scope==='ship')rows.push([...Array.from({length:3-(s.cup?.stage??0)},(_,i)=>6-(s.cup?.stage??0)-i),6,6]);
 return rows;
}
// Select a legal complete throw BEFORE the authoritative engine commits it.
// Shadow engines are pure; rejected candidate throws never reach storage, chat or DSN.
export function divineRandom({scope,state:s,actor,action,args={},config,raw}){
 if(!config?.target||!config.strength||config.gameId!==s?.gameId||s?.paused||!['roll','draw','bankRoll','resolveGuess'].includes(action))return raw;
 const target=config.target,shared=['lottery','chohan'].includes(scope)||scope==='hoard'&&action==='resolveGuess';
 const id=scope==='seventeen'&&action==='bankRoll'?'@bank':['aalstechen','liars'].includes(scope)?actor:s?.order?.[s.turn];
 if(!shared&&id!==target&&!(scope==='seventeen'&&id==='@bank'))return raw;
 if(scope==='lottery'&&!s.tickets.some(t=>t.id===target)||scope==='chohan'&&target!=='@bank'&&!s.bets.some(b=>b.id===target&&(b.accepted??0)>0))return raw;
 const intensity=config.strength/100;
 // Moderate values mostly retain ordinary throws and compare only a few random candidates.
 if(raw(10000)>config.strength*config.strength)return raw;
 const extreme=config.strength===100||config.strength>85&&raw(10000)<=Math.round(10000*((config.strength-85)/15)**2);
 // Vary a safe intermediate target; the user still decides whether to roll again.
 // At 15 or above, prefer the exact remainder. Paired dice retain their minimum sum.
 const ownTotal=total(s.hands?.[target]);
 const stepTarget=scope==='seventeen'&&id===target&&id!=='@bank'&&ownTotal<15
  ?ownTotal+raw(Math.min(s.diceMode==='d8d6'?14:12,21-ownTotal)):null;
 let chosen=null,best=-Infinity,types=[];
 const sample=(preset=null)=>{
  const values=[],sides=[];let i=0;
  const next=simulate(scope,s,id,action,args,n=>{const v=preset?.[i]??raw(n);i++;check(Number.isInteger(v)&&v>=1&&v<=n,'Invalid candidate.');values.push(v);sides.push(n);return v;});
  const score=stepTarget!==null?(()=>{const n=total(next.hands[target]);return n>21?-100000:s.diceMode==='d8d6'&&n===20?-50000:-Math.abs(stepTarget-n);})():quality(scope,s,next,id,target,action);if(score>best){best=score;chosen=values;}if(!types.length)types=sides;
 };
 try{
  sample();if(!types.length)return raw;
  const combinations=types.reduce((n,v)=>n*v,1);
  if(extreme&&combinations<=216){for(let code=0;code<combinations;code++){let x=code;sample(types.map(n=>{const v=x%n+1;x=Math.floor(x/n);return v;}));}}
  else{
   for(let i=0;i<Math.max(1,Math.round(63*intensity**4));i++)sample();
   if(extreme){
    if(scope==='kniffel')for(const fresh of kniffelGoalDraws(s,target))sample(fresh);
    else for(const recipe of recipes(scope,s))sample(types.map((n,i)=>Math.min(n,recipe[i]??n)));
   }
  }
 }catch{return raw;}
 let at=0;return n=>{const v=chosen?.[at],expected=types[at++];return expected===n&&Number.isInteger(v)?v:raw(n);};
}
