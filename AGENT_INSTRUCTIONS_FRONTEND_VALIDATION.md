# Frontend Validation Agent Instructions
**Agent Type**: Frontend Validation Specialist
**Task**: Validate React components, TypeScript compilation, and UI rendering
**Priority**: HIGH
**Execution Time**: 15-20 minutes

---

## Mission

Ensure all React components compile correctly, TypeScript has no blocking errors, Tailwind classes are valid, and the UI renders without errors after the design system merge.

---

## Pre-Execution Checklist

- [ ] Designer branch is merged into main
- [ ] Working directory is clean (`git status`)
- [ ] On main branch (`git branch --show-current`)
- [ ] Node modules installed (`npm install`)

---

## Validation Steps

### Step 1: TypeScript Compilation Check

**Command**:
```bash
npx tsc --noEmit 2>&1 | tee typescript-check.log
```

**What to Look For**:
- ✅ **IGNORE**: `error TS2688: Cannot find type definition file for 'babel__*'`
- ✅ **IGNORE**: `error TS2688: Cannot find type definition file for 'd3-*'`
- ❌ **BLOCK**: Any errors in `src/app/` or `src/components/`
- ❌ **BLOCK**: Type errors like `Property 'X' does not exist on type 'Y'`
- ❌ **BLOCK**: Import resolution failures

**Expected Output**: Babel/D3 warnings only (these are informational)

**Action If Failed**:
- Review errors in affected files
- Check for typos in imports
- Verify all components use correct prop types
- Report blocking errors

---

### Step 2: ESLint Validation

**Command**:
```bash
npm run lint 2>&1 | tee eslint-check.log
```

**What to Look For**:
- ✅ **ALLOW**: Warnings about unused variables (common in new code)
- ✅ **ALLOW**: Warnings about console.log statements
- ❌ **BLOCK**: Errors that prevent code execution
- ❌ **BLOCK**: Missing dependency errors
- ❌ **BLOCK**: React Hook dependency warnings (could cause bugs)

**Expected Output**: Warnings OK, zero errors

**Action If Failed**:
- Review critical errors only
- Document warnings for follow-up PR
- Fix blocking errors immediately

---

### Step 3: Production Build Test

**Command**:
```bash
npm run build 2>&1 | tee build-check.log
```

**What to Look For**:
- ✅ **SUCCESS**: Build completes with "Compiled successfully"
- ✅ **SUCCESS**: All routes compile without errors
- ❌ **FAIL**: Module not found errors
- ❌ **FAIL**: Syntax errors in components
- ❌ **FAIL**: Build process crashes

**Expected Output**:
```
   ▲ Next.js 16.0.1
   - Environments: .env.local

   Creating an optimized production build ...
✓ Compiled successfully
   Collecting page data ...
✓ Collecting page data
   Finalizing page optimization ...

Route (app)                              Size     First Load JS
┌ ○ /                                    123 kB        456 kB
├ ○ /(auth)/login                        89 kB         412 kB
├ ○ /(auth)/register                     91 kB         414 kB
...
```

**Action If Failed**:
- Check build log for error details
- Verify all imports are correct
- Ensure all environment variables are set
- **CRITICAL**: If build fails, merge must be rolled back

---

### Step 4: Development Server Start

**Command**:
```bash
npm run dev &
sleep 10
curl http://localhost:3008 -I
```

**What to Look For**:
- ✅ **SUCCESS**: Server starts on port 3008
- ✅ **SUCCESS**: HTTP 200 response from curl
- ❌ **FAIL**: Port already in use
- ❌ **FAIL**: Server crashes on startup
- ❌ **FAIL**: HTTP 500 errors

**Expected Output**:
```
  ▲ Next.js 16.0.1
  - Local:        http://localhost:3008
  - Environments: .env.local

✓ Ready in 2.5s
```

**Action If Failed**:
- Kill any process using port 3008
- Check for environment variable issues
- Review server logs for errors

---

### Step 5: Browser Rendering Tests

**Automated Check** (if Playwright available):
```bash
npm run test:e2e -- tests/e2e/dashboard.spec.ts
```

**Manual Check** (required):

**A. Landing Page** (`http://localhost:3008`)
- [ ] Page loads without errors
- [ ] Hero section displays with gradients
- [ ] Features section visible
- [ ] Navigation menu renders
- [ ] Mobile menu button visible (resize window)
- [ ] "Get Started" button links to `/login`
- [ ] Footer displays
- [ ] No console errors in browser DevTools

**B. Login Page** (`http://localhost:3008/login`)
- [ ] Split-screen layout displays
- [ ] Left panel shows brand messaging
- [ ] Right panel shows login form
- [ ] Google OAuth button styled with gradient
- [ ] "Don't have an account?" link works
- [ ] Responsive on mobile (left panel hidden)
- [ ] No console errors

**C. Register Page** (`http://localhost:3008/register`)
- [ ] Split-screen layout displays
- [ ] Terms checkbox present
- [ ] Trust indicators visible
- [ ] Form fields render correctly
- [ ] Submit button styled properly
- [ ] No console errors

