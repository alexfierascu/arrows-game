// Pointer input on the board: tap an arrow, drag to pan, pinch or scroll to zoom.

import { $ } from '../dom.js';
import { game } from './state.js';
import { view, toCell, anchorAt, zoomTo, zoomBy } from './view.js';
import { tapArrow } from './rules.js';
import { fitBoard } from './render.js';
import { requestFrame } from './frame.js';

const DRAG_THRESHOLD = 9;  // pixels a finger may move and still count as a tap
const BUTTON_ZOOM = 1.4;
const WHEEL_ZOOM = .0018;

const canvas = $('#cv');
const pointers = new Map(); // pointer id -> [x, y] on the canvas
let pan = null;             // { x, y, ox, oy, moved }: one finger down
let pinch = null;           // { dist, scale, anchor }: two fingers down

const local = e => {
  const rect = canvas.getBoundingClientRect();
  return [e.clientX - rect.left, e.clientY - rect.top];
};
const startPan = ([x, y], moved) => ({ x, y, ox: view.ox, oy: view.oy, moved });
const twoFingers = () => {
  const [a, b] = [...pointers.values()];
  return { dist: Math.hypot(a[0] - b[0], a[1] - b[1]), mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] };
};

function distanceToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay, lengthSq = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, lengthSq ? ((px - ax) * dx + (py - ay) * dy) / lengthSq : 0));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

/** The arrow closest to a point (in cells), if one is within reach of a fingertip. */
function arrowNear(gx, gy) {
  const { W, H, own, arrows } = game, cx = Math.round(gx), cy = Math.round(gy), nearby = new Set();
  for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++)
    if (x >= 0 && y >= 0 && x < W && y < H && own[y * W + x] !== -1) nearby.add(own[y * W + x]);
  let best = null, bestDistance = Math.max(.55, 16 / view.scale);
  for (const id of nearby) {
    const a = arrows[id];
    for (let k = 0; k < a.pts.length - 1; k++) {
      const d = distanceToSegment(gx, gy, a.pts[k], a.pts[k + 1]);
      if (d < bestDistance) { bestDistance = d; best = a; }
    }
  }
  return best;
}

function handleTap(px, py) {
  if (game.over) return;
  const [gx, gy] = toCell(px, py);
  game.lamp = [gx, gy]; // on dark boards the light follows the last tap
  requestFrame();
  const arrow = arrowNear(gx, gy);
  if (arrow) tapArrow(arrow);
}

function onDown(e) {
  canvas.setPointerCapture(e.pointerId);
  const p = local(e);
  pointers.set(e.pointerId, p);
  if (pointers.size === 1) pan = startPan(p, false);
  else if (pointers.size === 2) {
    const { dist, mid } = twoFingers();
    pinch = { dist, scale: view.scale, anchor: anchorAt(...mid) };
    pan = null;
  }
}

function onMove(e) {
  if (!pointers.has(e.pointerId)) return;
  const p = local(e);
  pointers.set(e.pointerId, p);
  if (pinch && pointers.size >= 2) {
    const { dist, mid } = twoFingers();
    zoomTo(pinch.scale * dist / pinch.dist, mid[0], mid[1], pinch.anchor);
    requestFrame();
  } else if (pan) {
    const dx = p[0] - pan.x, dy = p[1] - pan.y;
    if (!pan.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) pan.moved = true;
    if (pan.moved) {
      view.ox = pan.ox + dx;
      view.oy = pan.oy + dy;
      requestFrame();
    }
  }
}

function onUp(e) {
  if (!pointers.has(e.pointerId)) return;
  const p = pointers.get(e.pointerId);
  pointers.delete(e.pointerId);
  if (pan && !pan.moved && e.type === 'pointerup' && !pinch) handleTap(p[0], p[1]);
  if (pointers.size < 2) pinch = null;
  if (pointers.size === 0) pan = null;
  else if (pointers.size === 1) pan = startPan([...pointers.values()][0], true); // lifting one finger of a pinch continues as a pan
}

function onWheel(e) {
  e.preventDefault();
  zoomBy(Math.exp(-e.deltaY * WHEEL_ZOOM), ...local(e));
  requestFrame();
}

function zoomCentre(factor) {
  zoomBy(factor, view.width / 2, view.height / 2);
  requestFrame();
}

export function initInput() {
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  $('#zin').onclick = () => zoomCentre(BUTTON_ZOOM);
  $('#zout').onclick = () => zoomCentre(1 / BUTTON_ZOOM);
  $('#zfit').onclick = fitBoard;
}
