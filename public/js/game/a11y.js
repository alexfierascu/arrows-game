// Spoken feedback for screen readers: short texts written into a live region the browser
// reads aloud. Sighted players never see it.

import { $ } from '../dom.js';
import { t } from '../i18n.js';
import { rayInfo } from './arrows.js';

const DIRECTIONS = ['dir.right', 'dir.down', 'dir.left', 'dir.up']; // by arrow.dir, see grid.js

/** Has the screen reader say `text`. */
export function say(text) {
  const region = $('#sr');
  if (!region) return;
  // The same text twice in a row would not be read again without the reset.
  region.textContent = '';
  setTimeout(() => { region.textContent = text; }, 30);
}

/** One arrow in words: where it points, how long it is, where its head is and whether it can leave. */
export function describeArrow(a) {
  const [x, y] = a.pts[a.pts.length - 1];
  const state = a.ice ? t('sr.ice') : rayInfo(a).free ? t('sr.free') : t('sr.blocked');
  return t('sr.arrow', { dir: t(DIRECTIONS[a.dir]), n: a.pts.length, row: y + 1, col: x + 1, state }) + (a.gold ? ' ' + t('sr.gold') : '');
}
