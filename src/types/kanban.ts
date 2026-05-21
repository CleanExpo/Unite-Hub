// src/types/kanban.ts

export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AssigneeType = 'self' | 'agent' | 'staff' | 'client';

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_type: AssigneeType;
  assignee_id?: string;
  assignee_name?: string;
  obsidian_path?: string;
  obsidian_synced_at?: string;
  tags: string[];
  due_date?: string;
  position: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface KanbanColumn {
  id: TaskStatus;
  label: string;
  tasks: Task[];
}

export interface WorkspaceVaultConfig {
  workspace_id: string;
  vault_path: string;
  sync_enabled: boolean;
  last_synced_at?: string;
}

export const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'TO DO' },
  { id: 'in-progress', label: 'IN PROGRESS' },
  { id: 'blocked', label: 'BLOCKED' },
  { id: 'done', label: 'DONE' },
];

export const PRIORITY_COLOURS: Record<TaskPriority, string> = {
  urgent: '#ef4444',
  high: '#f59e0b',
  medium: '#00F5FF',
  low: '#666666',
};

export const ASSIGNEE_COLOURS: Record<AssigneeType, string> = {
  agent: '#00F5FF',
  staff: '#22c55e',
  client: '#a855f7',
  self: '#FFFFFF',
};
