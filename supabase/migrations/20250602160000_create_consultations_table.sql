-- Create consultations table
CREATE TABLE public.consultations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_name text NOT NULL,
    client_email text NOT NULL,
    company text,
    phone text,
    service_type text NOT NULL,
    preferred_date timestamp with time zone,
    preferred_time text,
    alternate_date timestamp with time zone,
    message text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    scheduled_at timestamp with time zone,
    duration_minutes integer DEFAULT 60,
    meeting_link text,
    meeting_notes text,
    payment_status text DEFAULT 'unpaid'::text,
    payment_amount numeric(10,2) DEFAULT 550.00
);

-- Create primary key
ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_pkey PRIMARY KEY (id);

-- Create indexes
CREATE INDEX consultations_client_email_idx ON public.consultations USING btree (client_email);
CREATE INDEX consultations_created_at_idx ON public.consultations USING btree (created_at);
CREATE INDEX consultations_scheduled_at_idx ON public.consultations USING btree (scheduled_at);
CREATE INDEX consultations_status_idx ON public.consultations USING btree (status);
CREATE INDEX consultations_user_id_idx ON public.consultations USING btree (user_id);

-- Add foreign key constraint
ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER set_consultations_updated_at BEFORE UPDATE ON public.consultations 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
