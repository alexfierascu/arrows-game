// How a game ends: detecting the win or loss, paying out, and the result dialogs.

import { CONTINUE_COST, RUSH_BOARD_BONUS, START_HEARTS } from '../content.js';
import { esc } from '../dom.js';
import { player, persist, totalStars } from '../player.js';
import { addCoins, spendCoins } from '../economy.js';
import { awardNewBadges, badgeName } from '../badges.js';
import { recordWin, recordRush, recordEndless } from '../progress.js';
import { coinMultiplier } from '../week.js';
import { rushCfg, endlessCfg, nextCfg } from '../levels.js';
import { addSeasonPoints } from '../season.js';
import { clock, num } from '../format.js';
import { ico, heart, portrait, stars, COIN, CHECK, CLOCK } from '../icons.js';
import { sfx } from '../feedback.js';
import { t } from '../i18n.js';
import { modal } from '../ui/modal.js';
import { previewLevel, goalsHtml } from '../ui/preview.js';
import { sync } from '../ui/leaderboard.js';
import { nickFieldHtml, armNickField } from '../ui/nickname.js';
import { shareButtonHtml, armShareButton } from '../ui/share.js';
import { trackWeek } from '../weekly.js';
import { track } from '../analytics.js';
import { game } from './state.js';
import { loadBoard, restartGame, exitGame } from './session.js';
import { renderHud, toast } from './hud.js';
import { undoAvailable, undoBump } from './assist.js';

const CONTINUE_SECONDS = 30;
const TIME_POINTS = 5; // points per second left on the clock
const WIN_TITLES = ['', 'win.1', 'win.2', 'win.3']; // text keys, by stars earned
const WIN_EVENTS = { level: 'win', daily: 'daily_win', event: 'event_win' }; // usage counts

// Modes that chain boards into one run. `cleared` rewards a finished board and returns the
// message to show, `next` gives board number n, `loaded` adjusts the game once it is on screen.
const RUNS = {
  rush: {
    next: (cfg, n) => rushCfg(cfg.wk, n),
    cleared() {
      game.timeLeft += RUSH_BOARD_BONUS;
      return t('toast.next.board', { n: RUSH_BOARD_BONUS, board: game.rushBoards + 1 });
    },
    record: recordRush, endEvent: 'rush_end', overTitle: 'rush.over',
  },
  // Endless: every board has its own clock, the seconds left become points, and a heart comes back.
  endless: {
    next: (cfg, n) => endlessCfg(n),
    cleared() {
      const points = Math.floor(game.timeLeft) * TIME_POINTS;
      game.score += points;
      game.hearts = Math.min(START_HEARTS, game.hearts + 1);
      return t('toast.endless.board', { n: points, board: game.rushBoards + 1 });
    },
    loaded(cfg) { game.timeLeft = game.timeMax = cfg.limit; },
    record: (cfg, run) => recordEndless(run), endEvent: 'endless_end', overTitle: 'endless.over',
  },
};
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
  const run = RUNS[game.cfg.kind];
  if (game.pendingLose) {
    const why = game.pendingLose;
    game.pendingLose = null;
    setTimeout(() => {
      if (!run) showLose(why);
      else if (why === 'hearts' && undoAvailable()) offerUndo();
      else endRun();
    }, LOSE_DELAY_MS);
  } else if (game.left === 0 && !game.over) {
    if (run) nextRunBoard(run);
    else { game.over = true; setTimeout(win, WIN_DELAY_MS); }
  }
}

function nextRunBoard(run) {
  game.rushBoards++;
  const message = run.cleared();
  sfx('win');
  const next = run.next(game.cfg, game.rushBoards + 1);
  setTimeout(() => {
    if (game.over) return;
    loadBoard(next);
    run.loaded?.(next);
    toast(message);
    renderHud();
  }, NEXT_BOARD_DELAY_MS);
}

