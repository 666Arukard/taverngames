// Docked views scroll in an ancestor; floating windows scroll inside the root.
// Replacing content can clamp either container to zero during the redraw.
export function withScroll(root,draw){
 if(!root)return draw();
 const containers=[];for(let element=root;element;element=element.parentElement)containers.push({element,top:element.scrollTop,left:element.scrollLeft});
 const contents=[...root.querySelectorAll('.schocken-content')].map(element=>({top:element.scrollTop,left:element.scrollLeft}));
 try{return draw();}finally{
  const next=root.querySelectorAll('.schocken-content');for(let i=0;i<contents.length;i++)if(next[i]){next[i].scrollTop=contents[i].top;next[i].scrollLeft=contents[i].left;}
  // Restore inner containers first, then their ancestors, without moving focus.
  for(const {element,top,left}of containers){element.scrollTop=top;element.scrollLeft=left;}
 }
}
export function keepModerationScroll(owner,kind){const draw=owner.drawModeration.bind(owner);owner.drawModeration=(...args)=>withScroll(owner.windows.get(kind)?.root,()=>draw(...args));}
