# Product Requirements: Ruelook v1

Source of truth for scope: the Launch Brief in `docs/project-brief.md` (GO D-002). Each story traces to a Launch Brief acceptance criterion (AC-n). Personas: `docs/research/personas.md`. Competitors: `docs/research/competitor-analysis.md`.

## Problem
Streetwear shoppers who want quality pieces have to choose between crowded marketplaces, where quality and fit are hard to judge, and scattered Instagram or brand stores, which are inconsistent and have weak checkout. Ruelook is a curated, editorial, mobile-first store where discovery feels like a lookbook and buying is quick. *(Hypothesis; no user research for this portfolio piece.)*

## Users and jobs-to-be-done
| Persona | Core job |
|---|---|
| Kwame, "the quality hunter" (primary) | When I see a piece I like, I want to judge its quality, fit and how to wear it quickly, so I buy with confidence. |
| Ada, "the outfit builder" (primary) | When I buy one item, I want ideas for what goes with it, so I get a full look without guesswork. |
| Admin/merchandiser (secondary) | When new stock arrives, I want to publish products with photos in minutes, and see incoming orders. |

## Goals and measurable outcomes
- Showcase goal: a polished, fully working demo that proves product design and full-stack skill (Behance case study, live URL).
- Product proxies (demo-measurable): home → product → cart in ≤3 taps; checkout in one screen; LCP < 2.5 s; Lighthouse a11y ≥ 95.

## Non-goals
Real payments, shipping integrations, multi-vendor, review submission, promo codes, multi-currency, translations, marketing email/push, native apps, analytics (Launch Brief "Out of scope").

## MVP features
| ID | Feature | Priority |
|---|---|---|
| F1 | Home and catalogue (hero, New Arrivals tabs, promo bento, shop listing with filter/sort/search) | Must |
| F2 | Product detail page (gallery, variants, stock, related) | Must |
| F3 | AI Stylist "Complete the look" | Must |
| F4 | Cart and order-request checkout | Must |
| F5 | Auth, wishlist, account (orders, profile) | Must |
| F6 | Admin: products, images, orders | Must |
| — | Next: reviews display, size guide modal, recently viewed | Next (not v1) |
| — | Later: payments, multi-currency, French | Later (change-request) |

## User stories and acceptance criteria

### F1 Home and catalogue (AC-1, AC-2)
- **US-1.1** As a shopper, I want an editorial home page so I can sense the brand and the latest drops at a glance.
  - Given the home page loads, then a full-bleed hero shows the headline, subline, a CTA to the shop, and ≥2 slides with prev/next controls that are keyboard operable. Autoplay pauses on hover/focus and is off under `prefers-reduced-motion`.
  - New Arrivals is headed as a dated drop ("Drop 07 · New Arrivals", copy only, D-005) and shows tabs Women, Men, Shoes, Bags, Accessories. Selecting a tab shows ≥8 products of that category, sorted newest first, from Supabase.
  - A promo bento of 4 tiles links to filtered shop views.
  - It renders without horizontal scroll at 360 px and 1440 px.
- **US-1.2** As a shopper, I want to filter, sort and search the shop so I find what fits me.
  - Filtering by category, sorting (newest, price low→high, high→low) and searching by name (case-insensitive, ≥2 chars) combine together.
  - The state is in the URL query (`?category=men&sort=price_asc&q=hood`). Reloading or sharing restores it.
  - Zero results show an empty state with a "clear filters" action. Loading shows skeleton tiles; an error shows a retry.
  - Only `published` products appear.

### F2 Product detail (AC-3)
- **US-2.1** As a shopper, I want to see a product properly before buying.
  - The PDP shows ≥3 images (swipe on mobile, thumbnails on desktop, every image with alt text), name, price (USD, `$120.00` format), description, material/care, colour swatches and a size selector.
  - Variants with stock 0 are disabled and announced as "out of stock". If all are 0, the product shows "Sold out" and add-to-cart is disabled.
  - Clicking "Add to bag" with no size selected shows an inline error "Select a size" and moves focus to the size group. Nothing is added.
  - On success, the cart drawer opens with the item and the bag count updates.
  - An unknown slug shows a 404 state with a link to the shop.
- **US-2.2** As a shopper, I want related items, to keep browsing. The PDP shows 4 products from the same category, excluding the current one.

### F3 AI Stylist (AC-8)
- **US-3.1** As a shopper, I want outfit ideas built around this product so I can buy a full look.
  - The "Complete the look" section shows ≥3 looks. Each look = a title, one sentence of styling rationale, and 2–4 real catalogue products (linked, with price) that pair with the current product.
  - Every look is labelled "Suggested by AI". Each product in a look can be added to the bag (size chosen in a quick picker).
  - **Live site (`AI_MODE=demo`):** looks come from the `ai_looks` table (pre-generated locally with llama3.1:8b); no network call to any model.
  - **Local dev (`AI_MODE=local`):** a "Regenerate" button calls Ollama, validates the JSON output against a schema (only existing product IDs), and shows a loading state (≤20 s timeout, then an error with retry).
  - "Add the full look" steps through a size sheet for each in-stock item and adds them all to the bag; out-of-stock items in a look are shown but skipped (D-005).
  - Looks only reference products with at least one in-stock variant at generation time; the UI re-checks stock at render.
  - No looks for a product → the section is hidden on the live site; it is never empty-broken.

