// Names and categories are data so future tags can extend the catalog without
// coupling navigation to gameplay. No duration or betting claims are invented.
export const GAME_CATALOG=Object.freeze([
 {id:'dots',category:'board',beta:true,names:['Käsekästchen','Kaesekaestchen','Dots and Boxes']},
 {id:'card21',category:'cards',names:['17 und 4 (Karten)','Siebzehn und Vier Karten','Seventeen and Four Cards']},
 {id:'morris',category:'board',names:['Mühle','Muehle',"Nine Men's Morris",'Nine Mens Morris']},
 {id:'tictournament',category:'tournament',names:['Tic-Tac-Toe-Turnier','Tic-Tac-Toe Tournament']},
 {id:'oldmaid',category:'cards',names:['Schwarzer Peter','Old Maid']},
 {id:'tictactoe',category:'board',names:['Tic-Tac-Toe','Tic Tac Toe','Drei gewinnt','Noughts and Crosses']},
 {id:'connectfour',category:'board',names:['Vier gewinnt','Four in a Row','Connect Four']},
 {id:'lucky',category:'dice',names:['Der Glückstag','Glückstag','Lucky Day']},
 {id:'swim',category:'cards',names:['Schwimmen','Knack','Thirty-one']},
 {id:'durak',category:'cards',names:['Durak']},
 {id:'maumau',category:'cards',names:['Mau-Mau','Mau Mau']},
 {id:'kings',category:'dice',names:['Spiel der Könige','Game of Kings']},
 {id:'thirteen',category:'dice',names:['Die böse Dreizehn','Böse 13','Wicked Thirteen']},
 {id:'klippklapp',category:'dice',names:['Klippklapp','KlippKlapp','Shut the Box']},
 {id:'poker',category:'dice',names:['Würfelpoker','Dice Poker','Koboldpoker'],suggestedNames:['Koboldpoker','Orakelwürfel']},
 {id:'aalstechen',category:'dice',names:['Aalstechen']},
 {id:'meiern',category:'dice',names:['Meiern','Mäxchen','Schlangenfangen'],suggestedNames:['Schlangenfangen']},
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
 return entries.filter(entry=>(!entry.beta||beta)&&(category==='all'||category==='beta'&&entry.beta===true||entry.category===category)&&words.every(word=>normalize([entry.id,...entry.names].join(' ')).includes(word)));
}

export function toggleFavorite(current,id){
 const allowed=new Set(GAME_CATALOG.map(g=>g.id)),list=[...new Set(Array.isArray(current)?current:[])].filter(key=>allowed.has(key));
 if(!allowed.has(id))throw Error('Unknown game.');
 if(list.includes(id))return list.filter(key=>key!==id);
 if(list.length>=5)throw Error('At most five favorites.');return [...list,id];
}
