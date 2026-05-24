# Cleanup Plan 03 — Authority-Site Canonicalization (NO MERGE)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Recognize `CleanExpo/Unite-Group` (Authority-Site / Empire Command Center) as a **permanent separate product** in the registry, give it the same canonical-path structure and workflow protections as other products, and add explicit disambiguation rules so the Unite-Group ↔ Unite-Hub name collision can never confuse an agent again.

**Architecture decision:** The original spec proposed merging Unite-Group into Unite-Hub. Inspection revealed Unite-Group is a 135,587-LOC sibling product (154 routes, separate Supabase project, Remotion video pipeline, i18n, RBAC) — not a small dashboard. The actual user goal ("system should not treat the two names as separate things") is solved by the registry alias system alone. Merging the code is unnecessary and would risk weeks of disruption to a working product.

**Tech Stack:** PowerShell (junctions), `gh` CLI (branch protection + templates), git, registry validator.

**Spec reference:** `docs/superpowers/specs/2026-05-24-unite-ecosystem-cleanup-design.md` — Phase 2B revised (this plan supersedes the merge).

**Prerequisites:**
- Plans 01 and 02 complete
- `D:\Unite-Group\Authority-Site` local clone still in place (kept through Plans 01-02 expressly for this work)
- On branch `docs/cleanup-spec-2026-05-24`

---

## File Structure

**Modified:**
- `D:\Unite-Hub\.portfolio\PORTFOLIO.yaml` — Authority-Site entry rewritten, top-level `disambiguation:` block added, registry SSOT canonicalized
- `D:\Unite-Hub\.portfolio\schema\portfolio.schema.json` — allow new `disambiguation:` field
- `D:\Unite-Hub\docs\superpowers\specs\2026-05-24-unite-ecosystem-cleanup-design.md` — superseding note for Phase 2B
- `D:\Authority-Site\CLAUDE.md` — Identity block + cross-link to Unite-Hub
- `D:\Unite-Hub\CLAUDE.md` — add cross-link to Authority-Site
- 2 GitHub repos get branch protection + templates: `CleanExpo/Unite-Group`

**Moved:**
- `D:\Unite-Group\Authority-Site\` (real clone) → `D:\Authority-Site\` (canonical top-level)
- `D:\Unite-Group\Authority-Site` becomes a JUNCTION → `D:\Authority-Site`

---

## Task 1 — Move Authority-Site clone to canonical top-level path

**Files:**
- Move: `D:\Unite-Group\Authority-Site\` → `D:\Authority-Site\`
- Create: junction `D:\Unite-Group\Authority-Site` → `D:\Authority-Site`

**Why:** consistency. Every other product follows the pattern `canonical_path = D:\<Name>` with a junction at `D:\Unite-Group\<Name>`. Authority-Site is currently the only real-folder-inside-junction-parent — fixing this aligns it with the rest.

- [ ] **Step 1: Pre-check Authority-Site clone is clean**

```bash
p="D:/Unite-Group/Authority-Site"
echo "branch: $(git -C "$p" branch --show-current)"
echo "dirty: $(git -C "$p" status --porcelain | wc -l)"
echo "unpushed: $(git -C "$p" log --branches --not --remotes --oneline | wc -l)"
```

Expected: branch=main, dirty=0, unpushed=0. If anything dirty/unpushed, STOP and push first.

- [ ] **Step 2: Refuse if D:\Authority-Site already exists**

```powershell
if (Test-Path "D:\Authority-Site") { throw "REFUSING: D:\Authority-Site already exists. Investigate." } else { "free to use" }
```

Expected: `free to use`.

- [ ] **Step 3: Move the folder**

```powershell
# Close any IDEs / processes holding files in this dir BEFORE running
Move-Item -Path "D:\Unite-Group\Authority-Site" -Destination "D:\Authority-Site"
Test-Path "D:\Authority-Site\package.json"  # sanity check the move
```

Expected: `True`. If move fails with "in use", close VS Code / file explorers and retry.

- [ ] **Step 4: Create junction at the parent location**

```powershell
New-Item -ItemType Junction -Path "D:\Unite-Group\Authority-Site" -Target "D:\Authority-Site" | Out-Null
(Get-Item "D:\Unite-Group\Authority-Site").Target
```

Expected: `D:\Authority-Site` (confirms junction points correctly).

- [ ] **Step 5: Verify git operations still work through the junction**

```bash
# git via the junction
git -C "D:/Unite-Group/Authority-Site" log --oneline -1
# git via the canonical path
git -C "D:/Authority-Site" log --oneline -1
```

Both should show the same commit (`b0921f8 Merge pull request #160 ...`).

