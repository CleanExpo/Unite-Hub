# Phase 5, Step 1: Settings Page — Founder Account & Integration Configuration

**Issue**: UNI-1519 (Phase 5 — Settings Page)
**Priority**: Priority 1 (Low effort, high impact)
**Effort**: ~6 hours
**Acceptance**: Settings page fully functional with all founder account and integration settings accessible and editable

---

## Overview

The Settings page is the founder's control centre for account preferences and integration configuration. This is a priority feature because it unblocks subsequent features (Contacts CRM, Dashboard, etc.) that depend on configuration data.

### Scope
- **Account Settings**: Profile name, email, timezone, locale
- **Integration Config**: Google Drive vault folder ID, Xero API connection status
- **Notification Preferences**: Email digests, approval alerts, advisory case notifications
- **Dangerous Actions**: Logout, session management

### Architecture
- **Route**: `/founder/settings`
- **Page Component**: `src/app/(founder)/founder/settings/page.tsx` (async RSC with auth guard)
- **Client Shell**: `src/components/founder/settings/SettingsPageClient.tsx` (useState for form state)
- **Sub-components**:
  - `AccountSettingsSection.tsx` — Profile name, email, timezone, locale
  - `IntegrationSettingsSection.tsx` — Google Drive, Xero connection status
  - `NotificationPreferencesSection.tsx` — Toggles for digest/alerts
  - `DangerousActionsSection.tsx` — Logout button
- **Database**: `user_settings` table with (user_id, timezone, locale, notification_digest, notification_alerts, notification_cases, updated_at)
- **API**: `POST /api/settings/update` (upsert user_settings)

---

## Task Breakdown

### Task 1: Create user_settings database table

**File**: `supabase/migrations/20260312000000_user_settings_table.sql`

**Steps**:
1. Create migration with schema:
   ```sql
   CREATE TABLE user_settings (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
     timezone text DEFAULT 'Australia/Sydney',
     locale text DEFAULT 'en-AU',
     notification_digest boolean DEFAULT true,
     notification_alerts boolean DEFAULT true,
     notification_cases boolean DEFAULT true,
     google_drive_vault_folder_id text,
     created_at timestamp with time zone DEFAULT now(),
     updated_at timestamp with time zone DEFAULT now()
   );

   CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

   ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can read own settings"
     ON user_settings FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can update own settings"
     ON user_settings FOR UPDATE
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can insert own settings"
     ON user_settings FOR INSERT
     WITH CHECK (auth.uid() = user_id);
   ```

**Verification**:
```bash
cd supabase && supabase migration list | grep user_settings
supabase migration resolve 20260312000000_user_settings_table
# Test: SELECT * FROM user_settings LIMIT 1; should return empty
```

**Success Criteria**: Migration applies without errors, table exists with RLS policies

---

### Task 2: Generate TypeScript types for user_settings

**File**: `src/types/database.ts` (append to existing)

**Steps**:
1. Run type generation:
   ```bash
   pnpm run supabase:gen-types
   ```

2. Verify new types exist:
   ```bash
   grep -A 15 "export type UserSettings" src/types/database.ts
   ```

**Expected Output**:
```typescript
export type UserSettings = {
  id: string
  user_id: string
  timezone: string
  locale: string
  notification_digest: boolean
  notification_alerts: boolean
  notification_cases: boolean
  google_drive_vault_folder_id: string | null
  created_at: string
  updated_at: string
}
```

**Success Criteria**: Types generated, no TypeScript errors

---

### Task 3: Create settings API route

**File**: `src/app/api/settings/update/route.ts`

**Steps**:
1. Create new files/directories as needed:
   ```bash
   mkdir -p src/app/api/settings/update
   ```

