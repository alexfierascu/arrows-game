// Records finished games in the save data and works out the coin rewards. No UI in here.

import { POWERS, STAGE_REWARDS, RUSH_TIERS, EVENT_STAGES, BOSS_REWARD } from './content.js';
import { player, eventState, clearedCount } from './player.js';
import { coinMultiplier } from './week.js';
import { today } from './format.js';
import { t } from './i18n.js';

const REPLAY_COINS = 5;

/** The player's earlier result on this board as { b: score, t: seconds }, if any. */
export function bestFor(cfg) {
  if (cfg.kind === 'daily') return player.daily.d === today() ? { b: player.daily.score, t: player.daily.time } : null;
  if (cfg.kind === 'event') return eventState(cfg.wk.key).stages[cfg.stage];
  return player.lv[cfg.g];
}

// Each recorder stores the result and returns { coins, isNew (a new best), extra: [reward lines] }.
// `run` is { final, stars, used, timeLeft, heartsLost, bestCombo, goldCleared }.

function recordLevel(cfg, { final, stars, used }) {
  const old = player.lv[cfg.g], oldStars = old ? old.s : 0, time = Math.round(used), extra = [];
  player.lv[cfg.g] = { s: Math.max(oldStars, stars), b: Math.max(old ? old.b : 0, final), t: old ? Math.min(old.t, time) : time };
  let coins = (old ? REPLAY_COINS : 20) + Math.max(0, stars - oldStars) * 15;
  if (cfg.boss && !player.bosses[cfg.w]) {
    player.bosses[cfg.w] = today();
    coins += BOSS_REWARD;
    extra.push(t('extra.defeated', { name: cfg.boss.name }));
  }
  return { coins, isNew: !old || final > old.b, extra };
}

function recordDaily(cfg, { final, used }) {
  const firstToday = player.daily.d !== today(), isNew = firstToday || final > player.daily.score;
  if (isNew) player.daily = { d: today(), score: final, time: Math.round(used) };
  player.st.dailies++;
  return { coins: firstToday ? 50 : REPLAY_COINS, isNew, extra: [] };
}

function recordStage(cfg, { final, stars, goldCleared }) {
  const es = eventState(cfg.wk.key), old = es.stages[cfg.stage], extra = [];
  es.stages[cfg.stage] = { s: Math.max(old ? old.s : 0, stars), b: Math.max(old ? old.b : 0, final) };
  let coins = REPLAY_COINS;
  if (!old) {
    const reward = STAGE_REWARDS[cfg.stage - 1];
    coins = reward.coins;
    if (reward.power) {
      player.pw[reward.power]++;
      extra.push(t('extra.power', { name: POWERS.find(p => p.id === reward.power).name }));
    }
    if (cfg.stage === EVENT_STAGES) { player.st.events++; extra.push(t('extra.event')); }
  }
  if (cfg.ev.id === 'gold' && goldCleared) { coins += goldCleared * 2; extra.push(t('extra.gold', { n: goldCleared })); }
  return { coins, isNew: !old || final > old.b, extra };
}

const RECORDERS = { level: recordLevel, daily: recordDaily, event: recordStage };

/** Records a cleared board. Returns { coins, isNew, extra }; the caller pays out and saves. */
export function recordWin(cfg, run) {
  const result = RECORDERS[cfg.kind](cfg, run), st = player.st;
  st.cleared = clearedCount();
  if (run.heartsLost === 0) st.flawless++;
  if (run.timeLeft >= cfg.limit * .5) st.speed++;
  st.bestCombo = Math.max(st.bestCombo, run.bestCombo);
  return { ...result, coins: result.coins * coinMultiplier() };
}

/** Records a finished Time Attack run. Returns { coins, isNew }; the caller pays out and saves. */
export function recordRush(cfg, { score, boards, bestCombo }) {
  const es = eventState(cfg.wk.key), isNew = score > (es.best || 0), st = player.st;
  if (isNew) { es.best = score; es.boards = boards; }
  st.rushBest = Math.max(st.rushBest, boards);
  st.bestCombo = Math.max(st.bestCombo, bestCombo);
  let tierCoins = 0;
  RUSH_TIERS.forEach((tier, i) => {
    if (score >= tier.score && !es.claimed.includes(i)) { es.claimed.push(i); tierCoins += tier.coins; }
  });
  return { coins: tierCoins * coinMultiplier() + boards * 5, isNew };
}
