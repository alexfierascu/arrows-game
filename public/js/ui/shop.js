// The shop: superpowers and arrow skins, both paid for with coins.

import { $, onDataClick } from '../dom.js';
import { POWERS } from '../content.js';
import { player } from '../player.js';
import { buyPower } from '../economy.js';
import { SKINS, activeSkin, ownsSkin, buySkin, useSkin } from '../skins.js';
import { track } from '../analytics.js';
import { ico, COIN } from '../icons.js';
import { registerScreen } from '../router.js';
import { t } from '../i18n.js';

const price = n => `<span class="price">${COIN}${n}</span>`;

const powerHtml = p =>
  `<div class="card item"><div class="ic">${ico(p.d)}</div><div class="tx"><b>${p.name}</b><small>${p.desc}</small><span class="own">${t('shop.own', { n: player.pw[p.id] })}</span></div><button class="btn main" data-buy="${p.id}" ${player.coins < p.price ? 'disabled' : ''}>${price(p.price)}</button></div>`;

/** A sample arrow drawn the way the skin draws arrows. */
function skinSample(skin) {
  const colour = skin.ink ? `light-dark(${skin.ink[0]}, ${skin.ink[1]})` : 'var(--ink)', width = 2.6 * (skin.width || 1);
  return `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color:${colour}"><path d="M5 18h9V9" stroke="currentColor" stroke-width="${width}"/><path d="M14 3.5l-4.5 6h9z" fill="currentColor"/></svg>`;
}

function skinAction(skin) {
  if (skin === activeSkin()) return `<button class="btn" disabled>${t('skin.active')}</button>`;
  if (ownsSkin(skin)) return `<button class="btn" data-skin="${skin.id}">${t('skin.use')}</button>`;
  return `<button class="btn main" data-skin="${skin.id}" ${player.coins < skin.price ? 'disabled' : ''}>${price(skin.price)}</button>`;
}

const skinHtml = skin =>
  `<div class="card item"><div class="ic">${skinSample(skin)}</div><div class="tx"><b>${t('skin.' + skin.id)}</b></div>${skinAction(skin)}</div>`;

function renderShop() {
  $('#shop').innerHTML = POWERS.map(powerHtml).join('')
    + `<h3 class="sect">${t('skins')}</h3>` + SKINS.map(skinHtml).join('')
    + `<p class="note" style="margin:0 2px">${t('skin.note')}</p>`;
}

/** One button per skin: it buys the skin if needed, and puts it on either way. */
function chooseSkin(id) {
  const skin = SKINS.find(s => s.id === id);
  if (ownsSkin(skin)) useSkin(skin);
  else if (buySkin(skin)) track('skin_bought');
  renderShop();
}

export function initShop() {
  registerScreen('shop', renderShop);
  onDataClick('#shop', 'buy', id => {
    if (buyPower(POWERS.find(p => p.id === id))) renderShop();
  });
  onDataClick('#shop', 'skin', chooseSkin);
}
