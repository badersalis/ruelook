# Inspiration Board — Ruelook

> Reference files are for internal inspiration only. They are not production assets: they are never shipped, published or copied as a whole. Anything used in the product is recreated or sourced with a verified licence (see `asset-sourcing`).

## 1. Freelancer inspirations

| # | Link or file | Category | What exactly inspires you | Strength (★–★★★) | Notes / where you picture it |
|---|---|---|---|---|---|
| 1 | `docs/design/inspiration/ref-01-fashion-homepage.jpeg` (a commercial fashion theme homepage) | layout and composition · photography · colour palette · typography | Full-bleed editorial hero (sky-blue backdrop, low-angle streetwear models, large geometric sans headline, white CTA, carousel arrows); New Arrivals grid with category tabs on light-grey product tiles; asymmetric bento promo banners incl. a bold "50%" tile; navy / denim / white palette | ★★★ (only reference supplied) | Home page; shop grid; promo blocks. Adapt principles only; the source is a paid theme, so don't copy layout, wordmark or imagery |

Vibe (default): urban, editorial, confident. Theme: light.

**Things you dislike or want to avoid:**
- Real brand logos on products (the reference shows them; Ruelook uses unbranded items)

## 2. Analysis (filled in by `design-research`)

| # | Element pulled out | Why it works | How we adapt it to this product (not copy) | Fits brand and audience? | Build effort (S/M/L) | Performance / accessibility risk and fallback | Decision |
|---|---|---|---|---|---|---|---|
| 1a | Full-bleed editorial hero: sky-blue backdrop, low-angle models, large geometric sans headline + small uppercase kicker, white pill CTA, side arrows | Big honest imagery sells the clothes; low angle gives attitude; one clear CTA | Recreated with our own Unsplash campaign photos on a `gradient.sky` token, Archivo wide display type, signature "headline wipe" transition | Yes: core of "urban, editorial, confident" | M (clip-path + CSS/Motion) | Autoplay must pause; reduced-motion = crossfade, no autoplay; text contrast on photo via ink scrim | **Adopt (adapted)** |
| 1b | New Arrivals grid with category tabs on light-grey product plinths, 4 columns | Uniform plinths make mixed product photos feel like one collection; tabs keep the home short | `color.plinth` tiles, 2/3/4-column responsive grid, sliding tab underline, hover second image | Yes | S | Tabs must be a proper tablist (arrow keys) | **Adopt** |
| 1c | Asymmetric bento of promo banners incl. a type-only "50%" tile | Rhythm break after the grid; a type-only tile adds graphic punch with no photo | 1 tall + 3 small bento; the type tile becomes "New drop / 24 pieces" (no fake discount claims) | Yes | S | Tiles are links with descriptive names | **Adapt** |
| 1d | Navy / denim / white palette | Calm, trustworthy, matches denim/streetwear | `ink`, `denim-700/500/100`, warm `canvas`, plus a `signal` orange accent so it isn't a template clone | Yes | S | Contrast table in visual-direction.md | **Adapt** |
| 1e | Real brand products (adidas, Carhartt) and a theme wordmark | — | Not used: unbranded products only; own RUELOOK wordmark | — | — | Trademark/licence risk | **Reject**: rights |

## 3. Studio-found references

| # | URL | Date accessed | Element | Why it works | Proposed use | Decision |
|---|---|---|---|---|---|---|
| S1 | https://mycodelesswebsite.com/streetwear-brand-website-examples/ (mentions HBX) | 2026-11-25 | Products framed with an editorial, magazine lens | Supports #1's editorial direction; content-led shopping | Editorial kickers + campaign storytelling on home | Adopt (principle) |
| S2 | https://www.awwwards.com/websites/winner_category_ecommerce/ | 2026-11-25 | Award-level e-commerce use restrained UI around strong imagery and one signature motion moment | Confirms "calm UI, loud imagery, one wow moment" | Limit signature effects to 3 | Adopt (principle) |
| S3 | Competitor analysis (docs/research/competitor-analysis.md) | 2026-11-25 | "Complete the look" outfit modules on major fashion retailers | Validates the AI Stylist as a known pattern; our differentiator is the editorial "board" presentation + rationale text | Signature interaction 2 | Adopt |

**Recurring themes:** calm editorial UI around loud, honest photography; one denim campaign colour; wide display type; motion only where it sells (hero, outfit, bag).
**Anti-patterns:** real brand logos; fake discounts or urgency timers; glassmorphism/mesh gradients; autoplay without pause; parallax on product images.

## 4. Delight backlog

| Effect | Source (# or S#) | Where it appears | Priority (Must / Should / Nice) | Effort | Reduced-motion / fallback | Status |
|---|---|---|---|---|---|---|
| Hero "headline wipe" (clip-path mask wipe + staggered line rise) | 1a, S2 | Home hero | Must | M | Crossfade, no autoplay | Prototyped ✅ docs/design/prototypes/hero-headline-wipe (go; transform-mask fallback if device <45 fps) |
| "Complete the look" assembly (items slide onto a board, SVG connector draws in) | S3 | PDP AI Stylist | Must | M | Fade in place, static line | Prototyped ✅ docs/design/prototypes/complete-the-look (go) |
| Add-to-bag "drop" arc + count tick | — | PDP, cards | Should | S | Count change + live region | Feasible (S, CSS/WAAPI) |
| Sliding tab underline | 1b | New Arrivals, shop | Should | S | Instant move | Proposed |
| Card hover second image + quick-add bar | 1b | Product cards | Should | S | Hover image swap without slide | Proposed |
| Static 3% grain on campaign surfaces | 1a | Hero, promo tiles | Nice | S | n/a (static) | Proposed |

## 5. Traceability: inspiration → final design

| Inspiration # | Adopted as (token, component, effect) | Where in the product | Implemented and verified? |
|---|---|---|---|
| 1a | `gradient.sky`, Archivo display, Hero component, headline-wipe effect | Home hero | Pending (phase 3/6) |
| 1b | `color.plinth`, ProductCard, Tabs | Home, shop, PDP related | Pending |
| 1c | PromoBento with type-only tile | Home | Pending |
| 1d | `ink`, `denim-*`, `canvas` colour tokens | Global | Pending |
