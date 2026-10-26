import {createConnect,actConnect} from './connect-four-engine.mjs';
import {secureIndex} from './start-choice.mjs';
const check=(ok,message)=>{if(!ok)throw Error(message);};
const safeText=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.trim().length<=max&&!/[\u0000-\u001f\u007f]/u.test(s);
export function rpsPreset(kind='classic',en=false){
 const names=en?['Scissors','Rock','Paper','Lizard','Spock']:['Schere','Stein','Papier','Echse','Spock'];
 const ids=['scissors','rock','paper','lizard','spock'],symbols=['✂','◆','▤','♧','✋'],extended=kind==='extended',n=extended?5:3;
 const pairs=[['rock','scissors'],['scissors','paper'],['paper','rock'],['rock','lizard'],['lizard','spock'],['spock','scissors'],['scissors','lizard'],['lizard','paper'],['paper','spock'],['spock','rock']];
 return {title:extended?(en?'Rock, Paper, Scissors, Lizard, Spock':'Schere, Stein, Papier, Echse, Spock'):en?'Rock, Paper, Scissors':'Schere, Stein, Papier',figures:ids.slice(0,n).map((id,i)=>({id,name:names[i],symbol:symbols[i]})),wins:pairs.slice(0,extended?10:3)};
}
export function validateRpsRules(value){
 check(value&&safeText(value.title,80),'RPS: give the rule set a title (1–80 characters).');
 check(Array.isArray(value.figures)&&value.figures.length>=3&&value.figures.length<=25,'RPS: use 3–25 figures.');
 const figures=value.figures.map(f=>{check(f&&typeof f.id==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(f.id)&&safeText(f.name,60)&&typeof f.symbol==='string'&&f.symbol.length<=12&&!/[\u0000-\u001f\u007f]/u.test(f.symbol),'RPS: invalid figure.');return {id:f.id,name:f.name.trim(),symbol:f.symbol.trim()};});
 const ids=new Set(figures.map(f=>f.id));check(ids.size===figures.length,'RPS: duplicate figure ID.');check(new Set(figures.map(f=>f.name.toLocaleLowerCase())).size===figures.length,'RPS: figure names must be unique.');
 check(Array.isArray(value.wins)&&value.wins.length===figures.length*(figures.length-1)/2,'RPS: define exactly one winner for every pair.');
 const seen=new Set(),wins=[];for(const pair of value.wins){check(Array.isArray(pair)&&pair.length===2&&ids.has(pair[0])&&ids.has(pair[1])&&pair[0]!==pair[1],'RPS: invalid relationship.');const key=[...pair].sort().join('|');check(!seen.has(key),'RPS: conflicting or duplicate relationship.');seen.add(key);wins.push([...pair]);}
 return {title:value.title.trim(),figures,wins};
}
export function rpsBalance(rules){const counts=Object.fromEntries(rules.figures.map(f=>[f.id,0]));for(const [id]of rules.wins)counts[id]++;return {counts,balanced:new Set(Object.values(counts)).size===1};}
export function rpsWinner(rules,a,b){if(a===b)return null;const win=rules.wins.find(([x,y])=>x===a&&y===b||x===b&&y===a);check(win,'RPS: missing relationship.');return win[0];}
export function createRps(o={}){const target=o.targetWins??3;check(Number.isInteger(target)&&target>=1&&target<=100,'RPS: target wins must be 1–100.');return {...createConnect(o),game:'rps',rules:validateRpsRules(o.rules??rpsPreset()),targetWins:target,choices:{},ready:[],reveal:null};}
export function actRps(old,id,action,args={},gm=false){
 check(old,'No game exists.');
 if(['abort','pause','npcControl','join','leave','begin'].includes(action)){
  const s=actConnect(old,id,action,args,gm);if(action==='begin'){s.choices={};s.ready=[];s.reveal=null;}if(action==='abort'){s.choices={};s.ready=[];s.reveal=null;}return s;
 }
 const s=structuredClone(old);s.revision++;check(!s.paused,'Game is paused.');
 if(action==='nextRound'){check(gm,'GM only.');check(s.phase==='roundEnd','Round is not finished.');s.round++;s.phase='playing';s.choices={};s.ready=[];s.reveal=null;return s;}
 check(action==='choose','Unknown action.');check(s.phase==='playing'&&s.players.includes(id),'RPS: no selection available.');
 check(args.gameId===s.gameId&&args.round===s.round,'RPS: this selection belongs to another round.');check(!Object.hasOwn(s.choices,id),'RPS: your selection is already locked.');check(s.rules.figures.some(f=>f.id===args.figure),'RPS: unknown figure.');s.choices[id]=args.figure;s.ready=Object.keys(s.choices);
 if(s.ready.length===2){const [a,b]=s.order,figure=rpsWinner(s.rules,s.choices[a],s.choices[b]),winner=figure?s.choices[a]===figure?a:b:null;s.reveal={choices:{...s.choices},winner};if(winner)s.scores[winner]++;s.roundWinner=winner;if(winner&&s.scores[winner]>=s.targetWins){s.phase='finished';s.winners=[winner];s.losers=s.players.filter(p=>p!==winner);s.draw=false;}else s.phase='roundEnd';}
 return s;
}
export function rpsView(s,user){if(!s)return null;const v=structuredClone(s);if(v.phase==='playing'||v.phase==='lobby'){v.choices=Object.fromEntries(Object.entries(v.choices).filter(([id])=>id===user?.id||user?.isGM&&v.npcs[id]&&v.npcManual[id]));v.reveal=null;}return v;}
export function rpsNpc(s,random=secureIndex){if(s?.phase!=='playing'||s.paused)return null;const id=s.order.find(id=>s.npcs[id]&&!s.npcManual[id]&&!Object.hasOwn(s.choices,id));if(!id)return null;return {id,action:'choose',args:{gameId:s.gameId,round:s.round,figure:s.rules.figures[random(s.rules.figures.length)].id}};}
