export interface AgentType {
  id: string;
  name: string;
}

export interface ExecutionContext {
  execution_id: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  start_time: Date;
  end_time?: Date;
  output?: string;
  error?: string;
  metadata?: {
    args?: string[];
    phase?: string;
    timeout?: number;
  };
}

export interface TaskDefinition {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
  dependencies: string[];
  phase: string;
  timeout: number;
  retry_count: number;
  created_at: Date;
  updated_at: Date;
}

export default AgentType;