// Names and categories are data so future tags can extend the catalog without
// coupling navigation to gameplay. No duration or betting claims are invented.
export const GAME_CATALOG=Object.freeze([
 {id:'seventeen',category:'dice',names:['17 und 4','Siebzehn und Vier','Seventeen and Four'],suggestedNames:['Elfenlauf']},
 {id:'schocken',category:'dice',names:['Schocken']},
 {id:'farkle',category:'dice',names:['Farkle','Farkel']},
 {id:'pig',category:'dice',names:['Schweinchen','Pig']},
 {id:'ship',category:'dice',names:['Schiff, Kapitän und Mannschaft','Ship, Captain and Crew']},
 {id:'kniffel',category:'dice',names:['Kniffel']},
 {id:'liars',category:'dice',names:['Lügenwürfel','Liar’s Dice','Liars Dice']},
 {id:'hoard',category:'chance',names:['Drachenhort','Dragon’s Hoard','Dragons Hoard']},
 {id:'chohan',category:'chance',names:['Chō-Han','Cho-Han','Gerade oder Ungerade','Even or Odd']},
 {id:'lottery',category:'chance',names:['Straßenlotto','Street lottery']}
]);
const normalize=value=>String(value??'').toLocaleLowerCase().replace(/ß/g,'ss').normalize('NFD').replace(/\p{M}/gu,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function filterCatalog(entries,{category='all',query='',beta=false}={}){
 const words=normalize(query).split(' ').filter(Boolean);
 return entries.filter(entry=>(!entry.beta||beta)&&(category==='all'||entry.category===category)&&words.every(word=>normalize([entry.id,...entry.names].join(' ')).includes(word)));
}

export function toggleFavorite(current,id){
 const allowed=new Set(GAME_CATALOG.map(g=>g.id)),list=[...new Set(Array.isArray(current)?current:[])].filter(key=>allowed.has(key));
 if(!allowed.has(id))throw Error('Unknown game.');
 if(list.includes(id))return list.filter(key=>key!==id);
 if(list.length>=5)throw Error('At most five favorites.');return [...list,id];
}
