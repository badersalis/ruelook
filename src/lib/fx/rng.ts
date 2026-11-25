/** Seeded PRNG (mulberry32): art-directed, reproducible randomness for connectors and capture mode. */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Per-look connector seed. Fixed, so capture mode and normal mode draw identical lines. */
export function lookSeed(lookIndex: number): number {
  return 1009 + lookIndex * 7919;
}
