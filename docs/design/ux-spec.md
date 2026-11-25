# UX Specification: Ruelook v1

Inputs: `docs/requirements.md`, `docs/design/visual-direction.md`, `docs/design/inspiration-board.md`, `docs/architecture/system-overview.md` (static export: dynamic data loads client-side; product URLs use a query string, see D-006).

## 1. Sitemap and routes
| Route | Screen | Auth |
|---|---|---|
| `/` | Home | public |
| `/shop?category=&sort=&q=` | Shop listing (PLP) | public |
| `/product?slug=` | Product detail (PDP) + AI Stylist | public |
| `/bag` | Bag (full page; the drawer is global) | public |
| `/checkout` | Checkout (order request) | public (guest allowed) |
| `/checkout/confirmation?order=` | Order confirmation | public (shows only own order via RPC token) |
| `/account/login` · `/account/signup` | Auth | public |
| `/account` | Overview: orders list + profile | shopper |
| `/account/orders?id=` | Order detail | shopper (own) |
| `/wishlist` | Wishlist | shopper (guests see sign-in prompt) |
| `/admin` → `/admin/products`, `/admin/products/edit?id=`, `/admin/orders`, `/admin/orders/view?id=` | Admin | admin |
| `/404` | Not found | public |

**Global chrome:**
- **Header** (sticky, 64 px desktop / 56 mobile): wordmark (left on mobile, centre on desktop like #1); desktop nav Women · Men · Shoes · Bags · Accessories · Shop all; icons for search, account, wishlist and bag with a count. On mobile, a menu button opens a full-height nav sheet.
- **Demo banner:** a 32 px strip above the header reading "Demo store: no payment is taken." It can be dismissed per session, but always shows on checkout.
- **Footer:** links, the "Designed & built by bader.salis" credit and a contact link.

## 2. Critical journeys
1. **Browse → buy (P1):** Home → New Arrivals tab "Men" → card → PDP → choose size → Add to bag → drawer → Checkout → Confirmation. Target: ≤ 3 taps from home to bag.
2. **Build a look (P2):** PDP → Complete the look → switch look 2 → quick-add an item (size sheet) → bag shows 2 items.
3. **Save for later:** card heart (guest) → sign-in sheet → after login the item is in the wishlist → move to bag.
4. **Admin publishes a drop:** /admin/products → New → fill the form + upload 3 images → Publish → visible in Shop.
5. **Admin processes an order:** /admin/orders → filter "requested" → open → Confirm → status chip updates.

## 3. Screens and states

### Home
- **Hero:** height min(88vh, 820px) desktop, 72vh mobile. Each slide has a photo on `gradient.sky`, a kicker (micro uppercase), a headline (Archivo 800, 2 lines max), a sub (16 px) and a white pill CTA "Shop the drop". Prev/next buttons (44 px, white circle) sit at the sides on desktop; on mobile, dots plus swipe. A pause/play button sits bottom-right. **Effect:** headline wipe (motion spec). Autoplay is 6 s, pauses on hover/focus/hidden tab, and is disabled with reduced motion.
- **New Arrivals:** centred title; tablist (Women · Men · Shoes · Bags · Accessories); 8 cards (2/3/4 columns); "View all" link to `/shop?category=…`. States: loading = 8 skeleton cards (plinth colour pulse, static under reduced motion); error = inline message + Retry; empty = "New pieces landing soon".
- **Promo bento:** 1 tall (left) + 2 small + 1 type tile (denim-700, "New drop" / "24 pieces"). Tiles are links with an image, a kicker, a title and a white "Shop now" pill.
- **"The Rue edit" strip** (editorial, optional for v1, Should): 3 looks with a "Shop the look" link to a PDP.

### Shop (PLP)
- **Desktop:** left filter column (category radio list, sort select); a top bar with the result count, a search input and sort. **Mobile:** a sticky "Filter & sort" button opens a bottom sheet.
- Filtering, sorting and search update the URL (replaceState), with search debounced at 300 ms. Cards as on home.
- **States:** skeleton grid; empty (icon, "No pieces match", "Clear filters"); error + retry. Pagination: "Load more" (24 per page) with an `aria-live` count update.

### Product card (component)
Image 4:5 on plinth (second image on hover/focus on desktop), heart button (`aria-pressed`), category kicker, name, price. Desktop hover/focus shows a "Quick add" bar that opens the size sheet. Badges: "New" (ink), "Sold out" (ink-soft, image desaturated 30%), "Low stock" (signal).

### PDP
- **Desktop:** a 2-column layout. The gallery (left, 7/12) shows a vertical thumbnail rail and the main image (click to zoom in a lightbox). The info column (right, 5/12, sticky) holds a breadcrumb, name (Archivo 700 32), price, colour swatches (radio group, colour name shown), size buttons (radio group; out of stock = struck through and disabled, `aria-disabled` + "(out of stock)" for screen readers), stock line, Add to bag (primary, full width), wishlist (secondary icon button), and Details / Material & care / Shipping accordions.
- **Mobile:** the gallery becomes a swipe carousel with a counter "1 / 3". Info follows, and a sticky bottom bar shows price + Add to bag once the main CTA scrolls out of view.
- **Complete the look** (full-width section below): see §4. **You may also like:** 4 cards.
- **States:** loading skeleton; 404 ("This piece has left the building", Shop link); sold out (CTA disabled, "Notify me" is out of scope, so not shown).
- **Error:** add without a size shows "Select a size" under the size group; focus moves to the first enabled size.

### Bag drawer and page
- **Drawer:** right side, 420 px (full width mobile), focus-trapped, Esc closes, `role="dialog"` labelled "Your bag".
- **Lines:** image, name, colour/size, qty stepper (−/+, 1..min(10, stock)), remove (with an undo toast for 5 s), line total.
- **Footer:** subtotal, "Shipping calculated at checkout (demo)", Checkout (primary), View bag (link).
- **Empty:** "Your bag is empty" + "Shop New Arrivals".
- The bag page shows the same content in 2 columns (lines | summary).

### Checkout
- One page. Contact (email, phone), Shipping (full name, country select defaulting to Ghana, city, address), an order-summary column, and the demo notice (denim-100 box) above "Place order request".
- **Validation:** on blur and on submit; an error summary at the top links to the fields; `aria-invalid` + `aria-describedby`.
- **Submitting:** button spinner, form disabled. A server error shows an alert with retry, and the cart is kept.
- **Confirmation:** check-mark illustration (static SVG), order number `RL-XXXXXX`, summary, "Continue shopping", "Create an account to track this order" (guest).

### Auth
Login and signup forms (email, password ≥ 8 with show/hide), a "Email me a magic link" alternate, and plain-language errors ("That email or password doesn't match"). After login, return to the previous route and merge the cart.

### Account and wishlist
- **Account:** greeting, orders table (number, date, status chip, total) linking to detail, profile form (name, phone), Sign out.
- **Wishlist:** grid of cards with "Move to bag" (opens the size sheet) and remove. Empty: "Nothing saved yet."

### Admin
- **Layout:** desktop-first, left nav (Products, Orders), a top bar with "Back to store". Mobile works but is secondary.
- **Products:** table (thumb, name, category, price, status chip, stock total, updated), search, status filter, "New product".
- **Product form:** name, slug (auto-generated, editable), category, price, description, material/care, status, colours (name + hex), a variants grid (size × colour with stock inputs), and an image uploader (drag/drop, reorder by drag or up/down buttons, alt-text field per image, ≤ 5 MB jpg/png/webp, progress + error).
- **Orders:** table filtered by status. Detail shows items, customer, address and status actions (only valid next steps are shown).
- **Unauthorized:** redirect to `/` with a toast "Admins only".

## 4. AI Stylist: Complete the look (signature 2)
- Section title "Complete the look", with a "Suggested by AI" chip (signal bg, ink text) and an info tooltip: "Looks are generated by an AI model from our catalogue. Check sizes before you buy."
- Look switcher: segmented control "Look 1 / 2 / 3" (each with its AI title, e.g. "Weekend in Osu").
- **Board:** the current product in the centre tile (labelled "This piece") and 2–4 look items around it, each with an image, name, price and a "+" quick-add. A one-sentence rationale sits below.
- Footer: "Add the full look": opens the size sheet stepping through each item.
- **Local dev only:** a "Regenerate (local AI)" ghost button. Loading = shimmer on the board + "Styling…"; error = "The stylist is taking a break. Try again."
- **Motion:** items slide from the edges with a 60 ms stagger, the connector line draws in (`motion.slow`); switching looks cross-slides. Reduced motion: fade in place, static line.

## 5. Interaction and accessibility rules
- **Keyboard:** skip link; tabs use arrow keys (roving tabindex); radio groups for colour and size; dialogs trap focus and return it to the trigger; carousel buttons are labelled "Previous slide" / "Next slide" with slide status in `aria-live="polite"` (off while autoplaying).
- **Focus:** 2 px `signal` outline + 2 px offset, never removed.
- **Touch targets:** ≥ 44 × 44.
- **Images:** product alt = "name, colour, view"; campaign images are decorative when the headline carries the message (`alt=""`).
- **Live regions:** "Added to bag", "Removed from bag" (undo), filter result counts.
- **Breakpoints:** 360 (min), 768, 1024, 1440. No horizontal scroll at 360.

## 6. Motion summary
Detailed in `docs/design/motion-spec.md` (creative-technologist, phase 3). Effects: hero headline wipe (Must), complete-the-look assembly (Must), add-to-bag drop (Should), sliding tab underline (Should), card hover image swap + quick add (Should).

## 7. Design QA checklist
- [ ] Every must-have flow (journeys 1–5) has mobile 360 and desktop 1440 hi-fi frames, including loading, empty, error and success states.
- [ ] Inspiration #1a–d present as specified (hero on sky gradient with kicker/headline/pill CTA, plinth grid with tabs, bento with type tile, denim/ink palette); #1e (brand logos) absent.
- [ ] Both Must effects specified with trigger/duration/easing and a reduced-motion fallback; Should effects specified.
- [ ] Text contrast ≥ 4.5:1 (≥ 3:1 for large text and UI boundaries) everywhere, including over hero photos (scrim).
- [ ] Focus states drawn for buttons, inputs, tabs, swatches, cards.
- [ ] The demo/no-payment notice is visible in header and checkout; the AI label is on every look.
- [ ] Tokens are Figma variables named as in visual-direction.md; components use variables, not raw hex.
- [ ] The credit line is in the footer.
