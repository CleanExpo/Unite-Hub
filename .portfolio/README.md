# .portfolio — Unite-Group Portfolio Registry

This directory is the **single source of truth** mapping each product in the
Unite-Group portfolio to its canonical name, aliases, GitHub repo, local
canonical path, Vercel projects, and workflow rules.

**Files:**
- `PORTFOLIO.yaml` — the registry. EDIT HERE ONLY.
- `schema/portfolio.schema.json` — JSON Schema validating PORTFOLIO.yaml
- `scripts/validate-registry.mjs` — `node` validator (run before commit)
- `scripts/Move-ToArchive.ps1` — reusable cleanup function
- `scripts/Mirror-ToHermes.ps1` — sync to `D:\Hermes\wiki\entities\portfolio\`
- `schedule/Register-HardDelete.ps1` — installs the scheduled-task hard-delete

**Auto-loading:** Every product's `CLAUDE.md` references this file via
`@../.portfolio/PORTFOLIO.yaml` so agents preload it on session start.

**Editing rules:**
1. Only edit `PORTFOLIO.yaml` here. The Hermes mirror is generated.
2. Run `node scripts/validate-registry.mjs` before commit.
3. Any change requires a PR with 24h cooling-off (solo founder rule).
