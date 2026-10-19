import {createNativeWindow} from './native-ui.mjs';
import {node,control,selectField} from './tavern-ui.mjs';
import {f} from './farkle-text.mjs';
import {gameTitle} from './tavern-text.mjs';
import {DIVINE_SCOPES} from './divine-hand.mjs';

export class DivineUI{
 constructor({request}){this.request=request;this.root=null;this.scope='schocken';this.busy=false;}
 async open(scope='schocken'){
  if(!game.user.isGM)return;this.scope=scope;
  if(!this.root){this.root=node('section',undefined,'taverngames-surface');this.app=createNativeWindow(foundry,'divine-hand',this.root,()=>{this.root=null;});}else this.app.bringToFront();
  await this.send('divineRead');
 }
 async send(action,args={}){
  if(this.busy||!game.user.isGM)return;this.busy=true;
  try{this.payload=await this.request(this.scope,action,{revision:this.payload?.revision,gameId:this.payload?.gameId,...args});this.draw();}
  catch(e){ui.notifications.warn(e.message);}finally{this.busy=false;}
 }
 draw(){
  if(!this.root||!this.payload||!game.user.isGM)return;const p=this.payload;this.root.replaceChildren();
  const c=node('div',undefined,'schocken-content');this.root.append(c);c.append(node('h2',f('Göttliche Hand · nur SL','Divine Hand · GM only')));
  const scope=selectField(c,f('Spiel','Game'),DIVINE_SCOPES.map(id=>[id,gameTitle(id)]),this.scope,'divine-scope');scope.onchange=()=>{this.scope=scope.value;void this.send('divineRead');};
  const target=selectField(c,f('Begünstigter Teilnehmer','Favored participant'),[['',f('Niemand – normaler Zufall','Nobody – normal randomness')],...p.players.map(x=>[x.id,x.name]),...(p.bank?[['@bank',f('Bank','Bank')]]:[])],p.target,'divine-target');
  const label=node('label',f('Eingriffsstärke','Intervention strength')),range=node('input'),output=node('output',p.strength+' %');range.type='range';range.min=0;range.max=100;range.step=1;range.value=p.strength;range.style.width='55%';range.style.margin='0 0.5rem';range.dataset.divineStrength='';range.oninput=()=>{output.textContent=range.value+' %';};label.append(range,output);c.append(label);target.onchange=()=>{if(!p.target&&target.value){range.value=p.defaultStrength;output.textContent=range.value+' %';}};
  c.append(node('p',f('0 %: unveränderter Zufall. Mittlere Werte: sanfte Begünstigung mit viel Zufall. 100 %: maximale Begünstigung. Der Prozentwert ist keine Gewinnwahrscheinlichkeit. Behaltene Würfel, Entscheidungen und Spielregeln bleiben maßgeblich.','0%: unchanged randomness. Medium values: a gentle advantage with plenty of randomness. 100%: maximum assistance. This percentage is not a win probability. Held dice, decisions and game rules still apply.')));
  c.append(node('p',f('Gilt nur für zukünftige Würfe dieser Partie. Vorhandene Würfel werden nicht verändert. Eine neue Partie beginnt ohne gewählten Teilnehmer. Bei gemeinsamen Ziehungen wird der Tipp des Teilnehmers begünstigt.','Applies only to future throws in this game. Existing dice are unchanged. A new game starts without a selected participant. Shared draws favor the participant’s ticket or bet.')));
  const inactive=!p.gameId||['finished','aborted'].includes(p.phase);target.disabled=range.disabled=inactive;
  const actions=node('div',undefined,'schocken-actions');c.append(actions);
  control(actions,f('Einfluss speichern','Save influence'),()=>this.send('divineSet',{target:target.value,strength:Number(range.value)}),inactive);
  control(actions,f('Einfluss ausschalten','Turn influence off'),()=>this.send('divineSet',{target:'',strength:0}),inactive);
  if(inactive)c.append(node('p',f('Zuerst eine neue Lobby öffnen.','Open a new lobby first.')));
  const d=node('label',f('Standardstärke für neue Auswahl','Default strength for new selections'),'schocken-label'),n=node('input');n.type='number';n.min=0;n.max=100;n.step=1;n.value=p.defaultStrength;n.dataset.divineDefault='';d.append(n);c.append(d);
  control(c,f('Standard speichern','Save default'),()=>this.send('divineDefault',{strength:Number(n.value)}));
  c.append(node('p',f('Diese Einstellungen sind nur für die SL sichtbar und werden nicht im Chat veröffentlicht.','These settings are visible only to the GM and are not posted to chat.')));
  control(c,f('Aktualisieren','Refresh'),()=>this.send('divineRead'));
 }
}
export function divineMenu(foundry,open){
 return class DivineMenu extends foundry.applications.api.ApplicationV2{
  async render(){if(game.user.isGM)await open();return this;}
 };
}
export function installDivineControl(ui,open){
 const draw=ui.drawModeration.bind(ui);ui.drawModeration=(...args)=>{draw(...args);if(!game.user.isGM)return;const key=ui.scope==='farkle'?'farkle-moderation':'moderation',c=ui.windows.get(key)?.root?.querySelector('.schocken-content');if(c&&!c.querySelector('[data-divine-open]')){const b=control(c,f('Göttliche Hand','Divine Hand'),()=>open(ui.scope));b.dataset.divineOpen='';}};
}
