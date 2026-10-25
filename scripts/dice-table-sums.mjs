import {f} from './farkle-text.mjs';
import {diceDiameter,diceViewport} from './dice-layout.mjs';

// Read only the locally projected persistent poses, never authoritative rolls or
// mesh.forcedResult (which may contain a placeholder for a concealed die).
export function visibleDiceSum(values){
 const known=values.filter(Number.isFinite),hidden=values.some(v=>v===null);
 if(!known.length)return hidden?'?':null;
 return String(known.reduce((sum,value)=>sum+value,0))+(hidden?' + ?':'');
}

export function installDiceTableSums({game,view,renderers}){
 let root=null;
 const update=()=>{
  if(!globalThis.document)return;
  const entry=view.entries.get(view.selected),g=game(),renderer=entry&&renderers(entry.scope);
  const box=g.dice3d?.box,canvas=box?.renderer?.domElement??g.dice3d?.canvas,rect=canvas?.getBoundingClientRect?.();
  if(!view.enabled()||!entry||entry.scope==='aalstechen'||!renderer||!rect||!g.settings.get('taverngames','diceSoNiceBeta')){root?.remove();root=null;return;}
  root??=Object.assign(document.createElement('div'),{className:'taverngames-dice-sums'});
  if(!root.isConnected)document.body.append(root);
  const groups=renderer.renderers??new Map([['',renderer]]),active=new Set(),labels=[];
  for(const [owner,r] of groups){
   const values=[],points=[];
   for(const [index,{mesh}] of r.meshes??[]){
    if(mesh.visible===false||mesh.parent?.visible===false)continue;
    const pose=r.poses?.get(index);if(!pose||!(pose.value===null||Number.isFinite(pose.value)))continue;
    let point;try{point=mesh.getWorldPosition(mesh.position.clone()).project(box.camera);}catch{}
    if(!point||point.z < -1||point.z > 1||Math.abs(point.x)>1||Math.abs(point.y)>1)continue;
    const y=rect.top+(1-point.y)*rect.height/2,clearance=Math.max(80,diceDiameter(mesh,.04)/diceViewport(box).height*rect.height/2+24);
    values.push(pose.value);points.push({x:rect.left+(point.x+1)*rect.width/2,y,top:y-clearance});
   }
   const sum=visibleDiceSum(values);if(sum===null)continue;
   active.add(String(owner));let label=[...root.children].find(el=>el.dataset.owner===String(owner));
   if(!label){label=document.createElement('div');label.className='taverngames-dice-sum';label.dataset.owner=String(owner);root.append(label);}
   label.textContent=f('Summe: ','Sum: ')+sum;
   label.style.left=Math.min(Math.max(points.reduce((n,p)=>n+p.x,0)/points.length,65),innerWidth-65)+'px';
   labels.push({label,top:Math.min(...points.map(p=>p.top))});
  }
  const top=Math.max(8,Math.min(...labels.map(v=>v.top)));
  for(const {label}of labels)label.style.top=top+'px';
  for(const label of [...root.children])if(!active.has(label.dataset.owner))label.remove();
 };
 const timer=setInterval(update,250);timer?.unref?.();view.observePresentation(update);return update;
}
