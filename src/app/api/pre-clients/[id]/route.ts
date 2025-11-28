/**
 * Pre-Client Detail API Routes
 *
 * Get, update, delete individual pre-client.
 * Part of the Client Historical Email Identity Engine.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { preClientMapperService } from '@/lib/emailIngestion';

// GET /api/pre-clients/[id] - Get pre-client details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const preClient = await preClientMapperService.getPreClient(id, workspaceId);

    if (!preClient) {
      return NextResponse.json(
        { error: 'Pre-client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      preClient,
    });
  } catch (error) {
    console.error('[API] GET /api/pre-clients/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/pre-clients/[id] - Update pre-client
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { workspaceId, name, company, notes, status } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const updated = await preClientMapperService.updatePreClient(
      id,
      workspaceId,
      { name, company, notes, status }
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update pre-client' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preClient: updated,
    });
  } catch (error) {
    console.error('[API] PATCH /api/pre-clients/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/pre-clients/[id] - Delete or archive pre-client
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const hardDelete = req.nextUrl.searchParams.get('hard') === 'true';

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    let success: boolean;

    if (hardDelete) {
      success = await preClientMapperService.delete(id, workspaceId);
    } else {
      success = await preClientMapperService.archive(id, workspaceId);
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete pre-client' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Pre-client deleted' : 'Pre-client archived',
    });
  } catch (error) {
    console.error('[API] DELETE /api/pre-clients/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/pre-clients/[id] - Special actions (convert, enrich, merge)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      case 'convert': {
        // Convert to CRM contact
        const { tags, customFields } = body;
        const result = await preClientMapperService.convertToContact(
          id,
          workspaceId,
          { tags, customFields }
        );

        if (!result.success) {
          return NextResponse.json(
            { error: result.error || 'Conversion failed' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          contactId: result.contactId,
          message: 'Pre-client converted to contact',
        });
      }

      case 'enrich': {
        // Enrich profile with AI
        const enriched = await preClientMapperService.enrichProfile(
          id,
          workspaceId
        );

        return NextResponse.json({
          success: true,
          preClient: enriched,
          message: 'Profile enriched',
        });
      }

      case 'merge': {
        // Merge duplicates
        const { duplicateIds } = body;

        if (!duplicateIds || !Array.isArray(duplicateIds)) {
          return NextResponse.json(
            { error: 'duplicateIds array is required' },
            { status: 400 }
          );
        }

        const success = await preClientMapperService.mergeDuplicates(
          id,
          duplicateIds,
          workspaceId
        );

        return NextResponse.json({
          success,
          message: success ? 'Profiles merged' : 'Merge failed',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "convert", "enrich", or "merge"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] POST /api/pre-clients/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
