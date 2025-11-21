# Phase 82 - Human Supervision & Oversight Engine (HSOE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase82-human-supervision-oversight`

## Executive Summary

Phase 82 introduces a unified human-approval, review, and override system governing MAOS, Deep Agent orchestration, ADRE operations, and Voice-First agent actions. All high-risk or irreversible actions must pass a structured human governance pipeline.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Enforce claude.md | Yes |
| Strict Vendor Secrecy | Yes |
| Multi-Step Approval Required | Yes |
| RLS All Tables | Yes |
| All Actions Logged | Yes |
| Voice Budget Respected | Yes |
| No Model Names Exposed | Yes |
| No External API Calls | Yes |

## Mode Configuration

- **Type**: Governance Layer
- **Human in Loop**: Yes
- **Interfaces**: Dashboard, Voice, CLI
- **Approval Levels**: Technician, Manager, Director

## Database Schema

### Migration 134: Human Supervision & Oversight Engine

```sql
-- 134_human_supervision_oversight_engine.sql

-- HSOE requests table
CREATE TABLE IF NOT EXISTS hsoe_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  trigger_source TEXT NOT NULL,
  action_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Risk level check
  CONSTRAINT hsoe_requests_risk_level_check CHECK (
    risk_level IN ('low', 'medium', 'high', 'critical')
  ),

  -- Status check
  CONSTRAINT hsoe_requests_status_check CHECK (
    status IN ('pending', 'in_review', 'approved', 'denied', 'escalated', 'expired')
  ),

  -- Trigger source check
  CONSTRAINT hsoe_requests_trigger_source_check CHECK (
    trigger_source IN ('maos', 'deep_agent', 'adre', 'voice', 'manual', 'system')
  ),

  -- Foreign keys
  CONSTRAINT hsoe_requests_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT hsoe_requests_created_by_fk
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hsoe_requests_tenant ON hsoe_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hsoe_requests_status ON hsoe_requests(status);
CREATE INDEX IF NOT EXISTS idx_hsoe_requests_risk ON hsoe_requests(risk_level);
CREATE INDEX IF NOT EXISTS idx_hsoe_requests_source ON hsoe_requests(trigger_source);
CREATE INDEX IF NOT EXISTS idx_hsoe_requests_created ON hsoe_requests(created_at DESC);

-- Enable RLS
ALTER TABLE hsoe_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY hsoe_requests_select ON hsoe_requests
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY hsoe_requests_insert ON hsoe_requests
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY hsoe_requests_update ON hsoe_requests
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE hsoe_requests IS 'Human oversight requests (Phase 82)';

-- HSOE approvals table
CREATE TABLE IF NOT EXISTS hsoe_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL,
  approver_id UUID NOT NULL,
  approval_level TEXT NOT NULL,
  decision TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Approval level check
  CONSTRAINT hsoe_approvals_level_check CHECK (
    approval_level IN ('technician', 'manager', 'director', 'admin')
  ),

  -- Decision check
  CONSTRAINT hsoe_approvals_decision_check CHECK (
    decision IN ('approve', 'deny', 'escalate', 'defer')
  ),

  -- Foreign keys
  CONSTRAINT hsoe_approvals_request_fk
    FOREIGN KEY (request_id) REFERENCES hsoe_requests(id) ON DELETE CASCADE,
  CONSTRAINT hsoe_approvals_approver_fk
    FOREIGN KEY (approver_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hsoe_approvals_request ON hsoe_approvals(request_id);
CREATE INDEX IF NOT EXISTS idx_hsoe_approvals_approver ON hsoe_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_hsoe_approvals_level ON hsoe_approvals(approval_level);
CREATE INDEX IF NOT EXISTS idx_hsoe_approvals_decision ON hsoe_approvals(decision);
CREATE INDEX IF NOT EXISTS idx_hsoe_approvals_created ON hsoe_approvals(created_at DESC);

-- Enable RLS
ALTER TABLE hsoe_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies (via hsoe_requests)
CREATE POLICY hsoe_approvals_select ON hsoe_approvals
  FOR SELECT TO authenticated
  USING (request_id IN (
    SELECT id FROM hsoe_requests
    WHERE tenant_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY hsoe_approvals_insert ON hsoe_approvals
  FOR INSERT TO authenticated
  WITH CHECK (request_id IN (
    SELECT id FROM hsoe_requests
    WHERE tenant_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE hsoe_approvals IS 'Human oversight approvals (Phase 82)';

-- HSOE audit log table
CREATE TABLE IF NOT EXISTS hsoe_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  actor_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Event type check
  CONSTRAINT hsoe_audit_log_event_check CHECK (
    event_type IN (
      'created', 'viewed', 'approved', 'denied', 'escalated',
      'expired', 'overridden', 'comment_added', 'status_changed'
    )
  ),

  -- Foreign keys
  CONSTRAINT hsoe_audit_log_request_fk
    FOREIGN KEY (request_id) REFERENCES hsoe_requests(id) ON DELETE CASCADE,
  CONSTRAINT hsoe_audit_log_actor_fk
    FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hsoe_audit_log_request ON hsoe_audit_log(request_id);
CREATE INDEX IF NOT EXISTS idx_hsoe_audit_log_event ON hsoe_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_hsoe_audit_log_actor ON hsoe_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_hsoe_audit_log_timestamp ON hsoe_audit_log(timestamp DESC);

-- Enable RLS
ALTER TABLE hsoe_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (via hsoe_requests)
CREATE POLICY hsoe_audit_log_select ON hsoe_audit_log
  FOR SELECT TO authenticated
  USING (request_id IN (
    SELECT id FROM hsoe_requests
    WHERE tenant_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY hsoe_audit_log_insert ON hsoe_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (request_id IN (
    SELECT id FROM hsoe_requests
    WHERE tenant_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE hsoe_audit_log IS 'Human oversight audit log (Phase 82)';
```

