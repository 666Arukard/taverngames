import {pokerView} from './poker-engine.mjs';
export function pokerDiceState(s,user){
 if(!s)return null;const v=pokerView(s,user),active=!v.seriesClosed&&!['lobby','aborted'].includes(v.phase),groups=[];
 if(active)for(const id of v.order)if(v.hands[id])groups.push({game:'poker',gameId:v.gameId,revision:v.revision,participant:id,phase:'playing',turnNumber:v.gameId+':'+id,order:[id],turn:0,cup:{dice:v.hands[id],held:v.held[id],types:Array(5).fill('d8')}});
 const current=groups.find(g=>g.participant===v.lastActor);
 return {game:'poker',gameId:v.gameId,revision:v.revision,phase:active?'playing':v.phase,sourcePhase:v.phase,participant:v.lastActor??user.id,turnNumber:current?.turnNumber,order:current?.order??[],turn:0,groups,cup:current?.cup??null,indices:v.lastIndices??[]};
}