- [ ] **Step 6: Log**

```bash
cat >> "D:/_archive/2026-05-24/_cleanup-log.md" <<'EOF'

### 2026-05-24 — Plan 03 Task 1: Authority-Site moved to canonical path
- D:\Unite-Group\Authority-Site (real folder, 8MB) → D:\Authority-Site
- D:\Unite-Group\Authority-Site now a junction → D:\Authority-Site
- Rationale: consistency with all other portfolio products (canonical at top-level D:\, junction in parent)
- Rollback: `Remove-Item D:\Unite-Group\Authority-Site -Recurse -Force; Move-Item D:\Authority-Site D:\Unite-Group\Authority-Site`
EOF
echo "logged"
```

---

## Task 2 — Update registry: Authority-Site permanent + new disambiguation block

**File:** `D:\Unite-Hub\.portfolio\PORTFOLIO.yaml`

- [ ] **Step 1: Replace Authority-Site entry**

Use the Edit tool to find the existing Authority-Site block and replace `note:` line plus add `access_via` to make it consistent with other products. The block to change:

Find (look in PORTFOLIO.yaml around lines 38-60):

```yaml
  - canonical_name: Authority-Site
    aliases: ["Empire Command Center", "CEO Dashboard", "Synthex Authority Hub", "Unite-Group Dashboard"]
    purpose: "CEO dashboard surfacing portfolio health + Pi-CEO agent activity (being merged into Unite-Hub)"
    status: active
    note: "Will flip to status:archived after Phase 2B merge completes"
    owner: phill
    github:
      org: CleanExpo
      repo: Unite-Group
      url: https://github.com/CleanExpo/Unite-Group
      default_branch: main
    local:
      canonical_path: 'D:\Unite-Group\Authority-Site'
      do_not_clone_to:
        - 'D:\Unite-Group Agency\Unite-Group'
        - 'D:\Unite-Group Agency\Unite-Group-Main'
```

Replace with:

```yaml
  - canonical_name: Authority-Site
    aliases: ["Empire Command Center", "CEO Dashboard", "Synthex Authority Hub", "Unite-Group Dashboard", "Empire", "Authority Site"]
    purpose: "Standalone authority/landing site with CEO dashboard, Pi-CEO integration, Remotion video pipeline, brand guardian, i18n (en/es/fr), and RBAC. NOT a sub-app of Unite-Hub — they are separate products that share the parent company name."
    status: active
    owner: phill
    github:
      org: CleanExpo
      repo: Unite-Group
      url: https://github.com/CleanExpo/Unite-Group
      default_branch: main
      sandbox_branch: sandbox
    local:
      canonical_path: 'D:\Authority-Site'
      access_via: 'D:\Unite-Group\Authority-Site'
      do_not_clone_to:
        - 'D:\Unite-Group Agency\Unite-Group'
        - 'D:\Unite-Group Agency\Unite-Group-Main'
    vercel:
      team_id: team_KMZACI5rIltoCRhAtGCXlxUf
      production: { project_id: prj_IfUuJNLjXTE8VXqEGwLAleIGhiA0, project_name: unite-group, domain: unite-group.vercel.app }
      sandbox:    { project_id: null, project_name: unite-group-sandbox, domain: unite-group-sandbox.vercel.app }
    workflow: { sandbox_first: true, pr_required_for_prod: true, ci_required_checks: [typecheck, lint, build] }
    stack: { framework: "next@14", runtime: "react@18", package_manager: npm, dev_port: 3000, supabase_project_id: uqfgdezadpkiadugufbs }
    dependencies:
      - { canonical_name: Pi-CEO, relationship: "consumes via PI_CEO_API_URL (Railway)" }
      - { canonical_name: Hermes, relationship: "consumes wiki via WIKI_PATH" }
```

