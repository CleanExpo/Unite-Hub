/**
 * Guardian H05: Z13 Integration for Governance Coach Audit Sessions
 * Standalone handler for Z13 task type: governance_coach_audit_session
 * Used by metaTaskRunner.ts to trigger automated governance coach sessions
 */

import { createCoachSession } from './governanceCoachService';

export interface GovernanceCoachTaskConfig {
  coachMode?: 'operator' | 'leadership' | 'cs_handoff';
  targetFeatures?: string;
}

/**
 * Execute governance coach audit session task (for Z13 automation)
 * Returns PII-free summary of session created
 */
export async function runGovernanceCoachAuditTask(
  tenantId: string,
  config: GovernanceCoachTaskConfig = {},
  actor: string = 'z13_automation'
): Promise<{
  status: 'success' | 'error';
  sessionId?: string;
  coachMode?: string;
  summary?: string;
  message?: string;
}> {
  try {
    const coachMode = config.coachMode || 'operator';
    const targetFeatures = config.targetFeatures || 'h01_h02_h03_h04';

    // Create governance coach session
    const session = await createCoachSession({
      tenantId,
      coachMode,
      targetFeatures,
      actor,
    });

    return {
      status: 'success',
      sessionId: session.id,
      coachMode: session.coach_mode,
      summary: session.summary,
      message: `Governance coach audit session created: ${session.coach_mode} mode, ${session.target}`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      status: 'error',
      message: `Failed to create governance coach audit session: ${errorMsg}`,
    };
  }
}

/**
 * Get governance coach task definition for Z13 task registry
 */
export function getGovernanceCoachTaskDefinition() {
  return {
    key: 'governance_coach_audit_session',
    label: 'Governance Coach Audit Session',
    description: 'Generate governance coach audit session for safe H-series enablement planning',
    defaultConfig: {
      coachMode: 'operator',
      targetFeatures: 'h01_h02_h03_h04',
    },
  };
}
