// Synchronous moderation redraws retain the user's position in the content.
export function withScroll(root,draw){const content=root?.querySelector('.schocken-content'),top=content?.scrollTop??0,left=content?.scrollLeft??0;try{return draw();}finally{const next=root?.querySelector('.schocken-content');if(next){next.scrollTop=top;next.scrollLeft=left;}}}
export function keepModerationScroll(owner,kind){const draw=owner.drawModeration.bind(owner);owner.drawModeration=(...args)=>withScroll(owner.windows.get(kind)?.root,()=>draw(...args));}
