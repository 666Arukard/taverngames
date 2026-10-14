import {t,language} from './i18n.mjs';
import {gameTitle} from './tavern-text.mjs';
import {GAME_CATALOG,filterCatalog} from './game-catalog.mjs';
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
      const de=language()==='de',filters=document.createElement('div');filters.className='taverngames-catalog-filters';root.append(filters);
      const categoryLabel=document.createElement('label');categoryLabel.textContent=de?'Spielekategorie':'Game category';const category=document.createElement('select');category.dataset.catalogCategory='';
      for(const [value,title] of [['all',de?'Alle Spiele':'All games'],['dice',de?'Würfelspiele':'Dice games'],['chance',de?'Glücksspiele':'Games of chance']]){const option=document.createElement('option');option.value=value;option.textContent=title;category.append(option);}category.value=this.category??'all';categoryLabel.append(category);filters.append(categoryLabel);
      const searchLabel=document.createElement('label');searchLabel.textContent=de?'Spiele suchen':'Find games';const search=document.createElement('input');search.type='search';search.dataset.catalogSearch='';search.placeholder=de?'Spielname …':'Game name …';search.value=this.search??'';searchLabel.append(search);filters.append(searchLabel);
      const results=document.createElement('div');results.className='taverngames-catalog-results';root.append(results);
      const draw=()=>{
        this.category=category.value;this.search=search.value;results.replaceChildren();
        const games=filterCatalog(GAME_CATALOG,{category:category.value,query:search.value,beta:game.settings.get('taverngames','betaTest')===true});
        if(!games.length){const empty=document.createElement('p');empty.textContent=de?'Keine passenden Spiele gefunden.':'No matching games found.';empty.setAttribute('role','status');results.append(empty);return;}
        for(const type of ['dice','chance']){
          const entries=games.filter(g=>g.category===type);if(!entries.length)continue;
          const h=document.createElement('h1');h.className='taverngames-category';h.textContent=type==='dice'?(de?'Würfelspiele':'Dice games'):(de?'Glücksspiele':'Games of chance');results.append(h);
          for(const entry of entries){
            const heading=document.createElement('h2');heading.textContent=gameTitle(entry.id);results.append(heading);
            const row=document.createElement('div');row.className='taverngames-start-row';row.dataset.game=entry.id;
            const open=entry.id==='schocken'?actions.open:entry.id==='farkle'?actions.farkle:()=>actions.tavern?.(entry.id);
            const guide=entry.id==='schocken'?actions.guide:entry.id==='farkle'?actions.farkleGuide:()=>actions.tavernGuide?.(entry.id);
            for(const [title,fn] of [['Start',open],[de?'Anleitung':'Instructions',guide]]){const button=document.createElement('button');button.type='button';button.textContent=title;button.addEventListener('click',()=>{if(game.user.isGM)fn?.();});row.append(button);}results.append(row);
          }
        }
      };
      category.addEventListener('change',draw);search.addEventListener('input',draw);draw();
      return root;
    }
    _replaceHTML(result,content){content.replaceChildren(result);}
  }
  config.ui.taverngames=TavernSidebar;
  const entries=Object.entries(config.ui.sidebar.TABS),index=entries.findIndex(([key])=>key==='settings');
  entries.splice(index<0?entries.length:index,0,['taverngames',{tooltip:'Taverngames',icon:'taverngames-icon',gmOnly:true}]);
  config.ui.sidebar.TABS=Object.fromEntries(entries);return true;
}
