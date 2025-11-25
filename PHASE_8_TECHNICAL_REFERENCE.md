# Phase 8 Technical Reference
## Strategic Governance & Multi-Model AGI Control Layer

**For Developers Integrating Phase 8 Components**

---

## Quick Import Reference

```typescript
// Core governance
import {
  validateDecision,
  governDecision,
  applyFounderOverride
} from '@/src/agents/governance/agiGovernor';

// Model routing
import {
  routeRequest,
  getRoutingMetricsForModel
} from '@/src/agents/governance/modelRoutingEngine';

// Model catalog
import {
  getRecommendedModels,
  getCheapestModel,
  getFastestModel,
  getMostReliableModel
} from '@/src/agents/governance/modelCapabilityMap';

// Performance rewards
import {
  recordTaskExecution,
  getModelAverageScore,
  compareModelsForTask
} from '@/src/agents/governance/modelRewardEngine';

// Risk management
import {
  assessRisk,
  getActiveProfile,
  setActiveProfile
} from '@/src/agents/governance/riskEnvelope';

// Simulation
import {
  createScenario,
  runSimulation
} from '@/src/agents/governance/simulationEngine';

// Types
import type {
  AgentDecision,
  ModelCapability,
  RiskProfile
} from '@/src/agents/governance/types';
```

---

## Core Types

### AgentDecision
```typescript
interface AgentDecision {
  id: string;
  timestamp: string;
  agentId: string;
  action: string;
  parameters: Record<string, any>;
  estimatedCost?: number;
  estimatedLatency?: number;
  estimatedAccuracy?: number;
  affectedContacts?: number;
  operationType?: string;
}
```

### ModelCapability
```typescript
interface ModelCapability {
  id: string;
  model: string;
  capability: string;
  level: string;
  costPerToken: number;
  latencyMs: number;
  availabilityScore: number; // 0-1
  supportsStreaming?: boolean;
  supportsCaching?: boolean;
  supportsBatching?: boolean;
}
```

### ModelRoutingDecision
```typescript
interface ModelRoutingDecision {
  id: string;
  timestamp: string;
  requestId: string;
  selectedModel: string;
  alternatives: string[];
  routingReason: string;
  estimatedLatency: number;
  estimatedCost: number;
  confidenceScore: number; // 0-1
}
```

### RiskProfile
```typescript
interface RiskProfile {
  id: string;
  name: string;
  description: string;
  boundaries: RiskBoundary[];
  createdAt: string;
  updatedAt: string;
  founderApproved: boolean;
}
```

### RiskAssessment
```typescript
interface RiskAssessment {
  decisionId: string;
  riskScore: number; // 0-100
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  violations: RiskViolation[];
  requiresApproval: boolean;
  recommendation: string;
}
```

---

## Function Reference

### agiGovernor.ts

#### validateDecision(decision: AgentDecision)
Validates a decision against active governance policies.

**Returns**:
```typescript
{
  valid: boolean;
  violations: string[];
  applicablePolicies: GovernancePolicy[];
  requiresApproval: boolean;
}
```

**Usage**:
```typescript
const validation = validateDecision(decision);
if (!validation.valid) {
  console.log('Violations:', validation.violations);
  if (validation.requiresApproval) {
    await requestFounderApproval(decision);
  }
}
```

#### governDecision(decision: AgentDecision, policy: GovernancePolicy)
Applies governance constraints and potentially escalates decision.

**Returns**: `{ approved: boolean; reason: string; escalated: boolean }`

#### applyFounderOverride(decision: AgentDecision, overrideDetails: GovernorOverride)
Records founder override of blocked decision.

**GovernorOverride Interface**:
```typescript
interface GovernorOverride {
  decisionId: string;
  overriddenBy: string; // founder user ID
  reason: string;
  timestamp: string;
}
```

#### recordAudit(entry: GovernanceAuditEntry)
Logs governance decision to audit trail.

---

### modelRoutingEngine.ts

#### routeRequest(requestId: string, constraints: RoutingConstraints)
Routes request to optimal model based on constraints.

