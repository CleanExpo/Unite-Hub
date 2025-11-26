/**
 * Daily Briefing Engine
 *
 * Generates morning, midday, and evening AGI briefings (business + personal).
 * Scheduled execution: cron jobs for morning/noon/evening.
 * Integrates business brain + personal advisor + personal context.
 */

import { generateBusinessBrainSummary, getAtRiskDimensions, getStrategicThemes } from './businessBrain';
import { getPersonalContext, getContextSummary } from './personalContextEngine';
import { listGoals, getCriticalGoals } from './goalEngine';

export type BriefingType = 'morning' | 'midday' | 'evening';
export type BriefingAudience = 'founder' | 'team' | 'extended';

export interface DailyBriefing {
  id: string;
  type: BriefingType;
  date: string; // ISO date
  owner: string; // 'phill'
  generatedAt: string;

  // Business summary
  businessStatus: {
    overallScore: number; // 0-100
    topPriorities: string[];
    blockers: string[];
    wins: string[];
  };

  // Personal state
  personalState: {
    cognitiveState: string;
    energyLevel: string;
    focusReadiness: string;
    warnings: string[];
  };

  // Specific to briefing type
  briefingContent: {
    focus: string; // What to focus on
    actions: string[]; // Specific actions
    meetings: string[]; // Scheduled items
    decisions: string[]; // Decisions needed
    timeBlocks: TimeBlock[]; // Recommended schedule
  };

  // Reading time estimates
  estimatedReadTime: number; // minutes
  estimatedActionTime: number; // minutes

  // Metadata
  targetAudience: BriefingAudience;
  isUrgent: boolean;
  summary: string; // TL;DR
}

export interface TimeBlock {
  time: string; // e.g., "9:00-10:30"
  activity: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  notes?: string;
}

// Store briefing history
let briefingHistory: DailyBriefing[] = [];

/**
 * Generate morning briefing
 */
export function generateMorningBriefing(owner: string): DailyBriefing {
  const now = new Date();
  const date = now.toISOString().split('T')[0];

  const businessBrain = generateBusinessBrainSummary(owner);
  const personalCtx = getPersonalContext(owner);
  const criticalGoals = getCriticalGoals();

  const morningBriefing: DailyBriefing = {
    id: crypto.randomUUID(),
    type: 'morning',
    date,
    owner,
    generatedAt: now.toISOString(),

    businessStatus: {
      overallScore: businessBrain.healthScore,
      topPriorities: businessBrain.weeklyPriorities.slice(0, 3),
      blockers: getAtRiskDimensions(businessBrain).map(d => `${d.dimension}: ${d.alerts[0]}`),
      wins: getStrategicThemes(businessBrain).slice(0, 2)
    },

    personalState: {
      cognitiveState: personalCtx?.cognitiveState || 'unknown',
      energyLevel: personalCtx?.energyLevel || 'unknown',
      focusReadiness:
        personalCtx && personalCtx.energyLevel === 'high' && personalCtx.stressLevel !== 'high'
          ? 'optimal'
          : 'adequate',
      warnings: personalCtx?.warningFlags || []
    },

    briefingContent: {
      focus: `${businessBrain.weeklyPriorities[0]} - Dedicate focused time to this today.`,
      actions: [
        'Review 3 critical items above',
        'Check email for urgent items',
        'Confirm today\'s key meetings'
      ],
      meetings: [], // Would be populated from calendar integration
      decisions: businessBrain.criticalDecisions.slice(0, 2),
      timeBlocks: [
        {
          time: '9:00-10:30',
          activity: 'Deep work on #1 priority',
          priority: 'critical'
        },
        {
          time: '10:30-11:00',
          activity: 'Email and urgent items',
          priority: 'high'
        },
        {
          time: '11:00-12:00',
          activity: 'Meetings / Communication',
          priority: 'medium'
        },
        {
          time: '12:00-13:00',
          activity: 'Lunch + recovery',
          priority: 'high'
        }
      ]
    },

    estimatedReadTime: 5,
    estimatedActionTime: 30,
    targetAudience: 'founder',
    isUrgent: businessBrain.overallStatus === 'critical' || businessBrain.overallStatus === 'at-risk',
    summary: `${businessBrain.overallStatus.toUpperCase()}: Focus on ${businessBrain.weeklyPriorities[0]}. ${personalCtx?.energyLevel === 'high' ? 'Good energy.' : 'Monitor energy levels.'}`
  };

  briefingHistory.push(morningBriefing);
  return morningBriefing;
}

