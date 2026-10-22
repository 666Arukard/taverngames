import {startingOrder} from './start-choice.mjs';
const check=(v,m)=>{if(!v)throw Error(m);};
const amount=n=>Number.isSafeInteger(n)&&n>=1&&n<=1000000;
export function createLucky(o={}){
 const limits={minEnabled:o.minEnabled===true,maxEnabled:o.maxEnabled===true,totalEnabled:o.totalEnabled===true,min:Number(o.min??1),max:Number(o.max??100),total:Number(o.total??100)};
 check(amount(limits.min)&&amount(limits.max)&&amount(limits.total)&&(!limits.minEnabled||!limits.maxEnabled||limits.min<=limits.max)&&(!limits.minEnabled||!limits.totalEnabled||limits.min<=limits.total),'Invalid stake limits.');
 check(!o.open||Array.isArray(o.open)&&o.open.length===3&&o.open.every(v=>typeof v==='boolean'),'Invalid visibility.');
 return {version:1,game:'lucky',gameId:null,revision:0,phase:'lobby',paused:false,players:Object.keys(o.npcs??{}),npcs:structuredClone(o.npcs??{}),npcManual:{},startSelection:o.startSelection??'rules',order:[],turn:0,allowRaise:o.allowRaise===true,open:o.open??[false,false,false],limits,stakes:{},raised:{},hands:{},revealed:{},settlements:{},winners:[],losers:[],scores:{}};
}
export function luckyBounds(s){const e=s.economy,token=e?.mode==='tokens',min=Math.max(token?e.config.min:1,s.limits.minEnabled?s.limits.min:1),max=Math.min(token?e.config.max:1000000,s.limits.maxEnabled?s.limits.max:1000000,s.limits.totalEnabled?s.limits.total:1000000);return {min,max};}
const free=(s,id)=>(s.economy?.balances[id]??0)-(s.economy?.reserved[id]??0);
export function actLucky(original,id,action,a={},random=()=>1,gm=false){
 const s=structuredClone(original);check(s?.game==='lucky','No game exists.');
 if(action==='abort'){check(gm,'GM only.');s.phase='aborted';s.paused=true;}
 else if(action==='pause'){check(gm&&!['finished','aborted'].includes(s.phase),'GM only.');s.paused=!s.paused;}
 else if(action==='npcControl'){check(gm&&Object.hasOwn(s.npcs,a.id)&&typeof a.manual==='boolean','GM only.');s.npcManual[a.id]=a.manual;}
 else{check(!s.paused&&!['finished','aborted'].includes(s.phase),'The game has ended or is paused.');
 if(['join','leave'].includes(action)){check(s.phase==='lobby','Join in the lobby.');if(action==='join'){check(!s.players.includes(id)&&s.players.length<10&&!id.startsWith('npc-'),'Invalid participant.');s.players.push(id);}else s.players=s.players.filter(p=>p!==id);}
 else if(action==='stake'){check(s.phase==='lobby'&&s.players.includes(id),'Choose a stake in the lobby.');const {min,max}=luckyBounds(s);check(amount(a.amount)&&a.amount>=min&&a.amount<=max,'Invalid token stake.');if(s.economy?.mode==='tokens')check(free(s,id)>=a.amount,'Not enough game tokens.');s.stakes[id]=a.amount;}
 else if(action==='begin'){check(gm&&s.phase==='lobby'&&s.players.length>=1,'GM only.');const {min,max}=luckyBounds(s);check(min<=max,'Invalid stake limits.');for(const p of s.players){s.stakes[p]??=min;check(s.stakes[p]>=min&&s.stakes[p]<=max,'Invalid token stake.');if(s.economy?.mode==='tokens')check(free(s,p)>=s.stakes[p],'Not enough game tokens.');}s.order=startingOrder(s);s.hands=Object.fromEntries(s.players.map(p=>[p,[]]));s.revealed=Object.fromEntries(s.players.map(p=>[p,[...s.open]]));s.phase='playing';}
 else if(action==='reveal'){check(s.players.includes(id)&&Number.isInteger(a.index)&&a.index>=0&&a.index<(s.hands[id]?.length??0),'Invalid die.');s.revealed[id][a.index]=true;}
 else{check(s.phase==='playing'&&s.order[s.turn]===id,'It is not your turn.');const hand=s.hands[id];
 if(action==='raise'){check(s.allowRaise&&!s.raised[id]&&hand.length===2,'Raising is disabled.');const {max}=luckyBounds(s);check(amount(a.amount)&&a.amount>s.stakes[id]&&a.amount<=max,'Invalid token stake.');if(s.economy?.mode==='tokens')check((s.economy.balances[id]??0)>=a.amount,'Not enough game tokens.');s.stakes[id]=a.amount;s.raised[id]=true;}
 else if(action==='roll'){check(hand.length===0||hand.length===2,'Invalid roll.');for(let i=0,n=hand.length===0?2:1;i<n;i++){const value=random(6);check(Number.isInteger(value)&&value>=1&&value<=6,'Invalid die.');hand.push(value);}if(hand.length===3){const sum=hand.reduce((a,b)=>a+b,0),stake=s.stakes[id],payout=sum===9?2*stake:[7,8,10,11].includes(sum)?Math.floor(1.5*stake):0;s.revealed[id]=[true,true,true];s.scores[id]=sum;s.settlements[id]={stake,sum,payout,net:payout-stake};if(payout>stake)s.winners.push(id);else s.losers.push(id);s.turn++;if(s.turn>=s.order.length){s.turn=s.order.length-1;s.phase='finished';}}}
 else throw Error('Unknown action.');}}
 s.revision++;return s;
}
export function luckyView(state,user={}){if(!state)return null;const s=structuredClone(state);for(const id of s.players)if(id!==user.id&&!(user.isGM&&s.npcs[id]&&s.npcManual[id]))s.hands[id]=(s.hands[id]??[]).map((v,i)=>s.revealed[id]?.[i]?v:null);return s;}
export function luckyNpc(s){if(!s||s.phase!=='playing'||s.paused)return null;const id=s.order[s.turn];if(!s.npcs[id]||s.npcManual[id])return null;const sum=(s.hands[id]??[]).reduce((a,b)=>a+b,0),max=Math.min(luckyBounds(s).max,s.economy?.mode==='tokens'?s.economy.balances[id]:1000000),raise=Math.min(max,s.stakes[id]*2);if(s.allowRaise&&!s.raised[id]&&s.hands[id].length===2&&sum>=5&&sum<=7&&raise>s.stakes[id])return {id,action:'raise',args:{amount:raise}};return {id,action:'roll',args:{}};}
