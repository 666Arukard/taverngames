import {createNativeWindow} from './native-ui.mjs';
import {f} from './farkle-text.mjs';
import {gameTitle,tavernError} from './tavern-text.mjs';
import {node,control,selectField,currencyOptions} from './tavern-ui.mjs';
import {amountText} from './wagers.mjs';
export class BettingUI{
  constructor({request}){this.request=request;this.root=null;this.scope=null;this.payload=null;this.busy=false;}
  async open(scope){if(!game.user.isGM)return;this.scope=scope;this.payload=null;if(!this.root){this.root=node('section',undefined,'taverngames-surface');this.app=createNativeWindow(foundry,'betting',this.root,()=>{this.root=null;this.scope=null;});}else this.app.bringToFront();await this.send('betRead');}
  async send(action,args={}){if(this.busy||!this.scope)return;this.busy=true;try{this.payload=await this.request(this.scope,action,{...args,gameId:this.payload?.game?.gameId});this.draw();}catch(e){ui.notifications.warn(e.message);}finally{this.busy=false;}}
  draw(){
    if(!this.root||!this.payload)return;const {game:s,book,preview,error}=this.payload;this.root.replaceChildren();const c=node('div',undefined,'schocken-content');this.root.append(c);c.append(node('h2',`${gameTitle(this.scope)} · ${f('Einsätze & Charaktere','Stakes & characters')}`));
    for(const [key,title] of [['managedBetting',f('Verwaltetes Setzen aktivieren','Enable managed betting')],['allowElectrum',f('Elektrum verwenden','Use electrum')]]){
      const label=node('label',undefined,'schocken-choice'),input=node('input');input.type='checkbox';input.dataset.setting=key;input.checked=game.settings.get('taverngames',key)===true;
      input.addEventListener('change',async()=>{try{await game.settings.set('taverngames',key,input.checked);await this.send('betRead');}catch(e){ui.notifications.warn(e.message);}});label.append(input,document.createTextNode(title));c.append(label);
    }
    c.append(node('p',f('Einsätze werden vorgemerkt. Erst „Abrechnung buchen“ ändert Währungen. Wechselgeld wird automatisch gebildet; ausgeschaltetes Elektrum bleibt unangetastet.','Stakes are recorded first. Only Settle stakes changes wallets. Coins are converted for change; disabled electrum remains untouched.'),'schocken-help'));
    if(!s){c.append(node('p',f('Zuerst eine Lobby öffnen.','Open a lobby first.')));return;}
    const locked=book&&book.status!=='configured',actors=[['','—'],...[...(game.actors??[])].filter(a=>a.system?.currency&&typeof a.update==='function').map(a=>[a.id,a.name])],mapping={};
    for(const id of s.players){mapping[id]=selectField(c,s.npcs?.[id]??game.users.get(id)?.name??id,actors,book?.mapping[id]??game.users.get(id)?.character?.id??'',`actor-${id}`);mapping[id].disabled=locked;}
    const l=node('label',f('Grundeinsatz','Base stake')),stake=node('input');stake.type='number';stake.min=0;stake.max=1000000;stake.step=1;stake.value=book?.stake??s.stake??2;l.append(stake);c.append(l);
    const isNew=['pig','ship','lottery'].includes(this.scope);stake.disabled=locked||isNew;
    const currency=selectField(c,f('Währung','Currency'),currencyOptions(),book?.currency??s.currency??'gp','currency');currency.disabled=locked||isNew;
    const funding=selectField(c,f('Finanzierung gleicher Prämien','Funding tied prizes'),[['redistribute',f('Gewinn neu aufteilen','Redistribute the pot')],['bank',f('Tavernenbank','Tavern bank')]],book?.funding??s.funding??'redistribute','funding');funding.disabled=locked||this.scope==='lottery';
    const house=selectField(c,f('Tavernenbank / Händler','Tavern bank / merchant'),actors,book?.house??'','house');house.disabled=locked;
    control(c,f('Zuordnung & Vorschau speichern','Save assignments & preview'),()=>this.send('betConfigure',{stake:Number(stake.value),currency:currency.value,funding:funding.value,house:house.value,mapping:Object.fromEntries(Object.entries(mapping).map(([id,input])=>[id,input.value]))}),locked);
    control(c,f('Aktualisieren','Refresh'),()=>this.send('betRead'));
    if(error)c.append(node('p',tavernError(error)));
    if(preview){
      const table=node('table'),head=node('tr');for(const text of [f('Spieler','Player'),f('Einsatz','Stake'),f('Auszahlung','Payout'),f('Netto','Net')])head.append(node('th',text));table.append(head);
      for(const id of s.players){const row=node('tr');for(const text of [s.npcs?.[id]??game.users.get(id)?.name??id,amountText(preview.stakes[id]??0),amountText(preview.payouts[id]??0),amountText((preview.payouts[id]??0)-(preview.stakes[id]??0))])row.append(node('td',text));table.append(row);}c.append(table);
      c.append(node('p',`${f('Topf','Pot')}: ${amountText(preview.total)} · ${f('Bankveränderung','Bank change')}: ${amountText(preview.bankDelta)}`));
    }
    if(book?.status==='settled')c.append(node('p',f('Bereits abgerechnet – keine erneute Buchung.','Already settled – no repeat payment.')));
    else control(c,book?.status==='pending'?f('Offene Abrechnung fortsetzen','Resume pending settlement'):f('Abrechnung buchen','Settle stakes'),()=>{if(confirm(f('Die angezeigten Nettobeträge jetzt auf den Charakterbögen buchen und offen im Chat dokumentieren?','Apply the displayed net amounts to character wallets and log them publicly in chat?')))void this.send('betSettle');},!game.settings.get('taverngames','managedBetting')||!preview||!!error);
    c.append(node('p',f('Bei Abbruch wird nichts gebucht. Nach begonnener Abrechnung diese zuerst fortsetzen; bereits bestätigte Buchungen werden nicht wiederholt.','Aborted games charge nothing. Resume an interrupted settlement before starting another game; confirmed payments are not repeated.'),'schocken-help'));
  }
}
