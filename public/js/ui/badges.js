// Badges and lifetime stats screen.

import { $ } from '../dom.js';
import { BOSSES } from '../content.js';
import { player, clearedCount, totalStars, totalScore, bossesBeaten } from '../player.js';
import { BADGES, hasBadge, badgeName, badgeDesc } from '../badges.js';
import { t } from '../i18n.js';
import { num } from '../format.js';
import { ico, LOCK, CHECK } from '../icons.js';
import { registerScreen } from '../router.js';

function renderBadges() {
  const stats = [
    [clearedCount(), t('stat.levels')], [totalStars(), t('stat.stars')], [bossesBeaten() + '/' + BOSSES.length, t('stat.bosses')],
    [num(totalScore()), t('stat.score')], [num(player.st.arrows), t('stat.arrows')], ['×' + player.st.bestCombo, t('stat.combo')],
  ];
  $('#stats').innerHTML = stats.map(([value, label]) => `<div class="stat"><b>${value}</b><small>${label}</small></div>`).join('');
  $('#badges').innerHTML = BADGES.map(b =>
    `<div class="badge ${hasBadge(b) ? 'got' : ''}"><div class="md">${ico(hasBadge(b) ? CHECK : LOCK)}</div><div><b>${badgeName(b)}</b><small>${badgeDesc(b)}</small></div></div>`).join('');
}

export function initBadges() {
  registerScreen('badges', renderBadges);
}
