export const CONTINUOUS_GAMES=['seventeen','poker','chohan','kings','maumau'];
export function seriesMetadata(next,old,action){
 if(!CONTINUOUS_GAMES.includes(next?.game)){if(action==='nextRound')throw Error('This game has no continuous rounds.');return next;}
 if(action==='nextRound'){
  if(old?.phase!=='finished'||old.seriesClosed)throw Error('Finish the round first.');
  next.seriesId=old.seriesId??old.gameId;next.seriesRound=(old.seriesRound??1)+1;next.seriesClosed=false;next.seriesHistory=[...(old.seriesHistory??[]),{round:old.seriesRound??1,gameId:old.gameId,winners:old.winners??[],summary:structuredClone(old.economy?.summary??null)}].slice(-100);next.startSelection=old.startSelection??'rules';
 }else if(next.gameId!==old?.gameId&&!next.seriesId){next.seriesId=next.gameId;next.seriesRound=1;next.seriesClosed=false;}
 else{next.seriesId??=old?.seriesId??next.gameId;next.seriesRound??=old?.seriesRound??1;}
 if(next.phase==='aborted')next.seriesClosed=true;return next;
}
export function continuesRound(s,old){return CONTINUOUS_GAMES.includes(s?.game)&&old?.phase==='finished'&&!old.seriesClosed&&s.seriesId===(old.seriesId??old.gameId)&&s.seriesRound===(old.seriesRound??1)+1;}
