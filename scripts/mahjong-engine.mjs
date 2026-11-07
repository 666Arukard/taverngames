import Game from './vendor/majiang/game.mjs';
import Shan from './vendor/majiang/shan.mjs';
import Shoupai from './vendor/majiang/shoupai.mjs';
import He from './vendor/majiang/he.mjs';
import rule from './vendor/majiang/rule.mjs';
import handTools from './vendor/majiang/xiangting.mjs';
import {MAHJONG_PROFILE} from './mahjong-deck.mjs';
import {secureIndex, startingOrder} from './start-choice.mjs';

const check = (ok, message) => { if (!ok) throw Error(message); };
const outcomes = ['hule', 'pingju'];
const choice = (kind, value, reply) => ({id: `${kind}:${value ?? ''}`, kind, value, reply});
const omit = new Set(['_players', '_callback', '_view', '_handler', '_timeout_id', '_stop']);

class Table extends Game {
  constructor(mode, random) {
    const options = {'赤牌': {m: 0, p: 0, s: 0}};
    if (mode === 'intro') Object.assign(options, {
      '配給原点': 0, '場数': 0, '途中流局あり': false, '流し満貫あり': false,
      'ノーテン罰あり': false, '最大同時和了数': 1, '連荘方式': 0, '裏ドラあり': false,
      'カンドラあり': false, 'トビ終了あり': false,
    });
    super([], () => {}, rule(options), 'TavernGames Mahjong');
    this._sync = true;
    this._mode = mode;
    Object.defineProperty(this, 'random', {value: random});
  }

  call_players(type, messages) {
    this._status = type;
    this._reply = [];
    if (outcomes.includes(type)) this.result = messages[0][type];
  }

  notify_players() {}

  qipai() {
    // The upstream wall implementation handles dead-wall draws and dora positions.
    const tiles = [];
    for (const suit of ['m', 'p', 's', 'z']) {
      for (let n = 1; n <= (suit === 'z' ? 7 : 9); n++) {
        for (let copy = 0; copy < 4; copy++) tiles.push(suit + n);
      }
    }
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = this.random(i + 1);
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    const wall = Object.assign(Object.create(Shan.prototype), {
      _rule: this._rule, _pai: tiles, _baopai: [tiles[4]],
      _fubaopai: this._rule['裏ドラあり'] ? [tiles[9]] : null,
      _weikaigang: false, _closed: false,
    });
    this.result = null;
    super.qipai(wall);
  }

  allow_hule(seat) {
    if (this._mode === 'riichi') return super.allow_hule(seat);
    const hand = this.model.shoupai[seat ?? this.model.lunban].clone();
    if (seat != null) hand.zimo(this._status === 'gang' ? this._gang[0] + this._gang.at(-1) : this._dapai);
    return handTools.xiangting(hand) === -1;
  }

  hule() {
    if (this._mode === 'riichi') return super.hule();
    const winner = this._hule.shift() ?? this.model.lunban;
    const hand = this.model.shoupai[winner].clone();
    if (winner !== this.model.lunban) hand.zimo(this._status === 'gang' ? this._gang[0] + this._gang.at(-1) : this._dapai);
    this._fenpei = [0, 0, 0, 0];
    this._fenpei[winner] = 1;
    const result = {l: winner, shoupai: hand.toString(), fenpei: this._fenpei};
    this.add_paipu({hule: result});
    this.call_players('hule', [{hule: result}]);
  }
}

function snapshot(table) {
  const data = Object.fromEntries(Object.entries(table).filter(([key]) => !omit.has(key)));
  return structuredClone(data);
}

function restore(state, random = secureIndex) {
  const table = Object.assign(new Table(state.mode, random), structuredClone(state.table));
  const m = table.model;
  if (m.shan) Object.setPrototypeOf(m.shan, Shan.prototype);
  for (const hand of m.shoupai) Object.setPrototypeOf(hand, Shoupai.prototype);
  for (const river of m.he) Object.setPrototypeOf(river, He.prototype);
  return table;
}

