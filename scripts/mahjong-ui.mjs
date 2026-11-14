import {MauUI} from './maumau-ui.mjs';
import {node, control, selectField} from './tavern-ui.mjs';
import {listCardSets} from './card-sets.mjs';
import {MAHJONG_PROFILE} from './mahjong-deck.mjs';
import {f} from './farkle-text.mjs';

const windName = index => [f('Ost', 'East'), f('Süd', 'South'), f('West', 'West'), f('Nord', 'North')][index];
const actionName = kind => ({riichi: 'Riichi', ron: 'Ron', tsumo: 'Tsumo', chi: 'Chi', pon: 'Pon', kan: 'Kan',
  pass: f('Passen – Abwurf nicht nehmen', 'Pass – decline discard'), draw: f('Hand wegen neun verschiedener Rand- und Ehrensteine abbrechen', 'Abort hand with nine distinct terminals and honors')})[kind];
const resultName = name => ({
  '荒牌平局': f('Mauer leer · kein Gewinn', 'Wall exhausted · no winner'),
  '流し満貫': f('Nagashi Mangan', 'Nagashi Mangan'),
  '九種九牌': f('Abbruch wegen neun verschiedener Rand- und Ehrensteine', 'Aborted with nine distinct terminals and honors'),
  '三家和': f('Abbruch wegen dreier gleichzeitiger Ron-Ansagen', 'Aborted after three simultaneous ron claims'),
  '四家立直': f('Abbruch nach vier Riichi-Ansagen', 'Aborted after four riichi declarations'),
  '四風連打': f('Abbruch nach vier gleichen Windabwürfen zu Beginn', 'Aborted after four matching wind discards at the start'),
  '四開槓': f('Abbruch nach vier Kan', 'Aborted after four kans'),
})[name] ?? name;
const meldTiles = value => [...value.slice(1).matchAll(/\d/g)].map(match => value[0] + match[0]);

export class MahjongUI extends MauUI {
  async open() {
    if (game.user.isGM) this.sets = await listCardSets(game, MAHJONG_PROFILE);
    this.window('table');
    if (game.user.isGM) this.window('moderation');
    this.draw();
    void this.request('read');
  }

  drawModeration() {
    const root = this.windows.get('moderation')?.root;
    if (!root || !game.user.isGM) return;
    const s = this.getState();
    const drafts = new Map([...root.querySelectorAll('[data-draft]')].map(el => [el.dataset.draft, el.value]));
    root.replaceChildren();
    const content = node('div', undefined, 'schocken-content');
    root.append(content);
    content.append(node('h2', 'Mahjong'));
    control(content, f('Spieltisch öffnen', 'Open game table'), () => { this.window('table'); this.drawTable(); });
    control(content, f('Anleitung', 'Instructions'), () => this.guide());
    const launcher = node('label', undefined, 'schocken-choice');
    const show = node('input');
    show.type = 'checkbox';
    show.checked = game.settings.get('taverngames', 'showmahjongLauncher') === true;
    show.onchange = () => game.settings.set('taverngames', 'showmahjongLauncher', show.checked);
    launcher.append(show, document.createTextNode(f('Unteren Spielbutton einblenden', 'Show bottom game button')));
    content.append(launcher);
    const set = selectField(content, f('Mahjong-Deck', 'Mahjong deck'), this.sets.map(item => [item.key, item.label]),
      drafts.get('set') ?? s?.cardSet.key ?? this.sets[0]?.key ?? '', 'set');
    if (!this.sets.length) content.append(node('p', f('Importiere ein Dracima-Mahjong-Deck aus dem Kompendium in die Kartenverwaltung und öffne die Moderation erneut.', 'Import a Dracima Mahjong deck from the compendium into Cards, then reopen moderation.')));
    const mode = selectField(content, f('Regelvariante', 'Rules'), [['intro', f('Einsteiger', 'Beginner')], ['riichi', 'Riichi']], drafts.get('mode') ?? s?.mode ?? 'intro', 'mode');
    const label = node('label', f('NPCs – ein Name pro Zeile, vier Plätze insgesamt', 'NPCs – one name per line, four seats total'));
    const names = node('textarea');
    names.dataset.draft = 'npcs';
    names.value = drafts.get('npcs') ?? Object.values(s?.npcs ?? {}).join('\n');
    label.append(names);
    content.append(label);
    control(content, f('Lobby öffnen', 'Open lobby'), () => this.request('lobby', {set: set.value, mode: mode.value, npcs: names.value.split('\n').map(name => name.trim()).filter(Boolean)}),
      !this.sets.length || s && !['lobby', 'finished', 'aborted'].includes(s.phase));
    if (s?.phase === 'playing') control(content, s.paused ? f('Fortsetzen', 'Resume') : f('Pause', 'Pause'), () => this.request('pause'));
    if (s && ['lobby', 'playing'].includes(s.phase)) {
      for (const [id, name] of Object.entries(s.npcs)) {
        control(content, name + ' · ' + (s.npcManual[id] ? f('SL steuert', 'GM controls') : f('Automatisch', 'Automatic')),
          () => this.request('npcControl', {id, manual: !s.npcManual[id]}));
      }
    }
    if (s?.result) this.nextHandButton(content, s);
  }

