# Retrieval-First Knowledge Protocol

> **Directive**: Query external sources BEFORE loading documentation into context.
> Do not rely on training data when an answer can be derived from project files or tools.

---

## Priority Order

1. **NotebookLM** — Project-specific knowledge (architecture, debug, security, onboarding)
2. **Context7 MCP** — Library/framework documentation (Next.js, FastAPI, Playwright, SQLAlchemy, Tailwind)
3. **Skills** — Pattern libraries (`.skills/custom/*/SKILL.md`) — load only the relevant section
4. **Codebase search** — Grep/Glob for implementation details
5. **Web search** — Last resort for external/current information

---

## NotebookLM Routing

| Query Pattern | Notebook | Command |
|--------------|----------|---------|
| Architecture, specs, implementation notes | `project_sot` | `nlm notebook query <id>` |
| Errors, debugging, test failures | `debug_kb` | `nlm notebook query <id>` |
| OWASP, auth patterns, security reviews | `security_handbook` | `nlm notebook query <id>` |
| Codebase atlas, "how does X work?" | `repo_onboarding` | `nlm notebook query <id>` |

Config: `.claude/notebooklm/notebooks.json`

---

## Context7 MCP Usage

For library documentation, use the two-step pattern:
1. `resolve-library-id` — find the library
2. `get-library-docs` — fetch relevant docs with topic filter

**Common libraries**: next, react, fastapi, sqlalchemy, playwright, tailwindcss, langchain, pydantic

---

## Jina Reader (Web Content)

**Endpoint**: `https://r.jina.ai/{url}` with `Authorization: Bearer ${JINA_API_KEY}` and `Accept: text/markdown`.
Windows: add `--ssl-no-revoke` to curl if SSL errors occur. Key in `.env`.

---

## Anti-Patterns

- Never paste full library docs inline — use Context7 or Jina
- Never web search when a NotebookLM notebook has the answer
- Never load a full SKILL.md when only one pattern section is needed
- Never dump entire file contents when a Grep match suffices

---

## Australian English (en-AU)

All output must use Australian spelling and conventions:
- **Spelling**: colour, behaviour, optimisation, analyse, centre, licence (noun)
- **Dates**: DD/MM/YYYY
- **Currency**: AUD ($)
- **Timezone**: AEST/AEDT
- **Tone**: Direct, professional, no unnecessary superlatives
