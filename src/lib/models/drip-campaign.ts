export interface DripCampaign {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  trigger_type: "manual" | "new_contact" | "tag" | "score_threshold" | "email_open" | "email_click" | "no_reply";
  trigger_config?: {
    tag?: string;
    score_threshold?: number;
    previous_step_id?: string;
    days_since?: number;
  };
  is_active: boolean;
  steps: CampaignStep[];
  total_enrolled: number;
  total_completed: number;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export interface CampaignStep {
  id: string;
  campaign_id: string;
  step_number: number;
  name: string;
  step_type: "email" | "wait" | "condition" | "tag" | "score_update" | "webhook";

  // Email step config
  content_template?: string;
  subject_template?: string;
  use_ai_personalization?: boolean;

  // Wait step config
  wait_duration?: number; // in minutes
  wait_until?: "email_open" | "email_click" | "reply" | "time_elapsed";

  // Condition step config
  condition_type?: "score" | "tag" | "email_opened" | "email_clicked" | "replied";
  condition_value?: any;
  true_next_step_id?: string;
  false_next_step_id?: string;

  // Tag step config
  tag_action?: "add" | "remove";
  tag_name?: string;

  // Score update config
  score_change?: number;

  // Webhook config
  webhook_url?: string;
  webhook_method?: "GET" | "POST";
  webhook_payload?: any;

  // General config
  next_step_id?: string; // for linear flows
  is_exit_step: boolean;

  created_at: Date;
  updated_at: Date;
}

export interface CampaignEnrollment {
  id: string;
  campaign_id: string;
  contact_id: string;
  current_step_id?: string;
  status: "active" | "completed" | "paused" | "exited";
  enrolled_at: Date;
  completed_at?: Date;
  next_execution_at?: Date;
  metadata?: any;
}

export interface CampaignExecutionLog {
  id: string;
  enrollment_id: string;
  step_id: string;
  executed_at: Date;
  status: "success" | "failed" | "skipped";
  error_message?: string;
  metadata?: any;
}

export interface CampaignMetrics {
  campaign_id: string;
  total_enrolled: number;
  total_completed: number;
  total_active: number;
  total_exited: number;
  avg_completion_time_hours?: number;
  step_metrics: {
    step_id: string;
    step_name: string;
    emails_sent?: number;
    emails_opened?: number;
    emails_clicked?: number;
    replies_received?: number;
    open_rate?: number;
    click_rate?: number;
    reply_rate?: number;
  }[];
}

// Visual Campaign Builder Types
export interface VisualCampaignNode {
  id: string;
  type: "trigger" | "email" | "wait" | "condition" | "action" | "exit";
  position: { x: number; y: number };
  data: {
    label: string;
    stepConfig?: Partial<CampaignStep>;
  };
}

export interface VisualCampaignEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: "default" | "conditional-true" | "conditional-false";
}
