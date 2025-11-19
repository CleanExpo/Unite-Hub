/**
 * OpenRouter Model Configuration for Unite-Hub
 *
 * Comprehensive model definitions with use cases, pricing, and capabilities.
 * Updated: 2025-11-18
 */

export type ModelCategory = 'reasoning' | 'coding' | 'embedding' | 'search' | 'general' | 'vision';

export interface OpenRouterModel {
  id: string;
  name: string;
  provider: string;
  category: ModelCategory;
  contextWindow: number;
  maxOutput: number;
  pricing: {
    prompt: number;  // USD per 1M tokens
    completion: number;  // USD per 1M tokens
  };
  capabilities: {
    thinking?: boolean;
    streaming?: boolean;
    functionCalling?: boolean;
    vision?: boolean;
    embedding?: boolean;
    search?: boolean;
  };
  useCases: string[];
  tier: 'free' | 'standard' | 'premium';
  description: string;
}

/**
 * OpenRouter Model Catalog
 * All models available for Unite-Hub with detailed specifications
 */
export const OPENROUTER_MODELS: Record<string, OpenRouterModel> = {
  // ============================================================================
  // REASONING MODELS - For complex analysis and strategic thinking
  // ============================================================================

  'openrouter/sherlock-dash-alpha': {
    id: 'openrouter/sherlock-dash-alpha',
    name: 'Sherlock Dash Alpha',
    provider: 'OpenRouter',
    category: 'reasoning',
    contextWindow: 128000,
    maxOutput: 8192,
    pricing: {
      prompt: 2.0,
      completion: 8.0,
    },
    capabilities: {
      thinking: true,
      streaming: true,
      functionCalling: true,
    },
    useCases: [
      'Complex problem solving',
      'Strategic planning',
      'Multi-step reasoning',
      'Contact intelligence analysis',
      'Campaign optimization',
    ],
    tier: 'premium',
    description: 'Advanced reasoning model optimized for complex analytical tasks and strategic decision-making',
  },

  'openrouter/sherlock-think-alpha': {
    id: 'openrouter/sherlock-think-alpha',
    name: 'Sherlock Think Alpha',
    provider: 'OpenRouter',
    category: 'reasoning',
    contextWindow: 128000,
    maxOutput: 16384,
    pricing: {
      prompt: 3.0,
      completion: 12.0,
    },
    capabilities: {
      thinking: true,
      streaming: true,
      functionCalling: true,
    },
    useCases: [
      'Deep analysis requiring extended thinking',
      'Complex CRM strategy development',
      'Advanced content personalization',
      'Multi-criteria decision making',
      'Comprehensive contact scoring',
    ],
    tier: 'premium',
    description: 'Premium reasoning model with extended thinking capabilities for the most complex analytical tasks',
  },

  'moonshotai/kimi-k2-thinking': {
    id: 'moonshotai/kimi-k2-thinking',
    name: 'Kimi K2 Thinking',
    provider: 'Moonshot AI',
    category: 'reasoning',
    contextWindow: 200000,
    maxOutput: 8192,
    pricing: {
      prompt: 1.5,
      completion: 6.0,
    },
    capabilities: {
      thinking: true,
      streaming: true,
      functionCalling: false,
    },
    useCases: [
      'Long-context analysis',
      'Document comprehension',
      'Multi-document synthesis',
      'Email thread analysis',
      'Campaign performance analysis',
    ],
    tier: 'standard',
    description: 'Long-context reasoning model with 200K context window for comprehensive document analysis',
  },

  // ============================================================================
  // CODING MODELS - For code generation and technical tasks
  // ============================================================================

  'kwaipilot/kat-coder-pro:free': {
    id: 'kwaipilot/kat-coder-pro:free',
    name: 'KAT Coder Pro (Free)',
    provider: 'KwaiPilot',
    category: 'coding',
    contextWindow: 32000,
    maxOutput: 4096,
    pricing: {
      prompt: 0,
      completion: 0,
    },
    capabilities: {
      streaming: true,
      functionCalling: true,
    },
    useCases: [
      'API endpoint generation',
      'Database query creation',
      'TypeScript type definitions',
      'React component generation',
      'Automation script creation',
    ],
    tier: 'free',
    description: 'Free coding model optimized for software development and technical documentation',
  },

  // ============================================================================
  // EMBEDDING MODELS - For semantic search and similarity
  // ============================================================================

  'google/gemini-embedding-001': {
    id: 'google/gemini-embedding-001',
    name: 'Gemini Embedding 001',
    provider: 'Google',
    category: 'embedding',
    contextWindow: 8192,
    maxOutput: 768,
    pricing: {
      prompt: 0.01,
      completion: 0,
    },
    capabilities: {
      embedding: true,
    },
    useCases: [
      'Contact similarity matching',
      'Email semantic search',
      'Content recommendation',
      'Duplicate detection',
      'Tag clustering',
    ],
    tier: 'standard',
    description: 'Google\'s embedding model for semantic understanding and similarity matching',
  },

  'openai/text-embedding-ada-002': {
    id: 'openai/text-embedding-ada-002',
    name: 'Text Embedding Ada 002',
    provider: 'OpenAI',
    category: 'embedding',
    contextWindow: 8191,
    maxOutput: 1536,
    pricing: {
      prompt: 0.1,
      completion: 0,
    },
    capabilities: {
      embedding: true,
    },
    useCases: [
      'Legacy embedding compatibility',
      'RAG (Retrieval Augmented Generation)',
      'Semantic search',
      'Knowledge base indexing',
    ],
    tier: 'standard',
    description: 'OpenAI\'s widely-used embedding model for semantic search and retrieval',
  },

  'openai/text-embedding-3-large': {
    id: 'openai/text-embedding-3-large',
    name: 'Text Embedding 3 Large',
    provider: 'OpenAI',
    category: 'embedding',
    contextWindow: 8191,
    maxOutput: 3072,
    pricing: {
      prompt: 0.13,
      completion: 0,
    },
    capabilities: {
      embedding: true,
    },
    useCases: [
      'High-precision semantic search',
      'Advanced similarity matching',
      'Multi-language embedding',
      'Complex document retrieval',
    ],
    tier: 'premium',
    description: 'OpenAI\'s highest quality embedding model with 3072 dimensions for maximum precision',
  },

  'openai/text-embedding-3-small': {
    id: 'openai/text-embedding-3-small',
    name: 'Text Embedding 3 Small',
    provider: 'OpenAI',
    category: 'embedding',
    contextWindow: 8191,
    maxOutput: 1536,
    pricing: {
      prompt: 0.02,
      completion: 0,
    },
    capabilities: {
      embedding: true,
    },
    useCases: [
      'Cost-effective semantic search',
      'Quick similarity matching',
      'Tag recommendations',
      'Content categorization',
    ],
    tier: 'standard',
    description: 'Cost-effective embedding model balancing quality and efficiency',
  },

  'qwen/qwen3-embedding-8b': {
    id: 'qwen/qwen3-embedding-8b',
    name: 'Qwen3 Embedding 8B',
    provider: 'Qwen',
    category: 'embedding',
    contextWindow: 32768,
    maxOutput: 2048,
    pricing: {
      prompt: 0.05,
      completion: 0,
    },
    capabilities: {
      embedding: true,
    },
    useCases: [
      'Multi-language embedding',
      'Long-context embedding',
      'Cross-lingual search',
      'International contact matching',
    ],
    tier: 'standard',
    description: 'Multi-language embedding model with extended context window',
  },

  'qwen/qwen3-embedding-4b': {
    id: 'qwen/qwen3-embedding-4b',
    name: 'Qwen3 Embedding 4B',
    provider: 'Qwen',
    category: 'embedding',
    contextWindow: 16384,
    maxOutput: 1024,
    pricing: {
      prompt: 0.03,
      completion: 0,
    },
    capabilities: {
      embedding: true,
    },
    useCases: [
      'Efficient embedding generation',
      'Quick semantic matching',
      'Tag clustering',
      'Content similarity',
    ],
    tier: 'standard',
    description: 'Efficient embedding model for cost-effective semantic operations',
  },

  // ============================================================================
  // SEARCH MODELS - For web search and information retrieval
  // ============================================================================

  'perplexity/sonar-pro-search': {
    id: 'perplexity/sonar-pro-search',
    name: 'Sonar Pro Search',
    provider: 'Perplexity',
    category: 'search',
    contextWindow: 32000,
    maxOutput: 4096,
    pricing: {
      prompt: 3.0,
      completion: 15.0,
    },
    capabilities: {
      search: true,
      streaming: true,
    },
    useCases: [
      'Real-time market research',
      'Competitor analysis',
      'Industry trend analysis',
      'Contact company research',
      'Up-to-date information retrieval',
    ],
    tier: 'premium',
    description: 'Advanced search model with real-time web access for current information',
  },

  // ============================================================================
  // GENERAL PURPOSE MODELS
  // ============================================================================

  'mistralai/voxtral-small-24b-2507': {
    id: 'mistralai/voxtral-small-24b-2507',
    name: 'Voxtral Small 24B',
    provider: 'Mistral AI',
    category: 'general',
    contextWindow: 32000,
    maxOutput: 8192,
    pricing: {
      prompt: 0.5,
      completion: 1.5,
    },
    capabilities: {
      streaming: true,
      functionCalling: true,
    },
    useCases: [
      'General content generation',
      'Email drafting',
      'Summary generation',
      'Standard chat responses',
      'Quick analysis tasks',
    ],
    tier: 'standard',
    description: 'Efficient general-purpose model for everyday AI tasks',
  },

  'minimax/minimax-m2': {
    id: 'minimax/minimax-m2',
    name: 'MiniMax M2',
    provider: 'MiniMax',
    category: 'general',
    contextWindow: 16000,
    maxOutput: 4096,
    pricing: {
      prompt: 0.3,
      completion: 0.9,
    },
    capabilities: {
      streaming: true,
    },
    useCases: [
      'Cost-effective content generation',
      'Simple email responses',
      'Basic summarization',
      'Tag generation',
    ],
    tier: 'standard',
    description: 'Cost-effective model for routine content generation tasks',
  },

  'liquid/lfm2-8b-a1b': {
    id: 'liquid/lfm2-8b-a1b',
    name: 'LFM2 8B A1B',
    provider: 'Liquid AI',
    category: 'general',
    contextWindow: 8192,
    maxOutput: 2048,
    pricing: {
      prompt: 0.2,
      completion: 0.6,
    },
    capabilities: {
      streaming: true,
    },
    useCases: [
      'Quick responses',
      'Simple content generation',
      'Tag suggestions',
      'Basic formatting',
    ],
    tier: 'standard',
    description: 'Lightweight model for quick, simple AI tasks',
  },

  'liquid/lfm-2.2-6b': {
    id: 'liquid/lfm-2.2-6b',
    name: 'LFM 2.2 6B',
    provider: 'Liquid AI',
    category: 'general',
    contextWindow: 8192,
    maxOutput: 2048,
    pricing: {
      prompt: 0.15,
      completion: 0.45,
    },
    capabilities: {
      streaming: true,
    },
    useCases: [
      'Ultra-fast responses',
      'Simple text generation',
      'Basic transformations',
      'Quick suggestions',
    ],
    tier: 'standard',
    description: 'Ultra-fast model for simple, high-volume tasks',
  },

  // ============================================================================
  // VISION MODELS - For image understanding and analysis
  // ============================================================================

  'nvidia/nemotron-nano-12b-v2-vl:free': {
    id: 'nvidia/nemotron-nano-12b-v2-vl:free',
    name: 'Nemotron Nano 12B V2 VL (Free)',
    provider: 'NVIDIA',
    category: 'vision',
    contextWindow: 8192,
    maxOutput: 2048,
    pricing: {
      prompt: 0,
      completion: 0,
    },
    capabilities: {
      vision: true,
      streaming: true,
    },
    useCases: [
      'Screenshot analysis',
      'Document OCR',
      'Image content understanding',
      'Visual asset processing',
      'Logo/brand detection',
    ],
    tier: 'free',
    description: 'Free vision-language model for image understanding and analysis',
  },

  'nvidia/nemotron-nano-12b-v2-vl': {
    id: 'nvidia/nemotron-nano-12b-v2-vl',
    name: 'Nemotron Nano 12B V2 VL',
    provider: 'NVIDIA',
    category: 'vision',
    contextWindow: 8192,
    maxOutput: 2048,
    pricing: {
      prompt: 0.1,
      completion: 0.3,
    },
    capabilities: {
      vision: true,
      streaming: true,
    },
    useCases: [
      'High-quality image analysis',
      'Document processing',
      'Visual content extraction',
      'Multi-modal understanding',
    ],
    tier: 'standard',
    description: 'Premium vision-language model for advanced image understanding',
  },
};

