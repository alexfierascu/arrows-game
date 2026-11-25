// The weekly calendar: which event is running, when it ends, and the double-coins weekend.

import { EVENTS } from './content.js';

const DAY_MS = 864e5;

/** The current week (Monday to Sunday, local time). `id` counts weeks, so events rotate in order. */
export function weekInfo() {
  const now = new Date();
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = (day.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(day);
  monday.setDate(day.getDate() - dow);
  const end = new Date(monday);
  end.setDate(monday.getDate() + 7);
  const id = Math.floor((Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()) / DAY_MS + 3) / 7);
  const ev = EVENTS[id % EVENTS.length];
  return { id, ev, end, key: ev.id + '-' + id, next: EVENTS[(id + 1) % EVENTS.length], weekend: dow >= 5 };
}

export const coinMultiplier = () => (weekInfo().weekend ? 2 : 1);
