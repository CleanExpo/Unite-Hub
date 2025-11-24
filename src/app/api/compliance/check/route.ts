/**
 * Compliance Check API
 * Phase 93: Run compliance check on content
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import {
  checkContent,
  createComplianceReport,
} from '@/lib/compliance';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { text, regionSlug, platform, mediaMeta } = body;

    if (!text || !regionSlug || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: text, regionSlug, platform' },
        { status: 400 }
      );
    }

    // Run compliance check
    const result = await checkContent({
      text,
      regionSlug,
      platform,
      mediaMeta,
    });

    // Generate report
    const report = createComplianceReport(result);

    return NextResponse.json({
      success: true,
      result,
      report,
    });
  } catch (error) {
    console.error('Compliance check failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
