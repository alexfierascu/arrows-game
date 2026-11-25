// Badges and lifetime stats screen.

import { $ } from '../dom.js';
import { BOSSES } from '../content.js';
import { player, clearedCount, totalStars, totalScore, bossesBeaten, currentStreak } from '../player.js';
import { rollWeek } from '../weekly.js';
import { weekStatsHtml } from './recap.js';
import { BADGES, hasBadge, badgeName, badgeDesc } from '../badges.js';
import { t } from '../i18n.js';
import { num } from '../format.js';
import { ico, LOCK, CHECK } from '../icons.js';
import { registerScreen } from '../router.js';

// Badges still to earn show how far along the player is, when the target is more than one step.
function badgeHtml(b) {
  const got = hasBadge(b), [current, target] = b.progress();
  const progress = !got && target > 1 ? `<small class="prog">${num(Math.min(current, target))} / ${num(target)}</small>` : '';
  return `<div class="badge ${got ? 'got' : ''}"><div class="md">${ico(got ? CHECK : LOCK)}</div><div><b>${badgeName(b)}</b><small>${badgeDesc(b)}</small>${progress}</div></div>`;
}

function renderBadges() {
  const stats = [
    [clearedCount(), t('stat.levels')], [totalStars(), t('stat.stars')], [bossesBeaten() + '/' + BOSSES.length, t('stat.bosses')],
    [num(totalScore()), t('stat.score')], [num(player.st.arrows), t('stat.arrows')], ['×' + player.st.bestCombo, t('stat.combo')],
  ];
  $('#stats').innerHTML = stats.map(([value, label]) => `<div class="stat"><b>${value}</b><small>${label}</small></div>`).join('');
  rollWeek();
  $('#week').innerHTML = `<h3 class="sect">${t('week.title')}</h3>${weekStatsHtml(player.wk)}<p class="note">${t('streak.label', { n: currentStreak() })}</p>`;
  $('#badges').innerHTML = BADGES.map(badgeHtml).join('');
}

export function initBadges() {
  registerScreen('badges', renderBadges);
}
