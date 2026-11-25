import { DUR, EASE } from "./motion";
import { prefersReducedMotion } from "./reducedMotion";

const BOUNCE_CLASS = "bag-bounce";

/** Restart the one-shot bounce on the bag target (class defined in src/styles/motion.css). */
export function bounceBag(target: HTMLElement): void {
  target.classList.remove(BOUNCE_CLASS);
  void target.offsetWidth; // restart the keyframes if a bounce is already running
  target.classList.add(BOUNCE_CLASS);
  const done = () => target.classList.remove(BOUNCE_CLASS);
  target.addEventListener("animationend", done, { once: true });
  window.setTimeout(done, DUR.base + 60); // safety net if animationend never fires
}

function visible(r: DOMRect): boolean {
  return (
    r.width > 0 &&
    r.height > 0 &&
    r.bottom > 0 &&
    r.right > 0 &&
    r.top < window.innerHeight &&
    r.left < window.innerWidth
  );
}

/**
 * Add-to-bag "drop": clones a thumbnail and flies it on a short arc to `[data-bag-target]`,
 * then bounces the target once. Transforms and opacity only (two composited layers, < 400 ms).
 * No-op under prefers-reduced-motion (the caller's live region announces the add).
 * Never blocks the cart update: call it after (or alongside) the state change.
 */
export function flyToBag(fromEl: HTMLElement, imageSrc: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (prefersReducedMotion()) return;
  const target = document.querySelector<HTMLElement>("[data-bag-target]");
  if (!target) return;

  const a = fromEl.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const outer = document.createElement("div");
  // Skip the arc when either end is off-screen (e.g. the sticky header is hidden) or WAAPI is missing.
  if (!visible(a) || !visible(b) || typeof outer.animate !== "function") {
    if (visible(b)) bounceBag(target);
    return;
  }

  const size = Math.max(32, Math.min(96, a.width, a.height));
  const startX = a.left + a.width / 2 - size / 2;
  const startY = a.top + a.height / 2 - size / 2;
  const dx = b.left + b.width / 2 - (startX + size / 2);
  const dy = b.top + b.height / 2 - (startY + size / 2);

  outer.setAttribute("aria-hidden", "true");
  const os = outer.style;
  os.position = "fixed";
  os.left = `${startX}px`;
  os.top = `${startY}px`;
  os.width = `${size}px`;
  os.height = `${size}px`;
  os.zIndex = "1000";
  os.pointerEvents = "none";
  os.willChange = "transform";

  const img = document.createElement("img");
  img.src = imageSrc;
  img.alt = "";
  img.decoding = "async";
  const is = img.style;
  is.width = "100%";
  is.height = "100%";
  is.objectFit = "cover";
  is.borderRadius = "4px";
  is.background = "var(--color-plinth)";
  is.boxShadow = "0 8px 24px -8px rgb(14 23 38 / .35)";
  is.willChange = "transform, opacity";
  outer.appendChild(img);
  document.body.appendChild(outer);

  const duration = DUR.bagFlight;
  // X on linear timing, Y on ease-in: together they trace a parabola using transforms only.
  const x = outer.animate([{ transform: "translateX(0)" }, { transform: `translateX(${dx}px)` }], {
    duration,
    easing: "linear",
    fill: "both",
  });
  const y = img.animate(
    [
      { transform: "translateY(0) scale(1)", opacity: 1 },
      { transform: `translateY(${dy}px) scale(.28)`, opacity: 0.6 },
    ],
    { duration, easing: EASE.exit, fill: "both" },
  );
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    outer.remove();
    bounceBag(target);
  };
  Promise.all([x.finished, y.finished]).then(cleanup, cleanup);
  window.setTimeout(cleanup, duration + 200);
}
