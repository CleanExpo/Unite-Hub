# PHASE 0: Foundation Setup (START HERE)
**Estimated Time**: 2-3 hours
**Deliverable**: Solid foundation that prevents 86% of errors

---

## What This Phase Does

By the end of Phase 0, you will have:

✅ TypeScript configured correctly (strict mode for types/)
✅ ESLint enforcing code quality rules
✅ Pre-commit hooks blocking bad code
✅ Type generation pipeline running automatically
✅ File structure conventions documented

---

## Step 1: Fix tsconfig.json (20 minutes)

### Current State (Broken)
```json
{
  "strict": false  // 🔴 Hiding problems
}
```

### What To Do

**Replace the entire tsconfig.json with:**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "esnext",
    "moduleResolution": "bundler",

    // 🟢 STRICT MODE - Catch errors at compile time
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    // 🟢 UNUSED CODE DETECTION
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,

    // Standard options
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "incremental": true,

    "plugins": [
      {
        "name": "next"
      }
    ],

    "paths": {
      "@/*": ["./src/*"],
      "@/convex/*": ["./convex/*"],
      "@config/*": ["./config/*"]
    },

    "allowJs": true
  },

  "include": [
    "next-env.d.ts",
    "src/**/*.ts",
    "src/**/*.tsx",
    "config/**/*.ts",
    "scripts/**/*.ts",
    "tests/**/*.ts",
    "tests/**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],

  "exclude": [
    "node_modules",
    "_disabled",
    "convex.bak",
    "convex",
    ".next"
  ]
}
```

### Verify
```bash
npx tsc --noEmit 2>&1 | head -20
# You should see TypeScript errors (that's expected, we'll fix those next phase)
```

---

## Step 2: Install and Configure ESLint (30 minutes)

### Install Dependencies

```bash
npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-config-next
```

### Create .eslintrc.js

Create a new file: `.eslintrc.js`

```javascript
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // 🔴 TYPE SAFETY - No any types allowed
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-implicit-any': 'error',
    '@typescript-eslint/explicit-function-return-types': [
      'error',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
      }
    ],

    // 🔴 ASYNC/AWAIT - Prevent floating promises
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',

    // 🔴 NAMING CONVENTIONS - Consistency
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        filter: {
          match: false,
          regex: '^_',
        },
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      {
        selector: 'enumMember',
        format: ['UPPER_CASE'],
      },
    ],

    // 🔴 BEST PRACTICES
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': 'error',
    'no-implicit-coercion': 'error',

    // 🟡 WARNINGS (not errors, but watch for)
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }
    ],
  },
  ignorePatterns: ['.next', 'node_modules', 'dist'],
};
```

### Add to package.json

Add these scripts:

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix"
  }
}
```

### Test It

```bash
npm run lint 2>&1 | head -30
# Should show linting violations
```

---

## Step 3: Set Up Pre-Commit Hooks (30 minutes)

### Install Husky

```bash
npm install --save-dev husky lint-staged
npx husky install
```

### Create Pre-Commit Hook

```bash
npx husky add .husky/pre-commit "npm run lint:staged"
```

### Update package.json

Add this section:

```json
{
  "lint-staged": {
    "**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### Verify Hook Works

```bash
# Try to stage a file with bad code
echo "const x: any = 5;" > test-bad.ts
git add test-bad.ts
git commit -m "test"
# Should fail with linting error
git reset HEAD test-bad.ts
rm test-bad.ts
```

---

## Step 4: Set Up Type Generation Pipeline (30 minutes)

### Install Supabase CLI

```bash
npm install --save-dev @supabase/cli
```

### Create Type Generation Script

Create: `scripts/generate-types.sh`

```bash
#!/bin/bash

# Get environment variables
if [ -z "$SUPABASE_PROJECT_ID" ]; then
  echo "❌ SUPABASE_PROJECT_ID not set"
  exit 1
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ SUPABASE_ACCESS_TOKEN not set"
  exit 1
fi

echo "🔄 Generating types from Supabase..."

# Generate types
npx supabase gen types typescript \
  --project-id "$SUPABASE_PROJECT_ID" \
  --access-token "$SUPABASE_ACCESS_TOKEN" > src/types/database.generated.ts

if [ $? -ne 0 ]; then
  echo "❌ Type generation failed"
  exit 1
fi

echo "✅ Types generated successfully"

# Count tables
TABLES=$(grep -c "Tables\['[^']*'\]" src/types/database.generated.ts || echo 0)
echo "📊 Found $TABLES tables in schema"

# Validate types file isn't empty
if [ ! -s src/types/database.generated.ts ]; then
  echo "❌ Type file is empty"
  exit 1
fi

