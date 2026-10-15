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
 async play(event){if(!this.enabled())return;const dsn=this.game.dice3d,Roll=globalThis.foundry?.dice?.Roll??globalThis.Roll;
  if(!this.game.modules.get('dice-so-nice')?.active||typeof dsn?.showForRoll!=='function'||typeof Roll?.fromData!=='function'){if(!this.warned){this.warned=true;this.warn();}return;}
  try{const groups=new Map();for(const {sides,value} of event.dice){if(![6,10,20,100].includes(sides)||!Number.isInteger(value)||value<1||value>sides)return;if(!groups.has(sides))groups.set(sides,[]);groups.get(sides).push(value);}
   const terms=[...groups].flatMap(([faces,values],i)=>[...(i?[{class:'OperatorTerm',operator:'+',options:{},evaluated:true}]:[]),{class:'Die',number:values.length,faces,modifiers:[],options:{},results:values.map(result=>({result,active:true})),evaluated:true}]);
   const roll=Roll.fromData({class:'Roll',formula:[...groups].map(([faces,v])=>`${v.length}d${faces}`).join('+'),terms,total:event.dice.reduce((n,d)=>n+d.value,0),options:{},evaluated:true});
   // Each client receives only authorized results and animates locally; synchronize must remain false.
   await dsn.showForRoll(roll,this.game.users.get(event.actor)??this.game.user,false,null,false);
  }catch{if(!this.warned){this.warned=true;this.warn();}}
 }
}
