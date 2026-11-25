# Test Plan and Results: Ruelook v1

Updated 2026-11-25 by the autopilot (phase 7). Each result below is from an actual run on this date. Where something was not run, the table says so.

## Scope
Acceptance criteria AC-1..AC-10 (docs/project-brief.md), user stories in docs/requirements.md, and threats T1–T12 in docs/security/threat-model.md.

## Results summary

| Layer | Tool | Command | Result |
|---|---|---|---|
| Lint | ESLint 9 (next core-web-vitals + TS) | `npm run lint` | 0 errors, 1 warning (react-hook-form `watch()` is skipped by the React Compiler; harmless) |
| Types | TypeScript 6 strict | `npm run typecheck` | 0 errors |
| Unit | Vitest 5 | `npm test` | **39/39 passed**: cart maths/merge, AI output validation + id whitelist, checkout schema + RPC error mapping, admin form/slug/image checks, order transitions, open-redirect guard, fx (HeroWipe, LookBoard, motion libs) |
| Build | Next 16 static export | `NEXT_PUBLIC_BASE_PATH=/ruelook npm run build` | OK, 16 static routes, plus 14 flattened prefetch payloads (D-013) |
| E2E | Playwright 1.65, desktop 1440 + Pixel 7 | `npx playwright test` (local export under /ruelook) | **19 passed, 1 skipped** (the keyboard journey runs on desktop only) |
| DB authorization | SQL suite, rolled back | `supabase/tests/rls_test.sql` | **32/32 passed** (anon, shopper A, shopper B, admin) |
| Dependencies | npm audit | `npm audit` | 0 vulnerabilities (prod + dev) |
| Supabase advisors | get_advisors | security / performance | Security: only the 3 intentional `security definer` RPC warnings. Performance: unused-index INFO, multiple permissive SELECT policies on 2 tables (accepted) |
| Live site | Playwright against `E2E_BASE_URL` | deploy-pages.yml `smoke` job | **Not run**: blocked until the GitHub repo and Pages exist (GH auth) |

## E2E journeys (e2e/critical.spec.ts)
1. Home: hero renders, New Arrivals loads, tab switch to Shoes (AC-1, AC-2)
2. Shop: category filter (8 men's pieces), price sort ascending verified numerically, search, empty state (AC-2)
3. PDP: "Select a size" validation, add to bag, drawer, bag persists across reload (AC-3, AC-4)
4. Sold-out product: the CTA is disabled (AC-3)
5. Checkout: error summary, valid submit → `place_order` RPC → confirmation with the order number and items (AC-5)
6. Guards: `/admin/` and `/wishlist/` send guests to sign-in with `next=` (AC-7, AC-10 UI)
7. Wishlist heart as a guest → sign-in with reason (AC-6)
8. Unknown product → not-found state
9. Keyboard: skip link is first in tab order with a visible focus style (a11y)
10. Reduced motion: the hero does not autoplay (shows Play) (motion a11y)

Orders placed by e2e runs use fictional data (`e2e.<timestamp>@example.com`, "E2E Test Shopper"). The per-email limit is 5 orders per hour (T6); the e2e run hit it once with a fixed email, which confirmed the limit works.

## RLS / RPC suite (supabase/tests/rls_test.sql)
- Anon: sees no drafts, orders, profiles or carts; cannot insert products or change stock. Guest `place_order` works. `get_order` needs the guest token; wrong or missing tokens return nothing. Quantity above stock is rejected. Cannot call `admin_set_order_status`.
- Shopper A: own cart read/write. Cannot write to B's cart or wishlist. Cannot read B's orders or order items. Sees only their own profile. Cannot promote self to admin. Can edit own name, not B's. Cannot change prices, see drafts, change order status, or upload images.
- Shopper B: reads own order; cannot see A's cart.
- Admin: sees and edits drafts; reads any order; confirms orders; invalid transitions rejected; cannot read shoppers' carts.

**Bug found and fixed:** `guard_profile_role` still called `public.is_admin()`, whose execute grant the hardening migration revoked. That would also have blocked promoting the demo admin from the dashboard. Fixed in migration `20261125000004_fix_role_guard.sql`.

## Security review (phase 7, light)
| Area | Check | Result |
|---|---|---|
| Secrets | Grep of the repo for service-role / secret keys / JWTs / GitHub tokens | None. Only the publishable key (public by design, D-011) |
| XSS | `dangerouslySetInnerHTML`, `innerHTML`, `eval` in src | None. AI text is rendered as plain React text |
| Open redirect (T9) | `next=` after login | Hardened: rejects `//`, `/\`, schemes and control characters (unit-tested) |
| Injection | Search `ilike` input | `%_,()` stripped; parameterised by PostgREST |
| Price tampering (T3) | Client sends only variant ids and quantities | `place_order` reads prices and stock server-side |
| Uploads (T7) | Type and size | Client check, plus bucket limits (5 MB, jpg/png/webp), plus admin-only storage policies (tested) |
| AI output (T8) | Hallucinated ids | zod schema + candidate whitelist; ≥2 valid items per look |
| Auth emails | Supabase built-in sender | Rate-limited; documented as a demo limitation |

Residual risks: none high or critical. See docs/deliverables/README.md for known limitations.

## Not yet measured (needs the live site)
- LCP, fps of the hero wipe on a throttled or mid-range phone, effect chunk sizes on the deployed build (creative-technologist handover)
- Contrast of hero text at the weakest point of each campaign photo (scrim is in place; needs a spot check)
- Design QA against Figma (Figma blocked, D-012)
