# Prototypes and effect feasibility: Ruelook

Owner: creative-technologist · Phase 2 (design direction) · 2026-11-25
Status: **throwaway prototypes**. Nothing in this folder ships. Production code will live in `src/components/fx/`, `src/lib/fx/` and `src/styles/motion.css` (phase 6).

| Prototype | Open | Covers |
|---|---|---|
| Hero "headline wipe" | `hero-headline-wipe/index.html` | Signature interaction 1 (board 1a, S2), Must |
| "Complete the look" assembly | `complete-the-look/index.html` | Signature interaction 2 (board S3), Must; also shows the sliding tab underline (Should) |

Both files are self-contained: inline CSS/JS, no libraries, no network requests. Garments and figures are inline SVG placeholders in place of Unsplash photos. Fonts fall back to system faces; production uses Archivo (display) and Inter (UI), both OFL, self-hosted through `next/font`. Each file has a prototype toolbar: **Simulate reduced motion** (live switch, alongside the real OS setting), **Slow motion ×4** (to judge the choreography), and an rAF frame meter. The hero also has a **wipe technique** switch (clip-path or transform mask), and the board has **Replay** and **Show fallback (no looks)**.

## 1. Feasibility, per delight-backlog item

None of the items needs canvas, WebGL or 3D. Each one works on the CSS/WAAPI rung, so the project adds **no motion library**. Motion (framer-motion) and GSAP are not needed for v1. That keeps three.js, GSAP and Motion out of the bundle and leaves nothing to licence.

| Effect | Priority | Lowest rung that works | Technique | Cost (build / runtime) | Risk | Reduced-motion fallback | Perf budget | Verdict |
|---|---|---|---|---|---|---|---|---|
| **Hero "headline wipe"** | Must | CSS + WAAPI | Incoming slide's media layer animates `clip-path: inset()` from 100% to 0 (bottom-up going forward, top-down going back). Each headline line sits in its own `overflow:hidden` mask and its inner span rises `translateY(110%)→0`, 60 ms apart. Kicker, sub and CTA fade-rise after the lines. Outgoing copy exits in 160 ms. Autoplay is a WAAPI progress bar whose `finish` advances the slide, so pausing just pauses one animation. | M / about 2.6 KB gz JS in the prototype (expect less than 2 KB in production as a client island) | (1) A `clip-path` animation repaints the full-bleed layer every frame on the main thread in most engines. On a weak phone that can drop frames while a large photo is decoding. **Mitigation:** the prototype also has a *transform mask* (outer `translateY(±100%)`, inner counter-translate), which runs on the compositor and looks the same; switch to it if the phone test shows jank. (2) Line splitting: lines are authored (headline stored as an array of lines), not measured at runtime, so there's no resize re-split. A line that wraps on 360 px still rises as one block. (3) The next slide's image must be decoded before the wipe starts, otherwise the reveal shows a blank: preload slide n+1 and wait on `img.decode()`. | 120 ms crossfade (`opacity`), no line rise, **no autoplay** (Play stays available to the user). Switches live when the OS preference changes. | ≥ 45 fps sustained during the transition on a mid-range phone (target 60). No JS before hydration: the first slide is server-rendered static HTML and is the LCP element, so the effect never delays LCP. Only slides 2 and 3 load lazily. | **Go.** Default to clip-path. Fall back to the transform mask if the phase 6/7 device test is below 45 fps. |
| **"Complete the look" assembly** | Must | CSS grid + WAAPI + inline SVG | The anchor product sits in the centre grid area, with 2–4 look items in fixed slots around it (desktop) or a 2-column stack below (mobile). Items enter from the side they sit on (`translate(±48px)` or `translateY(32px)` plus opacity), 60 ms apart. Connectors are SVG cubic paths computed from layout boxes (`offset*`, so they ignore transforms), with a seeded wobble so they look hand-drawn but stay reproducible. They draw in with `stroke-dashoffset` over 640 ms on an in-out curve. On mobile, connectors chain to the nearest card above, so a line never runs behind card text. Paths are rebuilt by `ResizeObserver`. | M / about 4.6 KB gz JS in the prototype (expect about 3 KB in production) | (1) `stroke-dashoffset` isn't transform/opacity. This is a **deliberate exception**: it repaints only a thin SVG overlay with no layout, and measured frame cost stayed low (below). (2) Paths depend on final image sizes: reserve the 4:5 aspect ratio on tiles (already the card spec) so nothing shifts after the images load. (3) The board must still make sense with no JS (a plain list of items plus the rationale), which is how it works before the IntersectionObserver fires. (4) Content honesty: keep the "Suggested by AI" chip and the rationale with every look. | Items fade in place in 120 ms, connectors appear already drawn, no stagger. | ≥ 45 fps during assembly. The assembly runs once on first view (when 35% of the board is visible) and on each look switch, never in a loop. The section sits below the fold on the PDP, so it can't affect LCP. | **Go.** |
| Add-to-bag "drop" arc + count tick | Should | WAAPI (FLIP) | Clone the thumbnail into a fixed-position layer, then run two WAAPI tracks: X on linear timing and Y on ease-in, which gives a parabolic arc with transforms only, ending at the bag icon's rect. The count does a `scale(1→1.2→1)` bounce over 240 ms. Remove the clone on `finish`. | S / under 1 KB | The bag icon may be off-screen (sticky header hidden on scroll), so skip the arc when its rect isn't visible. Don't block the cart update on the animation. | No flight. The count changes and a polite live region says "Added to bag. 3 items." | One composited layer, under 400 ms. | **Go** (phase 6, after the Musts) |
| Sliding tab underline | Should | CSS transition | One absolutely positioned underline, `transform: translateX() scaleX()` from the active tab's offset and width over `motion.base`. Already in the board prototype. | S / about 0.2 KB | Scaling a 2 px bar is fine. Don't use scaleX on a bar with rounded ends (they distort). Recompute on resize and font load. | Instant move (`transition: none`). | Transform only. | **Go** |
| Card hover second image + quick-add bar | Should | CSS | Stack the second image and crossfade with `opacity` over `motion.base`. The quick-add bar does `translateY(100%)→0`. Show it on `:hover` and `:focus-within`. On touch (no hover), the bar is always visible below the image as a button, and there's no second-image swap. | S / 0 KB JS | Load the second image lazily (`loading="lazy"`, low priority) or it doubles grid image weight. Gate with `@media (hover:hover)` so touch users don't get sticky hover. | Image swap without the slide (opacity crossfade at 120 ms), bar shown without movement. | No JS. Transform/opacity only. | **Go** |
| Static 3% grain | Nice | CSS | An inline SVG `feTurbulence` data-URI as a background at 3% opacity. Static. It's in the hero prototype. | S / about 0.5 KB CSS | Generated at runtime, it can cost a paint on huge layers: bake it to a 160 px tiled PNG/WebP in `public/fx/` (about 3–6 KB) for production. | n/a (static) | One small tiled image. | **Go** (bake it as a tile) |

