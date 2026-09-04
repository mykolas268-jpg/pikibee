/**
 * Deterministic PRNG. The honeycomb must look identical on every reload —
 * Math.random() would reshuffle the whole lattice between visits.
 *
 * mulberry32: 32-bit state, fast, good enough for visual scatter.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
