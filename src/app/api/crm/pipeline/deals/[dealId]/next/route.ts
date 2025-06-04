import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { type Database } from '@/types/supabase';
import { DealRepository } from '@/core/domain/interfaces/repositories';
import { RealWorkflowEngine } from '@/infrastructure/workflow/RealWorkflowEngine';
import { SupabaseEventBus } from '@/infrastructure/eventbus/supabase/SupabaseEventBus';

export async function POST(
  request: Request,
  { params }: { params: { dealId: string } }
) {
  const dealId = params.dealId;
  const supabase = await createClient();
  
  try {
    const dealRepo = new SupabaseDealRepository(supabase);
    const workflowEngine = new RealWorkflowEngine();
    const eventBus = new SupabaseEventBus(supabase);
    
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

// Update the SupabaseDealRepository to use the injected client
class SupabaseDealRepository implements DealRepository {
  private supabaseClient: Database;

  constructor(supabaseClient: Database) {
    this.supabaseClient = supabaseClient;
  }

  async findById(id: string): Promise<Deal> {
    const { data, error } = await this.supabaseClient
      .from('deals')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new Error(`Deal not found: ${id}`);

    return {
      id: data.id,
      title: data.title,
      value: data.value,
      stage: data.stage as DealStage,
      clientId: data.client_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // ... keep other methods the same ...
}
