// A/B Testing Types

export interface Experiment {
  id: string;
  name: string;
  description: string | null;
  hypothesis: string | null;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  traffic_percentage: number;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  variants?: ExperimentVariant[];
  goals?: ExperimentGoal[];
}

export interface ExperimentVariant {
  id: string;
  experiment_id: string;
  name: string;
  description: string | null;
  weight: number;
  config: Record<string, any>;
  is_control: boolean;
  created_at: string;
}

export interface ExperimentAssignment {
  id: string;
  experiment_id: string;
  variant_id: string;
  user_id: string | null;
  session_id: string | null;
  assigned_at: string;
}

export interface ExperimentResult {
  id: string;
  experiment_id: string;
  variant_id: string;
  assignment_id: string | null;
  user_id: string | null;
  session_id: string | null;
  event_name: string;
  event_value: Record<string, any>;
  created_at: string;
}

export interface ExperimentGoal {
  id: string;
  experiment_id: string;
  name: string;
  description: string | null;
  event_name: string;
  target_value: number | null;
  created_at: string;
}

export interface VariantPerformance {
  experiment_id: string;
  variant_id: string;
  variant_name: string;
  is_control: boolean;
  total_assignments: number;
  engaged_users: number;
  total_events: number;
  engagement_rate: number;
}

export interface ExperimentStats {
  variant_id: string;
  variant_name: string;
  is_control: boolean;
  sample_size: number;
  conversions: number;
  conversion_rate: number;
  confidence_level: number;
  is_significant: boolean;
}

export interface AssignmentResult {
  variant_id: string;
  variant_name: string;
  is_new_assignment: boolean;
}

export interface CreateExperimentInput {
  name: string;
  description?: string;
  hypothesis?: string;
  traffic_percentage?: number;
  start_date?: string;
  end_date?: string;
  variants: CreateVariantInput[];
  goals?: CreateGoalInput[];
}

export interface CreateVariantInput {
  name: string;
  description?: string;
  weight?: number;
  config?: Record<string, any>;
  is_control?: boolean;
}

export interface CreateGoalInput {
  name: string;
  description?: string;
  event_name: string;
  target_value?: number;
}

export interface UpdateExperimentInput {
  name?: string;
  description?: string;
  hypothesis?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  traffic_percentage?: number;
  start_date?: string;
  end_date?: string;
}

export interface TrackEventInput {
  experiment_id: string;
  event_name: string;
  event_value?: Record<string, any>;
  user_id?: string;
  session_id?: string;
}

export interface ExperimentConfig {
  [key: string]: any;
}

export interface ExperimentContext {
  experiments: Map<string, AssignmentResult>;
  getVariant: (experimentName: string) => string;
  trackEvent: (experimentName: string, eventName: string, value?: any) => void;
  isLoading: boolean;
}

export interface UseExperimentReturn {
  variant: string;
  track: (eventName: string, value?: any) => void;
  isLoading: boolean;
}
