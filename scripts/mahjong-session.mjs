import {PeterSession} from './old-maid-session.mjs';
import {createMahjong, actMahjong, mahjongView, mahjongNpc} from './mahjong-engine.mjs';
import {MAHJONG_PROFILE} from './mahjong-deck.mjs';
import {escapeHTML, gameTitle} from './tavern-text.mjs';
import {f} from './farkle-text.mjs';

export class MahjongSession extends PeterSession {
  restore(s) {
    if (s && (s.version !== 1 || s.game !== 'mahjong')) throw Error('Invalid game save.');
    this.state = structuredClone(s);
    this.wait = this.now() + 900;
  }

  project(user) { return mahjongView(this.state, user); }

  async handleNow(d, user) {
    if (!this.enabled() && !(d.action === 'abort' && user.isGM)) throw Error('Beta testing is disabled.');
    if (d.action === 'read') return this.project(user);
    const old = this.state;
    if (!['join', 'leave', 'move'].includes(d.action) && !(d.action === 'abort' && user.isGM) &&
        d.revision !== (old?.revision ?? -1)) throw Error('The game state changed. Please try again.');
    let next;
    if (['lobby', 'restart'].includes(d.action)) {
      if (!user.isGM) throw Error('GM only.');
      if (old && !['lobby', 'finished', 'aborted'].includes(old.phase)) throw Error('Finish or end the current game first.');
      if (d.action === 'restart') {
        if (!old) throw Error('No game exists.');
        next = createMahjong({...old, cardSet: {...old.cardSet, cards: old.tiles}});
        next.players = [...old.players];
        next.npcManual = {...old.npcManual};
      } else {
        const {set, mode, npcs: names = []} = d.args ?? {};
        if (!Array.isArray(names) || names.length > 4 || names.some(name => typeof name !== 'string' || !name.trim() || name.length > 60)) throw Error('Invalid NPCs.');
        const npcs = Object.fromEntries(names.map(name => ['npc-' + crypto.randomUUID(), name.trim()]));
        next = createMahjong({mode, npcs, cardSet: await this.resolveSet(set, MAHJONG_PROFILE)});
      }
      next.gameId = crypto.randomUUID();
      next.revision = (old?.revision ?? 0) + 1;
    } else {
      const args = d.args ?? {};
      if (d.action === 'move' && args.gameId !== old?.gameId) throw Error('The game state changed. Please try again.');
      const id = user.isGM && old?.npcs[args.player] && old.npcManual[args.player] ? args.player : user.id;
      next = actMahjong(old, id, d.action, args, user.isGM);
    }
    await this.commit(next);
    return this.project(user);
  }

  async commit(next) {
    const before = this.state;
    await this.save(next);
    this.state = next;
    this.wait = this.now() + 900;
    if (next.phase !== 'finished' || before?.phase === 'finished' || this.hasAnnouncement(next.gameId)) return;
    const result = next.draw ? f('Unentschieden', 'Draw') : f('Gewonnen: ', 'Winner: ') + next.winners.map(id => escapeHTML(next.npcs[id] ?? this.getName(id))).join(', ');
    try {
      await this.announce({content: `<h2>${escapeHTML(gameTitle(this.scope))}</h2><p>${result}</p>`, flags: {taverngames: {game: this.scope, gameId: next.gameId}}});
    } catch (error) { globalThis.ui?.notifications?.warn(error.message); }
  }

  npcStep() {
    return this.enqueue(async () => {
      if (!this.enabled() || this.now() < this.wait) return false;
      const move = mahjongNpc(this.state);
      if (!move) return false;
      await this.commit(actMahjong(this.state, move.id, move.action, move.args));
      return true;
    });
  }
}
