/**
 * CLAUDE AI PROMPTS FOR SOCIAL COPY TEMPLATES
 * Platform-specific prompts for generating high-quality social media copy
 */

export interface TemplateGenerationRequest {
  platform: string;
  category: string;
  count: number;
  businessContext?: string;
  targetAudience?: string;
  brandVoice?: string;
  competitorAnalysis?: string;
}

// Platform character limits and optimal lengths
export const PLATFORM_SPECS = {
  facebook: {
    maxChars: 63206,
    optimalChars: 250,
    bestPractices: [
      "Start with a hook in first 2-3 lines",
      "Use emojis sparingly (2-3 per post)",
      "Include call-to-action",
      "Ask questions to boost engagement",
      "Keep paragraphs short (2-3 sentences)",
    ],
    toneGuidelines: "Conversational, community-focused, friendly",
  },
  instagram: {
    maxChars: 2200,
    optimalChars: 125,
    bestPractices: [
      "First line must grab attention (shows before 'more')",
      "Use line breaks for readability",
      "Emojis encouraged (3-5 per post)",
      "Hashtags at the end (10-15 max)",
      "Call-to-action in caption and first comment",
    ],
    toneGuidelines: "Visual-first, inspirational, authentic, aesthetic",
  },
  tiktok: {
    maxChars: 2200,
    optimalChars: 150,
    bestPractices: [
      "Hook in first 3 seconds of caption",
      "Use trending sounds and hashtags",
      "Be concise and punchy",
      "Encourage duets/stitches/shares",
      "Include trending hashtags (#fyp, #foryou)",
    ],
    toneGuidelines: "Trendy, playful, attention-grabbing, authentic",
  },
  linkedin: {
    maxChars: 3000,
    optimalChars: 150,
    bestPractices: [
      "Start with compelling hook or question",
      "Provide value and insights",
      "Use data and statistics when relevant",
      "Professional but personable tone",
      "End with thought-provoking question",
    ],
    toneGuidelines: "Professional, insightful, thought-leadership",
  },
  twitter: {
    maxChars: 280,
    optimalChars: 240,
    bestPractices: [
      "Every word counts—be concise",
      "Use threads for longer content",
      "Include relevant hashtags (1-2 max)",
      "Tag relevant accounts when appropriate",
      "Use polls and questions for engagement",
    ],
    toneGuidelines: "Concise, witty, newsworthy, conversational",
  },
};

// Category-specific guidelines
export const CATEGORY_GUIDELINES = {
  promotional: {
    goals: ["Drive sales", "Create urgency", "Highlight benefits", "Include clear CTA"],
    structure: "Hook → Value Proposition → Urgency → CTA",
    keyElements: ["Discount/offer details", "Deadline", "Social proof", "Clear next step"],
  },
  educational: {
    goals: ["Provide value", "Build authority", "Teach something", "Encourage saving/sharing"],
    structure: "Problem → Solution → Application → Encouragement",
    keyElements: ["Actionable tips", "Step-by-step guidance", "Real examples", "Easy to implement"],
  },
  engagement: {
    goals: ["Boost comments", "Increase shares", "Build community", "Foster conversation"],
    structure: "Question/Statement → Context → Invitation to respond",
    keyElements: ["Open-ended questions", "Relatable content", "Controversial opinions", "Fun polls"],
  },
  brand_story: {
    goals: ["Build connection", "Share values", "Humanize brand", "Create loyalty"],
    structure: "Story Hook → Journey → Lesson/Value → Connection",
    keyElements: ["Authentic narrative", "Vulnerability", "Values alignment", "Emotional appeal"],
  },
  user_generated: {
    goals: ["Showcase customers", "Build social proof", "Encourage submissions", "Create FOMO"],
    structure: "Feature → Appreciation → Invitation",
    keyElements: ["Customer spotlight", "Gratitude", "How to participate", "Tag/mention"],
  },
  behind_scenes: {
    goals: ["Build transparency", "Show personality", "Create connection", "Humanize brand"],
    structure: "Tease → Reveal → Insight → Invitation",
    keyElements: ["Candid moments", "Team culture", "Process details", "Authentic voice"],
  },
  product_launch: {
    goals: ["Generate buzz", "Drive pre-orders", "Create anticipation", "Explain value"],
    structure: "Tease → Reveal → Benefits → Launch Details → CTA",
    keyElements: ["Exclusivity", "Limited availability", "Key benefits", "Launch date/time"],
  },
  seasonal: {
    goals: ["Capitalize on trends", "Create relevance", "Drive timely action", "Match mood"],
    structure: "Seasonal Hook → Relevance → Offer/Content → CTA",
    keyElements: ["Holiday/season tie-in", "Timely imagery", "Seasonal language", "Limited time"],
  },
  testimonial: {
    goals: ["Build trust", "Provide proof", "Address objections", "Encourage conversions"],
    structure: "Customer Quote → Story → Results → Invitation",
    keyElements: ["Real customer name", "Specific results", "Before/after", "Authenticity"],
  },
  how_to: {
    goals: ["Provide instruction", "Build authority", "Drive traffic", "Encourage bookmarking"],
    structure: "Problem → Steps → Results → Next Action",
    keyElements: ["Clear steps", "Numbered list", "Visual cues", "Easy to follow"],
  },
};

