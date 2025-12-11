/**
 * Platform Mode Toggle API
 * POST /api/founder/settings/platform-mode
 *
 * Admin-only endpoint to toggle Stripe mode between test and live
 * Only accessible to: phill.mcgurk@gmail.com, ranamuzamil1199@gmail.com
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';
import { getPlatformMode, setPlatformMode, isAdmin } from '@/lib/platform/platformMode';

const logger = createApiLogger({ route: '/api/founder/settings/platform-mode' });

interface SetModeRequest {
  mode: 'test' | 'live';
  reason?: string;
}

/**
 * GET - Retrieve current platform mode
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(user.email)) {
      logger.warn('Unauthorized platform mode access attempt', {
        email: user.email,
        userId: user.id,
      });
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const mode = await getPlatformMode();

    logger.info('📊 Platform mode retrieved', {
      mode,
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json({
      mode,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error retrieving platform mode', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Set platform mode (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(user.email)) {
      logger.warn('⚠️ Unauthorized platform mode change attempt', {
        email: user.email,
        userId: user.id,
      });
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body: SetModeRequest = await req.json();
    const { mode, reason } = body;

    if (!mode || !['test', 'live'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "test" or "live"' },
        { status: 400 }
      );
    }

    const result = await setPlatformMode(mode, user.id, reason);

    if (!result.success) {
      logger.error('Failed to set platform mode', {
        error: result.error,
        userId: user.id,
      });
      return NextResponse.json(
        { error: result.error || 'Failed to update mode' },
        { status: 500 }
      );
    }

    logger.info('✅ Platform mode changed', {
      newMode: mode,
      changedBy: user.email,
      reason,
    });

    return NextResponse.json({
      success: true,
      mode,
      message: `Stripe mode switched to ${mode}`,
      changedBy: user.email,
      changedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error setting platform mode', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
