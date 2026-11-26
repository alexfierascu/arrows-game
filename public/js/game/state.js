// The state of the board being played. One shared object: game modules read and update it.
//
// An arrow is { id, cells, pts: [[x, y]] tail to head, dir, state, ice, gold } plus animation
// fields: slide (cells travelled along `ext`, its path extended past the head), errUntil (flashes
// red until then) and alpha. `state` is idle | bounce | exit | poof | gone.

import { START_HEARTS, COMBO_WINDOW_MS } from '../content.js';

export const game = {
  // board
  cfg: null, W: 0, H: 0,
  arrows: [],
  own: null,          // Int32Array: arrow id on each cell, -1 when empty
  anims: [],          // running animations: { kind, a: arrow, t0, ... }
  cursor: null,       // id of the arrow highlighted for keyboard play
  total: 0, left: 0,  // arrows on the board at the start / still on it
  // boss fight
  boss: null, bossHP: 0, bossMax: 1,
  bossNext: 0,        // seconds until the next attack
  attackIndex: 0,
  fogs: [], blackoutUntil: 0,
  lamp: null,         // [x, y] centre of the light on dark boards, in cells
  // clock
  timeLeft: 0, timeMax: 1,
  frozen: 0,          // seconds of Freeze left
  // run
  over: true,
  pendingLose: null,  // 'time' | 'hearts': a loss waiting for animations to finish
  continued: false,   // the one paid continue has been used
  hearts: START_HEARTS, heartsLost: 0,
  score: 0, combo: 0, lastClear: 0, bestCombo: 0, goldCleared: 0,
  shield: false,
  smash: false,       // Smash is armed: the next tap destroys an arrow
  radarUntil: 0,
  tutorial: false,    // first game ever: free arrows blink until one is sent off
  rushBoards: 0, rushArrows: 0,   // boards and arrows cleared in a Time Attack or Endless run
  // help, per board (see assist.js)
  hintsLeft: 0, hint: null,       // hint: { id: arrow, until: time } while one is blinking
  undosLeft: 0, canUndo: false,   // canUndo: the last move was a bump that cost a heart
  challenge: null,    // { name, score }: the friend's score this game tries to beat
  relaxed: false,     // relaxed mode: bumps cost nothing and the clock stands still
  demo: false,        // a solution is being played back: the player only watches
  race: null,         // live race: { name, avatar, left } of the other player
};

/** Resets everything that belongs to one run (a level attempt or a whole Time Attack). */
export function resetRun() {
  Object.assign(game, {
    over: false, pendingLose: null, continued: false,
    hearts: START_HEARTS, heartsLost: 0,
    score: 0, combo: 0, lastClear: 0, bestCombo: 0, goldCleared: 0,
    frozen: 0, shield: false, smash: false, radarUntil: 0, tutorial: false,
    rushBoards: 0, rushArrows: 0, challenge: null, relaxed: false, demo: false, race: null,
  });
}

/** Whether the last arrow left recently enough for the combo to still count. */
export const comboActive = now => now - game.lastClear < COMBO_WINDOW_MS;
