// Draws the board on the canvas: grid dots, arrows, boss fog and the lamp on dark boards.

import { $ } from '../dom.js';
import { DX, DY } from '../grid.js';
import { game } from './state.js';
import { view, toScreen, resize, fit } from './view.js';
import { pointAt, canLeave } from './arrows.js';
import { requestFrame } from './frame.js';
import { cursorArrow } from './keyboard.js';
import { activeSkin } from '../skins.js';
import { player } from '../player.js';

const canvas = $('#cv'), ctx = canvas.getContext('2d');
const FULL_CIRCLE = Math.PI * 2;

// Palette. Ink, dot and paper follow the page theme, except on dark boards.
const NIGHT = { ink: '#e7e9ff', dot: '#2a3060', paper: '#10142e' };
const RED = '#e5484d', GOLD = '#e0a100', ICE = '#1fb5d0', HIGHLIGHT = '#f5b70a';
const theme = {};

function readTheme() {
  const probe = document.createElement('i');
  document.body.appendChild(probe);
  for (const name of ['ink', 'dot', 'paper']) {
    probe.style.color = 'var(--' + name + ')';
    theme[name] = getComputedStyle(probe).color;
  }
  // A dark page has dark paper: add up its red, green and blue.
  const [r, g, b] = (theme.paper.match(/[\d.]+/g) || [255, 255, 255]).map(Number);
  theme.dark = r + g + b < 380;
  probe.remove();
  requestFrame();
}

const palette = () => (game.cfg && game.cfg.dark ? NIGHT : theme);

/** Adds one arrow to two paths: its line and its head triangle. */
function traceArrow(line, heads, a) {
  const track = a.ext || a.pts, start = pointAt(track, a.slide), end = pointAt(track, a.slide + a.pts.length - 1);
  const points = [start];
  for (let k = start[2] + 1; k <= end[2]; k++) points.push(track[k]);
  const dx = DX[a.dir], dy = DY[a.dir], sc = view.scale;
  const [hx, hy] = toScreen(end[0], end[1]);
  const len = Math.max(5, sc * .42), halfWidth = Math.max(4, sc * .27), bx = hx - dx * len * .55, by = hy - dy * len * .55;
  line.moveTo(...toScreen(points[0][0], points[0][1]));
  for (let k = 1; k < points.length; k++) {
    const p = points[k];
    if (p[0] === end[0] && p[1] === end[1]) break;
    line.lineTo(...toScreen(p[0], p[1]));
  }
  line.lineTo(bx, by);
  heads.moveTo(hx + dx * len * .45, hy + dy * len * .45);
  heads.lineTo(bx - dx * len * .1 - dy * halfWidth, by - dy * len * .1 + dx * halfWidth);
  heads.lineTo(bx - dx * len * .1 + dy * halfWidth, by - dy * len * .1 - dx * halfWidth);
  heads.closePath();
}

function drawDots(colours) {
  const { scale: sc, ox, oy, width, height } = view;
  if (sc <= 3) return;
  const r = Math.max(.8, sc * .07);
  const x0 = Math.max(0, Math.floor(-ox / sc)), x1 = Math.min(game.W, Math.ceil((width - ox) / sc));
  const y0 = Math.max(0, Math.floor(-oy / sc)), y1 = Math.min(game.H, Math.ceil((height - oy) / sc));
  ctx.fillStyle = colours.dot;
  ctx.beginPath();
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const [px, py] = toScreen(x, y);
    ctx.moveTo(px + r, py);
    ctx.arc(px, py, r, 0, FULL_CIRCLE);
  }
  ctx.fill();
}

function drawPoof(a, lineWidth) {
  const line = new Path2D(), heads = new Path2D();
  traceArrow(line, heads, a);
  ctx.globalAlpha = Math.max(0, a.alpha);
  ctx.strokeStyle = ctx.fillStyle = HIGHLIGHT;
  ctx.lineWidth = lineWidth * (1 + (1 - a.alpha) * 1.5);
  ctx.stroke(line);
  ctx.fill(heads);
  ctx.globalAlpha = 1;
}

/** A soft glow behind the arrow chosen with the keyboard, while the board has the focus. */
function drawCursor(lineWidth) {
  const a = cursorArrow();
  if (!a || document.activeElement !== canvas) return;
  const line = new Path2D(), heads = new Path2D();
  traceArrow(line, heads, a);
  ctx.globalAlpha = .35;
  ctx.strokeStyle = game.cfg.col;
  ctx.lineWidth = lineWidth * 3.4;
  ctx.stroke(line);
  ctx.stroke(heads);
  ctx.globalAlpha = 1;
}

// Colour-blind mode: each special arrow also differs in shape, as [dash, gap] in line widths.
const PATTERNS = { ice: [1.2, 1.6], gold: [3.2, 1.4], red: [.4, 1.5], radar: [2, 1.2] };

