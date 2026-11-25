// Arrow skins: bought with coins, purely cosmetic. A skin changes the colour or weight of plain
// arrows only; ice, gold and warning colours stay the same, so the board reads the same way.

import { player, persist } from './player.js';
import { spendCoins } from './economy.js';

// `ink` is [colour on light boards, colour on dark boards]; `width` scales the line thickness.
// Names are in the language files under skin.<id>.
export const SKINS = [
  { id: 'classic', price: 0 },
  { id: 'ocean',   price: 150, ink: ['#0b5fa5', '#8fd0ff'] },
  { id: 'forest',  price: 150, ink: ['#1d7a45', '#9be8b4'] },
  { id: 'sunset',  price: 200, ink: ['#c2472d', '#ffb59e'] },
  { id: 'candy',   price: 200, ink: ['#b02a96', '#ffa8ec'] },
  { id: 'bold',    price: 250, width: 1.45 },
];

export const activeSkin = () => SKINS.find(s => s.id === player.skin) || SKINS[0];
export const ownsSkin = skin => skin.price === 0 || player.skins.includes(skin.id);

export function useSkin(skin) {
  if (!ownsSkin(skin)) return;
  player.skin = skin.id;
  persist();
}

/** Buys a skin and puts it on. Returns whether the player could afford it. */
export function buySkin(skin) {
  if (ownsSkin(skin) || !spendCoins(skin.price)) return false;
  player.skins.push(skin.id);
  useSkin(skin);
  return true;
}
