# Onboarding System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Apply Database Migration

```bash
# Connect to your Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
npx supabase db push

# Verify it worked
npx supabase db tables | grep user_onboarding
```

**Expected output**: `user_onboarding` table should appear in the list.

---

### Step 2: Create Storage Bucket (One-Time Setup)

1. Go to Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name it: `public`
4. Enable "Public bucket"
5. Click "Create bucket"

**RLS Policy** (add in Storage → Policies):
```sql
-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public' AND (storage.foldername(name))[1] = 'avatars');

-- Allow public read access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public' AND (storage.foldername(name))[1] = 'avatars');
```

---

### Step 3: Build & Deploy

```bash
# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Test locally first
npm start

# Deploy to Vercel
vercel --prod
```

---

### Step 4: Test the Flow

1. **Clear Browser Data**
   - Open Dev Tools (F12)
   - Application → Storage → Clear all data
   - Close Dev Tools

2. **Sign Up as New User**
   - Go to `/login`
   - Click "Continue with Google"
   - Authorize with test Google account

3. **Verify Auto-Redirect**
   - You should land on `/onboarding`
   - OnboardingWizard should appear

4. **Complete Step 1**
   - Upload an avatar (any image)
   - Enter business name (e.g., "Test Company")
   - Enter phone (e.g., "+1 555-1234")
   - Select timezone
   - Click "Next"

5. **Complete Step 2**
   - Click "Gmail" card
   - Click "Connect Gmail"
   - Complete OAuth flow
   - Wait for success message
   - Should auto-advance to Step 3

6. **Complete Step 3**
   - Click "Start Import"
   - Watch progress bar
   - Wait for contacts count
   - Click "Next"

7. **Complete Step 4 (Optional)**
   - Select a campaign template OR
   - Click "Skip for now"

8. **Complete Step 5**
   - See celebration screen
   - Click "Go to Dashboard"

9. **Verify Dashboard**
   - You should land on `/dashboard/overview`
   - OnboardingChecklist should NOT appear (because complete)

---

### Step 5: Test Resume Flow

1. **Create Incomplete Onboarding**
   - Sign up with another Google account
   - Complete only Step 1
   - Logout (profile menu → Sign Out)

2. **Login Again**
   - Go to `/login`
   - Sign in with same account

3. **Verify Checklist Appears**
   - Dashboard should show OnboardingChecklist
   - Should show "1/5" or "25%" progress
   - Should list incomplete steps

4. **Test Resume**
   - Click "Continue Setup"
   - OnboardingWizard should open at Step 2
   - Complete remaining steps

---

## 🔍 Troubleshooting

### Issue: "Missing Supabase environment variables"

**Fix**:
```bash
# Check .env.local exists
cat .env.local

# Should contain:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

---

### Issue: "Onboarding doesn't start"

**Fix**:
```sql
-- Check if migration was applied
SELECT * FROM user_onboarding LIMIT 1;

-- If error, migration not applied
-- Re-run: npx supabase db push
```

---

### Issue: "Avatar upload fails"

**Fix**:
1. Verify storage bucket created
2. Check bucket is named "public"
3. Verify RLS policies added
4. Check file size < 5MB

---

### Issue: "Gmail OAuth fails"

**Fix**:
```bash
# Verify environment variables
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET

# Check redirect URI in Google Console
# Should be: https://YOUR_DOMAIN/api/integrations/gmail/callback
```

---

### Issue: "Checklist doesn't hide after completion"

**Fix**:
```sql
-- Check completion status
SELECT user_id, completed_at, skipped
FROM user_onboarding
WHERE user_id = 'YOUR_USER_ID';

-- If completed_at is NULL but all steps complete:
UPDATE user_onboarding
SET completed_at = NOW()
WHERE user_id = 'YOUR_USER_ID'
  AND step_1_complete = TRUE
  AND step_2_complete = TRUE
  AND step_3_complete = TRUE
  AND step_5_complete = TRUE;
```

---

## 📊 Verify Everything Works

### Database Check

```sql
-- Should return records
SELECT COUNT(*) FROM user_onboarding;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'user_onboarding';
-- Should show: rowsecurity = true
```

---

### Storage Check

```sql
-- List uploaded avatars
SELECT name, created_at
FROM storage.objects
WHERE bucket_id = 'public'
  AND (storage.foldername(name))[1] = 'avatars';
```

---

### User Check

```sql
-- See all onboarding records
SELECT
  u.email,
  o.current_step,
  o.step_1_complete,
  o.step_2_complete,
  o.step_3_complete,
  o.step_4_complete,
  o.step_5_complete,
  o.completed_at,
  o.skipped
FROM user_onboarding o
JOIN auth.users u ON u.id = o.user_id
ORDER BY o.created_at DESC;
```

---

## 📈 Monitor Performance

### Add to Your Analytics

Track these events:
- `onboarding_started`
- `onboarding_step_completed` (with step number)
- `onboarding_completed`
- `onboarding_skipped`

### Example with PostHog

```typescript
// In OnboardingWizard.tsx
posthog.capture('onboarding_step_completed', {
  step: currentStep,
  time_spent_seconds: timeSpent,
});
```

---

## 🎯 Success Checklist

After deployment, verify:

- [ ] New user signup creates onboarding record
- [ ] Auto-redirect to `/onboarding` works
- [ ] All 5 steps can be completed
- [ ] Avatar upload works
- [ ] Gmail OAuth works
- [ ] Contact import works
- [ ] Campaign creation works
- [ ] Dashboard redirect works
- [ ] Checklist appears for incomplete onboarding
- [ ] Checklist hides for complete onboarding
- [ ] Skip functionality works
- [ ] Resume functionality works
- [ ] Mobile view works (responsive)
- [ ] No console errors
- [ ] Database records created correctly

---

## 🆘 Need Help?

### Check Documentation
- `ONBOARDING_SYSTEM.md` - Full system docs
- `docs/onboarding-architecture.md` - Architecture
- `ONBOARDING_IMPLEMENTATION.md` - Implementation summary

### Debug Mode

Add to browser console:
```javascript
// Check onboarding status
localStorage.getItem('onboardingStatus');

// Check auth status
localStorage.getItem('supabase.auth.token');
```

### Database Debug

```sql
-- See recent onboarding activity
SELECT *
FROM user_onboarding
ORDER BY updated_at DESC
LIMIT 10;

-- Check for stuck users
SELECT user_id, current_step, updated_at
FROM user_onboarding
WHERE completed_at IS NULL
  AND skipped = FALSE
  AND updated_at < NOW() - INTERVAL '1 hour';
```

---

## 🚀 You're Ready!

The onboarding system is now live and ready to guide your users through their first experience with Unite-Hub.

**Typical completion time**: 3-5 minutes per user
**Expected completion rate**: 80%+

Happy onboarding! 🎉
