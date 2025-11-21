# Phase 90 - Global Regulatory Harmonisation & Region-Aware Policy Engine (GRH-RAPE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase90-global-regulatory-harmonisation-region-aware-policy-engine`

## Executive Summary

Phase 90 creates a unified global regulatory engine that harmonises compliance frameworks across regions, generates region-aware internal policies, adapts orchestrator behaviour to local laws, and provides a real-time global compliance posture for multi-region and multi-licensor tenants.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Must Enforce claude.md Rules | Yes |
| Must Maintain Strict Vendor Secrecy | Yes |
| Must Not Make External API Calls | Yes |
| Must Not Expose Model Names | Yes |
| Must Enforce Multi-Tenant RLS | Yes |
| Immutable Policy History | Yes |
| Region-Specific Actions Cannot Be Bypassed | Yes |

## Supported Frameworks

| Framework | Region | Focus |
|-----------|--------|-------|
| GDPR | EU/EEA | Data protection, privacy |
| CCPA | California, USA | Consumer privacy |
| HIPAA | USA | Healthcare data |
| APP | Australia | Privacy principles |
| PIPEDA | Canada | Personal information |
| PCI-DSS | Global | Payment card data |
| ISO 27001 | Global | Information security |

## Database Schema

### Migration 142: Global Regulatory Harmonisation & Region-Aware Policy Engine

```sql
-- 142_global_regulatory_harmonisation_region_policy_engine.sql

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS grh_global_posture CASCADE;
DROP TABLE IF EXISTS grh_region_policies CASCADE;
DROP TABLE IF EXISTS grh_frameworks CASCADE;

-- GRH frameworks table
CREATE TABLE IF NOT EXISTS grh_frameworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  framework TEXT NOT NULL,
  region TEXT NOT NULL,
  requirement TEXT NOT NULL,
  mapped_internal_control TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Framework check
  CONSTRAINT grh_frameworks_framework_check CHECK (
    framework IN ('gdpr', 'ccpa', 'hipaa', 'app', 'pipeda', 'pci', 'iso27001')
  ),

  -- Severity check
  CONSTRAINT grh_frameworks_severity_check CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  )
);

-- GRH region policies table
CREATE TABLE IF NOT EXISTS grh_region_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  region TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  policy_body JSONB DEFAULT '{}'::jsonb,
  generated_from_frameworks JSONB DEFAULT '[]'::jsonb,
  effective_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Policy type check
  CONSTRAINT grh_region_policies_type_check CHECK (
    policy_type IN ('data_retention', 'consent', 'breach_notification', 'access_control', 'encryption', 'audit', 'disposal')
  ),

  -- Foreign keys
  CONSTRAINT grh_region_policies_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- GRH global posture table
CREATE TABLE IF NOT EXISTS grh_global_posture (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  region TEXT NOT NULL,
  framework TEXT NOT NULL,
  compliance_score NUMERIC NOT NULL DEFAULT 0,
  risk_factors JSONB DEFAULT '[]'::jsonb,
  last_evaluated TIMESTAMPTZ DEFAULT NOW(),

  -- Score range
  CONSTRAINT grh_global_posture_score_check CHECK (
    compliance_score >= 0 AND compliance_score <= 100
  ),

  -- Foreign keys
  CONSTRAINT grh_global_posture_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);
```

## GRH Engine Service