2. Write route handler:
   ```typescript
   import { NextRequest, NextResponse } from 'next/server'
   import { createServerClient } from '@/lib/supabase/server'
   import { getUser } from '@/lib/supabase/auth'
   import type { UserSettings } from '@/types/database'

   export const dynamic = 'force-dynamic'

   export async function POST(request: NextRequest) {
     const user = await getUser()
     if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

     const supabase = createServerClient()
     const body = await request.json()

     const { timezone, locale, notification_digest, notification_alerts, notification_cases, google_drive_vault_folder_id } = body

     // Validate timezone and locale
     if (timezone && !['Australia/Sydney', 'Australia/Melbourne', 'UTC'].includes(timezone)) {
       return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 })
     }

     if (locale && !['en-AU', 'en-US'].includes(locale)) {
       return NextResponse.json({ error: 'Invalid locale' }, { status: 400 })
     }

     // Upsert user settings
     const { data, error } = await supabase
       .from('user_settings')
       .upsert({
         user_id: user.id,
         timezone: timezone || 'Australia/Sydney',
         locale: locale || 'en-AU',
         notification_digest: notification_digest ?? true,
         notification_alerts: notification_alerts ?? true,
         notification_cases: notification_cases ?? true,
         google_drive_vault_folder_id,
         updated_at: new Date().toISOString(),
       }, { onConflict: 'user_id' })
       .select()
       .single()

     if (error) {
       console.error('Settings update error:', error)
       return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
     }

     return NextResponse.json(data)
   }

   export async function GET(request: NextRequest) {
     const user = await getUser()
     if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

     const supabase = createServerClient()

     const { data, error } = await supabase
       .from('user_settings')
       .select('*')
       .eq('user_id', user.id)
       .single()

     if (error) {
       // Settings don't exist yet, return defaults
       return NextResponse.json({
         timezone: 'Australia/Sydney',
         locale: 'en-AU',
         notification_digest: true,
         notification_alerts: true,
         notification_cases: true,
         google_drive_vault_folder_id: null,
       })
     }

     return NextResponse.json(data)
   }
   ```

**Verification**:
```bash
pnpm run type-check
pnpm run lint
# Manually test via curl or Postman
curl -X POST http://localhost:3000/api/settings/update \
  -H "Content-Type: application/json" \
  -d '{"timezone":"Australia/Melbourne","locale":"en-AU"}'
```

**Success Criteria**: Route deploys, no TypeScript/lint errors, GET/POST work

---

### Task 4: Create AccountSettingsSection component

**File**: `src/components/founder/settings/AccountSettingsSection.tsx`

**Steps**:
1. Create component:
   ```typescript
   'use client'

   import { useState } from 'react'
   import type { UserSettings } from '@/types/database'

   interface AccountSettingsSectionProps {
     settings: Partial<UserSettings>
     onSave: (settings: Partial<UserSettings>) => Promise<void>
     loading: boolean
   }

   export function AccountSettingsSection({ settings, onSave, loading }: AccountSettingsSectionProps) {
     const [timezone, setTimezone] = useState(settings.timezone || 'Australia/Sydney')
     const [locale, setLocale] = useState(settings.locale || 'en-AU')
     const [saving, setSaving] = useState(false)

     const handleSave = async () => {
       setSaving(true)
       try {
         await onSave({ timezone, locale })
       } finally {
         setSaving(false)
       }
     }

     return (
       <div className="border border-surface-elevated rounded-sm p-6">
         <h2 className="text-lg font-semibold text-color-text-primary mb-4">Account Settings</h2>

         <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-color-text-muted mb-2">Timezone</label>
             <select
               value={timezone}
               onChange={(e) => setTimezone(e.target.value)}
               className="w-full bg-surface-elevated text-color-text-primary rounded-sm px-3 py-2 border border-surface-elevated hover:border-color-text-muted focus:outline-none focus:border-cyan-400"
               disabled={loading || saving}
             >
               <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
               <option value="Australia/Melbourne">Melbourne (AEST/AEDT)</option>
               <option value="UTC">UTC</option>
             </select>
           </div>

           <div>
             <label className="block text-sm font-medium text-color-text-muted mb-2">Locale</label>
             <select
               value={locale}
               onChange={(e) => setLocale(e.target.value)}
               className="w-full bg-surface-elevated text-color-text-primary rounded-sm px-3 py-2 border border-surface-elevated hover:border-color-text-muted focus:outline-none focus:border-cyan-400"
               disabled={loading || saving}
             >
               <option value="en-AU">Australian English (DD/MM/YYYY)</option>
               <option value="en-US">American English (MM/DD/YYYY)</option>
             </select>
           </div>

           <button
             onClick={handleSave}
             disabled={loading || saving}
             className="px-4 py-2 bg-cyan-600 text-color-text-primary rounded-sm font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {saving ? 'Saving…' : 'Save Changes'}
           </button>
         </div>
       </div>
     )
   }
   ```

