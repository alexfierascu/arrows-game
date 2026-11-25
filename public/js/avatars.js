// Avatars: an icon on a coloured disc. Stored as one number, icon * 8 + colour, so it fits in a
// single leaderboard column. Players who never picked one get a stable avatar from their id.

import { ico } from './icons.js';

export const AVATAR_ICONS = [
  '<path d="M12 3l2.7 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17.2l-5.6 3.1 1.2-6.3L3 9.6l6.3-.8z"/>',
  '<path d="M12 20s-8-4.6-8-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.8C20 15.4 12 20 12 20z"/>',
  '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 3.5l3 2 3-2M9 20.5l3-2 3 2"/>',
  '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
  '<path d="M4 18h16l1.5-10-5 4L12 5l-4.5 7-5-4z"/>',
  '<path d="M5 12h13M13 6l6 6-6 6"/>',
];
export const AVATAR_COLOURS = ['#2f6bff', '#ff7a1a', '#7b5cff', '#14a5c0', '#e5484d', '#1d9e5b', '#d99a00', '#d6409f'];

const COUNT = AVATAR_ICONS.length * AVATAR_COLOURS.length;

export const avatarCode = (icon, colour) => icon * AVATAR_COLOURS.length + colour;
export const avatarParts = code => [Math.floor(code / AVATAR_COLOURS.length) % AVATAR_ICONS.length, code % AVATAR_COLOURS.length];

/** The avatar to show for a player: their own choice, or one derived from their id. */
export function avatarOf(code, id = '') {
  if (code > 0 && code < COUNT) return code;
  let hash = 0;
  for (const ch of String(id)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % COUNT;
}

export function avatarHtml(code, cls = '') {
  const [icon, colour] = avatarParts(code);
  return `<span class="av ${cls}" style="--c:${AVATAR_COLOURS[colour]}">${ico(AVATAR_ICONS[icon])}</span>`;
}
