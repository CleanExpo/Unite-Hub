/**
 * Phase 12 – Voice Persona Engine
 *
 * Ensures Parallel Phill speaks like Phill, not generic AI.
 * Applies identity, tone, values, and risk posture to all responses.
 *
 * - Phill's communication style (conversational, pragmatic, authentic)
 * - Energy-aware tone modulation (sharp vs. fatigued)
 * - Directness, clarity, conciseness tuning
 * - Crisis-mode vs calm-mode voice
 * - Alignment with Phase 10 autonomy policy engine
 *
 * Integration: Receives user emotion + assistant tone from dialogueStateEngine
 * Feeds: realtimeDialogueOrchestrator (what to say), glassesVoiceOutput (how to say it)
 * Output: PersonalizedResponse with persona-aligned text + speaking parameters
 */

import type { AssistantTone } from './dialogueStateEngine';
import type { CognitiveState } from './cognitiveStateEngine';

// ============================================================================
// PERSONA CONFIGURATION
// ============================================================================

export interface PhillPersona {
  // Core Identity
  name: string;
  role: string; // "founder"
  primary_values: string[]; // transparency, autonomy, sustainability, etc.

  // Communication Style
  communication_style: {
    tone: 'conversational' | 'pragmatic' | 'warm' | 'direct';
    formality: 'casual' | 'professional' | 'mixed';
    emoji_usage: boolean;
    directness: number; // 0-100 (high = get to the point)
    humor: 'minimal' | 'moderate' | 'frequent'; // When to use humor
  };

  // Speech Patterns
  speech_patterns: {
    opening_phrases: string[];
    closing_phrases: string[];
    filler_words: string[]; // "um", "like", "so"
    contractions: boolean; // Use "don't" vs "do not"
  };

  // Risk Posture
  risk_posture: {
    financial_conservatism: number; // 0-100 (high = very conservative)
    people_prioritization: number; // 0-100 (how much to prioritize team)
    growth_aggressiveness: number; // 0-100 (willing to take risks for growth)
  };

  // Energy Modulation
  energy_levels: {
    sharp: { pace: 'fast' | 'normal'; complexity: 'high' | 'medium'; engagement: 'high' };
    good: { pace: 'normal'; complexity: 'medium'; engagement: 'medium' };
    tired: { pace: 'slow'; complexity: 'low'; engagement: 'medium' };
    fatigued: { pace: 'very slow'; complexity: 'minimal'; engagement: 'low' };
    overloaded: { pace: 'paused'; complexity: 'none'; engagement: 'none' };
  };
}

// ============================================================================
// DEFAULT PHILL PERSONA
// ============================================================================

export const PHILL_PERSONA: PhillPersona = {
  name: 'Phill',
  role: 'founder',
  primary_values: ['transparency', 'founder autonomy', 'sustainable growth', 'team wellbeing'],

  communication_style: {
    tone: 'conversational',
    formality: 'mixed', // Casual with team, professional with external
    emoji_usage: false, // Professional context
    directness: 75, // Get to the point, but not blunt
    humor: 'moderate',
  },

  speech_patterns: {
    opening_phrases: ['Hey...', 'So...', 'Listen...', 'Quick thought...', 'Here\'s the thing...'],
    closing_phrases: ['Thanks', 'Make sense?', 'Thoughts?', 'Let me know', 'That\'s it'],
    filler_words: ['so', 'honestly', 'like'],
    contractions: true,
  },

  risk_posture: {
    financial_conservatism: 65, // Moderate - growth but sustainable
    people_prioritization: 85, // Very high - team comes first
    growth_aggressiveness: 60, // Moderate - balanced growth
  },

  energy_levels: {
    sharp: { pace: 'fast', complexity: 'high', engagement: 'high' },
    good: { pace: 'normal', complexity: 'medium', engagement: 'medium' },
    tired: { pace: 'slow', complexity: 'low', engagement: 'medium' },
    fatigued: { pace: 'very slow', complexity: 'minimal', engagement: 'low' },
    overloaded: { pace: 'paused', complexity: 'none', engagement: 'none' },
  },
};

// ============================================================================
// TONE SELECTION
// ============================================================================

const TONE_TRAITS: Record<AssistantTone, { keywords: string[]; sentence_length: 'short' | 'medium' | 'long' }> = {
  casual: {
    keywords: ['like', 'so', 'honestly', 'think', 'feel'],
    sentence_length: 'medium',
  },
  clarifying: {
    keywords: ['means', 'basically', 'essentially', 'really', 'specifically'],
    sentence_length: 'long',
  },
  advising: {
    keywords: ['recommend', 'suggest', 'consider', 'might want', 'could try'],
    sentence_length: 'medium',
  },
  urgent: {
    keywords: ['urgent', 'asap', 'critical', 'now', 'immediately'],
    sentence_length: 'short',
  },
  warm: {
    keywords: ['appreciate', 'value', 'love', 'great', 'awesome'],
    sentence_length: 'medium',
  },
  precise: {
    keywords: ['exactly', 'precisely', 'specifically', 'definitively', 'clearly'],
    sentence_length: 'long',
  },
};

