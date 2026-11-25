/**
 * Motion tokens (docs/design/visual-direction.md "Motion principles").
 * Mirrors the CSS custom properties in src/styles/motion.css: keep both in sync.
 */
export const DUR = {
  fast: 120,
  base: 240,
  slow: 560,
  exit: 160,
  draw: 640,
  reduced: 120,
  stagger: 60,
  staggerMax: 360,
  heroDwell: 6000,
  /** Choreography constants (prototype README §3), not design tokens. */
  heroSettle: 900,
  lineDelay: 120,
  drawDelay: 120,
  bagFlight: 380,
} as const;

export const EASE = {
  standard: "cubic-bezier(.2,0,0,1)",
  emphasized: "cubic-bezier(.16,1,.3,1)",
  exit: "cubic-bezier(.4,0,1,1)",
  draw: "cubic-bezier(.65,0,.35,1)",
} as const;

/** Stagger delay for item k, capped by motion.stagger-max. */
export function staggerDelay(k: number): number {
  return Math.min(Math.max(0, k) * DUR.stagger, DUR.staggerMax);
}

/** True when the element supports the Web Animations API (false in jsdom and very old engines). */
export function canAnimate(el: Element | null | undefined): el is Element {
  return !!el && typeof (el as Element & { animate?: unknown }).animate === "function";
}

/** Await every animation, ignoring the AbortError a cancel() raises. */
export function allFinished(anims: Animation[]): Promise<void> {
  return Promise.all(anims.map((a) => a.finished)).then(
    () => undefined,
    () => undefined,
  );
}
