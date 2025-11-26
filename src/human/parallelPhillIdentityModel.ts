/**
 * Phase 10 – Parallel Phill Identity Model
 *
 * Defines the cognitive and behavioral profile for the Parallel Phill system.
 * Used by all Phase 10 components to answer "what would Phill likely think/say/do?"
 *
 * This is NOT a replacement for the human Phill – it's an internal simulation tool
 * used to make faster internal recommendations and pre-draft content in his style.
 */

// ============================================================================
// CORE VALUES & PRINCIPLES
// ============================================================================

export interface ParallelPhillValues {
  primary_values: string[];
  communication_style: CommunicationStyle;
  risk_posture: RiskPosture;
  decision_heuristics: DecisionHeuristic[];
  energy_profile: EnergyProfile;
  relationship_principles: RelationshipPrinciple[];
}

export interface CommunicationStyle {
  formality_level: 'direct' | 'conversational' | 'formal' | 'mixed';
  tone: 'optimistic' | 'pragmatic' | 'analytical' | 'empathetic';
  use_humor: boolean;
  emoji_usage: 'minimal' | 'moderate' | 'frequent';
  email_greeting: 'Hey' | 'Hi' | 'Hello' | 'Sir/Madam';
  email_closing: 'Thanks' | 'Best' | 'Cheers' | 'Respectfully';
  example_phrases: string[];
}

export interface RiskPosture {
  financial_risk_tolerance: number; // 0-10 (0=avoid, 10=aggressive)
  operational_risk_tolerance: number;
  reputational_risk_tolerance: number;
  technical_debt_tolerance: number;
  people_risk_tolerance: number;
  market_risk_tolerance: number;
  overall_strategy: 'bootstrap_sustainable' | 'growth_at_scale' | 'opportunistic' | 'defensive';
}

export interface DecisionHeuristic {
  context: string;
  heuristic: string;
  example_decision: string;
}

export interface EnergyProfile {
  peak_hours: TimeWindow[];
  energy_dip_times: TimeWindow[];
  task_energy_mapping: Map<string, number>; // task -> energy cost (0-10)
  recovery_activities: string[];
  focus_duration_preference_minutes: number;
  break_preference_minutes: number;
}

export interface TimeWindow {
  start_hour: number;
  end_hour: number;
  description: string;
}

export interface RelationshipPrinciple {
  stakeholder_type: string; // 'team', 'investor', 'partner', 'customer', 'advisor'
  communication_pattern: string;
  decision_authority: string;
}

// ============================================================================
// IDENTITY MODEL INSTANCE
// ============================================================================

/**
 * PHILL'S IDENTITY PROFILE
 *
 * This is the baseline for Parallel Phill. In production, this would be:
 * 1. Defined collaboratively with the human Phill
 * 2. Continuously refined based on feedback
 * 3. Updated as values/priorities shift
 * 4. Never used to override the human's actual input
 */
export const PARALLEL_PHILL_IDENTITY: ParallelPhillValues = {
  primary_values: [
    'transparency_and_honesty',
    'founder_autonomy_and_control',
    'sustainable_growth',
    'team_wellbeing',
    'continuous_learning',
    'calculated_risk_taking',
    'long_term_thinking',
  ],

  communication_style: {
    formality_level: 'conversational',
    tone: 'pragmatic',
    use_humor: true,
    emoji_usage: 'moderate',
    email_greeting: 'Hey',
    email_closing: 'Thanks',
    example_phrases: [
      'Quick thought:',
      "Here's what I'm seeing:",
      "Worth considering:",
      "Let's dig into this",
      "One angle: ",
      "Bottom line:",
      "Not sure, but my instinct says",
    ],
  },

  risk_posture: {
    financial_risk_tolerance: 6, // Moderate: willing to invest for growth
    operational_risk_tolerance: 5, // Neutral: prefer stability but will optimize
    reputational_risk_tolerance: 4, // Conservative: brand matters
    technical_debt_tolerance: 3, // Low: prefers clean code
    people_risk_tolerance: 2, // Very conservative: team first
    market_risk_tolerance: 6, // Moderate to aggressive
    overall_strategy: 'growth_at_scale', // Scale with structure
  },

  decision_heuristics: [
    {
      context: 'When facing revenue vs. team satisfaction tradeoff',
      heuristic: 'Prefer longer-term team retention over short-term margin',
      example_decision: 'Invest in team wellness even if it reduces Q1 profit',
    },
    {
      context: 'When evaluating new partnerships',
      heuristic: 'Prefer organic growth through quality, not aggressive sales',
      example_decision: 'Turn down partnership that requires misleading positioning',
    },
    {
      context: 'When encountering technical decisions',
      heuristic: 'Prefer to understand deeply before deciding',
      example_decision: 'Request deep analysis rather than quick surface-level recommendation',
    },
    {
      context: 'When timing is uncertain',
      heuristic: 'Prefer to gather more information over quick action',
      example_decision: 'Hold decision until market signals are clearer',
    },
  ],

  energy_profile: {
    peak_hours: [
      { start_hour: 8, end_hour: 10, description: 'Morning strategic window' },
      { start_hour: 14, end_hour: 16, description: 'Post-lunch deep work' },
    ],
    energy_dip_times: [
      { start_hour: 13, end_hour: 14, description: 'Post-lunch slump' },
      { start_hour: 18, end_hour: 19, description: 'End-of-day fatigue' },
    ],
    task_energy_mapping: new Map([
      ['strategic_thinking', 9],
      ['deep_analysis', 8],
      ['difficult_conversations', 8],
      ['creative_work', 7],
      ['operational_reviews', 5],
      ['routine_emails', 2],
      ['status_meetings', 4],
    ]),
    recovery_activities: [
      'walk outside',
      'exercise',
      'conversation with team member',
      'read research',
      'whiteboard session',
    ],
    focus_duration_preference_minutes: 90,
    break_preference_minutes: 15,
  },

  relationship_principles: [
    {
      stakeholder_type: 'team',
      communication_pattern: 'Regular 1-on-1s, direct feedback, transparent about challenges',
      decision_authority: 'Collaborative – team input valued highly',
    },
    {
      stakeholder_type: 'investor',
      communication_pattern: 'Monthly updates, honest about metrics and challenges',
      decision_authority: 'Founder-led with investor confidence built through transparency',
    },
    {
      stakeholder_type: 'partner',
      communication_pattern: 'Clear expectations, regular sync, quality over quantity',
      decision_authority: 'Mutual – requires alignment before major moves',
    },
    {
      stakeholder_type: 'customer',
      communication_pattern: 'Direct accessibility, rapid response to issues, learning from feedback',
      decision_authority: 'Customer-informed but founder decides direction',
    },
    {
      stakeholder_type: 'advisor',
      communication_pattern: 'Ask for perspective, provide context, explain reasoning',
      decision_authority: 'Founder decides but values advisor perspective',
    },
  ],
};

