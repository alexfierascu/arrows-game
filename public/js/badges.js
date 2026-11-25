// Badges: one-off achievements, each worth a coin reward.

import { BADGE_REWARD, BOSSES, LEVELS_PER_WORLD, TOTAL_LEVELS } from './content.js';
import { player, totalStars, bossesBeaten, clearedCount } from './player.js';
import { renderCoins } from './economy.js';
import { today } from './format.js';
import { t } from './i18n.js';

// `progress` returns [current, target]; the badge is earned once current reaches target. It is
// checked after every finished game. Names and descriptions are in the language files, under
// badge.<id>.name and badge.<id>.desc.
export const BADGES = [
  { id: 'first',    progress: () => [player.st.cleared, 1] },
  { id: 'flawless', progress: () => [player.st.flawless, 1] },
  { id: 'combo5',   progress: () => [player.st.bestCombo, 5] },
  { id: 'speed',    progress: () => [player.st.speed, 1] },
  { id: 'boss1',    progress: () => [bossesBeaten(), 1] },
  { id: 'bossall',  progress: () => [bossesBeaten(), BOSSES.length] },
  { id: 'daily',    progress: () => [player.st.dailies, 1] },
  { id: 'event',    progress: () => [player.st.events, 1] },
  { id: 'rush5',    progress: () => [player.st.rushBest, 5] },
  { id: 'power10',  progress: () => [player.st.powers, 10] },
  { id: 'w3',       progress: () => [clearedCount(), 3 * LEVELS_PER_WORLD] },
  { id: 'w5',       progress: () => [clearedCount(), TOTAL_LEVELS] },
  { id: 'arrows',   progress: () => [player.st.arrows, 1000] },
  { id: 'stars',    progress: () => [totalStars(), 90] },
];

export const badgeName = badge => t(`badge.${badge.id}.name`);
export const badgeDesc = badge => t(`badge.${badge.id}.desc`);
export const hasBadge = badge => !!player.ach[badge.id];
const isEarned = badge => { const [current, target] = badge.progress(); return current >= target; };
export const badgeCount = () => BADGES.filter(hasBadge).length;

/** Awards every badge earned since the last check and returns them. The caller saves. */
export function awardNewBadges() {
  const fresh = BADGES.filter(b => !hasBadge(b) && isEarned(b));
  for (const badge of fresh) {
    player.ach[badge.id] = today();
    player.coins += BADGE_REWARD;
  }
  renderCoins();
  return fresh;
}
