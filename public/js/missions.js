// Daily missions: three small tasks a day, the same for everyone, each paying coins once it
// is done and claimed. Progress is kept in `player.mis` and starts again every day:
//   { d: date, base: lifetime counters when the day began, p: { counter: progress },
//     c: [claimed mission ids], seen: [ids already announced as done] }

import { player } from './player.js';
import { mulberry32, shuffle } from './rng.js';
import { today, num } from './format.js';
import { t } from './i18n.js';

const PER_DAY = 3;

// `counter` names what is counted (see noteMissionProgress); `best` missions look at the
// highest value reached instead of adding up. Texts are in the language files: mission.<id>.
const POOL = [
  { id: 'wins', counter: 'wins', target: 3, coins: 40 },
  { id: 'flawless', counter: 'flawless', target: 2, coins: 50 },
  { id: 'three', counter: 'three', target: 1, coins: 40 },
  { id: 'arrows', counter: 'arrows', target: 150, coins: 40 },
  { id: 'combo', counter: 'combo', target: 6, coins: 40, best: true },
  { id: 'daily', counter: 'daily', target: 1, coins: 30 },
  { id: 'endless', counter: 'endless', target: 3, coins: 50 },
  { id: 'score', counter: 'score', target: 8000, coins: 50 },
  { id: 'power', counter: 'powers', target: 1, coins: 30 },
  { id: 'speed', counter: 'speed', target: 1, coins: 40 },
];
// Counters the game already keeps for life: today's share is the growth since the day began.
const LIFETIME = { arrows: () => player.st.arrows, powers: () => player.st.powers };

/** Today's record, started afresh when the date has changed. */
function record() {
  if (player.mis.d !== today()) {
    const base = Object.fromEntries(Object.entries(LIFETIME).map(([key, read]) => [key, read()]));
    player.mis = { d: today(), base, p: {}, c: [], seen: [] };
  }
  return player.mis;
}

function progressOf(mission) {
  const mis = record(), life = LIFETIME[mission.counter];
  return Math.min(mission.target, life ? life() - (mis.base[mission.counter] || 0) : mis.p[mission.counter] || 0);
}

/** Today's missions as { id, target, coins, progress, done, claimed }. */
export function todaysMissions() {
  const mis = record();
  let hash = 11;
  for (const ch of mis.d) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const rnd = mulberry32(hash);
  return shuffle([...POOL], n => Math.floor(rnd() * n)).slice(0, PER_DAY).map(m => {
    const progress = progressOf(m);
    return { ...m, progress, done: progress >= m.target, claimed: mis.c.includes(m.id) };
  });
}

export const missionText = mission => t('mission.' + mission.id, { n: num(mission.target) });

/** How many missions are done but not claimed yet. */
export const missionsToClaim = () => todaysMissions().filter(m => m.done && !m.claimed).length;
export const missionsDone = () => todaysMissions().filter(m => m.done).length;

/**
 * Counts what a finished game adds, e.g. { wins: 1, combo: 5, score: 1200 }. Returns the
 * missions that are done now and were not announced before. The caller saves.
 */
export function noteMissionProgress(delta) {
  const mis = record();
  for (const m of POOL) {
    const amount = delta[m.counter];
    if (!amount || LIFETIME[m.counter]) continue;
    mis.p[m.counter] = m.best ? Math.max(mis.p[m.counter] || 0, amount) : (mis.p[m.counter] || 0) + amount;
  }
  const fresh = todaysMissions().filter(m => m.done && !mis.seen.includes(m.id));
  mis.seen.push(...fresh.map(m => m.id));
  return fresh;
}

/** Claims a finished mission. Returns its coins (0 when there is nothing to claim). The caller pays and saves. */
export function claimMission(id) {
  const mission = todaysMissions().find(m => m.id === id);
  if (!mission || !mission.done || mission.claimed) return 0;
  player.mis.c.push(id);
  player.st.missions++;
  return mission.coins;
}
