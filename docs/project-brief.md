# Project Brief: Ruelook

## Launch Brief (awaiting GO)

### Summary
**Ruelook** is a streetwear e-commerce web app for shoppers who want high-quality pieces. It launches first for English-speaking West Africa (Ghana, Nigeria, Liberia, Sierra Leone, The Gambia), but the brand and catalogue are global. The storefront is editorial: a full-bleed campaign hero, curated "New Arrivals" by category, and bento promo banners. Shoppers browse, filter, view a product's sizes and colours, save items to a wishlist, and place an **order request** at a simulated checkout (no real payment). An admin manages products and orders. One AI feature, the **AI Stylist ("Complete the look")**, suggests a full outfit from the product being viewed. This is a **self-initiated portfolio showcase** by bader.salis, designed in Figma, built with Next.js + Supabase, and deployed to GitHub Pages.

### Users
- **Primary:** streetwear shoppers aged 18–35, style-conscious, who value quality and fit over fast fashion and shop mostly on mobile. *(Assumption: no user research was done; this is a portfolio piece.)*
- **Secondary:** the store admin/merchandiser who manages the catalogue and order requests.

### Must-have features (v1)
1. **Catalogue**: home (hero, New Arrivals with category tabs, promo bento) and a shop listing with category filters (Women, Men, Shoes, Bags, Accessories), sorting and search.
2. **Product page**: gallery, price, size and colour selection, stock state, details, related items, and the **AI Stylist**.
3. **Cart and checkout as an order request**: cart drawer and page, quantities, a checkout form (shipping details) that creates an order with status `requested`. **No real payment**; this is clearly stated on screen.
4. **Wishlist + account**: email login (Supabase Auth, magic link + password), wishlist, order history and profile.
5. **Admin**: an admin role to create, edit and archive products, upload images to Supabase Storage, and view and advance order status.

### Out of scope (v1)
Real payments and payment providers, shipping integrations, multi-vendor marketplace, reviews/ratings submission, promo-code engine, multi-currency conversion, French or other translations, push/email marketing, native apps, analytics. Any of these goes through `change-request`.

