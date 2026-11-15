import {RANKS,SUITS} from './card-sets.mjs';
import {shuffle} from './maumau-engine.mjs';
import {secureIndex,startingOrder} from './start-choice.mjs';

const ranks = RANKS.slice(7);
const eyes = {ace:11,'10':10,king:4,queen:3,jack:2,'9':0};
const priority = ['clubs','spades','hearts','diamonds'];
const trumps = ['hearts:10', ...['queen','jack'].flatMap(rank=>priority.map(suit=>suit+':'+rank)),
  ...['ace','10','king','9'].map(rank=>'diamonds:'+rank)];
const key = card => card.suit+':'+card.rank;
const suitOf = card => trumps.includes(key(card)) ? 'trump' : card.suit;
const check = (ok,message) => { if (!ok) throw Error(message); };

export const DOPPELKOPF_PROFILE = {
  id:'doppelkopf',
  select(cards) {
    const deck = SUITS.flatMap(suit=>ranks.map(rank=>cards.filter(card=>card.suit===suit&&card.rank===rank)));
    const count = deck[0].length;
    check([1,2].includes(count)&&deck.every(group=>group.length===count),'Doppelkopf requires one or two copies of each card from nine to ace.');
    const selected=deck.flat().flatMap(card=>count===2?[card]:[card,{...card,id:card.id+':copy'}]);
    check(selected.every(card=>typeof card.id==='string'&&card.id)&&new Set(selected.map(card=>card.id)).size===48,'Invalid card identities.');
    return structuredClone(selected);
  },
};

export function createDoppelkopf({cardSet,npcs = {}}) {
  return {version:1,game:'doppelkopf',phase:'lobby',revision:0,players:Object.keys(npcs),npcs,npcManual:{},
    cardSet:{key:cardSet.key,label:cardSet.label},cards:Object.fromEntries(cardSet.cards.map(card=>[card.id,card])),
    paused:false,order:[],turn:0,hands:{},table:[],tricks:[],winners:[],losers:[]};
}

export function legalDoppelkopf(s,id) {
  const hand = s.hands[id] ?? [];
  if (!s.table.length) return hand;
  const lead = suitOf(s.cards[s.table[0].card]);
  const matching = hand.filter(card=>suitOf(s.cards[card])===lead);
  return matching.length ? matching : hand;
}

function finish(s) {
  const re = s.order.filter(id=>s.teams[id]==='re');
  const reEyes = s.tricks.filter(trick=>re.includes(trick.winner)).reduce((sum,trick)=>sum+trick.eyes,0);
  const kontraEyes = 240-reEyes;
  const winningTeam = reEyes>=121 ? 're' : 'kontra';
  const losingEyes = winningTeam==='re' ? kontraEyes : reEyes;
  const sweep = s.tricks.every(trick=>s.teams[trick.winner]===winningTeam);
  const stages = [90,60,30].filter(limit=>losingEyes<limit).length + Number(sweep);
  const extras = {re:0,kontra:0};
  if (re.length===2) {
    if (winningTeam==='kontra') extras.kontra++;
    for (const [index,trick] of s.tricks.entries()) {
      const team=s.teams[trick.winner];
      if (trick.eyes>=40) extras[team]++;
      for (const play of trick.plays) {
        if (key(s.cards[play.card])==='diamonds:ace' && s.teams[play.id]!==team) extras[team]++;
      }
      if (index===11&&key(s.cards[trick.card])==='clubs:jack') extras[team]++;

    }
  }
  const value = (winningTeam==='re' ? 1 : -1)*(1+stages)+extras.re-extras.kontra;
  const scores = Object.fromEntries(s.order.map(id=>[id,s.teams[id]==='re'?value*(re.length===1?3:1):-value]));
  s.result={reEyes,kontraEyes,winningTeam,extras,scores};
  s.winners=s.order.filter(id=>scores[id]>0);
  s.losers=s.order.filter(id=>scores[id]<0);
  s.draw=!s.winners.length;
  s.phase='finished';
}

