/**
 * AI Threats API Route
 * Provides security threat detection and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAIIntegrationService } from '@/lib/services/ai/AIIntegrationService';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get Supabase client
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get AI Integration Service
    const aiService = await getAIIntegrationService();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'active';
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get active threats from AI service
    const threats = await aiService.getThreats();
    
    // Get historical threats from database
    let query = supabase
      .from('ai_threats')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (status === 'active') {
      query = query.in('mitigation_status', ['detected', 'analyzing', 'mitigating']);
    } else if (status === 'mitigated') {
      query = query.eq('mitigation_status', 'mitigated');
    }
    
    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data: historicalThreats, error: dbError } = await query;

    if (dbError) {
      console.error('Failed to fetch historical threats:', dbError);
    }

    return NextResponse.json({
      activeThreats: threats,
      historicalThreats: historicalThreats || [],
      summary: {
        total: threats.length,
        critical: threats.filter((t: Record<string, unknown>) => t.severity === 'critical').length,
        high: threats.filter((t: Record<string, unknown>) => t.severity === 'high').length,
        medium: threats.filter((t: Record<string, unknown>) => t.severity === 'medium').length,
        low: threats.filter((t: Record<string, unknown>) => t.severity === 'low').length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Threats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Report a new threat or update threat status
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, threatId, ...threatData } = body;

    if (action === 'mitigate') {
      // Update threat mitigation status
      const { data, error } = await supabase
        .from('ai_threats')
        .update({
          mitigation_status: 'mitigated',
          mitigated_at: new Date().toISOString(),
          mitigation_actions: threatData.actions || [],
        })
        .eq('id', threatId)
        .select();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        message: 'Threat mitigated successfully',
        threat: data[0],
      });
    } else if (action === 'report') {
      // Store new threat in database
      const { data, error } = await supabase
        .from('ai_threats')
        .insert({
          threat_type: threatData.type,
          severity: threatData.severity,
          confidence: threatData.confidence || 0.8,
          source: threatData.source,
          target: threatData.target,
          description: threatData.description,
          indicators: threatData.indicators || [],
          metadata: threatData.metadata || {},
        })
        .select();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        message: 'Threat reported successfully',
        threat: data[0],
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('AI Threats POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
