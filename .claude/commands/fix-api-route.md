Fix the API route issue: $ARGUMENTS

Follow these steps:

1. Read the API route file specified
2. Check `src/app/api/CLAUDE.md` for patterns
3. Verify these requirements:
   - workspaceId validation (from searchParams)
   - `validateUserAndWorkspace()` call
   - `withErrorBoundary` wrapper
   - Proper error handling with typed errors
4. Fix any missing patterns
5. Run `npm run lint` and fix any errors
6. Run `npm run typecheck` to verify types
7. Create a commit with descriptive message

Reference exemplar: `src/app/api/contacts/route.ts`
