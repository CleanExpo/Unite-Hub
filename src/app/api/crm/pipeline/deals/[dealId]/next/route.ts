import { NextResponse } from 'next/server';
import { MoveDealToNextStageUseCase } from '@/application/usecases/MoveDealToNextStage';
import { SupabaseDealRepository } from '@/infrastructure/persistence/supabase/SupabaseDealRepository';
import { RealWorkflowEngine } from '@/infrastructure/workflow/RealWorkflowEngine';
import { SupabaseEventBus } from '@/infrastructure/eventbus/supabase/SupabaseEventBus';

export async function POST(
  request: Request,
  { params }: { params: { dealId: string } }
) {
  const dealId = params.dealId;
  
  try {
    const dealRepo = new SupabaseDealRepository();
    const workflowEngine = new RealWorkflowEngine();
    const eventBus = new SupabaseEventBus();
    
    const useCase = new MoveDealToNextStageUseCase(
      dealRepo,
      workflowEngine,
      eventBus
    );
    
    await useCase.execute(dealId);
    
    return NextResponse.json(
      { success: true, message: `Deal ${dealId} moved to next stage` },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
