/**
 * Trial Capability Profile
 * Defines allowed modules, AI caps, VIF limits, production limits, and analytics visibility
 *
 * Truth Layer: All limits must be transparent and honestly communicated
 */

export interface TrialCapabilityProfile {
  // Overall capacity (25% of production)
  capacityPercent: number;

  // AI Token Limits
  aiTokens: {
    softCap: number; // 50,000 tokens (~25% of monthly pro)
    hardCap: number | null; // null = soft cap only (warn but allow)
    warningThreshold: number; // Show warning at 80%
  };

  // Visual Generation Limits
  vifGenerations: {
    cap: number; // 10 generations
    hardCap: boolean; // true = block after cap
  };

  // Blueprint Creation Limits
  blueprints: {
    cap: number; // 5 blueprints
    hardCap: boolean; // true = block after cap
  };

  // Production Jobs (disabled in trial)
  productionJobs: {
    cap: number; // 0 = completely disabled
    hardCap: boolean; // true
  };

  // Module Access Configuration
  modules: {
    enabled: ModuleConfig[]; // Fully accessible
    limited: ModuleConfig[]; // Reduced functionality
    disabled: ModuleConfig[]; // Completely blocked
  };
}

export interface ModuleConfig {
  id: string;
  name: string;
  category: 'core' | 'advanced' | 'enterprise';
  description: string;
  trialAccessLevel: 'full' | 'limited' | 'disabled';
  limitations?: string[]; // What's limited in trial
  upgradeMessage?: string; // Why upgrade is needed
}

/**
 * Default Trial Capability Profile (25% capacity)
 */
export const DEFAULT_TRIAL_PROFILE: TrialCapabilityProfile = {
  capacityPercent: 25,

  aiTokens: {
    softCap: 50000, // ~25% of 200k monthly pro allocation
    hardCap: null, // Soft cap: warn but allow
    warningThreshold: 40000, // Warn at 80% (40k of 50k)
  },

  vifGenerations: {
    cap: 10,
    hardCap: true, // Block after 10 generations
  },

  blueprints: {
    cap: 5,
    hardCap: true, // Block after 5 blueprints
  },

  productionJobs: {
    cap: 0,
    hardCap: true, // Completely disabled
  },

  modules: {
    // ENABLED: Full access in trial
    enabled: [
      {
        id: 'website_audit',
        name: 'Website Audit',
        category: 'core',
        description: 'Analyze existing website for SEO and content quality',
        trialAccessLevel: 'full',
      },
      {
        id: 'brand_persona',
        name: 'Brand Persona Builder',
        category: 'core',
        description: 'Create brand voice and positioning profiles',
        trialAccessLevel: 'full',
      },
      {
        id: 'initial_roadmap',
        name: 'Initial Roadmap Generator',
        category: 'core',
        description: 'Generate 90-day marketing activation roadmap',
        trialAccessLevel: 'full',
      },
      {
        id: 'analytics_readonly',
        name: 'Analytics Overview',
        category: 'core',
        description: 'View search console and analytics data (read-only)',
        trialAccessLevel: 'full',
      },
      {
        id: 'topic_relevance',
        name: 'Topic Relevance Scoring',
        category: 'core',
        description: 'Score topic relevance for your industry',
        trialAccessLevel: 'full',
      },
    ],

    // LIMITED: Reduced functionality
    limited: [
      {
        id: 'blueprinter',
        name: 'Multi-Channel Blueprinter',
        category: 'advanced',
        description: 'Generate multi-channel campaign blueprints',
        trialAccessLevel: 'limited',
        limitations: [
          'Maximum 5 blueprints',
          'Limited channel selection',
          'No production export',
        ],
        upgradeMessage: 'Upgrade for unlimited blueprints and full channel access',
      },
      {
        id: 'founder_ops',
        name: 'Founder Ops Hub',
        category: 'advanced',
        description: 'Task prioritization and workflow automation',
        trialAccessLevel: 'limited',
        limitations: [
          'Manual task creation only',
          'No automated workflows',
          'No recurring tasks',
        ],
        upgradeMessage: 'Upgrade for workflow automation and recurring tasks',
      },
      {
        id: 'content_generation',
        name: 'Content Generation',
        category: 'advanced',
        description: 'AI-powered content creation',
        trialAccessLevel: 'limited',
        limitations: [
          '50,000 AI token soft cap',
          'Limited VIF generations (10 max)',
          'No bulk generation',
        ],
        upgradeMessage: 'Upgrade for unlimited AI usage and bulk generation',
      },
    ],

    // DISABLED: Completely blocked
    disabled: [
      {
        id: 'high_volume_campaigns',
        name: 'High-Volume Campaign Creator',
        category: 'enterprise',
        description: 'Create and manage multiple campaigns simultaneously',
        trialAccessLevel: 'disabled',
        upgradeMessage: 'Upgrade to Pro for high-volume campaign management',
      },
      {
        id: 'automated_weekly',
        name: 'Automated Weekly Campaigns',
        category: 'enterprise',
        description: 'Schedule and automate weekly campaign execution',
        trialAccessLevel: 'disabled',
        upgradeMessage: 'Upgrade to Pro for campaign automation',
      },
      {
        id: 'cross_brand_orchestration',
        name: 'Cross-Brand Orchestration',
        category: 'enterprise',
        description: 'Manage campaigns across multiple brands',
        trialAccessLevel: 'disabled',
        upgradeMessage: 'Upgrade to Agency for multi-brand management',
      },
      {
        id: 'timestamped_production',
        name: 'Timestamped Production Jobs',
        category: 'enterprise',
        description: 'Schedule content for future production',
        trialAccessLevel: 'disabled',
        upgradeMessage: 'Upgrade to Pro for production job scheduling',
      },
      {
        id: 'living_intelligence',
        name: 'Living Intelligence Archive',
        category: 'enterprise',
        description: 'Historical analysis and trend tracking',
        trialAccessLevel: 'disabled',
        upgradeMessage: 'Upgrade to Pro for intelligence archiving',
      },
    ],
  },
};

