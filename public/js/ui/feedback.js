// "Send feedback" in Settings: a short message for the game's owner (shown on the admin page).

import { $ } from '../dom.js';
import { language, t } from '../i18n.js';
import { track } from '../analytics.js';
import { modal } from './modal.js';
import { sync, credentials } from './leaderboard.js';

const MAX_LENGTH = 1000, MIN_LENGTH = 3;
const HTTP_TOO_MANY = 429;

async function send(onDone) {
  const text = $('#fbText').value.trim(), note = $('#fbNote');
  if (text.length < MIN_LENGTH) { note.textContent = t('feedback.empty'); return; }
  $('#fbSend').disabled = true;
  let status = 0;
  await sync(); // the server only takes messages from players it knows
  try {
    const res = await fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...credentials(), text, lang: language() }) });
    status = res.status;
  } catch { /* offline */ }
  if (status === 200) {
    track('feedback');
    modal(`<h2>${t('feedback.thanks')}</h2><p>${t('feedback.sent')}</p><div class="acts"><button class="btn main" data-act="done">${t('ok')}</button></div>`, { done: onDone });
    return;
  }
  $('#fbSend').disabled = false;
  note.textContent = t(status === HTTP_TOO_MANY ? 'feedback.limit' : 'feedback.failed');
}

/** `onDone` runs when the dialog is left, e.g. to return to Settings. */
export function openFeedback(onDone) {
  modal(`<h2>${t('feedback')}</h2><p>${t('feedback.text')}</p>
  <textarea id="fbText" class="ta" maxlength="${MAX_LENGTH}" rows="5" aria-label="${t('feedback')}"></textarea><p class="note" id="fbNote" role="status"></p>
  <div class="acts"><button class="btn" data-act="back">${t('back')}</button><button class="btn main" id="fbSend" type="button">${t('send')}</button></div>`,
  { back: onDone });
  $('#fbSend').onclick = () => send(onDone);
  $('#fbText').focus();
}
