import { DealRepository, WorkflowEngine, EventBus } from '../../core/domain/interfaces/repositories';
import { Deal, DealStage } from '../../core/domain/types';

export class MoveDealToNextStageUseCase {
  constructor(
    private dealRepo: DealRepository,
    private workflowEngine: WorkflowEngine,
    private eventBus: EventBus
  ) {}

  async execute(dealId: string): Promise<void> {
    const deal = await this.dealRepo.findById(dealId);
    
    // Move to next stage logic
    const currentStageIndex = DealStages.indexOf(deal.stage);
    if (currentStageIndex === -1 || currentStageIndex === DealStages.length - 1) {
      throw new Error(`Cannot move deal from stage ${deal.stage}`);
    }
    
    const newStage = DealStages[currentStageIndex + 1];
    deal.stage = newStage;
    deal.updatedAt = new Date();
    
    await this.dealRepo.save(deal);
    await this.workflowEngine.triggerStageChange(deal);
    await this.eventBus.publish({
      eventType: 'DEAL_STAGE_CHANGED',
      aggregateId: dealId,
      occurredAt: new Date(),
      payload: {
        from: DealStages[currentStageIndex],
        to: newStage
      }
    });
  }
}

const DealStages: DealStage[] = [
  'prospect',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost'
];
