// Small flag drawings for the language menu, keyed by language code. Drawn as SVG because flag
// emoji do not show on every system. All share a 30 x 20 canvas; details such as coats of arms
// are left out at this size.

const bands = (direction, colours) => colours.map((colour, i) => direction === 'vertical'
  ? `<rect x="${i * 30 / colours.length}" width="${30 / colours.length}" height="20" fill="${colour}"/>`
  : `<rect y="${i * 20 / colours.length}" width="30" height="${20 / colours.length}" fill="${colour}"/>`).join('');

const GREEK_BLUE = '#0d5eaf';

const FLAGS = {
  // United Kingdom
  en: '<rect width="30" height="20" fill="#012169"/>'
    + '<path d="M0 0l30 20M30 0L0 20" stroke="#fff" stroke-width="4"/>'
    + '<path d="M0 0l30 20M30 0L0 20" stroke="#c8102e" stroke-width="1.6"/>'
    + '<path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6.6"/>'
    + '<path d="M15 0v20M0 10h30" stroke="#c8102e" stroke-width="4"/>',
  es: '<rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/>',
  fr: bands('vertical', ['#0055a4', '#fff', '#ef4135']),
  it: bands('vertical', ['#009246', '#fff', '#ce2b37']),
  de: bands('horizontal', ['#000', '#dd0000', '#ffce00']),
  ro: bands('vertical', ['#002b7f', '#fcd116', '#ce1126']),
  // Greece: nine stripes and a white cross on a blue square
  el: bands('horizontal', [GREEK_BLUE, '#fff', GREEK_BLUE, '#fff', GREEK_BLUE, '#fff', GREEK_BLUE, '#fff', GREEK_BLUE])
    + `<rect width="11.1" height="11.1" fill="${GREEK_BLUE}"/><path d="M5.55 0v11.1M0 5.55h11.1" stroke="#fff" stroke-width="2.2"/>`,
  pl: bands('horizontal', ['#fff', '#dc143c']),
};

/** The flag for a language code, as an SVG string. */
export const flag = code => `<svg class="flag" viewBox="0 0 30 20" aria-hidden="true">${FLAGS[code] || ''}</svg>`;
