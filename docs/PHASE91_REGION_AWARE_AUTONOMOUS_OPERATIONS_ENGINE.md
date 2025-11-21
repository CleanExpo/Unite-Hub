# Phase 91: Region-Aware Autonomous Operations Engine (RAAOE)

## Overview

The Region-Aware Autonomous Operations Engine (RAAOE) implements a dynamic region-sensitive operational layer that tailors MAOS behavior, safety thresholds, reasoning priorities, and regional compliance to tenant geography.

## Database Schema

### Tables

#### raaoe_region_profiles
Stores operational modes, safety thresholds, reasoning weights, and SLA profiles per region.

```sql
CREATE TABLE raaoe_region_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region TEXT NOT NULL UNIQUE,
  operational_mode TEXT NOT NULL DEFAULT 'standard',
  safety_threshold NUMERIC NOT NULL DEFAULT 0.7,
  reasoning_weights JSONB DEFAULT '{}'::jsonb,
  sla_profile JSONB DEFAULT '{}'::jsonb,
  compliance_frameworks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### raaoe_tenant_regions
Maps tenants to regions with optional config overrides.

```sql
CREATE TABLE raaoe_tenant_regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  region TEXT NOT NULL,
  config_overrides JSONB DEFAULT '{}'::jsonb,
  auto_detected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT raaoe_tenant_regions_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);
```

#### raaoe_actions_log
Logs region-aware action adjustments and routing decisions.

```sql
CREATE TABLE raaoe_actions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  region TEXT NOT NULL,
  action_type TEXT NOT NULL,
  original_params JSONB DEFAULT '{}'::jsonb,
  adjusted_params JSONB DEFAULT '{}'::jsonb,
  adjustment_reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT raaoe_actions_log_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);
```

## TypeScript Service

### RAAOEEngine.ts

```typescript
import { createClient } from '@supabase/supabase-js';

interface RegionProfile {
  id: string;
  region: string;
  operational_mode: 'standard' | 'conservative' | 'aggressive' | 'compliance_heavy';
  safety_threshold: number;
  reasoning_weights: Record<string, number>;
  sla_profile: {
    max_response_time_ms: number;
    max_retries: number;
    timeout_ms: number;
  };
  compliance_frameworks: string[];
}

interface TenantRegion {
  id: string;
  tenant_id: string;
  region: string;
  config_overrides: Record<string, any>;
  auto_detected: boolean;
}

interface ActionAdjustment {
  tenant_id: string;
  region: string;
  action_type: string;
  original_params: Record<string, any>;
  adjusted_params: Record<string, any>;
  adjustment_reason: string;
}

export class RAAOEEngine {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Determine region for a tenant based on various signals
   */
  async determineRegion(tenantId: string, signals?: {
    ip_address?: string;
    timezone?: string;
    language?: string;
    explicit_region?: string;
  }): Promise<string> {
    // Check explicit tenant region first
    const { data: tenantRegion } = await this.supabase
      .from('raaoe_tenant_regions')
      .select('region')
      .eq('tenant_id', tenantId)
      .single();

    if (tenantRegion) {
      return tenantRegion.region;
    }

    // Auto-detect from signals
    if (signals?.explicit_region) {
      return signals.explicit_region;
    }

    // Default region detection logic
    if (signals?.timezone) {
      return this.mapTimezoneToRegion(signals.timezone);
    }

    return 'global'; // Default fallback
  }

  /**
   * Apply region-specific adjustments to operation parameters
   */
  async applyRegionAdjustments(
    tenantId: string,
    actionType: string,
    params: Record<string, any>
  ): Promise<Record<string, any>> {
    const region = await this.determineRegion(tenantId);
    const profile = await this.getRegionProfile(region);

    if (!profile) {
      return params; // No adjustments if no profile
    }

    const adjustedParams = { ...params };
    let adjustmentReason = '';

    // Apply safety threshold adjustments
    if (params.risk_score !== undefined) {
      const originalRisk = params.risk_score;
      if (originalRisk > profile.safety_threshold * 100) {
        adjustedParams.requires_approval = true;
        adjustmentReason += `Risk ${originalRisk} exceeds regional threshold ${profile.safety_threshold * 100}. `;
      }
    }

    // Apply operational mode adjustments
    switch (profile.operational_mode) {
      case 'conservative':
        adjustedParams.max_autonomy_level = Math.min(
          adjustedParams.max_autonomy_level || 100,
          50
        );
        adjustmentReason += 'Conservative mode: limited autonomy. ';
        break;
      case 'compliance_heavy':
        adjustedParams.audit_level = 'detailed';
        adjustedParams.require_compliance_check = true;
        adjustmentReason += 'Compliance-heavy mode: enhanced auditing. ';
        break;
      case 'aggressive':
        adjustedParams.parallel_execution = true;
        adjustedParams.retry_aggressively = true;
        adjustmentReason += 'Aggressive mode: optimized for speed. ';
        break;
    }

    // Apply SLA constraints
    if (profile.sla_profile) {
      adjustedParams.timeout_ms = profile.sla_profile.timeout_ms;
      adjustedParams.max_retries = profile.sla_profile.max_retries;
    }

    // Log the adjustment
    if (adjustmentReason) {
      await this.logActionAdjustment({
        tenant_id: tenantId,
        region,
        action_type: actionType,
        original_params: params,
        adjusted_params: adjustedParams,
        adjustment_reason: adjustmentReason.trim()
      });
    }

    return adjustedParams;
  }

