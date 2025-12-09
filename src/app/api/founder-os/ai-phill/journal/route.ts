import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { apiRateLimit } from '@/lib/rate-limit';
import {
  getEntries,
  createEntry,
  type CreateJournalEntryInput,
  type JournalFilters,
} from '@/lib/founderOS/founderJournalService';

/**
 * GET /api/founder-os/ai-phill/journal
 * List journal entries for the authenticated founder
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[founder-os/ai-phill/journal] GET request received');

    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get authenticated user ID
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    // Build filters from query parameters
    const filters: JournalFilters = {};

    const businessId = req.nextUrl.searchParams.get('businessId');
    if (businessId) {
filters.businessId = businessId;
}

    const tags = req.nextUrl.searchParams.get('tags');
    if (tags) {
filters.tags = tags.split(',').map((t) => t.trim());
}

    const dateFrom = req.nextUrl.searchParams.get('dateFrom');
    if (dateFrom) {
filters.dateFrom = dateFrom;
}

    const dateTo = req.nextUrl.searchParams.get('dateTo');
    if (dateTo) {
filters.dateTo = dateTo;
}

    const searchTerm = req.nextUrl.searchParams.get('search');
    if (searchTerm) {
filters.searchTerm = searchTerm;
}

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10);
    filters.limit = limit;

    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0', 10);
    if (offset > 0) {
filters.offset = offset;
}

    // Get journal entries
    const result = await getEntries(userId, filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('[founder-os/ai-phill/journal] Retrieved', result.data?.length || 0, 'entries');

    return NextResponse.json({
      success: true,
      entries: result.data || [],
    });
  } catch (error) {
    console.error('[founder-os/ai-phill/journal] GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/founder-os/ai-phill/journal
 * Create a new journal entry
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[founder-os/ai-phill/journal] POST request received');

    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get authenticated user ID
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    // Parse request body
    const body = await req.json();
    const { title, body: entryBody, tags, businessId } = body;

    // Validate required fields
    if (!entryBody) {
      return NextResponse.json({ error: 'Missing required field: body' }, { status: 400 });
    }

    // Create journal entry input
    const entryData: CreateJournalEntryInput = {
      title,
      body: entryBody,
      tags,
      businessId,
    };

    // Create the journal entry
    const result = await createEntry(userId, entryData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log('[founder-os/ai-phill/journal] Entry created:', result.data?.id);

    return NextResponse.json({
      success: true,
      entry: result.data,
    });
  } catch (error) {
    console.error('[founder-os/ai-phill/journal] POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
