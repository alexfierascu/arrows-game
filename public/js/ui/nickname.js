// Asks for a leaderboard name inside a result dialog, once: players who already have a name
// never see it. While the field is empty the dialog's buttons stay disabled, so it cannot be
// skipped.

import { $, $$ } from '../dom.js';
import { player } from '../player.js';
import { NICK_MAX_LENGTH, cleanNick, setNick } from './leaderboard.js';

/** The name field for a dialog, or nothing when the player already has a name. */
export const nickFieldHtml = () => (player.nick ? '' :
  `<div class="nickask"><label for="askNick">Choose a name for the leaderboard</label><input id="askNick" maxlength="${NICK_MAX_LENGTH}" placeholder="Your player name" autocomplete="off" autocapitalize="words" enterkeyhint="done"></div>`);

/** Call right after opening a dialog that contains nickFieldHtml(). */
export function armNickField() {
  const input = $('#askNick');
  if (!input) return;
  const buttons = $$('#mcard [data-act]');
  const update = () => {
    const missing = !cleanNick(input.value);
    for (const b of buttons) b.disabled = missing;
  };
  // Runs before the dialog handles the click, so the name is saved whichever button is used.
  for (const b of buttons) b.addEventListener('click', () => setNick(input.value));
  input.addEventListener('input', update);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
  update();
}
