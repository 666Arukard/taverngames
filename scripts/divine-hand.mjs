import {actThirteen} from './thirteen-engine.mjs';
import {actKlippklapp,klippChoices} from './klippklapp-engine.mjs';
import {actPoker,pokerValue} from './poker-engine.mjs';
import {act,value} from './engine.mjs';
import {actFarkle,bestSelection} from './farkle-engine.mjs';
import {actTavern} from './tavern-engine.mjs';
import {actCho} from './chohan.mjs';
import {actMeiern,meiernRank,meiernValue} from './meiern-engine.mjs';
import {actAalstechen} from './aalstechen-engine.mjs';
import {kniffelFavorScore,kniffelGoalDraws} from './kniffel-favor.mjs';

export const DIVINE_SCOPES=['schocken','farkle','pig','ship','lottery','kniffel','liars','hoard','chohan','seventeen','meiern','aalstechen','poker','klippklapp','thirteen'];
const check=(v,m)=>{if(!v)throw Error(m);};
const percent=n=>Number.isInteger(n)&&n>=0&&n<=100;
export const divineBook=()=>({version:1,revision:0,defaultStrength:0,games:{},profiles:{},selection:{}});
export function divineMigrate(book){const next=structuredClone(book);if(!next.profiles){next.profiles={};for(const [scope,c]of Object.entries(next.games??{}))if(c.target)next.profiles[scope]={[c.target]:{strength:c.strength,mode:c.mode??'favor'}};}next.selection??={};return next;}
export function divineConfigs(book,scope,s){if(!s)return [];const b=divineMigrate(book),ids=[...(s.players??[]),...(['seventeen','chohan'].includes(scope)?['@bank']:[])];return ids.flatMap(target=>{const own=b.profiles[scope]?.[target],c=own??b.profiles.all?.[target];return c?[{...c,target,gameId:s.gameId,source:own?scope:'all'}]:[];});}
export function divineConfig(book,scope,s,target){const rows=divineConfigs(book,scope,s);return target?rows.find(c=>c.target===target)??null:rows.find(c=>c.strength>0)??null;}
export function divineEdit(book,scope,s,user,action,args,participants=[]){
 check(user?.isGM,'GM only.');check(args.revision===book.revision,'Divine Hand settings changed. Refresh and try again.');const next=divineMigrate(book);
 if(action==='divineClearAll'){next.profiles={};next.games={};next.selection={};next.defaultStrength=0;}
 else if(action==='divineDefault'){check(percent(args.strength),'Choose a percentage from 0 to 100.');next.defaultStrength=args.strength;}
 else{
  check(['divineSet','divineRemove'].includes(action)&&['all',...DIVINE_SCOPES].includes(scope),'Unknown Divine Hand action.');
  const allowed=[...new Set([...(s?.players??[]),...participants,...(['all','seventeen','chohan'].includes(scope)?['@bank']:[])])];
  check(typeof args.target==='string'&&(args.target===''||allowed.includes(args.target)),'Select a participating player.');next.profiles[scope]??={};
  if(action==='divineRemove'){delete next.profiles[scope][args.target];}
  else {check(percent(args.strength),'Choose a percentage from 0 to 100.');check(['favor','disfavor'].includes(args.mode??'favor'),'Choose favor or disfavor.');if(args.target)next.profiles[scope][args.target]={strength:args.strength,mode:args.mode??'favor'};else next.profiles[scope]={};}
  next.selection[scope]=args.target;
 }
 next.revision++;return next;
}
export function divinePayload(book,scope,s,user,getName=id=>id,participants=[]){
 check(user?.isGM,'GM only.');check(['all',...DIVINE_SCOPES].includes(scope),'Unknown game.');const b=divineMigrate(book),ids=[...new Set([...(s?.players??[]),...participants,...Object.keys(b.profiles[scope]??{})])].filter(id=>id!=='@bank'),target=b.selection[scope]??Object.keys(b.profiles[scope]??{})[0]??'',c=b.profiles[scope]?.[target]??(scope!=='all'?b.profiles.all?.[target]:undefined);
 return {scope,source:b.profiles[scope]?.[target]?'scope':c?'all':'none',inherited:scope==='all'?[]:Object.entries(b.profiles.all??{}).map(([id,c])=>({id,...c})),revision:b.revision,defaultStrength:b.defaultStrength,gameId:s?.gameId??null,phase:s?.phase??null,target,strength:c?.strength??0,mode:c?.mode??'favor',players:ids.map(id=>({id,name:s?.npcs?.[id]??getName(id)})),bank:['all','seventeen','chohan'].includes(scope),entries:Object.entries(b.profiles[scope]??{}).map(([id,c])=>({id,name:s?.npcs?.[id]??getName(id),...c})),effective:divineConfigs(b,scope,s)};
}
function simulate(scope,s,id,action,args,random){
 if(scope==='thirteen')return actThirteen(s,id,action,args,random,true);
 if(scope==='klippklapp')return actKlippklapp(s,id,action,args,random,true);
 if(scope==='poker')return actPoker(s,id,action,args,random,true);
 if(scope==='schocken')return act(s,id,action,args,()=>random(6),true);
 if(scope==='farkle')return actFarkle(s,id,action,args,()=>random(6),true);
 if(scope==='chohan')return actCho(s,id,action,args,random,true);
 if(scope==='meiern')return actMeiern(s,id,action,args,random,true);
 if(scope==='aalstechen')return actAalstechen(s,id,action,args,random,true);
 return actTavern(s,id,action,args,random,true);
}
const total=h=>(h??[]).flat().reduce((n,v)=>n+v,0);
function quality(scope,b,a,id,target,action){
 if(scope==='thirteen')return a.last?.sum===12?1000000:-(a.last?.requested??0)-(a.out.includes(target)?100000:0);
 if(scope==='schocken'){const v=value(a.cup.dice,a.cup.hand);return v.rank*1000+v.high;}
 if(scope==='farkle')return a.cup?.dice&&a.order[a.turn]===target?bestSelection(a.cup.dice,a.cup.fresh,a.rules).score:-100000;
 if(scope==='pig')return a.cup.bust?-100000:a.cup.points;
 if(scope==='ship'){
  const c=a.cup,free=c.dice.filter((_,i)=>!c.held[i]);let progress=c.stage;
  while(progress<3){const at=free.indexOf(6-progress);if(at<0)break;free.splice(at,1);progress++;}
  return progress*1000+(progress===3?free.reduce((n,v)=>n+v,0):0);
 }
 if(scope==='klippklapp'){const choices=klippChoices(b.board,a.cup.dice,a.variant);if(!choices.length)return a.cup.dice[0]===a.cup.dice[1]?0:-100000;return Math.max(...choices.map(row=>row.length===b.board.length?100000:row.reduce((n,v)=>n+v,0)));}
 if(scope==='poker')return pokerValue(a.hands[target]).score;
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
 rows.push([2,3,4,6,2,3,4,6,2,3]);
 if(scope==='ship')rows.push([...Array.from({length:3-(s.cup?.stage??0)},(_,i)=>6-(s.cup?.stage??0)-i),6,6]);
 return rows;
}
// Select a legal complete throw BEFORE the authoritative engine commits it.
// Shadow engines are pure; rejected candidate throws never reach storage, chat or DSN.
export function divineRandom({scope,state:s,actor,action,args={},config,raw}){
 const all=(Array.isArray(config)?config:[config]).filter(c=>c?.target&&c.strength>0&&c.gameId===s?.gameId);
 if(!all.length||s?.paused||!['roll','draw','bankRoll','resolveGuess'].includes(action))return raw;
 const shared=['lottery','chohan'].includes(scope)||scope==='hoard'&&action==='resolveGuess',id=scope==='seventeen'&&action==='bankRoll'?'@bank':['aalstechen','liars'].includes(scope)?actor:s?.order?.[s.turn];
 const configs=all.filter(c=>(shared||id===c.target||scope==='seventeen'&&id==='@bank')&&!(scope==='lottery'&&!s.tickets.some(t=>t.id===c.target))&&!(scope==='chohan'&&c.target!=='@bank'&&!s.bets.some(b=>b.id===c.target&&(b.accepted??0)>0)));
 if(!configs.length)return raw;const strength=Math.max(...configs.map(c=>c.strength)),intensity=strength/100;
 if(raw(10000)>strength*100)return raw;
 const own=configs.find(c=>c.target===id),ownTotal=total(s.hands?.[id]);
 const step=scope==='seventeen'&&id!=='@bank'&&own?.mode!=='disfavor'&&ownTotal<15?ownTotal+raw(Math.min(s.diceMode==='d8d6'?14:12,21-ownTotal)):null;
 const candidates=[];let types=[];
 const sample=(preset=null)=>{const values=[],sides=[];let i=0;const next=simulate(scope,s,id,action,args,n=>{const v=preset?.[i]??raw(n);i++;check(Number.isInteger(v)&&v>=1&&v<=n,'Invalid candidate.');values.push(v);sides.push(n);return v;});const scores=configs.map(c=>step!==null&&c.target===id?(()=>{const n=total(next.hands[c.target]);return n>21?-100000:s.diceMode==='d8d6'&&n===20?-50000:-Math.abs(step-n);})():quality(scope,s,next,id,c.target,action));candidates.push({values,scores,category:scope==='poker'?pokerValue(next.hands[id]).category:null});if(!types.length)types=sides;};
 try{
  sample();if(!types.length)return raw;const combinations=types.reduce((n,v)=>n*v,1);
  if(combinations<=216){for(let code=0;code<combinations;code++){let x=code;sample(types.map(n=>{const v=x%n+1;x=Math.floor(x/n);return v;}));}}
  else{for(let i=0;i<64;i++)sample();if(scope==='kniffel')for(const fresh of kniffelGoalDraws(s,id))sample(fresh);else for(const recipe of scope==='poker'?pokerRecipes(args.keep?{...s,held:{...s.held,[id]:args.keep}}:s,id):recipes(scope,s))sample(types.map((n,i)=>Math.min(n,recipe[i]??n)));}
 }catch{return raw;}
 // A naturally better safe subtotal is never reduced merely to fit a varied path.
 if(step!==null&&configs.length===1){const n=ownTotal+candidates[0].values.reduce((a,b)=>a+b,0);if(n<=21&&n>=step&&!(s.diceMode==='d8d6'&&n===20)){let i=0;return sides=>types[i]===sides?candidates[0].values[i++]:raw(sides);}}
 const ranges=configs.map((_,i)=>[...new Set(candidates.map(c=>c.scores[i]))].sort((a,b)=>a-b));
 const merit=c=>configs.reduce((n,p,i)=>{const levels=ranges[i],q=levels.length===1?0.5:levels.indexOf(c.scores[i])/(levels.length-1);return n+(p.mode==='disfavor'?1-q:q)*p.strength/strength;},0)/configs.length;
 const best=Math.max(...candidates.map(merit));let eligible;
 if(scope==='poker'&&configs.length===1){const p=configs[0],minimum=p.strength<20?1:p.strength<30?2:p.strength<40?3:p.strength<50?4:p.strength<60?5:p.strength<75?6:p.strength<90?7:8,cap=8-minimum;
  eligible=candidates.filter(c=>p.mode==='disfavor'?c.category<=cap:c.category>=minimum);
  if(strength===100)eligible=candidates.filter(c=>merit(c)===best);
  else if(eligible.includes(candidates[0]))eligible=[candidates[0]];
  else if(eligible.length&&raw(100)>20){const closest=p.mode==='disfavor'?Math.max(...eligible.map(c=>c.category)):Math.min(...eligible.map(c=>c.category));eligible=eligible.filter(c=>c.category===closest);}
 }else{const threshold=intensity*best;eligible=candidates.filter(c=>merit(c)>=threshold-1e-12);if(strength<100&&eligible.includes(candidates[0]))eligible=[candidates[0]];}
 if(!eligible?.length)eligible=candidates.filter(c=>merit(c)===best);const chosen=best===Math.min(...candidates.map(merit))?candidates[0].values:eligible[raw(eligible.length)-1].values;
 let at=0;return n=>{const v=chosen[at],expected=types[at++];return expected===n&&Number.isInteger(v)?v:raw(n);};
}

function pokerRecipes(s,id){const goals=[[2,2,8,6,4],[2,2,2,8,6],[7,7,3,3,1],[1,2,3,4,8],[4,4,4,4,2],[3,3,3,7,7],[8,6,4,2,1],[1,3,5,7,8],[2,4,6,7,1]];for(let high=5;high<=8;high++)goals.push(Array.from({length:5},(_,i)=>high-i));for(let face=1;face<=8;face++)goals.push(Array(5).fill(face));const out=[];for(const goal of goals){const rest=[...goal];let valid=true;for(let i=0;i<5;i++)if(s.phase==='redraw'&&s.held[id]?.[i]){const at=rest.indexOf(s.hands[id][i]);if(at<0){valid=false;break;}rest.splice(at,1);}if(valid)out.push(rest);}return out;}