### Acceptance criteria (v1, testable)
- AC-1: Home renders the hero, New Arrivals with 5 working category tabs (≥8 products each, from Supabase demo data) and the promo bento, on 360 px mobile and 1440 px desktop.
- AC-2: The shop listing filters by category, sorts (newest, price ↑/↓) and searches by name. The URL reflects the filter state, and an empty-result state is shown.
- AC-3: The product page shows ≥3 images, size and colour pickers, and out-of-stock variants disabled. "Add to cart" is blocked until a size is chosen and shows an error message.
- AC-4: The cart persists across reloads (local for guests, merged into the account on login). Quantity changes update totals, prices are in **USD**, and a subtotal is shown.
- AC-5: Checkout validates required fields and creates an `orders` row with `requested` status visible in the shopper's order history. A banner states that "this is a demo, no payment is taken".
- AC-6: Sign-up/login/logout work via Supabase Auth. Wishlist add/remove works and is per-user (RLS-verified: user A cannot read B's wishlist or orders).
- AC-7: Only users with the `admin` role can reach /admin and write products. Image upload goes to a Storage bucket, and anonymous users can read published products only.
- AC-8: AI Stylist: on the live site it shows ≥3 pre-generated outfit suggestions per product (stored in Supabase); in local dev it calls `llama3.1:8b` live. A "suggested by AI" label is shown, and a graceful fallback appears if none exist.
- AC-9: Accessibility: WCAG 2.2 AA (contrast, keyboard nav, focus states, alt text, reduced-motion respected). Lighthouse a11y ≥ 95 on home and product.
- AC-10: Performance: LCP < 2.5 s on the live home (mobile, throttled), with responsive images.

### Stack and integrations
| Area | Choice |
|---|---|
| Figma | New file **"Ruelook — UI/UX"** (foundations, components, flows, mobile + desktop hi-fi, prototype, showcase frames) |
| GitHub | `badersalis/ruelook`, **public**, Actions CI; Pages URL to be created: `https://badersalis.github.io/ruelook/` |
| App | Next.js App Router static export, TypeScript, Tailwind, Vitest + Playwright |
| Supabase | New **free-tier** project `ruelook` in org "roleback" (1 of 2 free slots in use today); Postgres + RLS, Auth, Storage (`product-images`) |
| AI | Local Llama `llama3.1:8b` via Ollama, behind `src/lib/ai/` |
| Imagery | Free-licence stock (Unsplash), **unbranded** products only (no real brand logos); recorded in an asset register |

**AI deployment note:** the live GitHub Pages site cannot reach a local model. The live demo serves AI Stylist suggestions that were **pre-generated locally and stored in Supabase** (`NEXT_PUBLIC_AI_MODE=demo`); live AI runs only in local dev (`local`). A hosted model later is a paid change that needs approval.

**Regulated domain flag:** e-commerce payments are regulated. v1 takes **no payment** and is a demo, so no PCI or payment compliance applies. A real launch would need a payment provider, local consumer and data-protection review (e.g. Nigeria NDPA, Ghana Data Protection Act) and an independent security review.

### Checkpoints, showcase, credit
- Autopilot checkpoints: **none** (runs straight through).
- Showcase platforms, in priority order: **Behance → LinkedIn → Instagram → TikTok**. All delivered as drafts awaiting approval.
- Restrictions: demo data only; no real brands, people's names or customer data; stock-photo models used within their licence terms.
- Credit line: **"Designed & built by bader.salis"**
- CTA: email **awesomebss39@gmail.com** + Behance profile.

### What GO authorizes (concrete for Ruelook)
1. Create the public GitHub repo `badersalis/ruelook`, push the code, create `feat/*` branches, open PRs and merge them once CI is green.
2. Set up GitHub Actions CI and enable GitHub Pages, then deploy the app to it.
3. Create the Figma file "Ruelook — UI/UX" and write to it.
4. Create the free-tier Supabase project `ruelook` (org "roleback"), then apply migrations, RLS policies, the `product-images` bucket, auth config and demo seed data.
5. Run the local Llama model for AI Stylist outputs, demo copy and alt-text drafts.
6. Download free-licence stock images (Unsplash) for demo products and record them.
7. Write drafts of all deliverables and showcase content (Behance, LinkedIn, Instagram, TikTok).

**Hard gates that still apply:** spending money (paid plans, assets, APIs, music), publishing or posting anything, scope changes, deleting repos/projects/buckets/data, creating or handling credentials (secrets go in env vars and the dashboards; never in chat), accepting high or critical risk.

### Pre-flight (2026-11-25)
| Check | Result | Fix outstanding |
|---|---|---|
| GitHub `gh` | ❌ `GH_TOKEN` env var holds an invalid token (401) | Remove/replace `GH_TOKEN`, then `gh auth login --scopes repo,workflow`. Blocks phases 5, 6, 8 |
| Figma MCP | ❌ not signed in | `/mcp` → figma → authenticate. Blocks phase 3 and Figma visuals in phase 10 |
| Supabase MCP | ✅ org "roleback", 1/2 free projects used | — |
| Ollama | ✅ `llama3.1:8b` present | — |
| Node / npm | ✅ v24.11.1 / 11.6.2 | — |
| Playwright | ⚠️ not installed | Installed in the repo during phase 5 |

---

## Overview
- Project name: Ruelook
- Client/company: self-initiated showcase (bader.salis)
- Industry: fashion retail / streetwear e-commerce
- Geography/jurisdictions: English-speaking West Africa first; global audience
- Stage: MVP (portfolio demo)

## Problem and users
- Problem to solve: streetwear shoppers who want high-quality pieces lack a curated, editorial, mobile-first place to discover and order them.
- Primary user: quality-focused streetwear shoppers, 18–35, mobile-first
- Secondary users: store admin
- Current alternatives: big marketplaces (Jumia, ASOS, Farfetch), Instagram shops, brand sites *(not researched yet; phase 1)*
- Evidence available: none (portfolio piece); one visual reference

## Business goals
- Desired outcome: a portfolio piece that wins product design + full-stack clients
- Success metrics: Behance appreciations/views, inbound enquiries (tracked manually)
- Business model/pricing hypothesis: n/a (showcase)
- Budget/time constraints: free tiers only; no deadline

## Brand inputs (optional)
- Logo provided: none. A wordmark is created in phase 2
- Brand guidelines: none
- Existing assets and their rights: none
- Inspiration: `docs/design/inspiration/ref-01-fashion-homepage.jpeg` (see the inspiration board)

## Risk and constraints
- Sensitive data: none (demo data; test accounts only)
- Payments: none; checkout is simulated
- Privacy/security: RLS on every table; publishable key only in the browser
- Hosting: GitHub Pages (static) + Supabase free tier

## Evidence status
See `docs/assumptions-and-unknowns.md`.
