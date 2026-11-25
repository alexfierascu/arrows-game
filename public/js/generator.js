// Board generator. Fills a W x H grid with arrows (paths of cells) that can always be cleared.
//
// The output depends only on the arguments, and the order of random draws is part of that
// contract: changing it changes every level, the daily board and the event boards for all players.
//
// Phases:
//   1. carve      random walks cover the grid with paths
//   2. merge      single-cell leftovers join a neighbouring path
//   3. orient     each path picks which end is the arrow head
//   4. solve      play the board greedily; repair dead ends by flipping, splitting or dropping arrows
//   5. refill     put new arrows in the holes, only where they cannot create a deadlock

import { mulberry32, shuffle } from './rng.js';
import { DX, DY, rayCells } from './grid.js';

const EMPTY = -1;

/** Returns the arrows of a solvable board, each an array of cells from tail to head. */
export function generate(W, H, seed, minLen, maxLen, straight, bias) {
  const rnd = mulberry32(seed * 7919 + 13);
  const board = {
    W, H, rnd, straight,
    randInt: n => Math.floor(rnd() * n),
    own: new Int32Array(W * H).fill(EMPTY), // which path occupies each cell
  };
  const order = shuffle([...Array(W * H).keys()], board.randInt);

  let paths = carvePaths(board, order, minLen, maxLen);
  paths = mergeSingletons(board, paths, maxLen);
  orientPaths(board, paths, bias);
  const arrows = solveAndRepair(board, paths);
  refillHoles(board, order, arrows, maxLen);
  return arrows.map(a => a.cells);
}

/** Random walk from `start` over empty cells, preferring to keep going straight. */
function walk(board, start, targetLen) {
  const { W, H, own, rnd, randInt, straight } = board;
  const path = [start], used = new Set(path);
  let dir = randInt(4);
  while (path.length < targetLen) {
    const c = path[path.length - 1], cx = c % W, cy = (c / W) | 0, options = [];
    for (let d = 0; d < 4; d++) {
      const nx = cx + DX[d], ny = cy + DY[d], n = ny * W + nx;
      if (nx >= 0 && ny >= 0 && nx < W && ny < H && own[n] === EMPTY && !used.has(n)) options.push(d);
    }
    if (!options.length) break;
    const d = options.includes(dir) && rnd() < straight ? dir : options[randInt(options.length)];
    const next = (cy + DY[d]) * W + cx + DX[d];
    path.push(next);
    used.add(next);
    dir = d;
  }
  return path;
}

function carvePaths(board, order, minLen, maxLen) {
  const { own, randInt } = board, paths = [];
  for (const start of order) {
    if (own[start] !== EMPTY) continue;
    const targetLen = minLen + randInt(maxLen - minLen + 1);
    const path = walk(board, start, targetLen);
    for (const c of path) own[c] = paths.length;
    paths.push(path);
  }
  return paths;
}

/** A one-cell path cannot be an arrow: attach it to the end of a neighbouring path, or drop it. */
function mergeSingletons(board, paths, maxLen) {
  const { W, H, own } = board;
  for (let id = 0; id < paths.length; id++) {
    const p = paths[id];
    if (p.length !== 1) continue;
    const c = p[0], cx = c % W, cy = (c / W) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = cx + DX[d], ny = cy + DY[d];
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx, o = own[n];
      if (o === EMPTY || o === id) continue;
      const q = paths[o];
      if (q.length >= maxLen + 2) continue;
      if (q[0] === n) { q.unshift(c); own[c] = o; p.length = 0; break; }
      if (q[q.length - 1] === n) { q.push(c); own[c] = o; p.length = 0; break; }
    }
    if (p.length === 1) { own[c] = EMPTY; p.length = 0; }
  }
  return paths.filter(p => p.length >= 2);
}

/** Point each path at the end with the shorter runway (with probability `bias`), then index cells. */
function orientPaths(board, paths, bias) {
  const { W, H, own, rnd } = board;
  const runway = p => rayCells(W, H, p).length;
  own.fill(EMPTY);
  paths.forEach((p, i) => {
    const before = runway(p);
    p.reverse();
    const after = runway(p);
    if ((after > before) === (rnd() < bias)) p.reverse();
    for (const c of p) own[c] = i;
  });
}

/**
 * Plays the board in waves: every arrow with a clear runway leaves at once. When nothing can
 * leave, repairs the board and tries again. Returns the surviving arrows with the wave (`t`)
 * in which each one leaves.
 */
