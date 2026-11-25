// The lockout screen: covers the whole game for a few minutes after too many attempts to use
// an offensive name. The server decides when (src/worker.js); the end time is kept in this
// browser, so reloading the page does not lift it.

import { $, $$ } from '../dom.js';
import { clock } from '../format.js';

const STORAGE_KEY = 'ae-locked-until';
let until = 0, timer = 0;

function tick() {
  const left = until - Date.now();
  if (left > 0) { $('#lockClock').textContent = clock(Math.ceil(left / 1000)); return; }
  clearInterval(timer);
  setLocked(false);
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage blocked */ }
}

/** Shows or hides the screen. While it is up, nothing behind it can be clicked or focused. */
function setLocked(on) {
  $('#lock').classList.toggle('on', on);
  for (const el of $$('.scr, #modal')) el.inert = on;
  if (on) $('#lockCard').focus({ preventScroll: true });
}

function start() {
  setLocked(true);
  clearInterval(timer);
  timer = setInterval(tick, 1000);
  tick();
}

/** Locks the game for `ms` milliseconds from now. */
export function lockOut(ms) {
  until = Date.now() + ms;
  try { localStorage.setItem(STORAGE_KEY, until); } catch { /* storage blocked: lasts until a reload */ }
  start();
}

/** Puts the screen back if a lockout was still running when the page was closed. */
export function initLockout() {
  try { until = Number(localStorage.getItem(STORAGE_KEY)) || 0; } catch { /* storage blocked */ }
  if (until > Date.now()) start();
}
