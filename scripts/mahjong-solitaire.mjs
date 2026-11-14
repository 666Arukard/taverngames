import {gameView} from './game-view.mjs';
import {listCardSets} from './card-sets.mjs';
import {MAHJONG_PROFILE} from './mahjong-deck.mjs';
import {createNativeWindow} from './native-ui.mjs';
import {control, node, selectField} from './tavern-ui.mjs';
import {f} from './farkle-text.mjs';

const profile = {
  ...MAHJONG_PROFILE,
  readCard(card, safeImage) {
    const tile = MAHJONG_PROFILE.readCard(card, safeImage);
    const design = card.flags?.['dracima-mahjong']?.designId;
    if (/^(flower|season)-/.test(design ?? '')) tile.code = design.split('-')[0];
    return tile;
  },
  select(cards) {
    MAHJONG_PROFILE.select(cards.filter(tile => !['flower', 'season'].includes(tile.code)));
    if (cards.length !== 144 || new Set(cards.map(tile => tile.id)).size !== 144 ||
        ['flower', 'season'].some(code => cards.filter(tile => tile.code === code).length !== 4)) {
      throw Error('Mahjong Solitaire requires a complete 144-tile deck.');
    }
    return cards;
  },
};

export function isFree(tile, board) {
  if (board.some(other => other.x === tile.x && other.y === tile.y && other.layer > tile.layer)) return false;
  return [-1, 1].some(side => !board.some(other =>
    other.layer === tile.layer && other.y === tile.y && other.x === tile.x + side));
}

export function makeSolitaire(tiles, random = Math.random) {
  const byCode = Map.groupBy(profile.select(tiles), tile => tile.code);
  const pairs = [...byCode.values()].flatMap(group => [group.slice(0, 2), group.slice(2)]);
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  const positions = [];
  for (const [layer, rows, width, x, y] of [[0, 9, 12, 0, 0], [1, 4, 6, 3, 2], [2, 2, 4, 4, 3], [3, 2, 2, 5, 3]]) {
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < width; column++) positions.push({x: x + column, y: y + row, layer});
    }
  }
  // Assign motifs in a legal removal order, varying both the row and the layer.
  for (let attempt = 0; attempt < 24; attempt++) {
    let remaining = positions;
    const board = [];
    for (const pair of pairs) {
      const free = remaining.filter(tile => isFree(tile, remaining));
      if (free.length < 2) break;
      const first = free.splice(Math.floor(random() * free.length), 1)[0];
      const differentRow = free.filter(tile => tile.y !== first.y || tile.layer !== first.layer);
      const candidates = differentRow.length ? differentRow : free;
      const second = candidates[Math.floor(random() * candidates.length)];
      board.push({...pair[0], ...first}, {...pair[1], ...second});
      remaining = remaining.filter(tile => tile !== first && tile !== second);
    }
    if (!remaining.length) return board;
  }
  // Taking the two ends of each row from top to bottom always works.
  const remaining = [...positions].reverse();
  return pairs.flatMap(pair => {
    const right = remaining.shift();
    const left = remaining.splice(remaining.findLastIndex(tile => tile.y === right.y && tile.layer === right.layer), 1)[0];
    return [{...pair[0], ...right}, {...pair[1], ...left}];
  });
}

const instructions = () => f(
  'Entferne alle Steine paarweise. Ein Stein ist frei, wenn nichts auf ihm liegt und links oder rechts kein Stein direkt angrenzt. Zwei gleiche Motive bilden ein Paar. Beliebige zwei Blumen oder zwei Jahreszeiten passen ebenfalls zusammen.',
  'Remove all tiles in pairs. A tile is free if nothing covers it and either its left or right side is open. Match two identical tiles, any two flowers, or any two seasons.',
);

