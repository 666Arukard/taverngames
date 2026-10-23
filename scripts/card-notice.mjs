// Local, click-through presentation. No chat messages, rules state or secret cards.
export function updateCardNotice(owner,{key,text,active,duration=1800,container=null}){
 if(!globalThis.document)return 0;
 if(!active){owner.cardNotice?.remove();return 0;}
 if(owner.cardNoticeKey!==key){owner.cardNoticeKey=key;owner.cardNoticeUntil=Date.now()+duration;}
 const remaining=Math.max(0,(owner.cardNoticeUntil??0)-Date.now());
 if(!remaining){owner.cardNotice?.remove();return 0;}
 owner.cardNotice??=Object.assign(document.createElement('div'),{className:'taverngames-card-announcement'});
 owner.cardNotice.setAttribute('role','status');owner.cardNotice.setAttribute('aria-live','polite');
 if(owner.cardNotice.textContent!==text)owner.cardNotice.textContent=text;
 owner.cardNotice.classList.toggle('is-inline',!!container);
 const parent=container??document.body;if(owner.cardNotice.parentElement!==parent)parent.append(owner.cardNotice);
 return remaining;
}