**Verification**:
```bash
pnpm run type-check
# Component should render without errors
```

**Success Criteria**: Component compiles, no TypeScript errors

---

### Task 5: Create IntegrationSettingsSection component

**File**: `src/components/founder/settings/IntegrationSettingsSection.tsx`

**Steps**:
1. Create component:
   ```typescript
   'use client'

   import { useState } from 'react'
   import type { UserSettings } from '@/types/database'

   interface IntegrationSettingsSectionProps {
     settings: Partial<UserSettings>
     onSave: (settings: Partial<UserSettings>) => Promise<void>
     loading: boolean
   }

   export function IntegrationSettingsSection({ settings, onSave, loading }: IntegrationSettingsSectionProps) {
     const [googleDriveFolderId, setGoogleDriveFolderId] = useState(settings.google_drive_vault_folder_id || '')
     const [saving, setSaving] = useState(false)

     const handleSave = async () => {
       setSaving(true)
       try {
         await onSave({ google_drive_vault_folder_id: googleDriveFolderId || null })
       } finally {
         setSaving(false)
       }
     }

     return (
       <div className="border border-surface-elevated rounded-sm p-6">
         <h2 className="text-lg font-semibold text-color-text-primary mb-4">Integrations</h2>

         <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-color-text-muted mb-2">
               Google Drive Vault Folder ID
             </label>
             <input
               type="text"
               value={googleDriveFolderId}
               onChange={(e) => setGoogleDriveFolderId(e.target.value)}
               placeholder="Paste your Google Drive folder ID here"
               className="w-full bg-surface-elevated text-color-text-primary rounded-sm px-3 py-2 border border-surface-elevated hover:border-color-text-muted focus:outline-none focus:border-cyan-400 font-mono text-xs"
               disabled={loading || saving}
             />
             <p className="text-xs text-color-text-muted mt-2">
               Find this in your Google Drive folder URL: /drive/folders/<strong>FOLDER_ID</strong>
             </p>
           </div>

           <button
             onClick={handleSave}
             disabled={loading || saving}
             className="px-4 py-2 bg-cyan-600 text-color-text-primary rounded-sm font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {saving ? 'Saving…' : 'Save Changes'}
           </button>
         </div>
       </div>
     )
   }
   ```

**Verification**:
```bash
pnpm run type-check
```

**Success Criteria**: Component compiles, no TypeScript errors

---

### Task 6: Create NotificationPreferencesSection component

**File**: `src/components/founder/settings/NotificationPreferencesSection.tsx`

