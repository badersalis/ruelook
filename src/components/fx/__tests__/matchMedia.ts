import { vi } from "vitest";

/** Install a controllable window.matchMedia mock. Returns a setter that fires change listeners. */
export function mockMatchMedia(initial: { reducedMotion?: boolean } = {}) {
  let reduced = initial.reducedMotion ?? false;
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const matches = (q: string) => (q.includes("prefers-reduced-motion") ? reduced : false);
  const impl = vi.fn((query: string) => ({
    get matches() {
      return matches(query);
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
    addListener: (cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeListener: (cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
    dispatchEvent: () => true,
  }));
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: impl });
  return {
    setReducedMotion(v: boolean) {
      reduced = v;
      listeners.forEach((cb) => cb({ matches: v } as MediaQueryListEvent));
    },
  };
}
