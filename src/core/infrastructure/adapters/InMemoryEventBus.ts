import { EventBus } from '../../domain/interfaces/repositories';
import { DomainEvent } from '../../domain/types';

export class InMemoryEventBus implements EventBus {
  async publish(event: DomainEvent): Promise<void> {
    console.log(`[Event Bus] Publishing event: ${event.eventType} for ${event.aggregateId}`);
    // In a real implementation, this would publish to a message broker
  }
}