let windowApp, guideApp, board, selected, deckKey;
export const mahjongSolitaire = {
  async open() {
    if (game.settings.get('taverngames', 'betaTest') !== true) return;
    if (windowApp) { windowApp.bringToFront(); return; }
    const decks = await listCardSets(game, profile);
    if (windowApp || game.settings.get('taverngames', 'betaTest') !== true) return;
    const root = node('section', undefined, 'taverngames-surface schocken-content');
    let closeBoard;
    windowApp = createNativeWindow(foundry, 'mahjongsolitaire-table', root, () => { closeBoard?.(); windowApp = null; });
    root.append(node('p', instructions()));
    if (!decks.length) {
      root.append(node('p', f('Importiere zuerst ein Dracima-Mahjong-Deck mit 144 Steinen.', 'First import a Dracima Mahjong deck with 144 tiles.')));
      return;
    }
    const deck = selectField(root, f('Mahjong-Deck', 'Mahjong deck'), decks.map(set => [set.key, set.label]), deckKey ?? decks[0].key, 'solitaireDeck');
    control(root, f('Neues Rätsel', 'New puzzle'), () => start());
    const status = node('p');
    status.setAttribute('role', 'status');
    const area = node('div', undefined, 'taverngames-solitaire-board');
    const stage = node('section', undefined, 'taverngames-connect-stage taverngames-solitaire-stage');
    const play = node('section', undefined, 'taverngames-connect-play');
    play.append(status, area);
    const anchor = document.createComment('Mahjong Solitaire board');
    root.append(anchor, play);
    const update = gameView.observePresentation(() => {
      const left = (gameView.left?.getBoundingClientRect().right ?? 0) + 46;
      let right = innerWidth - 12;
      for (const sidebar of document.querySelectorAll('#sidebar,#sidebar-tabs,.taverngames-sidebar')) {
        const bounds = sidebar.getBoundingClientRect();
        if (bounds.height > 40 && bounds.width > 0 && bounds.left >= 0 && bounds.left < innerWidth &&
            getComputedStyle(sidebar).visibility !== 'hidden') right = Math.min(right, bounds.left - 12);
      }
      if (!gameView.enabled() || gameView.selected !== 'mahjongsolitaire-table' ||
          root.parentElement !== gameView.playerContent || right - left < 240) {
        if (stage.contains(play)) anchor.after(play);
        stage.remove();
        return;
      }
      stage.style.left = left + 'px';
      stage.style.right = (innerWidth - right) + 'px';
      if (!stage.contains(play)) stage.append(play);
      if (!stage.isConnected) document.body.append(stage);
    });
    closeBoard = () => { update(); stage.remove(); };
    function start() {
      const set = decks.find(item => item.key === deck.value) ?? decks[0];
      deckKey = set.key;
      board = makeSolitaire(set.cards);
      selected = null;
      draw();
    }
    function draw() {
      const free = board.filter(tile => isFree(tile, board));
      const stuck = new Set(free.map(tile => tile.code)).size === free.length;
      status.textContent = !board.length ? f('Alle Paare gefunden!', 'All pairs found!') :
        board.length + f(' Steine übrig', ' tiles left') + (stuck ? f(' · Keine freien Paare mehr.', ' · No free pairs remain.') : '');
      area.replaceChildren();
      for (const tile of board) {
        const button = control(area, tile.front ? '' : tile.name, () => {
          const first = free.find(item => item.id === selected);
          if (first?.id === tile.id) selected = null;
          else if (first?.code === tile.code) {
            board = board.filter(item => item.id !== first.id && item.id !== tile.id);
            selected = null;
          } else selected = tile.id;
          draw();
        }, !free.includes(tile));
        button.title = tile.name;
        button.setAttribute('aria-label', tile.name);
        button.setAttribute('aria-pressed', String(selected === tile.id));
        button.style.left = (tile.x * 8 + tile.layer * 1.05) + '%';
        button.style.top = (tile.y * 10.5 - tile.layer * 1.2 + 3) + '%';
        button.style.zIndex = String(tile.layer);
        if (tile.front) {
          const img = node('img');
          img.src = tile.front;
          img.alt = '';
          img.onerror = () => { button.textContent = tile.name; };
          button.append(img);
        }
      }
    }
    if (board && decks.some(set => set.key === deckKey)) draw();
    else start();
  },

  guide() {
    if (game.settings.get('taverngames', 'betaTest') !== true) return;
    if (guideApp) { guideApp.bringToFront(); return; }
    const root = node('section', undefined, 'taverngames-surface schocken-content');
    root.append(node('p', f(instructions(), 'The English instructions are awaiting review. Select German for the German rules.')));
    guideApp = createNativeWindow(foundry, 'mahjongsolitaire-guide', root, () => { guideApp = null; });
  },
};