function solveAndRepair(board, paths) {
  const { W, H, own, rnd, randInt } = board;
  const alive = paths.map(() => true), gone = paths.map(() => false), leftAt = [];
  let left = paths.length, waves = 0;

  const blocks = o => o !== EMPTY && !gone[o];
  const isFree = i => rayCells(W, H, paths[i]).every(c => !blocks(own[c]));
  const pending = () => paths.map((_, i) => i).filter(i => alive[i] && !gone[i]);
  const drop = i => { alive[i] = false; left--; for (const c of paths[i]) own[c] = EMPTY; };

  // Repair 1: reverse one stuck arrow so that it can leave.
  const reverseOne = stuck => {
    for (const i of stuck) {
      paths[i].reverse();
      if (isFree(i)) return true;
      paths[i].reverse();
    }
    return false;
  };

  // Repair 2: find a stuck arrow (in either orientation) blocked by exactly one cell.
  const findHole = stuck => {
    let best = null;
    for (const i of stuck) for (let r = 0; r < 2; r++) {
      const hits = [];
      let hitsSelf = false;
      for (const c of rayCells(W, H, paths[i])) {
        const o = own[c];
        if (o === i) { hitsSelf = true; break; }
        if (blocks(o)) hits.push(c);
      }
      if (!hitsSelf && hits.length === 1 && (!best || rnd() < .3)) best = { i, reversed: r === 1, cell: hits[0] };
      paths[i].reverse();
    }
    return best;
  };

  // ...then remove that cell, splitting the blocking arrow in two.
  const punchHole = ({ i, reversed, cell }) => {
    if (reversed) paths[i].reverse();
    const o = own[cell], p = paths[o], k = p.indexOf(cell);
    own[cell] = EMPTY;
    const tailPart = p.slice(0, k), headPart = p.slice(k + 1);
    p.length = 0;
    p.push(...headPart);
    if (headPart.length < 2) { drop(o); p.length = 0; }
    if (tailPart.length >= 2) {
      const id = paths.length;
      paths.push(tailPart);
      for (const c of tailPart) own[c] = id;
      alive[id] = true; gone[id] = false; left++;
    } else for (const c of tailPart) own[c] = EMPTY;
  };

  while (left > 0) {
    const wave = pending().filter(isFree);
    if (wave.length) {
      for (const i of wave) { gone[i] = true; leftAt[i] = waves; left--; }
      waves++;
      continue;
    }
    const stuck = shuffle(pending(), randInt);
    if (reverseOne(stuck)) continue;
    const hole = findHole(stuck);
    if (hole) { punchHole(hole); continue; }
    drop(stuck[randInt(stuck.length)]); // Repair 3: give up on one arrow.
  }

  const arrows = [];
  paths.forEach((cells, i) => { if (alive[i] && cells.length >= 2) arrows.push({ cells, t: leftAt[i] }); });
  return arrows;
}

/**
 * Adds arrows to the empty cells left by the repairs. A new arrow X is safe when every arrow on
 * X's runway leaves before any arrow whose runway crosses X; it then leaves in between.
 */
function refillHoles(board, order, arrows, maxLen) {
  const { W, H, own, randInt } = board;
  const leaveTime = new Float64Array(W * H);              // when the arrow on a cell leaves
  const minRay = new Float64Array(W * H).fill(Infinity);  // earliest arrow whose runway crosses a cell
  const place = (arrow, id) => { for (const c of arrow.cells) { own[c] = id; leaveTime[c] = arrow.t; } };
  const castRay = arrow => { for (const c of rayCells(W, H, arrow.cells)) if (arrow.t < minRay[c]) minRay[c] = arrow.t; };

  // A leave time that keeps the board solvable, trying both orientations; null if there is none.
  const safeLeaveTime = cells => {
    const inPath = new Set(cells);
    for (let r = 0; r < 2; r++) {
      if (r) cells.reverse();
      let mustLeaveBefore = Infinity;
      for (const c of cells) mustLeaveBefore = Math.min(mustLeaveBefore, minRay[c]);
      let canLeaveAfter = -1, crossesSelf = false;
      for (const c of rayCells(W, H, cells)) {
        if (inPath.has(c)) { crossesSelf = true; break; }
        if (own[c] !== EMPTY) canLeaveAfter = Math.max(canLeaveAfter, leaveTime[c]);
      }
      if (!crossesSelf && canLeaveAfter < mustLeaveBefore)
        return mustLeaveBefore === Infinity ? canLeaveAfter + 1 : (canLeaveAfter + mustLeaveBefore) / 2;
    }
    return null;
  };

  own.fill(EMPTY);
  arrows.forEach(place);
  arrows.forEach(castRay);
  for (let pass = 0; pass < 3; pass++) for (const start of order) {
    if (own[start] !== EMPTY) continue;
    for (let tries = 0; tries < 6; tries++) {
      const targetLen = 2 + randInt(Math.max(1, maxLen - 1));
      const cells = walk(board, start, targetLen);
      if (cells.length < 2) continue;
      const t = safeLeaveTime(cells);
      if (t === null) continue;
      const arrow = { cells, t };
      place(arrow, arrows.length);
      castRay(arrow);
      arrows.push(arrow);
      break;
    }
  }
}