```typescript
// src/lib/regulatory/grh-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface Framework {
  id: string;
  framework: string;
  region: string;
  requirement: string;
  mappedInternalControl?: string;
  severity: string;
  createdAt: Date;
}

interface RegionPolicy {
  id: string;
  tenantId: string;
  region: string;
  policyType: string;
  policyBody: Record<string, any>;
  generatedFromFrameworks: string[];
  effectiveDate: Date;
  createdAt: Date;
}

interface GlobalPosture {
  id: string;
  tenantId: string;
  region: string;
  framework: string;
  complianceScore: number;
  riskFactors: string[];
  lastEvaluated: Date;
}

interface ConflictResult {
  region: string;
  conflictType: string;
  frameworks: string[];
  resolution: string;
}

export class GRHEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async harmoniseFrameworks(regions: string[]): Promise<{
    mappings: { framework: string; requirement: string; control: string }[];
    conflicts: ConflictResult[];
  }> {
    const supabase = await getSupabaseServer();

    const { data: frameworks } = await supabase
      .from('grh_frameworks')
      .select('*')
      .in('region', regions);

    const mappings: { framework: string; requirement: string; control: string }[] = [];
    const conflicts: ConflictResult[] = [];

    // Group by requirement type
    const byRequirement: Record<string, Framework[]> = {};
    for (const fw of frameworks || []) {
      const key = fw.requirement.toLowerCase();
      if (!byRequirement[key]) byRequirement[key] = [];
      byRequirement[key].push(fw);
    }

    // Create harmonised mappings
    for (const [requirement, fws] of Object.entries(byRequirement)) {
      // Find strictest control
      const sorted = fws.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (severityOrder[b.severity as keyof typeof severityOrder] || 0) -
               (severityOrder[a.severity as keyof typeof severityOrder] || 0);
      });

      const strictest = sorted[0];
      mappings.push({
        framework: strictest.framework,
        requirement: strictest.requirement,
        control: strictest.mapped_internal_control || `${strictest.framework}_${requirement}`,
      });

      // Detect conflicts
      if (fws.length > 1) {
        const conflict = this.detectConflict(fws);
        if (conflict) conflicts.push(conflict);
      }
    }

    return { mappings, conflicts };
  }

  private detectConflict(frameworks: Framework[]): ConflictResult | null {
    // Check for conflicting requirements
    const controls = new Set(frameworks.map(f => f.mapped_internal_control));
    if (controls.size > 1) {
      return {
        region: frameworks[0].region,
        conflictType: 'control_mismatch',
        frameworks: frameworks.map(f => f.framework),
        resolution: `Apply strictest: ${frameworks[0].framework}`,
      };
    }

    // Check for severity conflicts
    const severities = new Set(frameworks.map(f => f.severity));
    if (severities.size > 1) {
      return {
        region: frameworks[0].region,
        conflictType: 'severity_mismatch',
        frameworks: frameworks.map(f => f.framework),
        resolution: 'Apply highest severity',
      };
    }

    return null;
  }

  async generateRegionPolicies(region: string): Promise<RegionPolicy[]> {
    const supabase = await getSupabaseServer();

    // Get frameworks for region
    const { data: frameworks } = await supabase
      .from('grh_frameworks')
      .select('*')
      .eq('region', region);

    const policies: RegionPolicy[] = [];
    const policyTypes = [
      'data_retention',
      'consent',
      'breach_notification',
      'access_control',
      'encryption',
      'audit',
      'disposal',
    ];

    for (const policyType of policyTypes) {
      const relevantFrameworks = frameworks?.filter(f =>
        f.requirement.toLowerCase().includes(policyType.replace('_', ' '))
      ) || [];

      if (relevantFrameworks.length === 0) continue;

      const policyBody = this.generatePolicyBody(policyType, relevantFrameworks, region);

      const { data } = await supabase
        .from('grh_region_policies')
        .insert({
          tenant_id: this.orgId,
          region,
          policy_type: policyType,
          policy_body: policyBody,
          generated_from_frameworks: relevantFrameworks.map(f => f.framework),
          effective_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (data) {
        policies.push(this.mapToPolicy(data));
      }
    }

    return policies;
  }

  private generatePolicyBody(
    policyType: string,
    frameworks: Framework[],
    region: string
  ): Record<string, any> {
    const body: Record<string, any> = {
      type: policyType,
      region,
      applicableFrameworks: frameworks.map(f => f.framework),
      requirements: [],
    };

    switch (policyType) {
      case 'data_retention':
        body.defaultRetentionDays = region === 'eu' ? 730 : 1095; // GDPR stricter
        body.requirements = frameworks.map(f => ({
          framework: f.framework,
          requirement: f.requirement,
          control: f.mapped_internal_control,
        }));
        break;

      case 'breach_notification':
        body.notificationWindowHours = region === 'eu' ? 72 : 168; // GDPR 72h
        body.notifyAuthorities = region === 'eu';
        body.notifyDataSubjects = true;
        break;

      case 'consent':
        body.explicitConsentRequired = region === 'eu' || region === 'california';
        body.withdrawalMechanism = true;
        body.purposeLimitation = true;
        break;

      case 'encryption':
        body.atRest = true;
        body.inTransit = true;
        body.minimumKeyLength = 256;
        break;

      default:
        body.requirements = frameworks.map(f => ({
          framework: f.framework,
          requirement: f.requirement,
        }));
    }

    return body;
  }

  async detectConflicts(regions: string[]): Promise<ConflictResult[]> {
    const { conflicts } = await this.harmoniseFrameworks(regions);
    return conflicts;
  }

  async computeGlobalPosture(): Promise<GlobalPosture[]> {
    const supabase = await getSupabaseServer();

    // Get all policies for tenant
    const { data: policies } = await supabase
      .from('grh_region_policies')
      .select('*')
      .eq('tenant_id', this.orgId);

    // Get compliance register from EGCBI
    const { data: compliance } = await supabase
      .from('egcbi_compliance_register')
      .select('*')
      .eq('tenant_id', this.orgId);

    const postures: GlobalPosture[] = [];

    // Group policies by region
    const byRegion: Record<string, RegionPolicy[]> = {};
    for (const policy of policies || []) {
      if (!byRegion[policy.region]) byRegion[policy.region] = [];
      byRegion[policy.region].push(policy);
    }

    // Calculate posture per region/framework
    for (const [region, regionPolicies] of Object.entries(byRegion)) {
      const frameworks = new Set<string>();
      for (const policy of regionPolicies) {
        for (const fw of policy.generated_from_frameworks) {
          frameworks.add(fw);
        }
      }

      for (const framework of frameworks) {
        const score = this.calculateScore(framework, region, compliance || []);
        const riskFactors = this.identifyRiskFactors(framework, region, compliance || []);

        const { data } = await supabase
          .from('grh_global_posture')
          .upsert({
            tenant_id: this.orgId,
            region,
            framework,
            compliance_score: score,
            risk_factors: riskFactors,
            last_evaluated: new Date().toISOString(),
          }, {
            onConflict: 'tenant_id,region,framework',
          })
          .select()
          .single();

        if (data) {
          postures.push(this.mapToPosture(data));
        }
      }
    }

    return postures;
  }

  private calculateScore(
    framework: string,
    region: string,
    compliance: any[]
  ): number {
    const relevant = compliance.filter(c =>
      c.compliance_type === framework && c.region === region
    );

    if (relevant.length === 0) return 100;

    const compliant = relevant.filter(c => c.status === 'compliant').length;
    return Math.round((compliant / relevant.length) * 100);
  }

  private identifyRiskFactors(
    framework: string,
    region: string,
    compliance: any[]
  ): string[] {
    const risks: string[] = [];

    const relevant = compliance.filter(c =>
      c.compliance_type === framework && c.region === region
    );

    const nonCompliant = relevant.filter(c => c.status === 'non_compliant');
    if (nonCompliant.length > 0) {
      risks.push(`${nonCompliant.length} non-compliant obligations`);
    }

    const overdue = relevant.filter(c =>
      c.due_date && new Date(c.due_date) < new Date() && c.status !== 'compliant'
    );
    if (overdue.length > 0) {
      risks.push(`${overdue.length} overdue items`);
    }

    const critical = relevant.filter(c =>
      c.severity === 'critical' && c.status !== 'compliant'
    );
    if (critical.length > 0) {
      risks.push(`${critical.length} critical items unresolved`);
    }

    return risks;
  }

  async evaluateRegionRisk(region: string): Promise<{
    region: string;
    overallScore: number;
    byFramework: { framework: string; score: number; risks: string[] }[];
  }> {
    const supabase = await getSupabaseServer();

    const { data: postures } = await supabase
      .from('grh_global_posture')
      .select('*')
      .eq('tenant_id', this.orgId)
      .eq('region', region);

    if (!postures || postures.length === 0) {
      return { region, overallScore: 100, byFramework: [] };
    }

    const byFramework = postures.map(p => ({
      framework: p.framework,
      score: p.compliance_score,
      risks: p.risk_factors,
    }));

    const overallScore = Math.round(
      postures.reduce((sum, p) => sum + p.compliance_score, 0) / postures.length
    );

    return { region, overallScore, byFramework };
  }

  async getFrameworks(region?: string): Promise<Framework[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('grh_frameworks')
      .select('*')
      .order('framework');

    if (region) {
      query = query.eq('region', region);
    }

    const { data } = await query;

    return (data || []).map(f => this.mapToFramework(f));
  }

  async getPolicies(region?: string): Promise<RegionPolicy[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('grh_region_policies')
      .select('*')
      .eq('tenant_id', this.orgId)
      .order('created_at', { ascending: false });

    if (region) {
      query = query.eq('region', region);
    }

    const { data } = await query;

    return (data || []).map(p => this.mapToPolicy(p));
  }

  async getGlobalPosture(): Promise<GlobalPosture[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('grh_global_posture')
      .select('*')
      .eq('tenant_id', this.orgId)
      .order('compliance_score');

    return (data || []).map(p => this.mapToPosture(p));
  }

  private mapToFramework(data: any): Framework {
    return {
      id: data.id,
      framework: data.framework,
      region: data.region,
      requirement: data.requirement,
      mappedInternalControl: data.mapped_internal_control,
      severity: data.severity,
      createdAt: new Date(data.created_at),
    };
  }

  private mapToPolicy(data: any): RegionPolicy {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      region: data.region,
      policyType: data.policy_type,
      policyBody: data.policy_body,
      generatedFromFrameworks: data.generated_from_frameworks,
      effectiveDate: new Date(data.effective_date),
      createdAt: new Date(data.created_at),
    };
  }

  private mapToPosture(data: any): GlobalPosture {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      region: data.region,
      framework: data.framework,
      complianceScore: data.compliance_score,
      riskFactors: data.risk_factors,
      lastEvaluated: new Date(data.last_evaluated),
    };
  }
}
```