/**
 * Select appropriate tone based on context
 */
export function selectAppropriateTone(input: {
  user_emotion: 'calm' | 'engaged' | 'curious' | 'frustrated' | 'urgent' | 'confused';
  cognitive_state: CognitiveState;
  interaction_type: 'advice' | 'clarification' | 'casual' | 'urgent';
}): AssistantTone {
  // Urgent context → urgent tone
  if (input.interaction_type === 'urgent' || input.user_emotion === 'urgent') {
    return 'urgent';
  }

  // Frustrated user → clarifying tone
  if (input.user_emotion === 'frustrated') {
    return 'clarifying';
  }

  // Advice context → advising tone
  if (input.interaction_type === 'advice') {
    return 'advising';
  }

  // Curious user → warm tone
  if (input.user_emotion === 'curious' || input.user_emotion === 'engaged') {
    return 'warm';
  }

  // Fatigued cognitive state → simpler tone
  if (input.cognitive_state === 'fatigued' || input.cognitive_state === 'overloaded') {
    return 'casual';
  }

  // Default: casual
  return 'casual';
}

// ============================================================================
// RESPONSE PERSONALIZATION
// ============================================================================

export interface PersonalizedResponse {
  // Core Response
  text: string;
  tone: AssistantTone;

  // Speaking Parameters
  pace: 'fast' | 'slow' | 'very slow' | 'normal' | 'paused';
  emphasis_words?: string[]; // Words to emphasize in speech
  natural_pause_ms: number; // How long to pause before speaking
  pacing_ms: number; // ms per word

  // Personality Markers
  uses_contraction: boolean;
  has_humor: boolean;
  directness_level: number; // 0-100

  // Confidence
  confidence: number; // 0-1

  // Safety
  safety_status: 'safe' | 'flagged' | 'blocked';
}

/**
 * Personalize response using Phill's persona
 */
export function personalizeResponse(input: {
  base_response: string;
  user_tone: 'calm' | 'engaged' | 'curious' | 'frustrated' | 'urgent' | 'confused';
  cognitive_state: CognitiveState;
  assistant_tone: AssistantTone;
  confidence: number;
  interaction_type: 'advice' | 'clarification' | 'casual' | 'urgent';
}): PersonalizedResponse {
  const persona = PHILL_PERSONA;
  const energyProfile = persona.energy_levels[input.cognitive_state];

  // Adjust based on cognitive state
  let response = input.base_response;
  const pace: 'fast' | 'slow' | 'very slow' | 'normal' | 'paused' = energyProfile.pace;
  let pacing_ms = 150; // Base pacing

  // Adjust pacing based on energy
  if (pace === 'fast') {
pacing_ms = 100;
} else if (pace === 'slow') {
pacing_ms = 200;
} else if (pace === 'very slow') {
pacing_ms = 250;
}

  // Apply Phill's opening phrase
  if (response.length < 50) {
    const opening = persona.speech_patterns.opening_phrases[0];
    response = `${opening} ${response}`;
  }

  // Apply directness adjustment
  if (persona.communication_style.directness > 80) {
    // Remove filler words
    response = response.replace(/\b(um|uh|like|so|basically)\b/gi, '');
  }

  // Handle contractions
  let usesContraction = persona.speech_patterns.contractions;
  if (input.cognitive_state === 'fatigued' || input.cognitive_state === 'overloaded') {
    usesContraction = false; // Be more formal when tired
  }

  // Determine if humor is appropriate
  const hasHumor = persona.communication_style.humor === 'frequent' && input.user_tone !== 'frustrated' && input.user_tone !== 'urgent';

  // Extract emphasis words (key points)
  const emphasizeWords: string[] = [];
  const keywords = TONE_TRAITS[input.assistant_tone]?.keywords || [];
  for (const kw of keywords) {
    if (response.toLowerCase().includes(kw)) {
      emphasizeWords.push(kw);
    }
  }

  return {
    text: response,
    tone: input.assistant_tone,
    pace,
    emphasis_words: emphasizeWords.slice(0, 3),
    natural_pause_ms: 200 + Math.random() * 200,
    pacing_ms,
    uses_contraction: usesContraction,
    has_humor: hasHumor,
    directness_level: persona.communication_style.directness,
    confidence: input.confidence,
    safety_status: 'safe',
  };
}

