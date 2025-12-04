/**
 * Model Scout Agent
 *
 * Continuously discovers new models, price changes, and capability updates
 * Integrates with OpenRouter, HuggingFace, and GitHub releases
 */

import type { DiscoveredModel, DiscoveryReport, ModelPricing } from '../types';
import { MODEL_REGISTRY, getOpenRouterClient } from '../orchestrator';

// ============================================================================
// OpenRouter Discovery
// ============================================================================

async function scanOpenRouter(): Promise<DiscoveredModel[]> {
  const client = getOpenRouterClient();
  const discovered: DiscoveredModel[] = [];

  try {
    const models = await client.listModels();
    const knownSlugs = new Set(Object.values(MODEL_REGISTRY).map((m) => m.openrouter_slug));

    for (const model of models) {
      if (!knownSlugs.has(model.id)) {
        // Parse pricing from string format (e.g., "0.0000015" per token)
        const promptPrice = parseFloat(model.pricing?.prompt || '0');
        const completionPrice = parseFloat(model.pricing?.completion || '0');

        discovered.push({
          id: model.id.replace(/\//g, '_').replace(/-/g, '_'),
          name: model.name || model.id,
          provider: model.id.split('/')[0] || 'unknown',
          openrouter_slug: model.id,
          source: 'openrouter',
          discovered_at: new Date().toISOString(),
          pricing: {
            input_per_million: promptPrice * 1_000_000,
            output_per_million: completionPrice * 1_000_000,
            currency: 'USD',
          },
          recommendation: evaluateModel({
            input_per_million: promptPrice * 1_000_000,
            output_per_million: completionPrice * 1_000_000,
            currency: 'USD',
          }),
        });
      }
    }
  } catch (error) {
    console.error('OpenRouter scan failed:', error);
  }

  return discovered;
}

// ============================================================================
// GitHub Releases Discovery
// ============================================================================

interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
}

const WATCHED_REPOS = [
  'deepseek-ai/DeepSeek-V3',
  'Qwen/Qwen2.5',
  'mistralai/mistral-inference',
  'meta-llama/llama-models',
  '01-ai/Yi',
];

