import { WorkflowEngine } from '../../domain/interfaces/repositories';
import { Deal } from '../../domain/types';

export class InMemoryWorkflowEngine implements WorkflowEngine {
  async triggerStageChange(deal: Deal): Promise<void> {
    console.log(`[Workflow Engine] Stage changed for deal ${deal.id} to ${deal.stage}`);
    // In a real implementation, this would trigger business workflows
  }
}
