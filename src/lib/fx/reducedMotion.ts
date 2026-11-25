import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function mql(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return window.matchMedia(QUERY);
}

export function prefersReducedMotion(): boolean {
  return mql()?.matches ?? false;
}

function subscribe(onChange: () => void): () => void {
  const mq = mql();
  if (!mq) return () => {};
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }
  // Safari < 14
  mq.addListener(onChange);
  return () => mq.removeListener(onChange);
}

/** Runtime-reactive `prefers-reduced-motion`. Hydration-safe (server snapshot: false). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
