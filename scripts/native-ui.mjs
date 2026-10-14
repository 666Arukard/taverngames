import {t,language} from './i18n.mjs';
import {gameTitle} from './tavern-text.mjs';
export function createNativeWindow(foundry,kind,root,onClose) {
  const Base=foundry?.applications?.api?.ApplicationV2;
  if(!Base)throw new Error(t('Foundry ApplicationV2 fehlt. Das native Taverngames-Fenster kann nicht geöffnet werden.'));
  const titles={table:'Taverngames · Schocken',moderation:'Taverngames · Moderation',guide:'Schocken · Anleitung',farkle:'Taverngames · Farkle','farkle-moderation':'Farkle · Moderation','farkle-guide':language()==='de'?'Farkle · Anleitung':'Farkle · Instructions'};
  class TavernWindow extends Base {
    static DEFAULT_OPTIONS={classes:['taverngames-window'],window:{resizable:true,minimizable:true},position:{width:560,height:650}};
    async _renderHTML(){return root;}
    _replaceHTML(result,content){content.replaceChildren(result);}
    async _onClose(options){await super._onClose(options);onClose();}
  }
  const scope=kind.split('-')[0],title=titles[kind]??(kind==='betting'?(language()==='de'?'Taverngames · Einsätze':'Taverngames · Stakes'):`${gameTitle(scope)} · ${language()==='de'?(kind.endsWith('moderation')?'Moderation':kind.endsWith('guide')?'Anleitung':'Spieltisch'):(kind.endsWith('moderation')?'Moderation':kind.endsWith('guide')?'Instructions':'Game table')}`);
  const app=new TavernWindow({id:`taverngames-${kind}`,window:{title:t(title)},position:{width:kind.includes('moderation')?390:560,height:650,left:kind.includes('moderation')?610:32,top:65}});
  void app.render({force:true}).catch(error=>{onClose();globalThis.ui?.notifications?.warn(`Taverngames: ${error.message}`);});
  return app;
}

export function registerSidebar(config,foundry,game,actions) {
  const Base=foundry?.applications?.sidebar?.AbstractSidebarTab;
  if(!Base||!config?.ui?.sidebar?.TABS)return false;
  if(config.ui.taverngames||config.ui.sidebar.TABS.taverngames)return false;
  class TavernSidebar extends Base {
    static tabName='taverngames';
    static DEFAULT_OPTIONS={id:'taverngames',window:{title:'Taverngames'},classes:['taverngames-sidebar']};
    async _renderHTML(){
      const root=document.createElement('section');root.className='taverngames-catalog';
      if(!game.user.isGM)return root;
      const heading=document.createElement('h2');heading.textContent='Schocken';root.append(heading);
      const row=document.createElement('div');row.className='taverngames-start-row';
      for(const [title,callback] of [['Start',actions.open],['Anleitung',actions.guide]]){
        const button=document.createElement('button');button.type='button';button.textContent=t(title);button.disabled=title==='Anleitung'&&!game.user.isGM;if(button.disabled)button.title=t('Die Spielleitung kann die Anleitung im Chat teilen.');
        button.addEventListener('click',()=>{if(title==='Anleitung'&&!game.user.isGM){globalThis.ui?.notifications?.warn(t('Die Anleitung wird von der Spielleitung im Chat geteilt.'));return;}callback();});row.append(button);
      }
      root.append(row);
      {
        const heading=document.createElement('h2');heading.textContent='Farkle';root.append(heading);
        const row=document.createElement('div');row.className='taverngames-start-row';
        for(const [title,callback] of [['Start',actions.farkle],['Anleitung',actions.farkleGuide]]){
          const button=document.createElement('button');button.type='button';button.textContent=t(title);button.disabled=title==='Anleitung'&&!game.user.isGM;
          button.addEventListener('click',()=>{if(title==='Anleitung'&&!game.user.isGM)return;callback?.();});row.append(button);
        }
        root.append(row);
      }
      for(const scope of ['pig','ship','lottery','kniffel']){
        if(scope==='kniffel'&&game.settings.get('taverngames','betaTest')!==true)continue;
        const h=document.createElement('h2');h.textContent=`${gameTitle(scope)}${scope==='kniffel'?' · Beta':''}`;root.append(h);const row=document.createElement('div');row.className='taverngames-start-row';
        for(const [title,fn] of [['Start',()=>actions.tavern?.(scope)],['Anleitung',()=>actions.tavernGuide?.(scope)]]){const b=document.createElement('button');b.type='button';b.textContent=t(title);b.addEventListener('click',fn);row.append(b);}root.append(row);
      }
      return root;
    }
    _replaceHTML(result,content){content.replaceChildren(result);}
  }
  config.ui.taverngames=TavernSidebar;
  const entries=Object.entries(config.ui.sidebar.TABS),index=entries.findIndex(([key])=>key==='settings');
  entries.splice(index<0?entries.length:index,0,['taverngames',{tooltip:'Taverngames',icon:'taverngames-icon',gmOnly:true}]);
  config.ui.sidebar.TABS=Object.fromEntries(entries);return true;
}