Note the changes:
- `note:` removed (no longer "will be merged")
- `purpose:` rewritten emphasizing it's a separate product
- `aliases:` expanded with "Empire" and "Authority Site"
- `local.canonical_path:` changed `D:\Unite-Group\Authority-Site` → `D:\Authority-Site` (matches the move from Task 1)
- `local.access_via:` added
- `github.sandbox_branch: sandbox` added
- `vercel.production.project_id:` filled in (from earlier Vercel audit)
- `vercel.sandbox.project_name:` planned for `unite-group-sandbox`
- `workflow:` added (was missing)
- `stack:` added with full details
- `dependencies:` Hermes added

- [ ] **Step 2: Add top-level `disambiguation:` block at the END of PORTFOLIO.yaml**

After the `renamed_repos:` block, append:

```yaml

disambiguation:
  - ambiguous_term: "Unite-Group"
    likely_canonical: Unite-Hub
    reason: "GitHub repo CleanExpo/Unite-Hub is described as 'Unite Group CRM'. Most casual uses of 'Unite-Group' by the user mean the CRM (Unite-Hub), not the standalone Authority-Site product. If unsure, check if the request involves CRM/contacts/marketing → Unite-Hub; or executive dashboard/Pi-CEO/portfolio metrics → Authority-Site."
    secondary_canonical: Authority-Site
  - ambiguous_term: "Unite Group"
    likely_canonical: Unite-Hub
    reason: "Same as above"
    secondary_canonical: Authority-Site
  - ambiguous_term: "the Unite-Group repo"
    likely_canonical: Unite-Hub
    reason: "Despite the literal GitHub repo CleanExpo/Unite-Group existing for Authority-Site, when the user says 'the Unite-Group repo' they usually mean Unite-Hub (the CRM). Ask if context is unclear."
    secondary_canonical: Authority-Site
```

- [ ] **Step 3: Validate registry**

```bash
node "D:/Unite-Hub/.portfolio/scripts/validate-registry.mjs"
```

Expected: `OK — 11 products, ...` (alias count goes up by 2 from the new "Empire" and "Authority Site").

If validation fails due to `disambiguation` not being in the schema: that's expected. Continue to Task 3 which updates the schema.

---

## Task 3 — Update schema to allow `disambiguation:` block

**File:** `D:\Unite-Hub\.portfolio\schema\portfolio.schema.json`

- [ ] **Step 1: Edit schema — add `disambiguation` property**

After the `renamed_repos` schema definition (which is right before the final `}`), add:

```json
    "disambiguation": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["ambiguous_term", "likely_canonical", "reason"],
        "properties": {
          "ambiguous_term":      { "type": "string" },
          "likely_canonical":    { "type": "string" },
          "reason":              { "type": "string" },
          "secondary_canonical": { "type": "string" }
        }
      }
    }
```

- [ ] **Step 2: Re-validate**

```bash
node "D:/Unite-Hub/.portfolio/scripts/validate-registry.mjs"
```

Expected: `OK — 11 products, 31 aliases, no collisions`.

- [ ] **Step 3: Mirror to Hermes**

```bash
powershell -NoProfile -Command "& 'D:\Unite-Hub\.portfolio\scripts\Mirror-ToHermes.ps1'"
```

- [ ] **Step 4: Commit**

