/**
 * Brand Voice Engine — RAG-Style Brand Voice Memory & Enrichment
 *
 * Stores brand voice examples, tone profiles, and style guides per brand.
 * Enriches AI prompts with brand-specific voice context before generation.
 * Learns from approved content to improve voice matching over time.
 *
 * Closes the RAG/Brand Voice gap (was 5/10 → targeting 10/10).
 *
 * @module brands/brand-voice-engine
 */

import { brandRegistry, type Brand } from './brandRegistry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VoiceProfile {
  brandSlug: string;
  tone: ToneSpectrum;
  vocabulary: VocabularyRules;
  styleGuide: StyleGuide;
  examples: VoiceExample[];
  updatedAt: string;
}

export interface ToneSpectrum {
  formality: number;     // 1 (casual) → 10 (formal)
  warmth: number;        // 1 (cold/clinical) → 10 (warm/personal)
  authority: number;     // 1 (tentative) → 10 (authoritative)
  playfulness: number;   // 1 (serious) → 10 (playful)
  urgency: number;       // 1 (relaxed) → 10 (urgent)
  empathy: number;       // 1 (detached) → 10 (empathetic)
}

export interface VocabularyRules {
  preferredTerms: Array<{ term: string; context?: string }>;
  avoidTerms: Array<{ term: string; reason?: string }>;
  industryJargon: Array<{ term: string; definition: string; useWhen?: string }>;
  powerWords: string[];
  brandSpecificPhrases: string[];
}

export interface StyleGuide {
  sentenceLength: 'short' | 'medium' | 'long' | 'varied';
  paragraphLength: 'short' | 'medium' | 'long';
  useContractions: boolean;
  useQuestions: boolean;
  useExclamations: boolean;
  useBulletPoints: boolean;
  useEmoji: boolean;
  personPronoun: 'first_singular' | 'first_plural' | 'second' | 'third';
  ctaStyle: 'direct' | 'soft' | 'value_driven' | 'urgency';
  openingStyle: 'hook' | 'question' | 'statistic' | 'story' | 'benefit';
}

export interface VoiceExample {
  id: string;
  contentType: string;
  content: string;
  source: 'approved_draft' | 'manual' | 'imported';
  quality: number; // 1-10 (how representative of the brand voice)
  addedAt: string;
}

export interface VoiceEnrichment {
  systemInstructions: string;
  exampleContent: string[];
  vocabulary: {
    use: string[];
    avoid: string[];
  };
  toneGuidance: string;
}

// ---------------------------------------------------------------------------
// Default Voice Profiles
// ---------------------------------------------------------------------------

const DEFAULT_PROFILES: Record<string, Partial<VoiceProfile>> = {
  unite_hub: {
    tone: {
      formality: 5,
      warmth: 8,
      authority: 7,
      playfulness: 3,
      urgency: 4,
      empathy: 7,
    },
    vocabulary: {
      preferredTerms: [
        { term: 'workspace', context: 'user environment' },
        { term: 'intelligence', context: 'AI features' },
        { term: 'insights', context: 'data analysis' },
      ],
      avoidTerms: [
        { term: 'simple', reason: 'Undervalues product complexity' },
        { term: 'just', reason: 'Minimizes effort' },
        { term: 'obviously', reason: 'Condescending' },
      ],
      industryJargon: [
        { term: 'CRM', definition: 'Customer Relationship Management' },
        { term: 'lead scoring', definition: 'AI-powered prospect ranking' },
      ],
      powerWords: ['intelligent', 'unified', 'automated', 'actionable'],
      brandSpecificPhrases: ['AI-first CRM', 'founder intelligence'],
    },
    styleGuide: {
      sentenceLength: 'varied',
      paragraphLength: 'medium',
      useContractions: true,
      useQuestions: true,
      useExclamations: false,
      useBulletPoints: true,
      useEmoji: false,
      personPronoun: 'first_plural',
      ctaStyle: 'value_driven',
      openingStyle: 'benefit',
    },
  },

  disaster_recovery_au: {
    tone: {
      formality: 7,
      warmth: 9,
      authority: 8,
      playfulness: 1,
      urgency: 7,
      empathy: 10,
    },
    vocabulary: {
      preferredTerms: [
        { term: 'restoration', context: 'primary service' },
        { term: 'recovery', context: 'process' },
      ],
      avoidTerms: [
        { term: 'damage', reason: 'Use "affected areas" instead' },
        { term: 'disaster', reason: 'Use "emergency" or "event" in client comms' },
      ],
      industryJargon: [
        { term: 'IICRC', definition: 'Institute of Inspection Cleaning and Restoration Certification' },
      ],
      powerWords: ['certified', 'rapid', 'trusted', 'experienced'],
      brandSpecificPhrases: ['24/7 emergency response', 'insurance-approved'],
    },
    styleGuide: {
      sentenceLength: 'short',
      paragraphLength: 'short',
      useContractions: false,
      useQuestions: false,
      useExclamations: false,
      useBulletPoints: true,
      useEmoji: false,
      personPronoun: 'first_plural',
      ctaStyle: 'urgency',
      openingStyle: 'benefit',
    },
  },
};

