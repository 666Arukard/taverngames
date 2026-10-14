let layer=100;
export function clampPosition(left,top,width,viewportWidth,viewportHeight) {
  return {left:Math.max(0,Math.min(left,Math.max(0,viewportWidth-width))),top:Math.max(0,Math.min(top,Math.max(0,viewportHeight-48)))};
}
export function movable(element,initial,onMove=()=>{}) {
  let drag=null;
  const place=(left,top)=>{
    const position=clampPosition(left,top,element.getBoundingClientRect().width,window.innerWidth,window.innerHeight);
    element.style.left=`${position.left}px`;element.style.top=`${position.top}px`;element.style.right='auto';onMove(position);
    element.style.maxHeight=`${Math.max(48,window.innerHeight-position.top-12)}px`;
  };
  place(initial.left,initial.top);
  element.addEventListener('pointerdown',event=>{
    element.style.zIndex=String(++layer);
    if(event.button!==0||!event.target.closest('header')||event.target.closest('button,input,a'))return;
    const rect=element.getBoundingClientRect();drag={id:event.pointerId,x:event.clientX-rect.left,y:event.clientY-rect.top};
    element.setPointerCapture(event.pointerId);event.preventDefault();
  });
  element.addEventListener('pointermove',event=>{if(drag?.id===event.pointerId)place(event.clientX-drag.x,event.clientY-drag.y);});
  const stop=event=>{if(drag?.id===event.pointerId){drag=null;if(element.hasPointerCapture(event.pointerId))element.releasePointerCapture(event.pointerId);}};
  element.addEventListener('pointerup',stop);element.addEventListener('pointercancel',stop);element.addEventListener('lostpointercapture',()=>{drag=null;});
  element.addEventListener('keydown',event=>{
    if(event.target.tagName!=='HEADER'||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    const rect=element.getBoundingClientRect(),step=event.shiftKey?5:20;
    place(rect.left+(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0),rect.top+(event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0));event.preventDefault();
  });
  return ()=>{const rect=element.getBoundingClientRect();place(rect.left,rect.top);};
}
