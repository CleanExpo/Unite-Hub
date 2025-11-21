# Phase 80 - Autonomous Dev & Refactor Engine (ADRE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase80-autonomous-dev-refactor-engine`

## Executive Summary

Phase 80 provides a controlled autonomous development engine that can propose, generate, and refactor Unite-Hub modules (backend, frontend, migrations, docs) using Claude CLI and Deep Agent, under strict guardrails: claude.md adherence, diff-based changes, human review gates, and self-audit hooks.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Must Read claude.md and Repo Docs | Yes |
| Must Limit Scope to Requested Paths | Yes |
| Must Produce Diffs Not Raw Overwrites | Yes |
| Must Not Run Migrations Automatically | Yes |
| Must Respect Existing Phase Docs | Yes |
| Must Record All Changes in Audit Logs | Yes |
| Must Not Modify Billing/Token Pricing Logic | Yes |
| Must Not Modify Gemini Image Lock | Yes |

## Approved Tools

- Claude CLI (code, repo, test commands)
- Deep Agent (for code generation guidance)
- Internal test runners

## Database Schema

### Migration 132: Autonomous Dev Refactor Engine

```sql
-- 132_autonomous_dev_refactor_engine.sql

-- Dev refactor sessions table
CREATE TABLE IF NOT EXISTS dev_refactor_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  initiator_user_id UUID NOT NULL,
  scope_paths JSONB DEFAULT '[]'::jsonb,
  goal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Status check
  CONSTRAINT dev_refactor_sessions_status_check CHECK (
    status IN ('draft', 'analyzing', 'generating', 'review', 'approved', 'applied', 'rejected')
  ),

  -- Foreign keys
  CONSTRAINT dev_refactor_sessions_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT dev_refactor_sessions_user_fk
    FOREIGN KEY (initiator_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dev_refactor_sessions_org ON dev_refactor_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_dev_refactor_sessions_user ON dev_refactor_sessions(initiator_user_id);
CREATE INDEX IF NOT EXISTS idx_dev_refactor_sessions_status ON dev_refactor_sessions(status);
CREATE INDEX IF NOT EXISTS idx_dev_refactor_sessions_created ON dev_refactor_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE dev_refactor_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY dev_refactor_sessions_select ON dev_refactor_sessions
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY dev_refactor_sessions_insert ON dev_refactor_sessions
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY dev_refactor_sessions_update ON dev_refactor_sessions
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE dev_refactor_sessions IS 'Dev/refactor sessions (Phase 80)';

-- Dev refactor changes table
CREATE TABLE IF NOT EXISTS dev_refactor_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  change_type TEXT NOT NULL,
  diff_preview TEXT,
  tests_run JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Change type check
  CONSTRAINT dev_refactor_changes_type_check CHECK (
    change_type IN ('create', 'modify', 'delete', 'rename')
  ),

  -- Status check
  CONSTRAINT dev_refactor_changes_status_check CHECK (
    status IN ('pending', 'approved', 'rejected', 'applied')
  ),

  -- Foreign key
  CONSTRAINT dev_refactor_changes_session_fk
    FOREIGN KEY (session_id) REFERENCES dev_refactor_sessions(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dev_refactor_changes_session ON dev_refactor_changes(session_id);
CREATE INDEX IF NOT EXISTS idx_dev_refactor_changes_file ON dev_refactor_changes(file_path);
CREATE INDEX IF NOT EXISTS idx_dev_refactor_changes_status ON dev_refactor_changes(status);
CREATE INDEX IF NOT EXISTS idx_dev_refactor_changes_created ON dev_refactor_changes(created_at DESC);

-- Enable RLS
ALTER TABLE dev_refactor_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (via dev_refactor_sessions)
CREATE POLICY dev_refactor_changes_select ON dev_refactor_changes
  FOR SELECT TO authenticated
  USING (session_id IN (
    SELECT id FROM dev_refactor_sessions
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY dev_refactor_changes_insert ON dev_refactor_changes
  FOR INSERT TO authenticated
  WITH CHECK (session_id IN (
    SELECT id FROM dev_refactor_sessions
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY dev_refactor_changes_update ON dev_refactor_changes
  FOR UPDATE TO authenticated
  USING (session_id IN (
    SELECT id FROM dev_refactor_sessions
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE dev_refactor_changes IS 'Dev/refactor change records (Phase 80)';
```

