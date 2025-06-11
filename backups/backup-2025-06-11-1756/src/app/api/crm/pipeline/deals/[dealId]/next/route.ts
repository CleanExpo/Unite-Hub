import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const resolvedParams = await params;
  const dealId = resolvedParams.dealId;
  const supabase = createApiClient();
  
  try {
    // First, get the current deal to find its stage
    const { data: deal, error: fetchError } = await supabase
      .from('pipeline_deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (fetchError || !deal) {
      return NextResponse.json(
        { success: false, error: `Deal not found: ${dealId}` },
        { status: 404 }
      );
    }

    // Define the pipeline stages
    const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    const currentStageIndex = stages.indexOf(deal.stage);
    
    if (currentStageIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Invalid current stage' },
        { status: 400 }
      );
    }

    if (currentStageIndex >= stages.length - 2) {
      return NextResponse.json(
        { success: false, error: 'Deal is already in a final stage' },
        { status: 400 }
      );
    }

    // Move to next stage
    const nextStage = stages[currentStageIndex + 1];
    
    const { data: updatedDeal, error: updateError } = await supabase
      .from('pipeline_deals')
      .update({ 
        stage: nextStage,
        updated_at: new Date().toISOString()
      })
      .eq('id', dealId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: `Deal ${dealId} moved from ${deal.stage} to ${nextStage}`,
        deal: updatedDeal
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error moving deal to next stage:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
