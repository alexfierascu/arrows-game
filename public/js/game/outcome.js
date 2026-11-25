// How a game ends: detecting the win or loss, paying out, and the result dialogs.

import { CONTINUE_COST, RUSH_BOARD_BONUS } from '../content.js';
import { esc } from '../dom.js';
import { player, persist } from '../player.js';
import { addCoins, spendCoins } from '../economy.js';
import { awardNewBadges } from '../badges.js';
import { recordWin, recordRush } from '../progress.js';
import { coinMultiplier } from '../week.js';
import { rushCfg, nextCfg } from '../levels.js';
import { clock, num } from '../format.js';
import { ico, heart, portrait, stars, COIN, CHECK, CLOCK } from '../icons.js';
import { sfx } from '../feedback.js';
import { show } from '../router.js';
import { modal } from '../ui/modal.js';
import { previewLevel } from '../ui/preview.js';
import { sync } from '../ui/leaderboard.js';
import { game } from './state.js';
import { loadBoard, restartGame, startRush, exitGame } from './session.js';
import { renderHud, toast } from './hud.js';

const CONTINUE_SECONDS = 30;
const WIN_TITLES = ['', 'Cleared!', 'Great run!', 'Perfect!']; // by stars earned
// Short pauses so the last arrow is seen leaving before the dialog covers it.
const LOSE_DELAY_MS = 300, NEXT_BOARD_DELAY_MS = 350, WIN_DELAY_MS = 250;

/** Ends the game as lost once running animations have finished. */
export function loseNow(why) {
  game.over = true;
  game.pendingLose = why;
  checkEnd();
}

/** Called whenever the board may have reached its end; does nothing while arrows are moving. */
export function checkEnd() {
  if (game.anims.length) return;
  const rush = game.cfg.kind === 'rush';
  if (game.pendingLose) {
    const why = game.pendingLose;
    game.pendingLose = null;
    setTimeout(() => (rush ? endRush() : showLose(why)), LOSE_DELAY_MS);
  } else if (game.left === 0 && !game.over) {
    if (rush) nextRushBoard();
    else { game.over = true; setTimeout(win, WIN_DELAY_MS); }
  }
}

function nextRushBoard() {
  game.rushBoards++;
  game.timeLeft += RUSH_BOARD_BONUS;
  sfx('win');
  const next = rushCfg(game.cfg.wk, game.rushBoards + 1);
  setTimeout(() => {
    if (game.over) return;
    loadBoard(next);
    toast('+' + RUSH_BOARD_BONUS + ' seconds · board ' + (game.rushBoards + 1));
  }, NEXT_BOARD_DELAY_MS);
}

/** Pays the coins, awards badges, saves and posts the score. Returns the new badges. */
function payOut(coins) {
  addCoins(coins);
  const badges = awardNewBadges();
  persist();
  sync();
  sfx('win');
  return badges;
}

const tableRow = ([label, value], cls = '') => `<tr${cls && ` class="${cls}"`}><td>${label}</td><td>${value}</td></tr>`;
const newBest = isNew => (isNew ? '<span class="new">New best</span>' : '');
const rewardLine = text => `<span>${ico(CHECK)}${esc(text)}</span>`;

