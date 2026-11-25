// Superpowers during a game: the row of buttons under the board.

import { onDataClick } from '../dom.js';
import { POWERS, MAX_HEARTS, RUSH_BOARD_BONUS } from '../content.js';
import { player, persist } from '../player.js';
import { buyPower } from '../economy.js';
import { sample } from '../rng.js';
import { sfx } from '../feedback.js';
import { ico, COIN } from '../icons.js';
import { t } from '../i18n.js';
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
    toast(game.smash ? t('toast.smash.on') : t('toast.smash.off'));
    renderPowers();
    return false;
  },
  radar() {
    game.radarUntil = performance.now() + RADAR_MS;
    toast(t('toast.radar'));
    return true;
  },
  freeze() {
    game.frozen += FREEZE_SECONDS;
    toast(t(game.boss ? 'toast.freeze.boss' : 'toast.freeze.clock', { n: FREEZE_SECONDS }));
    return true;
  },
  shield() {
    if (game.shield) { toast(t('toast.shield.already')); return false; }
    game.shield = true;
    toast(t('toast.shield'));
    return true;
  },
  // Time Attack has no hearts, so a Heart buys time there.
  heart() {
    if (game.cfg.kind === 'rush') {
      game.timeLeft += RUSH_BOARD_BONUS;
      toast(t('seconds.plus', { n: RUSH_BOARD_BONUS }));
      return true;
    }
    if (game.hearts >= MAX_HEARTS) { toast(t('toast.hearts.full')); return false; }
    game.hearts++;
    return true;
  },
  magnet() {
    const free = game.arrows.filter(canLeave);
    if (!free.length) { toast(t('toast.magnet.none')); return false; }
    // One after another; an arrow that got blocked or cleared in the meantime is skipped.
    sample(free, MAGNET_ARROWS).forEach((a, i) =>
      setTimeout(() => { if (!game.over && canLeave(a)) launch(a); }, i * MAGNET_STAGGER_MS));
    return true;
  },
};

function offerToBuy(power) {
  const affordable = player.coins >= power.price;
  modal(`<div class="item" style="text-align:left"><div class="ic">${ico(power.d)}</div><div class="tx"><b>${t('buy.out', { name: power.name })}</b><small>${power.desc}</small></div></div>
  <p style="margin:14px 0 0">${affordable ? t('buy.ask', { price: `<b class="price">${COIN}${power.price}</b>` }) : t('buy.need', { price: power.price, coins: player.coins })}</p>
  <div class="acts"><button class="btn" data-act="close">${affordable ? t('not.now') : t('ok')}</button>${affordable ? `<button class="btn gold" data-act="buy">${t('buy')}</button>` : ''}</div>`,
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
