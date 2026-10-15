import {f} from './farkle-text.mjs';
import {escapeHTML} from './tavern-text.mjs';
const check=(v,m)=>{if(!v)throw Error(m);};
const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
export function allocate(total,weights){
 const sum=weights.reduce((n,w)=>n+w,0);if(!sum)return weights.map(()=>0);
 const rows=weights.map((w,i)=>({i,value:Number(BigInt(total)*BigInt(w)/BigInt(sum)),rest:BigInt(total)*BigInt(w)%BigInt(sum)}));
 let remainder=total-rows.reduce((n,r)=>n+r.value,0);for(const row of [...rows].sort((a,b)=>a.rest===b.rest?a.i-b.i:a.rest>b.rest?-1:1)){if(!remainder--)break;row.value++;}return rows.map(r=>r.value);
}
export function createCho({npcs={},currency='gp',minStake=1,maxStake=100,commission=5,feeBase='pot',matching='proportional',variant='B',payoutBasis=190,bankFunds=1000}={}){
 check(['cp','sp','ep','gp','pp'].includes(currency),'Invalid currency or funding.');check(integer(minStake,1,10000)&&integer(maxStake,minStake,10000),'Invalid stake.');check(integer(commission,0,50)&&['pot','profit'].includes(feeBase)&&['proportional','order'].includes(matching),'Invalid rule option.');
 check(['A','B','C','D'].includes(variant)&&integer(payoutBasis,100,200)&&integer(bankFunds,1,1000000),'Invalid rule option.');
 const players=Object.keys(npcs);check(players.length<=20&&players.every(id=>id.startsWith('npc-')&&typeof npcs[id]==='string'&&npcs[id].trim()&&npcs[id].length<=60),'Invalid NPCs.');
 return {variant,payoutBasis,bankFunds,bank:bankFunds*({cp:1,sp:10,ep:50,gp:100,pp:1000})[currency],carry:0,carryContrib:{},unit:({cp:1,sp:10,ep:50,gp:100,pp:1000})[currency],version:1,game:'chohan',gameId:crypto.randomUUID(),revision:0,phase:'lobby',players,npcs:structuredClone(npcs),npcManual:{},balances:Object.fromEntries(players.map(id=>[id,10000])),bets:[],currency,minStake,maxStake,commission,feeBase,matching,dice:null,paused:false,round:1,order:[],turn:0,tickets:[],log:[]};
}
export function choView(state){if(!state)return null;const v=structuredClone(state);if(v.phase!=='finished')v.dice=null;return v;}
export function actCho(original,id,action,args={},random=()=>1,gm=false){
 const s=structuredClone(original);check(s&&s.game==='chohan','No game exists.');s.variant??='B';s.bank??=100000;s.payoutBasis??=190;s.carry??=0;s.carryContrib??={};
 if(action==='abort'){check(gm,'GM only.');check(!['finished','aborted'].includes(s.phase)||s.carry>0,'This game has ended.');if(s.phase!=='finished')for(const b of s.bets)s.balances[b.id]+=b.accepted??b.amount;for(const [id,n]of Object.entries(s.carryContrib))s.balances[id]=(s.balances[id]??0)+n;s.carry=0;s.carryContrib={};s.phase='aborted';s.dice=null;}
 else if(action==='pause'){check(gm&&!['finished','aborted'].includes(s.phase),'GM only.');s.paused=!s.paused;}
 else if(action==='npcControl'){check(gm&&Object.hasOwn(s.npcs,args.id)&&typeof args.manual==='boolean','GM only.');s.npcManual[args.id]=args.manual;}
 else{check(!s.paused,'The game is not running.');
 if(['join','leave'].includes(action)){check(s.phase==='lobby','Join in the lobby.');if(action==='join'){check(!s.players.includes(id)&&s.players.length<20&&!id.startsWith('npc-'),'Invalid participant.');s.players.push(id);s.balances[id]=10000;}else{check(!s.carry&&s.players.includes(id)&&!s.bets.some(b=>b.id===id),'Committed tickets cannot be withdrawn.');s.players=s.players.filter(p=>p!==id);delete s.balances[id];}}
 else if(action==='begin'){check(gm&&s.phase==='lobby'&&s.players.length>0,'GM only.');s.phase='accepting';}
 else if(action==='placeBet'){check(s.phase==='accepting'&&s.players.includes(id)&&!s.bets.some(b=>b.id===id),'Invalid participant.');check(['even','odd'].includes(args.side)&&integer(args.amount,s.minStake,s.maxStake)&&s.balances[id]>=args.amount*s.unit,'Invalid stake.');check(s.variant!=='A'||args.amount===s.minStake,'Invalid stake.');const amount=args.amount*s.unit;s.balances[id]-=amount;s.bets.push({id,side:args.side,amount});}
 else if(action==='withdraw'){check(s.phase==='accepting','Ticket acceptance is closed.');const b=s.bets.find(b=>b.id===id);check(b,'Invalid participant.');s.balances[id]+=b.amount;s.bets=s.bets.filter(b=>b.id!==id);}
 else if(action==='close'){
 check(gm&&s.phase==='accepting','GM only.');check(s.bets.length>0,'Place a bet first.');
 const totals=['even','odd'].map(side=>s.bets.filter(b=>b.side===side).reduce((n,b)=>n+b.amount,0));
 if(s.variant==='B'){
  const matched=Math.min(...totals);check(matched>0,'Both sides need a bet.');
  for(const side of ['even','odd']){const rows=s.bets.filter(b=>b.side===side);let left=matched;const values=s.matching==='proportional'?allocate(matched,rows.map(b=>b.amount)):rows.map(b=>{const a=Math.min(left,b.amount);left-=a;return a;});rows.forEach((b,i)=>{b.accepted=values[i];b.refund=b.amount-b.accepted;s.balances[b.id]+=b.refund;});}
  s.pot=2*matched;
 }else{
  s.pot=totals[0]+totals[1]+(s.variant==='D'?s.carry:0);
  if(['A','C'].includes(s.variant)){const factor=s.variant==='A'?200:s.payoutBasis;const exposure=Math.max(...['even','odd'].map(side=>s.bets.filter(b=>b.side===side).reduce((n,b)=>n+Math.floor(b.amount*factor/100),0)));check(exposure<=s.bank+s.pot,'The bank cannot cover these bets.');}
  for(const b of s.bets){b.accepted=b.amount;b.refund=0;}
 }
 s.phase='closed';}
 else if(action==='roll'){check(gm&&s.phase==='closed','GM only.');s.dice=[random(6),random(6)];check(s.dice.every(n=>integer(n,1,6)),'Invalid random value.');s.phase='hidden';}
 else if(action==='reveal'){
 check(gm&&s.phase==='hidden','GM only.');s.result=s.dice.reduce((n,d)=>n+d,0)%2?'odd':'even';const rows=s.bets.filter(b=>b.side===s.result&&b.accepted>0);
 if(['A','C'].includes(s.variant)){
  s.fee=0;const factor=s.variant==='A'?200:s.payoutBasis;for(const b of rows){b.payout=Math.floor(b.accepted*factor/100);s.balances[b.id]+=b.payout;}s.bank+=s.pot-rows.reduce((n,b)=>n+b.payout,0);
 }else if(s.variant==='D'&&!rows.length){
  s.fee=0;s.carry=s.pot;for(const b of s.bets)s.carryContrib[b.id]=(s.carryContrib[b.id]??0)+b.accepted;
 }else{
  const matched=s.pot/2;s.fee=Math.floor((s.variant==='D'||s.feeBase==='pot'?s.pot:matched)*s.commission/100);
  const payout=s.variant==='D'?allocate(s.pot-s.fee,rows.map(b=>b.accepted)):s.feeBase==='profit'?allocate(matched-s.fee,rows.map(b=>b.accepted)).map((n,i)=>n+rows[i].accepted):allocate(s.pot-s.fee,rows.map(b=>b.accepted));
  rows.forEach((b,i)=>{b.payout=payout[i];s.balances[b.id]+=b.payout;});s.carry=0;s.carryContrib={};
 }
 s.winners=rows.map(b=>b.id);s.losers=s.bets.filter(b=>b.side!==s.result&&b.accepted>0).map(b=>b.id);s.phase='finished';
 }else throw Error('Unknown action.');}
 s.revision++;return s;
}
export class ChoSession{
 constructor(_scope,deps){Object.assign(this,deps);this.state=null;this.now=()=>Date.now();this.wait=0;}
 restore(s){if(s!==null&&(s.version!==1||s.game!=='chohan'))throw Error('Invalid game save.');this.state=structuredClone(s);this.updateNpcWait();}
 project(){return choView(this.state);}
 updateNpcWait(){this.wait=this.now()+5000;}
 async handle(data,user){
  if(!this.enabled()&&!(data.action==='abort'&&user.isGM))throw Error('Beta testing is disabled.');if(data.action==='read')return this.project();
  const old=this.state;check(['join','leave'].includes(data.action)||data.action==='abort'&&user.isGM||data.revision===(old?.revision??-1),'The game state changed. Please try again.');let next;
  if(['lobby','restart'].includes(data.action)){
   check(user.isGM,'GM only.');check(!old||['finished','aborted','lobby'].includes(old.phase),'Finish or end the current game first.');
   if(data.action==='restart'){check(old,'No game exists.');next=createCho(old);next.players=[...old.players];next.balances=structuredClone(old.balances);next.npcManual=structuredClone(old.npcManual);next.round=old.round+1;next.bank=old.bank??next.bank;next.carry=old.carry??0;next.carryContrib=structuredClone(old.carryContrib??{});}
   else{check(!old?.carry,'Resolve or refund the carried pot first.');const names=data.args?.npcs??[];check(Array.isArray(names)&&names.length<=20&&names.every(n=>typeof n==='string'&&n.trim()&&n.length<=60),'Invalid NPCs.');next=createCho({...data.args,npcs:Object.fromEntries(names.map(n=>['npc-'+crypto.randomUUID(),n.trim()]))});}
   next.revision=(old?.revision??0)+1;
  }else{const id=user.isGM&&old?.npcs?.[data.args?.id]?data.args.id:user.id;next=actCho(old,id,data.action,data.args,this.random,user.isGM);}
  await this.commit(next);return this.project();
 }
 async commit(next){
  await this.save(next);this.state=next;this.updateNpcWait();
  if(next.phase==='finished'&&!this.hasAnnouncement(next.gameId)){
   const name=id=>escapeHTML(next.npcs[id]??this.getName(id));try{await this.announce({content:`<h2>Chō-Han · ${f('Auswertung','Results')}</h2><p>${next.dice.join(' + ')} · ${next.result==='even'?f('Gerade','Even'):f('Ungerade','Odd')} · ${f('Topf','Pot')}: ${next.pot/next.unit} ${next.currency} · ${f('Provision','Commission')}: ${next.fee/next.unit}</p><p>${f('Gewonnen','Winners')}: ${next.winners.map(name).join(', ')||'–'}${next.carry?` · ${f('Übertrag','Carry-over')}: ${next.carry/next.unit} ${next.currency}`:''}</p><ul>${next.bets.map(b=>`<li>${name(b.id)}: ${f('Angenommen','Accepted')} ${b.accepted/next.unit}; ${f('Rückgabe','Refund')} ${b.refund/next.unit}; ${f('Auszahlung','Payout')} ${(b.payout??0)/next.unit}</li>`).join('')}</ul><p>${f('Nur interne Testmünzen. Kein Charaktergeld verändert.','Internal test coins only. Character currency unchanged.')}</p>`,flags:{taverngames:{game:'chohan',gameId:next.gameId}}});}catch(e){globalThis.ui?.notifications?.warn(e.message);}
  }
 }
 async npcStep(){if(!this.enabled()||!this.state||this.state.paused||this.state.phase!=='accepting'||this.now()<this.wait)return false;const s=this.state,id=s.players.find(id=>s.npcs[id]&&!s.npcManual[id]&&!s.bets.some(b=>b.id===id)&&s.balances[id]>=s.minStake*s.unit);if(!id)return false;await this.commit(actCho(s,id,'placeBet',{side:this.random(6)<=3?'even':'odd',amount:s.minStake},this.random));return true;}
}
