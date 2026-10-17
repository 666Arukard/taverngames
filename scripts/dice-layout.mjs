const positive=(n,fallback)=>Number.isFinite(n)&&n>0?n:fallback;
// Conservative world-space diameter, including model children, rotations and scale.
export function diceDiameter(mesh,fallback=0.05){
 const bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};let found=false;
 mesh?.parent?.updateWorldMatrix?.(true,true);mesh?.updateWorldMatrix?.(true,true);
 const visit=node=>{node.geometry?.computeBoundingBox?.();const box=node.geometry?.boundingBox;if(!box?.clone||!node.matrixWorld)return;
  const b=box.clone().applyMatrix4(node.matrixWorld);for(const [i,k]of ['x','y','z'].entries()){bounds.min[i]=Math.min(bounds.min[i],b.min[k]);bounds.max[i]=Math.max(bounds.max[i],b.max[k]);}found=true;
 };
 if(mesh?.traverse)mesh.traverse(visit);else visit(mesh??{});
 if(found){const origin=mesh?.parent?.matrixWorld?.elements;if(origin?.length===16)return positive(2*Math.hypot(...bounds.max.map((n,i)=>Math.max(Math.abs(n-origin[12+i]),Math.abs(bounds.min[i]-origin[12+i])))),fallback);return positive(Math.hypot(...bounds.max.map((n,i)=>n-bounds.min[i])),fallback);}
 const radius=mesh?.geometry?.boundingSphere?.radius;if(Number.isFinite(radius)){let scale=1;for(let node=mesh;node;node=node.parent)scale*=Math.max(Math.abs(node.scale?.x??1),Math.abs(node.scale?.y??1),Math.abs(node.scale?.z??1));return positive(radius*2*scale,fallback);}
 return fallback;
}
export function diceViewport(box){const display=box?.display??box?.diceScene?.display;return {width:positive(display?.innerWidth,1),height:positive(display?.innerHeight,0.65)};}
// Group by stable cup slot (five dice), but lay out only currently visible pieces.
// Every slot has a bounding diameter plus padding, rather than a fixed percentage.
export function groupedDiceLayout(indices,{width=1,height=0.65,diameter=0.05}={}){
 width=positive(width,1);height=positive(height,0.65);diameter=positive(diameter,0.05);
 const groups=new Map();for(const index of [...indices].sort((a,b)=>a-b)){const id=Math.floor(index/5);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(index);}
 const cups=[...groups.values()];if(!cups.length)return {positions:new Map(),scale:1,diameter};
 const maxCount=Math.max(...cups.map(c=>c.length)),dx=diameter*1.28/width,dy=diameter*1.28/height;let best;
 for(let columns=1;columns<=maxCount;columns++)for(let across=1;across<=cups.length;across++){
  const cupW=columns*dx,cupH=Math.ceil(maxCount/columns)*dy,rows=Math.ceil(cups.length/across),totalW=across*cupW+(across-1)*dx*0.65,totalH=rows*cupH+(rows-1)*dy*0.8;
  const scale=Math.min(1,0.84/totalW,0.78/totalH),compact=Math.max(totalW/0.84,totalH/0.78);
  if(!best||scale>best.scale+1e-8||Math.abs(scale-best.scale)<1e-8&&(columns>best.columns||columns===best.columns&&compact<best.compact))best={columns,across,cupW,cupH,totalW,totalH,scale,compact};
 }
 const positions=new Map(),b=best,left=(1-b.totalW*b.scale)/2,top=(1-b.totalH*b.scale)/2;
 cups.forEach((cup,n)=>cup.forEach((index,i)=>positions.set(index,{x:left+(n%b.across*(b.cupW+dx*0.65)+(i%b.columns+0.5)*dx)*b.scale,y:top+(Math.floor(n/b.across)*(b.cupH+dy*0.8)+(Math.floor(i/b.columns)+0.5)*dy)*b.scale})));
 return {positions,scale:b.scale,diameter,columns:b.columns,across:b.across};
}
