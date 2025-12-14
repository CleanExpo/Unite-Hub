/**
 * AI Search Algorithm Monitor Agent
 * Week 3 - Autonomous Intelligence System
 *
 * Detects changes in Google AI Overview, Bing Copilot, and Perplexity algorithms
 * Automatically triggers client strategy updates when significant changes detected
 *
 * Runs via Vercel cron job every 6 hours
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import { getAnthropicClient } from '@/lib/anthropic/client';
import Anthropic from '@anthropic-ai/sdk';

export interface AlgorithmChange {
  source: 'google_ai_overview' | 'bing_copilot' | 'perplexity_citations';
  changeType: string;
  description: string;
  affectedIndustries: string[];
  affectedKeywords: string[];
  confidenceScore: number;
  evidence: {
    testQueries: string[];
    serpSnapshots: Record<string, any>;
    detectionMethod: string;
  };
  recommendedActions: {
    actionType: string;
    priority: 'high' | 'medium' | 'low';
    affectedVerticals: string[];
  }[];
}

/**
 * Main monitoring function - detects algorithm changes via Perplexity + Extended Thinking
 */
export async function monitorAISearchChanges(): Promise<AlgorithmChange[]> {
  console.log('🔍 Starting AI Search algorithm monitoring...');

  const detectedChanges: AlgorithmChange[] = [];

  try {
    // Step 1: Research current AI Search trends via Perplexity
    const trends = await analyzeAISearchTrends();
    console.log(`📊 Analyzed trends across ${trends.length} detection points`);

    // Step 2: Use Extended Thinking to analyze for algorithm shifts
    const analysis = await performExtendedThinkingAnalysis(trends);
    console.log(`🧠 Extended thinking completed - found ${analysis.changes.length} potential changes`);

    // Step 3: Filter high-confidence changes
    const confirmedChanges = analysis.changes.filter(
      (change) => change.confidenceScore >= 0.7
    );
    console.log(
      `✅ Confirmed ${confirmedChanges.length} high-confidence algorithm changes`
    );

    // Step 4: Store changes in database
    for (const change of confirmedChanges) {
      const stored = await storeAlgorithmChange(change);
      if (stored) {
        detectedChanges.push(change);
        console.log(`📝 Stored change: ${change.description}`);
      }
    }

    // Step 5: Trigger client strategy updates for each change
    for (const change of detectedChanges) {
      await triggerClientUpdates(change);
    }

    console.log(
      `✨ AI Search monitoring complete. Detected ${detectedChanges.length} changes.`
    );
    return detectedChanges;
  } catch (error) {
    console.error('❌ Error during AI Search monitoring:', error);
    throw error;
  }
}

/**
 * Analyze current AI Search trends via Perplexity API
 */
async function analyzeAISearchTrends(): Promise<any[]> {
  const testCategories = [
    { category: 'restoration', query: 'water damage restoration near me' },
    { category: 'plumbing', query: 'emergency plumber services' },
    { category: 'hvac', query: 'air conditioning repair' },
    { category: 'landscaping', query: 'landscape design services' },
    { category: 'cleaning', query: 'professional house cleaning' },
  ];

  const trends = [];

  for (const { category, query } of testCategories) {
    try {
      // Call Perplexity for research
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'user',
              content: `Analyze the current ranking factors and citations for: "${query}".

What sources are Google AI Overviews citing? What's the snippet structure?
Are there new ranking signals (freshness, entity prominence, local pack)?
List changes from 30 days ago if you know the history.`,
            },
          ],
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        console.warn(`Perplexity API error for ${category}: ${response.statusText}`);
        continue;
      }

      const data = (await response.json()) as any;
      const analysisText = data.choices?.[0]?.message?.content || '';

      trends.push({
        category,
        query,
        analysis: analysisText,
        timestamp: new Date().toISOString(),
      });

      console.log(`✓ Analyzed ${category}: "${query}"`);
    } catch (error) {
      console.warn(`Error analyzing ${category}:`, error);
    }
  }

  return trends;
}

/**
 * Use Claude Opus Extended Thinking to analyze trends for algorithm changes
 */