```bash
git -C "D:/Unite-Hub" add .portfolio/
git -C "D:/Unite-Hub" commit -m "feat(portfolio): canonicalize Authority-Site as permanent product + add disambiguation block"
```

---

## Task 4 — Update spec doc with superseding note for Phase 2B

**File:** `D:\Unite-Hub\docs\superpowers\specs\2026-05-24-unite-ecosystem-cleanup-design.md`

- [ ] **Step 1: Insert a SUPERSEDED block above the Phase 2B section**

Find the `### Workstream B · Unite-Group → Unite-Hub merge (7 steps)` heading and immediately above it insert:

```markdown
> **⚠️ SUPERSEDED (2026-05-24):** Inspection during Plan 03 revealed Unite-Group is a 135,587 LOC standalone product with 154 routes, separate Supabase project, Remotion video pipeline, multi-language i18n, and full RBAC — not a small dashboard suitable for subtree merge. The actual goal (registry recognizes both names map to non-confusing canonicals) is solved by Plan 01's alias system alone. Phase 2B (the merge) is REPLACED by Plan 03's canonicalization-only approach: keep both repos, give Authority-Site the same workflow protections as other products, add an explicit disambiguation block to the registry, and document why they remain separate. See `docs/superpowers/plans/2026-05-24-cleanup-03-authority-site-canonicalize.md`.

---

```

- [ ] **Step 2: Commit**

```bash
git -C "D:/Unite-Hub" add docs/superpowers/specs/
git -C "D:/Unite-Hub" commit -m "docs(spec): supersede Phase 2B (Unite-Group merge) — kept as separate product instead"
```

---

## Task 5 — Add Identity block to D:\Authority-Site\CLAUDE.md

**File:** `D:\Authority-Site\CLAUDE.md` (already exists at 2229 bytes per pre-Plan-01 inspection)

- [ ] **Step 1: Read current first 5 lines**

```bash
head -5 "D:/Authority-Site/CLAUDE.md"
```

- [ ] **Step 2: Insert Identity block after the existing top heading**

```powershell
$file = "D:\Authority-Site\CLAUDE.md"
$content = Get-Content $file -Raw
$identity = @'
@../Unite-Hub/.portfolio/PORTFOLIO.yaml

## Identity (SSOT)
**Canonical name:** Authority-Site
**Aliases this project answers to:** "Empire Command Center", "CEO Dashboard", "Synthex Authority Hub", "Unite-Group Dashboard", "Empire", "Authority Site"
**Canonical local path:** `D:\Authority-Site`
**Access via:** `D:\Unite-Group\Authority-Site` (junction)
**GitHub:** `CleanExpo/Unite-Group`

> **Sibling product:** Unite-Hub (the CRM at D:\Unite-Hub) is a SEPARATE product.
> If the user says "Unite-Group" or "Unite Group" generically, they MOST LIKELY mean Unite-Hub (the CRM).
> Only operate in THIS project if the user references Empire, CEO dashboard, Pi-CEO, or portfolio metrics.
>
> Registry: see `D:\Unite-Hub\.portfolio\PORTFOLIO.yaml` (the single source of truth for both products).

---

'@
if ($content -notmatch '@\.\./Unite-Hub/\.portfolio/PORTFOLIO\.yaml') {
  # Match the first heading regardless of exact text
  $new = $content -replace '(?m)^(#[^\r\n]*\r?\n)', "`$1`r`n$identity", 1
  $new | Out-File -FilePath $file -Encoding utf8 -NoNewline
  "inserted"
} else { "already present" }
```

Expected: `inserted`. (The `@../Unite-Hub/.portfolio/...` reference resolves via the parent junction tree — when an agent loads CLAUDE.md from D:\Authority-Site, the relative path `../Unite-Hub/` resolves to `D:\Unite-Hub`, which is correct.)

- [ ] **Step 3: Verify**

```bash
grep -c "Canonical name: Authority-Site" "D:/Authority-Site/CLAUDE.md"
```

Expected: `1`.

- [ ] **Step 4: Commit on Authority-Site repo** (separate from Unite-Hub repo!)

```bash
cd "D:/Authority-Site" && git add CLAUDE.md && git commit -m "chore(portfolio): add Identity block linking to Unite-Group registry"
git -C "D:/Authority-Site" push 2>&1 | tail -3
```

NOTE: branch protection on Authority-Site main may require a PR rather than direct push. If push is rejected, create a branch:

```bash
git -C "D:/Authority-Site" checkout -b chore/portfolio-identity-block-2026-05-24
git -C "D:/Authority-Site" push -u origin chore/portfolio-identity-block-2026-05-24
gh -R CleanExpo/Unite-Group pr create --base main --head chore/portfolio-identity-block-2026-05-24 \
  --title "chore: add portfolio Identity block (Plan 03)" \
  --body "Adds Identity block linking to the central Unite-Group portfolio registry. See Unite-Hub:.portfolio/PORTFOLIO.yaml for the SSOT. Plan 03 — Authority-Site canonicalization."
