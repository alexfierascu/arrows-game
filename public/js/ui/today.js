// The "Today" dialog: the daily gift and the three daily missions.

import { POWERS, GIFT_COINS } from '../content.js';
import { player, persist } from '../player.js';
import { addCoins } from '../economy.js';
import { awardNewBadges } from '../badges.js';
import { coinMultiplier } from '../week.js';
import { todaysMissions, missionText, claimMission } from '../missions.js';
import { today, num } from '../format.js';
import { ico, COIN, CHECK } from '../icons.js';
import { randomInt } from '../rng.js';
import { sfx } from '../feedback.js';
import { show, currentScreen } from '../router.js';
import { t } from '../i18n.js';
import { track } from '../analytics.js';
import { modal } from './modal.js';

const GIFT_ICON = '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1.5S10 8 12 8zm0 0c2-4 6-4 6-1.5S14 8 12 8z"/>';

export const giftReady = () => player.gift !== today();

// The home screen shows the gift and mission state, so it is redrawn after every change.
const refreshHome = () => { if (currentScreen() === 'home') show('home'); };

function openGift() {
  const power = POWERS[randomInt(POWERS.length)], coins = GIFT_COINS * coinMultiplier();
  player.gift = today();
  player.pw[power.id]++;
  addCoins(coins);
  sfx('win');
  modal(`<span class="kick" style="--c:#d99a00">${t('tile.gift')}</span><h2>${t('gift.title')}</h2><div class="gain"><span>${COIN}+${coins}</span><span>${ico(power.d)} +1 ${power.name}</span></div><div class="acts"><button class="btn main" data-act="next">${t('collect')}</button></div>`,
  { next: openToday });
  refreshHome();
}

function claim(id) {
  const coins = claimMission(id);
  if (coins) {
    awardNewBadges();
    addCoins(coins); // saves
    sfx('coin');
    track('mission_claimed');
  }
  persist();
  refreshHome();
  openToday();
}

function missionHtml(m) {
  const state = m.claimed ? `<span class="mdone">${ico(CHECK)}</span>`
    : m.done ? `<button class="btn gold" data-act="claim-${m.id}">${COIN}${m.coins}</button>`
    : `<span class="price">${COIN}${m.coins}</span>`;
  return `<div class="mis ${m.claimed ? 'got' : ''}"><div class="mtx"><b>${missionText(m)}</b>
  <div class="hp"><i style="width:${100 * m.progress / m.target}%"></i></div><small>${num(m.progress)} / ${num(m.target)}</small></div>${state}</div>`;
}

export function openToday() {
  const missions = todaysMissions(), actions = { gift: openGift };
  for (const m of missions) actions['claim-' + m.id] = () => claim(m.id);
  const gift = giftReady()
    ? `<button class="btn gold" data-act="gift">${t('gift.open')}</button>`
    : `<span class="mdone">${ico(CHECK)}</span>`;
  modal(`<h2>${t('tile.today')}</h2>
  <div class="mis ${giftReady() ? '' : 'got'}"><div class="mtx"><b>${ico(GIFT_ICON)} ${t('tile.gift')}</b><small>${t(giftReady() ? 'gift.ready' : 'gift.wait')}</small></div>${gift}</div>
  <h3 class="sect" style="text-align:left">${t('missions')}</h3>${missions.map(missionHtml).join('')}
  <p class="note">${t('missions.note')}</p>
  <div class="acts"><button class="btn main" data-act="close">${t('close')}</button></div>`, actions);
}
