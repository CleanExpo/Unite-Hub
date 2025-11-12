// Configuration and environment validation for Claude AI integration

// Validate required environment variables
export function validateConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!process.env.ANTHROPIC_API_KEY) {
    errors.push('ANTHROPIC_API_KEY is not set in environment variables');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Get configuration with defaults
export function getConfig() {
  return {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929',
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4096', 10),
    temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.7'),
    rateLimitRequests: parseInt(process.env.CLAUDE_RATE_LIMIT_REQUESTS || '100', 10),
    rateLimitWindow: parseInt(process.env.CLAUDE_RATE_LIMIT_WINDOW || '60000', 10),
    enableStreaming: process.env.CLAUDE_ENABLE_STREAMING !== 'false',
    enableRateLimiting: process.env.CLAUDE_ENABLE_RATE_LIMITING !== 'false',
  };
}

// Configuration presets
export const PRESETS = {
  // Fast responses with lower quality
  fast: {
    temperature: 0.5,
    max_tokens: 2000,
  },
  // Balanced quality and speed
  balanced: {
    temperature: 0.7,
    max_tokens: 4096,
  },
  // High quality, slower responses
  quality: {
    temperature: 0.8,
    max_tokens: 4096,
  },
  // Creative content generation
  creative: {
    temperature: 0.9,
    max_tokens: 4096,
  },
  // Analytical and precise
  analytical: {
    temperature: 0.3,
    max_tokens: 4096,
  },
};

// Feature-specific configurations
export const FEATURE_CONFIGS = {
  autoReply: {
    temperature: 0.7,
    max_tokens: 3000,
    preset: PRESETS.balanced,
  },
  persona: {
    temperature: 0.6,
    max_tokens: 4096,
    preset: PRESETS.analytical,
  },
  strategy: {
    temperature: 0.7,
    max_tokens: 4096,
    preset: PRESETS.balanced,
  },
  campaign: {
    temperature: 0.8,
    max_tokens: 4096,
    preset: PRESETS.creative,
  },
  hooks: {
    temperature: 0.9,
    max_tokens: 4096,
    preset: PRESETS.creative,
  },
  mindmap: {
    temperature: 0.6,
    max_tokens: 4096,
    preset: PRESETS.analytical,
  },
};

// Runtime environment check
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

// API endpoint configuration
export function getAPIBaseURL(): string {
  if (isProduction()) {
    return process.env.NEXT_PUBLIC_API_URL || 'https://api.unite-hub.com';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008';
}

// Logging configuration
export function shouldLog(): boolean {
  return process.env.CLAUDE_ENABLE_LOGGING !== 'false';
}

export function getLogLevel(): 'error' | 'warn' | 'info' | 'debug' {
  const level = process.env.CLAUDE_LOG_LEVEL || 'info';
  return ['error', 'warn', 'info', 'debug'].includes(level)
    ? (level as any)
    : 'info';
}

// Error reporting configuration
export function shouldReportErrors(): boolean {
  return isProduction() && process.env.CLAUDE_REPORT_ERRORS !== 'false';
}

// Cache configuration
export function getCacheConfig() {
  return {
    enabled: process.env.CLAUDE_CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.CLAUDE_CACHE_TTL || '3600', 10), // 1 hour default
    maxSize: parseInt(process.env.CLAUDE_CACHE_MAX_SIZE || '100', 10),
  };
}