**D. Dashboard Overview** (`http://localhost:3008/dashboard/overview`)
**Note**: Requires authentication
- [ ] Redirects to login if not authenticated
- [ ] After login, dashboard displays
- [ ] Gradient stat cards render
- [ ] Glass-morphism effects visible
- [ ] Icons display correctly
- [ ] HotLeadsPanel renders (or empty state)
- [ ] Breadcrumbs display
- [ ] No console errors

**E. Campaigns Page** (`http://localhost:3008/dashboard/campaigns`)
- [ ] Page loads with modern design
- [ ] Campaign cards styled with gradients
- [ ] Create button visible
- [ ] Empty state displays if no campaigns
- [ ] No console errors

**F. Contacts Page** (`http://localhost:3008/dashboard/contacts`)
- [ ] Table renders with modern styling
- [ ] Search bar visible
- [ ] Filter dropdowns styled correctly
- [ ] AI score badges colored properly
- [ ] Empty state displays if no contacts
- [ ] No console errors

---

### Step 6: Responsive Design Check

**Test Viewports**:
- Desktop: 1920x1080
- Tablet: 768x1024
- Mobile: 375x667

**For Each Viewport**:
- [ ] Landing page layout adapts
- [ ] Login page split-screen collapses on mobile
- [ ] Dashboard cards stack vertically on mobile
- [ ] Tables scroll horizontally or adapt
- [ ] Navigation menu becomes hamburger menu
- [ ] Touch targets are appropriately sized (min 44x44px)

**Tools**:
- Browser DevTools (F12 → Device Toolbar)
- Chrome Lighthouse (Performance & Accessibility)

---

### Step 7: Dark Theme Validation

**All Pages Must**:
- [ ] Use dark background (`bg-slate-950` or gradient)
- [ ] Have sufficient text contrast (WCAG AA minimum)
- [ ] Display gradients clearly
- [ ] Show cards with glass-morphism effect
- [ ] Render forms with visible borders
- [ ] Display all icons in light colors

**Contrast Checker**:
- Use browser DevTools → Accessibility tab
- Or online tool: https://webaim.org/resources/contrastchecker/

---

### Step 8: Console Error Check

**Open Browser DevTools** (F12 → Console)

**Check for**:
- ❌ **BLOCK**: Uncaught ReferenceError (undefined variable)
- ❌ **BLOCK**: TypeError (invalid operation)
- ❌ **BLOCK**: Failed to fetch (API errors)
- ✅ **ALLOW**: Warnings about missing environment variables (in dev)
- ✅ **ALLOW**: React DevTools messages

**Common Issues**:
- Undefined variables in components
- Missing imports
- Invalid prop types
- API endpoint failures

---

## Success Criteria

### Must Pass (Blocking)
- ✅ Production build succeeds
- ✅ Dev server starts without crashes
- ✅ Landing page loads without errors
- ✅ Login page loads without errors
- ✅ Dashboard loads after authentication
- ✅ No critical console errors (ReferenceError, TypeError)

### Should Pass (Non-Blocking)
- ✅ ESLint has zero errors (warnings OK)
- ✅ All pages responsive
- ✅ Dark theme contrast sufficient
- ✅ Automated tests pass

### Nice to Have
- TypeScript zero warnings (babel warnings excluded)
- Lighthouse score > 90
- No console warnings

---

## Report Template

**Copy and fill out**:

