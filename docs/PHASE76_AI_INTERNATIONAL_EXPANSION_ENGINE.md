# Phase 76 - AI International Expansion Engine (AIEE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase76-ai-international-expansion-engine`

## Executive Summary

Phase 76 provides a fully autonomous engine that generates region-specific business models, compliance mappings, pricing, service adaptations, language packs, and expansion roadmaps for any country selected by the user.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Vendor Secrecy | Yes |
| Multilingual Support | Yes |
| Cost Controls | Yes |
| Tier Respect | Yes |
| Model Routing | Deep Agent + Claude + Knowledge Graph |
| Region Data Sourcing | User-provided or public data only |

## Database Schema

### Migration 128: AI International Expansion Engine

```sql
-- 128_ai_international_expansion_engine.sql

-- International expansion profiles table
CREATE TABLE IF NOT EXISTS international_expansion_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  region_code TEXT NOT NULL,
  market_summary JSONB DEFAULT '{}'::jsonb,
  competition_profile JSONB DEFAULT '{}'::jsonb,
  regulation_factors JSONB DEFAULT '{}'::jsonb,
  recommended_services JSONB DEFAULT '[]'::jsonb,
  pricing_model JSONB DEFAULT '{}'::jsonb,
  localisation_instructions JSONB DEFAULT '{}'::jsonb,
  expansion_score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Expansion score check
  CONSTRAINT international_expansion_profiles_score_check CHECK (
    expansion_score >= 0 AND expansion_score <= 100
  ),

  -- Foreign key
  CONSTRAINT international_expansion_profiles_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_international_expansion_profiles_org ON international_expansion_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_international_expansion_profiles_region ON international_expansion_profiles(region_code);
CREATE INDEX IF NOT EXISTS idx_international_expansion_profiles_score ON international_expansion_profiles(expansion_score DESC);
CREATE INDEX IF NOT EXISTS idx_international_expansion_profiles_created ON international_expansion_profiles(created_at DESC);

-- Enable RLS
ALTER TABLE international_expansion_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY international_expansion_profiles_select ON international_expansion_profiles
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY international_expansion_profiles_insert ON international_expansion_profiles
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY international_expansion_profiles_update ON international_expansion_profiles
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE international_expansion_profiles IS 'International expansion profiles (Phase 76)';

-- International expansion tasks table
CREATE TABLE IF NOT EXISTS international_expansion_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  profile_id UUID NOT NULL,
  task_title TEXT NOT NULL,
  task_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT international_expansion_tasks_status_check CHECK (
    status IN ('pending', 'in_progress', 'completed', 'blocked')
  ),

  -- Foreign keys
  CONSTRAINT international_expansion_tasks_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT international_expansion_tasks_profile_fk
    FOREIGN KEY (profile_id) REFERENCES international_expansion_profiles(id) ON DELETE CASCADE,
  CONSTRAINT international_expansion_tasks_assigned_fk
    FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_international_expansion_tasks_org ON international_expansion_tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_international_expansion_tasks_profile ON international_expansion_tasks(profile_id);
CREATE INDEX IF NOT EXISTS idx_international_expansion_tasks_status ON international_expansion_tasks(status);
CREATE INDEX IF NOT EXISTS idx_international_expansion_tasks_due ON international_expansion_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_international_expansion_tasks_created ON international_expansion_tasks(created_at DESC);

-- Enable RLS
ALTER TABLE international_expansion_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY international_expansion_tasks_select ON international_expansion_tasks
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY international_expansion_tasks_insert ON international_expansion_tasks
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY international_expansion_tasks_update ON international_expansion_tasks
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE international_expansion_tasks IS 'International expansion tasks (Phase 76)';
```

## International Expansion Engine Service