**RoutingConstraints**:
```typescript
interface RoutingConstraints {
  capability: string;
  maxCostPerToken?: number;
  maxLatencyMs?: number;
  minAvailabilityScore?: number;
  needsCaching?: boolean;
  needsBatching?: boolean;
  needsStreaming?: boolean;
  priority?: 'cost' | 'speed' | 'reliability' | 'balanced';
  fallbackStrategy?: 'cost-first' | 'speed-first' | 'reliability-first' | 'balanced';
}
```

**Returns**: `ModelRoutingDecision`

**Example**:
```typescript
const decision = routeRequest('req-123', {
  capability: 'content-generation',
  maxCostPerToken: 0.01,
  maxLatencyMs: 5000,
  priority: 'quality'
});

console.log(`Selected: ${decision.selectedModel}`);
console.log(`Alternatives: ${decision.alternatives.join(', ')}`);
console.log(`Confidence: ${decision.confidenceScore}`);
```

#### getRoutingStatsByCapability(capability: string)
Get statistics for a capability across all routing decisions.

**Returns**:
```typescript
{
  capability: string;
  totalRequests: number;
  modelsUsed: string[];
  avgLatency: number;
  avgCost: number;
  avgConfidence: number;
}
```

#### compareRoutingCosts(capability: string)
Compare costs across all models for a capability.

**Returns**: Array of cost comparisons sorted by total spend

---

### modelCapabilityMap.ts

#### getRecommendedModels(capability: string, constraints?, limit = 3)
Get ranked list of models for a capability.

**Returns**: `{ capability: ModelCapability; score: number }[]`

**Example**:
```typescript
const models = getRecommendedModels('content-generation', {
  maxCostPerToken: 0.01
});

// models[0] is best option
console.log(`Best: ${models[0].capability.model} (score: ${models[0].score})`);
```

#### getCheapestModel(capability: string)
Get least expensive model for a capability.

**Returns**: `ModelCapability | null`

#### getFastestModel(capability: string)
Get fastest model for a capability.

**Returns**: `ModelCapability | null`

#### getMostReliableModel(capability: string)
Get most available/reliable model for a capability.

**Returns**: `ModelCapability | null`

#### getModelCapabilityById(modelId: string)
Lookup specific model by ID.

**Returns**: `ModelCapability | undefined`

---

### modelRewardEngine.ts

#### recordTaskExecution(metrics: TaskMetrics)
Record task execution and calculate reward scores.

**TaskMetrics**:
```typescript
interface TaskMetrics {
  taskId: string;
  taskType: string;
  modelId: string;
  executionTimeMs: number;
  tokenCost: number;
  outputQuality: number; // 0-100
  userSatisfaction: number; // 0-100
  successfulCompletion: boolean;
  errorMessage?: string;
}
```

**Returns**: `ModelReward` with calculated scores

**Example**:
```typescript
const reward = recordTaskExecution({
  taskId: 'task-456',
  taskType: 'email-generation',
  modelId: 'claude-sonnet-4-5',
  executionTimeMs: 1200,
  tokenCost: 0.0045,
  outputQuality: 95,
  userSatisfaction: 90,
  successfulCompletion: true
});

console.log(`Overall Score: ${reward.overallScore}`);
// Output shows weighted score: 40% quality + 25% cost + 20% latency + 15% reliability
```

#### getModelScoreForTask(modelId: string, taskType: string)
Get performance metrics for model on specific task type.

**Returns**: `ModelScore | null`

#### compareModelsForTask(taskType: string)
Rank all models for a specific task type.

**Returns**: `ModelComparison` with top model and alternatives

**ModelComparison**:
```typescript
{
  taskType: string;
  topModel: { model: string; score: number };
  alternatives: { model: string; score: number }[];
  recommendation: string;
  confidence: number;
}
```

#### getModelPerformanceRanking()
Get all models ranked by overall performance.

**Returns**: Sorted array of `ModelScore` with rank field

#### identifyModelWeaknesses(modelId: string)
Identify where a model underperforms.

**Returns**: `{ modelId: string; weakAreas: string[]; strengths: string[] }`

---

### riskEnvelope.ts

#### assessRisk(decision: {...})
Comprehensive risk assessment against active profile.

**Decision Parameters**:
```typescript
{
  estimatedCost: number;
  estimatedLatency: number;
  estimatedAccuracy: number;
  affectedContacts: number;
  operationType: string;
}
```

