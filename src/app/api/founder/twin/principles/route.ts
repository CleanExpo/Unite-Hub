/**
 * Founder Twin Principles API
 * Phase D01: Founder Cognitive Twin Kernel
 *
 * GET - List principles
 * POST - Create new principle
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listPrinciples,
  upsertPrinciple,
  normalizePrincipleWithAI,
  type PrincipleCategory,
} from '@/lib/founder/founderTwinService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const category = searchParams.get('category') as PrincipleCategory | null;
    const activeOnly = searchParams.get('activeOnly') !== 'false';
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const principles = await listPrinciples(tenantId, {
      category: category || undefined,
      activeOnly,
      limit,
    });

    return NextResponse.json({
      principles,
      count: principles.length,
    });
  } catch (error) {
    console.error('Error in principles GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, normalize, ...principleData } = body;

    if (!tenantId || !principleData.title) {
      return NextResponse.json(
        { error: 'tenantId and title are required' },
        { status: 400 }
      );
    }

    // Optionally normalize with AI
    let finalPrincipleData = principleData;
    if (normalize) {
      const normalized = await normalizePrincipleWithAI(
        principleData.title,
        principleData.description
      );
      finalPrincipleData = {
        ...principleData,
        title: normalized.normalizedTitle,
        description: normalized.normalizedDescription,
        category: principleData.category || normalized.suggestedCategory,
      };
    }

    const principle = await upsertPrinciple(tenantId, finalPrincipleData, user.id);

    return NextResponse.json({ principle }, { status: 201 });
  } catch (error) {
    console.error('Error in principles POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
