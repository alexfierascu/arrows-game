// Wires the game screen together. Called once at startup.

import { $, esc } from '../dom.js';
import { modal } from '../ui/modal.js';
import { game } from './state.js';
import { setFrameHandler } from './frame.js';
import { stepAnimations } from './animations.js';
import { draw, initRender } from './render.js';
import { initInput } from './input.js';
import { initPowers } from './powers.js';
import { startClock } from './clock.js';
import { restartGame, exitGame } from './session.js';

function openPauseMenu() {
  if (game.over) return;
  modal(`<h2>Paused</h2><p>${esc(game.cfg.title)} · ${game.total - game.left} of ${game.total} cleared</p>
  <div style="display:grid;gap:10px"><button class="btn main" data-act="close">Resume</button><button class="btn" data-act="restart">Restart</button><button class="btn" data-act="quit">Quit</button></div>`,
  { restart: restartGame, quit: () => { game.over = true; exitGame(); } });
}

export function initGame() {
  // One frame: move the animations first, then draw the result.
  setFrameHandler(now => {
    const animating = stepAnimations(now);
    return draw(now) || animating;
  });
  initRender();
  initInput();
  initPowers();
  startClock();
  $('#pauseBtn').onclick = openPauseMenu;
}
