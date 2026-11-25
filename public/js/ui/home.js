// Home screen: the play button, the tiles that open every other screen, and the daily gift.

import { $ } from '../dom.js';
import { POWERS, BOSSES, MAX_STARS, EVENT_STAGES, GIFT_COINS } from '../content.js';
import { player, nextLevel, eventState, totalStars, bossesBeaten, powersOwned } from '../player.js';
import { BADGES, badgeCount } from '../badges.js';
import { addCoins } from '../economy.js';
import { weekInfo, coinMultiplier } from '../week.js';
import { levelCfg, dailyCfg, worldOf } from '../levels.js';
import { today, duration, num } from '../format.js';
import { ico, COIN } from '../icons.js';
import { randomInt } from '../rng.js';
import { sfx } from '../feedback.js';
import { registerScreen, show, currentScreen } from '../router.js';
import { modal } from './modal.js';
import { previewLevel } from './preview.js';
import { openSettings } from './settings.js';

const REFRESH_MS = 30000; // keeps the event countdown current

const giftReady = () => player.gift !== today();

function renderEventTile(wk) {
  const ev = wk.ev, es = eventState(wk.key), tile = $('#tEvent');
  const progress = ev.kind === 'rush'
    ? 'Best run: ' + num(es.best || 0)
    : Object.keys(es.stages).length + ' of ' + EVENT_STAGES + ' stages cleared';
  tile.style.setProperty('--c', ev.col);
  tile.innerHTML = `<span class="evi">${ico(ev.d)}</span><span class="tx"><small>This week’s event</small><b>${ev.name}</b><small>${progress}</small></span><span class="cd">Ends in ${duration(wk.end - Date.now())}</span>`;
}

function renderHome() {
  const g = nextLevel(), wk = weekInfo();
  $('#playLbl').textContent = g ? levelCfg(g).title : 'Daily';
  $('#wkBanner').hidden = !wk.weekend;
  renderEventTile(wk);
  $('#dailySub').textContent = player.daily.d === today() ? 'Today’s best: ' + num(player.daily.score) : 'New board every day';
  $('#worldsSub').textContent = totalStars() + ' of ' + MAX_STARS + ' stars · ' + bossesBeaten() + '/' + BOSSES.length + ' bosses';
  $('#shopSub').textContent = powersOwned() + ' in your bag';
  $('#badgeSub').textContent = badgeCount() + ' of ' + BADGES.length + ' badges';
  $('#giftSub').textContent = giftReady() ? 'Ready to open' : 'Come back tomorrow';
  $('#tGift .dotb')?.remove();
  if (giftReady()) $('#tGift').insertAdjacentHTML('beforeend', '<i class="dotb"></i>');
}

function openGift() {
  if (!giftReady()) {
    modal(`<h2>Already opened</h2><p>A new gift arrives tomorrow.</p><div class="acts"><button class="btn main" data-act="close">OK</button></div>`);
    return;
  }
  const power = POWERS[randomInt(POWERS.length)], coins = GIFT_COINS * coinMultiplier();
  player.gift = today();
  player.pw[power.id]++;
  addCoins(coins);
  sfx('win');
  modal(`<span class="kick" style="--c:#d99a00">Daily gift</span><h2>Nice!</h2><div class="gain"><span>${COIN}+${coins}</span><span>${ico(power.d)} +1 ${power.name}</span></div><div class="acts"><button class="btn main" data-act="close">Collect</button></div>`);
  renderHome();
}

function playNext() {
  const g = nextLevel();
  previewLevel(g ? levelCfg(g) : dailyCfg());
}

export function initHome() {
  registerScreen('home', renderHome);
  $('#playBtn').onclick = playNext;
  $('#tDaily').onclick = () => previewLevel(dailyCfg());
  $('#tEvent').onclick = () => show('event');
  $('#tWorlds').onclick = () => show('map', { world: worldOf(nextLevel() || 1) });
  $('#tBoard').onclick = () => show('board');
  $('#tShop').onclick = () => show('shop');
  $('#tBadges').onclick = () => show('badges');
  $('#tGift').onclick = openGift;
  $('#gear').onclick = openSettings;
  setInterval(() => { if (currentScreen() === 'home') renderHome(); }, REFRESH_MS);
}
