"use client";

/**
 * Home hero "headline wipe" (signature interaction 1, board 1a / S2).
 * Spec: docs/design/ux-spec.md §3 Home, docs/design/prototypes/README.md §1.
 *
 * - Slide 1 (copy + image) is server-rendered; its image is the LCP element (fetchPriority high,
 *   no lazy loading) and sits in a fixed-height box, so the effect never delays LCP or shifts layout.
 * - Transitions are WAAPI on transform / opacity / clip-path. `wipe="transform"` switches the media
 *   reveal to a compositor-only transform mask if the phase 7 device test shows clip-path jank.
 * - Autoplay (6 s) pauses on hover, focus and hidden tab; it is off under reduced motion
 *   (runtime-reactive) and in capture mode. The slides region is aria-live="polite" only when not
 *   autoplaying (APG carousel pattern).
 */

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { HeroSlide } from "@/lib/types";
import { DUR, EASE, allFinished, canAnimate } from "@/lib/fx/motion";
import { usePrefersReducedMotion, prefersReducedMotion } from "@/lib/fx/reducedMotion";
import { useCaptureMode } from "@/lib/fx/capture";
import { createDwell, preloadImage, type Dwell } from "@/lib/fx/dwell";

export interface HeroWipeProps {
  slides: HeroSlide[];
  /** Media reveal technique. Default clip-path; "transform" is the compositor-only fallback. */
  wipe?: "clip" | "transform";
  /** Autoplay interval (motion.hero-dwell). */
  dwellMs?: number;
  /** Accessible name of the carousel region. */
  label?: string;
  /** Heading level for slide headlines (use "h1" only if the page has no other h1). */
  headingLevel?: "h1" | "h2";
}

type Dir = 1 | -1;
type Transition = { from: number; to: number; dir: Dir; id: number };
type AutoplayPref = "auto" | "on" | "off";

const SIZES = "100vw";
const srcSetOf = (s: HeroSlide) => `${s.image.src960} 960w, ${s.image.src1600} 1600w`;
const pad2 = (n: number) => String(n).padStart(2, "0");

