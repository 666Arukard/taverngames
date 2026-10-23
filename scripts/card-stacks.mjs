import {language} from './i18n.mjs';
// Native Foundry documents are a projection of the encrypted GM rules state.
// Only tagged per-session documents are touched; imported templates are read-only.
export class CardStacks{
 constructor({game=()=>globalThis.game,document=()=>globalThis.foundry?.documents?.Cards??globalThis.Cards,scope='maumau',title='Mau-Mau'}={}){this.game=game;this.document=document;this.scope=scope;this.title=title;}
 owned(){return (this.game().cards?.contents??[]).filter(d=>d.flags?.taverngames?.cards?.scope===this.scope&&d.flags.taverngames.cards.role!=='template');}
 async cleanup(keep=null){for(const doc of this.owned().sort((a,b)=>(a.type==='deck')-(b.type==='deck')))if(doc.flags.taverngames.cards.sessionId!==keep){if(doc.type!=='deck')for(const card of [...(doc.cards?.contents??[])])if(card.recall)await card.recall({chatNotification:false,updateData:{face:0}});await doc.delete();}}
 async folderFor(type){const Folder=globalThis.foundry?.documents?.Folder??globalThis.Folder;if(!Folder?.create)return null;const names={deck:['Kartendecks für Taverngames','Card decks for TavernGames'],hand:['Hände für Taverngames','Hands for TavernGames'],pile:['Stapel für Taverngames','Piles for TavernGames']},name=names[type][language()==='de'?0:1];let folder=(this.game().folders?.contents??[]).find(f=>f.type==='Cards'&&f.flags?.taverngames?.cardFolder===type);if(!folder)folder=await Folder.create({name,type:'Cards',flags:{taverngames:{cardFolder:type}}});else if(folder.name!==name&&folder.update)await folder.update({name});return folder.id;}
 async rebuild(s){await this.cleanup();await this.sync(s);}
 async sync(s){
  if(!s||['finished','aborted'].includes(s.phase)||s.seriesClosed){await this.cleanup();return;}
  if(s.phase==='lobby'){await this.cleanup();return;}
  const Document=this.document();if(!Document?.create||!this.game().cards)throw Error('Native Foundry Cards API is unavailable.');
  const sessionId=s.seriesId??s.gameId,owned=this.owned().filter(d=>d.flags.taverngames.cards.sessionId===sessionId),tag=role=>({taverngames:{cards:{scope:this.scope,sessionId,role}}});
  const ensure=async(role,type,ownership,cards=[])=>{const folder=await this.folderFor(type);let doc=owned.find(d=>d.flags.taverngames.cards.role===role);if(doc&&folder&&doc.update&&(doc.folder?.id??doc.folder)!==folder)await doc.update({folder});if(!doc){doc=await Document.create({name:'TavernGames · '+this.title+' · '+(type==='hand'?(s.npcs[role.slice(5)]??this.game().users.get(role.slice(5))?.name??role):role),type,folder,ownership,cards,flags:tag(role),img:Object.values(s.cards)[0].back});owned.push(doc);}return doc;};
  const cardData=Object.values(s.cards).map((c,i)=>({_id:'tg'+String(i).padStart(14,'0'),name:c.name,type:'base',suit:c.suit,value:i,drawn:false,face:0,faces:[{name:c.name,img:c.front??'icons/svg/card-joker.svg',text:''}],back:{name:'TavernGames',img:c.back,text:''},flags:{taverngames:{cardId:c.id}}}));
  let reusable=null;const folder=await this.folderFor('deck');if(folder){const input=new TextEncoder().encode(JSON.stringify(cardData)),key=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',input)),n=>n.toString(16).padStart(2,'0')).join('');const cache=(this.game().cards.contents??[]).find(d=>d.flags?.taverngames?.cards?.scope===this.scope&&d.flags.taverngames.cards.role==='template'&&d.flags.taverngames.cards.cacheKey===key);reusable=cache??await Document.create({name:'TavernGames · '+this.title+' · '+(s.cardSet?.label??'Deck'),type:'deck',folder,ownership:{default:0},cards:cardData,flags:{taverngames:{cards:{scope:this.scope,role:'template',cacheKey:key}}},img:Object.values(s.cards)[0].back});}
  const deck=reusable&&!owned.some(d=>d.flags.taverngames.cards.role==='deck')?reusable:await ensure('deck','deck',{default:0},cardData);if(!owned.includes(deck))owned.push(deck);
  const destinations=new Map([['deck',deck],['discard',await ensure('discard','pile',{default:2})]]);
  for(const id of s.players)destinations.set('hand:'+id,await ensure('hand:'+id,'hand',{default:0,...(!s.npcs[id]?{[id]:2}:{})}));
  const wanted=new Map(s.drawPile.map(id=>[id,'deck']));for(const id of s.discard)wanted.set(id,'discard');for(const id of s.players)for(const card of s.hands[id])wanted.set(card,'hand:'+id);
  // Recall cards to their source deck first; pass handles moves between hands/piles.
  const entries=[...wanted].sort((a,b)=>(a[1]!=='deck')-(b[1]!=='deck'));
  for(const [cardId,role]of entries){
   const target=destinations.get(role);let from,card;
   for(const doc of owned){const c=doc.cards.contents.find(c=>c.flags?.taverngames?.cardId===cardId&&(doc.type!=='deck'||!c.drawn));if(c){from=doc;card=c;break;}}
   if(!from)throw Error('A native game card is missing; restore the session stacks.');
   if(from!==target){if(role==='deck')await card.recall({chatNotification:false,updateData:{face:0}});else await from.pass(target,[card.id],{chatNotification:false,updateData:{face:0}});}
  }
  const orders=new Map([['deck',s.drawPile],['discard',s.discard],...s.players.map(id=>['hand:'+id,s.hands[id]])]);
  for(const [role,ids]of orders){const doc=destinations.get(role),updates=ids.flatMap((id,index)=>{const card=doc.cards.contents.find(c=>c.flags?.taverngames?.cardId===id&&(role!=='deck'||!c.drawn)),sort=index*1000;return card&&card.sort!==sort?[{_id:card.id,sort}]:[];});if(updates.length)await doc.updateEmbeddedDocuments('Card',updates,{render:false});}
  await this.cleanup(sessionId);
 }
}
