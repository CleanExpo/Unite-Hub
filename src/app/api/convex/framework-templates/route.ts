/**
 * API Route: /api/convex/framework-templates
 *
 * Handles framework template library operations:
 * - GET: List templates, search templates
 * - POST: Clone template, rate template, save feedback
 * - DELETE: Remove template from library
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { logger } from '@/lib/logging';

interface FrameworkTemplate {
  id: string;
  name: string;
  description: string;
  category: 'brand' | 'funnel' | 'seo' | 'competitor' | 'offer';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  industry?: string;
  components: number;
  rating: number;
  downloads: number;
  uses: number;
  createdBy: string;
  createdAt: string;
  preview?: {
    frameworks: string[];
    metrics: Record<string, number>;
  };
}

// Built-in template library
const TEMPLATE_LIBRARY: FrameworkTemplate[] = [
  {
    id: 'tpl_brand_001',
    name: 'Brand Positioning Framework',
    description: 'Comprehensive brand positioning strategy with USP, personality, and messaging pillars',
    category: 'brand',
    difficulty: 'beginner',
    components: 8,
    rating: 4.8,
    downloads: 1243,
    uses: 856,
    createdBy: 'CONVEX Team',
    createdAt: '2025-01-01',
    preview: {
      frameworks: ['Value Proposition', 'Brand Personality', 'Messaging Pillars'],
      metrics: {
        'Brand Clarity': 92,
        'Market Fit': 88,
        'Differentiation': 91,
      },
    },
  },
  {
    id: 'tpl_funnel_001',
    name: 'Sales Funnel Optimizer',
    description: 'Multi-stage sales funnel with conversion optimization at each stage',
    category: 'funnel',
    difficulty: 'intermediate',
    components: 12,
    rating: 4.7,
    downloads: 987,
    uses: 743,
    createdBy: 'CONVEX Team',
    createdAt: '2025-01-05',
    preview: {
      frameworks: ['Awareness', 'Consideration', 'Decision', 'Conversion'],
      metrics: {
        'Top-of-Funnel': 2400,
        'Conversion Rate': 3.2,
        'Customer LTV': 4200,
      },
    },
  },
  {
    id: 'tpl_seo_001',
    name: 'SEO Authority Framework',
    description: 'Technical SEO, content strategy, and authority building framework',
    category: 'seo',
    difficulty: 'advanced',
    components: 15,
    rating: 4.9,
    downloads: 1156,
    uses: 892,
    createdBy: 'CONVEX Team',
    createdAt: '2025-01-08',
    preview: {
      frameworks: ['Technical SEO', 'Content Clusters', 'Link Building', 'E-E-A-T'],
      metrics: {
        'Organic Traffic': 15400,
        'Ranking Keywords': 287,
        'Domain Authority': 62,
      },
    },
  },
  {
    id: 'tpl_competitor_001',
    name: 'Competitor Intelligence Matrix',
    description: 'Comprehensive competitor analysis with positioning and strategy mapping',
    category: 'competitor',
    difficulty: 'intermediate',
    components: 10,
    rating: 4.6,
    downloads: 734,
    uses: 521,
    createdBy: 'CONVEX Team',
    createdAt: '2025-01-10',
    preview: {
      frameworks: ['SWOT Analysis', 'Positioning Map', 'Pricing Strategy'],
      metrics: {
        'Competitor Count': 8,
        'Market Share': 24,
        'Price Differential': 12,
      },
    },
  },
  {
    id: 'tpl_offer_001',
    name: 'Value Proposition Canvas',
    description: 'Customer-centric offer design with problem-solution mapping',
    category: 'offer',
    difficulty: 'beginner',
    components: 7,
    rating: 4.8,
    downloads: 1089,
    uses: 734,
    createdBy: 'CONVEX Team',
    createdAt: '2025-01-12',
    preview: {
      frameworks: ['Customer Segment', 'Value Proposition', 'Fit Analysis'],
      metrics: {
        'Problem Fit': 94,
        'Solution Fit': 91,
        'Market Readiness': 88,
      },
    },
  },
  {
    id: 'tpl_brand_002',
    name: 'B2B Brand Strategy',
    description: 'Tailored brand strategy for B2B companies with thought leadership focus',
    category: 'brand',
    difficulty: 'intermediate',
    components: 11,
    rating: 4.7,
    downloads: 645,
    uses: 432,
    createdBy: 'CONVEX Team',
    createdAt: '2025-01-15',
    preview: {
      frameworks: ['Industry Authority', 'Partnership Strategy', 'Content Marketing'],
      metrics: {
        'Brand Awareness': 76,
        'Lead Quality': 89,
        'Deal Size': 145000,
      },
    },
  },
  {
    id: 'tpl_funnel_002',
    name: 'SaaS Growth Funnel',
    description: 'Free trial to paying customer funnel with activation metrics',
    category: 'funnel',
    difficulty: 'advanced',
    components: 14,
    rating: 4.9,
    downloads: 823,
    uses: 612,
    createdBy: 'CONVEX Team',
    createdAt: '2025-01-18',
    preview: {
      frameworks: ['Signup', 'Activation', 'Retention', 'Expansion'],
      metrics: {
        'Free-to-Paid': 8.2,
        'Monthly Churn': 4.3,
        'LTV:CAC Ratio': 4.1,
      },
    },
  },
  {
    id: 'tpl_seo_002',
    name: 'Local SEO Domination',
    description: 'Local search optimization for service-based businesses',
    category: 'seo',
    difficulty: 'intermediate',
    components: 9,
    rating: 4.8,
    downloads: 567,
    uses: 398,
    createdBy: 'CONVEX Team',
    createdAt: '2025-01-20',
    preview: {
      frameworks: ['Google Business', 'Local Citations', 'Review Strategy'],
      metrics: {
        'Local Ranking': 94,
        'Review Score': 4.7,
        'Local Traffic': 2800,
      },
    },
  },
];

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const action = req.nextUrl.searchParams.get('action') || 'list';
    const searchTerm = req.nextUrl.searchParams.get('search') || '';
    const category = req.nextUrl.searchParams.get('category') || 'all';
    const difficulty = req.nextUrl.searchParams.get('difficulty') || 'all';
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    // Filter templates
    let filtered = TEMPLATE_LIBRARY;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term)
      );
    }

    if (category !== 'all') {
      filtered = filtered.filter((t) => t.category === category);
    }

    if (difficulty !== 'all') {
      filtered = filtered.filter((t) => t.difficulty === difficulty);
    }

    // Sort by rating
    filtered.sort((a, b) => b.rating - a.rating);

    // Apply pagination
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    logger.info(`[TEMPLATES] Listed ${paginated.length} templates`);

    return NextResponse.json({
      templates: paginated,
      total,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('[TEMPLATES] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    }

    const body = await req.json();
    const { workspaceId, action, templateId, rating, feedback } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Check workspace access
    const { data: orgData, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('org_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (orgError || !orgData || !['owner', 'editor'].includes(orgData.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (action === 'clone') {
      // Clone template to custom framework
      if (!templateId) {
        return NextResponse.json(
          { error: 'Missing templateId' },
          { status: 400 }
        );
      }

      const template = TEMPLATE_LIBRARY.find((t) => t.id === templateId);
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      // Create custom framework from template
      const { data, error } = await supabase
        .from('convex_custom_frameworks')
        .insert([
          {
            workspace_id: workspaceId,
            name: `${template.name} (Custom)`,
            description: template.description,
            framework_type: template.category,
            created_by: userId,
            is_public: false,
            template_source_id: templateId,
          },
        ])
        .select()
        .single();

      if (error) {
        logger.error('[TEMPLATES] Clone error:', error);
        return NextResponse.json(
          { error: 'Failed to clone template' },
          { status: 500 }
        );
      }

      // Update template download count
      const templateIndex = TEMPLATE_LIBRARY.findIndex((t) => t.id === templateId);
      if (templateIndex !== -1) {
        TEMPLATE_LIBRARY[templateIndex].downloads += 1;
      }

      logger.info(`[TEMPLATES] Template cloned: ${templateId}`);
      return NextResponse.json(data, { status: 201 });
    }

    if (action === 'rate') {
      // Rate template
      if (!templateId || rating === undefined) {
        return NextResponse.json(
          { error: 'Missing templateId or rating' },
          { status: 400 }
        );
      }

      // Store rating in database
      const { error } = await supabase
        .from('convex_template_ratings')
        .upsert(
          [
            {
              template_id: templateId,
              user_id: userId,
              workspace_id: workspaceId,
              rating,
              feedback,
            },
          ],
          { onConflict: 'template_id, user_id' }
        );

      if (error) {
        logger.error('[TEMPLATES] Rate error:', error);
        return NextResponse.json(
          { error: 'Failed to rate template' },
          { status: 500 }
        );
      }

      logger.info(`[TEMPLATES] Template rated: ${templateId} - ${rating}/5`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('[TEMPLATES] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
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
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    }

    const body = await req.json();
    const { workspaceId, templateId } = body;

    if (!workspaceId || !templateId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Check workspace access (owner only)
    const { data: orgData, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('org_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (orgError || !orgData || orgData.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can delete templates' },
        { status: 403 }
      );
    }

    // Delete template ratings
    await supabase
      .from('convex_template_ratings')
      .delete()
      .eq('template_id', templateId);

    logger.info(`[TEMPLATES] Template deleted: ${templateId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[TEMPLATES] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
