import {f} from './farkle-text.mjs';
import {escapeHTML} from './tavern-text.mjs';
const check=(ok,message)=>{if(!ok)throw new Error(message);};
export class PrizeManager{
  constructor(deps){Object.assign(this,deps);this.state={version:1,awards:{}};}
  restore(saved){check(saved===null||saved?.version===1&&saved.awards,'Invalid prize save.');this.state=saved?structuredClone(saved):{version:1,awards:{}};}
  done(id){return ['delivered','waived'].includes(this.state.awards[id]?.status);}
  pending(game){return game?.phase==='finished'&&game.game==='lottery'&&game.prizeUuid&&game.winners.length&&!this.done(game.gameId);}
  async persist(award){check(this.isAuthority?.()!==false,'GM authority changed. Resume with the active GM.');const next=structuredClone(this.state);next.awards[award.gameId]=award;await this.save(next);this.state=next;}
  async deliver(game,user,actorId){
    check(user.isGM&&game?.phase==='finished'&&game.game==='lottery','GM only.');
    check(this.isAuthority?.()!==false,'GM authority changed. Resume with the active GM.');
    if(!game.prizeUuid||!game.winners.length||this.done(game.gameId))return;
    check(this.system()==='dnd5e','Prize delivery currently supports D&D 5e/5.5e only.');
    let award=this.state.awards[game.gameId];
    const recipient=this.actor(award?.actorId??actorId);check(recipient,'Assign the winner character before delivery.');
    if(!award){
      const source=await this.item(game.prizeUuid);check(source?.documentName==='Item'&&Number.isSafeInteger(source.system?.quantity)&&source.system.quantity>=1,'The prize item is missing or out of stock.');
      check(!source.parent?.items?.some(i=>i.system?.container===source.id),'Empty the prize container before transfer.');
      const data=source.toObject();data._id=game.gameId.replace(/-/g,'').slice(0,16);delete data.folder;delete data.sort;
      data.system.quantity=1;if('container' in data.system)data.system.container=null;if('equipped' in data.system)data.system.equipped=false;if('attuned' in data.system)data.system.attuned=false;
      data.flags??={};data.flags.taverngames={...data.flags.taverngames,prizeReceipt:game.gameId};
      award={gameId:game.gameId,status:'pending',actorId:recipient.id,sourceUuid:source.uuid,sourceActorId:source.parent?.documentName==='Actor'?source.parent.id:null,data};
      await this.persist(award);
    }
    const kept=award.sourceActorId===recipient.id;
    if(award.sourceActorId&&!kept){
      check(this.isAuthority?.()!==false,'GM authority changed. Resume with the active GM.');
      const source=await this.item(award.sourceUuid);check(source,'The reserved source item is missing.');
      const marker=`prizeOut.${game.gameId}`;
      check(!source.getFlag('taverngames',marker)||source.getFlag('taverngames',marker).actorId===recipient.id,'Conflicting prize receipt.');
      if(!source.getFlag('taverngames',marker)){
        check(Number.isSafeInteger(source.system.quantity)&&source.system.quantity>=1,'The prize item is out of stock.');
        const changes={'system.quantity':source.system.quantity-1,[`flags.taverngames.${marker}`]:{actorId:recipient.id}};
        if(source.system.quantity===1){if(typeof source.system.equipped==='boolean')changes['system.equipped']=false;if(typeof source.system.attuned==='boolean')changes['system.attuned']=false;}
        await source.update(changes);
        check(source.getFlag('taverngames',marker),'Source update was not confirmed; retry delivery.');
      }
    }
    if(!kept&&!recipient.items.some(item=>item.getFlag('taverngames','prizeReceipt')===game.gameId)){
      check(this.isAuthority?.()!==false,'GM authority changed. Resume with the active GM.');
      await recipient.createEmbeddedDocuments('Item',[structuredClone(award.data)],{keepId:true});
      check(recipient.items.some(item=>item.getFlag('taverngames','prizeReceipt')===game.gameId),'Prize creation was not confirmed; retry delivery.');
    }
    if(!this.hasMessage(game.gameId))await this.announce({content:`<h2>${f('Straßenlotto · Preis übergeben','Street lottery · Prize delivered')}</h2><p>${escapeHTML(recipient.name)}: ${escapeHTML(award.data.name)} × 1</p><p>${f('Quelle','Source')}: ${escapeHTML(award.sourceUuid)}${kept?f(' (bleibt im eigenen Inventar)',' (retained in own inventory)'):''}</p>`,flags:{taverngames:{prizeAward:game.gameId}}});
    await this.persist({...award,status:'delivered'});
  }
  async waive(game,user){
    check(user.isGM&&game?.phase==='finished'&&game.game==='lottery','GM only.');
    check(!this.state.awards[game.gameId],'A prepared transfer must be completed.');
    await this.announce({content:`<p>${f('Straßenlotto: Der SL übernimmt die Preisübergabe manuell.','Street lottery: the GM will deliver the prize manually.')} ${escapeHTML(game.prize)}</p>`,flags:{taverngames:{prizeManual:game.gameId}}});
    await this.persist({gameId:game.gameId,status:'waived'});
  }
}
