// Starting, restarting and leaving a game, and loading a board into the shared game state.

import { RUSH_SECONDS } from '../content.js';
import { headDir } from '../grid.js';
import { player, persist } from '../player.js';
import { build, rushCfg } from '../levels.js';
import { weekInfo } from '../week.js';
import { show } from '../router.js';
import { t } from '../i18n.js';
import { game, resetRun } from './state.js';
import { arrowWeight } from './arrows.js';
import { resizeBoard, focusBoard } from './render.js';
import { renderBoardHeader, renderHud, renderPowers, toast } from './hud.js';

const FIRST_ICE_LEVEL = 37;       // first level of the Frozen world
const BOSS_FIRST_ATTACK_DELAY = 2; // extra seconds before a boss's first attack
const TUTORIAL_MS = 120000;        // how long the first-game hint keeps blinking if nothing is tapped

/** A hint shown as the board opens, as [message, milliseconds], or null. */
function openingTip(cfg) {
  if (game.tutorial) return [t('tip.tutorial'), 6000];
  if (cfg.kind === 'level' && cfg.g === 1) return [t('tip.first'), 4200];
  if (cfg.boss) return [t('tip.boss', { name: cfg.boss.name }), 3800];
  if (cfg.blackout) return [t('tip.lamp'), 3500];
  const introducesIce = (cfg.kind === 'level' && cfg.g === FIRST_ICE_LEVEL) || cfg.kind === 'event';
  if (introducesIce && build(cfg).iceCount) return [t('tip.ice'), 3500];
  return null;
}

/** Puts a board on screen. Keeps the run's score, hearts and clock (Time Attack chains boards). */
export function loadBoard(cfg) {
  const board = build(cfg), { W, H } = cfg, own = new Int32Array(W * H).fill(-1);
  const arrows = board.arrows.map((cells, id) => {
    for (const c of cells) own[c] = id;
    return {
      id, cells, pts: cells.map(c => [c % W, (c / W) | 0]), dir: headDir(W, cells),
      state: 'idle', ice: board.ice[id], gold: board.gold[id], slide: 0, errUntil: 0, alpha: 1,
    };
  });
  const boss = cfg.boss || null;
  Object.assign(game, {
    cfg, W, H, own, arrows, anims: [], cursor: null,
    total: arrows.length, left: arrows.length,
    fogs: [], blackoutUntil: 0, lamp: [W / 2 - .5, H / 2 - .5],
    boss, bossNext: boss ? boss.every + BOSS_FIRST_ATTACK_DELAY : 0, attackIndex: 0,
  });
  game.bossMax = game.bossHP = arrows.reduce((total, a) => total + arrowWeight(a), 0);
  renderBoardHeader();
  resizeBoard();
  renderHud();
}

export function startGame(cfg) {
  resetRun();
  player.st.plays++;
  persist();
  show('game'); // before loading: the canvas can only be measured while visible
  loadBoard(cfg);
  focusBoard();
  // The very first game shows which arrows can go, instead of explaining it in words.
  if (player.st.arrows === 0 && cfg.kind === 'level') {
    game.tutorial = true;
    game.radarUntil = performance.now() + TUTORIAL_MS;
  }
  game.timeLeft = game.timeMax = cfg.kind === 'rush' ? RUSH_SECONDS : cfg.limit;
  const tip = openingTip(cfg);
  if (tip) toast(...tip);
  renderHud();
  renderPowers();
}

/** Starts a Time Attack run from its first board. */
export const startRush = (wk = weekInfo()) => startGame(rushCfg(wk, 1));

/** Plays the current mode again from the start. */
export function restartGame() {
  const { cfg } = game;
  if (cfg.kind === 'rush') startRush(cfg.wk);
  else startGame(cfg);
}

// Where "back" leads from each kind of game.
const EXITS = {
  level: cfg => show('map', { world: cfg.w }),
  daily: () => show('home'),
  event: () => show('event'),
  rush: () => show('event'),
};

export function exitGame() {
  EXITS[game.cfg.kind](game.cfg);
}
