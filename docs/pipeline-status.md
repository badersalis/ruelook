# Pipeline Status

Maintained by `project-autopilot`. Resume any time with "resume autopilot".

## Links
- Figma file: (to create: "Ruelook — UI/UX")
- Repository: (to create: badersalis/ruelook, public)
- Live app (GitHub Pages): (planned: https://badersalis.github.io/ruelook/)
- Supabase project: (to create: `ruelook`, org roleback, free tier)
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
| 3 | UX + Figma | pending | | |
| 4 | Architecture | done | docs/architecture/system-overview.md (data model 11 tables, RLS matrix, 4 RPCs, AI pipeline, Pages deploy), docs/security/threat-model.md (12 threats + mitigations/verification), D-006..D-008 | 2026-11-25 |
| 5 | Repo + backend | pending | | |
| 6 | Build | pending | | |
| 7 | QA + security | pending | | |
| 8 | Deploy | pending | | |
| 9 | Deliverables | pending | | |
| 10 | Showcase (Behance → LinkedIn → Instagram → TikTok) | pending | | |
| 11 | Retrospective | pending | | |

## Blockers & decisions needed
- Fix GitHub auth (remove/replace invalid GH_TOKEN, `gh auth login --scopes repo,workflow`) before phase 5
- Authenticate Figma MCP (`/mcp` → figma) before phase 3
