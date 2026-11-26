// When a month is over, the player's final place in that season pays coins. Shown once, the
// next time the game opens on the home screen with a connection.

import { player, persist } from '../player.js';
import { addCoins } from '../economy.js';
import { awardNewBadges } from '../badges.js';
import { rollSeason, seasonPrize } from '../season.js';
import { language, t } from '../i18n.js';
import { num } from '../format.js';
import { COIN } from '../icons.js';
import { sfx } from '../feedback.js';
import { track } from '../analytics.js';
import { currentScreen } from '../router.js';
import { modal, isModalOpen } from './modal.js';
import { playerId, sync } from './leaderboard.js';

const monthName = id => new Date(Number(id.slice(0, 4)), Number(id.slice(5)) - 1, 1).toLocaleDateString(language(), { month: 'long', year: 'numeric' });

/** Call once at startup. Does nothing when no season has ended, offline, or while another dialog is open. */
export async function claimSeasonPrize() {
  if (rollSeason()) persist();
  const last = player.lastSeason;
  if (!last || !playerId) return;
  let result;
  try {
    await sync(); // the server learns the month has turned and keeps the old points
    const res = await fetch('/api/season?' + new URLSearchParams({ key: last.id, id: playerId }), { cache: 'no-store' });
    if (!res.ok) return;
    result = await res.json();
  } catch { return; } // offline: ask again next time
  if (isModalOpen() || currentScreen() !== 'home') return;
  const rank = result.rank || 0, coins = seasonPrize(rank);
  player.lastSeason = null;
  player.st.seasons++;
  awardNewBadges();
  addCoins(coins); // saves
  sfx('win');
  track('season_prize');
  const place = rank ? t('season.place', { rank: num(rank), players: num(result.players) }) : t('season.played');
  modal(`<span class="kick" style="--c:#7b5cff">${monthName(last.id)}</span><h2>${t('season.over')}</h2>
  <p>${place} ${t('season.points', { n: num(last.score) })}</p><div class="gain"><span>${COIN}+${coins}</span></div>
  <p class="note">${t('season.next')}</p><div class="acts"><button class="btn main" data-act="close">${t('collect')}</button></div>`);
}
