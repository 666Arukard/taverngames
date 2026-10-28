import {diceDiameter} from './dice-layout.mjs';
// Screen-space strip below the score sheet, without any interaction over its cells.
export function kniffelDiceStrip({sheet,stage,canvas,hudTop,count,width,height}){
 if(!sheet||!stage||!canvas||!count||canvas.width<=0||canvas.height<=0)return null;
 const left=Math.max(12,stage.left,canvas.left)+8,right=Math.min(width-12,stage.right,canvas.right)-8,top=Math.max(sheet.bottom+12,canvas.top+12),bottom=Math.min(height-85,hudTop-12,canvas.bottom-12),space=bottom-top;
 if(right-left<120||space<24)return null;
 const diameter=Math.min(count===6?100:72,space-4,(right-left)/(count*1.22)),gap=diameter*1.22,center=(left+right)/2,y=(top+bottom)/2;
 return {diameter,positions:Array.from({length:count},(_,i)=>({x:center+(i-(count-1)/2)*gap,y}))};
}
export function screenToDiceWorld(point,height,box,vector){
 try{const canvas=(box.renderer?.domElement??box.canvas)?.getBoundingClientRect?.(),camera=box.camera;if(!canvas?.width||!canvas.height||!camera||!vector?.clone)return null;const x=2*(point.x-canvas.left)/canvas.width-1,y=1-2*(point.y-canvas.top)/canvas.height,near=vector.clone().set(x,y,-1).unproject(camera),far=vector.clone().set(x,y,1).unproject(camera),dy=far.y-near.y;if(Math.abs(dy)<1e-9)return null;const t=(height-near.y)/dy;if(!Number.isFinite(t)||t<0)return null;const position={x:near.x+(far.x-near.x)*t,y:height,z:near.z+(far.z-near.z)*t};return Object.values(position).every(Number.isFinite)?position:null;}catch{return null;}
}
export function kniffelFieldPlan({box,items,diameter}){
 const doc=globalThis.document,stage=doc?.querySelector('#taverngames-kniffel-stage'),sheet=stage?.querySelector('.kniffel-sheet-scroll'),canvas=(box?.renderer?.domElement??box?.canvas)?.getBoundingClientRect?.();if(!stage?.isConnected||!sheet||!canvas||!items.length)return null;
 const sr=stage.getBoundingClientRect(),sheetRect=sheet.getBoundingClientRect(),hud=doc.querySelector('.taverngames-table-actions')?.getBoundingClientRect(),strip=kniffelDiceStrip({sheet:sheetRect,stage:sr,canvas,hudTop:hud?.height?hud.top:innerHeight-65,count:items.length,width:innerWidth,height:innerHeight});if(!strip)return null;
 const vector=items[0].entry.mesh.position,point=strip.positions[0],a=screenToDiceWorld({x:point.x-strip.diameter/2,y:point.y},0,box,vector),b=screenToDiceWorld({x:point.x+strip.diameter/2,y:point.y},0,box,vector);if(!a||!b)return null;const scale=Math.min(items.length===6?1.7:1,Math.hypot(b.x-a.x,b.z-a.z)/diameter);if(!Number.isFinite(scale)||scale<=0)return null;
 const positions=items.map((item,i)=>screenToDiceWorld(strip.positions[i],(item.pose?.height??.02)*scale,box,vector));if(positions.some(p=>!p))return null;return {scale,positions};
}

export function kniffelDieHitSize(mesh,camera,rect){
 try{const center=mesh.getWorldPosition(mesh.position.clone()),origin=center.clone().project(camera),radius=diceDiameter(mesh)/2;let extent=0;for(const axis of ['x','y','z'])for(const sign of [-1,1]){const p=center.clone();p[axis]+=radius;const q=p.project(camera);extent=Math.max(extent,Math.abs(q.x-origin.x)*rect.width/2,Math.abs(q.y-origin.y)*rect.height/2);}return Number.isFinite(extent)&&extent>0?Math.max(32,Math.min(96,extent*2)):42;}catch{return 42;}
}
