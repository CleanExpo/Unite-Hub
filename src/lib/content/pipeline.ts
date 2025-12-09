// src/lib/content/pipeline.ts
// Content Generation Pipeline - Connects LLM Orchestrator to Site Architecture

import type { TaskType } from '../llm/types';

// ============================================
// TYPES
// ============================================

export type PageType = 'landing' | 'pillar' | 'subpillar' | 'service' | 'location';

export interface PageSpec {
  id: string;
  url: string;
  type: PageType;
  title: string;
  h1: string;
  meta_description: string;
  primary_keyword: string;
  secondary_keywords: string[];
  word_count_target: number;
  sections: string[];
  schema_types: string[];
  parent_pillar?: string;
  industry?: string;
  location?: string;
  faq_questions?: string[];
}

export interface SectionContent {
  section_id: string;
  section_type: string;
  content: string;
  word_count: number;
  tokens_used: number;
  cost_usd: number;
  model_used: string;
}

export interface GeneratedPage {
  page_id: string;
  page_type: PageType;
  url: string;
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };
  content: {
    h1: string;
    sections: SectionContent[];
    full_html: string;
  };
  seo: {
    word_count: number;
    keyword_density: number;
    readability_score: number;
    schema_markup: string;
  };
  scores: {
    ai_friendliness: number;
    human_appeal: number;
    seo_score: number;
  };
  generation: {
    total_tokens: number;
    total_cost_usd: number;
    models_used: string[];
    generation_time_ms: number;
  };
}

export interface PipelineConfig {
  brand: 'synthex' | 'unite_hub';
  dry_run: boolean;
  parallel_sections: boolean;
  max_retries: number;
  validate_seo: boolean;
  score_content: boolean;
  generate_schema: boolean;
}

export interface PipelineResult {
  success: boolean;
  page: GeneratedPage | null;
  errors: string[];
  warnings: string[];
}

// ============================================
// SECTION TEMPLATES
// ============================================

