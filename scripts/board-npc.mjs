import {secureIndex} from './start-choice.mjs';
import {node,selectField} from './tavern-ui.mjs';
import {f} from './farkle-text.mjs';
export const NPC_LEVELS=['easy','normal','hard'];
export const npcLevel=(s,id)=>s.npcDifficulty?.[id]??'hard';
export function setNpcDifficulty(s,args,gm){
 if(!gm)throw Error('GM only.');
 if(!s.npcs[args.id]||!NPC_LEVELS.includes(args.level))throw Error('Invalid NPC difficulty.');
 s.npcDifficulty??={};s.npcDifficulty[args.id]=args.level;return s;
}
export function chooseNpc(scores,level,random=secureIndex){
 const pick=rows=>rows[Math.max(0,Math.min(rows.length-1,random(rows.length)))];
 const best=Math.max(...scores.map(m=>m.score)),optimal=scores.filter(m=>m.score===best);
 // Difficulty affects decisions only, never the board or the opponent's move.
 if(level==='hard')return pick(optimal);
 const wins=scores.filter(m=>m.win);if(wins.length)return pick(wins);
 if(level==='easy')return pick(scores);
 return random(100)<20?pick(scores):pick(optimal);
}
export function renderNpcDifficulty(parent,s,request){
 if(!s||!game.user.isGM)return;
 for(const [id,name]of Object.entries(s.npcs)){
  const box=node('section');box.dataset.npcDifficulty=id;
  const select=selectField(box,name+' · '+f('Schwierigkeit','Difficulty'),[['easy',f('Leicht','Easy')],['normal',f('Normal','Normal')],['hard',f('Schwer','Hard')]],npcLevel(s,id),'npcDifficulty-'+id);
  select.onchange=()=>request('npcDifficulty',{id,level:select.value});parent.append(box);
 }
}