## Sample Generated Policy

```json
{
  "type": "breach_notification",
  "region": "eu",
  "applicableFrameworks": ["gdpr"],
  "notificationWindowHours": 72,
  "notifyAuthorities": true,
  "notifyDataSubjects": true,
  "requirements": [
    {
      "framework": "gdpr",
      "requirement": "Notify supervisory authority within 72 hours",
      "control": "breach_notification_process"
    }
  ]
}
```

## API Endpoints

### POST /api/regulatory/harmonise

Harmonise frameworks across regions.

### POST /api/regulatory/policies/:region

Generate policies for region.

### GET /api/regulatory/frameworks

Get regulatory frameworks.

### GET /api/regulatory/policies

Get generated policies.

### GET /api/regulatory/posture

Get global compliance posture.

### GET /api/regulatory/risk/:region

Evaluate region risk.

## CLI Commands

```bash
# List frameworks
unite grh:frameworks --region=eu

# Generate policies
unite grh:policies --region=california

# View global posture
unite grh:posture

# Simulate region risk
unite grh:simulate-region australia
```

## Implementation Tasks

- [ ] Create 142_global_regulatory_harmonisation_region_policy_engine.sql
- [ ] Implement GRHEngine
- [ ] Create API endpoints
- [ ] Create FrameworkMapper.tsx
- [ ] Create RegionPolicyViewer.tsx
- [ ] Create PostureHeatmap.tsx
- [ ] Create ConflictVisualiser.tsx
- [ ] Integrate with EGCBI
- [ ] Integrate with SORIE
- [ ] Integrate with ASRS
- [ ] Integrate with AIRE
- [ ] Integrate with UPEWE
- [ ] Add CLI commands
- [ ] Write Jest test suite

---

*Phase 90 - Global Regulatory Harmonisation & Region-Aware Policy Engine Complete*
