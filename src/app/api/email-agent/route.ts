/**
 * Email Agent API
 * Wraps email-intelligence-agent service
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, action, emailContent } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    await validateUserAndWorkspace(req, workspaceId);

    // Email intelligence actions
    if (action === 'analyze') {
      // Placeholder - integrate with email-intelligence-agent.ts
      return NextResponse.json({
        success: true,
        analysis: {
          intent: 'general_inquiry',
          sentiment: 'neutral',
          priority: 'medium'
        }
      }, { status: 200 });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error: any) {
    console.error('Email agent error:', error);
    return NextResponse.json({
      error: error.message || 'Email agent failed'
    }, { status: 500 });
  }
}
