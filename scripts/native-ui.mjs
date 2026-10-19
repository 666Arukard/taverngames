import {t,language} from './i18n.mjs';
import {gameTitle} from './tavern-text.mjs';
import {GAME_CATALOG,filterCatalog,toggleFavorite} from './game-catalog.mjs';
export function createNativeWindow(foundry,kind,root,onClose) {
  const Base=foundry?.applications?.api?.ApplicationV2;
  if(!Base)throw new Error(t('Foundry ApplicationV2 fehlt. Das native Taverngames-Fenster kann nicht geöffnet werden.'));
  const titles={'divine-hand':language()==='de'?'TavernGames · Göttliche Hand':'TavernGames · Divine Hand','game-tokens':language()==='de'?'Taverngames · Einsätze & Spieltoken':'Taverngames · Stakes & game tokens','outcome-bets':language()==='de'?'Taverngames · Wetten':'Taverngames · Bets',table:'Taverngames · Schocken',moderation:'Taverngames · Moderation',guide:'Schocken · Anleitung',farkle:'Taverngames · Farkle','farkle-moderation':'Farkle · Moderation','farkle-guide':language()==='de'?'Farkle · Anleitung':'Farkle · Instructions'};
  class TavernWindow extends Base {
    static DEFAULT_OPTIONS={classes:['taverngames-window'],window:{resizable:true,minimizable:true},position:{width:560,height:650}};
    async _renderHTML(){return root;}
    _replaceHTML(result,content){content.replaceChildren(result);}
    async _onClose(options){await super._onClose(options);onClose();}
  }
  const scope=kind.split('-')[0],title=titles[kind]??(kind==='betting'?(language()==='de'?'Taverngames · Einsätze':'Taverngames · Stakes'):`${gameTitle(scope)} · ${language()==='de'?(kind.endsWith('moderation')?'Moderation':kind.endsWith('guide')?'Anleitung':'Spieltisch'):(kind.endsWith('moderation')?'Moderation':kind.endsWith('guide')?'Instructions':'Game table')}`);
  const viewportHeight=globalThis.innerHeight??800,viewportWidth=globalThis.innerWidth??1200,width=Math.min(kind.includes('moderation')?390:560,Math.max(240,viewportWidth-24)),top=Math.min(65,Math.max(12,viewportHeight-300));
  const app=new TavernWindow({id:`taverngames-${kind}`,window:{title:t(title)},position:{width,height:Math.max(180,Math.min(650,viewportHeight-top-24)),left:Math.max(12,Math.min(kind.includes('moderation')?610:32,viewportWidth-width-12)),top}});
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
      const category=document.createElement('div');category.className='taverngames-category-buttons';category.setAttribute('role','group');category.setAttribute('aria-label',de?'Spielekategorie':'Game category');filters.append(category);
      const categories=[['all','fa-solid fa-layer-group',de?'Alle Spiele':'All games'],['dice','fa-solid fa-dice',de?'Würfelspiele':'Dice games'],['chance','fa-solid fa-coins',de?'Glücksspiele':'Games of chance']];
      for(const [value,icon,title] of categories){const button=document.createElement('button');button.type='button';button.dataset.catalogCategory=value;button.title=title;button.setAttribute('aria-label',title);const symbol=document.createElement('i');symbol.className=icon;symbol.setAttribute('aria-hidden','true');button.append(symbol,document.createTextNode(value==='all'?(de?'Alle':'All'):''));button.addEventListener('click',()=>{this.category=value;draw();});category.append(button);}
      const searchLabel=document.createElement('label');searchLabel.textContent=de?'Spiele suchen':'Find games';const search=document.createElement('input');search.type='search';search.dataset.catalogSearch='';search.placeholder=de?'Spielname …':'Game name …';search.value=this.search??'';searchLabel.append(search);filters.append(searchLabel);
      const tags=document.createElement('div');tags.className='taverngames-tags';const tagLabel=document.createElement('span');tagLabel.textContent=de?'Tags':'Tags';tags.append(tagLabel);const favoriteButton=document.createElement('button');favoriteButton.type='button';favoriteButton.dataset.catalogFavorites='';favoriteButton.textContent=de?'★ Favoriten':'★ Favorites';favoriteButton.addEventListener('click',()=>{this.favoriteOnly=!this.favoriteOnly;draw();});tags.append(favoriteButton);filters.append(tags);
      const reset=document.createElement('button');reset.type='button';reset.dataset.catalogReset='';reset.textContent=de?'Auswahl zurücksetzen':'Reset selection';reset.addEventListener('click',()=>{this.category='all';this.favoriteOnly=false;search.value='';draw();});filters.append(reset);
      const results=document.createElement('div');results.className='taverngames-catalog-results';root.append(results);
      const draw=()=>{
        this.category??='all';this.search=search.value;results.replaceChildren();for(const button of category.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.catalogCategory===this.category));favoriteButton.setAttribute('aria-pressed',String(!!this.favoriteOnly));const favorites=game.settings.get('taverngames','favorites')??[];
        const games=filterCatalog(GAME_CATALOG,{category:this.category,query:search.value,beta:game.settings.get('taverngames','betaTest')===true}).filter(entry=>!this.favoriteOnly||favorites.includes(entry.id));
        if(!games.length){const empty=document.createElement('p');empty.textContent=de?'Keine passenden Spiele gefunden.':'No matching games found.';empty.setAttribute('role','status');results.append(empty);return;}
        for(const type of ['dice','chance']){
          const entries=games.filter(g=>g.category===type).sort((a,b)=>gameTitle(a.id).localeCompare(gameTitle(b.id),de?'de':'en'));if(!entries.length)continue;
          const h=document.createElement('h1');h.className='taverngames-category';h.textContent=type==='dice'?(de?'Würfelspiele':'Dice games'):(de?'Glücksspiele':'Games of chance');results.append(h);
          for(const entry of entries){
            const titleRow=document.createElement('div');titleRow.className='taverngames-game-title';const heading=document.createElement('h2');heading.textContent=gameTitle(entry.id)+(entry.beta?' · Beta':'');titleRow.append(heading);const star=document.createElement('button');star.type='button';star.className='taverngames-favorite-star';star.dataset.favoriteGame=entry.id;star.textContent='★';star.classList.toggle('is-favorite',favorites.includes(entry.id));star.setAttribute('aria-pressed',String(favorites.includes(entry.id)));star.title=star.getAttribute('aria-pressed')==='true'?(de?'Favorit entfernen':'Remove favorite'):(de?'Als Favorit markieren':'Mark favorite');star.setAttribute('aria-label',`${gameTitle(entry.id)} · ${star.title}`);star.addEventListener('click',async()=>{try{await game.settings.set('taverngames','favorites',toggleFavorite(game.settings.get('taverngames','favorites'),entry.id));draw();}catch(error){globalThis.ui?.notifications?.warn(error.message==='At most five favorites.'?(de?'Höchstens fünf Favoriten möglich.':'At most five favorites.'):error.message);}});titleRow.append(star);results.append(titleRow);
            const row=document.createElement('div');row.className='taverngames-start-row';row.dataset.game=entry.id;
            const open=entry.id==='schocken'?actions.open:entry.id==='farkle'?actions.farkle:()=>actions.tavern?.(entry.id);
            const guide=entry.id==='schocken'?actions.guide:entry.id==='farkle'?actions.farkleGuide:()=>actions.tavernGuide?.(entry.id);
            for(const [title,fn] of [['Start',open],[de?'Anleitung':'Instructions',guide]]){const button=document.createElement('button');button.type='button';button.textContent=title;button.addEventListener('click',()=>{if(game.user.isGM)fn?.();});row.append(button);}results.append(row);
          }
        }
      };
      search.addEventListener('input',draw);draw();
      return root;
    }
    _replaceHTML(result,content){content.replaceChildren(result);}
  }
  config.ui.taverngames=TavernSidebar;
  const entries=Object.entries(config.ui.sidebar.TABS),index=entries.findIndex(([key])=>key==='settings');
  entries.splice(index<0?entries.length:index,0,['taverngames',{tooltip:'Taverngames',icon:'taverngames-icon',gmOnly:true}]);
  config.ui.sidebar.TABS=Object.fromEntries(entries);return true;
}