### F4 Cart and checkout (AC-4, AC-5)
- **US-4.1** As a shopper, I want a bag that remembers my items.
  - Lines show image, name, colour, size, unit price, qty stepper (1–10, capped by stock) and remove. Subtotal is the sum of lines, in USD.
  - Guests: the cart persists in localStorage across reloads. On login, the guest cart merges into the account cart (same variant → quantities add, capped).
  - An empty bag shows an empty state with a link to New Arrivals.
- **US-4.2** As a shopper, I want to place an order request.
  - Checkout requires: full name, email, phone, country (default Ghana; list of English-speaking West African countries + "Other"), city, address line. Invalid fields show inline messages; submit stays disabled while submitting.
  - A persistent banner reads: "Demo store, no payment is taken. Orders are requests only."
  - Submitting creates an `orders` row (status `requested`) and its `order_items` with price snapshots, clears the cart, and shows a confirmation with the order number.
  - Guest checkout is allowed (order linked to email); signed-in orders appear in order history.
  - Prices are recalculated server-side (in a DB function) from current product prices; the client total is never trusted.

### F5 Auth, wishlist, account (AC-6)
- **US-5.1** As a shopper, I want an account. Sign up/in with email + password, or a magic link; logout. Auth errors are shown in plain language.
- **US-5.2** As a shopper, I want to save favourites. The heart on product cards and the PDP toggles the wishlist. Guests are prompted to sign in, then the item is added after login. The wishlist page lists saved items with move-to-bag.
- **US-5.3** As a shopper, I want to see my orders: a list (number, date, status, total) with detail.
- **Security criteria:** RLS ensures user A can never select, update or delete B's wishlist, cart or orders (verified by an automated test with two users).

### F6 Admin (AC-7)
- **US-6.1** As an admin, I want to manage products: create/edit (name, slug, category, description, price, status draft/published/archived, colours, variants with size + stock) and upload/reorder/remove images (Supabase Storage `product-images`, ≤5 MB, jpg/png/webp).
- **US-6.2** As an admin, I want to process orders: list orders filtered by status, view detail, and advance the status `requested → confirmed → shipped → completed` or `cancelled`.
- Non-admins visiting `/admin` are redirected with a "not authorized" message; product writes are rejected by RLS for non-admins (tested).

## Permissions and roles
| Resource | Anonymous | Shopper (own rows) | Admin |
|---|---|---|---|
| Published products, categories, images, ai_looks | read | read | read/write (incl. drafts) |
| Cart, wishlist | — (local only) | CRUD own | read |
| Orders + items | create (guest checkout via RPC) | create, read own | read all, update status |
| Profiles | — | read/update own | read |
| Storage `product-images` | read | read | write |

The admin role lives in `profiles.role` (or an `app_metadata` claim) and is set manually for the demo admin account.

## Data and privacy requirements
- Demo data only: ~48 products (≥8 per category), unbranded stock imagery with licences logged.
- Personal data stored: email, name, phone, address for orders (test data only in the demo). Order PII is visible only to its owner and admins.
- No secrets in the client; publishable key only. No analytics or tracking.

## Accessibility and localization
- WCAG 2.2 AA: contrast ≥ 4.5:1 for text, visible focus, full keyboard path through browse → PDP → bag → checkout, labelled form fields with errors linked via `aria-describedby`, alt text on all product images, `prefers-reduced-motion` respected, tap targets ≥ 44 px.
- English only; USD; `en` locale formatting. Country list starts with English-speaking West Africa.

## Analytics events
None in v1 (out of scope). Structure the code so events could be added later.

## Dependencies and risks
| Risk | Impact | Mitigation |
|---|---|---|
| GitHub/Figma auth not fixed | Blocks phases 3, 5, 6, 8 | Flagged to the freelancer; phases 1–2 and 4 proceed |
| Static export: no server runtime | Checkout totals and admin writes must be safe without a server | Postgres RPC (`security definer`) for order creation; RLS for everything else |
| Llama 8B output quality / invalid JSON | Bad looks | JSON schema validation, retry, catalogue-ID whitelist, human review of seeded looks |
| Stock photo licensing / branded items | Showcase rights | Unsplash licence; reject photos with visible logos; asset register |
| GitHub Pages base path `/ruelook` | Broken assets/links | `NEXT_PUBLIC_BASE_PATH` in the build; e2e on the live URL |

## Open decisions
- None blocking. USD, the AI Stylist and English-only are defaults recorded in `docs/assumptions-and-unknowns.md`.
