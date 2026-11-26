// Free help during a game: a hint that shows one arrow that can leave, and taking back a
// mistake. Both are limited per board, so superpowers stay worth having.

import { $ } from '../dom.js';
import { sample } from '../rng.js';
import { sfx } from '../feedback.js';
import { t } from '../i18n.js';
import { track } from '../analytics.js';
import { game } from './state.js';
import { canLeave } from './arrows.js';
import { renderHud, toast } from './hud.js';
import { requestFrame } from './frame.js';
import { say, describeArrow } from './a11y.js';

const HINTS_PER_BOARD = 3, UNDOS_PER_BOARD = 1;
const HINT_MS = 3500;

/** Whether a lost heart can be taken back right now. Time Attack has no hearts to give back. */
export const undoAvailable = () => game.canUndo && game.undosLeft > 0 && game.cfg.kind !== 'rush';

export function renderAssist() {
  const hint = $('#hintBtn'), undo = $('#undoBtn');
  hint.disabled = game.hintsLeft <= 0;
  hint.querySelector('.n').textContent = game.hintsLeft;
  undo.hidden = game.cfg.kind === 'rush';
  undo.disabled = !undoAvailable();
  undo.querySelector('.n').textContent = game.undosLeft;
}

/** A new board: the full allowance again. */
export function resetAssist() {
  Object.assign(game, { hintsLeft: HINTS_PER_BOARD, undosLeft: UNDOS_PER_BOARD, canUndo: false, hint: null });
  renderAssist();
}

function showHint() {
  if (game.over || game.hintsLeft <= 0) return;
  const [arrow] = sample(game.arrows.filter(canLeave), 1);
  if (!arrow) { toast(t('hint.none')); return; } // every free arrow is still under ice
  game.hintsLeft--;
  game.hint = { id: arrow.id, until: performance.now() + HINT_MS };
  game.cursor = arrow.id; // keyboard players land on it and hear where it is
  say(describeArrow(arrow));
  sfx('hint');
  track('hint_used');
  renderAssist();
  requestFrame();
}

/** Gives back the heart the last bump cost, even when that bump ended the game. */
export function undoBump() {
  if (!undoAvailable()) return;
  game.undosLeft--;
  game.canUndo = false;
  game.hearts++;
  game.heartsLost--;
  game.over = false;
  game.pendingLose = null;
  sfx('power');
  track('undo_used');
  toast(t('undo.done'));
  renderHud();
  renderAssist();
}

export function initAssist() {
  $('#hintBtn').onclick = showHint;
  $('#undoBtn').onclick = undoBump;
}
