/**
 * Synthex Knowledge Graph Search API
 * Phase B29: Knowledge Graph Engine
 *
 * POST - Semantic vector search and AI-powered operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  searchByEmbedding,
  autoLinkContentToKeywords,
  suggestClusters,
  generateTopicMap,
  importSEOReportToGraph,
  importAudienceToGraph,
  getGraphStats,
} from '@/lib/synthex/knowledgeGraphService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenant_id, action, ...params } = body;

    if (!tenant_id || !action) {
      return NextResponse.json(
        { error: 'tenant_id and action are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'search_embedding': {
        // Semantic search by embedding vector
        const { embedding, limit = 10 } = params;
        if (!embedding || !Array.isArray(embedding)) {
          return NextResponse.json({ error: 'embedding array is required' }, { status: 400 });
        }
        const results = await searchByEmbedding(tenant_id, embedding, limit);
        return NextResponse.json({ results });
      }

      case 'auto_link_keywords': {
        // Auto-link content to keywords
        const { content_node_id, content_text } = params;
        if (!content_node_id || !content_text) {
          return NextResponse.json(
            { error: 'content_node_id and content_text are required' },
            { status: 400 }
          );
        }
        const edges = await autoLinkContentToKeywords(tenant_id, content_node_id, content_text);
        return NextResponse.json({ edges, count: edges.length });
      }

      case 'suggest_clusters': {
        // AI-powered cluster suggestions
        const clusters = await suggestClusters(tenant_id);
        return NextResponse.json({ clusters });
      }

      case 'generate_topic_map': {
        // Generate topic map for visualization
        const topicMap = await generateTopicMap(tenant_id);
        return NextResponse.json({ topicMap });
      }

      case 'import_seo_report': {
        // Import SEO report keywords into graph
        const { report_id, keywords } = params;
        if (!report_id || !keywords || !Array.isArray(keywords)) {
          return NextResponse.json(
            { error: 'report_id and keywords array are required' },
            { status: 400 }
          );
        }
        const result = await importSEOReportToGraph(tenant_id, report_id, keywords);
        return NextResponse.json(result);
      }

      case 'import_audiences': {
        // Import audience data into graph
        const { audiences } = params;
        if (!audiences || !Array.isArray(audiences)) {
          return NextResponse.json({ error: 'audiences array is required' }, { status: 400 });
        }
        const result = await importAudienceToGraph(tenant_id, audiences);
        return NextResponse.json(result);
      }

      case 'get_stats': {
        // Get graph statistics
        const stats = await getGraphStats(tenant_id);
        return NextResponse.json({ stats });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in knowledge search POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for simple stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const stats = await getGraphStats(tenantId);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error in knowledge search GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
