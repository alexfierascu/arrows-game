// Grid helpers. A cell is the index y * W + x; directions are 0 right, 1 down, 2 left, 3 up.

export const DX = [1, 0, -1, 0];
export const DY = [0, 1, 0, -1];

/** Direction of the step from cell `a` to its neighbour `b`. */
export function dirOf(W, a, b) {
  const ax = a % W, ay = (a / W) | 0, bx = b % W, by = (b / W) | 0;
  if (bx > ax) return 0;
  if (by > ay) return 1;
  if (bx < ax) return 2;
  return 3;
}

/** Direction an arrow points: from its second-to-last cell to its head. */
export const headDir = (W, path) => dirOf(W, path[path.length - 2], path[path.length - 1]);

/** Cells in front of an arrow's head, in order, until the edge of the board. */
export function rayCells(W, H, path) {
  const head = path[path.length - 1], d = headDir(W, path);
  let x = head % W + DX[d], y = ((head / W) | 0) + DY[d];
  const out = [];
  while (x >= 0 && y >= 0 && x < W && y < H) {
    out.push(y * W + x);
    x += DX[d];
    y += DY[d];
  }
  return out;
}
