// Questions about arrows on the current board. Read-only.

import { DX, DY } from '../grid.js';
import { GOLD_MULTIPLIER } from '../content.js';
import { game } from './state.js';
import { toScreen } from './view.js';

const head = a => a.pts[a.pts.length - 1];

/**
 * Looks along the arrow's runway. Returns { free, d, blocker }: whether it reaches the edge,
 * how many empty cells lie ahead, and the id of the arrow in the way.
 */
export function rayInfo(a) {
  let [x, y] = head(a), d = 0;
  for (;;) {
    x += DX[a.dir];
    y += DY[a.dir];
    if (x < 0 || y < 0 || x >= game.W || y >= game.H) return { free: true, d };
    const blocker = game.own[y * game.W + x];
    if (blocker !== -1) return { free: false, d, blocker };
    d++;
  }
}

/** Whether a tap would send the arrow off the board right now. */
export const canLeave = a => a.state === 'idle' && !a.ice && rayInfo(a).free;

/** The arrow's points followed by `extra` more cells straight ahead: the track it slides along. */
export function extendedPath(a, extra) {
  const ext = a.pts.slice(), [hx, hy] = head(a);
  for (let k = 1; k <= extra; k++) ext.push([hx + DX[a.dir] * k, hy + DY[a.dir] * k]);
  return ext;
}

/** Point `s` cells along a path: [x, y, index of the segment it is on]. */
export function pointAt(path, s) {
  const i = Math.max(0, Math.min(path.length - 2, Math.floor(s))), f = s - i;
  return [path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f, i];
}

/** Canvas position of the arrow's head, for score pop-ups. */
export const headOnScreen = a => toScreen(...head(a));

/** Damage an arrow deals to a boss, and its score multiplier. */
export const arrowWeight = a => (a.gold ? GOLD_MULTIPLIER : 1);
