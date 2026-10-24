import {gameView} from './game-view.mjs';
import {InteractionQueue,protectUtility} from './interaction-queue.mjs';
import {createNativeWindow} from './native-ui.mjs';
import {node,control,selectField} from './tavern-ui.mjs';
import {f} from './farkle-text.mjs';
import {gameTitle} from './tavern-text.mjs';
import {DIVINE_CARD_SCOPES} from './divine-cards.mjs';
import {DIVINE_SCOPES} from './divine-hand.mjs';

export class DivineUI{
 constructor({request}){this.request=request;this.root=null;this.scope='schocken';this.busy=false;this.actions=new InteractionQueue();protectUtility(this);}
 async clearAll(){if(!game.user.isGM)return;await this.actions.tail;try{const p=await this.request('all','divineRead',{});await this.request('all','divineClearAll',{revision:p.revision});if(this.root)await this.send('divineRead');}catch(e){ui.notifications.warn(e.message);}}
 async open(scope='schocken'){
  if(!game.user.isGM)return;await this.actions.tail.catch(()=>{});this.scope=scope;
  if(!this.root){this.root=node('section',undefined,'taverngames-surface');this.app=createNativeWindow(foundry,'divine-hand',this.root,()=>{this.root=null;});}else this.app.bringToFront();
  await this.send('divineRead');if(gameView.enabled())gameView.showDivine();
 }
 send(action,args={}){const scope=this.scope,gameId=this.payload?.gameId;return this.actions.run(action==='divineRead'?'read':action,()=>this.perform(action,args,scope,gameId));}
 async perform(action,args,scope,gameId){
  if(!game.user.isGM||scope!==this.scope)return;if(action!=='divineRead'&&gameId&&gameId!==this.payload?.gameId){ui.notifications.warn(f('Spielstand geändert. Bitte erneut versuchen.','The game state changed. Please try again.'));return;}this.busy=true;
  try{this.payload=await this.request(this.scope,action,{revision:this.payload?.revision,gameId:this.payload?.gameId,...args});this.draw();}
  catch(e){ui.notifications.warn(e.message);}finally{this.busy=false;}
 }
 draw(){
  if(!this.root||!this.payload||!game.user.isGM)return;const p=this.payload;this.root.replaceChildren();
  const c=node('div',undefined,'schocken-content');this.root.append(c);c.append(node('h2',f('Göttliche Hand · nur SL','Divine Hand · GM only')));
  const scope=selectField(c,f('Spiel','Game'),[['all',f('Alle Spiele','All games')],...DIVINE_SCOPES.map(id=>[id,gameTitle(id)])],this.scope,'divine-scope');scope.onchange=()=>{this.scope=scope.value;void this.send('divineRead');};
  const effect=selectField(c,f('Wirkung','Effect'),[['favor',f('Begünstigen','Favor')],['disfavor',f('Benachteiligen · Ungnade','Disfavor')]],p.mode??'favor','divine-mode');
  const target=selectField(c,f('Beeinflusster Teilnehmer','Influenced participant'),[['',f('Niemand – normaler Zufall','Nobody – normal randomness')],...p.players.map(x=>[x.id,x.name]),...(p.bank?[['@bank',f('Bank','Bank')]]:[])],p.target,'divine-target');
  const status=node('p');status.dataset.divineEffective='';const describe=(source,strength)=>{status.textContent=source==='all'?f(`Übernommen aus Alle Spiele: ${strength} % (keine Spielausnahme).`,`Inherited from All games: ${strength}% (no game override).`):source==='none'?f('Kein gespeicherter Einfluss: 0 %.','No saved influence: 0%.'):f(`Gespeicherter Einfluss: ${strength} %.`,`Saved influence: ${strength}%.`);};describe(p.source??'scope',p.strength);c.append(status);
  const label=node('label',f('Eingriffsstärke (0–100 %)','Intervention strength (0–100%)')),range=node('input'),output=node('output',p.strength+' %');range.type='range';range.min=0;range.max=100;range.step=1;range.value=p.strength;range.style.width='55%';range.style.margin='0 0.5rem';range.dataset.divineStrength='';range.oninput=()=>{output.textContent=range.value+' %';};label.append(range,output);c.append(label);target.onchange=()=>{const entry=p.entries.find(x=>x.id===target.value)??p.inherited?.find(x=>x.id===target.value)??p.effective.find(x=>x.target===target.value);range.value=entry?.strength??0;effect.value=entry?.mode??'favor';output.textContent=range.value+' %';describe(p.entries.some(x=>x.id===target.value)?'scope':entry?'all':'none',Number(range.value));};
  c.append(node('p',f('0 %: unveränderter Zufall. Mittlere Werte: sanfter Einfluss mit viel Zufall. 100 %: maximale Wirkung in der gewählten Richtung. Der Prozentwert ist keine Gewinnwahrscheinlichkeit. Behaltene Würfel, Entscheidungen und Spielregeln bleiben maßgeblich.','0%: unchanged randomness. Medium values: gentle influence with plenty of randomness. 100%: maximum effect in the selected direction. This percentage is not a win probability. Held dice, decisions and game rules still apply.')));
  c.append(node('p',f('Gilt über Runden und Partien hinweg bis zum Ausschalten. Spielbezogene Werte haben Vorrang vor Alle Spiele, auch 0 %. Vorhandene Würfel werden nicht verändert. Bei gemeinsamen Ziehungen wird der Tipp des Teilnehmers je nach Richtung begünstigt oder benachteiligt.','Persists across rounds and sessions until switched off. Game-specific settings override All games, including 0%. Existing dice are unchanged. Shared draws favor or disfavor the participant’s ticket or bet.')));
  if(DIVINE_CARD_SCOPES.includes(this.scope))c.append(node('p',f('Karten: beeinflusst auch die erste Verteilung und spätere Ziehaktionen. Hilfreich richtet sich nach Spiel und eigener Hand. Nur vorhandene verdeckte Karten sind verfügbar; offene Karten und Entscheidungen werden nicht verändert. Schwimmen: Einfluss beim Austeilen, nicht beim offenen Tauschen. Auch 100 % garantiert keinen Sieg.','Cards: also affects the initial deal and later draws. Usefulness depends on the game and your hand. Only existing hidden cards are available; face-up cards and decisions are unchanged. Schwimmen: influences dealing, not open swaps. Even 100% does not guarantee a win.')));
  const inactive=false;effect.disabled=target.disabled=range.disabled=inactive;
  const actions=node('div',undefined,'schocken-actions');c.append(actions);
  const save=control(actions,f('Einfluss speichern','Save influence'),()=>this.send('divineSet',{target:target.value,strength:Number(range.value),mode:effect.value}),inactive||!target.value);
  const off=control(actions,f('Einfluss ausschalten','Turn influence off'),()=>this.send('divineSet',{target:target.value,strength:0,mode:effect.value}),inactive||!target.value);
  if(inactive)c.append(node('p',f('Zuerst eine neue Lobby öffnen.','Open a new lobby first.')));
  const remove=control(c,f('Spielausnahme entfernen / globalen Wert übernehmen','Remove override / inherit global value'),()=>this.send('divineRemove',{target:target.value}),!target.value);
  target.addEventListener('change',()=>{save.disabled=off.disabled=remove.disabled=!target.value;});
  c.append(node('p',f('Die Stärke bestimmt die Eingriffshäufigkeit und ein weiches Qualitätsziel. Es gibt keine feste Mindestgarantie. Bessere natürliche Ergebnisse bleiben erhalten; behaltene Würfel begrenzen das Erreichbare.','Strength controls intervention frequency and a soft quality target. There is no guaranteed minimum. Better natural results are preserved; kept dice limit what is reachable.')));
  if(this.scope==='poker')c.append(node('p',f('Glück-Ziele: 1–19 % Paar, 20–29 % Drilling, 30–39 % zwei Paare, 40–49 % Viererstraße, 50–59 % Vierling, 60–74 % Full House, 75–89 % Fünfling, 90–100 % Fünferstraße. Pech zielt spiegelbildlich auf schwächere Kombinationen.','Luck targets: 1–19% pair, 20–29% three of a kind, 30–39% two pairs, 40–49% four-die straight, 50–59% four of a kind, 60–74% full house, 75–89% five of a kind, 90–100% five-die straight. Bad luck mirrors these targets toward weaker hands.')));
  for(const entry of p.entries)c.append(node('p',`${entry.name}: ${entry.strength===0?f('Normaler Zufall','Normal randomness'):entry.mode==='disfavor'?f('Pech','Bad luck'):f('Glück','Good luck')} · ${entry.strength} %`));
  c.append(node('p',f('Diese Einstellungen sind nur für die SL sichtbar und werden nicht im Chat veröffentlicht.','These settings are visible only to the GM and are not posted to chat.')));
  control(c,f('Aktualisieren','Refresh'),()=>this.send('divineRead'));
 }
}
export function divineMenu(foundry,open){
 return class DivineMenu extends foundry.applications.api.ApplicationV2{
  async render(){if(game.user.isGM)await open();return this;}
 };
}
export function showDivineSummary(c,p){
 if(!c||!game.user.isGM)return;c.querySelector('[data-divine-summary]')?.remove();const rows=(p?.effective??[]).filter(x=>x.strength>0);if(!rows.length)return;
 const box=node('section');box.dataset.divineSummary='';box.append(node('strong',f('Göttliche Hand · nur SL','Divine Hand · GM only')));
 for(const row of rows){const name=p.players.find(x=>x.id===row.target)?.name??(row.target==='@bank'?f('Bank','Bank'):row.target);box.append(node('p',`${name}: ${row.mode==='disfavor'?f('Pech','Bad luck'):f('Glück','Good luck')} · ${row.strength} %${row.source==='all'?' · '+f('alle Spiele','all games'):''}`));}c.prepend(box);
}
export function installDivineControl(ui,open,read,clearAll){
 const draw=ui.drawModeration.bind(ui);ui.drawModeration=(...args)=>{draw(...args);if(!game.user.isGM)return;const key=ui.scope==='farkle'?'farkle-moderation':'moderation',c=ui.windows.get(key)?.root?.querySelector('.schocken-content');if(c&&!c.querySelector('[data-divine-open]')){const b=control(c,f('Göttliche Hand','Divine Hand'),()=>open(ui.scope));b.dataset.divineOpen='';if(clearAll){const end=control(c,f('Göttlichen Einfluss beenden','End divine influence'),clearAll);end.dataset.divineClearAll='';}}if(c&&read&&!ui.divineReading){ui.divineReading=true;void read(ui.scope).then(p=>{showDivineSummary(ui.windows.get(key)?.root?.querySelector('.schocken-content'),p);}).catch(()=>{}).finally(()=>ui.divineReading=false);}};
}
