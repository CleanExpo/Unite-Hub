/**
 * Trial & Onboarding Service
 *
 * 14-day trial management:
 * - Trial start/end tracking
 * - Premium feature gating
 * - Multi-step onboarding wizard
 * - Automatic baseline audit generation
 * - Onboarding email sequence
 */

import { getSupabaseServer } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface TrialInfo {
  userId: string;
  workspaceId: string;
  trialStart: string;
  trialEnd: string;
  daysRemaining: number;
  status: 'active' | 'expired' | 'converted' | 'extended';
  extendedCount: number;
  features: TrialFeature[];
}

export interface TrialFeature {
  feature: string;
  available: boolean;
  limit?: number;
  used?: number;
}

export interface OnboardingProgress {
  userId: string;
  workspaceId: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  answers: OnboardingAnswers;
  baselineAuditId?: string;
  completedAt?: string;
}

export interface OnboardingAnswers {
  brandName?: string;
  industry?: string;
  companySize?: string;
  primaryGoal?: string;
  targetPersona?: string;
  brandTone?: string;
  primaryPlatforms?: string[];
  competitorDomains?: string[];
  websiteUrl?: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'input' | 'select' | 'multiselect' | 'url' | 'textarea';
  field: keyof OnboardingAnswers;
  options?: { value: string; label: string }[];
  required: boolean;
  placeholder?: string;
}

// ============================================================================
// TRIAL CONFIGURATION
// ============================================================================

export const TRIAL_DURATION_DAYS = 14;

export const TRIAL_FEATURES: TrialFeature[] = [
  { feature: 'ai_content_generation', available: true, limit: 50 },
  { feature: 'social_playbooks', available: true, limit: 3 },
  { feature: 'decision_maps', available: true, limit: 5 },
  { feature: 'visual_demos', available: true, limit: 10 },
  { feature: 'email_sequences', available: true, limit: 2 },
  { feature: 'seo_audits', available: true, limit: 3 },
  { feature: 'team_members', available: false },
  { feature: 'api_access', available: false },
  { feature: 'white_label', available: false },
  { feature: 'priority_support', available: false },
];

export const PREMIUM_FEATURES = [
  'team_members',
  'api_access',
  'white_label',
  'priority_support',
  'unlimited_ai_generation',
  'custom_integrations',
];

