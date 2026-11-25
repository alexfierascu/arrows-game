// The monthly season: points from every finished game add up until the month ends, then the
// count starts again. It has its own leaderboard, so newer players can reach the top too.

import { player } from './player.js';
import { today } from './format.js';

/** The current month, YYYY-MM (local time). */
export const seasonId = () => today().slice(0, 7);

/** The player's points this month. */
export const seasonScore = () => (player.season.id === seasonId() ? player.season.score : 0);

/** Adds the points of a finished game. The caller saves. */
export function addSeasonPoints(points) {
  player.season = { id: seasonId(), score: seasonScore() + points };
}