**Returns**: `RiskAssessment` with violations and recommendation

**Example**:
```typescript
const assessment = assessRisk({
  estimatedCost: 100,
  estimatedLatency: 3000,
  estimatedAccuracy: 92,
  affectedContacts: 5000,
  operationType: 'bulk-email'
});

if (assessment.riskLevel === 'critical') {
  console.error('Critical risk detected!');
  for (const violation of assessment.violations) {
    console.error(`- ${violation.message}`);
  }
}
```

#### getActiveProfile()
Get currently active risk profile.

**Returns**: `RiskProfile`

#### setActiveProfile(profileId: string)
Switch to different risk profile.

Valid IDs: `'conservative'`, `'balanced'`, `'aggressive'`

**Returns**: `RiskProfile | null`

**Example**:
```typescript
// Switch to conservative mode for sensitive operations
const profile = setActiveProfile('conservative');
if (profile) {
  console.log(`Switched to ${profile.name}`);
}
```

#### createCustomProfile(name: string, description: string, boundaries: RiskBoundary[])
Create custom risk profile.

**Returns**: `RiskProfile` (requires founder approval to activate)

#### approveProfile(profileId: string)
Founder approval to enable profile.

**Returns**: `RiskProfile | null`

#### getAllProfiles()
List all available profiles.

**Returns**: `RiskProfile[]`

#### listActiveBoundaries()
Get all boundaries in active profile.

**Returns**: `RiskBoundary[]`

#### adjustBoundaryThreshold(profileId: string, boundaryId: string, newThreshold: number)
Adjust risk boundary threshold.

**Boundary IDs**:
- `'cost-daily-limit'`
- `'cost-single-request'`
- `'latency-critical-path'`
- `'accuracy-safety-critical'`
- `'frequency-rate-limit'`
- `'scope-max-impact'`

**Returns**: `boolean` (success)

---

### simulationEngine.ts

#### createScenario(name: string, description: string, conditions: any, expectedOutcome: any)
Define a simulation scenario.

**Returns**: `Scenario`

**Example**:
```typescript
const scenario = createScenario(
  'High Volume Campaign',
  'Test 10k contact email campaign',
  {
    contactCount: 10000,
    campaignType: 'drip-series',
    emailsPerHour: 500
  },
  {
    expectedDeliveryRate: 0.98,
    expectedOpenRate: 0.35,
    maxCostPerEmail: 0.001
  }
);
```

#### runSimulation(scenarioId: string, iterations = 100)
Run Monte Carlo simulation of scenario.

**Returns**: `SimulationResult` with distributions and statistics

**Example**:
```typescript
const result = runSimulation(scenario.id, 500); // 500 iterations

console.log(`Average cost: $${result.averageCost}`);
console.log(`Cost std dev: $${result.costStdDev}`);
console.log(`95th percentile cost: $${result.costP95}`);

if (result.riskAssessments.criticalCount > 0) {
  console.warn(`${result.riskAssessments.criticalCount} runs exceeded critical risk`);
}
```

#### getSimulationHistory(scenarioId?: string, limit = 100)
Retrieve past simulation results.

**Returns**: `SimulationResult[]`

#### analyzeSimulationResults(result: SimulationResult)
Get insights from simulation results.

**Returns**: Analysis with probabilities and recommendations

---

## Integration Patterns

### Pattern 1: Complete Decision Validation
```typescript
import { validateDecision, assessRisk } from '@/src/agents/governance';

async function executeAgentDecision(decision: AgentDecision) {
  // Validate against policies
  const validation = validateDecision(decision);
  if (!validation.valid) {
    // Escalate policy violations
    await escalateToFounder('Policy violation', validation.violations);
    return;
  }

  // Assess risk
  const risk = assessRisk({
    estimatedCost: decision.estimatedCost || 0,
    estimatedLatency: decision.estimatedLatency || 0,
    estimatedAccuracy: decision.estimatedAccuracy || 100,
    affectedContacts: decision.affectedContacts || 0,
    operationType: decision.action
  });

  if (risk.requiresApproval) {
    // Require founder approval
    const approved = await getFounderApproval(risk);
    if (!approved) {
      await recordAudit('Decision blocked by risk assessment', risk);
      return;
    }
  }

  // Decision is approved - execute it
  await executeDecision(decision);
}
```

