// The one modal dialog. Buttons carrying `data-act="name"` close the dialog and then run
// `actions.name` if there is one, so `data-act="close"` is a plain dismiss button.

import { $ } from '../dom.js';

let actions = {};

export function modal(html, onAction = {}) {
  actions = onAction;
  $('#mcard').innerHTML = html;
  $('#modal').classList.add('on');
}

export function closeModal() {
  $('#modal').classList.remove('on');
}

export const isModalOpen = () => $('#modal').classList.contains('on');

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
