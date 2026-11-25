// Arrow animations: sliding off the board, bouncing off a blocker, and the Smash "poof".
// Each stepper moves one animation to time `t` (seconds since it started) and returns true
// when it has finished.

import { game } from './state.js';
import { view, toScreen } from './view.js';
import { pointAt } from './arrows.js';
import { bump } from './rules.js';
import { checkEnd } from './outcome.js';
import { reducedMotion } from '../motion.js';

const POOF_SECONDS = .35;
const BOUNCE_OUT = 24, BOUNCE_BACK = 30; // cells per second

const STEPPERS = {
  poof({ a }, t) {
    a.alpha = 1 - t / POOF_SECONDS;
    if (a.alpha > 0) return false;
    a.state = 'gone';
    return true;
  },

  // Accelerates along its runway until the tail is off the board and off the screen.
  exit({ a }, t) {
    a.slide = reducedMotion() ? t * 90 : 18 * t + 46 * t * t;
    const tail = pointAt(a.ext, a.slide), [px, py] = toScreen(tail[0], tail[1]), margin = view.scale;
    const offBoard = tail[0] < -1 || tail[1] < -1 || tail[0] > game.W || tail[1] > game.H;
    const offScreen = px < -margin || py < -margin || px > view.width + margin || py > view.height + margin;
    if (!(offBoard && offScreen) && a.slide <= a.ext.length - a.pts.length - 1) return false;
    a.state = 'gone';
    return true;
  },

  // Slides forward `d` cells into the blocker, bumps it once, then slides back.
  bounce(anim, t) {
    const { a, d } = anim, outSeconds = d / BOUNCE_OUT;
    if (t < outSeconds) { a.slide = t * BOUNCE_OUT; return false; }
    a.slide = Math.max(0, d - (t - outSeconds) * BOUNCE_BACK);
    if (!anim.bumped) { anim.bumped = true; bump(anim); }
    if (a.slide > 0) return false;
    a.slide = 0;
    a.state = 'idle';
    a.ext = null;
    return true;
  },
};

/** Advances every running animation. Returns true while any is still running. */
export function stepAnimations(now) {
  let running = false;
  for (const anim of game.anims.slice()) {
    if (STEPPERS[anim.kind](anim, (now - anim.t0) / 1000)) {
      game.anims.splice(game.anims.indexOf(anim), 1);
      checkEnd(); // a win or loss waits for the last animation
    } else running = true;
  }
  return running;
}