# Self-merge:
PR=$(gh -R CleanExpo/Unite-Group pr list --head chore/portfolio-identity-block-2026-05-24 --json number --jq '.[0].number')
gh -R CleanExpo/Unite-Group pr merge "$PR" --squash --delete-branch --admin
git -C "D:/Authority-Site" checkout main && git -C "D:/Authority-Site" pull
```

NOTE: Authority-Site doesn't have branch protection YET — that's Task 7. So the direct push should succeed.

---

## Task 6 — Add cross-link in D:\Unite-Hub\CLAUDE.md to Authority-Site

**File:** `D:\Unite-Hub\CLAUDE.md`

- [ ] **Step 1: Inject sibling-product reference inside the existing Identity block**

The current Identity block (added in Plan 01 Task 6) has the alias list and "do not clone" warning. We add a sibling reference at the bottom of that block.

```powershell
$file = "D:\Unite-Hub\CLAUDE.md"
$content = Get-Content $file -Raw

$sibling = @'

> **Sibling product:** Authority-Site (at `D:\Authority-Site`, repo `CleanExpo/Unite-Group`) is a SEPARATE product.
> Despite the repo name `Unite-Group`, that's the EMPIRE COMMAND CENTER, not this CRM.
> If the user asks about Empire / CEO dashboard / Pi-CEO / portfolio metrics → switch to that project.
> Otherwise (CRM / contacts / drip campaigns / email AI / marketing) → stay here.

'@

if ($content -notmatch 'Sibling product:.*Authority-Site') {
  $content = $content -replace '(local\.do_not_clone_to\[\]` in `\.portfolio/PORTFOLIO\.yaml`\.\r?\n)', "`$1$sibling"
  $content | Out-File -FilePath $file -Encoding utf8 -NoNewline
  "inserted"
} else { "already present" }
```

- [ ] **Step 2: Verify**

```bash
grep -c "Sibling product:.*Authority-Site" "D:/Unite-Hub/CLAUDE.md"
```

Expected: `1`.

- [ ] **Step 3: Commit**

```bash
git -C "D:/Unite-Hub" add CLAUDE.md
git -C "D:/Unite-Hub" commit -m "docs(claude): add Authority-Site sibling-product cross-reference"
```

---

## Task 7 — Apply branch protection + sandbox to `CleanExpo/Unite-Group`

Apply the same workflow setup that Plan 02 applied to the 9 other product repos (which excluded Authority-Site at the time pending the merge decision).

- [ ] **Step 1: Use the existing apply-protection script with --only**

The script already supports `--only=<canonical_name>`. But Plan 02 hard-coded a skip for `Authority-Site`. Need to either temporarily remove the skip or do this one repo by hand. Doing by hand (it's just one repo):

```bash
# Get main sha
MAIN_SHA=$(gh api repos/CleanExpo/Unite-Group/git/refs/heads/main --jq '.object.sha')
echo "main @ ${MAIN_SHA:0:7}"

