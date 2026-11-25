// Sharing a result: the phone's share sheet where there is one, otherwise the clipboard.
// The link carries the player's name so that whoever opens it gets them as a friend.

import { t } from '../i18n.js';
import { num } from '../format.js';
import { player } from '../player.js';
import { track } from '../analytics.js';

/** The game's address, with an invitation to befriend this player if they have a name. */
export const inviteLink = () => location.origin + '/' + (player.nick ? '?friend=' + encodeURIComponent(player.nick) : '');

/** Shares "I scored ... on ..." with the invite link. Resolves to 'shared', 'copied' or 'failed'. */
export async function shareResult(label, score) {
  const text = t('share.text', { score: num(score), label }), url = inviteLink();
  track('share');
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Arrows Escape', text, url });
      return 'shared';
    }
    await navigator.clipboard.writeText(text + ' ' + url);
    return 'copied';
  } catch { return 'failed'; } // the player closed the share sheet, or the clipboard is blocked
}

const SHARE_ICON = '<svg class="i" viewBox="0 0 24 24"><path d="M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';

/** A share button for a result dialog; wire it with armShareButton after the dialog opens. */
export const shareButtonHtml = () => `<button class="btn share" id="shareBtn" type="button">${SHARE_ICON}<span>${t('share')}</span></button>`;

export function armShareButton(label, score) {
  const button = document.getElementById('shareBtn');
  if (!button) return;
  button.onclick = async () => {
    if (await shareResult(label, score) === 'copied') button.querySelector('span').textContent = t('share.copied');
  };
}
