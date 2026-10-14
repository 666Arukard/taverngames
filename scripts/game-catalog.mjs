// Names and categories are data so future tags can extend the catalog without
// coupling navigation to gameplay. No duration or betting claims are invented.
export const GAME_CATALOG=Object.freeze([
 {id:'schocken',category:'dice',names:['Schocken']},
 {id:'farkle',category:'dice',names:['Farkle','Farkel']},
 {id:'pig',category:'dice',names:['Schweinchen','Pig']},
 {id:'ship',category:'dice',names:['Schiff, Kapitän und Mannschaft','Ship, Captain and Crew']},
 {id:'kniffel',category:'dice',names:['Kniffel']},
 {id:'lottery',category:'chance',names:['Straßenlotto','Street lottery']}
]);
const normalize=value=>String(value??'').toLocaleLowerCase().replace(/ß/g,'ss').normalize('NFD').replace(/\p{M}/gu,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function filterCatalog(entries,{category='all',query='',beta=false}={}){
 const words=normalize(query).split(' ').filter(Boolean);
 return entries.filter(entry=>(!entry.beta||beta)&&(category==='all'||entry.category===category)&&words.every(word=>normalize([entry.id,...entry.names].join(' ')).includes(word)));
}
