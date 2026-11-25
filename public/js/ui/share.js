// Sharing a result: a picture card plus a challenge link through the phone's share sheet, or
// the text and link on the clipboard where there is no share sheet. Whoever opens the link is
// asked to beat the score on the same board, and gets the sender as a friend (see challenge.js).

import { t } from '../i18n.js';
import { num } from '../format.js';
import { player } from '../player.js';
import { challengeLink } from '../challenge.js';
import { track } from '../analytics.js';

const CARD_SIZE = 1080, FONT = '"Baloo 2", system-ui, sans-serif';
const INK = '#161b3d', GOLD = '#f5b70a';

/** Draws the result as a square picture. Resolves to a PNG file. */
function resultCard(cfg, label, score, stars) {
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d'), mid = CARD_SIZE / 2;
  canvas.width = canvas.height = CARD_SIZE;
  const line = (text, y, size, colour = INK) => {
    ctx.font = `800 ${size}px ${FONT}`;
    ctx.fillStyle = colour;
    ctx.fillText(text, mid, y, CARD_SIZE - 220);
  };
  ctx.fillStyle = cfg.col;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.roundRect(70, 70, CARD_SIZE - 140, CARD_SIZE - 140, 70);
  ctx.fill();
  ctx.textAlign = 'center';
  line('Arrows Escape', 220, 84);
  line(label, 330, 58, cfg.col);
  line(num(score), 590, 230);
  if (stars) line('★'.repeat(stars) + '☆'.repeat(3 - stars), 720, 110, GOLD);
  if (player.nick) line(player.nick, 830, 60);
  line(t('share.dare'), 920, 50, '#5b6385');
  line(location.host, 985, 34, '#5b6385');
  return new Promise((resolve, reject) => canvas.toBlob(
    blob => (blob ? resolve(new File([blob], 'arrows-escape.png', { type: 'image/png' })) : reject(new Error('no image'))), 'image/png'));
}

/** Shares a finished game. Resolves to 'shared', 'copied' or 'failed'. */
export async function shareResult(cfg, score, stars = 0) {
  const label = cfg.resultLabel || cfg.title;
  const text = t('share.text', { score: num(score), label }), url = challengeLink(cfg, score);
  track('share');
  try {
    if (navigator.share) {
      const card = await resultCard(cfg, label, score, stars).catch(() => null);
      const files = card && navigator.canShare?.({ files: [card] }) ? [card] : undefined;
      await navigator.share({ title: 'Arrows Escape', text, url, files });
      return 'shared';
    }
    await navigator.clipboard.writeText(text + ' ' + url);
    return 'copied';
  } catch { return 'failed'; } // the player closed the share sheet, or the clipboard is blocked
}

const SHARE_ICON = '<svg class="i" viewBox="0 0 24 24"><path d="M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';

/** A share button for a result dialog; wire it with armShareButton after the dialog opens. */
export const shareButtonHtml = () => `<button class="btn share" id="shareBtn" type="button">${SHARE_ICON}<span>${t('share.challenge')}</span></button>`;

export function armShareButton(cfg, score, stars) {
  const button = document.getElementById('shareBtn');
  if (!button) return;
  button.onclick = async () => {
    if (await shareResult(cfg, score, stars) === 'copied') button.querySelector('span').textContent = t('share.copied');
  };
}
