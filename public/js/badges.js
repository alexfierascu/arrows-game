// Badges: one-off achievements, each worth a coin reward.

import { BADGE_REWARD, BOSSES, LEVELS_PER_WORLD, TOTAL_LEVELS } from './content.js';
import { player, totalStars, bossesBeaten } from './player.js';
import { renderCoins } from './economy.js';
import { today } from './format.js';

// `earned` is checked after every finished game.
export const BADGES = [
  { id: 'first',    name: 'First escape',   desc: 'Clear your first level',                 earned: () => player.st.cleared >= 1 },
  { id: 'flawless', name: 'Flawless',       desc: 'Clear a level without losing a heart',   earned: () => player.st.flawless >= 1 },
  { id: 'combo5',   name: 'On fire',        desc: 'Reach a ×5 combo',                       earned: () => player.st.bestCombo >= 5 },
  { id: 'speed',    name: 'Speedster',      desc: 'Finish with half the clock left',        earned: () => player.st.speed >= 1 },
  { id: 'boss1',    name: 'Boss slayer',    desc: 'Defeat your first boss',                 earned: () => bossesBeaten() >= 1 },
  { id: 'bossall',  name: 'Nemesis',        desc: 'Defeat all 5 bosses',                    earned: () => bossesBeaten() >= BOSSES.length },
  { id: 'daily',    name: 'Daily player',   desc: 'Finish a daily challenge',               earned: () => player.st.dailies >= 1 },
  { id: 'event',    name: 'Event champion', desc: 'Finish all 5 stages of an event',        earned: () => player.st.events >= 1 },
  { id: 'rush5',    name: 'Speed demon',    desc: 'Clear 5 boards in one Time Attack run',  earned: () => player.st.rushBest >= 5 },
  { id: 'power10',  name: 'Power user',     desc: 'Use 10 superpowers',                     earned: () => player.st.powers >= 10 },
  { id: 'w3',       name: 'Night owl',      desc: 'Finish World 3',                         earned: () => !!player.lv[3 * LEVELS_PER_WORLD] },
  { id: 'w5',       name: 'Grandmaster',    desc: 'Finish all 5 worlds',                    earned: () => !!player.lv[TOTAL_LEVELS] },
  { id: 'arrows',   name: 'Arrow wrangler', desc: 'Send 1,000 arrows off the board',        earned: () => player.st.arrows >= 1000 },
  { id: 'stars',    name: 'Star collector', desc: 'Collect 90 stars',                       earned: () => totalStars() >= 90 },
];

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
