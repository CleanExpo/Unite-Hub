/**
 * Content Agent API
 * Wraps content-personalization service
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { socialPostGenerator } from '@/lib/services/social-post-generator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, action, ...params } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    await validateUserAndWorkspace(req, workspaceId);

    // Route to appropriate content generation service
    if (action === 'generate_social_post') {
      const post = await socialPostGenerator.generatePost({
        workspaceId,
        ...params
      });
      return NextResponse.json({ success: true, post }, { status: 200 });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error: any) {
    console.error('Content agent error:', error);
    return NextResponse.json({
      error: error.message || 'Content agent failed'
    }, { status: 500 });
  }
}