### Pattern 2: Optimal Model Selection with Fallback
```typescript
import { routeRequest, recordRoutingOutcome } from '@/src/agents/governance';

async function processWithOptimalModel(requestId: string, taskData: any) {
  // Get optimal model
  const routing = routeRequest(requestId, {
    capability: 'content-generation',
    maxCostPerToken: 0.01,
    priority: 'quality'
  });

  console.log(`Routing to ${routing.selectedModel}`);

  try {
    // Execute with selected model
    const result = await callModel(routing.selectedModel, taskData);

    // Record success
    recordRoutingOutcome(
      routing.id,
      true,
      result.latencyMs,
      result.costPerToken
    );

    return result;
  } catch (error) {
    // Try fallback models
    for (const fallback of routing.alternatives) {
      try {
        const result = await callModel(fallback, taskData);
        recordRoutingOutcome(routing.id, true, result.latencyMs, result.costPerToken);
        return result;
      } catch (e) {
        // Continue to next alternative
      }
    }

    // All alternatives failed
    recordRoutingOutcome(routing.id, false, 0, 0);
    throw new Error(`All models failed for request ${requestId}`);
  }
}
```

### Pattern 3: Performance Tracking & Optimization
```typescript
import {
  recordTaskExecution,
  compareModelsForTask,
  getModelPerformanceRanking
} from '@/src/agents/governance';

async function generateContentWithTracking(content: any) {
  const startTime = performance.now();

  try {
    const result = await generateContent(content);
    const executionTime = performance.now() - startTime;

    // Record metrics
    const reward = recordTaskExecution({
      taskId: content.id,
      taskType: 'content-generation',
      modelId: content.selectedModel,
      executionTimeMs: executionTime,
      tokenCost: result.costPerToken,
      outputQuality: await evaluateQuality(result),
      userSatisfaction: content.userRating || 80,
      successfulCompletion: true
    });

    console.log(`Reward score: ${reward.overallScore}`);

    // Get recommendations for next time
    if (Math.random() < 0.1) { // 10% of the time
      const comparison = compareModelsForTask('content-generation');
      if (comparison.topModel.model !== content.selectedModel) {
        console.log(`Note: ${comparison.topModel.model} is now top model`);
      }
    }

    return result;
  } catch (error) {
    recordTaskExecution({
      taskId: content.id,
      taskType: 'content-generation',
      modelId: content.selectedModel,
      executionTimeMs: performance.now() - startTime,
      tokenCost: 0,
      outputQuality: 0,
      userSatisfaction: 0,
      successfulCompletion: false,
      errorMessage: error.message
    });
    throw error;
  }
}

// Later: Get model rankings
async function showModelRankings() {
  const ranking = getModelPerformanceRanking();
  console.table(ranking.slice(0, 5)); // Top 5 models
}
```

### Pattern 4: Risk-Aware Campaign Execution
```typescript
import { assessRisk, setActiveProfile } from '@/src/agents/governance';

async function executeCampaign(campaign: Campaign) {
  // For sensitive campaigns, use conservative risk profile
  if (campaign.type === 'sensitive') {
    setActiveProfile('conservative');
  }

  // Assess campaign risk
  const riskEstimate = assessRisk({
    estimatedCost: campaign.estimatedCost,
    estimatedLatency: campaign.estimatedLatency,
    estimatedAccuracy: 95,
    affectedContacts: campaign.targetContacts.length,
    operationType: 'campaign'
  });

  console.log(`Risk Level: ${riskEstimate.riskLevel}`);
  console.log(`Risk Score: ${riskEstimate.riskScore}`);

  if (riskEstimate.violations.length > 0) {
    console.warn('Risk Violations:');
    for (const violation of riskEstimate.violations) {
      console.warn(`  - ${violation.message}`);
    }
  }

  if (riskEstimate.requiresApproval) {
    console.log('Awaiting founder approval...');
    const approved = await waitForFounderApproval(riskEstimate);
    if (!approved) {
      throw new Error('Campaign rejected due to risk assessment');
    }
  }

  // Execute campaign
  await sendCampaignEmails(campaign);
}
```