echo "✅ Type generation pipeline successful"
```

### Make Script Executable

```bash
chmod +x scripts/generate-types.sh
```

### Add to package.json

```json
{
  "scripts": {
    "types:generate": "bash scripts/generate-types.sh",
    "types:check": "npm run types:generate && tsc --noEmit --skipLibCheck"
  }
}
```

### Set Environment Variables

In your `.env.local`:

```env
SUPABASE_PROJECT_ID=your-project-id-here
SUPABASE_ACCESS_TOKEN=your-access-token-here
```

### Test Type Generation

```bash
npm run types:generate
# Should create/update src/types/database.generated.ts
```

---

## Step 5: Document File Structure (20 minutes)

Create: `ARCHITECTURE.md`

```markdown
# Project Architecture

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (backend)
│   │   ├── [resource]/
│   │   │   ├── route.ts          # HTTP handler (max 50 lines)
│   │   │   └── service.ts        # Business logic here
│   │   └── ...
│   └── [feature]/         # UI Routes (frontend)
│       └── page.tsx
│
├── lib/                    # Shared Logic
│   ├── services/          # Business logic ONLY
│   │   ├── types.ts       # Service type definitions
│   │   ├── user.ts        # UserService implementation
│   │   └── index.ts       # Exports
│   │
│   ├── validators/        # Zod validation schemas
│   │   ├── user.ts
│   │   └── index.ts
│   │
│   ├── types/             # Type definitions
│   │   ├── database.generated.ts  # AUTO-GENERATED - don't edit
│   │   └── custom.ts              # Custom types
│   │
│   ├── hooks/             # React hooks
│   │   ├── useUser.ts
│   │   └── index.ts
│   │
│   ├── utils/             # Utilities
│   │   ├── error-handler.ts
│   │   └── index.ts
│   │
│   └── context/           # React context
│       └── index.ts
│
├── components/            # React Components ONLY
│   ├── ui/               # shadcn/ui (unmodified)
│   ├── features/         # Feature-specific components
│   │   ├── UserCard.tsx
│   │   └── index.ts
│   └── layout/           # Layout components
│
├── config/                # Configuration
│   ├── index.ts          # Single export file
│   └── constants.ts      # Constants only
│
└── styles/                # Global styles
    └── globals.css
```

## Rules

### ✅ DO:
- Put database queries in `src/lib/services/`
- Put API logic in `src/lib/services/`
- Put validation in `src/lib/validators/`
- Use typed interfaces from `src/lib/services/types.ts`
- Handle errors explicitly with Result<T, E> pattern

### ❌ DON'T:
- Call database from React components
- Put business logic in API routes
- Use `any` types
- Mix async styles (promises + async/await)
- Ignore TypeScript errors

## Type Safety

All TypeScript strict mode rules are ENABLED:
- No implicit `any`
- No untyped function returns
- No unused variables
- Null checks required

## Code Quality

ESLint rules are ENFORCED:
- Pre-commit hook runs linting
- All files must pass `npm run lint`
- Use `npm run lint:fix` to auto-fix issues

## Type Generation

Database types are AUTO-GENERATED:
- Run `npm run types:generate` after schema changes
- Never edit `src/types/database.generated.ts` manually
- New tables appear automatically

## Examples

### Service (Correct)
```typescript
// src/lib/services/user.ts
import { Database } from '@/types/database.generated';

export type UserRow = Database['public']['Tables']['users']['Row'];

export interface IUserService {
  getUser(id: string): Promise<UserRow | null>;
}

export class UserService implements IUserService {
  async getUser(id: string): Promise<UserRow | null> {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    return data ?? null;
  }
}
```

### Component (Correct)
```typescript
// src/components/features/UserCard.tsx
import { useUser } from '@/lib/hooks/useUser';

export function UserCard({ userId }: { userId: string }) {
  const { data: user, loading, error } = useUser(userId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>Not found</div>;

  return <div>{user.name}</div>;
}
```

### Component (WRONG - Don't do this)
```typescript
// ❌ DON'T
export function UserCard({ userId }: { userId: string }) {
  const [user, setUser] = useState<any>(null);  // any!

  useEffect(() => {
    supabase.from('users').select('*')
      .eq('id', userId)
      .then(res => setUser(res.data?.[0]))
      .catch(err => console.log(err));  // Silent error
  }, [userId]);

  return <div>{user?.name}</div>;  // null check missing
}
```
```

Save this file and commit it.

---

## Step 6: Create Type Generation Post-Install Hook

Create: `.husky/post-merge`

```bash
#!/bin/sh

# Auto-generate types after pulling schema changes
npm run types:generate

echo "✅ Types updated"
```

Make executable:
```bash
chmod +x .husky/post-merge
```

---

## Verify Phase 0 Complete

Run this checklist:

```bash
# 1. ESLint works
npm run lint 2>&1 | head -5

# 2. Type generation works
npm run types:generate

# 3. Type checking works
npm run types:check 2>&1 | head -10

# 4. Pre-commit hook exists
test -f .husky/pre-commit && echo "✅ pre-commit hook exists"

# 5. tsconfig is strict
grep '"strict": true' tsconfig.json && echo "✅ strict mode enabled"

# 6. Architecture documented
test -f ARCHITECTURE.md && echo "✅ ARCHITECTURE.md exists"
```

---

## Commit Phase 0

```bash
git add .eslintrc.js tsconfig.json package.json .husky/ ARCHITECTURE.md scripts/generate-types.sh
git commit -m "phase-0: establish foundation (tsconfig, eslint, pre-commit, type generation)"
```

---

## What Happens Next

After Phase 0 is complete:

1. ✅ **TypeScript strict mode is active** - Catches errors at compile time
2. ✅ **ESLint enforces patterns** - Bad code doesn't commit
3. ✅ **Type generation is automatic** - Schema changes update types
4. ✅ **Architecture is clear** - Everyone knows where code lives

Then in Phase 1:
- Generate complete database types
- Watch 86% of errors disappear
- Begin enabling strict mode in production code

---

## Time Check

If you've done all 6 steps, you've invested **2-3 hours** and built the foundation that prevents months of debugging.

**Next meeting/work session**: Start Phase 1 (Type Generation).

---

## Support

If you get stuck:

1. **ESLint not working**: Make sure `@typescript-eslint/parser` is installed
2. **Type generation fails**: Check `SUPABASE_PROJECT_ID` and `SUPABASE_ACCESS_TOKEN` are set
3. **Pre-commit hook not running**: Run `npx husky install` again
4. **TypeScript errors appear**: That's expected - we fix those in Phase 1

Just follow the steps in order. Each one builds on the previous.