```markdown
# Frontend Validation Report
**Date**: [YYYY-MM-DD HH:MM]
**Agent**: Frontend Validation Specialist
**Status**: ✅ PASS / ❌ FAIL / ⚠️ PASS WITH WARNINGS

---

## 1. TypeScript Compilation
**Command**: `npx tsc --noEmit`
- **Status**: [PASS/FAIL]
- **Total Errors**: [count]
- **Blocking Errors**: [count]
- **Babel/D3 Warnings**: [count] (ignored)
- **Details**:
  ```
  [Paste any blocking errors here]
  ```

---

## 2. ESLint Validation
**Command**: `npm run lint`
- **Status**: [PASS/FAIL]
- **Total Errors**: [count]
- **Total Warnings**: [count]
- **Details**:
  ```
  [Paste any errors here]
  ```

---

## 3. Production Build
**Command**: `npm run build`
- **Status**: [PASS/FAIL]
- **Duration**: [seconds]
- **Bundle Size**: [MB]
- **Routes Compiled**: [count]
- **Details**:
  ```
  [Paste build output or errors]
  ```

---

## 4. Dev Server
**Command**: `npm run dev`
- **Status**: [RUNNING/FAILED]
- **Port**: 3008
- **Startup Time**: [seconds]
- **Details**:
  ```
  [Any startup errors]
  ```

---

## 5. Browser Rendering Tests

### Landing Page (/)
- Loads: [YES/NO]
- Hero Section: [YES/NO]
- Features Section: [YES/NO]
- Navigation: [YES/NO]
- Mobile Menu: [YES/NO]
- Console Errors: [count]

### Login Page (/login)
- Loads: [YES/NO]
- Split-Screen: [YES/NO]
- OAuth Button: [YES/NO]
- Form Fields: [YES/NO]
- Console Errors: [count]

### Register Page (/register)
- Loads: [YES/NO]
- Split-Screen: [YES/NO]
- Terms Checkbox: [YES/NO]
- Console Errors: [count]

### Dashboard Overview (/dashboard/overview)
- Loads: [YES/NO]
- Gradient Cards: [YES/NO]
- HotLeadsPanel: [YES/NO]
- Stats Display: [YES/NO]
- Console Errors: [count]

### Campaigns (/dashboard/campaigns)
- Loads: [YES/NO]
- Campaign Cards: [YES/NO]
- Create Button: [YES/NO]
- Console Errors: [count]

### Contacts (/dashboard/contacts)
- Loads: [YES/NO]
- Table Renders: [YES/NO]
- Search/Filter: [YES/NO]
- Console Errors: [count]

---

## 6. Responsive Design
- Desktop (1920x1080): [PASS/FAIL]
- Tablet (768x1024): [PASS/FAIL]
- Mobile (375x667): [PASS/FAIL]
- Details: [Any layout issues]

---

## 7. Dark Theme
- Background Dark: [YES/NO]
- Text Contrast: [SUFFICIENT/INSUFFICIENT]
- Gradients Visible: [YES/NO]
- Forms Usable: [YES/NO]

---

## 8. Console Errors
**Total Console Errors**: [count]

**Critical Errors** (blocking):
- [List any ReferenceError, TypeError, etc.]

**Warnings** (non-blocking):
- [List any warnings]

---

## Issues Found

### Critical (Must Fix Before Merge)
1. [Issue description]
   - **Location**: [file:line]
   - **Error**: [error message]
   - **Impact**: [blocks functionality]
   - **Recommended Fix**: [solution]

### Non-Critical (Can Fix Post-Merge)
1. [Issue description]
   - **Location**: [file:line]
   - **Impact**: [cosmetic or minor]
   - **Recommended Fix**: [solution]

---

## Final Recommendation

**APPROVE MERGE**: [YES/NO]

**Reasoning**:
[Explain decision based on test results]

**Conditions** (if any):
- [List any conditions for approval]

**Next Steps**:
- [What should happen next]

---

**Validated By**: Frontend Validation Agent
**Timestamp**: [YYYY-MM-DD HH:MM:SS]
```

---

## Troubleshooting Guide

### Build Fails with "Module not found"
**Cause**: Missing import or incorrect path
**Fix**:
```bash
# Check import statement
# Verify file exists at import path
# Ensure correct casing (case-sensitive on Linux)
```

### TypeScript Errors in Components
**Cause**: Invalid prop types or missing types
**Fix**:
```typescript
// Add proper type annotations
interface Props {
  title: string;
  count: number;
}

export default function Component({ title, count }: Props) {
  // ...
}
```

### Console ReferenceError
**Cause**: Undefined variable used in component
**Fix**:
```typescript
// Bad
console.log(someUndefinedVar);

// Good
console.log(someVar ?? 'default');
```

### Gradient Not Visible
**Cause**: Missing Tailwind class or CSS conflict
**Fix**:
```tsx
// Ensure gradient classes are correct
className="bg-gradient-to-r from-blue-600 to-purple-600"
```

### Dev Server Won't Start
**Cause**: Port 3008 already in use
**Fix**:
```bash
# Windows
netstat -ano | findstr :3008
taskkill /PID [PID] /F

# Linux/Mac
lsof -ti:3008 | xargs kill -9
```

---

## Rollback Trigger Conditions

**MUST ROLLBACK IF**:
1. Production build fails
2. Dev server crashes on startup
3. Landing page returns 500 error
4. Dashboard completely broken
5. Authentication flow broken
6. Critical TypeScript errors in business logic

**CAN PROCEED WITH WARNINGS IF**:
1. ESLint warnings only (no errors)
2. Minor UI alignment issues
3. Non-critical console warnings
4. Babel/D3 type definition warnings

---

## Execution Checklist

- [ ] Clone repository or pull latest main
- [ ] Run `npm install`
- [ ] Execute Step 1: TypeScript Check
- [ ] Execute Step 2: ESLint Check
- [ ] Execute Step 3: Build Test
- [ ] Execute Step 4: Dev Server Start
- [ ] Execute Step 5: Browser Tests (all 6 pages)
- [ ] Execute Step 6: Responsive Check
- [ ] Execute Step 7: Dark Theme Check
- [ ] Execute Step 8: Console Error Check
- [ ] Fill out Report Template
- [ ] Make final recommendation
- [ ] Submit report

---

**Time Estimate**: 15-20 minutes
**Difficulty**: Medium
**Automation Level**: 50% (half automated, half manual)

---

**End of Frontend Validation Instructions**
