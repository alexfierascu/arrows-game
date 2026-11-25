// Small DOM helpers.

export const $ = sel => document.querySelector(sel);
export const $$ = sel => [...document.querySelectorAll(sel)];

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = s => String(s).replace(/[&<>"']/g, c => HTML_ESCAPES[c]);

/**
 * Delegated click handling for lists that are re-rendered: clicks inside `rootSel` on an
 * element carrying `data-<key>` call `handler(value of that attribute, element)`.
 */
export function onDataClick(rootSel, key, handler) {
  $(rootSel).addEventListener('click', e => {
    const el = e.target.closest(`[data-${key}]`);
    if (el) handler(el.dataset[key], el);
  });
}
