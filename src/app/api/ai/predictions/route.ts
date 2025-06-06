/**
 * AI Predictions API Route
 * Provides failure predictions and analytics
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
    const component = searchParams.get('component');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get active predictions from AI service
    const predictions = await aiService.getPredictions();
    
    // Get historical predictions from database
    let query = supabase
      .from('ai_predictions')
      .select('*')
      .order('predicted_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (severity) {
      query = query.eq('severity', severity);
    }
    
    if (component) {
      query = query.eq('component', component);
    }

    const { data: historicalPredictions, error: dbError } = await query;

    if (dbError) {
      console.error('Failed to fetch historical predictions:', dbError);
    }

    // Calculate accuracy based on historical data
    const resolvedPredictions = historicalPredictions?.filter(
      p => p.status === 'resolved' || p.status === 'false-positive'
    ) || [];
    
    const accuracy = resolvedPredictions.length > 0
      ? resolvedPredictions.filter(p => p.status === 'resolved').length / resolvedPredictions.length
      : 0.85; // Default accuracy

    return NextResponse.json({
      activePredictions: predictions,
      historicalPredictions: historicalPredictions || [],
      summary: {
        total: predictions.length,
        critical: predictions.filter((p: Record<string, unknown>) => p.severity === 'critical').length,
        high: predictions.filter((p: Record<string, unknown>) => p.severity === 'high').length,
        accuracy: accuracy,
        avgTimeToFailure: calculateAvgTimeToFailure(predictions),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Predictions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update prediction status or create manual prediction
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
    const { action, predictionId, ...predictionData } = body;

    if (action === 'update') {
      // Update prediction status
      const { data, error } = await supabase
        .from('ai_predictions')
        .update({
          status: predictionData.status,
          resolved_at: predictionData.status === 'resolved' ? new Date().toISOString() : null,
        })
        .eq('id', predictionId)
        .select();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        message: 'Prediction updated successfully',
        prediction: data[0],
      });
    } else if (action === 'create') {
      // Store new prediction in database
      const { data, error } = await supabase
        .from('ai_predictions')
        .insert({
          prediction_type: predictionData.type,
          component: predictionData.component,
          probability: predictionData.probability,
          time_to_failure: predictionData.timeToFailure,
          severity: predictionData.severity,
          description: predictionData.description,
          recommendation: predictionData.recommendation,
          metadata: predictionData.metadata || {},
        })
        .select();

      if (error) {
        throw error;
      }

      // Store in AI events for tracking
      await supabase
        .from('ai_events')
        .insert({
          event_type: 'prediction',
          severity: predictionData.severity,
          component: 'manual-prediction',
          message: `Manual prediction created: ${predictionData.description}`,
          data: { predictionId: data[0].id },
        });

      return NextResponse.json({
        message: 'Prediction created successfully',
        prediction: data[0],
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('AI Predictions POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate average time to failure
function calculateAvgTimeToFailure(predictions: Array<Record<string, unknown>>): number {
  if (predictions.length === 0) return 0;
  
  const times = predictions
    .map(p => p.timeToFailure as number)
    .filter(t => t !== undefined && t !== null);
  
  return times.length > 0
    ? times.reduce((sum, t) => sum + t, 0) / times.length
    : 0;
}
