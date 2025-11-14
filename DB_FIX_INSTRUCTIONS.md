# db.ts Fix Instructions

## Issue
The `db.ts` file has 42 functions that use `supabaseServer` directly, but it should use `getSupabaseServer()` instead.

## Quick Fix

Replace all functions that use `await supabaseServer` with a call to `getSupabaseServer()` at the start of the function.

### Example

**Before:**
```typescript
create: async (data: any) => {
  const { data: org, error } = await supabaseServer
    .from("organizations")
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return org;
},
```

**After:**
```typescript
create: async (data: any) => {
  const supabaseServer = getSupabaseServer();
  const { data: org, error } = await supabaseServer
    .from("organizations")
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return org;
},
```

## Automated Fix (Recommended)

Use find and replace in your code editor:

1. **Find (Regex):**
   ```
   (async \([^)]*\) => \{)\n(\s+)(const \{ data|const \{ error)
   ```

2. **Replace:**
   ```
   $1\n$2const supabaseServer = getSupabaseServer();\n$2$3
   ```

OR manually add `const supabaseServer = getSupabaseServer();` as the first line in each function that uses `supabaseServer`.

## Alternative: Use Client-Side Supabase

If the db.ts functions are only used client-side, you can continue using the `supabase` (browser client) instead of `supabaseServer`.

The current import already has both:
```typescript
import { supabase, getSupabaseServer } from "./supabase";
```

## Testing After Fix

After applying the fix, test with:
```bash
npm run dev
node test-api-flows.mjs
```

## Note

The API routes in `/api/*` have already been fixed to use `getSupabaseServer()` correctly. Only `db.ts` needs this update if it's used in server-side contexts.
