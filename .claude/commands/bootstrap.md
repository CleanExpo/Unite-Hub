# Bootstrap Command

Full foundation setup - run ONCE on new project.

Execute the following steps in order:

## 1. Create Directory Structure

```bash
mkdir -p src/app/api src/components/ui src/components/layout src/components/features src/server/services src/server/repositories src/server/validators src/server/errors src/lib/supabase src/lib/utils src/types/api src/hooks src/config supabase/migrations supabase/seeds .github/workflows
```

## 2. Create Strict tsconfig.json

Create `tsconfig.json` with these strict options:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "moduleResolution": "bundler",
    "module": "esnext",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/server/*": ["./src/server/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"],
      "@/hooks/*": ["./src/hooks/*"]
    },
    "skipLibCheck": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", ".next", "out", "dist"]
}
```

## 3. Create .prettierrc

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

## 4. Install Dependencies

```bash
pnpm add -D typescript @types/node @types/react @types/react-dom eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-import prettier husky lint-staged madge
pnpm add zod
```

## 5. Setup Husky Pre-commit Hook

```bash
pnpm exec husky init
```

Create `.husky/pre-commit`:
```bash
#!/bin/sh
pnpm run type-check || exit 1
pnpm exec lint-staged || exit 1
```

## 6. Create Error Handling Module

Create `src/server/errors/index.ts`:

```typescript
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404, { resource, id });
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Permission denied') {
    super(message, 'FORBIDDEN', 403);
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error('[API Error]', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { message: error.message, code: error.code, details: error.details } },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { message: 'Validation failed', code: 'VALIDATION_ERROR', details: error.errors } },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
    { status: 500 }
  );
}
```

## 7. Create Barrel Files

Create index.ts files with export comments in:
- `src/server/services/index.ts`
- `src/server/repositories/index.ts`
- `src/server/validators/index.ts`
- `src/components/ui/index.ts`
- `src/components/features/index.ts`
- `src/hooks/index.ts`
- `src/types/index.ts`

## 8. Initialise Supabase

```bash
supabase init                          # creates supabase/ directory
supabase start                         # start local Supabase stack

# Create first migration
supabase migration new nexus_baseline

# After writing migration SQL:
supabase db push                       # apply to local
supabase gen types typescript --local > src/types/database.ts
```

## 9. Create CI Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm run type-check
      - run: pnpm run lint
      - run: pnpm vitest run
      - run: pnpm build
```

## 10. Update package.json Scripts

Add these scripts:
- `type-check`: `tsc --noEmit`
- `lint`: `eslint . --ext .ts,.tsx`
- `lint:fix`: `eslint . --ext .ts,.tsx --fix`
- `validate`: `pnpm run type-check && pnpm run lint`
- `check:circular`: `madge --circular --extensions ts,tsx src/`
- `db:types`: `supabase gen types typescript --local > src/types/database.ts`
- `prepare`: `husky`

Add lint-staged config:
```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

## 11. Verify Setup

```bash
pnpm run type-check
```

Then run `/verify` to confirm the full foundation is intact. Report success or any issues found.
