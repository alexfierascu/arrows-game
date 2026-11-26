// Badges: one-off achievements, each worth a coin reward.

import { BADGE_REWARD, BOSSES, LEVELS_PER_WORLD, TOTAL_LEVELS } from './content.js';
import { player, totalStars, bossesBeaten, clearedCount } from './player.js';
import { renderCoins } from './economy.js';
import { today } from './format.js';
import { t } from './i18n.js';

// `progress` returns [current, target]; the badge is earned once current reaches target. It is
// checked after every finished game and whenever something else that counts has happened. Names and descriptions are in the language files, under
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
  { id: 'endless5', progress: () => [Math.max(player.st.endlessBoards, player.endless.boards || 0), 5] },
  { id: 'duel',     progress: () => [player.st.duels, 1] },
  { id: 'race',     progress: () => [player.st.races, 1] },
  { id: 'missions', progress: () => [player.st.missions, 10] },
  { id: 'past',     progress: () => [player.st.past, 5] },
  { id: 'streak7',  progress: () => [player.streak.best, 7] },
  { id: 'season',   progress: () => [player.st.seasons, 1] },
  { id: 'club',     progress: () => [player.club ? 1 : 0, 1] },
];

export const badgeName = badge => t(`badge.${badge.id}.name`);
export const badgeDesc = badge => t(`badge.${badge.id}.desc`);
export const hasBadge = badge => !!player.ach[badge.id];
const isEarned = badge => { const [current, target] = badge.progress(); return current >= target; };
export const badgeCount = () => BADGES.filter(hasBadge).length;

// The player's badges as one number for the public profile: bit i is set when BADGES[i] is
// earned. New badges must be added at the end of the list, or old profiles would change.
export const badgeBits = () => BADGES.reduce((bits, badge, i) => (hasBadge(badge) ? bits | (1 << i) : bits), 0);
export const badgesFromBits = bits => BADGES.filter((badge, i) => bits & (1 << i));

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
