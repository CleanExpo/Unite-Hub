# Command: /hey-claude

**Category:** Workspace Setup
**Description:** Start a new Claude session with full Unite-Group system context loaded

## Usage

```
/hey-claude
```

Or with a question:

```
/hey-claude "How do I add a new API route?"
/hey-claude "Explain the contacts data flow"
/hey-claude "Help me debug this error"
```

## What It Does

This command initialises a new Claude conversation with full project context:

1. **System Context** — Loads current directory structure and key files
2. **Project Overview** — File tree, README, main entry points
3. **Architecture** — Service/repository layer, founder_id isolation, RLS patterns
4. **Framework** — `.claude/` agent system, active skills, available commands
5. **Ready for Questions** — You can immediately ask about:
   - How to implement a feature
   - How existing code works
   - How to debug an issue
   - Architecture guidance
   - Code examples

## Context Loaded

When you run `/hey-claude`, Claude loads:

```
src/
├── app/            — Next.js App Router (pages + API routes)
├── components/     — React components (ui/ + features/)
├── server/         — Services, repositories, validators, errors
├── hooks/          — Custom React hooks
├── lib/            — Shared utilities
└── types/          — TypeScript types

.claude/
├── AGENT_HARNESS.md    — Multi-agent coordination
├── VAULT-INDEX.md      — Knowledge vault
├── agents/             — 35 specialist agents
├── rules/              — Architecture + coding rules
└── commands/           — All available slash commands

.skills/custom/         — 74 custom skills
.pi/                    — CEO Board workspace (briefs, memos, expertise)
```

## Key Files Claude Will Read

- `src/app/layout.tsx` — App entry point
- `src/server/errors/index.ts` — Error handling pattern
- `.claude/rules/database/supabase.md` — Database patterns
- `.claude/rules/frontend/nextjs.md` — Frontend rules

## Related Commands

- **`/ceo-begin`** — Start a CEO Board deliberation about a decision
- **`/swarm-audit`** — Run automated system audit
- **`/generate-route-reference`** — Regenerate API documentation
- **`/verify`** — Full foundation verification
- **`/audit`** — Architecture audit

## Tips

- Use this at the start of a new session before complex feature work
- Pass your question directly: `/hey-claude "How does auth work?"`
- Claude will ask clarifying questions about your specific goal
- All agents and skills are available after loading context

---

**See Also:** [.claude/README.md](../README.md) for full framework documentation