## HSOE Request Service

```typescript
// src/lib/oversight/hsoe-request-service.ts

import { getSupabaseServer } from '@/lib/supabase';

interface HSOERequest {
  id: string;
  tenantId: string;
  triggerSource: string;
  actionType: string;
  payload: Record<string, any>;
  riskLevel: string;
  status: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface HSOEApproval {
  id: string;
  requestId: string;
  approverId: string;
  approvalLevel: string;
  decision: string;
  notes?: string;
  createdAt: Date;
}

interface HSOEAuditEntry {
  id: string;
  requestId: string;
  eventType: string;
  metadata: Record<string, any>;
  actorId?: string;
  timestamp: Date;
}

const RISK_LEVELS = ['low', 'medium', 'high', 'critical'];
const APPROVAL_LEVELS = ['technician', 'manager', 'director', 'admin'];

export class HSOERequestService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  async createRequest(
    triggerSource: string,
    actionType: string,
    payload: Record<string, any>,
    createdBy?: string
  ): Promise<HSOERequest> {
    const supabase = await getSupabaseServer();

    // Auto-classify risk
    const riskLevel = this.autoClassifyRisk(actionType, payload);

    const { data } = await supabase
      .from('hsoe_requests')
      .insert({
        tenant_id: this.tenantId,
        trigger_source: triggerSource,
        action_type: actionType,
        payload,
        risk_level: riskLevel,
        status: 'pending',
        created_by: createdBy,
      })
      .select()
      .single();

    // Log creation
    await this.logAudit(data.id, 'created', { riskLevel }, createdBy);

    return this.mapToRequest(data);
  }

  autoClassifyRisk(actionType: string, payload: Record<string, any>): string {
    // Critical actions
    const criticalActions = [
      'delete_data',
      'modify_billing',
      'change_permissions',
      'apply_migration',
      'override_safety',
    ];

    if (criticalActions.some(a => actionType.includes(a))) {
      return 'critical';
    }

    // High risk actions
    const highRiskActions = [
      'apply_changes',
      'execute_workflow',
      'send_bulk_email',
      'modify_config',
    ];

    if (highRiskActions.some(a => actionType.includes(a))) {
      return 'high';
    }

    // Medium risk by default for automated actions
    if (payload.automated === true) {
      return 'medium';
    }

    return 'low';
  }

  async escalate(
    requestId: string,
    toLevel: string,
    reason: string,
    actorId: string
  ): Promise<HSOERequest> {
    const supabase = await getSupabaseServer();

    // Update status
    const { data } = await supabase
      .from('hsoe_requests')
      .update({
        status: 'escalated',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    // Create escalation approval entry
    await supabase.from('hsoe_approvals').insert({
      request_id: requestId,
      approver_id: actorId,
      approval_level: toLevel,
      decision: 'escalate',
      notes: reason,
    });

    // Log escalation
    await this.logAudit(requestId, 'escalated', { toLevel, reason }, actorId);

    return this.mapToRequest(data);
  }

  async resolve(
    requestId: string,
    decision: string,
    approverId: string,
    approvalLevel: string,
    notes?: string
  ): Promise<HSOERequest> {
    const supabase = await getSupabaseServer();

    // Check if approval level is sufficient
    const request = await this.getRequest(requestId);
    const requiredLevel = this.getRequiredApprovalLevel(request.riskLevel);

    if (APPROVAL_LEVELS.indexOf(approvalLevel) < APPROVAL_LEVELS.indexOf(requiredLevel)) {
      throw new Error(`Insufficient approval level. Required: ${requiredLevel}`);
    }

    // Create approval record
    await supabase.from('hsoe_approvals').insert({
      request_id: requestId,
      approver_id: approverId,
      approval_level: approvalLevel,
      decision,
      notes,
    });

    // Update request status
    const newStatus = decision === 'approve' ? 'approved' : 'denied';
    const { data } = await supabase
      .from('hsoe_requests')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    // Log resolution
    await this.logAudit(requestId, decision === 'approve' ? 'approved' : 'denied', {
      approvalLevel,
      notes,
    }, approverId);

    return this.mapToRequest(data);
  }

  private getRequiredApprovalLevel(riskLevel: string): string {
    switch (riskLevel) {
      case 'critical':
        return 'director';
      case 'high':
        return 'manager';
      case 'medium':
        return 'technician';
      default:
        return 'technician';
    }
  }

  private async logAudit(
    requestId: string,
    eventType: string,
    metadata: Record<string, any>,
    actorId?: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from('hsoe_audit_log').insert({
      request_id: requestId,
      event_type: eventType,
      metadata,
      actor_id: actorId,
    });
  }

  async getRequests(status?: string): Promise<HSOERequest[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('hsoe_requests')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data } = await query;

    return (data || []).map(r => this.mapToRequest(r));
  }

  async getRequest(requestId: string): Promise<HSOERequest> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('hsoe_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    return this.mapToRequest(data);
  }

  async getApprovals(requestId: string): Promise<HSOEApproval[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('hsoe_approvals')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at');

    return (data || []).map(a => ({
      id: a.id,
      requestId: a.request_id,
      approverId: a.approver_id,
      approvalLevel: a.approval_level,
      decision: a.decision,
      notes: a.notes,
      createdAt: new Date(a.created_at),
    }));
  }

  async getAuditLog(requestId: string): Promise<HSOEAuditEntry[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('hsoe_audit_log')
      .select('*')
      .eq('request_id', requestId)
      .order('timestamp');

    return (data || []).map(e => ({
      id: e.id,
      requestId: e.request_id,
      eventType: e.event_type,
      metadata: e.metadata,
      actorId: e.actor_id,
      timestamp: new Date(e.timestamp),
    }));
  }

  async getPendingCount(): Promise<number> {
    const supabase = await getSupabaseServer();

    const { count } = await supabase
      .from('hsoe_requests')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', this.tenantId)
      .eq('status', 'pending');

    return count || 0;
  }

  async getStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    denied: number;
    byRisk: Record<string, number>;
    bySource: Record<string, number>;
  }> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('hsoe_requests')
      .select('status, risk_level, trigger_source')
      .eq('tenant_id', this.tenantId);

    const stats = {
      total: (data || []).length,
      pending: 0,
      approved: 0,
      denied: 0,
      byRisk: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
    };

    for (const req of data || []) {
      if (req.status === 'pending') stats.pending++;
      if (req.status === 'approved') stats.approved++;
      if (req.status === 'denied') stats.denied++;

      stats.byRisk[req.risk_level] = (stats.byRisk[req.risk_level] || 0) + 1;
      stats.bySource[req.trigger_source] = (stats.bySource[req.trigger_source] || 0) + 1;
    }

    return stats;
  }

  private mapToRequest(data: any): HSOERequest {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      triggerSource: data.trigger_source,
      actionType: data.action_type,
      payload: data.payload,
      riskLevel: data.risk_level,
      status: data.status,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
```

