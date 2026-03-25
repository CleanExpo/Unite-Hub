// src/lib/strategy/daily-analysis.ts
// Core AI analysis engine for the Strategy Intelligence Board.
// Runs 4 analytical lenses (gstack × SEO/GEO B.I.D.) per business and returns typed insight cards.

import type Anthropic from '@anthropic-ai/sdk'
import { getAIClient } from '@/lib/ai/client'
import { BUSINESSES } from '@/lib/businesses'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InsightType = 'seo-opportunity' | 'content-gap' | 'strategy' | 'technical' | 'quick-win'
export type InsightPriority = 'critical' | 'high' | 'medium' | 'low'

export interface DailyInsight {
  type: InsightType
  title: string
  body: string
  priority: InsightPriority
  metadata: {
    keywords?: string[]
    bidScore?: number        // B.I.D. viability 0–10
    effortEstimate?: string  // S / M / L / XL (gstack effort sizing)
    gstackLens: string       // which framework generated this card
  }
}

interface AnalysisInput {
  businessKey: string
  linearIssueCount?: number  // recent open issues — adds context
}

// ---------------------------------------------------------------------------
// Business info lookup
// ---------------------------------------------------------------------------

function getBusinessName(key: string): string {
  return BUSINESSES.find((b) => b.key === key)?.name ?? key
}

// ---------------------------------------------------------------------------
// System prompt — 4 analytical lenses
// ---------------------------------------------------------------------------

function buildSystemPrompt(businessName: string, issueCount: number): string {
  return `You are a senior strategy intelligence AI operating four analytical frameworks simultaneously for ${businessName}, an Australian SME.

## Framework 1 — gstack Office Hours Lens
Force the single highest-leverage question: "If you only had 30 minutes with the founder this week, what would you work on?" Identify the one area with the highest return on founder attention. Use Garry Tan's office-hours forcing function: what problem, if solved, would make everything else easier?

## Framework 2 — gstack CEO Review Lens
Scope-challenge every initiative: "Is this the right scope? Too small and we miss the wave; too big and we never ship." Identify strategic risks, competitive opportunities, and the one thing that could kill the business's momentum in the next 90 days.

## Framework 3 — SEO/GEO B.I.D. Lens (Australian market)
Apply the B.I.D. framework (Business value × Intent match × Demand volume) to identify:
- Keywords and content gaps where ${businessName} can rank in Google AND get cited by AI search engines (ChatGPT, Perplexity, Google AI Overviews)
- Opportunities for Brand Association Playbook entries
- Tool Pivot assets (calculators, quizzes, checklists) that own transactional intent
Always use Australian English, AUD pricing context, and Australian search intent.

## Framework 4 — gstack QA Health Lens
"Boil the lake" completeness audit: what is incomplete, broken, or below bar in the business's digital presence? Focus on things that silently drain conversions or credibility — slow page speed, missing schema, weak CTA, thin content, broken funnels.

## Current Context
- Business: ${businessName}
- Open Linear issues: ${issueCount} (indicates current workload and known problems)
- Date: ${new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}

## Output Requirements
Return a JSON array of 3–5 insight objects. Each must follow this exact schema:
{
  "type": "seo-opportunity" | "content-gap" | "strategy" | "technical" | "quick-win",
  "title": "Concise action-oriented title (max 80 chars)",
  "body": "Full markdown analysis — 150–400 words. Include specific action steps, expected outcome, and Australian market context where relevant.",
  "priority": "critical" | "high" | "medium" | "low",
  "metadata": {
    "keywords": ["keyword1", "keyword2"],   // include for SEO/GEO types
    "bidScore": 7.5,                         // 0–10, include for SEO types
    "effortEstimate": "M",                   // S/M/L/XL for all types
    "gstackLens": "office-hours"             // which framework: office-hours | ceo-review | seo-geo | qa-health
  }
}

Return ONLY the JSON array. No preamble, no markdown fences, no explanation.`
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function runDailyAnalysis({ businessKey, linearIssueCount = 0 }: AnalysisInput): Promise<DailyInsight[]> {
  const businessName = getBusinessName(businessKey)
  const ai = getAIClient()

  const systemPrompt = buildSystemPrompt(businessName, linearIssueCount)

  const userMessage = `Generate today's strategy intelligence report for ${businessName}.
Apply all four analytical lenses and return 3–5 high-value insight cards that Phill (founder) can action this week.
Focus on specific, concrete recommendations — not generic advice.`

  const response = await ai.beta.messages.create({
    model: 'claude-opus-4-5-20250514',
    max_tokens: 16000,
    thinking: {
      type: 'enabled',
      budget_tokens: 8000,
    },
    betas: ['interleaved-thinking-2025-05-14'],
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  }) as Anthropic.Message

  // Extract text content (thinking blocks are separate and not included in text blocks)
  const textContent = (response.content as Anthropic.ContentBlock[])
    .filter((block) => block.type === 'text')
    .map((block) => (block as Anthropic.TextBlock).text)
    .join('')

  // Parse JSON — Opus with extended thinking reliably returns clean JSON
  let insights: DailyInsight[]
  try {
    insights = JSON.parse(textContent.trim()) as DailyInsight[]
  } catch {
    // Fallback: extract JSON array if wrapped in any surrounding text
    const match = textContent.match(/\[[\s\S]*\]/)
    if (!match) {
      throw new Error(`[Strategy Analysis] Failed to parse response for ${businessKey}: ${textContent.slice(0, 200)}`)
    }
    insights = JSON.parse(match[0]) as DailyInsight[]
  }

  // Validate each insight has required fields
  return insights.filter((ins) =>
    ins.type && ins.title && ins.body && ins.priority && ins.metadata?.gstackLens
  )
}