/**
 * Generate midday briefing (quick check-in)
 */
export function generateMiddayBriefing(owner: string): DailyBriefing {
  const now = new Date();
  const date = now.toISOString().split('T')[0];

  const businessBrain = generateBusinessBrainSummary(owner);
  const personalCtx = getPersonalContext(owner);
  const allGoals = listGoals();

  // Update personal context with current observations
  const energyDropped = personalCtx && personalCtx.energyLevel === 'low';

  const middayBriefing: DailyBriefing = {
    id: crypto.randomUUID(),
    type: 'midday',
    date,
    owner,
    generatedAt: now.toISOString(),

    businessStatus: {
      overallScore: businessBrain.healthScore,
      topPriorities: ['Continue with morning priority', 'Check for new blockers'],
      blockers: [],
      wins: ['Morning session completed', 'Progress on priority items']
    },

    personalState: {
      cognitiveState: personalCtx?.cognitiveState || 'adequate',
      energyLevel: energyDropped ? 'declining' : personalCtx?.energyLevel || 'adequate',
      focusReadiness: energyDropped ? 'post-lunch focus' : 'sustained focus',
      warnings: energyDropped ? ['Energy dip detected - consider break or light snack'] : []
    },

    briefingContent: {
      focus: energyDropped
        ? 'Light tasks, communication, and recovery after lunch'
        : 'Continue deep work if momentum exists',
      actions: [
        'Quick pulse check on priorities',
        'Address any new blockers',
        'Plan afternoon focus'
      ],
      meetings: [],
      decisions: [],
      timeBlocks: energyDropped
        ? [
            {
              time: '13:00-13:30',
              activity: 'Light meal + rest',
              priority: 'high'
            },
            {
              time: '13:30-15:00',
              activity: 'Communication and lighter tasks',
              priority: 'medium'
            }
          ]
        : [
            {
              time: '13:00-14:30',
              activity: 'Continue focused work',
              priority: 'critical'
            }
          ]
    },

    estimatedReadTime: 2,
    estimatedActionTime: 10,
    targetAudience: 'founder',
    isUrgent: false,
    summary: `Status: ${businessBrain.overallStatus}. ${energyDropped ? '⚠️ Energy dip - adjust afternoon schedule.' : '✅ Momentum maintained.'}`
  };

  briefingHistory.push(middayBriefing);
  return middayBriefing;
}

/**
 * Generate evening briefing (recap and planning)
 */
export function generateEveningBriefing(owner: string): DailyBriefing {
  const now = new Date();
  const date = now.toISOString().split('T')[0];

  const businessBrain = generateBusinessBrainSummary(owner);
  const personalCtx = getPersonalContext(owner);
  const allGoals = listGoals();
  const criticalGoals = getCriticalGoals();

  const eveningBriefing: DailyBriefing = {
    id: crypto.randomUUID(),
    type: 'evening',
    date,
    owner,
    generatedAt: now.toISOString(),

    businessStatus: {
      overallScore: businessBrain.healthScore,
      topPriorities: [],
      blockers: [],
      wins: ['Day completed', 'Wrap-up in progress']
    },

    personalState: {
      cognitiveState: 'winding_down',
      energyLevel: personalCtx?.energyLevel || 'declining',
      focusReadiness: 'recovery mode',
      warnings: personalCtx?.warningFlags || []
    },

    briefingContent: {
      focus: 'Reflect on day, plan tomorrow, and wind down',
      actions: [
        'Quick wins audit - celebrate 3 things completed',
        'Tomorrow planning - 3 priorities',
        'Personal wind-down routine'
      ],
      meetings: [],
      decisions: criticalGoals.length > 0 ? ['Plan approach to at-risk goals'] : [],
      timeBlocks: [
        {
          time: '17:00-17:30',
          activity: 'Day recap and wins audit',
          priority: 'medium'
        },
        {
          time: '17:30-18:00',
          activity: 'Tomorrow planning',
          priority: 'medium'
        },
        {
          time: '18:00+',
          activity: 'Personal time / Wind-down',
          priority: 'high'
        }
      ]
    },

    estimatedReadTime: 3,
    estimatedActionTime: 20,
    targetAudience: 'founder',
    isUrgent: false,
    summary: `Day Summary: ${businessBrain.overallStatus}. ${criticalGoals.length > 0 ? '⚠️ ' + criticalGoals.length + ' goals at risk.' : '✅ Goals on track.'} Tomorrow ready to launch.`
  };

  briefingHistory.push(eveningBriefing);
  return eveningBriefing;
}

