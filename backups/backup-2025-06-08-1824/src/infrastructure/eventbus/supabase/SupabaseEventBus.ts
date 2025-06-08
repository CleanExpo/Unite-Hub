import { createClient } from '@/lib/supabase/server';
import { EventBus } from '@/core/domain/interfaces/repositories';
import { DomainEvent } from '@/core/domain/types';

export class SupabaseEventBus implements EventBus {
  private async getSupabase() {
    return await createClient();
  }

  async publish(event: DomainEvent): Promise<void> {
    const supabase = await this.getSupabase();
    
    const { error } = await supabase
      .from('event_store')
      .insert({
        event_type: event.eventType,
        aggregate_id: event.aggregateId,
        occurred_at: event.occurredAt.toISOString(),
        payload: event.payload
      });
    
    if (error) {
      console.error('Failed to store event:', error);
      throw new Error(`Failed to publish event: ${error.message}`);
    }
  }
}
