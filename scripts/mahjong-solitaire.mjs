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
  const board = [];
  // Filling pairs from the ends inward, top layer first, gives a legal removal order.
  for (const [layer, rows, width, offsetX, offsetY] of [[1, 4, 6, 3, 3], [0, 10, 12, 0, 0]]) {
    for (let row = 0; row < rows; row++) {
      for (let i = 0; i < width / 2; i++) {
        const [left, right] = pairs.pop();
        board.push({...left, x: offsetX + i, y: offsetY + row, layer},
          {...right, x: offsetX + width - i - 1, y: offsetY + row, layer});
      }
    }
  }
  return board;
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
    windowApp = createNativeWindow(foundry, 'mahjongsolitaire-puzzle', root, () => { windowApp = null; });
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
    root.append(status, area);
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
        button.style.left = (tile.x * 8 + tile.layer * .8) + '%';
        button.style.top = (tile.y * 9.7 - tile.layer * .8 + 1) + '%';
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
