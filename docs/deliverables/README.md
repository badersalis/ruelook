# Ruelook: Deliverables

Self-initiated showcase project. Designed & built by bader.salis. Updated 2026-11-25.

## Links
| What | Where | Status |
|---|---|---|
| Live app | https://badersalis.github.io/ruelook/ | ⏳ Waiting on GitHub auth (repo + Pages not created yet) |
| Repository | `badersalis/ruelook` (public) | ⏳ Waiting on GitHub auth; all work is committed locally on `feat/scaffold` |
| Figma file | "Ruelook: UI/UX" | ⏳ Waiting on Figma MCP auth (D-012). Source of truth until then: docs/design/ux-spec.md + visual-direction.md |
| Supabase project | `ruelook`, https://supabase.com/dashboard/project/cbzjbfklfegvxmbsrfcw | ✅ Live (eu-west-2, free tier) |
| Test plan and results | [../test-plan.md](../test-plan.md) | ✅ |
| Showcase drafts | [../content/](../content/) | ⏳ Phase 10 (captured from the live app) |

## What was built
Storefront (home, shop, product, bag, checkout as an order request, confirmation), accounts (password or magic link, wishlist, orders), admin (products, images, orders), and the AI Stylist with "Complete the look" and "Add the full look". See the root README for the feature list and stack.

## Docs bundle
- Launch Brief and acceptance criteria: ../project-brief.md
- Requirements: ../requirements.md · Personas and competitors: ../research/
- Design: ../design/visual-direction.md, ux-spec.md, inspiration-board.md, prototypes/, asset-register.csv
- Architecture: ../architecture/system-overview.md · Threat model: ../security/threat-model.md
- Decisions: ../decision-log.md (D-001..D-013) · Pipeline: ../pipeline-status.md

## Runbooks

### Make the demo admin account
1. Sign up in the app at `/account/signup/` with the email you want as admin, and confirm it.
2. In the Supabase dashboard SQL editor, run:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = '<your email>');
   ```
   The role guard allows this from the dashboard (migration 000004). Shoppers cannot promote themselves (tested).
3. Sign out and back in, then open `/admin/`.

### Deploy (after GitHub auth)
1. `gh auth login --scopes repo,workflow` (after removing or replacing the invalid `GH_TOKEN` env var).
2. Create the repo and push: `gh repo create badersalis/ruelook --public --source . --push`, then open a PR from `feat/scaffold` to `main`.
3. Repo settings → Pages → Source: **GitHub Actions**. Optional repository *variables* (public values): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; the code falls back to the same public defaults.
4. Merge when CI is green. `deploy-pages.yml` builds with the Pages base path, deploys, then runs the Playwright smoke suite against the live URL.
5. Supabase → Authentication → URL configuration: add `https://badersalis.github.io/ruelook/**` to the redirect URLs so magic links and confirmations return to the site.

### Regenerate AI Stylist looks (demo mode data)
```bash
OLLAMA_NUM_GPU=0 python scripts/seed/gen_looks.py   # writes supabase/seed/ai_looks.json + ai_looks.sql
```
Review the JSON, then run `supabase/seed/ai_looks.sql` in the SQL editor. It upserts per product and look. Each row records `model` and `prompt_version`.

### Re-seed the catalogue
`python scripts/seed/build_catalog.py` (needs the raw photos from `scripts/assets/fetch_unsplash_sources.py`), then `python scripts/seed/to_sql.py`, and run `supabase/seed/catalog.sql`. Both are non-destructive upserts.

### Verify authorization
Run `supabase/tests/rls_test.sql` in the SQL editor. It always finishes with an `RLS_REPORT passed=N failed=M` error, which is how it rolls back its fixtures. Expect `failed=0`.

### Free-tier pausing
Supabase pauses free projects after about a week without activity. Restore the project from the dashboard if the live demo shows loading errors.

## Known issues and limitations
- **AI in demo mode:** the live site cannot reach a local model, so it shows looks pre-generated with Llama 3.1 8B and stored in `ai_looks`. Live generation works only in local dev (`NEXT_PUBLIC_AI_MODE=local`). A hosted model would be a paid change needing approval.
- **No payments:** checkout creates an order request only, by design (D-001).
- **Auth emails** use Supabase's built-in sender, which is rate-limited to a few emails per hour. Configure custom SMTP for heavier demos.
- **Product URLs** use `?slug=` (D-006), so pages are less SEO-friendly than static product pages.
- **Single colour per product** in the seed data. The schema supports several colours, but the admin editor edits one.
- **Variants that are on orders cannot be deleted** in admin; set their stock to 0 instead.
- **Order rate limit:** 5 requests per email per hour (anti-abuse, T6).
- **Test orders** in the database come from the smoke and e2e runs, with fictional names and `example.com` addresses. They are safe to leave or cancel in admin.
- **Not yet measured:** LCP, hero fps on a mid-range phone, and per-photo hero text contrast. These need the live site (test-plan.md).
- **Figma file not yet produced** (blocked); the app was built from the UX spec and tokens (D-012).

## Residual risks
None high or critical. Medium: free-tier pausing makes the demo unavailable until restored; the auth email rate limit can block sign-ups during a busy demo.
