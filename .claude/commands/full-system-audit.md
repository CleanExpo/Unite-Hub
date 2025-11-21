# Full System Audit Command

Execute a comprehensive audit of all Unite-Hub functionality to identify broken features, disabled code, and migration remnants.

## Audit Scope

### 1. Disabled Convex Functions
Search for all instances of disabled Convex code that needs Supabase replacement:
- `throw new Error(".*disabled.*")` patterns
- `// Temporarily disabled` comments
- Convex imports that are commented out
- Functions that just throw errors

### 2. API Route Authentication
Verify every API route has proper authentication:
- Check all routes in `src/app/api/` have `validateUserAuth` or `validateUserAndWorkspace`
- Check for routes missing Bearer token support
- Check for routes with TODO/FIXME comments about auth

### 3. Frontend Component Functionality
Test all interactive components:
- Modals that create/update/delete data
- Forms that submit to APIs
- Buttons with onClick handlers
- Components using disabled mutations

### 4. Database Operations
Verify all database operations work:
- Check for hardcoded workspace IDs
- Check for missing RLS policy support
- Check for Convex API calls that should be Supabase
- Check for direct Supabase calls that should use APIs

### 5. Navigation & Links
Verify all navigation works:
- Check sidebar links point to valid routes
- Check breadcrumbs reference existing pages
- Check all href attributes are valid
- Check for 404 links

### 6. Context & State Management
Verify all contexts work:
- Check AuthContext provides all needed values
- Check ClientContext functions work
- Check WorkspaceContext functions work
- Check for stale/unused context values

## Output Format

Generate a report with:
1. **Critical Issues** - Completely broken functionality
2. **High Priority** - Degraded functionality
3. **Medium Priority** - Missing features
4. **Low Priority** - Code cleanup needed

For each issue include:
- File path and line number
- Issue description
- Recommended fix
- Estimated effort (quick/medium/complex)

## Execution Steps

1. Run grep searches for disabled patterns
2. Audit all API routes for auth
3. Check all modal/form components
4. Verify database operation patterns
5. Test navigation links
6. Review context providers
7. Generate prioritized fix list
8. Execute fixes in priority order
9. Verify each fix with build test

## Success Criteria

- Zero disabled functions remaining
- All API routes authenticated
- All forms submit successfully
- All navigation works
- Build passes with no errors
- Console shows no errors on page load