/** How the game went against the friend's score, for games started from a challenge link. */
function challengeHtml(score) {
  const challenge = game.challenge;
  if (!challenge) return '';
  const won = score > challenge.score, key = won ? 'challenge.won' : score === challenge.score ? 'challenge.tie' : 'challenge.lost';
  if (won) track('challenge_win');
  const text = t(key, { name: challenge.name || t('challenge.friend'), mine: num(score), theirs: num(challenge.score) });
  return `<p class="duel ${won ? 'won' : ''}">${esc(text)}</p>`;
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
const newBest = isNew => (isNew ? `<span class="new">${t('new.best')}</span>` : '');
const rewardLine = text => `<span>${ico(CHECK)}${esc(text)}</span>`;

function win() {
  const { cfg, boss, score, hearts, timeLeft, heartsLost, bestCombo, goldCleared } = game;
  const used = cfg.limit - timeLeft, flawless = heartsLost === 0;
  const earned = 1 + (flawless ? 1 : 0) + (used <= cfg.par ? 1 : 0);
  const timeBonus = Math.floor(timeLeft) * TIME_POINTS, heartBonus = hearts * 50, flawlessBonus = flawless ? 200 : 0, bossBonus = boss ? 500 : 0;
  const final = score + timeBonus + heartBonus + flawlessBonus + bossBonus;

  // A practice board (opened from a challenge before the player unlocked it) leaves no trace.
  let coins = 0, isNew = false, extra = [], badges = [], next = null;
  if (cfg.practice) sfx('win');
  else {
    const starsBefore = totalStars(), firstWin = player.st.cleared === 0 && cfg.kind === 'level';
    ({ coins, isNew, extra } = recordWin(cfg, { final, stars: earned, used, timeLeft, heartsLost, bestCombo, goldCleared }));
    trackWeek({ stars: totalStars() - starsBefore, coins, score: final, daily: cfg.kind === 'daily' });
    addSeasonPoints(final);
    badges = payOut(coins);
    next = nextCfg(cfg);
    track(firstWin ? 'first_win' : WIN_EVENTS[cfg.kind]);
  }

  const rows = [
    [t('row.arrows', { n: bestCombo }), num(score)],
    [t('row.time', { time: clock(timeLeft) }), '+' + timeBonus],
    [t('row.hearts', { n: hearts }), '+' + heartBonus],
    flawlessBonus && [t('row.flawless'), '+' + flawlessBonus],
    bossBonus && [t('row.boss'), '+' + bossBonus],
  ].filter(Boolean);
  modal(`${boss ? portrait(boss) : ''}<span class="kick" style="--c:${cfg.col}">${cfg.resultLabel}</span>
  <div class="bigstars">${stars(earned)}</div><h2>${t(boss ? 'win.boss' : WIN_TITLES[earned])}</h2>
  ${challengeHtml(final)}${goalsHtml(cfg, [true, flawless, used <= cfg.par])}
  <table class="brk">${rows.map(r => tableRow(r)).join('')}${tableRow([`${t('total')} ${newBest(isNew)}`, num(final)], 'tot')}</table>
  ${cfg.practice ? `<p class="note">${t('challenge.practice')}</p>` : `<div class="gain"><span>${COIN}+${coins}${coinMultiplier() > 1 ? ' ' + t('weekend.x2') : ''}</span>${[...extra, ...badges.map(badgeName)].map(rewardLine).join('')}</div>`}
  ${shareButtonHtml()}${nickFieldHtml()}<div class="acts"><button class="btn" data-act="back">${t('back')}</button><button class="btn" data-act="again">${t('replay')}</button>${next ? `<button class="btn main" data-act="next">${t('next')}</button>` : ''}</div>`,
  { back: exitGame, again: restartGame, next: () => previewLevel(next) });
  armNickField();
  armShareButton(cfg, final, earned);
}

/** The last heart is gone, but the mistake can still be taken back: ask before ending the run. */
function offerUndo() {
  modal(`${heart('big')}<h2>${t('lose.hearts')}</h2><p>${t('undo.ask')}</p>
  <div class="acts"><button class="btn" data-act="end">${t('run.end')}</button><button class="btn main" data-act="undo">${t('undo')}</button></div>`,
  { end: endRun, undo: undoBump });
}

/** Ends a Time Attack or Endless run: these have no win, only a final score. */
function endRun() {
  const { cfg, score, rushBoards, rushArrows, bestCombo } = game, run = RUNS[cfg.kind];
  game.over = true;
  const { coins, isNew } = run.record(cfg, { score, boards: rushBoards, bestCombo });
  trackWeek({ coins, score });
  addSeasonPoints(score);
  track(run.endEvent);
  const badges = payOut(coins);
  const rows = [[t('rush.row.boards'), rushBoards], [t('rush.row.arrows'), rushArrows], [t('rush.row.combo'), '×' + bestCombo]];
  modal(`<span class="kick" style="--c:${cfg.col}">${cfg.title}</span><h2>${t(run.overTitle)}</h2>
  ${challengeHtml(score)}<table class="brk">${rows.map(r => tableRow(r)).join('')}${tableRow([`${t('score')} ${newBest(isNew)}`, num(score)], 'tot')}</table>
  <div class="gain"><span>${COIN}+${coins}</span>${badges.map(b => rewardLine(badgeName(b))).join('')}</div>
  ${shareButtonHtml()}${nickFieldHtml()}<div class="acts"><button class="btn" data-act="back">${t('back')}</button><button class="btn main" data-act="again">${t('run.again')}</button></div>`,
  { back: exitGame, again: restartGame });
  armNickField();
  armShareButton(cfg, score);
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
  track('lose');
  sfx('lose');
  const { boss, total, left, continued } = game, outOfTime = why === 'time';
  const picture = boss ? portrait(boss) : outOfTime ? ico(CLOCK, 'i big') : heart('big');
  const price = `<span class="price">${COIN}${CONTINUE_COST}</span>`;
  const undo = why === 'hearts' && undoAvailable() ? `<button class="btn main" style="width:100%;margin-bottom:8px" data-act="undo">${t('undo.offer')}</button>` : '';
  const offer = continued ? '' :
    `<button class="btn gold" style="width:100%" data-act="continue" ${player.coins >= CONTINUE_COST ? '' : 'disabled'}>${outOfTime ? t('continue.time', { n: CONTINUE_SECONDS, price }) : t('continue.heart', { price })}</button>`;
  modal(`${picture}
  <h2>${t(outOfTime ? 'lose.time' : 'lose.hearts')}</h2><p>${boss ? t('lose.boss', { name: boss.name, n: game.bossHP }) + ' ' : ''}${t('lose.text', { done: total - left, total })}</p>
  ${undo}${offer}
  <div class="acts"><button class="btn" data-act="quit">${t('quit')}</button><button class="btn ${undo ? '' : 'main'}" data-act="retry">${t('retry')}</button></div>`,
  { continue: () => continueGame(why), undo: undoBump, quit: exitGame, retry: restartGame });
}
