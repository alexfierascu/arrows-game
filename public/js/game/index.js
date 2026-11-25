// Wires the game screen together. Called once at startup.

import { $, esc } from '../dom.js';
import { t } from '../i18n.js';
import { modal, confirmDialog } from '../ui/modal.js';
import { openHelp } from '../ui/help.js';
import { game } from './state.js';
import { setFrameHandler } from './frame.js';
import { stepAnimations } from './animations.js';
import { draw, initRender } from './render.js';
import { initInput } from './input.js';
import { initPowers } from './powers.js';
import { initAssist } from './assist.js';
import { initKeyboard } from './keyboard.js';
import { startClock } from './clock.js';
import { restartGame, exitGame } from './session.js';

function openPauseMenu() {
  if (game.over) return;
  modal(`<h2>${t('paused')}</h2><p>${t('pause.progress', { title: esc(game.cfg.title), done: game.total - game.left, total: game.total })}</p>
  <div style="display:grid;gap:10px"><button class="btn main" data-act="close">${t('resume')}</button><button class="btn" data-act="help">${t('help.title')}</button><button class="btn" data-act="restart">${t('restart')}</button><button class="btn" data-act="quit">${t('quit')}</button></div>`,
  {
    help: () => openHelp(openPauseMenu),
    // Both throw away the board in progress, so both ask first and return here on "Cancel".
    restart: () => confirmDialog(t('confirm.restart'), t('restart'), restartGame, openPauseMenu),
    quit: () => confirmDialog(t('confirm.quit'), t('quit'), () => { game.over = true; exitGame(); }, openPauseMenu),
  });
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
  initAssist();
  initKeyboard(openPauseMenu);
  startClock();
  $('#pauseBtn').onclick = openPauseMenu;
}
