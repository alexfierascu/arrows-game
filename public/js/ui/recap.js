// The weekly recap: what the player did in a week, as a row of numbers.

import { t } from '../i18n.js';
import { num } from '../format.js';
import { takeLastWeek } from '../weekly.js';
import { modal } from './modal.js';

/** A week's numbers as stat tiles, or a nudge to play when there are none yet. */
export function weekStatsHtml(week) {
  if (!week.wins) return `<p class="note" style="margin:0">${t('week.empty')}</p>`;
  const stats = [
    [week.wins, 'week.wins'], [week.stars, 'week.stars'], [week.coins, 'week.coins'],
    [week.best, 'week.best'], [week.dailies, 'week.dailies'],
  ];
  return `<div class="stats">${stats.map(([value, label]) => `<div class="stat"><b>${num(value)}</b><small>${t(label)}</small></div>`).join('')}</div>`;
}

/** Shows last week's recap once, the first time the game opens in a new week. */
export function showLastWeekRecap() {
  const week = takeLastWeek();
  if (!week) return;
  modal(`<span class="kick">${t('week.last')}</span><h2>${t('week.title')}</h2>${weekStatsHtml(week)}
  <div class="acts"><button class="btn main" data-act="close">${t('got.it')}</button></div>`);
}
