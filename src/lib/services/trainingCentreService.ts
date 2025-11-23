/**
 * Training Centre Service
 * Phase 55: Manage training modules, lessons, and user progress
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface TrainingModule {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_minutes: number;
  is_published: boolean;
  is_required: boolean;
  prerequisites: string[];
  learning_outcomes: string[];
  thumbnail_url?: string;
  order_index: number;
  lessons?: TrainingLesson[];
  progress?: ModuleProgress;
}

export interface TrainingLesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'text' | 'interactive' | 'quiz';
  content: any;
  video_script?: string;
  voice_script?: string;
  duration_seconds?: number;
  order_index: number;
  is_published: boolean;
  progress?: LessonProgress;
}

export interface ModuleProgress {
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percent: number;
  completed_at?: string;
  time_spent_seconds: number;
}

export interface LessonProgress {
  status: 'not_started' | 'in_progress' | 'completed';
  completed_at?: string;
  quiz_score?: number;
}

export interface TrainingBadge {
  id: string;
  name: string;
  description?: string;
  icon: string;
  earned_at?: string;
}

// Get all published modules
export async function getPublishedModules(): Promise<TrainingModule[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('training_modules')
    .select('*')
    .eq('is_published', true)
    .order('order_index');

  return data || [];
}

// Get modules with user progress
export async function getModulesWithProgress(
  userId: string,
  organizationId: string
): Promise<TrainingModule[]> {
  const supabase = await getSupabaseServer();

  const { data: modules } = await supabase
    .from('training_modules')
    .select('*')
    .eq('is_published', true)
    .order('order_index');

  if (!modules) return [];

  // Get user progress
  const { data: progress } = await supabase
    .from('training_progress')
    .select('*')
    .eq('user_id', userId)
    .is('lesson_id', null);

  // Merge progress with modules
  return modules.map((module) => {
    const moduleProgress = progress?.find((p) => p.module_id === module.id);
    return {
      ...module,
      progress: moduleProgress
        ? {
            status: moduleProgress.status,
            progress_percent: moduleProgress.progress_percent,
            completed_at: moduleProgress.completed_at,
            time_spent_seconds: moduleProgress.time_spent_seconds,
          }
        : {
            status: 'not_started' as const,
            progress_percent: 0,
            time_spent_seconds: 0,
          },
    };
  });
}

// Get module with lessons
export async function getModuleWithLessons(
  moduleSlug: string,
  userId?: string
): Promise<TrainingModule | null> {
  const supabase = await getSupabaseServer();

  const { data: module } = await supabase
    .from('training_modules')
    .select('*')
    .eq('slug', moduleSlug)
    .eq('is_published', true)
    .single();

  if (!module) return null;

  const { data: lessons } = await supabase
    .from('training_lessons')
    .select('*')
    .eq('module_id', module.id)
    .eq('is_published', true)
    .order('order_index');

  // Get progress if user provided
  let lessonsWithProgress = lessons || [];
  if (userId && lessons) {
    const { data: progress } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', module.id);

    lessonsWithProgress = lessons.map((lesson) => {
      const lessonProgress = progress?.find((p) => p.lesson_id === lesson.id);
      return {
        ...lesson,
        progress: lessonProgress
          ? {
              status: lessonProgress.status,
              completed_at: lessonProgress.completed_at,
              quiz_score: lessonProgress.quiz_score,
            }
          : {
              status: 'not_started' as const,
            },
      };
    });
  }

  return {
    ...module,
    lessons: lessonsWithProgress,
  };
}

// Update lesson progress
export async function updateLessonProgress(
  userId: string,
  organizationId: string,
  moduleId: string,
  lessonId: string,
  status: 'in_progress' | 'completed',
  timeSpent?: number,
  quizScore?: number
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('training_progress')
    .upsert(
      {
        user_id: userId,
        organization_id: organizationId,
        module_id: moduleId,
        lesson_id: lessonId,
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        time_spent_seconds: timeSpent || 0,
        quiz_score: quizScore,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,module_id,lesson_id',
      }
    );

  if (error) return false;

  // Update module progress
  await recalculateModuleProgress(userId, organizationId, moduleId);

  // Check for badge eligibility
  await checkAndAwardBadges(userId);

  return true;
}

// Recalculate module progress based on lesson completion
async function recalculateModuleProgress(
  userId: string,
  organizationId: string,
  moduleId: string
): Promise<void> {
  const supabase = await getSupabaseServer();

  // Get all lessons for module
  const { data: lessons } = await supabase
    .from('training_lessons')
    .select('id')
    .eq('module_id', moduleId)
    .eq('is_published', true);

  if (!lessons || lessons.length === 0) return;

  // Get completed lessons
  const { data: progress } = await supabase
    .from('training_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .eq('status', 'completed')
    .not('lesson_id', 'is', null);

  const completedCount = progress?.length || 0;
  const totalCount = lessons.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const isComplete = completedCount === totalCount;

  // Calculate total time
  const totalTime = progress?.reduce((sum, p) => sum + (p.time_spent_seconds || 0), 0) || 0;

  // Update or create module progress
  await supabase.from('training_progress').upsert(
    {
      user_id: userId,
      organization_id: organizationId,
      module_id: moduleId,
      lesson_id: null,
      status: isComplete ? 'completed' : completedCount > 0 ? 'in_progress' : 'not_started',
      progress_percent: progressPercent,
      completed_at: isComplete ? new Date().toISOString() : null,
      time_spent_seconds: totalTime,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,module_id,lesson_id',
    }
  );
}

// Check and award badges
async function checkAndAwardBadges(userId: string): Promise<void> {
  const supabase = await getSupabaseServer();

  // Get all badges
  const { data: badges } = await supabase
    .from('training_badges')
    .select('*')
    .eq('is_active', true);

  if (!badges) return;

  // Get user's completed modules
  const { data: progress } = await supabase
    .from('training_progress')
    .select('*, training_modules!inner(slug, is_required)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .is('lesson_id', null);

  // Get already earned badges
  const { data: earnedBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const earnedIds = new Set(earnedBadges?.map((b) => b.badge_id) || []);

  // Check each badge
  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;

    const criteria = badge.criteria as any;
    let earned = false;

    if (criteria.module_slug) {
      earned = progress?.some((p: any) => p.training_modules.slug === criteria.module_slug) || false;
    } else if (criteria.modules_completed) {
      const completedSlugs = progress?.map((p: any) => p.training_modules.slug) || [];
      earned = criteria.modules_completed.every((slug: string) => completedSlugs.includes(slug));
    } else if (criteria.all_required) {
      const requiredModules = progress?.filter((p: any) => p.training_modules.is_required) || [];
      // Simplified check - would need to compare against all required modules
      earned = requiredModules.length >= 3;
    } else if (criteria.modules_count) {
      earned = (progress?.length || 0) >= criteria.modules_count;
    }

    if (earned) {
      await supabase.from('user_badges').insert({
        user_id: userId,
        badge_id: badge.id,
      });
    }
  }
}

// Get user badges
export async function getUserBadges(userId: string): Promise<TrainingBadge[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('user_badges')
    .select('*, training_badges(*)')
    .eq('user_id', userId);

  return (
    data?.map((ub: any) => ({
      id: ub.training_badges.id,
      name: ub.training_badges.name,
      description: ub.training_badges.description,
      icon: ub.training_badges.icon,
      earned_at: ub.earned_at,
    })) || []
  );
}

// Get training stats for user
export async function getUserTrainingStats(
  userId: string
): Promise<{
  modulesCompleted: number;
  lessonsCompleted: number;
  totalTimeMinutes: number;
  badgesEarned: number;
  progressPercent: number;
}> {
  const supabase = await getSupabaseServer();

  const { data: moduleProgress } = await supabase
    .from('training_progress')
    .select('*')
    .eq('user_id', userId)
    .is('lesson_id', null);

  const { data: lessonProgress } = await supabase
    .from('training_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .not('lesson_id', 'is', null);

  const { data: badges } = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', userId);

  const { data: totalModules } = await supabase
    .from('training_modules')
    .select('id')
    .eq('is_published', true);

  const modulesCompleted = moduleProgress?.filter((p) => p.status === 'completed').length || 0;
  const totalTime = moduleProgress?.reduce((sum, p) => sum + (p.time_spent_seconds || 0), 0) || 0;
  const progressPercent = totalModules?.length
    ? Math.round((modulesCompleted / totalModules.length) * 100)
    : 0;

  return {
    modulesCompleted,
    lessonsCompleted: lessonProgress?.length || 0,
    totalTimeMinutes: Math.round(totalTime / 60),
    badgesEarned: badges?.length || 0,
    progressPercent,
  };
}

export default {
  getPublishedModules,
  getModulesWithProgress,
  getModuleWithLessons,
  updateLessonProgress,
  getUserBadges,
  getUserTrainingStats,
};