// Tone variation guidelines
export const TONE_VARIATIONS = {
  professional: {
    characteristics: ["Formal", "Polished", "Authoritative", "Trustworthy"],
    language: ["Industry terminology", "Data-driven", "Structured", "Clear"],
    avoid: ["Slang", "Excessive emojis", "Casual expressions", "Humor"],
  },
  casual: {
    characteristics: ["Friendly", "Relaxed", "Conversational", "Approachable"],
    language: ["Everyday words", "Contractions", "Personal pronouns", "Relatable"],
    avoid: ["Jargon", "Overly formal", "Complex sentences", "Corporate speak"],
  },
  inspirational: {
    characteristics: ["Uplifting", "Motivating", "Aspirational", "Positive"],
    language: ["Action verbs", "Empowering", "Vision-focused", "Encouraging"],
    avoid: ["Negativity", "Complaints", "Limitations", "Doubt"],
  },
  humorous: {
    characteristics: ["Fun", "Entertaining", "Lighthearted", "Witty"],
    language: ["Jokes", "Puns", "Pop culture refs", "Self-deprecating"],
    avoid: ["Offensive content", "Dark humor", "Sarcasm (can misread)", "Inside jokes"],
  },
  urgent: {
    characteristics: ["Time-sensitive", "Action-driven", "Direct", "Compelling"],
    language: ["CAPS for emphasis", "Deadlines", "Scarcity", "Immediate CTAs"],
    avoid: ["Passive voice", "Lengthy explanations", "Hedging words", "Delays"],
  },
  educational: {
    characteristics: ["Informative", "Clear", "Helpful", "Expert"],
    language: ["Teaching tone", "Step-by-step", "Examples", "Clarifications"],
    avoid: ["Condescending", "Overly complex", "Assumptions", "Vague advice"],
  },
  emotional: {
    characteristics: ["Heartfelt", "Personal", "Vulnerable", "Connecting"],
    language: ["Feelings", "Personal stories", "Empathy", "Shared experiences"],
    avoid: ["Manipulation", "Fake sentiment", "Over-the-top", "Inauthentic"],
  },
};