**Effects deliberately not proposed:** parallax on product imagery (an anti-pattern on the board), mesh or shader gradients (visual-direction rejects them), and any WebGL. Three signature moments are the cap (board S2).

## 2. Measurements (honest scope)

Run on 2026-11-25 with **headless Microsoft Edge** (Chromium) driven over the DevTools protocol from a scratch script, at a 412×915 mobile viewport, DPR 1, with CPU throttling at 1×, 4× and 6×. Each sample covered 1.4 s spanning one full transition, three transitions per setting.

| Run | Avg rAF rate | Longest frame | Frames > 33 ms (per 1.4 s sample) |
|---|---|---|---|
| Hero, clip-path, CPU 4× | 127–136 fps | 21–28 ms | 0 |
| Hero, clip-path, CPU 6× | 129–136 fps | 21–42 ms | 0–1 |
| Hero, transform mask, CPU 4× | 133–140 fps | 18–21 ms | 0 |
| Hero, transform mask, CPU 6× | 126–132 fps | 28–42 ms | 0–2 |
| Board look switch, CPU 4× | 133–142 fps | 15–77 ms (one outlier, the first switch) | 0–1 |
| Board look switch, CPU 6× | 135–142 fps | 15–42 ms | 0–1 |

How to read this: headless Chromium isn't vsync-locked (hence more than 120 fps) and doesn't use a real mobile GPU, so these numbers **show no obvious main-thread hotspot. They do not show 60 fps on a phone.** The occasional 35–77 ms frame lines up with the moment the transition starts (style recalculation as the new slide or look becomes visible). Watch for it on the real device. Real-device fps on a mid-range Android phone (e.g. a Pixel 6a or Galaxy A54 class) plus a Performance trace is **still to be done** in phase 7. That test decides between clip-path and the transform mask.

Also verified in the same runs:
- Zero console errors or exceptions in either prototype, in any mode.
- With reduced motion emulated, the hero loads paused (button reads "Play", the slides region has `aria-live="polite"`), and transitions crossfade.
- Screenshots of the normal, mid-transition, reduced-motion and fallback states at 1440 and 360 px were captured to the session scratchpad. They are not committed: they show throwaway placeholder art. QA re-captures them from the production components in phase 7.
- No-WebGL testing doesn't apply, since nothing uses WebGL.

## 3. Motion tokens: confirmation and adjustments

**Confirmed unchanged:** `motion.fast` 120 ms, `motion.base` 240 ms, `motion.slow` 560 ms on `cubic-bezier(.16,1,.3,1)`, and `motion.stagger` 60 ms. In the prototypes, 560 ms with the emphasized curve feels right for both signature moments. Because the curve is front-loaded, about 80% of the travel is done by about 250 ms, so the UI never feels slow.

**Proposed additions** (small, and all used by the prototypes):

