# 🚀 Phase 5: Authentication & User Management

**Date Created:** 2025-11-14
**Status:** 📋 PLANNING
**Estimated Time:** 3-4 hours
**Priority:** HIGH (Required for production)

---

## 🎯 Phase 5 Goals

1. **Implement proper authentication** - Replace demo mode with real auth
2. **Add user management** - Profile pages, settings, role management
3. **Integrate organization context** - Multi-tenant support
4. **Secure all dashboard pages** - Protected routes with middleware
5. **Add user registration/login** - Complete auth flow

---

## 📋 Current State Analysis

### ✅ What We Have
- **Supabase configured** - Database ready with organizations table
- **Demo organization ID** - Hardcoded in Team, Projects, Approvals pages
- **ModernSidebar** - Shows user role ("owner") but no real user data
- **Protected layout** - Dashboard already has layout structure

### ❌ What's Missing
- No authentication system implemented
- No user registration/login pages
- No session management
- No user profile functionality
- No organization selection for multi-tenant users
- Pages use hardcoded demo organization ID

---

## 🏗️ Phase 5 Architecture

```
Authentication Flow:
┌─────────────────┐
│  Landing Page   │
│  /              │
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
┌───▼────┐ ┌──▼────────┐
│ Login  │ │  Sign Up  │
│ /login │ │ /register │
└───┬────┘ └──┬────────┘
    │         │
    └────┬────┘
         │
    ┌────▼────────────────┐
    │  Supabase Auth      │
    │  Email + Password   │
    └────┬────────────────┘
         │
    ┌────▼────────────────┐
    │  Organization       │
    │  Assignment         │
    └────┬────────────────┘
         │
    ┌────▼────────────────┐
    │  Dashboard Access   │
    │  /dashboard         │
    └─────────────────────┘
```

---

## 📝 Tasks Breakdown

### **1. Authentication Setup** (Estimated: 1 hour)

#### 1.1 Configure Supabase Auth
- ✅ Supabase project already created
- ⏳ Enable email/password authentication in Supabase dashboard
- ⏳ Configure redirect URLs
- ⏳ Set up email templates (optional)

#### 1.2 Create Auth Context
**File:** `src/contexts/AuthContext.tsx`
- User state management
- Login/logout functions
- Session persistence
- Organization context

#### 1.3 Create Auth Hook
**File:** `src/hooks/useAuth.ts`
- `useAuth()` hook for accessing current user
- `useRequireAuth()` for protected pages
- `useOrganization()` for current org context

---

### **2. Authentication Pages** (Estimated: 45 min)

#### 2.1 Login Page
**File:** `src/app/(auth)/login/page.tsx`
- Email/password form
- "Forgot password" link
- "Sign up" link
- Error handling
- Loading states
- Redirect after login

#### 2.2 Sign Up Page
**File:** `src/app/(auth)/register/page.tsx`
- Registration form (name, email, password, confirm password)
- Company name (creates organization)
- Terms acceptance
- Email verification flow
- Auto-login after registration

#### 2.3 Forgot Password Page
**File:** `src/app/(auth)/forgot-password/page.tsx`
- Email input
- Send reset link
- Confirmation message

#### 2.4 Auth Layout
**File:** `src/app/(auth)/layout.tsx`
- Centered card layout
- Unite-Hub branding
- Background gradient
- Consistent styling

---

### **3. Protected Routes Middleware** (Estimated: 30 min)

