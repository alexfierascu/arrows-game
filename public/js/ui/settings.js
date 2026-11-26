// Settings dialog: sound, music, vibration, motion, contrast, reminder, language, install,
// privacy, help and the progress reset.

import { $, $$ } from '../dom.js';
import { player, persist, resetProgress } from '../player.js';
import { show } from '../router.js';
import { t } from '../i18n.js';
import { applyMotionSetting, applyContrastSetting } from '../motion.js';
import { applyMusicSetting } from '../music.js';
import { canInstall, install, canRemind, setReminder } from '../pwa.js';
import { languageButtonContent } from './language-menu.js';
import { openHelp } from './help.js';
import { modal, closeModal } from './modal.js';
import { openFeedback } from './feedback.js';

// Each switch flips a boolean of the same name in the save data.
// A third entry is a line of small print under the label.
const SWITCHES = [['snd', 'sound'], ['mus', 'music'], ['hap', 'vibration'], ['rm', 'motion'], ['cb', 'contrast'], ['relax', 'relax', 'relax.about'], ['stats', 'usage.stats']];
const PRIVACY_PARAGRAPHS = 7;

const switchHtml = ([key, label, about]) =>
  `<div class="set"><span>${t(label)}${about ? `<small class="note" style="display:block;margin:0">${t(about)}</small>` : ''}</span><button class="sw ${player[key] ? 'on' : ''}" data-switch="${key}" aria-label="${t(label)}"></button></div>`;

// The button opens the shared language menu (see language-menu.js).
const languageHtml = () =>
  `<div class="set"><span>${t('language')}</span><button class="btn langbtn" data-lang-menu aria-haspopup="listbox" aria-expanded="false">${languageButtonContent(true)}</button></div>`;

function toggle(button) {
  const key = button.dataset.switch;
  player[key] = !player[key];
  persist();
  button.classList.toggle('on', player[key]);
  applyMotionSetting();
  applyContrastSetting();
  applyMusicSetting();
}

// The reminder needs the browser's permission, so its switch only moves once that is settled.
const reminderHtml = () => (canRemind() ?
  `<div class="set"><span>${t('remind')}<small class="note" id="sRemindNote" style="display:block;margin:0"></small></span><button class="sw ${player.remind ? 'on' : ''}" id="sRemind" aria-label="${t('remind')}"></button></div>` : '');

async function toggleReminder(button) {
  const wanted = !player.remind;
  button.disabled = true;
  const on = await setReminder(wanted);
  button.disabled = false;
  button.classList.toggle('on', on);
  $('#sRemindNote').textContent = wanted && !on ? t('remind.blocked') : on ? t('remind.on') : '';
}

const installHtml = () => (canInstall() ?
  `<div class="set"><span>${t('install')}</span><button class="btn" id="sInstall">${t('install.go')}</button></div>` : '');

function openPrivacy() {
  const paragraphs = Array.from({ length: PRIVACY_PARAGRAPHS }, (_, i) => `<p class="legal">${t('privacy.' + (i + 1))}</p>`).join('');
  modal(`<h2>${t('privacy')}</h2>${paragraphs}<div class="acts"><button class="btn main" data-act="back">${t('back')}</button></div>`, { back: openSettings });
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
  modal(`<h2>${t('settings')}</h2>${SWITCHES.map(switchHtml).join('')}${reminderHtml()}${languageHtml()}${installHtml()}
  <div class="set"><span>${t('feedback')}</span><button class="btn" id="sFeedback">${t('feedback.write')}</button></div>
  <div class="set"><span>${t('reset.label')}</span><button class="btn" id="sReset">${t('reset')}</button></div><div class="acts"><button class="btn" data-act="help">${t('help.title')}</button><button class="btn" data-act="privacy">${t('privacy')}</button><button class="btn main" data-act="close">${t('done')}</button></div>`,
  { help: () => openHelp(openSettings), privacy: openPrivacy });
  $$('#mcard [data-switch]').forEach(b => { b.onclick = () => toggle(b); });
  if ($('#sRemind')) $('#sRemind').onclick = e => toggleReminder(e.currentTarget);
  if ($('#sInstall')) $('#sInstall').onclick = () => { closeModal(); install(); };
  $('#sFeedback').onclick = () => openFeedback(openSettings);
  $('#sReset').onclick = e => confirmReset(e.currentTarget);
}
