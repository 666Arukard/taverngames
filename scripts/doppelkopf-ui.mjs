import {MauUI} from './maumau-ui.mjs';
import {node,control,selectField} from './tavern-ui.mjs';
import {listCardSets} from './card-sets.mjs';
import {DOPPELKOPF_PROFILE,legalDoppelkopf} from './doppelkopf-engine.mjs';
import {f} from './farkle-text.mjs';

export class DoppelkopfUI extends MauUI {
  async open() {
    if (game.user.isGM) this.sets=await listCardSets(game,DOPPELKOPF_PROFILE);
    this.window('table');
    if (game.user.isGM) this.window('moderation');
    this.draw();
    void this.request('read');
  }

  cardActor(s) {
    const active=s.phase==='wedding'?s.wedding:s.order[s.turn];
    return game.user.isGM&&s.npcManual[active]?active:game.user.id;
  }

  drawModeration() {
    const root=this.windows.get('moderation')?.root;
    if (!root||!game.user.isGM) return;
    const s=this.getState();
    const priorSet=root.querySelector('[data-draft=set]')?.value;
    const priorNames=root.querySelector('[data-draft=npcs]')?.value;
    const content=node('div',undefined,'schocken-content');
    root.replaceChildren(content);
    content.append(node('h2','Doppelkopf'));
    control(content,f('Spieltisch öffnen','Open game table'),()=>{this.window('table');this.drawTable();});
    control(content,f('Anleitung','Instructions'),()=>this.guide());
    const label=node('label',undefined,'schocken-choice');
    const show=node('input');
    show.type='checkbox';
    show.checked=game.settings.get('taverngames','showdoppelkopfLauncher')===true;
    show.onchange=()=>game.settings.set('taverngames','showdoppelkopfLauncher',show.checked);
    label.append(show,document.createTextNode(f('Unteren Spielbutton einblenden','Show bottom game button')));
    content.append(label);
    const set=selectField(content,f('Kartendeck','Card deck'),this.sets.map(deck=>[deck.key,deck.label]),priorSet??s?.cardSet.key??this.sets[0]?.key,'set');
    if (!this.sets.length) content.append(node('p',f('Importiere ein französisches oder Dracima-Deck mit Karten von 9 bis Ass.','Import a French or Dracima deck with cards from nine to ace.')));
    const npcLabel=node('label',f('NSCs · ein Name pro Zeile','NPCs · one name per line'));
    const names=node('textarea');
    names.dataset.draft='npcs';
    names.value=priorNames??Object.values(s?.npcs??{}).join('\n');
    npcLabel.append(names);
    content.append(npcLabel);
    control(content,f('Lobby öffnen','Open lobby'),()=>this.request('lobby',{set:set.value,npcs:names.value.split('\n').map(name=>name.trim()).filter(Boolean)}),
      !this.sets.length||s&&!['lobby','finished','aborted'].includes(s.phase));
    if (!s) return;
    if (['playing','wedding'].includes(s.phase)) control(content,s.paused?f('Fortsetzen','Resume'):f('Pause','Pause'),()=>this.request('pause'));
    for (const [id,name] of Object.entries(s.npcs)) {
      control(content,name+' · '+(s.npcManual[id]?f('SL steuert','GM controls'):f('Automatisch','Automatic')),
        ()=>this.request('npcControl',{id,manual:!s.npcManual[id]}));
    }
  }

  drawTable() {
    const root=this.windows.get('table')?.root;
    if (!root) return;
    const content=node('div',undefined,'schocken-content');
    root.replaceChildren(content);
    content.append(node('h2','Doppelkopf'));
    const s=this.getState();
    if (!s||s.phase==='aborted') return;
    if (s.phase==='lobby') {
      const joined=s.players.includes(game.user.id);
      content.append(node('p',s.players.length+'/4 · '+s.players.map(id=>this.name(id)).join(', ')));
      control(content,joined?f('Lobby verlassen','Leave lobby'):f('Beitreten','Join'),()=>this.request(joined?'leave':'join'),!joined&&s.players.length===4);
      return;
    }
    const actor=this.cardActor(s);
    const table=node('div',undefined,'taverngames-card-table taverngames-doppelkopf-table');
    content.append(table);
    if (s.phase==='wedding') {
      table.append(node('p',f('Vorbehaltsabfrage läuft','Checking reservations')));
      if (actor===s.wedding&&s.hands[actor]?.some(Boolean)) {
        control(table,f('Hochzeit anmelden','Declare wedding'),()=>this.request('wedding',{announce:true}),s.paused);
        control(table,f('Stille Hochzeit spielen','Play silent wedding'),()=>this.request('wedding',{announce:false}),s.paused);
      }
    }
    if (s.publicWedding) table.append(node('p',f('Hochzeit von ','Wedding declared by ')+this.name(s.wedding)));
    if (s.phase==='playing') table.append(node('p',f('Stich ','Trick ')+(s.tricks.length+1)+' / 12 · '+this.name(s.order[s.turn])+f(' ist am Zug',' is taking a turn')));
    const last=s.tricks.at(-1);
    if (last) table.append(node('p',f('Letzter Stich: ','Last trick: ')+this.name(last.winner)+' · '+last.eyes+' '+f('Augen','card points')));
    const plays=s.table.length?s.table:last?.plays??[];
    const cards=node('div',undefined,'taverngames-card-hand');
    for (const play of plays) {
      const column=node('div');
      this.card(column,s.cards[play.card]);
      column.append(node('small',this.name(play.id)));
      cards.append(column);
    }
    table.append(cards);
    if (s.result) {
      table.append(node('p','Re '+s.result.reEyes+' : '+s.result.kontraEyes+' Kontra · '+s.result.winningTeam.toUpperCase()+f(' gewinnt nach Augen',' wins on card points')));
      for (const id of s.order) table.append(node('p',this.name(id)+' · '+s.teams[id]+' · '+s.result.scores[id]+' '+f('Spielpunkte','game points')));
      table.append(node('p',f('Sonderpunkte','Bonus points')+' · Re '+s.result.extras.re+' : '+s.result.extras.kontra+' Kontra'));
    }
    for (const id of s.order) content.append(node('p',this.name(id)+' · '+s.hands[id].length+' '+f('Karten','cards')));
    if (!s.hands[actor]?.some(Boolean)) return;
    const row=node('section',undefined,'schocken-player');
    row.dataset.mauPlayer=actor;
    row.dataset.cardCaption=this.name(actor)+' · '+(s.teams[actor]??'').toUpperCase();
    const hand=node('div',undefined,'taverngames-card-hand taverngames-doppelkopf-hand');
    const legal=s.phase==='playing'&&s.order[s.turn]===actor&&!s.paused?legalDoppelkopf(s,actor):[];
    for (const id of s.hands[actor]) {
      const playable=legal.includes(id);
      const card=this.card(hand,s.cards[id],null,playable?()=>this.request('play',{card:id}):null);
      if (playable) card.classList.add('is-playable');
    }
    row.append(hand);
    content.append(row);
  }
}