**Steps**:
1. Create component:
   ```typescript
   'use client'

   import { useState } from 'react'
   import type { UserSettings } from '@/types/database'

   interface NotificationPreferencesSectionProps {
     settings: Partial<UserSettings>
     onSave: (settings: Partial<UserSettings>) => Promise<void>
     loading: boolean
   }

   export function NotificationPreferencesSection({ settings, onSave, loading }: NotificationPreferencesSectionProps) {
     const [digest, setDigest] = useState(settings.notification_digest ?? true)
     const [alerts, setAlerts] = useState(settings.notification_alerts ?? true)
     const [cases, setCases] = useState(settings.notification_cases ?? true)
     const [saving, setSaving] = useState(false)

     const handleSave = async () => {
       setSaving(true)
       try {
         await onSave({
           notification_digest: digest,
           notification_alerts: alerts,
           notification_cases: cases,
         })
       } finally {
         setSaving(false)
       }
     }

     return (
       <div className="border border-surface-elevated rounded-sm p-6">
         <h2 className="text-lg font-semibold text-color-text-primary mb-4">Notification Preferences</h2>

         <div className="space-y-4">
           <label className="flex items-center gap-3 cursor-pointer">
             <input
               type="checkbox"
               checked={digest}
               onChange={(e) => setDigest(e.target.checked)}
               disabled={loading || saving}
               className="w-4 h-4 rounded-sm bg-surface-elevated border border-color-text-muted"
             />
             <span className="text-sm font-medium text-color-text-primary">Daily Digest Email</span>
           </label>

           <label className="flex items-center gap-3 cursor-pointer">
             <input
               type="checkbox"
               checked={alerts}
               onChange={(e) => setAlerts(e.target.checked)}
               disabled={loading || saving}
               className="w-4 h-4 rounded-sm bg-surface-elevated border border-color-text-muted"
             />
             <span className="text-sm font-medium text-color-text-primary">Approval Alerts</span>
           </label>

           <label className="flex items-center gap-3 cursor-pointer">
             <input
               type="checkbox"
               checked={cases}
               onChange={(e) => setCases(e.target.checked)}
               disabled={loading || saving}
               className="w-4 h-4 rounded-sm bg-surface-elevated border border-color-text-muted"
             />
             <span className="text-sm font-medium text-color-text-primary">Advisory Case Updates</span>
           </label>

           <button
             onClick={handleSave}
             disabled={loading || saving}
             className="px-4 py-2 bg-cyan-600 text-color-text-primary rounded-sm font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {saving ? 'Saving…' : 'Save Changes'}
           </button>
         </div>
       </div>
     )
   }
   ```

**Verification**:
```bash
pnpm run type-check
```

**Success Criteria**: Component compiles, no TypeScript errors

---

### Task 7: Create SettingsPageClient shell component

**File**: `src/components/founder/settings/SettingsPageClient.tsx`

**Steps**:
1. Create component:
   ```typescript
   'use client'

   import { useState, useEffect } from 'react'
   import type { UserSettings } from '@/types/database'
   import { AccountSettingsSection } from './AccountSettingsSection'
   import { IntegrationSettingsSection } from './IntegrationSettingsSection'
   import { NotificationPreferencesSection } from './NotificationPreferencesSection'

   interface SettingsPageClientProps {
     initialSettings: Partial<UserSettings>
   }

   export function SettingsPageClient({ initialSettings }: SettingsPageClientProps) {
     const [settings, setSettings] = useState(initialSettings)
     const [loading, setLoading] = useState(false)
     const [successMessage, setSuccessMessage] = useState('')

     const handleSave = async (updates: Partial<UserSettings>) => {
       setLoading(true)
       setSuccessMessage('')

       try {
         const response = await fetch('/api/settings/update', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(updates),
         })

         if (!response.ok) {
           throw new Error('Failed to save settings')
         }

         const data = await response.json()
         setSettings(data)
         setSuccessMessage('Settings saved successfully')
         setTimeout(() => setSuccessMessage(''), 3000)
       } catch (error) {
         console.error('Error saving settings:', error)
       } finally {
         setLoading(false)
       }
     }

     return (
       <div className="flex flex-col gap-6 p-6 max-w-2xl">
         <div>
           <h1 className="text-2xl font-bold text-color-text-primary mb-2">Settings</h1>
           <p className="text-sm text-color-text-muted">Manage your account and preferences</p>
         </div>

         {successMessage && (
           <div className="bg-green-900 bg-opacity-20 border border-green-600 text-green-400 px-4 py-2 rounded-sm text-sm">
             {successMessage}
           </div>
         )}

         <AccountSettingsSection settings={settings} onSave={handleSave} loading={loading} />
         <IntegrationSettingsSection settings={settings} onSave={handleSave} loading={loading} />
         <NotificationPreferencesSection settings={settings} onSave={handleSave} loading={loading} />
       </div>
     )
   }
   ```

