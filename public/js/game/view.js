// The camera: how board cells map to canvas pixels. Pure numbers, no drawing; callers that
// change the view ask for a redraw themselves.

const MAX_SCALE = 64;
const MARGIN = 16;

export const view = {
  scale: 20, fitScale: 20,  // pixels per cell, now / when the whole board fits
  ox: 0, oy: 0,             // pixel position of the board's top-left corner
  width: 0, height: 0,      // canvas size in CSS pixels
  dpr: 1,
};

/** Centre of cell (u, v) in canvas pixels. Fractional cells are fine. */
export const toScreen = (u, v) => [view.ox + (u + .5) * view.scale, view.oy + (v + .5) * view.scale];

/** Canvas pixel to (fractional) cell coordinates: the inverse of toScreen. */
export const toCell = (px, py) => [(px - view.ox) / view.scale - .5, (py - view.oy) / view.scale - .5];

/** Board point under a pixel, in a form that stays valid across zooms (see zoomTo). */
export const anchorAt = (px, py) => [(px - view.ox) / view.scale, (py - view.oy) / view.scale];

/** Sets the zoom so that board point `anchor` sits at pixel (px, py). */
export function zoomTo(scale, px, py, anchor = anchorAt(px, py)) {
  view.scale = Math.max(view.fitScale * .8, Math.min(MAX_SCALE, scale));
  view.ox = px - anchor[0] * view.scale;
  view.oy = py - anchor[1] * view.scale;
}

/** Zooms by `factor` around a pixel. */
export const zoomBy = (factor, px, py) => zoomTo(view.scale * factor, px, py);

/** Shows the whole W x H board, centred. */
export function fit(W, H) {
  if (!W) return;
  view.fitScale = view.scale = Math.min((view.width - MARGIN) / W, (view.height - MARGIN) / H);
  view.ox = (view.width - W * view.scale) / 2;
  view.oy = (view.height - H * view.scale) / 2;
}

/** Matches the canvas to its container and refits the board. */
export function resize(canvas, container, W, H) {
  const rect = container.getBoundingClientRect();
  if (!rect.width) return;
  view.dpr = Math.min(3, devicePixelRatio || 1);
  view.width = rect.width;
  view.height = rect.height;
  canvas.width = Math.round(view.width * view.dpr);
  canvas.height = Math.round(view.height * view.dpr);
  fit(W, H);
}