/**
 * Trial Capability Helper Functions
 */

export function isModuleEnabled(moduleId: string, profile: TrialCapabilityProfile = DEFAULT_TRIAL_PROFILE): boolean {
  return profile.modules.enabled.some((m) => m.id === moduleId);
}

export function isModuleLimited(moduleId: string, profile: TrialCapabilityProfile = DEFAULT_TRIAL_PROFILE): boolean {
  return profile.modules.limited.some((m) => m.id === moduleId);
}

export function isModuleDisabled(moduleId: string, profile: TrialCapabilityProfile = DEFAULT_TRIAL_PROFILE): boolean {
  return profile.modules.disabled.some((m) => m.id === moduleId);
}

export function getModuleConfig(moduleId: string, profile: TrialCapabilityProfile = DEFAULT_TRIAL_PROFILE): ModuleConfig | null {
  const allModules = [
    ...profile.modules.enabled,
    ...profile.modules.limited,
    ...profile.modules.disabled,
  ];
  return allModules.find((m) => m.id === moduleId) || null;
}

export function getModuleAccessLevel(moduleId: string, profile: TrialCapabilityProfile = DEFAULT_TRIAL_PROFILE): 'full' | 'limited' | 'disabled' | null {
  const config = getModuleConfig(moduleId, profile);
  return config?.trialAccessLevel || null;
}

/**
 * Calculate remaining capacity percentages
 */
export function calculateCapacityUsage(
  used: number,
  cap: number
): {
  used: number;
  cap: number;
  remaining: number;
  percentUsed: number;
  percentRemaining: number;
} {
  const remaining = Math.max(0, cap - used);
  const percentUsed = cap > 0 ? Math.round((used / cap) * 100) : 0;
  const percentRemaining = 100 - percentUsed;

  return {
    used,
    cap,
    remaining,
    percentUsed,
    percentRemaining,
  };
}

/**
 * Check if user should see upgrade prompt based on usage
 */
export function shouldShowUpgradePrompt(
  aiTokensUsed: number,
  aiTokensCap: number,
  vifGenerationsUsed: number,
  vifGenerationsCap: number,
  blueprintsCreated: number,
  blueprintsCap: number
): {
  shouldShow: boolean;
  reason: string | null;
  urgency: 'low' | 'medium' | 'high';
} {
  // High urgency: Any hard cap hit
  if (vifGenerationsUsed >= vifGenerationsCap) {
    return {
      shouldShow: true,
      reason: 'VIF generation limit reached',
      urgency: 'high',
    };
  }

  if (blueprintsCreated >= blueprintsCap) {
    return {
      shouldShow: true,
      reason: 'Blueprint creation limit reached',
      urgency: 'high',
    };
  }

  // Medium urgency: Soft cap exceeded
  if (aiTokensUsed > aiTokensCap) {
    return {
      shouldShow: true,
      reason: 'AI token soft cap exceeded',
      urgency: 'medium',
    };
  }

  // Low urgency: Approaching soft cap (80%+)
  const aiTokenPercentUsed = aiTokensCap > 0 ? (aiTokensUsed / aiTokensCap) * 100 : 0;
  if (aiTokenPercentUsed >= 80) {
    return {
      shouldShow: true,
      reason: 'Approaching AI token limit',
      urgency: 'low',
    };
  }

  return {
    shouldShow: false,
    reason: null,
    urgency: 'low',
  };
}

/**
 * Truth Layer: Generate honest upgrade message
 */
export function generateUpgradeMessage(reason: string, urgency: 'low' | 'medium' | 'high'): string {
  const messages: Record<string, Record<string, string>> = {
    'VIF generation limit reached': {
      low: 'You\'ve used all 10 visual generations in your trial. Upgrade to continue creating visuals.',
      medium: 'You\'ve reached your trial\'s visual generation limit. Upgrade for unlimited generations.',
      high: 'Visual generation limit reached. Upgrade now to continue your work.',
    },
    'Blueprint creation limit reached': {
      low: 'You\'ve created 5 blueprints (trial limit). Upgrade to create unlimited blueprints.',
      medium: 'Blueprint limit reached. Upgrade to unlock unlimited campaign planning.',
      high: 'You\'ve hit the 5-blueprint trial limit. Upgrade to continue.',
    },
    'AI token soft cap exceeded': {
      low: 'You\'ve exceeded the 50,000 AI token trial guideline. We\'re not blocking you yet, but consider upgrading for unlimited usage.',
      medium: 'You\'re using more AI than the trial allocation. Upgrade for peace of mind and unlimited AI access.',
      high: 'AI usage is significantly over trial limits. Upgrade for unlimited AI operations.',
    },
    'Approaching AI token limit': {
      low: 'You\'ve used 80% of your trial\'s AI token guideline. Upgrade anytime for unlimited usage.',
      medium: 'You\'re approaching the trial AI token guideline. Upgrade to avoid interruptions.',
      high: 'Nearly at AI token limit. Upgrade for uninterrupted service.',
    },
  };

  return messages[reason]?.[urgency] || 'Upgrade to unlock full Unite-Hub capabilities.';
}
