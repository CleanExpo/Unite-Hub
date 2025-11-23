/**
 * Client Welcome Pack API Route
 * Phase 47: API endpoint for fetching and managing client launch kits
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { getClientLaunchKit, markKitViewed } from '@/lib/services/clientLaunchKitService';
import { getClientTasks, updateTaskStatus } from '@/lib/services/onboardingTasksService';

export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access (either is the client or is staff)
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);

      if (authError || !userData.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user is the client or has staff access
      const supabase = await getSupabaseServer();
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single();

      if (userData.user.id !== clientId && profile?.role !== 'staff' && profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Get launch kit
    const kitResult = await getClientLaunchKit(clientId);

    if (!kitResult.success || !kitResult.kit) {
      return NextResponse.json(
        { error: kitResult.error || 'Launch kit not found' },
        { status: 404 }
      );
    }

    // Get tasks
    const tasksResult = await getClientTasks(clientId);
    const tasks = tasksResult.success ? tasksResult.tasks : [];

    return NextResponse.json({
      kit: kitResult.kit,
      tasks,
    });
  } catch (error) {
    console.error('Error fetching welcome pack:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { kitId, taskId, action, clientId } = body;

    // Verify authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string | null = null;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);

      if (authError || !userData.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = userData.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data: userData, error: authError } = await supabase.auth.getUser();

      if (authError || !userData.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = userData.user.id;
    }

    switch (action) {
      case 'view': {
        if (!kitId) {
          return NextResponse.json({ error: 'Kit ID required' }, { status: 400 });
        }
        const result = await markKitViewed(kitId);
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }

      case 'complete-task': {
        if (!taskId || !clientId) {
          return NextResponse.json(
            { error: 'Task ID and Client ID required' },
            { status: 400 }
          );
        }

        // Verify the user is the client
        if (userId !== clientId) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const result = await updateTaskStatus(taskId, clientId, 'completed');
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }

      case 'skip-task': {
        if (!taskId || !clientId) {
          return NextResponse.json(
            { error: 'Task ID and Client ID required' },
            { status: 400 }
          );
        }

        if (userId !== clientId) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const result = await updateTaskStatus(taskId, clientId, 'skipped');
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating welcome pack:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, organizationId, businessName, businessIndustry, websiteUrl } = body;

    // Verify authentication (should be staff or admin creating for client)
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);

    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has staff/admin role
    const supabase = await getSupabaseServer();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profile?.role !== 'staff' && profile?.role !== 'admin' && userData.user.id !== clientId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Import and create launch kit
    const { createLaunchKit, generateLaunchKitContent } = await import(
      '@/lib/services/clientLaunchKitService'
    );
    const { createOnboardingTasks } = await import(
      '@/lib/services/onboardingTasksService'
    );

    // Create the launch kit
    const kitResult = await createLaunchKit({
      clientId,
      organizationId,
      businessName,
      businessIndustry,
      websiteUrl,
    });

    if (!kitResult.success || !kitResult.kit) {
      return NextResponse.json(
        { error: kitResult.error || 'Failed to create launch kit' },
        { status: 500 }
      );
    }

    // Create onboarding tasks
    await createOnboardingTasks(kitResult.kit.id, clientId);

    // Generate content asynchronously (don't wait)
    generateLaunchKitContent(kitResult.kit.id).catch(err => {
      console.error('Error generating launch kit content:', err);
    });

    return NextResponse.json({
      success: true,
      kit: kitResult.kit,
    });
  } catch (error) {
    console.error('Error creating welcome pack:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
