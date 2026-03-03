# Changelog Generator

> Automated changelog generation from Conventional Commits with semantic versioning and GitHub Release integration for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `changelog-generator`                                    |
| **Category**   | Communication & Reporting                                |
| **Complexity** | Low                                                      |
| **Complements**| `ci-cd-patterns`                                         |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies automated changelog generation for NodeJS-Starter-V1: parsing Conventional Commits into structured CHANGELOG.md entries, semantic version bumping (major/minor/patch), GitHub Release creation, CI/CD integration for tag-triggered changelog generation, and monorepo-aware grouping.

---

## When to Apply

### Positive Triggers

- Creating or updating CHANGELOG.md from git history
- Setting up automated changelog generation in CI/CD
- Configuring semantic version bumping based on commit types
- Creating GitHub Releases with generated release notes
- Adding `standard-version` or `conventional-changelog` tooling

### Negative Triggers

- Writing commit messages (use project commit conventions from `workflow.md` instead)
- CI/CD pipeline architecture (use `ci-cd-patterns` skill instead)
- Manual release notes for marketing (not a technical changelog)

---

## Core Principles

### The Three Laws of Changelogs

1. **Machine-Parseable, Human-Readable**: Generated from structured commits but formatted for developers to scan quickly. Group by type, sort by impact.
2. **Every User-Facing Change Documented**: Features, fixes, and breaking changes must appear. Internal refactors and CI changes may be excluded.
3. **Linked to Source**: Every entry links to its commit or PR. Every release links to the full diff.

---

## Pattern 1: Conventional Commits Parsing

### Commit Type → Changelog Section Mapping

**Project Reference**: Recent git history follows `type(scope): description` convention consistently.

| Commit Type | Changelog Section | Version Bump | Include? |
|-------------|------------------|:------------:|:--------:|
| `feat` | Features | minor | Always |
| `fix` | Bug Fixes | patch | Always |
| `perf` | Performance | patch | Always |
| `BREAKING CHANGE` | Breaking Changes | **major** | Always |
| `docs` | Documentation | — | Optional |
| `refactor` | Refactoring | — | Optional |
| `test` | Tests | — | Never |
| `chore` | Chores | — | Never |
| `ci` | CI/CD | — | Never |

### Breaking Change Detection

Breaking changes are detected via:

1. `BREAKING CHANGE:` in commit body or footer
2. `!` after type/scope: `feat(auth)!: remove password login`
3. Commit type `BREAKING CHANGE` (rare, non-standard)

**Rule**: Any commit with a breaking change indicator triggers a **major** version bump, regardless of the commit type prefix.

---

## Pattern 2: CHANGELOG.md Format

### Keep a Changelog Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Features

- **skills**: Generate queue-worker skill via Skill Manager ([2a5e843])

### Bug Fixes

- **hooks**: Correctly parse Beads ready output in stop hook ([1c6953b])

## [1.0.0] - 13/02/2026

### Features

- Complete Environment Isolation Layer + All Project Files ([fed9c50])
- Add Claude Code Hooks and Builder/Validator Pattern ([a22d5a7])

[Unreleased]: https://github.com/CleanExpo/NodeJS-Starter-V1/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/CleanExpo/NodeJS-Starter-V1/releases/tag/v1.0.0
```

### Formatting Rules

| Rule | Example |
|------|---------|
| Date format | DD/MM/YYYY (en-AU) |
| Scope in bold | `**skills**: description` |
| Short hash link | `([abc1234])` linking to commit |
| Sections ordered | Breaking Changes → Features → Bug Fixes → Performance |
| Empty sections omitted | Do not include `### Bug Fixes` if there are none |

---

## Pattern 3: Tooling Setup

### Option A: standard-version (Recommended)

```bash
pnpm add -D standard-version -w
```

```json
// package.json
{
  "scripts": {
    "release": "standard-version",
    "release:minor": "standard-version --release-as minor",
    "release:major": "standard-version --release-as major",
    "release:dry-run": "standard-version --dry-run"
  }
}
```

Configuration in `.versionrc.json`:

```json
{
  "types": [
    { "type": "feat", "section": "Features" },
    { "type": "fix", "section": "Bug Fixes" },
    { "type": "perf", "section": "Performance" },
    { "type": "docs", "section": "Documentation", "hidden": true },
    { "type": "refactor", "hidden": true },
    { "type": "test", "hidden": true },
    { "type": "chore", "hidden": true },
    { "type": "ci", "hidden": true }
  ],
  "commitUrlFormat": "https://github.com/CleanExpo/NodeJS-Starter-V1/commit/{{hash}}",
  "compareUrlFormat": "https://github.com/CleanExpo/NodeJS-Starter-V1/compare/{{previousTag}}...{{currentTag}}"
}
```

