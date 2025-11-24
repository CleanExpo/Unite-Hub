/**
 * Mesh Node API
 * Phase 94: Get node with edges
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser, getSupabaseServer } from '@/lib/supabase';
import {
  getNodeById,
  listEdgesForNode,
} from '@/lib/intelligenceMesh';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
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

    const { nodeId } = await params;

    // Get node
    const node = await getNodeById(nodeId);

    if (!node) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }

    // Get edges
    const edges = await listEdgesForNode(nodeId);

    // Get connected node details using helper function
    const supabase = await getSupabaseServer();
    const { data: connectedData } = await supabase.rpc('find_connected_nodes', {
      p_node_id: nodeId,
      p_max_depth: 2,
    });

    return NextResponse.json({
      success: true,
      node,
      edges,
      connectedNodes: connectedData || [],
    });
  } catch (error) {
    console.error('Failed to get node:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
