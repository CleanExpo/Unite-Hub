// src/server/obsidian-sync/parser.ts
import matter from 'gray-matter';
import { Task, TaskStatus, TaskPriority, AssigneeType } from '@/types/kanban';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const yaml = require('js-yaml') as { load: (s: string) => object; dump: (v: unknown, o?: Record<string, unknown>) => string };

export function parseTaskFile(content: string, obsidianPath: string): Partial<Task> {
  const { data, content: body } = matter(content);
  return {
    id: data.id,
    title: data.title,
    description: body.trim() || undefined,
    status: (data.status as TaskStatus) ?? 'todo',
    priority: (data.priority as TaskPriority) ?? 'medium',
    assignee_type: (data.assignee_type as AssigneeType) ?? 'self',
    assignee_id: data.assignee_id,
    assignee_name: data.assignee_name,
    tags: Array.isArray(data.tags) ? data.tags : [],
    due_date: data.due_date,
    workspace_id: data.workspace_id,
    obsidian_path: obsidianPath,
    created_at: data.created_at,
  };
}

export function taskToMarkdown(task: Partial<Task>): string {
  const frontmatter: Record<string, unknown> = {
    id: task.id,
    title: task.title,
    status: task.status ?? 'todo',
    priority: task.priority ?? 'medium',
    assignee_type: task.assignee_type ?? 'self',
    ...(task.assignee_id && { assignee_id: task.assignee_id }),
    ...(task.assignee_name && { assignee_name: task.assignee_name }),
    tags: task.tags ?? [],
    ...(task.due_date && { due_date: task.due_date }),
    workspace_id: task.workspace_id,
    created_at: task.created_at ?? new Date().toISOString(),
  };

  const body = `\n## Description\n${task.description ?? ''}\n\n## Notes\n`;
  return matter.stringify(body, frontmatter, {
    engines: {
      yaml: {
        parse: yaml.load.bind(yaml),
        stringify: (obj: unknown) => yaml.dump(obj, { quotingType: '"', forceQuotes: true }),
      },
    },
  });
}
