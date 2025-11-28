/**
 * Pre-Clients API Routes
 *
 * List and create pre-client profiles.
 * Part of the Client Historical Email Identity Engine.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  preClientMapperService,
  type PreClientStatus,
} from '@/lib/emailIngestion';

// GET /api/pre-clients - List pre-clients
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Parse query params
    const statusParam = req.nextUrl.searchParams.get('status');
    const engagementParam = req.nextUrl.searchParams.get('engagement');
    const search = req.nextUrl.searchParams.get('search') || undefined;
    const sortBy = req.nextUrl.searchParams.get('sortBy') as
      | 'name'
      | 'last_contact_date'
      | 'total_messages'
      | 'sentiment_score'
      | undefined;
    const sortOrder = req.nextUrl.searchParams.get('sortOrder') as
      | 'asc'
      | 'desc'
      | undefined;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    const status = statusParam
      ? (statusParam.split(',') as PreClientStatus[])
      : undefined;
    const engagementLevel = engagementParam
      ? (engagementParam.split(',') as ('cold' | 'warm' | 'hot' | 'active')[])
      : undefined;

    const result = await preClientMapperService.listPreClients(workspaceId, {
      status,
      engagementLevel,
      search,
      sortBy,
      sortOrder,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      profiles: result.profiles,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[API] GET /api/pre-clients error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/pre-clients - Create pre-client or discover from emails
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const { workspaceId, action } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create': {
        // Create single pre-client
        const { name, email, company, notes } = body;

        if (!name || !email) {
          return NextResponse.json(
            { error: 'name and email are required' },
            { status: 400 }
          );
        }

        const result = await preClientMapperService.discoverFromEmails(
          [{ email, name, company }],
          workspaceId
        );

        if (result.discovered.length > 0) {
          return NextResponse.json({
            success: true,
            preClient: result.discovered[0],
            message: 'Pre-client created',
          });
        } else if (result.existing.length > 0) {
          return NextResponse.json({
            success: true,
            preClient: result.existing[0],
            message: 'Pre-client already exists',
          });
        } else {
          return NextResponse.json(
            { error: 'Failed to create pre-client' },
            { status: 500 }
          );
        }
      }

      case 'discover': {
        // Discover pre-clients from email list
        const { emails, excludeDomains } = body;

        if (!emails || !Array.isArray(emails)) {
          return NextResponse.json(
            { error: 'emails array is required' },
            { status: 400 }
          );
        }

        const result = await preClientMapperService.discoverFromEmails(
          emails,
          workspaceId,
          excludeDomains || []
        );

        return NextResponse.json({
          success: true,
          discovered: result.discovered.length,
          existing: result.existing.length,
          skipped: result.skipped.length,
          profiles: result.discovered,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "create" or "discover"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] POST /api/pre-clients error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