# Create sandbox branch
gh api -X POST repos/CleanExpo/Unite-Group/git/refs -f "ref=refs/heads/sandbox" -f "sha=$MAIN_SHA" --jq .ref 2>&1

# Apply main protection
cat > /tmp/main-prot.json <<'EOF'
{"required_status_checks":{"strict":true,"contexts":[]},"enforce_admins":false,"required_pull_request_reviews":{"required_approving_review_count":0,"dismiss_stale_reviews":true},"restrictions":null,"required_linear_history":true,"allow_force_pushes":false,"allow_deletions":false,"required_conversation_resolution":true}
EOF
gh api -X PUT repos/CleanExpo/Unite-Group/branches/main/protection --input /tmp/main-prot.json --jq '{required_linear_history,allow_force_pushes}'

# Apply sandbox protection (looser)
cat > /tmp/sandbox-prot.json <<'EOF'
{"required_status_checks":{"strict":false,"contexts":[]},"enforce_admins":false,"required_pull_request_reviews":null,"restrictions":null,"required_linear_history":false,"allow_force_pushes":true,"allow_deletions":true}
EOF
gh api -X PUT repos/CleanExpo/Unite-Group/branches/sandbox/protection --input /tmp/sandbox-prot.json --jq '{allow_force_pushes,allow_deletions}'
```

Expected: main shows `{"required_linear_history":true,"allow_force_pushes":{"enabled":false}}`, sandbox shows `{"allow_force_pushes":{"enabled":true},"allow_deletions":{"enabled":true}}`.

- [ ] **Step 2: Push PR template + CODEOWNERS to Unite-Group repo via gh API**

```bash
PR_B64=$(base64 -w 0 "D:/Unite-Hub/.portfolio/templates/PULL_REQUEST_TEMPLATE.md")
CO_B64=$(base64 -w 0 "D:/Unite-Hub/.portfolio/templates/CODEOWNERS")
BRANCH="chore/portfolio-templates-2026-05-24"

MAIN_SHA=$(gh api repos/CleanExpo/Unite-Group/git/refs/heads/main --jq '.object.sha')
gh api -X POST repos/CleanExpo/Unite-Group/git/refs -f "ref=refs/heads/$BRANCH" -f "sha=$MAIN_SHA" --jq .ref

for entry in "PULL_REQUEST_TEMPLATE.md|$PR_B64" "CODEOWNERS|$CO_B64"; do
  NAME="${entry%%|*}"; B64="${entry#*|}"
  EXISTING=$(gh api "repos/CleanExpo/Unite-Group/contents/.github/$NAME?ref=$BRANCH" 2>&1)
  if echo "$EXISTING" | grep -q '"sha"'; then
    SHA=$(echo "$EXISTING" | grep -oP '"sha":"\K[^"]+' | head -1)
    BODY="{\"message\":\"chore: update .github/$NAME from portfolio registry\",\"content\":\"$B64\",\"branch\":\"$BRANCH\",\"sha\":\"$SHA\"}"
  else
    BODY="{\"message\":\"chore: add .github/$NAME from portfolio registry\",\"content\":\"$B64\",\"branch\":\"$BRANCH\"}"
  fi
  printf "%s" "$BODY" | gh api -X PUT "repos/CleanExpo/Unite-Group/contents/.github/$NAME" --input - --jq '.commit.sha'
done

# PR + merge
PR_URL=$(gh -R CleanExpo/Unite-Group pr create --base main --head "$BRANCH" \
  --title "chore: add PR template + CODEOWNERS from portfolio registry (Plan 03)" \
  --body "Aligns Authority-Site repo with Plan 02 workflow standards.")
