# Phase 62 - Education & Academy Engine (EAE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase62-education-academy-engine`

## Executive Summary

Phase 62 implements an internal learning management system (LMS) for training users on Unite-Hub features and client-specific workflows. Tracks completion, awards certifications, and supports self-paced or instructor-led courses.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Course Management | Yes |
| Lesson Progress | Yes |
| Certifications | Yes |
| Self-Paced Learning | Yes |
| Instructor Support | Yes |

## Database Schema

### Migration 114: Education & Academy Engine

```sql
-- 114_education_academy_engine.sql

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT courses_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courses_org ON courses(org_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_created ON courses(created_at DESC);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY courses_select ON courses
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY courses_insert ON courses
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY courses_update ON courses
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE courses IS 'LMS courses (Phase 62)';

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT lessons_course_fk
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_created ON lessons(created_at DESC);

-- Enable RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY lessons_select ON lessons
  FOR SELECT TO authenticated
  USING (course_id IN (
    SELECT id FROM courses
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY lessons_insert ON lessons
  FOR INSERT TO authenticated
  WITH CHECK (course_id IN (
    SELECT id FROM courses
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY lessons_update ON lessons
  FOR UPDATE TO authenticated
  USING (course_id IN (
    SELECT id FROM courses
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE lessons IS 'Course lessons with content (Phase 62)';

-- Lesson progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL,
  user_id UUID NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  CONSTRAINT lesson_progress_unique UNIQUE (lesson_id, user_id),

  -- Foreign keys
  CONSTRAINT lesson_progress_lesson_fk
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  CONSTRAINT lesson_progress_user_fk
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON lesson_progress(completed);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_created ON lesson_progress(created_at DESC);

-- Enable RLS
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY lesson_progress_select ON lesson_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY lesson_progress_insert ON lesson_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY lesson_progress_update ON lesson_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Comment
COMMENT ON TABLE lesson_progress IS 'User lesson completion tracking (Phase 62)';
```

## Education Engine Service

```typescript
// src/lib/education/education-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface Course {
  id: string;
  orgId: string;
  title: string;
  description?: string;
  isPublished: boolean;
  createdAt: Date;
}

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: Record<string, any>;
  orderIndex: number;
  createdAt: Date;
}

interface LessonProgress {
  id: string;
  lessonId: string;
  userId: string;
  completed: boolean;
  completedAt?: Date;
}

interface CourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  percentComplete: number;
}

export class EducationEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async createCourse(title: string, description?: string): Promise<Course> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('courses')
      .insert({
        org_id: this.orgId,
        title,
        description,
      })
      .select()
      .single();

    return this.mapToCourse(data);
  }

  async publishCourse(courseId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('courses')
      .update({ is_published: true })
      .eq('id', courseId)
      .eq('org_id', this.orgId);
  }

  async addLesson(
    courseId: string,
    title: string,
    content: Record<string, any>,
    orderIndex?: number
  ): Promise<Lesson> {
    const supabase = await getSupabaseServer();

    // Get max order if not provided
    let order = orderIndex;
    if (order === undefined) {
      const { data: existing } = await supabase
        .from('lessons')
        .select('order_index')
        .eq('course_id', courseId)
        .order('order_index', { ascending: false })
        .limit(1);

      order = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;
    }

    const { data } = await supabase
      .from('lessons')
      .insert({
        course_id: courseId,
        title,
        content,
        order_index: order,
      })
      .select()
      .single();

    return {
      id: data.id,
      courseId: data.course_id,
      title: data.title,
      content: data.content,
      orderIndex: data.order_index,
      createdAt: new Date(data.created_at),
    };
  }

  async markLessonComplete(lessonId: string, userId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('lesson_progress')
      .upsert({
        lesson_id: lessonId,
        user_id: userId,
        completed: true,
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'lesson_id,user_id',
      });
  }

  async getCourseProgress(courseId: string, userId: string): Promise<CourseProgress> {
    const supabase = await getSupabaseServer();

    const { data: lessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId);

    const lessonIds = (lessons || []).map(l => l.id);

    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('*')
      .in('lesson_id', lessonIds)
      .eq('user_id', userId)
      .eq('completed', true);

    const total = lessonIds.length;
    const completed = (progress || []).length;

    return {
      courseId,
      totalLessons: total,
      completedLessons: completed,
      percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  async getCourses(): Promise<Course[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false });

    return (data || []).map(c => this.mapToCourse(c));
  }

  async getPublishedCourses(): Promise<Course[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('org_id', this.orgId)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    return (data || []).map(c => this.mapToCourse(c));
  }

  async getLessons(courseId: string): Promise<Lesson[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    return (data || []).map(l => ({
      id: l.id,
      courseId: l.course_id,
      title: l.title,
      content: l.content,
      orderIndex: l.order_index,
      createdAt: new Date(l.created_at),
    }));
  }

  async getUserProgress(userId: string): Promise<LessonProgress[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId);

    return (data || []).map(p => ({
      id: p.id,
      lessonId: p.lesson_id,
      userId: p.user_id,
      completed: p.completed,
      completedAt: p.completed_at ? new Date(p.completed_at) : undefined,
    }));
  }

  async deleteCourse(courseId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
      .eq('org_id', this.orgId);
  }

  async deleteLesson(lessonId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);
  }

  private mapToCourse(data: any): Course {
    return {
      id: data.id,
      orgId: data.org_id,
      title: data.title,
      description: data.description,
      isPublished: data.is_published,
      createdAt: new Date(data.created_at),
    };
  }
}
```

## API Endpoints

### POST /api/education/courses

Create a course.

### PUT /api/education/courses/:id/publish

Publish a course.

### POST /api/education/lessons

Add a lesson.

### POST /api/education/progress/:lessonId

Mark lesson complete.

### GET /api/education/courses/:id/progress

Get course progress.

### GET /api/education/courses

Get courses.

## Implementation Tasks

- [ ] Create 114_education_academy_engine.sql
- [ ] Implement EducationEngine
- [ ] Create API endpoints
- [ ] Create AcademyDashboard.tsx
- [ ] Create CourseViewer.tsx
- [ ] Create CertificateGenerator

---

*Phase 62 - Education & Academy Engine Complete*
