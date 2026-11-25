import { useSyncExternalStore } from "react";

/**
 * Deterministic capture mode for showcase rendering (phase 10): `?capture=1`.
 * HeroWipe: no autoplay; `window.__fxHero` exposes goTo/step for frame-by-frame capture.
 * LookBoard: final state rendered instantly with the fixed per-look seed; `window.__fxLook.select(i)`.
 */
export function isCaptureMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("capture") === "1";
  } catch {
    return false;
  }
}

const noopSubscribe = () => () => {};

/** Hydration-safe: the server snapshot is always false. */
export function useCaptureMode(): boolean {
  return useSyncExternalStore(noopSubscribe, isCaptureMode, () => false);
}

export interface FxHeroCaptureApi {
  goTo: (index: number) => void;
  step: (dir: 1 | -1) => void;
  readonly index: number;
}

export interface FxLookCaptureApi {
  select: (index: number) => void;
  readonly index: number;
}

declare global {
  interface Window {
    __fxHero?: FxHeroCaptureApi;
    __fxLook?: FxLookCaptureApi;
  }
}
