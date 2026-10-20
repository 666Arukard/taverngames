import {gameView} from './game-view.mjs';
import {language} from './i18n.mjs';
const label=()=>language()==='de'?'TavernGames · Spielmenü':'TavernGames · game menu';
const selector='[data-action="control"][data-control="taverngames"], [data-control="taverngames"]';
const wired=new WeakSet();
export function registerTavernControls(controls,view=gameView){
 const visible=view.enabled()&&view.hasLobby();
 controls.taverngames={name:'taverngames',title:label(),icon:'taverngames-icon',order:Math.max(-1,...Object.values(controls).filter(c=>c.name!=='taverngames').map(c=>Number(c.order)||0))+1,visible,tools:{menu:{name:'menu',title:label(),icon:'taverngames-icon',order:0,button:true,onChange:()=>view.toggleMenu()}},onChange:(_event,active)=>{if(active)view.setCollapsed(false);}};
}
export function syncNativeControls(view=gameView){
 const controls=globalThis.ui?.controls,available=view.enabled()&&view.hasLobby();
 if(view.nativeAvailability!==available){view.nativeAvailability=available;void controls?.render?.({force:true});}
 const root=controls?.element,button=root?.querySelector?.(selector),native=available&&button?.isConnected;
 if(root&&button&&!wired.has(root)){wired.add(root);root.addEventListener('click',event=>{const own=event.target.closest?.(selector);if(!own||!root.contains(own)||!view.enabled()||!view.hasLobby())return;event.preventDefault();event.stopImmediatePropagation();view.toggleMenu();},true);}
 if(button){button.setAttribute('aria-label',label());button.setAttribute('aria-expanded',String(available&&!view.collapsed));button.classList.toggle('taverngames-menu-open',available&&!view.collapsed);}
 if(view.left){view.left.classList.toggle('taverngames-native-access',!!native);const right=root?.getBoundingClientRect?.().right??0;view.left.style.left=native?Math.min(160,Math.max(48,right+8))+'px':'0px';}
}
gameView.nativeSync=()=>syncNativeControls(gameView);
