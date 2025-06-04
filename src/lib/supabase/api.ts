import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client for use in API routes
 * This doesn't use cookies and is suitable for server-side API calls
 */
export function createApiClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  // Detailed error reporting for missing environment variables
  const missingVars: string[] = [];
  
  if (!supabaseUrl) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  }
  
  if (!supabaseKey) {
    missingVars.push('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY');
  }

  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}. ` +
      `Please ensure these are set in your Vercel dashboard under Settings > Environment Variables.`;
    console.error('[Supabase API Client Error]', errorMessage);
    throw new Error(errorMessage);
  }

  // Additional validation - at this point we know they exist
  if (!supabaseUrl || supabaseUrl.length < 10 || !supabaseUrl.includes('supabase')) {
    throw new Error(`Invalid SUPABASE_URL format: ${supabaseUrl?.substring(0, 20) || 'undefined'}...`);
  }

  if (!supabaseKey || supabaseKey.length < 10) {
    throw new Error('Invalid SUPABASE_SERVICE_ROLE_KEY: Key appears to be too short');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
