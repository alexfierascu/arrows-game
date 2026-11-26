// "Show me a solution": after a lost game, the same board is played back from the start, one
// free arrow after another, so the player can see that (and how) it can be cleared.

import { $ } from '../dom.js';
import { t } from '../i18n.js';
import { track } from '../analytics.js';
import { currentScreen } from '../router.js';
import { modal } from '../ui/modal.js';
import { game } from './state.js';
import { rayInfo } from './arrows.js';
import { demoMove } from './rules.js';
import { loadBoard, restartGame, exitGame } from './session.js';
import { toast } from './hud.js';

const PLAYBACK_MS = 12000;               // a whole board takes about this long…
const MIN_STEP_MS = 60, MAX_STEP_MS = 260; // …but single moves stay watchable

let timer = 0;

function stop(showDialog) {
  clearInterval(timer);
  $('#stage').removeEventListener('pointerdown', skip);
  if (!game.demo) return;
  game.demo = false;
  if (!showDialog) return;
  modal(`<h2>${t('solution.title')}</h2><p>${t('solution.text')}</p>
  <div class="acts"><button class="btn" data-act="quit">${t('quit')}</button><button class="btn main" data-act="retry">${t('retry')}</button></div>`,
  { quit: exitGame, retry: restartGame });
}

const skip = () => stop(true);

// Removing a free arrow never blocks another one, so taking any free arrow, again and again,
// clears every board the generator makes.
function step() {
  if (currentScreen() !== 'game' || !game.demo) { stop(false); return; }
  const next = game.arrows.find(a => a.state === 'idle' && rayInfo(a).free);
  if (next) demoMove(next);
  else if (!game.anims.length) stop(true);
}

/** Plays the current board back from its start. The game stays over: taps do nothing but end the playback. */
export function playSolution() {
  track('solution_watched');
  loadBoard(game.cfg);
  game.demo = true;
  toast(t('solution.playing'), 2600);
  clearInterval(timer);
  timer = setInterval(step, Math.max(MIN_STEP_MS, Math.min(MAX_STEP_MS, PLAYBACK_MS / game.total)));
  $('#stage').addEventListener('pointerdown', skip);
}
