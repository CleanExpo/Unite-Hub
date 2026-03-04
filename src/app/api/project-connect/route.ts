/**
 * Project Connect API — Central endpoint for all connected projects
 * 
 * Each project (Synthex, DR, RestoreAssist, etc.) calls this endpoint
 * to register health data, push events, and sync state.
 * 
 * Authentication: x-api-key header matched against vault-stored keys
 */

import { NextRequest, NextResponse } from 'next/server';

// Project registry — maps API keys to project identifiers
// In production, these come from the vault (credentialVault.ts)
const PROJECT_REGISTRY: Record<string, { id: string; name: string; allowed: string[] }> = {
  // Keys are loaded from env/vault at runtime
};

function getProjectFromKey(apiKey: string | null): { id: string; name: string } | null {
  if (!apiKey) return null;
  
  // Check environment variables for project keys
  const projects = [
    { env: 'SYNTHEX_API_KEY', id: 'synthex', name: 'Synthex' },
    { env: 'DR_API_KEY', id: 'disaster-recovery', name: 'Disaster Recovery' },
    { env: 'RESTORE_ASSIST_API_KEY', id: 'restore-assist', name: 'RestoreAssist' },
    { env: 'CCW_API_KEY', id: 'ccw', name: 'CCW' },
    { env: 'ATO_API_KEY', id: 'ato', name: 'ATO AI' },
    { env: 'CARSI_API_KEY', id: 'carsi', name: 'CARSI' },
  ];

  for (const proj of projects) {
    if (process.env[proj.env] && process.env[proj.env] === apiKey) {
      return { id: proj.id, name: proj.name };
    }
  }

  // Also check the master key for Bron/OpenClaw access
  if (process.env.UNITE_HUB_MASTER_KEY && process.env.UNITE_HUB_MASTER_KEY === apiKey) {
    return { id: 'master', name: 'Bron (Master)' };
  }

  return null;
}

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  const project = getProjectFromKey(apiKey);

  if (!project) {
    return NextResponse.json(
      { error: 'Invalid API key', hint: 'Set x-api-key header with your project key' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: 'connected',
    project: project.name,
    timestamp: new Date().toISOString(),
    capabilities: [
      'health-check',
      'push-event',
      'sync-contacts',
      'sync-revenue',
      'get-config',
    ],
    endpoints: {
      health: '/api/project-connect/health',
      events: '/api/project-connect/events',
      contacts: '/api/project-connect/contacts',
      revenue: '/api/project-connect/revenue',
      config: '/api/project-connect/config',
    },
  });
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  const project = getProjectFromKey(apiKey);

  if (!project) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, data } = body;

    switch (type) {
      case 'health': {
        // Project reporting its health status
        // TODO: Store in Supabase project_health table
        console.log(`[project-connect] Health update from ${project.name}:`, data);
        return NextResponse.json({ received: true, type: 'health', project: project.name });
      }

      case 'event': {
        // Project pushing an event (new user, payment, error, etc.)
        // TODO: Store in Supabase project_events table
        console.log(`[project-connect] Event from ${project.name}:`, data);
        return NextResponse.json({ received: true, type: 'event', project: project.name });
      }

      case 'revenue': {
        // Project reporting revenue data
        // TODO: Store in Supabase project_revenue table
        console.log(`[project-connect] Revenue from ${project.name}:`, data);
        return NextResponse.json({ received: true, type: 'revenue', project: project.name });
      }

      case 'contacts': {
        // Project syncing contacts
        // TODO: Merge with CRM contacts table
        console.log(`[project-connect] Contacts from ${project.name}:`, data);
        return NextResponse.json({ received: true, type: 'contacts', project: project.name });
      }

      default:
        return NextResponse.json(
          { error: `Unknown event type: ${type}`, allowed: ['health', 'event', 'revenue', 'contacts'] },
          { status: 400 }
        );
    }
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
