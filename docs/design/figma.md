# Figma: Ruelook — Product Design

- **File:** https://www.figma.com/design/ZcXrxPBt13gJk2eYhuM8tD (team "awesome bss's team", Starter plan)
- **Status (2026-11-25):** in progress. Foundations and core components are built. Screens, cover, flows and showcase frames are still to do. Work stopped when the Starter plan's MCP tool-call limit was reached (D-015).

## Structure (Starter plan: 3 pages max, D-015)
| Page | Contents | Status |
|---|---|---|
| Cover & Showcase (`0:1`) | Cover frame (thumbnail), user flows, Behance cover / bento / social frames | ⏳ To do |
| Design System (`2:4`) | Foundations specimen + components | ✅ Built |
| UI Screens (`2:5`) | Mobile 390×844 and desktop 1440×1024 hi-fi screens with states; prototype notes | ⏳ To do |

The planned 9-page layout (00 Cover … 08 Showcase) is kept as named sections on these 3 pages.

## Variables (collection "Ruelook", mode "Light"): 33 variables
Every variable has explicit scopes and WEB code syntax equal to the CSS custom property in `src/styles/globals.css` / `motion.css`.

| Figma variable | Code token | Value |
|---|---|---|
| color/ink | `var(--color-ink)` | #0E1726 |
| color/ink-soft | `var(--color-ink-soft)` | #4A5568 |
| color/canvas | `var(--color-canvas)` | #F7F6F3 |
| color/surface | `var(--color-surface)` | #FFFFFF |
| color/plinth | `var(--color-plinth)` | #ECECE8 |
| color/line | `var(--color-line)` | #DCDBD5 |
| color/denim-700 / 500 / 100 | `var(--color-denim-*)` | #1E3F73 / #3767B0 / #DCE6F5 |
| color/signal | `var(--color-signal)` | #FF5A1F (accent only) |
| color/success / danger | `var(--color-success)` / `var(--color-danger)` | #1F7A4D / #C2261B |
| spacing/1…24 | `calc(var(--spacing) * N)` | 4 px base |
| radius/sm, lg, pill | `var(--radius-*)` | 4 / 16 / 999 |
| motion/fast … hero-dwell | `var(--motion-*)` | 120 … 6000 ms (no scopes; reference only) |

**Text styles (12):** Display/Hero, H1–H4 (Archivo Black/Bold); Body/L, M, M Strong, S (Inter); Label/Eyebrow, Button, Price. **Effect style:** Shadow/Drawer.
Archivo in Figma has no width axis, while the code uses `wdth` 112–125, so display type renders slightly narrower in Figma.

## Components (page Design System), all bound to the variables
| Component set | Variants | Code |
|---|---|---|
| Button | Style (Primary, Secondary, Ghost, OnImage) × State (Default, Hover, Focus, Disabled, Loading) = 20; `Label` text property | `src/components/ui/Button.tsx` |
| Size chip | Default, Hover, Selected, Focus, Unavailable; `Size` text property | PDP size fieldset, `QuickAddSheet` |
| Badge | New, Low stock, Sold out, Suggested by AI, Drop | `ProductCard`, `LookBoard` |
| Input | Default, Focus, Error, Disabled | checkout and auth forms |
| Product card | Default, New, Low stock, Sold out (real catalogue photos) | `src/components/store/ProductCard.tsx` |

Focus states use the two-tone ink/white ring (D-010). Touch targets are ≥44 px (buttons and chips 48 px, the wishlist heart 44 px).

## Design QA (so far)
- ✅ Every colour, radius and fill in the components is bound to a variable (no hard-coded colours)
- ✅ Contrast: ink on canvas 16.5:1; white on denim-700 and ink pass AA; signal is used only behind ink text
- ✅ Touch targets ≥44 px
- ⏳ Screens: all states per the ux-spec (loading, empty, error, unauthorized, success). Not built yet
- ⏳ Visual review screenshot of the Design System page (blocked by the call limit)

## Remaining work (resume when the call limit resets, or on a paid plan)
1. Hi-fi screens: capture the built app (local export or live URL) with `generate_figma_design` at 390 and 1440 for home, shop, PDP + AI Stylist, bag drawer, checkout + error summary, confirmation, sign-in, account, admin. Then add the state variants.
2. Cover frame and the user-flow diagram.
3. Showcase frames (Behance 1616×1264 cover, bento, 1080×1350, 1080×1920), refreshed from live captures in phase 10.
4. A visual review of every page, then mark phase 3 done.