// ============================================================================
// ONBOARDING STEPS
// ============================================================================

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'brand',
    title: 'Your Brand',
    description: 'Tell us about your brand',
    type: 'input',
    field: 'brandName',
    required: true,
    placeholder: 'Your Company Name',
  },
  {
    id: 'industry',
    title: 'Industry',
    description: 'What industry are you in?',
    type: 'select',
    field: 'industry',
    required: true,
    options: [
      { value: 'saas', label: 'SaaS / Technology' },
      { value: 'trade', label: 'Trade / Construction' },
      { value: 'agency', label: 'Marketing / Creative Agency' },
      { value: 'nonprofit', label: 'Nonprofit / Social Impact' },
      { value: 'ecommerce', label: 'E-commerce / Retail' },
      { value: 'professional', label: 'Professional Services' },
      { value: 'healthcare', label: 'Healthcare / Medical' },
      { value: 'finance', label: 'Finance / Insurance' },
      { value: 'education', label: 'Education / Training' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'company_size',
    title: 'Company Size',
    description: 'How big is your team?',
    type: 'select',
    field: 'companySize',
    required: true,
    options: [
      { value: 'solo', label: 'Solo / Freelancer' },
      { value: '2-10', label: '2-10 employees' },
      { value: '11-50', label: '11-50 employees' },
      { value: '51-200', label: '51-200 employees' },
      { value: '200+', label: '200+ employees' },
    ],
  },
  {
    id: 'goals',
    title: 'Primary Goal',
    description: 'What do you want to achieve?',
    type: 'select',
    field: 'primaryGoal',
    required: true,
    options: [
      { value: 'lead_generation', label: 'Generate More Leads' },
      { value: 'brand_awareness', label: 'Build Brand Awareness' },
      { value: 'engagement', label: 'Increase Engagement' },
      { value: 'conversions', label: 'Improve Conversions' },
      { value: 'retention', label: 'Customer Retention' },
      { value: 'thought_leadership', label: 'Thought Leadership' },
    ],
  },
  {
    id: 'persona',
    title: 'Target Audience',
    description: 'Who are you trying to reach?',
    type: 'textarea',
    field: 'targetPersona',
    required: true,
    placeholder: 'Describe your ideal customer...',
  },
  {
    id: 'tone',
    title: 'Brand Voice',
    description: 'How should your brand sound?',
    type: 'select',
    field: 'brandTone',
    required: true,
    options: [
      { value: 'professional', label: 'Professional & Authoritative' },
      { value: 'friendly', label: 'Friendly & Approachable' },
      { value: 'bold', label: 'Bold & Confident' },
      { value: 'playful', label: 'Playful & Fun' },
      { value: 'empathetic', label: 'Empathetic & Caring' },
      { value: 'technical', label: 'Technical & Precise' },
    ],
  },
  {
    id: 'platforms',
    title: 'Primary Platforms',
    description: 'Where do you want to focus?',
    type: 'multiselect',
    field: 'primaryPlatforms',
    required: true,
    options: [
      { value: 'linkedin', label: 'LinkedIn' },
      { value: 'instagram', label: 'Instagram' },
      { value: 'youtube', label: 'YouTube' },
      { value: 'facebook', label: 'Facebook' },
      { value: 'tiktok', label: 'TikTok' },
      { value: 'twitter', label: 'X (Twitter)' },
      { value: 'email', label: 'Email Marketing' },
      { value: 'website', label: 'Website/SEO' },
    ],
  },
  {
    id: 'website',
    title: 'Website URL',
    description: 'Enter your website for our baseline audit',
    type: 'url',
    field: 'websiteUrl',
    required: false,
    placeholder: 'https://yourcompany.com',
  },
];

// ============================================================================
// TRIAL SERVICE
// ============================================================================

export async function startTrial(userId: string, workspaceId: string): Promise<{ data: TrialInfo | null; error: Error | null }> {
  const supabase = await getSupabaseServer();

  const trialStart = new Date();
  const trialEnd = new Date(trialStart.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

  try {
    // Update user profile with trial dates
    const { error } = await supabase
      .from('user_profiles')
      .update({
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
        trial_status: 'active',
      })
      .eq('id', userId);

    if (error) throw error;

    const trialInfo: TrialInfo = {
      userId,
      workspaceId,
      trialStart: trialStart.toISOString(),
      trialEnd: trialEnd.toISOString(),
      daysRemaining: TRIAL_DURATION_DAYS,
      status: 'active',
      extendedCount: 0,
      features: TRIAL_FEATURES,
    };

    return { data: trialInfo, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

export async function getTrialInfo(userId: string, workspaceId: string): Promise<{ data: TrialInfo | null; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('trial_start, trial_end, trial_status, trial_extended_count')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!profile?.trial_start) {
      return { data: null, error: null };
    }

    const now = new Date();
    const trialEnd = new Date(profile.trial_end);
    const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

    // Get feature usage
    const features = await getFeatureUsage(workspaceId);

    const trialInfo: TrialInfo = {
      userId,
      workspaceId,
      trialStart: profile.trial_start,
      trialEnd: profile.trial_end,
      daysRemaining,
      status: daysRemaining > 0 ? 'active' : 'expired',
      extendedCount: profile.trial_extended_count || 0,
      features,
    };

    return { data: trialInfo, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

export async function extendTrial(userId: string, additionalDays: number = 7): Promise<{ success: boolean; newEndDate: string | null; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    // Get current trial info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('trial_end, trial_extended_count')
      .eq('id', userId)
      .single();

    if (!profile?.trial_end) {
      throw new Error('No active trial found');
    }

    // Check extension limit (max 2 extensions)
    if ((profile.trial_extended_count || 0) >= 2) {
      throw new Error('Maximum trial extensions reached');
    }

    const currentEnd = new Date(profile.trial_end);
    const newEnd = new Date(currentEnd.getTime() + additionalDays * 24 * 60 * 60 * 1000);

    const { error } = await supabase
      .from('user_profiles')
      .update({
        trial_end: newEnd.toISOString(),
        trial_extended_count: (profile.trial_extended_count || 0) + 1,
        trial_status: 'extended',
      })
      .eq('id', userId);

    if (error) throw error;

    return { success: true, newEndDate: newEnd.toISOString(), error: null };
  } catch (err) {
    return { success: false, newEndDate: null, error: err as Error };
  }
}

async function getFeatureUsage(workspaceId: string): Promise<TrialFeature[]> {
  const supabase = await getSupabaseServer();
  const features = [...TRIAL_FEATURES];

  try {
    // Get playbook count
    const { count: playbookCount } = await supabase
      .from('social_playbooks')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    const playbookFeature = features.find((f) => f.feature === 'social_playbooks');
    if (playbookFeature) {
      playbookFeature.used = playbookCount || 0;
    }

    // Get decision map count
    const { count: mapCount } = await supabase
      .from('decision_moment_maps')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    const mapFeature = features.find((f) => f.feature === 'decision_maps');
    if (mapFeature) {
      mapFeature.used = mapCount || 0;
    }

    return features;
  } catch {
    return features;
  }
}

export function isFeatureAvailable(feature: string, trialInfo: TrialInfo): { available: boolean; reason?: string } {
  if (trialInfo.status !== 'active') {
    return { available: false, reason: 'Trial expired' };
  }

  const featureConfig = trialInfo.features.find((f) => f.feature === feature);
  if (!featureConfig) {
    return { available: false, reason: 'Feature not found' };
  }

  if (!featureConfig.available) {
    return { available: false, reason: 'Premium feature' };
  }

  if (featureConfig.limit && featureConfig.used !== undefined && featureConfig.used >= featureConfig.limit) {
    return { available: false, reason: 'Limit reached' };
  }

  return { available: true };
}

// ============================================================================
// ONBOARDING SERVICE
// ============================================================================

export async function getOnboardingProgress(userId: string, workspaceId: string): Promise<{ data: OnboardingProgress | null; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('onboarding_progress')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!data?.onboarding_progress) {
      // Initialize onboarding
      const initial: OnboardingProgress = {
        userId,
        workspaceId,
        currentStep: 0,
        totalSteps: ONBOARDING_STEPS.length,
        completedSteps: [],
        answers: {},
      };
      return { data: initial, error: null };
    }

    return { data: data.onboarding_progress as OnboardingProgress, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

export async function updateOnboardingProgress(
  userId: string,
  workspaceId: string,
  stepId: string,
  answer: Partial<OnboardingAnswers>
): Promise<{ data: OnboardingProgress | null; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    // Get current progress
    const { data: current } = await getOnboardingProgress(userId, workspaceId);
    if (!current) throw new Error('Onboarding not initialized');

    // Update answers
    const updatedAnswers = { ...current.answers, ...answer };
    const completedSteps = [...current.completedSteps];
    if (!completedSteps.includes(stepId)) {
      completedSteps.push(stepId);
    }

    const stepIndex = ONBOARDING_STEPS.findIndex((s) => s.id === stepId);
    const newCurrentStep = Math.min(stepIndex + 1, ONBOARDING_STEPS.length - 1);

    const updatedProgress: OnboardingProgress = {
      ...current,
      currentStep: newCurrentStep,
      completedSteps,
      answers: updatedAnswers,
    };

    const { error } = await supabase
      .from('user_profiles')
      .update({ onboarding_progress: updatedProgress })
      .eq('id', userId);

    if (error) throw error;

    return { data: updatedProgress, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

export async function completeOnboarding(
  userId: string,
  workspaceId: string
): Promise<{ data: { baselineAuditId: string } | null; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    // Get onboarding answers
    const { data: progress } = await getOnboardingProgress(userId, workspaceId);
    if (!progress) throw new Error('Onboarding not found');

    // Generate baseline audit ID (would trigger actual audit in production)
    const baselineAuditId = `audit-${workspaceId}-${Date.now()}`;

    // Update progress as complete
    const { error } = await supabase
      .from('user_profiles')
      .update({
        onboarding_progress: {
          ...progress,
          baselineAuditId,
          completedAt: new Date().toISOString(),
        },
        onboarding_completed: true,
      })
      .eq('id', userId);

    if (error) throw error;

    // Apply onboarding answers to workspace settings
    await applyOnboardingToWorkspace(workspaceId, progress.answers);

    return { data: { baselineAuditId }, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

async function applyOnboardingToWorkspace(workspaceId: string, answers: OnboardingAnswers): Promise<void> {
  const supabase = await getSupabaseServer();

  // Update workspace with brand settings
  await supabase
    .from('workspaces')
    .update({
      settings: {
        brandName: answers.brandName,
        industry: answers.industry,
        primaryGoal: answers.primaryGoal,
        targetPersona: answers.targetPersona,
        brandTone: answers.brandTone,
        primaryPlatforms: answers.primaryPlatforms,
        websiteUrl: answers.websiteUrl,
      },
    })
    .eq('id', workspaceId);
}

// ============================================================================
// ONBOARDING EMAIL SEQUENCE
// ============================================================================

export interface OnboardingEmail {
  day: number;
  subject: string;
  template: string;
  trigger: string;
}

export const ONBOARDING_EMAILS: OnboardingEmail[] = [
  {
    day: 0,
    subject: 'Welcome to Unite-Hub! Let\'s get started',
    template: 'onboarding_welcome',
    trigger: 'signup',
  },
  {
    day: 1,
    subject: 'Quick tip: Create your first playbook',
    template: 'onboarding_day1_playbook',
    trigger: 'cron',
  },
  {
    day: 3,
    subject: 'Your baseline audit is ready',
    template: 'onboarding_day3_audit',
    trigger: 'audit_complete',
  },
  {
    day: 5,
    subject: 'How to map your customer journey',
    template: 'onboarding_day5_journey',
    trigger: 'cron',
  },
  {
    day: 7,
    subject: 'You\'re halfway through your trial!',
    template: 'onboarding_day7_midpoint',
    trigger: 'cron',
  },
  {
    day: 10,
    subject: 'Advanced features you should try',
    template: 'onboarding_day10_advanced',
    trigger: 'cron',
  },
  {
    day: 12,
    subject: 'Only 2 days left in your trial',
    template: 'onboarding_day12_urgency',
    trigger: 'cron',
  },
  {
    day: 14,
    subject: 'Your trial ends today - here\'s what\'s next',
    template: 'onboarding_day14_final',
    trigger: 'cron',
  },
];

export function getOnboardingEmailForDay(day: number): OnboardingEmail | null {
  return ONBOARDING_EMAILS.find((e) => e.day === day) || null;
}

export function getDueOnboardingEmails(trialStart: Date): OnboardingEmail[] {
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - trialStart.getTime()) / (24 * 60 * 60 * 1000));

  return ONBOARDING_EMAILS.filter((email) => {
    // Return emails for today only (cron-triggered)
    return email.day === daysSinceStart && email.trigger === 'cron';
  });
}
