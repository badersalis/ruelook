# Ruelook screens (captured from the built app)

These are captured from the static export with `npx playwright test -c scripts/capture/playwright.capture.config.ts`. Set `E2E_BASE_URL` to capture the live site instead. Reduced motion is on, and the home page uses `?capture=1`, so captures are deterministic. No orders are placed during capture.

- `desktop/` is 1440 wide, matching the Figma frame size of 1440×1024. Full pages are taller than 1024.
- `mobile/` is 390 wide at 2× (780 px files), matching the Figma frame size of 390×844.

These are the source images for the Figma **UI Screens** page (D-015). They get imported once the Figma call limit allows.

| # | Screen / state | Journey / AC | Desktop | Mobile |
|---|---|---|---|---|
| 01 | Home: hero, New Arrivals tabs, promo bento, bags banner | Browse, AC-1 | [png](desktop/01-home.png) | [png](mobile/01-home.png) |
| 02 | Shop: all pieces | Browse, AC-2 | [png](desktop/02-shop.png) | [png](mobile/02-shop.png) |
| 03 | Shop: filtered (Men, price low to high) | AC-2 | [png](desktop/03-shop-filtered.png) | [png](mobile/03-shop-filtered.png) |
| 04 | Shop: empty search result | Empty state | [png](desktop/04-shop-empty.png) | [png](mobile/04-shop-empty.png) |
| 05 | Product page | AC-3 | [png](desktop/05-product.png) | [png](mobile/05-product.png) |
| 06 | Product page: size required error | Error state | [png](desktop/06-product-size-error.png) | [png](mobile/06-product-size-error.png) |
| 07 | Product page: sold out | Unavailable state | [png](desktop/07-product-sold-out.png) | [png](mobile/07-product-sold-out.png) |
| 08 | Bag: empty | Empty state | [png](desktop/08-bag-empty.png) | [png](mobile/08-bag-empty.png) |
| 09 | Bag drawer after add | AC-4 success | [png](desktop/09-bag-drawer.png) | [png](mobile/09-bag-drawer.png) |
| 10 | Bag page | AC-4 | [png](desktop/10-bag.png) | [png](mobile/10-bag.png) |
| 11 | Checkout | AC-5 | [png](desktop/11-checkout.png) | [png](mobile/11-checkout.png) |
| 12 | Checkout: error summary + inline errors | Error state | [png](desktop/12-checkout-errors.png) | [png](mobile/12-checkout-errors.png) |
| 13 | Sign in | AC-6 | [png](desktop/13-sign-in.png) | [png](mobile/13-sign-in.png) |
| 14 | Sign in: wishlist prompt (guest tapped heart) | Unauthorized state | [png](desktop/14-sign-in-wishlist-prompt.png) | [png](mobile/14-sign-in-wishlist-prompt.png) |
| 15 | Sign up | AC-6 | [png](desktop/15-sign-up.png) | [png](mobile/15-sign-up.png) |
| 16 | Not found (unknown product) | Error state | [png](desktop/16-not-found.png) | [png](mobile/16-not-found.png) |
| 17 | Search overlay | Browse | [png](desktop/17-search.png) | [png](mobile/17-search.png) |
| 18 | Mobile menu | Navigation | n/a | [png](mobile/18-menu.png) |

**Not captured yet**
- Order confirmation, account orders and admin screens all need a signed-in or admin session, or a real order token. They come after the demo admin account exists (see `docs/deliverables/README.md`).
- The AI Stylist section is hidden until `ai_looks` is seeded.

**Design QA found during capture:** the wishlist heart was nearly invisible on dark product photos. It now sits on a white disc (85% opacity), and the touch target stays 44 px. Fixed in `ProductCard.tsx`.