// Master prompt template
export function generateTemplatePrompt(request: TemplateGenerationRequest): string {
  const platformSpec = PLATFORM_SPECS[request.platform as keyof typeof PLATFORM_SPECS];
  const categoryGuideline = CATEGORY_GUIDELINES[request.category as keyof typeof CATEGORY_GUIDELINES];

  return `You are an expert social media copywriter specializing in ${request.platform} content.

TASK: Generate ${request.count} high-quality social media copy templates for ${request.platform}.

PLATFORM SPECIFICATIONS:
- Maximum characters: ${platformSpec.maxChars}
- Optimal length: ${platformSpec.optimalChars} characters
- Tone: ${platformSpec.toneGuidelines}
- Best practices: ${platformSpec.bestPractices.join("; ")}

CATEGORY: ${request.category}
- Goals: ${categoryGuideline.goals.join(", ")}
- Structure: ${categoryGuideline.structure}
- Key elements: ${categoryGuideline.keyElements.join(", ")}

${request.businessContext ? `BUSINESS CONTEXT:\n${request.businessContext}\n` : ""}
${request.targetAudience ? `TARGET AUDIENCE:\n${request.targetAudience}\n` : ""}
${request.brandVoice ? `BRAND VOICE:\n${request.brandVoice}\n` : ""}
${request.competitorAnalysis ? `COMPETITOR ANALYSIS:\n${request.competitorAnalysis}\n` : ""}

REQUIREMENTS:
1. Each template must be unique and immediately usable
2. Optimize for maximum engagement based on platform algorithms
3. Include platform-appropriate emojis (frequency based on platform norms)
4. Generate 5-10 relevant hashtags per template (research current trending tags)
5. Provide a strong, clear call-to-action
6. Create 3 tone variations: professional, casual, and inspirational
7. Predict performance metrics based on industry benchmarks
8. Include tags for categorization and searchability

TONE VARIATIONS:
- Professional: ${TONE_VARIATIONS.professional.characteristics.join(", ")}
- Casual: ${TONE_VARIATIONS.casual.characteristics.join(", ")}
- Inspirational: ${TONE_VARIATIONS.inspirational.characteristics.join(", ")}

PERFORMANCE PREDICTION GUIDELINES:
Base estimates on:
- Platform engagement rates (Facebook: 0.18%, Instagram: 1.22%, TikTok: 5.96%, LinkedIn: 2.1%, Twitter: 0.045%)
- Typical follower count ranges (1K-10K, 10K-50K, 50K+)
- Best posting times based on research and time zones
- Content category performance benchmarks

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact structure:

{
  "templates": [
    {
      "templateName": "Descriptive, catchy name for the template",
      "copyText": "The full social media copy, optimized for the platform",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
      "emojiSuggestions": ["emoji1", "emoji2", "emoji3", "emoji4", "emoji5"],
      "callToAction": "Clear, action-oriented CTA",
      "variations": [
        {
          "copy": "Professional tone variation of the copy",
          "tone": "professional"
        },
        {
          "copy": "Casual tone variation of the copy",
          "tone": "casual"
        },
        {
          "copy": "Inspirational tone variation of the copy",
          "tone": "inspirational"
        }
      ],
      "performancePrediction": {
        "estimatedReach": "1,000-2,500 (provide realistic range based on platform)",
        "estimatedEngagement": "5-8% (provide realistic percentage)",
        "bestTimeToPost": "Specific time and day recommendations"
      },
      "tags": ["tag1", "tag2", "tag3", "tag4"]
    }
  ]
}

IMPORTANT:
- Do NOT include markdown formatting or code blocks
- Do NOT include explanations outside the JSON
- Ensure all JSON is valid and properly escaped
- Make templates diverse across different angles and approaches
- Focus on quality over quantity—each template should be excellent
- Consider current trends and viral content patterns for the platform
- Include actionable, specific content—avoid generic placeholders

Generate ${request.count} templates now:`;
}

// Variation generation prompt
export function generateVariationPrompt(
  originalCopy: string,
  platform: string,
  tones: string[]
): string {
  const platformSpec = PLATFORM_SPECS[platform as keyof typeof PLATFORM_SPECS];

  return `You are an expert social media copywriter. Generate tone variations of this ${platform} post.

ORIGINAL COPY:
"${originalCopy}"

PLATFORM: ${platform}
- Character limit: ${platformSpec.maxChars}
- Optimal length: ${platformSpec.optimalChars}
- Platform tone: ${platformSpec.toneGuidelines}

GENERATE VARIATIONS FOR THESE TONES:
${tones.map((tone) => {
  const toneGuide = TONE_VARIATIONS[tone as keyof typeof TONE_VARIATIONS];
  return `\n${tone.toUpperCase()}:
- Characteristics: ${toneGuide.characteristics.join(", ")}
- Language style: ${toneGuide.language.join(", ")}
- Avoid: ${toneGuide.avoid.join(", ")}`;
}).join("\n")}

REQUIREMENTS:
1. Maintain the core message and key points from the original
2. Adapt language, structure, and style to match each tone perfectly
3. Optimize for ${platform}'s character limits and best practices
4. Keep each variation engaging and authentic
5. Preserve any important calls-to-action or key details

OUTPUT FORMAT:
Return ONLY valid JSON:

{
  "variations": [
    {
      "copy": "The variation copy here",
      "tone": "tone_name"
    }
  ]
}

Do NOT include markdown, code blocks, or explanations. Just pure JSON.

Generate variations now:`;
}

// Hashtag research prompt
export function generateHashtagsPrompt(
  platform: string,
  category: string,
  copyText: string
): string {
  return `Generate trending and relevant hashtags for this ${platform} post.

CATEGORY: ${category}
COPY: "${copyText}"

REQUIREMENTS:
1. Mix of popular and niche hashtags
2. Platform-appropriate (Instagram: 10-15, TikTok: 3-5, LinkedIn: 3-5, Facebook: 2-3, Twitter: 1-2)
3. Current and trending (research latest trends)
4. Relevant to content and audience
5. Mix of broad reach and targeted hashtags

Return as JSON:
{
  "hashtags": ["tag1", "tag2", "tag3"]
}`;
}