**Verification**:
```bash
pnpm run type-check
```

**Success Criteria**: Component compiles, no TypeScript errors

---

### Task 8: Create Settings page server component

**File**: `src/app/(founder)/founder/settings/page.tsx`

**Steps**:
1. Create directory and page:
   ```bash
   mkdir -p src/app/'(founder)'/founder/settings
   ```

2. Write page component:
   ```typescript
   import { redirect } from 'next/navigation'
   import { getUser } from '@/lib/supabase/auth'
   import { createServerClient } from '@/lib/supabase/server'
   import { SettingsPageClient } from '@/components/founder/settings/SettingsPageClient'
   import type { UserSettings } from '@/types/database'

   export const dynamic = 'force-dynamic'

   export default async function SettingsPage() {
     const user = await getUser()
     if (!user) redirect('/auth/login')

     const supabase = createServerClient()

     const { data: settings } = await supabase
       .from('user_settings')
       .select('*')
       .eq('user_id', user.id)
       .single()

     const initialSettings: Partial<UserSettings> = settings || {
       timezone: 'Australia/Sydney',
       locale: 'en-AU',
       notification_digest: true,
       notification_alerts: true,
       notification_cases: true,
     }

     return <SettingsPageClient initialSettings={initialSettings} />
   }
   ```

**Verification**:
```bash
pnpm run type-check
```

**Success Criteria**: Page compiles, no TypeScript errors, renders without auth redirect

---

### Task 9: Update SidebarNav to include Settings link

**File**: `src/components/layout/SidebarNav.tsx` (modify existing)

**Steps**:
1. Settings already exists in NAV_ITEMS (from previous work)
2. Verify the link exists and is ordered correctly
3. Expected output:
   ```typescript
   const NAV_ITEMS = [
     { href: '/founder/dashboard',   label: 'Dashboard',  icon: LayoutDashboard },
     { href: '/founder/bookkeeper', label: 'Bookkeeper', icon: BookOpen },
     { href: '/founder/kanban',     label: 'Kanban',     icon: Columns2 },
     { href: '/founder/vault',     label: 'Vault',      icon: Lock },
     { href: '/founder/notes',     label: 'Notes',      icon: FileText },
     { href: '/founder/approvals', label: 'Approvals',  icon: ClipboardCheck },
     { href: '/founder/advisory',  label: 'Advisory',   icon: Scale },
     { href: '/founder/social',    label: 'Social',     icon: Share2 },
     { href: '/founder/settings',  label: 'Settings',   icon: Settings },
   ] as const
   ```

**Verification**:
```bash
grep -A 9 "const NAV_ITEMS" src/components/layout/SidebarNav.tsx
```

**Success Criteria**: Settings navigation item present and ordered last

---

### Task 10: Create Settings page smoke test

**File**: `e2e/settings.spec.ts`

**Steps**:
1. Create test:
   ```typescript
   import { test, expect } from '@playwright/test'

   test('Settings page loads and displays form sections', async ({ page }) => {
     await page.goto('/founder/settings')

     // Should redirect to login if not authenticated
     const url = page.url()
     expect(url).toMatch(/\/(founder\/settings|auth\/login)/)

     if (url.includes('/auth/login')) {
       console.log('✓ Unauthenticated user redirected to login')
     } else {
       // If authenticated, verify page structure
       await expect(page.locator('h1')).toContainText('Settings')
       await expect(page.locator('h2')).toContainText('Account Settings')
       await expect(page.locator('text=Timezone')).toBeVisible()
       await expect(page.locator('text=Google Drive Vault Folder ID')).toBeVisible()
       console.log('✓ Settings page loaded with all sections')
     }
   })
   ```

