// The monthly season: points from every finished game add up until the month ends, then the
// count starts again. It has its own leaderboard, so newer players can reach the top too.
// A finished season is kept once as `player.lastSeason` until its prize has been collected.

import { player } from './player.js';
import { today } from './format.js';

/** The current month, YYYY-MM (local time). */
export const seasonId = () => today().slice(0, 7);

/** Starts a new season when the month has changed. Returns whether it did. The caller saves. */
export function rollSeason() {
  const { id, score } = player.season;
  if (id === seasonId()) return false;
  if (id && score > 0) player.lastSeason = { id, score };
  player.season = { id: seasonId(), score: 0 };
  return true;
}

/** The player's points this month. */
export const seasonScore = () => (player.season.id === seasonId() ? player.season.score : 0);

/** Adds the points of a finished game. The caller saves. */
export function addSeasonPoints(points) {
  rollSeason();
  player.season.score += points;
}

// Coins by final rank; everyone who scored gets the last one.
const PRIZES = [[1, 500], [3, 300], [10, 150]];
const PARTICIPATION_PRIZE = 50;

/** Coins for finishing a season in place `rank` (0: the rank is not known). */
export const seasonPrize = rank => (rank > 0 && PRIZES.find(([top]) => rank <= top)?.[1]) || PARTICIPATION_PRIZE;
