// Superpower shop.

import { $, onDataClick } from '../dom.js';
import { POWERS } from '../content.js';
import { player } from '../player.js';
import { buyPower } from '../economy.js';
import { ico, COIN } from '../icons.js';
import { registerScreen } from '../router.js';
import { t } from '../i18n.js';

const itemHtml = p =>
  `<div class="card item"><div class="ic">${ico(p.d)}</div><div class="tx"><b>${p.name}</b><small>${p.desc}</small><span class="own">${t('shop.own', { n: player.pw[p.id] })}</span></div><button class="btn main" data-buy="${p.id}" ${player.coins < p.price ? 'disabled' : ''}><span class="price">${COIN}${p.price}</span></button></div>`;

function renderShop() {
  $('#shop').innerHTML = POWERS.map(itemHtml).join('');
}

export function initShop() {
  registerScreen('shop', renderShop);
  onDataClick('#shop', 'buy', id => {
    if (buyPower(POWERS.find(p => p.id === id))) renderShop();
  });
}
