import {f} from './farkle-text.mjs';

export function aalControlOwner(state,user) {
  if (!state || !['rolling','betting','roundEnd'].includes(state.phase)) return null;
  const eligible=id=>state.players.includes(id)&&!state.folded.includes(id)&&!Object.hasOwn(state.eliminatedAt,id);
  if (state.phase==='roundEnd') return user.isGM||eligible(user.id)?user.id:null;
  if (state.phase==='betting') {
    const id=state.pending[0];
    return id===user.id||user.isGM&&state.npcs[id]&&state.npcManual[id]?id:null;
  }
  if (eligible(user.id)) return user.id;
  return user.isGM?state.players.find(id=>eligible(id)&&state.npcs[id]&&state.npcManual[id]&&!state.rolled.includes(id))??null:null;
}

export function installAalTableControls({game,view,getState}) {
  let root,signature;
  function update() {
    const g=game(),state=getState('aalstechen'),kind='aalstechen-table';
    const entry=view.entries.get(kind),owner=aalControlOwner(state,g.user);
    if (!view.enabled()||view.selected!==kind||!entry||!owner) {
      root?.remove();
      root=null;
      signature=null;
      return;
    }
    const findRow=()=>[...entry.root.querySelectorAll('[data-aal-player]')].find(row=>row.dataset.aalPlayer===owner);
    const source=state.phase==='roundEnd'?entry.root:findRow();
    const buttons=[...(source?.querySelectorAll('button')??[])].filter(button=>
      state.phase!=='roundEnd'||button.textContent===f('Nächste Würfelrunde','Next dice round'));
    const next=JSON.stringify([state.gameId,state.phase,state.revision,owner,state.paused,state.animationActors,
      buttons.map(button=>[button.textContent,button.disabled])]);
    if (signature===next) return;
    signature=next;
    root??=document.createElement('nav');
    root.className='taverngames-table-actions taverngames-aal-actions';
    root.setAttribute('aria-label',f('Aalstechen · Spielaktionen','Aalstechen · Game actions'));
    root.replaceChildren();
    const launch=document.querySelector('.taverngames-launchers:not([hidden])')?.getBoundingClientRect();
    root.style.setProperty('--tg-roll-bottom',(launch?.height?Math.max(25,innerHeight-launch.top+12):25)+'px');
    const original=source?.querySelector('[data-aal-raise]');
    let amount;
    if (original) {
      const label=document.createElement('label');
      label.textContent=f('Erhöhen auf','Raise to');
      amount=original.cloneNode();
      amount.removeAttribute('data-aal-raise');
      amount.value=original.value;
      label.append(amount);
      root.append(label);
    }
    for (const button of buttons) {
      const label=button.textContent;
      const copy=document.createElement('button');
      copy.type='button';
      copy.textContent=label;
      copy.disabled=button.disabled||state.paused;
      copy.onclick=()=>{
        const fresh=getState('aalstechen');
        if (view.selected!==kind||fresh?.gameId!==state.gameId||fresh.paused||aalControlOwner(fresh,g.user)!==owner) return;
        const current=fresh.phase==='roundEnd'?entry.root:findRow();
        const live=[...(current?.querySelectorAll('button')??[])].find(item=>item.textContent===label);
        if (!live||live.disabled) return;
        if (amount&&label===f('Erhöhen','Raise')) {
          const input=current.querySelector('[data-aal-raise]');
          if (!input) return;
          input.value=amount.value;
        }
        live.click();
      };
      root.append(copy);
    }
    if (!root.isConnected) document.body.append(root);
  }
  const timer=setInterval(update,250);
  timer?.unref?.();
  view.observePresentation(update);
  return update;
}