/**
 * Get today's briefings
 */
export function getTodaysBriefings(owner: string): DailyBriefing[] {
  const today = new Date().toISOString().split('T')[0];
  return briefingHistory.filter(b => b.owner === owner && b.date === today);
}

/**
 * Get briefing by type
 */
export function getBriefingByType(owner: string, type: BriefingType): DailyBriefing | null {
  const today = new Date().toISOString().split('T')[0];
  return briefingHistory.find(b => b.owner === owner && b.date === today && b.type === type) || null;
}

/**
 * Format briefing for display
 */
export function formatBriefingForDisplay(briefing: DailyBriefing): string {
  const lines: string[] = [];

  // Header
  lines.push(`\n${'═'.repeat(60)}`);
  lines.push(`${briefing.type.toUpperCase()} BRIEFING for ${briefing.date}`);
  if (briefing.isUrgent) lines.push('🚨 URGENT');
  lines.push(`${'═'.repeat(60)}\n`);

  // TL;DR
  lines.push(`📝 SUMMARY:\n${briefing.summary}\n`);

  // Business Status
  lines.push(`📊 BUSINESS STATUS:`);
  lines.push(`  Score: ${briefing.businessStatus.overallScore}/100`);
  if (briefing.businessStatus.topPriorities.length > 0) {
    lines.push(`  Priorities: ${briefing.businessStatus.topPriorities.join(' → ')}`);
  }
  if (briefing.businessStatus.blockers.length > 0) {
    lines.push(`  Blockers: ${briefing.businessStatus.blockers.join(' | ')}`);
  }
  lines.push('');

  // Personal State
  lines.push(`🧠 YOUR STATE:`);
  lines.push(`  Cognition: ${briefing.personalState.cognitiveState}`);
  lines.push(`  Energy: ${briefing.personalState.energyLevel}`);
  if (briefing.personalState.warnings.length > 0) {
    lines.push(`  ⚠️ Warnings: ${briefing.personalState.warnings.join(' | ')}`);
  }
  lines.push('');

  // Focus & Actions
  lines.push(`🎯 FOCUS:`);
  lines.push(`  ${briefing.briefingContent.focus}\n`);
  lines.push(`✅ ACTIONS:`);
  briefing.briefingContent.actions.forEach(a => lines.push(`  □ ${a}`));
  lines.push('');

  // Schedule
  if (briefing.briefingContent.timeBlocks.length > 0) {
    lines.push(`⏰ RECOMMENDED SCHEDULE:`);
    briefing.briefingContent.timeBlocks.forEach(tb => {
      const icon = tb.priority === 'critical' ? '🔴' : tb.priority === 'high' ? '🟠' : '🟡';
      lines.push(`  ${icon} ${tb.time}: ${tb.activity}`);
    });
    lines.push('');
  }

  // Footer
  lines.push(`📖 Read time: ${briefing.estimatedReadTime}min | Action time: ${briefing.estimatedActionTime}min`);
  lines.push(`${'═'.repeat(60)}\n`);

  return lines.join('\n');
}

/**
 * Clear briefing history (for testing)
 */
export function clearBriefingHistory(): void {
  briefingHistory = [];
}
