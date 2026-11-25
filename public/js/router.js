// Screen switching. Each screen is a <section id="s-NAME">; a screen module registers a
// function that fills it in, so the router never needs to know which screens exist.

import { $$ } from './dom.js';
import { renderCoins } from './economy.js';

const renderers = {};
let current = 'home';

export const currentScreen = () => current;

/** `render(params)` runs every time the screen is shown. */
export function registerScreen(name, render) {
  renderers[name] = render;
}

export function show(name, params) {
  current = name;
  $$('.scr').forEach(s => { s.hidden = s.id !== 's-' + name; });
  renderers[name]?.(params);
  renderCoins();
}

/** Wires every back button: <button data-go="home">. */
export function initNavigation() {
  $$('[data-go]').forEach(b => b.addEventListener('click', () => show(b.dataset.go)));
}
