// Keyboard play: with the board focused, the arrow keys move a highlight from arrow to arrow,
// Enter or Space taps the highlighted one, H asks for a hint, U takes back a mistake and
// Escape pauses. Each newly highlighted arrow is described to screen readers.

import { $ } from '../dom.js';
import { game } from './state.js';
import { tapArrow } from './rules.js';
import { requestFrame } from './frame.js';
import { say, describeArrow } from './a11y.js';

const STEPS = { ArrowRight: [1, 0], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowUp: [0, -1] };
const SIDEWAYS_COST = 2; // an arrow straight ahead beats a closer one off to the side

const onBoard = a => a.state !== 'gone' && a.state !== 'exit' && a.state !== 'poof';
const centre = a => a.pts.reduce(([x, y], [px, py]) => [x + px / a.pts.length, y + py / a.pts.length], [0, 0]);

function nearest(from, arrows, cost) {
  let best = null, bestCost = Infinity;
  for (const a of arrows) {
    const [x, y] = centre(a), c = cost(x - from[0], y - from[1]);
    if (c < bestCost) { bestCost = c; best = a; }
  }
  return best;
}

/** The highlighted arrow, or null. An arrow that has left the board loses the highlight. */
export function cursorArrow() {
  const a = game.cursor === null ? null : game.arrows[game.cursor];
  return a && onBoard(a) ? a : null;
}

function move([dx, dy]) {
  const arrows = game.arrows.filter(onBoard), current = cursorArrow();
  if (!arrows.length) return;
  let next;
  if (!current) {
    // First key press, or the highlighted arrow just left: start near where it was.
    const from = game.cursor === null ? [game.W / 2, game.H / 2] : centre(game.arrows[game.cursor]);
    next = nearest(from, arrows, (x, y) => Math.hypot(x, y));
  } else {
    const ahead = arrows.filter(a => a !== current);
    next = nearest(centre(current), ahead, (x, y) => {
      const forward = x * dx + y * dy, sideways = Math.abs(x * dy - y * dx);
      return forward > 0.01 ? forward + sideways * SIDEWAYS_COST : Infinity;
    }) || current;
  }
  game.cursor = next.id;
  say(describeArrow(next));
  requestFrame();
}

/** `onPause` is called for Escape. */
export function initKeyboard(onPause) {
  const canvas = $('#cv');
  canvas.addEventListener('keydown', e => {
    if (game.over) return;
    if (e.key in STEPS) { e.preventDefault(); move(STEPS[e.key]); }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const a = cursorArrow();
      if (a) tapArrow(a);
      else move([0, 0]);
    } else if (e.key === 'h' || e.key === 'H') $('#hintBtn').click();
    else if (e.key === 'u' || e.key === 'U') $('#undoBtn').click();
    else if (e.key === 'Escape') {
      e.stopPropagation(); // or the dialog's own Escape handler would close the menu again at once
      onPause();
    }
  });
  canvas.addEventListener('blur', requestFrame);
  canvas.addEventListener('focus', requestFrame);
}
