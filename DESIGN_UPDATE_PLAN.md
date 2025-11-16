# Unite-Hub Design System Update Plan

## Design System Overview

### Color Palette
- **Primary**: Blue (#3B82F6) to Purple (#9333EA) gradients
- **Background**: Slate-950 to Blue-950 to Slate-900 gradients
- **Text**: White, Slate-300, Slate-400
- **Accents**: Blue-400, Purple-400, Pink-400
- **Success**: Green-400
- **Error**: Red-500
- **Warning**: Orange-500

### Typography
- **Headings**: Bold (600-700), Gradient text clips
- **Body**: Regular (400), Slate-300
- **Small**: Regular (400), Slate-400, 14px

### Components
- **Buttons**: Gradient backgrounds, Shadow-lg with colored shadows
- **Cards**: Glass-morphism, Backdrop-blur-sm, Border white/10
- **Inputs**: Border-slate-200, Focus:border-blue-500
- **Navigation**: Fixed, Backdrop-blur-xl, Border-b white/10

### Effects
- **Glass-morphism**: bg-slate-800/50 backdrop-blur-sm
- **Shadows**: shadow-lg shadow-blue-500/50
- **Gradients**: bg-gradient-to-r from-blue-600 to-purple-600
- **Hover**: scale-110, border-white/10

---

## Page Update Status

### ✅ COMPLETED
1. **Landing Page** (`src/app/page.tsx`)
   - Modern hero with gradients
   - Features showcase
   - How it works section
   - CTA and footer

2. **Login Page** (`src/app/(auth)/login/page.tsx`)
   - Split-screen layout
   - Branded left panel
   - Modern form design
   - Google OAuth button

3. **Register** (`src/app/(auth)/register/page.tsx`)
   - Split-screen layout matching login
   - Signup-specific benefits list
   - Terms/privacy checkbox
   - Trust indicators

4. **Forgot Password** (`src/app/(auth)/forgot-password/page.tsx`)
   - Split-screen with security messaging
   - Enhanced success state
   - Back to sign in link
   - Trust badge

5. **Signup** (`src/app/(auth)/signup/page.tsx`)
   - Split-screen with trial benefits
   - Business name field
   - Features grid showcase
   - No credit card required badge

6. **Dashboard Overview** (`src/app/dashboard/overview/page.tsx`)
   - Modern gradient stat cards
   - Glass-morphism effects
   - Trending indicators with arrows
   - Improved loading states

### 📋 DASHBOARD MAIN (Priority 2) - IN PROGRESS
7. **Profile** (`src/app/dashboard/profile/page.tsx`)
   - Avatar upload section
   - Form styling updates needed
   - Settings cards modernization
   - TODO: Update with gradients

8. **Settings** (`src/app/dashboard/settings/page.tsx`)
   - Tabbed interface
   - Modern forms
   - Integration cards
   - TODO: Update with gradients

### 📧 CAMPAIGNS (Priority 3)
9. **Campaigns List** (`src/app/dashboard/campaigns/page.tsx`)
   - Campaign cards
   - Stats overview
   - Create button

10. **Drip Campaigns** (`src/app/dashboard/campaigns/drip/page.tsx`)
    - Visual builder
    - Step cards
    - Flow diagram

### 👥 CONTACTS (Priority 4)
11. **Contacts List** (`src/app/dashboard/contacts/page.tsx`)
    - Table/grid view
    - Filters
    - Bulk actions

12. **Contact Detail** (`src/app/dashboard/contacts/[contactId]/page.tsx`)
    - Profile header
    - Activity timeline
    - Quick actions

### 🤖 AI TOOLS (Priority 5)
13. **Marketing Copy** (`src/app/dashboard/ai-tools/marketing-copy/page.tsx`)
    - Input form
    - Output display
    - Templates

14. **Code Generator** (`src/app/dashboard/ai-tools/code-generator/page.tsx`)
    - Prompt input
    - Code output
    - Copy button

### 📄 CONTENT (Priority 6)
15. **Content** (`src/app/dashboard/content/page.tsx`)
    - Content cards
    - Status filters
    - Create buttons

16. **Templates** (`src/app/dashboard/content/templates/page.tsx`)
    - Template library
    - Preview cards
    - Use template button

### 🌐 PUBLIC PAGES (Priority 7)
17. **Pricing** (`src/app/pricing/page.tsx`)
    - Pricing cards
    - Feature comparison
    - CTA buttons

18. **Demo Pages** (Various)
    - Interactive demos
    - Preview components
    - Call-to-action

### 🔧 UTILITY PAGES (Priority 8)
19. **Team** (`src/app/dashboard/team/page.tsx`)
    - Member cards
    - Invite form
    - Role badges

20. **Workspaces** (`src/app/dashboard/workspaces/page.tsx`)
    - Workspace cards
    - Create workspace
    - Switch workspace

21. **Calendar** (`src/app/dashboard/calendar/page.tsx`)
    - Calendar grid
    - Event cards
    - Create event

---

## Implementation Strategy

### Phase 1: Core Pages (Week 1)
- Auth pages (Register, Forgot Password)
- Dashboard overview
- Profile page

### Phase 2: Key Features (Week 2)
- Campaigns
- Contacts
- Settings

### Phase 3: Advanced Features (Week 3)
- AI Tools
- Content management
- Templates

### Phase 4: Polish & Public (Week 4)
- Pricing page
- Demo pages
- Team & Workspaces

---

## Reusable Components to Create

### 1. PageHeader Component
```tsx
<PageHeader
  title="Page Title"
  description="Page description"
  actions={<Button>Action</Button>}
/>
```

### 2. StatsCard Component
```tsx
<StatsCard
  title="Total Users"
  value="1,234"
  change="+12%"
  icon={Users}
/>
```

### 3. GradientCard Component
```tsx
<GradientCard
  gradient="from-blue-500 to-purple-500"
  icon={Sparkles}
  title="Card Title"
  description="Card description"
/>
```

### 4. EmptyState Component
```tsx
<EmptyState
  icon={Inbox}
  title="No items yet"
  description="Get started by creating your first item"
  action={<Button>Create Item</Button>}
/>
```

---

## Design Checklist

For each page, ensure:
- [ ] Gradient backgrounds where appropriate
- [ ] Glass-morphism effects on cards
- [ ] Proper spacing (p-4, p-6, p-8)
- [ ] Consistent typography
- [ ] Hover effects on interactive elements
- [ ] Loading states with spinners
- [ ] Empty states with icons
- [ ] Mobile responsive
- [ ] Dark theme compatible
- [ ] Accessible (ARIA labels)

---

## Next Steps

1. Create reusable components library
2. Update dashboard layout wrapper
3. Apply design system to each page systematically
4. Test responsive design
5. Add animations and transitions
6. Polish and refine
7. Document component usage

---

**Status**: Design system defined, landing page and login completed.
**Next**: Update register page, then dashboard overview.

