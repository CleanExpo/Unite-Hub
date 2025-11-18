# Build Errors Analysis & Prevention Guide

**Generated**: 2025-01-18
**Purpose**: Document TypeScript errors and establish patterns to avoid them in future code

---

## Build Status

✅ **Production Build**: PASSING
⚠️ **TypeScript Strict Check**: 50+ errors (ignored via `next.config.mjs`)

### Why Build Still Passes

```javascript
// next.config.mjs (line 5)
typescript: {
  ignoreBuildErrors: true, // ← Allows build despite TypeScript errors
}
```

This setting was added to handle legacy Convex code. However, we should **fix TypeScript errors in active code** (`src/` directory) to prevent runtime issues.

---

## Error Categories

### 1. Legacy Code Errors (convex/ and convex.bak/)

**Location**: `convex/` and `convex.bak/` directories
**Status**: NOT USED (project uses Supabase, not Convex)
**Action**: Can be safely ignored or deleted

**Examples**:
- `convex.bak/agents/contactIntelligence.ts(132,42)` - Property 'score' errors
- `convex/assets.ts(123,58)` - Undefined type assignments
- `convex/campaigns.ts(122,58)` - Undefined in strict unions

**Recommendation**: Delete `convex/` and `convex.bak/` directories to clean up codebase.

---

### 2. Active Code Errors (src/ directory)

**Critical**: These errors affect the active codebase and should be fixed.

#### Category 2.1: Anthropic SDK Parameter Mismatches

**Pattern**: Passing extra parameters to Anthropic SDK functions

**Example**:
```typescript
// ❌ WRONG - 3 parameters, SDK expects 1-2
src/app/api/ai/auto-reply/route.ts(79,7): error TS2554: Expected 1-2 arguments, but got 3.
```

**Root Cause**: Old Anthropic SDK API vs. new API structure

**Fix Pattern**:
```typescript
// ❌ OLD (3 parameters)
await generateAutoReply(emailSubject, emailBody, context);

// ✅ NEW (single config object)
await generateAutoReply({
  emailSubject,
  emailBody,
  ...context
});
```

**Affected Files**:
- `src/app/api/ai/auto-reply/route.ts:79`
- `src/app/api/ai/campaign/route.ts:115`
- `src/app/api/ai/hooks/route.ts:76`
- `src/app/api/ai/mindmap/route.ts:86`
- `src/app/api/ai/persona/route.ts:112`
- `src/app/api/ai/strategy/route.ts:126`

---

#### Category 2.2: Unknown Properties in Type Literals

**Pattern**: Adding properties that don't exist in the type definition

**Example**:
```typescript
// ❌ WRONG - 'from' doesn't exist in type
src/app/api/ai/auto-reply/route.ts(65,7): error TS2353: Object literal may only specify known properties, and 'from' does not exist in type '{ emailSubject: string; emailBody: string; ... }'.
```

**Root Cause**: Type definitions don't match actual usage

**Fix Pattern**:
```typescript
// ❌ OLD
const context = {
  emailSubject: subject,
  emailBody: body,
  from: sender, // ← Not in type definition
};

// ✅ FIX 1: Update type definition
interface EmailContext {
  emailSubject: string;
  emailBody: string;
  from?: string; // ← Add to type
}

// ✅ FIX 2: Remove unknown property
const context = {
  emailSubject: subject,
  emailBody: body,
  // Remove 'from' if not needed
};
```

**Affected Files**:
- `src/app/api/ai/auto-reply/route.ts:65` - `from` property
- `src/app/api/ai/campaign/route.ts:104` - `strategy` property
- `src/app/api/ai/hooks/route.ts:66` - `persona` property
- `src/app/api/ai/mindmap/route.ts:78` - `emails` property
- `src/app/api/ai/persona/route.ts:102` - `emails` property
- `src/app/api/ai/strategy/route.ts:115` - `persona` property
- `src/app/api/calendar/generate/route.ts:132` - `businessContext` property

---

#### Category 2.3: Type Imports Used as Values

**Pattern**: Using a type in a runtime context (not just type annotations)

**Example**:
```typescript
// ❌ WRONG
src/app/api/ai/auto-reply/route.ts(72,25): error TS2693: 'ConversationContext' only refers to a type, but is being used as a value here.

// Code:
const context = ConversationContext({ ... }); // ← Trying to call a type
```

**Root Cause**: Type definitions imported with `type` keyword can't be used as constructors

**Fix Pattern**:
```typescript
// ❌ WRONG
import { type ConversationContext } from './types';
const context = ConversationContext({ ... });

// ✅ CORRECT
import { type ConversationContext } from './types';
const context: ConversationContext = { ... }; // ← Use as type annotation only
```

---

#### Category 2.4: Unsafe Property Access on Union Types

**Pattern**: Accessing properties that may not exist on all union type members

**Example**:
```typescript
// ❌ WRONG
src/app/api/integrations/gmail/list/route.ts(38,23): error TS2339: Property 'id' does not exist on type 'never'.
```

**Root Cause**: TypeScript can't guarantee property exists on narrowed type

**Fix Pattern**:
```typescript
// ❌ WRONG
const integrations = await query.select('*');
const id = integrations[0].id; // ← May not exist

// ✅ CORRECT (Option 1: Type assertion)
const integrations = await query.select('*') as Integration[];
const id = integrations[0]?.id;

// ✅ CORRECT (Option 2: Type guard)
if (integrations && 'id' in integrations[0]) {
  const id = integrations[0].id;
}
```

**Affected Files**:
- `src/app/api/integrations/gmail/list/route.ts:38-47` - Multiple property access errors
- `src/app/api/contacts/[contactId]/emails/route.ts:63` - `email` property
- `src/app/api/emails/send/route.ts:35-37` - Multiple properties