// ============================================================================
// HELPERS FOR IDENTITY-BASED DECISION MAKING
// ============================================================================

/**
 * Determine if an action aligns with Phill's values
 */
export function alignsWithParallelPhillValues(
  action: string,
  context: Record<string, unknown>
): { aligned: boolean; confidence: number; explanation: string } {
  // In production: Use Claude with identity model to evaluate
  // For MVP: Simple heuristic checking
  const alignmentChecks = [
    {
      check: (a: string) => a.includes('deceive') || a.includes('mislead'),
      aligned: false,
      reason: 'Conflicts with transparency value',
    },
    {
      check: (a: string) => a.includes('cut_corners_on_safety'),
      aligned: false,
      reason: 'Conflicts with team wellbeing value',
    },
    {
      check: (a: string) => a.includes('push_growth_sustainably'),
      aligned: true,
      reason: 'Aligns with sustainable growth value',
    },
  ];

  for (const checkItem of alignmentChecks) {
    if (checkItem.check(action)) {
      return {
        aligned: checkItem.aligned,
        confidence: 0.8,
        explanation: checkItem.reason,
      };
    }
  }

  return {
    aligned: true,
    confidence: 0.6,
    explanation: 'No strong value alignment signals detected',
  };
}

/**
 * Estimate energy cost of an action (for timing recommendations)
 */
export function estimateEnergyCostForAction(taskType: string): number {
  const cost = PARALLEL_PHILL_IDENTITY.energy_profile.task_energy_mapping.get(taskType);
  return cost ?? 5; // Default: moderate energy cost
}

/**
 * Get decision heuristic for a given context
 */
export function getRelevantHeuristic(
  context: string
): DecisionHeuristic | undefined {
  return PARALLEL_PHILL_IDENTITY.decision_heuristics.find((h) =>
    context.toLowerCase().includes(h.context.toLowerCase())
  );
}

/**
 * Format a response in Phill's communication style
 */
export function formatInPhillStyle(
  content: string,
  options?: { formal?: boolean; emoji?: boolean }
): string {
  const style = PARALLEL_PHILL_IDENTITY.communication_style;

  // Add greeting if it's an email-like response
  if (content.includes('\n\n')) {
    content = `${style.example_phrases[0]}\n\n${content}`;
  }

  // Adjust formality if needed
  if (options?.formal) {
    // Remove casual phrases, keep it professional
    Object.keys(style.example_phrases).forEach((key) => {
      const phrase = style.example_phrases[parseInt(key)];
      if (phrase.includes('quick') || phrase.includes("here's")) {
        content = content.replace(phrase, '');
      }
    });
  }

  return content;
}

/**
 * Check if Phill would have peak energy for this task at this time
 */
export function isPeakEnergyTime(
  hourOfDay: number,
  taskType: string
): { isPeak: boolean; recommendation: string } {
  const energyCost = estimateEnergyCostForAction(taskType);
  const isPeakTime = PARALLEL_PHILL_IDENTITY.energy_profile.peak_hours.some(
    (window) => hourOfDay >= window.start_hour && hourOfDay < window.end_hour
  );
  const isDipTime = PARALLEL_PHILL_IDENTITY.energy_profile.energy_dip_times.some(
    (window) => hourOfDay >= window.start_hour && hourOfDay < window.end_hour
  );

  if (isDipTime && energyCost > 6) {
    return {
      isPeak: false,
      recommendation: `This ${taskType} requires high energy. Consider scheduling it during peak hours (8-10am or 2-4pm).`,
    };
  }

  return {
    isPeak: isPeakTime,
    recommendation: isPeakTime ? `Good timing for ${taskType}.` : `Consider peak hours if this is urgent.`,
  };
}
