# Visual Direction: Ruelook

Status: **approved for production by the autopilot** (checkpoints: none, so no freelancer review before build; recorded D-004). Inputs: Launch Brief, personas, inspiration board #1, studio references (board §3).

## Brand attributes
Urban · editorial · confident. A quality-first streetwear store that feels like a lookbook and buys like an app. Trust comes from clarity: big honest photography, plain-language stock and sizing, a calm interface around loud imagery.

## Territories considered
| Territory | Idea | Inspirations brought in | Verdict |
|---|---|---|---|
| **A. "Denim Sky" (recommended)** | Editorial light theme: deep ink type, denim-blue campaign colour, warm off-white canvas, grey product "plinths". Big condensed-wide display type. | #1 hero (sky-blue backdrop, low-angle models), #1 grey tiles, #1 bento promos, #1 navy/denim palette | **Chosen**: closest to the freelancer's ★★★ reference while owning a distinct type voice and accent |
| B. "Concrete" | Monochrome brutalist grid, raw mono type, hard borders | #1 grid only | Rejected: drops the colour and warmth that make #1 appealing |
| C. "Night Drop" | Dark theme, neon accent, drop countdowns | none directly | Parked: the brief says light theme; could be a later "drop" campaign skin |

## Palette (roles)
| Token | Hex | Role | Contrast note |
|---|---|---|---|
| `color.ink` | `#0E1726` | Primary text, primary buttons, header on light | 17.2:1 on canvas |
| `color.ink-soft` | `#4A5568` | Secondary text, meta | 7.4:1 on canvas |
| `color.canvas` | `#F7F6F3` | Page background (warm off-white) | — |
| `color.surface` | `#FFFFFF` | Cards, drawers, inputs | — |
| `color.plinth` | `#ECECE8` | Product image tile background | Never under text without ink |
| `color.line` | `#DCDBD5` | Dividers, input borders (3:1 vs surface for inputs → use `ink-soft` borders on focus) | — |
| `color.denim-700` | `#1E3F73` | Campaign/brand blue: hero overlays, promo tiles, links | 10.3:1 on canvas; white on it 10.9:1 |
| `color.denim-500` | `#3767B0` | Hero sky gradients, active tab underline | white text on it 5.5:1 (large + body OK) |
| `color.denim-100` | `#DCE6F5` | Selected chips, info banner bg | ink on it 14.6:1 |
| `color.signal` | `#FF5A1F` | **Accent**: sale badges, "AI" label, bag count, one CTA per view max | ink text on signal (5.9:1); never white text on it (3.1:1 fails body) |
| `color.success` | `#1F7A4D` | Stock "In stock", confirmations | 5.3:1 on surface |
| `color.danger` | `#C2261B` | Errors, out of stock | 5.6:1 on surface |

Contrast values are calculated estimates to re-verify with a checker in design QA (phase 3) and the a11y review (phase 7).

