import {node,control} from './tavern-ui.mjs';
import {f} from './farkle-text.mjs';
import {CONTINUOUS_GAMES} from './continuous-play.mjs';
export function renderPlayControls(c,scope,s,request){
 if(!c||!game.user.isGM||!s)return;const continuous=CONTINUOUS_GAMES.includes(scope),done=['finished','aborted'].includes(s.phase),blocked=s.animationWaiting||s.localAnimation||s.animationPending;
 if(continuous&&done)for(const b of c.querySelectorAll('button'))if([f('Nächste Partie vorbereiten','Prepare next game'),f('Nächste Runde','Next round'),f('Spiel beenden','End game')].includes(b.textContent))b.remove();
 const box=node('section',undefined,'schocken-actions');box.dataset.gmPlayControls='';
 const has=label=>[...c.querySelectorAll('button')].some(b=>b.textContent===label);
 if(s.phase==='lobby'&&!has(f('Spiel starten','Start game')))control(box,f('Spiel starten','Start game'),()=>request('begin'),s.paused||blocked);
 if(!done&&!has(f('Spiel beenden','End game')))control(box,f('Spiel beenden','End game'),()=>request('abort'),blocked);
 if(done){
  if(continuous&&s.phase==='finished'&&!s.seriesClosed){control(box,f('Nächste Runde','Next round'),()=>request('nextRound'),blocked);control(box,f('Partie beenden','End session'),()=>request('endSeries'),blocked);}
  else if(!has(f('Nächste Partie vorbereiten','Prepare next game')))control(box,f('Nächste Partie vorbereiten','Prepare next game'),()=>request('restart',scope==='farkle'?{prepare:true}:{}),blocked);
 }
 if(continuous)c.append(node('p',`${f('Partierunde','Session round')}: ${s.seriesRound??1}${s.seriesClosed?' · '+f('Partie beendet','Session ended'):''}`));
 if(box.childNodes.length)c.append(box);
}
export function installPlayControls(panel){for(const kind of ['Table','Moderation']){const draw=panel['draw'+kind].bind(panel);panel['draw'+kind]=(...args)=>{draw(...args);const key=panel.scope==='farkle'?(kind==='Table'?'farkle':'farkle-moderation'):(kind==='Table'?'table':'moderation');renderPlayControls(panel.windows.get(key)?.root?.querySelector('.schocken-content'),panel.scope,panel.getState(),panel.request);};}}
