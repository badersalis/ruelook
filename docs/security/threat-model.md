# Threat Model (light): Ruelook v1

Proportionate to a public demo with no payments and test-only personal data. Passive review; no testing of third-party systems.

## Scope and authorization
The Ruelook static app (GitHub Pages), its Supabase project (`ruelook`), local AI scripts. Owner: the freelancer. Authorized by GO (D-002).

## Assets and data classification
| Asset | Class |
|---|---|
| Order contact data (name, email, phone, address): demo/test values only | Personal (low volume, test) |
| Auth accounts (email, password hash managed by Supabase) | Personal / credential |
| Catalogue, images, AI looks | Public |
| Admin role | Privileged |
| Service-role key | Secret (local `.env.local` only) |

## Actors and trust boundaries
Anonymous visitors, signed-in shoppers, admin, a malicious visitor with the publishable key and devtools, automated bots. Boundaries: see `docs/architecture/system-overview.md` §Trust boundaries.

## Entry points and dependencies
PostgREST tables, RPCs (`place_order`, `get_order`, `admin_set_order_status`), Supabase Auth, Storage uploads, the LLM output path (local), npm dependencies, GitHub Actions.

## Threats and abuse cases (STRIDE-lite)
| # | Threat | Risk | Mitigation | Verification |
|---|---|---|---|---|
| T1 | Shopper reads/edits another user's orders, cart or wishlist (IDOR) | High | RLS `user_id = auth.uid()`; orders readable only by owner/admin; guest lookup needs number + uuid token | `scripts/test-rls.ts` with two users (AC-6); advisors |
| T2 | Non-admin writes products/images or changes order status | High | `is_admin()` in RLS + Storage policies; status changes via an RPC that checks admin | RLS test as shopper → expect denial |
| T3 | Privilege escalation by updating own `profiles.role` | High | Column excluded via trigger guard (raises if role changes and caller isn't service role/admin) | RLS test |
| T4 | Price tampering at checkout (client sends a lower price) | Medium | `place_order` recomputes from DB; client totals ignored | Unit/SQL test: tampered payload → DB price used |
| T5 | Order spam / storage of junk via guest checkout | Medium | Rate limit 5/email/hour in RPC; field length limits; no stock reservation | SQL test |
| T6 | Stored XSS via product text, AI rationale or alt text | Medium | React text rendering only; no `dangerouslySetInnerHTML`; zod length limits | Code review + grep in security review |
| T7 | Malicious upload (huge or non-image file) by an admin account compromise | Low | Bucket `allowed_mime_types` jpg/png/webp, 5 MB limit | Upload test |
| T8 | Service-role key leaked into the repo or bundle | High | Only in `.env.local` (git-ignored); CI has no service key; secret scan in CI (gitleaks) | `security-review` + bundle grep |
| T9 | Prompt injection via catalogue text leading to wrong item ids | Low | Ids whitelisted against the candidate list; output reviewed before seeding; local only | Schema tests |
| T10 | Functions with mutable `search_path` / `security definer` misuse | Medium | `set search_path = ''`, fully qualified names, `revoke execute` from anon where not needed | `get_advisors` security |
| T11 | Dependency compromise | Medium | Lockfile, `npm audit` in CI, minimal deps, Dependabot alerts | CI output |
| T12 | Credential stuffing on auth | Low | Supabase Auth rate limits; leaked-password protection is a Pro feature (noted) | Advisors note |

## Existing controls
Supabase managed Auth, TLS everywhere, GitHub Pages HTTPS.

## Mitigations and verification
All mitigations above are implemented in phases 5–6 and verified in phase 7 (`docs/qa/test-plan.md`).

## Residual risks
- Demo admin credentials: stored only in the freelancer's password manager, never in the repo. Low risk.
- Supabase free-tier email rate limits (availability, not security).
- No WAF/bot protection beyond Supabase defaults: acceptable for a demo.

## External review required
None for the demo. A real launch with payments and customer data needs a payment provider (PCI handled by the provider), a data-protection review (e.g. Nigeria NDPA 2023, Ghana Data Protection Act 2012) and an independent security review.