  /**
   * Route operation to regional agents based on tenant region
   */
  async routeToRegionalAgents(
    tenantId: string,
    operation: string,
    payload: Record<string, any>
  ): Promise<{ agent: string; endpoint: string; priority: number }> {
    const region = await this.determineRegion(tenantId);
    const profile = await this.getRegionProfile(region);

    // Default routing
    const routing = {
      agent: 'default',
      endpoint: '/api/agents/default',
      priority: 5
    };

    // Region-specific routing rules
    const regionRoutes: Record<string, typeof routing> = {
      'eu': {
        agent: 'eu-compliance-agent',
        endpoint: '/api/agents/eu-compliance',
        priority: 8
      },
      'us': {
        agent: 'us-operations-agent',
        endpoint: '/api/agents/us-operations',
        priority: 7
      },
      'apac': {
        agent: 'apac-operations-agent',
        endpoint: '/api/agents/apac-operations',
        priority: 6
      },
      'au': {
        agent: 'au-compliance-agent',
        endpoint: '/api/agents/au-compliance',
        priority: 8
      }
    };

    return regionRoutes[region] || routing;
  }

  /**
   * Adjust reasoning weights based on regional priorities
   */
  async adjustReasoningWeights(
    tenantId: string,
    baseWeights: Record<string, number>
  ): Promise<Record<string, number>> {
    const region = await this.determineRegion(tenantId);
    const profile = await this.getRegionProfile(region);

    if (!profile?.reasoning_weights) {
      return baseWeights;
    }

    const adjustedWeights = { ...baseWeights };

    // Merge regional weights with base weights
    for (const [key, value] of Object.entries(profile.reasoning_weights)) {
      if (adjustedWeights[key] !== undefined) {
        adjustedWeights[key] = (adjustedWeights[key] + value) / 2;
      } else {
        adjustedWeights[key] = value;
      }
    }

    return adjustedWeights;
  }

  /**
   * Apply regional SLA requirements to operation
   */
  async applyRegionalSLA(
    tenantId: string,
    operation: { name: string; estimated_duration_ms: number }
  ): Promise<{
    allowed: boolean;
    adjusted_timeout: number;
    priority_boost: number;
    reason?: string;
  }> {
    const region = await this.determineRegion(tenantId);
    const profile = await this.getRegionProfile(region);

    if (!profile?.sla_profile) {
      return {
        allowed: true,
        adjusted_timeout: operation.estimated_duration_ms * 2,
        priority_boost: 0
      };
    }

    const sla = profile.sla_profile;

    // Check if operation can meet SLA
    if (operation.estimated_duration_ms > sla.max_response_time_ms) {
      return {
        allowed: false,
        adjusted_timeout: sla.timeout_ms,
        priority_boost: 0,
        reason: `Operation duration ${operation.estimated_duration_ms}ms exceeds regional SLA ${sla.max_response_time_ms}ms`
      };
    }

    return {
      allowed: true,
      adjusted_timeout: sla.timeout_ms,
      priority_boost: profile.operational_mode === 'aggressive' ? 2 : 0
    };
  }

  /**
   * Get region profile by region code
   */
  private async getRegionProfile(region: string): Promise<RegionProfile | null> {
    const { data } = await this.supabase
      .from('raaoe_region_profiles')
      .select('*')
      .eq('region', region)
      .single();

    return data;
  }

  /**
   * Log action adjustment for audit trail
   */
  private async logActionAdjustment(adjustment: ActionAdjustment): Promise<void> {
    await this.supabase
      .from('raaoe_actions_log')
      .insert(adjustment);
  }

