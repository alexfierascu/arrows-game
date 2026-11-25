// The dialog for choosing an avatar: one row of icons, one row of colours.

import { $, $$ } from '../dom.js';
import { t } from '../i18n.js';
import { ico } from '../icons.js';
import { AVATAR_ICONS, AVATAR_COLOURS, avatarCode, avatarParts, avatarHtml } from '../avatars.js';
import { modal } from './modal.js';

/** `current` is the avatar shown now; `onPick(code)` runs when the player confirms. */
export function openAvatarPicker(current, onPick) {
  let [icon, colour] = avatarParts(current);
  const icons = AVATAR_ICONS.map((inner, i) => `<button type="button" class="opt" data-icon="${i}">${ico(inner)}</button>`).join('');
  const colours = AVATAR_COLOURS.map((c, i) => `<button type="button" class="opt dot" data-colour="${i}" style="--c:${c}"></button>`).join('');
  modal(`<h2>${t('avatar.pick')}</h2><div id="avPreview"></div>
  <div class="opts">${icons}</div><div class="opts">${colours}</div>
  <div class="acts"><button class="btn" data-act="close">${t('cancel')}</button><button class="btn main" data-act="save">${t('save')}</button></div>`,
  { save: () => onPick(avatarCode(icon, colour)) });

  const refresh = () => {
    $('#avPreview').innerHTML = avatarHtml(avatarCode(icon, colour), 'big');
    $$('#mcard [data-icon]').forEach(b => b.classList.toggle('on', +b.dataset.icon === icon));
    $$('#mcard [data-colour]').forEach(b => b.classList.toggle('on', +b.dataset.colour === colour));
  };
  $$('#mcard [data-icon]').forEach(b => { b.onclick = () => { icon = +b.dataset.icon; refresh(); }; });
  $$('#mcard [data-colour]').forEach(b => { b.onclick = () => { colour = +b.dataset.colour; refresh(); }; });
  refresh();
}
