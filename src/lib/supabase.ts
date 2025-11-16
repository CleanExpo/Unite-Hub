import { createClient } from "@supabase/supabase-js";
import { createServerClient as createSSRServerClient, type CookieOptions } from '@supabase/ssr';

// Get environment variables with proper fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
}

// Client-side (browser) - lazy initialization
let _supabaseBrowser: ReturnType<typeof createClient> | null = null;

function getSupabaseBrowser() {
  if (!_supabaseBrowser) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables are not configured. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    _supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Enable session persistence in localStorage
        persistSession: true,
        // Automatically refresh tokens before they expire
        autoRefreshToken: true,
        // Detect session in URL (for OAuth callbacks)
        detectSessionInUrl: true,
        // Use localStorage for session storage (browser only)
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        // Flow type for OAuth (implicit flow as currently used)
        flowType: 'implicit',
      },
    });
  }
  return _supabaseBrowser;
}

// Export lazy-initialized client
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    return getSupabaseBrowser()[prop as keyof ReturnType<typeof createClient>];
  }
});

export const supabaseBrowser = supabase; // Alias for clarity

// Server-side (API routes) - creates a client that reads session from cookies
// NOTE: This uses '@supabase/ssr' to properly read session from cookies
export async function getSupabaseServer() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  return createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Cookie setting can fail in Server Components
            // This is expected and safe to ignore
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Cookie removal can fail in Server Components
            // This is expected and safe to ignore
          }
        },
      },
    }
  );
}

// Removed supabaseServer Proxy - it cannot work with async getSupabaseServer()
// Always use: const supabase = await getSupabaseServer();

// Admin client (service role) - bypasses RLS, use for server-side operations
// Lazy initialization to ensure environment variables are available
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !url) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL not configured');
    }

    _supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return _supabaseAdmin;
}

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
