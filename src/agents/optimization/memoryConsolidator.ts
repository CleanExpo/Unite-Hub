/**
 * Memory Consolidator
 *
 * Consolidates high-importance working memory into long-term memory.
 * Prevents memory overflow and maintains strategic context.
 */

import { queryMemory, writeMemory } from '@/lib/intelligence/agentMemoryFabric';

export interface MemoryConsolidationEvent {
  id: string;
  createdAt: string;
  sourceScope: 'working' | 'short_term';
  topic: string;
  itemsConsolidated: number;
  consolidatedPayload: any;
  summaryHint: string;
}

/**
 * Consolidate high-importance working memory into long-term storage
 */
export function consolidateWorkingToLongTerm(): MemoryConsolidationEvent | null {
  // Query high-importance working memory items
  const workingItems = queryMemory({
    scope: 'working',
    minImportance: 0.5, // Only high-importance items
    limit: 100,
  });

  if (workingItems.length === 0) {
return null;
}

  // Group by topic
  const topicMap = new Map<string, typeof workingItems>();
  for (const item of workingItems) {
    if (!topicMap.has(item.topic)) {
      topicMap.set(item.topic, []);
    }
    topicMap.get(item.topic)!.push(item);
  }

  // Find topic with most items (strongest signal)
  let topTopic: string | null = null;
  let topItems: typeof workingItems = [];
  for (const [topic, items] of topicMap.entries()) {
    if (items.length > topItems.length) {
      topTopic = topic;
      topItems = items;
    }
  }

  if (!topTopic || topItems.length === 0) {
return null;
}

  // Calculate average importance
  const avgImportance =
    topItems.reduce((sum, item) => sum + item.importance, 0) / topItems.length;

  // Create consolidated memory
  const consolidatedPayload = {
    topic: topTopic,
    itemCount: topItems.length,
    items: topItems.map(item => ({
      id: item.id,
      agent: item.agent,
      importance: item.importance,
      payload: item.payload,
    })),
    consolidationTimestamp: new Date().toISOString(),
    summaryHint: `Consolidated ${topItems.length} high-importance working items on "${topTopic}" into long-term memory.`,
  };

  // Write to long-term memory
  const longTermItem = writeMemory({
    agent: 'unified_intelligence',
    scope: 'long_term',
    topic: topTopic,
    payload: consolidatedPayload,
    importance: avgImportance,
    expiresAt: null, // Never expires
    tags: ['consolidated', 'high_importance', topTopic],
  });

  const event: MemoryConsolidationEvent = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    sourceScope: 'working',
    topic: topTopic,
    itemsConsolidated: topItems.length,
    consolidatedPayload,
    summaryHint: consolidatedPayload.summaryHint,
  };

  return event;
}

/**
 * Consolidate short-term memory when approaching expiration
 */
export function consolidateShortTermBeforeExpiry(): MemoryConsolidationEvent | null {
  const shortTermItems = queryMemory({
    scope: 'short_term',
    minImportance: 0.6,
    limit: 100,
  });

  if (shortTermItems.length === 0) {
return null;
}

  // Check if any items are close to expiration (within 30 minutes)
  const now = new Date();
  const expiringItems = shortTermItems.filter(item => {
    if (!item.expiresAt) {
return false;
}
    const expiryTime = new Date(item.expiresAt).getTime();
    const timeUntilExpiry = expiryTime - now.getTime();
    return timeUntilExpiry < 30 * 60 * 1000; // Within 30 minutes
  });

  if (expiringItems.length === 0) {
return null;
}

  // Group by topic
  const topicMap = new Map<string, typeof expiringItems>();
  for (const item of expiringItems) {
    if (!topicMap.has(item.topic)) {
      topicMap.set(item.topic, []);
    }
    topicMap.get(item.topic)!.push(item);
  }

  // Find topic with most expiring items
  let topTopic: string | null = null;
  let topItems: typeof expiringItems = [];
  for (const [topic, items] of topicMap.entries()) {
    if (items.length > topItems.length) {
      topTopic = topic;
      topItems = items;
    }
  }

  if (!topTopic || topItems.length === 0) {
return null;
}

  // Calculate average importance
  const avgImportance =
    topItems.reduce((sum, item) => sum + item.importance, 0) / topItems.length;

  // Create consolidated memory
  const consolidatedPayload = {
    topic: topTopic,
    itemCount: topItems.length,
    items: topItems.map(item => ({
      id: item.id,
      agent: item.agent,
      importance: item.importance,
      expiringAt: item.expiresAt,
      payload: item.payload,
    })),
    consolidationReason: 'Items expiring from short-term memory',
    consolidationTimestamp: new Date().toISOString(),
  };

  // Write to long-term memory
  const longTermItem = writeMemory({
    agent: 'unified_intelligence',
    scope: 'long_term',
    topic: `${topTopic}_expiry_archive`,
    payload: consolidatedPayload,
    importance: Math.max(0.5, avgImportance * 0.8), // Slightly lower importance than source
    expiresAt: null,
    tags: ['expiry_consolidated', topTopic],
  });

  const event: MemoryConsolidationEvent = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    sourceScope: 'short_term',
    topic: topTopic,
    itemsConsolidated: topItems.length,
    consolidatedPayload,
    summaryHint: `Consolidated ${topItems.length} expiring short-term items to prevent loss.`,
  };

  return event;
}

/**
 * Prune low-importance long-term memory (rare, but possible)
 */
export function pruneLowImportanceLongTerm(minImportance = 0.1): number {
  const allLongTerm = queryMemory({
    scope: 'long_term',
    limit: 10000, // Get all
  });

  // Note: This is a simulation; in reality, we'd delete from database
  // Here we just count what would be pruned
  const pruneable = allLongTerm.filter(item => item.importance < minImportance);
  return pruneable.length;
}

/**
 * Get consolidation statistics
 */
export function getConsolidationStats() {
  const workingMemory = queryMemory({ scope: 'working', limit: 10000 });
  const shortTermMemory = queryMemory({ scope: 'short_term', limit: 10000 });
  const longTermMemory = queryMemory({ scope: 'long_term', limit: 10000 });

  const workingHigh = workingMemory.filter(m => m.importance >= 0.7).length;
  const workingMedium = workingMemory.filter(m => m.importance >= 0.4 && m.importance < 0.7).length;
  const workingLow = workingMemory.filter(m => m.importance < 0.4).length;

  return {
    workingMemory: {
      total: workingMemory.length,
      high: workingHigh,
      medium: workingMedium,
      low: workingLow,
      consolidationCandidates: workingHigh,
    },
    shortTermMemory: {
      total: shortTermMemory.length,
      expiringIn30Min: shortTermMemory.filter(m => {
        if (!m.expiresAt) {
return false;
}
        const expiryTime = new Date(m.expiresAt).getTime();
        const now = new Date().getTime();
        return expiryTime - now < 30 * 60 * 1000;
      }).length,
    },
    longTermMemory: {
      total: longTermMemory.length,
      consolidated: longTermMemory.filter(m => m.tags?.includes('consolidated')).length,
    },
    recommendedAction: workingHigh > 20 ? 'Run consolidation now' : 'Monitor for consolidation need',
  };
}