// ---------------------------------------------------------------------------
// Brand Voice Engine
// ---------------------------------------------------------------------------

export class BrandVoiceEngine {
  private profiles: Map<string, VoiceProfile> = new Map();

  constructor() {
    // Load default profiles
    for (const [slug, partial] of Object.entries(DEFAULT_PROFILES)) {
      this.profiles.set(slug, this.buildFullProfile(slug, partial));
    }
  }

  // -------------------------------------------------------------------------
  // Profile Management
  // -------------------------------------------------------------------------

  /**
   * Get or create a voice profile for a brand.
   */
  getProfile(brandSlug: string): VoiceProfile {
    const existing = this.profiles.get(brandSlug);
    if (existing) return existing;

    // Create a neutral default
    const newProfile = this.buildFullProfile(brandSlug, {});
    this.profiles.set(brandSlug, newProfile);
    return newProfile;
  }

  /**
   * Update a voice profile's tone settings.
   */
  updateTone(brandSlug: string, tone: Partial<ToneSpectrum>): VoiceProfile {
    const profile = this.getProfile(brandSlug);
    profile.tone = { ...profile.tone, ...tone };
    profile.updatedAt = new Date().toISOString();
    return profile;
  }

  /**
   * Add a vocabulary rule.
   */
  addPreferredTerm(
    brandSlug: string,
    term: string,
    context?: string
  ): void {
    const profile = this.getProfile(brandSlug);
    if (!profile.vocabulary.preferredTerms.some((t) => t.term === term)) {
      profile.vocabulary.preferredTerms.push({ term, context });
      profile.updatedAt = new Date().toISOString();
    }
  }

  addAvoidTerm(brandSlug: string, term: string, reason?: string): void {
    const profile = this.getProfile(brandSlug);
    if (!profile.vocabulary.avoidTerms.some((t) => t.term === term)) {
      profile.vocabulary.avoidTerms.push({ term, reason });
      profile.updatedAt = new Date().toISOString();
    }
  }

  // -------------------------------------------------------------------------
  // Learning from Approved Content
  // -------------------------------------------------------------------------

  /**
   * Learn from an approved draft — add it as a voice example.
   * Over time this builds a corpus of "good" content for the brand.
   */
  learnFromApproved(
    brandSlug: string,
    content: string,
    contentType: string,
    quality: number = 7
  ): void {
    const profile = this.getProfile(brandSlug);

    // Keep max 50 examples per brand (oldest rotated out)
    if (profile.examples.length >= 50) {
      // Remove lowest quality first
      profile.examples.sort((a, b) => a.quality - b.quality);
      profile.examples.shift();
    }

    profile.examples.push({
      id: `ex_${Date.now()}`,
      contentType,
      content: content.slice(0, 500), // Store first 500 chars as representative
      source: 'approved_draft',
      quality,
      addedAt: new Date().toISOString(),
    });

    profile.updatedAt = new Date().toISOString();
  }

