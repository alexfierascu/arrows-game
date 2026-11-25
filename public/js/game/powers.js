// Superpowers during a game: the row of buttons under the board.

import { onDataClick } from '../dom.js';
import { POWERS, MAX_HEARTS, RUSH_BOARD_BONUS } from '../content.js';
import { player, persist } from '../player.js';
import { buyPower } from '../economy.js';
import { sample } from '../rng.js';
import { sfx } from '../feedback.js';
import { ico, COIN } from '../icons.js';
import { modal } from '../ui/modal.js';
import { game } from './state.js';
import { canLeave } from './arrows.js';
import { launch } from './rules.js';
import { renderHud, renderPowers, toast } from './hud.js';
import { requestFrame } from './frame.js';

const RADAR_MS = 4500, FREEZE_SECONDS = 15;
const MAGNET_ARROWS = 6, MAGNET_STAGGER_MS = 120;

// Each effect returns true when the power was used up. Returning false keeps it in the bag
// (it could not help right now, or, for Smash, it is only spent once an arrow is smashed).
const EFFECTS = {
  smash() {
    game.smash = !game.smash;
    toast(game.smash ? 'Tap any arrow to smash it' : 'Smash cancelled');
    renderPowers();
    return false;
  },
  radar() {
    game.radarUntil = performance.now() + RADAR_MS;
    toast('Radar: blinking arrows can leave');
    return true;
  },
  freeze() {
    game.frozen += FREEZE_SECONDS;
    toast((game.boss ? 'Clock and boss' : 'Clock') + ' frozen for ' + FREEZE_SECONDS + ' seconds');
    return true;
  },
  shield() {
    if (game.shield) { toast('Shield is already up'); return false; }
    game.shield = true;
    toast('Shield up');
    return true;
  },
  // Time Attack has no hearts, so a Heart buys time there.
  heart() {
    if (game.cfg.kind === 'rush') {
      game.timeLeft += RUSH_BOARD_BONUS;
      toast('+' + RUSH_BOARD_BONUS + ' seconds');
      return true;
    }
    if (game.hearts >= MAX_HEARTS) { toast('Hearts are full'); return false; }
    game.hearts++;
    return true;
  },
  magnet() {
    const free = game.arrows.filter(canLeave);
    if (!free.length) { toast('Nothing can leave right now'); return false; }
    // One after another; an arrow that got blocked or cleared in the meantime is skipped.
    sample(free, MAGNET_ARROWS).forEach((a, i) =>
      setTimeout(() => { if (!game.over && canLeave(a)) launch(a); }, i * MAGNET_STAGGER_MS));
    return true;
  },
};

function offerToBuy(power) {
  const affordable = player.coins >= power.price;
  modal(`<div class="item" style="text-align:left"><div class="ic">${ico(power.d)}</div><div class="tx"><b>Out of ${power.name}</b><small>${power.desc}</small></div></div>
  <p style="margin:14px 0 0">${affordable ? `Buy one for <b class="price">${COIN}${power.price}</b>?` : `You need ${power.price} coins and have ${player.coins}.`}</p>
  <div class="acts"><button class="btn" data-act="close">${affordable ? 'Not now' : 'OK'}</button>${affordable ? '<button class="btn gold" data-act="buy">Buy</button>' : ''}</div>`,
  { buy: () => { if (buyPower(power)) renderPowers(); } });
}

function usePower(id) {
  if (game.over) return;
  if (player.pw[id] <= 0) { offerToBuy(POWERS.find(p => p.id === id)); return; }
  if (!EFFECTS[id]()) return;
  player.pw[id]--;
  player.st.powers++;
  persist();
  sfx('power');
  renderPowers();
  renderHud();
  requestFrame();
}

export function initPowers() {
  onDataClick('#powers', 'p', usePower);
}