async function scanGitHubReleases(): Promise<DiscoveredModel[]> {
  const discovered: DiscoveredModel[] = [];
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    console.warn('GITHUB_TOKEN not set, skipping GitHub release scan');
    return discovered;
  }

  for (const repo of WATCHED_REPOS) {
    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=5`, {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        continue;
      }

      const releases: GitHubRelease[] = await response.json();
      const recentReleases = releases.filter((r) => {
        const releaseDate = new Date(r.published_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return releaseDate > weekAgo;
      });

      for (const release of recentReleases) {
        discovered.push({
          id: `${repo.replace('/', '_')}_${release.tag_name}`,
          name: release.name || release.tag_name,
          provider: repo.split('/')[0],
          source: 'github',
          discovered_at: new Date().toISOString(),
          recommendation: 'notify_admin',
        });
      }
    } catch (error) {
      console.error(`GitHub scan failed for ${repo}:`, error);
    }
  }

  return discovered;
}

// ============================================================================
// HuggingFace Discovery
// ============================================================================

interface HuggingFaceModel {
  id: string;
  modelId: string;
  likes: number;
  downloads: number;
  tags: string[];
}

async function scanHuggingFace(): Promise<DiscoveredModel[]> {
  const discovered: DiscoveredModel[] = [];

  try {
    // Scan trending text generation models
    const response = await fetch(
      'https://huggingface.co/api/models?sort=trending&limit=20&filter=text-generation'
    );

    if (!response.ok) {
      return discovered;
    }

    const models: HuggingFaceModel[] = await response.json();

    for (const model of models) {
      // Only consider models with significant traction
      if (model.downloads > 10000 && model.likes > 100) {
        const isLLM = model.tags?.some((tag) =>
          ['text-generation', 'llm', 'transformers', 'causal-lm'].includes(tag.toLowerCase())
        );

        if (isLLM) {
          discovered.push({
            id: model.id.replace(/\//g, '_').replace(/-/g, '_'),
            name: model.modelId,
            provider: model.id.split('/')[0],
            source: 'huggingface',
            discovered_at: new Date().toISOString(),
            benchmark_scores: {
              likes: model.likes,
              downloads: model.downloads,
            },
            recommendation: 'notify_admin',
          });
        }
      }
    }
  } catch (error) {
    console.error('HuggingFace scan failed:', error);
  }

  return discovered;
}

// ============================================================================
// Model Evaluation
// ============================================================================

/**
 * Evaluate if a model should be auto-added or just flagged
 */
function evaluateModel(pricing?: ModelPricing): 'auto_add' | 'notify_admin' | 'ignore' {
  if (!pricing) {
    return 'notify_admin';
  }

  // Auto-add if very cost-effective
  const avgCost = (pricing.input_per_million + pricing.output_per_million) / 2;
  if (avgCost < 2.0) {
    return 'auto_add';
  }

  // Notify for mid-range models
  if (avgCost < 10.0) {
    return 'notify_admin';
  }

  // Ignore expensive models unless they have exceptional capabilities
  return 'ignore';
}

// ============================================================================
// Price Change Detection
// ============================================================================

interface PriceCache {
  [modelSlug: string]: ModelPricing;
}

const priceCache: PriceCache = {};

async function detectPriceChanges(): Promise<
  Array<{ model_id: string; old_pricing: ModelPricing; new_pricing: ModelPricing; change_percent: number }>
> {
  const changes: Array<{
    model_id: string;
    old_pricing: ModelPricing;
    new_pricing: ModelPricing;
    change_percent: number;
  }> = [];

  const client = getOpenRouterClient();

  try {
    const models = await client.listModels();

    for (const model of models) {
      const promptPrice = parseFloat(model.pricing?.prompt || '0') * 1_000_000;
      const completionPrice = parseFloat(model.pricing?.completion || '0') * 1_000_000;

      const newPricing: ModelPricing = {
        input_per_million: promptPrice,
        output_per_million: completionPrice,
        currency: 'USD',
      };

      const oldPricing = priceCache[model.id];
      if (oldPricing) {
        const oldAvg = (oldPricing.input_per_million + oldPricing.output_per_million) / 2;
        const newAvg = (newPricing.input_per_million + newPricing.output_per_million) / 2;
        const changePercent = ((newAvg - oldAvg) / oldAvg) * 100;

        // Report if price changed by more than 5%
        if (Math.abs(changePercent) > 5) {
          changes.push({
            model_id: model.id,
            old_pricing: oldPricing,
            new_pricing: newPricing,
            change_percent: changePercent,
          });
        }
      }

      // Update cache
      priceCache[model.id] = newPricing;
    }
  } catch (error) {
    console.error('Price change detection failed:', error);
  }

  return changes;
}

// ============================================================================
// Main Discovery Function
// ============================================================================

/**
 * Run full model discovery scan
 */
export async function runModelDiscovery(): Promise<DiscoveryReport> {
  const scanTimestamp = new Date().toISOString();
  const allDiscovered: DiscoveredModel[] = [];

  // Run all scans in parallel
  const [openRouterModels, githubModels, huggingFaceModels, priceChanges] = await Promise.all([
    scanOpenRouter(),
    scanGitHubReleases(),
    scanHuggingFace(),
    detectPriceChanges(),
  ]);

  allDiscovered.push(...openRouterModels, ...githubModels, ...huggingFaceModels);

  // Generate recommendations
  const recommendations: string[] = [];

  const autoAddModels = allDiscovered.filter((m) => m.recommendation === 'auto_add');
  if (autoAddModels.length > 0) {
    recommendations.push(
      `${autoAddModels.length} new cost-effective model(s) ready for auto-addition: ${autoAddModels.map((m) => m.name).join(', ')}`
    );
  }

  const priceDecreases = priceChanges.filter((p) => p.change_percent < -5);
  if (priceDecreases.length > 0) {
    recommendations.push(
      `${priceDecreases.length} model(s) have decreased in price - consider updating routing priorities`
    );
  }

  return {
    scan_timestamp: scanTimestamp,
    new_models: allDiscovered,
    price_changes: priceChanges,
    capability_updates: [], // Would require more sophisticated tracking
    recommendations,
  };
}

/**
 * Scheduled model scout - call every 6 hours
 */
export async function scheduledModelScout(): Promise<void> {
  console.log('[Model Scout] Starting scheduled scan...');
  const report = await runModelDiscovery();

  console.log(`[Model Scout] Scan complete:`);
  console.log(`  - New models discovered: ${report.new_models.length}`);
  console.log(`  - Price changes detected: ${report.price_changes.length}`);
  console.log(`  - Recommendations: ${report.recommendations.length}`);

  // In production, this would:
  // 1. Save to database
  // 2. Send notifications for important discoveries
  // 3. Trigger routing recalculation if prices changed significantly

  if (report.recommendations.length > 0) {
    console.log('[Model Scout] Recommendations:');
    report.recommendations.forEach((r) => console.log(`  - ${r}`));
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get current model count by source
 */
export function getModelStats(): { total: number; byProvider: Record<string, number> } {
  const models = Object.values(MODEL_REGISTRY);
  const byProvider: Record<string, number> = {};

  for (const model of models) {
    byProvider[model.provider] = (byProvider[model.provider] || 0) + 1;
  }

  return {
    total: models.length,
    byProvider,
  };
}

/**
 * Compare two models by value score
 */
export function compareModelValue(
  modelA: string,
  modelB: string
): { winner: string; reason: string; savings_percent: number } {
  const a = MODEL_REGISTRY[modelA as keyof typeof MODEL_REGISTRY];
  const b = MODEL_REGISTRY[modelB as keyof typeof MODEL_REGISTRY];

  if (!a || !b) {
    return { winner: 'unknown', reason: 'One or both models not found', savings_percent: 0 };
  }

  const costA = (a.pricing.input_per_million + a.pricing.output_per_million) / 2;
  const costB = (b.pricing.input_per_million + b.pricing.output_per_million) / 2;

  // Value = quality / cost
  const valueA = a.quality_score / costA;
  const valueB = b.quality_score / costB;

  if (valueA > valueB) {
    const savings = ((costB - costA) / costB) * 100;
    return {
      winner: modelA,
      reason: `${a.label} offers ${savings.toFixed(0)}% cost savings with ${a.quality_score - b.quality_score} point quality difference`,
      savings_percent: savings,
    };
  } else {
    const savings = ((costA - costB) / costA) * 100;
    return {
      winner: modelB,
      reason: `${b.label} offers ${savings.toFixed(0)}% cost savings with ${b.quality_score - a.quality_score} point quality difference`,
      savings_percent: savings,
    };
  }
}
