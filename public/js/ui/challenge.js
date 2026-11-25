// Opens a challenge link: says whose score to beat and on which board, then starts it.

import { esc } from '../dom.js';
import { takeChallenge } from '../challenge.js';
import { num } from '../format.js';
import { t } from '../i18n.js';
import { track } from '../analytics.js';
import { startGame } from '../game/session.js';
import { modal } from './modal.js';

/** Call once at startup. Returns true when the page was opened from a challenge link. */
export function openChallenge() {
  const challenge = takeChallenge();
  if (!challenge) return false;
  const { cfg, score } = challenge, name = challenge.name || t('challenge.friend');
  if (!cfg) {
    modal(`<h2>${t('challenge.title')}</h2><p>${t('challenge.expired')}</p><div class="acts"><button class="btn main" data-act="close">${t('ok')}</button></div>`);
    return true;
  }
  modal(`<span class="kick" style="--c:${cfg.col}">${esc(cfg.resultLabel)}</span><h2>${t('challenge.title')}</h2>
  <p>${esc(t('challenge.text', { name, score: num(score) }))}</p>${cfg.practice ? `<p class="note">${t('challenge.practice')}</p>` : ''}
  <div class="acts"><button class="btn" data-act="close">${t('not.now')}</button><button class="btn main" data-act="play">${t('play')}</button></div>`,
  { play: () => { track('challenge_start'); startGame({ ...cfg, challenge: { name: challenge.name, score } }); } });
  return true;
}
