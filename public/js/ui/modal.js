// The one modal dialog. Buttons carrying `data-act="name"` close the dialog and then run
// `actions.name` if there is one, so `data-act="close"` is a plain dismiss button.

import { $ } from '../dom.js';
import { t } from '../i18n.js';

let actions = {};
let returnFocus = null; // what had the keyboard focus before the dialog opened

export const isModalOpen = () => $('#modal').classList.contains('on');

export function modal(html, onAction = {}) {
  if (!isModalOpen()) returnFocus = document.activeElement;
  actions = onAction;
  $('#mcard').innerHTML = html;
  $('#modal').classList.add('on');
  // Keyboard users land on the main button; the card itself when there is none to press yet.
  ($('#mcard .btn.main:not(:disabled)') || $('#mcard')).focus({ preventScroll: true });
}

export function closeModal() {
  $('#modal').classList.remove('on');
  if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
  returnFocus = null;
}

/** Asks before something that cannot be undone. `onNo` runs when the player backs out. */
export function confirmDialog(question, yesLabel, onYes, onNo) {
  modal(`<p class="ask">${question}</p>
  <div class="acts"><button class="btn" data-act="no">${t('cancel')}</button><button class="btn main" data-act="yes">${yesLabel}</button></div>`,
  { yes: onYes, no: onNo });
}

export function initModal() {
  $('#modal').addEventListener('click', e => {
    const button = e.target.closest('[data-act]');
    if (!button) return;
    const action = actions[button.dataset.act];
    closeModal();
    action?.();
  });
  // Escape only dismisses dialogs that offer a plain close button.
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && isModalOpen() && $('#mcard [data-act="close"]')) closeModal();
  });
}
