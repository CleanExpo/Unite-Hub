-- UNI-1592: Fix 7 FK constraints missing ON DELETE CASCADE
-- PostgreSQL default (RESTRICT) means deleting a founder throws an error
-- instead of cascading. All founder_id columns on these tables must CASCADE.
--
-- Constraint names follow PostgreSQL auto-naming: {table}_{column}_fkey

-- 1. brand_identities.founder_id
ALTER TABLE public.brand_identities
  DROP CONSTRAINT IF EXISTS brand_identities_founder_id_fkey;
ALTER TABLE public.brand_identities
  ADD CONSTRAINT brand_identities_founder_id_fkey
  FOREIGN KEY (founder_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. generated_content.founder_id
ALTER TABLE public.generated_content
  DROP CONSTRAINT IF EXISTS generated_content_founder_id_fkey;
ALTER TABLE public.generated_content
  ADD CONSTRAINT generated_content_founder_id_fkey
  FOREIGN KEY (founder_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. video_assets.founder_id
ALTER TABLE public.video_assets
  DROP CONSTRAINT IF EXISTS video_assets_founder_id_fkey;
ALTER TABLE public.video_assets
  ADD CONSTRAINT video_assets_founder_id_fkey
  FOREIGN KEY (founder_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. social_engagements.founder_id
ALTER TABLE public.social_engagements
  DROP CONSTRAINT IF EXISTS social_engagements_founder_id_fkey;
ALTER TABLE public.social_engagements
  ADD CONSTRAINT social_engagements_founder_id_fkey
  FOREIGN KEY (founder_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. email_campaigns.founder_id
ALTER TABLE public.email_campaigns
  DROP CONSTRAINT IF EXISTS email_campaigns_founder_id_fkey;
ALTER TABLE public.email_campaigns
  ADD CONSTRAINT email_campaigns_founder_id_fkey
  FOREIGN KEY (founder_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. platform_analytics.founder_id
ALTER TABLE public.platform_analytics
  DROP CONSTRAINT IF EXISTS platform_analytics_founder_id_fkey;
ALTER TABLE public.platform_analytics
  ADD CONSTRAINT platform_analytics_founder_id_fkey
  FOREIGN KEY (founder_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 7. advisory_cases.approval_queue_id → SET NULL (not CASCADE)
--    Deleting an approval should not delete the advisory case — just unlink it.
ALTER TABLE public.advisory_cases
  DROP CONSTRAINT IF EXISTS advisory_cases_approval_queue_id_fkey;
ALTER TABLE public.advisory_cases
  ADD CONSTRAINT advisory_cases_approval_queue_id_fkey
  FOREIGN KEY (approval_queue_id) REFERENCES public.approval_queue(id) ON DELETE SET NULL;