#### 3.1 Create Middleware
**File:** `src/middleware.ts`
- Check for valid session
- Redirect to /login if unauthenticated
- Protect /dashboard/* routes
- Allow public routes (/, /login, /register)

#### 3.2 Update Dashboard Layout
**File:** `src/app/dashboard/layout.tsx`
- Fetch current user
- Fetch user's organization(s)
- Pass to children via context
- Show loading state while checking auth

---

### **4. User Profile & Settings** (Estimated: 1 hour)

#### 4.1 Profile Page
**File:** `src/app/dashboard/profile/page.tsx`
- Display user information
- Avatar upload (using Supabase Storage)
- Update name, email
- Change password
- Delete account option

#### 4.2 Settings Page
**File:** `src/app/dashboard/settings/page.tsx`
- Organization settings (for owners)
- Team member management
- Notification preferences
- Billing (placeholder for Stripe integration)
- API keys

#### 4.3 Update ModernSidebar
**File:** `src/components/layout/ModernSidebar.tsx`
- Show real user name and avatar
- Show real user role from database
- Add "Profile" and "Settings" links
- Add "Logout" button

---

### **5. Organization Management** (Estimated: 45 min)

#### 5.1 Update Database Schema
**Migration:** `supabase/migrations/003_user_organizations.sql`
- `user_organizations` table (many-to-many)
- User roles per organization (owner, admin, member, viewer)
- Invite system tables

#### 5.2 Organization Context
**File:** `src/contexts/OrganizationContext.tsx`
- Current organization state
- Switch organization function
- Organization list

#### 5.3 Organization Switcher Component
**File:** `src/components/layout/OrganizationSwitcher.tsx`
- Dropdown in sidebar
- List user's organizations
- Switch between orgs
- "Create new organization" option

---

### **6. Update Existing Pages** (Estimated: 30 min)

#### 6.1 Remove Hardcoded Org IDs
- ✅ Team page: Replace `DEMO_ORG_ID` with `useOrganization()`
- ✅ Projects page: Replace `DEMO_ORG_ID` with `useOrganization()`
- ✅ Approvals page: Replace `DEMO_ORG_ID` with `useOrganization()`

#### 6.2 Add User Context to Actions
- "Add Team Member" → Pre-fill with current org
- "Create Project" → Auto-assign to current org
- "Create Approval" → Link to current user

---

## 📊 Files to Create/Modify

### **New Files** (11 files)
```
src/
├── contexts/
│   ├── AuthContext.tsx                  ✅ NEW
│   └── OrganizationContext.tsx          ✅ NEW
│
├── hooks/
│   └── useAuth.ts                       ✅ NEW
│
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx                   ✅ NEW
│   │   ├── login/
│   │   │   └── page.tsx                 ✅ NEW
│   │   ├── register/
│   │   │   └── page.tsx                 ✅ NEW
│   │   └── forgot-password/
│   │       └── page.tsx                 ✅ NEW
│   │
│   └── dashboard/
│       ├── profile/
│       │   └── page.tsx                 ✅ NEW
│       └── settings/
│           └── page.tsx                 ✅ NEW
│
├── components/
│   └── layout/
│       └── OrganizationSwitcher.tsx     ✅ NEW
│
├── middleware.ts                        ✅ NEW
│
└── supabase/
    └── migrations/
        └── 003_user_organizations.sql   ✅ NEW
```

### **Files to Modify** (4 files)
```
src/
├── components/layout/ModernSidebar.tsx  🔧 UPDATE (add auth)
├── app/dashboard/layout.tsx             🔧 UPDATE (add auth provider)
├── app/dashboard/team/page.tsx          🔧 UPDATE (use org context)
├── app/dashboard/projects/page.tsx      🔧 UPDATE (use org context)
└── app/dashboard/approvals/page.tsx     🔧 UPDATE (use org context)
```

**Total:** 11 new files + 5 modified files

---

## 🔐 Security Considerations

1. **Password Requirements**
   - Minimum 8 characters
   - At least one uppercase, lowercase, number
   - Use Supabase's built-in password hashing

2. **Session Management**
   - Supabase handles JWT tokens
   - Auto-refresh tokens
   - Secure httpOnly cookies

3. **Row Level Security**
   - Users can only see their organization's data
   - Enforce in database policies
   - Double-check in API routes

4. **API Route Protection**
   - Verify session in all API routes
   - Check organization access
   - Validate user permissions

---

## 🎨 UI/UX Considerations

1. **Auth Pages Design**
   - Clean, minimal design
   - Unite-Hub gradient branding
   - Clear error messages
   - Loading states

2. **User Onboarding**
   - Welcome modal after registration
   - Quick tour of dashboard
   - Sample data creation option

3. **Profile Management**
   - Avatar upload with cropping
   - Real-time preview
   - Validation feedback

---

## ✅ Success Criteria

Phase 5 is complete when:

- [ ] Users can register with email/password
- [ ] Users can login and logout
- [ ] Dashboard pages are protected (redirect to login)
- [ ] Profile page shows real user data
- [ ] Settings page is functional
- [ ] Organization switcher works (if multiple orgs)
- [ ] All pages use real organization ID (not hardcoded)
- [ ] ModernSidebar shows real user info
- [ ] Middleware protects all /dashboard routes
- [ ] Row Level Security policies enforced

---

## 📈 Expected Outcomes

After Phase 5:
- **Multi-tenant ready** - Each org has isolated data
- **Production auth** - Real user accounts, no demo mode
- **Secure dashboard** - Can't access without login
- **User management** - Profile, settings, avatars
- **Team collaboration** - Multiple users per organization
- **Role-based access** - Owner, admin, member, viewer roles

---

## 🔮 Next Phase Preview

**Phase 6: Email Integration & Automation**
- Gmail OAuth integration
- Email sync and tracking
- Drip campaign builder
- Email templates
- Automation workflows

---

**Ready to Start:** YES ✅
**Dependencies:** Phase 4 complete (database integration) ✅
**Blockers:** None

---

**Created:** 2025-11-14
**Status:** Ready to implement
**Estimated Duration:** 3-4 hours
