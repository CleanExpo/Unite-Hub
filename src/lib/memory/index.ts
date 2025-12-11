/**
 * Living Intelligence Foundation - Memory System
 *
 * Unified memory architecture providing persistent, retrievable, rankable
 * intelligence substrate for all agents and systems.
 *
 * @module lib/memory
 */

// Store - Write layer
export { MemoryStore, createMemoryStore, memoryStore } from './memoryStore';
export type {
  MemoryType,
  RelationshipType,
  SignalType,
  StoreMemoryRequest,
  StoreMemoryResponse,
  LinkMemoryRequest,
  AddSignalRequest,
} from './memoryStore';

// Retriever - Read layer with hybrid ranking
export { MemoryRetriever, createMemoryRetriever, memoryRetriever } from './memoryRetriever';
export type {
  RetrievedMemory,
  RetrieveRequest,
  RetrieveResponse,
  FindRelatedRequest,
  RelationshipGraph,
  RelatedMemory,
} from './memoryRetriever';

// Ranker - Relevance scoring
export { MemoryRanker, createMemoryRanker, memoryRanker } from './memoryRanker';
export type { RankedMemory, RankingRequest, RankingResponse } from './memoryRanker';

// Archive Bridge - Cross-system integration
export { MemoryArchiveBridge, createMemoryArchiveBridge, memoryArchiveBridge } from './memoryArchiveBridge';
// Placeholder types for compatibility (memoryArchiveBridge does not expose these currently)
export type AgentEvent = unknown;
export type LinkEventToMemoryRequest = unknown;
export type WorkflowCheckpoint = unknown;
export type SaveCheckpointRequest = unknown;

/**
 * Complete memory system with all components
 *
 * @example
 * ```typescript
 * import { createMemorySystem } from '@/lib/memory';
 *
 * const memory = createMemorySystem();
 * const result = await memory.store({
 *   workspaceId: 'ws-123',
 *   agent: 'content-agent',
 *   memoryType: 'lesson',
 *   content: { insight: 'Users prefer concise subject lines' },
 *   importance: 85,
 *   confidence: 90
 * });
 * ```
 */
export interface MemorySystem {
  store: MemoryStore;
  retrieve: MemoryRetriever;
  rank: MemoryRanker;
  bridge: MemoryArchiveBridge;
}

/**
 * Factory to create complete memory system
 */
export function createMemorySystem(): MemorySystem {
  const store = new (require('./memoryStore')).MemoryStore();
  const retrieve = new (require('./memoryRetriever')).MemoryRetriever();
  const rank = new (require('./memoryRanker')).MemoryRanker();
  const bridge = new (require('./memoryArchiveBridge')).MemoryArchiveBridge(store, retrieve, rank);

  return {
    store,
    retrieve,
    rank,
    bridge,
  };
}
