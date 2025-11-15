# Onboarding System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         NEW USER SIGNUP                          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Google OAuth Login   │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  /auth/callback/       │
                    │  implicit-callback     │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ AuthContext detects    │
                    │   SIGNED_IN event      │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ POST /api/auth/        │
                    │   initialize-user      │
                    └────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
        ┌─────────────────────┐   ┌─────────────────────┐
        │ Create user_profile │   │ Create organization │
        └─────────────────────┘   └─────────────────────┘
                    │                         │
                    └────────────┬────────────┘
                                 ▼
                    ┌────────────────────────┐
                    │  Create workspace      │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Create user_onboarding │
                    │   (step 1, active)     │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Redirect to /onboarding│
                    └────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ONBOARDING WIZARD                            │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   STEP 1     │  │   STEP 2     │  │   STEP 3     │          │
│  │  Profile     │─▶│ Integration  │─▶│   Contacts   │          │
│  │  Setup       │  │  (Gmail)     │  │   Import     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │   STEP 4     │  │   STEP 5     │                             │
│  │  Campaign    │─▶│  Dashboard   │                             │
│  │ (Optional)   │  │    Tour      │                             │
│  └──────────────┘  └──────────────┘                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Redirect to           │
                    │  /dashboard/overview   │
                    └────────────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        App Providers                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  AuthProvider                                               │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  OnboardingProvider                                   │  │ │