async function performExtendedThinkingAnalysis(trends: any[]): Promise<{
  changes: AlgorithmChange[];
  reasoning: string;
}> {
  const anthropic = getAnthropicClient();

  const response = await callAnthropicWithRetry(async () => {
    return await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 16000,
      thinking: {
        type: 'enabled',
        budget_tokens: 10000,
      },
      messages: [
        {
          role: 'user',
          content: `Analyze these AI Search trends and detect algorithm changes:

${JSON.stringify(trends, null, 2)}

For each potential change, determine:
1. Change type (ranking_factor, citation_format, snippet_structure, answer_preference, source_prioritization, freshness_signal, entity_prominence)
2. Affected industries/keywords
3. Confidence score (0-1)
4. Evidence from the trends
5. Recommended actions for content creators

Return JSON with structure:
{
  "changes": [
    {
      "source": "google_ai_overview",
      "changeType": "...",
      "description": "...",
      "affectedIndustries": [...],
      "affectedKeywords": [...],
      "confidenceScore": 0.85,
      "evidence": { "testQueries": [...], "serpSnapshots": {...}, "detectionMethod": "..." },
      "recommendedActions": [
        {"actionType": "...", "priority": "high", "affectedVerticals": [...]}
      ]
    }
  ]
}`,
        },
      ],
    });
  });

  // Extract JSON from response
  let analysisText = '';
  for (const block of response.data.content) {
    if (block.type === 'text') {
      analysisText += block.text;
    }
  }

  // Parse JSON
  const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn('No JSON found in extended thinking response');
    return { changes: [], reasoning: analysisText };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      changes: parsed.changes || [],
      reasoning: analysisText,
    };
  } catch (error) {
    console.warn('Failed to parse extended thinking JSON:', error);
    return { changes: [], reasoning: analysisText };
  }
}

/**
 * Store detected algorithm change in database
 */
async function storeAlgorithmChange(change: AlgorithmChange): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('ai_search_algorithm_changes')
      .insert({
        source: change.source,
        change_type: change.changeType,
        description: change.description,
        affected_industries: change.affectedIndustries,
        affected_keywords: change.affectedKeywords,
        confidence_score: change.confidenceScore,
        evidence: change.evidence,
        recommended_actions: change.recommendedActions,
        status: 'detected',
      });

    if (error) {
      console.error('Failed to store algorithm change:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error storing algorithm change:', error);
    return false;
  }
}

/**
 * Trigger automated strategy updates for affected clients
 */
async function triggerClientUpdates(change: AlgorithmChange): Promise<void> {
  try {
    // Find workspaces in affected industries
    const { data: workspaces, error } = await supabaseAdmin
      .from('workspaces')
      .select('id, industry')
      .in('industry', change.affectedIndustries);

    if (error) {
      console.warn('Error fetching affected workspaces:', error);
      return;
    }

    if (!workspaces || workspaces.length === 0) {
      console.log('No workspaces in affected industries');
      return;
    }

    console.log(
      `📤 Triggering updates for ${workspaces.length} workspaces in affected industries`
    );

    // Create triggered update records
    for (const workspace of workspaces) {
      // Determine update type based on change
      const updateType = determineUpdateType(change.changeType);

      const { error: insertError } = await supabaseAdmin
        .from('ai_search_triggered_updates')
        .insert({
          algorithm_change_id: undefined, // Will be set by trigger
          workspace_id: workspace.id,
          update_type: updateType,
          status: 'pending',
          affected_content_count: 0,
          triggered_at: new Date().toISOString(),
        });

      if (insertError) {
        console.warn(
          `Failed to trigger update for workspace ${workspace.id}:`,
          insertError
        );
      } else {
        console.log(`✓ Queued ${updateType} update for workspace ${workspace.id}`);
      }
    }
  } catch (error) {
    console.error('Error triggering client updates:', error);
  }
}

/**
 * Map algorithm change type to client update action
 */
function determineUpdateType(
  changeType: string
): 'content_regeneration' | 'video_generation' | 'citation_optimization' | 'snippet_refresh' | 'freshness_boost' {
  const typeMap: Record<string, any> = {
    ranking_factor: 'content_regeneration',
    citation_format: 'citation_optimization',
    snippet_structure: 'snippet_refresh',
    answer_preference: 'content_regeneration',
    source_prioritization: 'citation_optimization',
    freshness_signal: 'freshness_boost',
    entity_prominence: 'video_generation', // Visual content emphasizes entities
  };

  return typeMap[changeType] || 'content_regeneration';
}

/**
 * Get recent algorithm changes for a workspace
 */
export async function getRecentAlgorithmChanges(
  workspaceId: string,
  days: number = 7
): Promise<AlgorithmChange[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabaseAdmin
    .from('ai_search_algorithm_changes')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('detected_at', since.toISOString())
    .order('detected_at', { ascending: false });

  if (error) {
    console.error('Error fetching algorithm changes:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    source: row.source,
    changeType: row.change_type,
    description: row.description,
    affectedIndustries: row.affected_industries,
    affectedKeywords: row.affected_keywords,
    confidenceScore: row.confidence_score,
    evidence: row.evidence,
    recommendedActions: row.recommended_actions,
  }));
}

/**
 * Get triggered updates for a workspace
 */
export async function getTriggeredUpdates(
  workspaceId: string,
  status?: string
): Promise<any[]> {
  let query = supabaseAdmin
    .from('ai_search_triggered_updates')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('triggered_at', { ascending: false });

  if (error) {
    console.error('Error fetching triggered updates:', error);
    return [];
  }

  return data || [];
}
