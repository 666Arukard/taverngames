import {CONTINUOUS_GAMES} from './continuous-play.mjs';
import {language} from './i18n.mjs';
import {gameTitle} from './tavern-text.mjs';
const text=(de,en)=>language()==='de'?de:en;
const element=(tag,label)=>{const e=document.createElement(tag);if(label)e.textContent=label;return e;};
// Presentation only: reuse the authorized content node, never duplicate game state.
export class GameView{
 constructor(){this.entries=new Map();this.selected=null;this.moderated=null;this.moves=new Map();this.tools=new Set();this.collapsed=false;this.catalogOnly=false;}
 configure(getState){this.getState=getState;if(!this.timer)this.timer=setInterval(()=>this.refresh(),250);this.timer?.unref?.();}
 track(kind,root,app){const scope=kind==='table'||kind==='moderation'?'schocken':kind==='farkle'?'farkle':kind.split('-')[0],role=kind==='table'||kind==='farkle'||kind.endsWith('-table')?'table':kind==='moderation'||kind.endsWith('-moderation')?'moderation':null;if(!role)return;const previous=this.entries.get(kind);if(previous&&previous.root!==root)this.restore(previous);this.entries.set(kind,{kind,scope,role,root,app});this.refresh();}
 untrack(kind){const e=this.entries.get(kind);if(e)this.restore(e);this.entries.delete(kind);this.refresh();}
 enabled(){try{return globalThis.game?.settings?.get('taverngames','gameViewMode')==='panel-beta';}catch{return false;}}
 active(s){return !!s&&s.phase!=='aborted'&&(s.phase!=='finished'||CONTINUOUS_GAMES.includes(s.game)&&!s.seriesClosed);}
 eligible(e){const s=this.getState?.(e.scope),joined=!!s&&(s.players??[]).includes(game.user.id)&&!(s.out??[]).includes(game.user.id)&&!(s.leaving??[]).includes(game.user.id);if(joined)e.joined=true;if(game.user.isGM)return true;return joined||(!this.active(s)&&e.joined&&this.moves.has(e.kind));}
 mount(e,destination){
  if(!destination?.isConnected||!e.app?.element?.isConnected||!e.root.isConnected)return false;
  if(!this.moves.has(e.kind)){const anchor=document.createComment('TavernGames content');e.root.before(anchor);this.moves.set(e.kind,{anchor,frame:e.app.element});}
  if(e.root.parentElement!==destination)destination.append(e.root);e.app.element.classList.add('taverngames-docked-frame');return true;
 }
 restore(e){const move=this.moves.get(e.kind);if(!move)return;if(move.anchor.isConnected)move.anchor.replaceWith(e.root);else e.app.element?.querySelector('.window-content')?.append(e.root);move.frame.classList.remove('taverngames-docked-frame');this.moves.delete(e.kind);}
 button(parent,label,fn){const b=element('button',label);b.type='button';b.onclick=fn;parent.append(b);return b;}
 panel(){if(this.left?.isConnected)return;this.left=element('aside');this.left.id='taverngames-player-panel';this.left.className='taverngames-window';this.left.setAttribute('aria-label',text('TavernGames Spielmenü · Beta','TavernGames game menu · Beta'));const header=element('header');this.left.append(header);this.toggle=this.button(header,text('Spielmenü zuklappen','Collapse game menu'),()=>{this.collapsed=!this.collapsed;this.left.classList.toggle('is-collapsed',this.collapsed);this.toggle.textContent=this.collapsed?text('Spielmenü öffnen','Expand game menu'):text('Spielmenü zuklappen','Collapse game menu');});this.selector=element('select');this.selector.setAttribute('aria-label',text('Aktives Spiel','Active game'));this.selector.onchange=()=>{this.selected=this.selector.value;this.refresh();};header.append(this.selector);this.button(header,text('Spielansicht schließen','Close game view'),()=>{const e=this.entries.get(this.selected);if(e)void e.app.close();});this.button(header,text('Fensteransicht','Window view'),()=>void game.settings.set('taverngames','gameViewMode','windows'));this.playerContent=element('div');this.playerContent.className='taverngames-panel-content';this.playerParking=element('div');this.playerParking.hidden=true;this.left.append(this.playerContent,this.playerParking);document.body.append(this.left);}
 selectOptions(select,entries,value){const key=entries.map(e=>e.scope).join('|');if(select.dataset.options!==key){select.replaceChildren(...entries.map(e=>{const o=element('option',gameTitle(e.scope));o.value=e.kind;return o;}));select.dataset.options=key;}select.value=value;}
 refresh(){
  if(this.refreshing)return;this.refreshing=true;try{this.update();}catch(error){this.reset();globalThis.console?.warn('TavernGames panel fallback',error);}finally{this.refreshing=false;}
 }
 update(){
  if(!this.getState||!this.enabled()){this.reset();return;}
  for(const e of this.entries.values())if(this.moves.has(e.kind)&&!e.root.isConnected)this.restore(e);
  const entries=[...this.entries.values()].filter(e=>e.app.element?.isConnected),tables=entries.filter(e=>e.role==='table'&&this.eligible(e));
  if(tables.length){this.panel();if(!tables.some(e=>e.kind===this.selected))this.selected=tables[0].kind;this.selectOptions(this.selector,tables,this.selected);const chosen=tables.find(e=>e.kind===this.selected);for(const e of entries.filter(e=>e.role==='table'))if(e!==chosen){if(tables.includes(e))this.mount(e,this.playerParking);else this.restore(e);}if(this.mount(chosen,this.playerContent)&&!!globalThis.game?.users?.activeGM&&this.active(this.getState(chosen.scope))&&(this.getState(chosen.scope)?.players??[]).includes(game.user.id)){const controls=globalThis.ui?.controls?.element??document.getElementById('controls');if(controls?.classList&&!controls.classList.contains('taverngames-controls-hidden')){controls.classList.add('taverngames-controls-hidden');this.tools.add(controls);}}else this.restoreTools();}
  else{for(const e of entries.filter(e=>e.role==='table'))this.restore(e);this.left?.remove();this.restoreTools();}
  if(!game.user.isGM)return;
  const catalog=document.querySelector('.taverngames-catalog'),mods=entries.filter(e=>e.role==='moderation');
  if(!catalog||!mods.length){for(const e of entries.filter(e=>e.role==='moderation'))this.restore(e);this.removeModeration();return;}
  if(!this.admin?.isConnected||this.admin.parentElement!==catalog){this.removeModeration();this.admin=element('section');this.admin.dataset.integratedModeration='';const bar=element('header');this.admin.append(bar);this.adminSelect=element('select');this.adminSelect.setAttribute('aria-label',text('Moderiertes Spiel','Moderated game'));this.adminSelect.onchange=()=>{this.moderated=this.adminSelect.value;this.catalogOnly=false;this.refresh();};bar.append(this.adminSelect);this.button(bar,text('Moderation schließen','Close moderation'),()=>{const e=this.entries.get(this.moderated);if(e)void e.app.close();});this.back=this.button(bar,text('Spieleauswahl','Game catalog'),()=>{this.catalogOnly=!this.catalogOnly;this.refresh();});this.adminContent=element('div');this.adminParking=element('div');this.adminParking.hidden=true;this.admin.append(this.adminContent,this.adminParking);catalog.prepend(this.admin);}
  if(!mods.some(e=>e.kind===this.moderated))this.moderated=mods[0].kind;this.selectOptions(this.adminSelect,mods,this.moderated);const chosen=mods.find(e=>e.kind===this.moderated),activation=chosen.kind+':'+this.getState(chosen.scope)?.gameId;if(activation!==this.activation){this.activation=activation;try{globalThis.ui?.sidebar?.changeTab?.('taverngames','primary');globalThis.ui?.sidebar?.expand?.();}catch{}}for(const e of entries.filter(e=>e.role==='moderation'))if(e!==chosen)this.mount(e,this.adminParking);
  this.adminContent.hidden=this.catalogOnly;this.admin.classList.toggle('is-catalog-only',this.catalogOnly);this.back.textContent=this.catalogOnly?text('Moderation anzeigen','Show moderation'):text('Spieleauswahl','Game catalog');catalog.classList.toggle('taverngames-catalog-moderating',!this.catalogOnly);if(!this.mount(chosen,this.adminContent)){catalog.classList.remove('taverngames-catalog-moderating');this.restore(chosen);}
 }
 restoreTools(){for(const e of this.tools)e.classList.remove('taverngames-controls-hidden');this.tools.clear();}
 removeModeration(){this.admin?.parentElement?.classList.remove('taverngames-catalog-moderating');this.admin?.remove();this.admin=null;}
 reset(){for(const e of this.entries.values())this.restore(e);this.left?.remove();this.removeModeration();this.restoreTools();}
}
export const gameView=new GameView();
