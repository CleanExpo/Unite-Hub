import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

// Types
export interface Organization {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  team_size?: string;
  industry?: string;
  plan: "starter" | "professional" | "enterprise";
  status: "active" | "trial" | "cancelled";
  trial_ends_at?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  workspace_id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  job_title?: string;
  ai_score: number;
  status: "prospect" | "lead" | "customer" | "contact";
  last_interaction?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Email {
  id: string;
  workspace_id: string;
  contact_id?: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  ai_summary?: string;
  is_processed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Content {
  id: string;
  workspace_id: string;
  contact_id: string;
  title: string;
  content_type: "followup" | "proposal" | "case_study";
  generated_text: string;
  ai_model: string;
  status: "draft" | "approved" | "sent";
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  status: "draft" | "scheduled" | "active" | "completed" | "paused";
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  replied_count: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  org_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  agent: string;
  status: "success" | "error" | "warning";
  error_message?: string;
  details: Record<string, any>;
  created_at: string;
}