/**
 * Get models by category
 */
export function getModelsByCategory(category: ModelCategory): OpenRouterModel[] {
  return Object.values(OPENROUTER_MODELS).filter(model => model.category === category);
}

/**
 * Get models by tier
 */
export function getModelsByTier(tier: 'free' | 'standard' | 'premium'): OpenRouterModel[] {
  return Object.values(OPENROUTER_MODELS).filter(model => model.tier === tier);
}

/**
 * Get recommended model for a specific use case
 */
export function getRecommendedModel(useCase: string, tier?: 'free' | 'standard' | 'premium'): OpenRouterModel | null {
  const models = Object.values(OPENROUTER_MODELS).filter(model => {
    const matchesUseCase = model.useCases.some(uc =>
      uc.toLowerCase().includes(useCase.toLowerCase())
    );
    const matchesTier = tier ? model.tier === tier : true;
    return matchesUseCase && matchesTier;
  });

  // Return the first matching model, or null if none found
  return models.length > 0 ? models[0] : null;
}

/**
 * Calculate estimated cost for a request
 */
export function calculateCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number
): number {
  const model = OPENROUTER_MODELS[modelId];
  if (!model) return 0;

  const promptCost = (promptTokens / 1_000_000) * model.pricing.prompt;
  const completionCost = (completionTokens / 1_000_000) * model.pricing.completion;

  return promptCost + completionCost;
}

