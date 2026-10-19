// Respect the user's DSN cap. Never change it or delete another module's dice.
const queues=new WeakMap(),notified=new WeakSet();
export function persistentLimit(game){try{const n=game.settings?.get?.('dice-so-nice','maxDiceNumber');return Number.isInteger(n)&&n>=0?n:Infinity;}catch{return Infinity;}}
export function boundedSpawn(game,spawn){
 const box=game.dice3d?.box;if(!box)return Promise.resolve(null);
 const next=(queues.get(box)??Promise.resolve()).then(async()=>{
  if((box.persistentDiceList?.length??0)>=persistentLimit(game)){
   if(!notified.has(box)){notified.add(box);globalThis.ui?.notifications?.info?.('TavernGames: 3D-Limit erreicht / 3D limit reached. Weitere Würfel bleiben im Spielfenster sichtbar / Additional dice remain visible in the game window.');}
   return null;
  }
  return spawn();
 });queues.set(box,next.catch(()=>{}));return next;
}
