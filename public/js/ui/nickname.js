// Asks for a leaderboard name inside a result dialog, once: players who already have a name
// never see it. The dialog's buttons only work once a name is entered and the server has
// accepted it (it must be free and not offensive), so the question cannot be skipped.

import { $, $$ } from '../dom.js';
import { player } from '../player.js';
import { t } from '../i18n.js';
import { NICK_MAX_LENGTH, cleanNick, claimNick } from './leaderboard.js';

/** The name field for a dialog, or nothing when the player already has a name. */
export const nickFieldHtml = () => (player.nick ? '' :
  `<div class="nickask"><label for="askNick" id="askNickLabel">${t('nick.ask')}</label><input id="askNick" maxlength="${NICK_MAX_LENGTH}" placeholder="${t('nick.placeholder')}" autocomplete="off" autocapitalize="words" enterkeyhint="done"></div>`);

/** Call right after opening a dialog that contains nickFieldHtml(). */
export function armNickField() {
  const input = $('#askNick');
  if (!input) return;
  const label = $('#askNickLabel'), buttons = $$('#mcard [data-act]');
  let confirmed = false, checking = false;

  const setMessage = (text, isError) => {
    label.textContent = text;
    label.classList.toggle('err', isError);
  };
  const update = () => {
    const blocked = checking || !cleanNick(input.value);
    for (const b of buttons) b.disabled = blocked;
  };

  // The first click on any button claims the name instead of acting. Once the server accepts
  // it, the same button is clicked again and the dialog handles it as usual.
  async function onButton(e) {
    if (confirmed) return;
    const button = e.currentTarget;
    e.stopPropagation();
    checking = true;
    update();
    setMessage(t('nick.checking'), false);
    const refused = await claimNick(input.value);
    confirmed = !refused;
    checking = false;
    if (confirmed) { button.disabled = false; button.click(); return; }
    setMessage(t(refused), true);
    for (const b of buttons) b.disabled = true; // until the name is edited
  }

  for (const b of buttons) b.addEventListener('click', onButton);
  input.addEventListener('input', () => { setMessage(t('nick.ask'), false); update(); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
  update();
  $('#mcard').focus({ preventScroll: true }); // the buttons are disabled for now: do not leave focus on one
}
