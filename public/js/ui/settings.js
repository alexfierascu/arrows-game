// Settings dialog: sound, vibration and the progress reset.

import { $, $$ } from '../dom.js';
import { player, persist, resetProgress } from '../player.js';
import { show } from '../router.js';
import { modal, closeModal } from './modal.js';

// Each switch flips a boolean of the same name in the save data.
const SWITCHES = [['snd', 'Sound'], ['hap', 'Vibration']];

const switchHtml = ([key, label]) =>
  `<div class="set"><span>${label}</span><button class="sw ${player[key] ? 'on' : ''}" data-switch="${key}" aria-label="${label}"></button></div>`;

function toggle(button) {
  const key = button.dataset.switch;
  player[key] = !player[key];
  persist();
  button.classList.toggle('on', player[key]);
}

// The first tap arms the button, the second one resets.
function confirmReset(button) {
  if (!button.dataset.sure) {
    button.dataset.sure = 1;
    button.textContent = 'Tap again to confirm';
    button.style.borderColor = '#e5484d';
    return;
  }
  resetProgress();
  closeModal();
  show('home');
}

export function openSettings() {
  modal(`<h2>Settings</h2>${SWITCHES.map(switchHtml).join('')}
  <div class="set"><span>Reset all progress</span><button class="btn" id="sReset" style="min-height:40px">Reset</button></div><div class="acts"><button class="btn main" data-act="close">Done</button></div>`);
  $$('#mcard [data-switch]').forEach(b => { b.onclick = () => toggle(b); });
  $('#sReset').onclick = e => confirmReset(e.currentTarget);
}
