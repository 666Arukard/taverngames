import {startingOrder,secureIndex} from './start-choice.mjs';
import {NPC_LEVELS,npcLevel,chooseNpc,setNpcDifficulty} from './board-npc.mjs';
const check=(v,m)=>{if(!v)throw Error(m);};
export const cellEdges=(x,y)=>[`h:${x}:${y}`,`h:${x}:${y+1}`,`v:${x}:${y}`,`v:${x+1}:${y}`];
export function edgeParts(edge,w,h){const m=/^([hv]):(\d+):(\d+)$/.exec(edge);if(!m)return null;const [,axis,a,b]=m,x=Number(a),y=Number(b);return x>=0&&y>=0&&x<(axis==='h'?w:w+1)&&y<(axis==='v'?h:h+1)?{axis,x,y}:null;}
export function rectangleOutline(w,h){return [...Array.from({length:w},(_,x)=>[`h:${x}:0`,`h:${x}:${h}`]).flat(),...Array.from({length:h},(_,y)=>[`v:0:${y}`,`v:${w}:${y}`]).flat()];}
export function dotsShape(w,h,outline=null){
 check(Number.isInteger(w)&&w>=1&&w<=50&&Number.isInteger(h)&&h>=1&&h<=50,'Grid size must be between 1 and 50.');
 const boundary=outline??rectangleOutline(w,h);check(Array.isArray(boundary)&&boundary.length<=5100&&boundary.length>=4&&new Set(boundary).size===boundary.length&&boundary.every(e=>typeof e==='string'&&edgeParts(e,w,h)),'Draw a closed outline.');
 const walls=new Set(boundary),cells=[];
 for(let y=0;y<h;y++){let inside=false;for(let x=w-1;x>=0;x--){if(walls.has(`v:${x+1}:${y}`))inside=!inside;if(inside)cells.push(y*w+x);}}
 check(cells.length,'Draw a closed outline.');const active=new Set(cells),perimeter=new Set(),edges=new Set(),vertices=new Map();
 for(const c of cells){const x=c%w,y=Math.floor(c/w);for(const e of cellEdges(x,y))edges.add(e);for(const [dx,dy,e]of [[0,-1,`h:${x}:${y}`],[0,1,`h:${x}:${y+1}`],[-1,0,`v:${x}:${y}`],[1,0,`v:${x+1}:${y}`]])if(x+dx<0||x+dx>=w||y+dy<0||y+dy>=h||!active.has((y+dy)*w+x+dx))perimeter.add(e);}
 check(perimeter.size===walls.size&&[...walls].every(e=>perimeter.has(e)),'Draw a closed outline.');
 for(const e of boundary){const {axis,x,y}=edgeParts(e,w,h);for(const v of [`${x}:${y}`,`${x+(axis==='h'?1:0)}:${y+(axis==='v'?1:0)}`])vertices.set(v,(vertices.get(v)??0)+1);}
 check([...vertices.values()].every(n=>n===2),'Outline must not cross or touch itself.');
 return {cells:cells.sort((a,b)=>a-b),edges:[...edges].sort(),outline:[...boundary].sort()};
}
export function createDots(o={}){
 const width=o.width??6,height=o.height??6,shape=dotsShape(width,height,o.outline??null),roundLimit=o.roundLimit??1;
 check(Number.isInteger(roundLimit)&&roundLimit>=1&&roundLimit<=100,'Invalid round count.');check(Object.keys(o.npcs??{}).length<=2,'Two players required.');
 return {version:1,game:'dots',gameId:null,revision:0,phase:'lobby',custom:o.custom===true,width,height,...shape,lines:{},boxes:{},players:Object.keys(o.npcs??{}),npcs:structuredClone(o.npcs??{}),npcManual:{},npcDifficulty:Object.fromEntries(Object.keys(o.npcs??{}).map(id=>[id,NPC_LEVELS.includes(o.npcDifficulty?.[id])?o.npcDifficulty[id]:'normal'])),order:[],turn:0,round:1,roundLimit,startSelection:o.startSelection??'rules',scores:{},roundScores:{},winners:[],losers:[],paused:false,lastEdge:null};
}
export function adjacentCells(s,edge){const p=edgeParts(edge,s.width,s.height);if(!p)return [];const {axis,x,y}=p;return (axis==='h'?[[x,y-1],[x,y]]:[[x-1,y],[x,y]]).filter(([a,b])=>a>=0&&a<s.width&&b>=0&&b<s.height).map(([a,b])=>b*s.width+a);}
export function actDots(old,id,action,args={},gm=false){
 check(old?.game==='dots','No game exists.');const s=structuredClone(old);s.revision++;const admin=()=>check(gm,'GM only.');
 if(action==='abort'){admin();s.phase='aborted';s.winners=[];s.losers=[];return s;}if(action==='pause'){admin();s.paused=!s.paused;return s;}if(action==='npcDifficulty')return setNpcDifficulty(s,args,gm);if(action==='npcControl'){admin();check(s.npcs[args.id],'Invalid NPC.');s.npcManual[args.id]=args.manual===true;return s;}check(!s.paused,'Game is paused.');
 if(action==='join'){check(s.phase==='lobby'&&!s.players.includes(id)&&s.players.length<2,'Two players required.');s.players.push(id);}
 else if(action==='leave'){check(s.phase==='lobby','Leave in the lobby.');s.players=s.players.filter(p=>p!==id);}
 else if(action==='begin'){admin();check(s.phase==='lobby'&&s.players.length===2,'Two players required.');s.order=startingOrder(s);s.scores=Object.fromEntries(s.players.map(p=>[p,0]));s.roundScores={...s.scores};s.phase='playing';}
 else if(action==='nextRound'){admin();check(s.phase==='roundEnd','Round is not finished.');s.round++;s.lines={};s.boxes={};s.roundScores=Object.fromEntries(s.players.map(p=>[p,0]));s.order.reverse();s.turn=0;s.lastEdge=null;s.phase='playing';}
 else if(action==='line'){
  check(s.phase==='playing'&&s.order[s.turn]===id,'Not your turn.');check(typeof args.edge==='string'&&s.edges.includes(args.edge)&&!Object.hasOwn(s.lines,args.edge),'Choose an unused board edge.');s.lines[args.edge]=id;s.lastEdge=args.edge;
  const active=new Set(s.cells),captured=adjacentCells(s,args.edge).filter(c=>active.has(c)&&!Object.hasOwn(s.boxes,c)&&cellEdges(c%s.width,Math.floor(c/s.width)).every(e=>Object.hasOwn(s.lines,e)));
  for(const c of captured)s.boxes[c]=id;s.roundScores[id]+=captured.length;s.scores[id]+=captured.length;
  if(Object.keys(s.boxes).length===s.cells.length){if(s.round<s.roundLimit)s.phase='roundEnd';else{s.phase='finished';const best=Math.max(...Object.values(s.scores));s.winners=s.players.filter(p=>s.scores[p]===best);s.losers=s.players.filter(p=>s.scores[p]<best);s.draw=s.winners.length!==1;}}
  else if(!captured.length)s.turn=1-s.turn;
 }else throw Error('Unknown action.');return s;
}
export function dotsNpc(s,random=secureIndex){
 if(s?.phase!=='playing'||s.paused)return null;const id=s.order[s.turn];if(!s.npcs[id]||s.npcManual[id])return null;const active=new Set(s.cells),level=npcLevel(s,id);
 const scores=s.edges.filter(e=>!Object.hasOwn(s.lines,e)).map(edge=>{let gain=0,risk=0,open=0;for(const c of adjacentCells(s,edge)){if(!active.has(c))continue;const n=cellEdges(c%s.width,Math.floor(c/s.width)).filter(e=>Object.hasOwn(s.lines,e)).length;if(n===3)gain++;else if(n===2)risk++;else open+=n;}return {edge,win:gain>0,score:gain*1000-risk*(level==='hard'?100:20)-open};});
 if(!scores.length)return null;return {id,action:'line',args:{edge:chooseNpc(scores,level,random).edge}};
}
