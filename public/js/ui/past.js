// Earlier daily boards: the last two weeks can be played as practice. They do not count for
// the leaderboard or the streak; the first clear of each day pays a few coins.

import { player } from '../player.js';
import { dailyCfg } from '../levels.js';
import { ymd } from '../format.js';
import { language, t } from '../i18n.js';
import { ico, CHECK } from '../icons.js';
import { modal } from './modal.js';
import { previewLevel } from './preview.js';

const DAYS = 14;

/** The board of an earlier date, marked so that playing it is recorded apart from today's. */
export const pastCfg = date => ({ ...dailyCfg(date), practice: true, past: true });

export function openPast() {
  const now = new Date(), actions = {};
  const days = Array.from({ length: DAYS }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1 - i));
  const cells = days.map(day => {
    const date = ymd(day), done = !!player.past[date];
    actions['day-' + date] = () => previewLevel(pastCfg(date));
    const label = day.toLocaleDateString(language(), { weekday: 'short' });
    return `<button class="day ${done ? 'got' : ''}" data-act="day-${date}" aria-label="${date}"><small>${label}</small><b>${day.getDate()}</b>${done ? ico(CHECK) : ''}</button>`;
  });
  modal(`<span class="kick" style="--c:#d99a00">${t('tile.daily')}</span><h2>${t('past.title')}</h2><p>${t('past.text')}</p>
  <div class="days">${cells.join('')}</div>
  <div class="acts"><button class="btn main" data-act="close">${t('close')}</button></div>`, actions);
}
