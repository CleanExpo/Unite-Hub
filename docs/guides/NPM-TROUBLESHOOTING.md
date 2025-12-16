# npm Dependency Troubleshooting Guide

## Quick Diagnosis

Run the health check to identify issues:
```bash
npm run health:npm
```

This validates:
- ✅ `package-lock.json` exists and is tracked in git
- ✅ No corrupted node_modules (`.DELETE` markers, invalid packages)
- ✅ Critical dependencies installed
- ✅ Node/npm version compatibility

---

## Problem: "npm install failing with ENOENT or ENOTEMPTY"

### Root Causes
1. **VS Code TypeScript language server** holding file locks
2. **Corrupted node_modules** from interrupted installation
3. **Missing package-lock.json** (non-deterministic builds)
4. **Parallel npm extraction** interrupted

### Solution (Complete Hard Reset)

```bash
# 1. Kill all blocking processes
taskkill /F /IM node.exe /T
taskkill /F /IM npm.exe /T
taskkill /F /IM code.exe /T

# 2. Remove corrupted node_modules
powershell -Command "Remove-Item -Path 'node_modules' -Recurse -Force"

# 3. Clear npm cache
npm cache clean --force

# 4. Regenerate lockfile (no installation)
npm install --package-lock-only --legacy-peer-deps

# 5. Fresh deterministic install using lockfile
npm ci --legacy-peer-deps
```

**Expected time**: 3-5 minutes

---

## Problem: "Windows-specific packages in lockfile cause Vercel Linux builds to fail"

### Root Cause
Native binaries like `lightningcss-win32-x64-msvc` are Windows-only and unavailable on Linux.

### Solution
Packages are already configured correctly in `optionalDependencies`:
```json
{
  "optionalDependencies": {
    "@rollup/rollup-win32-x64-msvc": "^4.53.3",
    "@tailwindcss/oxide-win32-x64-msvc": "^4.1.17",
    "lightningcss-win32-x64-msvc": "^1.30.2"
  }
}
```

**How it works**:
- Windows development: Uses Windows native binaries
- Vercel Linux deployment: npm skips missing Windows packages (they're optional)
- No workarounds needed

---

## Problem: "build or typecheck failing with 'Module not found'"

### Root Causes
1. Incomplete npm installation (missing dependencies)
2. Cache issues from previous failed builds
3. stale `tsconfig.json` paths

### Solution

```bash
# 1. Clean everything
npm cache clean --force
rm -rf node_modules
rm -rf .next
rm -rf .turbo

# 2. Reinstall from lock
npm ci --legacy-peer-deps

# 3. Rebuild
npm run build

# 4. Type check
npm run typecheck
```

---

## Problem: "43+ unmet dependencies reported"

### Root Cause
**Missing `package-lock.json`** — Each `npm install` resolves dependencies differently.

### Solution

```bash
# Check if lockfile exists
ls -la package-lock.json

# If missing, regenerate
npm install --package-lock-only --legacy-peer-deps

# Then install
npm ci
```

### Prevention
Git hook prevents accidental deletion (see `.husky/pre-commit`).

To manually verify lockfile is tracked:
```bash
git ls-files package-lock.json
# Should output: package-lock.json

# If not tracked, add it:
git add package-lock.json
git commit -m "Restore package-lock.json for deterministic builds"
```

---

## Problem: "sharp or other native modules post-install script failing"

### Root Cause
Native module compilation fails on Windows or during certain npm configurations.

### Solution

**For development** (Windows):
```bash
npm ci --legacy-peer-deps
```
Sharp will compile native binaries for Windows.

**For Vercel deployment** (Linux):
Use `vercel.json`:
```json
{
  "installCommand": "npm install --legacy-peer-deps --ignore-scripts"
}
```
Vercel Linux has prebuilt Linux binaries; skip post-install scripts.

---

## Problem: "Node version inconsistency across CI/CD"

### Root Cause
Different workflows specify different Node versions (18, 20, 22, etc.).

### Solution
All workflows now use **20.19.4** (locked in `.nvmrc`):
- `.nvmrc` — Local development
- `.github/workflows/*.yml` — CI/CD pipelines
- `package.json` engines — Project requirement

**Verify consistency**:
```bash
cat .nvmrc
grep -r "node-version" .github/workflows/
```

---

## Problem: "TypeScript build errors hidden by ignoreBuildErrors"

### Root Cause
4,324 TypeScript errors are bypassed with `ignoreBuildErrors: true` in `next.config.mjs`.

### Current Status
This is a **known workaround** — not ideal for long-term stability.

### Recommended Action
Phase 3 of permanent fix plan addresses this by:
1. Identifying all 4,324 errors
2. Categorizing by severity
3. Fixing critical type issues
4. Removing `ignoreBuildErrors` flag

---

## Prevention Measures

### 1. Pre-Commit Hooks (`.husky/pre-commit`)
Prevents accidental deletion of `package-lock.json`:
```bash
# Automatically runs on git commit
# Blocks commits that delete package-lock.json
```

### 2. npm Health Check (`npm run health:npm`)
Validates before every build:
```bash
npm run build
# Automatically runs: npm run health:npm
```

### 3. CI/CD Lockfile Integrity (GitHub Actions)
All workflows use `npm ci` (respects lockfile):
```yaml
- name: Install dependencies
  run: npm ci --legacy-peer-deps
```

---

## Permanent Fix - 3 Phases

### Phase 1: Immediate (Complete)
- ✅ Kill blocking processes
- ✅ Clean corrupted node_modules
- ✅ Regenerate `package-lock.json`
- ✅ Fresh install with `npm ci`

### Phase 2: Structural (Complete)
- ✅ Standardize Node version (20.19.4) across all workflows
- ✅ Verify `optionalDependencies` configured correctly
- ✅ Commit `package-lock.json` to git
- ✅ Add subpackage lockfiles to git tracking

### Phase 3: Prevention (Complete)
- ✅ Git hook prevents lockfile deletion
- ✅ npm health check validates before builds
- ✅ Documentation for troubleshooting
- ✅ CI/CD validates lockfile integrity

---

## Health Check Commands

```bash
# Full health check before build
npm run health:npm

# Quick npm list
npm list --depth=0

# Verify lockfile integrity
npm ls --package-lock-only

# Audit dependencies
npm audit --audit-level=high

# Check Node/npm versions
node --version
npm --version
```

---

## When to Rebuild Everything

Run the complete hard reset if:
- Multiple npm install failures
- Persistent "Module not found" errors
- `.DELETE` markers in node_modules
- Tests or build suddenly fail after no code changes

```bash
# Complete rebuild
npm run health:npm  # Check status first
npm ci               # Fresh install from lockfile
npm run build        # Rebuild
npm run test         # Verify
```

---

## Prevention Checklist

Before pushing to main:
- [ ] `npm run health:npm` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (235+ tests)
- [ ] `.git/pre-commit` hook prevents lockfile deletion
- [ ] `package-lock.json` is tracked in git

---

## Support

For issues not covered here:
1. Run `npm run health:npm` to diagnose
2. Check git status: `git status`
3. Review `.npmrc`, `.nvmrc`, `package.json` engines
4. Search this document for your symptom

Critical issues should reference:
- Node version: `node --version`
- npm version: `npm --version`
- Health check output: `npm run health:npm`
