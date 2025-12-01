// Phase 9 – Full Business Brain & Personal AGI Advisor
// Central exports for all AGI modules

export { registerGoal, updateGoalProgress, evaluateGoalProgress, listGoals, getCriticalGoals, getGoalsByDomain, type BusinessGoal, type KeyResult, type GoalProgress } from './goalEngine';

export { recordHealthMetric, updatePersonalContext, deriveCognitiveState, getContextSummary, isOptimalFor, type PersonalContext, type HealthMetric } from './personalContextEngine';

export { validateAgainstDomain, isAdviceTypeAllowed, selectBestAgent, selectBestModel, getDomainsByRiskLevel, type KnowledgeDomain, type DomainProfile, type RiskLevel } from './domainKnowledgeRouter';

export { processAdvisorRequest, recordCorrection, getAdvisorMetrics, type AdvisorRequest, type AdvisorResponse, type AdviceType } from './personalAdvisor';

export { generateBusinessBrainSummary, getAtRiskDimensions, getStrategicThemes, type BusinessBrainSummary, type DimensionMetrics, type BusinessDimension } from './businessBrain';

export { generateMorningBriefing, generateMiddayBriefing, generateEveningBriefing, formatBriefingForDisplay, type DailyBriefing, type BriefingType, type TimeBlock } from './dailyBriefingEngine';
