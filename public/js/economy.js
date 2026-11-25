// Coins: earning, spending and the coin counters shown at the top of most screens.

import { $$ } from './dom.js';
import { player, persist } from './player.js';
import { sfx } from './feedback.js';

export function renderCoins() {
  $$('.coinN').forEach(el => { el.textContent = player.coins; });
}

export function addCoins(n) {
  player.coins += n;
  persist();
  renderCoins();
}

/** Takes `n` coins if the player has them. Returns whether the payment went through. */
export function spendCoins(n) {
  if (player.coins < n) return false;
  addCoins(-n);
  sfx('coin');
  return true;
}

/** Buys one use of a superpower. Returns whether the player could afford it. */
export function buyPower(power) {
  if (!spendCoins(power.price)) return false;
  player.pw[power.id]++;
  persist();
  return true;
}
