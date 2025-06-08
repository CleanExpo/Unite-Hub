/**
 * AI Workflow Automation Types
 * Unite Group - Version 11.0 Implementation
 */

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'ai_analysis' | 'data_processing' | 'human_review' | 'automated_action' | 'decision_point';
  description: string;
  inputs: WorkflowInput[];
  outputs: WorkflowOutput[];
  aiModel?: string;
  conditions?: WorkflowCondition[];
  automationLevel: 'manual' | 'semi_automated' | 'fully_automated';
  estimatedDuration: number; // in minutes
  dependencies: string[];
}

export interface WorkflowInput {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'file' | 'json' | 'array';
  required: boolean;
  description: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    allowedValues?: string[];
  };
}

export interface WorkflowOutput {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'file' | 'json' | 'array';
  description: string;
  aiGenerated: boolean;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex';
  value: unknown;
  nextStep: string;
}

export interface AIWorkflow {
  id: string;
  name: string;
  description: string;
  category: 'client_onboarding' | 'project_estimation' | 'consultation_prep' | 'document_analysis' | 'reporting';
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  metadata: {
    version: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tags: string[];
  };
  performance: {
    averageExecutionTime: number;
    successRate: number;
    aiAccuracy: number;
    humanInterventionRate: number;
  };
  isActive: boolean;
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'event' | 'api_call';
  condition: string;
  parameters: Record<string, unknown>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  currentStep: string;
  startTime: Date;
  endTime?: Date;
  executedBy: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  stepResults: WorkflowStepResult[];
  errors: WorkflowError[];
  aiInteractions: AIInteraction[];
}

export interface WorkflowStepResult {
  stepId: string;
  status: 'completed' | 'failed' | 'skipped';
  startTime: Date;
  endTime: Date;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  aiModel?: string;
  confidence?: number;
  humanReview?: {
    required: boolean;
    completed: boolean;
    reviewedBy?: string;
    reviewNotes?: string;
  };
}

export interface WorkflowError {
  stepId: string;
  errorType: 'ai_error' | 'validation_error' | 'system_error' | 'user_error';
  message: string;
  details: Record<string, unknown>;
  timestamp: Date;
  resolved: boolean;
}

export interface AIInteraction {
  stepId: string;
  model: string;
  prompt: string;
  response: string;
  confidence: number;
  processingTime: number;
  cost: number;
  timestamp: Date;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  workflow: Omit<AIWorkflow, 'id' | 'metadata' | 'performance'>;
  usageCount: number;
  rating: number;
  tags: string[];
}

export interface WorkflowAnalytics {
  workflowId: string;
  timeframe: {
    start: Date;
    end: Date;
  };
  executions: {
    total: number;
    successful: number;
    failed: number;
    averageTime: number;
  };
  performance: {
    aiAccuracy: number;
    humanInterventionRate: number;
    costPerExecution: number;
    timeReduction: number; // percentage compared to manual process
  };
  trends: {
    executionCount: Array<{ date: Date; count: number }>;
    successRate: Array<{ date: Date; rate: number }>;
    performance: Array<{ date: Date; score: number }>;
  };
  recommendations: string[];
}

export interface ProcessOptimization {
  workflowId: string;
  analysis: {
    bottlenecks: Array<{
      stepId: string;
      impact: 'high' | 'medium' | 'low';
      description: string;
      suggestedFix: string;
    }>;
    automationOpportunities: Array<{
      stepId: string;
      automationPotential: number; // 0-1
      estimatedSavings: number; // in hours per month
      complexity: 'low' | 'medium' | 'high';
    }>;
    aiImprovements: Array<{
      stepId: string;
      currentAccuracy: number;
      targetAccuracy: number;
      improvementStrategy: string;
    }>;
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    description: string;
    estimatedImpact: string;
    implementationEffort: 'low' | 'medium' | 'high';
  }[];
  projectedBenefits: {
    timeReduction: number; // percentage
    costSavings: number; // per month
    accuracyImprovement: number; // percentage
    satisfactionImprovement: number; // percentage
  };
}

export interface WorkflowConfig {
  aiProvider: 'openai' | 'claude' | 'google' | 'azure';
  fallbackProviders: string[];
  maxRetries: number;
  timeoutMs: number;
  enableCaching: boolean;
  humanReviewThreshold: number; // confidence threshold below which human review is required
  autoApprovalThreshold: number; // confidence threshold above which auto-approval is allowed
  costLimits: {
    perExecution: number;
    perDay: number;
    perMonth: number;
  };
  notifications: {
    onFailure: boolean;
    onHumanReviewRequired: boolean;
    onCompletion: boolean;
    recipients: string[];
  };
}
