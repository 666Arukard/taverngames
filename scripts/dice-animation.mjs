// Optional presentation only: never generates random results or broadcasts DSN data.
export class DiceEvents {
 constructor(){this.events=[];this.serial=0;}
 add(scope,actor,dice,{privateTo=null,now=Date.now()}={}){if(!dice.length)return;this.events.push({id:++this.serial,scope,actor,dice:structuredClone(dice),privateTo,time:now});this.events=this.events.filter(e=>now-e.time<15000).slice(-128);}
 read(user,after=0,now=Date.now()){return {cursor:this.serial,events:this.events.filter(e=>e.id>after&&now-e.time<15000&&(!e.privateTo||e.privateTo.includes(user.id))).map(({privateTo,time,...event})=>event)};}
 clear(){this.events=[];}
}
export class DiceAnimator {
 constructor({game,enabled,warn=()=>{}}){Object.assign(this,{game,enabled,warn});this.cursor=0;this.pending=Promise.resolve();this.warned=false;}
 consume(batch){if(!batch)return;const after=batch.cursor<this.cursor?0:this.cursor;this.cursor=batch.cursor;for(const event of (batch.events??[]).filter(e=>e.id>after))this.pending=this.pending.then(()=>this.play(event)).catch(()=>{});}
 async play(event){
  if(!this.enabled())return;
  const dsn=this.game.dice3d;
  if(!this.game.modules.get('dice-so-nice')?.active||typeof dsn?.show!=='function'){if(!this.warned){this.warned=true;this.warn();}return;}
  try{
   const dice=[];
   for(const {sides,value} of event.dice){
    if(![6,10,20,100].includes(sides)||!Number.isInteger(value)||value<1||value>sides)return;
    const entry=(type,result,label)=>({type,result,resultLabel:String(label),vectors:[],options:{owner:this.game.users.get(event.actor)?.id??this.game.user.id},fvttResult:{result:value,active:true},resultIndex:dice.length});
    if(sides===100){
     const tens=Math.floor(value/10)%10,ones=value%10;
     dice.push({...entry('d100',tens,tens*10),compositeResult:value,compositeType:'d100'}, {...entry('d10',ones,ones),compositeResult:value,compositeType:'d100'});
    }else dice.push(entry(`d${sides}`,value,value));
   }
   if(!dice.length)return;
   // Direct DSN notation avoids reconstructing an evaluated Roll/AST on Foundry 14.
   // No evaluation, no chat and no DSN socket synchronization, including for private cups.
   const shown=await dsn.show({throws:[{dice}]},this.game.users.get(event.actor)??this.game.user,false,null,false);
   if(shown===false)console.debug('Taverngames: Dice So Nice skipped an animation; check DSN visibility and animation settings.');
  }catch(error){console.error('Taverngames: Dice So Nice animation failed.',error);if(!this.warned){this.warned=true;this.warn();}}
 }
}
