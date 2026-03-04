/**
 * GET /api/founder/graph/data
 *
 * Builds knowledge graph nodes and edges from contacts.
 * Uses RLS-scoped client so workspace isolation is automatic.
 *
 * Returns:
 *   { nodes: Node[], edges: Edge[], meta: { contactCount, businessCount } }
 */

import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  type: 'contact' | 'business';
  data: {
    label: string;
    business?: string;
    status?: string;
    tags?: string[];
    notePath?: string;
  };
  position: { x: number; y: number };
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await getSupabaseServer();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Fetch contacts — RLS automatically scopes to the user's workspace
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, name, company, status, tags, obsidian_note_path')
      .limit(200)
      .order('name', { ascending: true });

    if (contactsError) {
      // Table may not have obsidian_note_path column yet — retry without it
      if (
        contactsError.message?.includes('obsidian_note_path') ||
        contactsError.code === '42703'
      ) {
        const { data: fallbackContacts, error: fallbackError } = await supabase
          .from('contacts')
          .select('id, name, company, status, tags')
          .limit(200)
          .order('name', { ascending: true });

        if (fallbackError) {
          console.error('[GET /api/founder/graph/data]', fallbackError.message);
          return NextResponse.json(
            { error: fallbackError.message },
            { status: 500 }
          );
        }

        return buildResponse((fallbackContacts ?? []).map((c) => ({ ...c, obsidian_note_path: null })));
      }

      console.error('[GET /api/founder/graph/data]', contactsError.message);
      return NextResponse.json({ error: contactsError.message }, { status: 500 });
    }

    return buildResponse(contacts ?? []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[GET /api/founder/graph/data] Unexpected:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Graph builder ────────────────────────────────────────────────────────────

function buildResponse(
  contacts: Array<{
    id: string;
    name: string | null;
    company: string | null;
    status: string | null;
    tags: string[] | null;
    obsidian_note_path: string | null;
  }>
) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Track unique business names to avoid duplicate business nodes
  const seenBusinesses = new Set<string>();

  for (const contact of contacts) {
    const name = contact.name?.trim() || 'Unknown';
    const company = contact.company?.trim() || null;

    // Contact node
    const contactNodeId = `contact:${contact.id}`;
    nodes.push({
      id: contactNodeId,
      type: 'contact',
      data: {
        label: name,
        business: company ?? undefined,
        status: contact.status ?? undefined,
        tags: contact.tags ?? [],
        notePath: contact.obsidian_note_path ?? undefined,
      },
      position: { x: 0, y: 0 }, // dagre will override on the client
    });

    // Business node + edge (only for non-null, non-empty companies)
    if (company) {
      const businessNodeId = `business:${company}`;

      if (!seenBusinesses.has(company)) {
        seenBusinesses.add(company);
        nodes.push({
          id: businessNodeId,
          type: 'business',
          data: { label: company },
          position: { x: 0, y: 0 },
        });
      }

      edges.push({
        id: `e-${contact.id}-${company}`,
        source: contactNodeId,
        target: businessNodeId,
        label: 'works at',
      });
    }
  }

  return NextResponse.json({
    nodes,
    edges,
    meta: {
      contactCount: contacts.length,
      businessCount: seenBusinesses.size,
    },
  });
}
