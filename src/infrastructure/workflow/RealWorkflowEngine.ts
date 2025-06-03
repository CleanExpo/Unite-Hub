import { WorkflowEngine } from '@/core/domain/interfaces/repositories';
import { Deal } from '@/core/domain/types';
import { executeWorkflow } from '@/lib/crm/workflow/engine';

export class RealWorkflowEngine implements WorkflowEngine {
  async triggerStageChange(deal: Deal): Promise<void> {
    // Execute workflow rules based on deal stage
    await executeWorkflow('deal.stage.changed', {
      dealId: deal.id,
      currentStage: deal.stage,
      clientId: deal.clientId
    });
  }
}
