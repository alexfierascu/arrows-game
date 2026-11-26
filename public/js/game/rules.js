// What happens when the player taps an arrow: it leaves, bounces off a blocker, cracks its
// ice or gets smashed.

import { MAX_COMBO, RUSH_BUMP_PENALTY } from '../content.js';
import { player, persist } from '../player.js';
import { sfx, vibrate } from '../feedback.js';
import { t } from '../i18n.js';
import { track } from '../analytics.js';
import { game, comboActive } from './state.js';
import { view } from './view.js';
import { rayInfo, extendedPath, headOnScreen, arrowWeight } from './arrows.js';
import { hitBoss } from './bosses.js';
import { renderHud, renderPowers, toast, pop } from './hud.js';
import { renderAssist } from './assist.js';
import { requestFrame } from './frame.js';
import { say } from './a11y.js';

const BASE_POINTS = 10;
const ERROR_FLASH_MS = 700;
const BOUNCE_OVERSHOOT = .32; // how far a blocked arrow pushes into its blocker, in cells

const animate = anim => game.anims.push({ t0: performance.now(), ...anim });

/** Takes the arrow off the grid and counts it. Its animation is up to the caller. */
function removeFromBoard(a) {
  for (const c of a.cells) game.own[c] = -1;
  game.left--;
  game.rushArrows++;
  player.st.arrows++;
  if (a.gold) game.goldCleared++;
  hitBoss(a);
}

// Far enough to slide off the board and off the screen at any zoom.
const runwayOf = a => Math.ceil(game.W + game.H + a.pts.length + (view.width + view.height) / view.scale + 4);

/** A move of the solution playback: the arrow leaves, but nothing is scored or counted. */
export function demoMove(a) {
  a.ice = false;
  a.state = 'exit';
  for (const c of a.cells) game.own[c] = -1;
  game.left--;
  a.ext = extendedPath(a, runwayOf(a));
  a.slide = 0;
  animate({ kind: 'exit', a });
  sfx('out', 1);
  renderHud();
  requestFrame();
}

/** Sends a free arrow off the board and scores it. */
export function launch(a) {
  const now = performance.now();
  game.canUndo = false; // only the very last move can be taken back
  const runway = runwayOf(a);
  a.state = 'exit';
  removeFromBoard(a);
  if (game.tutorial) { game.tutorial = false; game.radarUntil = 0; track('first_move'); } // lesson learned
  a.ext = extendedPath(a, runway);
  a.slide = 0;
  game.combo = comboActive(now) ? Math.min(MAX_COMBO, game.combo + 1) : 1;
  game.lastClear = now;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  const points = BASE_POINTS * game.combo * arrowWeight(a);
  game.score += points;
  pop('+' + points + (game.combo > 1 ? ' ×' + game.combo : ''), headOnScreen(a), a.gold ? '#d99a00' : null);
  animate({ kind: 'exit', a });
  sfx(a.gold ? 'gold' : game.combo > 2 ? 'combo' : 'out', game.combo);
  say(t('sr.left', { n: game.left }));
  renderHud();
  requestFrame();
}

function bounce(a, { d, blocker }) {
  a.state = 'bounce';
  a.ext = extendedPath(a, d + 1);
  a.slide = 0;
  animate({ kind: 'bounce', a, d: d + BOUNCE_OVERSHOOT, blocker });
  requestFrame();
}

function crackIce(a) {
  a.ice = false;
  sfx('crack');
  pop(t('pop.crack'), headOnScreen(a), '#1fb5d0');
  requestFrame();
}

function smashArrow(a) {
  game.smash = false;
  player.pw.smash--;
  player.st.powers++;
  persist();
  a.state = 'poof';
  a.ice = false;
  removeFromBoard(a);
  game.score += BASE_POINTS;
  pop(t('pop.smash'), headOnScreen(a), '#d99a00');
  animate({ kind: 'poof', a });
  sfx('power');
  renderPowers();
  renderHud();
  requestFrame();
}

export function tapArrow(a) {
  if (game.over || a.state !== 'idle') return;
  if (game.smash) return smashArrow(a);
  if (a.ice) return crackIce(a);
  const ray = rayInfo(a);
  if (ray.free) launch(a);
  else bounce(a, ray);
}

/** A bouncing arrow reached its blocker: costs a heart (or time in Time Attack) unless shielded. */
export function bump(anim) {
  const until = performance.now() + ERROR_FLASH_MS, blocker = game.arrows[anim.blocker];
  anim.a.errUntil = until;
  if (blocker) blocker.errUntil = until;
  game.combo = 0;
  vibrate(60);
  if (game.shield) {
    game.shield = false;
    sfx('power');
    toast(t('toast.shield.hit'));
  } else if (game.relaxed) {
    sfx('bump');
    say(t('sr.bump'));
  } else {
    player.st.bumps++;
    sfx('bump');
    if (game.cfg.kind === 'rush') {
      game.timeLeft = Math.max(0, game.timeLeft - RUSH_BUMP_PENALTY);
      toast(t('seconds.minus', { n: RUSH_BUMP_PENALTY }));
    } else {
      game.hearts--;
      game.heartsLost++;
      game.canUndo = true;
      say(t('sr.bump') + ' ' + t('sr.hearts', { n: game.hearts }));
      if (game.hearts <= 0 && !game.over) { game.over = true; game.pendingLose = 'hearts'; }
    }
  }
  renderHud();
  renderAssist();
}
