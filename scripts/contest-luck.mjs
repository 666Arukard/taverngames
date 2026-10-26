// Bias only the actual face. No additional result bonus; normal modifiers remain.
export function contestDiceRandom({state,actor,action,config=[],raw}){
 const profile=(Array.isArray(config)?config:[config]).find(p=>p?.target===actor&&p.gameId===state?.gameId&&p.strength>0);
 if(!profile||state?.paused||action!=='roll')return raw;
 const strength=Math.max(0,Math.min(100,profile.strength)),lift=19*(strength/100)**2,whole=Math.floor(lift),fraction=lift-whole;
 return sides=>{if(sides!==20)return raw(sides);const offset=whole+(fraction>0&&raw(10000)<=Math.round(fraction*10000)?1:0),span=20-offset,face=raw(span);if(!Number.isInteger(face)||face<1||face>span)throw Error('Invalid dice.');return profile.mode==='disfavor'?face:face+offset;};
}
