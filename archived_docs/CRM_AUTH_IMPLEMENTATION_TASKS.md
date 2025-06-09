# CRM Authentication Implementation Tasks

## Phase 1: Database Schema (Task 1)
- [ ] Create safe database migration script for user permissions
- [ ] Add role, created_by, is_active columns to users table
- [ ] Create user_permissions table
- [ ] Create permission_audit_log table

## Phase 2: Type Definitions (Task 2)
- [ ] Create src/lib/auth/types.ts with User and AuthResponse interfaces
- [ ] Define role types: 'Master' | 'Admin' | 'Manager' | 'User'

## Phase 3: Authentication Library (Task 3)
- [ ] Create src/lib/auth/auth.ts with authenticateUser function
- [ ] Create src/lib/auth/hooks.ts with useAuth hook
- [ ] Create src/lib/auth/session.ts with session management functions

## Phase 4: Login Component (Task 4)
- [ ] Create src/components/auth/LoginHandler.tsx
- [ ] Implement error handling and role-based navigation

## Phase 5: API Routes (Task 5)
- [ ] Create src/app/api/admin/users/route.ts
- [ ] Implement GET for fetching users
- [ ] Implement POST for creating users
- [ ] Add proper error handling and role validation

## Phase 6: Navigation Components (Task 6)
- [ ] Create src/components/navigation/AdminLink.tsx
- [ ] Show/hide based on user role

## Phase 7: Middleware Update (Task 7)
- [ ] Update middleware.ts for admin route protection
- [ ] Add error handling and role checking

## Phase 8: Role Component (Task 8)
- [ ] Create src/components/auth/RequireRole.tsx
- [ ] Implement role-based content rendering

## Phase 9: Error Handling (Task 9)
- [ ] Create src/app/dashboard/admin/error.tsx
- [ ] Add error boundary for admin pages

## Phase 10: Validation Scripts (Task 10)
- [ ] Add validation scripts to package.json
- [ ] Create setup script for directory structure