export default function HeroWipe({
  slides,
  wipe = "clip",
  dwellMs = DUR.heroDwell,
  label = "New season campaign",
  headingLevel = "h2",
}: HeroWipeProps) {
  const n = slides.length;
  const uid = useId();
  const slidesId = `${uid}-slides`;
  const Heading = headingLevel;

  const reduced = usePrefersReducedMotion();
  const capture = useCaptureMode();

  const [index, setIndex] = useState(0);
  const [trans, setTrans] = useState<Transition | null>(null);
  const [primed, setPrimed] = useState<ReadonlySet<number>>(() => new Set([0]));

  // Autoplay preference: "auto" follows reduced motion / capture; "on"/"off" are explicit user choices.
  const [pref, setPref] = useState<AutoplayPref>("auto");
  const [prevReduced, setPrevReduced] = useState(reduced);
  if (prevReduced !== reduced) {
    // Honour the OS setting when it changes at runtime: stop rotation.
    setPrevReduced(reduced);
    if (reduced && pref === "on") setPref("auto");
  }
  const playing = n > 1 && (pref === "on" || (pref === "auto" && !reduced && !capture));

  const sectionRef = useRef<HTMLElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fillRef = useRef<HTMLSpanElement>(null);
  const indexRef = useRef(0); // committed slide
  const targetRef = useRef(0); // slide being navigated to (may still be decoding)
  const tokenRef = useRef(0);
  const dwellRef = useRef<Dwell | null>(null);
  const suspendRef = useRef({ hover: false, focus: false });
  const swipeRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const wipeRef = useRef(wipe);
  useEffect(() => {
    wipeRef.current = wipe;
  }, [wipe]);

  /* ---------- navigation ---------- */
  const goTo = useCallback(
    async (next: number, dir: Dir) => {
      if (n < 2) return;
      const to = ((next % n) + n) % n;
      if (to === targetRef.current) return;
      targetRef.current = to;
      const my = ++tokenRef.current;
      const slide = slides[to];
      if (!slide) return;
      setPrimed((p) => (p.has(to) ? p : new Set(p).add(to)));
      // Decode before the wipe so the reveal never shows an empty frame (capped at 800 ms).
      await preloadImage(slide.image.src1600, srcSetOf(slide), SIZES, 800);
      if (my !== tokenRef.current) return; // superseded by a newer navigation
      const from = indexRef.current;
      if (from === to) return;
      indexRef.current = to;
      setTrans({ from, to, dir, id: my });
      setIndex(to);
    },
    [n, slides],
  );

  const step = useCallback((dir: Dir) => goTo(targetRef.current + dir, dir), [goTo]);
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  /* ---------- transition choreography (WAAPI) ---------- */
  useLayoutEffect(() => {
    if (!trans) return;
    const to = slideRefs.current[trans.to];
    const from = slideRefs.current[trans.from];
    const anims: Animation[] = [];
    if (canAnimate(to) && from) {
      const q = <T extends Element>(root: Element, sel: string) => root.querySelector<T>(sel);
      if (prefersReducedMotion()) {
        const o: KeyframeAnimationOptions = { duration: DUR.reduced, easing: "linear", fill: "both" };
        anims.push(to.animate({ opacity: [0, 1] }, o));
        anims.push(from.animate({ opacity: [1, 0] }, o));
      } else {
        const dir = trans.dir;
        const o: KeyframeAnimationOptions = { duration: DUR.slow, easing: EASE.emphasized, fill: "both" };
        const media = q<HTMLElement>(to, ".fx-hero__media");
        const inner = q<HTMLElement>(to, ".fx-hero__media-inner");
        if (media && inner) {
          if (wipeRef.current === "clip") {
            anims.push(
              media.animate(
                {
                  clipPath:
                    dir > 0
                      ? ["inset(100% 0 0 0)", "inset(0 0 0 0)"]
                      : ["inset(0 0 100% 0)", "inset(0 0 0 0)"],
                },
                o,
              ),
            );
          } else {
            // Transform mask: outer slides in, inner counter-slides, so the image appears fixed.
            anims.push(media.animate({ transform: [`translateY(${dir * 100}%)`, "translateY(0)"] }, o));
            anims.push(inner.animate({ transform: [`translateY(${-dir * 100}%)`, "translateY(0)"] }, o));
          }
        }
        const img = q<HTMLElement>(to, ".fx-hero__img");
        if (img) {
          anims.push(
            img.animate(
              { transform: ["scale(1.06)", "scale(1)"] },
              { duration: DUR.heroSettle, easing: EASE.emphasized, fill: "both" },
            ),
          );
        }
        // Outgoing copy leaves fast so two headlines never compete.
        const fromCopy = q<HTMLElement>(from, ".fx-hero__copy");
        if (fromCopy) {
          anims.push(
            fromCopy.animate(
              { opacity: [1, 0], transform: ["translateY(0)", `translateY(${-dir * 12}px)`] },
              { duration: DUR.exit, easing: EASE.exit, fill: "both" },
            ),
          );
        }
        const lines = Array.from(to.querySelectorAll<HTMLElement>(".fx-hero__line-inner"));
        lines.forEach((ln, i) => {
          anims.push(
            ln.animate(
              { transform: ["translateY(110%)", "translateY(0)"] },
              { ...o, delay: DUR.lineDelay + i * DUR.stagger },
            ),
          );
        });
        const restDelay = DUR.lineDelay + lines.length * DUR.stagger + DUR.stagger;
        const rest = [".fx-hero__kicker", ".fx-hero__sub", ".fx-hero__cta"];
        rest.forEach((sel, i) => {
          const el = q<HTMLElement>(to, sel);
          if (!el) return;
          anims.push(
            el.animate(
              { opacity: [0, 1], transform: ["translateY(12px)", "translateY(0)"] },
              { ...o, delay: i === 0 ? DUR.lineDelay : restDelay + (i - 1) * DUR.stagger },
            ),
          );
        });
      }
    }
    let alive = true;
    const id = trans.id;
    void allFinished(anims).then(() => {
      if (alive) setTrans((cur) => (cur && cur.id === id ? null : cur));
    });
    return () => {
      alive = false;
      // End states equal resting styles, so cancelling is invisible (and settles rapid clicks).
      anims.forEach((a) => a.cancel());
    };
  }, [trans]);

  /* ---------- prime neighbours (after load, when idle) ---------- */
  useEffect(() => {
    if (n < 2) return;
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const prime = () => {
      if (cancelled) return;
      const add = [(index + 1) % n, (index - 1 + n) % n];
      setPrimed((p) => (add.every((i) => p.has(i)) ? p : new Set([...p, ...add])));
    };
    const schedule = () => {
      if (typeof window.requestIdleCallback === "function") idleId = window.requestIdleCallback(prime, { timeout: 2000 });
      else timeoutId = setTimeout(prime, 200);
    };
    // Never compete with the LCP image: wait for the load event first.
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [index, n]);

  /* ---------- autoplay ---------- */
  const syncDwell = useCallback(() => {
    const d = dwellRef.current;
    if (!d) return;
    const s = suspendRef.current;
    if (s.hover || s.focus || document.hidden) d.pause();
    else d.play();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const d = createDwell(fillRef.current, dwellMs, () => void stepRef.current(1));
    dwellRef.current = d;
    syncDwell();
    return () => {
      d.cancel();
      if (dwellRef.current === d) dwellRef.current = null;
    };
  }, [playing, index, dwellMs, syncDwell]);

  useEffect(() => {
    document.addEventListener("visibilitychange", syncDwell);
    return () => document.removeEventListener("visibilitychange", syncDwell);
  }, [syncDwell]);

  /* ---------- capture hooks (phase 10) ---------- */
  useEffect(() => {
    if (!capture) return;
    const api = {
      goTo: (i: number) => void goTo(i, i >= targetRef.current ? 1 : -1),
      step: (dir: Dir) => void step(dir),
      get index() {
        return indexRef.current;
      },
    };
    window.__fxHero = api;
    return () => {
      if (window.__fxHero === api) delete window.__fxHero;
    };
  }, [capture, goTo, step]);

  /* ---------- input handlers ---------- */
  const onKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      void step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      void step(-1);
    }
  };
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    swipeRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = swipeRef.current;
    swipeRef.current = null;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) void step(dx < 0 ? 1 : -1);
  };

  if (n === 0) return null;

  const stateOf = (i: number): "entering" | "leaving" | "active" | "idle" => {
    if (trans) {
      if (i === trans.to) return "entering";
      if (i === trans.from) return "leaving";
      return "idle";
    }
    return i === index ? "active" : "idle";
  };

  return (
    <section
      ref={sectionRef}
      className="fx-hero on-dark"
      aria-roledescription="carousel"
      aria-label={label}
      data-wipe={wipe}
      onKeyDown={onKeyDown}
      onPointerEnter={() => {
        suspendRef.current.hover = true;
        syncDwell();
      }}
      onPointerLeave={() => {
        suspendRef.current.hover = false;
        syncDwell();
      }}
      onFocus={() => {
        suspendRef.current.focus = true;
        syncDwell();
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          suspendRef.current.focus = false;
          syncDwell();
        }
      }}
    >
      {n > 1 && (
        <div className="fx-hero__controls">
          {/* Rotation control first in tab order (APG carousel). */}
          <button
            type="button"
            className="fx-hero__ctrl fx-hero__ctrl--pause"
            aria-label={playing ? "Pause slideshow" : "Play slideshow"}
            aria-controls={slidesId}
            onClick={() => setPref(playing ? "off" : "on")}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              {playing ? <path d="M8 5v14M16 5v14" /> : <path d="M7 5l12 7-12 7z" />}
            </svg>
            <span>{playing ? "Pause" : "Play"}</span>
          </button>
          <button
            type="button"
            className="fx-hero__ctrl fx-hero__ctrl--nav fx-hero__ctrl--prev"
            aria-label="Previous slide"
            aria-controls={slidesId}
            onClick={() => void step(-1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            className="fx-hero__ctrl fx-hero__ctrl--nav fx-hero__ctrl--next"
            aria-label="Next slide"
            aria-controls={slidesId}
            onClick={() => void step(1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="fx-hero__status" aria-hidden="true">
            <span className="fx-hero__counter tnum">
              {pad2(index + 1)} / {pad2(n)}
            </span>
            <span className="fx-hero__progress" data-playing={playing || undefined}>
              <span ref={fillRef} className="fx-hero__progress-fill" />
            </span>
          </div>
          <div className="fx-hero__dots">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className="fx-hero__dot"
                aria-label={`Go to slide ${i + 1} of ${n}`}
                aria-current={i === index ? "true" : undefined}
                aria-controls={slidesId}
                onClick={() => void goTo(i, i > targetRef.current ? 1 : -1)}
              >
                <span aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        id={slidesId}
        className="fx-hero__slides"
        aria-live={playing ? "off" : "polite"}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipeRef.current = null)}
      >
        {slides.map((s, i) => {
          const state = stateOf(i);
          const hidden = state === "idle" || state === "leaving";
          return (
            <div
              key={s.id}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              className="fx-hero__slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${n}`}
              data-state={state}
              inert={hidden}
            >
              <div className="fx-hero__media">
                <div className="fx-hero__media-inner">
                  {(i === 0 || primed.has(i)) && (
                    <img
                      className="fx-hero__img"
                      src={s.image.src1600}
                      srcSet={srcSetOf(s)}
                      sizes={SIZES}
                      // Decorative: the headline carries the message (ux-spec §5).
                      alt=""
                      width={1600}
                      height={1000}
                      fetchPriority={i === 0 ? "high" : "low"}
                      loading="eager"
                      decoding={i === 0 ? "auto" : "async"}
                      style={s.focal ? { objectPosition: s.focal } : undefined}
                    />
                  )}
                  <div className="fx-hero__scrim" aria-hidden="true" />
                </div>
              </div>
              <div className="fx-hero__copy">
                <p className="fx-hero__kicker eyebrow">{s.kicker}</p>
                <Heading className="fx-hero__headline font-display">
                  {s.lines.map((line, k) => (
                    <span key={k}>
                      <span className="fx-hero__line">
                        <span className="fx-hero__line-inner">{line}</span>
                      </span>
                      {k < s.lines.length - 1 ? " " : null}
                    </span>
                  ))}
                </Heading>
                <p className="fx-hero__sub">{s.sub}</p>
                <Link href={s.cta.href} className="fx-hero__cta">
                  {s.cta.label}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export { HeroWipe };