export const SECTION_PROMPTS: Record<string, (spec: PageSpec, brand: string) => string> = {
  hero: (spec, brand) => `
Write a hero section for a ${brand} landing page.

Page: ${spec.title}
H1: ${spec.h1}
Primary Keyword: ${spec.primary_keyword}
Target Audience: Australian SMB owners (35-55)

Requirements:
- Badge text (short, trust-building)
- Headline (use the H1, can add italic emphasis on key word)
- Subtitle (2-3 sentences, explain value prop)
- Primary CTA: "Start Free Trial"
- Secondary CTA: "See How It Works"
- Trust indicators (3 items): No contracts, Cancel anytime, 100% Australian

Voice: Confident, calm, direct. No hype words. Australian spelling.
Format: Return as JSON with keys: badge, headline, subtitle, cta_primary, cta_secondary, trust_items[]

${brand === 'synthex' ? 'CRITICAL: No phone numbers. No "book a call". Autonomous agent positioning.' : ''}
`,

  problem: (spec, brand) => `
Write a problem section for ${spec.title}.

Brand: ${brand}
Industry: ${spec.industry || 'Small Business'}
Target: Australian SMB owners who don't have time for marketing

Requirements:
- Section tag (e.g., "The Challenge")
- Headline (empathetic, not condescending)
- 4-6 problem cards, each with:
  - Icon description (what icon to use)
  - Problem title (short)
  - Problem description (1-2 sentences)

Voice: Empathetic but not pitying. Acknowledge the real struggle.
Format: Return as JSON with keys: tag, headline, problems[]

Problems should resonate with ${spec.industry || 'business'} owners specifically.
${brand === 'synthex' ? 'Focus on problems that autonomous marketing solves (lack of time, inconsistent effort, missed opportunities).' : ''}
`,

  features: (spec, brand) => `
Write a features section for ${spec.title}.

Service: ${brand === 'synthex' ? 'Autonomous marketing agent' : 'Marketing agency'}
Primary Keyword: ${spec.primary_keyword}

Requirements:
- Section tag (e.g., "What We Do")
- Headline with italic emphasis on key word
- 4 feature cards, each with:
  - Icon description
  - Feature title
  - Feature description (2-3 sentences)
  - Key benefit (one line)

Features to cover:
1. Content Creation (blogs, social, email)
2. Local SEO (Google rankings, maps)
3. Google Business Profile management
4. Lead Generation / Enquiry tracking

Voice: Clear, benefit-focused. Show outcomes, not just features.
Format: Return as JSON with keys: tag, headline, features[]

${brand === 'synthex' ? 'Emphasise automation and "runs 24/7" messaging.' : ''}
`,

  process: (spec, brand) => `
Write a process section for ${spec.title}.

Brand: ${brand}
Positioning: ${brand === 'synthex' ? 'Fully autonomous - no meetings required' : 'Done-for-you agency'}

Requirements:
- Section tag (e.g., "How It Works")
- Headline
- 4 steps, each with:
  - Step number
  - Step title (2-3 words)
  - Step description (1-2 sentences)

${brand === 'synthex' ? `
Steps should be:
1. Sign up (create account)
2. We configure (system learns your business)
3. It runs (content flows, rankings climb)
4. You grow (check dashboard, watch results)
` : `
Steps should be:
1. Discovery call (understand your business)
2. Strategy (create marketing plan)
3. Execution (we handle everything)
4. Results (track and optimise)
`}

Format: Return as JSON with keys: tag, headline, steps[]
`,

  testimonials: (spec, brand) => `
Write testimonial introductory content for ${spec.title}.

Brand: ${brand}
Industry: ${spec.industry || 'Small Business'}

Requirements:
- Section tag (e.g., "Results")
- Headline with italic emphasis
- Subtitle (1 sentence about real results)

Note: Actual testimonials will be pulled from the testimonials database.
Just write the section header content.

${brand === 'synthex' ? 'Emphasise automated results and hands-off success.' : 'Emphasise personal service and expertise.'}

Format: Return as JSON with keys: tag, headline, subtitle
`,

  results: (spec, brand) => `
Write a results/proof section for ${spec.title}.

Brand: ${brand}

Requirements:
- Section tag (e.g., "The Numbers")
- Headline
- 4 result cards, each with:
  - Metric value (e.g., "847%", "$2.40", "200+")
  - Metric label (e.g., "Traffic increase")
  - Context (e.g., "Average within 6 months")

Use these verified metrics:
- 847% average traffic increase (within 6 months)
- $2.40 cost per lead (industry avg $50-150)
- 312 content pieces per month (automated)
- 200+ Australian businesses served

${brand === 'synthex' ? 'Emphasise automation metrics (content pieces per month, 24/7 operation).' : 'Emphasise client success stories.'}

Format: Return as JSON with keys: tag, headline, results[]
`,

  cta: (spec, brand) => `
Write a final CTA section for ${spec.title}.

Requirements:
- Headline (short, action-oriented, can use italic emphasis)
- Subtitle (remove friction, build trust)
- Primary CTA button text
- Support note (for questions)

${brand === 'synthex' ? `
Use:
- "Start Free Trial" as CTA
- "No credit card required. No commitment."
- "Questions? Chat with us anytime." (NO phone numbers)
` : `
Use:
- "Get Your Free Audit" as CTA
- Include phone number: 1300 XXX XXX
`}

Format: Return as JSON with keys: headline, subtitle, cta_text, support_note
`,

  faq: (spec, brand) => `
Write an FAQ section for ${spec.title}.

Brand: ${brand}
Primary Keyword: ${spec.primary_keyword}
Industry: ${spec.industry || 'Small Business'}

${spec.faq_questions ? `Use these questions:\n${spec.faq_questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : `
Generate 4-6 relevant FAQs about:
- How the service works
- Pricing/commitment questions
- Results timeline
- Industry-specific concerns
`}

Requirements:
- Each FAQ has question and answer
- Answers should be 2-4 sentences
- Include the primary keyword naturally
- Write for both humans AND AI search engines (clear, direct answers)

${brand === 'synthex' ? 'Include FAQ about "Is it really automated?" and "Do I need to do anything?"' : 'Include FAQ about working with the team.'}

Format: Return as JSON with keys: faqs[] (each with question, answer)
`,

  industry_intro: (spec, brand) => `
Write an industry introduction section for ${spec.title}.

Industry: ${spec.industry}
Primary Keyword: ${spec.primary_keyword}
Word Count Target: 300-400 words

Requirements:
- Acknowledge the specific challenges of ${spec.industry} businesses
- Explain why marketing is hard for them specifically
- Position ${brand} as the solution
- Include primary keyword 2-3 times naturally

Voice: Empathetic, knowledgeable about the industry. Not generic.
Format: Return as JSON with keys: intro_html (with <p> tags)
`,

  service_detail: (spec, brand) => `
Write detailed service content for ${spec.title}.

Brand: ${brand}
Service: ${spec.h1}
Primary Keyword: ${spec.primary_keyword}
Secondary Keywords: ${spec.secondary_keywords.join(', ')}
Word Count Target: ${spec.word_count_target}

Requirements:
- Comprehensive explanation of the service
- Benefits for Australian SMBs
- How it works (process)
- What's included
- Results to expect

Structure:
- Opening paragraph (what + why)
- "What's Included" section
- "How It Works" section
- "Results You Can Expect" section

${brand === 'synthex' ? 'Emphasise automation, 24/7 operation, and no ongoing effort required from the client.' : 'Emphasise personal attention and expert guidance.'}

Format: Return as JSON with keys: content_html (with <h2>, <h3>, <p>, <ul> tags)
`,
};

// ============================================
// CONTENT GENERATOR CLASS
// ============================================

interface ExecuteTaskResponse {
  content: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  model_used: string;
}

interface ExecuteTaskOptions {
  systemPrompt?: string;
}

export class ContentPipeline {
  private config: PipelineConfig;
  private executeTask: (taskType: TaskType, prompt: string, options?: ExecuteTaskOptions) => Promise<ExecuteTaskResponse>;

  constructor(
    config: Partial<PipelineConfig>,
    executeTaskFn: (taskType: TaskType, prompt: string, options?: ExecuteTaskOptions) => Promise<ExecuteTaskResponse>
  ) {
    this.config = {
      brand: config.brand || 'synthex',
      dry_run: config.dry_run || false,
      parallel_sections: config.parallel_sections || false,
      max_retries: config.max_retries || 3,
      validate_seo: config.validate_seo !== false,
      score_content: config.score_content !== false,
      generate_schema: config.generate_schema !== false,
    };
    this.executeTask = executeTaskFn;
  }

  /**
   * Generate a complete page from spec
   */
  async generatePage(spec: PageSpec): Promise<PipelineResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const sections: SectionContent[] = [];
    let totalTokens = 0;
    let totalCost = 0;
    const modelsUsed = new Set<string>();

    try {
      // Generate each section
      for (const sectionType of spec.sections) {
        const promptFn = SECTION_PROMPTS[sectionType];
        if (!promptFn) {
          warnings.push(`Unknown section type: ${sectionType}, skipping`);
          continue;
        }

        const prompt = promptFn(spec, this.config.brand);

        if (this.config.dry_run) {
          sections.push({
            section_id: `${spec.id}_${sectionType}`,
            section_type: sectionType,
            content: `[DRY RUN] Would generate ${sectionType} section`,
            word_count: 0,
            tokens_used: 0,
            cost_usd: 0,
            model_used: 'dry_run',
          });
          continue;
        }

        // Determine task type based on section
        const taskType = this.getTaskTypeForSection(sectionType);

        try {
          const response = await this.executeTask(taskType, prompt, {
            systemPrompt: this.getSystemPrompt(spec),
          });

          const content = response.content;
          const wordCount = content.split(/\s+/).length;

          sections.push({
            section_id: `${spec.id}_${sectionType}`,
            section_type: sectionType,
            content,
            word_count: wordCount,
            tokens_used: response.input_tokens + response.output_tokens,
            cost_usd: response.cost_usd,
            model_used: response.model_used,
          });

          totalTokens += response.input_tokens + response.output_tokens;
          totalCost += response.cost_usd;
          modelsUsed.add(response.model_used);
        } catch (error) {
          errors.push(`Failed to generate ${sectionType}: ${String(error)}`);
        }
      }

      // Calculate totals
      const totalWordCount = sections.reduce((sum, s) => sum + s.word_count, 0);

      // Generate schema markup
      let schemaMarkup = '';
      if (this.config.generate_schema && !this.config.dry_run) {
        schemaMarkup = this.generateSchema(spec, sections);
      }

      // Score content
      let scores = { ai_friendliness: 0, human_appeal: 0, seo_score: 0 };
      if (this.config.score_content) {
        scores = this.scoreContent(spec, sections, totalWordCount);
      }

      // Validate SEO
      if (this.config.validate_seo) {
        const seoWarnings = this.validateSEO(spec, totalWordCount);
        warnings.push(...seoWarnings);
      }

      // Assemble full HTML
      const fullHtml = this.assembleHtml(spec, sections);

      // Calculate keyword density
      const keywordCount = (fullHtml.toLowerCase().match(new RegExp(spec.primary_keyword.toLowerCase(), 'g')) || []).length;
      const keywordDensity = (keywordCount / totalWordCount) * 100;

      const generatedPage: GeneratedPage = {
        page_id: spec.id,
        page_type: spec.type,
        url: spec.url,
        meta: {
          title: spec.title,
          description: spec.meta_description,
          keywords: [spec.primary_keyword, ...spec.secondary_keywords],
        },
        content: {
          h1: spec.h1,
          sections,
          full_html: fullHtml,
        },
        seo: {
          word_count: totalWordCount,
          keyword_density: keywordDensity,
          readability_score: this.calculateReadability(fullHtml),
          schema_markup: schemaMarkup,
        },
        scores,
        generation: {
          total_tokens: totalTokens,
          total_cost_usd: totalCost,
          models_used: Array.from(modelsUsed),
          generation_time_ms: Date.now() - startTime,
        },
      };

      return {
        success: errors.length === 0,
        page: generatedPage,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        success: false,
        page: null,
        errors: [`Pipeline failed: ${String(error)}`],
        warnings,
      };
    }
  }

  /**
   * Generate multiple pages (batch)
   */
  async generatePages(specs: PageSpec[]): Promise<PipelineResult[]> {
    const results: PipelineResult[] = [];

    for (const spec of specs) {
       
      console.log(`[Pipeline] Generating: ${spec.url}`);
      const result = await this.generatePage(spec);
      results.push(result);

      if (result.success) {
         
        console.log(`[Pipeline] ✓ ${spec.url} - ${result.page?.generation.total_cost_usd.toFixed(4)} USD`);
      } else {
         
        console.log(`[Pipeline] ✗ ${spec.url} - ${result.errors.join(', ')}`);
      }
    }

    return results;
  }

  /**
   * Get system prompt based on page spec
   */
  private getSystemPrompt(spec: PageSpec): string {
    const brandName = this.config.brand === 'synthex' ? 'Synthex' : 'Unite-Hub';

    return `You are a content writer for ${brandName}, an Australian ${
      this.config.brand === 'synthex' ? 'autonomous marketing agent' : 'marketing agency for trades'
    }.

VOICE:
- Confident, not salesy
- Calm, no urgency tactics
- Direct, clear language
- Australian spelling (colour, enquiry, etc.)
- Professional but approachable

${this.config.brand === 'synthex' ? `
CRITICAL CONSTRAINTS:
- NO phone numbers anywhere
- NO "book a call" or "schedule meeting" CTAs
- Use "Start Free Trial" as primary CTA
- Use "Chat with us" for support
- Emphasise autonomous/automatic operation
- Use: "runs 24/7", "on autopilot", "set it and forget it"
` : ''}

BANNED WORDS: synergy, leverage, cutting-edge, best-in-class, revolutionary, game-changing, disruptive, innovative, solutions, empower, transform, unlock, supercharge, skyrocket

TARGET AUDIENCE: Australian SMB owners aged 35-55

PRIMARY KEYWORD: ${spec.primary_keyword}

Always return valid JSON as specified in the prompt.`;
  }

  /**
   * Determine task type based on section
   */
  private getTaskTypeForSection(sectionType: string): TaskType {
    const heavySections = ['industry_intro', 'service_detail', 'faq'];
    const lightSections = ['cta', 'testimonials'];

    if (heavySections.includes(sectionType)) {
      return 'seo_content';
    } else if (lightSections.includes(sectionType)) {
      return 'marketing_copy';
    }
    return 'marketing_copy';
  }

  /**
   * Generate schema markup
   */
  private generateSchema(spec: PageSpec, sections: SectionContent[]): string {
    const schemas: Record<string, unknown>[] = [];

    // Organization schema (on landing page only)
    if (spec.type === 'landing') {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: this.config.brand === 'synthex' ? 'Synthex' : 'Unite-Hub',
        url: `https://${this.config.brand === 'synthex' ? 'synthex.com.au' : 'unite-hub.com.au'}`,
        logo: `https://${this.config.brand === 'synthex' ? 'synthex.com.au' : 'unite-hub.com.au'}/logo.png`,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          areaServed: 'AU',
          availableLanguage: 'English',
        },
      });
    }

    // Service schema
    if (spec.type === 'service' || spec.type === 'pillar') {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: spec.h1,
        description: spec.meta_description,
        provider: {
          '@type': 'Organization',
          name: this.config.brand === 'synthex' ? 'Synthex' : 'Unite-Hub',
        },
        areaServed: {
          '@type': 'Country',
          name: 'Australia',
        },
      });
    }

    // FAQ schema
    const faqSection = sections.find((s) => s.section_type === 'faq');
    if (faqSection) {
      try {
        const faqData = JSON.parse(faqSection.content);
        if (faqData.faqs && Array.isArray(faqData.faqs)) {
          schemas.push({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqData.faqs.map((faq: { question: string; answer: string }) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          });
        }
      } catch {
        // FAQ content wasn't valid JSON, skip
      }
    }

    // LocalBusiness schema for location pages
    if (spec.type === 'location' && spec.location) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: `${this.config.brand === 'synthex' ? 'Synthex' : 'Unite-Hub'} ${spec.location}`,
        description: spec.meta_description,
        areaServed: spec.location,
        address: {
          '@type': 'PostalAddress',
          addressLocality: spec.location,
          addressCountry: 'AU',
        },
      });
    }

    return `<script type="application/ld+json">${JSON.stringify(schemas, null, 2)}</script>`;
  }

  /**
   * Score content for AI and human appeal
   */
  private scoreContent(
    spec: PageSpec,
    sections: SectionContent[],
    wordCount: number
  ): { ai_friendliness: number; human_appeal: number; seo_score: number } {
    let aiScore = 0;
    let humanScore = 0;
    let seoScore = 0;

    // AI Friendliness
    if (sections.some((s) => s.section_type === 'faq')) {
      aiScore += 25;
    }
    if (spec.schema_types.length > 0) {
      aiScore += 25;
    }
    if (wordCount >= spec.word_count_target * 0.8) {
      aiScore += 25;
    }
    if (sections.length >= 4) {
      aiScore += 25;
    }

    // Human Appeal
    if (sections.some((s) => s.section_type === 'testimonials')) {
      humanScore += 20;
    }
    if (sections.some((s) => s.section_type === 'results')) {
      humanScore += 20;
    }
    if (sections.some((s) => s.section_type === 'cta')) {
      humanScore += 20;
    }
    if (sections.some((s) => s.section_type === 'hero')) {
      humanScore += 20;
    }
    if (sections.some((s) => s.section_type === 'process')) {
      humanScore += 20;
    }

    // SEO Score
    if (wordCount >= spec.word_count_target) {
      seoScore += 30;
    }
    if (spec.meta_description.length >= 120 && spec.meta_description.length <= 160) {
      seoScore += 20;
    }
    if (spec.title.includes(spec.primary_keyword)) {
      seoScore += 20;
    }
    if (spec.h1.toLowerCase().includes(spec.primary_keyword.toLowerCase().split(' ')[0])) {
      seoScore += 15;
    }
    if (spec.secondary_keywords.length >= 2) {
      seoScore += 15;
    }

    return {
      ai_friendliness: Math.min(100, aiScore),
      human_appeal: Math.min(100, humanScore),
      seo_score: Math.min(100, seoScore),
    };
  }

  /**
   * Validate SEO requirements
   */
  private validateSEO(spec: PageSpec, wordCount: number): string[] {
    const warnings: string[] = [];

    if (wordCount < spec.word_count_target * 0.7) {
      warnings.push(`Word count (${wordCount}) is below 70% of target (${spec.word_count_target})`);
    }

    if (spec.meta_description.length < 120) {
      warnings.push(`Meta description too short: ${spec.meta_description.length} chars (min 120)`);
    }

    if (spec.meta_description.length > 160) {
      warnings.push(`Meta description too long: ${spec.meta_description.length} chars (max 160)`);
    }

    if (!spec.title.toLowerCase().includes(spec.primary_keyword.toLowerCase().split(' ')[0])) {
      warnings.push(`Title may not include primary keyword: ${spec.primary_keyword}`);
    }

    return warnings;
  }

  /**
   * Calculate Flesch readability score
   */
  private calculateReadability(text: string): number {
    const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = plainText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words = plainText.split(/\s+/).filter((w) => w.length > 0);
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) {
      return 0;
    }

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch Reading Ease formula
    const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Count syllables in a word (approximate)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) {
      return 1;
    }

    const vowels = 'aeiouy';
    let count = 0;
    let prevWasVowel = false;

    for (const char of word) {
      const isVowel = vowels.includes(char);
      if (isVowel && !prevWasVowel) {
        count++;
      }
      prevWasVowel = isVowel;
    }

    // Handle silent e
    if (word.endsWith('e')) {
      count--;
    }
    if (word.endsWith('le') && word.length > 2 && !vowels.includes(word[word.length - 3])) {
      count++;
    }

    return Math.max(1, count);
  }

  /**
   * Assemble sections into full HTML
   */
  private assembleHtml(spec: PageSpec, sections: SectionContent[]): string {
    const sectionHtmlParts: string[] = [];

    for (const section of sections) {
      try {
        const data = JSON.parse(section.content);
        const html = this.renderSection(section.section_type, data);
        sectionHtmlParts.push(html);
      } catch {
        // Content wasn't JSON, use as-is
        sectionHtmlParts.push(`<section class="${section.section_type}">${section.content}</section>`);
      }
    }

    return sectionHtmlParts.join('\n\n');
  }

  /**
   * Render section data to HTML
   */
  private renderSection(type: string, data: Record<string, unknown>): string {
    switch (type) {
      case 'hero':
        return `
<section class="hero">
  <div class="container">
    <div class="hero-badge">${data.badge || ''}</div>
    <h1 class="hero-title">${data.headline || ''}</h1>
    <p class="hero-subtitle">${data.subtitle || ''}</p>
    <div class="hero-cta">
      <a href="#contact" class="btn btn-primary">${data.cta_primary || 'Start Free Trial'}</a>
      <a href="#process" class="btn btn-secondary">${data.cta_secondary || 'See How It Works'}</a>
    </div>
    <div class="trust-row">
      ${(data.trust_items as string[] || []).map((item: string) => `<span class="trust-item">✓ ${item}</span>`).join('')}
    </div>
  </div>
</section>`;

      case 'problem':
        return `
<section class="problem-section">
  <div class="container">
    <span class="section-tag">${data.tag || ''}</span>
    <h2>${data.headline || ''}</h2>
    <div class="problem-grid">
      ${(data.problems as Array<{ icon?: string; title?: string; description?: string }> || [])
        .map(
          (p) => `
        <div class="problem-card">
          <div class="problem-icon">${p.icon || '⚠️'}</div>
          <h3>${p.title || ''}</h3>
          <p>${p.description || ''}</p>
        </div>
      `
        )
        .join('')}
    </div>
  </div>
</section>`;

      case 'features':
        return `
<section class="features-section">
  <div class="container">
    <span class="section-tag">${data.tag || ''}</span>
    <h2>${data.headline || ''}</h2>
    <div class="features-grid">
      ${(data.features as Array<{ icon?: string; title?: string; description?: string; benefit?: string }> || [])
        .map(
          (f) => `
        <div class="feature-card">
          <div class="feature-icon">${f.icon || '✨'}</div>
          <h3>${f.title || ''}</h3>
          <p>${f.description || ''}</p>
          <span class="feature-benefit">${f.benefit || ''}</span>
        </div>
      `
        )
        .join('')}
    </div>
  </div>
</section>`;

      case 'process':
        return `
<section class="process-section">
  <div class="container">
    <span class="section-tag">${data.tag || ''}</span>
    <h2>${data.headline || ''}</h2>
    <div class="process-steps">
      ${(data.steps as Array<{ title?: string; description?: string }> || [])
        .map(
          (s, i: number) => `
        <div class="process-step">
          <div class="step-number">${i + 1}</div>
          <h3>${s.title || ''}</h3>
          <p>${s.description || ''}</p>
        </div>
      `
        )
        .join('')}
    </div>
  </div>
</section>`;

      case 'results':
        return `
<section class="results-section">
  <div class="container">
    <span class="section-tag">${data.tag || ''}</span>
    <h2>${data.headline || ''}</h2>
    <div class="results-grid">
      ${(data.results as Array<{ value?: string; label?: string; context?: string }> || [])
        .map(
          (r) => `
        <div class="result-card">
          <div class="result-value">${r.value || ''}</div>
          <div class="result-label">${r.label || ''}</div>
          <div class="result-context">${r.context || ''}</div>
        </div>
      `
        )
        .join('')}
    </div>
  </div>
</section>`;

      case 'cta':
        return `
<section class="cta-section">
  <div class="container">
    <h2>${data.headline || ''}</h2>
    <p>${data.subtitle || ''}</p>
    <a href="#contact" class="btn btn-primary btn-large">${data.cta_text || 'Start Free Trial'}</a>
    <p class="cta-note">${data.support_note || ''}</p>
  </div>
</section>`;

      case 'faq':
        return `
<section class="faq-section">
  <div class="container">
    <h2>Frequently Asked Questions</h2>
    <div class="faq-list">
      ${(data.faqs as Array<{ question?: string; answer?: string }> || [])
        .map(
          (faq) => `
        <div class="faq-item">
          <h3 class="faq-question">${faq.question || ''}</h3>
          <p class="faq-answer">${faq.answer || ''}</p>
        </div>
      `
        )
        .join('')}
    </div>
  </div>
</section>`;

      default:
        return `<section class="${type}">${JSON.stringify(data)}</section>`;
    }
  }
}
