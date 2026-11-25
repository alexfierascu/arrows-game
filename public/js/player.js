// The player's save data (kept in this browser's localStorage) and questions asked about it.
//
// Shape of `player`:
//   nick, coins, gift (date of the last daily gift), snd, hap, rm (sound / vibration / reduced motion)
//   pw      { powerId: count owned }
//   lv      { levelNumber: { s: stars, b: best score, t: best time } }
//   daily   { d: date, score, time }
//   ev      { weekKey: { stages: { n: { s, b } }, best, boards, claimed: [rush tier index] } }
//   bosses  { worldNumber: date beaten }
//   st      lifetime counters, ach { badgeId: date earned }
// The keys are part of the stored format: renaming one loses existing players' progress.

import { TOTAL_LEVELS, LEVELS_PER_WORLD } from './content.js';

const STORAGE_KEY = 'arrows-escape-v2';
const DEFAULTS = {
  nick: '', coins: 120,
  pw: { smash: 1, radar: 3, freeze: 1, shield: 2, magnet: 1, heart: 1 },
  lv: {}, daily: { d: '', score: 0, time: 0 }, gift: '', ev: {}, bosses: {},
  st: { cleared: 0, flawless: 0, bestCombo: 0, speed: 0, dailies: 0, powers: 0, arrows: 0, bumps: 0, plays: 0, events: 0, rushBest: 0 },
  ach: {}, snd: true, hap: true, rm: false,
};
const fresh = () => JSON.parse(JSON.stringify(DEFAULTS));

export const player = fresh();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved) return;
    Object.assign(player, saved);
    // Saves from older versions may miss newer powers and counters.
    player.pw = { ...DEFAULTS.pw, ...saved.pw };
    player.st = { ...DEFAULTS.st, ...saved.st };
    player.daily = { ...DEFAULTS.daily, ...saved.daily };
    player.ev = saved.ev || {};
    player.bosses = saved.bosses || {};
  } catch { /* storage blocked or corrupt: start fresh */ }
}
load();

export function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(player)); } catch { /* storage blocked */ }
}

/** Wipes all progress but keeps the player name. */
export function resetProgress() {
  const { nick } = player;
  for (const key of Object.keys(player)) delete player[key];
  Object.assign(player, fresh(), { nick });
  persist();
}

const sum = (items, pick) => items.reduce((total, x) => total + (pick(x) || 0), 0);

export const totalStars = () => sum(Object.values(player.lv), x => x.s);
export const totalScore = () => sum(Object.values(player.lv), x => x.b);
export const clearedCount = () => Object.keys(player.lv).length;
export const bossesBeaten = () => Object.keys(player.bosses).length;
export const powersOwned = () => sum(Object.values(player.pw), x => x);
export const isLevelUnlocked = g => g === 1 || !!player.lv[g - 1];
export const isWorldOpen = w => w === 1 || !!player.lv[(w - 1) * LEVELS_PER_WORLD];

/** First level not cleared yet, or 0 when the whole game is done. */
export function nextLevel() {
  for (let g = 1; g <= TOTAL_LEVELS; g++) if (!player.lv[g]) return g;
  return 0;
}

/** Progress in one weekly event, created on first use. */
export const eventState = key => player.ev[key] || (player.ev[key] = { stages: {}, best: 0, claimed: [] });

/** Leaderboard score for an event: the best Time Attack run or the sum of the stage bests. */
export function eventScore(key) {
  const e = player.ev[key];
  return e ? Math.max(e.best || 0, sum(Object.values(e.stages), x => x.b)) : 0;
}
