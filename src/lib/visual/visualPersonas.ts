/**
 * Visual Personas for Synthex.social
 * Phase 10: UX-02 Visual System Integration
 *
 * Defines core personas with visual style preferences for adaptive UI
 */

export interface VisualPersona {
  id: string;
  label: string;
  description: string;
  suggestedVisualStyleMix: StyleMix;
  colourProfile: ColourProfile;
  motionLevel: 'none' | 'subtle' | 'moderate' | 'high';
  heroTone: 'professional' | 'friendly' | 'energetic' | 'practical';
  preferredImagery: string[];
  avoidImagery: string[];
}

export interface StyleMix {
  industrial_metallic: number; // A - Corporate Tech Premium
  saas_minimal: number;        // B - Clean SaaS
  creator_energy: number;      // C - Creator / high-energy
  trades_hybrid: number;       // D - Real-world small business
}

export interface ColourProfile {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

/**
 * Core Synthex Personas
 */
export const SYNTHEX_PERSONAS: Record<string, VisualPersona> = {
  // Time-poor small business owner (trades, local services)
  trades_owner: {
    id: 'trades_owner',
    label: 'Trades & Local Services',
    description: 'Electricians, plumbers, builders, landscapers, and local service providers',
    suggestedVisualStyleMix: {
      industrial_metallic: 0.2,
      saas_minimal: 0.2,
      creator_energy: 0.0,
      trades_hybrid: 0.6,
    },
    colourProfile: {
      primary: '#007bff',
      secondary: '#28a745',
      accent: '#ff5722',
      background: '#f4f7fa',
      text: '#1a1a1a',
    },
    motionLevel: 'subtle',
    heroTone: 'practical',
    preferredImagery: ['tools', 'worksites', 'vans', 'real_people_working', 'local_business'],
    avoidImagery: ['abstract_tech', 'corporate_office', 'stock_handshakes'],
  },

  // Small/medium agency owner
  agency_owner: {
    id: 'agency_owner',
    label: 'Agency Owner',
    description: 'Marketing agencies, creative studios, and digital consultancies',
    suggestedVisualStyleMix: {
      industrial_metallic: 0.4,
      saas_minimal: 0.4,
      creator_energy: 0.2,
      trades_hybrid: 0.0,
    },
    colourProfile: {
      primary: '#347bf7',
      secondary: '#6c63ff',
      accent: '#00d4aa',
      background: '#0d2a5c',
      text: '#ffffff',
    },
    motionLevel: 'moderate',
    heroTone: 'professional',
    preferredImagery: ['dashboards', 'analytics', 'team_collaboration', 'modern_office'],
    avoidImagery: ['construction', 'trades', 'generic_stock'],
  },

  // Non-profit / community org
  nonprofit: {
    id: 'nonprofit',
    label: 'Non-Profit & Community',
    description: 'Charities, community organizations, and social enterprises',
    suggestedVisualStyleMix: {
      industrial_metallic: 0.1,
      saas_minimal: 0.5,
      creator_energy: 0.1,
      trades_hybrid: 0.3,
    },
    colourProfile: {
      primary: '#28a745',
      secondary: '#17a2b8',
      accent: '#ffc107',
      background: '#ffffff',
      text: '#333333',
    },
    motionLevel: 'subtle',
    heroTone: 'friendly',
    preferredImagery: ['community', 'helping_hands', 'diverse_people', 'nature'],
    avoidImagery: ['corporate', 'money_focus', 'luxury'],
  },

  // Solo consultant / coach
  consultant: {
    id: 'consultant',
    label: 'Consultant & Coach',
    description: 'Business coaches, consultants, and solo professionals',
    suggestedVisualStyleMix: {
      industrial_metallic: 0.3,
      saas_minimal: 0.4,
      creator_energy: 0.2,
      trades_hybrid: 0.1,
    },
    colourProfile: {
      primary: '#6c63ff',
      secondary: '#347bf7',
      accent: '#ff784e',
      background: '#f8f9fa',
      text: '#212529',
    },
    motionLevel: 'moderate',
    heroTone: 'professional',
    preferredImagery: ['professional_portrait', 'speaking', 'workshop', 'laptop_work'],
    avoidImagery: ['factories', 'heavy_machinery', 'generic_office'],
  },

  // Internal marketing manager at SME
  marketing_manager: {
    id: 'marketing_manager',
    label: 'Marketing Manager',
    description: 'In-house marketing managers at small-medium enterprises',
    suggestedVisualStyleMix: {
      industrial_metallic: 0.35,
      saas_minimal: 0.45,
      creator_energy: 0.15,
      trades_hybrid: 0.05,
    },
    colourProfile: {
      primary: '#007bff',
      secondary: '#6610f2',
      accent: '#fd7e14',
      background: '#e9ecef',
      text: '#343a40',
    },
    motionLevel: 'moderate',
    heroTone: 'energetic',
    preferredImagery: ['marketing_dashboard', 'analytics', 'social_media', 'team_meeting'],
    avoidImagery: ['construction', 'heavy_industry', 'luxury'],
  },

  // Default anonymous visitor
  anonymous: {
    id: 'anonymous',
    label: 'Anonymous Visitor',
    description: 'Default persona for unidentified visitors',
    suggestedVisualStyleMix: {
      industrial_metallic: 0.2,
      saas_minimal: 0.4,
      creator_energy: 0.1,
      trades_hybrid: 0.3,
    },
    colourProfile: {
      primary: '#347bf7',
      secondary: '#007bff',
      accent: '#00d4aa',
      background: '#f4f7fa',
      text: '#1a1a1a',
    },
    motionLevel: 'subtle',
    heroTone: 'friendly',
    preferredImagery: ['small_business', 'growth', 'success', 'diverse_people'],
    avoidImagery: ['corporate_only', 'luxury', 'exclusive'],
  },
};

/**
 * Get persona by ID with fallback to anonymous
 */
export function getPersona(personaId: string | null | undefined): VisualPersona {
  if (!personaId) {
return SYNTHEX_PERSONAS.anonymous;
}
  return SYNTHEX_PERSONAS[personaId] || SYNTHEX_PERSONAS.anonymous;
}

/**
 * Detect persona from URL parameters or context
 */
export function detectPersonaFromContext(context: {
  queryParam?: string | null;
  utm_campaign?: string | null;
  referrer?: string | null;
  industry?: string | null;
}): string {
  // Check explicit query parameter
  if (context.queryParam && SYNTHEX_PERSONAS[context.queryParam]) {
    return context.queryParam;
  }

  // Check UTM campaign hints
  if (context.utm_campaign) {
    const campaign = context.utm_campaign.toLowerCase();
    if (campaign.includes('trade') || campaign.includes('plumb') || campaign.includes('electric')) {
      return 'trades_owner';
    }
    if (campaign.includes('agency') || campaign.includes('marketing')) {
      return 'agency_owner';
    }
    if (campaign.includes('nonprofit') || campaign.includes('charity')) {
      return 'nonprofit';
    }
    if (campaign.includes('coach') || campaign.includes('consultant')) {
      return 'consultant';
    }
  }

  // Check industry context
  if (context.industry) {
    const industry = context.industry.toLowerCase();
    if (['construction', 'trades', 'plumbing', 'electrical', 'hvac', 'landscaping'].some(t => industry.includes(t))) {
      return 'trades_owner';
    }
    if (['agency', 'marketing', 'creative', 'digital'].some(t => industry.includes(t))) {
      return 'agency_owner';
    }
  }

  return 'anonymous';
}

export default SYNTHEX_PERSONAS;
