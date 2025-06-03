import { Deal, DealStage, DomainEvent } from '../types';

export interface DealRepository {
  findById(id: string): Promise<Deal>;
  save(deal: Deal): Promise<void>;
  findByStage(stage: DealStage): Promise<Deal[]>;
  updateStage(dealId: string, newStage: DealStage): Promise<void>;
}

export interface WorkflowEngine {
  triggerStageChange(deal: Deal): Promise<void>;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
}