```typescript
// src/lib/expansion/international-expansion-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface ExpansionProfile {
  id: string;
  orgId: string;
  regionCode: string;
  marketSummary: Record<string, any>;
  competitionProfile: Record<string, any>;
  regulationFactors: Record<string, any>;
  recommendedServices: string[];
  pricingModel: Record<string, any>;
  localisationInstructions: Record<string, any>;
  expansionScore: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ExpansionTask {
  id: string;
  orgId: string;
  profileId: string;
  taskTitle: string;
  taskDescription?: string;
  status: string;
  assignedTo?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface LocalisationPack {
  regionCode: string;
  language: string;
  toneGuidelines: string[];
  culturalNotes: string[];
  terminologyMap: Record<string, string>;
  localisationScore: number;
}

export class InternationalExpansionEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async generateExpansionProfile(regionCode: string): Promise<ExpansionProfile> {
    const supabase = await getSupabaseServer();

    // Generate comprehensive profile
    const marketSummary = await this.analyzeMarket(regionCode);
    const competitionProfile = await this.analyzeCompetition(regionCode);
    const regulationFactors = await this.analyzeRegulations(regionCode);
    const recommendedServices = await this.recommendServices(regionCode);
    const pricingModel = await this.generatePricingModel(regionCode);
    const localisationInstructions = await this.generateLocalisation(regionCode);
    const expansionScore = this.calculateExpansionScore(
      marketSummary,
      competitionProfile,
      regulationFactors
    );

    const { data } = await supabase
      .from('international_expansion_profiles')
      .insert({
        org_id: this.orgId,
        region_code: regionCode,
        market_summary: marketSummary,
        competition_profile: competitionProfile,
        regulation_factors: regulationFactors,
        recommended_services: recommendedServices,
        pricing_model: pricingModel,
        localisation_instructions: localisationInstructions,
        expansion_score: expansionScore,
      })
      .select()
      .single();

    return this.mapToProfile(data);
  }

  private async analyzeMarket(regionCode: string): Promise<Record<string, any>> {
    // Would integrate with knowledge graph and market data
    return {
      marketSize: 'Medium',
      growthRate: 8.5,
      maturity: 'Developing',
      keySegments: ['Commercial', 'Residential', 'Industrial'],
      entryBarriers: ['Licensing', 'Local partnerships'],
      opportunities: ['Underserved market', 'Growing demand'],
    };
  }

  private async analyzeCompetition(regionCode: string): Promise<Record<string, any>> {
    return {
      competitorCount: 15,
      marketLeaders: ['Local Company A', 'International Corp B'],
      marketConcentration: 'Moderate',
      differentiationOpportunities: ['Technology', 'Service quality', 'Pricing'],
      competitiveThreat: 'Medium',
    };
  }

  private async analyzeRegulations(regionCode: string): Promise<Record<string, any>> {
    return {
      businessLicense: 'Required',
      industryLicenses: ['Trade license', 'Safety certification'],
      taxStructure: {
        corporateTax: 25,
        vatGst: 10,
      },
      laborLaws: ['Local hiring requirements', 'Work permits for expats'],
      dataProtection: 'GDPR-equivalent',
      complianceComplexity: 'Moderate',
    };
  }

  private async recommendServices(regionCode: string): Promise<string[]> {
    // Based on market analysis
    return [
      'Core service offering',
      'Maintenance contracts',
      'Emergency response',
      'Consultation services',
    ];
  }

  private async generatePricingModel(regionCode: string): Promise<Record<string, any>> {
    return {
      currency: this.getCurrency(regionCode),
      pricingStrategy: 'Market penetration',
      pricePoints: {
        entry: 80,
        standard: 100,
        premium: 150,
      },
      discountStructure: {
        volume: '10-20%',
        loyalty: '5-15%',
      },
      paymentTerms: 'Net 30',
    };
  }

  private async generateLocalisation(regionCode: string): Promise<Record<string, any>> {
    return {
      primaryLanguage: this.getPrimaryLanguage(regionCode),
      secondaryLanguages: [],
      dateFormat: 'DD/MM/YYYY',
      currencyFormat: this.getCurrency(regionCode),
      measurementSystem: 'Metric',
      culturalConsiderations: [
        'Business etiquette',
        'Communication style',
        'Holiday calendar',
      ],
    };
  }

  private calculateExpansionScore(
    market: Record<string, any>,
    competition: Record<string, any>,
    regulations: Record<string, any>
  ): number {
    let score = 50;

    // Market factors
    if (market.growthRate > 5) score += 10;
    if (market.maturity === 'Developing') score += 5;

    // Competition factors
    if (competition.competitiveThreat === 'Low') score += 15;
    else if (competition.competitiveThreat === 'Medium') score += 5;

    // Regulatory factors
    if (regulations.complianceComplexity === 'Low') score += 10;
    else if (regulations.complianceComplexity === 'Moderate') score += 5;

    return Math.min(score, 100);
  }

  async generateRoadmap(profileId: string): Promise<ExpansionTask[]> {
    const supabase = await getSupabaseServer();
    const profile = await this.getProfile(profileId);

    // Standard expansion tasks
    const roadmapTasks = [
      {
        title: 'Market research validation',
        description: 'Validate market assumptions with local contacts',
        dueOffset: 14,
      },
      {
        title: 'Legal entity setup',
        description: 'Establish legal presence in target region',
        dueOffset: 30,
      },
      {
        title: 'Licensing and permits',
        description: 'Obtain required business and industry licenses',
        dueOffset: 60,
      },
      {
        title: 'Local partnerships',
        description: 'Identify and secure local partners',
        dueOffset: 45,
      },
      {
        title: 'Team recruitment',
        description: 'Hire local leadership and initial team',
        dueOffset: 90,
      },
      {
        title: 'Office/facility setup',
        description: 'Establish physical presence',
        dueOffset: 75,
      },
      {
        title: 'Marketing launch',
        description: 'Execute localised marketing campaign',
        dueOffset: 100,
      },
      {
        title: 'Soft launch',
        description: 'Begin operations with pilot customers',
        dueOffset: 120,
      },
    ];

    const tasks: ExpansionTask[] = [];
    const baseDate = new Date();

    for (const task of roadmapTasks) {
      const dueDate = new Date(baseDate);
      dueDate.setDate(dueDate.getDate() + task.dueOffset);

      const { data } = await supabase
        .from('international_expansion_tasks')
        .insert({
          org_id: this.orgId,
          profile_id: profileId,
          task_title: task.title,
          task_description: task.description,
          status: 'pending',
          due_date: dueDate.toISOString().split('T')[0],
        })
        .select()
        .single();

      tasks.push(this.mapToTask(data));
    }

    return tasks;
  }

  async generateLocalisationPack(regionCode: string): Promise<LocalisationPack> {
    const language = this.getPrimaryLanguage(regionCode);

    return {
      regionCode,
      language,
      toneGuidelines: [
        'Professional but approachable',
        'Respect local business customs',
        'Use formal titles until invited otherwise',
      ],
      culturalNotes: [
        'Relationship-building is important',
        'Allow time for decision-making',
        'Follow up in writing after verbal agreements',
      ],
      terminologyMap: {
        'service': this.getLocalTerm('service', regionCode),
        'quote': this.getLocalTerm('quote', regionCode),
        'invoice': this.getLocalTerm('invoice', regionCode),
      },
      localisationScore: 85,
    };
  }

  async getProfiles(regionCode?: string): Promise<ExpansionProfile[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('international_expansion_profiles')
      .select('*')
      .eq('org_id', this.orgId)
      .order('expansion_score', { ascending: false });

    if (regionCode) {
      query = query.eq('region_code', regionCode);
    }

    const { data } = await query;

    return (data || []).map(p => this.mapToProfile(p));
  }

  async getProfile(profileId: string): Promise<ExpansionProfile> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('international_expansion_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    return this.mapToProfile(data);
  }

  async getTasks(profileId: string): Promise<ExpansionTask[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('international_expansion_tasks')
      .select('*')
      .eq('profile_id', profileId)
      .order('due_date', { ascending: true });

    return (data || []).map(t => this.mapToTask(t));
  }

  async updateTaskStatus(taskId: string, status: string): Promise<ExpansionTask> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('international_expansion_tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();

    return this.mapToTask(data);
  }

  private getCurrency(regionCode: string): string {
    const currencies: Record<string, string> = {
      AU: 'AUD', US: 'USD', GB: 'GBP', EU: 'EUR',
      NZ: 'NZD', CA: 'CAD', SG: 'SGD', HK: 'HKD',
    };
    return currencies[regionCode] || 'USD';
  }

  private getPrimaryLanguage(regionCode: string): string {
    const languages: Record<string, string> = {
      AU: 'English', US: 'English', GB: 'English',
      DE: 'German', FR: 'French', ES: 'Spanish',
      JP: 'Japanese', CN: 'Chinese', KR: 'Korean',
    };
    return languages[regionCode] || 'English';
  }

  private getLocalTerm(term: string, regionCode: string): string {
    // Would be expanded with actual translations
    return term;
  }

  private mapToProfile(data: any): ExpansionProfile {
    return {
      id: data.id,
      orgId: data.org_id,
      regionCode: data.region_code,
      marketSummary: data.market_summary,
      competitionProfile: data.competition_profile,
      regulationFactors: data.regulation_factors,
      recommendedServices: data.recommended_services,
      pricingModel: data.pricing_model,
      localisationInstructions: data.localisation_instructions,
      expansionScore: data.expansion_score,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapToTask(data: any): ExpansionTask {
    return {
      id: data.id,
      orgId: data.org_id,
      profileId: data.profile_id,
      taskTitle: data.task_title,
      taskDescription: data.task_description,
      status: data.status,
      assignedTo: data.assigned_to,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
```

## API Endpoints

### POST /api/expansion/profiles

Generate expansion profile.

### POST /api/expansion/roadmap/:profileId

Generate expansion roadmap.

### POST /api/expansion/localisation/:regionCode

Generate localisation pack.

### GET /api/expansion/profiles

Get all profiles.

### GET /api/expansion/tasks/:profileId

Get tasks for profile.

### PATCH /api/expansion/tasks/:taskId

Update task status.

## Implementation Tasks

- [ ] Create 128_ai_international_expansion_engine.sql
- [ ] Implement InternationalExpansionEngine
- [ ] Create API endpoints
- [ ] Create ExpansionDashboard.tsx
- [ ] Create RoadmapViewer.tsx
- [ ] Integrate with Knowledge Graph (Phase 72)
- [ ] Integrate with Commercial Engine (Phase 73)

---

*Phase 76 - AI International Expansion Engine Complete*
