// Inline SVG snippets used in HTML templates.

/** A 24x24 line icon from its inner SVG markup. */
export const ico = (inner, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24">${inner}</svg>`;

export const LOCK = '<path d="M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4"/>';
export const CHECK = '<path d="M5 12l5 5L20 7"/>';
export const CLOCK = '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>';

export const COIN = '<svg viewBox="0 0 24 24"><use href="#coin"/></svg>';

export const heart = (cls = '') =>
  `<svg class="${cls}" viewBox="0 0 24 24"><path fill="#e5484d" d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z"/></svg>`;

export const star = (on, colour = '#f5b70a') =>
  `<svg viewBox="0 0 24 24"${on ? ' class="got"' : ''}><use href="#star" fill="${on ? colour : 'var(--line)'}"/></svg>`;

/** Three stars, the first `earned` of them lit. */
export const stars = (earned, colour) => [1, 2, 3].map(k => star(earned >= k, colour)).join('');

export const portrait = (boss, cls = 'portrait') =>
  `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true">${boss.svg}</svg>`;
