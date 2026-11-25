# Project — Claude Code Instructions

You are working inside a Freelancer Lab project repository, delivered by a freelance product designer and full-stack engineer ("the freelancer"). The project runs on the Freelancer Lab pipeline: `project-intake` → GO → `project-autopilot`.

## Source of truth
Read these before significant work:
- `docs/project-brief.md` (the Launch Brief: scope, acceptance criteria, what GO authorizes)
- `docs/pipeline-status.md` (where the pipeline is; resume from the first phase that isn't done)
- `docs/decision-log.md`, `docs/assumptions-and-unknowns.md`, `docs/requirements.md`
- `docs/design/figma.md` (Figma file and token mapping)

Project decisions override the toolkit defaults only when recorded in the decision log.

The toolkit (skills, agents, rules) is installed in `.claude/`. Where a skill refers to `knowledge/<file>.md`, read `.claude/knowledge/<file>.md` in this repo. The showcase goal and the hard gates from Freelancer Lab apply here unchanged: content shows the finished product, credits the freelancer as its designer and builder, and is only drafted, never published, without approval.

## Default stack
- Figma for UI/UX (variables named to match the code tokens)
- Next.js App Router as a **static export**, TypeScript, Tailwind CSS
- Supabase (Postgres + RLS, Auth, Storage, Edge Functions); the publishable key in the browser, never the service-role key
- Local Llama via Ollama for AI, behind `src/lib/ai/`; `NEXT_PUBLIC_AI_MODE=local` in dev, `demo` (pre-generated outputs from Supabase) on the live site
- GitHub Actions → GitHub Pages (`.github/workflows/deploy-pages.yml`)
- Vitest + Playwright (also against the live URL)

Payments, analytics, paid dependencies or a hosted AI provider are never added automatically: they need a recorded decision, and the paid ones need approval.

## Workflow
1. Work on `feat/*` branches; open PRs to `main`; merge only with CI green.
2. Implement against the acceptance criteria and the Figma frames.
3. Run lint, typecheck, tests and build; report the actual results.
4. Update `docs/pipeline-status.md` and the decision log as you go.
5. Hard gates (ask first): spending money, publishing or sending anything, deleting resources or data, credentials, scope changes, real customer data, making client work public without the recorded permission.

## Security
- Never read, print, commit or expose real `.env` values, credentials, keys or customer data. Use `.env.example` with placeholders.
- RLS on every exposed table, tested for anon, other-user and owner access. The UI hiding something is not authorization.
- Never use production or real personal data in tests or seeds.
- No active security testing without written authorization and an approved scope.

## Design inspiration
- The freelancer's inspirations live in `docs/design/inspiration-board.md`, with reference files in `docs/design/inspiration/`. Build in the adopted items (gradients, patterns, colours, type, motion, interactions) as specified, and keep them traceable to Figma frames and code.
- Reference files are internal only: never import them into `public/` or app code, and never copy a whole design.
- Every animation needs a `prefers-reduced-motion` fallback. Text over gradients and patterns must meet WCAG AA contrast.

## Product quality
- Responsive, keyboard-accessible UI with visible focus states.
- Loading, empty, error, unauthorized and success states.
- Tests for business logic and critical journeys.
- Known limitations and residual risks documented in `docs/deliverables/README.md`.

## Showcase-ready by default
The product is also the freelancer's portfolio piece. Keep the README polished (hero screenshot, live link, stack, "Designed & built by" credit), keep demo data realistic and fictional, and make sure the key feature can be captured cleanly from the live app.