| Token | Value | Why |
|---|---|---|
| `ease.standard` | `cubic-bezier(.2,0,0,1)` | Name the easing apart from the duration so Tailwind and Figma can combine them (`motion.fast` = 120 ms + `ease.standard`). |
| `ease.emphasized` | `cubic-bezier(.16,1,.3,1)` | Same reason, for `motion.slow`. |
| `motion.exit` | 160 ms, `cubic-bezier(.4,0,1,1)` (accelerate) | Exits should be faster than entries and accelerate away. Used for the outgoing hero copy and the outgoing look items, so two states never compete. |
| `motion.draw` | 640 ms, `cubic-bezier(.65,0,.35,1)` (in-out) | A line drawing on an expo-out curve looks like it "snaps". An in-out curve reads as a pen stroke. Used only for the connector. |
| `motion.reduced` | 120 ms, `linear`, opacity only | Turns the "crossfade ≤ 120 ms" rule into a token every reduced-motion branch shares. |
| `motion.stagger-max` | 360 ms (6 × 60 ms) | Caps the total stagger on grids so item 12 doesn't wait 720 ms. Items after the 6th share the last delay. |
| `motion.hero-dwell` | 6000 ms | Autoplay interval. It runs longer than 5 s, so the visible Pause control is mandatory (WCAG 2.2.2), as the prototype does. |

Choreography constants (spec values, not tokens): the hero line rise starts 120 ms after the wipe begins, so the image leads and the type follows. The connector draw starts 120 ms after its item starts moving.

## 4. Risks and findings for the Delivery Lead

1. **Focus ring contrast (visual-direction change needed).** The specified focus ring, a 2 px `signal` outline, measures **2.89:1 on canvas, 3.12:1 on white and 1.81:1 on denim-500**. That fails the 3:1 non-text contrast (WCAG 1.4.11) on the page background and on the hero sky. Both prototypes use a two-tone ring instead: `outline: 2px solid ink; outline-offset: 2px; box-shadow: 0 0 0 2px #fff`, which keeps a ≥ 3:1 edge on both light and dark surfaces. **Decision needed:** adopt the two-tone ring in visual-direction.md (owner: visual direction/UX). Signal can stay as an accent but not as the only ring colour.
2. **Hero text contrast depends on the photo.** White text on the middle of `gradient.sky` (#6C93CF) is 3.13:1, enough for the large headline but failing for body or kicker text. The prototype adds an ink scrim (left and bottom on desktop, bottom on mobile, and a light scrim on light slides). Keep a scrim token on the hero and check the weakest point of every campaign photo in phase 7.
3. **clip-path wipe performance** on low-end Android is unmeasured. The transform-mask fallback is ready (see §1).
4. **Next-slide decode.** Production must preload and `decode()` slide n+1, otherwise the wipe reveals an empty frame on slow 3G/4G, which is common in the launch markets.
5. **Autoplay suspension** follows the APG carousel pattern: rotation pauses while the pointer or keyboard focus is inside the hero, resumes when both leave, and stops when the tab is hidden. The full-stack engineer shouldn't add a second timer.
6. **No new dependencies or licences.** Everything is CSS/WAAPI/inline SVG. Archivo and Inter are OFL and were already chosen.

## 5. Production mount points (for phase 3/6 planning)

- `<HeroWipe slides={...} />` in `src/components/fx/HeroWipe.tsx`. This is a client island. Slide 1 HTML and its image are server-rendered as the poster/LCP element, and the island hydrates the controls and slides 2+. Props: `slides: { kicker, lines: string[], sub, cta: {label, href}, image: {src, alt, focal}, theme: 'dark'|'light' }[]`, `dwellMs?`.
- `<LookBoard anchor={product} looks={looks} />` in `src/components/fx/LookBoard.tsx`. `looks` come from the pre-generated Supabase rows (AC-8), and `looks.length === 0` renders the fallback. The full-stack engineer owns data fetching and the PDP layout. This component owns only the board's presentation and motion.
- Shared helpers in `src/lib/fx/` (`motion.ts` for tokens, `usePrefersReducedMotion`, `useInView`, seeded `rng`), with the CSS tokens in `src/styles/motion.css`.
- Capture mode for phase 10 (`?capture=1`): no autoplay, fixed connector seed (already seeded per look), and `step()`/`select()` hooks for frame-by-frame capture.

## 6. Figma prototype notes (phase 3, run in-thread by the Delivery Lead)

- Hero: three frames (Slide 1–3, desktop and mobile). Use Smart Animate between them with the "gentle"/custom bezier (.16,1,.3,1) at 560 ms. Mask the image layer with a rectangle whose height animates from 0 to full, and give each headline line its own clipped frame with the text offset 110% below. Wire **On click** to the prev/next components and add a 6 s **After delay** for autoplay (`figma:figma-use-motion`).
- Board: four frames (empty, Look 1, Look 2, Look 3). Smart Animate items from off-slot positions and the connector with a dash offset where Figma supports it, or a mask reveal otherwise.
- No shader fills, 3D transforms or generative plugins are needed.
