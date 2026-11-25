# Pipeline Status

Maintained by `project-autopilot`. Resume any time with "resume autopilot".

## Links
- Figma file: https://www.figma.com/design/ZcXrxPBt13gJk2eYhuM8tD (Ruelook — Product Design)
- Repository: (to create: badersalis/ruelook, public)
- Live app (GitHub Pages): (planned: https://badersalis.github.io/ruelook/)
- Supabase project: `ruelook` (cbzjbfklfegvxmbsrfcw, eu-west-2, free) · https://supabase.com/dashboard/project/cbzjbfklfegvxmbsrfcw
- Deliverables: docs/deliverables/README.md
- Showcase drafts: docs/content/

## GO
- Approved on: 2026-11-25 (D-002) · Scope: Launch Brief in docs/project-brief.md · Checkpoints: none

## Pre-flight
| Date | GitHub | Figma | Supabase | Ollama | Node |
|---|---|---|---|---|---|
| 2026-11-25 | ❌ GH_TOKEN invalid (401) | ❌ not signed in | ✅ 1/2 free slots used | ✅ llama3.1:8b | ✅ v24.11.1 |

## Phases
| # | Phase | Status | Evidence | Updated |
|---|---|---|---|---|
| 0 | Intake + GO | done | docs/project-brief.md (Launch Brief), GO recorded D-002 | 2026-11-25 |
| 1 | Requirements | done | docs/requirements.md (6 features, 13 user stories with Given/then criteria traced to AC-1..AC-10), docs/research/personas.md, docs/research/competitor-analysis.md (7 competitors + 2 refs, cited) | 2026-11-25 |
| 2 | Design direction | done | docs/design/visual-direction.md (palette, type, spacing, radius, motion tokens), inspiration-board.md (analysed, studio refs, delight backlog, traceability), prototypes/ (2 Must effects, go), asset-register.csv (61 Unsplash photos, licence checked 2026-11-25), D-004/D-009/D-010 | 2026-11-25 |
| 3 | UX + Figma | in-progress (paused: Starter MCP call limit) | https://www.figma.com/design/ZcXrxPBt13gJk2eYhuM8tD: 33 variables, 12 text styles, 5 component sets (Button 20 variants, Size chip, Badge, Input, Product card), foundations specimen; screens/cover/flows/showcase to do (docs/design/figma.md, D-015) | 2026-11-25 |
| 4 | Architecture | done | docs/architecture/system-overview.md (data model 11 tables, RLS matrix, 4 RPCs, AI pipeline, Pages deploy), docs/security/threat-model.md (12 threats + mitigations/verification), D-006..D-008 | 2026-11-25 |
| 5 | Repo + backend | partial: backend done, repo blocked (GH_TOKEN invalid) | 3 migrations applied (schema+RLS, storage, private helpers); advisors: no security errors (only the 3 intentional definer RPCs); types generated; seed: 40 products, 163 variants, 120 images; local git on feat/scaffold | 2026-11-25 |
| 6 | Build | done (AI looks data pending) | 16 static routes; lint 0 errors, typecheck 0, unit 42/42, build OK; looks-v2 + outfit rules (D-014). `ai_looks` is empty: the v2 generation run was stopped by the system for low memory; the PDP hides the Stylist until it is seeded (AC-8 fallback) | 2026-11-25 |
| 7 | QA + security | done locally; live checks pending | docs/test-plan.md: e2e 19 passed / 1 skipped (desktop+mobile), RLS suite 32/32, npm audit 0, open-redirect fix, role-guard bug fixed (migration 000004). Live LCP/fps/contrast need the deployed site | 2026-11-25 |
| 8 | Deploy | blocked (GitHub auth) | Workflows ready: ci.yml, deploy-pages.yml (+ live Playwright smoke job); runbook in docs/deliverables/README.md | 2026-11-25 |
| 9 | Deliverables | drafted | docs/deliverables/README.md (links, runbooks, known issues), README.md with real screenshots; live/repo/Figma links pending | 2026-11-25 |
| 10 | Showcase (Behance → LinkedIn → Instagram → TikTok) | blocked | Needs the live app (captures) and seeded AI looks (key feature) | 2026-11-25 |
| 11 | Retrospective | pending | | |

## Blockers & decisions needed
- AI looks: rerun `OLLAMA_NUM_GPU=0 python scripts/seed/gen_looks.py` (about 1 h on CPU; the last run was stopped by the system for low memory), review, then seed `supabase/seed/ai_looks.sql`
- Fix GitHub auth (remove/replace invalid GH_TOKEN, `gh auth login --scopes repo,workflow`) before phase 5 (rechecked 2026-11-25: still ❌; CI, PRs and Pages deploy wait on this)
- Figma: connected ✅; Starter plan limits (3 pages, MCP call limit reached 2026-11-25). Resume when the limit resets, or approve a paid upgrade
- Demo admin account: freelancer signs up in the app, then the autopilot sets `profiles.role = 'admin'` via SQL (no passwords handled by the autopilot)
