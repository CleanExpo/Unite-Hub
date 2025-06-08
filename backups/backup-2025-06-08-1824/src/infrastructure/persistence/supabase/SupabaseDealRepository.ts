import type { SupabaseClient } from '@supabase/supabase-js';
import { Deal, DealStage } from '@/core/domain/types';
import { DealRepository } from '@/core/domain/interfaces/repositories';

export class SupabaseDealRepository implements DealRepository {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
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

  async save(deal: Deal): Promise<void> {
    const { error } = await this.supabaseClient
      .from('deals')
      .upsert({
        id: deal.id,
        title: deal.title,
        value: deal.value,
        stage: deal.stage,
        client_id: deal.clientId,
        created_at: deal.createdAt.toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) throw new Error(`Failed to save deal: ${error.message}`);
  }

  async findByStage(stage: DealStage): Promise<Deal[]> {
    const { data, error } = await this.supabaseClient
      .from('deals')
      .select('*')
      .eq('stage', stage);

    if (error) throw new Error(`Failed to find deals by stage: ${error.message}`);

    return data.map(deal => ({
      id: deal.id,
      title: deal.title,
      value: deal.value,
      stage: deal.stage as DealStage,
      clientId: deal.client_id,
      createdAt: new Date(deal.created_at),
      updatedAt: new Date(deal.updated_at)
    }));
  }

  async updateStage(dealId: string, newStage: DealStage): Promise<void> {
    const { error } = await this.supabaseClient
      .from('deals')
      .update({ 
        stage: newStage,
        updated_at: new Date().toISOString()
      })
      .eq('id', dealId);

    if (error) throw new Error(`Failed to update deal stage: ${error.message}`);
  }
}