**What `pnpm run release` does**:

1. Reads commits since last tag (`v1.0.0`)
2. Determines version bump from commit types
3. Updates `package.json` version
4. Generates/updates `CHANGELOG.md`
5. Creates git commit: `chore(release): 1.1.0`
6. Creates git tag: `v1.1.0`

### Option B: conventional-changelog CLI

```bash
# Generate changelog without version bump
pnpm dlx conventional-changelog -p angular -i CHANGELOG.md -s
```

Use this for one-off generation without the full release workflow.

---

## Pattern 4: CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - "v*"

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0   # Full history for changelog

      - name: Generate release notes
        id: changelog
        run: |
          # Extract current version's changelog section
          VERSION=${GITHUB_REF#refs/tags/v}
          NOTES=$(sed -n "/## \[${VERSION}\]/,/## \[/p" CHANGELOG.md | head -n -1)
          echo "notes<<EOF" >> $GITHUB_OUTPUT
          echo "$NOTES" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          body: ${{ steps.changelog.outputs.notes }}
          generate_release_notes: false
```

**Complements**: `ci-cd-patterns` skill — this workflow follows the project's optional-secret pattern (no secrets required for public release notes) and path-filter conventions.

**Project Reference**: `.github/workflows/` — add `release.yml` alongside existing `ci.yml`, `security.yml`, and `agent-pr-checks.yml`.

---

## Pattern 5: Release Workflow

### Manual Release Process

```bash
# 1. Ensure main is clean and up to date
git checkout main && git pull

# 2. Dry run to preview changes
pnpm run release:dry-run

# 3. Execute release (updates CHANGELOG, bumps version, creates tag)
pnpm run release

# 4. Push commit and tag
git push --follow-tags origin main
```

### Automated Release Process

For fully automated releases, use the CI workflow above. When a tag is pushed:

1. CI generates release notes from CHANGELOG.md
2. GitHub Release is created automatically
3. No manual intervention required after `git push --follow-tags`

### Version Bump Decision Tree

```
Has BREAKING CHANGE? ──yes──► Major (X.0.0)
        │
       no
        │
Has feat commits? ──yes──► Minor (0.X.0)
        │
       no
        │
Has fix/perf commits? ──yes──► Patch (0.0.X)
        │
       no
        │
No version bump needed
```

---

## Pattern 6: Monorepo Considerations

### Unified Changelog (Recommended for This Project)

Since NodeJS-Starter-V1 is a monorepo (Turborepo), use a single root-level `CHANGELOG.md` with scope-based grouping:

```markdown
## [1.2.0] - 15/03/2026

### Features

- **web**: Add dark mode toggle ([abc1234])
- **backend**: Add rate limiting middleware ([def5678])
- **skills**: Generate retry-strategy skill ([356b5ce])

### Bug Fixes

- **backend**: Resolve agent timeout on large prompts ([ghi9012])
```

The `(scope)` from Conventional Commits naturally groups entries by package. No per-package changelogs needed unless packages are published independently to npm/PyPI.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| Manual changelog editing | Drift from git history, human error | Generate from commits automatically |
| No version tags | Cannot determine version boundaries | Tag every release: `v1.0.0`, `v1.1.0` |
| Including `chore`/`ci`/`test` | Noise for consumers; not user-facing | Hide non-user-facing types |
| US date format in changelog | Inconsistent with project locale | Use DD/MM/YYYY (en-AU) |
| Shallow clone in CI | Missing history breaks changelog generation | Use `fetch-depth: 0` |
| Changelog without diff links | No way to see full changes | Include `[Unreleased]` and version comparison URLs |

---

## Checklist

Before merging changelog changes:

- [ ] `standard-version` or `conventional-changelog` installed as devDependency
- [ ] `.versionrc.json` configured with correct commit type → section mapping
- [ ] `release` script added to root `package.json`
- [ ] CHANGELOG.md follows Keep a Changelog format
- [ ] Dates use DD/MM/YYYY (en-AU locale)
- [ ] Version comparison URLs point to correct GitHub repository
- [ ] CI workflow creates GitHub Release on tag push
- [ ] `fetch-depth: 0` used in checkout step for full git history
- [ ] Dry-run tested: `pnpm run release:dry-run`

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### Changelog Implementation

**Tool**: [standard-version / conventional-changelog / custom]
**Scope**: [unified / per-package]
**Included Types**: [feat, fix, perf]
**Hidden Types**: [docs, refactor, test, chore, ci]
**Date Format**: DD/MM/YYYY
**CI Integration**: [tag-triggered release.yml / manual]
**GitHub Release**: [enabled / disabled]
```
