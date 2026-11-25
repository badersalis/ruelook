import { mulberry32 } from "./rng";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
/** A board tile's layout box plus the height of its image tile (connectors attach to the image). */
export interface TileBox extends Box {
  tileH: number;
}
export interface Pt {
  x: number;
  y: number;
}
export interface Connector {
  d: string;
  p0: Pt;
  p1: Pt;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Hand-drawn cubic connectors from the anchor tile to each look item (pure; seeded).
 * Side-by-side items (desktop) connect horizontally to the anchor's edge. Stacked items (mobile)
 * chain to the nearest box above in the same column, so a line never runs behind card text.
 */
export function buildConnectors(anchor: TileBox, items: TileBox[], seed: number): Connector[] {
  const rand = mulberry32(seed);
  const A = anchor;
  const wob = (dist: number) => (rand() - 0.5) * Math.min(28, Math.abs(dist) * 0.5);
  return items.map((I) => {
    const sideBySide = I.x + I.w <= A.x || I.x >= A.x + A.w;
    let p0: Pt;
    let p1: Pt;
    let d: string;
    if (sideBySide) {
      const left = I.x + I.w <= A.x;
      const iy = I.y + I.tileH / 2;
      const lo = A.y + 32;
      const hi = Math.max(lo, A.y + A.tileH - 32);
      p0 = { x: left ? A.x - 6 : A.x + A.w + 6, y: clamp(iy, lo, hi) };
      p1 = { x: left ? I.x + I.w + 6 : I.x - 6, y: iy };
      const mx = (p1.x - p0.x) / 2;
      d = `M${r1(p0.x)} ${r1(p0.y)} C${r1(p0.x + mx)} ${r1(p0.y + wob(mx * 2))} ${r1(p1.x - mx)} ${r1(p1.y + wob(mx * 2))} ${r1(p1.x)} ${r1(p1.y)}`;
    } else {
      const ix = I.x + I.w / 2;
      const above = items
        .filter((B) => B !== I && B.y + B.h <= I.y && ix > B.x && ix < B.x + B.w)
        .sort((m, n) => n.y + n.h - (m.y + m.h))[0];
      const S = above ?? A;
      const lo = A.x + 32;
      const hi = Math.max(lo, A.x + A.w - 32);
      p0 = { x: above ? ix : clamp(ix, lo, hi), y: S.y + S.h + 6 };
      p1 = { x: ix, y: I.y - 6 };
      const my = (p1.y - p0.y) / 2;
      d = `M${r1(p0.x)} ${r1(p0.y)} C${r1(p0.x + wob(my * 2))} ${r1(p0.y + my)} ${r1(p1.x + wob(my * 2))} ${r1(p1.y - my)} ${r1(p1.x)} ${r1(p1.y)}`;
    }
    return { d, p0, p1 };
  });
}