function options(table, playerIndex) {
  const seat = table.model.player_id.indexOf(playerIndex);
  const active = table.model.lunban;
  const status = table._status;
  const moves = [];
  if (seat === active && (['zimo', 'gangzimo'].includes(status) || status === 'fulou' && !table._gang)) {
    for (const tile of new Set(table.get_dapai() ?? [])) {
      moves.push(choice('discard', tile, {dapai: tile}));
      if (table._mode === 'riichi' && status !== 'fulou' && table.allow_lizhi(tile)) {
        moves.push(choice('riichi', tile, {dapai: tile + '*'}));
      }
    }
    if (status !== 'fulou') {
      if (table.allow_hule()) moves.unshift(choice('tsumo', null, {hule: true}));
      for (const meld of table.get_gang_mianzi() ?? []) moves.push(choice('kan', meld, {gang: meld}));
      if (table.allow_pingju()) moves.push(choice('draw', null, {daopai: true}));
    }
  }
  if (seat !== active && ['dapai', 'gang'].includes(status)) {
    if (status === 'gang' && /^[mpsz]\d{4}$/.test(table._gang)) return [];
    if (table.allow_hule(seat)) moves.push(choice('ron', null, {hule: true}));
    if (status === 'dapai') {
      for (const [kind, melds] of [['chi', table.get_chi_mianzi(seat)], ['pon', table.get_peng_mianzi(seat)], ['kan', table.get_gang_mianzi(seat)]]) {
        for (const meld of melds ?? []) moves.push(choice(kind, meld, {fulou: meld}));
      }
    }
    if (moves.length) moves.push(choice('pass', null, {}));
  }
  return moves;
}

function advance(state, table) {
  for (let n = 0; n < 24; n++) {
    if (table._status === 'jieju') {
      state.phase = 'finished';
      const high = Math.max(...table.model.defen);
      state.draw = state.mode === 'intro' && high === 0;
      state.winners = state.draw ? [] : state.order.filter((_, i) => table._paipu.rank[i] === 1);
      state.losers = state.draw ? [] : state.order.filter(id => !state.winners.includes(id));
      return;
    }
    if (outcomes.includes(table._status)) return;
    for (let i = 0; i < 4; i++) {
      if (!table._reply[i] && !options(table, i).length) table.reply(i, {});
    }
    if (table._reply.filter(Boolean).length !== 4) return;
    table.next();
    state.turnNumber++;
  }
  throw Error('Mahjong: invalid turn transition.');
}

export function createMahjong({cardSet, mode = 'intro', npcs = {}, startSelection = 'rules'}) {
  check(['intro', 'riichi'].includes(mode), 'Mahjong: invalid mode.');
  const tiles = MAHJONG_PROFILE.select(cardSet.cards);
  const cards = Object.fromEntries(tiles.map(card => [card.code, card]));
  return {version: 1, game: 'mahjong', mode, phase: 'lobby', revision: 0, turnNumber: 0, paused: false,
    players: Object.keys(npcs), npcs, npcManual: {}, order: [], startSelection, table: null, cards,
    cardSet: {key: cardSet.key, label: cardSet.label}, tiles, winners: [], losers: []};
}

export function actMahjong(old, id, action, args = {}, gm = false, random = secureIndex) {
  check(old, 'No game exists.');
  const s = structuredClone(old);
  s.revision++;
  if (action === 'abort') { check(gm, 'GM only.'); s.phase = 'aborted'; s.table = null; return s; }
  if (action === 'pause') { check(gm, 'GM only.'); s.paused = !s.paused; return s; }
  if (action === 'npcControl') { check(gm && s.npcs[args.id], 'GM only.'); s.npcManual[args.id] = args.manual === true; return s; }
  check(!s.paused, 'Game is paused.');
  if (action === 'join') { check(s.phase === 'lobby' && !s.players.includes(id) && s.players.length < 4, 'Mahjong needs four participants.'); s.players.push(id); return s; }
  if (action === 'leave') { check(s.phase === 'lobby', 'Leave in the lobby.'); s.players = s.players.filter(player => player !== id); return s; }
  if (action === 'begin') {
    check(gm, 'GM only.');
    check(s.phase === 'lobby' && s.players.length === 4, 'Mahjong needs four participants.');
    s.order = startingOrder(s);
    s.phase = 'playing';
    const table = new Table(s.mode, random);
    table.kaiju(0);
    advance(s, table);
    s.table = snapshot(table);
    return s;
  }
  check(s.phase === 'playing' && s.table, 'It is not your turn.');
  const table = restore(s, random);
  if (action === 'nextHand') {
    check(gm && outcomes.includes(table._status), 'GM only.');
    for (let i = 0; i < 4; i++) table.reply(i, {});
    table.next();
    s.turnNumber++;
  } else {
    const index = s.order.indexOf(id);
    check(action === 'move' && index >= 0 && args.step === s.turnNumber && !table._reply[index], 'The game state changed. Please try again.');
    const move = options(table, index).find(move => move.id === args.move);
    check(move, 'Mahjong: choose a legal action.');
    table.reply(index, move.reply);
  }
  advance(s, table);
  s.table = snapshot(table);
  return s;
}