  /**
   * Add a manual voice example (from existing marketing materials).
   */
  addExample(
    brandSlug: string,
    content: string,
    contentType: string,
    quality: number = 8
  ): void {
    const profile = this.getProfile(brandSlug);

    profile.examples.push({
      id: `ex_${Date.now()}`,
      contentType,
      content: content.slice(0, 500),
      source: 'manual',
      quality,
      addedAt: new Date().toISOString(),
    });

    profile.updatedAt = new Date().toISOString();
  }

  // -------------------------------------------------------------------------
  // Prompt Enrichment (Core RAG Function)
  // -------------------------------------------------------------------------

  /**
   * Generate voice enrichment context for AI prompt injection.
   * This is the core RAG-style function — it retrieves brand voice
   * context and formats it for inclusion in LLM prompts.
   */
  enrichPrompt(
    brandSlug: string,
    contentType?: string
  ): VoiceEnrichment {
    const profile = this.getProfile(brandSlug);

    // Select best examples for the content type
    let examples = [...profile.examples];
    if (contentType) {
      const typeMatches = examples.filter((e) => e.contentType === contentType);
      if (typeMatches.length >= 2) {
        examples = typeMatches;
      }
    }
    // Sort by quality, take top 3
    examples.sort((a, b) => b.quality - a.quality);
    const topExamples = examples.slice(0, 3).map((e) => e.content);

    return {
      systemInstructions: this.buildVoiceInstructions(profile),
      exampleContent: topExamples,
      vocabulary: {
        use: profile.vocabulary.preferredTerms.map((t) => t.term),
        avoid: profile.vocabulary.avoidTerms.map((t) => t.term),
      },
      toneGuidance: this.describeTone(profile.tone),
    };
  }

  /**
   * Build a full system instruction block for voice consistency.
   */
  buildVoiceInstructions(profile: VoiceProfile): string {
    const { tone, vocabulary, styleGuide } = profile;
    const sections: string[] = [];

    // Tone
    sections.push(`BRAND VOICE (${profile.brandSlug}):`);
    sections.push(this.describeTone(tone));

    // Style
    sections.push(`\nSTYLE RULES:`);
    sections.push(`- Sentence length: ${styleGuide.sentenceLength}`);
    sections.push(`- Paragraphs: ${styleGuide.paragraphLength}`);
    sections.push(
      `- Contractions: ${styleGuide.useContractions ? 'yes' : 'no'}`
    );
    sections.push(
      `- Questions: ${styleGuide.useQuestions ? 'yes, use to engage' : 'avoid'}`
    );
    sections.push(`- Pronoun: ${styleGuide.personPronoun.replace('_', ' ')}`);
    sections.push(`- CTA style: ${styleGuide.ctaStyle.replace('_', ' ')}`);
    sections.push(`- Opening style: ${styleGuide.openingStyle}`);

    // Vocabulary
    if (vocabulary.preferredTerms.length > 0) {
      sections.push(
        `\nPREFERRED TERMS: ${vocabulary.preferredTerms.map((t) => t.term).join(', ')}`
      );
    }
    if (vocabulary.avoidTerms.length > 0) {
      sections.push(
        `AVOID: ${vocabulary.avoidTerms.map((t) => `"${t.term}"${t.reason ? ` (${t.reason})` : ''}`).join(', ')}`
      );
    }
    if (vocabulary.brandSpecificPhrases.length > 0) {
      sections.push(
        `BRAND PHRASES: ${vocabulary.brandSpecificPhrases.join(', ')}`
      );
    }
    if (vocabulary.powerWords.length > 0) {
      sections.push(`POWER WORDS: ${vocabulary.powerWords.join(', ')}`);
    }

    return sections.join('\n');
  }

