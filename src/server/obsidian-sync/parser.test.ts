// src/server/obsidian-sync/parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseTaskFile, taskToMarkdown } from './parser';

const SAMPLE_MD = `---
id: "abc-123"
title: "Fix login bug"
status: "in-progress"
priority: "high"
assignee_type: "staff"
assignee_name: "Duncan"
tags: ["auth", "urgent"]
due_date: "2026-03-14"
workspace_id: "ws-123"
created_at: "2026-03-07T10:00:00Z"
---

## Description
Fix the broken login redirect.

## Notes
Happening on Safari only.
`;

describe('parseTaskFile', () => {
  it('parses YAML frontmatter into a Task object', () => {
    const result = parseTaskFile(SAMPLE_MD, 'Tasks/in-progress/fix-login-bug.md');
    expect(result.id).toBe('abc-123');
    expect(result.title).toBe('Fix login bug');
    expect(result.status).toBe('in-progress');
    expect(result.priority).toBe('high');
    expect(result.assignee_type).toBe('staff');
    expect(result.assignee_name).toBe('Duncan');
    expect(result.tags).toEqual(['auth', 'urgent']);
    expect(result.due_date).toBe('2026-03-14');
    expect(result.obsidian_path).toBe('Tasks/in-progress/fix-login-bug.md');
  });
});

describe('taskToMarkdown', () => {
  it('serialises a Task back to markdown with YAML frontmatter', () => {
    const task = { id: 'abc-123', title: 'Fix login', status: 'todo' as const,
      priority: 'high' as const, assignee_type: 'self' as const, tags: [],
      position: 0, workspace_id: 'ws-1', created_at: '2026-03-07T10:00:00Z',
      updated_at: '2026-03-07T10:00:00Z' };
    const md = taskToMarkdown(task);
    expect(md).toContain('id: "abc-123"');
    expect(md).toContain('title: "Fix login"');
    expect(md).toContain('status: "todo"');
    expect(md).toContain('## Description');
  });
});
