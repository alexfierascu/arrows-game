// Level configs: what to play. Each mode (world level, daily, event stage, Time Attack board)
// describes its board with the same fields, so the game itself never needs to know the details.
//
// Common fields: kind, title + subtitle (HUD), col (accent colour), W, H, seed, maxL (longest
// arrow), bias (how often arrows point at the near edge), ice / gold (share of special arrows),
// sec (clock seconds per arrow), dark, and optionally boss and blackout.

import { WORLDS, BOSSES, EVENTS, LEVELS_PER_WORLD, TOTAL_LEVELS, EVENT_STAGES } from './content.js';
import { generate } from './generator.js';
import { mulberry32 } from './rng.js';
import { today } from './format.js';

const boardHeight = width => Math.round(width * 1.42);
const count = flags => flags.filter(Boolean).length;

export const worldOf = g => Math.ceil(g / LEVELS_PER_WORLD);

/** World level number `g` (1-based across all worlds). The last level of each world is its boss. */
export function levelCfg(g) {
  const w = worldOf(g), world = WORLDS[w - 1], l = g - (w - 1) * LEVELS_PER_WORLD;
  const W = Math.min(30, 6 + Math.floor(g * .42)), boss = l === LEVELS_PER_WORLD ? BOSSES[w - 1] : null;
  const title = w + '-' + l;
  return {
    kind: 'level', g, w, world, boss, title, subtitle: world.name,
    resultLabel: boss ? 'World ' + w + ' boss' : 'Level ' + title,
    col: world.col, W, H: boardHeight(W), seed: g * 101 + 7,
    maxL: Math.min(14, 3 + Math.floor(g / 4)), bias: g < 6 ? .97 : g < 20 ? .9 : .82,
    ice: world.ice || 0, gold: boss ? .1 : 0, sec: world.sec + (boss ? .45 : 0), dark: !!world.dark,
  };
}

/** Today's daily challenge: the same board for everyone, seeded from the date. */
export function dailyCfg() {
  const date = today();
  let hash = 7;
  for (const ch of date) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return {
    kind: 'daily', date, title: 'Daily', subtitle: 'Daily challenge', resultLabel: 'Daily challenge',
    col: '#d99a00', W: 20, H: boardHeight(20), seed: Math.abs(hash) % 100000 + 5000,
    maxL: 12, bias: .85, ice: .1, gold: .05, sec: 1.55, dark: false,
  };
}

/** Stage `n` (1-based) of a ladder event in week `wk`. */
export function stageCfg(wk, n) {
  const ev = wk.ev, W = 10 + n * 3, mod = ev.mod || {};
  return {
    kind: 'event', ev, wk, stage: n, title: ev.name, subtitle: 'Stage ' + n + ' of ' + EVENT_STAGES,
    resultLabel: ev.name + ' · stage ' + n,
    col: ev.col, W, H: boardHeight(W), seed: wk.id * 1000 + EVENTS.indexOf(ev) * 50 + n,
    maxL: Math.min(13, 5 + n * 2), bias: .86,
    ice: mod.ice || 0, gold: mod.gold || 0, sec: mod.sec || 1.8, dark: !!mod.dark, blackout: !!mod.blackout,
  };
}

/** Board `n` (1-based) of a Time Attack run in week `wk`. */
export function rushCfg(wk, n) {
  const W = Math.min(18, 7 + Math.floor(n * 1.5));
  return {
    kind: 'rush', ev: wk.ev, wk, stage: n, title: 'Time Attack', subtitle: 'Weekly event',
    col: wk.ev.col, W, H: boardHeight(W), seed: wk.id * 777 + n * 13,
    maxL: Math.min(10, 4 + n), bias: .9, ice: n > 4 ? .08 : 0, gold: .06, sec: 1, dark: false,
  };
}

/** The board that follows `cfg` in its world or event, or null at the end (and for one-offs). */
export function nextCfg(cfg) {
  if (cfg.kind === 'level' && cfg.g < TOTAL_LEVELS) return levelCfg(cfg.g + 1);
  if (cfg.kind === 'event' && cfg.stage < EVENT_STAGES) return stageCfg(cfg.wk, cfg.stage + 1);
  return null;
}

/**
 * Generates the board for a config, once: the result is cached on the config. Also sets the
 * clock (`cfg.limit`) and the three-star time (`cfg.par`), which depend on the arrow count.
 */
export function build(cfg) {
  if (cfg.built) return cfg.built;
  const arrows = generate(cfg.W, cfg.H, cfg.seed, 2, cfg.maxL, .65, cfg.bias);
  const rnd = mulberry32(cfg.seed + 99), ice = [], gold = [];
  for (let i = 0; i < arrows.length; i++) {
    const isIce = rnd() < cfg.ice;
    ice.push(isIce);
    gold.push(!isIce && rnd() < cfg.gold);
  }
  const iceCount = count(ice);
  cfg.limit = Math.ceil(arrows.length * cfg.sec + 15 + iceCount * .7);
  cfg.par = Math.floor(cfg.limit * .55);
  cfg.built = { arrows, ice, gold, iceCount, goldCount: count(gold) };
  return cfg.built;
}
