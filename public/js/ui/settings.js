// Settings dialog: sound, vibration, motion, language, help and the progress reset.

import { $, $$ } from '../dom.js';
import { player, persist, resetProgress } from '../player.js';
import { show } from '../router.js';
import { t } from '../i18n.js';
import { applyMotionSetting } from '../motion.js';
import { languageButtonContent } from './language-menu.js';
import { openHelp } from './help.js';
import { modal, closeModal } from './modal.js';

// Each switch flips a boolean of the same name in the save data.
const SWITCHES = [['snd', 'sound'], ['hap', 'vibration'], ['rm', 'motion']];

const switchHtml = ([key, label]) =>
  `<div class="set"><span>${t(label)}</span><button class="sw ${player[key] ? 'on' : ''}" data-switch="${key}" aria-label="${t(label)}"></button></div>`;

// The button opens the shared language menu (see language-menu.js).
const languageHtml = () =>
  `<div class="set"><span>${t('language')}</span><button class="btn langbtn" data-lang-menu aria-haspopup="listbox" aria-expanded="false">${languageButtonContent(true)}</button></div>`;

function toggle(button) {
  const key = button.dataset.switch;
  player[key] = !player[key];
  persist();
  button.classList.toggle('on', player[key]);
  applyMotionSetting();
}

// The first tap arms the button, the second one resets.
function confirmReset(button) {
  if (!button.dataset.sure) {
    button.dataset.sure = 1;
    button.textContent = t('reset.confirm');
    button.style.borderColor = '#e5484d';
    return;
  }
  resetProgress();
  closeModal();
  show('home');
}

export function openSettings() {
  modal(`<h2>${t('settings')}</h2>${SWITCHES.map(switchHtml).join('')}${languageHtml()}
  <div class="set"><span>${t('reset.label')}</span><button class="btn" id="sReset" style="min-height:40px">${t('reset')}</button></div><div class="acts"><button class="btn" data-act="help">${t('help.title')}</button><button class="btn main" data-act="close">${t('done')}</button></div>`,
  { help: () => openHelp(openSettings) });
  $$('#mcard [data-switch]').forEach(b => { b.onclick = () => toggle(b); });
  $('#sReset').onclick = e => confirmReset(e.currentTarget);
}
