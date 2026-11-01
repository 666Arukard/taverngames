import {GAME_CATALOG} from './game-catalog.mjs';
import {continuesRound} from './continuous-play.mjs';
let readState=()=>null;
export const setNameStateReader=fn=>{readState=fn;};
const setting=key=>{try{return globalThis.game?.settings?.get('taverngames',key);}catch{return null;}};
// Stable since 6.0: the legacy beta switch is retained only as hidden migration data.
export const namesEnabled=()=>true;
export function validateGameName(value){if(typeof value!=='string'||value.trim().length>80||/[\u0000-\u001f\u007f]/u.test(value))throw Error('Game names must contain at most 80 printable characters.');return value.trim();}
export function validateGameAliases(value){if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid game names.');const result={};for(const [id,name]of Object.entries(value)){if(!GAME_CATALOG.some(g=>g.id===id))throw Error('Unknown game.');const text=validateGameName(name);if(text)result[id]=text;}return result;}
export function gameAlias(scope,state){if(!namesEnabled())return '';let s=state;if(s===undefined)try{s=readState(scope);}catch{s=null;}const local=s?.gameAlias,persistent=setting('gameAliases')?.[scope];for(const value of [local,persistent])try{if(value&&validateGameName(value))return value.trim();}catch{}return '';}
export const namedTitle=(scope,original,state)=>gameAlias(scope,state)||original;
export const overviewTitle=(scope,original)=>{const title=namedTitle(scope,original);return title===original?original:title+' ('+original+')';};
export function prepareGameAlias(next,old,{rename=false}={}){if(next.gameId&&next.gameId===old?.gameId){if(!rename){if(Object.hasOwn(old,'gameAlias'))next.gameAlias=old.gameAlias;else delete next.gameAlias;}}else if(continuesRound(next,old)){if(old?.gameAlias)next.gameAlias=old.gameAlias;else delete next.gameAlias;}else delete next.gameAlias;return next;}
export function renameGameState(old,value,user,revision){if(!user.isGM)throw Error('GM only.');if(!namesEnabled())throw Error('Enable the custom game names beta first.');if(!old?.gameId||old.revision!==revision)throw Error('The game state changed. Please try again.');return {...structuredClone(old),gameAlias:validateGameName(value)||null,revision:old.revision+1};}
const esc=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Explicit title placeholder: only the first heading is replaced, never rule
// wording, linked source names or an already posted chat message.
export function namedHtml(html,scope,original,state){const alias=gameAlias(scope,state);if(!alias||typeof html!=='string')return html;return html.replace(/(<h[123]\b[^>]*>)([\s\S]*?)(<\/h[123]>)/i,(_all,open,old,close)=>open+esc(alias)+(/Extreme/.test(old)?' · Extreme':'')+(/Beta/.test(old)?' · Beta':'')+close);}