echo "$PR_URL"
PR_NUM=$(echo "$PR_URL" | grep -oP '/pull/\K\d+' | head -1)
gh -R CleanExpo/Unite-Group pr merge "$PR_NUM" --squash --delete-branch --admin
```

- [ ] **Step 3: Verify**

```bash
gh api repos/CleanExpo/Unite-Group/contents/.github/PULL_REQUEST_TEMPLATE.md?ref=main --jq .name
gh api repos/CleanExpo/Unite-Group/contents/.github/CODEOWNERS?ref=main --jq .name
```

Both should return their filename. NOT MISSING.

---

## Task 8 — Update apply-protection.mjs to no longer skip Authority-Site

**File:** `D:\Unite-Hub\.portfolio\scripts\apply-protection.mjs`

- [ ] **Step 1: Remove the skip condition**

Edit the file to change:

```javascript
const targets = registry.products.filter(p =>
  p.status === "active" &&
  p.github?.repo &&
  p.canonical_name !== "Authority-Site"   // skip — merging in Plan 03
);
```

to:

```javascript
const targets = registry.products.filter(p =>
  p.status === "active" &&
  p.github?.repo
);
```

- [ ] **Step 2: Dry-run to confirm Authority-Site now appears (and that re-running won't break already-protected repos)**

```bash
node "D:/Unite-Hub/.portfolio/scripts/apply-protection.mjs" --only=Authority-Site --dry-run
```

Expected: `=== Authority-Site (CleanExpo/Unite-Group) ===` with "sandbox exists" + DRY-RUN PUT lines.

- [ ] **Step 3: Commit**

```bash
git -C "D:/Unite-Hub" add .portfolio/scripts/apply-protection.mjs
git -C "D:/Unite-Hub" commit -m "fix(portfolio): include Authority-Site in apply-protection (no merge — kept separate)"
```

---

## Task 9 — Acceptance verification

- [ ] **Step 1: Junction in place + canonical clone works**

```bash
ls -d "D:/Authority-Site" "D:/Unite-Group/Authority-Site"
powershell -Command "(Get-Item 'D:\Unite-Group\Authority-Site').LinkType"
git -C "D:/Authority-Site" log --oneline -1
```

Expected: both paths exist; LinkType=Junction; commit log returns valid commit.

- [ ] **Step 2: Registry valid + disambiguation block present**

```bash
node "D:/Unite-Hub/.portfolio/scripts/validate-registry.mjs"
grep -c "disambiguation:" "D:/Unite-Hub/.portfolio/PORTFOLIO.yaml"
grep -A 2 "canonical_name: Authority-Site" "D:/Unite-Hub/.portfolio/PORTFOLIO.yaml" | head -5
```

Expected: OK message; `1`; entry shows new aliases including "Empire" and "Authority Site".

- [ ] **Step 3: CLAUDE.md cross-links present in both repos**

```bash
grep -c "Sibling product:.*Authority-Site" "D:/Unite-Hub/CLAUDE.md"
grep -c "Canonical name: Authority-Site" "D:/Authority-Site/CLAUDE.md"
```

Expected: each returns `1`.

- [ ] **Step 4: Unite-Group repo has branch protection + templates**

```bash
gh api repos/CleanExpo/Unite-Group/branches/main/protection --jq '{required_linear_history,allow_force_pushes}'
gh api repos/CleanExpo/Unite-Group/branches/sandbox/protection --jq '{allow_force_pushes,allow_deletions}'
gh api repos/CleanExpo/Unite-Group/contents/.github/PULL_REQUEST_TEMPLATE.md?ref=main --jq .name
gh api repos/CleanExpo/Unite-Group/contents/.github/CODEOWNERS?ref=main --jq .name
```

Expected: main protected, sandbox open, both template files present.

- [ ] **Step 5: Hermes mirror up to date**

```bash
diff <(tail -n +5 "D:/Hermes/wiki/entities/portfolio/PORTFOLIO.yaml") "D:/Unite-Hub/.portfolio/PORTFOLIO.yaml" && echo "in sync"
```

If diff finds changes, re-run `Mirror-ToHermes.ps1`.

---

## Task 10 — Final commit, push, and Plan 03 status report

- [ ] **Step 1: Final commit if anything pending**

```bash
git -C "D:/Unite-Hub" status --porcelain
git -C "D:/Unite-Hub" add -A
git -C "D:/Unite-Hub" commit -m "chore(cleanup-03): complete Authority-Site canonicalization" 2>&1 | tail -3
```

- [ ] **Step 2: Push**

```bash
git -C "D:/Unite-Hub" push 2>&1 | tail -3
```

- [ ] **Step 3: Status report**

```
============== PLAN 03 STATUS ==============
✓ Authority-Site moved to canonical D:\Authority-Site
✓ Junction D:\Unite-Group\Authority-Site → D:\Authority-Site
✓ Registry: Authority-Site permanent + disambiguation block (3 ambiguous terms mapped)
✓ Spec: Phase 2B superseded note added
✓ CLAUDE.md cross-links: Unite-Hub ↔ Authority-Site sibling references
✓ CleanExpo/Unite-Group: branch protection + PR template + CODEOWNERS
✓ apply-protection.mjs: Authority-Site no longer skipped
✓ Hermes mirror: in sync

