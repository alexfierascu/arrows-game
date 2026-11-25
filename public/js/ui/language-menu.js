// The language menu: a pop-up list of languages with their flags. Any button carrying
// `data-lang-menu` opens it, so the same menu serves the home screen and the Settings dialog.

import { esc } from '../dom.js';
import { t, language, setLanguage, LANGUAGES } from '../i18n.js';
import { flag } from '../flags.js';
import { ico, CHECK } from '../icons.js';

const GAP = 6;     // pixels between the button and the menu
const MARGIN = 8;  // pixels kept free at the screen edges

let menu = null;   // the open menu element
let opener = null; // the button that opened it

/** What goes inside a button that opens the menu: the current flag, optionally with its name. */
export const languageButtonContent = (withName = false) =>
  flag(language()) + (withName ? `<span>${esc(LANGUAGES[language()])}</span>` : '');

const optionHtml = ([code, name]) => {
  const current = code === language();
  return `<button type="button" role="option" aria-selected="${current}" data-lang="${code}" lang="${code}">${flag(code)}<span>${esc(name)}</span>${current ? ico(CHECK) : ''}</button>`;
};

function close() {
  if (!menu) return;
  menu.remove();
  opener.setAttribute('aria-expanded', 'false');
  menu = opener = null;
}

/** Places the menu under the button, right-aligned, or above it when there is no room below. */
function place() {
  const button = opener.getBoundingClientRect(), { offsetWidth: width, offsetHeight: height } = menu;
  const left = Math.max(MARGIN, Math.min(button.right - width, innerWidth - width - MARGIN));
  const below = button.bottom + GAP, above = button.top - GAP - height;
  const top = below + height <= innerHeight - MARGIN || above < MARGIN ? below : above;
  menu.style.left = left + 'px';
  menu.style.top = Math.max(MARGIN, Math.min(top, innerHeight - height - MARGIN)) + 'px';
}

function open(button) {
  close();
  opener = button;
  menu = document.createElement('div');
  menu.className = 'langmenu';
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', t('language'));
  menu.innerHTML = Object.entries(LANGUAGES).map(optionHtml).join('');
  document.body.appendChild(menu);
  opener.setAttribute('aria-expanded', 'true');
  place();
  menu.querySelector('[aria-selected="true"]')?.focus();
}

function onClick(e) {
  const option = e.target.closest('[data-lang]');
  if (option) {
    const code = option.dataset.lang;
    close();
    if (code !== language()) setLanguage(code);
    return;
  }
  const button = e.target.closest('[data-lang-menu]');
  if (button && button !== opener) open(button);
  else close(); // a click anywhere else, or on the same button again
}

export function initLanguageMenu() {
  document.addEventListener('click', onClick);
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  addEventListener('resize', close);
  for (const button of document.querySelectorAll('[data-lang-menu]')) {
    button.innerHTML = languageButtonContent();
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
  }
}
