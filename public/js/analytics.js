// Anonymous usage counts. Each call adds one to today's total for that event on the server
// (see postEvent in src/worker.js). Nothing identifies the player: no id, no cookie, no name.
// Nothing is sent when the player switches it off in Settings or the browser asks not to be tracked.

import { player } from './player.js';
import { today } from './format.js';

const VISIT_KEY = 'ae-last-visit'; // the last day this browser was counted as a visit

const optedOut = () => player.stats === false || navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;

/** Counts one event. The name must be listed in EVENT_NAMES in src/worker.js. */
export function track(name) {
  if (optedOut()) return;
  try {
    fetch('/api/event', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name }), keepalive: true })
      .catch(() => { /* offline: the count is simply lost */ });
  } catch { /* fetch unavailable */ }
}

/** Counts this browser once per day, and once ever as a new player. */
export function trackVisit() {
  try {
    const last = localStorage.getItem(VISIT_KEY);
    if (last === today()) return;
    localStorage.setItem(VISIT_KEY, today());
    if (!last) track('new_player');
    track('visit');
  } catch { /* storage blocked: do not count */ }
}