/** Arrows are batched by look, so each look is stroked once. Returns true if still animating. */
function drawArrows(colours, now) {
  const skin = activeSkin(), onDark = (game.cfg && game.cfg.dark) || theme.dark;
  const lineWidth = Math.max(1.4, view.scale * .14) * (skin.width || 1);
  const radar = now < game.radarUntil, blinkOn = Math.floor(now / 240) % 2;
  const hinted = game.hint && now < game.hint.until ? game.hint.id : -1;
  const looks = {
    ink: { colour: skin.ink ? skin.ink[onDark ? 1 : 0] : colours.ink }, // only plain arrows wear the skin
    red: { colour: RED },
    radar: { colour: HIGHLIGHT },
    ice: { colour: ICE, bold: true, core: colours.paper },
    gold: { colour: GOLD, bold: true, core: '#fff3c4' },
  };
  let animating = radar || hinted !== -1;
  ctx.lineCap = ctx.lineJoin = 'round';
  drawCursor(lineWidth);

  for (const a of game.arrows) {
    if (a.state === 'gone') continue;
    if (a.state === 'poof') { drawPoof(a, lineWidth); continue; }
    let look = a.ice ? 'ice' : a.gold ? 'gold' : 'ink';
    if (a.errUntil > now) { look = 'red'; animating = true; }
    else if (blinkOn && (a.id === hinted || (radar && canLeave(a)))) look = 'radar';
    const batch = looks[look];
    batch.line = batch.line || new Path2D();
    batch.heads = batch.heads || new Path2D();
    traceArrow(batch.line, batch.heads, a);
  }

  for (const [name, { colour, bold, core, line, heads }] of Object.entries(looks)) {
    if (!line) continue;
    ctx.strokeStyle = ctx.fillStyle = colour;
    ctx.lineWidth = lineWidth * (bold ? 1.25 : 1);
    if (player.cb && PATTERNS[name]) ctx.setLineDash(PATTERNS[name].map(n => n * lineWidth));
    ctx.stroke(line);
    ctx.setLineDash([]);
    ctx.fill(heads);
    ctx.lineWidth = lineWidth * .45;
    ctx.stroke(heads);
    if (core) { // a thin lighter line down the middle
      ctx.strokeStyle = core;
      ctx.lineWidth = lineWidth * .35;
      ctx.stroke(line);
    }
  }
  return animating;
}

/** Boss fog fades in and out. Returns true while any is on screen. */
function drawFog(colours, now) {
  game.fogs = game.fogs.filter(f => now < f.until);
  for (const f of game.fogs) {
    const alpha = Math.min(1, (now - f.t0) / 300, (f.until - now) / 500);
    ctx.beginPath();
    for (const [u, v, radius] of f.puffs) {
      const [x, y] = toScreen(u, v), r = radius * view.scale;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, FULL_CIRCLE);
    }
    ctx.globalAlpha = alpha * .97;
    ctx.fillStyle = colours.paper;
    ctx.fill();
    ctx.globalAlpha = alpha * .35;
    ctx.fillStyle = colours.dot;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  return game.fogs.length > 0;
}

/** Darkness with a lit circle around the lamp. Returns true while a timed blackout runs. */
function drawLamp(now) {
  const { cfg } = game, timed = now < game.blackoutUntil;
  if (!cfg || !(cfg.blackout || timed)) return false;
  const [x, y] = toScreen(game.lamp[0], game.lamp[1]), radius = Math.max(80, 4.6 * view.scale);
  const light = ctx.createRadialGradient(x, y, radius * .55, x, y, radius);
  light.addColorStop(0, 'rgba(6,8,24,0)');
  light.addColorStop(1, 'rgba(6,8,24,.97)');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, view.width, view.height);
  return !cfg.blackout;
}

/** Draws one frame. Returns true if something on screen is still changing. */
export function draw(now) {
  const colours = palette();
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.clearRect(0, 0, view.width, view.height);
  drawDots(colours);
  const arrows = drawArrows(colours, now), fog = drawFog(colours, now), lamp = drawLamp(now);
  return arrows || fog || lamp;
}

/** Matches the canvas to the stage's current size and shows the whole board. */
export function resizeBoard() {
  resize(canvas, $('#stage'), game.W, game.H);
  requestFrame();
}

/** Gives the board the keyboard focus, so arrow keys work without clicking it first. */
export function focusBoard() {
  canvas.focus({ preventScroll: true });
}

export function fitBoard() {
  fit(game.W, game.H);
  requestFrame();
}

/** Keeps the canvas in step with the layout and the colour theme. */
export function initRender() {
  new ResizeObserver(resizeBoard).observe($('#stage'));
  new MutationObserver(readTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readTheme);
  readTheme();
}
