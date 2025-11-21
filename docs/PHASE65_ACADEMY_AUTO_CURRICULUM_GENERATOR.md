# Phase 65 - Academy Auto-Curriculum Generator (AACG)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase65-academy-auto-curriculum-generator`

## Executive Summary

Phase 65 automatically generates full branded course programs for each white-label tenant based on benchmarks, support patterns, automation gaps, and industry metadata. Each brand gets a personalised academy without manual setup.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Auto Course Generation | Yes |
| Benchmark-Driven Content | Yes |
| Voice-Over Scripts | Yes |
| Admin Approval | Yes |
| Industry Customization | Yes |

## Database Schema

### Migration 117: Academy Auto-Curriculum Generator

```sql
-- 117_academy_auto_curriculum_generator.sql

-- Auto curriculum jobs table
CREATE TABLE IF NOT EXISTS auto_curriculum_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL,
  org_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  course_ids JSONB DEFAULT '[]'::jsonb,
  analysis JSONB DEFAULT '{}'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT auto_curriculum_jobs_status_check CHECK (
    status IN ('pending', 'analyzing', 'generating', 'review', 'approved', 'rejected', 'failed')
  ),

  -- Foreign keys
  CONSTRAINT auto_curriculum_jobs_brand_fk
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  CONSTRAINT auto_curriculum_jobs_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_auto_curriculum_jobs_brand ON auto_curriculum_jobs(brand_id);
CREATE INDEX IF NOT EXISTS idx_auto_curriculum_jobs_org ON auto_curriculum_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_auto_curriculum_jobs_status ON auto_curriculum_jobs(status);
CREATE INDEX IF NOT EXISTS idx_auto_curriculum_jobs_created ON auto_curriculum_jobs(created_at DESC);

-- Enable RLS
ALTER TABLE auto_curriculum_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY auto_curriculum_jobs_select ON auto_curriculum_jobs
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY auto_curriculum_jobs_insert ON auto_curriculum_jobs
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY auto_curriculum_jobs_update ON auto_curriculum_jobs
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE auto_curriculum_jobs IS 'Auto-generated curriculum jobs (Phase 65)';
```

## Curriculum Generator Service

