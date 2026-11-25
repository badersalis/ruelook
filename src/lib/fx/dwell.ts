/**
 * Autoplay dwell timer. When WAAPI is available the progress-bar animation IS the timer
 * (pausing it pauses the carousel, so there is never a second clock); otherwise a timeout
 * that remembers the remaining time.
 */
export interface Dwell {
  play(): void;
  pause(): void;
  cancel(): void;
}

export function createDwell(bar: HTMLElement | null, ms: number, onDone: () => void): Dwell {
  if (bar && typeof bar.animate === "function") {
    const anim = bar.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
      duration: ms,
      easing: "linear",
      fill: "both",
    });
    anim.pause();
    anim.onfinish = () => onDone();
    return {
      play: () => anim.play(),
      pause: () => anim.pause(),
      cancel: () => {
        anim.onfinish = null;
        anim.cancel();
      },
    };
  }
  let remaining = ms;
  let startedAt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    play() {
      if (timer !== null) return;
      startedAt = Date.now();
      timer = setTimeout(() => {
        timer = null;
        onDone();
      }, remaining);
    },
    pause() {
      if (timer === null) return;
      clearTimeout(timer);
      timer = null;
      remaining = Math.max(0, remaining - (Date.now() - startedAt));
    },
    cancel() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    },
  };
}

/** Preload and decode an image so a wipe never reveals an empty frame. Never waits longer than timeoutMs. */
export function preloadImage(src: string, srcSet?: string, sizes?: string, timeoutMs = 800): Promise<void> {
  if (typeof Image === "undefined") return Promise.resolve();
  const img = new Image();
  if (sizes) img.sizes = sizes;
  if (srcSet) img.srcset = srcSet;
  img.src = src;
  const decoded: Promise<void> =
    typeof img.decode === "function"
      ? img.decode().then(
          () => undefined,
          () => undefined,
        )
      : Promise.resolve();
  return Promise.race([decoded, new Promise<void>((r) => setTimeout(r, timeoutMs))]);
}