### Pattern 5: Scenario Simulation
```typescript
import { createScenario, runSimulation } from '@/src/agents/governance';

async function planCampaignWithSimulation(campaignSpec: any) {
  // Create simulation scenario
  const scenario = createScenario(
    `Campaign: ${campaignSpec.name}`,
    'Simulating campaign execution',
    {
      contactCount: campaignSpec.targetContacts.length,
      emailsPerHour: campaignSpec.sendRate,
      campaignDuration: campaignSpec.duration
    },
    {
      expectedOpenRate: 0.35,
      expectedClickRate: 0.08,
      expectedConversionRate: 0.02
    }
  );

  // Run simulation with 200 iterations
  const results = runSimulation(scenario.id, 200);

  // Display results
  console.log(`
    CAMPAIGN SIMULATION RESULTS (200 iterations)

    Cost Analysis:
      Average: $${results.averageCost}
      Min: $${results.costMin}
      Max: $${results.costMax}
      95th percentile: $${results.costP95}

    Risk Analysis:
      Safe runs: ${results.riskAssessments.safeCount}
      Low risk runs: ${results.riskAssessments.lowCount}
      Medium risk runs: ${results.riskAssessments.mediumCount}
      High risk runs: ${results.riskAssessments.highCount}
      Critical runs: ${results.riskAssessments.criticalCount}

    Recommendation: ${results.recommendation}
  `);

  // Proceed if safe
  if (results.riskAssessments.criticalCount === 0) {
    await executeCampaign(campaignSpec);
  } else {
    console.warn('Simulation indicates critical risk - aborting');
  }
}
```

---

## Error Handling

All governance functions are synchronous and don't throw exceptions. Instead, they return null or empty structures for error cases:

```typescript
const model = getCheapestModel('capability');
if (!model) {
  console.error('No models available for capability');
}

const profile = setActiveProfile('invalid-id');
if (!profile) {
  console.error('Profile not found or not approved');
}

const validation = validateDecision(decision);
// validation.violations will be empty array if valid
```

---

## Performance Tips

1. **Cache Model Lookups**: `getRecommendedModels()` is O(n) - cache results if called frequently
2. **Batch Risk Assessments**: Assess multiple decisions in one pass instead of individually
3. **Limit Simulation Iterations**: Start with 100, increase only if needed (200+ gets expensive)
4. **Use Fallback Strategies**: Don't require exact constraint matches; use fallback chains
5. **Archive Old Metrics**: Use `pruneOldRewards()` to keep reward history manageable

---

## Testing

```typescript
import { resetRoutingMetrics } from '@/src/agents/governance/modelRoutingEngine';

// In test setup
beforeEach(() => {
  resetRoutingMetrics();
});

// Test pattern
it('should route to cheapest model when cost-priority', () => {
  const decision = routeRequest('test-1', {
    capability: 'text-generation',
    priority: 'cost'
  });

  expect(decision.selectedModel).toBe('llama-3-70b'); // Cheapest
  expect(decision.confidenceScore).toBeGreaterThan(0.5);
});
```

---

## Debugging Tips

### Enable Detailed Logging
```typescript
// In components
import { getRoutingHistory } from '@/src/agents/governance/modelRoutingEngine';

const history = getRoutingHistory(10); // Last 10 decisions
console.table(history);

// Check fallback rate
const fallbacks = history.filter(d => d.confidenceScore < 0.75).length;
console.log(`Fallback rate: ${(fallbacks / history.length * 100).toFixed(1)}%`);
```

### Monitor Risk Violations
```typescript
import { getRiskViolationStats } from '@/src/agents/governance/riskEnvelope';

const stats = getRiskViolationStats();
console.log(`Critical violations: ${stats.criticalViolations}`);
console.log(`Most violated boundary: ${stats.mostViolatedBoundary}`);
```

### Check Model Health
```typescript
import { getModelPerformanceRanking } from '@/src/agents/governance/modelRewardEngine';

const ranking = getModelPerformanceRanking();
for (const model of ranking) {
  if (model.overallScore < 50) {
    console.warn(`⚠️ ${model.modelId} has low score: ${model.overallScore}`);
  }
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-26 | Initial release with 7 modules |

---

**Last Updated**: 2025-11-26