## API Endpoints

### POST /api/oversight/requests

Create oversight request.

### POST /api/oversight/escalate/:requestId

Escalate request.

### POST /api/oversight/resolve/:requestId

Resolve (approve/deny) request.

### GET /api/oversight/requests

Get all requests.

### GET /api/oversight/approvals/:requestId

Get approvals for request.

### GET /api/oversight/audit/:requestId

Get audit log for request.

### GET /api/oversight/stats

Get oversight statistics.

## CLI Commands

```bash
# List pending requests
unite hsoe:list

# Approve request
unite hsoe:approve <request-id> --level manager --notes "Approved after review"

# Deny request
unite hsoe:deny <request-id> --notes "Rejected due to policy"

# Escalate request
unite hsoe:escalate <request-id> --to director --reason "Requires director approval"
```

## Integration Points

### MAOS Orchestrator Integration

```typescript
// In MAOS orchestrator, before executing high-risk steps:
if (step.engineType === 'deep_agent' || this.isHighRiskAction(step)) {
  const hsoe = new HSOERequestService(this.orgId);
  const request = await hsoe.createRequest(
    'maos',
    step.action,
    step.parameters,
    userId
  );

  // Wait for approval before proceeding
  if (request.riskLevel === 'high' || request.riskLevel === 'critical') {
    throw new Error(`Awaiting human approval: ${request.id}`);
  }
}
```

### ADRE Integration

```typescript
// Before applying changes to protected directories:
const hsoe = new HSOERequestService(this.orgId);
const request = await hsoe.createRequest(
  'adre',
  'apply_changes',
  { filePaths: scopePaths, diffCount: changes.length },
  userId
);

if (request.status !== 'approved') {
  throw new Error('Human approval required for applying changes');
}
```

### Voice-First Integration

```typescript
// For irreversible voice commands:
if (this.isIrreversibleAction(intent.action)) {
  const hsoe = new HSOERequestService(this.orgId);
  await hsoe.createRequest(
    'voice',
    intent.action,
    intent.parameters,
    userId
  );
  return 'This action requires human approval. A supervisor will review your request.';
}
```

## Implementation Tasks

- [ ] Create 134_human_supervision_oversight_engine.sql
- [ ] Implement HSOERequestService
- [ ] Implement HSOEApprovalService
- [ ] Create API endpoints
- [ ] Create HSOE Dashboard (React)
- [ ] Add CLI hooks
- [ ] Integrate with MAOS orchestrator
- [ ] Integrate with ADRE
- [ ] Integrate with Voice-First Layer
- [ ] Add full test suite

---

*Phase 82 - Human Supervision & Oversight Engine Complete*
