import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a Registry
export const register = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// Custom metrics

// HTTP Request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// API-specific metrics
export const apiErrors = new Counter({
  name: 'api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['route', 'error_type'],
  registers: [register],
});

// Database metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

export const dbConnections = new Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

// Cache metrics
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_key_type'],
  registers: [register],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_key_type'],
  registers: [register],
});

// AI/LLM metrics
export const aiRequestDuration = new Histogram({
  name: 'ai_request_duration_seconds',
  help: 'Duration of AI/LLM requests in seconds',
  labelNames: ['model', 'operation'],
  buckets: [0.5, 1, 2, 5, 10, 30, 60],
  registers: [register],
});

export const aiTokensUsed = new Counter({
  name: 'ai_tokens_used_total',
  help: 'Total number of AI tokens used',
  labelNames: ['model', 'token_type'],
  registers: [register],
});

export const aiCost = new Counter({
  name: 'ai_cost_dollars_total',
  help: 'Total AI cost in dollars',
  labelNames: ['model'],
  registers: [register],
});

// Rate limiting metrics
export const rateLimitHits = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['tier', 'route'],
  registers: [register],
});

// Business metrics
export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
  registers: [register],
});

export const emailsSent = new Counter({
  name: 'emails_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['campaign_type'],
  registers: [register],
});

export const contactsCreated = new Counter({
  name: 'contacts_created_total',
  help: 'Total number of contacts created',
  registers: [register],
});

// Helper functions for common patterns

export function recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
  httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
  httpRequestTotal.inc({ method, route, status_code: statusCode });
}

export function recordApiError(route: string, errorType: string) {
  apiErrors.inc({ route, error_type: errorType });
}

export function recordDbQuery(operation: string, table: string, duration: number) {
  dbQueryDuration.observe({ operation, table }, duration);
}

export function recordCacheHit(keyType: string) {
  cacheHits.inc({ cache_key_type: keyType });
}

export function recordCacheMiss(keyType: string) {
  cacheMisses.inc({ cache_key_type: keyType });
}

export function recordAiRequest(model: string, operation: string, duration: number) {
  aiRequestDuration.observe({ model, operation }, duration);
}

export function recordAiTokens(model: string, inputTokens: number, outputTokens: number) {
  aiTokensUsed.inc({ model, token_type: 'input' }, inputTokens);
  aiTokensUsed.inc({ model, token_type: 'output' }, outputTokens);
}

export function recordAiCost(model: string, cost: number) {
  aiCost.inc({ model }, cost);
}