  cardActor(s) {
    if (game.user.isGM && s.seats?.some(seat => seat.id === this.controlled && s.npcManual[seat.id])) return this.controlled;
    return game.user.id;
  }

  nextHandButton(parent, s) {
    if (game.user.isGM && s.phase === 'playing') {
      control(parent, s.mode === 'intro' ? f('Hand abschließen', 'Finish hand') : f('Weiter', 'Continue'), () => this.request('nextHand'), s.paused);
    }
  }

  drawTable() {
    const root = this.windows.get('table')?.root;
    if (!root) return;
    const openHistory = new Set([...root.querySelectorAll('details[data-mahjong-history][open]')].map(el => el.dataset.mahjongHistory));
    root.replaceChildren();
    const content = node('div', undefined, 'schocken-content');
    root.append(content);
    content.append(node('h2', 'Mahjong'));
    const s = this.getState();
    if (!s) return;
    if (s.phase === 'lobby') {
      const joined = s.players.includes(game.user.id);
      content.append(node('p', `${s.players.length}/4 · ${s.players.map(id => this.name(id)).join(', ')}`));
      control(content, joined ? f('Lobby verlassen', 'Leave lobby') : f('Beitreten', 'Join'), () => this.request(joined ? 'leave' : 'join'), !joined && s.players.length >= 4);
      return;
    }
    if (!s.seats) return;
    const actor = this.cardActor(s);
    const table = node('div', undefined, 'taverngames-card-table taverngames-mahjong-table');
    content.append(table);
    const addTiles = (parent, tiles) => {
      const row = node('div', undefined, 'taverngames-mahjong-tiles');
      parent.append(row);
      for (const tile of tiles) if (s.cards[tile]) this.card(row, s.cards[tile]);
    };
    if (s.mode === 'riichi') table.append(node('p', `${windName(s.roundWind % 4)} ${(s.roundIndex % 4) + 1} · Honba ${s.honba} · Riichi ${s.riichiSticks}`));
    table.append(node('p', `${f('Steine in der Mauer', 'Tiles in the wall')} · ${s.remaining}`));
    if (s.dora.length) { table.append(node('p', f('Dora-Anzeiger', 'Dora indicators'))); addTiles(table, s.dora); }
    if (s.result) {
      const result = s.result;
      table.append(node('p', result.l == null ? f('Hand beendet', 'Hand ended') : this.name(s.seats[result.l].id) + (result.baojia == null ? ' · Tsumo' : ' · Ron')));
      if (result.name) table.append(node('p', resultName(result.name)));
      if (result.defen != null) table.append(node('p', `${result.defen} ${f('Punkte', 'points')} · ${result.fanshu ?? 0} Han · ${result.fu ?? 0} Fu`));
      if (result.hupai?.length) table.append(node('p', result.hupai.map(yaku => `${yaku.name} (${yaku.fanshu})`).join(' · ')));
      if (result.fubaopai?.length) { table.append(node('p', 'Ura-Dora')); addTiles(table, result.fubaopai); }
      this.nextHandButton(table, s);
    } else if (s.phase === 'playing') {
      table.append(node('p', s.paused ? f('Pausiert', 'Paused') : ['dapai', 'gang'].includes(s.stage) ? f('Abwurf prüfen', 'Respond to the discard') : this.name(s.active) + f(' ist am Zug', ' is taking a turn')));
    }
    if (game.user.isGM && Object.values(s.npcManual).includes(true)) {
      const entries = [[game.user.id, f('Eigene Ansicht', 'My view')], ...s.seats.filter(seat => s.npcManual[seat.id]).map(seat => [seat.id, this.name(seat.id)])];
      const select = selectField(table, f('Hand anzeigen', 'Show hand'), entries, actor, 'mahjongActor');
      select.onchange = () => { this.controlled = select.value; this.drawTable(); };
    }
    const seats = node('div', undefined, 'taverngames-mahjong-seats');
    table.append(seats);
    for (const seat of s.seats) {
      const section = node('section');
      seats.append(section);
      section.append(node('h3', `${windName(seat.seat)} · ${this.name(seat.id)} · ${seat.points}${seat.riichi ? ' · Riichi' : ''}`));
      if (seat.id === s.active && s.phase === 'playing' && !s.result) section.classList.add('is-active');
      const discards = seat.discards.filter(tile => !/[+=-]$/.test(tile)).map(tile => tile.slice(0, 2));
      addTiles(section, discards.slice(-6));
      if (discards.length > 6) {
        const history = node('details');
        history.dataset.mahjongHistory = seat.id;
        history.open = openHistory.has(seat.id);
        history.append(node('summary', f('Ältere Abwürfe', 'Earlier discards') + ' (' + (discards.length - 6) + ')'));
        addTiles(history, discards.slice(0, -6));
        section.append(history);
      }
      for (const meld of seat.melds) addTiles(section, meldTiles(meld));
      if (s.revealed?.[seat.id]) addTiles(section, s.revealed[seat.id]);
    }
    const seat = s.seats.find(seat => seat.id === actor);
    if (!seat) return;
    const choices = s.paused ? [] : seat.choices;
    const mayDiscard = choices.some(move => move.kind === 'discard');
    const mayClaim = choices.some(move => move.kind === 'pass');
    const drawnDiscard = choices.find(move => move.kind === 'discard' && move.value === seat.drawn + '_');
    if (!s.result && !s.paused && s.phase === 'playing') {
      const prompt = mayDiscard
        ? seat.riichi
          ? f('Nach Riichi kannst du nur den gerade gezogenen Stein abwerfen.', 'After Riichi, you can only discard the tile you just drew.')
          : f('Du bist am Zug. Klicke auf einen gold umrandeten Stein deiner Hand, um ihn abzuwerfen.', 'Your turn. Click a gold-outlined tile in your hand to discard it.')
        : mayClaim
          ? f('Du kannst den fremden Abwurf nehmen oder passen.', 'You can claim the discard or pass.')
          : ['dapai', 'gang'].includes(s.stage)
            ? f('Warte, bis die Reaktionen auf den letzten Zug abgeschlossen sind.', 'Wait for responses to the last move.')
            : f('Du musst gerade nichts tun. Warte auf den nächsten Zug.', 'You have no action right now. Wait for the next turn.');
      table.insertBefore(node('p', prompt), seats);
    }
    const handSection = node('section', undefined, 'schocken-player');
    handSection.dataset.cardCaption = mayDiscard ? f('Deine Hand · Stein zum Abwerfen anklicken', 'Your hand · click a tile to discard') : this.name(actor);
    handSection.dataset.mauPlayer = actor;
    handSection.append(node('h3', this.name(actor)));
    const hand = node('div', undefined, 'taverngames-card-hand taverngames-mahjong-hand');
    handSection.append(hand);
    content.append(handSection);
    const send = move => this.request('move', {move: move.id, player: actor, step: s.turnNumber, gameId: s.gameId});
    const tiles = [...s.hands[actor]];
    if (seat.drawn && tiles.includes(seat.drawn)) tiles.push(...tiles.splice(tiles.lastIndexOf(seat.drawn), 1));
    for (const [i, tile] of tiles.entries()) {
      const drawn = i === tiles.length - 1 && tile === seat.drawn;
      const move = choices.find(move => move.kind === 'discard' && move.value === tile + (drawn ? '_' : ''));
      if (!s.cards[tile]) continue;
      const card = this.card(hand, s.cards[tile], null, move ? () => send(move) : null);
      if (move) {
        card.classList.add('is-playable');
        card.setAttribute('aria-label', f('Abwerfen: ', 'Discard: ') + s.cards[tile].name);
      }
      if (drawn) {
        card.classList.add('is-drawn');
        card.title += ' · ' + f('Gezogen', 'Drawn');
      }
    }
    const actions = node('div', undefined, 'schocken-actions');
    table.insertBefore(actions, seats);
    if (drawnDiscard) control(actions, f('Gezogenen Stein abwerfen', 'Discard drawn tile'), () => send(drawnDiscard));
    for (const move of choices.filter(move => move.kind !== 'discard')) {
      const tiles = move.kind === 'riichi' ? [move.value.slice(0, 2)] : move.value ? meldTiles(move.value) : [];
      const details = tiles.map(tile => s.cards[tile]?.name ?? tile).join(', ');
      control(actions, actionName(move.kind) + (details ? ' · ' + details : ''), () => send(move));
    }
  }
}
