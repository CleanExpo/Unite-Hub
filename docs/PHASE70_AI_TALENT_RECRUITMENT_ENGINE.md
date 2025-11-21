# Phase 70 - AI Talent & Recruitment Engine (ATRE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase70-ai-talent-recruitment-engine`

## Executive Summary

Phase 70 provides skills-based recruitment pipelines, AI candidate scoring, role fit predictions, talent pools, and automated interview workflows for franchises, agencies, and enterprise clients.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| AI Candidate Scoring | Yes |
| Role Fit Predictions | Yes |
| Automated Interviews | Yes |
| Skills Matching | Yes |
| Onboarding Integration | Yes |

## Database Schema

### Migration 122: AI Talent & Recruitment Engine

```sql
-- 122_ai_talent_recruitment_engine.sql

-- Candidate profiles table
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  experience_years NUMERIC DEFAULT 0,
  applied_roles JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT candidate_profiles_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_org ON candidate_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_name ON candidate_profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_email ON candidate_profiles(email);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_created ON candidate_profiles(created_at DESC);

-- Enable RLS
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY candidate_profiles_select ON candidate_profiles
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY candidate_profiles_insert ON candidate_profiles
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY candidate_profiles_update ON candidate_profiles
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE candidate_profiles IS 'Recruitment candidate profiles (Phase 70)';

-- Job positions table
CREATE TABLE IF NOT EXISTS job_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  title TEXT NOT NULL,
  department TEXT,
  required_skills JSONB DEFAULT '[]'::jsonb,
  experience_required NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT job_positions_status_check CHECK (
    status IN ('draft', 'open', 'interviewing', 'filled', 'closed')
  ),

  -- Foreign key
  CONSTRAINT job_positions_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_positions_org ON job_positions(org_id);
CREATE INDEX IF NOT EXISTS idx_job_positions_title ON job_positions(title);
CREATE INDEX IF NOT EXISTS idx_job_positions_status ON job_positions(status);
CREATE INDEX IF NOT EXISTS idx_job_positions_created ON job_positions(created_at DESC);

-- Enable RLS
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY job_positions_select ON job_positions
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY job_positions_insert ON job_positions
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY job_positions_update ON job_positions
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE job_positions IS 'Job positions for recruitment (Phase 70)';

-- Candidate evaluations table
CREATE TABLE IF NOT EXISTS candidate_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL,
  job_position_id UUID NOT NULL,
  fit_score NUMERIC NOT NULL DEFAULT 0,
  criteria_breakdown JSONB DEFAULT '{}'::jsonb,
  recommended_action TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Score check
  CONSTRAINT candidate_evaluations_score_check CHECK (
    fit_score >= 0 AND fit_score <= 100
  ),

  -- Foreign keys
  CONSTRAINT candidate_evaluations_candidate_fk
    FOREIGN KEY (candidate_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  CONSTRAINT candidate_evaluations_position_fk
    FOREIGN KEY (job_position_id) REFERENCES job_positions(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_candidate_evaluations_candidate ON candidate_evaluations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_evaluations_position ON candidate_evaluations(job_position_id);
CREATE INDEX IF NOT EXISTS idx_candidate_evaluations_score ON candidate_evaluations(fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_evaluations_generated ON candidate_evaluations(generated_at DESC);

-- Enable RLS
ALTER TABLE candidate_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY candidate_evaluations_select ON candidate_evaluations
  FOR SELECT TO authenticated
  USING (candidate_id IN (
    SELECT id FROM candidate_profiles
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY candidate_evaluations_insert ON candidate_evaluations
  FOR INSERT TO authenticated
  WITH CHECK (candidate_id IN (
    SELECT id FROM candidate_profiles
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE candidate_evaluations IS 'AI candidate evaluations (Phase 70)';
```

## Talent Engine Service

