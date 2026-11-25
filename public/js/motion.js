// Reduced motion: on when the player asks for it in Settings or the system asks for it.

import { player } from './player.js';

const systemPreference = matchMedia('(prefers-reduced-motion: reduce)');

export const reducedMotion = () => !!player.rm || systemPreference.matches;

/** Tells the stylesheet about the Settings choice. Call at startup and whenever it changes. */
export function applyMotionSetting() {
  document.documentElement.toggleAttribute('data-reduce-motion', !!player.rm);
}
