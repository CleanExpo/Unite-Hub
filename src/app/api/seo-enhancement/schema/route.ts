/**
 * Schema/Rich Results API Route
 * POST - Generate schema markup
 * GET - Get schemas or check rich result opportunities
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { richResultsService, SchemaType } from '@/lib/seoEnhancement';

export async function POST(req: NextRequest) {
  try {
    // Auth check
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
    const { workspaceId, url, schemaType, pageInfo, action } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Check rich result opportunity
    if (action === 'checkOpportunity') {
      const { keyword } = body;
      if (!url || !keyword) {
        return NextResponse.json(
          { error: 'url and keyword are required for opportunity check' },
          { status: 400 }
        );
      }

      const opportunity = await richResultsService.checkRichResultOpportunity(
        workspaceId,
        url,
        keyword
      );

      return NextResponse.json({ opportunity });
    }

    // Generate schema
    if (!url || !schemaType) {
      return NextResponse.json(
        { error: 'url and schemaType are required' },
        { status: 400 }
      );
    }

    const schema = await richResultsService.generateSchema(
      workspaceId,
      url,
      schemaType as SchemaType,
      pageInfo
    );

    // Generate script tag
    const scriptTag = richResultsService.generateSchemaScript(schema.schema_json);

    return NextResponse.json({ schema, scriptTag });
  } catch (error) {
    console.error('[API] Schema POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Auth check
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

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const url = searchParams.get('url');
    const schemaType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');
    const monitoring = searchParams.get('monitoring') === 'true';

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    if (monitoring) {
      const results = await richResultsService.getRichResultMonitoring(workspaceId, {
        url: url || undefined,
        limit,
      });
      return NextResponse.json({ monitoring: results });
    }

    const schemas = await richResultsService.getSchemas(workspaceId, {
      url: url || undefined,
      type: schemaType as SchemaType | undefined,
      limit,
    });

    return NextResponse.json({ schemas });
  } catch (error) {
    console.error('[API] Schema GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
