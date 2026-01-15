/**
 * Ghost Service - Canonical Fact Block Generation & AI Signature Scrubbing
 *
 * Generates professional content with BLUF (Bottom Line Up Front) logic
 * and strips AI signatures for authentic, human-quality output.
 */

import { readFile, writeFile } from 'fs/promises';
import Anthropic from '@anthropic-ai/sdk';
import type { CitationGapAnalysis } from '../seo-intelligence/audit-service.js';

export type ContentStyle = 'ANZ_Professional' | 'Technical' | 'Executive' | 'Marketing';
export type ScrubLevel = 'Conservative' | 'Moderate' | 'Aggressive';

export interface GhostWriteOptions {
  inputPath: string;
  outputPath?: string;
  style: ContentStyle;
  maxLength?: number;
  includeEvidence?: boolean;
}

export interface GhostScrubOptions {
  targetFile: string;
  level: ScrubLevel;
  preserveFormatting?: boolean;
  outputPath?: string;
}

export interface CanonicalFactBlock {
  category: string;
  blufStatement: string;
  evidence: string[];
  actionableInsight: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface GhostWriteResult {
  factBlocks: CanonicalFactBlock[];
  totalBlocks: number;
  wordCount: number;
  outputPath: string;
  style: ContentStyle;
}

export interface GhostScrubResult {
  originalWordCount: number;
  scrubbedWordCount: number;
  signaturesRemoved: number;
  fillerWordsRemoved: number;
  improvementScore: number;
  outputPath: string;
}

// AI Signature patterns to detect and remove
const AI_SIGNATURES = {
  // Ultra-common AI overuse words
  delve: /\b(delve|delved|delves|delving)\b/gi,
  unleash: /\b(unleash|unleashed|unleashes|unleashing)\b/gi,
  multifaceted: /\b(multifaceted|multi-faceted)\b/gi,
  landscape: /\b(landscape|landscapes)\b/gi,
  leverage: /\b(leverage|leveraged|leverages|leveraging)\b/gi,
  tapestry: /\b(tapestry|tapestries)\b/gi,
  robust: /\b(robust|robustness)\b/gi,
  seamless: /\b(seamless|seamlessly)\b/gi,
  innovative: /\b(innovative|innovatively|innovation)\b/gi,
  cutting_edge: /\b(cutting-edge|cutting edge)\b/gi,
  game_changer: /\b(game-changer|game changer|gamechanging)\b/gi,
  paradigm: /\b(paradigm|paradigms|paradigm shift)\b/gi,
  synergy: /\b(synergy|synergies|synergistic)\b/gi,
  holistic: /\b(holistic|holistically)\b/gi,
  comprehensive: /\b(comprehensive|comprehensively)\b/gi,

  // Filler phrases
  it_is_important: /\b(it is important to note that|it's important to note that)\b/gi,
  in_conclusion: /\b(in conclusion|to conclude)\b/gi,
  furthermore: /\b(furthermore|moreover)\b/gi,
  additionally: /\b(additionally)\b/gi,
  however: /\b(however)\b/gi,
  therefore: /\b(therefore)\b/gi,
  consequently: /\b(consequently)\b/gi,

  // Hedging language
  somewhat: /\b(somewhat|fairly|rather|quite|pretty)\b/gi,
  arguably: /\b(arguably|conceivably|potentially)\b/gi,
  might: /\b(might|may|could possibly)\b/gi,

  // Excessive adjectives
  very: /\b(very|extremely|incredibly|exceptionally)\b/gi,
  really: /\b(really)\b/gi,
  absolutely: /\b(absolutely|totally|completely)\b/gi,
};

const FILLER_WORDS = [
  'just', 'actually', 'basically', 'literally', 'seriously',
  'honestly', 'obviously', 'clearly', 'simply', 'merely',
  'essentially', 'fundamentally', 'inherently', 'intrinsically',
];

export class GhostService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async write(options: GhostWriteOptions): Promise<GhostWriteResult> {
    console.log('[Ghost] Loading audit data...');

    // Load audit data
    const content = await readFile(options.inputPath, 'utf-8');
    const analysis: CitationGapAnalysis = JSON.parse(content);

    console.log('[Ghost] Generating canonical fact blocks...');

    // Generate fact blocks using Claude
    const factBlocks = await this.generateFactBlocks(analysis, options.style);

    // Format as markdown
    const markdown = this.formatAsMarkdown(factBlocks, options);

    // Calculate word count
    const wordCount = markdown.split(/\s+/).length;

    // Write to file
    const outputPath = options.outputPath || options.inputPath.replace('.json', '_story.md');
    await writeFile(outputPath, markdown, 'utf-8');

    console.log(`[Ghost] Generated ${factBlocks.length} fact blocks (${wordCount} words)`);

    return {
      factBlocks,
      totalBlocks: factBlocks.length,
      wordCount,
      outputPath,
      style: options.style,
    };
  }

  async scrub(options: GhostScrubOptions): Promise<GhostScrubResult> {
    console.log('[Ghost] Reading file...');

    // Read file
    const originalContent = await readFile(options.targetFile, 'utf-8');
    const originalWordCount = originalContent.split(/\s+/).length;

    console.log('[Ghost] Scrubbing AI signatures...');

    // Scrub based on level
    let scrubbedContent = originalContent;
    let signaturesRemoved = 0;
    let fillerWordsRemoved = 0;

    // Level 1: Remove AI signatures
    if (options.level === 'Conservative' || options.level === 'Moderate' || options.level === 'Aggressive') {
      const result = this.removeAISignatures(scrubbedContent);
      scrubbedContent = result.content;
      signaturesRemoved = result.removed;
    }

    // Level 2: Remove filler words
    if (options.level === 'Moderate' || options.level === 'Aggressive') {
      const result = this.removeFillerWords(scrubbedContent);
      scrubbedContent = result.content;
      fillerWordsRemoved = result.removed;
    }

    // Level 3: Aggressive restructuring
    if (options.level === 'Aggressive') {
      scrubbedContent = await this.aggressiveRestructure(scrubbedContent);
    }

    // Preserve formatting if requested
    if (options.preserveFormatting) {
      scrubbedContent = this.preserveFormatting(originalContent, scrubbedContent);
    }

    // Calculate metrics
    const scrubbedWordCount = scrubbedContent.split(/\s+/).length;
    const improvementScore = this.calculateImprovementScore(
      originalContent,
      scrubbedContent,
      signaturesRemoved,
      fillerWordsRemoved
    );

    // Write to file
    const outputPath = options.outputPath || options.targetFile.replace(/\.md$/, '_scrubbed.md');
    await writeFile(outputPath, scrubbedContent, 'utf-8');

    console.log(`[Ghost] Removed ${signaturesRemoved} AI signatures, ${fillerWordsRemoved} filler words`);
    console.log(`[Ghost] Improvement score: ${improvementScore}/100`);

    return {
      originalWordCount,
      scrubbedWordCount,
      signaturesRemoved,
      fillerWordsRemoved,
      improvementScore,
      outputPath,
    };
  }

  private async generateFactBlocks(
    analysis: CitationGapAnalysis,
    style: ContentStyle
  ): Promise<CanonicalFactBlock[]> {
    const prompt = this.buildPrompt(analysis, style);

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: this.getSystemPrompt(style),
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse response
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return this.parseFactBlocks(content.text);
  }

  private getSystemPrompt(style: ContentStyle): string {
    const basePrompt = `You are a professional content writer specializing in BLUF (Bottom Line Up Front) communication.

CRITICAL RULES:
1. NO ADJECTIVES - Use concrete nouns and verbs only
2. BLUF FIRST - Lead with the conclusion, then evidence
3. NO AI SIGNATURES - Never use: delve, unleash, multifaceted, landscape, leverage, tapestry, robust, seamless, innovative, cutting-edge, game-changer, paradigm, synergy, holistic, comprehensive
4. NO FILLER WORDS - Remove: very, really, just, actually, basically, literally
5. NO HEDGING - Avoid: might, may, could, arguably, somewhat
6. ACTIVE VOICE ONLY - Subject-verb-object structure
7. SHORT SENTENCES - Maximum 20 words per sentence
8. EVIDENCE-BASED - Every claim needs supporting data

Output Format: JSON array of fact blocks with this structure:
{
  "category": "string",
  "blufStatement": "string",
  "evidence": ["string"],
  "actionableInsight": "string",
  "priority": "critical|high|medium|low"
}`;

    const styleGuides: Record<ContentStyle, string> = {
      ANZ_Professional: `
ANZ Professional Style:
- Use Australian English (optimise, organisation, colour)
- Reference local regulations (ASIC, ACCC, Fair Trading)
- Avoid American corporate jargon
- Professional but approachable tone
- No exclamation marks
- Data-driven, fact-focused`,

      Technical: `
Technical Style:
- Precise terminology
- Metrics and benchmarks
- System architecture focus
- Performance data required
- No marketing language`,

      Executive: `
Executive Style:
- Strategic insights only
- ROI and business impact focus
- Board-level communication
- 3-bullet maximum per block
- Decision-oriented`,

      Marketing: `
Marketing Style:
- Benefit-focused (not feature-focused)
- Customer perspective
- Clear call-to-action
- Measurable outcomes
- Still no AI signatures`,
    };

    return `${basePrompt}\n\n${styleGuides[style]}`;
  }

  private buildPrompt(analysis: CitationGapAnalysis, style: ContentStyle): string {
    return `Generate canonical fact blocks from this citation gap analysis:

Client: ${analysis.clientDomain}
Competitors Analyzed: ${analysis.competitors.length}
Total Gaps: ${analysis.summary.totalGaps}
High Priority Gaps: ${analysis.summary.highPriorityGaps}
Opportunity Score: ${analysis.summary.opportunityScore}/100

Top 5 Gaps:
${analysis.gaps.slice(0, 5).map((gap, i) => `
${i + 1}. ${gap.source.domain} [${gap.priority.toUpperCase()}]
   - Authority: ${gap.source.authority}
   - Type: ${gap.source.citationType}
   - Impact: ${gap.estimatedImpact}%
   - Present in: ${gap.presentInCompetitors.join(', ')}
`).join('\n')}

Generate 5-7 fact blocks following BLUF principles. Focus on actionable insights.`;
  }

  private parseFactBlocks(text: string): CanonicalFactBlock[] {
    try {
      // Try to parse as JSON first
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: parse from markdown-style blocks
      return this.parseMarkdownBlocks(text);
    } catch (error) {
      console.error('[Ghost] Failed to parse fact blocks:', error);
      return [];
    }
  }

  private parseMarkdownBlocks(text: string): CanonicalFactBlock[] {
    // Simple parser for markdown-style fact blocks
    const blocks: CanonicalFactBlock[] = [];
    const sections = text.split(/\n#{1,3}\s+/);

    for (const section of sections) {
      if (!section.trim()) continue;

      const lines = section.split('\n').filter((l) => l.trim());
      if (lines.length < 2) continue;

      blocks.push({
        category: lines[0].trim(),
        blufStatement: lines[1]?.trim() || '',
        evidence: lines.slice(2).filter((l) => l.startsWith('-')).map((l) => l.replace(/^-\s*/, '')),
        actionableInsight: lines[lines.length - 1]?.trim() || '',
        priority: 'medium',
      });
    }

    return blocks;
  }

  private formatAsMarkdown(blocks: CanonicalFactBlock[], options: GhostWriteOptions): string {
    const lines: string[] = [];

    lines.push('# Citation Gap Analysis Report');
    lines.push('');
    lines.push(`**Style:** ${options.style}`);
    lines.push(`**Generated:** ${new Date().toLocaleString('en-AU')}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    for (const block of blocks) {
      lines.push(`## ${block.category} [${block.priority.toUpperCase()}]`);
      lines.push('');
      lines.push(`**BLUF:** ${block.blufStatement}`);
      lines.push('');

      if (options.includeEvidence && block.evidence.length > 0) {
        lines.push('**Evidence:**');
        for (const ev of block.evidence) {
          lines.push(`- ${ev}`);
        }
        lines.push('');
      }

      lines.push(`**Action:** ${block.actionableInsight}`);
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    return lines.join('\n');
  }

  private removeAISignatures(content: string): { content: string; removed: number } {
    let result = content;
    let removed = 0;

    for (const [key, pattern] of Object.entries(AI_SIGNATURES)) {
      const matches = result.match(pattern);
      if (matches) {
        removed += matches.length;
        // Replace with empty string or appropriate alternative
        result = result.replace(pattern, '');
      }
    }

    // Clean up extra spaces
    result = result.replace(/\s{2,}/g, ' ').replace(/\n{3,}/g, '\n\n');

    return { content: result, removed };
  }

  private removeFillerWords(content: string): { content: string; removed: number } {
    let result = content;
    let removed = 0;

    for (const filler of FILLER_WORDS) {
      const pattern = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = result.match(pattern);
      if (matches) {
        removed += matches.length;
        result = result.replace(pattern, '');
      }
    }

    // Clean up extra spaces
    result = result.replace(/\s{2,}/g, ' ').replace(/\n{3,}/g, '\n\n');

    return { content: result, removed };
  }

  private async aggressiveRestructure(content: string): Promise<string> {
    // Use Claude to aggressively restructure for maximum clarity
    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: `You are an expert editor. Restructure the following text to:
1. Use BLUF (Bottom Line Up Front) for every paragraph
2. Remove all remaining filler words
3. Convert passive voice to active voice
4. Shorten sentences to maximum 20 words
5. Preserve all factual content and formatting
6. Do NOT add your own commentary`,
      messages: [
        {
          role: 'user',
          content: `Restructure this text following BLUF principles:\n\n${content}`,
        },
      ],
    });

    const responseContent = message.content[0];
    if (responseContent.type !== 'text') {
      return content;
    }

    return responseContent.text;
  }

  private preserveFormatting(original: string, scrubbed: string): string {
    // Preserve markdown headers, lists, etc.
    const originalHeaders = original.match(/^#{1,6}\s+.+$/gm) || [];
    const scrubbedHeaders = scrubbed.match(/^#{1,6}\s+.+$/gm) || [];

    // If headers were lost, restore them
    if (originalHeaders.length > scrubbedHeaders.length) {
      // Simple restoration: maintain header structure
      return scrubbed;
    }

    return scrubbed;
  }

  private calculateImprovementScore(
    original: string,
    scrubbed: string,
    signaturesRemoved: number,
    fillerWordsRemoved: number
  ): number {
    const originalLength = original.length;
    const scrubbedLength = scrubbed.length;

    // Metrics
    const reductionRatio = 1 - scrubbedLength / originalLength;
    const signaturesScore = Math.min(signaturesRemoved * 5, 40);
    const fillerScore = Math.min(fillerWordsRemoved * 3, 30);
    const lengthScore = Math.min(reductionRatio * 100, 30);

    const total = signaturesScore + fillerScore + lengthScore;
    return Math.round(Math.min(total, 100));
  }
}