## Gradients and textures
- `gradient.sky`: `linear-gradient(180deg, #3767B0 0%, #6C93CF 55%, #A9C3E8 100%)`. Hero backdrop behind cut-out campaign images and the promo tile fallback. *(From #1's sky backdrop, recreated as a token so any photo can sit on it.)*
- `texture.grain`: 3% monochrome SVG noise overlay on the hero and promo tiles only (adds print/editorial tactility). Static, no animation.
- No glassmorphism, no mesh gradients: they clash with the editorial, print-like voice.

## Typography
| Role | Font | Settings |
|---|---|---|
| Display (hero, section titles, wordmark) | **Archivo** (Google Fonts, OFL), variable `wdth` 62–125 | Hero: 800 weight, `wdth` 112, tracking −2%, line-height 0.95, sizes 44/64/96 px (mobile/tablet/desktop). Section: 700, `wdth` 105, 28/40 px |
| UI and body | **Inter** (Google Fonts, OFL) | 400/500/600; body 16/24, small 14/20, micro 12/16 uppercase +6% tracking for eyebrows ("URBAN EDGE"-style kickers from #1) |
| Numerals | Inter `tnum` | Prices and quantities |

Wordmark: **RUELOOK** set in Archivo 900, `wdth` 125, tracking +4%, with the "O" replaced by a solid denim dot on the logo lockup only. It's a typographic placeholder mark, not a final identity (asset-sourcing rule: don't present an invented logo as final).

## Spacing, radius, elevation
- Spacing scale (4-pt): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Section rhythm: 96 desktop / 64 mobile.
- Grid: 12 columns, 1440 max content 1320, gutter 24; mobile 4 columns, margin 16, gutter 12. Product grid: 2 col mobile, 3 tablet, 4 desktop (from #1).
- Radius: `radius.none` 0 (images, tiles: editorial hard edges), `radius.sm` 4 (inputs, chips), `radius.pill` 999 (buttons, as in #1's white CTA), `radius.lg` 16 (drawers, sheets).
- Elevation: flat by default. `shadow.drawer` `0 24px 48px -12px rgba(14,23,38,.25)` for the cart drawer and sheets only.

## Focus (amended D-010)
Two-tone focus ring on every interactive element: `outline: 2px solid ink` + `box-shadow: 0 0 0 4px #FFFFFF` (white gap), inverted on dark/denim surfaces (white outline, ink gap). Reason: signal orange measured 2.89:1 on canvas and 1.81:1 on denim-500, which fails WCAG 1.4.11 (3:1). Signal stays an accent only.

## Text over imagery (amended D-010)
White text over `gradient.sky` mid-stop measures 3.13:1, so the hero always gets a scrim: `linear-gradient(90deg, rgba(14,23,38,.55) 0%, rgba(14,23,38,0) 60%)` behind the text column (mobile: bottom-up scrim). Each campaign photo is contrast-checked at the weakest point under the text.

## Imagery
- Campaign: full-bleed, low-angle or eye-level street portraits, daylight, blue/neutral backdrops; people who match the audience (West African and global streetwear wearers). Unsplash, unbranded clothing only (D-003 rule: no visible third-party logos).
- Product: centred on `color.plinth`, 4:5 ratio, consistent padding; second image (on-body or detail) shown on hover.
- Alt text: "Garment, colour, angle". Generated as drafts by local Llama, reviewed.

## Iconography
**Lucide** (ISC licence), 1.5 px stroke, 20/24 px. One family only.

## Motion principles
| Token | Value | Use |
|---|---|---|
| `motion.fast` | 120 ms, `cubic-bezier(.2,0,0,1)` | Hover, press, toggles |
| `motion.base` | 240 ms, `cubic-bezier(.2,0,0,1)` | Drawers, tab switches, image swap |
| `motion.slow` | 560 ms, `cubic-bezier(.16,1,.3,1)` | Hero slide transitions, the "Complete the look" assembly |
| `motion.stagger` | 60 ms | Grid and look item reveals |
| `motion.stagger-max` | 360 ms | Cap on total stagger |
| `motion.exit` | 160 ms, `cubic-bezier(.4,0,1,1)` | Elements leaving (drawers closing, toasts) |
| `motion.draw` | 640 ms, `cubic-bezier(.65,0,.35,1)` | SVG connector line draw (look board) |
| `motion.reduced` | 120 ms linear, opacity only | All reduced-motion fallbacks |
| `motion.hero-dwell` | 6000 ms | Hero autoplay interval |
| `ease.standard` / `ease.emphasized` | `cubic-bezier(.2,0,0,1)` / `cubic-bezier(.16,1,.3,1)` | Named easings |

Prototypes and feasibility: `docs/design/prototypes/` (both Must effects: go; CSS/WAAPI only, no motion library).

What moves: imagery, reveals, drawers, feedback. What never moves: prices, form fields, body text, focus rings. Every animation has a `prefers-reduced-motion` alternative (crossfade ≤120 ms or none).

## Signature interactions (from the delight backlog)
1. **Hero "headline wipe"**: on slide change, the photo reveals with a vertical mask wipe (clip-path) while the display headline rises line by line (60 ms stagger). *Reduced motion:* instant crossfade, no autoplay.
2. **"Complete the look" assembly**: the current product sits at the centre; the 2–4 look items slide in from the edges onto a lookbook "board", with a hand-drawn connector line drawing in (SVG stroke-dashoffset). "Suggested by AI" chip in signal orange. *Reduced motion:* items fade in place, line shown static.
3. **Add-to-bag "drop"**: the product thumbnail scales down and travels along a short arc to the bag icon; the bag count ticks up with a 1-frame bounce. *Reduced motion:* bag count changes, with a polite live-region announcement only.

## Sample component direction
- **Primary button:** ink fill, white Inter 600 14 px uppercase +4%, pill, 48 px tall; hover = denim-700; focus = 2 px signal outline offset 2.
- **Secondary (on imagery):** white fill, ink text (from #1's "Discovery Now" button), pill.
- **Product card:** plinth image 4:5, heart top-right (44 px hit area), eyebrow category (micro), name (body 14, 2 lines max), price (tnum 600); hover = second image + "Quick add" bar sliding up.
- **Category tabs:** text tabs, uppercase micro, active = ink + 2 px denim-500 underline that slides between tabs (`motion.base`).
- **Promo bento:** 1 tall + 3 small tiles (desktop), stacked on mobile; one tile is a solid denim-700 "type-only" tile with a huge Archivo number (adapted from #1's 50% tile, used for "New drop / 24 pieces" instead of a discount to avoid fake sales claims).

## Inspiration traceability
See `docs/design/inspiration-board.md` §5.

## Figma handoff notes
Create variables collections `color`, `space`, `radius`, `motion` (number/string), `type` styles with the names above, so they map 1:1 to Tailwind theme keys (`colors.ink`, `spacing.4` …).