// ============================================================================
// CRISIS MODE
// ============================================================================

/**
 * Adjust response for crisis/urgent situations
 */
export function applyCrisisMode(response: PersonalizedResponse, severity: 'warning' | 'critical'): PersonalizedResponse {
  return {
    ...response,
    pace: severity === 'critical' ? 'fast' : 'normal',
    pacing_ms: severity === 'critical' ? 100 : 150,
    natural_pause_ms: 50, // Minimal pause in crisis
    directness_level: 95, // Be very direct
    tone: 'urgent',
  };
}

// ============================================================================
// TONE MODULATION BY COGNITIVE STATE
// ============================================================================

/**
 * Modulate tone based on Phill's current cognitive state
 */
export function modulateByCognitiveState(
  response: PersonalizedResponse,
  cognitive_state: CognitiveState
): PersonalizedResponse {
  const modifications: Partial<PersonalizedResponse> = {};

  switch (cognitive_state) {
    case 'sharp':
      // Use more complex language, faster pace
      modifications.directness_level = 80;
      modifications.pace = 'fast';
      break;

    case 'good':
      // Normal operation
      break;

    case 'tired':
      // Simplify, slower pace
      modifications.directness_level = 60;
      modifications.pace = 'slow';
      break;

    case 'fatigued':
      // Very simple, much slower
      modifications.directness_level = 40;
      modifications.pace = 'very slow';
      modifications.has_humor = false;
      break;

    case 'overloaded':
      // Minimal, suggest rest
      modifications.pace = 'very slow';
      modifications.directness_level = 20;
      modifications.has_humor = false;
      break;
  }

  return {
    ...response,
    ...modifications,
  };
}

// ============================================================================
// CONSISTENCY CHECKING
// ============================================================================

/**
 * Check if response aligns with Phill's values and policies
 */
export function validatePersonaAlignment(
  response: PersonalizedResponse,
  context: {
    domain: string;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    involves_team: boolean;
    involves_finances: boolean;
  }
): {
  aligned: boolean;
  concerns: string[];
  recommendations: string[];
} {
  const concerns: string[] = [];
  const recommendations: string[] = [];
  const persona = PHILL_PERSONA;

  // Check financial conservatism
  if (context.involves_finances && persona.risk_posture.financial_conservatism > 70) {
    if (context.risk_level === 'high' || context.risk_level === 'critical') {
      concerns.push('High financial risk - conflicts with Phill\'s conservative posture');
      recommendations.push('Recommend founder approval for this decision');
    }
  }

  // Check team/people prioritization
  if (context.involves_team && persona.risk_posture.people_prioritization > 80) {
    if (context.domain === 'people' && context.risk_level === 'critical') {
      concerns.push('Critical people decision - requires careful consideration of team impact');
      recommendations.push('Recommend founder review before finalizing');
    }
  }

  // Check value alignment
  const primaryValues = persona.primary_values;
  if (!primaryValues.includes('transparency') && response.text.length < 20) {
    concerns.push('Response may lack transparency');
    recommendations.push('Provide more context or explanation');
  }

  const aligned = concerns.length === 0;

  return {
    aligned,
    concerns,
    recommendations,
  };
}

// ============================================================================
// SPEAKING PARAMETERS
// ============================================================================

/**
 * Generate TTS (text-to-speech) parameters from personalized response
 */
export function generateSpeakingParameters(response: PersonalizedResponse): {
  rate: number; // 0.5-2.0 (words per minute adjustment)
  pitch: number; // -10 to +10 dB (for variety)
  volume: number; // 0-100
  emotion: 'neutral' | 'calm' | 'warm' | 'serious' | 'urgent';
} {
  // Rate based on pace
  let rate = 1.0; // Normal
  if (response.pace === 'fast') {
rate = 1.3;
} else if (response.pace === 'slow') {
rate = 0.8;
} else if (response.pace === 'very slow') {
rate = 0.6;
}

  // Pitch based on tone
  let pitch = 0;
  if (response.tone === 'warm') {
pitch = 2;
} else if (response.tone === 'urgent') {
pitch = -3;
}

  // Emotion mapping
  let emotion: 'neutral' | 'calm' | 'warm' | 'serious' | 'urgent' = 'neutral';
  if (response.tone === 'warm') {
emotion = 'warm';
} else if (response.tone === 'urgent') {
emotion = 'urgent';
} else if (response.tone === 'casual') {
emotion = 'calm';
} else if (response.tone === 'advising') {
emotion = 'serious';
}

  return {
    rate,
    pitch,
    volume: 80, // Default volume (0-100)
    emotion,
  };
}
