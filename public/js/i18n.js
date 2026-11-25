// Languages. Every text the player sees lives in a file under lang/, one per language, with the
// same shape as lang/en.js. English is always loaded and fills in anything a translation lacks.
//
// Adding a language: copy lang/en.js to lang/<code>.js, translate the values, and add the code
// and its own name to LANGUAGES below.

import { $$ } from './dom.js';
import { WORLDS, BOSSES, ATTACKS, POWERS, EVENTS } from './content.js';
import english from './lang/en.js';

export const LANGUAGES = {
  en: 'English', es: 'Español', fr: 'Français', it: 'Italiano',
  de: 'Deutsch', ro: 'Română', el: 'Ελληνικά', pl: 'Polski',
};
const FALLBACK = 'en';
const STORAGE_KEY = 'ae-lang'; // kept apart from the save data so a progress reset keeps it

let code = FALLBACK;
let texts = english.ui;
let plurals = new Intl.PluralRules(FALLBACK);

export const language = () => code;

/** The player's saved choice, else the first browser language the game speaks, else English. */
function preferred() {
  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* storage blocked */ }
  const wanted = [saved, ...(navigator.languages || [navigator.language])].filter(Boolean);
  return wanted.map(tag => tag.slice(0, 2).toLowerCase()).find(tag => tag in LANGUAGES) || FALLBACK;
}

/** Saves the choice and reloads the page, which is the simplest way to redraw every screen. */
export function setLanguage(next) {
  try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage blocked */ }
  location.reload();
}

/**
 * The text for `key`, with {placeholders} filled from `params`. A text can also be a set of
 * plural forms ({ one, few, many, other }, as named by Intl.PluralRules), chosen by `params.n`.
 */
export function t(key, params = {}) {
  let text = texts[key] ?? english.ui[key] ?? key;
  if (typeof text === 'object') text = text[plurals.select(Number(params.n))] ?? text.other;
  return text.replace(/\{(\w+)\}/g, (whole, name) => (name in params ? params[name] : whole));
}

/** Gives the game content (worlds, bosses, powers...) its names and descriptions. */
function nameContent(lang) {
  const byIndex = (items, named = []) => items.forEach((item, i) => Object.assign(item, named[i]));
  const byId = (items, named = {}) => items.forEach(item => Object.assign(item, named[item.id]));
  byIndex(WORLDS, lang.worlds);
  byIndex(BOSSES, lang.bosses);
  byId(POWERS, lang.powers);
  byId(EVENTS, lang.events);
  for (const [id, named] of Object.entries(lang.attacks || {})) Object.assign(ATTACKS[id], named);
}

/** Fills in the texts written into index.html: data-i18n, -label, -placeholder and -title. */
function translatePage() {
  const each = (attribute, apply) => $$(`[${attribute}]`).forEach(el => apply(el, t(el.getAttribute(attribute))));
  each('data-i18n', (el, text) => { el.textContent = text; });
  each('data-i18n-label', (el, text) => el.setAttribute('aria-label', text));
  each('data-i18n-placeholder', (el, text) => el.setAttribute('placeholder', text));
  each('data-i18n-title', (el, text) => el.setAttribute('title', text));
}

/** Loads the player's language. Must finish before any screen is drawn. */
export async function initLanguage() {
  code = preferred();
  nameContent(english);
  if (code !== FALLBACK) {
    try {
      const { default: lang } = await import(`./lang/${code}.js`);
      texts = lang.ui;
      nameContent(lang);
      plurals = new Intl.PluralRules(code);
    } catch { code = FALLBACK; } // the file failed to load: stay in English
  }
  document.documentElement.lang = code;
  translatePage();
}
