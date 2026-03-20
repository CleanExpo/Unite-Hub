# /vault-init — Regenerate Vault Index

> Scans `.claude/` and `.skills/` directories to rebuild `.claude/VAULT-INDEX.md` from current filesystem state.

## Usage

```
/vault-init
```

No arguments. Reads the filesystem and writes the index.

## What It Does

1. **Scan agents** — `ls .claude/agents/*/agent.md` (excludes `_archived/`)
2. **Scan rules** — `find .claude/rules -name "*.md"` (recursive)
3. **Scan commands** — `ls .claude/commands/*.md`
4. **Scan blueprints** — `ls .claude/blueprints/*.blueprint.md`
5. **Scan hook scripts** — `ls .claude/hooks/scripts/*`
6. **Scan skills** — `ls .skills/custom/*/SKILL.md`
7. **Scan memory** — `ls .claude/memory/*.md`
8. **Scan primers** — `ls .claude/primers/*.md`
9. **Scan data** — `ls .claude/data/*`
10. **Scan knowledge** — `find .claude/knowledge -name "*.md" -o -name "*.json"`
11. **Scan templates** — `ls .claude/templates/*.md`
12. **Scan schemas** — `ls .claude/schemas/*.md`

## Execution Protocol

### Step 1 — Filesystem Scan

Run each scan command above. Collect file paths into categorised lists.

### Step 2 — Count and Classify

For each category:
- Count total assets
- Extract name from path (strip prefix and extension)
- Derive wiki-link syntax from category + name
- Classify agent priority from frontmatter (`priority:` field)
- Flag new assets (not in previous index) with ⭐ NEW

### Step 3 — Write VAULT-INDEX.md

Overwrite `.claude/VAULT-INDEX.md` with:
- Updated timestamp (current date in DD/MM/YYYY)
- All categorised tables with wiki-links
- Summary counts per category
- Spot-check section with sample lookups

### Step 4 — Validate

Check that these canonical links resolve:
```
[[orchestrator]]           → .claude/agents/orchestrator/agent.md
[[rules/core]]             → .claude/rules/core.md
[[rules/cli-control-plane]]→ .claude/rules/cli-control-plane.md
[[senior-fullstack]]       → .claude/agents/senior-fullstack/agent.md
[[commands/minion]]        → .claude/commands/minion.md
```

If any fail, report with:
```
VAULT-INIT ERROR: [[{link}]] does not resolve — expected {path}
```

### Step 5 — Report

```
VAULT-INIT COMPLETE — {DD/MM/YYYY}

Assets catalogued:
  Agents:    {n}
  Rules:     {n}
  Commands:  {n}
  Blueprints:{n}
  Scripts:   {n}
  Skills:    {n}
  Memory:    {n}
  Primers:   {n}
  Data:      {n}
  Knowledge: {n}
  Templates: {n}
  Schemas:   {n}

Index written: .claude/VAULT-INDEX.md
Validation: all spot-checks passed ✓
```

## When to Run

- After adding a new agent, rule, command, skill, or schema
- At the start of a new major feature or rebuild phase
- When wiki-link lookups are returning misses
- After any `.claude/` directory restructure

## Protected Assets

The following are listed in VAULT-INDEX but must NOT be modified by `/vault-init` or any agent:
- `.claude/memory/CONSTITUTION.md`
- `.claude/memory/compass.md`
- `.claude/data/design-tokens.json`
- All hook scripts in `.claude/hooks/scripts/`
