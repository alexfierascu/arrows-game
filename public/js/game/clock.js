// The game clock: counts down while a game is actually being played and triggers boss attacks.

import { currentScreen } from '../router.js';
import { isModalOpen } from '../ui/modal.js';
import { game, comboActive } from './state.js';
import { bossAttack } from './bosses.js';
import { loseNow } from './outcome.js';
import { renderHud } from './hud.js';

const TICK_MS = 100;
const MAX_STEP = .5;      // seconds: a stalled tab never costs more than this at once
const ENRAGED_PACE = .65; // below half health a boss attacks this much sooner

// Dialogs, other screens and hidden tabs all pause the game.
const isPlaying = () => currentScreen() === 'game' && !game.over && !isModalOpen() && !document.hidden;

function tickBoss(dt) {
  const { boss } = game;
  game.bossNext -= dt;
  if (game.bossNext > 0) return;
  bossAttack();
  game.bossNext = boss.every * (game.bossHP < game.bossMax / 2 ? ENRAGED_PACE : 1);
}

function tick(dt, now) {
  if (game.frozen > 0) game.frozen = Math.max(0, game.frozen - dt); // Freeze stops clock and boss
  else {
    if (!game.relaxed) game.timeLeft -= dt;
    if (game.boss) tickBoss(dt);
    if (game.timeLeft <= 0) { game.timeLeft = 0; loseNow('time'); }
  }
  renderHud();
  if (game.combo > 1 && !comboActive(now)) game.combo = 0;
}

export function startClock() {
  let last = performance.now();
  setInterval(() => {
    const now = performance.now(), dt = Math.min(MAX_STEP, (now - last) / 1000);
    last = now;
    if (isPlaying()) tick(dt, now);
  }, TICK_MS);
}
