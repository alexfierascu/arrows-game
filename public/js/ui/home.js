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
import { t } from '../i18n.js';
import { modal } from './modal.js';
import { previewLevel } from './preview.js';
import { openSettings } from './settings.js';

const REFRESH_MS = 30000; // keeps the event countdown current

const giftReady = () => player.gift !== today();

function renderEventTile(wk) {
  const ev = wk.ev, es = eventState(wk.key), tile = $('#tEvent');
  const progress = ev.kind === 'rush'
    ? t('home.best.run', { n: num(es.best || 0) })
    : t('home.stages', { n: Object.keys(es.stages).length, total: EVENT_STAGES });
  tile.style.setProperty('--c', ev.col);
  tile.innerHTML = `<span class="evi">${ico(ev.d)}</span><span class="tx"><small>${t('home.event.kicker')}</small><b>${ev.name}</b><small>${progress}</small></span><span class="cd">${t('ends.in', { time: duration(wk.end - Date.now()) })}</span>`;
}

function renderHome() {
  const g = nextLevel(), wk = weekInfo();
  $('#playLbl').textContent = g ? levelCfg(g).title : t('daily.short');
  $('#wkBanner').hidden = !wk.weekend;
  renderEventTile(wk);
  $('#dailySub').textContent = player.daily.d === today() ? t('home.daily.best', { n: num(player.daily.score) }) : t('home.daily.new');
  $('#worldsSub').textContent = t('home.worlds', { stars: totalStars(), max: MAX_STARS, bosses: bossesBeaten(), total: BOSSES.length });
  $('#shopSub').textContent = t('home.bag', { n: powersOwned() });
  $('#badgeSub').textContent = t('home.badges', { n: badgeCount(), total: BADGES.length });
  $('#giftSub').textContent = giftReady() ? t('gift.ready') : t('gift.wait');
  $('#tGift .dotb')?.remove();
  if (giftReady()) $('#tGift').insertAdjacentHTML('beforeend', '<i class="dotb"></i>');
}

function openGift() {
  if (!giftReady()) {
    modal(`<h2>${t('gift.opened.title')}</h2><p>${t('gift.opened.text')}</p><div class="acts"><button class="btn main" data-act="close">${t('ok')}</button></div>`);
    return;
  }
  const power = POWERS[randomInt(POWERS.length)], coins = GIFT_COINS * coinMultiplier();
  player.gift = today();
  player.pw[power.id]++;
  addCoins(coins);
  sfx('win');
  modal(`<span class="kick" style="--c:#d99a00">${t('tile.gift')}</span><h2>${t('gift.title')}</h2><div class="gain"><span>${COIN}+${coins}</span><span>${ico(power.d)} +1 ${power.name}</span></div><div class="acts"><button class="btn main" data-act="close">${t('collect')}</button></div>`);
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