## Autonomous Dev Refactor Engine Service

```typescript
// src/lib/devops/autonomous-dev-refactor-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface DevRefactorSession {
  id: string;
  orgId: string;
  initiatorUserId: string;
  scopePaths: string[];
  goal: string;
  status: string;
  createdAt: Date;
  completedAt?: Date;
}

interface DevRefactorChange {
  id: string;
  sessionId: string;
  filePath: string;
  changeType: string;
  diffPreview?: string;
  testsRun: Record<string, any>;
  status: string;
  createdAt: Date;
}

interface TestResult {
  passed: boolean;
  testCount: number;
  failures: string[];
  duration: number;
}

const FORBIDDEN_PATHS = [
  'src/lib/billing/',
  'src/lib/pricing/',
  'src/lib/tokens/',
  '.env',
  'supabase/migrations/',
];

const FORBIDDEN_PATTERNS = [
  /gemini.*model.*id/i,
  /elevenlabs.*price/i,
  /token.*rate/i,
];

export class AutonomousDevRefactorEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async createSession(
    userId: string,
    goal: string,
    scopePaths: string[]
  ): Promise<DevRefactorSession> {
    const supabase = await getSupabaseServer();

    // Validate scope paths
    for (const path of scopePaths) {
      if (this.isForbiddenPath(path)) {
        throw new Error(`Forbidden path: ${path}`);
      }
    }

    const { data } = await supabase
      .from('dev_refactor_sessions')
      .insert({
        org_id: this.orgId,
        initiator_user_id: userId,
        scope_paths: scopePaths,
        goal,
        status: 'draft',
      })
      .select()
      .single();

    return this.mapToSession(data);
  }

  private isForbiddenPath(path: string): boolean {
    return FORBIDDEN_PATHS.some(forbidden =>
      path.toLowerCase().includes(forbidden.toLowerCase())
    );
  }

  async analyzeAndGenerate(sessionId: string): Promise<DevRefactorChange[]> {
    const supabase = await getSupabaseServer();

    // Update status
    await supabase
      .from('dev_refactor_sessions')
      .update({ status: 'analyzing' })
      .eq('id', sessionId);

    const session = await this.getSession(sessionId);

    // Generate changes using Claude CLI / Deep Agent
    const changes = await this.generateChanges(session);

    // Update status
    await supabase
      .from('dev_refactor_sessions')
      .update({ status: 'generating' })
      .eq('id', sessionId);

    // Store changes
    const storedChanges: DevRefactorChange[] = [];
    for (const change of changes) {
      // Validate change doesn't modify forbidden content
      if (this.containsForbiddenPattern(change.diffPreview || '')) {
        continue; // Skip forbidden changes
      }

      const { data } = await supabase
        .from('dev_refactor_changes')
        .insert({
          session_id: sessionId,
          file_path: change.filePath,
          change_type: change.changeType,
          diff_preview: change.diffPreview,
          status: 'pending',
        })
        .select()
        .single();

      storedChanges.push(this.mapToChange(data));
    }

    // Update session to review
    await supabase
      .from('dev_refactor_sessions')
      .update({ status: 'review' })
      .eq('id', sessionId);

    return storedChanges;
  }

  private async generateChanges(session: DevRefactorSession): Promise<any[]> {
    // Would invoke Claude CLI and Deep Agent to generate diffs
    // This is a placeholder that returns example changes
    return session.scopePaths.map(path => ({
      filePath: path,
      changeType: 'modify',
      diffPreview: `--- a/${path}\n+++ b/${path}\n@@ -1,3 +1,5 @@\n // Generated change for: ${session.goal}`,
    }));
  }

  private containsForbiddenPattern(content: string): boolean {
    return FORBIDDEN_PATTERNS.some(pattern => pattern.test(content));
  }

  async runTests(sessionId: string): Promise<TestResult[]> {
    const supabase = await getSupabaseServer();
    const changes = await this.getChanges(sessionId);

    const results: TestResult[] = [];

    for (const change of changes) {
      // Run tests for the changed file
      const result = await this.runTestForFile(change.filePath);

      // Update change with test results
      await supabase
        .from('dev_refactor_changes')
        .update({ tests_run: result })
        .eq('id', change.id);

      results.push(result);
    }

    return results;
  }

  private async runTestForFile(filePath: string): Promise<TestResult> {
    // Would run actual tests via test runner
    return {
      passed: true,
      testCount: 5,
      failures: [],
      duration: 1200,
    };
  }

  async approveChange(changeId: string): Promise<DevRefactorChange> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('dev_refactor_changes')
      .update({ status: 'approved' })
      .eq('id', changeId)
      .select()
      .single();

    return this.mapToChange(data);
  }

  async rejectChange(changeId: string): Promise<DevRefactorChange> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('dev_refactor_changes')
      .update({ status: 'rejected' })
      .eq('id', changeId)
      .select()
      .single();

    return this.mapToChange(data);
  }

  async applyApprovedChanges(sessionId: string): Promise<{
    applied: number;
    skipped: number;
  }> {
    const supabase = await getSupabaseServer();
    const changes = await this.getChanges(sessionId);

    let applied = 0;
    let skipped = 0;

    for (const change of changes) {
      if (change.status === 'approved') {
        // Would apply the diff to the file system
        // This requires explicit human approval
        await supabase
          .from('dev_refactor_changes')
          .update({ status: 'applied' })
          .eq('id', change.id);
        applied++;
      } else {
        skipped++;
      }
    }

    // Update session status
    await supabase
      .from('dev_refactor_sessions')
      .update({
        status: 'applied',
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    return { applied, skipped };
  }

  async getSessions(status?: string): Promise<DevRefactorSession[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('dev_refactor_sessions')
      .select('*')
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data } = await query;

    return (data || []).map(s => this.mapToSession(s));
  }

  async getSession(sessionId: string): Promise<DevRefactorSession> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('dev_refactor_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    return this.mapToSession(data);
  }

  async getChanges(sessionId: string): Promise<DevRefactorChange[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('dev_refactor_changes')
      .select('*')
      .eq('session_id', sessionId)
      .order('file_path');

    return (data || []).map(c => this.mapToChange(c));
  }

  private mapToSession(data: any): DevRefactorSession {
    return {
      id: data.id,
      orgId: data.org_id,
      initiatorUserId: data.initiator_user_id,
      scopePaths: data.scope_paths,
      goal: data.goal,
      status: data.status,
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    };
  }

  private mapToChange(data: any): DevRefactorChange {
    return {
      id: data.id,
      sessionId: data.session_id,
      filePath: data.file_path,
      changeType: data.change_type,
      diffPreview: data.diff_preview,
      testsRun: data.tests_run,
      status: data.status,
      createdAt: new Date(data.created_at),
    };
  }
}
```

## API Endpoints

### POST /api/devops/sessions

Create dev/refactor session.

### POST /api/devops/analyze/:sessionId

Analyze and generate changes.

### POST /api/devops/test/:sessionId

Run tests for session.

### POST /api/devops/approve/:changeId

Approve individual change.

### POST /api/devops/reject/:changeId

Reject individual change.

### POST /api/devops/apply/:sessionId

Apply approved changes.

### GET /api/devops/sessions

Get all sessions.

### GET /api/devops/changes/:sessionId

Get changes for session.

## Implementation Tasks

- [ ] Create 132_autonomous_dev_refactor_engine.sql
- [ ] Implement AutonomousDevRefactorEngine
- [ ] Create API endpoints
- [ ] Create RefactorSessionViewer.tsx
- [ ] Create DiffReviewPanel.tsx
- [ ] Integrate Claude CLI for diff generation
- [ ] Add audit logging for all changes

---

*Phase 80 - Autonomous Dev & Refactor Engine Complete*