  /**
   * Validate content against brand voice rules (fast, no AI call).
   */
  validateVoice(
    brandSlug: string,
    content: string
  ): { score: number; issues: string[] } {
    const profile = this.getProfile(brandSlug);
    const lower = content.toLowerCase();
    const issues: string[] = [];
    let deductions = 0;

    // Check avoid terms
    for (const { term, reason } of profile.vocabulary.avoidTerms) {
      if (lower.includes(term.toLowerCase())) {
        issues.push(`Uses avoided term "${term}"${reason ? `: ${reason}` : ''}`);
        deductions += 5;
      }
    }

    // Check for brand phrases (positive signal)
    const phrasesFound = profile.vocabulary.brandSpecificPhrases.filter((p) =>
      lower.includes(p.toLowerCase())
    );
    if (
      profile.vocabulary.brandSpecificPhrases.length > 0 &&
      phrasesFound.length === 0
    ) {
      issues.push('No brand-specific phrases found');
      deductions += 3;
    }

    // Check power words
    const powerFound = profile.vocabulary.powerWords.filter((w) =>
      lower.includes(w.toLowerCase())
    );
    if (profile.vocabulary.powerWords.length > 0 && powerFound.length === 0) {
      issues.push('No power words found');
      deductions += 2;
    }

    // Check style: exclamation marks
    if (!profile.styleGuide.useExclamations && content.includes('!')) {
      const exclamationCount = (content.match(/!/g) || []).length;
      if (exclamationCount > 1) {
        issues.push(`${exclamationCount} exclamation marks (brand avoids them)`);
        deductions += 3;
      }
    }

    // Check emoji
    if (!profile.styleGuide.useEmoji) {
      const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/u;
      if (emojiRegex.test(content)) {
        issues.push('Contains emoji (brand style avoids them)');
        deductions += 3;
      }
    }

    const score = Math.max(0, Math.min(100, 100 - deductions));
    return { score, issues };
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private describeTone(tone: ToneSpectrum): string {
    const descriptors: string[] = [];

    if (tone.formality >= 7) descriptors.push('formal');
    else if (tone.formality <= 3) descriptors.push('casual');
    else descriptors.push('balanced formality');

    if (tone.warmth >= 7) descriptors.push('warm and personal');
    else if (tone.warmth <= 3) descriptors.push('direct and clinical');

    if (tone.authority >= 7) descriptors.push('authoritative');
    else if (tone.authority <= 3) descriptors.push('humble');

    if (tone.playfulness >= 7) descriptors.push('playful');
    else if (tone.playfulness <= 3) descriptors.push('serious');

    if (tone.empathy >= 7) descriptors.push('empathetic');

    if (tone.urgency >= 7) descriptors.push('urgent and action-oriented');

    return `Tone: ${descriptors.join(', ')}`;
  }

  private buildFullProfile(
    brandSlug: string,
    partial: Partial<VoiceProfile>
  ): VoiceProfile {
    return {
      brandSlug,
      tone: partial.tone ?? {
        formality: 5,
        warmth: 5,
        authority: 5,
        playfulness: 5,
        urgency: 5,
        empathy: 5,
      },
      vocabulary: partial.vocabulary ?? {
        preferredTerms: [],
        avoidTerms: [],
        industryJargon: [],
        powerWords: [],
        brandSpecificPhrases: [],
      },
      styleGuide: partial.styleGuide ?? {
        sentenceLength: 'varied',
        paragraphLength: 'medium',
        useContractions: true,
        useQuestions: true,
        useExclamations: false,
        useBulletPoints: true,
        useEmoji: false,
        personPronoun: 'first_plural',
        ctaStyle: 'value_driven',
        openingStyle: 'benefit',
      },
      examples: partial.examples ?? [],
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * List all profiles.
   */
  listProfiles(): VoiceProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get profile stats.
   */
  getStats(): {
    totalProfiles: number;
    totalExamples: number;
    profilesByBrand: Record<string, number>;
  } {
    const stats = {
      totalProfiles: this.profiles.size,
      totalExamples: 0,
      profilesByBrand: {} as Record<string, number>,
    };

    for (const [slug, profile] of this.profiles) {
      stats.totalExamples += profile.examples.length;
      stats.profilesByBrand[slug] = profile.examples.length;
    }

    return stats;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const brandVoiceEngine = new BrandVoiceEngine();
