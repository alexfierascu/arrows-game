// This week's play, for the weekly recap. Counted per calendar week (Monday to Sunday); when a
// new week starts, the finished one is kept once as `player.prevWk` to be shown as a recap.

import { player, persist } from './player.js';
import { weekInfo } from './week.js';

const blank = id => ({ id, wins: 0, stars: 0, coins: 0, best: 0, dailies: 0 });

/** Starts a fresh week when the calendar week has changed. */
export function rollWeek() {
  const id = weekInfo().id;
  if (player.wk.id === id) return;
  if (player.wk.wins > 0) player.prevWk = player.wk;
  player.wk = blank(id);
  persist();
}

/** Adds one cleared board to this week. The caller saves. */
export function trackWeek({ stars = 0, coins = 0, score = 0, daily = false }) {
  rollWeek();
  const wk = player.wk;
  wk.wins++;
  wk.stars += stars;
  wk.coins += coins;
  wk.best = Math.max(wk.best, score);
  if (daily) wk.dailies++;
}

/** Last week's numbers if they have not been shown yet; they are handed out only once. */
export function takeLastWeek() {
  const week = player.prevWk;
  if (!week) return null;
  player.prevWk = null;
  persist();
  return week;
}