export function actDoppelkopf(old,id,action,args={},gm=false,random=secureIndex) {
  check(old,'No game exists.');
  const s=structuredClone(old);
  s.revision++;
  if (['abort','pause','npcControl'].includes(action)) {
    check(gm,'GM only.');
    if (action==='abort') s.phase='aborted';
    if (action==='pause') s.paused=!s.paused;
    if (action==='npcControl') { check(s.npcs[args.id],'Unknown participant.'); s.npcManual[args.id]=args.manual===true; }
    return s;
  }
  check(!s.paused,'Game is paused.');
  if (s.phase==='lobby') {
    if (action==='join') { check(s.players.length<4&&!s.players.includes(id),'Doppelkopf needs four participants.'); s.players.push(id); return s; }
    if (action==='leave') { s.players=s.players.filter(player=>player!==id); return s; }
    check(action==='begin'&&gm,'GM only.');
    check(s.players.length===4,'Doppelkopf needs four participants.');
    s.order=startingOrder(s,s.players,random);
    const deck=shuffle(Object.keys(s.cards),n=>random(n)+1);
    s.hands=Object.fromEntries(s.order.map((player,i)=>[player,deck.slice(12*i,12*(i+1))]));
    s.teams=Object.fromEntries(s.order.map(player=>[player,s.hands[player].some(card=>key(s.cards[card])==='clubs:queen')?'re':'kontra']));
    s.wedding=s.order.find(player=>s.hands[player].filter(card=>key(s.cards[card])==='clubs:queen').length===2);
    s.phase=s.wedding?'wedding':'playing';
    return s;
  }
  if (s.phase==='wedding') {
    check(action==='wedding'&&id===s.wedding,'It is not your turn.');
    s.publicWedding=args.announce===true;
    s.phase='playing';
    return s;
  }
  check(s.phase==='playing'&&s.order[s.turn]===id&&action==='play'&&legalDoppelkopf(s,id).includes(args.card),'It is not your turn or this card cannot be played.');
  s.hands[id]=s.hands[id].filter(card=>card!==args.card);
  s.table.push({id,card:args.card});
  s.turn=(s.turn+1)%4;
  if (s.table.length===4) {
    const lead=suitOf(s.cards[s.table[0].card]);
    const strength=({card})=>{
      const value=s.cards[card], trump=trumps.indexOf(key(value));
      return trump>=0 ? 100-trump : value.suit===lead ? eyes[value.rank]+1 : 0;
    };
    const best=s.table.reduce((a,b)=>strength(b)>strength(a)?b:a);
    const trick={winner:best.id,card:best.card,plays:s.table,eyes:s.table.reduce((sum,play)=>sum+eyes[s.cards[play.card].rank],0)};
    s.tricks.push(trick);
    s.table=[];
    s.turn=s.order.indexOf(best.id);
    if (s.publicWedding&&!s.weddingResolved) {
      if (best.id!==s.wedding) {
        s.teams[best.id]='re';
        s.weddingResolved=true;
      } else if (s.tricks.length===3) s.weddingResolved=true;
    }
    if (s.tricks.length===12) finish(s);
  }
  return s;
}

export function doppelkopfView(s,user) {
  if (!s) return null;
  const view=structuredClone(s);
  const own=id=>id===user.id||user.isGM&&s.npcs[id]&&s.npcManual[id];
  for (const id of s.order) if (!own(id)) view.hands[id]=s.hands[id].map(()=>null);
  if (s.phase!=='finished') {
    view.teams=Object.fromEntries(s.order.filter(own).map(id=>[id,s.teams[id]]));
    if (!s.publicWedding&&!own(s.wedding)) delete view.wedding;
  }
  return view;
}

export function doppelkopfNpc(s) {
  if (!s||s.paused||!['wedding','playing'].includes(s.phase)) return null;
  const id=s.phase==='wedding'?s.wedding:s.order[s.turn];
  if (!s.npcs[id]||s.npcManual[id]) return null;
  if (s.phase==='wedding') return {id,action:'wedding',args:{announce:true}};
  const legal=legalDoppelkopf(s,id);
  return {id,action:'play',args:{card:legal[secureIndex(legal.length)]}};
}
