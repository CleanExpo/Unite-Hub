# NotebookLM Second Brain — Bootstrap

Set up the NotebookLM Second Brain for this project. This is a one-time setup command.

## Instructions

Execute the following steps **sequentially**. Stop and report if any step fails.

### Step 1: Install the CLI

```bash
pip install notebooklm-mcp-cli
```

If `pip` is not available or the user prefers isolated installs:

```bash
pip install pipx && pipx install notebooklm-mcp-cli
```

Verify installation:

```bash
nlm --version
```

### Step 2: Authenticate

```bash
nlm login
```

This opens a browser window and extracts cookies from the user's NotebookLM session. Wait for the user to complete the browser flow.

Verify authentication:

```bash
nlm login --check
```

If auth fails, ask the user to log in to NotebookLM in their browser first, then retry.

### Step 3: Create Notebooks

Create all 4 project notebooks:

```bash
nlm notebook create "NodeJS-Starter-V1 — Source of Truth"
nlm notebook create "NodeJS-Starter-V1 — Debug KB"
nlm notebook create "NodeJS-Starter-V1 — Security Handbook"
nlm notebook create "NodeJS-Starter-V1 — Repo Atlas"
```

Capture the notebook ID from each command's output.

### Step 4: Write IDs to Config

Read the current config:

```bash
cat .claude/notebooklm/notebooks.json
```

Update `.claude/notebooklm/notebooks.json` with the captured IDs for each notebook key:

- `project_sot` — Source of Truth ID
- `debug_kb` — Debug KB ID
- `security_handbook` — Security Handbook ID
- `repo_onboarding` — Repo Atlas ID

### Step 5: Add Sources to Each Notebook

**project_sot** (Source of Truth):

```bash
nlm source add <project_sot_id> --file CLAUDE.md
nlm source add <project_sot_id> --file PROGRESS.md
nlm source add <project_sot_id> --file README.md
nlm source add <project_sot_id> --file docs/MULTI_AGENT_ARCHITECTURE.md
```

**debug_kb** (Debug KB):

```bash
nlm source add <debug_kb_id> --file docs/guides/TESTING_GUIDE.md
```

Also add any key error-pattern files from `apps/backend/src/` if they exist.

**security_handbook** (Security Handbook):

```bash
nlm source add <security_handbook_id> --url "https://owasp.org/www-project-top-ten/"
nlm source add <security_handbook_id> --url "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html"
```

Also add any security-related docs from `docs/` if they exist.

**repo_onboarding** (Repo Atlas):

```bash
npx repomix --output .claude/notebooklm/repo-pack.txt
nlm source add <repo_onboarding_id> --file .claude/notebooklm/repo-pack.txt
```

### Step 6: Generate Audio Overview (Optional)

Ask the user if they want an audio overview of the codebase:

```bash
nlm audio create <repo_onboarding_id> --confirm
```

This generates a podcast-style audio walkthrough. Skip if the user declines.

### Step 7: Configure MCP Server (Optional)

Ask the user if they want to enable the MCP server integration:

```bash
nlm setup add claude-code
```

This adds `notebooklm-mcp` to the Claude Code MCP server config. Skip if the user prefers CLI-only.

### Step 8: Validate

Run the validation script to confirm everything is wired correctly:

```bash
python scripts/validate-notebooks.py --check-ids
```

Expected output: all 4 notebook IDs present and valid.

### Step 9: Report

Summarise what was created:

- 4 NotebookLM notebooks created and seeded
- IDs written to `.claude/notebooklm/notebooks.json`
- Sources uploaded to each notebook
- Sync hook active (auto-syncs after verify/build)
- Audio overview: generated / skipped
- MCP server: configured / skipped

The Second Brain is now active. Refer to `.skills/custom/notebooklm-second-brain/SKILL.md` for usage.
