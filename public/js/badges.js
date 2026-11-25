// Badges: one-off achievements, each worth a coin reward.

import { BADGE_REWARD, BOSSES, LEVELS_PER_WORLD, TOTAL_LEVELS } from './content.js';
import { player, totalStars, bossesBeaten } from './player.js';
import { renderCoins } from './economy.js';
import { today } from './format.js';
import { t } from './i18n.js';

// `earned` is checked after every finished game. Names and descriptions are in the language
// files, under badge.<id>.name and badge.<id>.desc.
export const BADGES = [
  { id: 'first',    earned: () => player.st.cleared >= 1 },
  { id: 'flawless', earned: () => player.st.flawless >= 1 },
  { id: 'combo5',   earned: () => player.st.bestCombo >= 5 },
  { id: 'speed',    earned: () => player.st.speed >= 1 },
  { id: 'boss1',    earned: () => bossesBeaten() >= 1 },
  { id: 'bossall',  earned: () => bossesBeaten() >= BOSSES.length },
  { id: 'daily',    earned: () => player.st.dailies >= 1 },
  { id: 'event',    earned: () => player.st.events >= 1 },
  { id: 'rush5',    earned: () => player.st.rushBest >= 5 },
  { id: 'power10',  earned: () => player.st.powers >= 10 },
  { id: 'w3',       earned: () => !!player.lv[3 * LEVELS_PER_WORLD] },
  { id: 'w5',       earned: () => !!player.lv[TOTAL_LEVELS] },
  { id: 'arrows',   earned: () => player.st.arrows >= 1000 },
  { id: 'stars',    earned: () => totalStars() >= 90 },
];

export const badgeName = badge => t(`badge.${badge.id}.name`);
export const badgeDesc = badge => t(`badge.${badge.id}.desc`);
export const hasBadge = badge => !!player.ach[badge.id];
export const badgeCount = () => BADGES.filter(hasBadge).length;

/** Awards every badge earned since the last check and returns them. The caller saves. */
export function awardNewBadges() {
  const fresh = BADGES.filter(b => !hasBadge(b) && b.earned());
  for (const badge of fresh) {
    player.ach[badge.id] = today();
    player.coins += BADGE_REWARD;
  }
  renderCoins();
  return fresh;
}
