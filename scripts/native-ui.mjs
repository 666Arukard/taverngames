import {gameView} from './game-view.mjs';
import {InteractionQueue,renderSurface} from './interaction-queue.mjs';
import {t,language} from './i18n.mjs';
import {gameTitle} from './tavern-text.mjs';
import {GAME_CATALOG,filterCatalog,toggleFavorite} from './game-catalog.mjs';
export function createNativeWindow(foundry,kind,root,onClose) {
  const Base=foundry?.applications?.api?.ApplicationV2;
  if(!Base)throw new Error(t('Foundry ApplicationV2 fehlt. Das native Taverngames-Fenster kann nicht geöffnet werden.'));
  const titles={'divine-hand':language()==='de'?'TavernGames · Göttliche Hand':'TavernGames · Divine Hand','game-tokens':language()==='de'?'Taverngames · Einsätze & Spieltoken':'Taverngames · Stakes & game tokens','outcome-bets':language()==='de'?'Taverngames · Wetten':'Taverngames · Bets',table:'Taverngames · Schocken',moderation:'Taverngames · Moderation',guide:'Schocken · Anleitung',farkle:'Taverngames · Farkle','farkle-moderation':'Farkle · Moderation','farkle-guide':language()==='de'?'Farkle · Anleitung':'Farkle · Instructions'};
  class TavernWindow extends Base {
    static DEFAULT_OPTIONS={classes:['taverngames-window',...(gameView.enabled()&&(kind==='divine-hand'||kind==='table'||kind==='farkle'||kind.endsWith('-table')||kind==='moderation'||kind.endsWith('-moderation'))?['taverngames-docking-pending']:[])],window:{resizable:true,minimizable:true},position:{width:560,height:650}};
    async _renderHTML(){return root;}
    _replaceHTML(result,content){content.replaceChildren(result);}
    _cleanupTavern(){if(this._tavernCleaned)return;this._tavernCleaned=true;gameView.untrack(kind);onClose();}
    async close(options){this._cleanupTavern();return super.close(options);}
    async _onClose(options){this._cleanupTavern();await super._onClose(options);}
  }
  const scope=kind.split('-')[0],title=titles[kind]??(kind==='betting'?(language()==='de'?'Taverngames · Einsätze':'Taverngames · Stakes'):`${gameTitle(scope)} · ${language()==='de'?(kind.endsWith('moderation')?'Moderation':kind.endsWith('guide')?'Anleitung':'Spieltisch'):(kind.endsWith('moderation')?'Moderation':kind.endsWith('guide')?'Instructions':'Game table')}`);
  const viewportHeight=globalThis.innerHeight??800,viewportWidth=globalThis.innerWidth??1200,width=Math.min(kind.includes('moderation')?390:560,Math.max(240,viewportWidth-24)),top=Math.min(65,Math.max(12,viewportHeight-300));
  const app=new TavernWindow({id:`taverngames-${kind}`,window:{title:t(title)},position:{width,height:Math.max(180,Math.min(650,viewportHeight-top-24)),left:Math.max(12,Math.min(kind.includes('moderation')?610:32,viewportWidth-width-12)),top}});
  void app.render({force:true}).then(()=>{if(app._tavernCleaned)return;app.element?.addEventListener('pointerdown',event=>{if(event.target.closest?.('.window-header button,.window-header [data-action=close]'))event.stopPropagation();},true);gameView.track(kind,root,app);app.element?.classList?.remove('taverngames-docking-pending');}).catch(error=>{app._cleanupTavern();globalThis.ui?.notifications?.warn(`Taverngames: ${error.message}`);});
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
      this.favoriteRequests??=new InteractionQueue();const de=language()==='de',filters=document.createElement('div');filters.className='taverngames-catalog-filters';root.append(filters);
      const reconnect=document.createElement('button');reconnect.type='button';reconnect.dataset.connectionsRefresh='';reconnect.textContent=de?'Verbindungen erneuern':'Refresh connections';reconnect.disabled=game.users.activeGM?.id!==game.user.id;reconnect.addEventListener('click',()=>void actions.refreshConnections?.());
      const category=document.createElement('div');category.className='taverngames-category-buttons';category.setAttribute('role','group');category.setAttribute('aria-label',de?'Spielekategorie':'Game category');filters.append(category);
      const categories=[['all','fa-solid fa-layer-group',de?'Alle Spiele':'All games'],['dice','fa-solid fa-dice',de?'Würfelspiele':'Dice games'],['chance','fa-solid fa-coins',de?'Glücksspiele':'Games of chance']];
      categories.push(['board','fa-solid fa-chess-board',de?'Brettspiele':'Board games']);categories.push(['cards','fa-solid fa-clone',de?'Kartenspiele':'Card games']);categories.push(['tournament','',de?'Turniere':'Tournaments']);if(game.settings.get('taverngames','betaTest')===true)categories.push(['competition','',de?'Wettkämpfe':'Contests']);const betaEnabled=game.settings.get('taverngames','betaTest')===true;if(this.category==='beta'){this.betaOnly=betaEnabled;this.category='all';}if(!betaEnabled)this.betaOnly=false;
      for(const [value,icon,title] of categories){const button=document.createElement('button');button.type='button';button.dataset.catalogCategory=value;button.title=title;button.setAttribute('aria-label',title);const symbol=document.createElement('i');symbol.className=icon;if(value!=='all'){symbol.className='taverngames-category-art';symbol.style.setProperty('--category-art',`url("${new URL(`../assets/category-${value}.png`,import.meta.url).href}")`);}symbol.setAttribute('aria-hidden','true');button.append(symbol,document.createTextNode(value==='all'?(de?'Alle':'All'):''));button.addEventListener('click',()=>{this.category=value;draw();});category.append(button);}
      const searchLabel=document.createElement('label'),searchHeading=document.createElement('span'),searchTitle=document.createElement('span'),gameCount=document.createElement('span');searchHeading.className='taverngames-search-heading';searchTitle.textContent=de?'Spiele suchen':'Find games';gameCount.dataset.catalogCount='';gameCount.setAttribute('aria-live','polite');gameCount.setAttribute('aria-atomic','true');searchHeading.append(searchTitle,gameCount);searchLabel.append(searchHeading);const search=document.createElement('input');search.type='search';search.dataset.catalogSearch='';search.placeholder=de?'Spielname …':'Game name …';search.value=this.search??'';searchLabel.append(search);filters.append(searchLabel);
      const tags=document.createElement('div');tags.className='taverngames-tags';tags.setAttribute('role','group');tags.setAttribute('aria-label',de?'Zusätzliche Filter':'Additional filters');const favoriteButton=document.createElement('button');favoriteButton.type='button';favoriteButton.dataset.catalogFavorites='';favoriteButton.textContent=de?'★ Favoriten':'★ Favorites';favoriteButton.addEventListener('click',()=>{this.favoriteOnly=!this.favoriteOnly;draw();});tags.append(favoriteButton);let betaButton=null;if(betaEnabled){betaButton=document.createElement('button');betaButton.type='button';betaButton.dataset.catalogBeta='';betaButton.title=de?'Nur Beta-Spiele anzeigen':'Show beta games only';betaButton.setAttribute('aria-label',betaButton.title);const icon=document.createElement('i');icon.className='taverngames-category-art';icon.style.setProperty('--category-art',`url("${new URL('../assets/category-beta.png',import.meta.url).href}")`);icon.setAttribute('aria-hidden','true');betaButton.append(icon,document.createTextNode('Beta'));betaButton.addEventListener('click',()=>{this.betaOnly=!this.betaOnly;draw();});tags.append(betaButton);}filters.append(tags);
      const reset=document.createElement('button');reset.type='button';reset.dataset.catalogReset='';reset.textContent=de?'Auswahl zurücksetzen':'Reset selection';reset.addEventListener('click',()=>{this.category='all';this.favoriteOnly=false;this.betaOnly=false;search.value='';draw();});filters.append(reset);
      const results=document.createElement('div');results.className='taverngames-catalog-results';root.append(results);
      const draw=()=>{
        this.category??='all';this.search=search.value;results.replaceChildren();for(const button of category.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.catalogCategory===this.category));favoriteButton.setAttribute('aria-pressed',String(!!this.favoriteOnly));betaButton?.setAttribute('aria-pressed',String(!!this.betaOnly));const favorites=game.settings.get('taverngames','favorites')??[];
        const games=filterCatalog(GAME_CATALOG,{category:this.category,query:search.value,beta:game.settings.get('taverngames','betaTest')===true}).filter(entry=>(!this.favoriteOnly||favorites.includes(entry.id))&&(!this.betaOnly||entry.beta===true));
        gameCount.textContent=String(games.length);gameCount.setAttribute('aria-label',games.length+' '+(de?'angezeigte Einträge':'displayed entries'));
        if(!games.length){const empty=document.createElement('p');empty.textContent=de?'Keine passenden Spiele gefunden.':'No matching games found.';empty.setAttribute('role','status');results.append(empty);return;}
        const entries=games.sort((a,b)=>gameTitle(a.id).localeCompare(gameTitle(b.id),de?'de':'en'));
          for(const entry of entries){
            const titleRow=document.createElement('div');titleRow.className='taverngames-game-title';const heading=document.createElement('h2');heading.textContent=gameTitle(entry.id)+(entry.beta?' · Beta':'');titleRow.append(heading);const categoryIcon=document.createElement('span');categoryIcon.className='taverngames-game-category-icon';categoryIcon.dataset.gameCategory=entry.category;const categoryLabel=categories.find(([value])=>value===entry.category)?.[2]??entry.category;categoryIcon.title=categoryLabel;categoryIcon.setAttribute('role','img');categoryIcon.setAttribute('aria-label',categoryLabel);categoryIcon.style.setProperty('--category-art',`url("${new URL(`../assets/category-${entry.category}.png`,import.meta.url).href}")`);titleRow.append(categoryIcon);const star=document.createElement('button');star.type='button';star.className='taverngames-favorite-star';star.dataset.favoriteGame=entry.id;star.textContent='★';star.classList.toggle('is-favorite',favorites.includes(entry.id));star.setAttribute('aria-pressed',String(favorites.includes(entry.id)));star.title=star.getAttribute('aria-pressed')==='true'?(de?'Favorit entfernen':'Remove favorite'):(de?'Als Favorit markieren':'Mark favorite');star.setAttribute('aria-label',`${gameTitle(entry.id)} · ${star.title}`);star.addEventListener('click',async()=>{try{await this.favoriteRequests.run('favorite',async()=>{await game.settings.set('taverngames','favorites',toggleFavorite(game.settings.get('taverngames','favorites'),entry.id));draw();});}catch(error){globalThis.ui?.notifications?.warn(error.message==='At most five favorites.'?(de?'Höchstens fünf Favoriten möglich.':'At most five favorites.'):error.message);}});titleRow.append(star);results.append(titleRow);
            const row=document.createElement('div');row.className='taverngames-start-row';row.dataset.game=entry.id;
            const open=entry.id==='schocken'?actions.open:entry.id==='farkle'?actions.farkle:()=>actions.tavern?.(entry.id);
            const guide=entry.id==='schocken'?actions.guide:entry.id==='farkle'?actions.farkleGuide:()=>actions.tavernGuide?.(entry.id);
            for(const [title,fn] of [['Start',open],[de?'Anleitung':'Instructions',guide]]){const button=document.createElement('button');button.type='button';button.textContent=title;button.addEventListener('click',()=>{if(game.user.isGM)fn?.();});row.append(button);}results.append(row);
          }
      };
      const footer=document.createElement('div');footer.className='taverngames-catalog-footer';footer.append(reconnect);root.append(footer);
      const credits=document.createElement('details');credits.className='taverngames-asset-credits';const summary=document.createElement('summary');summary.textContent=de?'Grafikquellen':'Icon credits';credits.append(summary);for(const [tag,author] of [['beer','Magnific'],['dice','Three musketeers'],['cards','Unknown Depths'],['gambling','POD Gladiator'],['boardgame','Hamel M'],['beta','Magnific'],['prize','fjstudio'],['duel','Iconjam'],['coins','Smashicons']]){const line=document.createElement('p'),link=document.createElement('a');link.href=`https://www.flaticon.com/free-icons/${tag}`;link.target='_blank';link.rel='noopener noreferrer';link.textContent=`${tag[0].toUpperCase()+tag.slice(1)} icons created by ${author} - Flaticon`;line.append(link);credits.append(line);}root.append(credits);
      search.addEventListener('input',draw);draw();
      return root;
    }
    _replaceHTML(result,content){renderSurface(content,()=>content.replaceChildren(result));}
  }
  config.ui.taverngames=TavernSidebar;
  const entries=Object.entries(config.ui.sidebar.TABS),index=entries.findIndex(([key])=>key==='settings');
  entries.splice(index<0?entries.length:index,0,['taverngames',{tooltip:'Taverngames',icon:'taverngames-icon',gmOnly:true}]);
  config.ui.sidebar.TABS=Object.fromEntries(entries);return true;
}
