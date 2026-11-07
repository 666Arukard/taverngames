const numberedSuits = {scrolls: 'm', circles: 'p', bamboo: 's'};
const honors = ['wind-east', 'wind-south', 'wind-west', 'wind-north', 'dragon-white', 'dragon-green', 'dragon-red'];
const tileCodes = Object.keys(numberedSuits).flatMap(suit => Array.from({length: 9}, (_, i) => numberedSuits[suit] + (i + 1)));
tileCodes.push(...honors.map((_, i) => 'z' + (i + 1)));

export const MAHJONG_PROFILE = {
  id: 'mahjong-136',
  readCard(card, safeImage) {
    const tile = card.flags?.['dracima-mahjong'];
    const match = /^(scrolls|circles|bamboo)-([1-9])$/.exec(tile?.designId ?? '');
    const honor = honors.indexOf(tile?.designId);
    const code = match ? numberedSuits[match[1]] + match[2] : honor >= 0 ? 'z' + (honor + 1) : null;
    return {
      id: tile?.tileId ?? card._id, code, name: card.name,
      front: safeImage(card.faces?.[0]?.img),
      back: safeImage(card.back?.img),
    };
  },
  select(cards) {
    const tiles = cards.filter(card => card.code);
    if (tiles.length !== 136 || tiles.some(tile => typeof tile.id !== 'string' || !tile.id) || new Set(tiles.map(card => card.id)).size !== 136 ||
        tileCodes.some(code => tiles.filter(card => card.code === code).length !== 4)) {
      throw Error('The selected deck needs four copies of every Mahjong tile type.');
    }
    return structuredClone(tiles);
  },
};
