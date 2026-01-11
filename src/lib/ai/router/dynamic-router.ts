import { readFileSync } from 'fs';
import { join } from 'path';

export type RouteIntent =
  | 'email_intelligence'
  | 'video_generation'
  | 'extended_thinking'
  | 'seo_analysis'
  | 'social_copy_generation';

export interface RouteConfig {
  primary: string;
  fallback?: string;
  cost_limit_per_request: number;
  timeout_ms: number;
  thinking_budget_tokens?: number;
}

interface RoutingConfigFile {
  routes: Record<string, RouteConfig>;
  metadata: {
    last_updated: string;
    version: string;
    description: string;
  };
}

// Load config from filesystem (can be swapped to Redis later for runtime updates)
let cachedConfig: Record<string, RouteConfig> | null = null;
let configLoadedAt = 0;
const CONFIG_TTL = 300000; // 5 minutes

function loadRoutingConfig(): Record<string, RouteConfig> {
  const now = Date.now();
  if (cachedConfig && now - configLoadedAt < CONFIG_TTL) {
    return cachedConfig;
  }

  try {
    const configPath = join(process.cwd(), 'config', 'model-routing.json');
    const configFile = readFileSync(configPath, 'utf-8');
    const parsed: RoutingConfigFile = JSON.parse(configFile);

    cachedConfig = parsed.routes;
    configLoadedAt = now;
    return cachedConfig;
  } catch (error) {
    console.error('Failed to load routing config:', error);
    // Return fallback config
    return {
      email_intelligence: {
        primary: 'anthropic:claude-sonnet-4-5-20250929',
        fallback: 'openrouter:anthropic/claude-sonnet',
        cost_limit_per_request: 0.05,
        timeout_ms: 60000
      },
      video_generation: {
        primary: 'google:veo-3',
        fallback: 'google:gemini-video-pro',
        cost_limit_per_request: 0.30,
        timeout_ms: 600000
      },
      extended_thinking: {
        primary: 'anthropic:claude-opus-4-5-20251101',
        thinking_budget_tokens: 10000,
        cost_limit_per_request: 0.50,
        timeout_ms: 180000
      },
      seo_analysis: {
        primary: 'google:gemini-3-pro',
        fallback: 'perplexity:sonar-pro',
        cost_limit_per_request: 0.02,
        timeout_ms: 30000
      },
      social_copy_generation: {
        primary: 'openrouter:meta-llama/llama-3.3-70b-instruct',
        fallback: 'anthropic:claude-haiku-4-5-20251001',
        cost_limit_per_request: 0.01,
        timeout_ms: 15000
      }
    };
  }
}

export async function routeIntent(intent: RouteIntent, payload: any) {
  const config = loadRoutingConfig();
  const route = config[intent];

  if (!route) {
    throw new Error(`No routing config for intent: ${intent}`);
  }

  try {
    return await executeWithModel(route.primary, payload, route);
  } catch (error) {
    if (route.fallback) {
      console.warn(`Primary model ${route.primary} failed for intent ${intent}, falling back to ${route.fallback}`);
      try {
        return await executeWithModel(route.fallback, payload, route);
      } catch (fallbackError) {
        console.error(`Fallback model ${route.fallback} also failed:`, fallbackError);
        throw fallbackError;
      }
    }
    throw error;
  }
}

async function executeWithModel(modelId: string, payload: any, route: RouteConfig) {
  const [provider, ...modelParts] = modelId.split(':');
  const model = modelParts.join(':'); // Handle model IDs with colons (e.g., llama-3.3-70b-instruct)

  // Route to existing clients
  switch (provider) {
    case 'anthropic':
      return await executeAnthropicModel(model, payload, route);
    case 'google':
      return await executeGeminiModel(model, payload, route);
    case 'openrouter':
      return await executeOpenRouterModel(model, payload, route);
    case 'perplexity':
      return await executePerplexityModel(model, payload, route);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Adapter functions (use existing clients)
async function executeAnthropicModel(model: string, payload: any, route: RouteConfig) {
  const { callAnthropicWithRetry } = await import('@/lib/anthropic/rate-limiter');

  return await callAnthropicWithRetry(async (anthropic) => {
    return await anthropic.messages.create({
      model,
      messages: payload.messages,
      max_tokens: payload.max_tokens || 4096,
      thinking: route.thinking_budget_tokens
        ? {
            type: 'enabled',
            budget_tokens: route.thinking_budget_tokens
          }
        : undefined
    });
  });
}

async function executeGeminiModel(model: string, payload: any, route: RouteConfig) {
  const { getGeminiClient } = await import('@/lib/google/gemini-client');
  const gemini = getGeminiClient();

  // Use existing Gemini client patterns
  return await gemini.generateContent({
    model,
    ...payload
  });
}

async function executeOpenRouterModel(model: string, payload: any, route: RouteConfig) {
  const { callOpenRouter } = await import('@/lib/openrouter');

  return await callOpenRouter({
    model,
    messages: payload.messages,
    max_tokens: payload.max_tokens || 4096
  });
}

async function executePerplexityModel(model: string, payload: any, route: RouteConfig) {
  // Use existing Perplexity integration
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: payload.messages
    })
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`);
  }

  return await response.json();
}