---

#### Category 2.5: Missing Required Properties

**Pattern**: Function expects a property that's missing in return type

**Example**:
```typescript
// ❌ WRONG
src/app/api/images/generate/route.ts(362,9): error TS2741: Property 'allowed' is missing in type 'NextResponse<{ error: string; }>' but required in type '{ allowed: boolean; reason?: string | undefined; }'.
```

**Root Cause**: Return type doesn't match expected interface

**Fix Pattern**:
```typescript
// ❌ WRONG
function checkPermission(): { allowed: boolean; reason?: string } {
  if (error) {
    return NextResponse.json({ error: 'Forbidden' }); // ← Missing 'allowed'
  }
}

// ✅ CORRECT
function checkPermission(): { allowed: boolean; reason?: string } {
  if (error) {
    return { allowed: false, reason: 'Forbidden' }; // ← Include required property
  }
  return { allowed: true };
}
```

---

#### Category 2.6: Undefined in Strict Type Unions

**Pattern**: Passing potentially undefined values where strict types expected

**Example**:
```typescript
// ❌ WRONG
const platform: 'facebook' | 'instagram' | undefined = data.platform;
someFunctionExpecting(platform); // ← Error: Type includes undefined
```

**Fix Pattern**:
```typescript
// ✅ FIX 1: Non-null assertion (if you're sure it exists)
someFunctionExpecting(platform!);

// ✅ FIX 2: Default value
someFunctionExpecting(platform ?? 'facebook');

// ✅ FIX 3: Guard clause
if (platform) {
  someFunctionExpecting(platform);
}
```

---

## Prevention Checklist

### For All Code Changes

- [ ] **Run TypeScript check** before committing: `npx tsc --noEmit | grep "src/"`
- [ ] **Fix errors in `src/` directory** (ignore `convex/` and `convex.bak/`)
- [ ] **Use proper type annotations** instead of type assertions when possible
- [ ] **Check SDK documentation** for correct function signatures
- [ ] **Add null checks** for potentially undefined values
- [ ] **Update type definitions** when adding new properties

### For API Routes

- [ ] **Verify Anthropic SDK calls** use correct parameter structure
- [ ] **Add proper error handling** with correct return types
- [ ] **Type database query results** explicitly
- [ ] **Handle undefined values** in request parameters

### For Database Operations

- [ ] **Use `maybeSingle()`** instead of `.single()` for safer queries
- [ ] **Type assertions** for Supabase query results: `as TableType[]`
- [ ] **Null checks** before accessing nested properties
- [ ] **Default values** for optional parameters

---

## Quick Fixes for Common Patterns

### Pattern 1: Anthropic SDK Calls

```typescript
// ❌ BEFORE
await generateContent(topic, audience, context);

// ✅ AFTER
await generateContent({
  topic,
  audience,
  ...context
});
```

### Pattern 2: Unknown Properties

```typescript
// ❌ BEFORE
const data = {
  knownProp: value,
  unknownProp: otherValue, // ← Type error
};

// ✅ AFTER (Option 1: Update type)
interface DataType {
  knownProp: string;
  unknownProp?: string; // ← Add to type definition
}

// ✅ AFTER (Option 2: Remove property)
const data = {
  knownProp: value,
  // Remove unknownProp
};
```

### Pattern 3: Type Imports

```typescript
// ❌ BEFORE
import { type MyType } from './types';
const instance = MyType({ ... }); // ← Error

// ✅ AFTER
import { type MyType } from './types';
const instance: MyType = { ... }; // ← Use as annotation
```

### Pattern 4: Union Type Access

```typescript
// ❌ BEFORE
const result = await query.select('*');
const value = result[0].property; // ← May not exist

// ✅ AFTER
const result = await query.select('*') as TableType[];
const value = result[0]?.property ?? defaultValue;
```

---

## Recommended Actions

### Immediate (P0)

1. ✅ **Authentication fixes applied** (completed above)
2. ⏳ **Document this analysis** (this file)
3. ⏳ **Commit changes to GitHub**

### Short-term (P1 - Next Week)

1. **Delete unused Convex code**:
   ```bash
   rm -rf convex/ convex.bak/
   ```

2. **Fix Anthropic SDK calls** in `/api/ai/` routes:
   - Update to single-parameter config object pattern
   - Verify with latest @anthropic-ai/sdk documentation

3. **Add proper type definitions** for API responses:
   - Create `src/types/api.ts` with shared types
   - Import and use throughout API routes

### Medium-term (P2 - Next Month)

1. **Enable strict TypeScript** in `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true
     }
   }
   ```

2. **Remove `ignoreBuildErrors`** from `next.config.mjs`:
   ```javascript
   typescript: {
     ignoreBuildErrors: false, // ← Enforce type safety
   }
   ```

3. **Set up pre-commit hooks** to block TypeScript errors:
   ```bash
   npm install --save-dev husky lint-staged
   npx husky init
   ```

---

## Summary

**Current State**:
- ✅ Build passing (errors ignored)
- ⚠️ 50+ TypeScript errors in codebase
- ✅ Authentication fixes applied and working

**Root Causes**:
1. Legacy Convex code not removed
2. Anthropic SDK API changes (old 3-param → new 1-param)
3. Type definitions not updated with new properties
4. Insufficient null checks on database queries
5. Type imports used as values

**Action Plan**:
1. ✅ Apply authentication fixes (DONE)
2. ✅ Document error patterns (THIS FILE)
3. ⏳ Commit to GitHub
4. 📅 Fix P1 errors next week
5. 📅 Enable strict mode next month

---

**Created by**: Claude Code Agent
**Last Updated**: 2025-01-18
**File Location**: `.claude/BUILD_ERRORS_ANALYSIS.md`