```typescript
// src/lib/talent/talent-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface CandidateProfile {
  id: string;
  orgId: string;
  fullName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  skills: string[];
  experienceYears: number;
  appliedRoles: string[];
  createdAt: Date;
}

interface JobPosition {
  id: string;
  orgId: string;
  title: string;
  department?: string;
  requiredSkills: string[];
  experienceRequired: number;
  status: string;
  createdAt: Date;
}

interface CandidateEvaluation {
  id: string;
  candidateId: string;
  jobPositionId: string;
  fitScore: number;
  criteriaBreakdown: Record<string, number>;
  recommendedAction: string;
  generatedAt: Date;
}

export class TalentEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async createCandidate(
    fullName: string,
    email: string,
    phone?: string,
    resumeUrl?: string,
    skills?: string[],
    experienceYears?: number
  ): Promise<CandidateProfile> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('candidate_profiles')
      .insert({
        org_id: this.orgId,
        full_name: fullName,
        email,
        phone,
        resume_url: resumeUrl,
        skills: skills || [],
        experience_years: experienceYears || 0,
      })
      .select()
      .single();

    return this.mapToCandidate(data);
  }

  async createJobPosition(
    title: string,
    department?: string,
    requiredSkills?: string[],
    experienceRequired?: number
  ): Promise<JobPosition> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('job_positions')
      .insert({
        org_id: this.orgId,
        title,
        department,
        required_skills: requiredSkills || [],
        experience_required: experienceRequired || 0,
      })
      .select()
      .single();

    return this.mapToPosition(data);
  }

  async evaluateCandidate(
    candidateId: string,
    jobPositionId: string
  ): Promise<CandidateEvaluation> {
    const supabase = await getSupabaseServer();

    // Get candidate and position
    const candidate = await this.getCandidate(candidateId);
    const position = await this.getPosition(jobPositionId);

    // Calculate fit score
    const criteriaBreakdown = this.calculateCriteria(candidate, position);
    const fitScore = Object.values(criteriaBreakdown).reduce((a, b) => a + b, 0) /
      Object.values(criteriaBreakdown).length;

    // Determine recommendation
    const recommendedAction = this.determineAction(fitScore);

    const { data } = await supabase
      .from('candidate_evaluations')
      .insert({
        candidate_id: candidateId,
        job_position_id: jobPositionId,
        fit_score: fitScore,
        criteria_breakdown: criteriaBreakdown,
        recommended_action: recommendedAction,
      })
      .select()
      .single();

    return this.mapToEvaluation(data);
  }

  private calculateCriteria(
    candidate: CandidateProfile,
    position: JobPosition
  ): Record<string, number> {
    // Skills match
    const matchedSkills = candidate.skills.filter(s =>
      position.requiredSkills.some(rs =>
        rs.toLowerCase() === s.toLowerCase()
      )
    );
    const skillsScore = position.requiredSkills.length > 0
      ? (matchedSkills.length / position.requiredSkills.length) * 100
      : 50;

    // Experience match
    const expRatio = position.experienceRequired > 0
      ? Math.min(candidate.experienceYears / position.experienceRequired, 1.5)
      : 1;
    const experienceScore = Math.min(100, expRatio * 70);

    // Education/certification score (would be calculated from actual data)
    const educationScore = 70;

    // Cultural fit (would use AI analysis)
    const culturalFitScore = 75;

    return {
      skills: Math.round(skillsScore),
      experience: Math.round(experienceScore),
      education: educationScore,
      culturalFit: culturalFitScore,
    };
  }

  private determineAction(fitScore: number): string {
    if (fitScore >= 80) return 'proceed_to_interview';
    if (fitScore >= 60) return 'shortlist';
    if (fitScore >= 40) return 'hold_for_review';
    return 'decline';
  }

  async generateInterviewQuestions(
    candidateId: string,
    jobPositionId: string
  ): Promise<string[]> {
    const candidate = await this.getCandidate(candidateId);
    const position = await this.getPosition(jobPositionId);

    // Generate role-specific questions
    const questions: string[] = [
      `Tell me about your experience with ${position.requiredSkills[0] || 'this field'}.`,
      `Describe a challenging situation in your previous role and how you handled it.`,
      `Why are you interested in the ${position.title} position?`,
      `How do your skills align with our requirements?`,
    ];

    // Add skill-specific questions
    for (const skill of position.requiredSkills.slice(0, 3)) {
      questions.push(`Can you give an example of how you've used ${skill}?`);
    }

    return questions;
  }

  async shortlistCandidates(jobPositionId: string, topN: number = 5): Promise<CandidateEvaluation[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('candidate_evaluations')
      .select('*')
      .eq('job_position_id', jobPositionId)
      .order('fit_score', { ascending: false })
      .limit(topN);

    return (data || []).map(e => this.mapToEvaluation(e));
  }

  async getCandidates(): Promise<CandidateProfile[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false });

    return (data || []).map(c => this.mapToCandidate(c));
  }

  async getCandidate(candidateId: string): Promise<CandidateProfile> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('id', candidateId)
      .single();

    return this.mapToCandidate(data);
  }

  async getPositions(): Promise<JobPosition[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('job_positions')
      .select('*')
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false });

    return (data || []).map(p => this.mapToPosition(p));
  }

  async getPosition(positionId: string): Promise<JobPosition> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('job_positions')
      .select('*')
      .eq('id', positionId)
      .single();

    return this.mapToPosition(data);
  }

  async getEvaluations(candidateId?: string): Promise<CandidateEvaluation[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('candidate_evaluations')
      .select('*')
      .order('generated_at', { ascending: false });

    if (candidateId) {
      query = query.eq('candidate_id', candidateId);
    }

    const { data } = await query;

    return (data || []).map(e => this.mapToEvaluation(e));
  }

  private mapToCandidate(data: any): CandidateProfile {
    return {
      id: data.id,
      orgId: data.org_id,
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      resumeUrl: data.resume_url,
      skills: data.skills,
      experienceYears: data.experience_years,
      appliedRoles: data.applied_roles,
      createdAt: new Date(data.created_at),
    };
  }

  private mapToPosition(data: any): JobPosition {
    return {
      id: data.id,
      orgId: data.org_id,
      title: data.title,
      department: data.department,
      requiredSkills: data.required_skills,
      experienceRequired: data.experience_required,
      status: data.status,
      createdAt: new Date(data.created_at),
    };
  }

  private mapToEvaluation(data: any): CandidateEvaluation {
    return {
      id: data.id,
      candidateId: data.candidate_id,
      jobPositionId: data.job_position_id,
      fitScore: data.fit_score,
      criteriaBreakdown: data.criteria_breakdown,
      recommendedAction: data.recommended_action,
      generatedAt: new Date(data.generated_at),
    };
  }
}
```

## API Endpoints

### POST /api/talent/candidates

Create candidate profile.

### POST /api/talent/positions

Create job position.

### POST /api/talent/evaluate

Evaluate candidate for position.

### GET /api/talent/interview-questions/:candidateId/:positionId

Generate interview questions.

### GET /api/talent/shortlist/:positionId

Get shortlisted candidates.

## Implementation Tasks

- [ ] Create 122_ai_talent_recruitment_engine.sql
- [ ] Implement TalentEngine
- [ ] Create API endpoints
- [ ] Create CandidateDashboard.tsx
- [ ] Create AIRecruitmentScorer.ts
- [ ] Create AIInterviewGenerator.ts

---

*Phase 70 - AI Talent & Recruitment Engine Complete*