NEXT: Plan 04 (Vercel cleanup + sandboxes)
============================================
```

- [ ] **Step 4: Handoff**

Ask the user to confirm Plan 03 outcome and approve writing Plan 04 (Vercel project audit + cleanup + 8 missing sandboxes).

---

## Rollback procedures

**Revert the folder move:**
```powershell
Remove-Item D:\Unite-Group\Authority-Site -Recurse -Force
Move-Item D:\Authority-Site D:\Unite-Group\Authority-Site
```

**Revert registry changes:**
```bash
git -C "D:/Unite-Hub" revert <commit-sha>
node "D:/Unite-Hub/.portfolio/scripts/validate-registry.mjs"
```

**Remove branch protection from Unite-Group repo:**
```bash
gh api -X DELETE repos/CleanExpo/Unite-Group/branches/main/protection
gh api -X DELETE repos/CleanExpo/Unite-Group/branches/sandbox/protection
```

**Restore Phase 2B merge plan if you change your mind:**
The original merge plan content is in the spec file under the SUPERSEDED block. Remove the SUPERSEDED note + create a new Plan 03b for the merge.

---

## Self-review notes

**What this plan achieves (vs original Phase 2B):**
- ✓ User goal (no naming confusion) → achieved via registry + disambiguation block + cross-link
- ✓ Both products kept healthy → no risky merge
- ✓ Workflow consistency → Authority-Site gets same protection + templates as others
- ✓ Structural consistency → all 11 products now use D:\<Name> + junction pattern

**What this plan does NOT do (and why):**
- Code merge (Next 14→16, schema migration, Remotion adaptation) → Unnecessary; underlying goal already met by registry
- Vercel project consolidation → That's Plan 04
- Domain redirect → Not needed; both apps stay on their own domains
- Repo deletion of CleanExpo/Unite-Group → Kept permanently as a real product

**Risks:**
- **Open IDE / process holding files** in `D:\Unite-Group\Authority-Site` will block the Move-Item in Task 1. Mitigation: pre-check script can detect handles via `handle.exe` (Sysinternals), or just ask the user to close all editors before running.
- **Authority-Site repo branch protection blocks the Task 5 push** of its CLAUDE.md edit. Mitigation: Task 7 (which applies protection) explicitly comes AFTER Task 5 (which pushes the CLAUDE.md edit). Order preserved.
- **`@../Unite-Hub/.portfolio/PORTFOLIO.yaml` reference** in Authority-Site's CLAUDE.md only resolves correctly when an agent works in `D:\Authority-Site` (since the junction at `D:\Unite-Group\Authority-Site` makes `../Unite-Hub` resolve to `D:\Unite-Group\Unite-Hub`, which is itself a junction to `D:\Unite-Hub`). Verified via filesystem inspection.
