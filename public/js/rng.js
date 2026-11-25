// Random numbers. Boards are generated from a seed, so every player gets the same level.

/** Seeded generator returning floats in [0, 1). The same seed always gives the same sequence. */
export function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Unseeded integer in [0, n). */
export const randomInt = n => Math.floor(Math.random() * n);

/** Fisher-Yates shuffle, in place. Pass a seeded `randInt` for a reproducible order. */
export function shuffle(items, randInt = randomInt) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** Up to `count` random items, leaving the input untouched. */
export const sample = (items, count) => shuffle([...items]).slice(0, count);