**Verification**:
```bash
pnpm exec playwright test e2e/settings.spec.ts
# Should pass (either redirect to login or show settings page)
```

**Success Criteria**: Smoke test passes (either auth redirect or page loads)

---

### Task 11: Run full type check and linting

**Steps**:
```bash
pnpm run type-check && echo "✓ TypeScript OK"
pnpm run lint && echo "✓ Linting OK"
```

**Success Criteria**: No TypeScript or ESLint errors

---

### Task 12: Create migration and commit

**Steps**:
1. Apply migration:
   ```bash
   cd supabase
   supabase migration resolve 20260312000000_user_settings_table
   cd ..
   ```

2. Verify all changes:
   ```bash
   git status
   ```

3. Expected changed files:
   - `supabase/migrations/20260312000000_user_settings_table.sql` (new)
   - `src/types/database.ts` (modified)
   - `src/app/api/settings/update/route.ts` (new)
   - `src/components/founder/settings/AccountSettingsSection.tsx` (new)
   - `src/components/founder/settings/IntegrationSettingsSection.tsx` (new)
   - `src/components/founder/settings/NotificationPreferencesSection.tsx` (new)
   - `src/components/founder/settings/SettingsPageClient.tsx` (new)
   - `src/app/(founder)/founder/settings/page.tsx` (new)
   - `e2e/settings.spec.ts` (new)

4. Commit:
   ```bash
   git add -A
   git commit -m "feat(settings): founder account and integration configuration page

   - Create user_settings table with RLS policies
   - Build settings page with 3 sections: Account, Integrations, Notifications
   - Add /api/settings/update endpoint for upsert operations
   - Include Google Drive vault folder ID configuration
   - Add smoke test for settings page navigation
   - Update sidebar navigation to include Settings link"
   ```

**Success Criteria**: Commit succeeds, all files staged

---

## Verification Gates

### Pre-Implementation
- [ ] All referenced files verified to exist (database.ts, supabase schema, etc.)
- [ ] No conflicting routes or components
- [ ] Environment variables confirmed in `.env.example`

### Post-Implementation
```bash
# 1. Type checking
pnpm run type-check
# Expected: Success (0 errors)

# 2. Linting
pnpm run lint
# Expected: Success (0 errors)

# 3. Smoke test
pnpm exec playwright test e2e/settings.spec.ts
# Expected: 1 passed

# 4. Database
psql (supabase connection) -c "SELECT * FROM user_settings LIMIT 1;"
# Expected: Empty result set (table exists)

# 5. Manual browser test
# Navigate to http://localhost:3000/founder/settings
# Expected: Settings page loads OR redirect to /auth/login
```

---

## Success Criteria

✅ Settings page accessible at `/founder/settings`
✅ Three settings sections render without errors
✅ Form data persists to `user_settings` table
✅ Navigation includes Settings link (last item)
✅ Smoke test passes
✅ Zero TypeScript errors
✅ Zero linting errors
✅ Commit created with all changes staged

---

## Notes

**Token refresh**: User settings do NOT require token refresh (unlike Google Drive which uses OAuth tokens). All settings are founder-owned data in the user_settings table.

**Timezone/locale**: Currently supports Sydney, Melbourne, UTC; en-AU and en-US. Can expand later without migration.

**Google Drive folder ID**: Optional. If not set, Notes page will show empty vault. User can configure anytime in Settings.

**Notification preferences**: Currently stored but not consumed by backend yet. Phase 5 Step 2+ will implement actual email/alert routing.
