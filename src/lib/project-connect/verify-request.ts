/**
 * Shared API key verification for connector endpoints.
 * Validates x-api-key header against connected_projects table.
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyApiKey } from './api-keys';

interface VerifiedProject {
  id: string;
  name: string;
  slug: string;
}

export async function verifyConnectorRequest(
  req: NextRequest
): Promise<{ project: VerifiedProject } | { error: string; status: number }> {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) {
    return { error: 'Missing x-api-key header', status: 401 };
  }

  // Extract prefix for lookup (first 12 chars)
  const prefix = apiKey.slice(0, 12);

  const { data: projects, error } = await supabaseAdmin
    .from('connected_projects')
    .select('id, name, slug, api_key_hash')
    .eq('api_key_prefix', prefix)
    .limit(1);

  if (error || !projects?.length) {
    return { error: 'Invalid API key', status: 401 };
  }

  const project = projects[0];

  if (!project.api_key_hash || !verifyApiKey(apiKey, project.api_key_hash)) {
    return { error: 'Invalid API key', status: 401 };
  }

  // Update last_seen_at
  await supabaseAdmin
    .from('connected_projects')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', project.id);

  return {
    project: { id: project.id, name: project.name, slug: project.slug },
  };
}
