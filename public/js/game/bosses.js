// Boss fights: the attacks a boss throws at the player and the damage it takes.

import { $ } from '../dom.js';
import { ATTACKS } from '../content.js';
import { mulberry32, sample } from '../rng.js';
import { sfx, vibrate } from '../feedback.js';
import { game, comboActive } from './state.js';
import { arrowWeight } from './arrows.js';
import { renderHud, shakeBoss, toast, pop } from './hud.js';
import { requestFrame } from './frame.js';

const FOG_MS = 5000, BLACKOUT_MS = 7000;
const DRAIN_SECONDS = 8, DRAIN_BLOCK_COMBO = 3;
const FREEZE_COUNT = 5;

// Three patches of overlapping paper scraps, each a list of [x, y, radius] puffs in cells.
function fog(now) {
  const rnd = mulberry32(now | 0), { W, H } = game;
  for (let k = 0; k < 3; k++) {
    const w = W * (.3 + rnd() * .2), h = H * (.22 + rnd() * .15), x0 = rnd() * (W - w), y0 = rnd() * (H - h), puffs = [];
    for (let y = y0; y <= y0 + h; y += 1.3) for (let x = x0; x <= x0 + w; x += 1.3) puffs.push([x + rnd() * .8, y + rnd() * .8, 1.1 + rnd() * .7]);
    game.fogs.push({ t0: now, until: now + FOG_MS, puffs });
  }
  toast('Paper storm!');
}

function drain(now) {
  if (game.combo >= DRAIN_BLOCK_COMBO && comboActive(now)) { toast('Your combo blocked the Time thief!'); return; }
  game.timeLeft = Math.max(1, game.timeLeft - DRAIN_SECONDS);
  const clockBox = $('#tTxt').getBoundingClientRect(), stageBox = $('#stage').getBoundingClientRect();
  pop('−' + DRAIN_SECONDS + 's', [clockBox.left - stageBox.left + 20, 10], '#e5484d');
  toast('The Conductor stole ' + DRAIN_SECONDS + ' seconds');
}

function blackout(now) {
  game.blackoutUntil = now + BLACKOUT_MS;
  toast('Lights out! Tap empty space to move your lamp');
}

function freeze() {
  const victims = sample(game.arrows.filter(a => a.state === 'idle' && !a.ice), FREEZE_COUNT);
  for (const a of victims) a.ice = true;
  toast('Frost! ' + victims.length + ' arrows froze');
}

// Keyed like ATTACKS in content.js: a new attack needs an entry in both.
const EFFECTS = { fog, drain, blackout, freeze };

/** The boss's next attack in its rotation. A shield absorbs it. */
export function bossAttack() {
  const { boss } = game, type = boss.atk[game.attackIndex++ % boss.atk.length];
  shakeBoss();
  if (game.shield) {
    game.shield = false;
    sfx('power');
    toast('Your shield blocked ' + ATTACKS[type].name);
    renderHud();
    return;
  }
  sfx('boss');
  vibrate([40, 40, 40]);
  EFFECTS[type](performance.now());
  requestFrame();
}

/** An arrow left the board: the boss, if there is one, takes damage. */
export function hitBoss(arrow) {
  if (!game.boss) return;
  game.bossHP = Math.max(0, game.bossHP - arrowWeight(arrow));
  shakeBoss();
}
