// Challenges: a shared link that names one board and the score to beat on it. Boards are built
// from seeds, so the code of a board is enough for both players to get exactly the same one.
//   l12            world level 12
//   d2026-11-25    the daily board of that date
//   e2970-3        stage 3 of the ladder event of week 2970
//   r2970          the Time Attack of week 2970
//   x              Endless

import { TOTAL_LEVELS, EVENT_STAGES } from './content.js';
import { levelCfg, dailyCfg, stageCfg, rushCfg, endlessCfg } from './levels.js';
import { player, isLevelUnlocked, eventState } from './player.js';
import { weekInfo } from './week.js';
import { today } from './format.js';

const MAX_SCORE = 5_000_000;

const CODES = {
  level: cfg => 'l' + cfg.g,
  daily: cfg => 'd' + cfg.date,
  event: cfg => 'e' + cfg.wk.id + '-' + cfg.stage,
  rush: cfg => 'r' + cfg.wk.id,
  endless: () => 'x',
};

/** The link that challenges whoever opens it to beat `score` on the board of `cfg`. */
export function challengeLink(cfg, score) {
  const query = new URLSearchParams({ c: CODES[cfg.kind](cfg), s: score });
  if (player.nick) query.set('friend', player.nick);
  return location.origin + '/?' + query;
}

// Each reader returns a board config, or null when the code is wrong or its week is over.
// `practice` marks boards this player has not unlocked: playing them must not count as progress.
const READERS = {
  l(rest) {
    const g = Number(rest);
    return Number.isInteger(g) && g >= 1 && g <= TOTAL_LEVELS ? { ...levelCfg(g), practice: !isLevelUnlocked(g) } : null;
  },
  d: date => (/^\d{4}-\d{2}-\d{2}$/.test(date) ? { ...dailyCfg(date), practice: date !== today() } : null),
  e(rest) {
    const [week, stage] = rest.split('-').map(Number), wk = weekInfo();
    if (week !== wk.id || wk.ev.kind !== 'ladder' || !(stage >= 1 && stage <= EVENT_STAGES)) return null;
    return { ...stageCfg(wk, stage), practice: stage > 1 && !eventState(wk.key).stages[stage - 1] };
  },
  r(rest) {
    const wk = weekInfo();
    return Number(rest) === wk.id && wk.ev.kind === 'rush' ? rushCfg(wk, 1) : null;
  },
  x: rest => (rest === '' ? endlessCfg(1) : null),
};

/**
 * The challenge in the page's address, if any: { cfg, name, score }, with `cfg` null when the
 * board can no longer be played. Also removes it from the address, so a reload does not repeat it.
 */
export function takeChallenge() {
  const query = new URLSearchParams(location.search), code = query.get('c'), score = Number(query.get('s'));
  if (!code) return null;
  history.replaceState(null, '', location.pathname);
  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) return null;
  const cfg = READERS[code[0]]?.(code.slice(1)) || null;
  return { cfg, name: (query.get('friend') || '').slice(0, 16), score };
}
