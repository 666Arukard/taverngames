import {createConnect,actConnect} from './connect-four-engine.mjs';
import {npcLevel} from './board-npc.mjs';
import {secureIndex} from './start-choice.mjs';
const check=(ok,message)=>{if(!ok)throw Error(message);};
export const FLEET=Object.freeze([5,4,3,3,2]);
const around=(cell,diagonal=true)=>{const x=cell%10,y=Math.floor(cell/10),out=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&(diagonal||!dx||!dy)&&x+dx>=0&&x+dx<10&&y+dy>=0&&y+dy<10)out.push((y+dy)*10+x+dx);return out;};
export function shipCells(index,start,vertical=false){if(!Number.isInteger(index)||index<0||index>=5||!Number.isInteger(start)||start<0||start>=100||typeof vertical!=='boolean')return null;const n=FLEET[index],x=start%10,y=Math.floor(start/10);if(vertical?y+n>10:x+n>10)return null;return Array.from({length:n},(_,i)=>start+i*(vertical?10:1));}
export function canPlaceShip(ships,index,start,vertical=false){const cells=shipCells(index,start,vertical);if(!cells)return false;const occupied=new Set(ships.flatMap((p,i)=>i===index?[]:p??[]));return cells.every(cell=>!occupied.has(cell)&&around(cell).every(c=>!occupied.has(c)));}
function shuffled(rows,random){const out=[...rows];for(let i=out.length-1;i>0;i--){const j=random(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}
export function randomFleet(random=secureIndex){const ships=Array(5).fill(null);const place=index=>{if(index===5)return true;for(const [start,vertical]of shuffled(Array.from({length:200},(_,i)=>[i%100,i>=100]),random))if(canPlaceShip(ships,index,start,vertical)){ships[index]=shipCells(index,start,vertical);if(place(index+1))return true;ships[index]=null;}return false;};check(place(0),'Battleship: no valid fleet placement.');return ships;}
export function completeFleet(ships){return Array.isArray(ships)&&ships.length===5&&ships.every((cells,i)=>Array.isArray(cells)&&cells.length===FLEET[i]&&[false,true].some(vertical=>JSON.stringify(shipCells(i,cells[0],vertical))===JSON.stringify(cells)&&canPlaceShip(ships,i,cells[0],vertical)));}
export function createBattleship(o={}){return {...createConnect(o),game:'battleship',board:[],fleet:[...FLEET],placements:{},ready:[],shots:{},sunk:{},roundWinner:null,lastShot:null,repeatOnHit:o.repeatOnHit!==false,gmPeek:false};}
function resetRound(s){s.placements=Object.fromEntries(s.players.map(id=>[id,Array(5).fill(null)]));s.shots=Object.fromEntries(s.players.map(id=>[id,{}]));s.sunk=Object.fromEntries(s.players.map(id=>[id,[]]));s.ready=[];s.lastShot=null;s.roundWinner=null;s.phase='placing';s.turn=0;}
export function actBattleship(old,id,action,a={},gm=false,random=secureIndex){check(old?.game==='battleship','No game exists.');
 if(['abort','pause','npcControl','npcDifficulty','join','leave','begin'].includes(action)){const s=actConnect(old,id,action,a,gm);if(action==='begin')resetRound(s);return s;}
 const s=structuredClone(old);s.revision++;
 if(action==='peek'){check(gm,'GM only.');s.gmPeek=a.enabled===true;return s;}
 check(!s.paused,'Game is paused.');
 if(action==='nextRound'){check(gm&&s.phase==='roundEnd','GM only.');s.round++;s.order.reverse();resetRound(s);return s;}
 if(['place','unplace','clear','autoPlace','ready'].includes(action)){
  check(s.phase==='placing'&&s.players.includes(id)&&!s.ready.includes(id),'Battleship: placement is closed.');check(a.gameId===s.gameId&&a.round===s.round,'Battleship: this action belongs to another round.');
  if(action==='place'){check(canPlaceShip(s.placements[id],a.ship,a.start,a.vertical),'Battleship: ships cannot overlap, touch or leave the board.');s.placements[id][a.ship]=shipCells(a.ship,a.start,a.vertical);}
  if(action==='unplace'){check(Number.isInteger(a.ship)&&a.ship>=0&&a.ship<5,'Battleship: select a ship.');s.placements[id][a.ship]=null;}
  if(action==='clear')s.placements[id]=Array(5).fill(null);
  if(action==='autoPlace'){check(gm,'GM only.');s.placements[id]=randomFleet(random);}
  if(action==='ready'){check(completeFleet(s.placements[id]),'Battleship: place all five ships first.');s.ready.push(id);if(s.ready.length===2)s.phase='playing';}
  return s;
 }
 check(action==='shoot'&&s.phase==='playing'&&s.order[s.turn]===id,'Not your turn.');const cell=a.cell;check(Number.isInteger(cell)&&cell>=0&&cell<100&&!Object.hasOwn(s.shots[id],cell),'Battleship: choose a cell not fired at before.');
 const other=s.order[1-s.turn],ship=s.placements[other].findIndex(cells=>cells.includes(cell)),hit=ship>=0;s.shots[id][cell]=hit?'hit':'miss';let sunkLength=0;if(hit&&!s.sunk[other].includes(ship)&&s.placements[other][ship].every(c=>s.shots[id][c]==='hit')){s.sunk[other].push(ship);sunkLength=FLEET[ship];}s.lastShot={id,cell,hit,sunkLength};
 if(s.sunk[other].length===5){s.roundWinner=id;s.scores[id]++;if(s.round<s.roundLimit)s.phase='roundEnd';else{s.phase='finished';const top=Math.max(...Object.values(s.scores));s.winners=s.players.filter(id=>s.scores[id]===top);s.losers=s.players.filter(id=>!s.winners.includes(id));s.draw=s.winners.length===2;}}else if(!hit||!s.repeatOnHit)s.turn=1-s.turn;
 return s;
}
export function battleshipView(s,user={}){if(!s)return null;const v=structuredClone(s),reveal=['roundEnd','finished'].includes(s.phase);v.revealed=Object.fromEntries(s.players.map(id=>[id,(s.sunk[id]??[]).map(i=>({ship:i,cells:[...s.placements[id][i]]}))]));for(const id of s.players)if(!reveal&&id!==user.id&&!(user.isGM&&(s.gmPeek||s.npcs[id]&&s.npcManual[id])))v.placements[id]=Array(5).fill(null);if(!user.isGM)delete v.gmPeek;return v;}
// Target selection consumes only public shots and publicly revealed sunk ships.
export function battleshipTarget(shots,revealed,level,random=secureIndex){const fired=new Set(Object.keys(shots).map(Number)),sunk=new Set(revealed.flatMap(p=>p.cells)),hits=[...fired].filter(c=>shots[c]==='hit'&&!sunk.has(c)),free=Array.from({length:100},(_,i)=>i).filter(i=>!fired.has(i));if(!free.length)return null;const choose=rows=>rows[random(rows.length)];if(level==='easy')return choose(free);
 let targets=[];if(level==='hard')for(const hit of hits){const group=new Set([hit]),queue=[hit];while(queue.length){for(const cell of around(queue.pop(),false))if(hits.includes(cell)&&!group.has(cell)){group.add(cell);queue.push(cell);}}if(group.size>=2){const cells=[...group].sort((a,b)=>a-b),step=cells.every(c=>Math.floor(c/10)===Math.floor(cells[0]/10))?1:10;targets.push(cells[0]-step,cells.at(-1)+step);targets=targets.filter(c=>c>=0&&c<100&&!fired.has(c)&& (step===10||Math.floor(c/10)===Math.floor(cells[0]/10)));if(targets.length)break;}}
 if(!targets.length)targets=[...new Set(hits.flatMap(c=>around(c,false)))].filter(c=>!fired.has(c));if(targets.length)return choose(targets);
 if(level==='hard'){const forbidden=new Set([...sunk,...[...sunk].flatMap(c=>around(c))]),hunt=free.filter(c=>!forbidden.has(c)),parity=hunt.filter(c=>(c%10+Math.floor(c/10))%2===0);return choose(parity.length?parity:hunt.length?hunt:free);}return choose(free);
}
export function battleshipNpc(s,random=secureIndex){if(!s||s.paused)return null;if(s.phase==='placing'){const id=s.order.find(id=>s.npcs[id]&&!s.npcManual[id]&&!s.ready.includes(id));if(!id)return null;return {id,action:completeFleet(s.placements[id])?'ready':'autoPlace',args:{gameId:s.gameId,round:s.round}};}if(s.phase!=='playing')return null;const id=s.order[s.turn];if(!s.npcs[id]||s.npcManual[id])return null;const other=s.order[1-s.turn],v=battleshipView(s,{id}),cell=battleshipTarget(v.shots[id],v.revealed[other],npcLevel(s,id),random);return cell===null?null:{id,action:'shoot',args:{cell}};}