  /**
   * Map timezone to region code
   */
  private mapTimezoneToRegion(timezone: string): string {
    const tzMapping: Record<string, string> = {
      'Europe/': 'eu',
      'America/': 'us',
      'Australia/': 'au',
      'Asia/': 'apac',
      'Pacific/': 'apac'
    };

    for (const [prefix, region] of Object.entries(tzMapping)) {
      if (timezone.startsWith(prefix)) {
        return region;
      }
    }

    return 'global';
  }
}

export const raaoeEngine = new RAAOEEngine();
```

## API Endpoints

### POST /api/raaoe/determine-region
Determine the region for a tenant.

### POST /api/raaoe/adjust-params
Apply region-specific adjustments to operation parameters.

### POST /api/raaoe/route
Route operation to appropriate regional agents.

### GET /api/raaoe/profiles
List all region profiles.

### GET /api/raaoe/actions-log
Get action adjustment logs for a tenant.

## Integration Points

### MAOS Integration
- MAOS calls RAAOE before dispatching any operation
- RAAOE returns adjusted parameters and routing info
- MAOS uses regional SLA profiles for timeout management

### MCSE Integration
- MCSE applies regional reasoning weights from RAAOE
- Cognitive validation thresholds adjusted per region
- Regional compliance frameworks inform validation rules

### ASRS Integration
- Safety thresholds adjusted based on regional profile
- Risk scoring incorporates regional factors
- Block decisions consider regional compliance requirements

### AIRE Integration
- Incident response playbooks selected by region
- Remediation actions adjusted for regional requirements
- Escalation paths follow regional hierarchy

### UPEWE Integration
- Forecast models incorporate regional patterns
- Early warning thresholds adjusted per region
- Regional SLA breaches trigger alerts

### SORIE Integration
- Strategic objectives weighted by regional priorities
- Roadmap recommendations consider regional factors
- KPI targets adjusted for regional performance

### EGCBI Integration
- Compliance register filtered by region
- Board reports include regional breakdown
- Governance signals tagged with region

### GRH-RAPE Integration
- Primary source for compliance frameworks by region
- Regional policies inform RAAOE safety thresholds
- Framework requirements drive operational mode selection

## Regional Profiles

### EU Region
```json
{
  "region": "eu",
  "operational_mode": "compliance_heavy",
  "safety_threshold": 0.8,
  "reasoning_weights": {
    "privacy": 0.9,
    "compliance": 0.9,
    "efficiency": 0.6
  },
  "sla_profile": {
    "max_response_time_ms": 5000,
    "max_retries": 3,
    "timeout_ms": 30000
  },
  "compliance_frameworks": ["gdpr", "iso27001"]
}
```

### US Region
```json
{
  "region": "us",
  "operational_mode": "standard",
  "safety_threshold": 0.7,
  "reasoning_weights": {
    "efficiency": 0.8,
    "scalability": 0.8,
    "compliance": 0.7
  },
  "sla_profile": {
    "max_response_time_ms": 3000,
    "max_retries": 5,
    "timeout_ms": 20000
  },
  "compliance_frameworks": ["ccpa", "hipaa", "pci"]
}
```

### AU Region
```json
{
  "region": "au",
  "operational_mode": "conservative",
  "safety_threshold": 0.75,
  "reasoning_weights": {
    "privacy": 0.85,
    "compliance": 0.8,
    "efficiency": 0.7
  },
  "sla_profile": {
    "max_response_time_ms": 4000,
    "max_retries": 4,
    "timeout_ms": 25000
  },
  "compliance_frameworks": ["app", "iso27001"]
}
```

## Usage Example

```typescript
import { raaoeEngine } from '@/lib/services/raaoe/RAAOEEngine';

// Determine region and apply adjustments
async function processOperation(tenantId: string, operation: any) {
  // Get region-adjusted parameters
  const adjustedParams = await raaoeEngine.applyRegionAdjustments(
    tenantId,
    operation.type,
    operation.params
  );

  // Get routing information
  const routing = await raaoeEngine.routeToRegionalAgents(
    tenantId,
    operation.type,
    adjustedParams
  );

  // Check SLA compliance
  const slaCheck = await raaoeEngine.applyRegionalSLA(
    tenantId,
    {
      name: operation.type,
      estimated_duration_ms: operation.estimated_duration
    }
  );

  if (!slaCheck.allowed) {
    throw new Error(slaCheck.reason);
  }

  // Execute with adjusted parameters
  return executeOperation(routing.endpoint, adjustedParams, {
    timeout: slaCheck.adjusted_timeout,
    priority: routing.priority + slaCheck.priority_boost
  });
}
```

## Migration

See `supabase/migrations/143_region_aware_autonomous_operations_engine.sql`
