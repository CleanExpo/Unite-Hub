export type DealStage = 
  | 'prospect'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export interface Deal {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DomainEvent {
  eventType: string;
  aggregateId: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
}
