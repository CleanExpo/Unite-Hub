// src/lib/ai/features/index.ts
// Barrel export for all AI feature modules.

export { calculateThinkingBudget, detectComplexity } from './thinking'
export { buildWebSearchTool, parseWebSearchResults } from './web-search'
export { extractCitations, formatCitationsForUI } from './citations'
export { zodToToolSchema, parseStructuredResponse } from './structured'
export { createBatch, checkBatchStatus, buildBatchRequest } from './batch'
export {
  uploadFile,
  uploadAndCacheFile,
  getCachedFile,
  getCachedFileId,
  listCachedFiles,
  buildFileReference,
  addToFileCache,
  getFileCache,
  clearFileCache,
} from './files'
export type { CachedFile } from './files'
export { buildMemoryToolConfig } from './memory'
export { fetchUrlContent, formatPageForPrompt } from './web-fetch'
export type { FetchedPage } from './web-fetch'
export { buildMcpServers } from './mcp'
export type { McpServerConfig } from './mcp'
export {
  storeMemory,
  recallMemories,
  recallMemoriesByType,
  deleteMemory,
  formatMemoriesForContext,
} from './memory-store'
export type { Memory, MemoryType, StoreMemoryInput } from './memory-store'
export { buildSandboxTool, parseSandboxResult } from './sandbox'
