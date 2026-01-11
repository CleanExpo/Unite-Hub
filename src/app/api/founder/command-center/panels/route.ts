/**
 * Founder Command Center - Panels API
 *
 * Phase: D52 - Founder Command Center & Cross-Business Insights
 *
 * Routes:
 * - GET /api/founder/command-center/panels - List all panels for founder
 * - POST /api/founder/command-center/panels - Create a new panel
 *
 * Query Params:
 * - action=get&id=<panel-id> - Get specific panel
 * - action=update&id=<panel-id> - Update panel
 * - action=delete&id=<panel-id> - Delete panel
 * - action=widgets&id=<panel-id> - List widgets for panel
 * - action=add_widget - Add widget to panel
 * - action=update_widget&widget_id=<id> - Update widget
 * - action=remove_widget&widget_id=<id> - Remove widget
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createPanel,
  getPanel,
  listPanels,
  updatePanel,
  deletePanel,
  addWidget,
  listWidgets,
  updateWidget,
  removeWidget,
  CreatePanelInput,
  UpdatePanelInput,
  CreateWidgetInput,
  PanelWidget,
} from '@/lib/founder/commandCenterService';

// =============================================================================
// GET - List panels, get panel, list widgets
// =============================================================================

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

    const founderUserId = user.id;
    const action = request.nextUrl.searchParams.get('action');
    const id = request.nextUrl.searchParams.get('id');

    // Get specific panel
    if (action === 'get' && id) {
      const panel = await getPanel(founderUserId, id);
      if (!panel) {
        return NextResponse.json({ error: 'Panel not found' }, { status: 404 });
      }
      return NextResponse.json({ panel });
    }

    // List widgets for panel
    if (action === 'widgets' && id) {
      const widgets = await listWidgets(founderUserId, id);
      return NextResponse.json({ widgets });
    }

    // List all panels
    const panels = await listPanels(founderUserId);
    return NextResponse.json({ panels });
  } catch (error: unknown) {
    console.error('GET /api/founder/command-center/panels error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch panels' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create panel, update panel, delete panel, manage widgets
// =============================================================================

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

    const founderUserId = user.id;
    const action = request.nextUrl.searchParams.get('action');
    const body = await request.json();

    // Create panel
    if (!action || action === 'create') {
      const input: CreatePanelInput = {
        slug: body.slug,
        name: body.name,
        description: body.description,
        layout: body.layout,
        default_panel: body.default_panel,
        filters: body.filters,
      };

      if (!input.slug || !input.name) {
        return NextResponse.json(
          { error: 'slug and name are required' },
          { status: 400 }
        );
      }

      const panel = await createPanel(founderUserId, input);
      return NextResponse.json({ panel }, { status: 201 });
    }

    // Update panel
    if (action === 'update') {
      const panelId = request.nextUrl.searchParams.get('id') || body.panel_id;
      if (!panelId) {
        return NextResponse.json({ error: 'panel_id is required' }, { status: 400 });
      }

      const updates: UpdatePanelInput = {
        name: body.name,
        description: body.description,
        layout: body.layout,
        default_panel: body.default_panel,
        filters: body.filters,
      };

      const panel = await updatePanel(founderUserId, panelId, updates);
      return NextResponse.json({ panel });
    }

    // Delete panel
    if (action === 'delete') {
      const panelId = request.nextUrl.searchParams.get('id') || body.panel_id;
      if (!panelId) {
        return NextResponse.json({ error: 'panel_id is required' }, { status: 400 });
      }

      await deletePanel(founderUserId, panelId);
      return NextResponse.json({ success: true });
    }

    // Add widget
    if (action === 'add_widget') {
      const input: CreateWidgetInput = {
        panel_id: body.panel_id,
        widget_type: body.widget_type,
        title: body.title,
        config: body.config,
        position: body.position,
      };

      if (!input.panel_id || !input.widget_type) {
        return NextResponse.json(
          { error: 'panel_id and widget_type are required' },
          { status: 400 }
        );
      }

      const widget = await addWidget(founderUserId, input);
      return NextResponse.json({ widget }, { status: 201 });
    }

    // Update widget
    if (action === 'update_widget') {
      const widgetId = request.nextUrl.searchParams.get('widget_id') || body.widget_id;
      if (!widgetId) {
        return NextResponse.json({ error: 'widget_id is required' }, { status: 400 });
      }

      const updates: Partial<PanelWidget> = {
        widget_type: body.widget_type,
        title: body.title,
        config: body.config,
        position: body.position,
      };

      const widget = await updateWidget(founderUserId, widgetId, updates);
      return NextResponse.json({ widget });
    }

    // Remove widget
    if (action === 'remove_widget') {
      const widgetId = request.nextUrl.searchParams.get('widget_id') || body.widget_id;
      if (!widgetId) {
        return NextResponse.json({ error: 'widget_id is required' }, { status: 400 });
      }

      await removeWidget(founderUserId, widgetId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('POST /api/founder/command-center/panels error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to manage panels' },
      { status: 500 }
    );
  }
}
