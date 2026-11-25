// Badges and lifetime stats screen.

import { $ } from '../dom.js';
import { BOSSES } from '../content.js';
import { player, clearedCount, totalStars, totalScore, bossesBeaten } from '../player.js';
import { BADGES, hasBadge } from '../badges.js';
import { num } from '../format.js';
import { ico, LOCK, CHECK } from '../icons.js';
import { registerScreen } from '../router.js';

function renderBadges() {
  const stats = [
    [clearedCount(), 'levels cleared'], [totalStars(), 'stars'], [bossesBeaten() + '/' + BOSSES.length, 'bosses beaten'],
    [num(totalScore()), 'total score'], [num(player.st.arrows), 'arrows out'], ['×' + player.st.bestCombo, 'best combo'],
  ];
  $('#stats').innerHTML = stats.map(([value, label]) => `<div class="stat"><b>${value}</b><small>${label}</small></div>`).join('');
  $('#badges').innerHTML = BADGES.map(b =>
    `<div class="badge ${hasBadge(b) ? 'got' : ''}"><div class="md">${ico(hasBadge(b) ? CHECK : LOCK)}</div><div><b>${b.name}</b><small>${b.desc}</small></div></div>`).join('');
}

export function initBadges() {
  registerScreen('badges', renderBadges);
}