function win() {
  const { cfg, boss, score, hearts, timeLeft, heartsLost, bestCombo, goldCleared } = game;
  const used = cfg.limit - timeLeft, flawless = heartsLost === 0;
  const earned = 1 + (flawless ? 1 : 0) + (used <= cfg.par ? 1 : 0);
  const timeBonus = Math.floor(timeLeft) * 5, heartBonus = hearts * 50, flawlessBonus = flawless ? 200 : 0, bossBonus = boss ? 500 : 0;
  const final = score + timeBonus + heartBonus + flawlessBonus + bossBonus;

  const { coins, isNew, extra } = recordWin(cfg, { final, stars: earned, used, timeLeft, heartsLost, bestCombo, goldCleared });
  const badges = payOut(coins), next = nextCfg(cfg);

  const rows = [
    [`Arrows and combos (best ×${bestCombo})`, num(score)],
    [`Time left ${clock(timeLeft)}`, '+' + timeBonus],
    [`Hearts left ${hearts}`, '+' + heartBonus],
    flawlessBonus && ['Flawless', '+' + flawlessBonus],
    bossBonus && ['Boss bonus', '+' + bossBonus],
  ].filter(Boolean);
  modal(`${boss ? portrait(boss) : ''}<span class="kick" style="--c:${cfg.col}">${cfg.resultLabel}</span>
  <div class="bigstars">${stars(earned)}</div><h2>${boss ? 'Boss defeated!' : WIN_TITLES[earned]}</h2>
  <table class="brk">${rows.map(r => tableRow(r)).join('')}${tableRow([`Total ${newBest(isNew)}`, num(final)], 'tot')}</table>
  <div class="gain"><span>${COIN}+${coins}${coinMultiplier() > 1 ? ' (weekend ×2)' : ''}</span>${[...extra, ...badges.map(b => b.name)].map(rewardLine).join('')}</div>
  <div class="acts"><button class="btn" data-act="back">Back</button><button class="btn" data-act="again">Replay</button>${next ? '<button class="btn main" data-act="next">Next</button>' : ''}</div>`,
  { back: exitGame, again: restartGame, next: () => previewLevel(next) });
}

function endRush() {
  const { cfg, score, rushBoards, rushArrows, bestCombo } = game;
  game.over = true;
  const { coins, isNew } = recordRush(cfg, { score, boards: rushBoards, bestCombo });
  const badges = payOut(coins);
  const rows = [['Boards cleared', rushBoards], ['Arrows out', rushArrows], ['Best combo', '×' + bestCombo]];
  modal(`<span class="kick" style="--c:${cfg.col}">Time Attack</span><h2>Time’s up!</h2>
  <table class="brk">${rows.map(r => tableRow(r)).join('')}${tableRow([`Score ${newBest(isNew)}`, num(score)], 'tot')}</table>
  <div class="gain"><span>${COIN}+${coins}</span>${badges.map(b => rewardLine(b.name)).join('')}</div>
  <div class="acts"><button class="btn" data-act="back">Back</button><button class="btn main" data-act="again">Run again</button></div>`,
  { back: () => show('event'), again: () => startRush() });
}

/** Resumes a lost game: more time or one heart, once per game. */
function continueGame(why) {
  if (!spendCoins(CONTINUE_COST)) return;
  game.continued = true;
  if (why === 'time') game.timeLeft += CONTINUE_SECONDS;
  else game.hearts = 1;
  game.over = false;
  renderHud();
}

function showLose(why) {
  const { boss, total, left, continued } = game, outOfTime = why === 'time';
  const picture = boss ? portrait(boss) : outOfTime ? ico(CLOCK, 'i big') : heart('big');
  const offer = continued ? '' :
    `<button class="btn gold" style="width:100%" data-act="continue" ${player.coins >= CONTINUE_COST ? '' : 'disabled'}>Keep going: ${outOfTime ? '+' + CONTINUE_SECONDS + ' seconds' : '+1 heart'} for <span class="price">${COIN}${CONTINUE_COST}</span></button>`;
  modal(`${picture}
  <h2>${outOfTime ? 'Out of time' : 'Out of hearts'}</h2><p>${boss ? boss.name + ' had ' + game.bossHP + ' health left. ' : ''}${total - left} of ${total} arrows cleared. Every board can be solved, so look for arrows with a clear runway.</p>
  ${offer}
  <div class="acts"><button class="btn" data-act="quit">Quit</button><button class="btn main" data-act="retry">Retry</button></div>`,
  { continue: () => continueGame(why), quit: exitGame, retry: restartGame });
}
