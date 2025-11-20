/**
 * Leviathan Fabricate API
 * POST - Generate text, schema, and media assets for a target URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { entityGraphService } from '@/lib/services/leviathan/EntityGraphService';
import { rewriteEngine } from '@/lib/services/leviathan/RewriteEngine';
import { fabricatorService } from '@/lib/services/leviathan/FabricatorService';
import { ogImageGenerator } from '@/lib/services/leviathan/OGImageGenerator';

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
    const {
      orgId,
      graphId,
      url,
      content,
      entityType = 'webpage',
      name,
      options = {},
    } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    if (!content && !url) {
      return NextResponse.json({ error: 'content or url is required' }, { status: 400 });
    }

    // Verify user has access to org
    const supabase = await getSupabaseServer();
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Set seed for deterministic output
    const seed = options.seed || Math.floor(Math.random() * 1000000);
    fabricatorService.setSeed(seed);

    // Extract entities from content
    const extractedEntities = content
      ? entityGraphService.extractEntities(content)
      : [];

    // Create or get graph
    let targetGraphId = graphId;
    if (!targetGraphId) {
      const graph = await entityGraphService.createGraph(orgId, name || url || 'Fabricated Content', {
        domain: url ? new URL(url).hostname : undefined,
      });
      targetGraphId = graph.id;
    }

    // Create main entity node
    const mainNode = await entityGraphService.createNode(
      targetGraphId,
      entityType,
      name || url || 'Untitled',
      {
        canonicalUrl: url,
        description: content?.substring(0, 500),
      }
    );

    // Add extracted entities as attributes
    for (const entity of extractedEntities) {
      for (const [key, value] of Object.entries(entity.attributes)) {
        await entityGraphService.addAttribute(mainNode.id, key, value, {
          source: 'extraction',
          confidence: entity.confidence,
        });
      }
    }

    // Get node attributes
    const attributes = await entityGraphService.getNodeAttributes(mainNode.id);

    // Generate content variants using RewriteEngine
    let variants: string[] = [];
    if (content) {
      const rewriteResult = await rewriteEngine.rewrite(content, {
        variants: options.variants || 3,
        tone: options.tone,
        keywords: options.keywords,
        targetAudience: options.targetAudience,
        seed,
      });
      variants = rewriteResult.variants;
    }

    // Generate sameAs URLs if provided
    const sameAsUrls = options.sameAsUrls || [];

    // Fabricate output
    const fabricationOutput = fabricatorService.fabricate(
      {
        entity: mainNode,
        attributes,
        variants,
        sameAsUrls,
      },
      0
    );

    // Generate OG image
    const ogImage = ogImageGenerator.generate({
      title: name || mainNode.name,
      subtitle: content?.substring(0, 100) || mainNode.description?.substring(0, 100),
      seed,
      pattern: options.pattern,
    });

    // Record fabrication history
    await supabase.from('fabrication_history').insert({
      org_id: orgId,
      graph_id: targetGraphId,
      node_id: mainNode.id,
      fabrication_type: 'full_page',
      input_url: url,
      input_content: content?.substring(0, 5000),
      output_type: 'mixed',
      output_content: JSON.stringify({
        schema: fabricationOutput.schema,
        html: fabricationOutput.html,
        ogImage: { ...ogImage, svg: ogImage.svg.substring(0, 500) + '...' },
      }),
      model_used: 'gemini-1.5-flash',
      variation_seed: seed,
      variation_index: 0,
      metadata: {
        entityType,
        extractedEntities: extractedEntities.length,
        variants: variants.length,
      },
    });

    // Return fabrication result
    return NextResponse.json({
      success: true,
      data: {
        graphId: targetGraphId,
        nodeId: mainNode.id,
        schema: fabricationOutput.schema,
        html: fabricationOutput.html,
        ogImage: {
          svg: ogImage.svg,
          width: ogImage.width,
          height: ogImage.height,
          hash: ogImageGenerator.generateHash({
            title: mainNode.name,
            seed,
          }),
        },
        variants,
        extractedEntities,
        metadata: {
          seed,
          generatedAt: new Date().toISOString(),
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in fabrication:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const orgId = req.nextUrl.searchParams.get('orgId');
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    // Verify user has access
    const supabase = await getSupabaseServer();
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get fabrication history
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const graphId = req.nextUrl.searchParams.get('graphId');

    let query = supabase
      .from('fabrication_history')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (graphId) {
      query = query.eq('graph_id', graphId);
    }

    const { data: history, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ history: history || [] });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