function handTiles(hand) {
  return ['m', 'p', 's', 'z'].flatMap(suit => hand._bingpai[suit].flatMap((count, rank) => rank ? Array(count).fill(suit + rank) : []));
}

export function mahjongView(s, user = {}) {
  if (!s) return null;
  const {table: hidden, tiles, ...publicState} = s;
  const view = {...structuredClone(publicState), hands: {}, discard: [], table: []};
  if (!hidden) return view;
  const table = restore(s);
  const m = table.model;
  view.stage = table._status;
  view.active = s.order[m.player_id[m.lunban]];
  view.remaining = m.shan.paishu;
  view.roundWind = m.zhuangfeng;
  view.roundIndex = m.jushu;
  view.honba = m.changbang;
  view.riichiSticks = m.lizhibang;
  view.dora = s.mode === 'riichi' ? m.shan.baopai : [];
  view.result = outcomes.includes(view.stage) ? table.result : null;
  if (view.result?.shoupai) {
    view.revealed = typeof view.result.shoupai === 'string'
      ? {[s.order[m.player_id[view.result.l]]]: handTiles(Shoupai.fromString(view.result.shoupai))}
      : Object.fromEntries(view.result.shoupai.flatMap((hand, seat) => hand ? [[s.order[m.player_id[seat]], handTiles(Shoupai.fromString(hand))]] : []));
  }
  view.seats = m.player_id.map((index, seat) => {
    const id = s.order[index];
    const own = id === user.id || user.isGM && s.npcs[id] && s.npcManual[id];
    const hand = handTiles(m.shoupai[seat]);
    view.hands[id] = own ? hand : hand.map(() => null);
    return {id, seat, discards: m.he[seat]._pai, melds: m.shoupai[seat]._fulou,
      drawn: own && m.shoupai[seat]._zimo?.length === 2 ? m.shoupai[seat]._zimo : null,
      points: m.defen[index] + (view.result?.fenpei?.[seat] ?? 0), riichi: !!m.shoupai[seat].lizhi,
      choices: own && s.phase === 'playing' && !table._reply[index] ? options(table, index).map(({reply, ...move}) => move) : []};
  });
  view.table = [view.stage];
  return view;
}

export function mahjongNpc(s) {
  if (s?.phase !== 'playing' || s.paused) return null;
  const table = restore(s);
  for (const [index, id] of s.order.entries()) {
    if (!s.npcs[id] || s.npcManual[id] || table._reply[index]) continue;
    const moves = options(table, index);
    const hand = table.model.shoupai[table.model.player_id.indexOf(index)];
    const discards = moves.filter(move => move.kind === 'discard');
    discards.sort((a, b) => handTools.xiangting(hand.clone().dapai(a.value)) - handTools.xiangting(hand.clone().dapai(b.value)));
    const preferred = discards[0];
    const move = moves.find(move => ['tsumo', 'ron'].includes(move.kind))
      ?? moves.find(move => move.kind === 'riichi' && move.value === preferred?.value)
      ?? preferred ?? moves.find(move => move.kind === 'pass');
    if (move) return {id, action: 'move', args: {move: move.id, step: s.turnNumber}};
  }
  return null;
}