```typescript
// src/lib/curriculum/curriculum-generator.ts

import { getSupabaseServer } from '@/lib/supabase';

interface CurriculumJob {
  id: string;
  brandId: string;
  orgId: string;
  status: string;
  courseIds: string[];
  analysis: CurriculumAnalysis;
  recommendations: CourseRecommendation[];
  generatedAt?: Date;
  createdAt: Date;
}

interface CurriculumAnalysis {
  benchmarkGaps: string[];
  supportPatterns: string[];
  automationGaps: string[];
  industryModules: string[];
}

interface CourseRecommendation {
  title: string;
  description: string;
  lessons: LessonOutline[];
  priority: number;
  reason: string;
}

interface LessonOutline {
  title: string;
  type: string;
  content: Record<string, any>;
  voiceOverScript?: string;
}

const LESSON_TYPES = [
  'video_script',
  'step_by_step_sop',
  'interactive',
  'assessment_quiz',
  'certification',
];

const INDUSTRY_MODULES: Record<string, string[]> = {
  restoration: ['Water Damage 101', 'Fire Restoration Basics', 'Insurance Claims'],
  trades: ['Quote Management', 'Job Scheduling', 'Safety Compliance'],
  agencies: ['Client Onboarding', 'Campaign Management', 'Reporting Best Practices'],
};

export class CurriculumGenerator {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async generateCurriculum(brandId: string, industry?: string): Promise<CurriculumJob> {
    const supabase = await getSupabaseServer();

    // Create job
    const { data: job } = await supabase
      .from('auto_curriculum_jobs')
      .insert({
        brand_id: brandId,
        org_id: this.orgId,
        status: 'analyzing',
      })
      .select()
      .single();

    // Analyze brand needs
    const analysis = await this.analyzeBrandNeeds(brandId, industry);

    // Update with analysis
    await supabase
      .from('auto_curriculum_jobs')
      .update({
        status: 'generating',
        analysis,
      })
      .eq('id', job.id);

    // Generate course recommendations
    const recommendations = await this.generateRecommendations(analysis);

    // Create courses in Academy Engine (Phase 62)
    const courseIds = await this.createCourses(brandId, recommendations);

    // Update job
    const { data: updatedJob } = await supabase
      .from('auto_curriculum_jobs')
      .update({
        status: 'review',
        course_ids: courseIds,
        recommendations,
        generated_at: new Date().toISOString(),
      })
      .eq('id', job.id)
      .select()
      .single();

    return this.mapToJob(updatedJob);
  }

  private async analyzeBrandNeeds(
    brandId: string,
    industry?: string
  ): Promise<CurriculumAnalysis> {
    // Would fetch from various sources
    const benchmarkGaps = await this.identifyBenchmarkGaps(brandId);
    const supportPatterns = await this.analyzeSupport();
    const automationGaps = await this.identifyAutomationGaps();
    const industryModules = industry ? (INDUSTRY_MODULES[industry] || []) : [];

    return {
      benchmarkGaps,
      supportPatterns,
      automationGaps,
      industryModules,
    };
  }

  private async identifyBenchmarkGaps(brandId: string): Promise<string[]> {
    // Would check benchmarks (Phase 63) for low percentiles
    return ['response_time', 'automation_usage'];
  }

  private async analyzeSupport(): Promise<string[]> {
    // Would analyze support tickets (Phase 60)
    return ['technical_setup', 'integration_help'];
  }

  private async identifyAutomationGaps(): Promise<string[]> {
    // Would check automation usage
    return ['email_automation', 'workflow_setup'];
  }

  private async generateRecommendations(
    analysis: CurriculumAnalysis
  ): Promise<CourseRecommendation[]> {
    const recommendations: CourseRecommendation[] = [];

    // From benchmark gaps
    for (const gap of analysis.benchmarkGaps) {
      recommendations.push({
        title: `Improving ${gap.replace(/_/g, ' ')}`,
        description: `Training to improve ${gap} performance`,
        lessons: this.generateLessonsForTopic(gap),
        priority: 1,
        reason: `Low benchmark percentile for ${gap}`,
      });
    }

    // From support patterns
    for (const pattern of analysis.supportPatterns) {
      recommendations.push({
        title: `${pattern.replace(/_/g, ' ')} Guide`,
        description: `Self-service guide for ${pattern}`,
        lessons: this.generateLessonsForTopic(pattern),
        priority: 2,
        reason: `Frequent support requests for ${pattern}`,
      });
    }

    // From automation gaps
    for (const gap of analysis.automationGaps) {
      recommendations.push({
        title: `Mastering ${gap.replace(/_/g, ' ')}`,
        description: `How to effectively use ${gap}`,
        lessons: this.generateLessonsForTopic(gap),
        priority: 2,
        reason: `Low adoption of ${gap}`,
      });
    }

    // Industry modules
    for (const module of analysis.industryModules) {
      recommendations.push({
        title: module,
        description: `Industry-specific training: ${module}`,
        lessons: this.generateLessonsForTopic(module),
        priority: 3,
        reason: 'Industry best practice',
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  private generateLessonsForTopic(topic: string): LessonOutline[] {
    return [
      {
        title: `Introduction to ${topic}`,
        type: 'video_script',
        content: {
          duration: '5min',
          sections: ['Overview', 'Why it matters', 'What you will learn'],
        },
        voiceOverScript: `Welcome to this training on ${topic}. In this module, you will learn...`,
      },
      {
        title: `Step-by-step ${topic}`,
        type: 'step_by_step_sop',
        content: {
          steps: [
            { number: 1, instruction: 'Navigate to settings', screenshot: true },
            { number: 2, instruction: 'Configure options', screenshot: true },
            { number: 3, instruction: 'Test and verify', screenshot: true },
          ],
        },
      },
      {
        title: `${topic} Quiz`,
        type: 'assessment_quiz',
        content: {
          questions: [
            { question: `What is the main benefit of ${topic}?`, options: ['A', 'B', 'C', 'D'], correct: 0 },
            { question: `How do you access ${topic}?`, options: ['A', 'B', 'C', 'D'], correct: 1 },
          ],
          passingScore: 80,
        },
      },
    ];
  }

  private async createCourses(
    brandId: string,
    recommendations: CourseRecommendation[]
  ): Promise<string[]> {
    const supabase = await getSupabaseServer();
    const courseIds: string[] = [];

    for (const rec of recommendations) {
      // Create course (would use EducationEngine from Phase 62)
      const { data: course } = await supabase
        .from('courses')
        .insert({
          org_id: this.orgId,
          title: rec.title,
          description: rec.description,
          is_published: false, // Requires admin approval
        })
        .select()
        .single();

      courseIds.push(course.id);

      // Create lessons
      for (let i = 0; i < rec.lessons.length; i++) {
        const lesson = rec.lessons[i];
        await supabase
          .from('lessons')
          .insert({
            course_id: course.id,
            title: lesson.title,
            content: {
              type: lesson.type,
              ...lesson.content,
              voiceOverScript: lesson.voiceOverScript,
            },
            order_index: i,
          });
      }
    }

    return courseIds;
  }

  async approveJob(jobId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get job
    const { data: job } = await supabase
      .from('auto_curriculum_jobs')
      .select('course_ids')
      .eq('id', jobId)
      .single();

    // Publish all courses
    for (const courseId of job.course_ids || []) {
      await supabase
        .from('courses')
        .update({ is_published: true })
        .eq('id', courseId);
    }

    // Update job status
    await supabase
      .from('auto_curriculum_jobs')
      .update({ status: 'approved' })
      .eq('id', jobId);
  }

  async rejectJob(jobId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get job
    const { data: job } = await supabase
      .from('auto_curriculum_jobs')
      .select('course_ids')
      .eq('id', jobId)
      .single();

    // Delete all courses
    for (const courseId of job.course_ids || []) {
      await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
    }

    // Update job status
    await supabase
      .from('auto_curriculum_jobs')
      .update({ status: 'rejected' })
      .eq('id', jobId);
  }

  async getJobs(brandId?: string): Promise<CurriculumJob[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('auto_curriculum_jobs')
      .select('*')
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false });

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    const { data } = await query;

    return (data || []).map(j => this.mapToJob(j));
  }

  async getJob(jobId: string): Promise<CurriculumJob> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('auto_curriculum_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    return this.mapToJob(data);
  }

  private mapToJob(data: any): CurriculumJob {
    return {
      id: data.id,
      brandId: data.brand_id,
      orgId: data.org_id,
      status: data.status,
      courseIds: data.course_ids,
      analysis: data.analysis,
      recommendations: data.recommendations,
      generatedAt: data.generated_at ? new Date(data.generated_at) : undefined,
      createdAt: new Date(data.created_at),
    };
  }
}
```

## API Endpoints

### POST /api/curriculum/generate/:brandId

Generate curriculum for brand.

### POST /api/curriculum/approve/:jobId

Approve curriculum job.

### POST /api/curriculum/reject/:jobId

Reject curriculum job.

### GET /api/curriculum/jobs

Get curriculum jobs.

### GET /api/curriculum/jobs/:jobId

Get specific job.

## Implementation Tasks

- [ ] Create 117_academy_auto_curriculum_generator.sql
- [ ] Implement CurriculumGenerator
- [ ] Create API endpoints
- [ ] Create CurriculumReviewConsole.tsx
- [ ] Create InstructorNotesGenerator.ts
- [ ] Integrate with ElevenLabs for voice-overs

---

*Phase 65 - Academy Auto-Curriculum Generator Complete*
