// Reduced motion: on when the player asks for it in Settings or the system asks for it.
// Colour-blind mode: stronger contrast, and patterns instead of colour alone on the board.

import { player } from './player.js';

const systemPreference = matchMedia('(prefers-reduced-motion: reduce)');

export const reducedMotion = () => !!player.rm || systemPreference.matches;

/** Tells the stylesheet about the Settings choice. Call at startup and whenever it changes. */
export function applyMotionSetting() {
  document.documentElement.toggleAttribute('data-reduce-motion', !!player.rm);
}

export function applyContrastSetting() {
  document.documentElement.toggleAttribute('data-contrast', !!player.cb);
}
