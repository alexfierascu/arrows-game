// The "How to play" dialog, reachable from Settings and from the pause menu.

import { t } from '../i18n.js';
import { modal } from './modal.js';

const RULES = ['help.1', 'help.2', 'help.3', 'help.4', 'help.5', 'help.stars', 'help.keys'];

/** `onClose` runs when the dialog is dismissed, e.g. to return to the menu it was opened from. */
export function openHelp(onClose) {
  modal(`<h2>${t('help.title')}</h2><ol class="rules">${RULES.map(key => `<li>${t(key)}</li>`).join('')}</ol>
  <div class="acts"><button class="btn main" data-act="done">${t('got.it')}</button></div>`,
  { done: onClose });
}
