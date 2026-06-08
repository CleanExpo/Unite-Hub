-- Dedicated drip campaign lifecycle tables.
-- Additive only: no existing tables, columns, constraints, or policies are altered.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'contacts_id_founder_id_key'
      AND conrelid = 'public.contacts'::regclass
  ) THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_id_founder_id_key UNIQUE (id, founder_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.drip_campaigns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_key  text NOT NULL,
  name          text NOT NULL,
  subject       text NOT NULL,
  body_html     text NOT NULL,
  body_text     text,
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'active', 'paused', 'completed', 'partial', 'archived')),
  source        text NOT NULL DEFAULT 'api',
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, founder_id)
);

CREATE TABLE IF NOT EXISTS public.drip_steps (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id    uuid NOT NULL,
  step_order     integer NOT NULL CHECK (step_order > 0),
  subject        text NOT NULL,
  body_html      text NOT NULL,
  body_text      text,
  delay_minutes  integer NOT NULL DEFAULT 0 CHECK (delay_minutes >= 0),
  metadata       jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, founder_id),
  UNIQUE (campaign_id, step_order),
  FOREIGN KEY (campaign_id, founder_id)
    REFERENCES public.drip_campaigns(id, founder_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.drip_enrollments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id         uuid NOT NULL,
  contact_id          uuid NOT NULL,
  email               text NOT NULL,
  name                text,
  status              text NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'completed', 'paused', 'failed', 'cancelled')),
  current_step_order  integer NOT NULL DEFAULT 1 CHECK (current_step_order > 0),
  next_run_at         timestamptz NOT NULL DEFAULT now(),
  enrolled_at         timestamptz NOT NULL DEFAULT now(),
  completed_at        timestamptz,
  metadata            jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, founder_id),
  UNIQUE (campaign_id, contact_id),
  FOREIGN KEY (campaign_id, founder_id)
    REFERENCES public.drip_campaigns(id, founder_id)
    ON DELETE CASCADE,
  FOREIGN KEY (contact_id, founder_id)
    REFERENCES public.contacts(id, founder_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.drip_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id     uuid NOT NULL,
  enrollment_id   uuid NOT NULL,
  contact_id      uuid NOT NULL,
  step_id         uuid,
  event_type      text NOT NULL CHECK (event_type IN ('dry_run_processed', 'skipped', 'failed')),
  provider_send   text NOT NULL DEFAULT 'not_attempted',
  metadata        jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (campaign_id, founder_id)
    REFERENCES public.drip_campaigns(id, founder_id)
    ON DELETE CASCADE,
  FOREIGN KEY (enrollment_id, founder_id)
    REFERENCES public.drip_enrollments(id, founder_id)
    ON DELETE CASCADE,
  FOREIGN KEY (contact_id, founder_id)
    REFERENCES public.contacts(id, founder_id)
    ON DELETE CASCADE,
  FOREIGN KEY (step_id, founder_id)
    REFERENCES public.drip_steps(id, founder_id)
    ON DELETE SET NULL (step_id)
);

CREATE INDEX IF NOT EXISTS drip_campaigns_founder_status_idx
  ON public.drip_campaigns(founder_id, status);
CREATE INDEX IF NOT EXISTS drip_steps_founder_campaign_order_idx
  ON public.drip_steps(founder_id, campaign_id, step_order);
CREATE INDEX IF NOT EXISTS drip_enrollments_founder_campaign_status_idx
  ON public.drip_enrollments(founder_id, campaign_id, status, next_run_at);
CREATE INDEX IF NOT EXISTS drip_events_founder_campaign_created_idx
  ON public.drip_events(founder_id, campaign_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'drip_campaigns_updated_at'
      AND tgrelid = 'public.drip_campaigns'::regclass
  ) THEN
    CREATE TRIGGER drip_campaigns_updated_at
      BEFORE UPDATE ON public.drip_campaigns
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'drip_steps_updated_at'
      AND tgrelid = 'public.drip_steps'::regclass
  ) THEN
    CREATE TRIGGER drip_steps_updated_at
      BEFORE UPDATE ON public.drip_steps
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'drip_enrollments_updated_at'
      AND tgrelid = 'public.drip_enrollments'::regclass
  ) THEN
    CREATE TRIGGER drip_enrollments_updated_at
      BEFORE UPDATE ON public.drip_enrollments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

ALTER TABLE public.drip_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drip_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drip_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drip_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.drip_campaigns,
  public.drip_steps,
  public.drip_enrollments,
  public.drip_events
TO authenticated, service_role;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['drip_campaigns', 'drip_steps', 'drip_enrollments', 'drip_events']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name
        AND policyname = table_name || '_founder_all'
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid())',
        table_name || '_founder_all',
        table_name
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name
        AND policyname = table_name || '_service_role_all'
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')',
        table_name || '_service_role_all',
        table_name
      );
    END IF;
  END LOOP;
END $$;