│  │  │                                                        │  │ │
│  │  │  ┌──────────────────────────────────────────────┐    │  │ │
│  │  │  │  App Routes                                   │    │  │ │
│  │  │  │  - /login                                     │    │  │ │
│  │  │  │  - /onboarding                                │    │  │ │
│  │  │  │  - /dashboard/overview                        │    │  │ │
│  │  │  │  - /dashboard/*                               │    │  │ │
│  │  │  └──────────────────────────────────────────────┘    │  │ │
│  │  │                                                        │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     OnboardingContext                            │
│                                                                   │
│  State:                          Actions:                        │
│  - status: OnboardingStatus      - startOnboarding()             │
│  - loading: boolean              - completeStep(step, data)      │
│  - isOnboarding: boolean         - skipOnboarding()              │
│  - isComplete: boolean           - goToStep(step)                │
│  - currentStep: number           - refreshStatus()               │
│  - completionPercentage: number                                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Supabase Database    │
                    │  user_onboarding table │
                    └────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
        ┌─────────────────────┐   ┌─────────────────────┐
        │ OnboardingWizard    │   │ OnboardingChecklist │
        │   (Modal Dialog)    │   │  (Dashboard Widget) │
        └─────────────────────┘   └─────────────────────┘
```

## API Endpoints Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Endpoints                             │
│                                                                   │
│  POST /api/onboarding/start                                      │
│  ├─ Creates user_onboarding record                               │
│  └─ Returns: { data: OnboardingStatus }                          │
│                                                                   │
│  POST /api/onboarding/complete-step                              │
│  ├─ Input: { step: number, data: object }                        │
│  ├─ Updates step_N_complete = true                               │
│  ├─ Updates current_step = N+1                                   │
│  └─ Returns: { data: OnboardingStatus }                          │
│                                                                   │
│  GET /api/onboarding/status                                      │
│  ├─ Fetches current onboarding record                            │
│  ├─ Calculates completion percentage                             │
│  └─ Returns: { data, completionPercentage, isComplete }          │
│                                                                   │
│  POST /api/onboarding/skip                                       │
│  ├─ Updates skipped = true                                       │
│  └─ Returns: { data: OnboardingStatus }                          │
│                                                                   │
│  POST /api/campaigns/from-template                               │
│  ├─ Input: { template: string }                                  │
│  ├─ Creates drip_campaign record                                 │
│  ├─ Creates campaign_steps records                               │
│  └─ Returns: { data: Campaign }                                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                      Database Tables                             │
│                                                                   │
│  auth.users                                                      │
│  └── user_onboarding (user_id FK)                                │
│      ├── id: UUID                                                │
│      ├── user_id: UUID                                           │
│      ├── step_1_complete: BOOLEAN                                │
│      ├── step_2_complete: BOOLEAN                                │
│      ├── step_3_complete: BOOLEAN                                │
│      ├── step_4_complete: BOOLEAN                                │
│      ├── step_5_complete: BOOLEAN                                │
│      ├── current_step: INTEGER                                   │
│      ├── completed_at: TIMESTAMP                                 │
│      ├── skipped: BOOLEAN                                        │
│      └── onboarding_data: JSONB                                  │
│                                                                   │
│  Triggers:                                                       │
│  - update_user_onboarding_updated_at()                           │
│    └── Auto-sets completed_at when all required steps done       │
│                                                                   │
│  RLS Policies:                                                   │
│  - Users can only view/update their own record                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## User Journey Map

```
NEW USER
    │
    ├─▶ [Login Page] ─────────────────────────┐
    │                                          │
    │   Click "Continue with Google"          │
    │                                          ▼
    │                              [Google OAuth Screen]
    │                                          │
    │                              Authorize app
    │                                          │
    │                                          ▼
    │                              [Auth Callback]
    │                                          │
    │                              Initialize user
    │                                          │
    │                                          ▼
    ├─▶ [Onboarding Page] ◀───────────────────┘
    │        │
    │        ├─▶ Step 1: Profile Setup
    │        │   - Upload avatar
    │        │   - Enter business name
    │        │   - Enter phone
    │        │   - Select timezone
    │        │   - Click "Next"
    │        │
    │        ├─▶ Step 2: Connect Gmail
    │        │   - Click "Connect Gmail"
    │        │   - OAuth popup
    │        │   - Authorize
    │        │   - Auto-advance
    │        │
    │        ├─▶ Step 3: Import Contacts
    │        │   - Click "Start Import"
    │        │   - Watch progress bar
    │        │   - See contacts found
    │        │   - Click "Next"
    │        │
    │        ├─▶ Step 4: Create Campaign (Optional)
    │        │   - Select template OR skip
    │        │   - Click "Create" or "Skip"
    │        │
    │        └─▶ Step 5: Celebration
    │            - See feature highlights
    │            - Click "Go to Dashboard"
    │
    ├─▶ [Dashboard] ◀─────────────────────────┘
    │        │
    │        └─▶ OnboardingChecklist (if incomplete)
    │            - Shows progress
    │            - Quick resume
    │
    └─▶ ACTIVE USER
```

## Component Hierarchy

```
App
└── Providers
    ├── AuthProvider
    │   └── OnboardingProvider
    │       ├── /onboarding
    │       │   └── OnboardingWizard
    │       │       ├── Step1: ProfileSetup
    │       │       ├── Step2: IntegrationConnect
    │       │       ├── Step3: ContactImport
    │       │       ├── Step4: CampaignCreate
    │       │       └── Step5: Celebration
    │       │
    │       └── /dashboard/overview
    │           ├── OnboardingChecklist
    │           │   ├── ChecklistItem (x5)
    │           │   └── OnboardingWizard (on click)
    │           ├── Stats Cards
    │           ├── HotLeadsPanel
    │           └── CalendarWidget
```

## Data Flow Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ User action (click "Next")
       ▼
┌─────────────────┐
│ OnboardingWizard│
└──────┬──────────┘
       │ completeStep(1, data)
       ▼
┌──────────────────┐
│ OnboardingContext│
└──────┬───────────┘
       │ Update state
       │ Call API
       ▼
┌───────────────────────┐
│ POST /api/onboarding/ │
│    complete-step      │
└──────┬────────────────┘
       │ Database update
       ▼
┌────────────────┐
│   Supabase     │
│ user_onboarding│
└──────┬─────────┘
       │ Return updated record
       ▼
┌──────────────────┐
│ OnboardingContext│
└──────┬───────────┘
       │ Update state
       ▼
┌─────────────────┐
│ OnboardingWizard│
└──────┬──────────┘
       │ Re-render with new step
       ▼
┌─────────────┐
│   Browser   │
└─────────────┘
```

## Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Security Measures                            │
│                                                                   │
│  1. Authentication                                               │
│     ├─ Supabase Auth (session-based)                             │
│     ├─ JWT tokens in localStorage                                │
│     └─ Auto-refresh before expiry                                │
│                                                                   │
│  2. Authorization                                                │
│     ├─ All API endpoints require auth header                     │
│     ├─ User can only access own onboarding record                │
│     └─ RLS policies enforce data isolation                       │
│                                                                   │
│  3. Data Validation                                              │
│     ├─ Frontend form validation                                  │
│     ├─ Backend input sanitization                                │
│     └─ TypeScript type checking                                  │
│                                                                   │
│  4. CSRF Protection                                              │
│     ├─ SameSite cookies                                          │
│     ├─ Origin checking                                           │
│     └─ State parameter in OAuth                                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Performance Optimizations

```
┌─────────────────────────────────────────────────────────────────┐
│                   Performance Features                           │
│                                                                   │
│  1. Lazy Loading                                                 │
│     └─ OnboardingWizard only loaded when needed                  │
│                                                                   │
│  2. Optimistic Updates                                           │
│     └─ UI updates before API response                            │
│                                                                   │
│  3. Progressive Enhancement                                      │
│     ├─ Form works without JS                                     │
│     └─ Graceful degradation                                      │
│                                                                   │
│  4. Caching                                                      │
│     ├─ OnboardingContext caches status                           │
│     └─ Reduces unnecessary API calls                             │
│                                                                   │
│  5. Code Splitting                                               │
│     └─ Next.js automatic route-based splitting                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
User Action
    │
    ▼
Try: Execute Action
    │
    ├─▶ Success
    │   └─▶ Update UI
    │       └─▶ Show success feedback
    │
    └─▶ Error
        ├─▶ Catch Error
        ├─▶ Log to console
        ├─▶ Show user-friendly message
        ├─▶ Keep previous state
        └─▶ Allow retry
```

## Analytics & Monitoring

```
┌─────────────────────────────────────────────────────────────────┐
│                    Analytics Events                              │
│                                                                   │
│  Event: onboarding_started                                       │
│  ├─ Timestamp                                                    │
│  ├─ User ID                                                      │
│  └─ Source (google/email)                                        │
│                                                                   │
│  Event: onboarding_step_completed                                │
│  ├─ Step number                                                  │
│  ├─ Time spent on step                                           │
│  └─ Additional data collected                                    │
│                                                                   │
│  Event: onboarding_completed                                     │
│  ├─ Total time                                                   │
│  ├─ Steps completed                                              │
│  └─ Campaign created (yes/no)                                    │
│                                                                   │
│  Event: onboarding_skipped                                       │
│  ├─ Step at skip                                                 │
│  └─ Reason (if provided)                                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Type-safe data flow
- ✅ Secure authentication/authorization
- ✅ Performance optimizations
- ✅ Error handling at every level
- ✅ Analytics for continuous improvement