/**
 * Get all free models
 */
export function getFreeModels(): OpenRouterModel[] {
  return getModelsByTier('free');
}

/**
 * Model aliases for easier access
 */
export const MODEL_ALIASES = {
  // Reasoning
  SHERLOCK_DASH: 'openrouter/sherlock-dash-alpha',
  SHERLOCK_THINK: 'openrouter/sherlock-think-alpha',
  KIMI_THINKING: 'moonshotai/kimi-k2-thinking',

  // Coding
  KAT_CODER: 'kwaipilot/kat-coder-pro:free',

  // Embedding
  GEMINI_EMBED: 'google/gemini-embedding-001',
  OPENAI_EMBED_LARGE: 'openai/text-embedding-3-large',
  OPENAI_EMBED_SMALL: 'openai/text-embedding-3-small',
  QWEN_EMBED_8B: 'qwen/qwen3-embedding-8b',

  // Search
  SONAR_SEARCH: 'perplexity/sonar-pro-search',

  // General
  VOXTRAL: 'mistralai/voxtral-small-24b-2507',
  MINIMAX: 'minimax/minimax-m2',
  LIQUID_8B: 'liquid/lfm2-8b-a1b',

  // Vision
  NEMOTRON_VL: 'nvidia/nemotron-nano-12b-v2-vl',
  NEMOTRON_VL_FREE: 'nvidia/nemotron-nano-12b-v2-vl:free',
} as const;
